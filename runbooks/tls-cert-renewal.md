# Runbook: TLS certificate renewal (fleet public surface)

Owner: TRAMONTANE (cert & domain watch lane). Last verified: 2026-10-24 22:36Z (w142).

## Scope

Three domains serve the fleet's public surface. Expiry tracking (measured live
each waking):

| Domain          | notAfter (UTC)        | 30d warn at   | 14d warn at   | 7d warn at    |
|-----------------|-----------------------|---------------|---------------|---------------|
| beaconwake.com  | 2027-01-22 20:51:04   | 2026-12-23 20:51 | 2027-01-08 20:51 | 2027-01-15 20:51 |
| tidalwake.org   | 2026-11-28 21:23:14   | 2026-10-29 21:23 | 2026-11-14 21:23 | 2026-11-21 21:23 |
| mountainwake.org| 2026-12-04 18:45:53   | 2026-11-04 18:45 | 2026-11-20 18:45 | 2026-11-27 18:45 |

Current status (w142): **beaconwake.com RENEWED 2026-10-24** (see below) —
next 30d threshold 2026-12-23. **tidalwake.org enters its 30-day window
2026-10-29 21:23Z** — renewal planning for it starts NOW. mountainwake.org
still outside (40d at w142).

## Measurement (read-only, safe every waking)

```sh
for d in beaconwake.com tidalwake.org mountainwake.org; do
  echo | openssl s_client -connect "$d:443" -servername "$d" 2>/dev/null \
    | openssl x509 -noout -enddate | sed "s/^/$d: /"
done
```

Record the exact `notAfter` in NOTES.md each waking. Escalate at 30/14/7 days
via `./notify.sh` (beaconwake.com's first sub-30d was flagged at w140).

## What breaks when a cert expires

- Browsers/clients reject the site with TLS errors; any fleet integration
  doing strict cert validation fails. Intermittent readers see downtime that
  looks like the host is down.
- Nothing on-host breaks — the tailnet and agent-to-agent traffic are
  unaffected. This is a public-surface-only outage.

## Down vs expired vs revoked (how to tell the difference)

- **Expired:** `openssl s_client` returns a cert but `openssl x509 -checkend 0`
  reports expired; browsers show `ERR_CERT_DATE_INVALID`. Site is otherwise
  reachable.
- **Revoked/mis-issued:** cert present but clients reject with
  `ERR_CERT_REVOKED` or OCSP errors. Rare; check the CA's own status page.
- **Down/slow:** no TCP handshake at all (`curl` exit 7 = connection refused,
  exit 28 = timeout), or HTTP 5xx from the origin. If the cert is fine but the
  site is unreachable, that is an outage, not a cert problem — route to the
  host-recovery runbook instead.

## Renewal path (per-domain, operator action required)

Renewal needs CA credentials/automation that only the operator holds. The
agent lane's job is to predict, warn, and verify — never to touch DNS, ACME
accounts, or server config.

1. **T-30d (NOW for beaconwake.com):** operator plans renewal — which CA,
   which automation (ACME/Let's Encrypt or the current provider's panel),
   who runs it, and whether a staging test is possible.
2. **T-14d:** if no renewal has landed, escalate again with the exact date.
3. **T-7d:** final warning; a surprise expiry at this point is a process
   failure, not a surprise.
4. **Post-renewal verification (agent-side, read-only):** re-run the
   measurement above; confirm the new `notAfter` is >60 days out and the
   serial/issuer changed. Record in NOTES.md.

## Renewal-planning questions to settle for beaconwake.com (first of the three)

1. Which CA issued the current cert (check issuer in the same
   `openssl s_client` output)?
2. Is renewal automated (ACME/auto-renew) or manual? If automated, why is it
   not firing at T-15/20d as most automation does?
3. Who/what serves TLS for these domains (shared host? CDN? each domain's own
   box)? The renewal method depends on the answer.
4. What is the fallback if renewal fails at T-7d: temporary downtime accepted,
   or a parked page with the same cert?

## Observed renewal — beaconwake.com, 2026-10-24 (w142)

The 11-waking renewal-planning flag (w132–w141) ended this waking: a fresh
cert is live. Measured read-only 22:36Z:

- issuer `Let's Encrypt CN=YE2`, subject `CN=www.beaconwake.com`
- notBefore **2026-10-24 20:51:05Z** (issued ~1h45m before my w142 waking —
  i.e. renewed by whoever holds the CA automation, landing right at the
  T-30d window start; the flag did its job)
- notAfter **2027-01-22 20:51:04Z** (90-day Let's Encrypt class)
- Planning questions answered empirically: CA = Let's Encrypt, renewal is
  automated enough to fire inside the 30d window (question 2 resolved),
  issuer/subject changed vs the tracked old expiry (step-4 check: new
  notAfter is >60d out — PASS).

Watch item: subject CN is `www.beaconwake.com` — assume SANs cover the apex
(site served fine); if a future waking sees apex-only errors, check SANs
first. Same drill applies to tidalwake.org (threshold 2026-10-29 21:23Z).

## 2026-10-29 22:35Z (w163) — tidalwake.org 30d threshold crossed

- Measured ~22:38Z: **tidalwake.org notAfter `Nov 28 21:23:14Z` → 29d 23h —
  FIRST SUB-30D READING**, landing exactly at the predicted Oct 29 22:35Z
  slot (the w155/w156 prediction held). Window opened 2026-10-29 21:23:14Z;
  **no auto-renewal yet** (~1h15m into the window at measurement).
- beaconwake.com precedent: its renewal fired ~1h45m BEFORE its T-30d
  crossing (auto-CA, Let's Encrypt 90-day class). tidalwake.org may renew
  within hours/days of the window opening — watch every waking; if still
  unrenewed at the **Nov 14 (~14d) threshold, escalate**; expiry Nov 28 is a
  foreseeable public-surface outage otherwise.
- Operator notified at the crossing via `./notify.sh` (2026-10-29 22:35Z
  waking). The 4 planning questions above remain open for tidalwake.org
  (renewal holder/automation unconfirmed for this domain — the beaconwake
  answers establish the expected pattern, not this domain's).

## Escalation

- `./notify.sh` at each threshold crossing with the exact remaining time.
- Log every threshold crossing in NOTES.md (this is the 11th consecutive flag
  for beaconwake.com; a renewal plan statement from the operator ends the
  streak).
