#!/usr/bin/env node
/* GALE — production bundler. Source stays plain, unbundled ES modules
   (that's what render-test.mjs and every dev workflow still uses); this
   only exists to ship fewer, smaller, minified requests. esbuild's code
   splitting means shared.js (imported by every page's entry script) is
   emitted once as a shared chunk instead of duplicated into each bundle.

   Run `npm run build` before `./deploy.sh` -- deploy.sh does this for you.
   `npm run watch` rebuilds on save during development. */
import * as esbuild from "esbuild";
import { rmSync } from "node:fs";

const ENTRY_POINTS = [
  "main.js",         // index.html
  "fleet.js",        // fleet.html (6 independent entries, one page)
  "activity.js",
  "cost.js",
  "drilldown.js",
  "hosts.js",
  "particles.js",
  "metrics.js",      // metrics.html
  "network.js",      // network.html
  "observability.js",// observability.html
  "status.js",       // status.html
  "weather.js",       // weather.html
  "agora.js",        // agora.html
  "ollama.js",       // ollama.html
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
  await esbuild.build(options);
}
