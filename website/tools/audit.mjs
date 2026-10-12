/* GALE — Lighthouse CI gate (ROADMAP #10). Runs Lighthouse (whose
   accessibility category is powered by axe-core) against the local nginx
   site and fails -- exit 1 -- when any gated category drops below its
   threshold on any page. Standalone via `npm run audit`, or from smoke.sh.
   Env: GALE_BASE (default http://127.0.0.1:8090), GALE_CHROME (chromium path). */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const BASE = process.env.GALE_BASE || "http://127.0.0.1:8090";
const CHROME = process.env.GALE_CHROME || "/usr/bin/chromium-browser";
const PAGES = [
  "index.html", "fleet.html", "status.html", "metrics.html",
  "observability.html", "ollama.html", "network.html", "weather.html",
  "agora.html", "galaxy.html", "reliability.html", "operations.html", "runbooks.html",
  "home.html", "404.html", // the audit gate never saw these two (#94)
];

/* Deliberately loose on performance (backend is a Python http.server on a
   home host; the point is catching regressions, not chasing 100) and firm
   on accessibility (axe-core via Lighthouse) / best-practices. SEO caps at
   0.5 because robots.txt deliberately `Disallow: /` -- this is a private
   tailnet site, so `is-crawlable` failing is by design; the gate still
   catches real SEO regressions (missing description, viewport, titles). */
const THRESHOLDS = {
  accessibility: 0.9,
  "best-practices": 0.9,
  seo: 0.5,
  performance: 0.6,
};

const CHROME_FLAGS = ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"];

const round = (score) => (score == null ? "n/a" : String(Math.round(score * 100)));

let failed = false;

/* pass #5 #100: static source gates alongside the Lighthouse run —
   (a) offline.html exists and is precached by sw.js (the offline promise),
   (b) no console.log left in page scripts (RUM/diagnostics go through
   __galeRUMRecord/__galeToast, console.warn/error remain allowed),
   (c) every page ships the apple-touch-icon link (iOS install surface). */
{
  const { readFileSync, existsSync } = await import("node:fs");
  const root = new URL("..", import.meta.url).pathname;
  const problems = [];
  if (!existsSync(root + "offline.html")) problems.push("offline.html missing");
  const sw = readFileSync(root + "sw.js", "utf8");
  if (!sw.includes('"/offline.html"')) problems.push("sw.js does not precache /offline.html");
  for (const page of PAGES) {
    const html = readFileSync(root + page, "utf8");
    if (!html.includes('rel="apple-touch-icon"')) problems.push(`${page}: missing apple-touch-icon link`);
    if (!html.includes("<html lang=")) problems.push(`${page}: missing <html lang>`);
  }
  const { readdirSync } = await import("node:fs");
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".js") || ["sw.js", "rum.js", "boot-shared.js", "lost-boot.js", "runbooks-steps.js", "offline.js", "zod-lite.js", "shared.js"].includes(f)) continue;
    const src = readFileSync(root + f, "utf8");
    if (/\bconsole\.log\(/.test(src)) problems.push(`${f}: console.log found (use __galeToast / __galeRUMRecord)`);
  }
  if (problems.length) {
    for (const p of problems) console.log(`fail   static-gate: ${p}`);
    failed = true;
  } else {
    console.log(`ok     static-gate: offline shell + apple-touch-icon + lang + no console.log across ${PAGES.length} pages`);
  }
}


const chrome = await chromeLauncher.launch({
  chromePath: CHROME,
  chromeFlags: CHROME_FLAGS,
});

try {
  for (const page of PAGES) {
    const url = `${BASE}/${page}`;
    try {
      const { lhr } = await lighthouse(
        url,
        {
          logLevel: "error",
          output: "json",
          onlyCategories: Object.keys(THRESHOLDS),
          port: chrome.port,
        },
        undefined,
      );
      const scores = Object.entries(THRESHOLDS).map(([cat, min]) => {
        const got = lhr.categories[cat]?.score;
        const ok = got != null && got >= min;
        if (!ok) failed = true;
        return `${cat} ${round(got)}/${Math.round(min * 100)}${ok ? "" : " FAIL"}`;
      });
      console.log(`${scores.some((x) => x.endsWith(" FAIL")) ? "fail" : "ok"}   ${page} ~ ${scores.join(" · ")}`);
    } catch (e) {
      console.log(`fail ${page}: lighthouse error: ${e.message}`);
      failed = true;
    }
  }
} finally {
  await chrome.kill();
}

if (failed) {
  console.log("AUDIT FAIL");
  process.exit(1);
}
console.log("AUDIT PASS");
