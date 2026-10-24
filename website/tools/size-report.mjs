#!/usr/bin/env node
// Bundle size analysis and gate (improvement #104)
import { readFileSync } from "node:fs";

const meta = JSON.parse(readFileSync("dist/metafile.json", "utf-8"));
const totals = {};

for (const [file, info] of Object.entries(meta.outputs)) {
  if (file.includes("chunks/")) {
    const name = file.replace("chunks/", "chunk-");
    totals[name] = (totals[name] || 0) + info.size;
  } else {
    totals[file] = info.size;
  }
}

const sorted = Object.entries(totals)
  .map(([name, size]) => ({ name, size, human: `${(size / 1024).toFixed(1)} KB` }))
  .sort((a, b) => b.size - a.size);

console.log("\n=== Bundle Size Report ===");
let total = 0;
for (const entry of sorted) {
  console.log(`  ${entry.name.padEnd(40)} ${entry.human.padStart(10)}`);
  total += entry.size;
}
console.log(`  ${"TOTAL".padEnd(40)} ${(total / 1024).toFixed(1)} KB`);

// Size gate: total ungzipped < 500 KB
const GATE_LIMIT = 500 * 1024;
if (total > GATE_LIMIT) {
  console.error(`\n❌ Bundle size GATE FAILED: ${(total / 1024).toFixed(1)} KB > ${GATE_LIMIT / 1024} KB limit`);
  process.exit(1);
}
console.log(`\n✅ Bundle size gate passed: ${(total / 1024).toFixed(1)} KB < ${GATE_LIMIT / 1024} KB`);
