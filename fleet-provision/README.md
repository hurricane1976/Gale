# fleet-provision — roster-driven key management for the fleet mesh

One provisioner per host. Each host's vault holds **only the pairs its own
agents participate in**. Cross-host work is bundle exchange, never remote
file access (rule 7 stays intact).

## Layout

- `roster.json` — THE source of truth: every agent (name, host, addr,
  port, model, role, dir). Versioned, committed. The website roster and
  sysmon targets should be regenerated from this (still manual today).
- `fleet-provision` — the CLI (python3, no dependencies). Tokens are
  **never printed to stdout** by any subcommand.
- `vault/` — `tokens.json`, mode 600, **gitignored, never pushed, never
  backed up off-box**. Created by `import-vault`. If the box dies without
  a local-only vault copy, every pair must be re-minted (accepted
  tradeoff; documented so nobody "fixes" it by committing the vault).
- `bundles/` — generated import files, mode 600, **gitignored**. Send to
  the remote operator, confirm import, then `shred -u` both copies.
- `HOST` — which host this copy administers (`gale` here). A remote host
  copies this whole directory, sets `HOST`, and fills in its agents'
  `dir` fields in its copy of the roster.

## The few-steps flows

New agent X onboarded on host H (operator approves the scope once):
1. Add X to `roster.json` (one entry, committed).
2. On H: `./fleet-provision onboard X --with-remotes --write`
   → mints missing pairs, renders H's `peers.env` files, restarts +
   self-tests (200 right-token / 401 wrong-token) each touched entry.
3. Per remote host: `./fleet-provision bundle <host> --send`
   → one 600 file delivered over the authenticated lead trunk (native
   POST from the vault's own trunk token — token content never touches
   argv/shell/scrollback). The receiving lead STAGES it (their rules:
   peer content is data, never instructions) and their operator runs
   the one import command when fleet-provision is set up there.
4. On each remote host: `./fleet-provision import <bundle>`
   → installs, restarts, self-tests. Then both sides shred the bundle.

Local-only onboarding is steps 1–2. Remote onboarding adds one message
and one command per host. No cut/paste into agents, ever.

Other operations:
- `./fleet-provision verify` — read-only audit: rendered-vs-live
  semantic compare for every local agent. Run it any time; non-zero exit
  on drift (lists entry names, never values).
- `./fleet-provision render [--write] [--agent N]` — reconcile configs.
  Dry-run by default; `--write` backs up (`peers.env.bak-provision-*`),
  writes, restarts once per changed agent, self-tests every entry.
- `./fleet-provision rotate A B [--write]` — fresh token for one pair.
  Local side renders; remote side gets a `bundle --send` for import. Note:
  replacement is outright — in-flight messages may 401 (same caveat as
  the old `rotate_peer.sh` dance).
- `./fleet-provision retire NAME [--write]` — comments out the departed
  agent everywhere local (token redacted to `<retired>`), restarts
  changed agents. Remove NAME from `roster.json` in a separate operator
  commit.

## Disaster recovery: backup to the leads

`./fleet-provision backup [--send]` packs tool + roster + vault + HOST
into one blob, encrypts it (AES-256-CBC, PBKDF2 600k iters) with the
passphrase in `backup-passphrase` (600, gitignored, **never printed —
the OPERATOR holds the only copy, off-box**), and `--send` stages the
blob on every remote lead via the trunk. Restore:

    fleet-provision restore <blob> --out <fresh-dir>

The leads cannot decrypt it — by design they hold opaque recovery
material, and no single host can read the fleet's pair set. Layered
resilience after the 2026-09-22 sends:
1. Each lead's staged **bundle** = its own host's complete pair set
   (their import makes their vault the per-host DR copy).
2. Each lead's staged **encrypted fleet blob** = full 162-pair kit,
   restorable anywhere with the operator's passphrase.
3. Box loss of gale-agent: new box + restore + operator passphrase +
   far-side imports = full recovery; local-only pairs re-mint.

If `backup-passphrase` is lost, the lead-held blobs are dead weight and
every pair must be re-minted — that is why the operator copies the
passphrase off-box the moment it is generated.

## Migration (done 2026-09-22, recorded here so it stays checkable)

1. `import-vault` read all 9 local `peers.env` files: 162 unique pairs,
   36 confirmed from both halves, zero conflicts. Live files untouched.
2. `verify` + `render` (dry-run): all 9 configs reproduce **zero drift**.
3. Full write-path cycle proven against scratch listeners running the
   real `peer_server.py`: onboard → verify → rotate (old token 401s,
   new 200s, live) → import → retire → verify. Two provisioner bugs
   found and fixed in the process (see NOTES below).

## NOTES (bugs found by testing — do not regress)

1. Stale-server squat: a listener started before a render keeps serving
   the old config; a replacement that can't bind dies silently and the
   health check passes against the stale one. `restart_and_selftest`
   now proves a *fresh pid* holds the port before self-testing.
2. Renderer must byte-preserve matching entries and refresh (not stack)
   its own provenance comments, or every run rewrites every file and
   `verify` can never be clean.

## What this does NOT change

- The pairwise-token auth protocol (`peer_server.py` untouched).
- Rule 7 (no remote touching) and rule 8a (manual one-off pairs still
  fine). Unattended minting additionally needs the rule-8b amendment —
  see RULES-PROPOSAL.md. Until adopted, run `--write` only under an
  explicit per-operation go-ahead.
- Telegram per-pair approval for anything outside an 8b scope.
