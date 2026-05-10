---
name: amvcp-charts-and-dashboards
description: "Author Chart.js dashboards and KPI grids — bar, line, pie, area, doughnut, radar charts plus metric cards as self-contained interactive HTML. Use when the user asks for a chart, dashboard, metrics overview, KPI grid, sparkline, or trend visualization. Trigger with: 'chart', 'dashboard', 'bar/line/pie chart', 'metrics', 'KPI grid', 'sparkline'."
license: MIT
compatibility: "Chart.js v4+ via CDN. Browser + Python 3.12+ via amvcp-select.py."
metadata:
  author: Emasoft
---

# Charts and Dashboards

## Overview

Loads on requests for a chart, dashboard, KPI grid, sparkline, or metrics overview. Produces one self-contained `.html` with Chart.js v4 plus the selection runtime — every datapoint and card posts back as JSON.

## Prerequisites

- Chart.js v4+ from CDN.
- Chromium browser (falls back to default).
- Python 3.12+ for `scripts/amvcp-select.py`.
- Page MUST wire the runtime, set `data-ve-id`, declare `--ve-accent`, open via runner. See Resources for the base contract.

## Instructions

1. **Pick chart type.** Bar = categorical compare; Line = trend; Pie/Doughnut = parts of whole, ≤6 slices; Area = stacked over time; Radar = 5–8 axes. Sparklines and progress bars use inline SVG. See css-patterns for sparklines, KPI cards, grid layouts, overflow protection.
2. **Design KPI cards** with varied weight: 1–2 hero metrics (large number, accent border, sparkline) plus 4–6 supporting. Never uniform grids.
3. **Wire Chart.js.** Build the `Chart`, then `veWireChart(chart, { id })`. CDN + theming in libraries; click payload in chartjs-integration.
4. **Layout.** CSS Grid with `min-width: 0` on every child wrapping a canvas. Read `prefers-color-scheme` once; pass light/dark hex for bg, borders, text, grid. See diagram-types for dashboard/metrics overview.
5. **Run:** `python3 $CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py file.html`
6. **React.** Click returns `{chartId, datasetLabel, xLabel, value}`. Acknowledge by label and value, then ask what to do.

## Output

Self-contained HTML: inline CSS, Chart.js CDN, selection runtime, `data-ve-id` on every canvas and card. Runner serves locally, opens Chrome `--app=URL`, prints JSON on click — `{kind, count, selections:[{id, type:"chart-point", label, data:{...}}]}`.

## Error Handling

- **Chart overflows viewport** → grid child missing `min-width: 0`.
- **Hover halo grey, not accent** → set `--ve-accent` on `:root` (light + dark).
- **Pie unreadable / slices collide** → >6 slices. Use horizontal bar.
- **KPI grid AI-templated** → uniform cards. Promote 1–2 to hero, demote rest.
- **Selection low-contrast** → set `--ve-sel-text` on `:root`.
- **No click fires** → custom `onClick` instead of `veWireChart`. Remove it.

## Examples

**1. Dashboard with 3 KPIs + revenue trend.** CSS Grid: one hero KPI (large number + sparkline), two supporting cards, wider Chart.js `line` of monthly revenue. `data-ve-id` on cards; `veWireChart(chart, { id: 'revenue' })`. Clicking March posts `{type:"chart-point", label:"Revenue · Mar", data:{xLabel:"Mar", value:45200}}`. Agent: "Mar revenue $45.2k — break it down by region?"

**2. Error counts by service.** Chart.js `bar` (>12 services → horizontal bar). Theme colours from `prefers-color-scheme`. `veWireChart(chart, { id: 'errors' })`. User clicks `auth-svc` → agent gets `xLabel:"auth-svc", value:148` and asks whether to pull the log slice.

## Resources

- [interactive-selection-base.md](../../references/interactive-selection-base.md) — runtime contract, payload, marking
- [css-patterns.md](../../references/css-patterns.md) — sparklines, KPI cards, grids, overflow
- [libraries.md](../../references/libraries.md) — Chart.js CDN, Google Fonts
- [diagram-types.md](../../references/diagram-types.md) — dashboard/metrics overview
- [chartjs-integration.md](./references/chartjs-integration.md) — datapoint click wiring
