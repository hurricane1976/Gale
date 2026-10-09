import { boot, esc, setHTML, setText, setVitals, tracedFetch } from "./shared.js";
boot();
const $ = (id) => document.getElementById(id);
let busy = false;
let opsNextRefreshAt = 0, opsGeneratedAt = "", opsProblem = "";
let severityFilter = "";
const LIFECYCLE_STAGES = ["investigating","root-caused","remediated","verified"];
const STALE_KINDS = new Set(["agent-stale","agent-missed-wake","inference-collector-stale","inference-monitor-stale"]);
let agentFilter = ""; // "" = all
function paintOpsFreshness() {
  if (!opsGeneratedAt || !$("ops-freshness")) return;
  const remaining = Math.max(0, Math.ceil((opsNextRefreshAt - Date.now()) / 1000));
  setText($("ops-freshness"), opsProblem
    ? `Monitoring unavailable: ${opsProblem}; last collected ${opsGeneratedAt} · retry in ${remaining}s.`
    : `Collected ${opsGeneratedAt} · next refresh in ${remaining}s`);
}
function renderSeverityHistogram(alerts = []) {
  const groups = [["", "All"], ["crit", "Critical"], ["warn", "Warning"], ["info", "Info"], ["unknown", "Unknown"]];
  const counts = new Map(groups.map(([key]) => [key, key ? 0 : alerts.length]));
  for (const alert of alerts) { const key = groups.some(([k]) => k === alert.sev) ? alert.sev : "unknown"; counts.set(key, (counts.get(key) || 0) + 1); }
  const max = Math.max(1, ...counts.values());
  setHTML($("ops-severity-hist"), groups.map(([key, label]) => {
    const count = counts.get(key) || 0;
    return `<button type="button" class="ops-severity-filter" data-severity="${key}" aria-pressed="${String(severityFilter === key)}"><span>${label}</span><span class="ops-severity-track" aria-hidden="true"><i style="width:${Math.round(count / max * 100)}%"></i></span><strong>${count}</strong></button>`;
  }).join(""));
}
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
    const [data, incidents, tasks, exporters, history] = await Promise.all([get("api/fleet/reliability"), get("api/fleet/incidents"),get("api/fleet/tasks"),get("api/exporter-coverage.json").catch(()=>null),get("api/fleet/alerts/history").catch(()=>null)]);
    const c=data.coverage;
    opsGeneratedAt = data.generated_at;
    opsNextRefreshAt = Date.now() + 30000;
    opsProblem = "";
    paintOpsFreshness();
    setVitals($("ops-summary"), [["Reachable",`${c.reachable}/${c.expected}`],["Reporting",`${c.reporting}/${c.expected}`],["Incidents",String(incidents.count)],["Task verification",`${data.outcomes.verified_runs} verified`]].map(([name,value])=>`<div class="vital"><span class="vital-label">${esc(name)}</span><span class="vital-value">${esc(value)}</span></div>`).join(""));
    const timeline = history?.events || [];
    const duration = (ms) => { const mins = Math.max(0, Math.floor(ms / 60000)); return mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${Math.floor(mins / 1440)}d ${Math.floor(mins % 1440 / 60)}h`; };
    setHTML($("ops-incident-timeline"), timeline.length ? timeline.map((event) => {
      const start = Date.parse(event.since || event.ts), end = Date.parse(event.ts);
      const span = event.event === "close" && Number.isFinite(start) && Number.isFinite(end) ? ` · open ${duration(end - start)}` : "";
      const when = Number.isFinite(end) ? new Date(end).toLocaleString() : "time unknown";
      const sev = event.sev || "unknown";
      return `<div class="target-card" data-level="${esc(sev)}"><div class="target-top"><span class="target-name">${esc(event.event || "change")} · ${esc(event.kind || "alert")}</span><span class="pill" data-level="${esc(sev)}">${esc(sev)}</span></div><span class="mono-dim">${esc(when)}${span} · ${esc(event.text || "alert text unavailable")}</span></div>`;
    }).join("") : '<p class="mini-note">No alert changes in the retained history, or the history feed is unavailable.</p>');
    setText($("ops-access"),`${incidents.access.role} access · ${incidents.access.can_write?"acknowledgements enabled":"use an authorized Tailscale user device for controls"}`);
    renderSeverityHistogram(incidents.alerts);
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
      if (severityFilter && (a.sev || "unknown") !== severityFilter) return false;
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
    opsProblem = e.message;
    if (opsGeneratedAt) paintOpsFreshness();
    else setText($("ops-freshness")||$("home-ops-summary"),`Monitoring unavailable: ${e.message}; previous values are stale.`);
    for(const id of ["ops-summary","ops-missing","ops-sources","ops-cost","ops-backup","ops-incidents","ops-tasks"]) if($(id)) { $(id).dataset.level="unknown"; setText($(id), "Unknown — monitoring feed unavailable."); }
  } finally {busy=false;}
}
document.addEventListener("click",async e=>{
  if (e.target.closest("#inc-clear")) { e.preventDefault(); agentFilter=""; severityFilter=""; await refresh(); return; }
  const sev = e.target.closest("[data-severity]");
  if (sev) { severityFilter = sev.dataset.severity; await refresh(); return; }
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
if ($("ops-summary") || $("home-ops-summary")) { refresh(); setInterval(refresh, 30000); setInterval(paintOpsFreshness, 1000); }
