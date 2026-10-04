import { boot, esc, setHTML, setText, tracedFetch } from "./shared.js";
boot();
const $ = (id) => document.getElementById(id);
let busy = false;
const LIFECYCLE_STAGES = ["investigating","root-caused","remediated","verified"];
const STALE_KINDS = new Set(["agent-stale","agent-missed-wake","inference-collector-stale","inference-monitor-stale"]);
let agentFilter = ""; // "" = all
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
    const lifemap = incidents.lifecycle || {};
    const agents = Array.from(new Set(incidents.alerts.map(a=>a.agent||"fleet")));
    if ($("ops-agent-filter")) {
      const f = $("ops-agent-filter");
      f.innerHTML = `<option value="">All agents (${incidents.alerts.length})</option>` +
        agents.filter(Boolean).map(n=>{
          const n_ = incidents.alerts.filter(a=>(a.agent||"fleet")===n).length;
          return `<option value="${esc(n)}" ${agentFilter===n?"selected":""}>${esc(n)} (${n_})</option>`;
        }).join("") +
        `<option value="__stale" ${agentFilter==="__stale"?"selected":""}>Stale telemetry only</option>` +
        `<option value="__fail" ${agentFilter==="__fail"?"selected":""}>Failed signals only</option>`;
    }
    const shownAll = incidents.alerts.filter(a=>{
      if (agentFilter==="__stale") return STALE_KINDS.has(a.kind);
      if (agentFilter==="__fail") return !STALE_KINDS.has(a.kind);
      if (agentFilter) return (a.agent||"fleet")===agentFilter;
      return true;
    });
    // partition so "verified" (terminal, muted) incidents don't masquerade as active
    const shown = [], muted = [];
    for (const a of shownAll) { ((lifemap[a.id]||{}).stage==="verified" ? muted : shown).push(a); }
    const mutedEl = $("ops-muted-note");
    if (mutedEl) {
      if (muted.length) {
        mutedEl.hidden = false;
        setHTML(mutedEl, `${muted.length} verified (muted) incident${muted.length>1?"s":""} hidden from this list${agentFilter?" (matches the active filter)":""} — re-open for investigation: ` +
          muted.map(a=>`<span class="inc-muted-pill">${esc(a.agent||a.id)} <button type="button" data-stage-btn="reset" data-id="${esc(a.id)}" class="btn btn-sm inc-unmute">re-open</button></span>`).join(" "));
      } else mutedEl.hidden = true;
    }
    setHTML($("ops-incidents"),shown.length?shown.map(a=>{
      const ack=incidents.acknowledgements.find(x=>x.incident_id===a.id);
      const st=(lifemap[a.id]||{}).stage;
      const stale=STALE_KINDS.has(a.kind);
      const idx=st?LIFECYCLE_STAGES.indexOf(st):-1;
      const next=idx>=0 && idx<LIFECYCLE_STAGES.length-1?LIFECYCLE_STAGES[idx+1]:null;
      const canWrite=!!incidents.access.can_write;
      return `<article class="target-card" data-level="${esc(a.sev)}" data-id="${esc(a.id)}">
        <div class="inc-head"><strong>${esc(a.text)}</strong><span class="inc-sev sev-${esc(a.sev)}">${esc(a.sev).toUpperCase()}</span></div>
        <p class="inc-meta">Owner ${esc(a.owner)} · ${esc(a.host||"fleet")} · agent ${esc(a.agent||"fleet")} · <code title="stable id">${esc(a.id)}</code></p>
        <p class="inc-kind ${stale?"inc-kind--stale":"inc-kind--fail"}">${stale?"Telemetry gap / stale — not necessarily a failure.":"Active failure signal."}${a.note?` ${esc(a.note)}`:""}</p>
        <ol class="lc-track" data-stage="${st||""}">
          ${LIFECYCLE_STAGES.map(s=>{
            const done=idx>=0 && LIFECYCLE_STAGES.indexOf(s)<idx;
            const cur=st===s;
            return `<li class="lc-step${done?" is-done":""}${cur?" is-current":""}"><span class="lc-dot" aria-hidden="true">${done?"✓":""}</span><span class="lc-label">${s}</span></li>`;
          }).join("")}
        </ol>
        ${ack?`<p class="inc-ack">Acknowledged until ${new Date(ack.until*1000).toISOString()}</p>`:""}
        ${canWrite?`<div class="inc-acts"><button type="button" data-ack-key="${esc((a.kind+":"+a.text).slice(0,200))}" data-incident="${esc(a.id)}" class="btn btn-sm">Acknowledge 4h</button>${next?`<button type="button" data-stage-btn="${esc(next)}" data-id="${esc(a.id)}" class="btn btn-sm primary">Mark ${esc(next)}</button>`:""}${st==="verified"?'<button type="button" data-stage-btn="reset" data-id="'+esc(a.id)+'" class="btn btn-sm">Reset stage</button>':""}</div>`:""}
        <p class="inc-links"><a href="${esc(a.runbook||"runbooks.html")}">Runbook</a> · <a href="observability.html?agent=${encodeURIComponent(a.agent||"")}&failed=1">Failed runs</a> · <a href="status.html#alert-strip" data-incident="${esc(a.id)}">Alert strip</a></p>
      </article>`;
    }).join(""):'<p class="inc-none">No active incidents'+(agentFilter?" matching this filter":"")+'.<a href="#" id="inc-clear" class="inc-clear">Clear filter</a></p>');
    setHTML($("ops-missing"),c.missing.length?c.missing.map(a=>`<p><strong>${esc(a.agent)}</strong> · ${esc(a.host)} · ${esc(a.listener_state)}</p>`).join(""):'<p>All active agents report runs.</p>');
    setHTML($("ops-sources"),Object.entries(data.sources).map(([name,s])=>`<p>${esc(name)}: <strong>${esc(s.state)}</strong> · ${s.age_s??"unknown"}s since collection</p>`).join(""));
    setText($("ops-cost"),`Known spend $${data.cost.known_daily_average_usd.toFixed(2)}/day · limit $${data.cost.daily_limit_usd} · priced coverage ${data.cost.coverage_pct??"unknown"}% · ${data.cost.unknown_runs} unpriced runs. Local compute/subscriptions excluded.`);
    const b=data.backup;
    setHTML($("ops-backup"),`<p>Archive ${b.backup_age_h??"unknown"}h old · ${esc(b.backup_name||"unknown")}</p><p>Restore ${b.drill_ok==null?"unknown":b.drill_ok?"passed":"failed"} · ${b.drill_age_h??"unknown"}h old · collector ${esc(b.collector.state)}</p>`);
    setHTML($("ops-tasks"),tasks.events.length?tasks.events.slice(-15).reverse().map(e=>`<p><a href="observability.html?run=${encodeURIComponent(e.run_id)}">${esc(e.agent)} ${esc(e.event)}</a> · ${esc(e.at)}${e.tool?` · tool ${esc(e.tool)}`:""}</p>`).join(""):'<p>No instrumented task events yet.</p>');
    setHTML($("ops-exporters"),exporters?exporters.nodes.map(e=>`<p>${esc(e.host)} · ${esc(e.address)} · ${e.alias_of?`same machine as ${esc(e.alias_of)} (${esc(e.machine)}), scraped once`:e.instrumented?`host metrics enabled${e.machine?` · ${esc(e.machine)}`:""}`:"exporter unavailable; host setup required"}</p>`).join(""):'<p>Exporter coverage unknown.</p>');
  } catch(e) {
    setText($("ops-freshness")||$("home-ops-summary"),`Monitoring unavailable: ${e.message}; previous values are stale.`);
    for(const id of ["ops-summary","ops-missing","ops-sources","ops-cost","ops-backup","ops-incidents","ops-tasks"]) if($(id)) { $(id).dataset.level="unknown"; setText($(id), "Unknown — monitoring feed unavailable."); }
  } finally {busy=false;}
}
document.addEventListener("click",async e=>{
  if (e.target.closest("#inc-clear")) { e.preventDefault(); agentFilter=""; await refresh(); return; }
  const adv=e.target.closest("[data-stage-btn]");
  if (adv) {
    adv.disabled=true;
    try{
      const stage=adv.dataset.stageBtn==="reset"?"reset":adv.dataset.stageBtn;
      const body=stage==="reset"?{incident_id:adv.dataset.id}:{incident_id:adv.dataset.id, stage};
      const r=await tracedFetch("api/fleet/alerts/lifecycle",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||`HTTP ${r.status}`);}
      await refresh();
    }catch(err){setText($("ops-access"),`Stage update failed: ${err.message}`);}finally{adv.disabled=false;}
    return;
  }
  const b=e.target.closest("[data-ack-key]");if(!b)return;
  b.disabled=true;
  try{
    const r=await tracedFetch("api/fleet/alerts/acks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:b.dataset.ackKey,incident_id:b.dataset.incident,hours:4})});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    await refresh();
  }catch(e){setText($("ops-access"),`Acknowledgement failed: ${e.message}`);}finally{b.disabled=false;}
});
if ($("ops-agent-filter")) $("ops-agent-filter").addEventListener("change", (e) => { agentFilter = e.target.value; refresh(); });
if ($("ops-summary") || $("home-ops-summary")) { refresh(); setInterval(refresh, 30000); }
