# 10 — KPI row (auto-fit small-card strip for at-a-glance metrics)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The "warn" modifier pattern](#the-warn-modifier-pattern)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this layout](#when-to-use-this-layout)
- [Why `auto-fit` not `auto-fill`](#why-auto-fit-not-auto-fill)
- [Visual verification](#visual-verification)
- [Trend indicator conventions](#trend-indicator-conventions)
- [The KPI value display](#the-kpi-value-display)
- [Sparkline conventions](#sparkline-conventions)
- [The compact vs expanded variants](#the-compact-vs-expanded-variants)

A strip of small KPI / metric cards sized for the eye to scan in a
single glance. Auto-fit grid sizing keeps cards uniformly wide while
allowing the strip to gracefully reflow from 4-across on a desktop
to 2-across on a tablet to 1-across on a phone. Lives most often
inside a `.la-dashboard` (ref 09) as a `data-span="12"` child.

## What this is

`.la-kpi-row` is an `auto-fit` grid:
```css
grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
```
Translated: "as many columns as fit, each at least 180px wide, all
equal". At desktop widths (1280px), this is typically 4-6 columns
across (each ~180-240px). At tablet widths (~768px), it drops to
3-4. At mobile widths (~375px), it drops to 1-2.

The `min(180px, 100%)` floor ensures that on viewports narrower than
180px (truly tiny), the card collapses to `100%` width so it does
not overflow.

The KPI row is NOT a container that owns its child CONTENT — the
metric values, the trend arrows, the sparklines inside the cards
come from the CHART technique (`skills/amvcp-chart/`). The layout
technique owns only the auto-fit grid shell.

## Scaffold to emit

```html
<div class="la-kpi-row" data-ve-id="kpi-row" data-ve-type="region">
  <article class="vc-metric" data-ve-id="kpi-revenue" data-ve-type="card">
    <span class="vc-metric-label">Revenue</span>
    <span class="vc-metric-value">$4.2M</span>
    <span class="vc-metric-trend vc-metric-trend--up">+12%</span>
    <svg class="vc-metric-spark" viewBox="0 0 80 24" aria-hidden="true">
      <polyline points="…" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  </article>
  <article class="vc-metric" data-ve-id="kpi-mau" data-ve-type="card">
    <span class="vc-metric-label">Monthly active users</span>
    <span class="vc-metric-value">847K</span>
    <span class="vc-metric-trend vc-metric-trend--up">+5%</span>
  </article>
  <article class="vc-metric" data-ve-id="kpi-uptime" data-ve-type="card">
    <span class="vc-metric-label">Uptime</span>
    <span class="vc-metric-value">99.97%</span>
    <span class="vc-metric-trend vc-metric-trend--flat">±0</span>
  </article>
  <article class="vc-metric" data-ve-id="kpi-incidents" data-ve-type="card">
    <span class="vc-metric-label">Incidents (30d)</span>
    <span class="vc-metric-value">1</span>
    <span class="vc-metric-trend vc-metric-trend--down">-2</span>
  </article>
</div>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: var(--la-gap);
}
```

The `.vc-metric` class is the chart technique's; the layout
technique only emits the surrounding `.la-kpi-row`.

## The "warn" modifier pattern

A subtle but useful pattern from the consolidated catalog: a single
card in the strip can be highlighted as a `.warn` variant — for
example, the incident count rising. The mechanic is a single
modifier class that adds a left-border tint without breaking the
auto-fit alignment:

```css
.vc-metric--warn {
  border-inline-start: 4px solid var(--vc-color-warn, #d97757);
  /* Compensate for the wider left-border so the contents don't shift. */
  padding-inline-start: calc(var(--la-gap) - 4px);
}
```

Use `.vc-metric--warn` sparingly — one card per row, at most. The
goal is to draw the eye to the single bad stat without flooding
the row with colour.

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type="kpi-row"`
  on every `.la-kpi-row` and `data-ve-type="card"` on every nested
  `.vc-metric` (the chart technique's CSS class is
  matched if the chart technique extends the SHAPES list; or the
  card class `.la-card` matches directly).
- The chart technique's JS populates sparklines / value formatting.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap` | 16px | KPI row gap |
| `--vc-color-surface` | (theme) | card background (if styled) |
| `--vc-color-content` | (theme) | metric value colour |
| `--vc-color-content-muted` | (theme) | metric label colour |
| `--vc-color-warn` | (theme) | warn-variant left-border |
| `--vc-color-success` | (theme) | up-trend chip |
| `--vc-color-danger` | (theme) | down-trend chip (or up-trend for "bad" metrics) |

## Selection / comment / decision-mini contract notes

The KPI row itself is selectable (`kpi-row` type — see SHAPES list
in `markLayoutAtoms()`). Each KPI card inside is independently
selectable.

A reviewer can:
- Deny the entire KPI row (request a different metric layout).
- Approve / deny each card individually.
- Comment on the warn-variant card specifically ("this incident
  count needs a click-through to the incident list").

The decision-mini pill attaches at both levels (row + card).

## When to use this layout

- Above the fold of any dashboard (ref 09).
- At the top of a status report or weekly digest.
- As a compact "stats" strip inside an article or slide.

Do NOT use this layout for:
- A row of cards with long bodies (use `.la-cardrow` with subgrid —
  ref 07).
- A grid of equal-shape product cards (use the auto-fill card grid —
  ref 11).

## Why `auto-fit` not `auto-fill`

`auto-fit`: empty tracks at the end of a row COLLAPSE; the existing
cards stretch to fill the row.
`auto-fill`: empty tracks STAY at the end of the row; existing
cards don't stretch.

For a KPI row, `auto-fit` is correct: if you have 4 cards and the
viewport fits 6, you want 4 cards stretched evenly to fill the row,
not 4 cards left-aligned with 2 ghost slots on the right.

## Visual verification

Run the universal self-debug checklist before claiming the KPI row
is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For KPI-row correctness specifically:

- Open dev-browser. Verify the grid template:
  ```js
  getComputedStyle(document.querySelector('.la-kpi-row')).gridTemplateColumns
  ```
  At 1280px viewport with 4 cards, should resolve to 4 equal-width
  tracks (each ≈ 300px).
- Resize to 768px; should drop to 2-3 cards per row.
- Resize to 400px; should drop to 1-2 cards per row.
- All cards in a row should have the same height (the
  `align-items: stretch` default of grid). If one card is taller,
  the others stretch up to match.
- **R1 — Light + dark themes**: switch themes; the metric values
  must remain readable in both (`--vc-color-content` is the right
  token; never hardcoded #000 or #fff).
- **R2 — No nested scrollbars**: a long metric value should not
  introduce an inner scroller; the card should grow taller (or
  the value should wrap — controlled by the chart technique's
  CSS).
- **R3 — 3-state visual model**: the cards should have hover
  states (faint background tint + small glow) defined by the
  runtime CSS. Verify on hover with dev-browser.
- The "warn" variant check: add `.vc-metric--warn` to one card;
  verify the left border is visible AND the card's internals do
  not shift sideways (the `padding-inline-start: calc(--la-gap - 4px)`
  compensates for the 4px border).

## Trend indicator conventions

KPI cards typically include a "trend" indicator showing the
delta from the previous period. The conventions:

| Trend | Visual | Token | When |
|---|---|---|---|
| Up (good) | `↑ +12%` green | `--vc-color-success` | Revenue, MAU, NPS, uptime |
| Up (bad) | `↑ +12%` red | `--vc-color-danger` | Incidents, errors, latency |
| Down (good) | `↓ -12%` green | `--vc-color-success` | Incidents (resolved), latency |
| Down (bad) | `↓ -12%` red | `--vc-color-danger` | Revenue, MAU, uptime |
| Flat | `± 0` neutral | `--vc-color-content-muted` | Any metric, no change |

The "good vs bad" depends on the metric. The KPI card author
must know which direction is desired:

```html
<!-- Revenue: up = good -->
<span class="vc-metric-trend vc-metric-trend--up vc-metric-trend--good">↑ +12%</span>

<!-- Incidents: up = bad -->
<span class="vc-metric-trend vc-metric-trend--up vc-metric-trend--bad">↑ +2</span>
```

The chart technique (`skills/amvcp-chart/`) typically owns the
trend chip styling — the layout technique just provides the
container.

## The KPI value display

The metric VALUE inside the card should be:
- **Large** — the value is the main reason the card exists.
  Typically `var(--vc-font-2xl)` (28-32px) or `var(--vc-font-3xl)`
  (32-40px).
- **Bold or heavy weight** — `var(--vc-weight-bold)` (700) for
  visual presence.
- **Tabular nums** — `font-variant-numeric: tabular-nums` so
  `1,234` and `2,345` align column-wise. Critical when multiple
  KPIs are displayed in a row.
- **Use units consistently** — "$4.2M" not "4.2 million dollars".
  "99.97%" not "99.97 percent". Symbols + abbreviations save
  visual space.

## Sparkline conventions

A sparkline (mini chart) inside a KPI card visualises the trend:
- Fixed-aspect SVG (typically `viewBox="0 0 80 24"`).
- One `<polyline>` for the data, no axes / labels (the chart
  is contextual).
- One `<circle>` at the end-point (the most recent value).
- Stroke colour is `--vc-color-accent` (gold) for the line,
  `currentColor` for the end-point dot.
- Total ~5 SVG elements; rendered inline (no JS).

The sparkline is the chart technique's job, not layout's. The
layout provides the card; the chart technique fills it.

## The compact vs expanded variants

Some dashboards use a COMPACT KPI variant (just label + value,
no sparkline, no trend) for ultra-dense displays. Others use
an EXPANDED variant (label + value + trend + sparkline +
tooltip + click-to-drill-down). The layout's `.la-kpi-row`
container works for both — the difference is the chart
technique's per-card styling.

A typical executive dashboard might mix: 4 compact KPIs at the
top, 2 expanded KPIs below with sparklines. The same `.la-kpi-row`
container could nest two rows.
