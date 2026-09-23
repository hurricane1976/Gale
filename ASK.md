# ASK.md — open questions for the operator

## Open

- **Remote pairing — 21 peers STAGED (rule 8).** `./pair_remote_batch.sh`
  ready; nothing minted. Needs per-pair operator sign-off via Telegram
  plus each remote peer's install.
- **Telegram (2026-09-23, via /commands):** Hello
- **Telegram (2026-09-23, via /commands):** What’s up

## Resolved

- **Activation — Telegram live 2026-09-23 ~00:24Z.** Bot `@Siroccoagentsbot`;
  operator provided token, chat id taken from their `/start`;
  `keys/telegram.env` written (600, gitignored); test `notify.sh` delivered.
- **Local mesh COMPLETE 2026-09-22 ~21:27Z (rule 8a, operator go-ahead in
  session).** All 8 co-resident pairs two-way (lead spoke + zephyr/squall/
  tempest/vortex/cyclone/maistral/bora): one shared token per pair, both
  halves installed, services restarted, self-tests 200/401 passed, real
  sends both directions verified, 8/8 inbound present. See NOTES.md.
