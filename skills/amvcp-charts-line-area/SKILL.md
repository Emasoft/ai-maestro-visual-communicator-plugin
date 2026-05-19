---
name: amvcp-charts-line-area
description: "Line-and-area chart family: line, area, step-area, slope, bump. Trend over time, before-vs-after for many items, and rank-over-time. Catmull-Rom smoothing, OKLCH gradient fills, orthogonal step paths. Use when the reader needs trends, ranks, or change-over-N-points. Trigger with 'line chart', 'area chart', 'step area', 'slope chart', 'bump chart', 'trend over time', 'rank over time', 'before vs after'."
license: MIT
compatibility: "Browser, Node 16+ for tests. Zero CDN. Loads alongside amvcp-designmd.js + amvcp-runtime.js. Standalone-safe (internal selection list)."
metadata:
  author: Emasoft
---

# Charts — Line + Area Family

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-charts-and-dashboards/SKILL.md`](../amvcp-charts-and-dashboards/SKILL.md). **Sibling chart skills:** [amvcp-charts-bar](../amvcp-charts-bar/SKILL.md) · [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md) · [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) · [amvcp-dashboards](../amvcp-dashboards/SKILL.md).

## Overview

The 5 chart types whose primary visual encoding is **a continuous path along an ordered axis**. Line shows trend over time; area adds a gradient fill below the line; step-area uses orthogonal steps for state-machine or stepped-quantity data; slope shows before/after for many items as two-column joined dots; bump shows rank-over-time.

The fence protocol, palette engine, selection contract, animations, tooltip, and error-degradation infrastructure live in the [amvcp-dashboards](../amvcp-dashboards/SKILL.md) sibling (cross-cutting infrastructure).

## Prerequisites

- Browser (Chromium via `--app=URL` preferred).
- Three scripts colocated with the HTML, loaded in order: `amvcp-designmd.js` → `amvcp-runtime.js` → `amvcp-chart.js`.
- The cross-cutting infrastructure lives in [amvcp-dashboards](../amvcp-dashboards/SKILL.md); load it for the fence protocol + palette engine.

## Instructions

1. **Pick the line/area variant.** Use the routing table below — match data shape to the right per-type ref.
2. **Author the fenced block.** Each ref shows the exact JSON shape. The envelope is always `{title, subtitle?, series:[{label, data:[...]}], options?, source?}`.
3. **State the insight in `title`.** "Sales doubled in Q2 then plateaued" — not "Sales over time". Required; missing fails loud.
4. **Let the palette + tokens flow.** Do NOT hardcode colors per spec — see the palette-engine reference in [amvcp-dashboards](../amvcp-dashboards/SKILL.md).
5. **Run:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" file.html` — or open in a browser.

| Reader needs to … | Best line/area variant | See |
|---|---|---|
| Trend over time (continuous data) | `line` (Catmull-Rom smooth) | [chart-line.md](./references/chart-line.md) |
| Trend with magnitude emphasis | `area` (line + OKLCH gradient fill) | [chart-area.md](./references/chart-area.md) |
| Stepped quantity / state machine | `step-area` (orthogonal step path) | [chart-step-area.md](./references/chart-step-area.md) |
| Before vs after for many items | `slope` (two-column joined dots) | [chart-slope.md](./references/chart-slope.md) |
| Rank over time | `bump` (lines tracking rank) | [chart-bump.md](./references/chart-bump.md) |

## Output

The fenced `<pre>` becomes a `<figure class="ve-chart" data-ve-chart-type="<type>" data-ve-chart-backend="svg|canvas" data-ve-id="ve-chart-N" data-ve-type="chart">`. Every point/segment is a `chart-point` atom that plugs into the runtime's multi-select / comment-modal / 3-state-pill machinery.

## Error Handling

- **Malformed JSON / missing title / missing series / unknown type / version too new** → degrades to a VISIBLE error block. Never silent.
- **>100 marks** → auto-switches to Canvas backend for `line` and `area`. Other types stay SVG.
- **Color literal hardcoded** → there is no `color` field on any datum; palette comes from tokens.

## Examples

**Input:** "Show daily revenue trend for the last month."

```chart:line@1
{ "title": "Daily revenue — last 30 days",
  "series": [{ "label": "USD", "data": [
    {"x":"D1","y":42},{"x":"D7","y":47},{"x":"D14","y":51},
    {"x":"D21","y":56},{"x":"D28","y":61}
  ] }] }
```

**Input:** "Show how 6 products rank in popularity from Q1 to Q4."

```chart:bump@1
{ "title": "Product popularity — rank by quarter",
  "series": [
    {"label":"Pro","data":[{"x":"Q1","y":1},{"x":"Q2","y":1},{"x":"Q3","y":2},{"x":"Q4","y":1}]},
    {"label":"Lite","data":[{"x":"Q1","y":3},{"x":"Q2","y":2},{"x":"Q3","y":1},{"x":"Q4","y":2}]},
    {"label":"Free","data":[{"x":"Q1","y":2},{"x":"Q2","y":3},{"x":"Q3","y":3},{"x":"Q4","y":3}]}
  ] }
```

## Modes

`data-ve-mode="readonly"` only. Lines and slopes are view-only visualizations. Use `amvcp-choice-tables` or `amvcp-form-inputs` when the user must choose a data point.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple line/area charts on one page get independent `data-ve-id` namespaces. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [chart-line.md](./references/chart-line.md) — `line` (Catmull-Rom smooth)
  > When to choose line · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Visual verification
- [chart-area.md](./references/chart-area.md) — `area` (line + OKLCH gradient fill)
  > When to choose area · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Area vs alternatives · Gradient details · The closed-path math · Multi-series area pitfalls · Visual verification
- [chart-step-area.md](./references/chart-step-area.md) — `step-area` (orthogonal step path)
  > When to choose step-area · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Step-area vs alternatives · Step direction — HV vs VH · Reading a step-area chart · Anti-patterns · Visual verification
- [chart-slope.md](./references/chart-slope.md) — `slope` (before/after slope chart)
  > When to choose slope · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Slope vs alternatives — comparison · Rank inversion visual · Slope chart layout — the inset · Color encoding strategies · Visual verification
- [chart-bump.md](./references/chart-bump.md) — `bump` (rank over time)
  > When to choose bump · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Bump vs alternatives · When the rank stays stable · Bump with magnitudes (alternative encoding) · Bump's downside — line tangle · Visual verification

## Cross-skill

- [amvcp-dashboards](../amvcp-dashboards/SKILL.md) — cross-cutting fence protocol, palette engine, selection contract, animations, tooltip, error degradation, public API.
- [amvcp-charts-and-dashboards](../amvcp-charts-and-dashboards/SKILL.md) — router that lists all 5 chart-family siblings.

## Visual verification

Run [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshots in BOTH light and dark themes after every chart change.
