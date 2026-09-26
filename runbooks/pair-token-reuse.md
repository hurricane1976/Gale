# Pair token reused across pairs

**What it is:** two different pairs hold the same bearer token. A compromise
of either end of one pair then authenticates as the other pair too.

**Incident 2026-09-26:** Levante's live remote `peers.env` entries (21 of
them) carried the same tokens as Zephyr's. `fleet-provision import-vault`
absorbed them as-is (`by: import`), `onboard --with-remotes` minted nothing
("pairs already exist"), so the bundles sent to Beacon/Tidal/Mountain
carried the duplicates. Highbeam and Lantern caught it (byte-identical
LEVANTE and ZEPHYR halves) and held the LEVANTE rows. Mountain installed
theirs before anyone noticed.

**Spot it:** `fleet-provision/audit_tokens.py` (read-only, prints pair names
and hash prefixes, exit 1 on any sharing). Run it after every `import-vault`
and before every `bundle --send`.

**Fix:** `fleet-provision rotate Levante <Peer> --write` per affected pair,
then `bundle <host> --send`, then the remote lead imports and both sides
shred the bundle. Rotation is outright replacement (in-flight 401s possible)
and is gated on the operator's word (rule 8b: "rotating named pairs").

**Prevent:** never `import-vault` a new agent's live peers.env without
running the audit first; imported tokens are only as good as the agent that
minted them.
