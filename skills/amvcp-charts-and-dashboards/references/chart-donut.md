# `chart:donut@1` — donut chart

## Table of Contents

- [When to choose donut](#when-to-choose-donut)
- [Authoring shape](#authoring-shape)
- [Options](#options)
- [Examples](#examples)
- [What the runtime emits](#what-the-runtime-emits)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens](#designmd-tokens)
- [Selection / atoms](#selection--atoms)
- [Anti-patterns](#anti-patterns)
- [Donut vs alternatives](#donut-vs-alternatives)
- [Center text customisation](#center-text-customisation)
- [Inner radius — why a hole](#inner-radius--why-a-hole)
- [Slice order](#slice-order)
- [Visual verification](#visual-verification)

The SANCTIONED circular form for parts-of-a-whole — never `pie` (pie is
banned; see `chart-pie-guardrail.md`). The center hole gives the chart a
focal point (the TOTAL prints inside it) and removes the false-precision
pie-chart problem of trying to compare slice areas.

## When to choose donut

Use `donut` when:

- You have a parts-of-a-whole breakdown (3-6 slices typical, max 8).
- Circular geometry suits the visual context (a brand identity, an executive
  dashboard, an "ecosystem overview").
- The TOTAL number is meaningful and should be visually anchored (the center
  text shows it).

Pick `segmented-bar` when the breakdown is inline / part of dense layout
(donut is visually heavy).
Pick `bar` (sorted) when readers must compare slice values precisely (donut
slices are notoriously hard to compare visually past ~4 segments).
Pick `mekko` when you have multiple side-by-side parts-of-a-whole columns.

## Authoring shape

```chart:donut@1
{
  "title": "Traffic by source — last 30 days",
  "subtitle": "Organic dominates; social still nascent",
  "series": [{ "label": "source", "data": [
    {"x":"Organic","y":48},
    {"x":"Direct","y":22},
    {"x":"Referral","y":18},
    {"x":"Social","y":12}
  ] }]
}
```

- Each `data[k].x` is the slice label (printed in the legend).
- Each `data[k].y` is the slice magnitude. The runtime sums every y to compute the total.
- Slice order in the spec = paint order (clockwise from the 12 o'clock position).

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | n/a | Not used (slices are too crowded for labels; values live in the tooltip + the legend). |

## Examples

### 1. Budget split

```chart:donut@1
{ "title": "FY25 OpEx by category",
  "series": [{ "label": "%", "data": [
    {"x":"Payroll","y":48},
    {"x":"Infra","y":18},
    {"x":"Tooling","y":12},
    {"x":"Travel","y":8},
    {"x":"Office","y":6},
    {"x":"Other","y":8}
  ] }] }
```

### 2. Backlog status (3-slice donut)

```chart:donut@1
{ "title": "Sprint 42 — story status",
  "series": [{ "label": "stories", "data": [
    {"x":"Done","y":18},
    {"x":"In flight","y":7},
    {"x":"To do","y":4}
  ] }] }
```

## What the runtime emits

```html
<figure class="ve-chart" data-ve-chart-type="donut" data-ve-chart-backend="svg" …>
  <figcaption class="ve-chart-title">…</figcaption>
  <svg class="ve-chart-svg" viewBox="0 0 360 360" preserveAspectRatio="xMidYMid meet">
    <g class="ve-chart-donut">
      <!-- ONE <path class="ve-chart-arc"> per slice. -->
      <path class="ve-chart-arc"
            d="M … A … A … Z"
            fill="(palette[i])"
            data-ve-id="ve-chart-N-d0-i0"
            data-ve-type="chart-point" …>
        <title>Organic: 48 (48%)</title>
      </path>
      …
    </g>
    <!-- Center text: the TOTAL (formatted via fmtNum). -->
    <text class="ve-chart-donut-center" x="180" y="186" text-anchor="middle">
      100
    </text>
  </svg>
  <ul class="ve-chart-legend">…</ul>
</figure>
```

The donut viewBox is 360×360 (a square — see `VB_DONUT` in the renderer).
The inner radius is `rOuter * 0.62` — a true hole, never zero (a zero-hole
would be a pie chart, which is banned).

## Lib functions called

`_renderDonut(spec, fig)`:

- `total = Σ y` (default 1).
- `palette(data.length)` for slice colors.
- For each slice, compute `sweep = (v / total) * 360`, append `<path class="ve-chart-arc" d=describeArc(cx, cy, rOuter, rInner, a0, a1)>`.
- `describeArc(cx, cy, rOuter, rInner, a0, a1)` — the annular wedge helper. Returns a path that traces the outer arc, then the inner arc reversed, then closes.
- Center text: `<text class="ve-chart-donut-center" x=cx y=cy+6 text-anchor="middle">` with the formatted total.
- Legend via `_appendLegend(fig, sliceLabels, colors)`.
- `animateOnView` — on first view, animate each arc's end angle from `a0` to `a1` via `requestAnimationFrame`. Stagger between slices via `local = (eased - stagger*0.3) / (1 - stagger*0.3)`. Skipped under `prefers-reduced-motion: reduce`.

The `describeArc` helper is the donut/gauge primitive:

```js
function describeArc(cx, cy, rOuter, rInner, a0, a1) {
  if (a1 - a0 >= 359.999) { a1 = a0 + 359.999; }  // never a full 360 (cusp)
  // Trace outer arc from a1 to a0, then inner arc from a0 to a1.
  // For rInner=0 (NOT used for donut — that would be a pie),
  // closes via L cx cy Z instead of inner arc.
}
```

## DESIGN.md tokens

Same envelope as `bar`. Specific to donut:

| Token | Used for |
|---|---|
| `--vc-color-accent` | First slice fill (single-series fallback). |
| `--vc-color-content` | Center text fill. |
| `--vc-font-heading` | Center text font family. |
| `--vc-text-4` | Center text size. |
| `--vc-weight-bold` | Center text weight. |

Slice fills come from `palette(data.length)` — golden-angle distinct OKLCH
on top of `--vc-color-accent`.

## Selection / atoms

Each `<path class="ve-chart-arc">` is a `chart-point` atom. Selecting a
slice paints it brighter with a 2-px accent stroke; the figure gets the
outer ring. The slice's atom payload includes the raw `y` AND the slice
label.

## Anti-patterns

- **Authoring a `pie` chart.** The runtime remaps `pie` to a sorted `bar`. Use `donut` for circular geometry, `segmented-bar` for inline part-to-whole.
- **More than 8 slices.** Small slices become unreadable; consider collapsing into "Other" or using `bar`.
- **Slice values that don't sum to a meaningful total.** Donut implies parts-of-a-whole; if your values are independent magnitudes (revenues from 6 unrelated lines of business), the "total" in the center text is at best informational and at worst misleading. Use `bar`.
- **Donut with one slice (100%).** The runtime guards against a single-slice that wraps the full 360° (it caps at `a1 = a0 + 359.999`), but a 100% donut is a circle — uninformative. Use a `metric-cards` tile.

## Donut vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Parts-of-a-whole, circular geometry desired | `donut` | Center text = total focal point; no pie's perceptual issues. |
| Parts-of-a-whole, inline | `segmented-bar` | Cheaper visually; fits inside cards / list items. |
| Parts-of-a-whole, precise comparison | `bar` (sorted) | Bar lengths compare exactly; donut arcs do not. |
| Multiple parts-of-a-whole side by side | `mekko` | Two-axis encoding (column width + 100% stack). |

The donut is the SANCTIONED circular form (pie is banned — see
`chart-pie-guardrail.md`). The center text serves as the focal point —
the reader's eye lands on the TOTAL number first, then explores the
slice breakdown.

## Center text customisation

The default center text is `fmtNum(total)` — the formatted total of all
slice values. To override the displayed text (e.g. show "100%" instead
of "100" for percentage data, or a unit like "$2.4M"):

```js
amvcpChart.scan(document);
document.querySelectorAll('figure[data-ve-chart-type="donut"]').forEach((fig) => {
  const center = fig.querySelector('.ve-chart-donut-center');
  if (center) center.textContent = '$2.4M';
});
```

For per-slice center text (hover changes the center to that slice's
value), wire a mouseover listener:

```js
fig.addEventListener('mouseover', (ev) => {
  const arc = ev.target.closest('.ve-chart-arc');
  if (arc && arc.__veChartPayload) {
    center.textContent = fmtNum(arc.__veChartPayload.data.value);
  }
});
fig.addEventListener('mouseleave', () => {
  center.textContent = fmtNum(originalTotal);
});
```

(The renderer doesn't ship this behavior because it's optional — most
donuts work fine with a static total in the center.)

## Inner radius — why a hole

The inner radius is hardcoded as `rOuter * 0.62` — a true hole, never
zero. The reasons:

- A zero-hole donut IS a pie chart (banned).
- The hole provides the focal point for the center text.
- The hole REDUCES the visual ink — readers focus on the ring (where
  the slices are visually distinct) rather than on the wedge tips
  (where slices converge confusingly).

You cannot adjust the inner radius from the spec; it's hardcoded.

## Slice order

The slices paint in `spec.data` ORDER, starting from the 12 o'clock
position (top) and going clockwise. Convention: sort descending so the
biggest slice starts at the top. The reader's eye lands on the biggest
slice first.

```chart:donut@1
{ "title": "Spending by category",
  "series": [{ "label": "$", "data": [
    {"x":"Rent","y":1800},      // sorted descending
    {"x":"Food","y":640},
    {"x":"Transport","y":280},
    {"x":"Other","y":160}
  ] }] }
```

The runtime doesn't auto-sort; the AUTHOR sorts.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: center text legible on
both themes, the entry sweep animation respects `prefers-reduced-motion`,
slice gaps are absent (no white seams between slices), slice colors are
visually distinct, inner radius is non-zero (a true donut, not a pie),
biggest slice starts at 12 o'clock (verify by sorting the data
descending).
