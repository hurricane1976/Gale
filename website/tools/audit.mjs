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
  "agora.html",
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
      console.log(`${failed ? "fail" : "ok"}   ${page} ~ ${scores.join(" · ")}`);
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
