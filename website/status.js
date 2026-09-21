/* GALE — ops status board: fetches website/../var/www/gale-api/status.json
   (served at /api/status.json) on an interval and renders it client-side.
   No framework, no build step — same house style as the rest of the site.
   This page's content is genuinely live-data-only (unlike index/fleet,
   which have a full static fallback); see the <noscript> notice. */
import { boot, esc, clamp } from "./shared.js";

boot();

const FEED = "api/status.json";
const board = document.getElementById("board");
const freshEl = document.getElementById("freshness");
const freshText = document.getElementById("freshness-text");
let pollMs = 15000;
let pollTimer = null;

function level(pct, warn = 70, crit = 90) {
  if (pct >= crit) return "crit";
  if (pct >= warn) return "warn";
  return "ok";
}

function fmtUptime(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtAgo(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 2) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ${s % 60}s ago`;
}

function bar(pct, lvl) {
  return `<div class="meter" data-level="${lvl}"><i style="width:${clamp(pct, 0, 100).toFixed(1)}%"></i></div>`;
}

function vitalCard(label, value, sub, lvl, pct) {
  return `<div class="vital" data-level="${lvl || "ok"}">
    <span class="vital-label">${esc(label)}</span>
    <span class="vital-value">${value}</span>
    ${pct != null ? bar(pct, lvl) : ""}
    <span class="vital-sub">${sub || ""}</span>
  </div>`;
}

function renderVitals(d) {
  const h = d.host;
  const cpuLvl = level(h.cpu_pct);
  const memLvl = level(h.mem.pct, 75, 92);
  const disk = h.disks[0] || { pct: 0 };
  const diskLvl = level(disk.pct, 80, 93);
  const loadPct = (h.load[0] / h.cpu_count) * 100;
  const loadLvl = level(loadPct, 80, 100);
  document.getElementById("hostname").textContent = h.hostname;
  document.getElementById("vitals-grid").innerHTML = [
    vitalCard("CPU", `${h.cpu_pct}%`, `load ${h.load.join(" / ")}`, cpuLvl, h.cpu_pct),
    vitalCard("Memory", `${h.mem.pct}%`, `${(h.mem.used_mb / 1024).toFixed(1)} / ${(h.mem.total_mb / 1024).toFixed(1)} GB`, memLvl, h.mem.pct),
    vitalCard("Disk /", `${disk.pct}%`, `${disk.used_gb} / ${disk.total_gb} GB`, diskLvl, disk.pct),
    vitalCard("Swap", `${h.swap.pct}%`, `${(h.swap.used_mb / 1024).toFixed(2)} GB used`, h.swap.pct > 10 ? "warn" : "ok", h.swap.pct),
    vitalCard("Uptime", fmtUptime(h.uptime_s), h.reboot_required ? "reboot required" : "no reboot pending", h.reboot_required ? "warn" : "ok"),
    vitalCard("Load avg", h.load[0], `${h.cpu_count} cores &middot; 5m ${h.load[1]} &middot; 15m ${h.load[2]}`, loadLvl),
  ].join("");
}

function renderHostInfo(d) {
  const h = d.host;
  document.getElementById("host-info").innerHTML = [
    ["OS", esc(h.os)],
    ["Kernel", esc(h.kernel)],
    ["Arch", esc(h.arch)],
    ["Hostname", esc(h.hostname)],
    ["Boot time", esc(h.boot_time)],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
}

function renderCores(d) {
  const h = d.host;
  document.getElementById("cpu-count").textContent = h.cpu_count;
  document.getElementById("core-grid").innerHTML = h.cpu_per_core
    .map((p, i) => `<div class="core" data-level="${level(p)}" title="core ${i}: ${p}%">
        <i style="height:${clamp(p, 0, 100).toFixed(0)}%"></i>
      </div>`)
    .join("");
}

function renderNetwork(d) {
  const n = d.network;
  const rows = n.interfaces
    .map(
      (i) => `<tr>
      <td><code>${esc(i.name)}</code></td>
      <td><code>${esc(i.ip)}</code></td>
      <td>${i.rx_mbps.toFixed(2)} Mb/s</td>
      <td>${i.tx_mbps.toFixed(2)} Mb/s</td>
      <td>${i.rx_total_gb.toFixed(1)} / ${i.tx_total_gb.toFixed(1)} GB</td>
    </tr>`
    )
    .join("");
  document.querySelector("#net-table tbody").innerHTML = rows || `<tr><td colspan="5">no interfaces reported</td></tr>`;
  const ts = n.tailscale;
  document.getElementById("tailscale-line").textContent = ts && ts.ok
    ? `Tailscale: ${ts.backend_state} · self ${ts.self_ip} · ${ts.peers_online}/${ts.peers_total} tailnet peers online`
    : "Tailscale: status unavailable";
}

function renderServices(d) {
  const rows = d.services
    .map((s) => {
      const ok = s.state === "active";
      return `<tr>
      <td><code>${esc(s.unit)}</code></td>
      <td><span class="pill" data-level="${ok ? "ok" : "crit"}">${esc(s.state)}</span></td>
      <td class="mono-dim">${esc(s.since || "&ndash;")}</td>
    </tr>`;
    })
    .join("");
  document.querySelector("#services-table tbody").innerHTML = rows;
}

function renderSecurity(d) {
  const s = d.security;
  const yn = (v, warnIfTrue) =>
    v === null || v === undefined
      ? `<span class="pill" data-level="warn">unknown</span>`
      : `<span class="pill" data-level="${(warnIfTrue ? v : !v) ? "warn" : "ok"}">${v ? "yes" : "no"}</span>`;
  document.getElementById("security-info").innerHTML = [
    ["UFW firewall active", yn(s.ufw_active, false)],
    ["Reboot required", yn(s.reboot_required, true)],
    ["Unattended upgrades", `<span class="pill" data-level="${s.unattended_upgrades === "enabled" ? "ok" : "warn"}">${esc(s.unattended_upgrades)}</span>`],
    ["Sudoers drop-in present", yn(s.sudoers_dropin, false)],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
}

let portsExpanded = false;
function renderPorts(d) {
  const ports = d.network.listening_ports;
  const labeled = ports.filter((p) => p.label);
  const other = ports.filter((p) => !p.label);
  const row = (p) => `<tr>
      <td><code>${p.port}</code></td>
      <td><code>${esc(p.proc)}</code></td>
      <td>${p.label ? `<span class="pill" data-level="ok">${esc(p.label)}</span>` : `<span class="mono-dim">&ndash;</span>`}</td>
      <td class="mono-dim">${p.addrs.map(esc).join(", ")}</td>
    </tr>`;
  const toggle = document.getElementById("ports-toggle");
  const shown = labeled.concat(portsExpanded ? other : []);
  document.querySelector("#ports-table tbody").innerHTML = shown.map(row).join("");
  if (other.length) {
    toggle.hidden = false;
    toggle.textContent = portsExpanded ? "Show fewer" : `+ ${other.length} other listening ports`;
    toggle.onclick = () => { portsExpanded = !portsExpanded; renderPorts(d); };
  } else {
    toggle.hidden = true;
  }
}

const HEALTH_LEVEL = { up: "ok", auth: "info", error: "warn", down: "crit" };
const HEALTH_LABEL = { up: "up", auth: "up (auth-gated)", error: "error", down: "down" };
function renderTargets(d) {
  document.getElementById("targets-grid").innerHTML = d.targets
    .map((t) => {
      const lvl = HEALTH_LEVEL[t.health] || "warn";
      const lat = t.latency_ms != null ? `${t.latency_ms} ms` : "&ndash;";
      return `<div class="target-card" data-level="${lvl}">
        <div class="target-top">
          <span class="target-name">${esc(t.name)}</span>
          <span class="pill" data-level="${lvl}">${HEALTH_LABEL[t.health] || t.health}</span>
        </div>
        <div class="mono-dim">${esc(t.addr)} &middot; ${esc(t.kind)}</div>
        <div class="mono-dim">latency ${lat}${t.reported_name ? ` &middot; reports as ${esc(t.reported_name)}` : ""}</div>
      </div>`;
    })
    .join("");
}

const FW_API = "api/firewalla";
let fwDeviceFilter = "";
let lastFw = null;

function fwRuleLabel(r) {
  const t = r.target || {};
  if (t.type === "domain") return `domain: ${t.value}`;
  if (t.type === "category") return `category: ${t.value}`;
  if (t.type === "application") return `app: ${t.value}`;
  if (t.type === "ip") return `ip: ${t.value}`;
  if (t.type === "port") return `port: ${t.value}`;
  if (t.type === "internet") return "internet (all)";
  return t.type || "-";
}

function fwScopeLabel(r, devicesByMac) {
  const s = r.scope;
  if (!s) return "network-wide";
  if (s.type === "device") {
    const d = devicesByMac.get((s.value || "").toUpperCase());
    return d ? `${d.name || d.mac} (${d.ip || ""})` : s.value;
  }
  return `${s.type}: ${s.value}`;
}

async function fwAction(method, path, note) {
  const noteEl = document.getElementById("fw-action-note");
  noteEl.textContent = `${note}...`;
  try {
    const res = await fetch(`${FW_API}/${path}`, { method, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
    noteEl.textContent = `${note} — done.`;
    await fwRefresh();
  } catch (e) {
    noteEl.textContent = `Failed: ${e.message}`;
  }
}

function renderFirewall(fw) {
  const unconfigured = document.getElementById("fw-unconfigured");
  const body = document.getElementById("fw-body");
  if (!fw || !fw.ok) {
    unconfigured.hidden = false;
    unconfigured.textContent = fw && fw.error && fw.error !== "not configured"
      ? `Firewalla error: ${fw.error}`
      : "Not configured — add keys/firewalla.env to enable.";
    body.hidden = true;
    return;
  }
  unconfigured.hidden = true;
  body.hidden = false;
  lastFw = fw;

  const box = fw.box || {};
  document.getElementById("fw-box-name").textContent = box.name || "–";

  const devices = fw.devices || [];
  const rules = fw.rules || [];
  const devicesByMac = new Map(devices.map((d) => [(d.mac || d.id || "").toUpperCase(), d]));
  const online = devices.filter((d) => d.online).length;
  const activeRules = rules.filter((r) => r.status === "active");

  document.getElementById("fw-vitals").innerHTML = [
    vitalCard("Box", box.online ? "online" : "offline", `${esc(box.model || "")} · v${esc(box.version || "?")}`, box.online ? "ok" : "crit"),
    vitalCard("Devices", `${online}/${devices.length}`, "online / total", online === 0 && devices.length ? "warn" : "ok"),
    vitalCard("Rules", rules.length, `${activeRules.length} active`, "ok"),
    vitalCard("Alarms", box.alarmCount ?? 0, "open", (box.alarmCount || 0) > 0 ? "warn" : "ok"),
  ].join("");

  // active internet-block rules per device -- the exact shape the Block
  // button creates -- drive the per-row Block/Unblock toggle state.
  const blockedMacs = new Set(
    activeRules
      .filter((r) => (r.target || {}).type === "internet" && (r.scope || {}).type === "device")
      .map((r) => (r.scope.value || "").toUpperCase())
  );

  document.getElementById("fw-device-total").textContent = devices.length;
  document.getElementById("fw-device-count").textContent = online;

  const q = fwDeviceFilter.trim().toLowerCase();
  const filtered = q
    ? devices.filter((d) => [d.name, d.ip, d.mac].some((v) => (v || "").toLowerCase().includes(q)))
    : devices;
  const sorted = filtered.slice().sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  document.querySelector("#fw-devices-table tbody").innerHTML = sorted.slice(0, 300).map((d) => {
    const mac = (d.mac || d.id || "").toUpperCase();
    const blocked = blockedMacs.has(mac);
    return `<tr>
      <td>${esc(d.name || "(unnamed)")}<br><span class="mono-dim">${esc(mac)}</span></td>
      <td><code>${esc(d.ip || "–")}</code></td>
      <td><span class="pill" data-level="${d.online ? "ok" : "warn"}">${d.online ? "online" : "offline"}</span>${blocked ? ' <span class="pill" data-level="crit">blocked</span>' : ""}</td>
      <td>${blocked
        ? `<button class="row-btn" data-fw-unblock="${esc(mac)}">Unblock</button>`
        : `<button class="row-btn" data-danger="true" data-fw-block="${esc(mac)}">Block</button>`}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="4">no devices match</td></tr>`;

  document.getElementById("fw-rule-count").textContent = rules.length;
  document.querySelector("#fw-rules-table tbody").innerHTML = rules.map((r) => `<tr>
      <td>${esc(fwRuleLabel(r))}${r.action === "block" ? "" : ` <span class="mono-dim">(${esc(r.action)})</span>`}</td>
      <td class="mono-dim">${esc(fwScopeLabel(r, devicesByMac))}</td>
      <td><span class="pill" data-level="${r.status === "active" ? "ok" : "warn"}">${esc(r.status)}</span></td>
      <td>${r.status === "active"
        ? `<button class="row-btn" data-fw-pause="${esc(r.id)}">Pause</button>`
        : `<button class="row-btn" data-fw-resume="${esc(r.id)}">Resume</button>`}</td>
    </tr>`).join("") || `<tr><td colspan="4">no rules</td></tr>`;
}

async function fwRefresh() {
  try {
    const res = await fetch(`${FW_API}/status`, { cache: "no-store" });
    const data = await res.json();
    if (data.ok) renderFirewall(data);
  } catch (e) {
    // control service unreachable -- leave last-rendered state; the next
    // main poll (status.json, sysmon-collected) will retry on its own cadence
  }
}

document.getElementById("fw-device-search").addEventListener("input", (e) => {
  fwDeviceFilter = e.target.value;
  if (lastFw) renderFirewall(lastFw);
});

document.getElementById("fw-body").addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.fwPause) fwAction("POST", `rules/${encodeURIComponent(t.dataset.fwPause)}/pause`, "Pausing rule");
  else if (t.dataset.fwResume) fwAction("POST", `rules/${encodeURIComponent(t.dataset.fwResume)}/resume`, "Resuming rule");
  else if (t.dataset.fwBlock) {
    if (confirm(`Block all internet access for ${t.dataset.fwBlock}?`)) {
      fwAction("POST", `devices/${encodeURIComponent(t.dataset.fwBlock)}/block`, "Blocking device");
    }
  } else if (t.dataset.fwUnblock) {
    fwAction("POST", `devices/${encodeURIComponent(t.dataset.fwUnblock)}/unblock`, "Unblocking device");
  }
});

function setFresh(state, text) {
  freshEl.dataset.state = state;
  freshText.textContent = text;
}

function render(d) {
  board.hidden = false;
  document.getElementById("interval").textContent = d.collector_interval_s;
  pollMs = Math.max(5000, (d.collector_interval_s || 15) * 1000);
  renderVitals(d);
  renderHostInfo(d);
  renderCores(d);
  renderNetwork(d);
  renderServices(d);
  renderSecurity(d);
  renderPorts(d);
  renderTargets(d);
  renderFirewall(d.firewalla);
  updateFreshness(d.generated_at);
}

let lastGeneratedAt = null;
function updateFreshness(generatedAt) {
  lastGeneratedAt = generatedAt;
  const ageS = (Date.now() - new Date(generatedAt).getTime()) / 1000;
  if (ageS > pollMs / 1000 * 4) setFresh("stale", `stale &mdash; last update ${fmtAgo(generatedAt)}`);
  else setFresh("live", `updated ${fmtAgo(generatedAt)}`);
}

async function tick() {
  try {
    const res = await fetch(FEED, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data);
  } catch (e) {
    setFresh("down", `collector unreachable (${e.message})`);
  }
}

// keep the "Ns ago" freshness line moving between polls
setInterval(() => { if (lastGeneratedAt) updateFreshness(lastGeneratedAt); }, 1000);

tick();
pollTimer = setInterval(tick, pollMs);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") tick();
});
