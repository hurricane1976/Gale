import { boot, esc, refreshEffects } from "./shared.js";
boot();

const $ = (id) => document.getElementById(id);
const FEED = "api/fleet/net";
const POLL_MS = 30000;

let DATA = null;
let sockFilter = "";

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
      <td style="font-family:var(--font-mono);font-size:.82em">${addrs}</td>
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
      <td style="font-family:var(--font-mono);font-size:.82em">${a.lladdr ? esc(a.lladdr) : '<span style="color:var(--text-dim)">&ndash; (incomplete)</span>'}</td>
      <td style="color:${isStale ? "var(--warn)" : "var(--text-dim)"}">${esc(state)}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4" class="mini-note">ARP table empty.</td></tr>`;
}

function renderSocks(d) {
  const all = [
    ...(d.sockets.tcp || []).map((s) => ({ ...s, proto: "tcp" })),
    ...(d.sockets.udp || []).map((s) => ({ ...s, proto: "udp" })),
  ];
  const rows = sockFilter ? all.filter((s) => s.proto === sockFilter) : all;
  $("sock-count").textContent = `${all.length} total (${rows.length} shown)`;
  $("socks-table").querySelector("tbody").innerHTML = rows.map((s) => {
    const color = STATE_COLOR[s.state] || "var(--text-dim)";
    const proc = s.proc ? `<code>${esc(s.proc.name)}</code> <span style="color:var(--text-dim);font-size:.8em">pid ${s.proc.pid}</span>`
      : `<span style="color:var(--text-dim)">&ndash;</span>`;
    return `<tr>
      <td style="color:var(--text-dim)">${s.proto}</td>
      <td style="color:${color}">${esc(s.state || "?")}</td>
      <td style="font-family:var(--font-mono);font-size:.82em">${esc(s.local || "–")}</td>
      <td style="font-family:var(--font-mono);font-size:.82em">${esc(s.peer || "–")}</td>
      <td>${proc}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="5" class="mini-note">No socket rows match.</td></tr>`;
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
}

$("sock-filter").addEventListener("change", (e) => {
  sockFilter = e.target.value;
  if (DATA) renderSocks(DATA);
});

document.getElementById("board").hidden = false;
await load();
setInterval(load, POLL_MS);
