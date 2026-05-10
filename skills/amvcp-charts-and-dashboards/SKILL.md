---
name: amvcp-charts-and-dashboards
description: "Author Chart.js dashboards and metric grids — bar, line, pie, area, doughnut, radar charts and KPI cards as self-contained interactive HTML. Use when the user asks for a chart, dashboard, metrics overview, KPI grid, sparkline, trend visualization, or any data-over-time/data-by-category visualization. Trigger: 'chart', 'dashboard', 'bar chart', 'line chart', 'pie chart', 'metrics', 'KPI grid', 'sparkline', 'metric trend'."
license: MIT
compatibility: "Chart.js v4+ via CDN. Browser + Python 3.12+ via amvcp-select.py."
metadata:
  author: Emasoft
---

# Charts and Dashboards

Self-contained Chart.js dashboards and KPI grids where every datapoint and card is clickable.

## When this skill loads

Triggers: "chart", "dashboard", "bar/line/pie/area/doughnut/radar chart", "metrics overview", "KPI grid", "sparkline", "metric trend", "data by category", "data over time", "stats page".

Sits on top of the universal selection contract in `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md`. Read that first — every page must wire the runtime, set `data-ve-id`, declare `--ve-accent`, and open via `scripts/amvcp-select.py`. Don't duplicate that boilerplate here.

## Quick decision: chart type → use case

| Chart type | Use when | Avoid when |
|---|---|---|
| **Bar** | Categorical comparison (revenue by region, errors by service) | Time series with >12 buckets |
| **Line** | Time series, trends, multi-series over a continuous axis | Categorical data with no order |
| **Pie / Doughnut** | Parts of a whole, ≤6 slices; single-KPI in the doughnut hole | >6 slices; non-additive data |
| **Area (stacked)** | Composition over time, cumulative contributions | Series that aren't additive |
| **Radar** | Multi-dimensional profile on 5–8 axes | More than 8 axes (unreadable) |

For simple sparklines or progress bars skip Chart.js — inline SVG `<polyline>` or CSS `linear-gradient` per `${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md`.

## How to author

1. **Pick chart types** from the table. Mix multiple blocks freely; don't force one type to do two jobs.
2. **Design KPI cards** with varied visual weight — 1–2 hero metrics (large number, accent, sparkline) plus 4–6 supporting cards. See "KPI/metric cards" in `css-patterns.md`.
3. **Wire Chart.js + selection.** Build the `Chart` (config in `libraries.md` Chart.js section), then `veWireChart(chart, { id })`. Clicks become a `chart-point` selection. Payload schema: `./references/chartjs-integration.md`.
4. **Open with the runner:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`.
5. **React to the selection** — click returns `{ chartId, datasetLabel, xLabel, value }`. Acknowledge the datapoint by label and value, then ask what to do.

## Mandatory wiring

- **`veWireChart(chart, { id })`** — never roll your own `onClick`. Manual handlers break multi-select and hover-glow.
- **CSS Grid with `min-width: 0`** on every grid child wrapping a canvas — without it charts overflow narrow viewports. See "Overflow Protection" + "Grid layouts" in `css-patterns.md`.
- **Theme-aware colours.** Read `prefers-color-scheme` once at script start; pass distinct light/dark hex for backgrounds, borders, text, grid lines (pattern in `libraries.md`).
- **Palette + typography** from `styling-guide.md` — never violet/cyan/magenta accents.

## Resources

Plugin-level (`${CLAUDE_PLUGIN_ROOT}/references/`):

- `interactive-selection-base.md` — wire format + boilerplate.
- `libraries.md` — Chart.js CDN + theming.
- `css-patterns.md` — KPI cards, dashboard grids, sparkline SVG, overflow.
- `styling-guide.md` — palette, typography, hierarchy.
- `diagram-types.md` — Dashboard / Metrics Overview section.
- `anti-patterns.md` — slop test.

Skill-local (`./references/`):

- `chartjs-integration.md` — `veWireChart` contract + click payload.

## Anti-patterns

- **Pie chart with >6 slices** — angles below ~15° collide. Use a horizontal bar chart.
- **Identically-styled KPI cards** — uniform grids signal AI-template output. Vary weight: hero (large number, accent border, sparkline) vs supporting (smaller, muted).
- **Animated glowing box-shadows** (`@keyframes glow`, pulsing `box-shadow`) — slop tell. Use static borders.
- **Gradient text on KPI numbers** (`background-clip: text` on `linear-gradient`) — slop tell, fails contrast. Solid accent colour, bold weight.
- **Charts without `min-width: 0`** on the grid child — canvas overflows the viewport on narrow widths.
