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

export function initKiosk() {
  if (!isKiosk()) return;
  if (kiosk) return;
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
