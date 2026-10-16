/* Alerts the site chooses not to display. Roster drift (wake.sh / opencode.json vs the page
   roster model) is tracked by tools/roster_check.py and is deliberately kept off the pages.
   The alert itself still exists in Alertmanager and /api/fleet/alerts; this is display-only. */
const HIDDEN = /roster[\s_-]*drift/i;
export const isHiddenAlert = (a) => HIDDEN.test(`${a && a.text || ""} ${a && a.kind || ""} ${a && a.name || ""}`);
export const visibleAlerts = (list) => (Array.isArray(list) ? list : []).filter((a) => !isHiddenAlert(a));
