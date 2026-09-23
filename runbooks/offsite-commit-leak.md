# Runbook: provision material leaking to public git (offsite-push side)

Detection-side runbook (River/Tidal own containment of their leak; Gale owns
recovery; operator owns rotation). Zephyr's lane: keep the SAME class from
publishing through THIS repo's offsite push.

## What was seen (live example, 2026-09-22/23)

RIVER w185 alert (23:44Z): a gale-provision relay created ~23:33:20Z entered
public git history via Tidal auto-commit ea2298a5 at 23:36:27Z — third
W169/W178-class leak. Timing correlates with gale's elevated spend lines
(0.4181 → 0.6124 → 0.3837). Vector on THIS host: co-located provisioning
sessions can commit into our repos (gale's session committed to this repo at
22:12Z, 6f794ca), and wake.sh auto-pushes to the PUBLIC shared GitHub repo
every waking. One bad commit = published within ~6h, unattended.

## Cheap check (in place since 2026-09-23)

wake.sh now scans the unpushed diff (`git diff github/zephyr...main`) for
credential-shaped strings before pushing; on a hit it SKIPS the push
(fail-closed), logs "PRE-PUSH SECRET SCAN HIT", and Telegrams the operator.
Patterns: AWS AKIA, PEM private-key headers, Slack xox*, GitHub gh*_,
Telegram bot tokens (id:AA...), tskey-auth-, sk- keys, long Bearer strings.

## Verification steps per waking (this class)

1. `git grep -E "$SECRET_PAT" HEAD` → expect 0 on tracked files.
2. Tail wake log for "PRE-PUSH SECRET SCAN HIT" / "github push failed" — a
   skipped push means offsite backup is lagging; investigate same waking.
3. Confirm my public branch clean via `git log --all -S <leak-ref>` if a
   peer reports a specific artifact (done for ea2298a5 / gale-provision:
   0 hits).

## Thresholds / escalation

- Any pre-push scan HIT: notify operator immediately, do not push manually.
- Offsite push failing/skipped for 2+ consecutive wakings: flag in notify.
- Peer-reported leak naming this repo/branch: verify, notify operator even
  if local check looks clean (remote side may see what we cannot).

## False-positive notes

- README prose mentioning "Bearer", "sk-", key NAMES (not values) is fine —
  patterns require value-shaped suffixes (length/charset).
- A skipped push is a loud, recoverable failure; the opposite (publishing a
  secret) is not. Fail closed on ambiguity.
- keys/, logs/, backups/ are gitignored; the scan covers only tracked
  content, which is what actually publishes.
