# Host recovery

What this host is: Ubuntu 22.04, one user (`agent`), 16 cores. Every agent's
home under `/home/agent/<name>/` (11 co-resident agents: gale, chinook, zephyr,
squall, tempest, vortex, cyclone, maistral, sirocco, bora, tramontane). Peer
networking is one systemd unit per agent: `<name>-peer.service`. Telegram and
peer tokens live in each agent's `keys/`, re-provisioned by `fleet-provision`
(an operator-owned tool, not on PATH here).

This runbook recovers a *host*, not a single agent. Single-agent state
recovery is `restore-this-agent.md`.

## What a host failure looks like

- `/home/agent/*` missing, truncated, or wrong file mtimes after a disk
  failure, bad package operation, or stray `rm`/`cp` in a shell script.
- `df -h` full in `/` (no room to write `NOTES.md`/`backups/`) — the first
  thing to check on any "agents not waking" report.
- One or more `<name>-peer.service` in `failed`/`inactive` (see
  `systemctl --type=service --state=failed`), i.e. every agent's peer channel
  down at once, rather than one sibling's own bug.
- Tailscale down (`tailscale status`): fleet link loss for *this* host only;
  remote peers on other hosts unaffected.

## Order of operations

1. **Do not restart services yet.** A host reboot will wipe any in-memory
   peer tokens the sibling services are holding. If you can recover the disk
   first, you avoid the forced `systemctl restart` storm that a reboot would
   otherwise trigger for every agent at once.
2. **Snapshot before you touch anything else.** If `/home/agent` is still
   partially intact, `tar -czf /tmp/opencode/pre-recovery-$(date +%Y%m%dT%H%M%SZ).tar.gz /home/agent/` first — even partial — so your recovery itself is rollbackable.
3. **Restore each agent's state** with `restore-this-agent.md`, one agent at a
   time (`A=/home/agent/<name>`). Read-only for siblings; tramontane is its own
   owner. Verify each with the scratch-extract + `diff` step before trusting it.
4. **Re-provision `keys/`** (fleet-provision) for every agent restored, because
   `backup.sh`/`restore-this-agent.md` excludes all of `keys/` by design. Without
   this step every peer service comes back with a 401 handshake.
5. **Bring peer services up** in whatever order; verify one known-good pair to
   the fleet before declaring the host back: `send_to_peer.sh --to TRAMONTANE
   TRAMONTANE "host-recovery self-test"`.
6. **Tailscale**: `tailscale status`; if down, `sudo tailscale up` and confirm
   the host's `100.*` address is the one the other agents already hold in
   `peers.env` (they do not auto-resolve).

## Known-host constraints

- 16 cores, 58 GiB RAM, ~98 GB disk on `/` (35 GB used as of 2026-09-25).
  `df -h /` should show < 80% before you trust any `backup.sh` run to succeed.
- `fleet-provision` is operator-run, not available to agents by design (rule 8/8a
  gate). Do not try to auto-run it; ask via operator channel + `ASK.md`.
- The 11 peer services are independent units; a single one being `failed` is
  *its* agent's problem to self-heal, not a host incident — escalate only when
  multiple or all of them are down simultaneously, or when this agent's own
  unit fails after its state was restored.

## What "good" looks like (evidence required)

- `tar -tzf` clean on the pre-recovery snapshot you took.
- Each agent's `NOTES.md` (or equivalent) shows its own next waking fired post-
  recovery, not a `wake-skipped.log`.
- `send_to_peer.sh` round-trips `ok` to at least one non-local (remote) peer,
  proving Tailscale + token both recovered, not just the local mesh.
- No new drift entry in tramontane's own ledger for any sibling between pre- and
  post-recovery wakeings (or a new drift explicitly noted as pre-existing).
