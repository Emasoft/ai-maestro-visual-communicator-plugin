# `chart:activity-heatmap@1` — GitHub-style activity heatmap

A heatmap convention: rows = weekday, columns = week-of-year, cells colored
by activity intensity. The "calendar contribution graph" pattern popularised
by GitHub. Same renderer as `heatmap`, but the conventional dimensions
(7 rows × N weeks) keep it visually distinctive.

## When to choose activity-heatmap

Use `activity-heatmap` when:

- The data is a CALENDAR-LIKE series (one value per day, week, hour-of-day).
- The reader cares about WEEKLY PATTERNS (Monday spike? weekend dip?) more
  than the raw timeseries.
- The 7×N visual shape is the immediate signal — readers recognise it.

Pick `heatmap` instead when the dimensions are NOT calendar-shaped (rows
are services, columns are versions, etc.).
Pick `line` instead when the temporal trend matters more than the day-of-
week pattern.

## Authoring shape

Same as `heatmap` — the only difference is the type tag. Conventional
layout:

```chart:activity-heatmap@1
{
  "title": "Commits per day — last 12 weeks",
  "subtitle": "Steady weekday rhythm; rare weekend spikes",
  "series": [{ "label": "commits", "data": [] }],
  "options": {
    "grid": [
      [0, 1, 2, 3, 2, 1, 0,  4, 5, 4, 3, 2],   // Mon
      [2, 4, 5, 6, 5, 4, 3,  6, 7, 6, 5, 4],   // Tue
      [3, 5, 6, 8, 7, 6, 4,  7, 8, 7, 6, 5],   // Wed
      [4, 6, 7, 9, 8, 7, 5,  8, 9, 8, 7, 6],   // Thu
      [2, 4, 4, 5, 4, 3, 2,  5, 6, 5, 4, 3],   // Fri
      [0, 0, 1, 0, 1, 0, 0,  1, 0, 0, 0, 1],   // Sat
      [0, 0, 0, 1, 0, 0, 0,  0, 1, 0, 0, 0]    // Sun
    ],
    "rowLabels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    "colLabels": ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"]
  }
}
```

- 7 rows are conventional (Mon-Sun); fewer rows for hour-of-day variants.
- Column count is free (typically 12-52 weeks, depending on the span).

## Options

Same as `heatmap`:
- `grid` (REQUIRED — the cell value matrix)
- `rowLabels`, `colLabels`
- `logScale` — useful when activity is bursty (one week with 100x more activity than the rest)
- `diverging` — useful for activity-vs-baseline (positive = above baseline, negative = below)

## Examples

### 1. Hourly server activity (24 rows × 7 columns)

```chart:activity-heatmap@1
{ "title": "Requests per hour — last week",
  "series": [{ "label": "req", "data": [] }],
  "options": {
    "grid": [
      [12,8,9,11,18,4,3],  [10,7,8,10,17,3,3],
      [9,6,7,10,15,3,2],   [8,5,6,9,14,2,2],
      [7,5,6,9,12,2,2],    [9,7,8,12,16,4,3],
      [42,38,40,52,68,18,14], [110,98,102,128,180,42,32],
      [180,170,175,210,280,68,52], [220,210,215,250,320,88,68],
      [240,230,235,270,340,98,75], [250,240,245,280,350,108,82],
      [260,250,255,290,360,118,90], [255,245,250,285,355,112,86],
      [240,230,235,270,340,98,75], [220,210,215,250,320,88,68],
      [195,185,190,220,290,78,60], [165,155,160,190,250,68,52],
      [140,130,135,160,210,58,45], [115,108,112,135,180,48,38],
      [88,82,85,105,140,38,30], [62,58,60,75,100,28,22],
      [40,38,40,52,68,18,14], [22,20,22,28,38,8,6]
    ],
    "rowLabels": ["00","01","02","03","04","05","06","07","08","09",
                  "10","11","12","13","14","15","16","17","18","19",
                  "20","21","22","23"],
    "colLabels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
  } }
```

### 2. Sparse rare-event heatmap (use log-scale)

```chart:activity-heatmap@1
{ "title": "5xx errors per day — last 8 weeks",
  "series": [{ "label": "5xx", "data": [] }],
  "options": {
    "grid": [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 240, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    "rowLabels": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    "colLabels": ["W1","W2","W3","W4","W5","W6","W7","W8"],
    "logScale": true
  } }
```

Without `logScale`, the single 240-error cell would dominate the chart and
all the zero-cells would paint indistinguishably cold. With log-scale, the
spike is still visible but the cold cells aren't reduced to noise.

## What the runtime emits

Identical to `heatmap`. Same `<g class="ve-chart-grid">` with one
`<rect class="ve-chart-cell">` per cell, one `<text>` per row/col label.

## Lib functions called

`renderSvgGrid(spec, 'activity-heatmap', fig)` — branches on
`type` only for the title prefix; rendering logic is identical to
`heatmap`. The runtime treats `activity-heatmap` and `heatmap` as the same
backend with different conventional dimensions.

## DESIGN.md tokens

Same as `heatmap` (sequential ramp by default — `--vc-color-accent` →
`--vc-color-surface`).

## Selection / atoms

Same as `heatmap` — each cell is a `chart-point` atom. The atom label is
`"rowLabel × colLabel"` so selecting "Mon × W3" reads naturally in a
comment thread.

## Anti-patterns

- **Authoring without log-scale on bursty data.** GitHub's own contribution graph uses a log/percentile ramp because daily commit counts are heavy-tailed. Default linear scale washes out the median in a bursty dataset.
- **Adding non-day rows.** The renderer doesn't enforce 7 rows; that's a convention. But other row counts may not read as a "calendar heatmap" to viewers.
- **Re-implementing your own decay-canvas variant.** The CH-13 source idea proposed an "activity decay" using time exponentials; the runtime's heatmap renderer does NOT do this — it draws cells at their as-supplied values. Pre-compute the decay in the spec if you need it (`value = baseValue * exp(-age/halfLife)`).

## When `activity-heatmap` vs `heatmap` semantically

The two types share the same renderer; the difference is purely a
convention signal:

- `activity-heatmap` SIGNALS "this is a calendar-shaped grid" —
  rows are conventionally weekdays (7), columns are weeks. The reader
  immediately reads it as a contribution graph.
- `heatmap` SIGNALS "this is a generic 2-D intensity surface" — rows
  and columns are arbitrary categorical axes.

Pick `activity-heatmap` when the GRID SHAPE communicates "calendar"
even at first glance. Pick `heatmap` for everything else.

## Conventional row count

GitHub's contribution graph uses 7 rows (Mon-Sun) × ~53 columns
(weeks of the year). Other common shapes:

| Shape | Use case |
|---|---|
| 7 rows × N weeks | Daily activity, GitHub-style |
| 24 rows × 7 columns | Hourly activity per weekday |
| 24 rows × 30 columns | Hour-of-day × day-of-month |
| 12 rows × N years | Month-of-year × year (climate, fiscal seasonality) |

The renderer doesn't enforce the convention — any row count works. The
`<svg>` viewBox height auto-scales to `labelT + nRows * cell + 16`.

## Cell shape

Each cell is a square `<rect>` with corner radius `--vc-radius-sm`.
GitHub's contribution graph uses slightly-rounded squares; the chart
module matches that aesthetic by default.

The cell size = `plotW / nCols`. For a wide chart (many columns), cells
become smaller; for a narrow chart, cells stay larger. The chart
viewBox is 640 wide; a 53-week activity heatmap = ~12px cells, which
matches GitHub's compact form.

## The decay-canvas variant (out of scope)

CH-13 in the source mining catalog proposed an "activity decay" using
exponential time decay applied to the cell values. The runtime's
heatmap renderer does NOT do this — it draws cells at their as-
supplied values. If you need decay, pre-compute it in the spec:

```js
// Pre-process: apply exponential decay to recent values.
const halfLifeDays = 14;
const decayed = rawValues.map(({day, count}) => ({
  day, count: count * Math.exp(-day / halfLifeDays)
}));
```

Then build the `options.grid` from the decayed values.

## Color schema variations

The default sequential ramp (`--vc-color-accent` → `--vc-color-surface`)
matches the GitHub "olive on dark" or "green on dark" aesthetic. To
switch to GitHub's classic green:

```yaml
colors:
  light:
    accent: "#39d353"   # GitHub bright green
  dark:
    accent: "#26a641"   # GitHub dark-mode green
```

The activity heatmap auto-themes to whatever `--vc-color-accent` is in
DESIGN.md — no per-chart override.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: low-activity cells
still visible (not invisible against the cold ramp end); both themes are
legible; row/col labels do not overlap on dense grids; the chart viewBox
auto-scales (a 7-row heatmap is much shorter than a 24-row hourly
heatmap).
