/* GALE — dashboard page: wake-cycle scroll scrub, mesh graph enhancement. */
import { boot, clamp, esc, raf, REDUCED } from "./shared.js";

boot();

/* ---- wake cycle: turn the static <ol> into a scroll-scrubbed sticky
   stage. Content stays in the HTML (single source of truth) — JS reads
   it out, builds the stage, and hides the list only when live. ---- */
function buildWakeScrub() {
  const ol = document.getElementById("wake-steps");
  const mount = document.getElementById("wake-scrub");
  const section = document.getElementById("wake-cycle");
  if (!ol || !mount || !section || REDUCED) return;

  const items = [...ol.querySelectorAll("li")].map((li) => {
    const strong = li.querySelector("strong");
    const title = strong ? strong.textContent.trim() : "";
    const clone = li.cloneNode(true);
    const s = clone.querySelector("strong");
    if (s) s.remove();
    const body = clone.textContent.replace(/\s+/g, " ").trim();
    return { title, body };
  });
  if (items.length < 2) return;

  const dots = [
    [160, 42], [278, 160], [160, 278], [42, 160],
  ];

  mount.innerHTML = `
    <div class="wake-track">
      <div class="wake-stage">
        <div class="wake-copy-set">
          ${items
            .map(
              (it, i) => `
          <div class="wake-copy${i === 0 ? " on" : ""}">
            <div class="k">Step 0${i + 1} / 0${items.length}</div>
            <h3>${esc(it.title)}</h3>
            <p>${esc(it.body)}</p>
          </div>`
            )
            .join("")}
          <div class="wake-bar" aria-hidden="true"><i></i></div>
        </div>
        <div class="wake-orbit" aria-hidden="true">
          <svg viewBox="0 0 320 320">
            <circle class="odash" cx="160" cy="160" r="141" />
            <circle class="oring" cx="160" cy="160" r="118" />
            <circle class="odraw" cx="160" cy="160" r="118" data-c="${(2 * Math.PI * 118).toFixed(2)}" />
            ${dots.map(([x, y]) => `<circle class="ostep" cx="${x}" cy="${y}" r="5.5" />`).join("")}
            <g class="otravel"><circle class="otraveller" cx="160" cy="42" r="5.5" /></g>
            <text class="onum" x="160" y="172" text-anchor="middle">01</text>
            <text class="osub" x="160" y="198" text-anchor="middle">OF 0${items.length}</text>
          </svg>
        </div>
      </div>
    </div>`;

  section.classList.add("scrub-live");
  mount.setAttribute("aria-hidden", "false");

  const track = mount.querySelector(".wake-track");
  const stage = mount.querySelector(".wake-stage");
  const copies = [...mount.querySelectorAll(".wake-copy")];
  const stepDots = [...mount.querySelectorAll(".ostep")];
  const draw = mount.querySelector(".odraw");
  const num = mount.querySelector(".onum");
  const bar = mount.querySelector(".wake-bar i");
  const C = parseFloat(draw.dataset.c);
  draw.style.strokeDasharray = `${C}`;
  draw.style.strokeDashoffset = `${C}`;

  let current = -1;
  let pending = false;

  const update = () => {
    pending = false;
    const r = track.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = clamp(total > 0 ? -r.top / total : 0);
    draw.style.strokeDashoffset = `${(C * (1 - p)).toFixed(1)}`;
    const idx = Math.min(items.length - 1, Math.floor(p * items.length));
    if (idx === current) return;
    current = idx;
    copies.forEach((c, i) => c.classList.toggle("on", i === idx));
    stepDots.forEach((d, i) => d.classList.toggle("on", i <= idx));
    num.textContent = `0${idx + 1}`;
    stage.style.setProperty("--step", idx);
    bar.style.transform = `translateX(${idx * 100}%)`;
  };

  window.addEventListener("scroll", () => {
    if (!pending) { pending = true; raf(update); }
  }, { passive: true });
  update();
}
buildWakeScrub();

/* ---- mesh graph: photon pulses on confirmed edges, ping stagger,
   node -> peer-card highlight ---- */
function enhanceMesh() {
  const svg = document.querySelector(".mesh-svg");
  if (!svg) return;
  const upEdges = [...svg.querySelectorAll(".edge.up")];

  if (!REDUCED && upEdges.length) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("aria-hidden", "true");
    upEdges.forEach((edge, i) => {
      const photon = edge.cloneNode(false);
      photon.setAttribute("class", "photon");
      photon.removeAttribute("data-peer");
      photon.style.animationDelay = `${(-(i * 0.67) % 4.6).toFixed(2)}s`;
      g.appendChild(photon);
    });
    svg.appendChild(g);
  }

  svg.querySelectorAll(".node").forEach((node, i) => {
    const ping = node.querySelector(".ping");
    if (ping) ping.style.setProperty("--i", i % 7);
    const name = node.dataset.name;
    if (!name) return;
    const card = document.querySelector(`.peer[data-peer="${name}"]`);
    const on = () => { if (card) card.classList.add("hot"); node.classList.add("focus"); };
    const off = () => { if (card) card.classList.remove("hot"); node.classList.remove("focus"); };
    node.addEventListener("mouseenter", on);
    node.addEventListener("mouseleave", off);
    node.addEventListener("focus", on);
    node.addEventListener("blur", off);
  });
}
enhanceMesh();
