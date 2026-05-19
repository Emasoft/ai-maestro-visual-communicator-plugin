---
name: amvcp-charts-part-of-whole
description: "Part-to-whole charts: donut, gauge, harvey-ball. Sanctioned circular forms for part-of-whole ratios, value-vs-max gauges, and McKinsey-style qualitative rating rows. Pie charts banned (auto-remap to sorted bar). Use when the reader needs a ratio, a percentage gauge, or a qualitative rating glyph. Trigger with 'donut chart', 'gauge', 'harvey ball', 'part of whole', 'percentage gauge', 'qualitative rating', 'pie chart' (remapped)."
license: MIT
compatibility: "Browser, Node 16+ for tests. Zero CDN. Loads alongside amvcp-designmd.js + amvcp-runtime.js. Standalone-safe (internal selection list)."
metadata:
  author: Emasoft
---

# Charts — Part-of-Whole Family

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-charts-and-dashboards/SKILL.md`](../amvcp-charts-and-dashboards/SKILL.md). **Sibling chart skills:** [amvcp-charts-bar](../amvcp-charts-bar/SKILL.md) · [amvcp-charts-line-area](../amvcp-charts-line-area/SKILL.md) · [amvcp-charts-multi-dim](../amvcp-charts-multi-dim/SKILL.md) · [amvcp-dashboards](../amvcp-dashboards/SKILL.md).

## Overview

The 3 sanctioned part-of-whole circular charts. Donut is the canonical part-to-whole encoder (max 6 slices); gauge shows a single value vs max with optional warn/danger thresholds (semicircle arc); harvey-ball is the McKinsey-style qualitative rating glyph (one of 5 canonical fill states per row). Pie charts are BANNED and auto-remap to sorted `bar` — see `chart-pie-guardrail`.

The fence protocol, palette engine, selection contract, animations, tooltip, and error-degradation infrastructure live in the [amvcp-dashboards](../amvcp-dashboards/SKILL.md) sibling (cross-cutting infrastructure).

## Prerequisites

- Browser (Chromium via `--app=URL` preferred).
- Three scripts colocated with the HTML, loaded in order: `amvcp-designmd.js` → `amvcp-runtime.js` → `amvcp-chart.js`.
- The cross-cutting infrastructure lives in [amvcp-dashboards](../amvcp-dashboards/SKILL.md); load it for the fence protocol + palette engine.

## Instructions

1. **Pick the part-of-whole variant.** Use the routing table below — match data shape to the right per-type ref.
2. **Author the fenced block.** Each ref shows the exact JSON shape. The envelope is always `{title, subtitle?, series:[{label, data:[...]}], options?, source?}`.
3. **State the insight in `title`.** "Premium tier drove 64% of revenue" — not "Tier breakdown". Required; missing fails loud.
4. **Let the palette + tokens flow.** Do NOT hardcode colors per spec — see the palette-engine reference in [amvcp-dashboards](../amvcp-dashboards/SKILL.md).
5. **Run:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" file.html` — or open in a browser.

| Reader needs to … | Best part-of-whole variant | See |
|---|---|---|
| Part-of-whole breakdown (≤6 slices) | `donut` (hole in center for center text) | [chart-donut.md](./references/chart-donut.md) |
| Single value vs max + thresholds | `gauge` (semicircle arc, more-is-worse / more-is-better semantics) | [chart-gauge.md](./references/chart-gauge.md) |
| McKinsey qualitative rating row | `harvey-ball` (5 canonical fill states) | [chart-harvey-ball.md](./references/chart-harvey-ball.md) |
| Pie chart (BANNED) | auto-remapped to sorted `bar` | [chart-pie-guardrail.md](./references/chart-pie-guardrail.md) |

## Output

The fenced `<pre>` becomes a `<figure class="ve-chart" data-ve-chart-type="<type>" data-ve-chart-backend="svg" data-ve-id="ve-chart-N" data-ve-type="chart">`. Every slice / arc segment / ball is a `chart-point` atom that plugs into the runtime's multi-select / comment-modal / 3-state-pill machinery.

## Error Handling

- **Pie chart spec** → remapped to `chart:bar@1` with `sortDescending:true`. See [chart-pie-guardrail.md](./references/chart-pie-guardrail.md).
- **Malformed JSON / missing title / missing series / unknown type / version too new** → degrades to a VISIBLE error block. Never silent.
- **Donut with >6 slices** → consider switching to a sorted bar; donut becomes unreadable at high slice counts.
- **Color literal hardcoded** → there is no `color` field on any datum; palette comes from tokens.

## Examples

**Input:** "Show revenue tier breakdown."

```chart:donut@1
{ "title": "Premium drove 64% of revenue",
  "series": [{ "label": "tier", "data": [
    {"label":"Premium","value":64},
    {"label":"Standard","value":24},
    {"label":"Free","value":12}
  ] }] }
```

**Input:** "Show error budget burn this month."

```chart:gauge@1
{ "title": "Error budget burned",
  "series": [{ "label": "%", "data": [
    {"value": 72, "max": 100}
  ] }],
  "options": {"thresholds": {"warn": 50, "danger": 80}, "semantic": "more-is-worse"} }
```

**Input:** "Rate three vendors across delivery and quality."

```chart:harvey-ball@1
{ "title": "Vendor scorecard",
  "series": [{ "label": "row", "data": [
    {"label":"VendorA","value":1.0},
    {"label":"VendorB","value":0.5},
    {"label":"VendorC","value":0.25}
  ] }] }
```

## Modes

`data-ve-mode="readonly"` only. Donuts, gauges, and harvey balls are view-only visualizations. Use `amvcp-choice-tables` or `amvcp-form-inputs` when the user must choose a data point.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple donut/gauge/ball charts on one page get independent `data-ve-id` namespaces. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [chart-donut.md](./references/chart-donut.md) — `donut` (sanctioned circular form)
  > When to choose donut · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Donut vs alternatives · Center text customisation · Inner radius — why a hole · Slice order · Visual verification
- [chart-gauge.md](./references/chart-gauge.md) — `gauge` (single value vs max + warn/danger thresholds)
  > When to choose gauge · Authoring shape · Options · Semantics: more-is-worse vs more-is-better · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Gauge vs alternatives · Gauge geometry · Three threshold zones explained · Gauge size in a dashboard · Visual verification
- [chart-harvey-ball.md](./references/chart-harvey-ball.md) — `harvey-ball` (McKinsey qualitative rating row)
  > When to choose harvey-ball · Authoring shape · Options · Examples · What the runtime emits · Lib functions called · DESIGN.md tokens · Selection / atoms · Anti-patterns · Harvey-ball vs alternatives · The five canonical ball states · Multiple Harvey-ball rows (per-criterion comparison) · Auto-detected fraction vs percentage · Visual verification
- [chart-pie-guardrail.md](./references/chart-pie-guardrail.md) — `pie` (BANNED — auto-remaps to sorted `bar`)
  > Why no pie charts · What the runtime does · Example · When the author actually wants a circular form · Anti-patterns · Empirical evidence summary · What about lone Hyperframes-style guidance documents? · See also · Visual verification

## Cross-skill

- [amvcp-dashboards](../amvcp-dashboards/SKILL.md) — cross-cutting fence protocol, palette engine, selection contract, animations, tooltip, error degradation, public API.
- [amvcp-charts-and-dashboards](../amvcp-charts-and-dashboards/SKILL.md) — router that lists all 5 chart-family siblings.

## Visual verification

Run [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshots in BOTH light and dark themes after every chart change.
