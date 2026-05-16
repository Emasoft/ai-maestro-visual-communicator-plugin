# `chart:bullet@1` — bullet chart

A McKinsey-style KPI visualization. Each category band shows three layers:

- A QUALITATIVE RANGE bar (the background — wide, low contrast).
- The ACTUAL value as a narrow filled bar.
- The TARGET as a horizontal tick mark.

A bullet chart is the visual answer to "are we hitting our number, and how
far above/below the qualitative band are we?" — far more honest than a
gauge or a single bar with a value label.

## When to choose bullet

Use `bullet` when:

- Every value has an associated TARGET that the reader needs to compare it against.
- A qualitative band exists ("the acceptable range is 60-90, the stretch goal is 100").
- You need to compare actual-vs-target for multiple KPIs side by side.

Pick `gauge` instead when there is ONE KPI to show (bullet is per-category;
gauge is single-value).
Pick `bar` instead when there is no target reference, just an actual value.

## Authoring shape

```chart:bullet@1
{
  "title": "Q4 attainment by team",
  "subtitle": "Sales overshot; Marketing missed",
  "series": [{ "label": "% to plan", "data": [
    {"x":"Sales",     "y": 118, "target": 100, "range": 130},
    {"x":"Marketing", "y":  72, "target":  90, "range": 100},
    {"x":"CS",        "y":  92, "target":  85, "range": 110},
    {"x":"Eng",       "y":  88, "target":  80, "range": 100}
  ] }]
}
```

Each datum needs four fields:

| Field | Type | Meaning |
|---|---|---|
| `x` | string | Category label. |
| `y` | number | The ACTUAL value (the narrow filled measure bar). |
| `target` | number | The TARGET tick — drawn as a short horizontal line. |
| `range` | number | The qualitative MAX — drawn as a wide low-contrast background. |

The y-domain auto-includes `range` and `target` so the visual never clips
the actual when the actual exceeds the target.

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | `false` | Ignored — three-layer bullets are too dense for value labels. The hover tooltip shows the exact actual. |
| `sortDescending` | `false` | Currently ignored — sort by which? actual, target, range? Author-side: sort the `data` array yourself in your preferred order. |

## Examples

### 1. Quota attainment dashboard

```chart:bullet@1
{ "title": "Sales rep quota attainment — Q4",
  "series": [{ "label": "actual", "data": [
    {"x":"Alice",   "y": 142, "target": 120, "range": 160},
    {"x":"Bob",     "y":  88, "target": 100, "range": 130},
    {"x":"Carol",   "y": 112, "target": 100, "range": 140},
    {"x":"Dave",    "y": 102, "target": 100, "range": 130},
    {"x":"Eve",     "y":  64, "target": 100, "range": 130}
  ] }] }
```

### 2. Cycle time vs SLO

```chart:bullet@1
{ "title": "PR cycle time vs SLO (hours)",
  "series": [{ "label": "p50 hours", "data": [
    {"x":"Frontend", "y": 6.2, "target": 8, "range": 12},
    {"x":"Backend",  "y": 4.1, "target": 6, "range": 10},
    {"x":"Infra",    "y": 11.4,"target": 6, "range": 12},
    {"x":"Mobile",   "y": 5.8, "target": 8, "range": 12}
  ] }] }
```

The bar reaching INTO the range bg signals "near the ceiling". A bar that
EXCEEDS the range is allowed (the y-domain re-fits) and reads as "off the
chart" visually — a strong signal that the rep / team blew past the band.

## What the runtime emits

For each category band, three layers:

```html
<g class="ve-chart-bars">
  <!-- LAYER 1: qualitative range (wide, dim). -->
  <rect class="ve-chart-bullet-range"
        x="(bandStart + bandW*0.1)" y="yScale(range)"
        width="(bandW*0.8)" height="(yBase - yScale(range))"/>
  <!-- LAYER 2: actual value (narrow, accent). -->
  <rect class="ve-chart-bar ve-chart-bullet-measure"
        x="(bandCenter - bandW*0.18)" y="yScale(y)"
        width="(bandW*0.36)" height="(yBase - yScale(y))"
        rx="var(--vc-radius-sm, 4)"
        fill="var(--vc-color-accent, #b8861f)"
        data-ve-id="ve-chart-N-d0-iI"
        data-ve-type="chart-point" …>
    <title>actual · Sales: 118</title>
  </rect>
  <!-- LAYER 3: target tick (short horizontal line). -->
  <line class="ve-chart-bullet-target"
        x1="(bandStart + bandW*0.18)" y1="yScale(target)"
        x2="(bandStart + bandW*0.82)" y2="yScale(target)"/>
</g>
```

Only the MEASURE bar (layer 2) is an atom. The range bg and target tick are
decorative.

## Lib functions called

`renderSvgBar(spec, 'bullet', fig)` — branches on `isBullet`:

- For each datum:
  1. Append range `<rect class="ve-chart-bullet-range">` if `datum.range` is numeric.
  2. Append measure `<rect class="ve-chart-bar ve-chart-bullet-measure">` if `datum.y` is numeric; this is the atom.
  3. Append target `<line class="ve-chart-bullet-target">` if `datum.target` is numeric.
- Domain calculation: y-domain expands to include `range` AND `target` so neither layer is clipped.

## DESIGN.md tokens

Same as `bar`. Additional:

| Token | Used for |
|---|---|
| `--vc-color-surface-sunken` | Range background fill (the wide, dim layer). |
| `--vc-color-content` | Target tick stroke (the short, strong line). |

The CSS:

```css
.ve-chart-bullet-range  { fill: var(--vc-color-surface-sunken, #f1ece0); }
.ve-chart-bullet-target { stroke: var(--vc-color-content, #1f1a14);
                          stroke-width: 2.5; }
```

## Selection / atoms

Only the measure bar is a `chart-point` atom (the range bg and target tick
are decorative). The atom payload includes only the actual `value` (not
target/range) — those live in the bullet's visual encoding, not in the
selection metadata.

## Anti-patterns

- **Setting `target` > `range`.** Visually meaningless — the qualitative band ends below the target. The chart still renders but readers will misinterpret.
- **Omitting `range`.** The chart still renders (no range bg) but the bullet loses its qualitative-band signal — at that point you might as well use `bar` with value labels.
- **Bullet for a single category.** A one-category bullet is just a labeled bar + target tick. Use `gauge` for single-value KPIs.
- **Multi-series bullet.** Not supported — each category band already has three layers; adding a second series's three layers would be unreadable. Split into multiple charts.

## Bullet vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Multi-KPI dashboard with targets | `bullet` | Three layers per category — actual + target + range. |
| Single KPI with threshold | `gauge` | Single value; circular form; warn/danger escalation. |
| Multi-KPI without targets | `bar` (sorted) | Simpler; no target/range layers. |
| Single KPI with delta vs target | `metric-cards` (1 card with delta) | Compact tile; not as visual but cleaner. |

The bullet chart is Stephen Few's contribution to chart design —
specifically designed as the "honest alternative to gauges" for
multi-KPI dashboards. Gauges take a lot of visual real estate per KPI;
bullets pack 4-8 KPIs into one chart.

## The three layers explained

```
[___________________________________________]   ← RANGE bg (dim, wide)
              [____________________ACTUAL____]   ← MEASURE bar (accent, narrow)
                               | TARGET TICK    ← TARGET line (strong, short)
```

- **Range** = the qualitative band ("the acceptable region", "the
  stretch goal"). Dim, wide. Author sets `range` = the max y in the
  band.
- **Measure (actual)** = the current value. Accent, narrow. Author
  sets `y` = the actual.
- **Target** = the target tick. A short horizontal line. Author sets
  `target` = the target value.

If the actual EXCEEDS the range, the actual bar continues UP past the
range bg — visually signalling "off the chart".

If the actual is BELOW the target tick, the measure bar doesn't reach
the tick — visually signalling "below target".

The reader's eye reads BOTH "is the actual above/below target" AND "is
the actual in the band" in one glance.

## When to set `range > target`

The range represents the QUALITATIVE BAND CEILING. Conventionally:

- `range = 1.2 × target` — actual ≥ target is the goal; range is the
  stretch goal.
- `range = 2 × target` — the stretch goal is double the target.
- `range = max(historical actuals)` — the band represents historical
  spread.

A range LOWER than target is conceptually inverted ("target is above
the qualitative max"). The chart still renders but reads awkwardly.

## Bullet for "lower is better" metrics

For metrics where DECREASE is desired (latency, error rate, churn),
the standard "actual reaches target → good" semantics invert. The
chart still works visually but the reader has to flip the mental
direction.

One workaround: pre-process to INVERT the values (e.g. "ms saved vs
SLO" instead of "ms latency vs SLO"). The chart then reads conventionally.

Or, add a subtitle clarifying ("Lower is better; bars near the floor
are excellent").

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: range background dim
enough not to compete with the measure bar; target tick visible at the
selected position; light + dark theme contrast preserved across all three
layers; actual bar that EXCEEDS the range continues upward (no clipping
at the range top).
