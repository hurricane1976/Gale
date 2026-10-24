/* GALE — Energy dashboard. Polls energy history and renders simple SVG charts.
   Mirrors the fleet metrics.js pattern: no chart library, house SVG tokens. */

import {boot,esc,setHTML,setText,tracedFetch,skeleton} from "./shared.js";
const $ = (id) => document.getElementById(id);
boot();

for (const id of ["energy-summary","energy-devices"]) {
  skeleton($(id), 2, 72);
}

// ---- SVG sparkline builder ----
function buildSparkline(data, width, height, color) {
  if (!data.length) return "";
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);

  const points = data.map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * (height - 10) - 5).toFixed(1)}`).join(" ");
  const areaPoints = `0,${height} ${points} ${((data.length - 1) * stepX).toFixed(1)},${height}`;

  return `<defs><linearGradient id="energy-grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
  </linearGradient></defs>
  <polygon points="${areaPoints}" fill="url(#energy-grad)"/>
  <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  ${data.length < 30 ? data.map((v, i) => `<circle cx="${(i * stepX).toFixed(1)}" cy="${(height - ((v - min) / range) * (height - 10) - 5).toFixed(1)}" r="3" fill="${color}" opacity="0.8"/>`).join("") : ""}`;
}

// ---- Spark grid for mini-bars ----
function buildSparkGrid(data, width, height, color) {
  if (!data.length) return "";
  const max = Math.max(...data, 1);
  const barW = (width / data.length) - 2;
  return data.map((v, i) =>
    `<rect x="${i * (barW + 2) + 1}" y="${height - (v / max) * (height - 10) - 5}" width="${barW}" height="${(v / max) * (height - 10)}" fill="${color}" rx="2" opacity="0.7"/>`
  ).join("");
}

// ---- LOAD ENERGY DATA ----
async function loadEnergy() {
  try {
    const r = await tracedFetch("/api/fleet/home/energy", { cache: "no-store" });
    const data = await r.json();
    const readings = data.readings || [];

    setText($("energy-status"), readings.length ? `Last reading: ${new Date(readings[readings.length-1].timestamp).toLocaleString()}` : "No energy data recorded yet. Connect HA energy sensors to start tracking.");
    setHTML($("energy-freshness"), `<span class="freshness-dot" style="background:${readings.length ? 'var(--ok)' : 'var(--text-faint)'};box-shadow:none"></span>${readings.length ? readings.length + ' readings' : 'No data'}`);

    // Aggregate by day
    const daily = {};
    readings.forEach(r => {
      const d = r.timestamp.split('T')[0];
      if (!daily[d]) daily[d] = 0;
      const ed = r.data || {};
      daily[d] += (ed.kwh || 0) + (ed.kwh_total_today || 0) + (ed.power_total || 0) / 1000;
    });

    const days = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
    const values = days.map(([, v]) => Math.round(v * 100) / 100);
    const labels = days.map(([d]) => d.slice(5));

    // Summary
    if (values.length) {
      const today = values[values.length - 1];
      const week = values.slice(-7).reduce((a, b) => a + b, 0);
      const month = values.slice(-30).reduce((a, b) => a + b, 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      setText($("energy-today"), today.toFixed(2) + " kWh");
      setText($("energy-week"), week.toFixed(2) + " kWh");
      setText($("energy-month"), month.toFixed(2) + " kWh");
      setText($("energy-avg"), avg.toFixed(2) + " kWh");
    }

    // Chart
    if (values.length > 1) {
      const chart = $("energy-chart");
      const w = 800, h = 250;
      chart.setAttribute("viewBox", `0 0 ${w} ${h + 30}`);

      // Y axis labels
      const maxVal = Math.max(...values, 1);
      let svg = `<text x="30" y="15" fill="var(--text-faint)" font-size="11">kWh</text>`;
      svg += `<line x1="50" y1="10" x2="${w-10}" y2="10" stroke="var(--line)" stroke-width="0.5"/>`;

      // Grid lines
      for (let i = 1; i <= 4; i++) {
        const y = 10 + (h - 30) * (1 - i / 4);
        svg += `<line x1="50" y1="${y}" x2="${w-10}" y2="${y}" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="4,4"/>`;
        svg += `<text x="45" y="${y + 4}" text-anchor="end" fill="var(--text-faint)" font-size="10">${(maxVal * i / 4).toFixed(1)}</text>`;
      }

      svg += buildSparkline(values, w - 60, h - 30, "var(--gust)");

      // X labels
      const stepX = (w - 60) / (values.length - 1 || 1);
      labels.forEach((l, i) => {
        if (values.length < 15 || i % Math.ceil(values.length / 12) === 0) {
          svg += `<text x="${50 + i * stepX}" y="${h + 15}" text-anchor="middle" fill="var(--text-faint)" font-size="10">${l}</text>`;
        }
      });

      chart.innerHTML = svg;
    }

    // Device breakdown
    try {
      const hr = await tracedFetch("/api/fleet/home/status", { cache: "no-store" });
      const hd = await hr.json();
      const all = hd.groups?.all_devices || [];
      const powerDevices = all.filter(d =>
        ['power', 'energy', 'watts', 'kilowatts'].some(k =>
          (d.friendly_name || d.entity_id || '').toLowerCase().includes(k)
        )
      ).slice(0, 10);

      setHTML($("energy-devices"), powerDevices.length ? powerDevices.map(d =>
        `<div class="target-card" data-level="${d.state === 'unavailable' ? 'warn' : 'ok'}">
          <div class="target-top">
            <strong>${esc(d.friendly_name || d.entity_id)}</strong>
            <span class="pill" data-level="ok">${esc(String(d.state))}</span>
          </div>
          ${Object.entries(d.attributes || {}).filter(([k,v]) => typeof v === 'number').map(([k,v]) =>
            `<p style="margin:0;font-size:0.82rem;color:var(--text-dim)">${esc(k)}: ${typeof v === 'number' ? v.toFixed(2) : esc(String(v))}</p>`
          ).join("")}
        </div>`).join("") : "<p class=\"mono-dim\">No power/energy sensors detected.</p>");
    } catch { /* non-fatal */ }

  } catch (e) {
    setText($("energy-status"), "Energy data unavailable: " + (e.message || "connection error"));
    setHTML($("energy-freshness"), `<span class="freshness-dot" style="background:var(--warn);box-shadow:none"></span>Unavailable`);
  }
}

loadEnergy();
setInterval(loadEnergy, 120000); // Refresh every 2 minutes
