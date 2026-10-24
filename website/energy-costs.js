/* GALE — Energy Costs page. Adds monetary costs to energy dashboard using
   configurable electricity rates stored in localStorage. */

import {boot,esc,setHTML,setText,tracedFetch,skeleton} from "./shared.js";
const $ = (id) => document.getElementById(id);
boot();

const RATE_KEY = 'gale-energy-rate';

function getRate() {
  try { return parseFloat(localStorage.getItem(RATE_KEY)) || 0.15; } catch { return 0.15; }
}

function setRate(r) {
  try { localStorage.setItem(RATE_KEY, String(r)); } catch {}
}

// Skeleton first-paint
for (const id of ['cost-summary', 'cost-devices']) {
  skeleton($(id), 2, 72);
}

// ---- Cost trend SVG bar chart ----
function renderCostChart(data, width, height) {
  if (!data || !data.length) return '';
  const pad = 50, footH = 30;
  const chartH = height - pad - footH;
  const maxVal = Math.max(...data.map(d => d.value), 0.01);
  const barW = (width - pad * 2) / data.length - 4;

  let svg = '';

  // Y axis labels
  svg += `<text x="${pad - 5}" y="14" text-anchor="end" fill="var(--text-faint)" font-size="11">$</text>`;

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = pad + chartH * (1 - i / 4);
    svg += `<line x1="${pad}" y1="${y}" x2="${width - 10}" y2="${y}" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="4,4"/>`;
    svg += `<text x="${pad - 5}" y="${y + 4}" text-anchor="end" fill="var(--text-faint)" font-size="10">${(maxVal * i / 4).toFixed(2)}</text>`;
  }

  // Baseline
  svg += `<line x1="${pad}" y1="${pad + chartH}" x2="${width - 10}" y2="${pad + chartH}" stroke="var(--line)" stroke-width="1"/>`;

  // Bars
  svg += data.map((d, i) => {
    const barH = (d.value / maxVal) * chartH;
    const x = pad + i * (barW + 4) + 2;
    const y = pad + chartH - barH;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="var(--gust)" rx="2" opacity="0.75">
      <title>${d.label}: $${d.value.toFixed(2)}</title>
    </rect>
    ${data.length < 20 ? `<text x="${x + barW / 2}" y="${pad + chartH + 16}" text-anchor="middle" fill="var(--text-faint)" font-size="9">${d.label}</text>` : ''}`;
  }).join('');

  return svg;
}

// ---- Load and render ----
async function loadEnergyCosts() {
  try {
    const rate = getRate();
    const r = await tracedFetch('/api/fleet/home/energy', { cache: 'no-store' });
    const data = await r.json();
    const readings = data.readings || [];

    setText($('cost-status'), readings.length
      ? `Last reading: ${new Date(readings[readings.length - 1].timestamp).toLocaleString()} · rate: $${rate.toFixed(2)}/kWh`
      : 'No energy data recorded yet. Connect HA energy sensors to start tracking costs.');

    const freshEl = $('cost-freshness');
    setHTML(freshEl, `<span class="freshness-dot" style="background:${readings.length ? 'var(--ok)' : 'var(--text-faint)'};box-shadow:none"></span>${readings.length ? readings.length + ' readings' : 'No data'}`);

    // Aggregate by day
    const daily = {};
    readings.forEach(rd => {
      const d = rd.timestamp.split('T')[0];
      if (!daily[d]) daily[d] = 0;
      const ed = rd.data || {};
      daily[d] += (ed.kwh || 0) + (ed.kwh_total_today || 0) + (ed.power_total || 0) / 1000;
    });

    const days = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));

    // Calculate costs
    const costs = days.map(([d, kwh]) => ({ date: d, kwh, cost: kwh * rate }));
    const costValues = costs.map(c => c.cost);
    const kwhValues = costs.map(c => c.kwh);

    // Summary
    if (costs.length) {
      const todayCost = costs[costs.length - 1].cost;
      const weekCost = costs.slice(-7).reduce((a, c) => a + c.cost, 0);
      const monthCost = costs.slice(-30).reduce((a, c) => a + c.cost, 0);
      const totalCost = costs.reduce((a, c) => a + c.cost, 0);

      setText($('cost-today'), '$' + todayCost.toFixed(2));
      setText($('cost-week'), '$' + weekCost.toFixed(2));
      setText($('cost-month'), '$' + monthCost.toFixed(2));
      setText($('cost-total'), '$' + totalCost.toFixed(2));
    }

    // Chart — show both kWh and cost
    if (costs.length > 1) {
      const chart = $('cost-chart');
      const w = 800, h = 250;
      chart.setAttribute('viewBox', `0 0 ${w} ${h}`);

      // Show cost values on chart
      const chartData = costs.map(c => ({
        label: c.date.slice(5),
        value: c.cost
      }));

      chart.innerHTML = renderCostChart(chartData, w, h);
    }

    // Device cost breakdown
    try {
      const hr = await tracedFetch('/api/fleet/home/status', { cache: 'no-store' });
      const hd = await hr.json();
      const all = hd.groups?.all_devices || [];

      const powerDevices = all.filter(d =>
        ['power', 'energy', 'watts', 'kilowatts'].some(k =>
          (d.friendly_name || d.entity_id || '').toLowerCase().includes(k)
        )
      ).slice(0, 12);

      // Estimate daily cost per device based on current power draw
      setHTML($('cost-devices'), powerDevices.length
        ? powerDevices.map(d => {
            const powerW = (d.attributes?.power || d.attributes?.watts || null);
            const dailyKwh = powerW != null ? (powerW / 1000) * 24 : null;
            const dailyCost = dailyKwh != null ? dailyKwh * rate : null;
            const lvl = d.state === 'unavailable' ? 'warn' : 'ok';
            const stateLabel = d.state === 'unavailable' ? 'unavailable' : d.state;

            return `<div class="target-card" data-level="${lvl}">
              <div class="target-top">
                <strong>${esc(d.friendly_name || d.entity_id)}</strong>
                <span class="pill" data-level="${lvl}">${esc(stateLabel)}</span>
              </div>
              ${powerW != null ? `<p style="margin:0;font-size:0.82rem;color:var(--text-dim)">Power: ${powerW.toFixed(1)}W · Est. daily: ${dailyKwh.toFixed(2)} kWh</p>` : ''}
              ${dailyCost != null ? `<p style="margin:2px 0 0;font-size:0.82rem;color:var(--text-dim)">Est. daily cost: <strong>$${dailyCost.toFixed(2)}</strong></p>` : '<p style="margin:2px 0 0;font-size:0.82rem;color:var(--text-dim)">No power data for cost estimate</p>'}
            </div>`;
          }).join('')
        : '<p class="mono-dim">No power/energy sensors detected.</p>');
    } catch { /* non-fatal */ }

  } catch (e) {
    setText($('cost-status'), 'Energy data unavailable: ' + (e.message || 'connection error'));
    setHTML($('cost-freshness'), `<span class="freshness-dot" style="background:var(--warn);box-shadow:none"></span>Unavailable`);
  }
}

// ---- Rate config handler ----
function handleRateSave() {
  const input = $('cost-rate');
  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0 || val > 1) {
    alert('Rate must be between 0 and 1 ($/kWh).');
    return;
  }
  setRate(val);
  loadEnergyCosts();
}

// ---- Init ----
$('cost-rate-save')?.addEventListener('click', handleRateSave);

// Sync input with stored rate
try {
  $('cost-rate').value = getRate();
} catch {}

loadEnergyCosts();
setInterval(loadEnergyCosts, 120000); // Refresh every 2 minutes
