---
name: amvcp-layout-kpi
description: "KPI rows, stat bands, metric strips, and the 12-column dashboard grid for visual-communicator pages. Use when the user asks for an at-a-glance KPI / metric strip, a stat band, a dashboard header, or a 12-column metrics dashboard layout. Trigger with 'KPI row', 'KPI strip', 'metric strip', 'stat band', 'dashboard header', '12-column dashboard', 'data-span', 'dashboard grid', 'metrics tiles'."
license: MIT
compatibility: "Browser (CSS Grid, dvh units). Requires scripts/amvcp-layout.css for grid presets. Themes off the DESIGN.md engine (amvcp-designmd.js)."
metadata:
  author: Emasoft
---

# Layout KPI + Dashboard

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling layout skills:** [amvcp-layout](../amvcp-layout/SKILL.md) (router) · [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) · [amvcp-layout-shells](../amvcp-layout-shells/SKILL.md) · [amvcp-layout-kpi](../amvcp-layout-kpi/SKILL.md) · [amvcp-layout-chrome](../amvcp-layout-chrome/SKILL.md) · [amvcp-layout-print-hero](../amvcp-layout-print-hero/SKILL.md).

## Overview

Metric-focused layouts: the auto-fit KPI / stat / metric strip and the 12-column dashboard grid that hosts it. KPI rows reflow gracefully from 4-across desktop to 1-across phone via `auto-fit minmax`. The 12-column dashboard grid uses `data-span` to claim 1, 2, 3, 4, 6, 8, or 12 columns per child — the industry standard for metrics layouts because 12 divides cleanly into halves, thirds, and quarters.

## Prerequisites

- `scripts/amvcp-layout.css` linked (dashboard + KPI grid presets ship here).
- The DESIGN.md engine (`scripts/amvcp-designmd.js`) wired — supplies every `--vc-*` token.
- `scripts/amvcp-runtime.js` for selection + the no-nested-scrollbars backstop.
- Python 3.12+ for `scripts/amvcp-select.py`.
- The shared spatial-token foundation from sibling [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md) (the `--la-*` alias layer).

## When to choose this category

| Request shape | Ref | Scaffold class |
|---|---|---|
| at-a-glance KPI / metric strip | ref 10 | `.la-kpi-row` |
| metrics dashboard (12-col placement) | ref 09 | `.la-dashboard` + `data-span` |

Each ref linked in the Resources section below with its full TOC embedded.

## Authoring rules (HARD invariants)

- **Spacing tokens only.** Every length is `var(--vc-space-N)`, `var(--la-*)`, or `ch`. NO literal pixel values for layout sizing. (Documented exceptions live in sibling [amvcp-layout-grids](../amvcp-layout-grids/SKILL.md).)
- **Engine tokens only for colour.** Every KPI tint / dashboard surface colour is a `--vc-color-*` engine token. Light + dark fall out for free.
- **Logical properties only.** `dir="rtl"` mirrors the strip with zero extra CSS.
- **No nested scrollbars.** KPI rows do NOT introduce inner scrollbars. Wide metric strips reflow to fewer columns; never scroll horizontally.
- **`min-width: 0` on every grid child.** The shipped presets already do this; custom dashboard children must too — without it a wide metric forces the WHOLE GRID past the viewport.
- **Selection contract.** Every KPI tile and dashboard cell is a selectable atom via `markLayoutAtoms()`. The 3-segment decision-mini pill attaches to each.

## Instructions

1. Match the user's request to a row in the table above; open the cited ref.
2. Paste the scaffold (each ref includes a complete `<style>` snippet + minimal HTML).
3. For a dashboard, set `data-span="N"` on each tile (`N ∈ {1, 2, 3, 4, 6, 8, 12}`).
4. For a KPI row, place it inside a dashboard cell with `data-span="12"` (full-width) or use it standalone above the page body.
5. Stamp `data-ve-id` on every region (auto-stamped by `markLayoutAtoms()` for SHAPES classes; hand-stamp for custom containers).
6. Verify with the visual-verification section of each ref.

Copy this checklist and track your progress:

- [ ] Picked the right preset (KPI strip vs 12-column grid)
- [ ] Pasted the scaffold + linked `amvcp-layout.css`
- [ ] Stamped `data-ve-id` on every region (or relied on `markLayoutAtoms()`)
- [ ] All `data-span` values are in the allowed set (1/2/3/4/6/8/12)
- [ ] Verified BOTH light and dark themes (per `amvcp-self-debug-rules` R10)
- [ ] Verified reflow on tablet AND phone widths (no horizontal scroll)

## Output

Self-contained HTML: one `<style>` (or `<link href="amvcp-layout.css">`) carrying the KPI/dashboard presets, the engine `<script>` + DESIGN.md block. Every tile carries `data-ve-id` + `data-ve-type` so a click posts back through the runtime.

## Error Handling

| Symptom | Fix |
|---|---|
| KPI tiles all squashed onto one row | Verify `minmax(min(180px, 100%), 1fr)` — the `min(...)` is what allows phone-width reflow. |
| Dashboard tile spans wrong width | Confirm `data-span="N"` value is in the allowed set (1/2/3/4/6/8/12) — odd values like 5 / 7 / 9 / 10 / 11 break the rhythm. |
| Wide content (chart) forces the whole dashboard past the viewport | Add `min-width:0` to the affected child (the preset does this on shipped tiles — check custom additions). |
| KPI value text wraps to multiple lines on mobile | Reduce the `minmax(...)` floor OR shorten the value display (use units suffix instead of full word). |
| RTL layout broken | A physical property leaked in — replace with the logical equivalent (`margin-inline-start` etc). |

## Examples

Input: user asks for an executive dashboard with a top KPI strip and two below-fold charts side-by-side.
Output: a `.la-dashboard` 12-col grid with the KPI strip at `data-span="12"` and two charts at `data-span="6"` each:

```html
<section class="la-dashboard" data-ve-id="dash">
  <div class="la-kpi-row" data-span="12" data-ve-id="kpi-strip">
    <div class="la-kpi" data-ve-id="kpi-revenue"><span class="la-kpi__label">Revenue</span><span class="la-kpi__value">$12.4M</span><span class="la-kpi__trend la-kpi__trend--up">+8.2%</span></div>
    <div class="la-kpi" data-ve-id="kpi-users"><span class="la-kpi__label">Users</span><span class="la-kpi__value">48.7K</span><span class="la-kpi__trend la-kpi__trend--up">+12%</span></div>
    <div class="la-kpi" data-ve-id="kpi-churn"><span class="la-kpi__label">Churn</span><span class="la-kpi__value">2.1%</span><span class="la-kpi__trend la-kpi__trend--down">-0.4%</span></div>
    <div class="la-kpi" data-ve-id="kpi-nps"><span class="la-kpi__label">NPS</span><span class="la-kpi__value">64</span><span class="la-kpi__trend la-kpi__trend--up">+5</span></div>
  </div>
  <div data-span="6" data-ve-id="chart-revenue">…</div>
  <div data-span="6" data-ve-id="chart-users">…</div>
</section>
```

More examples:

- A 4-tile KPI strip above a report: `.la-kpi-row` with 4 cards, each containing a label + big number + trend indicator.
- A 12-column executive dashboard: `.la-dashboard` with a `data-span="12"` KPI strip on top, then `data-span="6"` + `data-span="6"` for two charts, then `data-span="4"` * 3 for three callout cards.
- A metrics summary inside a print report: `.la-kpi-row` at the page top, then the rest of the body in standard reading layout.
- A sparkline-augmented stat band: `.la-kpi-row` where each card has a tiny inline `<svg>` sparkline below the value.

## Modes

This skill supports `data-ve-mode="readonly"` only. KPI / dashboard tiles are page-level data displays — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply. (For editable per-cell decision pills, use sibling `amvcp-tables-cells-badges`.)

## Composability

KPI rows compose naturally inside dashboard cells (`data-span="12"` → full-width KPI strip) and inside reading articles (just above the lead paragraph). Multiple KPI rows on one page are allowed. Dashboards can host any sibling primitive — charts, tables, code-highlight blocks — via `data-span` cells.

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes AT three widths (1280px desktop, 768px tablet boundary, 360px phone).

## Resources

- [09-twelve-column-dashboard](references/09-twelve-column-dashboard.md) — `repeat(12, 1fr)` grid + `data-span` placement.
  > What this is · Scaffold to emit · The allowed `data-span` values · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why 12-column instead of CSS Grid named lines · Visual verification
- [10-kpi-row](references/10-kpi-row.md) — auto-fit small-card strip for metric tiles.
  > What this is · Scaffold to emit · The "warn" modifier pattern · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this layout · Why `auto-fit` not `auto-fill` · Visual verification · Trend indicator conventions · The KPI value display · Sparkline conventions · The compact vs expanded variants
- [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — universal visual-verification checklist every ref points at.
