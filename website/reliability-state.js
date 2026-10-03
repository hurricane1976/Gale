/* Pure presentation policy: unknown and stale are never healthy. */
export function level(slo) {
  if (!slo || slo.actual == null || !Number.isFinite(slo.actual) || ["unknown", "stale"].includes(slo.state)) return "unknown";
  if (slo.actual < slo.target) return "crit";
  if (slo.state === "degraded" || (slo.budget_remaining_pct != null && slo.budget_remaining_pct < 50)) return "warn";
  return "ok";
}

export function freshness(feed, now = Date.now(), maxAgeMs = 120000) {
  const ts = Date.parse(feed?.generated_at);
  if (!Number.isFinite(ts) || ts > now + 60000) return "unknown";
  return now - ts > maxAgeMs ? "stale" : "ok";
}
