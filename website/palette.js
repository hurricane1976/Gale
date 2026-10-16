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
  ["freetoken", "ollama.html", "inference admin · playground"],
  ["Agora", "agora.html", "peer message board"],
  ["Weather", "weather.html", "radar · forecast"],
  ["Network", "network.html", "interfaces · firewalla"],
  ["Reliability", "reliability.html", "SLOs · synthetics · RUM · forecasts"],
  ["Operations", "operations.html", "incidents · acks · lifecycle"],
   ["Energy", "energy.html", "usage trends · costs · breakdowns"],
   ["Maintenance", "maintenance.html", "tasks · reminders · filter changes"],
   ["Notifications", "notifications.html", "alerts · security · leaks"],
   ["Cameras", "cameras.html", "camera grid · snapshots"],
   ["Presence", "presence.html", "people tracking · location"],
  ["Runbooks", "runbooks.html", "step-by-step ops procedures"],
  ["Galaxy", "galaxy.html", "3D fleet galaxy"],
];

const ICON_PAGE = "→", ICON_SECTION = "§", ICON_AGENT = "◆";

/* keyboard-shortcuts help dialog (#51): one native <dialog> listing every
   site-wide shortcut, opened from the palette or the "?" key. Built lazily
   on first open so plain-Node render tests stay DOM-free. */
const SHORTCUTS = Object.freeze([
  ["Ctrl / ⌘ + K", "Open or close the command palette"],
  ["/", "Open the command palette (single-key trigger)"],
  ["?", "This shortcut help"],
  ["↑ ↓", "Palette: move between results"],
  ["↵", "Palette: open the selected result"],
  ["Esc", "Close palette / dialogs / unpinned tooltips"],
  ["← → Home End", "Charts: step the crosshair when a chart is focused"],
  ["← →", "Tables: scroll horizontally when a table region is focused"],
  ["M", "Status board: mute the focused alert chip"],
  ["Ctrl / ⌘ + D", "Bookmark (browser) — noted here to avoid surprise"],
]);
let helpDlg = null;
function openHelp() {
  if (!helpDlg) {
    helpDlg = document.createElement("dialog");
    helpDlg.id = "gale-shortcuts";
    helpDlg.setAttribute("aria-label", "Keyboard shortcuts");
    helpDlg.innerHTML = `
      <h2>Keyboard shortcuts</h2>
      <dl class="shortcut-list">
        ${SHORTCUTS.map(([k, v]) => `<dt><kbd>${k}</kbd></dt><dd>${v}</dd>`).join("")}
      </dl>
      <p class="mini-note">Press <kbd>Esc</kbd> to close.</p>`;
    document.body.appendChild(helpDlg);
    helpDlg.addEventListener("click", (e) => { if (e.target === helpDlg) helpDlg.close(); });
  }
  if (typeof helpDlg.showModal === "function") { if (!helpDlg.open) helpDlg.showModal(); }
  else helpDlg.setAttribute("open", "");
}
export { openHelp };

/* kiosk toggle: only shown when not already in kiosk mode */
function kioskItem(items) {
  if (new URLSearchParams(location.search).has("kiosk")) return;
  items.push({
    icon: "▦", label: "Start kiosk mode",
    hint: "fullscreen auto-rotating wall display",
    go: () => { location.href = `status.html?kiosk=20`; },
  });
  items.push({
    icon: "▦", label: "Start kiosk wall board",
    hint: "big-number glanceable vitals (?kiosk&big)",
    go: () => { location.href = `status.html?kiosk=20&big`; },
  });
}

const escP = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ops actions (#9): display toggles that click the real buttons (single
   source of truth stays in shared.js), a push self-test, and live alert
   acks. Dynamic labels are escaped at render -- alert text is data. */
async function opsItems(items) {
  const click = (id, label, hint) => {
    if (!document.getElementById(id)) return;
    items.push({ icon: "◐", label, hint, go: () => document.getElementById(id).click() });
  };
  click("contrast-toggle", "Toggle high-contrast mode", "auto from prefers-contrast otherwise");
  click("saver-toggle", "Toggle reduced-data mode", "kills canvases, reloads to apply");
  click("theme-toggle", "Toggle light / dark theme", "bottom-right button");
  items.push({
    icon: "🔔", label: "Send push self-test",
    hint: "POST api/push/test — lock-screen ping if subscribed",
    go: async () => {
      try {
        const r = await fetch("/api/push/test", { method: "POST" });
        alert(r.ok ? "push test sent — check the lock screen" : `push test failed (HTTP ${r.status})`);
      } catch { alert("push test failed — backend unreachable"); }
    },
  });
  try {
    const r = await fetch("/api/fleet/alerts", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    for (const a of (d.alerts || []).filter((x) => (x.sev === "crit" || x.sev === "warn") && !/roster[\s_-]*drift/i.test(String(x.text || ""))).slice(0, 8)) {
      const key = `${a.kind}:${a.text}`;
      items.push({
        icon: a.sev === "crit" ? "🟥" : "🟨",
        label: `Ack 4h: ${a.text}`.slice(0, 80),
        hint: `${a.sev} · ${a.kind} · mutes 4h`,
        go: async () => {
          try {
            await fetch("/api/fleet/alerts/acks", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key, hours: 4 }),
            });
          } catch { /* ack is best-effort; strip re-fetches anyway */ }
        },
      });
    }
  } catch { /* alerts feed down -- nav items still work */ }
}

/* home actions: quick scene activation, room navigation, device toggles.
   Mirrors the opsItems pattern: dynamic labels from live data. */
async function homeItems(items) {
  if (!document.querySelector("main")?.id && !location.pathname.includes("home")) return;

  // Quick scenes
  try {
    const r = await fetch("/api/fleet/home/scenes", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      for (const s of (d.scenes || []).slice(0, 6)) {
        items.push({
          icon: s.icon || "⚡",
          label: s.name || s.id,
          hint: "scene · " + (s.description || "").slice(0, 40),
          go: async () => {
            try { await fetch("/api/fleet/home/scenes/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) }); } catch {}
          },
        });
      }
    }
  } catch { /* scenes unavailable */ }

  // Quick actions
  const quickActions = [
    { id: "home", icon: "🏠", label: "Home mode", hint: "Disarm security, lights on" },
    { id: "away", icon: "🔒", label: "Away mode", hint: "Arm away, lights off" },
    { id: "sleep", icon: "🌙", label: "Sleep mode", hint: "Lock doors, dim lights" },
    { id: "morning", icon: "☀️", label: "Good morning", hint: "Open blinds, set temp" },
  ];
  for (const qa of quickActions) {
    items.push({
      icon: qa.icon,
      label: qa.label,
      hint: qa.hint,
      go: async () => {
        try {
          await fetch("/api/fleet/home/toggle", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity_id: "input_boolean." + qa.id, state: qa.id === "away" ? "on" : "off" }),
          });
        } catch { /* best effort */ }
      },
    });
  }

  // Notification count badge
  try {
    const r = await fetch("/api/fleet/home/notifications", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      const unreads = (d.notifications || []).filter(n => !n.read).length;
      if (unreads > 0) {
        items.push({
          icon: "🔔",
          label: `${unreads} notification${unreads > 1 ? 's' : ''}`,
          hint: "home notifications",
          go: () => { location.href = "notifications.html"; },
        });
      }
    }
  } catch { /* notifications unavailable */ }

  // Presence toggle items for each known person
  try {
    const r = await fetch("/api/fleet/home/presence", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      for (const p of (d.people || []).slice(0, 8)) {
        const icon = p.location === "home" ? "🏠" : p.location === "sleeping" ? "🌙" : "🚗";
        items.push({
          icon,
          label: `${p.name} → ${p.location || "unknown"}`,
          hint: "presence",
          go: () => { location.href = `presence.html#person-${p.name}`; },
        });
      }
    }
  } catch { /* presence unavailable */ }

  // Camera grid link
  try {
    const r = await fetch("/api/fleet/home/cameras", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      const count = (d.cameras || []).length;
      if (count > 0) {
        items.push({
          icon: "📷",
          label: `${count} camera${count > 1 ? 's' : ''}`,
          hint: "camera grid",
          go: () => { location.href = "cameras.html"; },
        });
      }
    }
  } catch { /* cameras unavailable */ }
}

async function collectItems() {
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
  const agentGo = (name, g) => () => {
    if (g && g.isConnected) {
      if (g.id) return document.getElementById(g.id)?.scrollIntoView({ behavior: "smooth" });
      g.scrollIntoView({ behavior: "smooth", block: "center" });
      g.classList.add("palette-flash");
      setTimeout(() => g.classList.remove("palette-flash"), 1600);
      return;
    }
    // cross-page jump: fleet.html resolves #agent-<name> via the
    // cinematic layer (initAgentAnchors), case-insensitive
    location.href = `fleet.html#agent-${encodeURIComponent(name)}`;
  };
  for (const g of document.querySelectorAll(".topo-node[data-name], agent-card[name]")) {
    const name = g.getAttribute("data-name") || g.getAttribute("name");
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    items.push({
      icon: ICON_AGENT, label: name,
      hint: `${(g.getAttribute("data-role-desc") || g.getAttribute("role") || "agent").slice(0, 44)} · fleet.html#agent-${name}`,
      go: agentGo(name, g),
    });
  }
  // roster fallback: on pages without the topology in the DOM, fetch the
  // fleet roster once (parsed from fleet.html's own markup — no second
  // roster to drift) so every agent stays jumpable from anywhere.
  if (!seen.size) {
    try {
      const html = await fetch("fleet.html", { cache: "force-cache" }).then((r) => (r.ok ? r.text() : ""));
      for (const m of html.matchAll(/data-name="([^"]+)"/g)) {
        const name = m[1];
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        items.push({
          icon: ICON_AGENT, label: name,
          hint: `fleet.html#agent-${name}`,
          go: agentGo(name, null),
        });
      }
    } catch { /* offline — page/section items still work */ }
  }
  kioskItem(items);
  await opsItems(items);
  await homeItems(items);
  items.push({
    icon: "◐", label: "Toggle light / dark theme",
    hint: "or the ☀️/🌙 button, bottom-right",
    go: () => {
      const cur = document.documentElement.dataset.theme ||
        (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("gale-theme", next); } catch {}
    },
  });
  return items;
}

export function initPalette() {
  if (document.getElementById("palette")) return;

  const dlg = document.createElement("dialog");
  dlg.id = "palette";
  dlg.setAttribute("aria-label", "Command palette");
  dlg.innerHTML = `
    <input id="palette-input" type="text" role="combobox" aria-expanded="false"
      aria-controls="palette-list" aria-autocomplete="list"
      placeholder="Go to page, section, agent…" autocomplete="off" spellcheck="false">
    <ul id="palette-list" role="listbox" aria-label="Results"></ul>
    <p class="palette-foot"><kbd>↑↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close</p>`;
  document.body.appendChild(dlg);

  const input = dlg.querySelector("#palette-input");
  const list = dlg.querySelector("#palette-list");
  const foot = dlg.querySelector(".palette-foot");
  const FOOT_KEYS = `<kbd>↑↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close`;
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

  // match highlighting (#19): wrap the matched range of the label in <mark>
  // so the query→result link is visible (input is escaped before slicing)
  const markLabel = (label, q) => {
    const s = String(label ?? "");
    if (!q) return escP(s);
    const idx = s.toLowerCase().indexOf(q);
    if (idx < 0) return escP(s);
    return escP(s.slice(0, idx)) + "<mark>" + escP(s.slice(idx, idx + q.length)) + "</mark>" + escP(s.slice(idx + q.length));
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
    input.setAttribute("aria-expanded", "true");
    // combobox contract (#15): id each option and point aria-activedescendant
    // at the highlighted row so screen readers announce the moving highlight
    list.innerHTML = filtered.map((it, i) => `
      <li role="option" id="palette-opt-${i}" data-i="${i}" aria-selected="${i === active}" class="${i === active ? "on" : ""}">
        <span class="palette-icon" aria-hidden="true">${escP(it.icon)}</span>
        <span class="palette-label">${markLabel(it.label, q)}</span>
        <span class="palette-hint">${escP(it.hint || "")}</span>
      </li>`).join("") || `<li class="palette-none">no matches</li>`;
    input.setAttribute("aria-activedescendant", filtered.length ? `palette-opt-${active}` : "");
    // preview pane: what ↵ will do with the highlighted row
    const cur = filtered[active];
    foot.innerHTML = cur
      ? `${FOOT_KEYS} — <span class="palette-icon" aria-hidden="true">${escP(cur.icon)}</span> ${escP(cur.label)} · ${escP(cur.hint || "")}`
      : FOOT_KEYS;
  };

  const choose = (i) => {
    const it = filtered[i];
    if (!it) return;
    dlg.close();
    it.go();
  };

  // item cache (#18): every open was re-fetching fleet.html + the alerts
  // feed and the first open rendered an empty list while it waited. Cache
  // for 60s; render the cache immediately, refresh in the background.
  let cachedItems = null, cachedAt = 0;
  const open = () => {
    input.value = "";
    active = 0;
    if (cachedItems) { items = cachedItems; }
    render();
    dlg.showModal();
    input.focus();
    if (cachedItems && Date.now() - cachedAt < 60000) return;
    collectItems().then((fresh) => {
      if (!dlg.open) return;
      items = fresh; cachedItems = fresh; cachedAt = Date.now();
      render();
    });
  };

  input.setAttribute("aria-keyshortcuts", "Control+K Meta+K /"); // pass #5 #40
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dlg.open ? dlg.close() : open();
    }
    // "/" opens the palette too, when the user isn't already typing (#65):
    // browsers reserve Ctrl+K for the address bar on some layouts, and a
    // single keystroke trigger is the dashboard power-user norm.
    else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = e.target;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (!typing && !dlg.open) { e.preventDefault(); open(); }
    }
    // "?" opens the keyboard-shortcuts help dialog (#51)
    else if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = e.target;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (!typing) { e.preventDefault(); openHelp(); }
    }
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li) choose(+li.dataset.i);
  });
  // hover moves the highlight without re-rendering the list (#17): rebuilds
  // churned the whole <ul> per pixel of mouse travel
  list.addEventListener("mousemove", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li || +li.dataset.i === active) return;
    const prev = list.querySelector("li.on");
    if (prev) { prev.classList.remove("on"); prev.setAttribute("aria-selected", "false"); }
    li.classList.add("on"); li.setAttribute("aria-selected", "true");
    active = +li.dataset.i;
    input.setAttribute("aria-activedescendant", li.id || "");
    const cur = filtered[active];
    foot.innerHTML = cur
      ? `${FOOT_KEYS} — <span class="palette-icon" aria-hidden="true">${escP(cur.icon)}</span> ${escP(cur.label)} · ${escP(cur.hint || "")}`
      : FOOT_KEYS;
  });
  input.addEventListener("input", () => { active = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
  });
}
