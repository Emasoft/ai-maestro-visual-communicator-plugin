# `chart:mekko@1` — Marimekko (Mekko) chart

A 100%-stacked bar where each COLUMN's width is also proportional to a
variable (the column total). Two encodings at once: column width = total,
column-internal stack = breakdown. The classic McKinsey "market share by
revenue and product" chart.

## When to choose mekko

Use `mekko` when:

- You have a 2-variable matrix: for each category on the x-axis, both the TOTAL and a part-of-whole breakdown matter.
- The reader cares about BOTH "how big is this column?" AND "what's the mix inside it?".
- Examples: revenue by region × by product line, headcount by department × by tenure band, traffic by source × by device type.

Pick `stacked-bar` instead when COLUMN widths should all be the same
(only the internal breakdown matters).
Pick `treemap` (not registered) — actually, the closest registered analog
is `heatmap` for matrix data where columns and rows are both categorical
and the area shouldn't encode size.

## Authoring shape

```chart:mekko@1
{
  "title": "Revenue by region × product",
  "subtitle": "NA dominates; AMER's mix favors Pro",
  "series": [
    { "label": "Free", "data": [
      {"x":"NA","y":2400},{"x":"EU","y":1100},{"x":"APAC","y":680}] },
    { "label": "Pro",  "data": [
      {"x":"NA","y":3200},{"x":"EU","y":900},{"x":"APAC","y":420}] },
    { "label": "Team", "data": [
      {"x":"NA","y":480},{"x":"EU","y":210},{"x":"APAC","y":120}] }
  ]
}
```

- Each `series[i].label` is a tier/category (a stack-layer name).
- Each `data[k].x` is the column label (axis category, e.g. region).
- Each `data[k].y` is the value of THAT tier in THAT column.
- Column widths auto-compute from the column total = `Σ series[i].data[k].y`.
- Each column is then 100%-stacked internally (each segment's height = `series[i].data[k].y / colTotal`).

## Options

| Key | Default | Effect |
|---|---|---|
| _(none specific to mekko)_ | | |

## Examples

### 1. Market share matrix (revenue × business unit)

```chart:mekko@1
{ "title": "Q4 revenue by business unit and segment ($M)",
  "series": [
    { "label": "SMB",        "data": [
      {"x":"Cloud","y":12.4}, {"x":"DB","y":4.2}, {"x":"AI","y":2.1}] },
    { "label": "Mid-market", "data": [
      {"x":"Cloud","y":18.0}, {"x":"DB","y":8.4}, {"x":"AI","y":3.6}] },
    { "label": "Enterprise", "data": [
      {"x":"Cloud","y":24.8}, {"x":"DB","y":18.6}, {"x":"AI","y":1.8}] }
  ] }
```

### 2. Traffic source by device

```chart:mekko@1
{ "title": "Traffic by source × device (sessions)",
  "series": [
    { "label": "Desktop", "data": [
      {"x":"Organic","y":280},{"x":"Direct","y":140},{"x":"Social","y":42}] },
    { "label": "Mobile",  "data": [
      {"x":"Organic","y":420},{"x":"Direct","y":120},{"x":"Social","y":190}] },
    { "label": "Tablet",  "data": [
      {"x":"Organic","y":58},{"x":"Direct","y":24},{"x":"Social","y":16}] }
  ] }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
  <g class="ve-chart-mekko">
    <!-- For each column, for each segment: ONE <rect class="ve-chart-mekko-cell">. -->
    <rect class="ve-chart-mekko-cell"
          x="(running x)" y="(top of segment)"
          width="(column width)" height="(segment height)"
          fill="(palette[seriesIdx])"
          data-ve-id="ve-chart-N-d0-i0"
          data-ve-type="chart-point" …>
      <title>Free · NA: 2400</title>
    </rect>
    …
  </g>
  <g class="ve-chart-xlabels">
    <text class="ve-chart-axis-label" x="(column center)" y="(bottom)"
          text-anchor="middle">
      NA
    </text>
    …
  </g>
</svg>
```

Each `<rect>` (segment of a column) is a `chart-point` atom — readers can
click any cell and comment on "the X tier's share of the Y column".

## Lib functions called

`_renderMekko(spec, fig)`:

- Walk every column to compute its total = `Σ series[i].data[k].y` for that column index.
- `grandTotal = Σ column totals` (used to compute each column's width as a fraction of `plotW`).
- For each column:
  - `colW = (colTotal / grandTotal) * plotW`.
  - For each series in order:
    - `frac = (series[i].data[k].y || 0) / colTotal`.
    - `segH = frac * plotH`.
    - Append `<rect class="ve-chart-mekko-cell" x=cx y=segY width=colW height=segH fill=palette[i]>`.
    - `markPoint(cell, …)` for the atom contract.
- Append per-column x-label centered under the column.
- `_appendLegend(fig, seriesLabels, palette)` (always — mekko is multi-series by definition).

## DESIGN.md tokens

Same as `bar` plus:

| Token | Used for |
|---|---|
| `--vc-color-content` | x-label fill. |

Segment fills come from `palette(series.length)`.

## Selection / atoms

Each segment is a `chart-point` atom. Selecting "Pro · NA" gives the
reader a thread on that specific cell.

## Anti-patterns

- **One column.** A 1-column mekko is just a 100%-stacked bar — use that type.
- **Negative or zero values.** A zero column collapses to width zero; readers misinterpret it as "column not rendered". Filter zero columns out OR add them to the spec with a tiny placeholder (e.g. `y: 0.01`) and a subtitle clarifying.
- **8+ stack layers.** Color distinction fails past ~5. Collapse small tiers into "Other".
- **8+ columns.** Column-label crowding becomes severe at the chart's standard 640-unit width. Split into two charts.

## Mekko vs alternatives — the two-encoding test

Marimekko is the only built-in chart type that simultaneously encodes
TWO variables per dimension (column width + segment height). Alternatives
each drop one encoding:

| Chart | Column width | Segment height | Use when |
|---|---|---|---|
| `mekko` | Total per column | 100% stack | BOTH matter (revenue × product). |
| `stacked-bar` | Equal (per category) | Absolute or 100% stack | Only the breakdown matters; totals are equal or implied. |
| `bar` (grouped) | Equal | One bar per series | Cross-category per-series comparison. |
| `heatmap` | Equal | Equal (color encodes) | 2-D matrix, no proportions. |

If the column TOTAL is the headline (the column-width encoding earns its
keep), use `mekko`. If the totals are similar / irrelevant, `stacked-bar`
is cleaner.

## How to read a mekko chart

The visual encoding combines:

1. **Column WIDTH** = the column's total contribution to the grand total. A wide column dominates the page; a narrow one is small.
2. **Segment HEIGHT** (relative) = the segment's share of its column. Tall segments dominate within the column; short ones are minor parts.
3. **Segment AREA** (width × height) = the segment's absolute value as a fraction of the grand total. The single most-important visual signal: a wide-and-tall segment is the biggest absolute contributor.

The reader's eye is drawn first to the LARGEST AREA — which is exactly
the "biggest cell in the matrix" insight you want them to see first.

## Mekko design rule — sort by descending column total

While the renderer doesn't auto-sort, AUTHORS should sort columns by
descending column total. This places the BIGGEST column on the left,
where the eye lands first.

```js
// Pre-process: compute totals, sort series data, re-emit.
const totals = series[0].data.map((_, i) => {
  return series.reduce((s, ser) => s + (ser.data[i].y || 0), 0);
});
const order = Array.from({length: totals.length}, (_, i) => i)
  .sort((a, b) => totals[b] - totals[a]);
series.forEach(s => { s.data = order.map(i => s.data[i]); });
```

Or just author the data already sorted (when you compose the spec
manually).

## Mekko with negative segments

The renderer treats negative `y` as 0 (a negative segment has no
meaningful visual at 100% stack). For signed data per-cell, use
`heatmap` with `diverging: true` instead.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: column widths sum to
`plotW` exactly (no white gaps on the right); segment-color palette
distinct on both themes; column labels do not overlap; the LARGEST cell
(area-wise) is the visual focal point — verify by eye scan that the
"biggest area" matches the biggest absolute value.
