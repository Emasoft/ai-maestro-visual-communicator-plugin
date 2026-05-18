# `chart:area@1` — area chart

## Table of Contents

- [When to choose area](#when-to-choose-area)
- [Authoring shape](#authoring-shape)
- [Options](#options)
- [Examples](#examples)
- [What the runtime emits](#what-the-runtime-emits)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens](#designmd-tokens)
- [Selection / atoms](#selection--atoms)
- [Anti-patterns](#anti-patterns)
- [Area vs alternatives](#area-vs-alternatives)
- [Gradient details](#gradient-details)
- [The closed-path math](#the-closed-path-math)
- [Multi-series area pitfalls](#multi-series-area-pitfalls)
- [Visual verification](#visual-verification)

A line chart whose path closes back to the baseline and fills with an OKLCH
linear gradient (full-opacity accent at top, transparent at baseline). The
magnitude UNDER the curve is emphasised, not just the curve shape.

## When to choose area

Use `area` when:

- The reader needs to perceive MAGNITUDE alongside trend (a "how much" question, not just a "going up?" question).
- The metric is a non-negative cumulative quantity (DAU, revenue, cumulative downloads, traffic volume).
- Visual weight matters — the filled area gives the chart more presence than a bare line.

Pick `line` instead when readers only need the trend shape and visual ink
should be minimal.
Pick `step-area` instead when the value JUMPS discretely between points.
Pick `stacked-bar` (over time) instead when each x position decomposes into
named parts and the parts matter as much as the total.

The renderer does NOT support stacked areas (multiple filled regions
overlaid would create unreadable color soup). For stacked time series, use
`stacked-bar` with x = time bucket.

## Authoring shape

```chart:area@1
{
  "title": "Daily active users",
  "subtitle": "DAU more than doubled across 5 weeks",
  "series": [{ "label": "DAU", "data": [
    {"x":"W1","y":1200},
    {"x":"W2","y":1850},
    {"x":"W3","y":1640},
    {"x":"W4","y":2310},
    {"x":"W5","y":2680}
  ] }]
}
```

Same shape as `line`. The renderer adds:

1. A `<defs><linearGradient id="…-fill">` with two stops: 22% opacity at top, 0% at bottom.
2. A `<path class="ve-chart-area">` closed back to the baseline, filled with `url(#…-fill)`.
3. The `<path class="ve-chart-line">` on top of the area.
4. The `<circle class="ve-chart-point">` atoms on top of the line.

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | n/a | Not used (would clutter; tooltip serves). |
| `sortDescending` | n/a | Areas follow x-position order, not y-rank. |

## Examples

### 1. Cumulative downloads

```chart:area@1
{ "title": "Cumulative downloads — first 30 days",
  "series": [{ "label": "downloads", "data": [
    {"x":"D1","y":420},{"x":"D5","y":2840},
    {"x":"D10","y":7120},{"x":"D15","y":12480},
    {"x":"D20","y":18920},{"x":"D25","y":24180},
    {"x":"D30","y":29400}
  ] }] }
```

### 2. Multi-series area (overlaid, NOT stacked)

```chart:area@1
{ "title": "Cohort retention — D7 vs D28",
  "series": [
    { "label": "D7 cohort", "data": [
      {"x":"W1","y":92},{"x":"W2","y":78},{"x":"W3","y":68},
      {"x":"W4","y":62},{"x":"W5","y":58}] },
    { "label": "D28 cohort", "data": [
      {"x":"W1","y":88},{"x":"W2","y":72},{"x":"W3","y":58},
      {"x":"W4","y":48},{"x":"W5","y":42}] }
  ] }
```

When `series.length > 1`, the gradient fill applies to BOTH series.
Each area fills with the same `--vc-color-accent` gradient (the runtime
does not generate per-series gradients — a `linearGradient` definition
must be unique per chart). This means OVERLAPPING areas may look
muddied. For overlay clarity, prefer `line` for multi-series.

## What the runtime emits

```html
<svg class="ve-chart-svg" …>
  <defs>
    <linearGradient id="ve-chart-N-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="var(--vc-color-accent, #b8861f)" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="var(--vc-color-accent, #b8861f)" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g class="ve-chart-gridlines">…</g>
  <!-- area fill (closed path back to baseline). -->
  <path class="ve-chart-area"
        d="M… C… L… L… Z"
        fill="url(#ve-chart-N-fill)"/>
  <!-- the line (not closed). -->
  <path class="ve-chart-line" d="M… C…" fill="none" stroke="…"/>
  <g class="ve-chart-points">…</g>
</svg>
```

The area path closes via:

```
M x0 y0 C … x[n-1] y[n-1]  L x[n-1] yBase  L x0 yBase  Z
```

Same Catmull-Rom curve as the line, then two straight `L` lines down to
the baseline and back, then a `Z` to close.

## Lib functions called

Same as `chart-line.md` plus:

- `<defs><linearGradient>` is appended once per chart (idempotent — `defsAdded` flag prevents duplicates when multi-series).
- The area path is the line's `catmullRom(pts)` extended with `L pts[last].x yBase L pts[0].x yBase Z`.
- The fill `url(#ve-chart-N-fill)` resolves to the per-chart gradient ID.

## DESIGN.md tokens

Same as `line`. The gradient resolves `--vc-color-accent` at paint time, so
a theme swap re-themes the area fill with no re-render.

## Selection / atoms

Same as `line` — each `<circle class="ve-chart-point">` is the atom. The
area path itself is decorative (not selectable).

## Anti-patterns

- **Stacking multiple areas.** Not supported (would muddy colors). Use `stacked-bar` with time-bucket x for cumulative breakdowns.
- **Negative y values.** The area renderer assumes y ≥ 0 (it closes the path to `yBase` = the bottom of the plot area, not to `y=0`). For signed data, use `line` (no fill) or `diverging-bar` (categorical x).
- **Using area for short timeseries (< 4 points).** Catmull-Rom needs at least 4 points to look smooth; under that, the curve looks blocky. Use `bar`.
- **Using area in a small chart cell.** The visual weight of the fill overwhelms small canvases. Use `line` for ≤ 200-pixel-wide cells.

## Area vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Trend over time, magnitude matters | `area` | Filled area encodes BOTH trend and magnitude. |
| Trend over time, just the shape | `line` | Lower ink; cleaner. |
| Discrete-state holds over time | `step-area` | Step path matches the state-changes semantics. |
| Cumulative magnitude (running total) | `area` | The integral-under-the-curve visual reads as cumulative. |
| Stacked time-series breakdown | `stacked-bar` (with time x-axis) | Area-stacking would create color soup. |

The area chart's superpower is showing CUMULATIVE QUANTITY (the area
under the curve is meaningful). For pure trend visualization, `line` is
cheaper visually.

## Gradient details

The gradient is hardcoded as:

```
stops:
  0%   stop-color="var(--vc-color-accent)" stop-opacity="0.22"
  100% stop-color="var(--vc-color-accent)" stop-opacity="0"
```

- Top of the area = 22% opacity of the accent.
- Bottom of the area (baseline) = 0% (fully transparent).

The gradient is vertical (`x1=0 y1=0 x2=0 y2=1`), so the fade goes from
top to bottom. The 22% opacity is the visual sweet spot — bold enough
to read as filled, light enough not to overpower the line stroke.

## The closed-path math

The area path closes by appending two straight `L` segments + `Z`:

```
M x0 y0 C ... C ...           <-- the Catmull-Rom curve through every point
L x[n-1] yBase                 <-- straight down to the baseline at the last x
L x0 yBase                     <-- straight along the baseline back to x0
Z                              <-- close the path
```

This generates a filled region between the curve and the baseline. The
fill rule defaults to `nonzero` (which is the SVG default) — the
clockwise winding paints inside the closed region.

## Multi-series area pitfalls

The renderer supports `series.length > 1` but ALL areas share the SAME
gradient (`url(#ve-chart-N-fill)` resolves to the per-chart gradient
once, accent-anchored). Overlapping areas mix muddily.

For multi-series time visualization, prefer:
- `line` (multi-series) — distinct strokes per series, no overlap mess.
- `stacked-bar` (with time x-axis) — distinct fills per layer.

If you MUST author multi-series `area`, set the SECOND series's
opacity even lower so it doesn't visually compete with the first:

```js
amvcpChart.scan(document);
document.querySelectorAll('figure[data-ve-chart-type="area"] .ve-chart-area')
  .forEach((path, i) => {
    if (i > 0) path.style.opacity = '0.5';
  });
```

But this is a smell — usually `line` or `stacked-bar` is the right
type.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: gradient fades cleanly
to transparent at the baseline (no abrupt cutoff); line + area combo is
still legible on the dark theme (where the surface is dark and the
gradient transitions through accent-on-dark); draw-on entry animation
respects `prefers-reduced-motion`; the area path closes correctly (no
visible gap between the line end and the baseline return).
