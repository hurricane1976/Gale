/* GALE — command palette (Ctrl/Cmd+K). One input, every destination:
   pages, the current page's sections (any [id] on a heading/section), and
   fleet agents when the roster is in the DOM (topo nodes / agent cards).
   Built on <dialog>: native focus trap + Esc. House tokens only. */

const PAGES = [
  ["Dashboard", "index.html", "home · hero · record of work"],
  ["Fleet topology", "fleet.html", "91-edge mesh · host clusters"],
  ["Ops status", "status.html", "host vitals · services · security"],
  ["Metrics", "metrics.html", "14-day wakings · cost"],
  ["Observability", "observability.html", "runs · spend · silent failures"],
  ["Ollama", "ollama.html", "inference admin · playground"],
  ["Agora", "agora.html", "peer message board"],
  ["Weather", "weather.html", "radar · forecast"],
  ["Network", "network.html", "interfaces · firewalla"],
];

const ICON_PAGE = "→", ICON_SECTION = "§", ICON_AGENT = "◆";

/* kiosk toggle: only shown when not already in kiosk mode */
function kioskItem(items) {
  if (new URLSearchParams(location.search).has("kiosk")) return;
  items.push({
    icon: "▦", label: "Start kiosk mode",
    hint: "fullscreen auto-rotating wall display",
    go: () => { location.href = `status.html?kiosk=20`; },
  });
}

function collectItems() {
  const items = PAGES.map(([label, href, hint]) => ({
    icon: ICON_PAGE, label, hint: hint || href, go: () => { location.href = href; },
  }));

  // current page's navigable sections
  for (const el of document.querySelectorAll("main section[id], main h2[id], main h3[id], main [data-palette-label]")) {
    const heading = el.matches("h2, h3") ? el : el.querySelector("h2, h3, .section-h, .eyebrow");
    const label = (el.getAttribute("data-palette-label") || heading?.textContent || "").trim().slice(0, 60);
    if (!label || !el.id) continue;
    items.push({
      icon: ICON_SECTION, label,
      hint: "this page",
      go: () => document.getElementById(el.id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    });
  }

  // agents present in the DOM (fleet topology + member cards)
  const seen = new Set();
  for (const g of document.querySelectorAll(".topo-node[data-name], agent-card[name]")) {
    const name = g.getAttribute("data-name") || g.getAttribute("name");
    if (!name || seen.has(name)) continue;
    seen.add(name);
    items.push({
      icon: ICON_AGENT, label: name,
      hint: (g.getAttribute("data-role-desc") || g.getAttribute("role") || "agent").slice(0, 60),
      go: () => {
        if (g.id) return document.getElementById(g.id)?.scrollIntoView({ behavior: "smooth" });
        g.scrollIntoView({ behavior: "smooth", block: "center" });
        g.classList.add("palette-flash");
        setTimeout(() => g.classList.remove("palette-flash"), 1600);
      },
    });
  }
  kioskItem(items);
  return items;
}

export function initPalette() {
  if (document.getElementById("palette")) return;

  const dlg = document.createElement("dialog");
  dlg.id = "palette";
  dlg.setAttribute("aria-label", "Command palette");
  dlg.innerHTML = `
    <input id="palette-input" type="text" role="combobox" aria-expanded="true"
      aria-controls="palette-list" aria-autocomplete="list"
      placeholder="Go to page, section, agent…" autocomplete="off" spellcheck="false">
    <ul id="palette-list" role="listbox" aria-label="Results"></ul>
    <p class="palette-foot"><kbd>↑↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close</p>`;
  document.body.appendChild(dlg);

  const input = dlg.querySelector("#palette-input");
  const list = dlg.querySelector("#palette-list");
  let items = [];
  let filtered = [];
  let active = 0;

  const score = (item, q) => {
    const label = item.label.toLowerCase();
    if (label === q) return 0;
    if (label.startsWith(q)) return 1;
    if (label.includes(q)) return 2;
    if ((item.hint || "").toLowerCase().includes(q)) return 3;
    return 99;
  };

  const render = () => {
    const q = input.value.trim().toLowerCase();
    filtered = q ? items
      .map((it) => ({ it, s: score(it, q) }))
      .filter((r) => r.s < 99)
      .sort((a, b) => a.s - b.s)
      .map((r) => r.it)
      .slice(0, 12)
    : items.slice(0, 12);
    active = Math.min(active, Math.max(filtered.length - 1, 0));
    list.innerHTML = filtered.map((it, i) => `
      <li role="option" data-i="${i}" aria-selected="${i === active}" class="${i === active ? "on" : ""}">
        <span class="palette-icon" aria-hidden="true">${it.icon}</span>
        <span class="palette-label">${it.label}</span>
        <span class="palette-hint">${it.hint || ""}</span>
      </li>`).join("") || `<li class="palette-none">no matches</li>`;
  };

  const choose = (i) => {
    const it = filtered[i];
    if (!it) return;
    dlg.close();
    it.go();
  };

  const open = () => {
    items = collectItems();
    input.value = "";
    active = 0;
    render();
    dlg.showModal();
    input.focus();
  };

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dlg.open ? dlg.close() : open();
    }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li) choose(+li.dataset.i);
  });
  list.addEventListener("mousemove", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li && +li.dataset.i !== active) {
      active = +li.dataset.i;
      render();
    }
  });
  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
  });
}
