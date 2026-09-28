/* GALE — kiosk/wall mode (?kiosk or the palette "Kiosk" entry). One page,
   fullscreen, auto-rotating through status → fleet → metrics →
   observability on a timer; ?kiosk=<seconds> tunes the dwell (default 20).
   Navigation uses the MPA view transitions already in place, so slides
   cross-fade/morph for free. Esc leaves. Hidden from chrome via
   fullscreen; pauses when the tab is hidden or the battery is low. */

const KIOSK_PAGES = ["status.html", "fleet.html", "metrics.html", "observability.html"];
const DEFAULT_DWELL_S = 20;

let kiosk = null;

function isKiosk() {
  return new URLSearchParams(location.search).has("kiosk");
}

function kioskDwell() {
  const raw = parseInt(new URLSearchParams(location.search).get("kiosk"), 10);
  return Number.isFinite(raw) && raw >= 5 ? Math.min(raw, 600) : DEFAULT_DWELL_S;
}

function kioskNext() {
  const cur = location.pathname.split("/").pop() || "index.html";
  const idx = KIOSK_PAGES.indexOf(cur);
  const next = KIOSK_PAGES[(idx + 1) % KIOSK_PAGES.length] || KIOSK_PAGES[0];
  const dwell = kioskDwell();
  return `${next}?kiosk=${dwell}`;
}

function kioskBanner(secondsLeft) {
  let el = document.getElementById("kiosk-bar");
  if (!el) {
    el = document.createElement("div");
    el.id = "kiosk-bar";
    el.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:70;display:flex;gap:12px;align-items:center;" +
      "padding:6px 14px;font-family:var(--font-mono,monospace);font-size:0.74rem;color:var(--text-faint);" +
      "background:color-mix(in srgb, var(--bg-deep,#0d1322) 88%, transparent);border-top:1px solid var(--line,rgba(160,185,230,.1))";
    document.body.appendChild(el);
  }
  const cur = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
  el.innerHTML = `<span style="color:var(--gust)">KIOSK</span>
    <span>${cur} · next slide in ${secondsLeft}s</span>
    <button type="button" id="kiosk-next" style="margin-left:auto" class="mini-toggle">next ›</button>
    <button type="button" id="kiosk-exit" class="mini-toggle">exit</button>`;
  el.querySelector("#kiosk-next").addEventListener("click", () => { location.href = kioskNext(); });
  el.querySelector("#kiosk-exit").addEventListener("click", () => {
    // strip the param so the loop doesn't resume on the next page
    location.href = (location.pathname.split("/").pop() || "index.html");
  });
}

function isBig() {
  return new URLSearchParams(location.search).has("big");
}

/* Big-number wall board (?kiosk&big): a full-viewport 2x2 overlay of the
   four glanceable vitals, fed from the same feeds the dense pages use
   (fleet_status, status.json hardware, per-agent cost_24h, /alerts crits).
   Rotation, Esc and the banner keep working underneath; the overlay
   re-inits on every stop since kiosk navigates page-to-page. */
async function bigBoardData() {
  const out = { fleet: "–", temp: "–", tempLvl: "", spend: "–", crit: "0", critLvl: "ok" };
  try {
    const m = await fetch("api/fleet/metrics", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    if (m) {
      const entries = Object.entries(m.fleet_status || {});
      const up = entries.filter(([, st]) => (st.state || "").startsWith("up")).length;
      out.fleet = `${up}/${entries.length}`;
      out.spend = "$" + (m.per_agent_24h || []).reduce((s, a) => s + (a.cost_24h || 0), 0).toFixed(2);
    }
  } catch { /* keep dashes */ }
  try {
    const s = await fetch("api/status.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    const hot = s && s.hardware ? s.hardware.hottest_c : null;
    if (hot != null) {
      out.temp = `${hot.toFixed(0)}°`;
      out.tempLvl = hot >= 90 ? "crit" : hot >= 80 ? "warn" : "ok";
    }
  } catch { /* keep dashes */ }
  try {
    const a = await fetch("api/fleet/alerts", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    const crits = ((a && a.alerts) || []).filter((x) => x.sev === "crit").length;
    out.crit = String(crits);
    out.critLvl = crits ? "crit" : "ok";
  } catch { /* keep zero */ }
  return out;
}

function initBigBoard() {
  let el = document.getElementById("kiosk-big");
  if (!el) {
    el = document.createElement("div");
    el.id = "kiosk-big";
    el.setAttribute("role", "status");
    el.setAttribute("aria-label", "kiosk wall board: fleet, temperature, spend, critical alerts");
    document.body.appendChild(el);
  }
  const paint = async () => {
    const d = await bigBoardData();
    const cell = (label, val, lvl) =>
      `<div class="kiosk-big-cell" data-level="${lvl || ""}"><span class="kiosk-big-label">${label}</span><span class="kiosk-big-val">${val}</span></div>`;
    el.innerHTML =
      cell("fleet up", d.fleet, "") + cell("hottest", d.temp, d.tempLvl) +
      cell("24h spend", d.spend, "") + cell("crit alerts", d.crit, d.critLvl);
  };
  paint();
  setInterval(() => { if (!document.hidden) paint(); }, 15000);
}

export function initKiosk() {
  if (!isKiosk()) return;
  if (kiosk) return;
  if (isBig()) initBigBoard();
  const dwell = kioskDwell();
  let left = dwell;

  const enterFullscreen = () => {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el)?.catch?.(() => {});
  };
  // fullscreen needs a user gesture; try immediately (a tap anywhere helps)
  enterFullscreen();
  document.addEventListener("pointerdown", enterFullscreen, { once: true });

  kioskBanner(left);
  const iv = setInterval(() => {
    if (document.hidden) return;                 // don't advance in background tabs
    if (navigator.getBattery) {
      navigator.getBattery().then((b) => {
        if (b.charging === false && b.level < 0.15) return; // don't kill the host device
      }).catch(() => {});
    }
    left -= 1;
    if (left <= 0) { clearInterval(iv); location.href = kioskNext(); return; }
    kioskBanner(left);
  }, 1000);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearInterval(iv);
      location.href = location.pathname.split("/").pop();
    }
  });
}
