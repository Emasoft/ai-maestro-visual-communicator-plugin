# `chart:metric-cards@1` — KPI tile row

A grid of KPI cards: a label, a big number, optional unit, optional delta
badge (up/down/flat with semantic color). The dashboard primitive that
sits alongside a chart to give the reader the headline numbers. Every
card is a `chart-point` atom.

## When to choose metric-cards

Use `metric-cards` when:

- You have a small set (3-8) of HEADLINE NUMBERS to display.
- The dashboard's first row should show "today's numbers at a glance".
- Each number has a meaningful delta (vs last period / vs target).

Pick `bullet` instead when each metric has a target reference AND a
qualitative range.
Pick `bar` instead when readers must compare the values numerically (cards
are at glance, not comparison).
Pick a single `gauge` when there is ONE focal KPI worth a circular visual.

## Authoring shape

```chart:metric-cards@1
{
  "title": "Key metrics — Q4",
  "subtitle": "All green on revenue and NPS; tickets steady",
  "series": [{ "label": "kpi", "data": [
    {"label":"Revenue","value":48200,"delta":12,"trend":"up","unit":""},
    {"label":"Churn","value":3.4,"delta":-0.6,"trend":"down","unit":"%"},
    {"label":"NPS","value":52,"delta":4,"trend":"up"},
    {"label":"Tickets","value":318,"delta":0,"trend":"flat"}
  ] }]
}
```

Each datum has:

| Field | Type | Required | Meaning |
|---|---|---|---|
| `label` | string | yes | Card label (uppercase, letter-spaced via CSS). |
| `value` | number | yes | The big number. `fmtNum` formats (kk/M suffixes for large numbers). |
| `unit` | string | no | Unit printed inline after the number (`%`, `$`, `ms`, `req/s`). |
| `delta` | number | no | The delta vs the previous period. Sign sets the badge color (or `trend` overrides). |
| `trend` | `"up"\|"down"\|"flat"` | no | Override the auto-detected trend. Useful for "down is good" metrics (churn ↓ should paint success even though delta is negative). |

The trend → color mapping:
- `up` → `--vc-color-success` (green)
- `down` → `--vc-color-danger` (red)
- `flat` → `--vc-color-content-muted` (neutral)

For "down is good" metrics (latency, churn, error rate), set `trend:"down"`
explicitly with a NEGATIVE `delta` — the badge will paint danger
incorrectly. Better: invert the sign in the spec and set
`trend:"up"`:

```json
// Churn went from 4.0% to 3.4%. Down 0.6 = good.
{"label":"Churn","value":3.4,"delta":-0.6,"trend":"down","unit":"%"}
// Renders as: "↓ 0.6%" with danger-colored badge.
// To paint success (because churn going down IS good):
{"label":"Churn","value":3.4,"delta":0.6,"trend":"down","unit":"%"}
// Manually flipped delta sign; renders as: "↓ 0.6%" with success badge.
// OR semantically:
{"label":"Churn reduction","value":0.6,"delta":0.6,"trend":"up","unit":"pp"}
```

There's no single right answer — pick whichever reads most naturally for
your audience.

## Options

| Key | Default | Effect |
|---|---|---|
| _(none specific to metric-cards)_ | | |

## Examples

### 1. Engineering metrics

```chart:metric-cards@1
{ "title": "Engineering health — this week",
  "series": [{ "label": "kpi", "data": [
    {"label":"PRs merged","value":42,"delta":3,"trend":"up"},
    {"label":"p99 latency","value":180,"delta":-12,"trend":"up","unit":"ms"},
    {"label":"Deploys","value":8,"delta":0,"trend":"flat"},
    {"label":"Incidents","value":1,"delta":1,"trend":"down"}
  ] }] }
```

### 2. Single hero KPI

```chart:metric-cards@1
{ "title": "Today's revenue",
  "series": [{ "label": "hero", "data": [
    {"label":"Revenue (USD)","value":124800,"delta":18400,"trend":"up","unit":"$"}
  ] }] }
```

The grid is `auto-fit` with a min-width of 160px — a 1-card grid takes
the full row width naturally.

### 3. Animated count-up

If the page also loads `amvcp-animation.js`, each metric card's value
auto-animates count-up from 0 → value on first view (via the runtime's
`animateStat` integration; the chart module marks each value span with
`class="va-counter" data-va-stat="N" data-va-stat-suffix="unit"`).

Without `amvcp-animation.js`, the values render statically — no error.

## What the runtime emits

```html
<figure class="ve-chart" data-ve-chart-type="metric-cards"
        data-ve-chart-backend="html" …>
  <figcaption class="ve-chart-title">…</figcaption>
  <div class="ve-chart-metric-grid">
    <div class="ve-chart-metric-card"
         data-ve-id="ve-chart-N-d0-i0"
         data-ve-type="chart-point" …>
      <div class="ve-chart-metric-label">Revenue</div>
      <div class="ve-chart-metric-value">
        <span class="va-counter" data-va-stat="48200">48.2k</span>
      </div>
      <div class="ve-chart-metric-delta ve-chart-metric-delta--up">
        ↑ 12
      </div>
    </div>
    …
  </div>
</figure>
```

Note `data-ve-chart-backend="html"` — metric-cards is the only chart type
using the HTML backend (no SVG, no Canvas). The CSS Grid `auto-fit` with
`minmax(160px, 1fr)` makes the card row responsive.

## Lib functions called

`renderMetricCards(spec, _type, fig)`:

- For each datum:
  - Compute trend (`d.trend` override, else inferred from `Math.sign(d.delta)`).
  - Append `.ve-chart-metric-card` `<div>` with label, value, optional unit, optional delta badge.
  - Stamp `data-ve-id` / `data-ve-type="chart-point"` on the card.
  - Mark the value span as `va-counter` so `amvcp-animation.js#refresh` will animate it (defensively guarded — no-op if animation skill absent).
- If `amvcp-animation.js` is loaded, call `window.amvcpAnimation.refresh(fig)` after mount.

## DESIGN.md tokens

| Token | Used for |
|---|---|
| `--vc-color-surface-raised` | Card background. |
| `--vc-color-border` | Card border. |
| `--vc-color-accent` | Card hover border + selected-state outline. |
| `--vc-color-content` | Big number text. |
| `--vc-color-content-muted` | Label + unit + flat delta. |
| `--vc-color-success` | Up delta badge. |
| `--vc-color-danger` | Down delta badge. |
| `--vc-radius-lg` | Card corner radius. |
| `--vc-radius-full` | Delta badge pill radius. |
| `--vc-space-3` | Card padding + grid gap. |
| `--vc-text-0`, `--vc-text-1`, `--vc-text-5` | Label / unit / value type scale. |
| `--vc-font-heading` | Big number font family. |
| `--vc-weight-bold`, `--vc-weight-medium` | Text weights. |
| `--vc-duration-fast` | Card hover transition. |

## Selection / atoms

Each `<div class="ve-chart-metric-card">` is a `chart-point` atom (carries
`data-ve-id` / `data-ve-type="chart-point"` and the payload). Selecting a
card lets the reader open a comment thread scoped to that KPI.

## Anti-patterns

- **More than 6-8 cards in one row.** Becomes a wall of numbers; readers stop processing. Split into multiple `metric-cards` charts under different titles.
- **Uniform-looking cards for non-uniform importance.** The auto-fit grid renders every card the same size. For a "1 hero KPI + 4 supporting" dashboard, author TWO `metric-cards` figures (a 1-card hero + a 4-card supporting row).
- **Plain text dashboards.** A "Revenue: $48.2k" prose line is faster to author but bypasses the chart-point selection contract. Use `metric-cards` even for one KPI if you need it commentable.
- **Mixing absolute-value and percentage deltas in the same row.** "+12" next to "+0.6%" — the units differ. Add `unit` consistently or normalise.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: card hover state (border
accent), delta-badge color matches trend, light + dark themes both legible,
count-up animation respects `prefers-reduced-motion`.
