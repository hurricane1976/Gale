#!/usr/bin/env node
/* Deploy-time entry-name rewriter.

   build.mjs content-hashes the ENTRY bundles (dist/main-<hash>.js, ...) so a
   cached entry can never import a deleted chunk. But the HTML <script src>
   and sw.js SHELL_ASSETS still reference the STABLE names (dist/main.js) --
   the repo source stays pristine and unbundled. This runs on the DEPLOYED
   docroot copy (after deploy.sh has cp'd it) and rewrites those stable refs
   to the exact hashed filenames that ship for this build, using the manifest
   build.mjs emits at dist/.entry-manifest.json.

   It never touches the repo source. It's idempotent: a ref that's already
   hashed doesn't match the stable-name pattern, so a re-run is a no-op.

   Usage: rewrite-dist-refs.mjs --root /var/www/gale --manifest <path>
*/
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const argv = process.argv.slice(2);
const opt = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const root = opt("--root", process.cwd());
const manifestPath = opt("--manifest");
if (!manifestPath) {
  console.error("rewrite-dist-refs: --manifest is required");
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entries = Object.entries(manifest); // [stable.js, hashed.js]
if (entries.length === 0) {
  console.error("rewrite-dist-refs: empty manifest -- refusing to rewrite");
  process.exit(1);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Matches a stable dist/ entry ref (relative or absolute), with any trailing
// query string (?v=...) stripped -- the content hash makes the buster moot.
// Anchored immediately after "dist/" so dist/chunks/... and CDN urls are safe.
const rewriteText = (text) => {
  let changed = 0;
  for (const [stable, hashed] of entries) {
    const re = new RegExp("dist/" + esc(stable) + "(\\?[^\\s\"'\\)>]*)?", "g");
    if (re.test(text)) {
      const [out] = [text.replace(re, "dist/" + hashed)];
      changed++;
      text = out;
    }
  }
  return { text, changed };
};

// Rewrite targets: every *.html in the docroot + sw.js (SHELL_ASSETS).
const files = [];
for (const name of readdirSync(root)) {
  if (name.endsWith(".html") || name === "sw.js") files.push(join(root, name));
}

let total = 0, touched = [];
for (const f of files) {
  const before = readFileSync(f, "utf8");
  const { text: after, changed } = rewriteText(before);
  if (changed > 0 && after !== before) {
    writeFileSync(f, after);
    touched.push(`${basename(f)} (${changed} ref${changed > 1 ? "s" : ""})`);
    total += changed;
  }
}

if (total === 0) {
  console.warn("rewrite-dist-refs: WARNING -- no refs rewritten (manifest mismatch?)");
  process.exit(1);
}
console.log(`rewrite-dist-refs: rewrote ${total} ref(s) across ${touched.length} file(s): ${touched.join(", ")}`);
