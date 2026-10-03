import { boot, esc, setHTML, setText, tracedFetch } from "./shared.js";
boot();
const $ = (id) => document.getElementById(id);
let busy = false;
async function get(path) {
  const r = await tracedFetch(path, {cache:"no-store", signal:AbortSignal.timeout(25000)});
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function refresh() {
  if (busy) return;
  busy = true;
  try {
    if ($("home-ops-summary") && !$("ops-summary")) {
      const d = await get("api/fleet/metrics");
      setText($("home-ops-summary"), `${d.coverage.reachable}/${d.coverage.expected} reachable · ${d.coverage.reporting}/${d.coverage.expected} reporting${d.coverage.missing.length ? ` · missing: ${d.coverage.missing.map(a=>a.agent).join(", ")}` : ""} · collected ${d.generated_at}`);
      return;
    }
    const [data, incidents, tasks, exporters] = await Promise.all([get("api/fleet/reliability"), get("api/fleet/incidents"),get("api/fleet/tasks"),get("api/exporter-coverage.json").catch(()=>null)]);
    const c=data.coverage;
    setText($("ops-freshness"),`Collected ${data.generated_at} · refresh every 30s`);
    setHTML($("ops-summary"), [["Reachable",`${c.reachable}/${c.expected}`],["Reporting",`${c.reporting}/${c.expected}`],["Incidents",String(incidents.count)],["Task verification",`${data.outcomes.verified_runs} verified`]].map(([name,value])=>`<div class="vital"><span class="vital-label">${esc(name)}</span><span class="vital-value">${esc(value)}</span></div>`).join(""));
    setText($("ops-access"),`${incidents.access.role} access · ${incidents.access.can_write?"acknowledgements enabled":"use an authorized Tailscale user device for controls"}`);
    setHTML($("ops-incidents"),incidents.alerts.length?incidents.alerts.map(a=>{
      const ack=incidents.acknowledgements.find(x=>x.incident_id===a.id);
      return `<article class="target-card" data-level="${esc(a.sev)}"><strong>${esc(a.text)}</strong><p>Owner ${esc(a.owner)} · ${esc(a.host||"fleet")} · incident ${esc(a.id)}${ack?` · acknowledged until ${new Date(ack.until*1000).toISOString()}`:""}</p><a href="${esc(a.runbook||"runbooks.html")}">Runbook</a> · <a href="observability.html?agent=${encodeURIComponent(a.agent||"")}&failed=1">Failed runs</a>${incidents.access.can_write?` <button type="button" data-incident="${esc(a.id)}" data-ack-key="${esc((a.kind+":"+a.text).slice(0,200))}">Acknowledge 4h</button>`:""}</article>`;
    }).join(""):'<p>No active incidents.</p>');
    setHTML($("ops-missing"),c.missing.length?c.missing.map(a=>`<p><strong>${esc(a.agent)}</strong> · ${esc(a.host)} · ${esc(a.listener_state)}</p>`).join(""):'<p>All active agents report runs.</p>');
    setHTML($("ops-sources"),Object.entries(data.sources).map(([name,s])=>`<p>${esc(name)}: <strong>${esc(s.state)}</strong> · ${s.age_s??"unknown"}s since collection</p>`).join(""));
    setText($("ops-cost"),`Known spend $${data.cost.known_daily_average_usd.toFixed(2)}/day · limit $${data.cost.daily_limit_usd} · priced coverage ${data.cost.coverage_pct??"unknown"}% · ${data.cost.unknown_runs} unpriced runs. Local compute/subscriptions excluded.`);
    const b=data.backup;
    setHTML($("ops-backup"),`<p>Archive ${b.backup_age_h??"unknown"}h old · ${esc(b.backup_name||"unknown")}</p><p>Restore ${b.drill_ok==null?"unknown":b.drill_ok?"passed":"failed"} · ${b.drill_age_h??"unknown"}h old · collector ${esc(b.collector.state)}</p>`);
    setHTML($("ops-tasks"),tasks.events.length?tasks.events.slice(-15).reverse().map(e=>`<p><a href="observability.html?run=${encodeURIComponent(e.run_id)}">${esc(e.agent)} ${esc(e.event)}</a> · ${esc(e.at)}${e.tool?` · tool ${esc(e.tool)}`:""}</p>`).join(""):'<p>No instrumented task events yet.</p>');
    setHTML($("ops-exporters"),exporters?exporters.nodes.map(e=>`<p>${esc(e.host)} · ${esc(e.address)} · ${e.instrumented?"host metrics enabled":"exporter unavailable; host setup required"}</p>`).join(""):'<p>Exporter coverage unknown.</p>');
  } catch(e) {
    setText($("ops-freshness")||$("home-ops-summary"),`Monitoring unavailable: ${e.message}; previous values are stale.`);
    for(const id of ["ops-summary","ops-missing","ops-sources","ops-cost","ops-backup","ops-incidents","ops-tasks"]) if($(id)) { $(id).dataset.level="unknown"; setText($(id), "Unknown — monitoring feed unavailable."); }
  } finally {busy=false;}
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-incident]");if(!b)return;
  b.disabled=true;
  try{
    const r=await tracedFetch("api/fleet/alerts/acks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:b.dataset.ackKey,incident_id:b.dataset.incident,hours:4})});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    await refresh();
  }catch(e){setText($("ops-access"),`Acknowledgement failed: ${e.message}`);}finally{b.disabled=false;}
});
if($("ops-summary")||$("home-ops-summary")){refresh();setInterval(refresh,30000);}
