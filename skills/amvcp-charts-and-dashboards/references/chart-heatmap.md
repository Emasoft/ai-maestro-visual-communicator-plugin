# `chart:heatmap@1` — heatmap

A 2-D grid of colored cells; each cell's color encodes a magnitude via an
OKLCH sequential ramp anchored to `--vc-color-accent`. Optional log-scale
mapping keeps a sparse high outlier from washing out the rest of the grid.

## When to choose heatmap

Use `heatmap` when:

- The data is a 2-D matrix where COLORS (intensities) are the message, not
  per-cell numbers (use `matrix` if numbers should be visible in each cell).
- You need to spot HOT/COLD regions across two categorical axes (errors by
  weekday × hour; performance by version × test suite).
- The grid is reasonably small (≤ ~40 columns × ~24 rows in a single chart).

Pick `matrix` instead when readers need the numeric value visible per cell.
Pick `activity-heatmap` for GitHub-style year-of-day grids (semantically
equivalent to heatmap, but conventionally narrower with a fixed 7-row
height for weekdays).
Pick `bar` instead when there is only ONE categorical axis.

## Authoring shape

There are two equally valid input shapes — pick the one that fits the data
better.

### Shape A — `options.grid` 2-D number array

```chart:heatmap@1
{
  "title": "Errors by hour-of-day and weekday",
  "subtitle": "Thursday evening spike — investigate the 18:00 deploy",
  "series": [{ "label": "errors", "data": [] }],
  "options": {
    "grid": [
      [ 2,  5,  9, 14,  6],
      [ 3,  8, 22, 31,  9],
      [ 1,  4,  7, 12,  5],
      [ 0,  2,  6, 18, 40]
    ],
    "rowLabels": ["Night","Morning","Noon","Evening"],
    "colLabels": ["Mon","Tue","Wed","Thu","Fri"]
  }
}
```

### Shape B — `series[0].data` as cell objects

```chart:heatmap@1
{
  "title": "Errors by hour-of-day and weekday",
  "series": [{ "label": "errors", "data": [
    {"row":0,"col":0,"value":2,"rowLabel":"Night","colLabel":"Mon"},
    {"row":0,"col":1,"value":5,"colLabel":"Tue"},
    {"row":1,"col":0,"value":3,"rowLabel":"Morning"},
    …
  ] }]
}
```

Shape A is denser to author and easier to update; Shape B is necessary when
the matrix is SPARSE (most cells empty) or you want per-cell labels that
don't share rows/cols.

## Options

| Key | Default | Effect |
|---|---|---|
| `grid` | undefined | 2-D number array. Drives the cell value matrix when present (overrides series data). |
| `rowLabels` | `["1","2",…]` | Row labels (left of the grid). |
| `colLabels` | `["1","2",…]` | Column labels (above the grid). |
| `logScale` | `false` | When true, cell colors map via `log(1+v) / log(1+max)` — flattens sparse high outliers so the rest of the grid stays distinguishable. |
| `diverging` | `false` | When true, color ramp uses the diverging mode (danger → surface → success), useful for signed data like "delta vs target". |

## Examples

### 1. Performance regression heatmap (log scale)

```chart:heatmap@1
{ "title": "p99 latency (ms) by service × version",
  "series": [{ "label": "p99", "data": [] }],
  "options": {
    "grid": [
      [120, 130, 124, 142, 156, 320],
      [ 88, 102,  98, 110, 124, 280],
      [ 64,  72,  78,  82,  94, 180],
      [ 92,  88, 102, 108, 124, 240]
    ],
    "rowLabels": ["auth","catalog","orders","payments"],
    "colLabels": ["v0.9","v1.0","v1.1","v1.2","v1.3","v1.4"],
    "logScale": true
  } }
```

The `v1.4` column has 2-3× the values of the rest — without `logScale`, the
rest of the grid would all paint near-cold and the regression would dominate
visually. With log-scale, the gradient stretches so even small differences
in cooler cells stay readable.

### 2. Sentiment matrix (diverging)

```chart:heatmap@1
{ "title": "Survey sentiment by question × cohort",
  "series": [{ "label": "score", "data": [] }],
  "options": {
    "grid": [
      [ 0.42, -0.18,  0.61,  0.04],
      [ 0.12, -0.42, -0.08, -0.62],
      [ 0.78,  0.34,  0.81,  0.52],
      [-0.24, -0.31,  0.04, -0.18]
    ],
    "rowLabels": ["Q1 (ease)","Q2 (price)","Q3 (support)","Q4 (docs)"],
    "colLabels": ["Free","Pro","Team","Enterprise"],
    "diverging": true
  } }
```

`diverging:true` maps `[min, 0]` to a danger ramp and `[0, max]` to a
success ramp — the zero midpoint is the OKLCH surface color, not gray.

## What the runtime emits

```html
<svg class="ve-chart-svg" viewBox="0 0 640 (varies)" preserveAspectRatio="xMidYMid meet">
  <g class="ve-chart-grid">
    <!-- Per cell: ONE <rect class="ve-chart-cell">. -->
    <rect class="ve-chart-cell"
          x="…" y="…" width="(cell)" height="(cell)"
          rx="var(--vc-radius-sm,4)"
          fill="(ramp(t, sequential|diverging))"
          data-ve-id="ve-chart-N-d0-i0"
          data-ve-type="chart-point" …>
      <title>Night × Mon: 2</title>
    </rect>
    …
  </g>
  <g class="ve-chart-grid-rowlabels">…</g>
  <g class="ve-chart-grid-collabels">…</g>
</svg>
```

The chart viewBox height auto-scales with `nRows` (no clipping or
overflow). Cell side = `(plotW / nCols)`.

## Lib functions called

`renderSvgGrid(spec, 'heatmap', fig)`:

- `_gridCells(spec)` — normalises both input shapes to a flat list of `{row, col, value}` cells.
- `maxV = max(cell.value)`.
- For each cell:
  - `t = rampT(value, maxV, logScale)` — `t` in `[0, 1]`.
  - `fill = ramp(t, diverging ? 'diverging' : 'sequential')`.
  - Append `<rect class="ve-chart-cell" …>` and `markPoint(rect, …)`.
- `_gridRowLabels`, `_gridColLabels` — fall back to "1","2",… when not provided.
- Each cell's `data-ve-label` is `"rowLabel × colLabel"` so the selection
  payload reads naturally.

The `ramp` helper:

```js
function ramp(t, mode) {
  if (mode === 'diverging') {
    // 0 -> danger, 0.5 -> neutral surface, 1 -> success.
    // OKLCH color-mix, no dead-gray midpoint.
  }
  // sequential
  return 'color-mix(in oklch, var(--vc-color-surface) ((1-t)*100)%, var(--vc-color-accent))';
}
```

Browser resolves `color-mix(in oklch, …)` at paint time — a theme swap
re-themes every cell with no re-render.

## DESIGN.md tokens

| Token | Used for |
|---|---|
| `--vc-color-accent` | Sequential ramp hot end. |
| `--vc-color-surface` | Sequential ramp cold end; diverging neutral mid. |
| `--vc-color-success` | Diverging ramp positive hot end. |
| `--vc-color-danger` | Diverging ramp negative hot end. |
| `--vc-color-content-muted` | Row/col label fill. |
| `--vc-radius-sm` | Cell corner radius. |

## Selection / atoms

Each cell is a `chart-point` atom. The label combines row + col
(`"Night × Mon"`) so a selected cell's comment thread title reads
naturally.

## Anti-patterns

- **Mixing numbers without normalisation.** If half the cells are `0-10` and the other half are `0-10000`, the high cells wash out the rest. Use `logScale: true` or split into two heatmaps.
- **Grid larger than ~40 × 24.** Cells become too small to see individually. Aggregate the data (hour-of-day → quarter-of-day) or split into smaller heatmaps.
- **Setting cell colors per-spec.** No `color` field on cells; the ramp is the sole encoding. Override via DESIGN.md tokens.
- **Negative values without `diverging:true`.** The sequential ramp `[0, max]` would clip negative values to the cold end. Use diverging.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: hot cells visible on
both themes, log-scale flattens outliers without making the chart unreadable,
diverging midpoint is the surface color (not dead gray).
