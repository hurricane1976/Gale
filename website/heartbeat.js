/* Fleet heartbeat: one ECG trace per host, driven by /api/fleet/telemetry.
   Beat rate follows how recently the host woke (fresh = brisk, stale = slow, overdue = flatline-ish);
   color follows status. Pure SVG + CSS animation; REDUCED / data-saver get a static trace. */
import { esc, tweenText, REDUCED } from "./shared.js";

const HOSTS = ["gale", "beacon", "tidal", "mountain"];
// one QRS complex across a 200-wide cell, baseline y=20
const BEAT = "M0,20 L52,20 L58,17 L64,20 L78,20 L84,26 L92,2 L100,38 L108,20 L124,20 L134,14 L146,20 L200,20";
const WAKE_PERIOD_H = 6; // hosts wake every 6 hours

const ageH = (iso) => (Date.now() - new Date(iso).getTime()) / 3.6e6;
const fmtAge = (h) => (!isFinite(h) ? "—" : h < 1 ? `${Math.max(1, Math.round(h * 60))}m ago` : h < 48 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`);

function level(status, h) {
  if (status && status !== "ok") return "crit";
  if (!isFinite(h)) return "warn";
  if (h <= WAKE_PERIOD_H * 1.5) return "ok";
  if (h <= WAKE_PERIOD_H * 3) return "warn";
  return "crit";
}

// 24 hourly cells (oldest -> newest) from the run rows: lit when the host logged a wake that hour
function hourly(runs, host) {
  const cells = new Array(24).fill(0), now = Date.now();
  for (const r of runs) {
    if (r.host !== host) continue;
    const back = Math.floor((now - new Date(r.ts).getTime()) / 3.6e6);
    if (back >= 0 && back < 24) cells[23 - back]++;
  }
  return cells;
}

function card(host, info, last, h, cells) {
  const lv = level(info && info.status, h);
  // seconds per beat: 1.1s when fresh up to 4s when stale (never animate faster than a calm pulse)
  const dur = Math.min(4, 1.1 + Math.max(0, h) * 0.18).toFixed(2);
  return `<li class="hb-card" data-level="${lv}" style="--hb-dur:${dur}s">
    <div class="hb-top"><span class="hb-dot" aria-hidden="true"></span><strong class="hb-host">${esc(host)}</strong>
      <span class="hb-age">${esc(fmtAge(h))}</span></div>
    <svg class="hb-ecg" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
      <g class="hb-track"><path d="${BEAT}"/><path d="${BEAT}" transform="translate(200 0)"/><path d="${BEAT}" transform="translate(400 0)"/></g>
    </svg>
    <div class="hb-24h" role="img" aria-label="${esc(host)} wakes per hour, last 24 hours: ${cells.reduce((a, b) => a + b, 0)} total">${cells.map((n, i) =>
      `<i data-n="${Math.min(n, 3)}" title="${23 - i}h ago: ${n} run${n === 1 ? "" : "s"}"></i>`).join("")}</div>
    <div class="hb-meta"><span class="hb-rows" data-rows="${info ? info.rows : 0}">0</span> runs logged</div>
    <span class="sr-only">${esc(host)} ${lv === "ok" ? "healthy" : lv === "warn" ? "slow" : "overdue"}, last wake ${esc(fmtAge(h))}</span>
  </li>`;
}

export async function renderHeartbeat() {
  const mount = document.getElementById("heartbeat-grid");
  if (!mount) return;
  try {
    // tiny pre-built summary (a few KB); fall back to the full 1.8 MB payload if it is missing/stale
    let d = null;
    try {
      const s = await fetch("api/telemetry-summary.json", { cache: "no-store" });
      if (s.ok) {
        const j = await s.json();
        if (j.schema === "fleet-telemetry-summary/v1" && j.generated_at && Date.now() - new Date(j.generated_at).getTime() < 3600e3) d = j;
      }
    } catch { /* fall through */ }
    if (!d) {
      const r = await fetch("api/fleet/telemetry", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      d = await r.json();
    }
    const lastBy = (d.totals && d.totals.last_wake_by_host) || {};
    const hosts = HOSTS.filter((h) => d.hosts && d.hosts[h]);
    mount.innerHTML = hosts.map((h) => card(h, d.hosts[h], lastBy[h], ageH(lastBy[h]), hourly(d.runs || [], h))).join("");
    mount.closest("section")?.classList.add("hb-live");
    mount.querySelectorAll(".hb-rows").forEach((el) => {
      const n = Number(el.dataset.rows) || 0;
      el.textContent = String(n);
      tweenText(el, String(n), { from: REDUCED ? n : 0, duration: 1200 });
    });
  } catch {
    mount.innerHTML = `<li class="hb-card" data-level="warn"><div class="hb-top"><strong class="hb-host">heartbeat unavailable</strong></div></li>`;
  }
}

/* below the fold and ~130 KB compressed (1.8 MB parsed): fetch only when the section nears the viewport */
export function lazyHeartbeat() {
  const sec = document.getElementById("heartbeat");
  if (!sec) return;
  const go = () => { renderHeartbeat(); setInterval(renderHeartbeat, 120000); };
  if (typeof IntersectionObserver !== "function") return go();
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
  }, { rootMargin: "600px 0px" });
  io.observe(sec);
}
