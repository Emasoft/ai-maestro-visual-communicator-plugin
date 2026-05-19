---
name: amvcp-charts-multi-dim
description: "Multi-dimensional charts: radar, heatmap, matrix, activity-heatmap, mekko, funnel, waterfall. Two-axis intensity surfaces, multi-criterion polygons, Marimekko width-by-total stacks, cumulative bridges, and stage drop-off. Use when the data has 2+ encoding axes or a process-flow narrative. Trigger with 'radar', 'heatmap', 'matrix', 'activity heatmap', 'GitHub calendar', 'mekko', 'marimekko', 'funnel', 'waterfall', 'cumulative bridge', 'drop off'."
license: MIT
compatibility: "Browser, Node 16+ for tests. Zero CDN. Loads alongside amvcp-designmd.js + amvcp-runtime.js. Standalone-safe (internal selection list)."
metadata:
  author: Emasoft
---

# Charts — Multi-Dimensional Family

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-charts-and-dashboards/SKILL.md`](../amvcp-charts-and-dashboards/SKILL.md). **Sibling chart skills:** [amvcp-charts-bar](../amvcp-charts-bar/SKILL.md) · [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) · [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md) · [amvcp-dashboards](../amvcp-dashboards/SKILL.md).

## Overview

The 7 chart types whose visual carries **two or more encoded dimensions**, or whose narrative is **cumulative / process-flow**. Radar plots multi-criterion comparison on N axes; heatmap/matrix/activity-heatmap encode a 2-D intensity surface via OKLCH ramp; mekko (Marimekko) shows part-of-whole inside columns whose widths encode another total; funnel shows stage drop-off; waterfall shows a cumulative bridge with rise/fall/total bars.

The fence protocol, palette engine, selection contract, animations, tooltip, and error-degradation infrastructure live in the [amvcp-dashboards](../amvcp-dashboards/SKILL.md) sibling (cross-cutting infrastructure).

## Prerequisites

- Browser (Chromium via `--app=URL` preferred).
- Three scripts colocated with the HTML, loaded in order: `amvcp-designmd.js` → `amvcp-runtime.js` → `amvcp-chart.js`.
- The cross-cutting infrastructure lives in [amvcp-dashboards](../amvcp-dashboards/SKILL.md); load it for the fence protocol + palette engine.

## Instructions

1. **Pick the multi-dim variant.** Use the routing table below — match data shape to the right per-type ref.
2. **Author the fenced block.** Each ref shows the exact JSON shape. The envelope is always `{title, subtitle?, series:[{label, data:[...]}], options?, source?}`.
3. **State the insight in `title`.** "Thursday-evening errors dominate the week" — not "Error heatmap". Required; missing fails loud.
4. **Let the palette + tokens flow.** Do NOT hardcode colors per spec — see the palette-engine reference in [amvcp-dashboards](../amvcp-dashboards/SKILL.md).
5. **Run:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" file.html` — or open in a browser.

| Reader needs to … | Best multi-dim variant | See |
|---|---|---|
| Multi-criterion comparison (N axes) | `radar` (polygon, inflate animation) | [chart-radar.md](./references/chart-radar.md) |
| 2-D intensity surface (rows × cols) | `heatmap` (OKLCH ramp, logScale option) | [chart-heatmap.md](./references/chart-heatmap.md) |
| Heatmap + per-cell value glyph | `matrix` | [chart-matrix.md](./references/chart-matrix.md) |
| GitHub-style calendar grid | `activity-heatmap` | [chart-activity-heatmap.md](./references/chart-activity-heatmap.md) |
| Width × stacked share (two dims) | `mekko` (Marimekko) | [chart-mekko.md](./references/chart-mekko.md) |
| Stage drop-off | `funnel` | [chart-funnel.md](./references/chart-funnel.md) |
| Cumulative bridge with rise/fall/total | `waterfall` | [chart-waterfall.md](./references/chart-waterfall.md) |

## Output

The fenced `<pre>` becomes a `<figure class="ve-chart" data-ve-chart-type="<type>" data-ve-chart-backend="svg" data-ve-id="ve-chart-N" data-ve-type="chart">`. Every cell / segment / axis / bar is a `chart-point` atom that plugs into the runtime's multi-select / comment-modal / 3-state-pill machinery.

## Error Handling

- **Malformed JSON / missing title / missing series / unknown type / version too new** → degrades to a VISIBLE error block. Never silent.
- **Heatmap data wash-out** → set `options.logScale: true` to compress an outlier-dominated distribution.
- **Color literal hardcoded** → there is no `color` field on any datum; palette comes from tokens.

## Examples

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

## Modes

`data-ve-mode="readonly"` only. Multi-dim charts are view-only visualizations. Use `amvcp-choice-tables` or `amvcp-form-inputs` when the user must choose a data point.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple multi-dim charts on one page get independent `data-ve-id` namespaces. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [chart-radar.md](./references/chart-radar.md) — `radar` (multi-axis polygon, inflate animation)
  > When to choose radar · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Visual verification
- [chart-heatmap.md](./references/chart-heatmap.md) — `heatmap` (OKLCH sequential / diverging ramp; logScale)
  > When to choose heatmap · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Visual verification
- [chart-matrix.md](./references/chart-matrix.md) — `matrix` (heatmap + per-cell value glyph)
  > When to choose matrix · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Visual verification
- [chart-activity-heatmap.md](./references/chart-activity-heatmap.md) — `activity-heatmap` (GitHub-style calendar)
  > When to choose activity-heatmap · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · When `activity-heatmap` vs `heatmap` semantically · Conventional row count · Cell shape · The decay-canvas variant (out of scope) · Color schema variations · Visual verification
- [chart-mekko.md](./references/chart-mekko.md) — `mekko` (Marimekko — column width by total + internal 100% stack)
  > When to choose mekko · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Mekko vs alternatives — the two-encoding test · How to read a mekko chart · Mekko design rule — sort by descending column total · Mekko with negative segments · Visual verification
- [chart-funnel.md](./references/chart-funnel.md) — `funnel` (drop-off stages)
  > When to choose funnel · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Funnel vs alternatives — comparison · Funnel + drop-off pattern · Reverse funnel (amplification) · Funnel with custom colors · Visual verification
- [chart-waterfall.md](./references/chart-waterfall.md) — `waterfall` (cumulative bridge)
  > When to choose waterfall · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Waterfall vs alternatives · Intermediate subtotals · Connector dash pattern · Negative starting value · Visual verification

## Cross-skill

- [amvcp-dashboards](../amvcp-dashboards/SKILL.md) — cross-cutting fence protocol, palette engine, selection contract, animations, tooltip, error degradation, public API.
- [amvcp-charts-and-dashboards](../amvcp-charts-and-dashboards/SKILL.md) — router that lists all 5 chart-family siblings.

## Visual verification

Run [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshots in BOTH light and dark themes after every chart change.
