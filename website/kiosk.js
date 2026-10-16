/* GALE — kiosk/wall mode (?kiosk or the palette "Kiosk" entry). One page,
   fullscreen, auto-rotating through status → fleet → metrics →
   observability on a timer; ?kiosk=<seconds> tunes the dwell (default 20).
   Navigation uses the MPA view transitions already in place, so slides
   cross-fade/morph for free. Esc leaves. Hidden from chrome via
   fullscreen; pauses when the tab is hidden or the battery is low. */

const KIOSK_PAGES = ["status.html", "fleet.html", "metrics.html", "observability.html"];
const KIOSK_HOME_PAGES = ["energy.html", "maintenance.html"];
const DEFAULT_DWELL_S = 20;

let kiosk = null;

function isKiosk() {
  return new URLSearchParams(location.search).has("kiosk");
}

function isHomeKiosk() {
  const k = new URLSearchParams(location.search).get("kiosk");
  return k === "home" || k === "fleet-home";
}

function isFleetHomeKiosk() {
  return new URLSearchParams(location.search).get("kiosk") === "fleet-home";
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

function kioskNextHome() {
  const cur = location.pathname.split("/").pop() || "index.html";
  const idx = KIOSK_HOME_PAGES.indexOf(cur);
  const next = KIOSK_HOME_PAGES[(idx + 1) % KIOSK_HOME_PAGES.length] || KIOSK_HOME_PAGES[0];
  const dwell = kioskDwell();
  return `${next}?kiosk=home${dwell !== DEFAULT_DWELL_S ? "=" + dwell : ""}`;
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

function kioskBannerHome(secondsLeft) {
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
  el.innerHTML = `<span style="color:var(--gust)">KIOSK (HOME)</span>
    <span>${cur} · next slide in ${secondsLeft}s</span>
    <button type="button" id="kiosk-next" style="margin-left:auto" class="mini-toggle">next ›</button>
    <button type="button" id="kiosk-exit" class="mini-toggle">exit</button>`;
  el.querySelector("#kiosk-next").addEventListener("click", () => { location.href = kioskNextHome(); });
  el.querySelector("#kiosk-exit").addEventListener("click", () => {
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
    const m = await fetch("/api/fleet/metrics", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    if (m) {
      const entries = Object.entries(m.fleet_status || {});
      const up = entries.filter(([, st]) => (st.state || "").startsWith("up")).length;
      out.fleet = `${up}/${entries.length}`;
      out.spend = "$" + (m.per_agent_24h || []).reduce((s, a) => s + (a.cost_24h || 0), 0).toFixed(2);
    }
  } catch { /* keep dashes */ }
  try {
    const s = await fetch("/api/status.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    const hot = s && s.hardware ? s.hardware.hottest_c : null;
    if (hot != null) {
      out.temp = `${hot.toFixed(0)}°`;
      out.tempLvl = hot >= 90 ? "crit" : hot >= 80 ? "warn" : "ok";
    }
  } catch { /* keep dashes */ }
  try {
    const a = await fetch("/api/fleet/alerts", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    const crits = ((a && a.alerts) || []).filter((x) => x.sev === "crit" && !/roster[\s_-]*drift/i.test(String(x.text || ""))).length;
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

/* Home big-number wall board (?kiosk=home&big): health, open doors, devices, current scene. */
async function homeBigBoardData() {
  const out = { health: '–', open: '–', online: '–', offline: '–' };
  try {
    const s = await fetch("/api/status.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    if (s && s.groups) {
      const h = s.groups.health;
      if (h && h.score != null) {
        out.health = `${h.score}`;
      }
      const metrics = h && h.metrics ? h.metrics : {};
      out.open = metrics.open_doors_windows ?? '–';
      const on = metrics.online ?? 0;
      const off = metrics.unavailable ?? 0;
      out.online = String(on);
      out.offline = String(off);
    }
  } catch { /* keep dashes */ }
  try {
    const sc = await fetch("/api/fleet/home/scenes", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
    if (sc && (sc.scenes || []).length > 0) {
      // pick the first scene with a name
      const active = sc.scenes[0];
      out.scene = (active.name || active.id).slice(0, 12);
    }
  } catch { /* keep without scene */ }
  return out;
}

function initHomeBigBoard() {
  let el = document.getElementById("kiosk-big-home");
  if (!el) {
    el = document.createElement("div");
    el.id = "kiosk-big-home";
    el.setAttribute("role", "status");
    el.setAttribute("aria-label", "kiosk home wall board: health, open doors, devices, current scene");
    document.body.appendChild(el);
  }
  const paint = async () => {
    const d = await homeBigBoardData();
    const cell = (label, val, lvl) =>
      `<div class="kiosk-big-cell" data-level="${lvl || ""}"><span class="kiosk-big-label">${label}</span><span class="kiosk-big-val">${val}</span></div>`;
    const lvl = d.health !== '–' ? (parseInt(d.health, 10) >= 80 ? "ok" : parseInt(d.health, 10) >= 50 ? "warn" : "crit") : "";
    el.innerHTML =
      cell("health", d.health, lvl) + cell("open", d.open, "") +
      cell("online", d.online, "") + cell("scene", d.scene || '–', "");
  };
  paint();
  setInterval(() => { if (!document.hidden) paint(); }, 15000);
}

export function initKiosk() {
  if (!isKiosk()) return;
  if (kiosk) return;
  if (isBig()) initBigBoard();

  // Fleet-home mode: alternate between fleet and home pages
  if (isFleetHomeKiosk()) {
    return initFleetHomeKiosk();
  }

  // Home kiosk mode
  if (isHomeKiosk()) {
    if (isBig()) initHomeBigBoard();
    const dwell = kioskDwell();
    let left = dwell;
    const enterFullscreen = () => {
      const el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el)?.catch?.(() => {});
    };
    enterFullscreen();
    document.addEventListener("pointerdown", enterFullscreen, { once: true });
    let idleTimer = 0;
    const kioskWake = () => {
      delete document.documentElement.dataset.kioskDim;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { document.documentElement.dataset.kioskDim = "1"; }, 300000);
    };
    for (const ev of ["pointerdown", "pointermove", "keydown"]) document.addEventListener(ev, kioskWake, { passive: true });
    kioskWake();
    kioskBannerHome(left);
    const iv = setInterval(() => {
      if (document.hidden) return;
      if (navigator.getBattery) {
        navigator.getBattery().then((b) => {
          if (b.charging === false && b.level < 0.15) return;
        }).catch(() => {});
      }
      left -= 1;
      if (left <= 0) { clearInterval(iv); location.href = kioskNextHome(); return; }
      kioskBannerHome(left);
    }, 1000);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        clearInterval(iv);
        location.href = location.pathname.split("/").pop();
      }
    });
    return;
  }

  // Normal fleet kiosk (existing behavior)
  const dwell = kioskDwell();
  let left = dwell;

  const enterFullscreen = () => {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el)?.catch?.(() => {});
  };
  // fullscreen needs a user gesture; try immediately (a tap anywhere helps)
  enterFullscreen();
  document.addEventListener("pointerdown", enterFullscreen, { once: true });

  // idle vignette (#50): after five idle minutes the decorative layers dim
  // (gale.css keys off html[data-kiosk-dim]); any input restores instantly.
  // Telemetry panels keep full contrast, so the board stays readable.
  let idleTimer = 0;
  const kioskWake = () => {
    delete document.documentElement.dataset.kioskDim;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { document.documentElement.dataset.kioskDim = "1"; }, 300000);
  };
  for (const ev of ["pointerdown", "pointermove", "keydown"]) document.addEventListener(ev, kioskWake, { passive: true });
  kioskWake();

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

function initFleetHomeKiosk() {
  // Alternates between fleet pages and home pages
  const homePageIdx = { cur: 0 };
  let left = kioskDwell();
  const enterFullscreen = () => {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el)?.catch?.(() => {});
  };
  enterFullscreen();
  document.addEventListener("pointerdown", enterFullscreen, { once: true });
  let idleTimer = 0;
  const kioskWake = () => {
    delete document.documentElement.dataset.kioskDim;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { document.documentElement.dataset.kioskDim = "1"; }, 300000);
  };
  for (const ev of ["pointerdown", "pointermove", "keydown"]) document.addEventListener(ev, kioskWake, { passive: true });
  kioskWake();

  const fleetIdx = { cur: 0 };
  kioskBanner(left);
  const goNext = () => {
    fleetIdx.cur++;
    left = kioskDwell();
    if (fleetIdx.cur % 2 === 1) {
      const homePage = KIOSK_HOME_PAGES[homePageIdx.cur % KIOSK_HOME_PAGES.length];
      homePageIdx.cur++;
      location.href = `${homePage}?kiosk=fleet-home`;
    } else {
      location.href = kioskNext();
    }
  };
  const iv = setInterval(() => {
    if (document.hidden) return;
    if (navigator.getBattery) {
      navigator.getBattery().then((b) => {
        if (b.charging === false && b.level < 0.15) return;
      }).catch(() => {});
    }
    left -= 1;
    if (left <= 0) { clearInterval(iv); goNext(); return; }
    kioskBanner(left);
  }, 1000);

  // Patch the next button in banner to use fleet-home aware navigation
  setTimeout(() => {
    const btn = document.getElementById("kiosk-next");
    if (btn) btn.addEventListener("click", () => { clearInterval(iv); goNext(); }, { once: true });
  }, 50);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      clearInterval(iv);
      location.href = location.pathname.split("/").pop();
    }
  });
}

/* Keep the wall display awake while kiosk mode is active (Screen Wake Lock;
   released automatically on tab hide, so re-acquire on return). */
if (isKiosk() && "wakeLock" in navigator) {
  let lock = null;
  const acquire = async () => { try { lock = await navigator.wakeLock.request("screen"); } catch { /* denied / unsupported */ } };
  acquire();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") acquire(); });
}
