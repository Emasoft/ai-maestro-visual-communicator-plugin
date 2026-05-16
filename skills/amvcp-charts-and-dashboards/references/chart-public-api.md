# Public API — `window.amvcpChart`

The chart module exposes its public surface on `window.amvcpChart`. This
file lists every public function + property + when to call it.

## Table of contents

- [The API surface](#the-api-surface)
- [`scan(root)`](#scanroot)
- [`render(spec, type, host)`](#renderspec-type-host)
- [`parseFence(preEl)`](#parsefenceperel)
- [`palette(n)`](#palette-n)
- [`ramp(t, mode)`](#rampt-mode)
- [`niceTicks(min, max, count)`](#niceticksmin-max-count)
- [`describeArc(cx, cy, rOuter, rInner, a0, a1)`](#describearccx-cy-router-rinner-a0-a1)
- [`catmullRom(points)`](#catmullrompoints)
- [`getSelection()`](#getselection)
- [`registry`](#registry)
- [`injectChartCSS(doc)`](#injectchartcssdoc)
- [Test hook: `window.__veChart`](#test-hook-window__vechart)

---

## The API surface

```js
window.amvcpChart = {
  injectChartCSS: fn,    // append the chart skill CSS to <head>
  scan: fn,              // find & render every chart block in the doc
  render: fn,            // render one parsed spec into a host <figure>
  parseFence: fn,        // extract type/version + parse JSON from a <pre>
  palette: fn,           // n golden-angle categorical CSS colors
  ramp: fn,              // OKLCH sequential/diverging ramp
  niceTicks: fn,         // sparse "nice" tick values for an axis
  describeArc: fn,       // SVG annular wedge path string
  catmullRom: fn,        // Catmull-Rom -> cubic-Bezier path string
  getSelection: fn,      // standalone-mode internal selection list
  registry: object,      // type -> {backend, render, validate, maxVersion}
  _cssText: string       // the injected CSS as a single string (read-only)
};
```

Also a Node export for the test harness:

```js
// In Node (test fixture):
var chart = require('./scripts/amvcp-chart.js');
chart.palette(3);
//=> ['oklch(...)', 'oklch(...)', 'oklch(...)']
```

## `scan(root)`

`scan(root = document)` — find every un-rendered chart block under
`root` and render it. Idempotent (a second scan of the same DOM is a
no-op for already-rendered charts).

```js
amvcpChart.scan(document);
amvcpChart.scan(someContainerEl);
```

Behavior:
- Walks `root.querySelectorAll('pre > code[class*="language-chart:"]')`.
- For each `<pre>` not already processed:
  - Parse the language tag via `_readChartTag`.
  - Parse the JSON via `parseFence`.
  - Validate via the registered `validate` function.
  - Build the host `<figure>` via `_buildFigure`.
  - Render via the registered `render` function.
  - Replace the `<pre>` with the `<figure>`.
- Re-renders all Canvas-backed charts (`figure[data-ve-chart-backend="canvas"]`)
  by calling their `__veChartRedraw()`. This is how the themechange
  signal repaints Canvas charts with new token-resolved colors.

When to call:
- After page load (auto-called on `DOMContentLoaded` unless
  `window.__vcManualInit = true`).
- After dynamically inserting new fenced blocks (`scan(newContainer)`).
- After a theme hot-swap (`scan(document)` repaints Canvas charts).

## `render(spec, type, host)`

`render(spec, type, host)` — render ONE parsed spec into a host element.
Used internally by `scan`; also useful for programmatic chart creation
without a fenced block.

```js
var fig = document.createElement('figure');
fig.className = 've-chart';
document.body.appendChild(fig);

amvcpChart.render({
  title: "Revenue by quarter",
  series: [{ label: "2025", data: [
    {x:"Q1",y:2.4}, {x:"Q2",y:3.1}, {x:"Q3",y:2.8}, {x:"Q4",y:3.6}
  ]}],
  options: { sortDescending: true, valueLabels: true }
}, 'bar', fig);
```

If `host` is undefined, a `<figure>` is created via `_buildFigure(type, spec)`.

Throws on:
- Unknown `type`.
- Validation failure (`title` missing, etc.) — message is the validate
  return value.

Use `scan` for fenced-block rendering; use `render` for programmatic
chart creation.

## `parseFence(preEl)`

Extract type + version + JSON spec from a `<pre>` with a chart language
tag. Returns either `{spec, type, version, text}` on success or
`{error, text, type?, version?}` on parse failure.

```js
var pre = document.querySelector('pre > code.language-chart\\:bar\\@1').parentNode;
var parsed = amvcpChart.parseFence(pre);
if (parsed.error) {
  console.error(parsed.error);
} else {
  amvcpChart.render(parsed.spec, parsed.type, hostFig);
}
```

Useful for custom rendering pipelines (lint a spec before rendering;
preprocess the spec; conditionally route to a different renderer).

## `palette(n)`

Return `n` categorical CSS color strings, hue-stepped by the golden angle
on top of `--vc-color-accent`. See `chart-palette-engine.md` for the
full rationale.

```js
amvcpChart.palette(5);
//=> ['oklch(0.62 0.12 38.0)', 'oklch(0.62 0.12 175.5)',
//    'oklch(0.62 0.12 313.0)', 'oklch(0.62 0.12 90.5)',
//    'oklch(0.62 0.12 228.0)']
```

Useful for matching the chart's palette in adjacent runtime code (a
post-render highlight; a custom legend).

## `ramp(t, mode)`

Return a CSS color for `t` in `[0, 1]`, in `'sequential'` or
`'diverging'` mode. Uses `color-mix(in oklch, …)`.

```js
amvcpChart.ramp(0.7, 'sequential');
//=> 'color-mix(in oklch, var(--vc-color-surface) 30.0%, var(--vc-color-accent))'

amvcpChart.ramp(0.2, 'diverging');
//=> 'color-mix(in oklch, var(--vc-color-surface) 40.0%, var(--vc-color-danger))'
```

See `chart-palette-engine.md` for details.

## `niceTicks(min, max, count)`

Round a `[min, max]` axis domain to human-friendly tick stops at
1·/2·/5·×10ⁿ steps so the gridline count stays small. Returns
`{top, bottom, step, ticks: number[]}`.

```js
amvcpChart.niceTicks(0, 47, 4);
//=> { top: 50, bottom: 0, step: 10, ticks: [0, 10, 20, 30, 40, 50] }

amvcpChart.niceTicks(-12, 34, 4);
//=> { top: 40, bottom: -20, step: 20, ticks: [-20, 0, 20, 40] }
```

Used internally by every axis-bearing chart. Useful externally for
matching tick spacing in an adjacent runtime panel.

## `describeArc(cx, cy, rOuter, rInner, a0, a1)`

Return an SVG path string for an ANNULAR WEDGE (a donut slice). For a
full filled wedge (no hole), pass `rInner = 0`.

```js
amvcpChart.describeArc(100, 100, 80, 50, 0, 90);
//=> 'M ... A ... A ... Z'    (the slice from 0° to 90° as a closed path)
```

Used internally by `donut`, `gauge`, `harvey-ball`. Useful externally for
custom circular visualizations.

## `catmullRom(points)`

Return an SVG path string for a cubic-Bezier curve THROUGH every point
(no overshoot, every datum on the curve).

```js
amvcpChart.catmullRom([
  {x: 0, y: 0}, {x: 10, y: 20}, {x: 20, y: 15}, {x: 30, y: 35}
]);
//=> 'M0 0 C... C... C...'
```

Used internally by `line`, `area`. Useful externally for custom smooth
curves.

## `getSelection()`

Return a SHALLOW COPY of the chart module's internal selection list. Only
populated in STANDALONE mode (when `window.toggleElementSelection` is
absent — the runtime usually owns the selection list).

```js
amvcpChart.getSelection();
//=> [{id, type:"chart-point", label, data:{...}}, ...]
```

In runtime mode (with `amvcp-runtime.js` loaded), this list is empty —
the selection is in `window.veSelection` instead.

## `registry`

The dispatch table mapping chart type → backend / render fn / validate fn
/ max version. Useful for INSPECTING what's supported:

```js
Object.keys(amvcpChart.registry);
//=> ['bar', 'stacked-bar', 'diverging-bar', 'lollipop', 'dot-plot',
//    'connected-dot-plot', 'bullet', 'segmented-bar',
//    'line', 'area', 'step-area', 'slope', 'bump',
//    'donut', 'gauge', 'harvey-ball', 'radar',
//    'waterfall', 'funnel', 'mekko',
//    'heatmap', 'matrix', 'activity-heatmap',
//    'metric-cards']

amvcpChart.registry['bar'];
//=> { backend: 'svg', render: fn, validate: fn, maxVersion: 1 }
```

DO NOT mutate the registry from outside the module — it's exposed for
inspection, not extension.

## `injectChartCSS(doc)`

Append the chart skill's `<style>` to `doc.head`. Idempotent (the
`<style id="vc-chart-styles">` is checked for existence first).

```js
amvcpChart.injectChartCSS(document);
```

Auto-called on `DOMContentLoaded` (unless `window.__vcManualInit`).
Useful when the chart module is loaded into a page that doesn't fire
DOMContentLoaded (e.g. an already-loaded fragment via XHR).

## Test hook: `window.__veChart`

A test harness companion exposing internal state + helpers:

```js
window.__veChart = {
  get state() {
    return { reduced, chartCount, selection, cssInjected };
  },
  get REDUCED() { return REDUCED; },
  set REDUCED(v) { REDUCED = !!v; },
  scan, render, injectChartCSS, getSelection,
  clearSelection: function () { _selection.length = 0; }
};
```

Useful for dev-browser tests:

```js
// Force reduced motion for deterministic screenshot.
window.__veChart.REDUCED = true;
// Re-scan.
window.__veChart.scan(document);
// Inspect.
console.log(window.__veChart.state);
// Reset between tests.
window.__veChart.clearSelection();
```

The test hook is also where the per-chart `__veChartRedraw` lives (set
during `renderCanvas`).

## See also

- [chart-fence-protocol.md](./chart-fence-protocol.md) — the authoring contract.
- [chart-palette-engine.md](./chart-palette-engine.md) — palette / ramp internals.
- [chart-canvas-backend.md](./chart-canvas-backend.md) — Canvas-side behavior.
