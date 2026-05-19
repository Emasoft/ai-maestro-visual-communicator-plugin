# `chart:dot-plot@1` — dot plot

## Table of Contents

- [When to choose dot-plot](#when-to-choose-dot-plot)
- [Authoring shape](#authoring-shape)
- [Options](#options)
- [Examples](#examples)
- [What the runtime emits](#what-the-runtime-emits)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens](#designmd-tokens)
- [Selection / atoms](#selection--atoms)
- [Dot-plot vs alternatives — comparison table](#dot-plot-vs-alternatives--comparison-table)
- [When dot-plot wins over lollipop](#when-dot-plot-wins-over-lollipop)
- [Grouping nuances — horizontal spread within a band](#grouping-nuances--horizontal-spread-within-a-band)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

A bar chart with the bar entirely removed — just a dot at the y-value of
each category. The lowest possible visual ink for a categorical magnitude
comparison.

## When to choose dot-plot

Use `dot-plot` when:

- You need RANK / POSITION more than absolute magnitude perception.
- The chart shares space with denser charts (you want it visually quiet).
- A grouped comparison would benefit from dots-only (cleaner than two side-by-side bars or two lollipops).
- The categories are many (10-40) — bars at this density become a wall.

For two-series before/after comparisons specifically, use
`connected-dot-plot` — it adds a connector line that visually links the
paired dots and makes the delta direction obvious.

## Authoring shape

```chart:dot-plot@1
{
  "title": "Latency by endpoint (p99, ms)",
  "series": [{ "label": "p99", "data": [
    {"x":"/login","y":120},
    {"x":"/search","y":340},
    {"x":"/profile","y":80},
    {"x":"/checkout","y":220},
    {"x":"/cart","y":150}
  ] }]
}
```

Same shape as `bar` / `lollipop`. The renderer substitutes a single
`<circle>` for each datum.

## Options

| Key | Default | Effect |
|---|---|---|
| `sortDescending` | `false` | Single-series only; reorder by y. Recommended — the rank is the main signal. |
| `valueLabels` | `false` | **Ignored** for dot-plot (dot already marks the value; a label would clutter). |

## Examples

### 1. Single-series sorted dot-plot

```chart:dot-plot@1
{ "title": "PR merge latency by author (median hours)",
  "series": [{ "label": "hours", "data": [
    {"x":"alice","y":2.4}, {"x":"bob","y":18.0},
    {"x":"carol","y":4.1}, {"x":"dave","y":9.3},
    {"x":"eve","y":1.8}, {"x":"frank","y":22.5}
  ] }],
  "options": { "sortDescending": true } }
```

### 2. Grouped dot-plot (3 series)

```chart:dot-plot@1
{ "title": "Test pass rate by suite — last 3 builds",
  "series": [
    { "label": "build-91", "data": [
      {"x":"unit","y":99.2}, {"x":"int","y":94.1}, {"x":"e2e","y":88.7}] },
    { "label": "build-92", "data": [
      {"x":"unit","y":99.4}, {"x":"int","y":95.0}, {"x":"e2e","y":91.2}] },
    { "label": "build-93", "data": [
      {"x":"unit","y":99.6}, {"x":"int","y":96.2}, {"x":"e2e","y":93.4}] }
  ] }
```

Each category band gets `series.length` dots, fanned horizontally inside
the band so they don't overlap (offset by `(si - (n-1)/2) * (barW / n)`).

## What the runtime emits

```html
<g class="ve-chart-bars">
  <circle class="ve-chart-bar ve-chart-dot"
          cx="…" cy="(yScale(val))" r="6"
          fill="var(--vc-color-accent, #b8861f)"
          data-ve-id="ve-chart-N-d0-i0"
          data-ve-type="chart-point" …>
    <title>p99 · /login: 120</title>
  </circle>
  …
</g>
```

The class chain `ve-chart-bar ve-chart-dot` means the dot inherits the
focus/hover/selection styles defined for `.ve-chart-bar` (cursor:pointer,
brightness on hover, accent stroke when selected).

## Lib functions called

`renderSvgBar(spec, 'dot-plot', fig)` — branches on `isDot`:

- For each datum, append one `<circle class="ve-chart-bar ve-chart-dot" cx=dcx cy=yScale(val) r=6>`.
- Multi-series: `dcx = bandCenter + (si - (n-1)/2) * (barW / n)`.
- `markPoint(dot, …)` — full selection payload.

## DESIGN.md tokens

Same as `bar` (see `chart-bar.md`).

## Selection / atoms

Each dot is an atom. Identical contract to a bar — `chart-point` type,
selected state with brighter fill + 2-px accent stroke, group comment-handle
on the figure when ≥ 1 dot is selected.

## Dot-plot vs alternatives — comparison table

| Goal | Best chart | Why |
|---|---|---|
| Rank items by a single value (single-series) | `dot-plot` sorted | Lowest visual ink; rank shape is immediate. |
| Rank items by a single value with magnitude weight | `bar` sorted | Bar length reinforces magnitude perception. |
| Rank items with VERY low ink (e.g. dense small chart) | `dot-plot` | Smaller than `bar`, no rectangles. |
| Compare before/after for many items (paired) | `connected-dot-plot` | Connector signals direction. |
| Show distributions (multiple values per category) | `dot-plot` (multi-series) | Each series's dot at the same x reveals spread. |
| Show full y-axis baseline pull | `bar` | Bar bottom = y=0 baseline; dot doesn't anchor there. |

## When dot-plot wins over lollipop

Both are "low ink alternatives to bar". The difference:

- `lollipop` keeps the stem → it preserves the "anchored to y=0" feel.
  The eye reads each value as "how high above the baseline".
- `dot-plot` drops the stem → it emphasises the SCATTERED POSITIONS.
  The eye reads each value as "where in the value space".

Pick `lollipop` for rank-from-zero comparisons. Pick `dot-plot` for
visually quieter spread visualizations or for grouped (multi-series)
charts where stems would clutter.

## Grouping nuances — horizontal spread within a band

When `series.length > 1`, the renderer fans dots horizontally within each
category band so they don't overlap:

```
bandCenter + (si - (n-1)/2) * (barW / n)
```

- With `n=2`: dots offset by `±(barW/4)` from bandCenter.
- With `n=3`: dots at `bandCenter - barW/3`, `bandCenter`, `bandCenter + barW/3`.
- With `n=4`: dots at `±barW/2` and `±barW/6` from bandCenter.

The spread is centered on the bandCenter and is bounded by the bar width
(`barW = bandW * 0.62`), so dots never overflow the band boundaries.
Past `n=4` the dots get crowded; consider switching to
`connected-dot-plot` (for pairs) or a `bar` (grouped) for clearer
per-series perception.

## Anti-patterns

- **Single-datum dot-plot.** A single dot at a value, no comparison — not a chart, use a `metric-cards` KPI tile instead.
- **Plotting categorical data on the y-axis.** dot-plot here is ALWAYS x-categorical, y-numeric. If you want categorical-y, you want a horizontal dot plot which is not a registered type — use the [chart-dashboard-recipes.md](../../amvcp-dashboards/references/chart-dashboard-recipes.md) pattern instead.
- **Using dot-plot for two-series before/after.** Use `connected-dot-plot` — the connector makes the delta direction obvious.
- **Setting `valueLabels: true`.** Silently ignored — the dot already marks the value.
- **Using dot-plot for time-series.** Dot-plot has discrete categorical x positions. For a continuous time axis (DAU over days), use `line` — the line's interpolation between points is meaningful where dots-only would imply discrete observations.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: dot visibility on both
themes (the 6-pixel circle must contrast with the surface), grouped-dot
horizontal spread within the band doesn't overflow the band boundaries,
sorted-single-series rank reads correctly (largest dot on the left when
`sortDescending: true`).
