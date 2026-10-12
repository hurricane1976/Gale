#!/usr/bin/env node
/* pass #5 #87: cheap syntax gate — `node --check` on every first-party JS
   file. Catches stray syntax errors before esbuild or the render tests do,
   and exits non-zero so `npm run verify` blocks the pipeline. */
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (["node_modules", "dist", "tools", "assets", "pwa-screenshots"].includes(name)) continue;
      walk(p);
    } else if ((name.endsWith(".js") || name.endsWith(".mjs")) && !name.endsWith(".min.js")) {
      files.push(p);
    }
  }
};
walk(ROOT);

let failed = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
  } catch (e) {
    failed++;
    console.error(`SYNTAX FAIL: ${f}\n${e.stderr?.toString().slice(0, 400)}`);
  }
}
console.log(`syntax-check: ${files.length} files, ${failed} failed`);
process.exit(failed ? 1 : 0);
