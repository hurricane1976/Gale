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

function renderFullHosts(list) {
  const grid = document.getElementById("full-hosts-grid");
  if (!list || !list.length) {
    grid.innerHTML = `<p class="mini-note">No remote hosts configured &mdash; add one to FULL_TARGETS in sysmon.py.</p>`;
    return;
  }
  grid.innerHTML = list.map((t) => {
    if (t.health !== "up" || !t.stats) {
      return `<div class="full-host-card" data-health="down">
        <div class="full-host-head">
          <span class="full-host-name">${esc(t.name)}</span>
          <span class="pill" data-level="crit">unreachable</span>
          <span class="mono-dim">${esc(t.addr)}</span>
        </div>
        <p class="full-host-down">Collector not responding${t.error ? ` (${esc(t.error)})` : ""} &mdash; is it running on that machine? See <code>remote/${esc(t.platform || "")}/collector.py</code>.</p>
      </div>`;
    }
    const h = t.stats.host;
    const net = t.stats.network || { interfaces: [], listening_ports: [] };
    const cpuLvl = level(h.cpu_pct);
    const memLvl = level(h.mem.pct, 75, 92);
    const disk = (h.disks && h.disks[0]) || { pct: 0 };
    const diskLvl = level(disk.pct, 80, 93);

    const vitals = [
      vitalCard("CPU", `${h.cpu_pct}%`, h.load ? `load ${h.load.join(" / ")}` : `${h.cpu_count} cores`, cpuLvl, h.cpu_pct),
      vitalCard("Memory", `${h.mem.pct}%`, `${(h.mem.used_mb / 1024).toFixed(1)} / ${(h.mem.total_mb / 1024).toFixed(1)} GB`, memLvl, h.mem.pct),
      vitalCard("Disk", `${disk.pct}%`, disk.mount ? `${esc(disk.mount)} · ${disk.used_gb}/${disk.total_gb} GB` : "–", diskLvl, disk.pct),
      vitalCard("Uptime", fmtUptime(h.uptime_s), h.reboot_required ? "reboot required" : "no reboot pending", h.reboot_required ? "warn" : "ok"),
    ].join("");

    const netRows = (net.interfaces || []).map((i) => `<tr>
        <td><code>${esc(i.name)}</code></td>
        <td><code>${esc(i.ip)}</code></td>
        <td>${i.rx_mbps.toFixed(2)} Mb/s</td>
        <td>${i.tx_mbps.toFixed(2)} Mb/s</td>
      </tr>`).join("") || `<tr><td colspan="4">no interfaces reported</td></tr>`;

    const svcRows = (t.stats.services || []).map((s) => `<tr>
        <td><code>${esc(s.unit)}</code></td>
        <td><span class="pill" data-level="${s.state === "active" ? "ok" : "warn"}">${esc(s.state)}</span></td>
      </tr>`).join("") || `<tr><td colspan="2">none reported</td></tr>`;

    const sec = t.stats.security || {};
    const secLines = [
      ["Firewall", sec.firewall_active == null ? "unknown" : (sec.firewall_active ? "active" : "inactive"), sec.firewall_active === false],
      ["Defender", sec.defender_active == null ? "unknown" : (sec.defender_active ? "active" : "inactive"), sec.defender_active === false],
    ];

    return `<div class="full-host-card" data-health="up">
      <div class="full-host-head">
        <span class="full-host-name">${esc(t.name)}</span>
        <span class="pill" data-level="ok">up</span>
        <span class="mono-dim">${esc(t.addr)} · ${esc(h.os || "")} · ${t.latency_ms} ms</span>
      </div>
      <div class="vitals-grid">${vitals}</div>
      <div class="full-host-sub">
        <div>
          <h3 class="fw-subtitle">Network</h3>
          <table class="ops-table"><thead><tr><th>Interface</th><th>Address</th><th>Rx</th><th>Tx</th></tr></thead><tbody>${netRows}</tbody></table>
        </div>
        <div>
          <h3 class="fw-subtitle">Services &amp; security</h3>
          <table class="ops-table"><tbody>
            ${svcRows}
            ${secLines.map(([k, v, warn]) => `<tr><td>${esc(k)}</td><td><span class="pill" data-level="${warn ? "warn" : "ok"}">${esc(v)}</span></td></tr>`).join("")}
          </tbody></table>
        </div>
      </div>
    </div>`;
  }).join("");
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

  renderVpn(fw);
  renderFwLive(fw);
}

function fmtMbps(v) {
  if (v >= 100) return `${Math.round(v)} Mbps`;
  if (v >= 10) return `${v.toFixed(1)} Mbps`;
  return `${v.toFixed(2)} Mbps`;
}

function fmtBytes2(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
}

function renderFwLive(fw) {
  const live = fw.live || {};
  const body = document.getElementById("fw-live-body");
  if (!body) return;
  if (live.error) {
    document.getElementById("fw-live-vitals").innerHTML = "";
    document.getElementById("fw-live-note").textContent = `Live throughput unavailable: ${live.error}`;
    return;
  }
  document.getElementById("fw-live-vitals").innerHTML = [
    vitalCard("Download", fmtMbps(live.mbps_down || 0), `avg over ${(live.window_s || 900) / 60} min`, "ok"),
    vitalCard("Upload", fmtMbps(live.mbps_up || 0), `avg over ${(live.window_s || 900) / 60} min`, "ok"),
    vitalCard("Flows", `${live.truncated ? "≥ " : ""}${live.flows ?? 0}`, `opened in ${(live.window_s || 900) / 60} min`, "ok"),
    vitalCard("Throughput", fmtMbps(((live.mbps_down || 0) + (live.mbps_up || 0)) || 0), "combined", "ok"),
  ].join("");
  const talkers = live.top_talkers || [];
  const max = Math.max(...talkers.map((t) => t.bytes || 0), 1);
  document.querySelector("#fw-talkers-table tbody").innerHTML = talkers.map((t) => `<tr>
      <td>${esc(t.name)}</td>
      <td>${fmtBytes2(t.bytes || 0)}</td>
      <td style="width:42%"><div class="meter" data-level="ok"><i style="width:${((t.bytes || 0) / max * 100).toFixed(1)}%"></i></div></td>
    </tr>`).join("") || `<tr><td colspan="3">no flow records in the last 2h</td></tr>`;
  document.getElementById("fw-live-note").textContent =
    "Derived from completed flow records via the Firewalla MSP API — the export lags realtime by a few minutes and busy windows get capped, so treat these as recent averages ('≥' = truncated), not a live interface counter. True per-interface counters would need the box's local API (see the VPN note).";
}

function fmtAgoEpoch(ts) {
  if (!ts) return "–";
  return fmtAgo(new Date(ts * 1000).toISOString());
}

function fmtBytes(n) {
  if (!n) return "0 B";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`;
  return `${n} B`;
}

function renderVpn(fw) {
  const vpn = fw.vpn || {};
  const body = document.getElementById("fw-vpn-body");
  const profiles = vpn.profiles || [];
  const tunnels = vpn.tunnels || [];
  document.getElementById("fw-vpn-total").textContent = profiles.length;
  document.getElementById("fw-vpn-online").textContent = vpn.profiles_online || 0;
  const kindLabel = { "wireguard-peer": "WireGuard peer", "openvpn-profile": "OpenVPN" };
  document.querySelector("#fw-vpn-table tbody").innerHTML = profiles.map((p) => `<tr>
      <td>${esc(p.name)}</td>
      <td>${esc(kindLabel[p.kind] || p.kind)}</td>
      <td><span class="pill" data-level="${p.online ? "ok" : "warn"}">${p.online ? "connected" : "offline"}</span></td>
      <td><code>${esc(p.ip || "–")}</code></td>
      <td>&darr; ${fmtBytes(p.download_24h)} / &uarr; ${fmtBytes(p.upload_24h)}</td>
    </tr>`).join("") || `<tr><td colspan="5">no VPN profiles on the box</td></tr>`;
  document.querySelector("#fw-tunnel-table tbody").innerHTML = tunnels.map((t) => `<tr>
      <td>${esc(t.device)}</td>
      <td>${t.direction === "inbound" ? "&larr; inbound" : "&rarr; outbound"}</td>
      <td>${esc(t.protocol || "–")}</td>
      <td>${t.flows}</td>
      <td>${fmtBytes(t.bytes)}</td>
      <td>${fmtAgoEpoch(t.last_ts)}</td>
    </tr>`).join("") || `<tr><td colspan="6">no tunnel flows in the last 24h</td></tr>`;
  document.getElementById("fw-vpn-note").textContent = vpn.note || "";
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

function renderOllama(o) {
  const addrEl = document.getElementById("ollama-addr");
  const downEl = document.getElementById("ollama-down");
  const bodyEl = document.getElementById("ollama-body");
  if (!o || !o.reachable) {
    addrEl.textContent = "–";
    downEl.hidden = false;
    bodyEl.hidden = true;
    return;
  }
  addrEl.textContent = `${o.addr} · v${o.version || "?"}`;
  downEl.hidden = true;
  bodyEl.hidden = false;

  const loaded = o.loaded || [];
  const inv = o.inventory || [];
  const vramBytes = loaded.reduce((a, m) => a + (m.size_vram || 0), 0);
  document.getElementById("ollama-vitals").innerHTML = [
    vitalCard("Version", `v${esc(o.version)}`, esc(o.addr)),
    vitalCard("Loaded models", String(loaded.length), "resident in VRAM now"),
    vitalCard("VRAM committed", fmtBytes2(vramBytes), `${loaded.length} model${loaded.length === 1 ? "" : "s"} loaded`),
    vitalCard("Models available", String(inv.length), "inventory (/api/tags)"),
  ].join("");

  document.getElementById("ollama-loaded-count").textContent = loaded.length;
  document.querySelector("#ollama-loaded-table tbody").innerHTML =
    loaded.map((m) => `<tr>
      <td><code>${esc(m.name)}</code></td>
      <td class="mono-dim">${esc(m.params || "&ndash;")}</td>
      <td class="mono-dim">${esc(m.quant || "&ndash;")}</td>
      <td>${esc(m.vram_human || (m.size_vram ? fmtBytes2(m.size_vram) : "&ndash;"))}</td>
      <td class="mono-dim">${m.context ? m.context.toLocaleString() : "&ndash;"}</td>
      <td class="mono-dim">${m.expires_minutes == null ? "&ndash;" : `${m.expires_minutes}m`}</td>
    </tr>`).join("") || `<tr><td colspan="6" class="mono-dim">nothing loaded</td></tr>`;

  document.getElementById("ollama-inv-count").textContent = inv.length;
  document.querySelector("#ollama-inv-table tbody").innerHTML =
    inv.map((m) => `<tr>
      <td><code>${esc(m.name)}</code></td>
      <td class="mono-dim">${esc(m.params || "&ndash;")}</td>
      <td class="mono-dim">${esc(m.quant || "&ndash;")}</td>
      <td>${esc(m.size_human || "&ndash;")}</td>
      <td class="mono-dim">${(m.caps || []).join(", ") || "&ndash;"}</td>
    </tr>`).join("");
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
  renderFullHosts(d.full_targets);
  renderFirewall(d.firewalla);
  renderOllama(d.ollama);
  updateFreshness(d.generated_at);
}

let lastGeneratedAt = null;
function updateFreshness(generatedAt) {
  lastGeneratedAt = generatedAt;
  const ageS = (Date.now() - new Date(generatedAt).getTime()) / 1000;
  if (ageS > pollMs / 1000 * 4) setFresh("stale", `stale &mdash; last update ${fmtAgo(generatedAt)}`);
  else setFresh("live", `updated ${fmtAgo(generatedAt)}`);
}

const SEV_ORDER = { crit: 0, warn: 1, info: 2 };
const stripEl = document.getElementById("alert-strip");
const chipsEl = document.getElementById("alert-chips");
const CHIP_TARGETS = {
  disk: "sec-vitals", swap: "sec-vitals", cpu: "sec-vitals", load: "sec-vitals",
  ufw: "sec-security", reboot: "sec-security",
  service: "sec-services",
  agent: "fleet", errors: "fleet", wakeup: "fleet", quarantine: "fleet",
};

function hostAlerts(d) {
  const a = [];
  const h = d.host || {};
  for (const dk of h.disks || []) {
    const lvl = level(dk.pct, 80, 93);
    if (lvl !== "ok") a.push({ sev: lvl, kind: "disk", text: `disk ${dk.mount} at ${Math.round(dk.pct)}%` });
  }
  if (h.swap && h.swap.pct >= 10) a.push({ sev: "warn", kind: "swap", text: `swap ${Math.round(h.swap.pct)}% used` });
  const s = d.security || {};
  if (s.ufw_active === false) a.push({ sev: "warn", kind: "ufw", text: "ufw firewall inactive" });
  if (s.reboot_required) a.push({ sev: "warn", kind: "reboot", text: "reboot required" });
  for (const sv of d.services || []) {
    if (sv.state !== "active") a.push({ sev: "crit", kind: "service", text: `${sv.unit} ${sv.state}` });
  }
  return a;
}

async function fleetAlerts() {
  try {
    const res = await fetch("api/fleet/alerts", { cache: "no-store" });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.alerts || []).map((x) => ({ ...x, kind: String(x.kind || "").split("-")[0] || "fleet" }));
  } catch { return []; }
}

function renderAlertStrip(all) {
  all.sort((x, y) => (SEV_ORDER[x.sev] ?? 9) - (SEV_ORDER[y.sev] ?? 9));
  if (!all.length) { stripEl.hidden = true; return; }
  stripEl.hidden = false;
  chipsEl.innerHTML = all.map((a) =>
    `<button type="button" class="alert-chip alert-chip--${a.sev}" data-target="${CHIP_TARGETS[a.kind] || ""}" data-kind="${esc(a.kind)}" title="${esc(a.kind)}">
      <i class="alert-dot" aria-hidden="true"></i>
      <span class="alert-text">${esc(a.text)}</span>
    </button>`
  ).join("");
}

chipsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".alert-chip");
  if (!btn) return;
  const t = btn.dataset.target;
  if (t === "fleet") { window.location.href = "fleet.html"; return; }
  const el = document.getElementById(t);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
});

async function tick() {
  let data = null;
  try {
    const res = await fetch(FEED, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    render(data);
  } catch (e) {
    setFresh("down", `collector unreachable (${e.message})`);
  }
  const host = data ? hostAlerts(data) : [];
  const fleet = data ? await fleetAlerts() : [];
  renderAlertStrip([...fleet, ...host]);
  renderFleet24h();
}

/* ---- fleet activity (24h) — polls api/fleet/metrics, one card per host ---- */
const FLEET_FEED = "api/fleet/metrics";
const FLEET_TTL = 30000;
const FLEET_ORDER = ["gale", "tidal", "mountain", "beacon"];
const FLEET_META = {
  gale: { hue: "#ff8a3d", note: "fleet lead" },
  tidal: { hue: "#3fc7ff", note: "tidalwake.org" },
  mountain: { hue: "#8593f0", note: "mountainwake.org" },
  beacon: { hue: "#ffc233", note: "beaconwake.com" },
};
let fleetCache = { at: 0, data: null, err: null };

async function fetchFleet24h() {
  if (Date.now() - fleetCache.at < FLEET_TTL && (fleetCache.data || fleetCache.err)) {
    return { data: fleetCache.data, err: fleetCache.err };
  }
  try {
    const res = await fetch(FLEET_FEED, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fleetCache = { at: Date.now(), data: await res.json(), err: null };
  } catch (e) {
    fleetCache = { at: Date.now(), data: null, err: String(e.message || e) };
  }
  return { data: fleetCache.data, err: fleetCache.err };
}

function fleetAgo(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!Number.isFinite(s)) return "–";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fleetMoney(v) {
  if (v == null) return "–";
  if (v === 0) return "$0.00";
  return v < 10 ? `$${v.toFixed(2)}` : `$${v.toFixed(0)}`;
}

async function renderFleet24h() {
  const grid = document.getElementById("fleet-24h-grid");
  const fresh = document.getElementById("fleet-24h-fresh");
  if (!grid) return;
  const { data, err } = await fetchFleet24h();
  if (!data) {
    grid.innerHTML = `<p class="mini-note" style="grid-column:1/-1;color:var(--warn)">fleet metrics unreachable (${esc(err || "unknown")}) — see fleet.html</p>`;
    if (fresh) fresh.textContent = "";
    return;
  }
  const runs = data.runs_24h_by_host || {};
  const cost = data.cost_24h_by_host || {};
  const errs = data.error_runs_24h_by_host || {};
  const last = data.last_wake_by_host || {};
  const agents = data.agents_by_host || {};
  const strip = document.getElementById("fleet-live-strip");
  if (strip) {
    const sweep = data.fleet_status || {};
    const hostOf = {};
    Object.entries(agents).forEach(([h, arr]) => (arr || []).forEach((a) => { hostOf[String(a).toLowerCase()] = h; }));
    const perHost = {};
    FLEET_ORDER.forEach((h) => { perHost[h] = { up: 0, total: 0, down: 0 }; });
    Object.entries(sweep).forEach(([name, st]) => {
      const h = hostOf[String(name).toLowerCase()];
      if (!h || !perHost[h]) return;
      perHost[h].total += 1;
      if (st && st.state === "up") perHost[h].up += 1;
      else if (st && st.state === "down") perHost[h].down += 1;
      else perHost[h].up += 1;
    });
    strip.innerHTML = FLEET_ORDER.map((h) => {
      const p = perHost[h], n = (agents[h] || []).length;
      const lvl = p.down > 0 ? "crit" : p.total === 0 ? "idle" : p.up >= n && n > 0 ? "ok" : "warn";
      const label = p.total === 0 ? `${n} agents · no sweep yet` : `${p.up}/${Math.max(p.total, n)} up`;
      return `<span class="fleet-live-pill" data-level="${lvl}" title="${esc(h)}: ${esc(label)}">` +
        `<i class="fleet-live-dot" aria-hidden="true"></i>${esc(h)} <b>${esc(label)}</b></span>`;
    }).join("");
  }
  grid.innerHTML = FLEET_ORDER.map((h) => {
    const meta = FLEET_META[h] || { hue: "var(--text-faint)", note: "" };
    const r = runs[h] ?? null, c = cost[h] ?? null, e = errs[h] || 0;
    const agg = last[h] || null, n = (agents[h] || []).length;
    return `<article class="fleet-24h-card${e > 0 ? " has-err" : ""}" data-host="${esc(h)}" style="--fh:${meta.hue}">
      <header class="fleet-24h-head">
        <span class="fleet-24h-dot" aria-hidden="true"></span>
        <strong class="fleet-24h-name">${esc(h)}</strong>
        <span class="fleet-24h-note">${esc(meta.note)} · ${n} agents</span>
      </header>
      <div class="fleet-24h-stats">
        <div class="fleet-24h-stat"><span>${r == null ? "–" : r}</span><span class="fleet-24h-sub">runs 24h</span></div>
        <div class="fleet-24h-stat"><span>${fleetMoney(c)}</span><span class="fleet-24h-sub">cost 24h</span></div>
        <div class="fleet-24h-stat${e > 0 ? " err" : ""}"><span>${e > 0 ? `${e} err` : "0 err"}</span><span class="fleet-24h-sub">errors</span></div>
        <div class="fleet-24h-stat"><span>${agg ? esc(fleetAgo(agg)) : "–"}</span><span class="fleet-24h-sub">last wake</span></div>
      </div>
    </article>`;
  }).join("");
  if (fresh) {
    const gen = data.generated_at ? ` · metrics generated ${fleetAgo(data.generated_at)}` : "";
    fresh.textContent = `refreshes every 30s${gen}`;
  }
}

// keep the "Ns ago" freshness line moving between polls
setInterval(() => { if (lastGeneratedAt) updateFreshness(lastGeneratedAt); }, 1000);

tick();
pollTimer = setInterval(tick, pollMs);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") tick();
});
