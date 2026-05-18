# `chart:pie@1` — the pie guardrail

## Table of Contents

- [Why no pie charts](#why-no-pie-charts)
- [What the runtime does](#what-the-runtime-does)
- [Example](#example)
- [When the author actually wants a circular form](#when-the-author-actually-wants-a-circular-form)
- [Anti-patterns](#anti-patterns)
- [Empirical evidence summary](#empirical-evidence-summary)
- [What about lone Hyperframes-style guidance documents?](#what-about-lone-hyperframes-style-guidance-documents)
- [See also](#see-also)
- [Visual verification](#visual-verification)

`pie` is the BANNED chart type. Any spec authored as `chart:pie@1` is
intercepted by the runtime and silently REMAPPED to a sorted `chart:bar@1`
(`options.sortDescending: true`). The chart still renders; the author gets
a (non-blocking) `console.info` explaining the remap.

This is the canonical Hyperframes / Tufte design guardrail (CH-15 in the
mining catalog), enforced by default. NOT opt-in. NOT off-by-default.

## Why no pie charts

The reasons are not aesthetic preferences — they're perceptual and
empirical:

1. **Angle perception is poor.** Human vision is precise about 1-D
   positions (`bar`) and lengths (`bar`), but coarse about angles. Comparing
   pie slices means comparing angles; the eye gets ranks wrong even for
   2:1 slice ratios.
2. **No baseline to anchor against.** Bars have a common baseline; the eye
   compares lengths from a single reference. Pie slices have no shared
   reference — every comparison is angle-vs-angle.
3. **3-slice pies hide ranking.** A 40/35/25 split looks like "all about
   the same" in pie form; the same data as a sorted bar instantly shows
   the ranking.
4. **Donut is the sanctioned circular form.** When circular geometry is
   visually important (brand match, executive dashboard), `donut` keeps
   the circle but adds the center text (the TOTAL) as a focal point and
   removes the false-precision pie-slice comparison problem.

The `donut` renderer also forces `rInner > 0` — there is no way to
generate a "donut with zero inner radius", i.e. a pie, via the chart
module.

## What the runtime does

When the scanner finds a fenced block with type `pie`:

```js
// from amvcp-chart.js#render:
if (type === 'pie') {
  type = 'bar';
  spec = spec || {};
  spec.options = spec.options || {};
  spec.options.sortDescending = true;
  if (typeof console !== 'undefined' && console.info) {
    console.info('[ve-chart] pie remapped to sorted bar — see chart guardrails');
  }
}
```

And in the scanner's lookup:

```js
// from amvcp-chart.js#scan:
if (parsed.type === 'pie') {
  // pie is handled by render()'s remap — let it through.
  entry = registry.bar;
}
```

The remap is FAIL-SAFE, not fail-blank. The chart still renders (the
author's intent — show this data — is honored). What changes is the
representation: a sorted bar chart instead of a pie.

## Example

If the author writes:

````markdown
```chart:pie@1
{
  "title": "Budget split",
  "series": [{ "label": "budget", "data": [
    {"x":"R&D","y":40}, {"x":"Sales","y":35},
    {"x":"Ops","y":25}
  ] }]
}
```
````

The runtime renders it AS IF the author had written:

````markdown
```chart:bar@1
{
  "title": "Budget split",
  "series": [{ "label": "budget", "data": [
    {"x":"R&D","y":40}, {"x":"Sales","y":35},
    {"x":"Ops","y":25}
  ] }],
  "options": { "sortDescending": true }
}
```
````

The `<figure>` carries `data-ve-chart-type="bar"` (not "pie") so any
post-render selector picks it up correctly. The console message in the
DevTools log tells the author what happened.

## When the author actually wants a circular form

Use `donut`:

```chart:donut@1
{
  "title": "Budget split",
  "series": [{ "label": "budget", "data": [
    {"x":"R&D","y":40}, {"x":"Sales","y":35},
    {"x":"Ops","y":25}
  ] }]
}
```

The donut renders with a center text showing the total ("100"), three
slices, and a legend below. The geometry is circular; the comparison
mechanism (the center hole + the legend) is better than a pie's.

For an INLINE part-to-whole (a dashboard tile, a stat card), use
`segmented-bar`:

```chart:segmented-bar@1
{
  "title": "Budget split",
  "series": [{ "label": "budget", "data": [
    {"x":"R&D","y":40}, {"x":"Sales","y":35},
    {"x":"Ops","y":25}
  ] }]
}
```

## Anti-patterns

- **Trying to disable the pie guardrail.** There is no opt-out. The remap is enforced for every author. If you need a real pie chart for some external reason (legacy mockup compatibility, etc.), use a different tool — this skill will not emit one.
- **Authoring `pie` and complaining the chart "looks different".** Read the console message; switch to `donut` or `segmented-bar` consciously.
- **Mistaking the `donut` with a small hole for a pie.** The hole's inner radius is `rOuter * 0.62` — a true hole, large enough that the chart isn't a pie. Center text fits inside it.

## Empirical evidence summary

The empirical case against pie charts is well-documented. A short bibliography:

- **Cleveland & McGill (1984)** — "Graphical Perception". The seminal
  study ranking visual encodings by perceptual accuracy. Position-along-
  a-common-scale (bar) ranked #1; angle (pie) ranked #4. The eye is
  measurably worse at angle comparison than length comparison.
- **Few (2007)** — "Save the Pies for Dessert". Stephen Few's catalog of
  pie chart failures with real-world examples. Conclusion: pie charts
  underperform sorted bars in every comparison task tested.
- **Skau, Harrison & Kosara (2015)** — "An Evaluation of the Impact of
  Visual Embellishments in Bar Charts" (IEEE InfoVis). Found that even
  decorated bars beat pies for any compare-magnitudes task.
- **Tufte (1983)** — "The Visual Display of Quantitative Information".
  Tufte's chart-junk principle: a chart should minimize the ink that
  doesn't convey data. Pie charts use significant ink (the wedge area)
  to encode one value (the angle) — high ink-to-data ratio.

The guardrail in this skill operationalises these findings: even when a
designer mistakenly authors `chart:pie@1`, the runtime quietly delivers
the better visual.

## What about lone Hyperframes-style guidance documents?

The Hyperframes design philosophy (CH-15 in the mining catalog) ships
"never use pie charts" as one of three hard rules (no pie / no default
gridlines / no D3 unless complexity requires). This skill adopts all
three: pie is auto-remapped; gridlines are capped at 4 horizontal rules;
D3/Plotly/Chart.js are forbidden. The guardrails are not opt-in — they
shape every chart this skill produces.

## See also

- [chart-donut.md](./chart-donut.md) — the sanctioned circular form.
- [chart-segmented-bar.md](./chart-segmented-bar.md) — the inline alternative.
- [chart-guardrails.md](./chart-guardrails.md) — the full list of enforced design guardrails (sparse gridlines, no-pie, no-D3, no-heavy-libs).
- [chart-decision-matrix.md](./chart-decision-matrix.md) — picks `donut` / `segmented-bar` / `mekko` / `bar` for the parts-of-a-whole question, depending on context.
- [chart-bar.md](./chart-bar.md) — what the pie spec is silently remapped to.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: a `chart:pie@1` spec
renders as a sorted bar chart (the `<figure>` carries
`data-ve-chart-type="bar"`, not `"pie"`); the browser DevTools console
shows the `[ve-chart] pie remapped to sorted bar — see chart guardrails`
info line; the chart's bars are in descending order of y.
