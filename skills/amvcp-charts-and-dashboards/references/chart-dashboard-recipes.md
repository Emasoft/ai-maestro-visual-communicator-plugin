# Dashboard recipes — composing multiple charts into a story

A single chart answers one question; a dashboard answers a chain of
questions. This file collects the canonical multi-chart compositions
mined from the catalog and shows the exact fenced-block ladders that
produce them.

## Table of contents

- [Recipe 1 — Status report shape](#recipe-1--status-report-shape)
- [Recipe 2 — Single-KPI hero + trend](#recipe-2--single-kpi-hero--trend)
- [Recipe 3 — Compare-N-approaches](#recipe-3--compare-n-approaches)
- [Recipe 4 — Funnel + cohort retention](#recipe-4--funnel--cohort-retention)
- [Recipe 5 — Performance regression hunt](#recipe-5--performance-regression-hunt)
- [Recipe 6 — Sales pipeline review](#recipe-6--sales-pipeline-review)
- [Layout guidance](#layout-guidance)

---

## Recipe 1 — Status report shape

The pattern from `11-status-report.html` in the mining catalog: an
auto-pill header, 4-stat KPI band, a velocity bar chart with the peak
highlighted, plus a tabular Shipped list (handled by `amvcp-tables`).

```chart:metric-cards@1
{
  "title": "This week",
  "series": [{ "label": "kpi", "data": [
    {"label":"PRs merged", "value":14, "delta":3, "trend":"up"},
    {"label":"Deploys",    "value":6,  "delta":0, "trend":"flat"},
    {"label":"Incidents",  "value":1,  "delta":0, "trend":"flat", "unit":"SEV-2"},
    {"label":"Flaky tests fixed", "value":3, "delta":0, "trend":"flat"}
  ] }]
}
```

```chart:bar@1
{
  "title": "PRs per day this week",
  "series": [{ "label": "PRs", "data": [
    {"x":"Mon","y":2},{"x":"Tue","y":3},{"x":"Wed","y":4},
    {"x":"Thu","y":3},{"x":"Fri","y":2}
  ] }],
  "options": { "valueLabels": true }
}
```

Post-render: highlight the peak bar (the `Wed` value of 4) with a JS
post-process for the `--vc-color-accent` single-color emphasis pattern:

```js
amvcpChart.scan(document);
var bars = document.querySelectorAll(
  'figure[data-ve-chart-type="bar"] .ve-chart-bar');
var peakIdx = -1, peakVal = -Infinity;
bars.forEach((b, i) => {
  var v = parseFloat(b.getAttribute('data-ve-value'));
  if (v > peakVal) { peakVal = v; peakIdx = i; }
  b.style.fill = 'var(--vc-color-border-strong)';
});
if (peakIdx >= 0) {
  bars[peakIdx].style.fill = 'var(--vc-color-accent)';
}
```

## Recipe 2 — Single-KPI hero + trend

A hero metric tile plus a sparkline-style line chart underneath. Pattern
from `09-slide-deck.html`'s metrics slide.

```chart:metric-cards@1
{
  "title": "Today's revenue",
  "series": [{ "label": "hero", "data": [
    {"label":"Revenue (USD)", "value":124800,
     "delta":18400, "trend":"up", "unit":"$"}
  ] }]
}
```

```chart:line@1
{
  "title": "Last 30 days",
  "series": [{ "label": "USD", "data": [
    {"x":"D1","y":92000},{"x":"D5","y":98000},
    {"x":"D10","y":104000},{"x":"D15","y":108000},
    {"x":"D20","y":114000},{"x":"D25","y":118000},
    {"x":"D30","y":124800}
  ] }]
}
```

The single-card metric-cards becomes a hero tile (the auto-fit grid takes
the full width when there's one card).

## Recipe 3 — Compare-N-approaches

Three (or N) parallel chart triplets that compare options side-by-side.
Pattern from `01-exploration-code-approaches.html`. Each option gets its
own `metric-cards` + a chart.

```chart:metric-cards@1
{
  "title": "Option A — inline useEffect",
  "series": [{ "label": "a", "data": [
    {"label":"Bundle", "value":0,    "unit":"kB", "delta":0,  "trend":"flat"},
    {"label":"Test",   "value":"low", "delta":""}
  ] }]
}
```

```chart:metric-cards@1
{
  "title": "Option B — custom hook",
  "series": [{ "label": "b", "data": [
    {"label":"Bundle", "value":2,    "unit":"kB", "delta":2,  "trend":"flat"},
    {"label":"Test",   "value":"high","delta":""}
  ] }]
}
```

```chart:metric-cards@1
{
  "title": "Option C — `use-debounce` lib",
  "series": [{ "label": "c", "data": [
    {"label":"Bundle", "value":4,    "unit":"kB", "delta":4,  "trend":"flat"},
    {"label":"Test",   "value":"high","delta":""}
  ] }]
}
```

For the comparison summary across options, follow with a `radar`:

```chart:radar@1
{
  "title": "Option scorecard",
  "series": [
    { "label": "A", "data": [
      {"x":"Bundle","y":10},{"x":"Speed","y":9},
      {"x":"Test","y":3},{"x":"Maintain","y":4}] },
    { "label": "B", "data": [
      {"x":"Bundle","y":8},{"x":"Speed","y":9},
      {"x":"Test","y":9},{"x":"Maintain","y":8}] },
    { "label": "C", "data": [
      {"x":"Bundle","y":6},{"x":"Speed","y":9},
      {"x":"Test","y":9},{"x":"Maintain","y":9}] }
  ]
}
```

## Recipe 4 — Funnel + cohort retention

Side-by-side `funnel` (conversion stages) + `connected-dot-plot` (cohort
behavior at each stage).

```chart:funnel@1
{ "title": "Conversion funnel",
  "series": [{ "label": "users", "data": [
    {"x":"Landing","y":48000},
    {"x":"PDP","y":18200},
    {"x":"Add to cart","y":6400},
    {"x":"Checkout","y":2100},
    {"x":"Purchase","y":840}
  ] }] }
```

```chart:connected-dot-plot@1
{
  "title": "Conversion: control vs variant",
  "series": [
    { "label": "Control", "data": [
      {"x":"Landing","y":100},{"x":"PDP","y":38},
      {"x":"Cart","y":13},{"x":"Checkout","y":4},
      {"x":"Purchase","y":1.8}] },
    { "label": "Variant", "data": [
      {"x":"Landing","y":100},{"x":"PDP","y":42},
      {"x":"Cart","y":16},{"x":"Checkout","y":7},
      {"x":"Purchase","y":3.4}] }
  ]
}
```

The funnel shows the absolute counts; the connected-dot-plot shows the
A/B-test delta at each stage.

## Recipe 5 — Performance regression hunt

A heatmap surfaces the spike; a line drills into it.

```chart:heatmap@1
{ "title": "p99 by service × version",
  "series": [{ "label": "p99", "data": [] }],
  "options": {
    "grid": [
      [120, 130, 124, 142, 156, 320],
      [ 88, 102,  98, 110, 124, 280],
      [ 64,  72,  78,  82,  94, 180],
      [ 92,  88, 102, 108, 124, 240]
    ],
    "rowLabels": ["auth","catalog","orders","payments"],
    "colLabels": ["v0.9","v1.0","v1.1","v1.2","v1.3","v1.4"],
    "logScale": true
  }
}
```

```chart:line@1
{
  "title": "auth · p99 — last 7 days",
  "subtitle": "Spike at the v1.4 deploy",
  "series": [{ "label": "p99 (ms)", "data": [
    {"x":"D1","y":120},{"x":"D2","y":124},{"x":"D3","y":118},
    {"x":"D4","y":340},{"x":"D5","y":312},{"x":"D6","y":295},
    {"x":"D7","y":280}
  ] }]
}
```

## Recipe 6 — Sales pipeline review

A `bar` (stage counts) + a `waterfall` (period bridge) + a `metric-cards`
(headline KPIs). The dashboard answers "where is the pipeline today + how
did we get here + what's the topline?".

```chart:metric-cards@1
{
  "title": "Pipeline headline",
  "series": [{ "label": "h", "data": [
    {"label":"ARR booked",    "value":4.8, "delta":0.6, "trend":"up", "unit":"$M"},
    {"label":"Open pipeline", "value":12.4,"delta":1.2, "trend":"up", "unit":"$M"},
    {"label":"Quota coverage","value":2.8, "delta":0.3, "trend":"up", "unit":"x"},
    {"label":"Win rate",      "value":28,  "delta":-2,  "trend":"down","unit":"%"}
  ] }]
}
```

```chart:bar@1
{ "title": "Open pipeline by stage ($M)",
  "series": [{ "label": "stage", "data": [
    {"x":"Lead","y":18.2},{"x":"Qual","y":12.6},
    {"x":"Demo","y":8.4},{"x":"Negotiate","y":4.8},
    {"x":"Close","y":2.4}
  ] }] }
```

```chart:waterfall@1
{ "title": "Q4 pipeline bridge ($M)",
  "series": [{ "label": "bridge", "data": [
    {"x":"Start Q4",  "delta":10.2},
    {"x":"New deals", "delta":8.4},
    {"x":"Slipped",   "delta":-2.8},
    {"x":"Closed-won","delta":-3.4},
    {"x":"End Q4",    "isTotal":true}
  ] }] }
```

## Layout guidance

Charts in a dashboard typically need a CSS Grid wrapper. The chart
module's figures are `display:block` by default; in a 2-column layout:

```html
<style>
.ve-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: var(--vc-space-4, 24px);
}
</style>
<div class="ve-dashboard">
  <pre><code class="language-chart:bar@1">…</code></pre>
  <pre><code class="language-chart:line@1">…</code></pre>
</div>
```

After `amvcpChart.scan(document)` runs, each `<pre>` is replaced by a
`<figure>` — and the figure inherits the grid cell from the parent.

For HERO sections, use a 1-column grid above a multi-column grid:

```html
<div class="ve-dashboard-hero">
  <pre><code class="language-chart:metric-cards@1">…hero KPI…</code></pre>
</div>
<div class="ve-dashboard">
  <pre><code class="language-chart:line@1">…trend…</code></pre>
  <pre><code class="language-chart:bar@1">…compare…</code></pre>
</div>
```

The `:has([data-ve-selected="1"])` outer-ring affordance still works in a
grid — each figure's ring is independent.

## See also

- [chart-decision-matrix.md](./chart-decision-matrix.md) — picking the right type per question.
- [chart-metric-cards.md](./chart-metric-cards.md) — the dashboard primitive.
- [chart-sparklines-and-inline.md](./chart-sparklines-and-inline.md) — small inline trend charts to complement the dashboard.
