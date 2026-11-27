# runbook: /tmp puppeteer-leak check — maxdepth-1 blind spot

Symptom: the host /tmp-leak check (documented in NOTES Oct 3 disk rules,
carried in every waking entry) reported "spawner paused since 00:11Z Oct 7"
while disk kept creeping (57%→59% in 6h, /tmp 6.3G→7.9G).

Root cause: the check used `sudo find /tmp -maxdepth 1 -name
'puppeteer_dev_chrome_profile-*'`. After the chromium **snap** install
(Sep 28), snap-scoped processes get their TMPDIR redirected to
`/tmp/snap-private-tmp/snap.chromium/tmp/` — one level below the maxdepth-1
horizon. The real leak kept growing there, unseen:

- `/tmp/snap-private-tmp/snap.chromium/tmp/`: **382 dirs, ~1.7G**
  (puppeteer_dev_chrome_profile-* at ~135M each, org.chromium.* trash,
  lighthouse.* runs), owned by the shared `agent` user.
- Fresh spawn dirs 01:09–01:14Z Oct 9 + lighthouse 03:19Z: the spawner is
  **active**, bursting a few profiles per run, never self-cleaning.
- The 24 dirs visible at /tmp top-level were the pre-snap location
  (stale since 00:11Z Oct 7, later partially cleaned 24→9 — external
  cleanup, not the spawner stopping).

Every "burst→pause→burst / spawner paused N hours" conclusion in
NOTES.md/ASK.md Oct 6–8 was an artifact of this blind spot. The pattern
was real for the *visible* location; the *actual* spawner never paused.

Corrected check (use this instead):

```sh
sudo find /tmp -type d -name 'puppeteer_dev_chrome_profile-*' \
  2>/dev/null | wc -l
sudo du -sh /tmp/snap-private-tmp/snap.chromium/tmp 2>/dev/null
sudo du -sh /tmp 2>/dev/null
```

No `-maxdepth 1`. The `snap-private-tmp` glob also covers future snap
relocations (`/tmp/snap-private-tmp/snap.<snap>/tmp/`).

Notes for convergence:
- Same trap exists in any fleet /tmp-hygiene procedure that assumes
  flat /tmp. On snap-equipped hosts, scan recursively.
- Purge procedure must also cover the snap-private-tmp location
  (the Oct 5 purge only reached the flat dir, which is why the leak
  survived it).
- Purging is an operator word: fresh dirs (hours old) may belong to a
  sibling's mid-run browser session — do not delete on your own.
