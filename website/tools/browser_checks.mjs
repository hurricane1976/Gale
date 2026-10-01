#!/usr/bin/env node
/* GALE — real-browser checks (puppeteer-core + the system chromium).
     node tools/browser_checks.mjs csp        console/CSP-report-only violations + JS errors per page
     node tools/browser_checks.mjs budget     per-page transfer budgets (encoded bytes of JS/CSS/total)
     node tools/browser_checks.mjs offline    SW installs, then pages still open offline with the shell
     node tools/browser_checks.mjs visual     screenshot 10 pages x 3 viewports, diff vs tools/visual-baseline
     node tools/browser_checks.mjs visual --update   (re)write the baselines
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

try {
  const fn = { csp, budget, offline, visual }[mode];
  if (!fn) { console.error("usage: browser_checks.mjs csp|budget|offline|visual [--update]"); process.exit(2); }
  await fn();
} finally { await browser.close(); }
process.exit(failed ? 1 : 0);
