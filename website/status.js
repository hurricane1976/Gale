/* GALE — ops status board: fetches website/../var/www/gale-api/status.json
   (served at /api/status.json) on an interval and renders it client-side.
   No framework, no build step — same house style as the rest of the site.
   This page's content is genuinely live-data-only (unlike index/fleet,
   which have a full static fallback); see the <noscript> notice. */
import { boot, esc, clamp, refreshEffects, REDUCED, setHTML, setText, patchList, signal, effect, tracedFetch, tweenText, morph, skeleton, setAmbientHealth, setStormIntensity, stormLevelFromHost } from "./shared.js";
import { statusPayload, metricsPayload, wakesPayload, asksPayload, validate } from "./payloads.js";

boot();

const FEED = "api/status.json";
const board = document.getElementById("board");
// skeleton screens (#6): shimmer until the first fetch renders
skeleton(document.getElementById("vitals-grid"), 4, 84);
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

/* Vital-card render wrapper (ROADMAP "animated tickers"): setHTML replaces
   every card node, so previous values are captured per label BEFORE the
   rewrite, then tweened on the fresh nodes. Non-numeric values (uptime,
   version strings) just set through. A card whose threshold level crossed
   ok -> warn/crit gets a one-shot pulse ring. */
const VITAL_NUM = /^(\D*?)(-?\d+(?:\.\d+)?)(\D*)$/s;

function renderVitalCards(grid, cardsHtml) {
  const prev = new Map();
  for (const card of grid.querySelectorAll(".vital")) {
    const val = card.querySelector(".vital-value");
    const m = val && String(val.textContent).match(VITAL_NUM);
    if (m) prev.set(card.dataset.vlabel, { num: parseFloat(m[2]), lvl: card.dataset.level });
  }
  setHTML(grid, cardsHtml);
  for (const card of grid.querySelectorAll(".vital")) {
    const val = card.querySelector(".vital-value");
    if (!val) continue;
    const p = prev.get(card.dataset.vlabel);
    tweenText(val, val.textContent, { from: p ? p.num : null });
    if (p && p.lvl !== card.dataset.level && card.dataset.level !== "ok") {
      card.classList.add("vital-pulse");
      card.addEventListener("animationend", () => card.classList.remove("vital-pulse"), { once: true });
    }
  }
}

function vitalCard(label, value, sub, lvl, pct) {
  return `<div class="vital" data-level="${lvl || "ok"}" data-vlabel="${esc(label)}">
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
  setText(document.getElementById("hostname"), h.hostname);
  renderVitalCards(document.getElementById("vitals-grid"), [
    vitalCard("CPU", `${h.cpu_pct}%`, `load ${h.load.join(" / ")}`, cpuLvl, h.cpu_pct),
    vitalCard("Memory", `${h.mem.pct}%`, `${(h.mem.used_mb / 1024).toFixed(1)} / ${(h.mem.total_mb / 1024).toFixed(1)} GB`, memLvl, h.mem.pct),
    vitalCard("Disk /", `${disk.pct}%`, `${disk.used_gb} / ${disk.total_gb} GB`, diskLvl, disk.pct),
    vitalCard("Swap", `${h.swap.pct}%`, `${(h.swap.used_mb / 1024).toFixed(2)} GB used`, h.swap.pct > 10 ? "warn" : "ok", h.swap.pct),
    vitalCard("Uptime", fmtUptime(h.uptime_s), h.reboot_required ? "reboot required" : "no reboot pending", h.reboot_required ? "warn" : "ok"),
    vitalCard("Load avg", h.load[0], `${h.cpu_count} cores &middot; 5m ${h.load[1]} &middot; 15m ${h.load[2]}`, loadLvl),
  ].join(""));
}

function renderHostInfo(d) {
  const h = d.host;
  setHTML(document.getElementById("host-info"), [
    ["OS", esc(h.os || "–")],
    ["Kernel", esc(h.kernel || "–")],
    ["Arch", esc(h.arch || "–")],
    ["Hostname", esc(h.hostname || "–")],
    ["Boot time", esc(h.boot_time || "–")],
    ["CPU pressure", esc(kernelLine(d, "cpu"))],
    ["IO pressure", esc(kernelLine(d, "io"))],
    ["OOM kills 24h", esc(kernelOom(d))],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join(""));
}
/* Kernel one-liners (#9): PSI avg10 or a dash when the collector predates
   the field / the source is missing. */
function kernelLine(d, res) {
  const p = (d.kernel && d.kernel.pressure) || {};
  const v = p[`${res}_some_avg10`];
  return v == null ? "–" : `${v.toFixed(2)}% stall (avg10)`;
}
function kernelOom(d) {
  const k = d.kernel;
  if (!k) return "–";
  return k.oom_kills_24h > 0 ? `${k.oom_kills_24h} (see strip)` : "0";
}

function renderCores(d) {
  const h = d.host;
  setText(document.getElementById("cpu-count"), String(h.cpu_count));
  patchList(document.getElementById("core-grid"), h.cpu_per_core
    .map((p, i) => ({
      key: `core-${i}`,
      html: `<div class="core" data-level="${level(p)}" title="core ${i}: ${p}%">
        <i style="height:${clamp(p, 0, 100).toFixed(0)}%"></i>
      </div>`,
    })));
}

function renderNetwork(d) {
  const n = d.network;
  const rows = n.interfaces
    .map(
      (i) => ({
        key: `if-${i.name}`,
        html: `<tr>
      <td><code>${esc(i.name)}</code></td>
      <td><code>${esc(i.ip)}</code></td>
      <td>${i.rx_mbps.toFixed(2)} Mb/s</td>
      <td>${i.tx_mbps.toFixed(2)} Mb/s</td>
      <td>${i.rx_total_gb.toFixed(1)} / ${i.tx_total_gb.toFixed(1)} GB</td>
    </tr>`,
      })
    );
  patchList(document.querySelector("#net-table tbody"), rows.length ? rows :
    [{ key: "empty", html: `<tr><td colspan="5">no interfaces reported</td></tr>` }]);
  const ts = n.tailscale;
  setText(document.getElementById("tailscale-line"), ts && ts.ok
    ? `Tailscale: ${ts.backend_state} · self ${ts.self_ip} · ${ts.peers_online}/${ts.peers_total} tailnet peers online`
    : "Tailscale: status unavailable");
}

const fmtMem = (b) => b == null ? "–"
  : b >= 1073741824 ? `${(b / 1073741824).toFixed(2)} GB`
  : b >= 1048576 ? `${(b / 1048576).toFixed(0)} MB` : `${Math.round(b / 1024)} KB`;
function renderServices(d) {
  const rows = d.services
    .map((s) => {
      const ok = s.state === "active";
      const flapping = (s.n_restarts ?? 0) > 2;
      return {
        key: `svc-${s.unit}`,
        html: `<tr>
      <td><code>${esc(s.unit)}</code></td>
      <td><span class="pill" data-level="${ok ? "ok" : "crit"}">${esc(s.state)}</span></td>
      <td class="mono-dim"${flapping ? ' style="color:var(--warn)"' : ""}>${s.n_restarts ?? "–"}</td>
      <td class="mono-dim">${fmtMem(s.memory_bytes)}</td>
      <td class="mono-dim">${esc(s.since || "&ndash;")}</td>
    </tr>`,
      };
    });
  patchList(document.querySelector("#services-table tbody"), rows);
}

/* Hardware telemetry (improvements #7): thermal zones + hwmon temps/fans
   from sysmon collect_hardware(). Missing block = collector predates the
   field; render a one-row note instead of failing the board. */
const tempLevel = (c) => c >= 85 ? "crit" : c >= 70 ? "warn" : "ok";
function renderHardware(d) {
  const hw = d.hardware;
  const tbody = document.querySelector("#hardware-table tbody");
  if (!hw) {
    setText(document.getElementById("hardware-hottest"), "unavailable");
    patchList(tbody, [{ key: "na", html: `<tr><td colspan="2">hardware telemetry unavailable (collector update pending)</td></tr>` }]);
    setText(document.getElementById("hardware-nvme"), "");
    return;
  }
  const rows = [];
  for (const z of hw.thermal_zones || []) {
    rows.push({ key: `tz-${z.zone}`, html: `<tr><td><code>${esc(z.type || z.zone)}</code></td><td><span class="pill" data-level="${tempLevel(z.temp_c)}">${z.temp_c.toFixed(1)} °C</span></td></tr>` });
  }
  for (const s of hw.sensors || []) {
    rows.push({ key: `hw-${s.chip}-${s.label}`, html: `<tr><td><code>${esc(s.chip)}${s.label ? ` · ${esc(s.label)}` : ""}</code></td><td><span class="pill" data-level="${tempLevel(s.temp_c)}">${s.temp_c.toFixed(1)} °C</span></td></tr>` });
  }
  for (const f of hw.fans || []) {
    rows.push({ key: `fan-${f.chip}-${f.fan}`, html: `<tr><td><code>${esc(f.chip)} · ${esc(f.fan)}</code></td><td class="mono-dim">${f.rpm} RPM</td></tr>` });
  }
  patchList(tbody, rows.length ? rows :
    [{ key: "empty", html: `<tr><td colspan="2">no sensors reported</td></tr>` }]);
  const hot = hw.hottest_c;
  setText(document.getElementById("hardware-hottest"),
    hot != null ? `hottest ${hot.toFixed(1)} °C` : "no temp sensors");
  const nv = hw.nvme;
  setText(document.getElementById("hardware-nvme"), nv
    ? `NVMe ${nv.temp_c != null ? `${nv.temp_c} °C · ` : ""}used ${nv.used_pct ?? "–"}% · spare ${nv.spare_pct ?? "–"}%${nv.power_on_hours != null ? ` · ${nv.power_on_hours} power-on h` : ""}`
    : "");
}
/* Hygiene panel (#10): TLS cert runway + backup age. Dashes when the
   collector predates the field or the source is unreadable. */
function renderHygiene(d) {
  const el = document.getElementById("hygiene-info");
  if (!el) return;
  const h = d.hygiene || {};
  const cert = h.cert_days_left == null ? "–"
    : `${Math.floor(h.cert_days_left)}d left (${esc(h.cert_path ? h.cert_path.split("/").pop() : "cert")})`;
  const bak = h.backup_age_h == null ? "–"
    : h.backup_age_h < 1 ? `${Math.round(h.backup_age_h * 60)}m ago` :
      h.backup_age_h < 48 ? `${h.backup_age_h.toFixed(1)}h ago` : `${(h.backup_age_h / 24).toFixed(1)}d ago`;
  const drill = h.drill_ok == null ? "–"
    : h.drill_ok ? `ok ${h.drill_age_h != null ? `· ${h.drill_age_h < 48 ? h.drill_age_h.toFixed(0) + "h" : (h.drill_age_h / 24).toFixed(1) + "d"} ago` : ""}`.trim()
    : "FAILED (see agora)";
  setHTML(el, [
    ["TLS cert", cert],
    ["Last backup", h.backup_name ? `${bak} · <code>${esc(h.backup_name)}</code>` : bak],
    ["Restore drill", drill],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join(""));
}
function renderSecurity(d) {
  const s = d.security;
  const yn = (v, warnIfTrue) =>
    v === null || v === undefined
      ? `<span class="pill" data-level="warn">unknown</span>`
      : `<span class="pill" data-level="${(warnIfTrue ? v : !v) ? "warn" : "ok"}">${v ? "yes" : "no"}</span>`;
  setHTML(document.getElementById("security-info"), [
    ["UFW firewall active", yn(s.ufw_active, false)],
    ["Reboot required", yn(s.reboot_required, true)],
    ["Unattended upgrades", `<span class="pill" data-level="${s.unattended_upgrades === "enabled" ? "ok" : "warn"}">${esc(s.unattended_upgrades)}</span>`],
    ["Sudoers drop-in present", yn(s.sudoers_dropin, false)],
    ["Sudoers unchanged", driftState(d)],
    ["Secrets locked down", driftPerms(d)],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join(""));
}
/* Drift readouts (#19): reuse the pill language of the panel. */
function driftState(d) {
  const c = (d.drift || {}).sudoers_changed;
  return c == null ? `<span class="pill" data-level="warn">unknown</span>`
    : `<span class="pill" data-level="${c ? "warn" : "ok"}">${c ? "CHANGED" : "unchanged"}</span>`;
}
function driftPerms(d) {
  const issues = (d.drift || {}).perm_issues || [];
  return issues.length
    ? `<span class="pill" data-level="crit">${issues.length} exposed</span>`
    : `<span class="pill" data-level="ok">locked down</span>`;
}

let portsExpanded = false;
function renderPorts(d) {
  const ports = d.network.listening_ports;
  const labeled = ports.filter((p) => p.label);
  const other = ports.filter((p) => !p.label);
  const row = (p) => ({
    key: `port-${String(p.port)}`,
    html: `<tr>
      <td><code>${esc(String(p.port))}</code></td>
      <td><code>${esc(p.proc)}</code></td>
      <td>${p.label ? `<span class="pill" data-level="ok">${esc(p.label)}</span>` : `<span class="mono-dim">&ndash;</span>`}</td>
      <td class="mono-dim">${p.addrs.map(esc).join(", ")}</td>
    </tr>`,
  });
  const toggle = document.getElementById("ports-toggle");
  const shown = labeled.concat(portsExpanded ? other : []);
  patchList(document.querySelector("#ports-table tbody"), shown.map(row));
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
  patchList(document.getElementById("targets-grid"), d.targets
    .map((t) => {
      const lvl = HEALTH_LEVEL[t.health] || "warn";
      const lat = t.latency_ms != null ? `${t.latency_ms} ms` : "&ndash;";
      return {
        key: `target-${t.name}`,
        html: `<div class="target-card" data-level="${lvl}">
        <div class="target-top">
          <span class="target-name">${esc(t.name)}</span>
          <span class="pill" data-level="${lvl}">${esc(HEALTH_LABEL[t.health] || t.health)}</span>
        </div>
        <div class="mono-dim">${esc(t.addr)} &middot; ${esc(t.kind)}</div>
        <div class="mono-dim">latency ${lat}${t.reported_name ? ` &middot; reports as ${esc(t.reported_name)}` : ""}</div>
      </div>`,
      };
    }));
}

function renderFullHosts(list) {
  const grid = document.getElementById("full-hosts-grid");
  if (!list || !list.length) {
    setHTML(grid, `<p class="mini-note">No remote hosts configured &mdash; add one to FULL_TARGETS in sysmon.py.</p>`);
    return;
  }
  setHTML(grid, list.map((t) => {
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
          <div class="table-scroll"><table class="ops-table"><thead><tr><th>Interface</th><th>Address</th><th>Rx</th><th>Tx</th></tr></thead><tbody>${netRows}</tbody></table></div>
        </div>
        <div>
          <h3 class="fw-subtitle">Services &amp; security</h3>
          <div class="table-scroll"><table class="ops-table"><tbody>
            ${svcRows}
            ${secLines.map(([k, v, warn]) => `<tr><td>${esc(k)}</td><td><span class="pill" data-level="${warn ? "warn" : "ok"}">${esc(v)}</span></td></tr>`).join("")}
          </tbody></table></div>
        </div>
      </div>
    </div>`;
  }).join(""));
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
  setText(noteEl, `${note}...`);
  try {
    const res = await fetch(`${FW_API}/${path}`, { method, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
    setText(noteEl, `${note} — done.`);
    await fwRefresh();
  } catch (e) {
    setText(noteEl, `Failed: ${e.message}`);
  }
}

function renderFirewall(fw) {
  const unconfigured = document.getElementById("fw-unconfigured");
  const body = document.getElementById("fw-body");
  if (!fw || !fw.ok) {
    unconfigured.hidden = false;
    setText(unconfigured, fw && fw.error && fw.error !== "not configured"
      ? `Firewalla error: ${fw.error}`
      : "Not configured — add keys/firewalla.env to enable.");
    body.hidden = true;
    return;
  }
  unconfigured.hidden = true;
  body.hidden = false;
  lastFw = fw;

  const box = fw.box || {};
  setText(document.getElementById("fw-box-name"), box.name || "–");

  const devices = fw.devices || [];
  const rules = fw.rules || [];
  const devicesByMac = new Map(devices.map((d) => [(d.mac || d.id || "").toUpperCase(), d]));
  const online = devices.filter((d) => d.online).length;
  const activeRules = rules.filter((r) => r.status === "active");

  renderVitalCards(document.getElementById("fw-vitals"), [
    vitalCard("Box", box.online ? "online" : "offline", `${esc(box.model || "")} · v${esc(box.version || "?")}`, box.online ? "ok" : "crit"),
    vitalCard("Devices", `${online}/${devices.length}`, "online / total", online === 0 && devices.length ? "warn" : "ok"),
    vitalCard("Rules", rules.length, `${activeRules.length} active`, "ok"),
    vitalCard("Alarms", box.alarmCount ?? 0, "open", (box.alarmCount || 0) > 0 ? "warn" : "ok"),
  ].join(""));

  // active internet-block rules per device -- the exact shape the Block
  // button creates -- drive the per-row Block/Unblock toggle state.
  const blockedMacs = new Set(
    activeRules
      .filter((r) => (r.target || {}).type === "internet" && (r.scope || {}).type === "device")
      .map((r) => (r.scope.value || "").toUpperCase())
  );

  setText(document.getElementById("fw-device-total"), String(devices.length));
  setText(document.getElementById("fw-device-count"), String(online));

  const q = fwDeviceFilter.trim().toLowerCase();
  const filtered = q
    ? devices.filter((d) => [d.name, d.ip, d.mac].some((v) => (v || "").toLowerCase().includes(q)))
    : devices;
  const sorted = filtered.slice().sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));

  const devRows = sorted.slice(0, 300).map((d) => {
    const mac = (d.mac || d.id || "").toUpperCase();
    const blocked = blockedMacs.has(mac);
    return {
      key: `dev-${mac || d.ip || d.name}`,
      html: `<tr>
      <td>${esc(d.name || "(unnamed)")}<br><span class="mono-dim">${esc(mac)}</span></td>
      <td><code>${esc(d.ip || "–")}</code></td>
      <td><span class="pill" data-level="${d.online ? "ok" : "warn"}">${d.online ? "online" : "offline"}</span>${blocked ? ' <span class="pill" data-level="crit">blocked</span>' : ""}</td>
      <td>${blocked
        ? `<button class="row-btn" data-fw-unblock="${esc(mac)}">Unblock</button>`
        : `<button class="row-btn" data-danger="true" data-fw-block="${esc(mac)}">Block</button>`}</td>
    </tr>`,
    };
  });
  patchList(document.querySelector("#fw-devices-table tbody"), devRows.length ? devRows :
    [{ key: "empty", html: `<tr><td colspan="4">no devices match</td></tr>` }]);

  setText(document.getElementById("fw-rule-count"), String(rules.length));
  patchList(document.querySelector("#fw-rules-table tbody"), rules.length ? rules.map((r) => ({
    key: `rule-${r.id}`,
    html: `<tr>
      <td>${esc(fwRuleLabel(r))}${r.action === "block" ? "" : ` <span class="mono-dim">(${esc(r.action)})</span>`}</td>
      <td class="mono-dim">${esc(fwScopeLabel(r, devicesByMac))}</td>
      <td><span class="pill" data-level="${r.status === "active" ? "ok" : "warn"}">${esc(r.status)}</span></td>
      <td>${r.status === "active"
        ? `<button class="row-btn" data-fw-pause="${esc(r.id)}">Pause</button>`
        : `<button class="row-btn" data-fw-resume="${esc(r.id)}">Resume</button>`}</td>
    </tr>`,
  })) : [{ key: "empty", html: `<tr><td colspan="4">no rules</td></tr>` }]);

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

/* Top talkers · 24h (item: bandwidth history): sysmon samples the MSP
   flow-based talkers once per Firewalla cycle into a JSONL, aggregates
   24h into 2h buckets, and ships {buckets, totals_24h} on fw.talkers_history.
   Stacked as cumulative series (gale-sparkline draws overlays, so stacking
   is done by summing the series bottom-up before handing them over). */
const TALKER_PALETTE = ["#ff8a3d", "#3fc7ff", "#8593f0", "#ffc233", "#4fd1a5", "#e8482c", "#b58cff", "#7fd1ff"];

function renderTalkersHistory(th) {
  const chart = document.getElementById("fw-talkers-chart");
  const noteEl = document.getElementById("fw-talkers-note");
  if (!chart || !noteEl) return;
  const buckets = (th && th.buckets) || [];
  const totals = (th && th.totals_24h) || [];
  if (!buckets.length || !totals.length) {
    chart.update && chart.update([[]]);
    setText(noteEl, "gathering talker history — one sample per firewalla poll (~11 min)");
    return;
  }
  const topNames = totals.slice(0, 8).map(([n]) => n);
  const series = topNames.map((name) => buckets.map((b) => (b.devices[name] || 0) / 1e9));
  /* stack: cumulative from the bottom series up */
  const stacked = series.map((_, si) => buckets.map((_, bi) =>
    series.reduce((acc, s, sj) => (sj <= si ? acc + s[bi] : acc), 0)));
  if (typeof chart.update !== "function") return; /* test-stub element */
  chart.update(stacked, topNames.map((n, i) => ({
    color: TALKER_PALETTE[i % TALKER_PALETTE.length],
    fill: `color-mix(in srgb, ${TALKER_PALETTE[i % TALKER_PALETTE.length]} 22%, transparent)`,
    width: 1,
  })));
  setHTML(noteEl, totals.slice(0, 8).map(([n, b], i) =>
    `<span style="color:${TALKER_PALETTE[i % TALKER_PALETTE.length]}">&#9632;</span> ${esc(n)} ${fmtBytes(b)}`).join(" · ")
    + ` &middot; ${buckets.length} buckets @ ${th.bucket_hours}h`);
}

function renderFwLive(fw) {
  const live = fw.live || {};
  const body = document.getElementById("fw-live-body");
  if (!body) return;
  if (live.error) {
    setHTML(document.getElementById("fw-live-vitals"), "");
    setText(document.getElementById("fw-live-note"), `Live throughput unavailable: ${live.error}`);
    return;
  }
  renderVitalCards(document.getElementById("fw-live-vitals"), [
    vitalCard("Download", fmtMbps(live.mbps_down || 0), `avg over ${(live.window_s || 900) / 60} min`, "ok"),
    vitalCard("Upload", fmtMbps(live.mbps_up || 0), `avg over ${(live.window_s || 900) / 60} min`, "ok"),
    vitalCard("Flows", `${live.truncated ? "≥ " : ""}${live.flows ?? 0}`, `opened in ${(live.window_s || 900) / 60} min`, "ok"),
    vitalCard("Throughput", fmtMbps(((live.mbps_down || 0) + (live.mbps_up || 0)) || 0), "combined", "ok"),
  ].join(""));
  const talkers = live.top_talkers || [];
  const max = Math.max(...talkers.map((t) => t.bytes || 0), 1);
  patchList(document.querySelector("#fw-talkers-table tbody"), talkers.length ? talkers.map((t) => ({
    key: `talker-${t.name}-${t.bytes || 0}`,
    html: `<tr>
      <td>${esc(t.name)}</td>
      <td>${fmtBytes2(t.bytes || 0)}</td>
      <td style="width:42%"><div class="meter" data-level="ok"><i style="width:${((t.bytes || 0) / max * 100).toFixed(1)}%"></i></div></td>
    </tr>`,
  })) : [{ key: "empty", html: `<tr><td colspan="3">no flow records in the last 2h</td></tr>` }]);
  renderTalkersHistory(fw.talkers_history);
  setText(document.getElementById("fw-live-note"),
    "Derived from completed flow records via the Firewalla MSP API — the export lags realtime by a few minutes and busy windows get capped, so treat these as recent averages ('≥' = truncated), not a live interface counter. True per-interface counters would need the box's local API (see the VPN note).");
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
  setText(document.getElementById("fw-vpn-total"), String(profiles.length));
  setText(document.getElementById("fw-vpn-online"), String(vpn.profiles_online || 0));
  const kindLabel = { "wireguard-peer": "WireGuard peer", "openvpn-profile": "OpenVPN" };
  patchList(document.querySelector("#fw-vpn-table tbody"), profiles.length ? profiles.map((p) => ({
    key: `vpn-${p.name}`,
    html: `<tr>
      <td>${esc(p.name)}</td>
      <td>${esc(kindLabel[p.kind] || p.kind)}</td>
      <td><span class="pill" data-level="${p.online ? "ok" : "warn"}">${p.online ? "connected" : "offline"}</span></td>
      <td><code>${esc(p.ip || "–")}</code></td>
      <td>&darr; ${fmtBytes(p.download_24h)} / &uarr; ${fmtBytes(p.upload_24h)}</td>
    </tr>`,
  })) : [{ key: "empty", html: `<tr><td colspan="5">no VPN profiles on the box</td></tr>` }]);
  patchList(document.querySelector("#fw-tunnel-table tbody"), tunnels.length ? tunnels.map((t) => ({
    key: `tun-${t.device}-${t.last_ts}`,
    html: `<tr>
      <td>${esc(t.device)}</td>
      <td>${t.direction === "inbound" ? "&larr; inbound" : "&rarr; outbound"}</td>
      <td>${esc(t.protocol || "–")}</td>
      <td>${t.flows}</td>
      <td>${fmtBytes(t.bytes)}</td>
      <td>${fmtAgoEpoch(t.last_ts)}</td>
    </tr>`,
  })) : [{ key: "empty", html: `<tr><td colspan="6">no tunnel flows in the last 24h</td></tr>` }]);
  setText(document.getElementById("fw-vpn-note"), vpn.note || "");
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

/* Freshness is a signal, not a function: every writer (render, SSE, the
   1s "Ns ago" ticker, the unreachable path) just sets state, and one
   effect applies it to the DOM via setText's identity diffing. This is the
   ROADMAP #9 integration point -- the 1s ticker used to rewrite
   textContent unconditionally. */
const [freshView, setFreshView] = signal({ state: "boot", text: "" });
function setFresh(state, text) { setFreshView({ state, text }); }
effect(() => {
  const f = freshView();
  if (!freshEl || !freshEl.isConnected) return;
  freshEl.dataset.state = f.state;
  setText(freshText, f.text);
});

function renderOllama(o) {
  const addrEl = document.getElementById("ollama-addr");
  const downEl = document.getElementById("ollama-down");
  const bodyEl = document.getElementById("ollama-body");
  if (!o || !o.reachable) {
    setText(addrEl, "–");
    downEl.hidden = false;
    bodyEl.hidden = true;
    return;
  }
  setText(addrEl, `${o.addr} · v${o.version || "?"}`);
  downEl.hidden = true;
  bodyEl.hidden = false;

  const loaded = o.loaded || [];
  const inv = o.inventory || [];
  const vramBytes = loaded.reduce((a, m) => a + (m.size_vram || 0), 0);
  renderVitalCards(document.getElementById("ollama-vitals"), [
    vitalCard("Version", `v${esc(o.version)}`, esc(o.addr)),
    vitalCard("Loaded models", String(loaded.length), "resident in VRAM now"),
    vitalCard("VRAM committed", fmtBytes2(vramBytes), `${loaded.length} model${loaded.length === 1 ? "" : "s"} loaded`),
    vitalCard("Models available", String(inv.length), "inventory (/api/tags)"),
  ].join(""));

  setText(document.getElementById("ollama-loaded-count"), String(loaded.length));
  patchList(document.querySelector("#ollama-loaded-table tbody"),
    loaded.length ? loaded.map((m) => ({
      key: `ol-${m.name}`,
      html: `<tr>
      <td><code>${esc(m.name)}</code></td>
      <td class="mono-dim">${esc(m.params || "&ndash;")}</td>
      <td class="mono-dim">${esc(m.quant || "&ndash;")}</td>
      <td>${esc(m.vram_human || (m.size_vram ? fmtBytes2(m.size_vram) : "&ndash;"))}</td>
      <td class="mono-dim">${m.context ? m.context.toLocaleString() : "&ndash;"}</td>
      <td class="mono-dim">${m.expires_minutes == null ? "&ndash;" : `${m.expires_minutes}m`}</td>
    </tr>`,
    })) : [{ key: "empty", html: `<tr><td colspan="6" class="mono-dim">nothing loaded</td></tr>` }]);

  setText(document.getElementById("ollama-inv-count"), String(inv.length));
  patchList(document.querySelector("#ollama-inv-table tbody"),
    inv.map((m) => ({
      key: `inv-${m.name}`,
      html: `<tr>
      <td><code>${esc(m.name)}</code></td>
      <td class="mono-dim">${esc(m.params || "&ndash;")}</td>
      <td class="mono-dim">${esc(m.quant || "&ndash;")}</td>
      <td class="mono-dim">${esc(m.size_human || "&ndash;")}</td>
      <td class="mono-dim">${(m.caps || []).join(", ") || "&ndash;"}</td>
    </tr>`,
    })));
  refreshOllamaGpu(o);
}

export function render(d) {
  // Data morph (#6): value changes cross-fade via View Transition; identical
  // pixels animate nothing, so steady ticks stay quiet. Timer/poll setup
  // stays outside the transition (not DOM content).
  board.hidden = false;
  setText(document.getElementById("interval"), String(d.collector_interval_s));
  pollMs = Math.max(5000, (d.collector_interval_s || 15) * 1000);
  if (pollTimer) { clearInterval(pollTimer); pollTimer = setInterval(tick, pollMs); }
  morph(() => {
    renderVitals(d);
    renderHostInfo(d);
    renderCores(d);
    renderHardware(d);
    renderNetwork(d);
  renderServices(d);
  renderSecurity(d);
  renderHygiene(d);
    renderPorts(d);
    renderTargets(d);
    renderFullHosts(d.full_targets);
    renderUptime(d.uptime_history);
    renderFirewall(d.firewalla);
    renderOllama(d.ollama);
    renderDiskForecast(d);
    updateFreshness(d.generated_at);
  });
}

let lastGeneratedAt = null;
function updateFreshness(generatedAt) {
  lastGeneratedAt = generatedAt;
  const ageS = (Date.now() - new Date(generatedAt).getTime()) / 1000;
  if (ageS > pollMs / 1000 * 4) setFresh("stale", `stale — last update ${fmtAgo(generatedAt)}`);
  else setFresh("live", `updated ${fmtAgo(generatedAt)}`);
}

const SEV_ORDER = { crit: 0, warn: 1, info: 2 };
const stripEl = document.getElementById("alert-strip");
const chipsEl = document.getElementById("alert-chips");
const CHIP_TARGETS = {
  disk: "sec-vitals", swap: "sec-vitals", cpu: "sec-vitals", load: "sec-vitals",
  ufw: "sec-security", reboot: "sec-security",
  service: "sec-services", temp: "sec-hardware", cert: "sec-hygiene", backup: "sec-hygiene",
  node: "sec-fleet-24h",
  agent: "fleet.html#hosts", errors: "fleet.html#hosts",
  cost: "fleet.html#cost-trend",
  wakeup: "fleet.html#activity", quarantine: "fleet.html#activity",
  ollama: "ollama.html",
};

function hostAlerts(d) {
  const a = [];
  const h = d.host || {};
  for (const dk of h.disks || []) {
    const lvl = level(dk.pct, 80, 93);
    if (lvl !== "ok") a.push({ sev: lvl, kind: "disk", text: `disk ${dk.mount} at ${Math.round(dk.pct)}%` });
  }
  /* predictive disk forecast (item: capacity forecasting) — same honesty
     gate as the note: a 2-sample regression can claim "full in 4d" from
     noise, so no alert until >= 3 samples spanning >= 3 days. */
  for (const f of h.disk_forecast || []) {
    if (f.days_to_full == null) continue;
    if (f.samples < 3 || (f.span_days || 0) < 3) continue;
    const sev = f.days_to_full < 7 ? "crit" : f.days_to_full < 30 ? "warn" : null;
    if (sev) a.push({ sev, kind: "disk", text: `${f.mount === "mem" ? "RAM" : f.mount === "swap" ? "swap" : "disk " + f.mount} full in ~${Math.round(f.days_to_full)}d` });
  }
  if (h.swap && h.swap.pct >= 10) a.push({ sev: "warn", kind: "swap", text: `swap ${Math.round(h.swap.pct)}% used` });
  /* hardware alerts (#7/#10): hottest sensor + NVMe wear feed the same
     strip as everything else -- one pipeline, no side channels. */
  const hw = d.hardware || {};
  if (hw.hottest_c != null) {
    if (hw.hottest_c >= 90) a.push({ sev: "crit", kind: "temp", text: `hottest sensor ${hw.hottest_c.toFixed(0)} °C` });
    else if (hw.hottest_c >= 80) a.push({ sev: "warn", kind: "temp", text: `hottest sensor ${hw.hottest_c.toFixed(0)} °C` });
  }
  if (hw.nvme && hw.nvme.used_pct != null && hw.nvme.used_pct >= 80) {
    a.push({ sev: hw.nvme.used_pct >= 90 ? "crit" : "warn", kind: "disk",
             text: `NVMe wear ${hw.nvme.used_pct}% used` });
  }
  for (const sv of d.services || []) {
    if ((sv.n_restarts ?? 0) > 5) a.push({ sev: "warn", kind: "service", text: `${sv.unit} restarted ${sv.n_restarts}x` });
  }
  /* kernel distress (#9): OOM is crit, sustained pressure stalls warn,
     fresh kernel err lines warn with the newest first. */
  const k = d.kernel || {};
  if ((k.oom_kills_24h || 0) > 0) a.push({ sev: "crit", kind: "kernel", text: `OOM killer fired ${k.oom_kills_24h}x in 24h` });
  const p = k.pressure || {};
  for (const [res, th] of [["cpu", 30], ["memory", 30], ["io", 50]]) {
    const v = p[`${res}_some_avg10`];
    if (v != null && v >= th) a.push({ sev: "warn", kind: "kernel", text: `${res} pressure stall ${v.toFixed(1)}% (avg10)` });
  }
  if ((k.klog_err_24h || 0) > 0) {
    const tail = (k.klog_tail || []).slice(-1)[0];
    a.push({ sev: "warn", kind: "kernel", text: `${k.klog_err_24h} kernel err in 24h${tail ? `: ${tail.slice(0, 100)}` : ""}` });
  }
  /* hygiene (#10): cert runway 21d warn / 7d crit; backup silence 48h
     warn / 7d crit. Quiet boxes stay quiet -- both read "ok" today. */
  const hy = d.hygiene || {};
  if (hy.cert_days_left != null) {
    if (hy.cert_days_left < 7) a.push({ sev: "crit", kind: "cert", text: `TLS cert expires in ${Math.floor(hy.cert_days_left)}d` });
    else if (hy.cert_days_left < 21) a.push({ sev: "warn", kind: "cert", text: `TLS cert expires in ${Math.floor(hy.cert_days_left)}d` });
  }
  if (hy.backup_age_h != null) {
    if (hy.backup_age_h > 168) a.push({ sev: "crit", kind: "backup", text: `no backup in ${(hy.backup_age_h / 24).toFixed(1)}d` });
    else if (hy.backup_age_h > 48) a.push({ sev: "warn", kind: "backup", text: `no backup in ${hy.backup_age_h.toFixed(0)}h` });
  }
  /* restore drill (#15): failed drill is crit; silence is warn/crit on the
     monthly cadence (45d/90d). No drill file yet = no alert (grace). */
  if (hy.drill_ok === false) a.push({ sev: "crit", kind: "backup", text: "restore drill FAILED (see agora)" });
  else if (hy.drill_age_h != null) {
    if (hy.drill_age_h > 2160) a.push({ sev: "crit", kind: "backup", text: `no restore drill in ${(hy.drill_age_h / 24).toFixed(0)}d` });
    else if (hy.drill_age_h > 1080) a.push({ sev: "warn", kind: "backup", text: `no restore drill in ${(hy.drill_age_h / 24).toFixed(0)}d` });
  }
  const s = d.security || {};
  if (s.ufw_active === false) a.push({ sev: "warn", kind: "ufw", text: "ufw firewall inactive" });
  if (s.reboot_required) a.push({ sev: "warn", kind: "reboot", text: "reboot required" });
  /* secret/config drift (#19): exposure is crit, sudoers change + token
     age are warn (both can be legit -- the chip tells you to look). */
  const dr = d.drift || {};
  for (const issue of dr.perm_issues || []) {
    a.push({ sev: "crit", kind: "drift", text: `secret exposed: ${issue}` });
  }
  if (dr.sudoers_changed) a.push({ sev: "warn", kind: "drift", text: "sudoers drop-in changed since baseline" });
  if (dr.token_age_d != null && dr.token_age_d > 365) {
    a.push({ sev: "warn", kind: "drift", text: `telegram token age ${Math.floor(dr.token_age_d)}d -- rotate?` });
  }
  for (const sv of d.services || []) {
    if (sv.state !== "active") a.push({ sev: "crit", kind: "service", text: `${sv.unit} ${sv.state}` });
  }
  // ollama down/up (the collector probes /api/version; "up but slow" is the
  // ollama page's diagnostics panel's job — this is binary reachability)
  const o = d.ollama || {};
  if (o.reachable === false) a.push({ sev: "crit", kind: "ollama", text: "ollama unreachable" });
  return a;
}

// Last alerts array pushed via SSE (null = no push yet, so tick() fetches).
let liveFleetAlerts = null;
// Last successful status board payload, so the SSE push path can recompute
// host-derived alerts without re-fetching.
let lastStatus = null;

function mapFleetAlerts(env) {
  return ((env && env.alerts) || []).map((x) => ({
    ...x,
    kind: String(x.kind || "").split("-")[0] || "fleet",
  }));
}

async function fleetAlerts() {
  try {
    const res = await tracedFetch("api/fleet/alerts", { cache: "no-store" });
    if (!res.ok) return [];
    return mapFleetAlerts(await res.json());
  } catch { return []; }
}

let lastStripAlerts = [];
function refreshStrip(fleetArr, statusData) {
  const host = statusData ? hostAlerts(statusData) : [];
  const all = [...fleetArr, ...host];
  lastStripAlerts = all;
  morph(() => renderAlertStrip(all, statusData));
  /* ambient fleet health (ROADMAP "ambient theming"): html[data-fleet-health]
     drives the page tint; setAmbientHealth repaints the favicon with a
     status dot. Every alert on the strip participates. */
  setAmbientHealth(all.some((a) => a.sev === "crit") ? "crit"
    : all.some((a) => a.sev === "warn") ? "warn" : "ok");
  /* telemetry-coupled storm (#1): box load/temp drives bolt rate + rain */
  try { if (statusData && statusData.host) setStormIntensity(stormLevelFromHost(statusData.host)); } catch {}
}

/* Incident bundle (#20): one-click post-mortem starter -- current strip
   alerts, the live snapshot's load-bearing sections, and Loki deep links
   (Grafana login required) for the journal slices a static file can't
   carry. Charts travel via screenshot/print-PDF (print stylesheet). */
function downloadIncidentBundle() {
  const d = lastStatus;
  if (!d) return;
  const now = new Date();
  const from = new Date(now.getTime() - 6 * 3600e3).toISOString();
  const errQ = `{unit=~"gale-.*"} |~ "(?i)(error|exception|traceback|failed)"`;
  const bundle = {
    exported_at: now.toISOString(),
    page: String(location.href),
    alerts: lastStripAlerts,
    host: d.host,
    hardware: d.hardware,
    kernel: d.kernel,
    hygiene: d.hygiene,
    drift: d.drift,
    services: d.services,
    targets: d.targets,
    loki_queries: {
      errors_6h: errQ,
      fleet_api_spans_6h: `{unit="gale-fleet-api.service"} |= "SPAN"`,
    },
    loki_explore: `http://100.66.39.59:3001/explore?left=${encodeURIComponent(JSON.stringify({ datasource: "Loki", queries: [{ expr: errQ }], range: { from, to: now.toISOString() } }))}`,
    note: "Grafana login required for Loki links. Journal slices: journalctl -u gale-fleet-api --since '6 hours ago'.",
  };
  const blob = new Blob([JSON.stringify(bundle, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gale-incident-${now.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
const bundleBtn = document.getElementById("incident-bundle");
if (bundleBtn) bundleBtn.addEventListener("click", downloadIncidentBundle);

/* Alert chips are reconciled by key (kind+text), not innerHTML-swapped:
   unchanged chips keep their DOM node, so the entrance animation only
   plays for genuinely new alerts. New arrivals get a sticky stagger index
   (--i) for the slide-in and, when crit, a one-shot radiating ring from
   the dot -- while the steady-state crit glow keeps looping untouched.

   Acknowledgement (item: interactive alert acks): each chip carries a small
   mute control; acking mutes that key (kind:text) for 4h via the fleet API
   (alert-acks.json, shared across devices/tabs). Muted chips stay visible
   but dimmed and unpulsed, sorted last; clicking one un-mutes it. */
const CHIP_KEY = (a) => `${a.sev}:${a.kind}:${a.text}`;
const ACK_KEY = (a) => `${a.kind}:${a.text}`;
/* sticky arrival order: a chip's index (and therefore its markup) is
   assigned once when it first appears and kept until it resolves -- so
   the HTTP tick and SSE push racing at boot can't rewrite the same chip
   mid-animation. chipSeen tracks which keys were already in the DOM so
   only genuinely new chips get the (time-limited) .chip-new marker that
   drives the staggered entrance + dot radiate. */
const chipOrder = new Map();
const chipSeen = new Set();
const CHIP_NEW_TTL = 2600; /* chip-in (0.35s + stagger) + dot-radiate (2 x 1.1s) */
const ACK_HOURS = 4;
/* acks: key -> until epoch ms, loaded from api/fleet/acks at boot */
const acks = new Map();
let lastAlerts = [];

function ackFetch() {
  return tracedFetch("api/fleet/alerts/acks", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

async function loadAcks() {
  const d = await ackFetch();
  if (d && Array.isArray(d.acks)) {
    acks.clear();
    for (const a of d.acks) acks.set(a.key, a.until * 1000);
    if (lastAlerts.length) renderAlertStrip(lastAlerts, lastStatus);
  }
}

async function setAck(key, hours) {
  try {
    const res = await tracedFetch("api/fleet/alerts/acks", {
      method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, hours }),
    });
    if (!res.ok) return;
    if (hours === 0) acks.delete(key);
    else acks.set(key, Date.now() + hours * 3600e3);
    if (lastAlerts.length) renderAlertStrip(lastAlerts, lastStatus);
  } catch { /* offline -- next tick re-renders unacked */ }
}

const isAcked = (a) => {
  const until = acks.get(ACK_KEY(a));
  return until != null && until > Date.now();
};

function renderAlertStrip(all) {
  lastAlerts = all;
  all.sort((x, y) => (SEV_ORDER[x.sev] ?? 9) - (SEV_ORDER[y.sev] ?? 9)
    || Number(isAcked(x)) - Number(isAcked(y))); /* muted chips sink */
  if (!all.length) { stripEl.hidden = true; chipOrder.clear(); chipSeen.clear(); return; }
  stripEl.hidden = false;
  const fresh = [];
  for (const a of all) {
    const key = CHIP_KEY(a);
    if (!chipOrder.has(key)) chipOrder.set(key, chipOrder.size);
    if (!chipSeen.has(key)) fresh.push(key);
  }
  patchList(chipsEl, all.map((a) => {
    const key = CHIP_KEY(a);
    const ackKey = ACK_KEY(a);
    const muted = isAcked(a);
    return {
      key,
      html: `<button type="button" class="alert-chip alert-chip--${esc(a.sev)}${muted ? " acked" : ""}" data-target="${esc(CHIP_TARGETS[a.kind] || "")}" data-kind="${esc(a.kind)}" data-ackkey="${esc(ackKey)}" title="${esc(a.kind)}${muted ? " (muted — click to un-mute)" : ""}" style="--i:${chipOrder.get(key)}">
      <i class="alert-dot" aria-hidden="true"></i>
      <span class="alert-text">${esc(a.text)}</span>
      ${muted ? "" : `<b class="chip-ack" data-ackkey="${esc(ackKey)}" title="Mute for ${ACK_HOURS}h" aria-label="Mute this alert">&times;</b>`}
    </button>`,
    };
  }));
  /* patchList reorders survivors in place, so container children line up
     with `all` one-to-one: flag this render's fresh arrivals for the
     staggered entrance + dot radiate, then drop the marker after the
     animations have run. */
  const kids = chipsEl.children ? [...chipsEl.children] : [];
  all.forEach((a, idx) => {
    const key = CHIP_KEY(a);
    const btn = kids[idx];
    if (!btn || !fresh.includes(key)) return;
    if (!btn.classList.contains("chip-new")) {
      btn.classList.add("chip-new");
      setTimeout(() => btn.classList.remove("chip-new"), CHIP_NEW_TTL);
    }
  });
  for (const a of all) chipSeen.add(CHIP_KEY(a));
  /* muted summary */
  const mutedEl = document.getElementById("alert-muted-note");
  if (mutedEl) {
    const muted = all.filter(isAcked);
    if (muted.length) {
      const soon = Math.min(...muted.map((a) => (acks.get(ACK_KEY(a)) - Date.now()) / 3600e3));
      setText(mutedEl, `${muted.length} muted${muted.length === 1 ? "" : "s"} · ~${soon < 1 ? Math.max(1, Math.round(soon * 60)) + "m" : Math.round(soon) + "h"} left · click a muted chip to un-mute`);
      mutedEl.hidden = false;
    } else {
      mutedEl.hidden = true;
      setText(mutedEl, "");
    }
  }
}

chipsEl.addEventListener("click", (e) => {
  const ackBtn = e.target.closest(".chip-ack");
  if (ackBtn) { setAck(ackBtn.dataset.ackkey, ACK_HOURS); return; }
  const btn = e.target.closest(".alert-chip");
  if (!btn) return;
  if (btn.classList.contains("acked")) { setAck(btn.dataset.ackkey, 0); return; }
  const t = btn.dataset.target;
  if (!t) return;
  if (t.includes("fleet.html")) { window.location.href = t; return; }
  const el = document.getElementById(t);
  if (el) el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
});

let heatKicked = false;
let firstPainted = false;
async function tick() {
  let data = null;
  let preFleet = null;
  try {
    const res = await tracedFetch(FEED, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = validate(await res.json(), statusPayload);
    // First paint: have the alert feed in hand BEFORE revealing the board, so
    // the "needs attention" strip and the board appear in the same frame.
    // (Strip arriving after the board shoved the whole board down: CLS 0.18.)
    if (!firstPainted) { try { preFleet = liveFleetAlerts || (await fleetAlerts()); } catch { preFleet = []; } }
    render(data);
    firstPainted = true;
    lastStatus = data;
  } catch (e) {
    setFresh("down", `collector unreachable (${e.message})`);
  }
  const fleet = data ? (preFleet || liveFleetAlerts || (await fleetAlerts())) : [];
  refreshStrip(fleet, data);
  renderFleet24h();
  // heatmap is history, not above-the-fold: first fetch stays off the
  // critical paint path (idle callback, 3s ceiling), later ticks poll it.
  // The console panel rides along on the same schedule.
  const kick = () => { renderWakeHeatmap(); renderWakeConsole(); };
  if (typeof requestIdleCallback === "function") {
    if (!heatKicked) { heatKicked = true; requestIdleCallback(kick, { timeout: 3000 }); }
    else kick();
  } else if (!heatKicked) { heatKicked = true; setTimeout(kick, 1500); }
  else kick();
}

/* ---- predictive disk capacity (item: forecast) ----
   sysmon folds a least-squares slope of disk-used-% (10-min samples, 14d
   window) into status.json. Show an honest one-liner per mount; skip
   mounts with too little history yet. */
function renderDiskForecast(d) {
  const el = document.getElementById("disk-forecast-note");
  if (!el) return;
  const list = (d.host && d.host.disk_forecast) || [];
  if (!list.length) { setText(el, ""); return; }
  const label = (m) => m === "mem" ? "RAM" : m === "swap" ? "swap" : `disk ${m}`;
  setText(el, "Capacity forecast: " + list.map((f) => {
    if (f.samples < 3 || (f.span_days || 0) < 3) {
      return `${label(f.mount)}: gathering history (${f.samples} samples)`;
    }
    if (f.days_to_full == null) {
      return `${label(f.mount)} steady (${f.slope_pct_per_day >= 0 ? "+" : ""}${f.slope_pct_per_day}%/day)`;
    }
    return `${label(f.mount)} +${f.slope_pct_per_day}%/day &rarr; full in ~${Math.round(f.days_to_full)}d`;
  }).join(" · "));
}

/* ---- 90-day uptime ledger (item: SLA view) ----
   sysmon folds worst-daily health per target into uptime-history.json and
   ships the aligned arrays in status.json. GitHub-style: one cell per day,
   green all-up, amber auth-gated, red down/error, hollow = no data. */
const UPTIME_SEV_CLASS = ["up", "auth", "down", "down"];
const UPTIME_SEV_NAME = ["up", "auth-gated", "down", "down"];

function renderUptime(u) {
  const grid = document.getElementById("uptime-grid");
  const note = document.getElementById("uptime-note");
  if (!grid) return;
  if (!u || !Array.isArray(u.days) || !u.targets) {
    setHTML(grid, `<p class="mini-note">No uptime history yet — the ledger fills as gale-sysmon runs.</p>`);
    return;
  }
  const days = u.days;
  const rows = Object.entries(u.targets).map(([name, vals]) => {
    const cells = (vals || []).map((sev, i) =>
      `<i class="uptime-cell" data-sev="${sev == null ? "nodata" : UPTIME_SEV_CLASS[sev] || "down"}" title="${days[i]}: ${sev == null ? "no data" : UPTIME_SEV_NAME[sev] || "down"}"></i>`).join("");
    const known = (vals || []).filter((v) => v != null);
    const up = known.filter((v) => v === 0).length;
    const pct = known.length ? Math.round((up / known.length) * 100) : null;
    return {
      key: `up-${name}`,
      html: `<div class="uptime-row" data-sev="${pct == null ? "nodata" : pct === 100 ? "ok" : "warn"}">
        <span class="uptime-name">${esc(name)}</span>
        <span class="uptime-cells">${cells}</span>
        <span class="uptime-pct">${pct == null ? "–" : pct + "%"}</span>
      </div>`,
    };
  });
  patchList(grid, rows.length ? rows : [{ key: "empty", html: `<p class="mini-note">no targets recorded yet</p>` }]);
  if (note) setText(note, `${days.length}-day window · worst health seen each day (a target that blipped for one 15s probe shows red for that day) · ledger: uptime-history.json`);
}

/* ---- ollama GPU · 24h (item: inference dashboard) ----
   The ollama admin service samples /api/ps + nvidia-smi every 30s into
   ollama-history.jsonl and serves /api/ollama/history?hours=24. Chart:
   GPU util (inference proxy — Ollama exposes no server-wide tok/s),
   temperature, and VRAM headroom. Nulls carry forward so gaps don't dip. */
const GPU_HISTORY_TTL = 60e3;
const gpuHistoryCache = { at: 0, data: null };

async function fetchGpuHistory() {
  if (gpuHistoryCache.data && Date.now() - gpuHistoryCache.at < GPU_HISTORY_TTL) {
    return gpuHistoryCache.data;
  }
  try {
    const res = await tracedFetch("api/ollama/history?hours=24", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    gpuHistoryCache.at = Date.now();
    gpuHistoryCache.data = await res.json();
  } catch (e) {
    gpuHistoryCache.at = Date.now();
    gpuHistoryCache.data = null;
  }
  return gpuHistoryCache.data;
}

const GPU_PALETTE = { util: "#4fd1a5", temp: "#e0b45c", vram: "#8593f0" };

/* downsample to ~160 buckets before drawing: the 30s sampler yields ~2900
   points over 24h, which renders as vertical noise at any chart width.
   util takes the per-bucket MAX (a burst inside the bucket is the signal),
   temp/vram take the LAST (slowly-drifting gauges). */
function downsampleSeries(vals, target = 160, agg = "max") {
  if (vals.length <= target) return vals;
  const out = [];
  const size = vals.length / target;
  for (let i = 0; i < target; i++) {
    const start = Math.floor(i * size), end = Math.max(start + 1, Math.floor((i + 1) * size));
    let acc = null;
    for (let j = start; j < end && j < vals.length; j++) {
      const v = vals[j];
      if (v == null) continue;
      acc = acc == null ? v : agg === "max" ? Math.max(acc, v) : v;
    }
    out.push(acc);
  }
  return out;
}

function renderGpuChart(hist, o) {
  const chart = document.getElementById("ollama-gpu-chart");
  const noteEl = document.getElementById("ollama-gpu-note");
  if (!chart || !noteEl) return;
  const series = hist && Array.isArray(hist.series) ? hist.series : [];
  const gpuOf = (s) => (s && s.gpu && s.gpu.ok && Array.isArray(s.gpu.gpus) ? s.gpu.gpus[0] : null);
  const pick = (fn) => {
    const out = [];
    let lastV = null;
    for (const s of series) {
      const v = fn(s);
      lastV = v == null ? lastV : v; /* nulls carry forward: gaps don't dip */
      out.push(lastV);
    }
    return out;
  };
  const util = pick((s) => { const g = gpuOf(s); return g ? Math.round(g.util_pct ?? 0) : null; });
  const temp = pick((s) => { const g = gpuOf(s); return g ? g.temp_c : null; });
  const vram = pick((s) => { const g = gpuOf(s); return g && g.mem_total_mb ? Math.round((g.mem_used_mb / g.mem_total_mb) * 100) : null; });
  if (!series.length || util.every((v) => v == null)) {
    chart.update && chart.update([[]]);
    setText(noteEl, "no GPU history yet — the ollama sampler fills this as it runs");
    return;
  }
  if (typeof chart.update !== "function") return; /* test-stub element */
  // hover labels (#2): timestamps downsampled on the same stride as the
  // value series so indices stay aligned.
  const nts = series.map((s) => s.ts);
  const size = Math.max(1, Math.floor(nts.length / 160));
  const labels = [];
  for (let i = 0; i < nts.length; i += size) {
    const cell = nts.slice(i, i + size);
    labels.push(cell[cell.length - 1]);
  }
  const fmtTs = (ts) => { try { return new Date(ts).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
  chart.update([downsampleSeries(util, 160, "max"), downsampleSeries(temp, 160, "last"), downsampleSeries(vram, 160, "last")], [
    { color: GPU_PALETTE.util, fill: `color-mix(in srgb, ${GPU_PALETTE.util} 16%, transparent)`, width: 1.6 },
    { color: GPU_PALETTE.temp, width: 1.1 },
    { color: GPU_PALETTE.vram, width: 1.1, dash: "3 3" },
  ], {
    labels: labels.map(fmtTs),
    tipFmt: (i, vals, label) =>
      `${label || ""} · util ${vals[0] == null ? "–" : Math.round(vals[0]) + "%"} · ${vals[1] == null ? "–" : vals[1] + "°C"} · VRAM ${vals[2] == null ? "–" : Math.round(vals[2]) + "%"}`.trim(),
  });
  const gpu = series.length ? gpuOf(series[series.length - 1]) : null;
  const name = gpu ? (gpu.name || "GPU").replace(/^NVIDIA /, "") : "GPU";
  setText(noteEl, `${esc(name)} · ${o && o.version ? "ollama v" + esc(o.version) + " · " : ""}util % (area, inference proxy) · temp °C · VRAM % (dashed) · ${hist.uptime_pct != null ? hist.uptime_pct + "% reachability, " : ""}${hist.count} samples @ ${hist.sample_every_s}s`);
}

async function refreshOllamaGpu(o) {
  const hist = await fetchGpuHistory();
  renderGpuChart(hist, o);
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
    const res = await tracedFetch(FLEET_FEED, { cache: "no-store" });
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

function fleetSpark(vals) {
  const clean = (Array.isArray(vals) ? vals : []).map((v) => (Number.isFinite(v) ? v : 0));
  if (!clean.length || clean.every((v) => v === 0)) return `<div class="fleet-24h-nospark">no 14d series</div>`;
  const W = 220, H = 40, pad = 3;
  const max = Math.max(...clean, 0.000001);
  const step = (W - pad * 2) / Math.max(clean.length - 1, 1);
  const pts = clean.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const last = pts[pts.length - 1];
  return `<svg class="fleet-24h-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">` +
    `<polyline class="fleet-24h-sparkline" points="${line}"/>` +
    `<circle class="fleet-24h-sparkdot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.4"/></svg>`;
}

/* Fleet-24h cards render in two layers: a STABLE skeleton per host
   (reconciled by patchList — the node, and the <gale-sparkline> inside it,
   survive across polls), then per-card slots (numbers, sparkline series)
   updated imperatively. Numbers tween via tweenText, the sparkline morphs
   via the component's update(), so a poll looks like the data breathing
   rather than cards re-flashing. */
function fleetCardSkeleton(h, meta) {
  return `<article class="fleet-24h-card" data-glow data-host="${esc(h)}" style="--fh:${meta.hue}">
      <header class="fleet-24h-head">
        <span class="fleet-24h-dot" aria-hidden="true"></span>
        <strong class="fleet-24h-name"><a href="fleet.html#hosts">${esc(h)}</a></strong>
        <span class="fleet-24h-note">${esc(meta.note)} · <span data-slot="agents">&ndash;</span> agents</span>
      </header>
      <gale-sparkline class="fleet-24h-spark" view-box="0 0 220 40"></gale-sparkline>
      <div class="fleet-24h-stats">
        <div class="fleet-24h-stat"><span data-slot="runs">&ndash;</span><span class="fleet-24h-sub">runs 24h</span></div>
        <div class="fleet-24h-stat"><span data-slot="cost">&ndash;</span><span class="fleet-24h-sub">cost 24h</span></div>
        <div class="fleet-24h-stat" data-slot="errwrap"><span data-slot="err">&ndash;</span><span class="fleet-24h-sub">errors</span></div>
        <div class="fleet-24h-stat"><span data-slot="wake">&ndash;</span><span class="fleet-24h-sub">last wake</span></div>
      </div>
    </article>`;
}

export async function renderFleet24h() {
  const grid = document.getElementById("fleet-24h-grid");
  const fresh = document.getElementById("fleet-24h-fresh");
  if (!grid) return;
  const { data, err } = await fetchFleet24h();
  if (!data) {
    setHTML(grid, `<p class="mini-note" style="grid-column:1/-1;color:var(--warn)">fleet metrics unreachable (${esc(err || "unknown")}) — see fleet.html</p>`);
    if (fresh) setText(fresh, "");
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
    setHTML(strip, FLEET_ORDER.map((h) => {
      const p = perHost[h], n = (agents[h] || []).length;
      const lvl = p.down > 0 ? "crit" : p.total === 0 ? "idle" : p.up >= n && n > 0 ? "ok" : "warn";
      const label = p.total === 0 ? `${n} agents · no sweep yet` : `${p.up}/${Math.max(p.total, n)} up`;
      return `<span class="fleet-live-pill" data-level="${lvl}" title="${esc(h)}: ${esc(label)}">` +
        `<i class="fleet-live-dot" aria-hidden="true"></i>${esc(h)} <b>${esc(label)}</b></span>`;
    }).join(""));
  }
  patchList(grid, FLEET_ORDER.map((h) => {
    const meta = FLEET_META[h] || { hue: "var(--text-faint)", note: "" };
    return { key: `fleet24-${h}`, html: fleetCardSkeleton(h, meta) };
  }));
  /* patchList guarantees child order == FLEET_ORDER here (no removals
     between), so slot lookups can zip children against the order list. */
  const kids = grid.children ? [...grid.children] : [];
  FLEET_ORDER.forEach((h, idx) => {
    const card = kids[idx];
    if (!card || card.dataset.host !== h) return;
    const meta = FLEET_META[h] || { hue: "var(--text-faint)", note: "" };
    const r = runs[h] ?? null, c = cost[h] ?? null, e = errs[h] || 0;
    const agg = last[h] || null, n = (agents[h] || []).length;
    const slot = (k) => card.querySelector(`[data-slot="${k}"]`);
    setText(slot("agents"), String(n));
    tweenText(slot("runs"), r == null ? "–" : String(r));
    tweenText(slot("cost"), fleetMoney(c));
    setText(slot("err"), e > 0 ? `${e} err` : "0 err");
    const errwrap = slot("errwrap");
    if (errwrap) errwrap.classList.toggle("err", e > 0);
    card.classList.toggle("has-err", e > 0);
    setText(slot("wake"), agg ? fleetAgo(agg) : "–");
    const spark = card.querySelector("gale-sparkline");
    if (spark && spark.update) {
      const daily = (data.daily_wakings_by_host || {})[h];
      const vals = (Array.isArray(daily) ? daily : []).map((v) => (Number.isFinite(v) ? v : 0));
      if (vals.length && !vals.every((v) => v === 0)) {
        spark.update([vals], [{ color: meta.hue, fill: `color-mix(in srgb, ${meta.hue} 16%, transparent)` }]);
      }
    }
  });
  if (fresh) {
    const gen = data.generated_at ? ` · metrics generated ${fleetAgo(data.generated_at)}` : "";
    setText(fresh, `live · poll fallback every 30s${gen}`);
  }
  refreshEffects();
}

/* ---- wake cadence heatmap (14d) — api/fleet/wakes ----
   One cell per 6h UTC slot per local agent (00/06/12/18), 14 days wide.
   Green = woke (four depth steps by session minutes), red = a run ended
   is_error, faint = no run in that slot. Data is the compact /wakes slice
   of fleet_api's runs roll-up (runs-history.jsonl folds in, so rotation
   doesn't punch holes in the grid). Missed-wake ALERTING is deliberately
   not inferred here -- crontab cadence + grace math lives in
   tools/wake_bridge.py (gale_wake.prom); this panel shows raw history. */
const HEAT_FEED = "api/fleet/wakes";
const HEAT_TTL = 120e3;
const HEAT_DAYS = 14;
const HEAT_SLOTS = HEAT_DAYS * 4;
const HEAT_AGENTS = ["gale", "zephyr", "squall", "tempest", "vortex", "chinook",
  "cyclone", "maistral", "sirocco", "bora", "tramontane", "ostro", "poniente", "levante"];
const SLOT_MS = 6 * 3600e3;
let heatCache = { at: 0, data: null, err: null };

async function fetchWakes() {
  if (Date.now() - heatCache.at < HEAT_TTL && (heatCache.data || heatCache.err)) {
    return { data: heatCache.data, err: heatCache.err };
  }
  try {
    const res = await tracedFetch(HEAT_FEED, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const env = validate(await res.json(), wakesPayload);
    heatCache = { at: Date.now(), data: env, err: null };
  } catch (e) {
    heatCache = { at: Date.now(), data: null, err: String(e.message || e) };
  }
  return { data: heatCache.data, err: heatCache.err };
}

function heatSlot(iso, nowSlot) {
  const idx = Math.floor(new Date(iso).getTime() / SLOT_MS);
  if (!Number.isFinite(idx)) return -1;
  return idx > nowSlot ? -1 : idx; // future/garbage ts -> drop, not clamp
}

export async function renderWakeHeatmap() {
  const grid = document.getElementById("wake-heat-grid");
  const note = document.getElementById("wake-heat-note");
  if (!grid) return;
  const { data, err } = await fetchWakes();
  if (!data) {
    setHTML(grid, `<p class="mini-note" style="color:var(--warn)">wake telemetry unreachable (${esc(err || "unknown")}) — heatmap paused, retries each tick</p>`);
    if (note) setText(note, "");
    return;
  }
  const now = Date.now();
  const nowSlot = Math.floor(now / SLOT_MS);
  const firstSlot = nowSlot - (HEAT_SLOTS - 1);
  // bucket runs: {agent -> {slot -> {runs, errs, mins, cost}}}
  const cells = {};
  const lastBy = {};
  for (const r of data.runs || []) {
    const a = String(r.agent || "").toLowerCase();
    if (!HEAT_AGENTS.includes(a)) continue;
    const t = r.ts ? new Date(r.ts).getTime() : NaN;
    if (!Number.isFinite(t)) continue;
    const s = heatSlot(r.ts, nowSlot);
    if (s < firstSlot) continue;
    const b = (cells[a] = cells[a] || {});
    const c = (b[s] = b[s] || { runs: 0, errs: 0, mins: 0, cost: 0 });
    c.runs += 1;
    if (r.is_error) c.errs += 1;
    if (Number.isFinite(r.duration_ms)) c.mins += r.duration_ms / 60000;
    if (Number.isFinite(r.cost_usd)) c.cost += r.cost_usd;
    if (!lastBy[a] || t > lastBy[a].t) lastBy[a] = { t, r };
  }
  const slotLabel = (s) => {
    const d = new Date(s * SLOT_MS);
    return `${d.toISOString().slice(0, 10)} ${String(d.getUTCHours()).padStart(2, "0")}:00 UTC`;
  };
  const rows = HEAT_AGENTS.map((a) => {
    const b = cells[a] || {};
    const total = Object.values(b).reduce((n, c) => n + c.runs, 0);
    const errs = Object.values(b).reduce((n, c) => n + c.errs, 0);
    const last = lastBy[a];
    // Row html is deliberately time-independent (patchList diffs on it):
    // a per-tick "5m ago" here would replace all 56 cells every 15s tick.
    // The "last wake" text lives in a data-slot span, updated imperatively.
    let cellsHtml = "";
    for (let s = firstSlot; s <= nowSlot; s++) {
      const c = b[s];
      if (!c) {
        cellsHtml += `<i class="wake-heat-cell" data-sev="none" title="${esc(a)} · ${esc(slotLabel(s))}: no wake recorded"></i>`;
        continue;
      }
      const sev = c.errs > 0 ? "err" : "ok";
      const lvl = c.mins >= 45 ? 4 : c.mins >= 25 ? 3 : c.mins >= 10 ? 2 : 1;
      const dur = c.mins >= 1 ? `${Math.round(c.mins)}m total` : "duration n/a";
      cellsHtml += `<i class="wake-heat-cell" data-sev="${sev}" data-int="${lvl}" title="${esc(a)} · ${esc(slotLabel(s))}: ${c.runs} run${c.runs > 1 ? "s" : ""}, ${dur}${c.errs ? `, ${c.errs} ended in error` : ""}${c.cost ? `, $${c.cost.toFixed(2)}` : ""}"></i>`;
    }
    const aria = `${a}: ${total} wakes in ${HEAT_DAYS}d${errs ? `, ${errs} in error` : ""}`;
    return {
      key: `heat-${a}`,
      lastIso: last ? last.r.ts : null,
      html: `<div class="wake-heat-row" role="img" aria-label="${esc(aria)}" data-agent="${esc(a)}" data-sev="${!last ? "miss" : errs ? "err" : "ok"}">
        <a class="wake-heat-name" href="fleet.html#agent-${esc(a)}">${esc(a)}</a>
        <span class="wake-heat-cells" aria-hidden="true">${cellsHtml}</span>
        <span class="wake-heat-sum"><b>${total}</b>&thinsp;/14d · <span data-slot="last">&ndash;</span>${errs ? ` · <span class="wake-heat-errs">${errs} err</span>` : ""}</span>
      </div>`,
    };
  });
  patchList(grid, rows);
  // cheap per-tick updates: "last wake" text only, no cell re-renders
  for (const row of rows) {
    const node = grid.querySelector(`.wake-heat-row[data-agent="${row.key.slice(5)}"] [data-slot="last"]`);
    if (node) setText(node, row.lastIso ? fleetAgo(row.lastIso) : "never");
  }
  if (note) {
    const gen = data.generated_at ? ` · roll-up generated ${fleetAgo(data.generated_at)}` : "";
    setText(note, `${HEAT_SLOTS} slots × 6h (UTC-aligned) · ${HEAT_AGENTS.length} local agents${gen} · data: api/fleet/wakes (runs-history roll-up) · alerts: gale_wake.prom (GaleWakeMissed/GaleWakeSessionStuck)`);
  }
  refreshEffects();
}

/* ---- operator console: manual wake + ask queue ----
   Wake chips POST api/fleet/wake (agent allowlist, live-session + flock
   single-instance checks, 30min per-agent cooldown, 6/hour cap server
   side -- the button only mirrors those verdicts). Asks render counts +
   titles from api/fleet/asks; bodies stay in the agents' ASK.md files by
   the fleet's own redaction rule. */
const ASKS_TTL = 120e3;
let asksCache = { at: 0, data: null, err: null };
const wakeBusy = new Set();

async function fetchAsks() {
  if (Date.now() - asksCache.at < ASKS_TTL && (asksCache.data || asksCache.err)) {
    return { data: asksCache.data, err: asksCache.err };
  }
  try {
    const res = await tracedFetch("api/fleet/asks", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    asksCache = { at: Date.now(), data: validate(await res.json(), asksPayload), err: null };
  } catch (e) {
    asksCache = { at: Date.now(), data: null, err: String(e.message || e) };
  }
  return { data: asksCache.data, err: asksCache.err };
}

export async function renderWakeConsole() {
  const chips = document.getElementById("wake-chips");
  const note = document.getElementById("wake-note");
  const asksList = document.getElementById("asks-list");
  if (!chips) return;
  const live = (heatCache.data && heatCache.data.live) || {};
  const rows = HEAT_AGENTS.map((a) => {
    const isLive = (live[a] || 0) > 5 || wakeBusy.has(a);
    const state = wakeBusy.has(a) ? "waking" : isLive ? "live" : "idle";
    const sub = wakeBusy.has(a) ? "waking&hellip;" : isLive ? "running" : "wake";
    return {
      key: `chip-${a}`,
      html: `<button type="button" class="wake-chip" data-agent="${esc(a)}" data-state="${state}"` +
        ` title="manually wake ${esc(a)} (wake.sh + its own guards)"${wakeBusy.has(a) ? " disabled" : ""}>` +
        `<span class="wake-chip-name">${esc(a)}</span><span class="wake-chip-sub">${sub}</span></button>`,
    };
  });
  patchList(chips, rows);
  if (note && !note.textContent) {
    setText(note, "click to trigger the agent's own wake.sh · cooldown 30min/agent, 6/hour fleet-wide");
  }
  const { data, err } = await fetchAsks();
  if (!asksList) return;
  if (!data) {
    setHTML(asksList, `<p class="mini-note" style="color:var(--warn)">ask queue unreachable (${esc(err || "unknown")})</p>`);
    return;
  }
  const waiting = data.agents.filter((a) => a.open_asks > 0);
  const askRows = waiting.map((a) => {
    const titles = (a.headings || []).slice(0, 3).map((h) =>
      `<li class="asks-title">${esc(h)}</li>`).join("");
    const more = (a.headings || []).length > 3
      ? `<li class="asks-title asks-more">+${a.headings.length - 3} more&hellip;</li>` : "";
    return {
      key: `ask-${a.agent}`,
      html: `<div class="asks-row" data-open="${a.open_asks > 2 ? "many" : "some"}">
        <span class="asks-count">${a.open_asks}</span>
        <span class="asks-agent">${esc(a.agent)}</span>
        <ul class="asks-titles">${titles}${more}</ul>
        <span class="asks-age">${esc(fleetAgo(a.mtime))}</span>
      </div>`,
    };
  });
  patchList(asksList, askRows.length ? askRows
    : [{ key: "ask-none", html: `<p class="mini-note">no agent reports open asks</p>` }]);
  const asksNote = document.getElementById("asks-note");
  if (asksNote) {
    setText(asksNote, `${data.total_open} open across ${waiting.length} agents · newest ${data.agents[0] ? fleetAgo(data.agents[0].mtime) : "–"} · bodies stay in ASK.md (fleet redaction rule)`);
  }
  refreshEffects();
}

// one delegated listener for all wake chips (patchList replaces nodes;
// delegation survives that, per-node listeners would not). res is scoped
// outside try so the finally block can read the status.
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".wake-chip");
  if (!btn || btn.disabled) return;
  const agent = btn.dataset.agent;
  if (!agent || wakeBusy.has(agent)) return;
  const note = document.getElementById("wake-note");
  wakeBusy.add(agent);
  renderWakeConsole();
  let res = null;
  (async () => {
    try {
      res = await tracedFetch("api/fleet/wake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent }),
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 202) {
        try { navigator.vibrate && navigator.vibrate(30); } catch { /* no haptics */ }
        heatCache.at = 0; // refetch liveness on the next tick
        if (note) setText(note, `${agent}: waking now (pid ${body.pid || "?"}) — session will show live within a minute`);
      } else if (res.status === 409) {
        if (note) setText(note, `${agent}: ${body.error || "already running"}`);
        heatCache.at = 0;
      } else if (note) {
        setText(note, `${agent}: ${body.error || `HTTP ${res.status}`}`);
      }
    } catch (err) {
      // offline: hand the tap to the service worker's Background Sync queue
      // (15 min TTL) instead of dropping it
      const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
      if (sw && navigator.onLine === false) {
        sw.postMessage({ type: "gale:queue-wake", agent });
        if (note) setText(note, `${agent}: offline — wake queued, will send when the connection returns (15 min limit)`);
      } else if (note) setText(note, `${agent}: request failed (${String(err.message || err)})`);
    } finally {
      // after a 202, leave "waking" pinned until the live map confirms;
      // every other verdict clears immediately
      const wait = res && res.status === 202 ? 90000 : 3000;
      setTimeout(() => {
        if (heatCache.data) heatCache.at = 0;
        wakeBusy.delete(agent);
        renderWakeConsole();
      }, wait);
    }
  })();
});

// keep the "Ns ago" freshness line moving between polls
setInterval(() => { if (lastGeneratedAt) updateFreshness(lastGeneratedAt); }, 1000);

tick();
loadAcks();
pollTimer = setInterval(tick, pollMs);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") tick();
});

// Additive live-push layer: the 30s tick() above stays the safety net (a
// proxy that won't stream, or the render-test harness which has no
// EventSource global, still gets fresh data every tick). A push only
// refreshes the parts it covers; on repeated stream errors we close the
// source and let polling carry the page.
if (typeof EventSource !== "undefined") {
  let alertsFailures = 0;
  const esAlerts = new EventSource("api/fleet/alerts/stream");
  esAlerts.onmessage = (e) => {
    alertsFailures = 0;
    try {
      liveFleetAlerts = mapFleetAlerts(JSON.parse(e.data));
      refreshStrip(liveFleetAlerts, lastStatus);
    } catch { /* malformed payload -- wait for the next push */ }
  };
  esAlerts.onerror = () => {
    if (++alertsFailures >= 3) {
      esAlerts.close();
      liveFleetAlerts = null; // tick() re-fetches via HTTP from here on
    }
  };

  let fleetFailures = 0;
  const esFleet = new EventSource("api/fleet/metrics/stream");
  esFleet.onmessage = (e) => {
    fleetFailures = 0;
    try {
      fleetCache = { at: Date.now(), data: validate(JSON.parse(e.data), metricsPayload), err: null };
      renderFleet24h();
    } catch { /* malformed payload -- wait for the next push */ }
  };
  esFleet.onerror = () => {
    if (++fleetFailures >= 3) esFleet.close(); // polling keeps the cards fresh
  };
}


/* host map (3D): loaded after the board has settled so it never competes with first paint. The panel is
   in the HTML (so there is no layout jump when it opens); where it can't run (no WebGL, reduced motion,
   data-saver) it is hidden straight away instead of flashing an empty frame. */
try {
  const sec = typeof document !== "undefined" && document.getElementById && document.getElementById("sec-hostmap");
  if (sec) {
    let gl = null;
    try { gl = document.createElement("canvas").getContext("webgl"); } catch {}
    const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const saver = !!(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.saver === "1");
    if (!gl || reduced || saver || typeof requestIdleCallback !== "function") {
      sec.hidden = true;
    } else {
      const go = () => setTimeout(() => import("./hostmap.js").then((m) => m.initHostMap()).catch(() => { sec.hidden = true; }), 600);
      if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
    }
  }
} catch { /* decoration only: never let the host map break the board */ }
