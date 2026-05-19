# Sparklines and inline charts

## Table of Contents

- [When to choose a sparkline](#when-to-choose-a-sparkline)
- [Authoring a sparkline](#authoring-a-sparkline)
- [Inline single-point markers](#inline-single-point-markers)
- [Sparkline in a table cell](#sparkline-in-a-table-cell)
- [Inline in a metric card](#inline-in-a-metric-card)
- [Constraints](#constraints)
- [See also](#see-also)

A SPARKLINE is a small chart embedded in prose / a stat tile / a table
cell — typically a `line` or `area` chart with no axes, no gridlines, no
legend, no big title. The chart skill renders sparklines via the standard
fence protocol, but with layout constraints that shrink the chart to fit
its parent.

## When to choose a sparkline

Use a sparkline when:

- A larger chart would be disproportionate (the parent container is small).
- The trend SHAPE is enough information (no need for precise values).
- The chart sits ALONGSIDE prose / a KPI / a table row, not as a standalone
  figure.

Pick a full `line` or `area` chart when the chart is the page's centerpiece.

## Authoring a sparkline

The fence is the same as `line`, but the parent container constrains the
chart to a small size. The chart's `<svg>` is `width: 100%; height: auto;
preserveAspectRatio: xMidYMid meet` — so it fits naturally inside a 240px
or 120px wide container.

To make the chart MORE sparkline-like, ALSO suppress the title (use a
single-character title to satisfy the validation, then visually hide it
via CSS).

```html
<style>
.ve-sparkline {
  display: inline-block;
  width: 120px;
  vertical-align: middle;
}
.ve-sparkline .ve-chart-title,
.ve-sparkline .ve-chart-svg .ve-chart-axis,
.ve-sparkline .ve-chart-svg .ve-chart-gridlines,
.ve-sparkline .ve-chart-svg .ve-chart-xlabels,
.ve-sparkline .ve-chart-source {
  display: none !important;
}
</style>

<p>
  Revenue is up — see the trend
  <span class="ve-sparkline">
<pre><code class="language-chart:area@1">{
  "title": "·",
  "series": [{ "label": "rev", "data": [
    {"x":"D1","y":92},{"x":"D5","y":98},{"x":"D10","y":104},
    {"x":"D15","y":108},{"x":"D20","y":114},{"x":"D25","y":118},
    {"x":"D30","y":124}
  ] }]
}</code></pre>
  </span>
  with steady growth across all 4 weeks.
</p>
```

After `amvcpChart.scan(document)`, the `<pre>` becomes a `<figure>`
inside the `<span class="ve-sparkline">`. The CSS hides the chrome; what's
visible is the line + the area fill + the terminal point (the last
`<circle class="ve-chart-point">`).

## Inline single-point markers

To show the LATEST value as a sparkline + a "current" dot, the chart
already renders a `<circle>` at each datum. The last circle is the visual
landing point. To emphasise it:

```css
.ve-sparkline .ve-chart-point:last-of-type {
  r: 5;
  fill: var(--vc-color-accent);
  stroke: var(--vc-color-surface);
  stroke-width: 2;
}
```

This gives the GitHub-style "current value dot at the end of the line"
look.

## Sparkline in a table cell

```html
<table>
  <thead>
    <tr><th>Service</th><th>Latency (last hour)</th><th>p99</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>auth</td>
      <td class="ve-sparkline-cell">
        <pre><code class="language-chart:line@1">{"title":"·","series":[{"label":"l","data":[
          {"x":"00","y":42},{"x":"10","y":48},{"x":"20","y":46},
          {"x":"30","y":52},{"x":"40","y":58},{"x":"50","y":64}
        ]}]}</code></pre>
      </td>
      <td>64 ms</td>
    </tr>
    <!-- more rows … -->
  </tbody>
</table>

<style>
.ve-sparkline-cell { width: 160px; padding: 0; }
.ve-sparkline-cell figure.ve-chart {
  margin: 0; height: 40px;
}
.ve-sparkline-cell .ve-chart-title,
.ve-sparkline-cell .ve-chart-axis,
.ve-sparkline-cell .ve-chart-gridlines,
.ve-sparkline-cell .ve-chart-xlabels {
  display: none !important;
}
</style>
```

The table's `<tr>` row stays a selectable atom (the `amvcp-tables` skill
contract); the sparkline inside it is decorative.

## Inline in a metric card

The `metric-cards` chart doesn't natively combine with a sparkline — but
the dashboard recipe (see [chart-dashboard-recipes.md §2 Single-KPI hero
and trend](./chart-dashboard-recipes.md#recipe-2--single-kpi-hero--trend))
puts a metric-cards figure ABOVE a line figure, achieving the same intent
without nesting.

For a TRUE inline sparkline inside a card, author both manually:

```html
<div class="kpi-with-spark">
  <div class="kpi-label">Revenue</div>
  <div class="kpi-value">$124.8k</div>
  <div class="ve-sparkline" style="width: 100%; height: 30px;">
    <pre><code class="language-chart:area@1">{"title":"·","series":[{"label":"r","data":[
      {"x":"1","y":92},{"x":"2","y":98},{"x":"3","y":104},
      {"x":"4","y":108},{"x":"5","y":114},{"x":"6","y":118},{"x":"7","y":124}
    ]}]}</code></pre>
  </div>
</div>
```

(But you lose the `chart-point` selection contract for the KPI label/value
— they become plain text, not atoms. To stay in-contract, use `metric-cards`
above + a separate `area` below.)

## Constraints

- The chart fence STILL requires a non-empty `title`. Use `"·"` or `" "`
  with a non-blank character to pass validation; hide it via CSS.
- The chart fence STILL renders point circles per datum. For a true "line
  only" sparkline, hide them with `display:none` (but then you lose the
  selection atoms; this is a deliberate trade-off).
- Sparklines respect `prefers-reduced-motion` — the draw-on animation
  fires unless `reduce` is set.

## See also

- [chart-line.md](./chart-line.md) — the underlying line renderer.
- [chart-area.md](./chart-area.md) — the underlying area renderer.
- [chart-dashboard-recipes.md](./chart-dashboard-recipes.md) — composing
  metric-cards + line / area for the same intent without inlining.
- The `amvcp-tables` skill — for the table-cell sparkline pattern with
  selectable rows.
