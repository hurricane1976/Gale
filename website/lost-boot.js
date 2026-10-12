/* GALE — 404 page boot: wires the lost-in-the-storm page map. Imports the
   SOURCE module (no dist reference), so the file never depends on the
   deploy-time dist-rewrite pass and the enforcing CSP needs no hash for it. */
import { initLost } from "./lost.js";
try { initLost(); } catch (e) { /* decorative scene only; links stay usable */ }
