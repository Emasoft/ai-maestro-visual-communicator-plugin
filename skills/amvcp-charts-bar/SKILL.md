---
name: amvcp-charts-bar
description: "Bar-family charts: bar, stacked-bar, diverging-bar, lollipop, dot-plot, connected-dot-plot, bullet, segmented-bar. Categorical magnitude comparison via length encoding. Use when the reader compares magnitudes across a small set of named categories, signed values, before/after pairs, or KPI vs target. Trigger with 'bar chart', 'stacked bar', 'diverging bar', 'lollipop', 'dot plot', 'connected dot plot', 'bullet chart', 'segmented bar', 'compare categories'."
license: MIT
compatibility: "Browser, Node 16+ for tests. Zero CDN. Loads alongside amvcp-designmd.js + amvcp-runtime.js. Standalone-safe (internal selection list)."
metadata:
  author: Emasoft
---

# Charts — Bar Family

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-charts-and-dashboards/SKILL.md`](../amvcp-charts-and-dashboards/SKILL.md). **Sibling chart skills:** [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) · [amvcp-charts-part-of-whole](../amvcp-charts-part-of-whole/SKILL.md) · [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) · [amvcp-dashboards](../amvcp-dashboards/SKILL.md).

## Overview

The 8 bar-family chart types — every variant whose primary visual encoding is **length along a category axis**. Bars compare magnitudes across categories; lollipops/dots compare with lower ink; connected-dot-plot pairs before/after; bullet compares value vs target; segmented-bar shows a CSS-flex part-to-whole; stacked-bar adds a second dimension via stacking; diverging-bar signs the magnitude success/danger.

The fence protocol, palette engine, selection contract, animations, tooltip, and error-degradation infrastructure live in the [amvcp-dashboards](../amvcp-dashboards/SKILL.md) sibling (cross-cutting infrastructure).

## Prerequisites

- Browser (Chromium via `--app=URL` preferred).
- Three scripts colocated with the HTML, loaded in order: `amvcp-designmd.js` → `amvcp-runtime.js` → `amvcp-chart.js`.
- The cross-cutting infrastructure lives in [amvcp-dashboards](../amvcp-dashboards/SKILL.md); load it for the fence protocol + palette engine.

## Instructions

1. **Pick the bar variant.** Use the routing table below — match data shape to the right per-type ref.
2. **Author the fenced block.** Each ref shows the exact JSON shape. The envelope is always `{title, subtitle?, series:[{label, data:[...]}], options?, source?}`.
3. **State the insight in `title`.** "Q4 was the strongest in 3 years" — not "Revenue chart". Required; missing fails loud.
4. **Let the palette + tokens flow.** Do NOT hardcode colors per spec — see the palette-engine reference in [amvcp-dashboards](../amvcp-dashboards/SKILL.md).
5. **Run:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" file.html` — or open in a browser.

| Reader needs to … | Best bar variant | See |
|---|---|---|
| Compare magnitudes across categories | `bar` (sorted) | [chart-bar.md](./references/chart-bar.md) |
| Two-dimensional categorical comparison | `stacked-bar` | [chart-stacked-bar.md](./references/chart-stacked-bar.md) |
| Signed values (positive vs negative) | `diverging-bar` | [chart-diverging-bar.md](./references/chart-diverging-bar.md) |
| Lower-ink magnitude comparison | `lollipop` | [chart-lollipop.md](./references/chart-lollipop.md) |
| De-emphasise y=0 baseline | `dot-plot` | [chart-dot-plot.md](./references/chart-dot-plot.md) |
| Before vs after for many items | `connected-dot-plot` | [chart-connected-dot-plot.md](./references/chart-connected-dot-plot.md) |
| KPI value vs target + qualitative range | `bullet` | [chart-bullet.md](./references/chart-bullet.md) |
| CSS-flex part-to-whole (single bar) | `segmented-bar` | [chart-segmented-bar.md](./references/chart-segmented-bar.md) |

## Output

The fenced `<pre>` becomes a `<figure class="ve-chart" data-ve-chart-type="<type>" data-ve-chart-backend="svg|css|canvas" data-ve-id="ve-chart-N" data-ve-type="chart">` (`css` is the segmented-bar CSS-flex backend; `canvas` is the >100-mark auto-switch for `bar`/`dot-plot`). Every bar/stem/dot/segment is a `chart-point` atom that plugs into the runtime's multi-select / comment-modal / 3-state-pill machinery.

## Error Handling

- **Malformed JSON / missing title / missing series / unknown type / version too new** → degrades to a VISIBLE error block. Never silent.
- **>100 marks** → auto-switches to Canvas backend for `bar` and `dot-plot`. Other types stay SVG.
- **Color literal hardcoded** → there is no `color` field on any datum; palette comes from tokens.

## Examples

**Input:** "Show revenue by region this quarter."

```chart:bar@1
{ "title": "Revenue by region — Q4",
  "series": [{ "label": "USD", "data": [
    {"x":"EMEA","y":42},{"x":"AMER","y":58},
    {"x":"APAC","y":31},{"x":"LATAM","y":18}
  ] }],
  "options": {"sortDescending": true} }
```

**Input:** "Show NPS change by team — winners and losers."

```chart:diverging-bar@1
{ "title": "NPS delta by team — Q3 to Q4",
  "series": [{ "label": "Δ NPS", "data": [
    {"x":"Sales","y":+8},{"x":"Support","y":-3},
    {"x":"Eng","y":+5},{"x":"Ops","y":-1}
  ] }] }
```

## Modes

`data-ve-mode="readonly"` only. Bars and bullets are view-only visualizations. Use `amvcp-choice-tables` or `amvcp-form-inputs` when the user must choose a data point.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple bar charts on one page get independent `data-ve-id` namespaces. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [chart-bar.md](./references/chart-bar.md) — `bar` (single/grouped, sort, value labels)
  > When to choose `bar` · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens used · Selection / comments / decision-mini · Anti-patterns and pitfalls · Visual verification
- [chart-stacked-bar.md](./references/chart-stacked-bar.md) — `stacked-bar`
  > When to choose stacked-bar · Authoring shape · Options · Example — 100% stacked bar (manual normalisation) · What the runtime emits · Lib functions called · Selection / atoms · DESIGN.md tokens · Stacked-bar variants · Anti-patterns · How to read the stacked-bar visually · Visual verification
- [chart-diverging-bar.md](./references/chart-diverging-bar.md) — `diverging-bar` (signed values, success/danger fill)
  > When to choose diverging-bar · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens (in addition to bar's) · Selection · Diverging-bar vs alternatives · Semantic palette swap for colorblind audiences · Zero baseline behavior · Sort + sign combinations · Anti-patterns · Visual verification
- [chart-lollipop.md](./references/chart-lollipop.md) — `lollipop` (stem + head)
  > When to choose lollipop · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Lollipop vs alternatives · When lollipop beats bar · When lollipop loses to bar · Multi-series lollipop · Stem styling overrides · Visual verification
- [chart-dot-plot.md](./references/chart-dot-plot.md) — `dot-plot` (single value markers)
  > When to choose dot-plot · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Dot-plot vs alternatives — comparison table · When dot-plot wins over lollipop · Grouping nuances — horizontal spread within a band · Anti-patterns · Visual verification
- [chart-connected-dot-plot.md](./references/chart-connected-dot-plot.md) — `connected-dot-plot` (before/after pairs joined)
  > When to choose connected-dot-plot · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Connected-dot-plot vs alternatives · Reading direction · Connector + value-label combo · Visual verification
- [chart-bullet.md](./references/chart-bullet.md) — `bullet` (KPI vs target + qualitative range)
  > Overview · When to choose bullet · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Bullet vs alternatives · The three layers explained · When to set `range > target` · Bullet for "lower is better" metrics · Visual verification
- [chart-segmented-bar.md](./references/chart-segmented-bar.md) — `segmented-bar` (CSS-flex part-to-whole)
  > When to choose segmented-bar · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Visual verification

## Cross-skill

- [amvcp-dashboards](../amvcp-dashboards/SKILL.md) — cross-cutting fence protocol, palette engine, selection contract, animations, tooltip, error degradation, public API.
- [amvcp-charts-and-dashboards](../amvcp-charts-and-dashboards/SKILL.md) — router that lists all 5 chart-family siblings.

## Visual verification

Run [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshots in BOTH light and dark themes after every chart change.
