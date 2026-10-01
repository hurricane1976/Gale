import { boot, esc, refreshEffects, chartTooltip, skeleton } from "./shared.js";
boot();

const $ = (id) => document.getElementById(id);
const FEED = "api/fleet/net";
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
    return `<tr${i.up ? "" : ' style="opacity:.6"'}>
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
    return `<tr${isStale ? ' style="opacity:.6"' : ""}>
      <td><code>${esc(a.dst || "?")}</code></td>
      <td>${esc(a.dev || "?")}</td>
      <td style="font-family:var(--font-mono);font-size:.9em">${a.lladdr ? esc(a.lladdr) : '<span style="color:var(--text-dim)">&ndash; (incomplete)</span>'}</td>
      <td style="color:${isStale ? "var(--warn)" : "var(--text-dim)"}">${esc(state)}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" class="mini-note">ARP table empty.</td></tr>`;
}

function renderSocks(d) {
  const all = [
    ...(d.sockets.tcp || []).map((s) => ({ ...s, proto: "tcp" })),
    ...(d.sockets.udp || []).map((s) => ({ ...s, proto: "udp" })),
  ];
  const rows = (sockFilter ? all.filter((s) => s.proto === sockFilter) : all).slice(0, 400);
  $("sock-count").textContent = `${all.length} total (${rows.length} shown)`;
  $("socks-table").querySelector("tbody").innerHTML = rows.map((s) => {
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
  return fetch("api/status.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const ifs = ((d && d.network && d.network.interfaces) || [])
        .filter((i) => (i.rx_mbps || 0) + (i.tx_mbps || 0) >= 0);
      if (!ifs.length) return;
      const pick = ifs.find((i) => /tailscale/i.test(i.name || "")) ||
        ifs.slice().sort((a, b) => ((b.rx_mbps || 0) + (b.tx_mbps || 0)) - ((a.rx_mbps || 0) + (a.tx_mbps || 0)))[0];
      tputIface = pick.name;
      tputBuf.push({ t: Date.now(), rx: pick.rx_mbps || 0, tx: pick.tx_mbps || 0 });
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
    box.innerHTML = `<p class="mini-note">collecting samples…</p>`;
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
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="throughput, peak ${peak.toFixed(2)} megabits per second">` +
    `<line x1="4" y1="${Y(peak / 2)}" x2="${W - 4}" y2="${Y(peak / 2)}" stroke="var(--line)" stroke-width="1"/>` +
    `<text x="${W - 4}" y="${Y(peak) + 10}" text-anchor="end" font-size="9" fill="var(--text-faint)">peak ${peak.toFixed(2)}</text>` +
    line("rx", "#22e6ff") + line("tx", "#39ff8f") +
    `<g font-size="10" fill="var(--text-dim)"><circle cx="10" cy="12" r="3" fill="#22e6ff"/><text x="17" y="15">rx ${last.rx.toFixed(2)}</text>` +
    `<circle cx="110" cy="12" r="3" fill="#39ff8f"/><text x="117" y="15">tx ${last.tx.toFixed(2)}</text></g></svg>`;
  const svg = box.querySelector("svg");
  chartTooltip(svg, tputBuf.map((s, i) => ({ x: X(off + i) })), (i) => {
    const s = tputBuf[i];
    return `${new Date(s.t).toLocaleTimeString()} · rx ${s.rx.toFixed(2)} / tx ${s.tx.toFixed(2)} Mb/s`;
  });
}

function renderAll() {
  if (!DATA) return;
  renderStats(DATA);
  renderIfaces(DATA);
  renderArp(DATA);
  renderSocks(DATA);
  refreshEffects();
  setFresh("live", `live · ${new Date(DATA.generated_at).toLocaleTimeString()}`);
}

async function load() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
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

document.getElementById("board").hidden = false;
await load();
setInterval(load, POLL_MS);
