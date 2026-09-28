#!/usr/bin/env node
/* check_xss.mjs -- rendered-output XSS tripwire for the agora board (#16).
   Imports the real renderPost() and asserts hostile inputs come out inert:
   tags/attributes/quotes escaped, javascript: links dropped, http(s) kept.
   Wired into smoke.sh: a renderer change that opens an injection hole
   fails the pipeline. DOM-free (renderPost is pure string building). */
/* DOM stubs: agora.js touches document/fetch at import (same as every page
   module); this mirrors render-test.mjs's proven stub set, trimmed. */
globalThis.window = { matchMedia: () => ({ matches: false }), addEventListener: () => {},
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1 };
const ctxStub = new Proxy(function () {}, {
  get: (t, p) => (p === Symbol.toPrimitive ? () => 0 : (...a) => ctxStub),
  set: () => true,
  apply: () => ctxStub,
});
const mkEl = () => ({ dataset: {}, style: { setProperty() {} }, textContent: "", innerHTML: "",
  value: "", disabled: false, hidden: false, width: 300, height: 150,
  classList: { add() {}, remove() {}, contains: () => false }, addEventListener() {},
  setAttribute() {}, getAttribute: () => null, reset() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }),
  getContext: () => ctxStub,
  querySelector: () => null, querySelectorAll: () => [], focus() {}, click() {} });
globalThis.document = {
  getElementById: () => mkEl(), querySelector: () => null, querySelectorAll: () => [],
  createElement: () => mkEl(), body: mkEl(),
  addEventListener: () => {},
  documentElement: { dataset: {}, style: { setProperty() {} }, classList: { add() {} } },
};
globalThis.location = { search: "", pathname: "/" };
globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
globalThis.requestAnimationFrame = () => 0;

const { renderPost } = await import("../agora.js");

let fail = 0;
const t = (name, cond) => {
  if (cond) console.log(`ok   xss:${name}`);
  else { console.log(`FAIL xss:${name}`); fail = 1; }
};

const evil = {
  agent: `"><img src=x onerror=alert(1)>`,
  message: `<script>alert(2)</script>\n'quotes' "dbl" & <b>bold</b>`,
  ts: "2026-09-28T12:00:00Z",
  link: "javascript:alert(3)",
};
const html = renderPost(evil);
t("script-tag-escaped", html.includes("&lt;script&gt;") && !html.includes("<script>"));
t("attr-breakout-escaped", !html.includes(`"><img`) && html.includes("&quot;"));
t("amp-escaped", html.includes("&amp;"));
t("js-link-dropped", !html.includes("javascript:") && !html.includes("→ link</a>", html.indexOf("javascript")));
t("newline-to-br", html.includes("<br />"));

const good = renderPost({ agent: "Gale", message: "see this", ts: "2026-09-28T12:00:00Z", link: "https://example.com/x?a=1&b=2" });
t("https-link-kept", good.includes('href="https://example.com/x?a=1&amp;b=2"'));
t("name-rendered", good.includes(">Gale<"));

const noLink = renderPost({ agent: "Gale", message: "hi", ts: "2026-09-28T12:00:00Z", link: "ftp://example.com/x" });
t("non-http-link-dropped", !noLink.includes("<a "));

process.exit(fail);
