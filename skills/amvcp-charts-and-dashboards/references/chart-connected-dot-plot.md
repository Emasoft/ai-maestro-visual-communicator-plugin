# `chart:connected-dot-plot@1` — connected dot plot

## Table of Contents

- [When to choose connected-dot-plot](#when-to-choose-connected-dot-plot)
- [Authoring shape](#authoring-shape)
- [Options](#options)
- [Examples](#examples)
- [What the runtime emits](#what-the-runtime-emits)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens](#designmd-tokens)
- [Selection / atoms](#selection--atoms)
- [Anti-patterns](#anti-patterns)
- [Connected-dot-plot vs alternatives](#connected-dot-plot-vs-alternatives)
- [Reading direction](#reading-direction)
- [Connector + value-label combo](#connector--value-label-combo)
- [Visual verification](#visual-verification)

Two dots per category joined by a dashed connector. The McKinsey "before /
after" visualization — far more legible than a grouped bar when the
narrative is "how did each item shift?".

## When to choose connected-dot-plot

Use `connected-dot-plot` when:

- You have EXACTLY TWO comparable values per category (before/after, plan/actual, group A vs group B).
- The reader cares about the DELTA DIRECTION more than the absolute values.
- The categories are many (10-30) — grouped bars at this density become unreadable.

Pick `slope` instead when there is a "before" period and an "after" period
shared across all categories — slope chart paints each category as one
diagonal line and is even sparser than connected-dot-plot.

Pick a regular `bar` (grouped) instead when readers must compare ABSOLUTE
values between A and B, not just direction.

## Authoring shape

```chart:connected-dot-plot@1
{
  "title": "Latency: before vs after the cache rewrite (ms)",
  "subtitle": "All endpoints improved; /checkout had the largest drop",
  "series": [
    { "label": "Before", "data": [
      {"x":"/login","y":120},
      {"x":"/search","y":340},
      {"x":"/profile","y":80},
      {"x":"/checkout","y":420},
      {"x":"/cart","y":150}
    ] },
    { "label": "After", "data": [
      {"x":"/login","y":80},
      {"x":"/search","y":190},
      {"x":"/profile","y":62},
      {"x":"/checkout","y":140},
      {"x":"/cart","y":95}
    ] }
  ]
}
```

- **EXACTLY 2 series** — the renderer pairs `series[0].data[k]` with `series[1].data[k]` for every category `k`. A third series is rendered but no connector is drawn.
- Series order = paint order. Convention: `series[0]` is "before" (the old / baseline value), `series[1]` is "after" (the new value).
- Both series must cover the same x categories in the same order. A missing index breaks the pair for that category.

## Options

| Key | Default | Effect |
|---|---|---|
| `sortDescending` | `false` | Ignored (sort by which series? ambiguous). |
| `valueLabels` | `false` | Ignored — dot already marks the value. |

## Examples

### 1. Before / after a performance fix

```chart:connected-dot-plot@1
{ "title": "Bundle size before vs after tree-shake (kB)",
  "series": [
    { "label": "Before", "data": [
      {"x":"core","y":420}, {"x":"ui","y":180},
      {"x":"data","y":280}, {"x":"util","y":140}] },
    { "label": "After", "data": [
      {"x":"core","y":210}, {"x":"ui","y":110},
      {"x":"data","y":170}, {"x":"util","y":90}] }
  ] }
```

### 2. Group A vs Group B (A/B test result)

```chart:connected-dot-plot@1
{ "title": "Conversion rate by funnel step (%)",
  "series": [
    { "label": "Control", "data": [
      {"x":"View","y":100}, {"x":"Add to cart","y":42},
      {"x":"Checkout","y":18}, {"x":"Pay","y":12}] },
    { "label": "Variant", "data": [
      {"x":"View","y":100}, {"x":"Add to cart","y":48},
      {"x":"Checkout","y":24}, {"x":"Pay","y":19}] }
  ] }
```

## What the runtime emits

For each category band:

```html
<g class="ve-chart-bars">
  <!-- Connector drawn FIRST (sits behind the dots). -->
  <line class="ve-chart-connector"
        x1="bandCenter" y1="(yScale(beforeVal))"
        x2="bandCenter" y2="(yScale(afterVal))"/>
  <!-- Series 0 dot (before). -->
  <circle class="ve-chart-bar ve-chart-dot" cx="…" cy="…" r="6"
          fill="(palette[0])" data-ve-id="ve-chart-N-d0-iI" …>
    <title>Before · /login: 120</title>
  </circle>
  <!-- Series 1 dot (after). -->
  <circle class="ve-chart-bar ve-chart-dot" cx="…" cy="…" r="6"
          fill="(palette[1])" data-ve-id="ve-chart-N-d1-iI" …>
    <title>After · /login: 80</title>
  </circle>
</g>
```

The connector is decorative — it does not receive selection / hover events.
Only the dots are atoms.

## Lib functions called

`renderSvgBar(spec, 'connected-dot-plot', fig)` — branches on
`isDot && type === 'connected-dot-plot' && series.length === 2`:

- For each category, after drawing the second series's dot, prepend a
  `<line class="ve-chart-connector">` from the first dot's center to the
  second dot's center (same x — connectors are vertical, not slanted).
- `gBars.insertBefore(...)` places the line behind the dots so the dots
  render on top.

## DESIGN.md tokens

Same as `bar`. The connector uses:

| Token | Used for |
|---|---|
| `--vc-color-border-strong` | Connector stroke. |

The connector is dashed via the CSS rule
`.ve-chart-connector { stroke-dasharray: 3 3; }` to differentiate it from
the solid baselines and gridlines.

## Selection / atoms

Each dot is a `chart-point` atom (the connector is decorative). Selecting
`Before · /checkout` and `After · /checkout` lets the reader open a comment
thread scoped to "the /checkout latency change" — the page's comment-modal
gets BOTH atoms in the selection list.

## Anti-patterns

- **Three or more series with connected-dot-plot.** The connector logic only fires when `series.length === 2`. A third series renders dots only — visually confusing.
- **Categories with mismatched x.** If `series[0]` lists `{x:"A"}` and `series[1]` lists `{x:"B"}` for the same index, the connector goes between them anyway — meaningless visual. Always align categories.
- **Using connected-dot-plot for a continuous time series.** Use `line` — readers expect interpolation along a continuous axis.

## Connected-dot-plot vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Many CATEGORIES, before/after per category | `connected-dot-plot` | Connector signals direction per category. |
| 10-50 SERIES, all share before/after positions | `slope` | Edge-to-edge slope; right-side labels. |
| Few categories, before/after, absolute matters | `bar` (grouped 2-series) | Bar length emphasises magnitude. |
| Multiple PAIRED comparisons over time | `line` (multi-series) | Smooth continuous tracking; not paired-discrete. |

The connected-dot-plot's superpower is making the DELTA DIRECTION
visible per category. The reader's eye runs along the connector and
sees "this category went up" or "went down" in one read.

## Reading direction

The CONVENTION (not enforced by the renderer): `series[0]` is BEFORE
(the OLD value), `series[1]` is AFTER (the NEW value). The connector
goes from before to after, so the visual reads as "this was here, now
it's here".

Color-wise, the default `palette(2)` assigns golden-angle distinct
colors. To emphasise direction:

- Pin `series[0]` to a MUTED color (e.g. `--vc-color-content-muted`).
- Pin `series[1]` to the ACCENT.

The renderer doesn't expose a per-series color option; override via
post-process:

```js
amvcpChart.scan(document);
document.querySelectorAll('figure[data-ve-chart-type="connected-dot-plot"]')
  .forEach((fig) => {
    fig.querySelectorAll('.ve-chart-dot').forEach((dot, i) => {
      // Even-index dots = series 0 (before); odd-index = series 1 (after).
      if (i % 2 === 0) dot.style.fill = 'var(--vc-color-content-muted)';
      else dot.style.fill = 'var(--vc-color-accent)';
    });
  });
```

## Connector + value-label combo

By default, the connector is dashed (`stroke-dasharray: 3 3`) and uses
`--vc-color-border-strong`. The connector has no value label — readers
infer the delta from the two endpoints + the dot tooltips.

To make the delta MORE EXPLICIT, you can ADD a label per category via
JS:

```js
amvcpChart.scan(document);
document.querySelectorAll('figure[data-ve-chart-type="connected-dot-plot"]')
  .forEach((fig) => {
    fig.querySelectorAll('.ve-chart-connector').forEach((line) => {
      const x = parseFloat(line.getAttribute('x1'));
      const y1 = parseFloat(line.getAttribute('y1'));
      const y2 = parseFloat(line.getAttribute('y2'));
      const delta = Math.round(y1 - y2);  // positive = improvement (y decreased)
      // ... append a text node at midpoint
    });
  });
```

But this is a smell — usually a SECOND `metric-cards` figure underneath
the chart, showing the most-improved/most-regressed categories, reads
cleaner than label clutter.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: connector dashed and
strong enough to read against the background; dot colors come from
`palette(2)` (golden-angle distinct), light + dark themes both legible;
connector goes between the paired endpoints (NOT skipping categories);
each pair's two dots are atoms (clicking either reveals the value).
