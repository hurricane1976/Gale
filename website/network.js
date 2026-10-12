import { boot, esc, refreshEffects, chartTooltip, skeleton, tracedFetch } from "./shared.js";
boot();

const $ = (id) => document.getElementById(id);
const FEED = "/api/fleet/net";
const POLL_MS = 30000;

let DATA = null;
let sockFilter = "";

// skeleton screens (#6): shimmer until the first fetch renders
skeleton($("stats-grid"), 3, 64);

const STATE_COLOR = {
  established: "var(--ok)",
  listen: "var(--flag)",
  time_wait: "var(--text-dim)",
  syn_sent: "var(--warn)",
  syn_recv: "var(--warn)",
  close_wait: "var(--warn)",
  last_ack: "var(--text-dim)",
  closing: "var(--warn)",
  unconnected: "var(--text-dim)",
  unSpecified: "transparent",
};

function setFresh(kind, text) {
  const f = $("freshness");
  f.dataset.state = kind;
  $("freshness-text").textContent = text;
}

function statCard(label, value, sub) {
  return `<div class="vital" data-level="ok">
    <span class="vital-label">${label}</span>
    <span class="vital-value">${value}</span>
    <span class="vital-sub">${sub || ""}</span>
  </div>`;
}

function renderStats(d) {
  const upCount = d.interfaces.filter((i) => i.up).length;
  const socks = (d.sockets.tcp || []).length + (d.sockets.udp || []).length;
  $("stats-grid").innerHTML = [
    statCard("Interfaces", d.interfaces.length, `${upCount} up`),
    statCard("ARP entries", d.arp.length, `${d.interfaces.length ? new Set(d.arp.map((a) => a.dev)).size : 0} devices`),
    statCard("TCP sockets", (d.sockets.tcp || []).length, d.sockets.tcp ? `from ss -tan` : "no data"),
    statCard("UDP sockets", (d.sockets.udp || []).length, d.sockets.udp ? "from ss -uan" : "no data"),
    statCard("Total socket rows", socks, d.socket_note ? "capped at 500/family" : ""),
  ].join("");
}

function renderIfaces(d) {
  $("iface-count").textContent = d.interfaces.length;
  $("ifaces-table").querySelector("tbody").innerHTML = d.interfaces.map((i) => {
    const addrs = (i.addrs || []).filter(Boolean).map((a) => esc(a)).join("<br>") || "&ndash;";
    const upColor = i.up ? "var(--ok)" : "var(--text-dim)";
    return `<tr${i.up ? "" : ' class="row-dim"'}>
      <td><code>${esc(i.ifname || "?")}</code></td>
      <td><span style="color:${upColor}">&#9679;</span> ${esc((i.operstate || "?").toLowerCase().replace(/_/g, " "))}</td>
      <td style="font-family:var(--font-mono);font-size:.9em">${addrs}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="3" class="mini-note">No interfaces reported.</td></tr>`;
}

function renderArp(d) {
  $("arp-count").textContent = d.arp.length;
  const rows = [...d.arp].sort((a, b) => String(a.dst || "").localeCompare(String(b.dst || ""), undefined, { numeric: true }));
  $("arp-table").querySelector("tbody").innerHTML = rows.map((a) => {
    const state = a.state || "?";
    const isStale = /stale|failed|INCOMPLETE/i.test(state);
    return `<tr${isStale ? ' class="row-dim"' : ""}>
      <td><code>${esc(a.dst || "?")}</code></td>
      <td>${esc(a.dev || "?")}</td>
      <td style="font-family:var(--font-mono);font-size:.9em">${a.lladdr ? esc(a.lladdr) : '<span style="color:var(--text-dim)">&ndash; (incomplete)</span>'}</td>
      <td style="color:${isStale ? "var(--warn)" : "var(--text-dim)"}">${esc(state)}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" class="mini-note">ARP table empty.</td></tr>`;
}

let sockQuery = "", sockSort = null, sockSortDir = 1;
function renderSocks(d) {
  const all = [
    ...(d.sockets.tcp || []).map((s) => ({ ...s, proto: "tcp" })),
    ...(d.sockets.udp || []).map((s) => ({ ...s, proto: "udp" })),
  ];
  // text filter + sort BEFORE the slice (#61): the 400-row cap used to hide
  // matching rows irrecoverably
  const q = sockQuery.trim().toLowerCase();
  let rows = (sockFilter ? all.filter((s) => s.proto === sockFilter) : all)
    .filter((s) => !q || [s.state, s.local, s.peer, s.proc && s.proc.name, s.proc && String(s.proc.pid)].some((v) => String(v || "").toLowerCase().includes(q)));
  if (sockSort) {
    const dir = sockSortDir;
    rows = rows.slice().sort((a, b) => String(a[sockSort] ?? "").localeCompare(String(b[sockSort] ?? ""), undefined, { numeric: true }) * dir);
  }
  const shown = rows.slice(0, 400);
  $("sock-count").textContent = `${all.length} total · ${rows.length} matching (${shown.length} shown)`;
  $("socks-table").querySelector("tbody").innerHTML = shown.map((s) => {
    const color = STATE_COLOR[s.state] || "var(--text-dim)";
    const proc = s.proc ? `<code>${esc(s.proc.name)}</code> <span style="color:var(--text-dim);font-size:.8em">pid ${s.proc.pid}</span>`
      : `<span style="color:var(--text-dim)">&ndash;</span>`;
    return `<tr>
      <td style="color:var(--text-dim)">${s.proto}</td>
      <td style="color:${color}">${esc(s.state || "?")}</td>
      <td style="font-family:var(--font-mono);font-size:.9em">${esc(s.local || "–")}</td>
      <td style="font-family:var(--font-mono);font-size:.9em">${esc(s.peer || "–")}</td>
      <td>${proc}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="5" class="mini-note">No socket rows match.</td></tr>`;
  if (rows.length > 400) {
    let note = $("sock-trunc-note");
    if (!note) {
      note = document.createElement("p");
      note.id = "sock-trunc-note";
      note.className = "mini-note";
      $("socks-table").after(note);
    }
    note.textContent = `showing 400 of ${rows.length} matches — narrow the filter to see more`;
  } else { const n = $("sock-trunc-note"); if (n) n.remove(); }
}

/* Rolling throughput chart (#3): per-interface rx/tx Mb/s already computed
   by the status collector (sysmon rates from /proc counters, 15s cadence);
   this page samples them on its own 30s poll into a ring buffer and draws
   one SVG area chart for the busiest interface (tailscale0 preferred --
   that's the mesh traffic that matters here). Session-only history. */
const TPUT_N = 20;
const tputBuf = [];
let tputIface = null;
function sampleThroughput() {
  return fetch("/api/status.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const ifs = ((d && d.network && d.network.interfaces) || [])
        .filter((i) => (i.rx_mbps || 0) + (i.tx_mbps || 0) >= 0);
      if (!ifs.length) return;
      const pick = ifs.find((i) => /tailscale/i.test(i.name || "")) ||
        ifs.slice().sort((a, b) => ((b.rx_mbps || 0) + (b.tx_mbps || 0)) - ((a.rx_mbps || 0) + (a.tx_mbps || 0)))[0];
      tputIface = pick.name;
      tputBuf.push({ t: Date.now(), rx: pick.rx_mbps || 0, tx: pick.tx_mbps || 0, iface: pick.name });
      if (tputBuf.length > TPUT_N) tputBuf.splice(0, tputBuf.length - TPUT_N);
      renderThroughput();
    })
    .catch(() => { /* chart stays at last sample */ });
}
function renderThroughput() {
  const box = $("tput-chart");
  if (!box) return;
  $("tput-iface").textContent = tputIface
    ? `${tputIface} · rx + tx Mb/s · last ${tputBuf.length} samples` : "measuring…";
  if (tputBuf.length < 2) {
    skeleton(box, 1, 56); // shimmer placeholder; the chart cross-fades in over it
    return;
  }
  const W = 640, H = 120, PT = 8, PB = 16;
  const peak = Math.max(0.1, ...tputBuf.map((s) => s.rx + s.tx));
  const X = (i) => (i / (TPUT_N - 1)) * (W - 8) + 4;
  const off = TPUT_N - tputBuf.length;
  const Y = (v) => PT + (1 - v / peak) * (H - PT - PB);
  const line = (key, color) => {
    const pts = tputBuf.map((s, i) => `${X(off + i).toFixed(1)},${Y(s[key]).toFixed(1)}`).join(" ");
    return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8"/>` +
      `<polygon points="8,${H - PB} ${pts} ${(W - 8).toFixed(1)},${H - PB}" fill="${color}22"/>`;
  };
  const last = tputBuf[tputBuf.length - 1];
  // theme-safe colors (#62): hardcoded cyans/greens were invisible on light
  const rxColor = "var(--flag-soft, #22e6ff)", txColor = "var(--gust, #39ff8f)";
  // interface change annotation (#62): the buffer silently mixed series
  if (tputBuf.length >= 2 && tputBuf[0].iface && tputBuf[tputBuf.length - 1].iface !== tputBuf[0].iface) {
    $("tput-iface").textContent += ` · switched from ${tputBuf[0].iface} mid-session (buffer reset)`;
    tputBuf.length = 0;
    tputBuf.push({ t: Date.now(), rx: last.rx, tx: last.tx, iface: tputIface });
    return;
  }
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="throughput, peak ${peak.toFixed(2)} megabits per second">` +
    `<line x1="4" y1="${Y(peak / 2)}" x2="${W - 4}" y2="${Y(peak / 2)}" stroke="var(--line)" stroke-width="1"/>` +
    `<text x="${W - 4}" y="${Y(peak) + 10}" text-anchor="end" font-size="9" fill="var(--text-faint)">peak ${peak.toFixed(2)}</text>` +
    line("rx", rxColor) + line("tx", txColor) +
    `<g font-size="10" fill="var(--text-dim)"><circle cx="10" cy="12" r="3" fill="${rxColor}"/><text x="17" y="15">rx ${last.rx.toFixed(2)}</text>` +
    `<circle cx="110" cy="12" r="3" fill="${txColor}"/><text x="117" y="15">tx ${last.tx.toFixed(2)}</text></g></svg>`;
  const svg = box.querySelector("svg");
  chartTooltip(svg, tputBuf.map((s, i) => ({ x: X(off + i) })), (i) => {
    const s = tputBuf[i];
    return `${new Date(s.t).toLocaleTimeString()} · rx ${s.rx.toFixed(2)} / tx ${s.tx.toFixed(2)} Mb/s`;
  });
}


/* lazy 3D: only where WebGL + motion are available; any failure just leaves the panel hidden */
function webglOk() {
  try { return !!document.createElement("canvas").getContext("webgl") && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) && document.documentElement.dataset.saver !== "1"; } catch { return false; }
}
let NETMAP = false;
function maybeNetMap() {
  if (NETMAP) return; NETMAP = true;
  const sec = document.getElementById("sec-netmap");
  if (!sec) return;
  if (!webglOk()) { sec.hidden = true; return; }
  import("./netmap3d.js").then((m) => m.initNetMap(DATA)).catch(() => { sec.hidden = true; });
}

function renderAll() {
  if (!DATA) return;
  renderStats(DATA);
  renderIfaces(DATA);
  renderArp(DATA);
  renderSocks(DATA);
  try { maybeNetMap(); } catch { /* decoration */ }
  refreshEffects();
  setFresh("live", `live · ${new Date(DATA.generated_at).toLocaleTimeString()}`);
}

async function load() {
  try {
    const r = await tracedFetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    DATA = await r.json();
    renderAll();
  } catch (e) {
    setFresh("error", `feed error: ${String(e.message || e)}`);
  }
  sampleThroughput();
}

$("sock-filter").addEventListener("change", (e) => {
  sockFilter = e.target.value;
  if (DATA) renderSocks(DATA);
});
// socket search (#61)
{
  const input = $("sock-search");
  if (input && !input.dataset.bound) {
    input.dataset.bound = "1";
    let t = 0;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { sockQuery = input.value; if (DATA) renderSocks(DATA); }, 150);
    });
  }
}
// sortable socket columns (#61)
{
  const ths = $("socks-table")?.querySelectorAll("th") || [];
  const names = [null, "state", "local", "peer", "proc"];
  ths.forEach((th, i) => {
    if (!names[i]) return;
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
      if (sockSort === names[i]) sockSortDir *= -1;
      else { sockSort = names[i]; sockSortDir = 1; }
      ths.forEach((t) => t.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", sockSortDir === 1 ? "ascending" : "descending");
      if (DATA) renderSocks(DATA);
    });
  });
}

document.getElementById("board").hidden = false;
await load();
// polling pauses in hidden tabs; refresh on return
let pollIv = setInterval(load, POLL_MS);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { clearInterval(pollIv); pollIv = 0; }
  else if (!pollIv) { load(); pollIv = setInterval(load, POLL_MS); }
});
