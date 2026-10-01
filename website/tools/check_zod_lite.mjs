#!/usr/bin/env node
/* Asserts zod-lite agrees with real zod on every payload schema, using the
   live API responses plus mutated (broken) copies. Run via smoke.sh. */
import * as real from "zod";
import * as lite from "../zod-lite.js";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const src = readFileSync(new URL("../payloads.js", import.meta.url), "utf8");
const load = async (zmod) => {
  const code = src.replace('import { z } from "zod";', "const z = globalThis.__z;");
  globalThis.__z = zmod.z;
  return import("data:text/javascript;base64," + Buffer.from(code).toString("base64") + "#" + Math.random());
};
const R = await load(real), L = await load(lite);
const base = process.env.BASE || "http://127.0.0.1:8090";
const feeds = { metricsPayload: "/api/fleet/metrics", wakesPayload: "/api/fleet/wakes", asksPayload: "/api/fleet/asks",
  observabilityPayload: "/api/fleet/observability", statusPayload: "/api/fleet/status" };
let fail = 0, n = 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [name, path] of Object.entries(feeds)) {
  if (!R[name]) continue;
  let live; try { live = await (await fetch(base + path)).json(); } catch { console.log("skip", name); continue; }
  const cases = [live, {}, null, [], { ...live, generated_at: 5 }];
  for (const k of Object.keys(live).slice(0, 8)) { const c = { ...live }; delete c[k]; cases.push(c); }
  for (const c of cases) {
    n++;
    const a = R[name].safeParse(c), b = L[name].safeParse(c);
    if (a.success !== b.success || (a.success && !same(a.data, b.data))) { fail++; console.log("MISMATCH", name, a.success, b.success); }
  }
}
console.log(fail ? `zod-lite: ${fail}/${n} MISMATCHES` : `zod-lite: ${n} cases agree with zod`);
process.exit(fail ? 1 : 0);
