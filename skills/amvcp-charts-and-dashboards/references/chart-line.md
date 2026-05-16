# `chart:line@1` — line chart

A line chart with Catmull-Rom smoothing (cubic-Bezier spline through every
data point, no overshoot). Multi-series overlays cleanly via golden-angle
palette. Entry animation uses `getTotalLength()` + `stroke-dashoffset` to
draw the line on-view.

## When to choose line

Use `line` when:

- The x-axis is a CONTINUOUS series (time, sequence, increasing measurement).
- The reader needs to see a TREND (going up? down? plateauing? oscillating?).
- Smooth interpolation between points is meaningful (a measurement at every minute, not a discrete event count).

Pick `area` when you also want the magnitude under the curve emphasised.
Pick `step-area` when the value JUMPS discretely between points (a balance,
a price tier, an inventory level).
Pick `bar` when the x-axis is CATEGORICAL (months as named buckets, not as
a continuous timeline).
Pick `bump` when the y-axis is a RANK rather than a magnitude.
Pick `slope` when you have only two x positions (before vs after).

## Authoring shape

```chart:line@1
{
  "title": "p50 vs p95 latency",
  "subtitle": "Wednesday cache warm-up flattens the p95",
  "series": [
    { "label": "p50", "data": [
      {"x":"Mon","y":80}, {"x":"Tue","y":92},
      {"x":"Wed","y":74}, {"x":"Thu","y":88},
      {"x":"Fri","y":70}
    ] },
    { "label": "p95", "data": [
      {"x":"Mon","y":210}, {"x":"Tue","y":250},
      {"x":"Wed","y":190}, {"x":"Thu","y":240},
      {"x":"Fri","y":205}
    ] }
  ]
}
```

- `data[k].x` — the x-axis label (printed under the corresponding tick).
- `data[k].y` — the magnitude. Non-numeric values produce no point — useful for gaps in the data (the line jumps the gap rather than rendering through zero).
- Each series can have a different `data.length` — the x-axis ticks come from `series[0].data`.

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | n/a | Not used. Hover shows the exact value via the tooltip; per-point value labels would clutter a multi-series line. |
| `sortDescending` | n/a | Lines are ordered by x position, not by y. Sorting would lose the trend.|

## Examples

### 1. Single series with smooth curve

```chart:line@1
{ "title": "Daily signups — last 14 days",
  "series": [{ "label": "signups", "data": [
    {"x":"D1","y":42},{"x":"D2","y":51},{"x":"D3","y":48},
    {"x":"D4","y":62},{"x":"D5","y":58},{"x":"D6","y":71},
    {"x":"D7","y":68},{"x":"D8","y":80},{"x":"D9","y":74},
    {"x":"D10","y":92},{"x":"D11","y":98},{"x":"D12","y":105},
    {"x":"D13","y":118},{"x":"D14","y":131}
  ] }] }
```

### 2. Multi-series overlay (4 series)

```chart:line@1
{ "title": "MAU by tier",
  "series": [
    { "label": "Free", "data": [
      {"x":"Jan","y":12000},{"x":"Feb","y":14500},
      {"x":"Mar","y":17800},{"x":"Apr","y":21200}] },
    { "label": "Pro", "data": [
      {"x":"Jan","y":3400},{"x":"Feb","y":3680},
      {"x":"Mar","y":4100},{"x":"Apr","y":4520}] },
    { "label": "Team", "data": [
      {"x":"Jan","y":680},{"x":"Feb","y":740},
      {"x":"Mar","y":820},{"x":"Apr","y":920}] },
    { "label": "Enterprise", "data": [
      {"x":"Jan","y":42},{"x":"Feb","y":48},
      {"x":"Mar","y":55},{"x":"Apr","y":62}] }
  ] }
```

The y-domain spans `[0, max]` across all four series — Free dominates the
scale; Enterprise is a near-flat line at the bottom. If you need the tier
shape to be readable independently, split into a 2×2 small-multiples
layout (see `chart-dashboard-recipes.md`).

### 3. Two-point line (degenerates to a straight segment)

```chart:line@1
{ "title": "Cycle time: before vs after the rewrite",
  "series": [{ "label": "hours", "data": [
    {"x":"Before","y":42},
    {"x":"After","y":12}
  ] }] }
```

With only two points, the Catmull-Rom path degenerates to a straight
segment (the spline solver returns the straight line when fewer than 4
points are provided). For "before vs after" specifically, `slope` is the
better choice — it lays the line out edge-to-edge with end labels.

## What the runtime emits

```html
<figure class="ve-chart" data-ve-chart-type="line" data-ve-chart-backend="svg" …>
  <svg class="ve-chart-svg" viewBox="0 0 640 360">
    <g class="ve-chart-gridlines">…</g>
    <g class="ve-chart-axis">…</g>
    <!-- Per series: -->
    <path class="ve-chart-line"
          d="M… C… C… C…"
          fill="none"
          stroke="var(--vc-color-accent, #b8861f)"/>
    <g class="ve-chart-points">
      <circle class="ve-chart-point"
              cx="…" cy="…" r="4"
              fill="(same as stroke)"
              data-ve-id="ve-chart-N-d0-i0"
              data-ve-type="chart-point" …>
        <title>p50 · Mon: 80</title>
      </circle>
      …
    </g>
    <g class="ve-chart-xlabels">…</g>
  </svg>
  <ul class="ve-chart-legend">…</ul>
</figure>
```

The PATH itself is decorative (not an atom). Each POINT circle is a
`chart-point` atom — that is what the reader clicks to comment on.

## Lib functions called

`renderSvgLine(spec, 'line', fig)`:

- `palette(seriesCount)` for multi-series colors.
- `niceTicks(min(0, dataMin), dataMax, 4)` for the y-domain.
- `scale(domBottom, domTop, yBase, M.t)` for the y-scale.
- `xScale(idx)` — `x0 + (plotW / (n - 1)) * idx` for evenly spaced x positions.
- `catmullRom(points)` — generates the cubic-Bezier path string through every point.
- For each datum: append `<circle class="ve-chart-point">` and `markPoint(dot, …)`.
- `_appendLegend(fig, labels, colors)` when multi-series.
- `animateOnView(fig, fn)` — on first view, for each `<path class="ve-chart-line">`: set `strokeDasharray = totalLength`, set `strokeDashoffset = totalLength`, force a reflow, transition `strokeDashoffset` to 0 over `--vc-duration-slow` with stagger between series.

The `catmullRom` helper:

```js
function catmullRom(points) {
  // For each segment, control points are derived from neighbours with tension 0.5.
  // Smooth curve through every point, NO overshoot.
  // Returns a path string starting with M (move) and concatenating C segments.
}
```

The KEY behavior: every datum is ON the curve, none is approximated.
Catmull-Rom guarantees this; cubic-Bezier alone does not.

## DESIGN.md tokens

Same as `bar` plus:

| Token | Used for |
|---|---|
| `--vc-color-accent` | Single-series line stroke. |
| `--vc-duration-slow` | Draw-on entry animation duration. |
| `--vc-easing-decel` | Draw-on entry animation easing. |

Line stroke width / line-cap / line-join from the CSS:

```css
.ve-chart-line { stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
```

## Selection / atoms

Each `<circle class="ve-chart-point">` is an atom. Selected state paints
the dot brighter with a 2-px accent stroke; the LINE itself doesn't paint
selected (a selected line would suggest "the whole series", which is not
what an atom selection means).

## Anti-patterns

- **Using `line` for categorical x.** Smoothing implies the y between "Marketing" and "Sales" is meaningful — it is not. Use `bar`.
- **Plotting 1 datum.** A line needs at least 2 points; the renderer doesn't crash on 1, but the result is meaningless.
- **Logging the y values into the spec.** If the data is exponential, take `log(y)` BEFORE passing to the chart — the runtime does not auto-scale logarithmically. See `chart-heatmap.md` for log-scale support in heatmaps (the only type where it's built in).
- **Hand-rolling a sparkline as a `line` chart with no axes.** Use the sparkline recipe (see `chart-sparklines-and-inline.md`) — a sparkline lives INSIDE prose / a card / a stat tile.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: line draw-on animation
respects `prefers-reduced-motion`; point circles are visible at all
densities; multi-series palette is distinct on both themes.
