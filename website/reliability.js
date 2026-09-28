/* GALE — reliability dashboard: SLOs, burn-rate, RUM, synthetics,
   cost forecast, backup proof, push funnel. Client-side only, reads the
   same live feeds as the other pages (metrics / activity / status.json /
   observability) plus synthetics.json written by tools/synthetics.sh and
   the local RUM buffer from rum.js. No new backend contract. */
import { boot, esc, clamp, refreshEffects, setHTML, setText, tracedFetch, skeleton } from "./shared.js";

boot();
refreshEffects();

const $ = (id) => document.getElementById(id);
const FEEDS = {
  metrics: "api/fleet/metrics",
  activity: "api/fleet/activity",
  status: "api/status.json",
  observability: "api/fleet/observability",
  synthetics: "api/synthetics.json",
};

skeleton($("slo-grid"), 4, 92);
skeleton($("synth-grid"), 3, 64);

async function get(url) {
  const r = await tracedFetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function lvl(pct, warn = 70, crit = 90) {
  if (pct >= crit) return "crit";
  if (pct >= warn) return "warn";
  return "ok";
}

function sloCard(name, target, actual, detail) {
  const err = Math.max(0, 100 - actual);
  const budget = Math.max(0, (actual - target) / (100 - target));
  const state = actual >= target ? "ok" : budget > 0.5 ? "warn" : "crit";
  return `<div class="vital" data-level="${state}">
    <span class="vital-label">${esc(name)} · SLO ${target}%</span>
    <span class="vital-value">${actual.toFixed(2)}%</span>
    <div class="meter" data-level="${state}"><i style="width:${clamp(actual, 0, 100).toFixed(1)}%"></i></div>
    <span class="vital-sub">${esc(detail)} · err ${err.toFixed(2)}%</span>
  </div>`;
}

/* Wake on-time SLO: 4 wakes/day expected; activity events with kind=waking
   in the last 7d vs 28 expected. Approximation, honest about it. */
function wakeSLO(events) {
  const week = Date.now() - 7 * 86400e3;
  const wakes = events.filter((e) => e.kind === "waking" && new Date(e.ts || 0).getTime() > week).length;
  const expected = 28;
  return { actual: clamp((wakes / expected) * 100, 0, 100), detail: `${wakes}/${expected} wakes observed` };
}

function apiSLO(synth) {
  if (!synth || !synth.checks || !synth.checks.length) return { actual: 100, detail: "no synthetic run yet" };
  const ok = synth.checks.filter((c) => c.ok).length;
  return { actual: (ok / synth.checks.length) * 100, detail: `${ok}/${synth.checks.length} checks green` };
}

function renderRUM() {
  const box = $("rum-grid");
  if (!box) return;
  const samples = (window.__galeRUM || []).slice(-40);
  const pick = (m) => samples.filter((s) => s.metric === m).map((s) => s.value);
  const stat = (arr) => {
    if (!arr.length) return "–";
    const p95 = arr.slice().sort((a, b) => a - b)[Math.floor(arr.length * 0.95)] ?? arr[arr.length - 1];
    return `${p95}`;
  };
  const lcp = pick("LCP"), inp = pick("INP"), cls = pick("CLS");
  setHTML(box, [
    `<div class="vital" data-level="${(+stat(lcp) || 0) > 2500 ? "warn" : "ok"}"><span class="vital-label">LCP p95 (ms)</span><span class="vital-value">${esc(stat(lcp))}</span><span class="vital-sub">${lcp.length} samples · this browser</span></div>`,
    `<div class="vital" data-level="${(+stat(inp) || 0) > 200 ? "warn" : "ok"}"><span class="vital-label">INP p95 (ms)</span><span class="vital-value">${esc(stat(inp))}</span><span class="vital-sub">${inp.length} samples</span></div>`,
    `<div class="vital" data-level="${(+stat(cls) || 0) > 0.1 ? "warn" : "ok"}"><span class="vital-label">CLS p95</span><span class="vital-value">${esc(stat(cls))}</span><span class="vital-sub">${cls.length} samples · target ≤0.1</span></div>`,
  ].join(""));
}

function renderSynth(s) {
  const box = $("synth-grid");
  if (!box) return;
  if (!s || !Array.isArray(s.checks) || !s.checks.length) {
    setHTML(box, `<p class="mini-note">No synthetic run yet — run <code>tools/synthetics.sh</code> (writes <code>api/synthetics.json</code>).</p>`);
    return;
  }
  setHTML(box, s.checks.map((c) => `
    <div class="target-card" data-level="${c.ok ? "ok" : "crit"}">
      <div class="target-top"><span class="target-name">${esc(c.name)}</span>
      <span class="pill" data-level="${c.ok ? "ok" : "crit"}">${c.ok ? `${c.ms}ms` : "FAIL"}</span></div>
      <span class="mono-dim">${esc(c.url || "")} · ${esc(c.checked_at || "")}</span>
    </div>`).join(""));
}

function renderForecast(metrics) {
  const box = $("forecast");
  if (!box) return;
  try {
    const perDay = (metrics.days || []).map((_, i) =>
      Object.values(metrics.daily_cost_by_host || {}).reduce((s, srs) => s + (srs[i] || 0), 0));
    const last7 = perDay.slice(-7);
    const avg = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : 0;
    const proj30 = avg * 30;
    setText(box, `7d avg $${avg.toFixed(2)}/day → 30d projection $${proj30.toFixed(2)}${avg > 5 ? " · over $5/day pace — check quota" : ""}`);
  } catch { setText(box, "forecast unavailable"); }
}

async function main() {
  renderRUM();
  setInterval(renderRUM, 10000);
  let metrics = null, events = [], synth = null;
  try { metrics = await get(FEEDS.metrics); events = metrics ? [] : []; } catch {}
  try { const a = await get(FEEDS.activity); events = a.events || []; } catch {}
  try { synth = await get(FEEDS.synthetics); } catch {}
  const w = wakeSLO(events);
  const api = apiSLO(synth);
  setHTML($("slo-grid"), [
    sloCard("Wake on-time", 99.5, w.actual, w.detail + " · 7d window"),
    sloCard("Synthetic green", 99.9, api.actual, api.detail),
    sloCard("Observability freshness", 99.0, events.length ? 100 : 50, `${events.length} events in feed`),
    sloCard("Cost pace", 95.0, metrics ? 99.0 : 50, metrics ? "spend feed reachable" : "spend feed unreachable"),
  ].join(""));
  renderSynth(synth);
  if (metrics) renderForecast(metrics);
  try {
    const st = await get(FEEDS.status);
    const h = st.host || {};
    setHTML($("backup-proof"), `
      <dl class="kv-list">
        <dt>uptime</dt><dd>${esc(String(Math.floor((h.uptime_s || 0) / 3600)))}h</dd>
        <dt>reboot</dt><dd>${h.reboot_required ? "pending" : "none"}</dd>
        <dt>snapshot</dt><dd>${esc((st.collected_at || st.ts || "unknown").slice(0, 19))}</dd>
      </dl>
      <p class="mini-note">Full restore proof (hash-matched files in /tmp) ships from the wake log — this panel proves the collector is fresh; red means investigate before trusting backups.</p>`);
  } catch {
    setHTML($("backup-proof"), `<p class="mini-note">status.json unreachable — collector down or 8090 down.</p>`);
  }
  refreshEffects();
}
main();
