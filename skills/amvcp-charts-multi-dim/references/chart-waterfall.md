# `chart:waterfall@1` — waterfall (cumulative bridge)

## Table of Contents

- [When to choose waterfall](#when-to-choose-waterfall)
- [Authoring shape](#authoring-shape)
- [Options](#options)
- [Examples](#examples)
- [What the runtime emits](#what-the-runtime-emits)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens](#designmd-tokens)
- [Selection / atoms](#selection--atoms)
- [Anti-patterns](#anti-patterns)
- [Waterfall vs alternatives](#waterfall-vs-alternatives)
- [Intermediate subtotals](#intermediate-subtotals)
- [Connector dash pattern](#connector-dash-pattern)
- [Negative starting value](#negative-starting-value)
- [Visual verification](#visual-verification)

A McKinsey-staple chart that decomposes a START → END change into named
contributions. Each step is a vertical bar; rising contributions paint
success, falling contributions paint danger, totals paint accent. Dashed
connector lines link each step's top to the next step's base, so the
"bridge" reads as a literal cumulative narrative.

## When to choose waterfall

Use `waterfall` when:

- The story is a CUMULATIVE BRIDGE: "we started at X, then A added, then B subtracted, then C added, and we ended at Y."
- The reader needs to see WHICH STEPS were the largest contributors (positive or negative).
- The decomposition has 4-10 steps + totals (past 10, becomes hard to label).

Pick `stacked-bar` instead when the story is "the same total decomposes into
named parts per period" (no cumulative narrative).
Pick `bar` (diverging) instead when steps are INDEPENDENT contributions
that don't accumulate.

## Authoring shape

```chart:waterfall@1
{
  "title": "Q4 profit bridge ($M)",
  "subtitle": "Sales overshoot more than absorbed tax + cost overrun",
  "series": [{ "label": "bridge", "data": [
    {"x":"Start","delta":12},
    {"x":"Sales","delta":8},
    {"x":"Costs","delta":-5},
    {"x":"Tax","delta":-3},
    {"x":"End","isTotal":true}
  ] }]
}
```

- `data[k].x` — the step label.
- `data[k].delta` — the contribution at this step (can be negative).
- `data[k].isTotal:true` — marks the step as a CUMULATIVE TOTAL. The bar height = running total (not delta). Totals paint accent and start from y=0.

Convention:
- `data[0]` is usually "Start" with the starting value as a delta. The running total seeds from this delta.
- The last step is `isTotal:true` to show the final cumulative.
- Intermediate `isTotal:true` steps work too — useful for "Subtotal" markers in long waterfalls.

## Options

| Key | Default | Effect |
|---|---|---|
| _(none specific to waterfall)_ | | |

## Examples

### 1. Revenue bridge

```chart:waterfall@1
{ "title": "FY24 → FY25 revenue bridge ($M)",
  "series": [{ "label": "bridge", "data": [
    {"x":"FY24",       "delta":240},
    {"x":"Renewals",   "delta":42},
    {"x":"New logos",  "delta":58},
    {"x":"Churn",      "delta":-18},
    {"x":"Discounts",  "delta":-12},
    {"x":"FY25",       "isTotal":true}
  ] }] }
```

### 2. Build-time waterfall (regression hunt)

```chart:waterfall@1
{ "title": "Build-time bridge — last quarter (seconds)",
  "series": [{ "label": "bridge", "data": [
    {"x":"Baseline",       "delta":42},
    {"x":"+ esbuild",      "delta":-14},
    {"x":"+ cache layer",  "delta":-8},
    {"x":"+ new dep",      "delta":12},
    {"x":"+ source map",   "delta":4},
    {"x":"Current",        "isTotal":true}
  ] }] }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
  <g class="ve-chart-gridlines">…</g>
  <line class="ve-chart-baseline" x1="…" y1="(yScale(0))" x2="…" y2="(yScale(0))"/>
  <g class="ve-chart-waterfall">
    <!-- Per step: one <rect class="ve-chart-wf-bar (rise|fall|total)"> + optional connector. -->
    <rect class="ve-chart-wf-bar ve-chart-wf-bar--total"
          x="…" y="…" width="…" height="…"
          rx="var(--vc-radius-sm,4)"
          fill="var(--vc-color-accent, #b8861f)"
          data-ve-id="ve-chart-N-d0-i0"
          data-ve-type="chart-point" …>
      <title>Start: 12</title>
    </rect>
    <!-- Connector line to the next step's base. -->
    <line class="ve-chart-wf-connector" x1="…" y1="…" x2="…" y2="…"/>
    <rect class="ve-chart-wf-bar ve-chart-wf-bar--rise"
          fill="var(--vc-color-success, #3a6b5c)" …>
      <title>Sales: 8</title>
    </rect>
    <line class="ve-chart-wf-connector" …/>
    <rect class="ve-chart-wf-bar ve-chart-wf-bar--fall"
          fill="var(--vc-color-danger, #a84a32)" …>
      <title>Costs: -5</title>
    </rect>
    …
  </g>
  <g class="ve-chart-xlabels">…</g>
</svg>
```

The bar is a `chart-point` atom; the connector is decorative.

## Lib functions called

`_renderWaterfall(spec, fig)`:

- Walk the data once to compute each step's `base` and `top` values:
  - For a regular step: `base = running; running += delta; top = running`.
  - For an `isTotal:true` step: `base = 0; top = running`.
- y-domain `niceTicks(min(0, lo), hi, 4)` where `lo`/`hi` are the min/max
  across all `base` and `top` values (so neither overshooting positives nor
  deep negatives clip).
- Per step:
  - Class chain: `ve-chart-wf-bar` + one of `ve-chart-wf-bar--rise|fall|total`.
  - Fill: `--vc-color-accent` (total), `--vc-color-success` (rise), `--vc-color-danger` (fall).
  - `markPoint(bar, {value: isTotal ? top : delta, …})` — the atom's value is the delta for intermediate steps and the cumulative for totals.
- Connector lines between consecutive steps (skipped after the last).
- A `<line class="ve-chart-baseline">` at `yScale(0)`.

The connector CSS:
```css
.ve-chart-wf-connector { stroke-dasharray: 2 3; }
```

## DESIGN.md tokens

| Token | Used for |
|---|---|
| `--vc-color-accent` | Total-bar fill. |
| `--vc-color-success` | Rise-bar fill. |
| `--vc-color-danger` | Fall-bar fill. |
| `--vc-color-border-strong` | Connector stroke (dashed). |
| `--vc-radius-sm` | Bar corner radius. |

## Selection / atoms

Each waterfall bar is a `chart-point` atom (class `ve-chart-wf-bar`).
Selecting "Costs" gives the reader a thread on "the -5M cost contribution"
specifically.

## Anti-patterns

- **Missing the final `isTotal:true`.** The chart still renders, but the running total never resets — readers don't see the final destination. Always end with a total.
- **`delta` on an `isTotal:true` step.** Ignored (totals use the running cumulative). Pick one.
- **Mixing units.** All deltas must share a unit (dollars, seconds, count). A waterfall mixing $M with %s is meaningless.
- **Very short waterfalls (≤ 3 steps).** Use `bar` (diverging) — waterfall's connectors only pay off for a bridge of 4+ steps.

## Waterfall vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Cumulative bridge: A → +B → −C → end | `waterfall` | Connectors + rise/fall/total semantics. |
| Independent signed contributions | `diverging-bar` | No cumulation; signed bars side by side. |
| Period-over-period mix shift | `stacked-bar` | Same total decomposes per period. |
| Cohort retention curve | `funnel` | Sequential drop-off, not a bridge. |

The waterfall is uniquely suited to the BRIDGE NARRATIVE: "we started
at X. Then A happened (positive). Then B happened (negative). Then …
And we end at Y." Each step's contribution is named; the running total
threads through the entire chart.

## Intermediate subtotals

You can include INTERMEDIATE total bars by setting `isTotal:true` on
any step (not just the last):

```chart:waterfall@1
{ "title": "Q3 revenue bridge ($M)",
  "series": [{ "label": "bridge", "data": [
    {"x":"Start",     "delta":100},
    {"x":"New deals", "delta":24},
    {"x":"Renewals",  "delta":18},
    {"x":"Subtotal",  "isTotal":true},   // ← running total visible here
    {"x":"Churn",     "delta":-12},
    {"x":"Discounts", "delta":-8},
    {"x":"End",       "isTotal":true}
  ] }] }
```

The "Subtotal" bar paints accent (like the final total) and starts
from y=0. The connector from Subtotal to the next step still threads
to the right level.

Use intermediate subtotals for LONG waterfalls (8+ steps) where the
reader loses track of the running total mid-way.

## Connector dash pattern

The connector class is `.ve-chart-wf-connector`. The default style:

```css
.ve-chart-wf-connector { stroke-dasharray: 2 3; }
```

Dashed = "this is a derivation indicator, not data". The connector
LINKS the running totals; it's not a data line itself. Without the
dash, the connector would visually compete with the bars.

## Negative starting value

The `data[0]` step's `delta` is the starting value. It can be
negative (a deficit, a baseline below zero). The waterfall y-domain
auto-expands to include the negative starting point + every step's
extreme:

```chart:waterfall@1
{ "title": "Cash flow bridge ($M)",
  "series": [{ "label": "bridge", "data": [
    {"x":"Start",   "delta":-20},      // starting deficit
    {"x":"Sales",   "delta":42},
    {"x":"Costs",   "delta":-8},
    {"x":"End",     "isTotal":true}
  ] }] }
```

The `Start` bar drops below the zero baseline; the `Sales` bar rises
upward from -20 to +22; the `Costs` bar drops to +14; the `End` bar
sits at +14 as the running total.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: connector lines visible
but not dominant; rise/fall/total color semantics consistent on both themes;
baseline at y=0 is visible; intermediate subtotal bars paint as accent
(not as rise/fall); the running total chain reads continuously left-to-right
(each step's top connects to the next step's base via the dashed line).
