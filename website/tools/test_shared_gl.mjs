/* Quality governor checks: pure timing logic, no GL needed. */
import assert from "assert";
import { Quality } from "/home/agent/agent/website/shared-gl.js";

let pass = 0, fail = 0;
const t = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("ok  ", name); }
  else { fail++; console.log("FAIL", name, extra); }
};

const T0 = 1_800_000_000_000;
let now = T0;

{
  const q = new Quality();
  t("starts at tier 0 / scale 1", q.tier === 0 && q.scale() === 1);
  // 80 frames at 30fps (33ms > downMs 23): the EMA needs ~5 frames to cross
  // the threshold from its 16.7ms seed, so 80 gives hold=60 counted frames
  for (let i = 0; i < 80; i++) q.tick(33, now += 33);
  t("sustained 30fps downgrades to tier 1", q.tier === 1 && q.scale() === 0.8);
  // cooldown: 2000ms of more slow frames must NOT step again before coolMs elapses
  for (let i = 0; i < 100; i++) q.tick(33, now += 33);
  t("cooldown blocks immediate second step", q.tier === 1);
  for (let i = 0; i < 60; i++) q.tick(33, now += 33);   // past cooldown now
  t("second downgrade after cooldown", q.tier === 2 && q.scale() === 0.65);
}

{
  const q = new Quality();
  // tier 2 the hard way
  for (let i = 0; i < 60; i++) q.tick(33, now += 33);
  for (let i = 0; i < 100; i++) q.tick(33, now += 33);
  for (let i = 0; i < 60; i++) q.tick(33, now += 33);
  t("reached tier 2", q.tier === 2);
  // recovery needs 2x hold of fast frames; cooldown applies too
  let ups = 0;
  for (let i = 0; i < 119; i++) { const s0 = q.tier; q.tick(8, now += 16); if (q.tier < s0) ups++; }
  t("no upgrade before 2x hold + cooldown", q.tier === 2 && ups === 0);
  for (let i = 0; i < 130; i++) q.tick(8, now += 16);
  t("sustained 125fps upgrades", q.tier < 2);
}

{
  const q = new Quality();
  // tab-return spike: single 500ms frame must be ignored, not poison the EMA
  q.tick(16, now += 16);
  q.tick(500, now += 500);
  t("dt spike ignored", q.fps() > 50);
  // dt<=0 / NaN ignored
  q.tick(0, now); q.tick(-5, now); q.tick(NaN, now);
  t("bad dt ignored", Number.isFinite(q.ema) && q.ema > 10);
}

{
  const q = new Quality({ maxTier: 1 });
  for (let i = 0; i < 400; i++) q.tick(40, now += 40);
  t("maxTier caps the ladder", q.tier === 1);
}

console.log(fail === 0 ? "SHARED-GL PASS" : "SHARED-GL FAIL");
process.exit(fail === 0 ? 0 : 1);
