---
name: amvcp-charts-and-dashboards
description: "Author dependency-free charts and KPI dashboards as fenced JSON code blocks — bar (single/stacked/diverging/lollipop/dot-plot/connected-dot-plot/bullet/segmented), line/area/step-area/slope/bump, donut/gauge/harvey-ball, radar, waterfall/funnel/mekko (Marimekko), heatmap/matrix/activity-heatmap, plus KPI metric-cards. Runtime renders SVG (default), CSS-flex (segmented-bar), or Canvas (>100 marks) into self-contained interactive HTML — every datapoint and card is a selectable atom with comment thread + 3-state decision pill. Use when the user asks for a chart, dashboard, KPI grid, metrics overview, sparkline, status report, trend visualization, conversion funnel, cohort retention chart, profit bridge, market mix, activity heatmap, or any data visualization. Trigger with 'chart', 'dashboard', 'bar/line/pie/area/donut/radar/waterfall/funnel/mekko/heatmap chart', 'metrics', 'KPI grid', 'sparkline', 'gauge', 'bullet chart', 'status report', 'trend', 'conversion funnel', 'cohort retention', 'small multiples'. Pie charts are remapped to sorted bars (enforced guardrail)."
license: MIT
compatibility: "Browser, Node 16+ for tests. Zero CDN, zero D3/Plotly/Chart.js. Loads alongside amvcp-designmd.js + amvcp-runtime.js for full theming + selection. Standalone-safe (renders with default tokens + internal selection list)."
metadata:
  author: Emasoft
---

# Charts and Dashboards

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads when the agent needs charts, dashboards, KPI tiles, sparklines, status
reports, or any data visualization. The author writes a JSON-bearing fenced
code block whose language tag declares the chart type (`chart:<type>@<version>`);
`scripts/amvcp-chart.js` finds the block on boot, parses the JSON,
validates it, and replaces the `<pre>` with rendered SVG / CSS-flex /
Canvas. Every datapoint is a `chart-point` atom that plugs into the runtime's
multi-select / comment-modal / 3-state-pill machinery with zero new wiring.

Zero CDN, zero D3/Plotly/Chart.js, one self-contained offline HTML file.
Every fill/stroke/gap/radius/font/duration is a DESIGN.md `--vc-*` token —
a theme swap re-themes every chart with no re-render (SVG cascades; Canvas
repaints via `__veChartRedraw`).

## Prerequisites

- Browser (Chromium via `--app=URL` preferred; default browser fallback works).
- Python 3.12+ for `scripts/amvcp-select.py` if using the file-launch runner.
- Three scripts colocated with the HTML, loaded in this order:
  `amvcp-designmd.js` (themes the page) → `amvcp-runtime.js` (selection +
  comment + decision-pill infrastructure) → `amvcp-chart.js` (the chart
  renderer). Order is forgiving — `amvcp-chart.js` auto-inits on
  `DOMContentLoaded` unless `window.__vcManualInit` is set.
- Standalone mode (no runtime) is supported: charts render and the
  internal selection list works; comment handles and decision pills do not
  mount.

## Instructions

1. **Pick the chart type.** Use [chart-decision-matrix.md](./references/chart-decision-matrix.md) — the data shape → recommended chart type table. The most common types: `bar` (compare categories), `line`/`area` (trend over time), `donut`/`segmented-bar` (parts of a whole — NEVER pie), `funnel` (drop-off), `waterfall` (cumulative bridge), `heatmap`/`matrix` (2-D intensity), `metric-cards` (KPI dashboard), `radar` (multi-criterion).
2. **Author the fenced block.** Each ref file (`chart-bar.md`, `chart-line.md`, etc.) shows the exact JSON shape with options. The envelope is always `{title, subtitle?, series:[{label, data:[...]}], options?, source?}`.
3. **State the insight in `title`.** "Q4 was the strongest in 3 years" — not "Revenue chart". The title is required; missing title fails loud.
4. **Let the palette + tokens flow.** Do NOT hardcode colors per spec. The palette comes from `palette(n)` (golden-angle OKLCH off `--vc-color-accent`); the ramp from `ramp(t, mode)` (OKLCH sequential or diverging). To re-theme, edit DESIGN.md, not the spec. See [chart-palette-engine.md](./references/chart-palette-engine.md).
5. **Compose dashboards** by stacking multiple fenced blocks under a single page. Layout via a CSS Grid wrapper (`grid-template-columns: repeat(auto-fit, minmax(360px, 1fr))`). See [chart-dashboard-recipes.md](./references/chart-dashboard-recipes.md) for 6 canonical compositions (status report, hero + trend, compare-N-approaches, funnel + cohort, regression hunt, sales pipeline).
6. **Run:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" file.html` — or just open the file in a browser. On `DOMContentLoaded`, the chart module injects its CSS + scans the page.
7. **React to clicks.** Each datapoint / card click toggles the atom in the page's `veSelection` and emits the payload `{type:"chart-point", data:{chartId, datasetIndex, datasetLabel, index, xLabel, value}}`. The comment handle mounts at the figure's left edge whenever ≥ 1 atom is selected; opening it routes to the multi-turn comment modal.

## Output

Self-contained HTML: the fenced `<pre>` becomes a `<figure class="ve-chart"
data-ve-chart-type="<type>" data-ve-chart-backend="svg|css|canvas|html"
data-ve-id="ve-chart-N" data-ve-type="chart">` containing the rendered
chart. Every mark inside (a `<rect>`, `<circle>`, `<path>`, `<polygon>`,
`<div>`, or `<li>` for Canvas a11y) carries `data-ve-id` /
`data-ve-type="chart-point"` / `tabindex="0"` / `role="button"` plus the
selection payload. Light + dark themes both render correctly because every
visual token resolves via `var(--vc-*, <fallback>)`.

## Error Handling

- **Pie chart spec** → remapped to `chart:bar@1` with `sortDescending:true`. See [chart-pie-guardrail.md](./references/chart-pie-guardrail.md).
- **Malformed JSON / missing title / missing series / unknown type / version too new** → degrades to a VISIBLE error block (danger banner with reason + original JSON kept verbatim). Never silent. See [chart-error-degradation.md](./references/chart-error-degradation.md).
- **Chart overflows the viewport** → forbidden inner scrollers. Every `.ve-chart`, `.ve-chart-svg`, `.ve-chart-canvas` is `overflow: visible`. Wide charts extend the page; the document's own scrollbar handles it.
- **Hover halo grey / palette feels wrong** → DESIGN.md is missing `--vc-color-accent` (or the dark variant). Fix the token, not the spec.
- **>100 marks** → auto-switches to Canvas backend for `bar`/`line`/`area`/`dot-plot`. Other types stay SVG. See [chart-canvas-backend.md](./references/chart-canvas-backend.md).
- **Theme swap leaves Canvas stale** → call `amvcpChart.scan(document)` after the theme change; the scanner re-runs each Canvas's `__veChartRedraw()`.
- **Animation triggers vestibular distress** → all entry animations gate on `prefers-reduced-motion: reduce`. See [chart-animations-and-motion.md](./references/chart-animations-and-motion.md).
- **Color literal hardcoded in a spec** → there is no `color` field on any datum; palette comes from tokens. Edit DESIGN.md to re-theme.

## When to choose this category — decision matrix (short)

| Reader needs to … | Best chart | See |
|---|---|---|
| Compare magnitudes across categories | `bar` (sorted) | [chart-bar.md](./references/chart-bar.md) |
| Show a trend over time | `line` / `area` / `step-area` | [chart-line.md](./references/chart-line.md), [chart-area.md](./references/chart-area.md), [chart-step-area.md](./references/chart-step-area.md) |
| Show before vs after for many items | `slope` or `connected-dot-plot` | [chart-slope.md](./references/chart-slope.md), [chart-connected-dot-plot.md](./references/chart-connected-dot-plot.md) |
| Show rank-over-time | `bump` | [chart-bump.md](./references/chart-bump.md) |
| Show parts of a whole | `donut` / `segmented-bar` / `mekko` (never `pie`) | [chart-donut.md](./references/chart-donut.md), [chart-segmented-bar.md](./references/chart-segmented-bar.md), [chart-mekko.md](./references/chart-mekko.md), [chart-pie-guardrail.md](./references/chart-pie-guardrail.md) |
| Show a cumulative bridge | `waterfall` | [chart-waterfall.md](./references/chart-waterfall.md) |
| Show stage drop-off | `funnel` | [chart-funnel.md](./references/chart-funnel.md) |
| Compare items on multiple criteria | `radar` / `harvey-ball` | [chart-radar.md](./references/chart-radar.md), [chart-harvey-ball.md](./references/chart-harvey-ball.md) |
| Show a 2-D intensity surface | `heatmap` / `matrix` / `activity-heatmap` | [chart-heatmap.md](./references/chart-heatmap.md), [chart-matrix.md](./references/chart-matrix.md), [chart-activity-heatmap.md](./references/chart-activity-heatmap.md) |
| Show a KPI dashboard | `metric-cards` | [chart-metric-cards.md](./references/chart-metric-cards.md) |
| Show a value vs target | `bullet` (multi) / `gauge` (single) | [chart-bullet.md](./references/chart-bullet.md), [chart-gauge.md](./references/chart-gauge.md) |
| Low-ink magnitude comparison | `lollipop` / `dot-plot` | [chart-lollipop.md](./references/chart-lollipop.md), [chart-dot-plot.md](./references/chart-dot-plot.md) |
| Compose a multi-chart dashboard | recipes for status report, hero, comparison, etc. | [chart-dashboard-recipes.md](./references/chart-dashboard-recipes.md) |
| Inline tiny trend chart in prose / a table | sparkline | [chart-sparklines-and-inline.md](./references/chart-sparklines-and-inline.md) |

Full version with alternatives + when-the-alternative-wins:
[chart-decision-matrix.md](./references/chart-decision-matrix.md).

## Examples

**Input:** "Show this quarter's headline KPIs and a revenue trend."

```chart:metric-cards@1
{ "title": "Q4 headline",
  "series": [{ "label": "kpi", "data": [
    {"label":"Revenue","value":48200,"delta":12,"trend":"up","unit":"$"},
    {"label":"NPS","value":52,"delta":4,"trend":"up"},
    {"label":"Churn","value":3.4,"delta":-0.6,"trend":"down","unit":"%"}
  ] }] }
```

```chart:line@1
{ "title": "Daily revenue — last 30 days",
  "series": [{ "label": "USD", "data": [
    {"x":"D1","y":42},{"x":"D7","y":47},{"x":"D14","y":51},
    {"x":"D21","y":56},{"x":"D28","y":61}
  ] }] }
```

The page renders the KPI row + the trend line; both are theme-aware,
selectable, commentable. A click on the "Churn" card opens a comment
modal scoped to that KPI.

**Input:** "Visualize this Q4 profit bridge."

```chart:waterfall@1
{ "title": "Q4 profit bridge ($M)",
  "series": [{ "label": "bridge", "data": [
    {"x":"Start","delta":12},
    {"x":"Sales","delta":8},
    {"x":"Costs","delta":-5},
    {"x":"Tax","delta":-3},
    {"x":"End","isTotal":true}
  ] }] }
```

Renders the waterfall with rise/fall/total bars in
success/danger/accent, connector dashes between steps, sparse horizontal
gridlines only.

**Input:** "Make a heatmap of errors by weekday × hour."

```chart:heatmap@1
{ "title": "Errors by hour × weekday",
  "series": [{ "label": "errors", "data": [] }],
  "options": {
    "grid": [[2,5,9,14,6],[3,8,22,31,9],[1,4,7,12,5],[0,2,6,18,40]],
    "rowLabels": ["Night","Morning","Noon","Evening"],
    "colLabels": ["Mon","Tue","Wed","Thu","Fri"],
    "logScale": true
  } }
```

Renders the OKLCH sequential ramp; `logScale:true` keeps the
Thursday-evening spike from washing out the rest.

## Modes

This skill supports `data-ve-mode="readonly"` only. Charts and KPI cards are view-only visualizations — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply to data points. Use `amvcp-choice-tables` or `amvcp-form-inputs` when the user is being asked to choose a data point.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple charts/dashboards on one page are allowed; each gets an independent `data-ve-id` namespace. The only exclusive skill is the overlay-runtime (R24).

## Resources

The references below are organised in three groups: per-type, cross-cutting, and meta.

### Per chart-type (the authoring contract for each variant)

- [chart-fence-protocol.md](./references/chart-fence-protocol.md) — the `chart:<type>@<version>` language tag, JSON envelope, per-type schema map, validation gates, version policy, boot order. **READ THIS FIRST.**
- [chart-bar.md](./references/chart-bar.md) — `bar` (single/grouped, sort, value labels)
- [chart-stacked-bar.md](./references/chart-stacked-bar.md) — `stacked-bar`
- [chart-diverging-bar.md](./references/chart-diverging-bar.md) — `diverging-bar` (signed values, success/danger fill)
- [chart-lollipop.md](./references/chart-lollipop.md) — `lollipop` (stem + head)
- [chart-dot-plot.md](./references/chart-dot-plot.md) — `dot-plot` (single value markers)
- [chart-connected-dot-plot.md](./references/chart-connected-dot-plot.md) — `connected-dot-plot` (before/after pairs joined)
- [chart-bullet.md](./references/chart-bullet.md) — `bullet` (KPI vs target + qualitative range)
- [chart-segmented-bar.md](./references/chart-segmented-bar.md) — `segmented-bar` (CSS-flex part-to-whole)
- [chart-line.md](./references/chart-line.md) — `line` (Catmull-Rom smooth)
- [chart-area.md](./references/chart-area.md) — `area` (line + OKLCH gradient fill)
- [chart-step-area.md](./references/chart-step-area.md) — `step-area` (orthogonal step path)
- [chart-slope.md](./references/chart-slope.md) — `slope` (before / after slope chart)
- [chart-bump.md](./references/chart-bump.md) — `bump` (rank over time)
- [chart-donut.md](./references/chart-donut.md) — `donut` (sanctioned circular form)
- [chart-gauge.md](./references/chart-gauge.md) — `gauge` (single value vs max + warn/danger thresholds)
- [chart-harvey-ball.md](./references/chart-harvey-ball.md) — `harvey-ball` (McKinsey qualitative rating row)
- [chart-radar.md](./references/chart-radar.md) — `radar` (multi-axis polygon, inflate animation)
- [chart-waterfall.md](./references/chart-waterfall.md) — `waterfall` (cumulative bridge)
- [chart-funnel.md](./references/chart-funnel.md) — `funnel` (drop-off stages)
- [chart-mekko.md](./references/chart-mekko.md) — `mekko` (Marimekko — column width by total + internal 100% stack)
- [chart-heatmap.md](./references/chart-heatmap.md) — `heatmap` (OKLCH sequential / diverging ramp; logScale)
- [chart-matrix.md](./references/chart-matrix.md) — `matrix` (heatmap + per-cell value glyph)
- [chart-activity-heatmap.md](./references/chart-activity-heatmap.md) — `activity-heatmap` (GitHub-style calendar)
- [chart-metric-cards.md](./references/chart-metric-cards.md) — `metric-cards` (KPI tile row)
- [chart-pie-guardrail.md](./references/chart-pie-guardrail.md) — `pie` (BANNED — auto-remaps to sorted `bar`)

### Cross-cutting infrastructure

- [chart-decision-matrix.md](./references/chart-decision-matrix.md) — **the data-shape → chart-type lookup**. Use this when you don't know which type to pick.
- [chart-palette-engine.md](./references/chart-palette-engine.md) — golden-angle palette + OKLCH sequential/diverging ramps.
- [chart-guardrails.md](./references/chart-guardrails.md) — enforced design rules (no pie, sparse gridlines, no D3, etc.).
- [chart-canvas-backend.md](./references/chart-canvas-backend.md) — the >100-mark auto-switch + Canvas hit-testing + a11y fallback list.
- [chart-selection-and-comments.md](./references/chart-selection-and-comments.md) — the `chart-point` atom contract: data-ve-* attributes, payload, comment-handle, decision-mini pill.
- [chart-animations-and-motion.md](./references/chart-animations-and-motion.md) — entry animations (growUp, draw-on, arc sweep, polygon inflate) + `prefers-reduced-motion`.
- [chart-tooltip-and-hover.md](./references/chart-tooltip-and-hover.md) — the singleton tooltip + hover-bridge anti-flicker pattern.
- [chart-error-degradation.md](./references/chart-error-degradation.md) — every failure mode + the visible error block.
- [chart-design-tokens.md](./references/chart-design-tokens.md) — complete `--vc-*` token reference.

### Meta + composition

- [chart-dashboard-recipes.md](./references/chart-dashboard-recipes.md) — 6 multi-chart compositions (status report, single-KPI hero, compare-N-approaches, funnel+cohort, regression hunt, sales pipeline).
- [chart-sparklines-and-inline.md](./references/chart-sparklines-and-inline.md) — small inline charts in prose / table cells / KPI tiles.
- [chart-public-api.md](./references/chart-public-api.md) — `window.amvcpChart` surface: `scan`, `render`, `parseFence`, `palette`, `ramp`, `niceTicks`, `describeArc`, `catmullRom`, `getSelection`, `registry`, `injectChartCSS`, test hook `window.__veChart`.
- [chartjs-integration.md](./references/chartjs-integration.md) — the legacy `veWireChart(chart, {id})` bridge for hand-built Chart.js charts (compatibility only — NEW work should use the fence protocol).

### Cross-skill

- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — the cross-cutting selection runtime + payload shape (chart-point atoms plug into this).
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-self-debug-rules/SKILL.md` — visual verification checklist; run it for every chart change (light + dark theme, no-nested-scrollbars, selection state, comment-handle mount).
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-design-tokens/` — DESIGN.md authoring; populates the `--vc-*` tokens the chart module reads.
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-animation/` — orthogonal motion primitives. Loading `amvcp-animation.js` enables count-up animation on `metric-cards` values; chart's own entry animations are self-contained.

## Visual verification

After authoring any chart, run [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — verify on both light + dark themes that:
- The chart renders (not an error block).
- No inner scrollbars (the figure / SVG / canvas are `overflow: visible`).
- Selection state on a clicked mark paints brighter with the accent stroke; the figure gets the outer ring; one comment-handle mounts at the left edge.
- The entry animation respects `prefers-reduced-motion`.
- Palette colors are distinct (golden-angle).
- The tooltip survives the pointer crossing from mark to tooltip (hover-bridge works).
