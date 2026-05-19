# Canvas backend — the >100-mark scale escape hatch

The renderer auto-switches from SVG to Canvas when a chart's total mark
count exceeds `CANVAS_THRESHOLD = 100`. The switch is transparent: the
author writes the same fenced JSON; the runtime picks the backend.
Selection, tooltips, keyboard access, and theme cascading still work — just
via slightly different mechanics under the hood.

## Table of contents

- [When the switch fires](#when-the-switch-fires)
- [Which types are Canvas-capable](#which-types-are-canvas-capable)
- [What changes for the user](#what-changes-for-the-user)
- [Hit-testing](#hit-testing)
- [Accessibility — the hidden a11y list](#accessibility--the-hidden-a11y-list)
- [Theme hot-swap on Canvas](#theme-hot-swap-on-canvas)
- [Drawing model](#drawing-model)
- [Anti-patterns](#anti-patterns)

---

## When the switch fires

The decision happens at the end of `render(spec, type, host)`:

```js
var markCount = 0;
for (var si = 0; si < spec.series.length; si++) {
  markCount += spec.series[si].data.length;
}
if (markCount > CANVAS_THRESHOLD && CANVAS_CAPABLE[type]) {
  fig.setAttribute('data-ve-chart-backend', 'canvas');
  renderCanvas(spec, type, fig);
} else {
  fig.setAttribute('data-ve-chart-backend', entry.backend);
  entry.render(spec, type, fig);
  _wireMarks(fig);    // SVG paths get the pointer/keyboard wiring
}
```

`CANVAS_THRESHOLD = 100` is the empirical breakpoint. Below it, an SVG
DOM stays nimble; above it, the SVG DOM gets heavy (browser layout cost
scales superlinearly with node count) and Canvas wins on both render time
and interaction smoothness.

The threshold is not a per-spec option — it's a fixed runtime constant
(`amvcp-chart.js#CANVAS_THRESHOLD`).

## Which types are Canvas-capable

Not every chart type has a Canvas fallback. The registry:

```js
var CANVAS_CAPABLE = {
  'bar': 1, 'line': 1, 'area': 1, 'dot-plot': 1
};
```

| Type | Has Canvas fallback? | Notes |
|---|---|---|
| `bar` | YES | Large categorical bars (>100). |
| `line` | YES | Long timeseries, dense polylines. |
| `area` | YES | Same as line + fill below the path. |
| `dot-plot` | YES | Scatter-like dense dot grids. |
| Everything else | NO | Other types have low mark counts by nature (donut has ≤ 8 slices; radar has ≤ 8 axes; mekko has ≤ ~30 cells; heatmap has its own dense path with SVG `<rect>` per cell that holds well past 100). |

If a non-Canvas-capable type exceeds the threshold (e.g. 200 cells in a
heatmap), the renderer STILL uses SVG. The chart may be slower to first-
paint but functions correctly.

## What changes for the user

Visible differences when the Canvas backend kicks in:

| Aspect | SVG backend | Canvas backend |
|---|---|---|
| `<figure data-ve-chart-backend>` | `"svg"` | `"canvas"` |
| Pointer hover tooltip | YES (via `<title>` + JS `mouseover`) | YES (via JS hit-test + the same hover-bridge tooltip) |
| Click → select | YES (per-mark) | YES (per-mark via hit-test) |
| Keyboard navigation | YES (tabindex on each SVG mark) | YES, via a hidden `<ul class="ve-chart-a11y-data">` — every datum is a list item with tabindex, click handler, Space/Enter handler |
| Theme hot-swap re-paints | Automatic (CSS custom properties cascade) | Manual — `scan()` calls `fig.__veChartRedraw()` on themechange |
| DOM weight | One node per mark | Just the `<canvas>` + the a11y `<ul>` |
| Browser print fidelity | Excellent (SVG is print-native) | Reduced (Canvas rasterises at print resolution) |
| Right-click → Save image | "Save image as SVG" via inspecting | Canvas-native "Save as PNG" |

## Hit-testing

The Canvas backend builds a per-render `marks[]` array of every datum's
draw geometry:

```js
marks.push({ kind: 'bar', x: bx, y: cy, w: slotW*0.86, h: bh,
             si: si, di: di, val: val });
// or for points / dots:
marks.push({ kind: 'point', x: cx, y: cy, r: 10,
             si: si, di: di, val: val });
```

On `mousemove` over the canvas, `hitTest(mx, my)` linearly scans `marks`:

- BAR hits: `mx >= m.x && mx <= m.x + m.w && my >= m.y && my <= m.y + m.h`.
  Returns the first containing bar.
- POINT hits: `Math.sqrt((mx-m.x)² + (my-m.y)²) < m.r`. Returns the
  closest matching point (smallest distance).

A hit fires the same tooltip (the shared `_tip` singleton via
`_showTooltip`). A click toggles the same selection via `_toggleSelection`.

Linear scan is O(n) but fast — 100-1000 marks scans in <0.1ms; no need for
a spatial index.

## Accessibility — the hidden a11y list

Canvas datums have no DOM nodes, so keyboard users and screen readers
would have nothing to interact with. The renderer compensates by appending
a hidden `<ul>`:

```html
<ul class="ve-chart-a11y-data" hidden>
  <li data-ve-id="ve-chart-N-d0-i0"
      data-ve-type="chart-point"
      data-ve-value="42"
      tabindex="0" role="button">
    Series A · Mon: 42
  </li>
  …
</ul>
```

Each `<li>` carries the same `data-ve-*` attributes as an SVG mark, plus a
click + Space/Enter handler that calls `_toggleSelection(payload)`. The
hidden attribute keeps it visually absent but keyboard/screen-reader
accessible. Tab navigation lands on each list item in order.

## Theme hot-swap on Canvas

SVG charts re-theme for free (CSS `var(--vc-color-*)` resolves on every
paint). Canvas charts have to be REPAINTED — the canvas pixel data was
written with resolved colors at the previous render.

`scan(root)` handles this:

```js
// from amvcp-chart.js#scan:
var liveCanvas = d.querySelectorAll(
  'figure.ve-chart[data-ve-chart-backend="canvas"]');
for (var lc = 0; lc < liveCanvas.length; lc++) {
  if (typeof liveCanvas[lc].__veChartRedraw === 'function') {
    try { liveCanvas[lc].__veChartRedraw(); } catch (e) { /* noop */ }
  }
}
```

The runtime calls `scan(document)` on theme change. Every live canvas's
`__veChartRedraw()` function (set during `renderCanvas`) re-runs the
draw with fresh token-resolved colors.

This is why a Canvas chart's `figure.ve-chart` carries
`data-ve-chart-backend="canvas"` as a marker — the selector
`'figure.ve-chart[data-ve-chart-backend="canvas"]'` targets only the
charts that need the manual repaint.

## Drawing model

Inside `renderCanvas`:

1. Compute the y-domain (`niceTicks`).
2. Resolve token colors ONCE (`readVar('--vc-color-accent')` etc.) and
   cache them — Canvas can't `var(--…)` per fillStyle.
3. Define `draw()`:
   - Set canvas pixel size to `cssWidth * devicePixelRatio` (for crisp
     paints on high-DPI displays).
   - `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` — every subsequent draw
     coordinate is in CSS px.
   - Clear, draw sparse gridlines + tick labels, draw bars / lines / dots.
   - Populate `marks[]` per datum.
4. Wire `mousemove` / `mouseleave` / `click` on the canvas.
5. Build the hidden a11y list with keyboard handlers.
6. Initial `draw()`, then `requestAnimationFrame(draw)` for a second pass
   once laid out, then `window.addEventListener('resize', draw)`.

The `draw()` function is idempotent — calling it again redraws from
scratch. This is what `__veChartRedraw` invokes on theme change.

## Anti-patterns

- **Authoring 500 bars in a `bar` chart.** Canvas handles it fine but the
  chart's visual readability suffers — 500 thin bars are unreadable. Aggregate
  the data (group by week, top-N, etc.).
- **Expecting per-bar CSS theming on a Canvas chart.** Canvas paints are
  pixel data, not DOM nodes — you can't `.ve-chart-bar:hover` your way to
  styling. Use the tooltip / selection mechanics instead.
- **Assuming a `:has([data-ve-selected="1"])` outer ring on a Canvas chart.**
  The Canvas backend's marks live in the a11y `<ul>`, not as Canvas-pixel
  children of the `<figure>`. The `:has` selector still works — when an
  `<li>` is selected (data-ve-selected=1), the figure's `:has(…)` selector
  picks it up.
- **Printing a Canvas chart at high resolution.** Canvas rasterises at its
  current pixel resolution; print at 300 DPI can look blocky. For
  print-quality charts, force SVG by keeping the mark count ≤ 100 (e.g.
  aggregate to ≤ 100 categories).

## See also

- [chart-fence-protocol.md](./chart-fence-protocol.md#choosing-the-right-type--the-decision-matrix)
- [chart-design-tokens.md](./chart-design-tokens.md) — tokens the Canvas backend reads at render time.
- [chart-bar.md](../../amvcp-charts-bar/references/chart-bar.md), [chart-line.md](../../amvcp-charts-line-area/references/chart-line.md), [chart-area.md](../../amvcp-charts-line-area/references/chart-area.md), [chart-dot-plot.md](../../amvcp-charts-bar/references/chart-dot-plot.md) — the four Canvas-capable types.
