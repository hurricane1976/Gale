/* Headless render test: stubs DOM globals, imports the real modules,
   feeds LIVE api/fleet/metrics data through the pure render functions. */
import { readFileSync } from "fs";
import { execSync } from "child_process";

globalThis.window = {
  matchMedia: () => ({ matches: false }),
  addEventListener: () => {},
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
  scrollY: 0, CSS: undefined,
};
const mkEl = () => ({ dataset: {}, style: {}, textContent: "", innerHTML: "",
  classList: { add() {}, contains: () => false }, addEventListener() {},
  setAttribute() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }) });
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => mkEl(),
  addEventListener: () => {},
  documentElement: { classList: { add() {} } },
  visibilityState: "visible",
};
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.performance = { now: () => 0 };

const raw = execSync('curl -s --max-time 10 http://100.66.39.59:8090/api/fleet/metrics').toString();
const d = JSON.parse(raw);

const cost = await import("/home/agent/agent/website/cost.js");
const hosts = await import("/home/agent/agent/website/hosts.js");

let pass = 0, fail = 0;
const t = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("ok  ", name); }
  else { fail++; console.log("FAIL", name, extra); }
};

t("money(0)", cost.money(0) === "$0.00");
t("money(3.09)", cost.money(3.0918) === "$3.09");
t("money(24)", cost.money(24.12) === "$24");
t("money(null)", cost.money(null) === "–");

const chart = cost.trendChart(d);
t("chart svg", chart.includes("<svg") && chart.includes("ct-line"));
for (const h of ["gale", "tidal", "mountain", "beacon"]) t(`chart has ${h}`, chart.includes(h));
t("chart total line", chart.includes("ct-total"));
t("chart empty-data guard", cost.trendChart({}).includes("no cost series"));

const lb = cost.leaderboard(d);
t("leaderboard cards", (lb.match(/lb-card/g) || []).length >= 5);
const lbCosts = [...lb.matchAll(/lb-cost">\$([\d.]+)/g)].map((m) => parseFloat(m[1]));
t("leaderboard sorted desc", lbCosts.length > 1 && lbCosts.every((v, i, a) => i === 0 || a[i - 1] >= v), JSON.stringify(lbCosts));
t("leaderboard empty guard", cost.leaderboard({}).includes("no agent costs"));

const board = hosts.hostBoard("gale", d);
t("host board name", board.includes("gale"));
t("host board stats", board.includes("hb-stats") && board.includes("last 24h"));
t("host board agents", board.includes("hb-chip") && board.includes("zephyr"));
const spark = hosts.sparkline([1, 2, 3], "#fff");
t("sparkline svg", spark.includes("<svg") && spark.includes("polyline"));

console.log(fail === 0 ? "RENDER PASS" : "RENDER FAIL");
process.exit(fail === 0 ? 0 : 1);
