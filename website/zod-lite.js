/* GALE — zod-lite: the ~2 KB subset of zod that payloads.js actually uses
   (string/number/boolean/null/unknown, array, object, record, union,
   .optional/.nullable). Production bundles alias "zod" to this file
   (build.mjs) so the browser doesn't download ~450 KB of full zod; source,
   render-test.mjs and tools/check_zod_lite.mjs still run against real zod,
   and the latter asserts both agree. Same semantics that matter here:
   z.object strips unknown keys, optional keys that are absent stay absent,
   and safeParse never throws. */
const ok = (data) => ({ success: true, data });
const bad = (path, message) => ({ success: false, error: { issues: [{ path, message }] } });
const kind = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

const mk = (parse) => {
  const s = { _p: parse };
  s.safeParse = (v) => parse(v, []);
  s.optional = () => mk((v, p) => (v === undefined ? ok(undefined) : parse(v, p)));
  s.nullable = () => mk((v, p) => (v === null ? ok(null) : parse(v, p)));
  return s;
};
const prim = (t) => mk((v, p) => (kind(v) === t ? ok(v) : bad(p, `Invalid input: expected ${t}, received ${kind(v)}`)));

export const z = {
  string: () => prim("string"),
  number: () => prim("number"),
  boolean: () => prim("boolean"),
  null: () => prim("null"),
  unknown: () => mk((v) => ok(v)),
  array: (item) => mk((v, p) => {
    if (!Array.isArray(v)) return bad(p, `Invalid input: expected array, received ${kind(v)}`);
    const out = [];
    for (let i = 0; i < v.length; i++) {
      const r = item._p(v[i], [...p, i]);
      if (!r.success) return r;
      out.push(r.data);
    }
    return ok(out);
  }),
  object: (shape) => mk((v, p) => {
    if (kind(v) !== "object") return bad(p, `Invalid input: expected object, received ${kind(v)}`);
    const out = {};
    for (const k of Object.keys(shape)) {
      const r = shape[k]._p(v[k], [...p, k]);
      if (!r.success) return r;
      if (r.data !== undefined) out[k] = r.data;
    }
    return ok(out);
  }),
  record: (a, b) => {
    const val = b || a;
    return mk((v, p) => {
      if (kind(v) !== "object") return bad(p, `Invalid input: expected record, received ${kind(v)}`);
      const out = {};
      for (const k of Object.keys(v)) {
        const r = val._p(v[k], [...p, k]);
        if (!r.success) return r;
        out[k] = r.data;
      }
      return ok(out);
    });
  },
  union: (opts) => mk((v, p) => {
    for (const o of opts) { const r = o._p(v, p); if (r.success) return r; }
    return bad(p, "Invalid input");
  }),
};
