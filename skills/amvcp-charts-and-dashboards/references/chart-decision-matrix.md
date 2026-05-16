# Decision matrix — data shape → recommended chart type

The single most important authoring question is "which type do I pick?".
This file is the long-form answer; the short-form lives in
`chart-fence-protocol.md#choosing-the-right-type--the-decision-matrix`.

The matrix is organised by the question the chart answers, then by data
shape. Pick the chart that matches your question; if multiple match,
prefer the FIRST recommendation (the others are alternatives).

## Table of contents

- [1. Compare categories — how big is each?](#1-compare-categories--how-big-is-each)
- [2. Trend over time](#2-trend-over-time)
- [3. Before vs after](#3-before-vs-after)
- [4. Parts of a whole](#4-parts-of-a-whole)
- [5. Multi-criterion comparison](#5-multi-criterion-comparison)
- [6. Process flow with cumulative narrative](#6-process-flow-with-cumulative-narrative)
- [7. Stage drop-off (funnel)](#7-stage-drop-off-funnel)
- [8. 2-D intensity surface](#8-2-d-intensity-surface)
- [9. KPI dashboard](#9-kpi-dashboard)
- [10. Value vs target / threshold](#10-value-vs-target--threshold)
- [11. Rank-over-time](#11-rank-over-time)
- [12. Inline part-to-whole](#12-inline-part-to-whole)

---

## 1. Compare categories — how big is each?

Data shape: one or many `(category, value)` pairs.

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `bar` (sort desc) | `lollipop` | Many categories (10-30) and you want low visual ink. |
|  | `dot-plot` | Even lower ink than lollipop; rank > magnitude. |
|  | `bullet` | Each category has an associated TARGET. |

`bar` is the default for almost any "compare categories" question.

## 2. Trend over time

Data shape: a series of `(time, value)` pairs.

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `line` (smooth) | `area` | You want magnitude UNDER the curve emphasised. |
|  | `step-area` | The value JUMPS discretely between measurements (balance, tier, inventory state). |
|  | `bar` | x is CATEGORICAL (named buckets, not a true timeline). |
|  | `bump` | The y-axis is a RANK rather than a magnitude. |

`line` is the default; pick `area` when the chart is the page's
centerpiece and visual weight matters.

## 3. Before vs after

Data shape: each item has 2 values (Before, After).

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `connected-dot-plot` | `slope` | Many series (10-50), few x positions. |
|  | `bar` (grouped 2-series) | Few series, absolute values matter more than direction. |
|  | `waterfall` | The story is "X plus / minus contributions equals Y". |

`connected-dot-plot` is best when readers need to see DIRECTION (each
arrow shows which way the value moved); `slope` is best when readers
need to compare MANY series' shifts at once.

## 4. Parts of a whole

Data shape: a single set of values that sum to a meaningful total.

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `donut` | `segmented-bar` | Inline / dense layout context. |
|  | `bar` (sort desc) | Readers need to compare slice values precisely. |
|  | `mekko` | You have MULTIPLE part-to-whole columns side by side. |
| **NEVER** | `pie` | Banned — remaps to `bar`. |

`donut` is the sanctioned circular form. For inline (in a card, a stat
tile), `segmented-bar`. For precise comparison, `bar`.

## 5. Multi-criterion comparison

Data shape: items × criteria matrix where each cell is a magnitude /
rating.

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `radar` | `bar` (grouped per criterion) | Readers need precise per-criterion comparison. |
|  | `harvey-ball` | Qualitative 0-25-50-75-100% scale; one row at a glance. |
|  | `matrix` | Many items × many criteria (radar collapses past ~5 polygons). |

`radar` is best for 2-3 items × 3-8 criteria where SHAPE matters.
`harvey-ball` for one item rated on multiple criteria (or a few items in
parallel rows).

## 6. Process flow with cumulative narrative

Data shape: a sequence of contributions that accumulate to a final total.

| First choice | Alternative |
|---|---|
| `waterfall` | `stacked-bar` (when the story is "decomposition per period", not cumulative). |

Waterfall is THE chart for "we started at X, then A added, then B
subtracted, end at Y". Connector lines visually link each step's top to
the next step's base.

## 7. Stage drop-off (funnel)

Data shape: a sequence of stages with monotonically decreasing counts.

| First choice | Alternative |
|---|---|
| `funnel` | `bar` (when you don't need the narrowing geometry). |

`funnel` makes the drop-off VISIBLE via the trapezoid narrowing; drop-off
% prints between stages.

## 8. 2-D intensity surface

Data shape: 2-D matrix where each cell is a value to be color-coded.

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `heatmap` | `matrix` | Cells are few; per-cell numeric value matters. |
|  | `activity-heatmap` | The grid is calendar-shaped (rows = weekday). |

Use `logScale: true` when one or two cells are 10-100× the rest.
Use `diverging: true` when values are signed (delta vs baseline).

## 9. KPI dashboard

Data shape: a small set of headline numbers, each with optional delta.

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `metric-cards` | `bullet` | Each KPI has a target AND a qualitative range. |
|  | `gauge` | ONE focal KPI with threshold escalation (warn / danger). |

`metric-cards` is the default for 3-8 KPIs at the top of a dashboard.

## 10. Value vs target / threshold

Data shape: a value plus a target (and optionally a qualitative range).

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `bullet` | `gauge` | Single value, circular form, threshold escalation needed. |
|  | `metric-cards` (with delta = value − target) | No qualitative range; just a numeric gap. |

`bullet` for multi-KPI; `gauge` for single-KPI.

## 11. Rank-over-time

Data shape: a ranking that shuffles across time positions.

| First choice | Alternative |
|---|---|
| `bump` | `line` (when the y-axis is a magnitude, not a rank). |

Bump's y-axis is `[1, series.length]` inverted (rank 1 at top); line
crossings signal rank swaps.

## 12. Inline part-to-whole

Data shape: a parts-of-a-whole breakdown that sits inside a card / stat
tile / table cell.

| First choice | Alternative | When the alternative wins |
|---|---|---|
| `segmented-bar` | `donut` | The breakdown is the page's centerpiece, not inline. |

`segmented-bar` is the cheapest possible part-to-whole — pure CSS Flexbox,
no SVG. Fits naturally inside a 240px-wide card.

## Cross-cutting tips

- **The reader's question drives the chart.** Don't pick a chart and then
  fit data into it; pick the question, then the chart.
- **Magnitude → bar.** When in doubt about a chart for compare-categories,
  use `bar`. It's the perceptually strongest.
- **Sort descending if categories are independent.** A sorted bar
  immediately shows rank; an unsorted bar buries it.
- **Avoid charts with > 12 categories.** Either aggregate, split into
  small-multiples, or switch to a heatmap.
- **The title is the insight.** A chart called "Q4 was the strongest in 3
  years" reads faster than one called "Revenue chart".
- **Light + dark always.** Every chart must theme correctly on both;
  hardcoded colors break this. Use DESIGN.md tokens.

## See also

- [chart-fence-protocol.md](./chart-fence-protocol.md) — the authoring contract.
- One per-type file in this directory — full options + examples.
- [chart-dashboard-recipes.md](./chart-dashboard-recipes.md) — composed dashboards combining multiple types.
