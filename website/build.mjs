#!/usr/bin/env node
/* GALE — production bundler. Source stays plain, unbundled ES modules
   (that's what render-test.mjs and every dev workflow still uses); this
   only exists to ship fewer, smaller, minified requests. esbuild's code
   splitting means shared.js (imported by every page's entry script) is
   emitted once as a shared chunk instead of duplicated into each bundle.

   Run `npm run build` before `./deploy.sh` -- deploy.sh does this for you.
   `npm run watch` rebuilds on save during development. */
import * as esbuild from "esbuild";
import { rmSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const ENTRY_POINTS = [
  "main.js",         // index.html
  "storm-scene.js",  // index.html hero night-mountain scene
  "cinematic.js",    // Apple/ILM cinematic layer (bundled via main.js, standalone too)
  "fleet.js",        // fleet.html (6 independent entries, one page)
  "topology3d.js",   // fleet.html 3D view (lazy, WebGL)
  "glsky.js",        // ambient WebGPU sky (lazy from shared.js boot)
  "palette.js",      // command palette (Ctrl/Cmd+K), lazy from shared.js
  "kiosk.js",        // wall mode (?kiosk=seconds), lazy from shared.js
  "activity.js",
  "cost.js",
  "drilldown.js",
  "hosts.js",
  "particles.js",
  "pulsewall.js",   // home heartbeat section (lazy from heartbeat.js)
  "wxsky.js",       // weather page conditions sky (lazy from weather.js)
  "metrics.js",      // metrics.html
  "network.js",      // network.html
  "observability.js",// observability.html
  "status.js",       // status.html
  "weather.js",       // weather.html
  "agora.js",        // agora.html
  "ollama.js",       // ollama.html
  "operations.js",
  "home.js",
  "reliability.js",  // reliability.html
  "lost.js",         // 404.html 3D page map
];

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ENTRY_POINTS,
  bundle: true,
  splitting: true,       // shared.js (and anything else re-used) becomes one common chunk
  format: "esm",
  outdir: "dist",
  minify: true,
  sourcemap: true,
   target: ["es2022"],  // top-level await is used in a few page entry scripts
   chunkNames: "chunks/[name]-[hash]",
   // Content-hash the ENTRY bundles too (not just shared chunks). Stable entry
   // names were the observability page-break: a browser can hold an old entry
   // `dist/observability.js` (long-cached) whose import targets a now-deleted
   // `chunk-<hash>.js` and hard-dark, and no nginx `no-cache` beats a browser
   // that already cached under the old headers. Hash the entry name so every
   // cached copy references the EXACT chunks that ship with it. deploy.sh
   // rewrites the HTML/sw <script src> against the manifest this emits.
   entryNames: "[name]-[hash]",
   metafile: true,
   // full zod is ~450 KB; the browser only needs the subset zod-lite.js implements
   alias: { zod: "./zod-lite.js" },
   logLevel: "info",
};

// esbuild doesn't clean its outdir -- every content change to a shared
// chunk (e.g. editing shared.js) gets a new content hash, and the old
// hashed file just sits there orphaned forever otherwise.
rmSync("dist", { recursive: true, force: true });

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("watching for changes...");
} else {
  const result = await esbuild.build(options);
  // Map each declared entry -> its content-hashed output filename. deploy.sh
  // uses this to rewrite the static <script src> in the HTML/SW (which are
  // copied verbatim and can't be bundled), so a page always loads the exact
  // entry that exists for its deploy.
  const entryMap = {};
  for (const [key, info] of Object.entries(result.metafile.outputs)) {
    // entryPoint is the stable discriminator across esbuild versions (the
    // `kind` field is undefined in some builds, so don't rely on it).
    if (info.entryPoint && !key.includes("chunks/")) {
      entryMap[basename(info.entryPoint)] = basename(key);
    }
  }
  writeFileSync("dist/.entry-manifest.json", JSON.stringify(entryMap, null, 2));
  console.log("entries: " + Object.entries(entryMap).map(([k,v]) => `${k}->${v}`).join(" "));
}
