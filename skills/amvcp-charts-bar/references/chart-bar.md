# `chart:bar@1` — the bar chart

The default categorical-magnitude chart. Single-series or grouped multi-
series; categories along the x-axis, magnitudes on the y-axis, sparse
horizontal gridlines only (≤4), bars 62% of the band width.

## Table of contents

- [When to choose `bar`](#when-to-choose-bar)
- [Authoring shape](#authoring-shape)
- [Options](#options)
- [Examples](#examples)
- [What the runtime emits](#what-the-runtime-emits)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comments / decision-mini](#selection--comments--decision-mini)
- [Anti-patterns and pitfalls](#anti-patterns-and-pitfalls)

---

## When to choose `bar`

Use `bar` when the reader needs to compare magnitudes across a small set of
named categories (≤12). The bar's length encodes magnitude; sorting the
categories descending puts the largest at the eye's natural landing point
(top-left in LTR languages).

Pick `lollipop` when you want lower ink for the same comparison.
Pick `dot-plot` when you want to visually de-emphasise the y=0 baseline.
Pick `bullet` when each value has an associated target.
Pick `stacked-bar` when each category decomposes into named parts.

**Never use `pie` for parts-of-a-whole** — `pie` is remapped to `bar`
automatically (see `chart-pie-guardrail.md`).

## Authoring shape

```chart:bar@1
{
  "title": "Revenue by quarter",
  "subtitle": "Q4 was the strongest in 3 years",
  "series": [
    { "label": "2025", "data": [
        {"x":"Q1","y":2.4},
        {"x":"Q2","y":3.1},
        {"x":"Q3","y":2.8},
        {"x":"Q4","y":3.6}
    ] }
  ],
  "options": { "sortDescending": true, "valueLabels": true },
  "source": "Internal billing system"
}
```

- `title` — REQUIRED. The one-sentence insight ("Q4 was the strongest in 3 years"), not a label ("Revenue chart").
- `subtitle` — optional second line.
- `series[i].label` — the legend label (only shown when ≥ 2 series).
- `series[i].data[k].x` — the category label (printed under the band).
- `series[i].data[k].y` — the numeric magnitude. Non-numeric values silently render no bar for that datum — useful for "no data" categories without breaking the chart.
- `options.sortDescending` — single-series only; reorders categories from largest to smallest y. Sorting a grouped chart is ambiguous (which series wins?) so it is ignored on multi-series.
- `options.valueLabels` — prints `fmtNum(y)` 6px above each non-stacked bar. Useful when the chart is the only place the reader sees the exact numbers.

## Options

| Key | Default | Effect |
|---|---|---|
| `sortDescending` | `false` | Single-series only; reorder categories by y. |
| `valueLabels` | `false` | Print formatted value above each bar (skipped for stacked-bar). |

The bar family does NOT honor a user-supplied `colors` field — palette comes
from `palette(n)` (golden-angle on top of `--vc-color-accent`), which keeps
the chart in the same tonal register as the page theme. Override by editing
the DESIGN.md `--vc-color-accent` token, not the spec.

## Examples

### 1. Single series, sorted

```chart:bar@1
{ "title": "Top 5 customers by ARR ($M)",
  "series": [{ "label": "ARR", "data": [
    {"x":"Acme","y":4.8}, {"x":"Globex","y":3.2},
    {"x":"Initech","y":2.7}, {"x":"Hooli","y":2.1},
    {"x":"Pied Piper","y":1.4}
  ] }],
  "options": { "sortDescending": true, "valueLabels": true } }
```

### 2. Grouped multi-series (no sort)

```chart:bar@1
{ "title": "Pipeline by stage and region",
  "series": [
    { "label": "EMEA", "data": [
      {"x":"Lead","y":120}, {"x":"Qual","y":80},
      {"x":"Demo","y":45}, {"x":"Close","y":18} ] },
    { "label": "AMER", "data": [
      {"x":"Lead","y":180}, {"x":"Qual","y":110},
      {"x":"Demo","y":60}, {"x":"Close","y":28} ] }
  ] }
```

When there are ≥ 2 series the chart shifts to grouped mode: each category
band gets one slot per series. Bars are slightly narrower so all slots fit
inside the 62% band width.

### 3. Highlight the peak (single-bar accent)

This recipe matches the `11-status-report.html` "Velocity bar chart" pattern
from the mining catalog — one bar in the accent color, the rest neutral.
There is no built-in `highlightIndex` option; instead, post-process the
emitted SVG after `scan()` runs:

```js
amvcpChart.scan(document);
document.querySelectorAll('figure[data-ve-chart-type="bar"] .ve-chart-bar')
  .forEach((rect, i, arr) => {
    if (i === arr.length - 1) {
      rect.style.fill = 'var(--vc-color-accent)';
    } else {
      rect.style.fill = 'var(--vc-color-border-strong)';
    }
  });
```

Better practice: split the data into two series (`peak` and `others`) and
let the palette assign distinct colors via `palette(2)`.

### 4. Sparse-data category with missing y

```chart:bar@1
{ "title": "Tickets per team — Q3",
  "series": [{ "label": "tickets", "data": [
    {"x":"Eng","y":34}, {"x":"Sales","y":null},
    {"x":"Ops","y":18}, {"x":"Support","y":22}
  ] }] }
```

The `Sales` band still gets its label and gridlines but no bar — explicit
"no data" without breaking the layout.

## What the runtime emits

```html
<figure class="ve-chart"
        data-ve-chart-type="bar"
        data-ve-chart-backend="svg"
        data-ve-id="ve-chart-N">
  <figcaption class="ve-chart-title">…</figcaption>
  <svg class="ve-chart-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
    <g class="ve-chart-gridlines">…</g>
    <g class="ve-chart-axis">…</g>
    <line class="ve-chart-baseline" …/>
    <g class="ve-chart-bars">
      <rect class="ve-chart-bar"
            x="…" y="…" width="…" height="…" rx="var(--vc-radius-sm,4)"
            fill="var(--vc-color-accent, #b8861f)"
            data-ve-id="ve-chart-N-d0-i0"
            data-ve-type="chart-point"
            data-ve-label="2025 · Q1"
            data-ve-value="2.4"
            tabindex="0" role="button">
        <title>2025 · Q1: 2.4</title>
      </rect>
      …
    </g>
    <g class="ve-chart-xlabels">…</g>
    <g class="ve-chart-vlabels">…</g>            <!-- only when valueLabels:true -->
  </svg>
  <ul class="ve-chart-legend">…</ul>             <!-- only when multi-series -->
</figure>
```

Every `<rect>` is a `chart-point` atom — the page's keyboard, screen-reader,
multi-select and comment-modal machinery picks it up with zero new wiring.

## Lib functions called

`amvcp-chart.js#renderSvgBar` is the renderer. The supporting helpers it
calls:

- `_buildFigure(type, spec)` — creates the `<figure>` host + `<figcaption>` + ID.
- `palette(seriesCount)` — golden-angle OKLCH palette for multi-series.
- `niceTicks(0, dataMax, 4)` — rounds the y-domain to ≤ 5 nice values.
- `scale(domBottom, domTop, yBase, yTop)` — linear value-to-pixel map.
- `_drawGrid(svgEl, ticks, yScale, x0, x1)` — capped sparse gridlines.
- `markPoint(node, info)` — stamps `data-ve-id` / `data-ve-type="chart-point"` + the selection payload.
- `_wireMarks(fig)` — hover/click/keyboard wiring on every mark.
- `animateOnView(fig, fn)` — fires `growUp` keyframe once the chart enters the viewport (skipped on `prefers-reduced-motion: reduce`).

## DESIGN.md tokens used

The bar renderer reads the following `--vc-*` custom properties off `<html>`
(each has a literal fallback if the token is absent, so a tokenless page
still renders correctly):

| Token | Used for |
|---|---|
| `--vc-color-accent` | Single-series fill color. |
| `--vc-color-border` | Gridline stroke. |
| `--vc-color-border-strong` | Baseline stroke. |
| `--vc-color-content` | Value-label fill, title fill. |
| `--vc-color-content-muted` | Axis label fill, subtitle. |
| `--vc-color-surface-raised` | Tooltip background. |
| `--vc-color-on-accent` | Selected-state text. |
| `--vc-color-success` | Diverging-bar positive fill (delegated to that variant). |
| `--vc-color-danger` | Diverging-bar negative fill, error banner. |
| `--vc-radius-sm` | Bar corner radius. |
| `--vc-radius-md`, `--vc-radius-lg` | Legend swatch, metric card. |
| `--vc-text-0` … `--vc-text-5` | Type scale. |
| `--vc-weight-medium`, `--vc-weight-bold` | Text weights. |
| `--vc-font-body`, `--vc-font-heading` | Font families. |
| `--vc-space-0` … `--vc-space-5` | Vertical rhythm + legend gap. |
| `--vc-duration-fast`, `--vc-duration-slow` | Hover transition + entry animation. |
| `--vc-easing-decel` | Entry-animation easing. |

A theme hot-swap re-themes every SVG bar with no re-render — the values are
read at paint time via `var(--vc-…, fallback)`.

## Selection / comments / decision-mini

Every bar `<rect>` is a `chart-point` atom. The atom carries:

- `data-ve-id` — `ve-chart-N-dD-iI` (N=chart seq, D=series index, I=category index).
- `data-ve-type="chart-point"` — the runtime's selection router uses this.
- `data-ve-label` — the chart-point's tooltip label ("2025 · Q1").
- `data-ve-value` — the raw y value (string form for HTML compat).
- `tabindex="0"` + `role="button"` — keyboard reachable.
- `__veChartPayload` — the JS-side selection payload (`type:"chart-point"`, `data:{chartId, datasetIndex, datasetLabel, index, xLabel, value}`).

Click toggles the atom into the page's `veSelection` set (or the chart
module's internal fallback list if the runtime is absent). Space/Enter on
a focused atom does the same.

When ≥ 1 mark inside a figure is selected:
- The runtime stamps `data-ve-selected="1"` on the mark; the bar paints brighter with a 2-px accent stroke.
- The figure gets an outer accent outline via `:has([data-ve-selected="1"])`.
- ONE `.ve-comment-handle` bubble is mounted at the figure's left edge via the chart module's group-handle observer (see `chart-selection-and-comments.md`).
- A 3-radio `Skip/Approve/Deny` decision-mini-pill is attached to every atom via `amvcpRuntime.attachDecisionMini` (defensively guarded — when the runtime is absent the bar still works).

The selection payload shape is **identical** to what the legacy
`veWireChart` API emitted for hand-built Chart.js charts, so existing
multi-turn comment flows work unchanged.

## Anti-patterns and pitfalls

- **Authoring a `pie` chart.** It is automatically remapped to `bar` with `sortDescending:true`. Just write `bar` from the start.
- **Sorting a grouped chart.** `options.sortDescending` is ignored when there are ≥ 2 series — sort which one wins?
- **More than 12 categories.** Becomes hard to scan; consider `lollipop` or split into two charts.
- **Stacking heterogeneous units.** Stacked bars only make sense when the parts share a unit (`headcount per team`, `revenue per region`). Stacking `revenue` + `headcount` is meaningless even if the numbers happen to look comparable.
- **Hardcoding a fill color in the spec.** There is no `color` field on `data[i]` — pin colors via the theme's `--vc-color-accent` instead.
- **Hand-rolling SVG bars inside an HTML report.** That bypasses the chart-point selection contract and the entry animation. Always go through the fence protocol.

## Visual verification

After authoring a `bar` chart, run the self-debug checklist:
`skills/amvcp-self-debug-rules/SKILL.md` — light + dark theme rendering,
no-nested-scrollbars, selection state, comment-handle mount, decision-mini.
