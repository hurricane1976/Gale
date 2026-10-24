/* Headless render test: stubs DOM globals, imports the real modules,
   feeds LIVE api/fleet/metrics data through the pure render functions.
   Falls back to Zod-synthetic payloads when the live API rate-limits. */
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

const fetchLive = (url) => execSync(`curl -s --max-time 5 '${url}'`, { maxBuffer: 32 * 1024 * 1024 }).toString();

// Fetch metrics first — this is the most rate-limit-prone endpoint
let d, actData, statData, telData, wakesData, asksData;
const raw = fetchLive('http://100.66.39.59:8090/api/fleet/metrics');
d = JSON.parse(raw);
if (d.error === "rate limit exceeded") {
  // Synthetic data from Zod schemas
  const { metricsPayload } = await import("/home/agent/agent/website/payloads.js");
  d = metricsPayload.parse({
    days: ["2026-10-01","2026-10-02","2026-10-03","2026-10-04","2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-10","2026-10-11","2026-10-12","2026-10-13"],
    per_agent_24h: [
      { agent:"gale", runs_24h:12, cost_24h:3.45, error_runs_24h:0, last_wake:"2026-10-13T18:00:00Z", daily_wakings_14d:[3,4,5,6,4,3,5,4,6,5,3,4,5], daily_cost_14d:[0.8,1.0,1.2,1.5,1.0,0.8,1.2,1.0,1.5,1.2,0.8,1.0,1.2], total_wakings_14d:55 },
      { agent:"zephyr", runs_24h:8, cost_24h:2.10, error_runs_24h:1, last_wake:"2026-10-13T17:30:00Z", daily_wakings_14d:[2,3,4,2,3,2,4,3,2,4,3,2,3], daily_cost_14d:[0.5,0.7,1.0,0.5,0.7,0.5,1.0,0.7,0.5,1.0,0.7,0.5,0.7], total_wakings_14d:35 },
      { agent:"squall", runs_24h:6, cost_24h:1.80, error_runs_24h:0, last_wake:"2026-10-13T16:00:00Z", daily_wakings_14d:[2,2,3,2,2,3,2,3,2,2,3,2,2], daily_cost_14d:[0.5,0.5,0.8,0.5,0.5,0.8,0.5,0.8,0.5,0.5,0.8,0.5,0.5], total_wakings_14d:28 },
      { agent:"tempest", runs_24h:5, cost_24h:1.25, error_runs_24h:0, last_wake:"2026-10-13T15:00:00Z", daily_wakings_14d:[1,2,2,1,2,1,2,2,1,2,2,1,2], daily_cost_14d:[0.3,0.5,0.5,0.3,0.5,0.3,0.5,0.5,0.3,0.5,0.5,0.3,0.5], total_wakings_14d:21 },
      { agent:"vortex", runs_24h:4, cost_24h:0.95, error_runs_24h:0, last_wake:"2026-10-13T14:00:00Z", daily_wakings_14d:[1,1,2,1,1,2,1,2,1,1,2,1,2], daily_cost_14d:[0.2,0.2,0.5,0.2,0.2,0.5,0.2,0.5,0.2,0.2,0.5,0.2,0.5], total_wakings_14d:18 },
    ],
    fleet_status: { gale: {listener:"gale",state:"ok",code:200}, zephyr: {listener:"zephyr",state:"ok",code:200}, squall: {listener:"squall",state:"ok",code:200}, tempest: {listener:"tempest",state:"ok",code:200}, vortex: {listener:"vortex",state:"ok",code:200} },
    coverage: { total: 5, healthy: 5 }, sources: { local: ["gale","zephyr","squall","tempest","vortex"] },
    cost_coverage: { total: 5, covered: 5 }, cost_coverage_by_host: { gale: true, zephyr: true, squall: true, tempest: true, vortex: true },
    daily_wakings_by_host: { gale: [3,4,5,6,4,3,5,4,6,5,3,4,5], zephyr: [2,3,4,2,3,2,4,3,2,4,3,2,3] },
    daily_cost_by_host: { gale: [0.8,1.0,1.2,1.5,1.0,0.8,1.2,1.0,1.5,1.2,0.8,1.0,1.2], zephyr: [0.5,0.7,1.0,0.5,0.7,0.5,1.0,0.7,0.5,1.0,0.7,0.5,0.7] },
    runs_24h_by_host: { gale: 12, zephyr: 8, squall: 6, tempest: 5, vortex: 4 },
    cost_24h_by_host: { gale: 3.45, zephyr: 2.10, squall: 1.80, tempest: 1.25, vortex: 0.95 },
    error_runs_24h_by_host: { gale: 0, zephyr: 1, squall: 0, tempest: 0, vortex: 0 },
    last_wake_by_host: { gale: "2026-10-13T18:00:00Z", zephyr: "2026-10-13T17:30:00Z", squall: "2026-10-13T16:00:00Z", tempest: "2026-10-13T15:00:00Z", vortex: "2026-10-13T14:00:00Z" },
    agents_by_host: { gale: ["gale"], zephyr: ["zephyr"], squall: ["squall"], tempest: ["tempest"], vortex: ["vortex"] },
    generated_at: "2026-10-13T19:00:00Z",
  });
  // Synthesize other feeds from Zod defaults
  const { activityPayload, statusPayload, telemetryPayload, wakesPayload, asksPayload } = await import("/home/agent/agent/website/payloads.js");
  actData = activityPayload.parse({ events: [{ts:"2026-10-13T18:00:00Z",agent:"gale",run_id:"abc123",type:"wake",dur_s:300}], generated_at:"2026-10-13T19:00:00Z" });
  statData = statusPayload.parse({ hosts: [{name:"gale",ip:"100.66.39.59",state:"ok"}], services: {}, alerts: [] });
  telData = telemetryPayload.parse({ runs: [] });
  wakesData = wakesPayload.parse({ wakes: [] });
  asksData = asksPayload.parse({ asks: [] });
} else {
  actData = JSON.parse(fetchLive('http://100.66.39.59:8090/api/fleet/activity'));
  statData = JSON.parse(fetchLive('http://100.66.39.59:8090/api/status.json'));
  telData = JSON.parse(fetchLive('http://100.66.39.59:8090/api/fleet/telemetry'));
  wakesData = JSON.parse(fetchLive('http://100.66.39.59:8090/api/fleet/wakes'));
  asksData = JSON.parse(fetchLive('http://100.66.39.59:8090/api/fleet/asks'));
}
// stub network: route each feed to its live payload
globalThis.fetch = async (url) => {
  const u = String(url);
  const body = u.includes("status.json") ? statData
    : u.includes("wakes") ? wakesData
    : u.includes("asks") ? asksData
    : u.includes("telemetry") ? telData
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
t("fleet strip sparklines", gridHtml.includes("gale-sparkline") && gridHtml.includes("fleet-24h-spark"));
const stripHtml = __els["fleet-live-strip"].innerHTML;
t("liveness pills", (stripHtml.match(/fleet-live-pill/g) || []).length >= 4);

await status.renderWakeHeatmap();
const heatHtml = __els["wake-heat-grid"].innerHTML;
t("wake heatmap 14 rows", (heatHtml.match(/wake-heat-row/g) || []).length >= 14, `got ${(heatHtml.match(/wake-heat-row/g) || []).length}`);
t("wake heatmap 56 cells/row", (heatHtml.match(/wake-heat-cell/g) || []).length >= 14 * 56, `got ${(heatHtml.match(/wake-heat-cell/g) || []).length}`);
t("wake heatmap tooltips", heatHtml.includes("UTC") && heatHtml.includes("run"));

await status.renderWakeConsole();
const chipsHtml = __els["wake-chips"].innerHTML;
t("wake chips 14", (chipsHtml.match(/wake-chip"/g) || []).length >= 14, `got ${(chipsHtml.match(/wake-chip"/g) || []).length}`);
t("wake chips live-aware", chipsHtml.includes('data-state="live"') || chipsHtml.includes('data-state="idle"'));
const asksHtml = __els["asks-list"].innerHTML;
t("asks rows render", asksHtml.includes("asks-row") && asksHtml.includes("asks-count"), asksHtml.slice(0, 120));

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
t("family strip fallback", cost.familyStrip(d).includes("fam-bar"));
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
