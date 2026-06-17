# No-build / no-dependency invariant

## Table of Contents

- [What the invariant means](#what-the-invariant-means)
- [Why this is a hard invariant](#why-this-is-a-hard-invariant)
- [What this rules out](#what-this-rules-out)
- [What this DOES allow](#what-this-does-allow)
- [Sister modules with the same invariant](#sister-modules-with-the-same-invariant)
- [What changes if the runtime EVER needs a dep](#what-changes-if-the-runtime-ever-needs-a-dep)
- [Visual verification](#visual-verification)
- [The Node export — for testing](#the-node-export--for-testing)

The icon-svg module is DEPENDENCY-FREE. Pure ES5-style vanilla JS,
one self-contained file, no toolchain, no npm runtime dep, no CDN,
no WASM, no XML parser. The CSS is injected as a string from the
same file. The whole module is `scripts/amvcp-icon-svg.js` — drop it
into any HTML page with a `<script src="amvcp-icon-svg.js">` and it
works.

## What the invariant means

- **No build step.** No webpack / vite / rollup / esbuild. The
  `.js` file is the source AND the deliverable.
- **No npm runtime dep.** No `import` / `require` of external
  packages. (Node test harness uses `require('./amvcp-icon-svg.js')`
  via `module.exports`, but that's a SELF-IMPORT of the dual export.)
- **No CDN.** No `<script src="https://cdn.jsdelivr.net/...">`.
  Everything is co-located with the HTML.
- **No WASM.** No binary blobs.
- **No XML parser.** `lintSvg()` does an attribute-level regex
  scan, NOT a real XML parse. The compiler emits SVG as STRING
  concatenation, not via DOM creation.
- **ES5-style.** `var`, function declarations, `Array.prototype`
  fallbacks (`indexOf`, `isArray`), no arrow functions, no template
  literals, no classes, no `let` / `const`. Runs in browsers as old
  as IE 11.

## Why this is a hard invariant

icon-svg renders inline in a static HTML report — the kind of report
the user might email as a single `.html` attachment. Adding a build
step would:

- Require the report's recipient to install Node + npm.
- Block render in offline environments.
- Add CDN-dependency surface (npm package compromise risk).
- Break the "view source, see how it works" transparency.

The "single HTML attachment that works offline on a phone" hard
invariant (mined from HTML-effectiveness reference demos) is the
WHOLE POINT of the visual-communicator plugin's runtime
architecture. icon-svg's no-dep invariant is the asset-side
counterpart to the renderer-side no-build invariant.

## What this rules out

| Feature | Why it's out |
|---|---|
| TypeScript source | Adds a `tsc` compile step. |
| `import` statements | Requires bundling or `<script type="module">` (the latter limits self-init timing). |
| `class` syntax | Modern JS, but ES5-target consistency keeps the entire module monomorphic. |
| Arrow functions | Same — readability across the codebase trumps brevity. |
| Template literals | Same — string concat is more grep-friendly. |
| `let` / `const` | Same — `var` is the consistency choice. |
| `Array.from` / `Array.prototype.forEach` without fallback | IE11 compat. |
| `fetch` | Network call — icon-svg has none. |
| `requestAnimationFrame` | Async layout — icon-svg is sync. |
| `MutationObserver` | Async DOM watching — icon-svg uses `init()` + `refresh()`. |

## What this DOES allow

- `var` declarations.
- Function declarations + function expressions.
- `for (var i = ...; ...; ...)` loops.
- `Array.prototype.indexOf` via the ES5-safe helper `indexOf(arr,
  val)` declared in the module.
- `Array.prototype.isArray` via `Object.prototype.toString.call(v) ===
  '[object Array]'`.
- `Object.keys` via the ES5-safe helper `objKeys(o)`.
- String concatenation.
- Regex.
- The DOM API as available — `document.createElement`,
  `Node.appendChild`, `Node.replaceChild`, `Element.querySelectorAll`,
  `Element.outerHTML`.
- `console.warn` (the dev-lint pass's only side effect).
- `JSON.parse` / `JSON.stringify` (universally supported).

## Sister modules with the same invariant

Every other `amvcp-*.js` module in `scripts/` shares this invariant:

- `amvcp-designmd.js` — the token engine.
- `amvcp-animation.js` — animation primitives.
- `amvcp-chart.js` — chart rendering.
- `amvcp-diagram.js` — diagram rendering.
- `amvcp-layout.js`, `amvcp-slide.js`, `amvcp-tables.js`,
  `amvcp-typography.js`, `amvcp-wireframe.js`, etc. — all
  ES5-style, no deps.

Authoring style:

```js
// House style — every amvcp-*.js module looks like this
(function () {
  'use strict';

  // Module-level state
  var STYLE_ID = 'isvg-icon-svg-styles';

  // Helpers
  function objKeys(o) { /* ... */ }
  function indexOf(arr, val) { /* ... */ }

  // Public functions
  function init(root) { /* ... */ }
  function refresh(root) { /* ... */ }

  // Dual export
  var _api = { init: init, refresh: refresh, /* ... */ };

  if (typeof window !== 'undefined') {
    window.amvcpIconSvg = _api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _api;
  }
})();
```

The IIFE wrapper, `'use strict'`, var-only, function declarations,
and dual export form the consistent pattern. Adding a new amvcp-*.js
module that breaks this is a style review failure.

## What changes if the runtime EVER needs a dep

If a future requirement somehow needs a dependency (e.g.
canvas-to-PNG export needs canvas API which is built-in, so it's
fine; but a font shaping engine would NOT be), the path is:

1. PR an explicit "we are breaking the no-dep invariant for X"
   discussion.
2. Justify with a measurable user value (NOT "convenience for
   authors").
3. Find the SMALLEST possible vendored copy of the dep.
4. Vendor it INTO the module (no runtime fetch, no CDN).
5. Update this reference to document the carve-out.

The bar is HIGH. To date, no carve-out has been justified.

## Visual verification

Open `tests/fixtures/icon-svg-runtime.html` in a browser that has
NO npm runtime, NO build cache, NO CDN access. The fixture should
render every primitive cleanly. The page should have ONE `<script
src="amvcp-icon-svg.js">` + the JSON scene-graph blocks + nothing
else.

If the page fails to render without external resources, the
invariant has been violated — find the violating dependency and
remove it.

## The Node export — for testing

The dual export at the bottom of the module:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _api;
}
```

lets `tests/scripts/test-icon-svg.js` do `var amvcpIconSvg =
require('/path/to/amvcp-icon-svg.js')` and call the pure helpers
(`buildSceneSvg`, `lintSvg`, `snap`, `builders`) in a Node harness
without a DOM. This is NOT a dependency — it's a test affordance
the module exposes when run under Node.

The test harness itself uses ONLY Node built-ins (no npm packages).
That's the same invariant applied at the test layer.
