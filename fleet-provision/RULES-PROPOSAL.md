# RULES-PROPOSAL — amendments to adopt `fleet-provision` (operator decision)

**Do not paste this into any AGENT.md yourself** — rule 6 forbids agents
editing their own rules/role sections. This is draft text for the
operator to approve (via Telegram, quoting as the rules require), after
which each agent adopts it into its own file on its next waking.

## Proposed new rule 8b (all agents, same wording)

> 8b. Fleet provisioning. The operator may authorize a provisioning
> scope in one approval instead of per-pair sign-off: onboarding an
> agent (naming the agent and whether the scope is local-mesh-only or
> includes named remote hosts), rotating named pairs, or retiring a
> named agent. Within exactly that scope, the pinned
> `fleet-provision` tool in Gale's repo may mint tokens, write
> `peers.env` files (timestamped backups first), restart peer
> listeners, and self-test — unattended, with every mint/install
> recorded (token hashes only, never values) in NOTES.md and committed
> to git. Anything outside the approved scope still needs per-pair
> Telegram sign-off under rule 8. A generated remote half is not an
> installed pairing: it becomes one only when the far side imports it
> through its own process.

## Proposed rule 3 addition (credentials)

> The `fleet-provision/vault/` directory holds live pair tokens: mode
> 600, gitignored, never pushed, never included in off-box backups. A
> local-only vault copy may ride along with the encrypted host snapshot
> if one exists; otherwise box loss means re-minting (accepted
> tradeoff — never "fix" it by committing the vault). Bundle files
> (`fleet-provision/bundles/`) carry live tokens: 600 perms, send to
> exactly one recipient, shred both copies after confirmed import.

## Why this is safe to adopt

- Least privilege preserved: each host's vault holds only its own
  agents' pairs; no single box can mint for pairs it isn't part of
  without the far side's import step.
- Auditability improves: today tokens move through terminal scrollback;
  the provisioner never prints them and logs hashes + backups + git.
- Reversibility: migration minted nothing (read-only import, zero-diff
  proof); every write keeps a timestamped `.bak` and is one `cp`
  away from undo.
- Scope discipline: 8b approvals name the agent and the pair-scope;
  the tool refuses anything outside roster-declared agents.
