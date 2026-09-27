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
globalThis.__appended = [];
const mkBody = () => ({ style: {}, append(...a) { globalThis.__appended.push(...a); } });
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
  querySelector: (sel) => (__els["q:" + sel] || (__els["q:" + sel] = mkEl())),
  querySelectorAll: () => [],
  createElement: (tag) => mkEl(),
  body: mkBody(),
  addEventListener: () => {},
  documentElement: { classList: { add() {} } },
  visibilityState: "visible",
};
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.location = { hash: "", origin: "http://test", pathname: "/" };
globalThis.performance = { now: () => 0 };

const raw = execSync('curl -s --max-time 10 http://100.66.39.59:8090/api/fleet/metrics').toString();
const d = JSON.parse(raw);
const actRaw = execSync('curl -s --max-time 10 http://100.66.39.59:8090/api/fleet/activity').toString();
const actData = JSON.parse(actRaw);
const statRaw = execSync('curl -s --max-time 10 http://100.66.39.59:8090/api/status.json').toString();
const statData = JSON.parse(statRaw);
// stub network: route each feed to its live payload
globalThis.fetch = async (url) => {
  const u = String(url);
  const body = u.includes("status.json") ? statData
    : (u.includes("/activity") || u.includes("agora/posts")) ? actData : d;
  return { ok: true, status: 200, json: async () => body };
};

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
t("week summary", (__els["cost-trend-sum"]?.innerHTML || "").includes("last 7d"));
t("mover line", (__els["leaderboard-fresh"]?.textContent || "").includes("top 6"));

const drilldown = await import("/home/agent/agent/website/drilldown.js");
drilldown.render(d.per_agent_24h[2]);
const ddPanel = globalThis.__appended.find((el) => el && String(el.innerHTML || "").includes("dd-body"));
t("drilldown renders panel", !!ddPanel);
t("drilldown has stats", (ddPanel?.innerHTML || "").includes("dd-stats"));

const activity = await import("/home/agent/agent/website/activity.js");
activity.render(actData);
const streamHtml = __els["stream-body"]?.innerHTML || "";
t("activity renders days", streamHtml.includes("tl-day"));
t("activity renders items", streamHtml.includes("tl-item"));

status.render(statData);
t("status board vitals", (__els["vitals-grid"]?.innerHTML || "").includes("vital"));
t("status board host info", (__els["host-info"]?.innerHTML || "").includes("<dt>"));
t("status board services", (__els["q:#services-table tbody"]?.innerHTML || "").includes("<tr>"));

const main = await import("/home/agent/agent/website/main.js");
await main.renderLivePulse();
t("pulse renders", (__els["pulse-feed"]?.innerHTML || "").includes("pulse-row"));
main.renderHistory(actData);
const histHtml = __els["q:.history-list"]?.innerHTML || "";
const nCommits = (actData.events || []).filter((e) => e.kind === "commit").length;
t("history renders commits", nCommits === 0 || histHtml.includes("h-time"));
await main.renderSpend();
t("spend renders", (__els["spend-bars"]?.innerHTML || "").includes("spend-row"));

console.log(fail === 0 ? "RENDER PASS" : "RENDER FAIL");
process.exit(fail === 0 ? 0 : 1);
