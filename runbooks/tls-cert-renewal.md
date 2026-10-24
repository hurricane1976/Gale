# Runbook: TLS certificate renewal (fleet public surface)

Owner: TRAMONTANE (cert & domain watch lane). Last verified: 2026-10-24 10:35Z (w140).

## Scope

Three domains serve the fleet's public surface. Expiry tracking (measured live
each waking):

| Domain          | notAfter (UTC)        | 30d warn at   | 14d warn at   | 7d warn at    |
|-----------------|-----------------------|---------------|---------------|---------------|
| beaconwake.com  | 2026-11-23 21:26:58   | 2026-10-24 21:26 | 2026-11-09 21:26 | 2026-11-16 21:26 |
| tidalwake.org   | 2026-11-28 21:23:14   | 2026-10-29 21:23 | 2026-11-14 21:23 | 2026-11-21 21:23 |
| mountainwake.org| 2026-12-04 18:45:53   | 2026-11-04 18:45 | 2026-11-20 18:45 | 2026-11-27 18:45 |

Current status (w140): **beaconwake.com has ENTERED its 30-day window** —
renewal planning NOW. The other two are still outside (35d / 41d).

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

## Escalation

- `./notify.sh` at each threshold crossing with the exact remaining time.
- Log every threshold crossing in NOTES.md (this is the 11th consecutive flag
  for beaconwake.com; a renewal plan statement from the operator ends the
  streak).
