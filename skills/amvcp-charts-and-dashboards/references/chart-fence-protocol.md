# The `chart:<type>@<version>` fenced-block protocol

The authoring spine of every chart in this skill. The author (Claude) emits a
JSON-bearing fenced code block whose info string declares the chart type and
schema version; `amvcp-chart.js` finds the block on boot, parses the JSON,
validates it, and replaces the `<pre>` with rendered SVG / CSS-flex / Canvas.

Zero CDN, zero D3/Plotly/Chart.js, one self-contained offline HTML file.

## Table of contents

- [The contract — one fenced block, one chart](#the-contract--one-fenced-block-one-chart)
- [Language tag grammar](#language-tag-grammar)
- [The JSON envelope](#the-json-envelope)
- [Per-type schemas at a glance](#per-type-schemas-at-a-glance)
- [Validation gates (fail-fast)](#validation-gates-fail-fast)
- [Versioning](#versioning)
- [Boot order](#boot-order)
- [The `<figure>` the runtime emits](#the-figure-the-runtime-emits)
- [Choosing the right type — the decision matrix](#choosing-the-right-type--the-decision-matrix)

---

## The contract — one fenced block, one chart

Every chart authored in this skill is exactly one Markdown / HTML fenced code
block. The author writes:

````markdown
```chart:bar@1
{ "title": "Revenue by quarter",
  "series": [{ "label": "2025", "data": [
    {"x":"Q1","y":2.4}, {"x":"Q2","y":3.1},
    {"x":"Q3","y":2.8}, {"x":"Q4","y":3.6}
  ] }],
  "options": { "sortDescending": true, "valueLabels": true } }
```
````

When the runtime renders the page it finds that `<pre><code>`, reads the
language tag, parses the body as JSON, and replaces the `<pre>` with a
`<figure class="ve-chart">` carrying the rendered chart. The author never
touches SVG; the page never depends on a CDN; one fence = one chart.

## Language tag grammar

The Markdown/HTML language token must match the pattern:

```
chart:<type>@<version>
```

The runtime regex (used in `amvcp-chart.js#_readChartTag`) is:

```
/language-(chart:[\w+@.\-]+)/
```

- `<type>` — one of the 25 registered types (see the [Per-type schemas](#per-type-schemas-at-a-glance) table). Unknown types degrade to a visible error block; they never silently render an arbitrary default.
- `<version>` — an integer ≥ 1. The current runtime supports version 1 only. A spec with a higher version (`chart:bar@9`) is rejected loud, not silently coerced — schemas are versioned so they can evolve without breaking old pages.

A code block whose language tag does NOT match this pattern is left alone by
the chart scanner (the runtime's other skills, e.g. `amvcp-code-block`, may
still claim it).

## The JSON envelope

Every chart spec is a single JSON object with the same outer envelope. The
shared keys are:

| Key | Type | Required | Meaning |
|---|---|---|---|
| `title` | string | **yes** | The insight title — a one-sentence claim the chart proves. Empty string is rejected. |
| `subtitle` | string | no | An optional second-line subtitle below the title. |
| `series` | array | **yes** | At least one series. Every series has `{ label, data }`. The `data` array shape is per-type — see below. |
| `options` | object | no | Per-type render options (`sortDescending`, `valueLabels`, `max`, `grid`, `rowLabels`, `colLabels`, `logScale`, `diverging`, `warnAt`, `dangerAt`). |
| `source` | string | no | A short attribution line printed below the chart. |

A spec missing `title` or `series` is rejected with a VISIBLE error block —
the original JSON is preserved verbatim so the author can fix and re-run.

## Per-type schemas at a glance

The `data` array shape inside each series varies by chart family. Use this
table to pick the right authoring shape, then open the per-type reference
file (`chart-bar.md`, `chart-line.md`, etc.) for full details.

| Type | Family | `data[]` shape | Notes |
|---|---|---|---|
| `bar` | bar | `{x, y}` | Single or grouped series. `options.sortDescending` reorders categories for single-series only. |
| `stacked-bar` | bar | `{x, y}` | Multi-series; sums per category form the y-domain. |
| `diverging-bar` | bar | `{x, y}` | `y` may be negative. Positive bars use `--vc-color-success`, negative use `--vc-color-danger`. |
| `lollipop` | bar | `{x, y}` | Stem + circle head. Lower visual ink than `bar`. |
| `dot-plot` | bar | `{x, y}` | One dot per datum, no bar. |
| `connected-dot-plot` | bar | `{x, y}` | Exactly TWO series; a connector line joins the paired dots per category. |
| `bullet` | bar | `{x, y, range, target}` | KPI vs target + qualitative range. `y` is the actual, `target` is a tick, `range` is the qualitative band. |
| `segmented-bar` | CSS-flex | `{x, y}` | One horizontal flex bar; each segment's flex-grow = `y`. |
| `line` | line | `{x, y}` | Catmull-Rom smoothed unless n=2. |
| `area` | line | `{x, y}` | Line + OKLCH gradient fill to baseline. |
| `step-area` | line | `{x, y}` | Orthogonal step path instead of smoothed. |
| `slope` | line | `{x, y}` | Always two x positions (left edge / right edge). Labels go at the right endpoints. |
| `bump` | line | `{x, rank}` (or `{x, y}` if you use `y` for rank) | Rank-over-time; y-axis inverted so rank 1 is on top. |
| `donut` | circular | `{x, y}` | y values sum to total; center text shows the total. **Hole is mandatory** — never a pie. |
| `gauge` | circular | `{x, y}` + `options.{max,warnAt,dangerAt}` | Single value vs `max`; fill color escalates at warn/danger thresholds. |
| `harvey-ball` | circular | `{x, y}` | y in `[0,100]` or `[0,1]` — fill fraction of the ball. |
| `radar` | radar | `{x, y}` | x is axis name (≥3 axes); y is the magnitude on that axis. Multiple series overlay. |
| `waterfall` | flow | `{x, delta, isTotal?}` | Each step contributes `delta`; an `isTotal:true` step is the running cumulative. |
| `funnel` | flow | `{x, y}` | y is the count at each stage; drop-off % printed between stages. |
| `mekko` | flow | `{x, y}` | Marimekko — column width ∝ column total, each column 0..100% stacked. |
| `heatmap` | grid | `options.grid: number[][]` (or `{row,col,value}` per cell) | OKLCH sequential ramp; `options.logScale:true` flattens sparse outliers. |
| `matrix` | grid | same as heatmap | Same as heatmap + a value glyph centered in each cell. |
| `activity-heatmap` | grid | same as heatmap | GitHub-style; usually 7 rows (weekday) × N weeks. |
| `metric-cards` | composite | `{label, value, delta?, trend?, unit?}` | KPI tile row, not a chart per se — but a chart-point atom each. |
| `pie` | bar (remap) | — | **Guardrail.** Any `pie` spec is remapped to `bar` with `sortDescending: true`; see `chart-pie-guardrail.md`. |

## Validation gates (fail-fast)

Every type has TWO validation gates:

1. **Envelope** (every type) — `title` is a non-blank string; `series` exists and has length ≥ 1; every `series[i].data` is an array.
2. **Type-specific** — for bar/line family: every datum is an object. For heatmap/matrix: a non-empty grid (either `options.grid` or `series[0].data` of cells).

Failure replaces the `<pre>` with a VISIBLE error block: a danger-tinted
banner stating the exact reason, plus the original JSON kept verbatim in a
`<pre class="ve-chart-error-src">`. Never a silent blank box, never a
fabricated default dataset. The author fixes the JSON in place and re-runs.

Examples of degradation messages the runtime emits:

- `chart spec missing required 'title'`
- `series[0] has no 'data' array`
- `invalid JSON — Unexpected token } in JSON at position 47`
- `unknown chart type: teapot`
- `chart version 9 is newer than this runtime supports (max 1)`

## Versioning

The `@<version>` token is an integer. Today only version `1` exists for every
registered type. Future schema-breaking changes will bump the per-type
`maxVersion` so old pages stay correct.

`amvcp-chart.js#registry` keeps `maxVersion: 1` on every entry. When a new
schema is introduced the entry's `maxVersion` is bumped and the parser dual-
dispatches by version internally — old fences continue to render under the
old code path; new fences opt into the new shape by writing `@2`.

## Boot order

The runtime page load sequence the skill assumes:

1. `amvcp-designmd.js` loads first — installs the `--vc-*` CSS custom properties on `<html>`. Without this, charts fall back to the canonical literals baked into every reference.
2. `amvcp-chart.js` loads next — on `DOMContentLoaded` (or immediately if the doc is already loaded) it calls `injectChartCSS(document)` then `scan(document)`. A re-scan after a DOM mutation is one call: `window.amvcpChart.scan(node)`.
3. `amvcp-runtime.js` may load alongside — it wires the multi-select / comment-modal / decision pill machinery the chart marks plug into. The chart module is **defensive**: it works standalone without the runtime (own internal selection list, no comment handles).

Manual control: set `window.__vcManualInit = true` BEFORE `amvcp-chart.js`
loads and the module will not self-init. Useful in test fixtures that need
deterministic ordering.

## The `<figure>` the runtime emits

For every successful render the `<pre>` is replaced with:

```html
<figure class="ve-chart"
        data-ve-chart-type="bar"
        data-ve-chart-backend="svg"
        data-ve-id="ve-chart-1"
        data-ve-type="chart">
  <figcaption class="ve-chart-title">…title…</figcaption>
  <div class="ve-chart-subtitle">…subtitle…</div>      <!-- optional -->
  <svg class="ve-chart-svg" viewBox="0 0 640 360" …>…</svg>
  <ul class="ve-chart-legend">…</ul>                   <!-- when multi-series -->
  <div class="ve-chart-source">…source…</div>          <!-- optional -->
</figure>
```

Every mark (`<rect>`, `<circle>`, `<path>`, `<polygon>`, segment, KPI card)
is stamped with `data-ve-id` / `data-ve-type="chart-point"` / `tabindex="0"`
/ `role="button"` so the page's keyboard, screen-reader, multi-select and
comment-modal machinery picks them up with zero new wiring.

## Choosing the right type — the decision matrix

This is the short version; the full version lives in
[chart-decision-matrix.md](./chart-decision-matrix.md).

| Reader needs to … | Best chart | Common mistake |
|---|---|---|
| Compare magnitudes across categories | `bar` (sorted) | Pie chart (banned — see `chart-pie-guardrail.md`). |
| Compare a small set of magnitudes with low ink | `lollipop` or `dot-plot` | Stacked bar (loses individual values). |
| See trend over time, smooth signal | `line` | Bar — discrete bars over time waste category space. |
| See trend with magnitude bias | `area` | Line — misses the area-as-magnitude cue. |
| See breakpoints in a discrete time series | `step-area` | Smoothed `line` — interpolates non-existent intermediate values. |
| Compare two points per category (before/after) | `connected-dot-plot` or `slope` | Grouped bar — pairs are visually disjoint. |
| Show a value vs target | `bullet` or `gauge` | Bar — no target reference. |
| Show parts of a whole | `donut`, `segmented-bar`, or `mekko` | Pie chart (banned). |
| Show a cumulative bridge | `waterfall` | Stacked bar — loses the cumulative narrative. |
| Show stage drop-off | `funnel` | Bar — misses the narrowing geometry. |
| Compare multi-criterion items on the same axes | `radar` | Multi-bar grouped chart — harder to read polygon shape. |
| Show a 2-D intensity surface | `heatmap` or `matrix` (matrix shows numbers) | Two side-by-side charts — readers can't align. |
| Show a KPI dashboard | `metric-cards` | Hand-rolled cards — break the chart-point selection contract. |

## See also

- Each per-type reference file documents the full shape, options, and at least one canonical example.
- [chart-palette-engine.md](./chart-palette-engine.md) — palette / OKLCH ramps.
- [chart-guardrails.md](./chart-guardrails.md) — sparse gridlines, no-pie, no-D3.
- [chart-selection-and-comments.md](./chart-selection-and-comments.md) — selection + comment-handle wiring.
- [chart-canvas-backend.md](./chart-canvas-backend.md) — the 100-mark threshold and Canvas hit-testing.
- [chart-design-tokens.md](./chart-design-tokens.md) — every `--vc-*` token a chart reads.
