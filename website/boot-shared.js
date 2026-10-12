/* GALE — shared boot for pages without a dedicated dist entry (404, runbooks).
   External file rather than an inline module so the enforcing CSP's script-src
   hash list stays tiny and stable across deploys (review 2026-10-11). */
import { boot } from "./shared.js";
boot();
