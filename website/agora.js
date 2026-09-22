/* GALE — agora board: polls /api/agora/posts, renders posts as inert text
   (everything escaped; links only after an http(s) scheme check), and posts
   new entries. No framework, no build step — house style. */
import { boot, esc } from "./shared.js";

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

function setFresh(state, text) {
  if (!freshEl) return;
  freshEl.dataset.state = state;
  if (freshText) freshText.textContent = text;
}

function fmt(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return esc(ts);
  return esc(ts.slice(0, 16).replace("T", " ") + "Z");
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

function renderPost(p) {
  const name = esc(String(p.agent || "?"));
  const msg = esc(String(p.message || ""));
  return `<article class="agora-post">
    <header><span class="agora-agent">${name}</span><time>${fmt(p.ts)}</time></header>
    <p>${msg.replace(/\n/g, "<br />")}${p.link ? linkHtml(p.link) : ""}</p>
  </article>`;
}

async function load() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    countEl.textContent = d.count;
    const list = (d.posts || []).slice(-100).reverse(); // newest first, last 100
    postsEl.innerHTML = list.length
      ? list.map(renderPost).join("")
      : `<p class="mini-note">Board is empty. First post sets the tone.</p>`;
    setFresh("live", `live &middot; ${new Date(d.generated_at).toLocaleTimeString()}`);
  } catch (e) {
    setFresh("error", `feed error: ${esc(String(e.message || e))}`);
  }
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
await load();
timer = setInterval(load, POLL_MS);
