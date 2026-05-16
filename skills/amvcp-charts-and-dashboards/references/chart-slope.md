# `chart:slope@1` — slope chart

A McKinsey-style two-point line chart where each series is a diagonal from
the left edge to the right edge of the plot. Labels print at the right
endpoint of each series. The geometry IS the story — series whose lines
slope up improved, series whose lines slope down regressed, series whose
lines stay flat were unchanged.

## When to choose slope

Use `slope` when:

- You have EXACTLY TWO x positions shared across all series (before/after, plan/actual, t0/t1, control/variant).
- Many series (10-50) need before/after comparison; slope is the densest legible form for this.
- The reader cares about WHICH series moved in WHICH DIRECTION more than the absolute values.

Pick `connected-dot-plot` instead when you have many categories with ONE
series of pairs (categories on the x-axis, before/after pairs at each
category) — slope inverts this: categories ARE the series, x is just
before/after.

Pick `bar` (grouped 2-series) when there are few series (< 5) and absolute
values matter more than direction.

## Authoring shape

```chart:slope@1
{
  "title": "Cohort retention shift — D7 → D28",
  "subtitle": "Power users +14pts; trial users -22pts",
  "series": [
    { "label": "Power users", "data": [
      {"x":"D7","y":68}, {"x":"D28","y":82}] },
    { "label": "Regular users", "data": [
      {"x":"D7","y":42}, {"x":"D28","y":38}] },
    { "label": "Trial users", "data": [
      {"x":"D7","y":54}, {"x":"D28","y":32}] }
  ]
}
```

- Each `series[i].data` has EXACTLY 2 entries.
- The `x` values for `data[0]` and `data[1]` are the same across every series ("D7", "D28") — they label the chart's two ends.
- Each `series[i].label` prints at the right endpoint of that series's line.

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | n/a | Not used. The right-endpoint label INCLUDES the series name; the value is in the tooltip / atom payload. |
| `sortDescending` | n/a | Slopes are positioned by their right-endpoint y. Sorting the spec doesn't change paint order. |

## Examples

### 1. Before/after a process change (large series count)

```chart:slope@1
{ "title": "Department headcount shift — Q1 → Q4",
  "series": [
    { "label": "Eng",          "data": [{"x":"Q1","y":48},{"x":"Q4","y":62}] },
    { "label": "Sales",        "data": [{"x":"Q1","y":32},{"x":"Q4","y":40}] },
    { "label": "Design",       "data": [{"x":"Q1","y":12},{"x":"Q4","y":14}] },
    { "label": "Product",      "data": [{"x":"Q1","y":8},{"x":"Q4","y":10}] },
    { "label": "Marketing",    "data": [{"x":"Q1","y":18},{"x":"Q4","y":22}] },
    { "label": "Customer Ops", "data": [{"x":"Q1","y":24},{"x":"Q4","y":28}] }
  ] }
```

### 2. Two-state comparison (control vs treatment)

```chart:slope@1
{ "title": "Conversion: control vs variant",
  "series": [
    { "label": "Control", "data": [
      {"x":"Before","y":3.2}, {"x":"After","y":3.4}] },
    { "label": "Variant", "data": [
      {"x":"Before","y":3.1}, {"x":"After","y":4.8}] }
  ] }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" …>
  <g class="ve-chart-gridlines">…</g>
  <!-- LEFT label position: x0 + plotW * 0.12 -->
  <!-- RIGHT label position: x1 - plotW * 0.12 -->
  <!-- Each series renders ONE straight path: -->
  <path class="ve-chart-line"
        d="M (leftX) (leftY) L (rightX) (rightY)"
        fill="none" stroke="(palette[i])"/>
  <g class="ve-chart-points">
    <circle class="ve-chart-point" cx="(leftX)"  cy="(leftY)"  r="4" …/>
    <circle class="ve-chart-point" cx="(rightX)" cy="(rightY)" r="4" …/>
  </g>
  <g class="ve-chart-line-labels">
    <text class="ve-chart-series-label"
          x="(rightX + 8)" y="(rightY + 4)" text-anchor="start">
      Power users
    </text>
    …
  </g>
</svg>
```

Note that the x-axis labels under the chart are SUPPRESSED for slope (the
"D7" and "D28" labels would live there normally — but for slope, the visual
already shows two endpoints; printing labels at both axis ends would
duplicate the series label). The `<g class="ve-chart-xlabels">` group is
skipped.

## Lib functions called

`renderSvgLine(spec, 'slope', fig)` — branches on `isSlope`:

- `xScale(idx)` is OVERRIDDEN to put `idx=0` at `x0 + plotW * 0.12` and `idx=1` at `x1 - plotW * 0.12` (inset from both edges to leave room for labels).
- Each series's path is `M leftX leftY L rightX rightY` (straight line, no Catmull-Rom).
- Right-endpoint label appended via `<text class="ve-chart-series-label" x=endP.x+8 y=endP.y+4 text-anchor="start">…</text>`.
- The standard x-axis label `<g>` is NOT appended.
- The legend is NOT appended (the right-endpoint labels ARE the legend).

## DESIGN.md tokens

Same as `line` plus the series-label color from
`--vc-color-content` (printed at the right endpoint of each line).

## Selection / atoms

Each ENDPOINT circle is a `chart-point` atom — 2 atoms per series. The line
segment between them is decorative. Selecting both endpoints of one series
gives the reader a comment thread on "the X series's before/after shift".

## Anti-patterns

- **More than 2 data points per series.** The renderer uses `linePath` for slope (a straight line through every point), so 3+ points render as a zig-zag — meaningless. Use `line` instead.
- **Different x values across series.** Each series's `data[0].x` and `data[1].x` should match across series; otherwise the right-edge label cluster becomes confusing. ("D7" and "Before" mixed isn't a chart.)
- **15+ series.** Right-edge labels start overlapping. Either reduce series count (collapse small movers into "Other") or break into two side-by-side slope charts.
- **Slope chart with very small y deltas.** Lines all look near-horizontal; the chart visually says "nothing changed", even though absolute values differ. Add a subtitle calling out the deltas.

## Slope vs alternatives — comparison

| Story | Best chart | Why |
|---|---|---|
| 10-50 series, before/after | `slope` | Edge-to-edge lines pack densely; labels at right edge. |
| Many CATEGORIES, single before/after pair per category | `connected-dot-plot` | Categories on x-axis; pair per category. |
| 2-5 series, before/after with magnitude weight | `bar` (grouped 2-series) | Bar length emphasises absolute values. |
| Continuous trend over time | `line` | Slope assumes ONLY 2 x positions. |

The slope chart's strength is RANK INVERSION readability — when two
series CROSS (one was higher in "Before", the other in "After"), the
visual immediately shows it. Few alternatives convey rank inversions as
crisply.

## Rank inversion visual

```
Before                      After
  ↑                            ↑
  | ●────● Power users        |
  | ●────● Regular users      |
  | ●────● Trial users        |
  |                            |
  v                            v
```

If "Power users" went UP and "Trial users" went DOWN such that they
cross, the crossing point is the visual signal — readers immediately
see "these two swapped position". Bar charts can't show this; line
charts can but with extra visual chrome.

## Slope chart layout — the inset

The renderer insets the two endpoints from the plot edges:
- Left endpoint: `x0 + plotW * 0.12`
- Right endpoint: `x1 - plotW * 0.12`

This leaves room for the right-endpoint labels (`text-anchor: start`,
positioned just to the right of the endpoint). Without the inset,
labels would clip the plot edge.

To override (e.g. for narrower right-side label space), there's no spec
option — the inset is hardcoded. For LONG series labels, abbreviate them
or wrap the chart in a wider container.

## Color encoding strategies

The default palette uses `palette(series.length)` — golden-angle OKLCH
distinct. For an "up = good, down = bad" emphasis, you'd want positive-
slope lines in success and negative-slope in danger. The renderer does
NOT support this per-spec; you'd need to post-process:

```js
amvcpChart.scan(document);
document.querySelectorAll('figure[data-ve-chart-type="slope"]').forEach((fig) => {
  // Per-line: read its endpoint y values, color based on direction.
  fig.querySelectorAll('.ve-chart-line').forEach((line) => {
    const d = line.getAttribute('d');
    // d looks like "M 88 280 L 552 200" — leftY < rightY means line drops downward (visually) which means value rose.
    const m = d.match(/M\s+([\d.]+)\s+([\d.]+)\s+L\s+([\d.]+)\s+([\d.]+)/);
    if (m) {
      const leftY = parseFloat(m[2]);
      const rightY = parseFloat(m[4]);
      // SVG y is inverted — smaller y = higher on screen = higher value.
      const directionUp = rightY < leftY;
      line.style.stroke = directionUp
        ? 'var(--vc-color-success)'
        : 'var(--vc-color-danger)';
    }
  });
});
```

This is a manual post-process — recommend only when the visual emphasis
matters more than the default palette distinctness.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: right-endpoint labels
do not overlap; the line strokes are distinct via palette on both themes;
endpoint circles render on top of the line stroke; line crossings (rank
inversions) are visually clear; x-axis labels are SUPPRESSED (the slope
chart skips the per-tick x-label group).
