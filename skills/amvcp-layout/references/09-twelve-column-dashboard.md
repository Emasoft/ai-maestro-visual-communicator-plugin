# 09 — 12-column dashboard (data-span placement on a 12-track grid)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The allowed `data-span` values](#the-allowed-data-span-values)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this layout](#when-to-use-this-layout)
- [Why 12-column instead of CSS Grid named lines](#why-12-column-instead-of-css-grid-named-lines)
- [Visual verification](#visual-verification)

The flagship metrics-dashboard layout: a `repeat(12, 1fr)` grid where
each child carries a `data-span="N"` attribute (N ∈ 1, 2, 3, 4, 6, 8, 12)
to claim N of the 12 columns. The 12-column rhythm is the industry
standard for dashboards because it divides cleanly into halves
(6+6), thirds (4+4+4), quarters (3+3+3+3), and asymmetric splits
(8+4, 4+8) without remainders.

## What this is

`.la-dashboard` is `display: grid; grid-template-columns: repeat(12, 1fr)`.
Children use `data-span="N"` to set `grid-column: span N`. The
allowed N values (1, 2, 3, 4, 6, 8, 12) are the divisors of 12 —
they tile cleanly. The dashboard supports an optional `.la-kpi-row`
container that nests an auto-fit grid of small metric cards (the
"KPI strip" — see ref 10).

The 12-column grid is intentionally not configurable to 16 or 24
columns. The 12-base produces a small, learnable, snappable rhythm.
16 / 24-column grids look superficially more flexible but produce
visually noisier layouts and require more thought per placement.

The KPI-card CONTENT (the actual metric value + sparkline) is the
CHART technique's job (`skills/amvcp-chart/`). The layout technique
owns only the 12-column placement, the KPI-row container, and the
mobile-stack-everything fallback.

## Scaffold to emit

```html
<div class="la-dashboard" data-ve-id="dashboard" data-ve-type="region">
  <!-- Full-width KPI strip across the top -->
  <div class="la-kpi-row" data-span="12" data-ve-id="kpi-row" data-ve-type="region">
    <!-- Each metric card's CONTENT is the chart technique's job;
         the layout technique owns the auto-fit grid surrounding them. -->
    <article class="vc-metric" data-ve-id="kpi-revenue" data-ve-type="card">
      <span class="vc-metric-label">Revenue</span>
      <span class="vc-metric-value">$4.2M</span>
      <svg class="vc-metric-spark" viewBox="0 0 80 24">…</svg>
    </article>
    <article class="vc-metric" data-ve-id="kpi-users" data-ve-type="card">…</article>
    <article class="vc-metric" data-ve-id="kpi-uptime" data-ve-type="card">…</article>
    <article class="vc-metric" data-ve-id="kpi-tickets" data-ve-type="card">…</article>
  </div>

  <!-- Main chart, two-thirds wide -->
  <section data-span="8" data-ve-id="dash-chart" data-ve-type="region">
    <h3>Revenue by week</h3>
    <!-- chart technique renders its own SVG here -->
  </section>

  <!-- Detail panel, one-third wide -->
  <aside data-span="4" data-ve-id="dash-detail" data-ve-type="region">
    <h3>Top customers</h3>
    <ol>
      <li>Acme Corp — $980k</li>
      <li>Beta Inc — $720k</li>
      <li>…</li>
    </ol>
  </aside>

  <!-- Three small cards across the bottom -->
  <section data-span="4" data-ve-id="dash-card-a" data-ve-type="region">…</section>
  <section data-span="4" data-ve-id="dash-card-b" data-ve-type="region">…</section>
  <section data-span="4" data-ve-id="dash-card-c" data-ve-type="region">…</section>
</div>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--la-gap);
}
.la-dashboard > * { min-width: 0; }
[data-span="1"]  { grid-column: span 1; }
[data-span="2"]  { grid-column: span 2; }
[data-span="3"]  { grid-column: span 3; }
[data-span="4"]  { grid-column: span 4; }
[data-span="6"]  { grid-column: span 6; }
[data-span="8"]  { grid-column: span 8; }
[data-span="12"] { grid-column: span 12; }
```

Mobile collapse is the universal layout rule (ref 12): everything
becomes full width below 768px. The dashboard does not need a
special-case rule; the `data-span` declarations are overridden by
the universal `.la-grid--*-1 { grid-template-columns: 1fr }`
breakpoint mechanism applied across all multi-column primitives.

(Currently `.la-dashboard` does NOT have its own mobile collapse
rule in `amvcp-layout.css`. If a dashboard is shipped to a mobile-
heavy audience, the consuming layout should add:
```css
@media (max-width: 768px) {
  .la-dashboard > [data-span] { grid-column: 1 / -1; }
}
```
)

## The allowed `data-span` values

| Span | Width | Common use |
|---|---|---|
| 1 | 1/12 (~8%) | mini-cell, single icon |
| 2 | 2/12 (~17%) | small badge / chip |
| 3 | 3/12 (25%) | KPI card (one of four across) |
| 4 | 4/12 (33%) | small panel (one of three across) |
| 6 | 6/12 (50%) | half-width section |
| 8 | 8/12 (67%) | wide chart |
| 12 | 12/12 (100%) | full-width strip (e.g. the KPI row) |

The 12 sums work cleanly: 4+4+4 = 12, 6+6 = 12, 8+4 = 12,
3+3+3+3 = 12. Non-canonical sums (5+7 = 12, 7+5 = 12) are
intentionally NOT supported — they produce visually awkward
column widths.

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type` on every
  `.la-region`, every `.la-kpi-row`, and every `.la-card` (see
  ref 33).
- The chart technique's JS (e.g. `amvcp-chart.js`) populates the
  KPI cards' SVG sparklines. The layout technique just provides the
  container.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap` | 16px | dashboard grid gap, KPI row gap |
| `--vc-color-surface` | (theme) | KPI / panel backgrounds (if styled as cards) |
| `--vc-color-border` | (theme) | panel borders |
| `--vc-radius-lg` | 12px | panel corners |

## Selection / comment / decision-mini contract notes

The `.la-dashboard` itself is NOT a selectable atom (layout
containers excluded). Every child with `data-span` IS — the
selection runtime sees them as `region` atoms.

The KPI row (`.la-kpi-row`) is a selectable atom (`kpi-row` type),
and each KPI card inside it is also selectable (`card` type).
Reviewers can deny / approve / skip the whole KPI strip, OR
individual KPIs, OR the main chart, OR any panel — independently.

The decision-mini pill attaches per-region.

## When to use this layout

- A metrics dashboard with multiple KPI cards + charts + tables.
- An admin / ops overview page where multiple widgets share the
  viewport.
- A status report with several mini-sections (a stat strip + a
  chart + a couple of summary panels).

Do NOT use this layout for:
- A long-form article (use `.la-article` + `.la-grid--3-1`,
  refs 13, 06).
- A 3-panel tool UI (use `.la-ide`, ref 08).
- A simple card grid (use `.la-cardrow`, ref 07, or the auto-fill
  card grid, ref 11).

## Why 12-column instead of CSS Grid named lines

12-column with `data-span` is more ergonomic than CSS Grid named
lines because:
- Authors don't need to declare line names per layout.
- The `data-span` attribute is human-readable and survives a CSS
  refactor.
- It maps cleanly to the Bootstrap / Tailwind / Foundation grid
  vocabulary that most authors already know.

The cost: only the 7 supported spans are usable; non-canonical
spans (5, 7, 9, 10, 11) are intentionally absent. This is a
feature, not a bug — it forces clean tiling.

## Visual verification

Run the universal self-debug checklist before claiming this
dashboard is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For 12-col dashboard correctness specifically:

- Open dev-browser. Verify the grid:
  ```js
  getComputedStyle(document.querySelector('.la-dashboard')).gridTemplateColumns
  ```
  Should resolve to 12 pixel widths, each equal (`1fr` each).
- Check each child's computed grid-column:
  ```js
  document.querySelectorAll('.la-dashboard > [data-span]').forEach(el => {
    console.log(el.getAttribute('data-span'),
                getComputedStyle(el).gridColumn);
  });
  ```
  Each child's `gridColumn` should be `span N` matching its
  `data-span` attribute.
- Verify spans tile correctly: pick one row's children and sum
  their `data-span` values; the sum must be a multiple of 12 (it
  may exceed 12 if children wrap across multiple rows, but each
  visual row must sum to 12).
- **R1 — Light + dark themes**: switch themes; the dashboard
  must remain readable in both.
- **R2 — No nested scrollbars**: a panel must not have
  `overflow:auto`; if a chart or table is wider than its panel,
  the chart technique's responsive SVG sizing OR the table
  technique's wrap rules handle it — never an inner scroller.
- The narrow-viewport check: shrink the viewport to <768px; the
  layout should stack vertically (see "mobile collapse" above —
  add the breakpoint rule if it's not already in the consuming
  CSS).
