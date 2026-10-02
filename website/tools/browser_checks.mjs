#!/usr/bin/env node
/* GALE — real-browser checks (puppeteer-core + the system chromium).
     node tools/browser_checks.mjs csp        console/CSP-report-only violations + JS errors per page
     node tools/browser_checks.mjs budget     per-page transfer budgets (encoded bytes of JS/CSS/total)
     node tools/browser_checks.mjs offline    SW installs, then pages still open offline with the shell
     node tools/browser_checks.mjs visual     screenshot 10 pages x 3 viewports, diff vs tools/visual-baseline
     node tools/browser_checks.mjs visual --update   (re)write the baselines
     node tools/browser_checks.mjs webgl      3D topology (fleet/home/status/phone) under software WebGL: canvas has
                                              content, no JS errors, host labels, focus fly-to, ?simulate outage
   Env: GALE_BASE (default https://gale-agent.tail2f1671.ts.net -- https so the SW registers),
        GALE_CHROME (default /snap/bin/chromium). Exit 1 on any failure. */
import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.GALE_BASE || "https://gale-agent.tail2f1671.ts.net";
const CHROME = process.env.GALE_CHROME || "/snap/bin/chromium";
const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, "visual-baseline");
const PAGES = ["index", "fleet", "status", "metrics", "observability", "ollama", "network", "weather", "agora", "reliability"];
const VIEWPORTS = { phone: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };
// encoded (wire) byte budgets per page: [js, css, total]
const BUDGET = { js: 160 * 1024, css: 60 * 1024, total: 420 * 1024 };
const MAX_DIFF = 0.02; // fraction of pixels allowed to differ (animations/live data)
// live-alert pages reflow when an alert chip flaps (observed 3-15% between back-to-back runs)
const LIVE_MAX_DIFF = { fleet: 0.25, status: 0.25 };

const mode = process.argv[2];
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--ignore-certificate-errors", "--disable-dev-shm-usage"],
});
let failed = false;
const say = (ok, msg) => { if (!ok) failed = true; console.log(`${ok ? "ok  " : "FAIL"} ${msg}`); };
const settle = (page) => page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

async function csp() {
  for (const p of PAGES) {
    const page = await browser.newPage();
    const problems = [];
    page.on("console", (m) => {
      const t = m.text();
      if (/content security policy/i.test(t)) problems.push("CSP: " + t.replace(/Note that.*/, "").slice(0, 140));
      else if (m.type() === "error" && !/Failed to load resource.*(401|404)/.test(t)) problems.push("console.error: " + t.slice(0, 140));
    });
    page.on("pageerror", (e) => problems.push("pageerror: " + String(e.message).slice(0, 140)));
    await page.goto(`${BASE}/${p}.html`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch((e) => problems.push("nav: " + e.message));
    await settle(page);
    const uniq = [...new Set(problems)];
    say(uniq.length === 0, `${p}.html ${uniq.length ? "\n       " + uniq.join("\n       ") : "no CSP violations / JS errors"}`);
    await page.close();
  }
}

async function budget() {
  for (const p of PAGES) {
    const page = await browser.newPage();
    const cdp = await page.createCDPSession();
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.setBypassServiceWorker", { bypass: true });  // measure the wire, not the SW cache
    const reqs = new Map(); let js = 0, css = 0, total = 0;
    cdp.on("Network.responseReceived", (e) => reqs.set(e.requestId, e.type));
    cdp.on("Network.loadingFinished", (e) => {
      const t = reqs.get(e.requestId); total += e.encodedDataLength;
      if (t === "Script") js += e.encodedDataLength; else if (t === "Stylesheet") css += e.encodedDataLength;
    });
    await page.goto(`${BASE}/${p}.html`, { waitUntil: "networkidle2", timeout: 40000 }).catch(() => {});
    const k = (n) => (n / 1024).toFixed(0) + "K";
    const ok = js <= BUDGET.js && css <= BUDGET.css && total <= BUDGET.total;
    say(ok, `${p}.html js ${k(js)}/${k(BUDGET.js)} css ${k(css)}/${k(BUDGET.css)} total ${k(total)}/${k(BUDGET.total)}`);
    await page.close();
  }
}

async function offline() {
  const page = await browser.newPage();
  await page.goto(`${BASE}/index.html`, { waitUntil: "networkidle2", timeout: 40000 });
  const ready = await page.evaluate(async () => {
    if (!navigator.serviceWorker) return "no serviceWorker";
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 15000))]);
    return reg && reg.active ? "ok" : "sw not active";
  });
  say(ready === "ok", `service worker installs and activates (${ready})`);
  await page.reload({ waitUntil: "networkidle2" });  // now controlled
  await page.setOfflineMode(true);
  for (const p of ["index", "fleet", "status"]) {
    const res = await page.goto(`${BASE}/${p}.html`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
    const title = res ? await page.title() : "";
    const hasShell = res ? await page.evaluate(() => !!document.querySelector("header, nav, main, h1")) : false;
    say(!!res && res.ok() && hasShell, `${p}.html opens offline from the SW cache (title "${title.slice(0, 40)}")`);
  }
  await page.setOfflineMode(false);
  await page.close();
}

async function visual() {
  const update = process.argv.includes("--update");
  mkdirSync(BASELINE, { recursive: true });
  const cmp = await browser.newPage();
  for (const [vp, [w, h]] of Object.entries(VIEWPORTS)) {
    for (const p of PAGES) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.goto(`${BASE}/${p}.html`, { waitUntil: "networkidle2", timeout: 40000 }).catch(() => {});
      await settle(page);
      const shot = await page.screenshot({ type: "png" });   // viewport only: stable height
      await page.close();
      const file = join(BASELINE, `${p}.${vp}.png`);
      if (update || !existsSync(file)) { writeFileSync(file, shot); say(true, `${p}.${vp} baseline ${update ? "updated" : "created"}`); continue; }
      const diff = await cmp.evaluate(async (a, b) => {
        const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
        const [x, y] = await Promise.all([load(a), load(b)]);
        if (x.width !== y.width || x.height !== y.height) return 1;
        const draw = (i) => { const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const g = c.getContext("2d"); g.drawImage(i, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
        const d1 = draw(x), d2 = draw(y); let n = 0;
        for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]) > 48) n++;
        return n / (d1.length / 4);
      }, "data:image/png;base64," + readFileSync(file).toString("base64"), "data:image/png;base64," + shot.toString("base64"));
      const max = LIVE_MAX_DIFF[p] ?? MAX_DIFF;
      if (diff > max) writeFileSync(join(BASELINE, `${p}.${vp}.FAILED.png`), shot);
      say(diff <= max, `${p}.${vp} ${(diff * 100).toFixed(2)}% pixels differ (max ${max * 100}%)`);
    }
  }
}

/* WebGL checks: the visual mode runs --disable-gpu (no WebGL) and animated scenes never match pixel-for-pixel,
   so the 3D topology is verified structurally instead, in a browser with software GL (swiftshader). */
async function webgl() {
  const gl = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
           "--ignore-certificate-errors", "--disable-dev-shm-usage"],
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const open = async (path, vp, { mobile = false } = {}) => {
    const page = await gl.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push("pageerror: " + String(e.message).slice(0, 120)));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push("console.error: " + m.text().slice(0, 120)); });
    await page.setViewport({ width: vp[0], height: vp[1], isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/${path}`, { waitUntil: "domcontentloaded", timeout: 40000 }).catch(() => {});
    return { page, errs };
  };
  // fraction of "lit" canvas pixels + number of distinct coarse colours (a blank/black or single-colour canvas fails)
  const canvasStats = async (page) => {
    const el = await page.$("#topo-3d-canvas");
    const shot = await el.screenshot({ type: "png" });
    return page.evaluate(async (b64) => {
      const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + b64; });
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data, buckets = new Set(); let lit = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] + d[i + 1] + d[i + 2] > 330) { lit++; buckets.add((d[i] >> 5) + "," + (d[i + 1] >> 5) + "," + (d[i + 2] >> 5)); }
      }
      return { lit: lit / (d.length / 4), colours: buckets.size };
    }, shot.toString("base64"));
  };
  const labelsOf = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(s + " span")].map((x) => x.textContent).filter((t) => /\u00b7/.test(t)), sel);
  const shown = (page) => page.evaluate(() => { const c = document.getElementById("topo-3d-canvas"); return !!c && !c.hidden; });

  // 1. fleet.html: opens by default; content; 4 hub labels; focus fly-to; no errors
  {
    const { page, errs } = await open("fleet.html", [1440, 1000]);
    await wait(7000);
    await page.evaluate(() => document.getElementById("topo-3d-canvas")?.scrollIntoView({ block: "center" }));
    await wait(5000);
    const open3d = await shown(page), st = open3d ? await canvasStats(page) : { lit: 0, colours: 0 };
    say(open3d, "fleet: 3D opens by default");
    say(st.lit > 0.002 && st.lit < 0.7 && st.colours >= 6, `fleet: canvas has content (lit ${(st.lit * 100).toFixed(2)}%, ${st.colours} colours)`);
    const labs = await labelsOf(page, ".fleet-topo-wrap");
    say(labs.length >= 3, `fleet: host labels (${labs.length})`);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("gale:focus-agent", { detail: { agent: "Brook" } })));
    await wait(2500);
    const foc = await page.evaluate(() => [...document.querySelectorAll("div")].find((d) => /Brook/.test(d.textContent) && d.getAttribute("aria-live") === "polite" && !d.hidden)?.textContent || "");
    say(/Brook/.test(foc), `fleet: focus event flies to an agent (${foc.slice(0, 40) || "no label"})`);
    say(errs.length === 0, "fleet: no JS errors" + (errs.length ? "\n       " + errs.join("\n       ") : ""));
    await page.close();
  }
  // 2. status.html: host map + ?simulate outage preview ("tidal" 3 agents down -> n-3/n up)
  {
    const { page, errs } = await open("status.html?simulate=tidal:3", [1440, 1000]);
    await wait(9000);
    await page.evaluate(() => document.getElementById("sec-hostmap")?.scrollIntoView({ block: "start" }));
    await wait(5000);
    const open3d = await shown(page), st = open3d ? await canvasStats(page) : { lit: 0, colours: 0 };
    say(open3d, "status: host map opens");
    say(st.lit > 0.002 && st.colours >= 6, `status: canvas has content (lit ${(st.lit * 100).toFixed(2)}%, ${st.colours} colours)`);
    const labs = await labelsOf(page, "#host-topo");
    const tidal = labs.find((t) => /^tidal/.test(t)) || "";
    const mm = /(\d+)\/(\d+) up/.exec(tidal);
    say(!!mm && Number(mm[1]) < Number(mm[2]), `status: ?simulate shows a partial outage in the hub label (${tidal || "no tidal label"})`);
    say(errs.length === 0, "status: no JS errors" + (errs.length ? "\n       " + errs.join("\n       ") : ""));
    await page.close();
  }
  // 3. home (desktop): lazy map opens when the fleet section is reached
  {
    const { page, errs } = await open("index.html", [1440, 900]);
    await wait(3000);
    await page.evaluate(() => document.getElementById("fleet")?.scrollIntoView({ block: "start" }));
    await wait(10000);
    const open3d = await shown(page), st = open3d ? await canvasStats(page) : { lit: 0, colours: 0 };
    say(open3d && st.lit > 0.002 && st.colours >= 6, `home: lazy 3D map opens with content (lit ${(st.lit * 100).toFixed(2)}%, ${st.colours} colours)`);
    say(errs.length === 0, "home: no JS errors" + (errs.length ? "\n       " + errs.join("\n       ") : ""));
    await page.close();
  }
  // 3b. metrics spend landscape + ollama GPU skyline/vault (bars3d): canvases have content, no errors
  for (const [path, id, scroll, what] of [["metrics.html", "land-canvas", "sec-land3d", "metrics landscape"], ["ollama.html", "gpu-skyline", "sec-gpu3d", "ollama skyline"], ["ollama.html", "vram-vault", "sec-gpu3d", "ollama vault"]]) {
    const { page, errs } = await open(path, [1440, 1000]);
    await wait(6000);
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: "start" }), scroll);
    await wait(7000);
    const el = await page.$("#" + id);
    let ok = false, detail = "missing";
    if (el) {
      const shot = await el.screenshot({ type: "png" });
      const st = await page.evaluate(async (b64) => {
        const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + b64; });
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        const g = c.getContext("2d"); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data, set = new Set(); let lit = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 150) { lit++; set.add((d[i] >> 5) + "," + (d[i + 1] >> 5) + "," + (d[i + 2] >> 5)); }
        return { lit: lit / (d.length / 4), colours: set.size };
      }, shot.toString("base64"));
      ok = st.lit > 0.01 && st.colours >= 4; detail = `lit ${(st.lit * 100).toFixed(1)}%, ${st.colours} colours`;
    }
    say(ok, `${what}: canvas has content (${detail})`);
    say(errs.length === 0, `${what}: no JS errors` + (errs.length ? "\n       " + errs.join("\n       ") : ""));
    await page.close();
  }
  // 4. home on a phone: lite mode, scrolling stays possible (touch-action pan-y)
  {
    const { page, errs } = await open("index.html", [390, 844], { mobile: true });
    await wait(3000);
    await page.evaluate(() => document.getElementById("fleet")?.scrollIntoView({ block: "start" }));
    await wait(10000);
    const open3d = await shown(page);
    const ta = open3d ? await page.evaluate(() => document.getElementById("topo-3d-canvas").style.touchAction) : "";
    say(open3d, "phone: lite 3D map opens");
    say(ta === "pan-y", `phone: canvas keeps vertical page scroll (touch-action ${ta || "unset"})`);
    say(errs.length === 0, "phone: no JS errors" + (errs.length ? "\n       " + errs.join("\n       ") : ""));
    await page.close();
  }
  await gl.close();
}

try {
  const fn = { csp, budget, offline, visual, webgl }[mode];
  if (!fn) { console.error("usage: browser_checks.mjs csp|budget|offline|visual|webgl [--update]"); process.exit(2); }
  await fn();
} finally { await browser.close(); }
process.exit(failed ? 1 : 0);
