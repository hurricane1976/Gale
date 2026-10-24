/* GALE — Routines page. Multi-step sequences triggered by single actions.
   Routines stored in localStorage. Run executes steps sequentially. */

import {boot,esc,setHTML,setText,tracedFetch,skeleton} from "./shared.js";
const $ = (id) => document.getElementById(id);
boot();

const STORAGE_KEY = 'gale-routines';

function loadRoutines() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveRoutines(routines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
}

// ---- Step editor state ----
let editingSteps = [];
let editingId = null;

// ---- Render summary cards ----
function renderSummary() {
  const routines = loadRoutines();
  const active = routines.filter(r => r.enabled).length;
  setText($('routine-active'), String(active));
  setText($('routine-total'), String(routines.length));

  const last = routines.reduce((best, r) => {
    if (!r.last_run) return best;
    if (!best) return r;
    return new Date(r.last_run) > new Date(best.last_run) ? r : best;
  }, null);

  if (last && last.last_run) {
    const d = new Date(last.last_run);
    setText($('routine-last'), d.toLocaleString());
  } else {
    setText($('routine-last'), '–');
  }
}

// ---- Render SVG cost chart (bar chart) ----
function renderChart(container, data, label) {
  if (!data || !data.length) return '';
  const w = 800, h = 200, pad = 40, barPad = 8;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = (w - pad * 2) / data.length - barPad;

  let svg = `<text x="${pad}" y="14" fill="var(--text-faint)" font-size="11">${esc(label)}</text>`;
  svg += `<line x1="${pad}" y1="20" x2="${w - 10}" y2="20" stroke="var(--line)" stroke-width="0.5"/>`;

  // Grid lines
  for (let i = 1; i <= 4; i++) {
    const y = 20 + (h - 40) * (1 - i / 4);
    svg += `<line x1="${pad}" y1="${y}" x2="${w - 10}" y2="${y}" stroke="var(--line)" stroke-width="0.5" stroke-dasharray="4,4"/>`;
    svg += `<text x="${pad - 5}" y="${y + 4}" text-anchor="end" fill="var(--text-faint)" font-size="10">${(maxVal * i / 4).toFixed(1)}</text>`;
  }

  // Bars
  svg += data.map((d, i) => {
    const barH = (d.value / maxVal) * (h - 40);
    const x = pad + i * (barW + barPad) + barPad / 2;
    const y = h - 20 - barH;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="var(--gust)" rx="2" opacity="0.75">
      <title>${d.label}: ${d.value.toFixed(2)}</title>
    </rect>
    <text x="${x + barW / 2}" y="${h - 6}" text-anchor="middle" fill="var(--text-faint)" font-size="9">${d.label}</text>`;
  }).join('');

  return svg;
}

// ---- Render routine cards ----
function renderRoutines() {
  const routines = loadRoutines();
  const el = $('routine-list');

  if (!routines.length) {
    setHTML(el, '<p class="mono-dim">No routines yet. Create one to chain multiple device actions.</p>');
    renderSummary();
    return;
  }

  setHTML(el, routines.map(r => {
    const lvl = r.enabled ? 'ok' : 'warn';
    const stateLabel = r.enabled ? 'active' : 'paused';
    const triggerLabel = getTriggerLabel(r);
    const stepsHtml = (r.steps || []).map((s, i) =>
      `<div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span class="mono-dim">${i + 1}</span> ${esc(s.entity_id)} → ${esc(s.state)}
      </div>`
    ).join('');

    return `<div class="target-card" data-level="${lvl}">
      <div class="target-top">
        <strong>${esc(r.icon || '')} ${esc(r.name)}</strong>
        <span class="pill" data-level="${lvl}">${stateLabel}</span>
      </div>
      ${r.description ? `<p style="margin:2px 0;font-size:0.78rem;color:var(--text-dim)">${esc(r.description)}</p>` : ''}
      <p style="margin:2px 0 0;font-size:0.78rem;color:var(--text-dim)">When: ${triggerLabel}</p>
      ${stepsHtml ? `<div style="margin:4px 0 0">
        ${stepsHtml}
      </div>` : ''}
      ${r.last_run ? `<p style="margin:4px 0 0;font-size:0.72rem;color:var(--text-faint)">Last run: ${new Date(r.last_run).toLocaleString()}</p>` : ''}
      <div style="margin-top:8px;display:flex;gap:6px">
        <button type="button" class="mini-toggle act-run" data-id="${esc(r.id)}">run now</button>
        <button type="button" class="mini-toggle act-edit" data-id="${esc(r.id)}">edit</button>
        <button type="button" class="mini-toggle act-del" data-id="${esc(r.id)}">delete</button>
      </div>
    </div>`;
  }).join(''));

  // Attach handlers
  el.querySelectorAll('.act-run').forEach(btn => {
    btn.addEventListener('click', () => run_routine(btn.dataset.id));
  });
  el.querySelectorAll('.act-edit').forEach(btn => {
    btn.addEventListener('click', () => editRoutine(btn.dataset.id));
  });
  el.querySelectorAll('.act-del').forEach(btn => {
    btn.addEventListener('click', () => deleteRoutine(btn.dataset.id));
  });

  renderSummary();
}

function getTriggerLabel(r) {
  switch (r.trigger_type) {
    case 'time': return `at ${r.trigger_value || '–'}`;
    case 'daily': return `daily at ${r.trigger_value || '–'}`;
    case 'presence_change': return `when ${r.trigger_value || '–'}`;
    case 'state_change': return `when ${r.trigger_value || '–'}`;
    default: return r.trigger_value || '–';
  }
}

// ---- Run a routine (sequential step execution) ----
async function run_routine(id) {
  const routines = loadRoutines();
  const r = routines.find(x => x.id === id);
  if (!r || !r.steps || !r.steps.length) {
    alert('No steps defined for this routine.');
    return;
  }

  if (!confirm(`Run routine "${r.name}"?`)) return;

  for (const step of r.steps) {
    try {
      await tracedFetch('/api/fleet/home/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: step.entity_id,
          state: step.state
        })
      });
    } catch (e) {
      console.warn('Routine step failed:', step, e);
    }
    await new Promise(res => setTimeout(res, 500));
  }

  r.last_run = new Date().toISOString();
  saveRoutines(routines);
  renderRoutines();
}

// ---- Delete routine ----
function deleteRoutine(id) {
  if (!confirm('Delete this routine?')) return;
  const routines = loadRoutines().filter(r => r.id !== id);
  saveRoutines(routines);
  renderRoutines();
}

// ---- Edit routine (open dialog with data) ----
function editRoutine(id) {
  const routines = loadRoutines();
  const r = routines.find(x => x.id === id);
  if (!r) return;

  editingId = r.id;
  editingSteps = JSON.parse(JSON.stringify(r.steps || []));

  $('routine-dialog-title').textContent = 'Edit Routine';
  $('routine-name').value = r.name || '';
  $('routine-desc').value = r.description || '';
  $('routine-icon').value = r.icon || '';
  $('routine-trigger-type').value = r.trigger_type || 'daily';
  $('routine-trigger-value').value = r.trigger_value || '';

  renderStepList();
  $('routine-dialog').showModal();
}

// ---- New routine (open blank dialog) ----
function openNewRoutine() {
  editingId = null;
  editingSteps = [];

  $('routine-dialog-title').textContent = 'New Routine';
  $('routine-name').value = '';
  $('routine-desc').value = '';
  $('routine-icon').value = '';
  $('routine-trigger-type').value = 'daily';
  $('routine-trigger-value').value = '';

  renderStepList();
  $('routine-dialog').showModal();
}

// ---- Step list rendering ----
function renderStepList() {
  const el = $('routine-steps-list');
  if (!el) return;

  if (!editingSteps.length) {
    el.innerHTML = '<p class="mono-dim" style="margin:0;font-size:0.82rem">No steps yet. Add one below.</p>';
    return;
  }

  el.innerHTML = editingSteps.map((s, i) =>
    `<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
      <span class="mono-dim" style="flex:none">${i + 1}.</span>
      <input type="text" class="step-entity" value="${esc(s.entity_id)}" placeholder="entity_id"
             style="flex:1;padding:6px 10px;background:var(--bg);border:1px solid var(--line);border-radius:var(--r-1);color:var(--text);font-family:var(--font-body);font-size:0.82rem">
      <span style="color:var(--text-faint)">→</span>
      <input type="text" class="step-state" value="${esc(s.state)}" placeholder="state"
             style="flex:1;padding:6px 10px;background:var(--bg);border:1px solid var(--line);border-radius:var(--r-1);color:var(--text);font-family:var(--font-body);font-size:0.82rem">
      <button type="button" class="mini-toggle step-del" data-i="${i}" style="color:var(--flag)">✕</button>
    </div>`
  ).join('');

  // Attach step handlers
  el.querySelectorAll('.step-del').forEach(btn => {
    btn.addEventListener('click', () => {
      editingSteps.splice(parseInt(btn.dataset.i), 1);
      renderStepList();
    });
  });
}

function addStep() {
  const entity = $('routine-step-entity').value.trim();
  const state = $('routine-step-state').value.trim();
  if (!entity || !state) {
    alert('Both entity_id and state are required for a step.');
    return;
  }
  editingSteps.push({ entity_id: entity, state: state });
  $('routine-step-entity').value = '';
  $('routine-step-state').value = '';
  renderStepList();
}

// ---- Save routine ----
function saveRoutine() {
  const name = $('routine-name').value.trim();
  if (!name) { alert('Name required'); return; }

  const routines = loadRoutines();
  const data = {
    name,
    description: $('routine-desc').value.trim(),
    icon: $('routine-icon').value.trim(),
    trigger_type: $('routine-trigger-type').value,
    trigger_value: $('routine-trigger-value').value.trim(),
    steps: editingSteps,
  };

  if (editingId) {
    const idx = routines.findIndex(r => r.id === editingId);
    if (idx >= 0) {
      data.id = editingId;
      data.last_run = routines[idx].last_run;
      data.enabled = routines[idx].enabled;
      routines[idx] = data;
    }
  } else {
    data.id = 'routine-' + Date.now();
    data.enabled = true;
    data.last_run = null;
    data.created_at = new Date().toISOString();
    routines.push(data);
  }

  saveRoutines(routines);
  $('routine-dialog').close();
  renderRoutines();
}

// ---- Init handlers ----
$('routine-add-btn')?.addEventListener('click', openNewRoutine);
$('routine-cancel')?.addEventListener('click', () => $('routine-dialog').close());
$('routine-save')?.addEventListener('click', saveRoutine);
$('routine-add-step')?.addEventListener('click', addStep);
$('routine-refresh')?.addEventListener('click', renderRoutines);

// ---- INIT ----
renderRoutines();
setInterval(renderRoutines, 60000); // Refresh every minute
