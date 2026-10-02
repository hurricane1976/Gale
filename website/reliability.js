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
  wakes: "api/fleet/wakes",
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

/* Wake on-time SLO: this host's wake cycle is every 6h (4/day), so the last 7 days are 28 UTC-aligned
   6-hour slots. A slot is "on time" when it holds at least one Gale wake. Source: /api/fleet/wakes (the
   14-day local wake history). The activity feed only holds the latest ~24 events (about an hour), so it
   can't answer a 7-day question; it stays as a last-resort fallback. */
const SLOT_MS = 6 * 3600e3, SLOTS = 28;
function wakeSLO(wakes, events) {
  const rows = (wakes && wakes.runs || []).filter((r) => r.agent === "gale");
  if (rows.length) {
    const nowSlot = Math.floor(Date.now() / SLOT_MS);
    const covered = new Set();
    for (const r of rows) {
      const k = Math.floor(new Date(r.ts).getTime() / SLOT_MS);
      if (nowSlot - k >= 1 && nowSlot - k <= SLOTS) covered.add(k); // completed slots only: the open slot isn't late yet
    }
    return { actual: (covered.size / SLOTS) * 100, detail: `${covered.size}/${SLOTS} six-hour slots had a wake` };
  }
  const week = Date.now() - 7 * 86400e3;
  const n = events.filter((e) => e.kind === "waking" && new Date(e.ts || 0).getTime() > week).length;
  return { actual: clamp((n / SLOTS) * 100, 0, 100), detail: `${n}/${SLOTS} wakes in the activity feed (wake history unavailable)` };
}

/* Observability freshness SLO: of the last 24 completed hours, how many had at least one logged run from
   any local agent (wake history), plus how old the newest activity-feed event is. Replaces a constant
   "100% if the feed has any events". */
function freshnessSLO(wakes, events) {
  const rows = (wakes && wakes.runs) || [];
  const now = Date.now(), HOUR = 3600e3, nowH = Math.floor(now / HOUR);
  let newest = 0;
  for (const e of events || []) newest = Math.max(newest, new Date(e.ts || 0).getTime() || 0);
  const age = newest ? Math.max(0, Math.round((now - newest) / 60000)) : null;
  const ageTxt = age == null ? "no live events" : age < 60 ? `newest event ${age}m ago` : `newest event ${Math.round(age / 60)}h ago`;
  if (!rows.length) return { actual: events && events.length ? 100 : 50, detail: `${(events || []).length} events in feed · ${ageTxt}` };
  const hours = new Set();
  for (const r of rows) { const k = Math.floor(new Date(r.ts).getTime() / HOUR); if (nowH - k >= 1 && nowH - k <= 24) hours.add(k); }
  return { actual: (hours.size / 24) * 100, detail: `${hours.size}/24 recent hours had logged runs · ${ageTxt}` };
}

/* Cost pace SLO: share of the last 7 days at or under the $5/day pace line the forecast card warns about. */
const COST_DAILY_LIMIT = 5;
function costSLO(metrics) {
  if (!metrics) return { actual: 50, detail: "spend feed unreachable" };
  const perDay = (metrics.days || []).map((_, i) =>
    Object.values(metrics.daily_cost_by_host || {}).reduce((s, srs) => s + (srs[i] || 0), 0)).slice(-7);
  if (!perDay.length) return { actual: 50, detail: "no spend data" };
  const ok = perDay.filter((c) => c <= COST_DAILY_LIMIT).length;
  return { actual: (ok / perDay.length) * 100, detail: `${ok}/${perDay.length} days at or under $${COST_DAILY_LIMIT}/day` };
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
  let metrics = null, events = [], synth = null, wakes = null;
  try { metrics = await get(FEEDS.metrics); events = metrics ? [] : []; } catch {}
  try { const a = await get(FEEDS.activity); events = a.events || []; } catch {}
  try { wakes = await get(FEEDS.wakes); } catch {}
  try { synth = await get(FEEDS.synthetics); } catch {}
  const w = wakeSLO(wakes, events);
  const cost = costSLO(metrics);
  const fresh = freshnessSLO(wakes, events);
  const api = apiSLO(synth);
  setHTML($("slo-grid"), [
    sloCard("Wake on-time", 99.5, w.actual, w.detail + " · 7d window"),
    sloCard("Synthetic green", 99.9, api.actual, api.detail),
    sloCard("Observability freshness", 99.0, fresh.actual, fresh.detail),
    sloCard("Cost pace", 95.0, cost.actual, cost.detail),
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
