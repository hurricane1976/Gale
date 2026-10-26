# Alert re-buzz / history churn from text-drifting dedup keys

## Symptom

- Operator's device got a `sev: crit` "GALE — fleet alert" web push at
  ~00:00Z **every midnight** (2026-10-23, -24, -25, -26) for the *same*
  persisting condition (`maistral missed expected wakes`), with no new
  underlying event.
- `alert-history.json` shows a spurious `close`+`open` pair at each midnight
  for that same condition, so its "open since" clock reset daily.

## Root cause

Two dedup keys included the alert's **text**, and one synthesized alert's
text is time-varying by design:

- `fleet_api.py` `agent-missed-wake` text embeds `~{gap_h:.0f}h cadence`,
  where `gap_h = 24 / (wakes_14d / 14)` — a **self-tuning estimate from the
  rolling 14-day window**. As the window slides (UTC midnight), the rounded
  hour value shifts (`~8h` → `~9h` → `~10h` → `~11h`), changing the text.
- `gale_push.py` `alert_fingerprint()` = `sev|kind|text[:120]` → text drift
  looked like a **new** crit → push (its `_last_sent` set is in-memory, so a
  service restart also re-buzzes once — known, accepted).
- `fleet_api.py` `_alert_key()` = `kind|text` → history logged a close+open
  pair instead of recognizing the same condition.

## Fix (2026-10-26T12Z)

Both keys now prefer the envelope's **stable id** — `sha256(kind|host|agent)`,
added during envelope enrichment, does not drift with text:

- `gale_push.py` `alert_fingerprint()`: `sev|<id>` when `id` present (sev kept
  in the key so a warn→crit escalation still re-buzzes); legacy text hash only
  as fallback for id-less alerts.
- `fleet_api.py` `_alert_key()`: `<id>` when present; `kind|text` fallback.

Services restarted: `gale-fleet-api`, `gale-push`. Tests run before restart:
same-id/different-text fingerprints are equal; sev escalation differs;
id-less fallback matches legacy output.

## One-time artifacts of the fix

- One extra push at the dedup-key switch (12:03:02Z 2026-10-26) — the new key
  format was "fresh" by definition. Not a regression.
- One last close+open pair in alert history as keys migrate from text-based
  to id-based.

## How to spot a recurrence sooner

- `alert-history.json` events with the same `kind`+agent opening and closing
  on a daily cadence = a dedup key is drifting again.
- Push receipts in `journalctl -u gale-push` at midnight with no new
  underlying condition in `/var/log/gale-alerts.jsonl` = same.
- Rule of thumb: **dedup/history keys must be built from stable identity
  (id/kind/agent), never from text that embeds computed time-varying values.**
