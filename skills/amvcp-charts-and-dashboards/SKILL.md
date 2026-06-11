---
name: amvcp-charts-and-dashboards
description: "Router skill for charts and KPI dashboards — chart surface split into 5 focused siblings (bar, line-area, part-of-whole, multi-dim, dashboards). Use when the user wants ANY chart task (compare categories, trend over time, parts of a whole, multi-dim heatmap/waterfall/funnel, KPI grid, sparkline) to route to the right sibling. Trigger with 'chart', 'dashboard', 'KPI grid', 'sparkline', 'gauge', 'bullet chart', 'funnel', 'heatmap', 'metrics'. Pie charts auto-remap to sorted bars."
license: MIT
compatibility: "Browser, Node 16+ for tests. Zero CDN. Three scripts colocated with the HTML: amvcp-designmd.js + amvcp-runtime.js + amvcp-chart.js."
metadata:
  author: Emasoft
---

# Charts and Dashboards (Router)

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 visual categories.

## Overview

This is the **router** for the chart surface. The chart catalogue was split into 5 focused siblings so each sibling's embedded TOC fits naturally and progressive discovery works without per-link contortion. The router emits no markup itself — pick the right sibling per the table below.

## Prerequisites

- Browser (Chromium via `--app=URL` preferred; default browser fallback works).
- Three scripts colocated with the HTML, loaded in order: `amvcp-designmd.js` → `amvcp-runtime.js` → `amvcp-chart.js`.
- Always load [amvcp-dashboards](../amvcp-dashboards/SKILL.md) for cross-cutting infrastructure (fence protocol, palette engine, selection contract, animations, tooltip, error degradation, public API).

## Instructions

0. **Fast path** — read `${CLAUDE_PLUGIN_ROOT}/references/QUICKSTART-chart-dashboard.md` and start from `templates/chart-dashboard.html`; fill the FILL slots (replace the sample JSON in each fenced `chart:<type>@1` block) instead of authoring boilerplate. Copy `amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-chart.js` next to the page and open via `amvcp-select.py`.
1. Match the user's data shape to a row in the routing matrix.
2. Load the matched sibling SKILL.md (often one row covers it; combine when needed).
3. Always load [amvcp-dashboards](../amvcp-dashboards/SKILL.md) for the cross-cutting infrastructure (fence protocol, palette, selection contract, animations, tooltip, error degradation).
4. Follow the sibling's Instructions; come back to this router only to route a second concern.

## Output

The output is owned by the sibling skill. This router emits nothing.

## Error Handling

| Symptom | Fix |
|---|---|
| Don't know which sibling owns my need | Re-read the routing matrix; default to [amvcp-dashboards](../amvcp-dashboards/SKILL.md) when uncertain (it owns all cross-cutting infrastructure). |
| Need spans multiple siblings | Compose — load amvcp-dashboards first, then add the chart-family siblings as needed. |
| Pie chart spec | Auto-remapped to sorted `bar` by [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md). |

## Examples

```text
User: "Show this quarter's KPIs and a revenue trend on one page."
Route:
  - amvcp-dashboards           → metric-cards + dashboard composition
  - amvcp-charts-line-area     → the revenue trend line

User: "Make a heatmap of errors by weekday × hour."
Route:
  - amvcp-dashboards           → fence protocol + palette engine
  - amvcp-charts-multi-dim     → chart-heatmap.md
```

## Modes

Per-skill: see Resources. The router itself is mode-agnostic. All chart siblings support `data-ve-mode="readonly"` only — view-only visualizations.

## Composability

The 5 chart siblings compose freely with each other and with every other amvcp-* skill on the page (R22). Multiple charts/dashboards on one page get independent `data-ve-id` namespaces. The only exclusive skill is the overlay-runtime (R24).

## Resources

The 5 chart siblings — pick by data shape:

- [amvcp-charts-bar](../amvcp-charts-bar/SKILL.md) — bar-family: bar, stacked-bar, diverging-bar, lollipop, dot-plot, connected-dot-plot, bullet, segmented-bar (8 refs). Categorical magnitude comparison via length encoding.
- [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) — line-and-area family: line, area, step-area, slope, bump (5 refs). Trend over time, before-vs-after, rank-over-time.
- [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md) — sanctioned circular forms: donut, gauge, harvey-ball (+ pie-guardrail) (4 refs). Part-to-whole and value-vs-max.
- [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) — multi-dim charts: radar, heatmap, matrix, activity-heatmap, mekko, funnel, waterfall (7 refs). 2+ encoded dimensions or cumulative/process-flow narratives.
- [amvcp-dashboards](../amvcp-dashboards/SKILL.md) — KPI dashboards + the cross-cutting infrastructure every chart sibling depends on: metric-cards, sparklines, dashboard recipes, fence protocol, palette engine, selection contract, animations, tooltip, error degradation, design tokens, public API (15 refs).

### Routing matrix (data-shape → chart sibling)

| Reader needs to … | Sibling | Type |
|---|---|---|
| Compare magnitudes across categories | [amvcp-charts-bar](../amvcp-charts-bar/SKILL.md) | bar / lollipop / dot-plot |
| Trend over time | [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) | line / area / step-area |
| Before vs after for many items | [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) | slope / connected-dot-plot (bar bucket) |
| Rank over time | [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) | bump |
| Parts of a whole | [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md) | donut / segmented-bar (bar bucket) / mekko (multi-dim bucket) |
| Multi-criterion comparison | [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) | radar / harvey-ball (part-of-whole bucket) |
| Cumulative bridge | [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) | waterfall |
| Stage drop-off | [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) | funnel |
| 2-D intensity surface | [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) | heatmap / matrix / activity-heatmap |
| KPI dashboard | [amvcp-dashboards](../amvcp-dashboards/SKILL.md) | metric-cards |
| Value vs target | [amvcp-charts-bar](../amvcp-charts-bar/SKILL.md) | bullet |
| Single value vs max | [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md) | gauge |
| Inline tiny trend chart | [amvcp-dashboards](../amvcp-dashboards/SKILL.md) | sparkline |
| Multi-chart dashboard composition | [amvcp-dashboards](../amvcp-dashboards/SKILL.md) | dashboard recipes |

For the canonical data-shape → chart-type matrix (with comparison alternatives and "when alternative wins" notes), see `chart-decision-matrix.md` inside [amvcp-dashboards](../amvcp-dashboards/SKILL.md).

## Cross-skill

- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-self-debug-rules/SKILL.md` — visual verification checklist; run it for every chart change (light + dark theme, no-nested-scrollbars, selection state, comment-handle mount).
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-design-tokens/` — DESIGN.md authoring; populates the `--vc-*` tokens the chart module reads.
- `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-animation/` — orthogonal motion primitives. Loading `amvcp-animation.js` enables count-up animation on `metric-cards` values; chart's own entry animations are self-contained.

## Visual verification

After authoring any chart, run [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — verify on both light + dark themes.
