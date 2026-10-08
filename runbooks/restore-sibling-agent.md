# Restore a sibling agent's snapshot (verify, drill, report — READ-ONLY)

Role: Backup & Restore Guardian. Sibling trees on this host are READ-ONLY for
me everywhere it is not my job (AGENT.md rule 7) — and *verifying their
backups* IS my job (role item 4). This runbook is the drill: prove a sibling's
newest snapshot is extractable and faithful, without ever touching their live
tree. Restoring a sibling's *live* tree is their job (or the operator's); my
deliverable is evidence + a report, not a rescue.

## What this runbook covers (and does not)

- **Covers:** integrity + restore-readiness drill on any co-resident sibling's
  newest `backups/<agent>-<ts>Z.tar.gz` (list + extract to scratch + compare
  against their live files) and the read-only drift report that follows.
- **Does NOT cover:** writing anything inside `/home/agent/<sibling>/` (their
  `backup.sh` runs under their own cron; a broken tree is *reported*, not
  "fixed" by me), restarting their services, or re-provisioning their keys.
  If a sibling is down and their data is at risk, that goes to the operator
  and the sibling's own ASK-equivalent — see "Reporting" below.

Sibling trees may contain live secrets under `keys/`. Never print, copy, or
log key material; the drill compares *metadata and file bytes locally* and
records only counts, sizes, and pass/fail.

## Drill procedure (tested w79 2026-10-08 on BORA)

Work in a scratch dir under `/tmp/opencode/`. Every command below only *reads*
the sibling's tree.

```bash
set -euo pipefail
S=bora                          # sibling name (lowercase)
SB=/home/agent/$S
SNAP=$(ls -1t "$SB"/backups/${S}-*.tar.gz | head -1)   # newest
echo "drilling: $SNAP"

# 1. integrity: archive lists cleanly, count entries
tar -tzf "$SNAP" >/dev/null && echo "OK: tar readable"
tar -tzf "$SNAP" | wc -l

# 2. keys hygiene: snapshot must hold ONLY *.example templates
tar -tzf "$SNAP" | grep "keys/" | grep -v "keys/$" | grep -v "\.example$"
#    ^ any line printed here is a FINDING (live secret in a snapshot)

# 3. extract to scratch
TMP=$(mktemp -d /tmp/opencode/restore-${S}.XXXXXX)
tar -xzf "$SNAP" -C "$TMP"

# 4. compare key paths against their LIVE tree (byte-identical or explain)
for p in AGENT.md NOTES.md ASK.md backup.sh wake.sh notify.sh; do
    cmp -s "$TMP/$p" "$SB/$p" && echo "OK: $p" || echo "DIFF/MISSING: $p"
done
#    DIFF on tracked files is expected only right after the sibling commits
#    work newer than the snapshot — age the two and explain before alarming.
#    To prove "live-ahead, benign" on NOTES.md: live file should be the
#    snapshot's bytes PLUS appends (prefix check), not diverged content:
#      SSZ=$(stat -c %s "$TMP/NOTES.md")
#      head -c "$SSZ" "$SB/NOTES.md" | cmp -s - "$TMP/NOTES.md" && echo benign
#    (extract-all then read "$TMP/NOTES.md"; a single-file re-extract must
#    quote the stored name WITH its ./ prefix: `tar -xzf ... ./NOTES.md` —
#    plain "NOTES.md" will report "Not found in archive" and is a drill-bug,
#    not a data problem — caught and fixed in the w79 test below.)

# 5. clean up
rm -rf "$TMP"
```

Interpretation:

- All OK + no keys findings → snapshot is restore-ready. Record PASS in the
  ledger row for the waking.
- `tar -tzf` fails → corrupt/truncated archive: FINDING (their backup is not
  restorable). Report; do not repair in their tree.
- Keys findings → live secret leaked into a snapshot: FINDING, escalate to the
  operator immediately (this is a security event, not a backup-quality one).
- No new snapshot in >6h → drift per the 6h bar; see `restore-this-agent.md`
  and the drift section of NOTES.md for the reporting pattern.

## Reporting a sibling drift or failure

1. Verify from **their own logs** (`$SB/logs/`) what happened — read-only.
2. Confirm their newest retained snapshot is itself intact (`tar -tzf`) —
   "data never at risk" is the line that separates a wake-miss from a loss.
3. Write the finding into my `NOTES.md` + `ledger/backup-ledger.md` + `ASK.md`.
4. Peer note (`./send_to_peer.sh <name> "..."`) only when the sibling cannot
   self-diagnose (w68 precedent) — shared-cause outages are self-recovering
   (w59/w71/w78 precedent); spare the channel.
5. Operator gets it via this waking's `notify.sh` summary; ASK.md carries the
   open item until resolved.

## Evidence

### 2026-10-08 w79 04:35Z — first drill, BORA (runbook's own test)

- Drill target: `bora-20261008T002549Z.tar.gz` (148K, 64 entries, `tar -tzf`
  clean; BORA's first post-GLM run after its w78 stale-config shim miss).
- Keys hygiene: only `keys/*.example` templates in the archive — no live
  secrets.
- Scratch extract → `cmp` of AGENT.md / ASK.md / backup.sh / wake.sh /
  notify.sh against BORA's live tree: all byte-identical. NOTES.md differed —
  **drilled down: live (149,180B) = snapshot bytes (145,343B) + appends**
  (prefix check passed, 85 `##` headings); benign live-ahead (their 00:25Z
  wake session wrote its entry after the snapshot was taken). Not a finding.
- Drill-bug caught and fixed in the runbook itself: single-file extract needs
  the stored `./` prefix (`tar -x ... ./NOTES.md`); plain name reports "Not
  found in archive" — my error, not BORA's data.
- Scratch cleaned; zero writes to `/home/agent/bora/`. **PASS.**
- Same-morning spot checks (tar -tzf readability only): VORTEX 146 entries /
  MAISTRAL 125 / ZEPHYR 57 / gale-agent-root 511 — all readable.
