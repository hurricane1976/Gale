/* GALE — flat ESLint config (pass #5 #1). The site is plain ES modules with
   no framework; the rules below encode the house style that code review has
   been enforcing by hand: no stray `var`, no `==`, no undeleted debug logs.
   DOM/browser globals are assumed (every page script targets the browser);
   render-test.mjs imports page modules under plain Node, so guards must stay
   `typeof HTMLElement !== "undefined"` etc — `no-undef` is off because the
   Node/browser duality can't be expressed per-file cheaply here. */
export default [
  {
    files: ["*.js", "tools/**/*.mjs"],
    ignores: ["dist/**", "node_modules/**", "assets/vendor/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    rules: {
      "no-var": "error",
      "prefer-const": ["warn", { destructuring: "all" }],
      eqeqeq: ["error", "smart"],
      "no-else-return": ["warn", { allowElseIf: true }],
      "no-template-curly-in-string": "warn",
      "no-unused-expressions": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-throw-literal": "error",
      "no-shadow-restricted-names": "error",
      "no-undef-init": "warn",
      "object-shorthand": ["warn", "properties"],
      "prefer-template": "warn",
      "no-new": "warn",
    },
  },
];
