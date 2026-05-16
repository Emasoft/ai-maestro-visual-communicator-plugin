# `chart:stacked-bar@1` — stacked bar

A vertical stacked bar where each category is decomposed into named parts.
Each series contributes one stack layer; series order in the spec is the
paint order (first = bottom).

## When to choose stacked-bar

Use `stacked-bar` when:

- Each category decomposes into a small set of NAMED parts (≤ 5 typical).
- The parts share the SAME unit (headcount, revenue, GB, percent — never mix).
- The reader needs to see BOTH the total per category AND the part breakdown.
- The category count is small (≤ 12) — readers can no longer match colors to legend slots past that.

Pick `mekko` (Marimekko) instead when the COLUMN widths should also encode a
variable (column total ≠ row counts). Pick `bar` (grouped) when readers
need to compare absolute part values across categories rather than the
stack's total.

## Authoring shape

```chart:stacked-bar@1
{
  "title": "Headcount by team",
  "subtitle": "Engineering doubled in 3 quarters",
  "series": [
    { "label": "Engineering", "data": [
      {"x":"Q1","y":12},{"x":"Q2","y":15},{"x":"Q3","y":18}] },
    { "label": "Design", "data": [
      {"x":"Q1","y":4},{"x":"Q2","y":5},{"x":"Q3","y":6}] },
    { "label": "Product", "data": [
      {"x":"Q1","y":3},{"x":"Q2","y":4},{"x":"Q3","y":5}] }
  ]
}
```

- `series[i].label` — REQUIRED for stacks (legend is mandatory; a stacked bar without a legend is unreadable).
- `series[0]` paints at the BOTTOM of each stack; the array order is the paint order.
- Each series' `data` must cover the same x categories in the same order. A missing index is treated as `0` for that stack contribution.

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | `false` | **Ignored** for stacked-bar (would overlap with stack divisions). Use a tooltip for per-segment values; the reader hovers/clicks. |
| `sortDescending` | `false` | **Ignored** for stacked-bar (sort by which stack? — ambiguous). |

The y-axis domain is auto-computed as the maximum per-category SUM (not the
maximum per-series y). The 4-tick `niceTicks` runs on `[0, sumMax]`.

## Example — 100% stacked bar (manual normalisation)

The runtime does NOT auto-normalise to 100%. If you want a 100%-stacked bar,
normalise the values in the spec yourself:

```chart:stacked-bar@1
{ "title": "Traffic source mix — quarterly",
  "series": [
    { "label": "Organic", "data": [
      {"x":"Q1","y":48},{"x":"Q2","y":52},{"x":"Q3","y":55}] },
    { "label": "Direct", "data": [
      {"x":"Q1","y":22},{"x":"Q2","y":20},{"x":"Q3","y":18}] },
    { "label": "Referral", "data": [
      {"x":"Q1","y":18},{"x":"Q2","y":15},{"x":"Q3","y":14}] },
    { "label": "Social", "data": [
      {"x":"Q1","y":12},{"x":"Q2","y":13},{"x":"Q3","y":13}] }
  ]
}
```

When the columns already sum to 100 the y-axis tops out at 100 cleanly and
the chart reads as a 100% breakdown without any normalisation flag.

## What the runtime emits

Identical envelope to `bar` (see `chart-bar.md`). The only structural
difference: each stack is a vertical pile of `<rect class="ve-chart-bar">`
elements at the same x position, each painted with the series' palette
color. Bar corner radius applies to every segment — slightly more visual
ink than a single rounded bar, but the rounded internal divisions are how
the eye separates the layers without dependence on color contrast.

## Lib functions called

`renderSvgBar(spec, 'stacked-bar', fig)` — the same renderer as `bar`,
branching on `isStacked = true`:

- The y-domain is computed per-category SUM (not per-series max).
- Each datum's `y` accumulates into `stackAccum`; the next segment's `y`-pixel is `yScale(stackAccum)` to `yScale(stackAccum + val)`.
- `valueLabels` is dropped (overlap risk).

Helpers: `palette`, `niceTicks`, `scale`, `_drawGrid`, `markPoint`,
`_wireMarks`, `animateOnView`, `_appendLegend` (always called — multi-series
is mandatory for a stack).

## Selection / atoms

Each stack segment is its own `chart-point` atom. Selecting `Eng·Q3`
selects just the bottom slice of Q3's stack; the figure outer ring + group
comment-handle still mount around the whole figure.

## DESIGN.md tokens

Same as `bar` (see `chart-bar.md` § DESIGN.md tokens used). Multi-series
fills come from `palette(seriesCount)` so the colors are golden-angle
distinct on top of `--vc-color-accent`.

## Stacked-bar variants

The stacked-bar renderer supports 4 distinct sub-patterns by simply
authoring the data differently. Pick the one that matches the story:

### Variant A — Absolute totals (default)

```chart:stacked-bar@1
{ "title": "Headcount by team",
  "series": [
    { "label": "Eng", "data": [
      {"x":"Q1","y":12},{"x":"Q2","y":15},{"x":"Q3","y":18}] },
    { "label": "Design", "data": [
      {"x":"Q1","y":4},{"x":"Q2","y":5},{"x":"Q3","y":6}] }
  ] }
```

Heights are absolute; y-axis tops at the max stack sum. Useful when the
TOTAL per category is the headline number and the parts are
supplementary.

### Variant B — Pre-normalised 100% stack

Already shown in the examples above. The chart still uses the same
spec; the AUTHOR pre-normalises the values so each stack sums to 100.
Useful for percentage-mix narratives ("the channel mix is shifting").

### Variant C — Time series with steady total

Stacked bars over time positions naturally show "the total grew AND
the mix shifted":

```chart:stacked-bar@1
{ "title": "Monthly revenue by tier ($M)",
  "series": [
    { "label": "Free",       "data": [
      {"x":"M1","y":0},{"x":"M2","y":0},{"x":"M3","y":0},
      {"x":"M4","y":0},{"x":"M5","y":0},{"x":"M6","y":0}] },
    { "label": "Pro",        "data": [
      {"x":"M1","y":1.2},{"x":"M2","y":1.4},{"x":"M3","y":1.6},
      {"x":"M4","y":1.8},{"x":"M5","y":2.0},{"x":"M6","y":2.2}] },
    { "label": "Team",       "data": [
      {"x":"M1","y":0.8},{"x":"M2","y":1.1},{"x":"M3","y":1.4},
      {"x":"M4","y":1.7},{"x":"M5","y":2.1},{"x":"M6","y":2.6}] },
    { "label": "Enterprise", "data": [
      {"x":"M1","y":0.4},{"x":"M2","y":0.7},{"x":"M3","y":1.1},
      {"x":"M4","y":1.6},{"x":"M5","y":2.3},{"x":"M6","y":3.2}] }
  ] }
```

Note Free is `y: 0` across all months (Free tier doesn't contribute
revenue) — the segment is invisible but the legend entry stays. The
chart visually emphasises Enterprise growing across the bottom of
the stack while Pro stays steady.

### Variant D — Negative + positive parts

The renderer treats negative values as 0 in stacked mode (a negative
stack segment has no meaningful visual). For genuinely-signed data,
use `diverging-bar` (single series) instead of stacked.

## Anti-patterns

- **Stacking percentage parts that don't sum cleanly.** If `Q1` columns sum to 99.7 and `Q2` to 100.4, the readers see uneven stack tops and assume the chart is buggy. Normalise before authoring.
- **Stacking 8+ layers.** The eye loses color distinction past about 5 layers. Collapse small parts into an "Other" series, or switch to a sortable `bar` chart with categories ordered by total.
- **Authoring a `bar` chart then asking for stacking via CSS.** Use the correct type; the spec is the contract. CSS hacks bypass the validation and the legend logic.
- **Setting `valueLabels: true` on a stacked-bar.** Silently ignored — there is no clean place to put a value label inside a stack segment without overlap.
- **Stacking series with mismatched x categories.** If `series[0]` has `[Q1,Q2,Q3]` and `series[1]` has `[Q1,Q2,Q4]`, the chart still renders but the Q3/Q4 columns have only one stack layer — visually broken. Align categories.
- **Using stacked-bar for non-additive metrics.** Stacking implies addition (the total IS meaningful). Stacking p50/p95/p99 latency makes no semantic sense — p95 doesn't "add to" p50. Use multi-series `line` for non-additive metrics over time.

## How to read the stacked-bar visually

When reading a stacked-bar chart, the visual encoding has three layers:

1. **TOTAL HEIGHT** = the category's overall value. Compare bar tops to compare totals.
2. **SEGMENT HEIGHT** = the part's value within that category. Compare segment heights ACROSS bars to compare per-tier values.
3. **SEGMENT POSITION** = the part's relative position. The BOTTOM segment is always paint order 0 (the first series); the TOP segment is the last series.

Bottom-segment comparison across bars is the EASIEST (all bottoms share
a baseline). Mid-segment comparison is the HARDEST (each mid-segment
floats on a different sub-stack). Author with the most important
series at the BOTTOM so the reader can compare it easily.

## Visual verification

Run `skills/amvcp-self-debug-rules/SKILL.md` to verify light + dark theme
rendering, legend presence, comment-handle on multi-segment selection,
stack segments aligned with no white gaps between segments.
