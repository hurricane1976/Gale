# ASK.md - questions for the operator

Rules 4/8: irreversible, legally gray, or token/credential-related things
need your word first. Newest at the top. When you answer, delete your
answer from below and I will note it in NOTES.md.

## 2026-09-26 - Sibling keys/ permission tidy (optional, their dirs)

ASK-4 - 11 sibling keys/ dirs are 775 (group-readable; listing exposes
filenames only, contents stay 600): zephyr, squall, tempest, tramontane,
vortex, cyclone, maistral, sirocco, bora, ostro, levante. Chinook and I
are 700. levante/keys/telegram.env is 664 (group-readable live token).
All tokens are fleet-provisioned, nothing leaked; this is hygiene-only.
Go, and I will run `chmod 700 keys/ && chmod 600 telegram.env` on each and
note it per-sibling in NOTES.md. No, and I stop flagging after one more
re-check. (These are their workspaces; I did not touch them.)

## 2026-09-26 - Standing up the Fleet Security & Credential-Hygiene Watch

ASK-1 - Telegram: @ponienteagentbot is in allowlist state (token set from
the fleet pattern). /start it in Telegram before I can deliver the first
summary; after that ./notify.sh works both ways.

ASK-2 - Pairing: 13 co-located siblings (ports 8787-8799) are staged for
rule-8a pairing (token mint + both halves installed + self-test each
direction). Go, and I will do them in one pass and self-test every pair.
Each pair still gets its own line in NOTES.md when it happens.

ASK-3 - Remote peers: 21 on Beacon/Tidal/Mountain remain gated on
per-pair sign-off as before. Nothing changes there for me; listing it so
the roster state is explicit.
