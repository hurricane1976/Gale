/* GALE — cinematic layer (Apple + ILM, additive).
   Multi-layer scroll parallax, scroll-scrubbed hero, chapter dots,
   card spotlight, pulse marquee, ILM wipe. All transform/opacity-only,
   rAF-throttled, visibility-paused. Node-safe: no top-level DOM access. */
import { REDUCED, raf, clamp } from "./shared.js";

const FINE = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(pointer: fine)").matches : false;

function isSaver() {
  try {
    if (document.documentElement.dataset.saver === "1") return true;
    if (typeof localStorage !== "undefined" && localStorage.getItem("gale-datasaver") === "1") return true;
  } catch { /* ignore */ }
  return false;
}

function initParallax() {
  const els = [...document.querySelectorAll("[data-parallax]")];
  if (!els.length || REDUCED || isSaver()) return;
  let pending = false;
  const vh = () => window.innerHeight || 800;
  const update = () => {
    pending = false;
    const mid = window.scrollY + vh() / 2;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh() + 200) continue;
      const speed = parseFloat(el.dataset.parallax) || 0.08;
      const center = r.top + window.scrollY + r.height / 2;
      const off = (mid - center) * speed;
      el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    }
  };
  window.addEventListener("scroll", () => {
    if (!pending) { pending = true; raf(update); }
  }, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function initHeroScrub() {
  const hero = document.getElementById("hero");
  if (!hero || REDUCED || isSaver()) return;
  let pending = false;
  const update = () => {
    pending = false;
    const h = hero.offsetHeight || 600;
    const p = clamp(window.scrollY / Math.max(1, h * 0.9), 0, 1);
    try { hero.style && hero.style.setProperty && hero.style.setProperty("--hero-p", p.toFixed(3)); } catch {}
    // scroll velocity -> ember intensity (decays each frame anyway)
    const v = clamp(Math.abs(window.scrollY - (update._y || 0)) / 120, 0, 1);
    update._y = window.scrollY;
    try { document.documentElement.style && document.documentElement.style.setProperty && document.documentElement.style.setProperty("--cine-v", v.toFixed(2)); } catch {}
  };
  window.addEventListener("scroll", () => {
    if (!pending) { pending = true; raf(update); }
  }, { passive: true });
  update();
}

function initChapters() {
  const nav = document.getElementById("chapters");
  if (!nav || !("IntersectionObserver" in window)) return;
  const secs = [...document.querySelectorAll("main .block[id]")].slice(0, 10);
  nav.innerHTML = secs.map((s) =>
    `<a href="#${s.id}" aria-label="${s.id}" data-sec="${s.id}"></a>`).join("");
  const links = [...nav.querySelectorAll("a")];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.setAttribute("aria-current",
        String(a.dataset.sec === e.target.id)));
    }
  }, { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach((s) => io.observe(s));
}

function initSpotlight() {
  if (!FINE || REDUCED) return;
  const cards = document.querySelectorAll(".stat-card, .rule-card, .proj-card, .dash-card, .host-card, .vital, .target-card, .fleet-24h-card, .ops-panel");
  cards.forEach((card) => {
    if (card.dataset.cinebound) return;
    card.dataset.cinebound = "1";
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
      card.style.setProperty("--spot-y", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
    }, { passive: true });
  });
}

function initMarquee() {
  const track = document.querySelector(".marquee-track");
  if (!track || track.dataset.dup) return;
  track.dataset.dup = "1";
  track.innerHTML += track.innerHTML; // seamless -50% loop
}

function initWipe() {
  document.querySelectorAll(".wipe").forEach((w) => {
    if (w.dataset.wipebound) return;
    w.dataset.wipebound = "1";
    const range = w.querySelector(".wipe-range");
    if (!range) return;
    const set = () => w.style.setProperty("--wipe", `${clamp(+range.value, 0, 100)}%`);
    range.addEventListener("input", set);
    set();
  });
}

function initCineLines() {
  const title = document.querySelector("#hero .hero-title");
  if (!title || title.dataset.cine) return;
  title.dataset.cine = "1";
  // wrap bare text node in mask-reveal lines (progressive: no-JS unaffected)
  const text = title.textContent.trim();
  if (text && !title.querySelector("span")) {
    title.innerHTML = `<span class="cine-line"><span style="--li:0">${text}</span></span>`;
  } else {
    title.querySelectorAll(":scope > span:not(.cine-line)").forEach((s, i) => {
      s.classList.add("cine-line");
      s.innerHTML = `<span style="--li:${i}">${s.innerHTML}</span>`;
    });
  }
}

function initBackTop() {
  if (REDUCED) return;
  let btn = document.getElementById("to-top");
  if (!btn) {
    // auto-provide site-wide so every page gets it without markup edits
    btn = document.createElement("button");
    btn.id = "to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true"><circle class="tt-bg" cx="18" cy="18" r="15.5" /><circle class="tt-fg" cx="18" cy="18" r="15.5" pathLength="100" /></svg>`;
    (document.body || document.documentElement).appendChild(btn);
  }
  let pending = false;
  const update = () => {
    pending = false;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = clamp(h > 0 ? window.scrollY / h : 0, 0, 1);
    btn.classList.toggle("show", window.scrollY > window.innerHeight * 0.6);
    try { btn.style.setProperty("--tt-off", (100 - p * 100).toFixed(1)); } catch {}
  };
  window.addEventListener("scroll", () => {
    if (!pending) { pending = true; raf(update); }
  }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  update();
}

function initFilmstrip() {
  const track = document.querySelector(".filmstrip-track");
  if (!track || track.dataset.dup) return;
  track.dataset.dup = "1";
  track.innerHTML += track.innerHTML;
}

function initGallery() {
  const grid = document.querySelector("#fleet .host-grid");
  if (!grid || grid.dataset.gallery || REDUCED) return;
  grid.dataset.gallery = "1";
  let down = false, sx = 0, sl = 0;
  grid.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    down = true; sx = e.clientX; sl = grid.scrollLeft;
    grid.classList.add("dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    grid.scrollLeft = sl - (e.clientX - sx);
  }, { passive: true });
  window.addEventListener("pointerup", () => {
    down = false; grid.classList.remove("dragging");
  }, { passive: true });
}

/* dead-link repair: metrics cards link fleet.html#agent-X but no such IDs
   exist — resolve the hash against .topo-node[data-name] (case-insensitive),
   scroll + flash. Also serves palette's cross-page agent jumps. */
function initAgentAnchors() {
  const go = () => {
    const m = (location.hash || "").match(/^#agent-(.+)$/i);
    if (!m) return;
    const want = decodeURIComponent(m[1]).toLowerCase();
    const node = [...document.querySelectorAll(".topo-node[data-name], agent-card[name]")]
      .find((g) => ((g.getAttribute("data-name") || g.getAttribute("name") || "").toLowerCase() === want));
    if (!node) return;
    try { node.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" }); } catch {}
    node.classList.add("palette-flash");
    setTimeout(() => node.classList.remove("palette-flash"), 1600);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go, { once: true });
  else go();
  window.addEventListener("hashchange", go);
}

function initCinemaMode() {
  if (REDUCED) return;
  for (const pos of ["top", "bottom"]) {
    if (!document.querySelector(`.cine-bar.${pos}`)) {
      const bar = document.createElement("div");
      bar.className = `cine-bar ${pos}`;
      bar.setAttribute("aria-hidden", "true");
      (document.body || document.documentElement).appendChild(bar);
    }
  }
  if (initCinemaMode.bound) return;
  initCinemaMode.bound = true;
  document.addEventListener("keydown", (e) => {
    if ((e.key === "c" || e.key === "C") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      document.documentElement.classList.toggle("cine-letterbox");
    }
  });
}
function initDraw() {
  document.querySelectorAll("h2.sec-title").forEach((h) => {
    if (h.dataset.draw || h.querySelector(".u-draw")) { h.dataset.draw = "1"; return; }
    h.dataset.draw = "1";
    const text = h.textContent.trim();
    if (text) h.innerHTML = `<span class="u-draw">${text}</span>`;
  });
}

function initRipple() {
  if (!FINE || REDUCED) return;
  document.querySelectorAll(".btn, .dash-card").forEach((el) => {
    if (el.dataset.ripple) return;
    el.dataset.ripple = "1";
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.style.overflow = "hidden";
    el.addEventListener("click", (e) => {
      const r = el.getBoundingClientRect();
      const d = document.createElement("span");
      d.className = "cine-ripple";
      const size = Math.max(r.width, r.height) * 1.1;
      d.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
      el.appendChild(d);
      setTimeout(() => d.remove(), 600);
    }, { passive: true });
  });
}

export function initCinematic() {
  try {
    if (typeof document === "undefined" || !document.body) return;
    document.documentElement.classList.add("cine-smooth");
    initCineLines();
    initParallax();
    initHeroScrub();
    initChapters();
    initSpotlight();
    initMarquee();
    initWipe();
    initBackTop();
    initFilmstrip();
    initGallery();
    initAgentAnchors();
    initDraw();
    initCinemaMode();
    initRipple();
  } catch (e) {
    console.warn("cinematic layer skipped", e);
  }
}
