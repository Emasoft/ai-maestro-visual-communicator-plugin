---
name: amvcp-dashboards
description: "KPI dashboards plus the cross-cutting infrastructure every amvcp-charts-* sibling depends on: metric-cards, sparklines, dashboard recipes, fence protocol, palette engine, selection contract, animations, tooltip, error degradation, design tokens, public API. Use when composing dashboards, KPI grids, or needing chart-renderer contracts. Trigger with 'dashboard', 'KPI grid', 'metric card', 'sparkline', 'chart fence', 'chart palette', 'chart selection'."
license: MIT
compatibility: "Browser, Node 16+ for tests. Zero CDN. Loads alongside amvcp-designmd.js + amvcp-runtime.js. Standalone-safe (internal selection list)."
metadata:
  author: Emasoft
---

# Dashboards + Chart Infrastructure

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-charts-and-dashboards/SKILL.md`](../amvcp-charts-and-dashboards/SKILL.md). **Sibling chart skills:** [amvcp-charts-bar](../amvcp-charts-bar/SKILL.md) · [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) · [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md) · [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md).

## Overview

Two things in one skill: **(1) the dashboard primitives** — KPI metric-card rows, sparklines, dashboard composition recipes, and **(2) the cross-cutting chart-renderer infrastructure** every other amvcp-charts-* sibling depends on — fence protocol (the `chart:<type>@<version>` language tag), palette engine (golden-angle OKLCH + sequential/diverging ramps), selection contract (the `chart-point` atom + comment handle + decision pill), animations, tooltip, error degradation, design tokens, the public `window.amvcpChart` API.

Load this skill whenever you compose a multi-chart dashboard, render a KPI grid, or need to understand the chart-renderer's contracts to author/extend other chart types.

## Prerequisites

- Browser (Chromium via `--app=URL` preferred; default browser fallback works).
- Three scripts colocated with the HTML, loaded in this order: `amvcp-designmd.js` (themes the page) → `amvcp-runtime.js` (selection + comment + decision-pill infrastructure) → `amvcp-chart.js` (the chart renderer). Order is forgiving — `amvcp-chart.js` auto-inits on `DOMContentLoaded` unless `window.__vcManualInit` is set.

## Instructions

1. **Compose dashboards** by stacking multiple fenced blocks under a single page. Layout via a CSS Grid wrapper (`grid-template-columns: repeat(auto-fit, minmax(360px, 1fr))`). See [chart-dashboard-recipes.md](./references/chart-dashboard-recipes.md) for 6 canonical compositions (status report, hero + trend, compare-N-approaches, funnel + cohort, regression hunt, sales pipeline).
2. **Author KPI rows** with [chart-metric-cards.md](./references/chart-metric-cards.md) — single-row tile dashboards with delta+trend per KPI.
3. **Inline tiny trends** with [chart-sparklines-and-inline.md](./references/chart-sparklines-and-inline.md) — small inline charts in prose / table cells / KPI tiles.
4. **Need the fence protocol** for any chart? Read [chart-fence-protocol.md](./references/chart-fence-protocol.md) FIRST. It documents the `chart:<type>@<version>` language tag, JSON envelope, per-type schema map, validation gates, version policy, boot order.
5. **Use the palette engine** — never hardcode colors. See [chart-palette-engine.md](./references/chart-palette-engine.md).
6. **React to clicks.** Every datapoint emits the `chart-point` selection payload. See [chart-selection-and-comments.md](./references/chart-selection-and-comments.md).
7. **Run:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" file.html` — or just open the file in a browser.

## Output

Self-contained HTML: each fenced `<pre>` becomes a `<figure class="ve-chart" data-ve-chart-type="<type>" data-ve-chart-backend="svg|css|canvas|html" data-ve-id="ve-chart-N" data-ve-type="chart">`. Multiple charts compose into a dashboard via a CSS Grid wrapper. Every mark inside (a `<rect>`, `<circle>`, `<path>`, `<polygon>`, `<div>`, or `<li>` for Canvas a11y) carries `data-ve-id` / `data-ve-type="chart-point"` / `tabindex="0"` / `role="button"` plus the selection payload.

## Error Handling

- **Malformed JSON / missing title / missing series / unknown type / version too new** → degrades to a VISIBLE error block (danger banner with reason + original JSON kept verbatim). Never silent. See [chart-error-degradation.md](./references/chart-error-degradation.md).
- **Chart overflows the viewport** → forbidden inner scrollers. Every `.ve-chart`, `.ve-chart-svg`, `.ve-chart-canvas` is `overflow: visible`. Wide charts extend the page; the document's own scrollbar handles it.
- **Hover halo grey / palette feels wrong** → DESIGN.md is missing `--vc-color-accent` (or the dark variant). Fix the token, not the spec.
- **>100 marks** → auto-switches to Canvas backend for `bar`/`line`/`area`/`dot-plot`. See [chart-canvas-backend.md](./references/chart-canvas-backend.md).
- **Theme swap leaves Canvas stale** → call `amvcpChart.scan(document)` after the theme change; the scanner re-runs each Canvas's `__veChartRedraw()`.
- **Animation triggers vestibular distress** → all entry animations gate on `prefers-reduced-motion: reduce`. See [chart-animations-and-motion.md](./references/chart-animations-and-motion.md).

## Examples

**Input:** "Show this quarter's headline KPIs and a revenue trend on one page."

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

Both render on the same page; a click on the "Churn" card opens a comment modal scoped to that KPI.

## Modes

`data-ve-mode="readonly"` only. Dashboards and KPI cards are view-only visualizations. Use `amvcp-choice-tables` or `amvcp-form-inputs` when the user is being asked to choose a data point.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple charts/dashboards on one page are allowed; each gets an independent `data-ve-id` namespace. The only exclusive skill is the overlay-runtime (R24).

## Resources

### Dashboard primitives

- [chart-metric-cards.md](./references/chart-metric-cards.md) — `metric-cards` (KPI tile row)
  > When to choose metric-cards · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Visual verification
- [chart-sparklines-and-inline.md](./references/chart-sparklines-and-inline.md) — small inline charts in prose / table cells / KPI tiles
  > When to choose a sparkline · Authoring a sparkline · Inline single-point markers · Sparkline in a table cell · Inline in a metric card · Constraints · See also
- [chart-dashboard-recipes.md](./references/chart-dashboard-recipes.md) — 6 multi-chart compositions (status report, single-KPI hero, compare-N-approaches, funnel+cohort, regression hunt, sales pipeline)
  > Recipe 1 — Status report shape · Recipe 2 — Single-KPI hero + trend · Recipe 3 — Compare-N-approaches · Recipe 4 — Funnel + cohort retention · Recipe 5 — Performance regression hunt · Recipe 6 — Sales pipeline review · Layout guidance · See also

### Cross-cutting infrastructure

- [chart-fence-protocol.md](./references/chart-fence-protocol.md) — the `chart:<type>@<version>` language tag, JSON envelope, per-type schema map, validation gates, version policy, boot order. **READ THIS FIRST.**
  > The contract — one fenced block, one chart · Language tag grammar · The JSON envelope · Per-type schemas at a glance · Validation gates (fail-fast) · Versioning · Boot order · The `<figure>` the runtime emits · Choosing the right type — the decision matrix · See also
- [chart-decision-matrix.md](./references/chart-decision-matrix.md) — the data-shape → chart-type lookup
  > 1. Compare categories — how big is each? · 2. Trend over time · 3. Before vs after · 4. Parts of a whole · 5. Multi-criterion comparison · 6. Process flow with cumulative narrative · 7. Stage drop-off (funnel) · 8. 2-D intensity surface · 9. KPI dashboard · 10. Value vs target / threshold · 11. Rank-over-time · 12. Inline part-to-whole · Cross-cutting tips · See also
- [chart-palette-engine.md](./references/chart-palette-engine.md) — golden-angle palette + OKLCH sequential/diverging ramps
  > Categorical: the golden-angle palette · Sequential / diverging: OKLCH ramps · Accent extraction — `_accentLCH()` · Why no per-datum colors · Light + dark · Public API · See also
- [chart-guardrails.md](./references/chart-guardrails.md) — enforced design rules
  > Guardrail 1 — No pie charts · Guardrail 2 — Sparse horizontal gridlines only · Guardrail 3 — No vertical gridlines, ever · Guardrail 4 — No D3, no Plotly, no Chart.js · Guardrail 5 — Every chart needs an insight title · Guardrail 6 — No inner scrollbars · Guardrail 7 — Fail-fast, fail-visible · Guardrail 8 — Theme-driven colors, no hardcoded literals · Guardrail 9 — Motion respects `prefers-reduced-motion` · See also
- [chart-canvas-backend.md](./references/chart-canvas-backend.md) — the >100-mark auto-switch + Canvas hit-testing + a11y fallback list
  > When the switch fires · Which types are Canvas-capable · What changes for the user · Hit-testing · Accessibility — the hidden a11y list · Theme hot-swap on Canvas · Drawing model · Anti-patterns · See also
- [chart-selection-and-comments.md](./references/chart-selection-and-comments.md) — the `chart-point` atom contract
  > What a chart-point atom is · The selection payload shape · The DOM contract — `data-ve-*` attributes · The pointer + keyboard wiring · Selected-state styling · The per-figure group comment-handle · The 3-radio Skip/Approve/Deny decision-mini pill · The defensive standalone-mode fallback · `veWireChart` — the legacy Chart.js bridge · See also
- [chart-animations-and-motion.md](./references/chart-animations-and-motion.md) — entry animations + `prefers-reduced-motion`
  > Overview · The fire-once IntersectionObserver · The motion gate — `prefers-reduced-motion` · Per-type entry animations · Cross-cutting tokens · Test hooks · See also
- [chart-tooltip-and-hover.md](./references/chart-tooltip-and-hover.md) — singleton tooltip + hover-bridge anti-flicker
  > The singleton tooltip · The hover-bridge anti-flicker pattern · Click-to-lock · Positioning + viewport clamp · Native SVG `<title>` fallback · Canvas-side hover · Tooltip body shape · See also
- [chart-error-degradation.md](./references/chart-error-degradation.md) — every failure mode + the visible error block
  > Overview · The degrade function · Failure modes · What the error block looks like · Accessing the error reason programmatically · See also
- [chart-design-tokens.md](./references/chart-design-tokens.md) — complete `--vc-*` token reference
  > Color tokens · Type-scale tokens · Font-family tokens · Weight tokens · Spacing tokens · Radius tokens · Shadow tokens · Motion tokens · Z-index tokens · How DESIGN.md should populate these · See also
- [chart-public-api.md](./references/chart-public-api.md) — `window.amvcpChart` surface
  > The API surface · `scan(root)` · `render(spec, type, host)` · `parseFence(preEl)` · `palette(n)` · `ramp(t, mode)` · `niceTicks(min, max, count)` · `describeArc(cx, cy, rOuter, rInner, a0, a1)` · `catmullRom(points)` · `getSelection()` · `registry` · `injectChartCSS(doc)` · Test hook: `window.__veChart` · See also
- [chartjs-integration.md](./references/chartjs-integration.md) — legacy `veWireChart` bridge for hand-built Chart.js charts (compatibility only)
  > When to use `veWireChart` · Wiring Chart.js datapoint clicks · The selection payload — identical to native charts · Why prefer the fence protocol · Migration path: Chart.js → fence protocol · Hybrid pages · See also

## Cross-skill

- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — the cross-cutting selection runtime + payload shape (chart-point atoms plug into this).
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-self-debug-rules/SKILL.md` — visual verification checklist.
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-design-tokens/` — DESIGN.md authoring; populates the `--vc-*` tokens the chart module reads.
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-animation/` — orthogonal motion primitives. Loading `amvcp-animation.js` enables count-up animation on `metric-cards` values.

## Visual verification

After authoring any dashboard, run [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — verify on both light + dark themes.
