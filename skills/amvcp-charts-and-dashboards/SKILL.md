---
name: amvcp-charts-and-dashboards
description: "Author Chart.js dashboards and KPI grids — bar, line, pie, area, doughnut, radar charts plus metric cards as self-contained interactive HTML. Use when the user asks for a chart, dashboard, metrics overview, KPI grid, sparkline, or trend visualization. Trigger with 'chart', 'dashboard', 'bar/line/pie chart', 'metrics', 'KPI grid', 'sparkline'."
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

1. **Pick chart type.** Bar = compare; Line = trend; Pie/Doughnut ≤6 slices; Area = stacked time; Radar = 5–8 axes. Sparklines + progress bars inline SVG.
2. **Design KPI cards** with varied weight: 1–2 hero metrics + 4–6 supporting. Never uniform grids.
3. **Wire Chart.js.** Build `Chart`, then `veWireChart(chart, { id })`.
4. **Layout.** CSS Grid with `min-width: 0` on every canvas wrapper. Read `prefers-color-scheme` once.
5. **Run:** `python3 $CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py file.html`
6. **React.** Click returns `{chartId, datasetLabel, xLabel, value}`.

## Output

Self-contained HTML: inline CSS, Chart.js CDN, selection runtime, `data-ve-id` on every canvas/card. Runner prints JSON on click — `{kind, count, selections:[{id, type:"chart-point", label, data:{...}}]}`.

## Error Handling

- **Chart overflows** → grid child missing `min-width: 0`.
- **Hover halo grey** → set `--ve-accent` on `:root`.
- **Pie unreadable** → >6 slices. Use horizontal bar.
- **KPI grid templated** → uniform cards. Promote 1–2 to hero.
- **No click fires** → custom `onClick` instead of `veWireChart`. Remove.

## Examples

**Input:** "Dashboard with 3 KPIs + revenue trend." CSS Grid: one hero KPI + sparkline, two supporting cards, wider Chart.js `line`. `veWireChart(chart, { id: 'revenue' })`.
**Output:** Click March → `{type:"chart-point", label:"Revenue · Mar", data:{xLabel:"Mar", value:45200}}`. Agent: "Mar revenue $45.2k — break it down by region?"

## Resources

- [interactive-selection-base.md](../../references/interactive-selection-base.md) — runtime contract, payload, marking
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [css-patterns.md](../../references/css-patterns.md) — sparklines, KPI cards, grids, overflow
  - Theme & Atmosphere
  - Layout & Containers
  - Content Blocks
  - Visual Components
  - Prose Page Elements
- [libraries.md](../../references/libraries.md) — Chart.js CDN, Google Fonts
  - Mermaid.js — Diagramming Engine
  - Chart.js — Data Visualizations
  - anime.js — Orchestrated Animations
  - Google Fonts — Typography
- [diagram-types.md](../../references/diagram-types.md) — dashboard/metrics overview
  - Diagrams (Mermaid + CSS)
  - Data Visualizations
  - Documentation Layouts
  - Prose Accent Elements
- [chartjs-integration.md](./references/chartjs-integration.md) — datapoint click wiring
  - Wiring Chart.js datapoint clicks to the selection runtime
