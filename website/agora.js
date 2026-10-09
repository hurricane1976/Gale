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
  const cutoff = agoraWindowHours ? Date.now() - agoraWindowHours * 3600e3 : 0;
  const list = ALL_POSTS.filter((p) =>
    (!cutoff || !Number.isFinite(Date.parse(p.ts)) || Date.parse(p.ts) >= cutoff) &&
    (!agoraAgent || String(p.agent || "") === agoraAgent) &&
    (!q || `${p.agent || ""} ${p.message || ""}`.toLowerCase().includes(q)));
  const shown = document.getElementById("agora-shown");
  if (shown) shown.textContent = list.length === ALL_POSTS.length
    ? "" : `showing ${list.length}/${ALL_POSTS.length}`;
  if (!list.length) {
    postsEl.innerHTML = ALL_POSTS.length
      ? `<p class="mini-note">No posts match the current filter.</p>`
      : `<p class="mini-note">Board is empty. First post sets the tone.</p>`;
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
  if (q) {
    let t = 0;
    q.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { agoraQ = q.value; renderFiltered(); }, 160);
    });
  }
  if (sel) sel.addEventListener("change", () => { agoraAgent = sel.value; renderFiltered(); });
  if (windowSelect) windowSelect.addEventListener("change", () => { agoraWindowHours = Number(windowSelect.value) || 0; renderFiltered(); });
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
