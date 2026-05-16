# `chart:lollipop@1` — lollipop chart

A bar chart with the bar replaced by a thin "stem" line and a circular
"head" at the value. Far less visual ink than `bar` for the same comparison.

## When to choose lollipop

Use `lollipop` when:

- You want bar-like magnitude comparison BUT the chart should feel light/airy.
- The categories are many (8-30) — solid bars in this range get cluttered, lollipops stay crisp.
- The reader's focus is on RANK, not on relative bar lengths down to the millimetre.
- You're publishing in a context where ink budget matters (print, slide deck, dense dashboard).

Pick `bar` when small-magnitude differences must be visible.
Pick `dot-plot` when even the stem is too much (you just want a position).

## Authoring shape

```chart:lollipop@1
{
  "title": "Issues closed per sprint",
  "subtitle": "S4 set the team record",
  "series": [{ "label": "closed", "data": [
    {"x":"S1","y":18},
    {"x":"S2","y":24},
    {"x":"S3","y":15},
    {"x":"S4","y":31}
  ] }]
}
```

Identical shape to `bar`. Same `series[i].data[k].{x,y}`. The renderer just
substitutes a stem + head for the rectangle.

## Options

| Key | Default | Effect |
|---|---|---|
| `sortDescending` | `false` | Single-series only; reorder by y. Highly recommended for lollipop — the rank insight is the whole point. |
| `valueLabels` | `false` | **Ignored** for lollipop (the head IS the value marker; a label above clutters the visual). |

## Examples

### 1. Sorted rank (the canonical lollipop)

```chart:lollipop@1
{ "title": "Top 8 packages by import count",
  "series": [{ "label": "imports", "data": [
    {"x":"lodash","y":2840}, {"x":"react","y":1920},
    {"x":"axios","y":1640}, {"x":"chalk","y":1320},
    {"x":"jest","y":1080}, {"x":"webpack","y":820},
    {"x":"prettier","y":640}, {"x":"vite","y":520}
  ] }],
  "options": { "sortDescending": true } }
```

### 2. Grouped lollipop (2 series, low ink)

```chart:lollipop@1
{ "title": "p50 vs p99 latency by endpoint (ms)",
  "series": [
    { "label": "p50", "data": [
      {"x":"GET /a","y":42}, {"x":"GET /b","y":68},
      {"x":"POST /c","y":91}, {"x":"PUT /d","y":54}] },
    { "label": "p99", "data": [
      {"x":"GET /a","y":120}, {"x":"GET /b","y":180},
      {"x":"POST /c","y":340}, {"x":"PUT /d","y":210}] }
  ] }
```

In multi-series mode each category band gets two side-by-side stems with
distinct heads (golden-angle palette). The visual is similar to a grouped
dot-plot but the stems anchor each head to the x-axis baseline.

## What the runtime emits

For each datum, two SVG elements:

```html
<g class="ve-chart-bars">
  <line class="ve-chart-lollipop-stem"
        x1="…" y1="(yBase)" x2="…" y2="(yScale(val))"/>
  <circle class="ve-chart-bar ve-chart-lollipop-head"
          cx="…" cy="(yScale(val))" r="5"
          fill="var(--vc-color-accent, #b8861f)"
          data-ve-id="ve-chart-N-d0-i0"
          data-ve-type="chart-point"
          data-ve-label="closed · S1"
          data-ve-value="18"
          tabindex="0" role="button">
    <title>closed · S1: 18</title>
  </circle>
  …
</g>
```

The HEAD is the `chart-point` atom (the selectable, clickable, tooltip-bearing
element). The STEM is decorative — it does not receive hover/click and does
not stamp `data-ve-id`. Clicking the stem area near a head still triggers
the head's hover because the lollipop is grouped tightly.

## Lib functions called

`renderSvgBar(spec, 'lollipop', fig)` — branches on `isLollipop`:

- For each datum, append:
  1. `<line class="ve-chart-lollipop-stem">` from `(bandCenter, yBase)` to `(bandCenter, yScale(val))`.
  2. `<circle class="ve-chart-bar ve-chart-lollipop-head" cx=bandCenter cy=yScale(val) r=5>`.
- `markPoint(head, …)` — only the head gets the selection payload.
- `svgTitle(head, label + ': ' + fmtNum(val))` — native SVG tooltip on the head.

The stem class `ve-chart-lollipop-stem` is styled via:

```css
.ve-chart-lollipop-stem, .ve-chart-connector, .ve-chart-wf-connector {
  stroke: var(--vc-color-border-strong, #c9bfa3);
  stroke-width: 1.5;
}
```

## DESIGN.md tokens

Same as `bar` (see `chart-bar.md`). Additional:

| Token | Used for |
|---|---|
| `--vc-color-border-strong` | Stem stroke color. |

The head fill is `--vc-color-accent` for single-series, palette index for
multi.

## Selection / atoms

Only the HEAD is an atom; the stem is decorative. Clicking the head toggles
the selection; the atom payload is identical to a bar's
(`type:"chart-point"`, `data:{chartId, datasetIndex, …, value}`). The same
selected-state styling applies (brighter fill + 2-px stroke).

## Anti-patterns

- **Using lollipop with very few categories (≤ 3).** Tiny categorical sets look better as bars — the lollipop's "lightness" advantage only kicks in at scale.
- **Mixing lollipop with bar in the same dashboard.** Two visual languages for the same idea confuses the reader. Pick one and stick with it across the page.
- **Setting `valueLabels: true`.** Silently ignored — the head already marks the value.
- **Using lollipop for `bullet` use cases.** A lollipop has no target reference; if you want target+actual, use `bullet`.

## Lollipop vs alternatives

| Goal | Best chart | Why |
|---|---|---|
| Rank with low ink | `lollipop` | Stem + head ~ 1/3 the ink of a solid bar. |
| Rank with even lower ink | `dot-plot` | Dot only, no stem. |
| Rank with magnitude weight | `bar` | Solid bar reinforces the magnitude perception. |
| Rank with anchored-to-zero feel | `lollipop` | Stem visually anchors each value to the baseline. |
| Compare two paired values per category | `connected-dot-plot` | Connector shows the delta direction. |

The lollipop's value is keeping the y=0-anchored READING (the eye sees
"how high above the baseline") while reducing the visual weight. Pick
`lollipop` when the rank is the story but you also want the reader to
intuit "this is X above zero".

## When lollipop beats bar

- The chart sits in a dense layout (a dashboard tile, a slide alongside
  prose) and a solid bar feels heavy.
- Many categories (15-30+) — solid bars in this range look like a fence;
  lollipops stay airy.
- The bar chart in the same dashboard would be uniformly solid; a
  lollipop visually differentiates this chart from the others.

## When lollipop loses to bar

- Few categories (≤ 5) — the stem-+-head extra visual ink isn't worth it; just use a bar.
- The chart is a focal element (executive dashboard, headline visual) — solid bars carry more visual weight, which is appropriate for a focal chart.
- The audience expects "bar chart" (financial reports, scientific journals); lollipop reads as non-standard.

## Multi-series lollipop

The renderer supports multi-series lollipops via the same
`palette(series.length)` mechanism. Each category band gets one stem +
head per series, fanned horizontally within the band (same offset logic
as grouped `dot-plot`).

For 3+ series, the heads get crowded; consider `bar` (grouped) or
splitting into multiple charts.

## Stem styling overrides

The stem class is `.ve-chart-lollipop-stem`. To customise per-page:

```css
.ve-chart-lollipop-stem {
  stroke-dasharray: 2 3;       /* dashed stems */
  stroke-width: 1;             /* thinner */
}
```

Note that overriding spec colors (via `style="stroke: …"`) breaks the
theme cascade. Stick to global CSS overrides if needed.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: head visibility on both
themes (the 5-pixel circle must not blend into the surface), stem contrast
against the gridlines, multi-series heads do not overlap within a band,
head atom is the selectable element (not the stem).
