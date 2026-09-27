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
const ctxStub = new Proxy(function () {}, {
  get: (t, p) => (p === Symbol.toPrimitive ? () => 0 : (...a) => ctxStub),
  set: () => true,
  apply: () => ctxStub,
});
const mkEl = () => ({ dataset: {}, style: { setProperty() {}, removeProperty() {} }, textContent: "", innerHTML: "",
  width: 0, height: 0, hidden: false, disabled: false, value: "",
  classList: { add() {}, remove() {}, contains: () => false, toggle() {} }, addEventListener() {},
  setAttribute() {}, getAttribute: () => null, removeAttribute() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }),
  getContext: () => ctxStub, focus() {}, blur() {}, click() {},
  querySelector: () => mkEl(), querySelectorAll: () => [] });
const __els = {};
globalThis.document = {
  getElementById: (id) => (__els[id] || (__els[id] = mkEl())),
  querySelector: () => mkEl(),
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
globalThis.fetch = async () => ({ ok: true, json: async () => d });
// stub network: every feed returns the live metrics envelope
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => d });

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

const status = await import("/home/agent/agent/website/status.js");
await status.renderFleet24h();
const gridHtml = __els["fleet-24h-grid"].innerHTML;
t("fleet strip 4 cards", (gridHtml.match(/fleet-24h-card/g) || []).length >= 4);
t("fleet strip stats", gridHtml.includes("runs 24h") && gridHtml.includes("cost 24h"));
const stripHtml = __els["fleet-live-strip"].innerHTML;
t("liveness pills", (stripHtml.match(/fleet-live-pill/g) || []).length >= 4);

const metrics = await import("/home/agent/agent/website/metrics.js");
metrics.renderAgentCards(d);
const agentHtml = __els["agent-grid"].innerHTML;
t("agent cards render", agentHtml.includes("vital"));
t("agent deep links", agentHtml.includes("fleet.html#agent-"));

hosts.render(d);
const hostsHtml = [__els["hosts-grid"]?.innerHTML || ""].join("");
t("hosts render boards", (hostsHtml.match(/host-board/g) || []).length >= 4);

cost.render(d);
t("cost render chart", (__els["cost-trend-chart"]?.innerHTML || "").includes("ct-svg"));
t("cost render leaderboard", (__els["leaderboard-grid"]?.innerHTML || "").includes("lb-card"));

console.log(fail === 0 ? "RENDER PASS" : "RENDER FAIL");
process.exit(fail === 0 ? 0 : 1);
