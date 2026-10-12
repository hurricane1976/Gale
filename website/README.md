# Gale — fleet resilience & recovery website

The multi-page dashboard for the Gale agent (fleet resilience role): host
health, backups, version control, spend, peer-credential hygiene, plus the
observability / metrics / status / weather / network / agora / ollama / galaxy
consoles.

Plain ES modules, no framework, one design system (`gale.css`). Python
backends (`fleet_api.py`, `ollama_api.py`, `gale_push.py`, …) feed `/api/*`
under the same origin; nginx serves the static shell on :8090 (tailnet-only).

## Layout

```
*.html          page shells (15 pages) — static, readable with JS off
*.js            page scripts + shared runtime (source of truth)
gale.css        the design system + all page styles
mobile.css      responsive / print / contrast layers (loaded after gale.css)
dist/           esbuild output (committed — deploy + sw.js reference it)
tools/          build, audit, browser gates, bridges, monitoring
sw.js           service worker (offline shell, push, wake queue)
manifest.json   PWA manifest
```

`/var/www/gale` is the deploy target (www-data). **This repo is the source of
truth** — never hand-edit the docroot; deploys overwrite it wholesale.

## Everyday commands

```sh
npm test            # render-test.mjs — renders every page's script under Node
npm run audit       # tools/audit.mjs — a11y/contrast/meta gates, all pages
npm run build       # esbuild → dist/ (+ .entry-manifest.json)
npm run lint        # eslint (flat config, repo root)
npm run check       # node --check syntax gate for every first-party JS file
npm run verify      # check + test + build + smoke (the pre-deploy gate)
npm run check:browser  # csp / budget / phone / webgl / visual gates
npm run test:monitoring  # python monitoring + reliability tests
```

## Deploy

```sh
./deploy.sh          # build → snapshot → copy → rewrite hashed refs →
                     # precompress (.br/.gz) → nginx -t → smoke gate →
                     # rollback on failure
./deploy.sh --rollback   # restore the previous snapshot
```

deploy.sh:

1. `npm run build` — esbuild bundles every entry into `dist/` with content
   hashes and emits `dist/.entry-manifest.json`.
2. Snapshots the live docroot to `/var/www/gale-releases/<ts>/` (canary).
3. Copies the repo to `/var/www/gale`, then `tools/rewrite-dist-refs.mjs`
   rewrites the stable `dist/<name>.js` / `<name>.css` refs in HTML + sw.js to
   the exact hashed names of this build, and mints hashed copies of the
   unhashed js/css.
4. Emits precompressed `.br`/`.gz` twins (nginx `brotli_static`/`gzip_static`).
5. Reloads nginx and runs `smoke.sh` (render + schema + xss); any failure
   auto-restores the snapshot.

## Conventions that keep the fleet honest

- **CSP hashes**: inline `<script>` bootstraps are pinned by sha256 in
  `/etc/nginx/snippets/gale-sec.conf`. If you edit an inline bootstrap, recompute
  the hash for every page variant and update that file (both the enforcing and
  Report-Only policies).
- **Service worker**: bump `CACHE_VERSION` in sw.js whenever shell assets
  change meaningfully. `/api/*` is never cached by design.
- **Reduced motion / data saver**: every animation and heavy canvas honors
  `prefers-reduced-motion`, the dock's pause control, and Data saver.
- **Roster markup**: fleet.html agent/host blocks are fenced with
  `<!-- island:... -->` markers — edit via `tools/sync_roster.py`, not by hand.
- **Tests guard the swap**: `render-test.mjs` runs page modules under plain
  Node — keep DOM feature detection (`typeof HTMLElement !== "undefined"`)
  around any new global usage at module scope.
