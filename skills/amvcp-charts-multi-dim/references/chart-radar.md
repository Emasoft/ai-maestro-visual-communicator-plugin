# `chart:radar@1` — radar / spider chart

## Table of Contents

- [When to choose radar](#when-to-choose-radar)
- [Authoring shape](#authoring-shape)
- [Options](#options)
- [Examples](#examples)
- [What the runtime emits](#what-the-runtime-emits)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens](#designmd-tokens)
- [Selection / atoms](#selection--atoms)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

A multi-axis radar chart for comparing items across 3+ named criteria. The
shape of each polygon IS the item's profile — a small polygon is a weak
item; a large balanced polygon is a strong all-rounder; a spiky polygon is
specialized.

## When to choose radar

Use `radar` when:

- You have 3-8 named CRITERIA / DIMENSIONS to compare items on.
- The reader cares about the OVERALL SHAPE / PROFILE more than per-criterion values.
- The criteria are conceptually unrelated (so a `bar` per criterion would lose the "overall shape" insight).

Pick `bar` (grouped, one bar per criterion) when readers must compare exact
per-criterion values across items.
Pick `bullet` when each criterion has a target/range.
Pick `matrix` when you have many items × many criteria (radar collapses at
~5 polygons overlaid).

## Authoring shape

```chart:radar@1
{
  "title": "Product scorecard",
  "subtitle": "v2 closes the gap on docs and support",
  "series": [
    { "label": "v1", "data": [
      {"x":"Speed","y":7},{"x":"Cost","y":5},{"x":"UX","y":8},
      {"x":"Docs","y":4},{"x":"Support","y":6}
    ] },
    { "label": "v2", "data": [
      {"x":"Speed","y":9},{"x":"Cost","y":6},{"x":"UX","y":9},
      {"x":"Docs","y":7},{"x":"Support","y":8}
    ] }
  ]
}
```

- `series[i].data[k].x` — the axis label (the criterion name). All series must use the SAME `x` values in the SAME order.
- `series[i].data[k].y` — the magnitude on that axis. Domain spans `[0, max(y)]` across all series.
- ≥ 3 axes are needed for a real radar (the renderer doesn't crash with 2, but the polygon collapses to a line).
- 3-8 axes is the legible sweet spot; past 8 the spokes get too dense.

## Options

| Key | Default | Effect |
|---|---|---|
| _(none specific to radar)_ | | |

## Examples

### 1. Single-series radar (one polygon)

```chart:radar@1
{ "title": "Personal Q4 review",
  "series": [{ "label": "score", "data": [
    {"x":"Output","y":8},
    {"x":"Quality","y":7},
    {"x":"Collab","y":9},
    {"x":"Initiative","y":6},
    {"x":"Mentoring","y":7},
    {"x":"Communication","y":8}
  ] }] }
```

### 2. Three-item comparison (3 polygons overlaid)

```chart:radar@1
{ "title": "Database benchmark — three engines",
  "series": [
    { "label": "Postgres", "data": [
      {"x":"Read","y":8},{"x":"Write","y":6},{"x":"Schema","y":9},
      {"x":"JSON","y":7},{"x":"Replication","y":7}] },
    { "label": "MongoDB",  "data": [
      {"x":"Read","y":7},{"x":"Write","y":8},{"x":"Schema","y":3},
      {"x":"JSON","y":9},{"x":"Replication","y":8}] },
    { "label": "Cassandra","data": [
      {"x":"Read","y":6},{"x":"Write","y":9},{"x":"Schema","y":4},
      {"x":"JSON","y":5},{"x":"Replication","y":9}] }
  ] }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
  <!-- Concentric grid rings at 25/50/75/100% of max radius. -->
  <g class="ve-chart-radar-grid">
    <polygon class="ve-chart-radar-ring" points="…" fill="none"/>
    …
  </g>
  <!-- Spokes from center to each axis label position. -->
  <g class="ve-chart-radar-spokes">
    <line class="ve-chart-radar-spoke" x1="cx" y1="cy" x2="…" y2="…"/>
    …
  </g>
  <!-- Per series: ONE polygon with semi-transparent fill + stroke. -->
  <polygon class="ve-chart-radar-area"
           points="…"
           fill="(palette[i])" fill-opacity="0.18"
           stroke="(palette[i])"/>
  …
  <!-- Vertex circles (the atoms). -->
  <g class="ve-chart-radar-vertices">
    <circle class="ve-chart-point" cx="…" cy="…" r="4" fill="(color)"
            data-ve-id="ve-chart-N-d0-i0"
            data-ve-type="chart-point" …>
      <title>v1 · Speed: 7</title>
    </circle>
    …
  </g>
  <!-- Axis labels just outside the outermost ring. -->
  <g class="ve-chart-radar-labels">
    <text class="ve-chart-axis-label" x="…" y="…" text-anchor="(start|middle|end)">
      Speed
    </text>
    …
  </g>
</svg>
```

The viewBox is square (`400 × 400`) — radar is a circular form. Spokes
fan out from the center to evenly-spaced angles (360° / nAxes between
spokes).

## Lib functions called

`renderSvgRadar(spec, _type, fig)`:

- Axes derived from `series[0].data[*].x`. Axis count = `nAxes`.
- `axisAngle(k)` = `-90 + k * (360 / nAxes)` (axis 0 at the top).
- Concentric rings at 25/50/75/100% radius via `polarToCartesian` per axis-angle.
- Spokes from `(cx, cy)` to each axis-angle endpoint.
- Per series:
  - Compute vertex `(x, y)` for each axis-angle using the datum's y normalized to max.
  - Append `<polygon class="ve-chart-radar-area" points="…" fill="(color)" fill-opacity="0.18" stroke="(color)">`.
  - Append per-vertex `<circle class="ve-chart-point">` and `markPoint(circle, …)`.
- Axis labels outside the outermost ring (positioned via `polarToCartesian(cx, cy, rMax + 22, axisAngle)`); text-anchor picks `start` / `middle` / `end` based on the label's x position relative to the center.
- Inflate entry animation: polygon points scale `0 → 1` from the center via RAF + cubic ease-out, staggered between series.

## DESIGN.md tokens

Same as `bar` plus:

| Token | Used for |
|---|---|
| `--vc-color-border` | Spokes + concentric ring stroke. |
| `--vc-color-content` | Axis label fill. |

Polygon fill colors come from `palette(series.length)` — golden-angle
distinct OKLCH; the semi-transparent overlay (18% fill-opacity) lets
overlapping polygons stay distinguishable.

## Selection / atoms

Each VERTEX circle is a `chart-point` atom (one per `{series, axis}` pair).
The polygon shape itself is decorative. Selecting a vertex lets the
reader comment on that criterion's value for that series.

## Anti-patterns

- **4+ polygons overlaid.** Becomes a tangle of translucent shapes. Limit to ≤ 3 series for radar; for more, use a `matrix` heatmap.
- **Mixing units across axes.** Each axis is normalised against the global `max(y)`. If "Speed" is on a 0-10 scale and "Cost" is in dollars, the cost axis dominates. Pre-normalise all axes to the SAME numeric scale (e.g. 0-10).
- **2 axes only.** Polygon collapses to a line — not informative. Use `bar` or `slope`.
- **Radar for ordinal data (categorical rankings).** Use `bar` with rank as y, or `bump` for rank-over-time. Radar implies a magnitude per axis.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: axis labels do not
collide with the outermost ring; polygon fill is light enough that
multiple overlaid polygons remain readable on both themes; the inflate
animation respects `prefers-reduced-motion`.
