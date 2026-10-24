#!/usr/bin/env node
/* pass #5 #87: cheap syntax gate — `node --check` on every first-party JS
   file. Catches stray syntax errors before esbuild or the render tests do,
   and exits non-zero so `npm run verify` blocks the pipeline. */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

// --- enhanced checks ---

const issues = [];

// Check for deprecated CSS properties
const cssFiles = [];
const walkCss = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (["node_modules", "dist", "tools"].includes(name)) continue;
      walkCss(p);
    } else if (name.endsWith(".css")) {
      cssFiles.push(p);
    }
  }
};
walkCss(ROOT);

const DEPRECATED_CSS_PROPS = new Set([
  "appearance",
  "box-orient",
  "box-direction",
  "box-lines",
  "box-flex",
  "box-flex-group",
  "box-align",
  "box-pack",
  "box-ordinal-group",
  "user-select",
  "overflow-x",
  "overflow-y",
]);

for (const cssFile of cssFiles) {
  const content = readFileSync(cssFile, "utf-8");
  for (const prop of DEPRECATED_CSS_PROPS) {
    const regex = new RegExp(`\\b${prop}\\b\\s*:`, "gmi");
    if (regex.test(content)) {
      issues.push(`[deprecated-css] ${cssFile}: possibly deprecated property "${prop}"`);
    }
  }
}

// Check for scroll event listeners (performance-heavy)
const jsFilesForScroll = files.filter(f => !f.endsWith("tools/syntax-check.mjs"));
for (const f of jsFilesForScroll) {
  const content = readFileSync(f, "utf-8");
  if (/addEventListener\s*\(\s*["']scroll["']/.test(content)) {
    issues.push(`[scroll-listener] ${f}: uses scroll event listener (consider passive listener or requestAnimationFrame)`);
  }
  if (/onscroll\s*=/.test(content)) {
    issues.push(`[scroll-handler] ${f}: uses inline onscroll handler`);
  }
}

// Check for missing aria attributes on interactive elements
const INTERACTIVE_TAGS = new Set(["a", "button", "input", "select", "textarea"]);
const MISSING_ARIA = new Set(["role", "aria-label", "aria-labelledby", "aria-describedby", "title"]);
for (const f of jsFilesForScroll) {
  const content = readFileSync(f, "utf-8");
  const interactiveRegex = /<(a|button|input|select|textarea)\s+([^>]*)>/gi;
  let match;
  while ((match = interactiveRegex.exec(content)) !== null) {
    const tag = match[1];
    const attrs = match[2];
    if (!/(aria-|role\s*=|title\s*=)/i.test(attrs) && !MISSING_ARIA.has("role")) {
      // Check if element is clearly interactive with no ARIA or role
      const hasRole = /role\s*=/i.test(attrs);
      const hasAria = /aria-/i.test(attrs);
      const hasTitle = /title\s*=/i.test(attrs);
      if (!hasRole && !hasAria && !hasTitle) {
        // Only flag if the element has an href or type or class suggesting interactivity
        const hasHref = /href\s*=/i.test(attrs);
        const hasInputType = tag === "input" && /type\s*=\s*["']button["']/i.test(attrs);
        if (hasHref || hasInputType) {
          issues.push(`[missing-aria] ${f}: interactive <${tag}> element may be missing aria attributes`);
        }
      }
    }
  }
}

if (issues.length > 0) {
  console.error("\n=== style-check warnings ===");
  for (const issue of issues) {
    console.error(`  ${issue}`);
  }
  console.log(`\nstyle-check: ${issues.length} warnings`);
} else {
  console.log("\nstyle-check: no warnings");
}

process.exit(failed ? 1 : 0);
