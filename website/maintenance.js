/* GALE — Maintenance tracker. Local task list with add/complete/delete,
   filter tabs, due-date sorting, and overdue highlighting. */

import {boot,esc,setHTML,setText,tracedFetch,skeleton} from "./shared.js";
const $ = (id) => document.getElementById(id);
boot();

skeleton($("maint-list"), 2, 72);

let currentFilter = "all";

// ---- CATEGORY CONFIG ----
const CATEGORIES = {
  filter: { label: "Filter / HVAC", icon: "🔄", color: "var(--gust)" },
  appliance: { label: "Appliance", icon: "🔧", color: "var(--warn)" },
  seasonal: { label: "Seasonal", icon: "🍂", color: "var(--m-glm)" },
  repair: { label: "Repair", icon: "🛠️", color: "var(--flag)" },
  maintenance: { label: "General", icon: "📋", color: "var(--bolt)" },
  other: { label: "Other", icon: "📌", color: "var(--text-dim)" },
};

// ---- LOAD TASKS ----
async function loadTasks() {
  try {
    const r = await tracedFetch("/api/fleet/home/maintenance", { cache: "no-store" });
    const data = await r.json();
    const tasks = data.tasks || [];
    renderSummary(tasks);
    renderFilters(tasks);
    renderList(tasks, currentFilter);
  } catch (e) {
    setHTML($("maint-list"), `<p style="color:var(--crit)">Failed to load tasks: ${esc(e.message || "error")}</p>`);
  }
}

// ---- RENDER SUMMARY ----
function renderSummary(tasks) {
  const now = new Date();
  const pending = tasks.filter(t => t.status !== 'done');
  const overdue = pending.filter(t => t.due && new Date(t.due) < now);
  const done30 = tasks.filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at) > new Date(Date.now() - 30 * 86400000));

  setText($("maint-pending"), pending.length);
  setText($("maint-overdue"), overdue.length);
  setText($("aint-done"), done30.length);
  setText($("maint-total"), tasks.length);
}

// ---- RENDER FILTERS ----
function renderFilters(tasks) {
  const cats = new Set(tasks.map(t => t.category || 'other'));
  cats.add('all');
  const el = $("maint-filters");
  setHTML(el, [...cats].map(c => {
    const cat = CATEGORIES[c] || CATEGORIES.other;
    const count = c === 'all' ? tasks.length : tasks.filter(t => (t.category || 'other') === c).length;
    return `<button type="button" class="mini-toggle ${c === currentFilter ? 'on' : ''}" data-filter="${esc(c)}" style="border-color:${c === currentFilter ? cat.color : ''}">${cat.icon} ${esc(cat.label)} (${count})</button>`;
  }).join(""));

  el.querySelectorAll(".mini-toggle[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      el.querySelectorAll(".mini-toggle").forEach(b => { b.classList.remove('on'); b.style.borderColor = ''; });
      btn.classList.add('on');
      loadTasks();
    });
  });
}

// ---- RENDER LIST ----
function renderList(tasks, filter) {
  const now = new Date();
  let filtered = filter === 'all' ? tasks : tasks.filter(t => (t.category || 'other') === filter);
  // Sort: overdue first, then by due date, then by creation
  filtered.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (b.status === 'done' && a.status !== 'done') return -1;
    const da = a.due ? new Date(a.due).getTime() : Infinity;
    const db = b.due ? new Date(b.due).getTime() : Infinity;
    return da - db;
  });

  if (!filtered.length) {
    setHTML($("maint-list"), "<p class=\"mono-dim\">No tasks in this category.</p>");
    return;
  }

  setHTML($("maint-list"), filtered.map(t => {
    const cat = CATEGORIES[t.category] || CATEGORIES.other;
    const overdue = t.status !== 'done' && t.due && new Date(t.due) < now;
    const lvl = t.status === 'done' ? 'ok' : overdue ? 'crit' : 'ok';

    return `<div class="target-card" data-level="${lvl}" style="border-left-width:3px;border-left-color:${cat.color}">
      <div class="target-top">
        <strong>${esc(cat.icon)} ${esc(t.title)}</strong>
        <span class="pill" data-level="${lvl}">${esc(t.status === 'done' ? 'done' : overdue ? 'overdue' : 'pending')}</span>
      </div>
      <p style="margin:4px 0 0;font-size:0.82rem;color:var(--text-dim)">
        ${t.due ? `Due: ${esc(t.due)} · ${cat.label}` : cat.label}
        ${t.notes ? ` · ${esc(t.notes.slice(0, 80))}` : ''}
      </p>
      ${t.created_at ? `<p style="margin:2px 0 0;font-size:0.72rem;color:var(--text-faint)">Created ${esc(new Date(t.created_at).toLocaleDateString())}</p>` : ''}
      ${t.completed_at ? `<p style="margin:0;font-size:0.72rem;color:var(--ok)">Completed ${esc(new Date(t.completed_at).toLocaleDateString())}</p>` : ''}
      ${t.status !== 'done' ? `<div style="margin-top:8px;display:flex;gap:6px">
        <button type="button" class="mini-toggle act-done" data-id="${esc(t.id)}" style="border-color:var(--ok)">✓ done</button>
        <button type="button" class="mini-toggle act-del" data-id="${esc(t.id)}" style="border-color:var(--crit)">delete</button>
      </div>` : ''}
    </div>`;
  }).join(""));

  // Attach handlers
  $("maint-list").querySelectorAll(".act-done").forEach(btn => {
    btn.addEventListener("click", () => completeTask(btn.dataset.id));
  });
  $("maint-list").querySelectorAll(".act-del").forEach(btn => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.id));
  });
}

// ---- ACTIONS ----
async function addTask(title, category, due, notes) {
  try {
    await tracedFetch("/api/fleet/home/maintenance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, due, notes, status: "pending" }),
    });
  } catch (e) { console.warn("add task failed:", e); }
}

async function completeTask(id) {
  try {
    await tracedFetch("/api/fleet/home/maintenance/complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch (e) { console.warn("complete task failed:", e); }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await tracedFetch("/api/fleet/home/maintenance/del", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch (e) { console.warn("delete task failed:", e); }
}

// ---- DIALOG ----
function openTaskDialog() {
  $("task-dialog").showModal();
  $("task-title").value = "";
  $("task-category").value = "filter";
  $("task-due").value = "";
  $("task-notes").value = "";
}

async function saveTask() {
  const title = $("task-title").value.trim();
  const category = $("task-category").value;
  const due = $("task-due").value;
  const notes = $("task-notes").value.trim();
  if (!title) { alert("Title required"); return; }
  await addTask(title, category, due, notes);
  $("task-dialog").close();
  loadTasks();
}

// ---- INIT ----
loadTasks();
setInterval(loadTasks, 60000); // Refresh every minute

// Buttons
const addBtn = $("maint-add-btn");
if (addBtn) addBtn.addEventListener("click", openTaskDialog);
const refreshBtn = $("maint-refresh");
if (refreshBtn) refreshBtn.addEventListener("click", loadTasks);
const cancelBtn = $("task-cancel");
if (cancelBtn) cancelBtn.addEventListener("click", () => $("task-dialog").close());
const saveBtn = $("task-save");
if (saveBtn) saveBtn.addEventListener("click", saveTask);
