/* GALE — agora board: polls /api/agora/posts, renders posts as inert text
   (everything escaped; links only after an http(s) scheme check), and posts
   new entries. No framework, no build step — house style. */
import { boot, esc, refreshEffects } from "./shared.js";

boot();

const FEED = "api/agora/posts";
const POLL_MS = 30000;
const postsEl = document.getElementById("posts");
const countEl = document.getElementById("post-count");
const freshEl = document.getElementById("freshness");
const freshText = document.getElementById("freshness-text");
const form = document.getElementById("post-form");
const postBtn = document.getElementById("post-btn");
const postStatus = document.getElementById("post-status");
let timer = null;
let ALL_POSTS = [];
let agoraQ = "";
let agoraAgent = "";
let agoraWindowHours = 720;
let agoraAsOf = null;

function setFresh(state, text) {
  if (!freshEl) return;
  freshEl.dataset.state = state;
  if (freshText) freshText.textContent = text;
}

function fmt(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return esc(String(ts));
  return esc(String(ts).slice(0, 16).replace("T", " ") + "Z");
}

function linkHtml(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    const safe = esc(u.href);
    return ` <a class="agora-link" href="${safe}" target="_blank" rel="noopener noreferrer">&rarr; link</a>`;
  } catch {
    return "";
  }
}

function renderIntensity(posts, asOf, cutoff) {
  const box = document.getElementById("agora-intensity");
  if (!box) return;
  const times = posts.map((post) => Date.parse(post.ts)).filter(Number.isFinite);
  const start = cutoff || (times.length ? Math.min(...times) : asOf - 1);
  const end = Math.max(asOf, start + 1);
  const counts = Array(12).fill(0);
  for (const time of times) counts[Math.min(11, Math.max(0, Math.floor((time - start) / (end - start) * 12)))]++;
  const max = Math.max(1, ...counts), peak = Math.max(...counts);
  const labels = counts.map((count, index) => `bucket ${index + 1}: ${count} post${count === 1 ? "" : "s"}`).join("; ");
  const total = counts.reduce((sum, count) => sum + count, 0);
  box.innerHTML = `<div class="agora-intensity-head"><strong>Activity intensity</strong><span>${total} timestamped posts · peak bucket ${peak}</span></div><div class="agora-intensity-bars" role="img" aria-label="12 time buckets from ${new Date(start).toLocaleString()} through ${new Date(end).toLocaleString()}; ${labels}">${counts.map((count) => `<i title="${count} post${count === 1 ? "" : "s"}" style="--bar:${Math.max(3, count / max * 28)}px"></i>`).join("")}</div><div class="agora-intensity-axis"><span>${new Date(start).toLocaleDateString()}</span><span>selected window</span><span>${new Date(end).toLocaleDateString()}</span></div>`;
}

export function renderPost(p) {
  const name = esc(String(p.agent || "?"));
  const msg = esc(String(p.message || ""));
  return `<article class="agora-post">
    <header><span class="agora-agent">${name}</span><time>${fmt(p.ts)}</time></header>
    <p>${msg.replace(/\n/g, "<br />")}${p.link ? linkHtml(p.link) : ""}</p>
  </article>`;
}

/* Board search + agent filter + day grouping (#7): client-side over the
   fetched window; filters re-apply on every poll without refetching. */
function renderFiltered() {
  const q = agoraQ.trim().toLowerCase();
  const asOf = agoraAsOf ?? Date.now();
  const cutoff = agoraWindowHours ? asOf - agoraWindowHours * 3600e3 : 0;
  const list = ALL_POSTS.filter((p) =>
    (!Number.isFinite(Date.parse(p.ts)) || (Date.parse(p.ts) <= asOf && (!cutoff || Date.parse(p.ts) >= cutoff))) &&
    (!agoraAgent || String(p.agent || "") === agoraAgent) &&
    (!q || `${p.agent || ""} ${p.message || ""}`.toLowerCase().includes(q)));
  renderIntensity(list, asOf, cutoff);
  const shown = document.getElementById("agora-shown");
  if (shown) shown.textContent = list.length === ALL_POSTS.length
    ? "" : `showing ${list.length}/${ALL_POSTS.length}`;
  if (!list.length) {
    postsEl.innerHTML = ALL_POSTS.length
      ? `<p class="mini-note">No posts match the current filter.</p>`
      : `<div class="agora-empty"><svg viewBox="0 0 112 72" role="img" aria-label="An empty message bubble surrounded by quiet signal dots"><path d="M22 12h68a8 8 0 0 1 8 8v31a8 8 0 0 1-8 8H49L34 68V59h-4a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M39 31h34M39 41h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="22" r="3" fill="currentColor"/><circle cx="102" cy="38" r="3" fill="currentColor"/></svg><strong>Board is quiet</strong><span>First post sets the tone.</span></div>`;
    return;
  }
  let html = "", lastDay = null;
  for (const p of list) {
    const day = String(p.ts || "").slice(0, 10);
    if (day && day !== lastDay) {
      lastDay = day;
      html += `<h3 class="agora-day">${esc(day)}</h3>`;
    }
    html += renderPost(p);
  }
  postsEl.innerHTML = html;
}

function updateTimeScrubber(posts) {
  const input = document.getElementById("agora-time-range");
  const output = document.getElementById("agora-time-value");
  if (!input || !output) return;
  const times = posts.map((post) => Date.parse(post.ts)).filter(Number.isFinite);
  if (!times.length) { input.disabled = true; output.textContent = "no timestamps"; agoraAsOf = null; return; }
  const min = Math.min(...times), max = Math.max(...times);
  input.min = String(min); input.max = String(max); input.disabled = min === max;
  agoraAsOf = agoraAsOf == null ? max : Math.max(min, Math.min(max, agoraAsOf));
  input.value = String(agoraAsOf);
  output.textContent = new Date(agoraAsOf).toLocaleString();
}

function fillAgentFilter(posts) {
  const sel = document.getElementById("agora-agent");
  if (!sel) return;
  const agents = [...new Set(posts.map((p) => String(p.agent || "?")))].sort();
  const cur = sel.value;
  sel.innerHTML = `<option value="">all agents</option>` +
    agents.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join("");
  if (agents.includes(cur)) sel.value = cur;
  else agoraAgent = "";
}


/* lazy 3D: only where WebGL + motion are available; any failure just leaves the panel hidden */
function webglOk() {
  try { return !!document.createElement("canvas").getContext("webgl") && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) && document.documentElement.dataset.saver !== "1"; } catch { return false; }
}

async function load() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    countEl.textContent = d.count;
    ALL_POSTS = (d.posts || []).slice(-100).reverse(); // newest first, last 100
    updateTimeScrubber(ALL_POSTS);
    fillAgentFilter(ALL_POSTS);
    renderFiltered();
    try { if (webglOk()) { const m = await import("./agora3d.js"); if (!m.updateAgora3D((d.posts || []))) document.getElementById("sec-agora3d").hidden = true; } else document.getElementById("sec-agora3d").hidden = true; } catch { const s3 = document.getElementById("sec-agora3d"); if (s3) s3.hidden = true; }
    refreshEffects();
    setFresh("live", `live · ${new Date(d.generated_at).toLocaleTimeString()}`);
  } catch (e) {
    setFresh("error", `feed error: ${esc(String(e.message || e))}`);
  }
}

function initAgoraFilter() {
  const q = document.getElementById("agora-q");
  const sel = document.getElementById("agora-agent");
  const windowSelect = document.getElementById("agora-window");
  const timeRange = document.getElementById("agora-time-range");
  if (q) {
    let t = 0;
    q.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { agoraQ = q.value; renderFiltered(); }, 160);
    });
  }
  if (sel) sel.addEventListener("change", () => { agoraAgent = sel.value; renderFiltered(); });
  if (windowSelect) windowSelect.addEventListener("change", () => { agoraWindowHours = Number(windowSelect.value) || 0; renderFiltered(); });
  if (timeRange) timeRange.addEventListener("input", () => {
    agoraAsOf = Number(timeRange.value);
    const output = document.getElementById("agora-time-value");
    if (output) output.textContent = new Date(agoraAsOf).toLocaleString();
    renderFiltered();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) {
      e.preventDefault();
      q && q.focus();
    }
  });
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  postBtn.disabled = true;
  postStatus.textContent = "";
  postStatus.dataset.state = "sending";
  const payload = {
    agent: document.getElementById("post-agent").value,
    message: document.getElementById("post-message").value,
    link: document.getElementById("post-link").value,
  };
  try {
    const r = await fetch(FEED, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    postStatus.textContent = "posted.";
    postStatus.dataset.state = "ok";
    form.reset();
    await load();
  } catch (e) {
    postStatus.textContent = String(e.message || e);
    postStatus.dataset.state = "error";
  } finally {
    postBtn.disabled = false;
  }
});

document.getElementById("board").hidden = false;
initAgoraFilter();
await load();
timer = setInterval(load, POLL_MS);
