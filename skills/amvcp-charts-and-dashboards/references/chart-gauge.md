# `chart:gauge@1` — gauge

A 270° arc gauge showing a single value against a maximum. The fill
escalates color through accent → warn → danger as the value crosses
threshold options. Built from the same `describeArc` primitive as the
donut.

## When to choose gauge

Use `gauge` when:

- You have ONE single KPI that maps to a 0..max range (quota attainment, SLO compliance, disk usage, CPU load).
- The reader needs to perceive both the VALUE and the THRESHOLD it has crossed.
- The KPI lives on a dashboard as a focal element, not an inline number.

Pick `bullet` instead when you have MULTIPLE KPIs to compare side by side.
Pick `metric-cards` instead when threshold escalation is not needed (just a
number + delta).
Pick `donut` (1-slice) instead when you want a circular "fraction-of-whole"
without threshold semantics.

## Authoring shape

```chart:gauge@1
{
  "title": "Quota attainment — Q4",
  "subtitle": "On track for stretch goal",
  "series": [{ "label": "attain", "data": [{"x":"Q4","y":74}] }],
  "options": { "max": 100, "warnAt": 50, "dangerAt": 30 }
}
```

- `series[0].data[0]` — a SINGLE datum with `{x: <label>, y: <value>}`. Any additional data are ignored (gauge is single-value by definition).
- `options.max` — the gauge's maximum value (defaults to 100 if absent or non-positive).
- `options.warnAt` — when `value >= warnAt`, the fill paints with `--vc-color-warning`. Optional.
- `options.dangerAt` — when `value >= dangerAt`, the fill paints with `--vc-color-danger`. **Note:** `dangerAt > warnAt` — danger threshold should be HIGHER than warn (more severe). The CSS escalates: accent → warn → danger as value rises.

## Options

| Key | Default | Effect |
|---|---|---|
| `max` | 100 | Upper bound of the gauge. |
| `warnAt` | undefined | Fill paints warning color when `value >= warnAt`. |
| `dangerAt` | undefined | Fill paints danger color when `value >= dangerAt` (takes precedence over warn). |

## Semantics: more-is-worse vs more-is-better

For a metric where MORE is WORSE (CPU usage, disk usage, error rate), set
`warnAt` LOW and `dangerAt` HIGHER:

```json
{ "options": { "max": 100, "warnAt": 70, "dangerAt": 90 } }
```

For a metric where MORE is BETTER (quota attainment, SLO compliance), the
threshold semantics are reversed in intent. The renderer always escalates
at higher values, so for "more is better" don't set warn/danger — let the
fill stay accent. Or, if you want a critical bottom band, INVERT the value
when authoring:

```json
{ "series": [{ "label":"missed", "data":[{"x":"Q4","y": 26}] }],
  "options": { "max": 100, "warnAt": 50, "dangerAt": 70 } }
```

(74% attained = 26% missed; fill is accent because 26 < 50.)

## Examples

### 1. Disk usage (more is worse)

```chart:gauge@1
{ "title": "Primary disk usage",
  "series": [{ "label": "%", "data": [{"x":"sda1","y":86}] }],
  "options": { "max": 100, "warnAt": 70, "dangerAt": 90 } }
```

### 2. Error budget burn

```chart:gauge@1
{ "title": "30-day error budget consumed",
  "series": [{ "label": "%", "data": [{"x":"current","y":42}] }],
  "options": { "max": 100, "warnAt": 50, "dangerAt": 75 } }
```

### 3. Simple attainment (no thresholds)

```chart:gauge@1
{ "title": "Sprint capacity used",
  "series": [{ "label": "%", "data": [{"x":"S42","y":68}] }],
  "options": { "max": 100 } }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" viewBox="0 0 360 223.2" preserveAspectRatio="xMidYMid meet">
  <!-- Track arc — neutral border color, spans 270° from -135° to +135°. -->
  <path class="ve-chart-gauge-track"
        d="M … A … "
        fill="var(--vc-color-border, #e3dcc9)"/>
  <!-- Value arc — accent / warn / danger depending on thresholds. -->
  <path class="ve-chart-arc ve-chart-gauge-value"
        d="M … A … "
        fill="var(--vc-color-accent, #b8861f)"
        data-ve-id="ve-chart-N-d0-i0"
        data-ve-type="chart-point" …>
    <title>Quota attainment — Q4: 74 / 100</title>
  </path>
  <!-- Center text: the value. -->
  <text class="ve-chart-donut-center" x="180" y="120" text-anchor="middle">
    74
  </text>
</svg>
```

The viewBox is taller than wide is FALSE — actually the gauge viewBox is
`360 × 360 * 0.62 = 360 × 223.2` (less than square — the 270° sweep does
not need the full lower-half height).

## Lib functions called

`_renderGauge(spec, fig)`:

- `value = data[0].y` (with `isNum` guard).
- `maxV = options.max || 100`.
- `frac = clamp(value / maxV, 0, 1)`.
- Track arc: `describeArc(cx, cy, rOuter, rInner, -135, +135)` — the full 270° backdrop.
- Value arc: `describeArc(cx, cy, rOuter, rInner, -135, -135 + 270 * frac)` — the filled portion.
- Fill resolution:
  - default: `var(--vc-color-accent)`
  - if `value >= warnAt`: `var(--vc-color-warning)`
  - if `value >= dangerAt`: `var(--vc-color-danger)` (takes precedence)
- `markPoint(valArc, …)` — the value arc is the atom.
- `animateOnView` — animate the arc end angle from `startA` to `startA + span * frac`. RAF + cubic ease-out. Skipped under `prefers-reduced-motion: reduce`.

## DESIGN.md tokens

Same as `donut` plus:

| Token | Used for |
|---|---|
| `--vc-color-warning` | Value-arc fill when `value >= warnAt`. |
| `--vc-color-danger` | Value-arc fill when `value >= dangerAt`. |
| `--vc-color-border` | Track-arc fill (the dim background arc). |

## Selection / atoms

The VALUE arc is the single `chart-point` atom (the track is decorative).
Clicking it adds the gauge's value to the selection — the reader can
comment on "this metric is at 74%".

## Anti-patterns

- **Multiple data points in `series[0].data`.** Only the first is read. Use `bullet` for multi-KPI dashboards.
- **`max ≤ 0`.** Coerced to 100 — but the spec author should set a meaningful max.
- **`dangerAt < warnAt`.** The fill escalation logic checks danger after warn, so a value above both will paint danger. But conceptually, danger should be the more severe threshold (higher) for "more is worse" metrics.
- **Gauge for KPI dashboard with 5+ metrics.** Use `metric-cards` or `bullet` — a wall of gauges takes too much space and the reader can't compare across gauges.

## Gauge vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Single KPI with threshold escalation | `gauge` | Circular arc + threshold escalation; focal visual. |
| Single KPI without threshold (just number + delta) | `metric-cards` (1 card) | Simpler; the auto-fit grid expands to full width. |
| Multiple KPIs with targets | `bullet` (multi) | Each bullet bar shows actual + target + range. |
| Cumulative goal progress (e.g. % funded) | `gauge` | Single value as fraction of max. |
| Probability / confidence interval | (not built in) | The gauge doesn't show uncertainty; use a `bar` with explicit range. |

The gauge's strength is COMBINING:
- Single value with a max reference (270° arc).
- Threshold escalation through warn/danger colors.
- Focal-point center text.

For situations where any one of those is the SOLE need, simpler types
win.

## Gauge geometry

The gauge is a 270° arc spanning from -135° (left) through 0° (bottom)
to +135° (right). The unfilled portion is the TOP (between +135° and
+225°/+−135°). This is the conventional "speedometer" arrangement —
the reader's eye expects the arc to start at the 9 o'clock position
and grow clockwise.

The arc geometry:
- `cx = side / 2`
- `cy = side * 0.52` (slightly below center to leave room for the top gap)
- `rOuter = side * 0.40`
- `rInner = rOuter * 0.74` (a slightly narrower hole than the donut's 0.62)
- `startA = -135`, `span = 270`

The viewBox is wider than tall (`360 × 223.2`) because the gauge only
fills the bottom 270° — the top empty space is omitted.

## Three threshold zones explained

```
value < warnAt          → fill = --vc-color-accent  (default/safe)
warnAt ≤ value < dangerAt → fill = --vc-color-warning (caution)
value ≥ dangerAt        → fill = --vc-color-danger  (critical)
```

If `warnAt` and `dangerAt` are both omitted, the fill stays accent
regardless of value. If only `warnAt` is set, the fill is accent OR
warning — no danger escalation.

For a "more is better" metric (quota attainment), don't set
warnAt/dangerAt — just let the gauge fill stay accent (no escalation
needed). Or invert the value semantically (see the per-type doc).

## Gauge size in a dashboard

The gauge SVG is `width: 100%; height: auto; preserveAspectRatio:
xMidYMid meet` — it fluid-scales to its container. In a dashboard:

```html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
  <pre><code class="language-chart:gauge@1">…</code></pre>
  <pre><code class="language-chart:gauge@1">…</code></pre>
  <pre><code class="language-chart:gauge@1">…</code></pre>
</div>
```

Three gauges side by side in a 3-column grid. Each gauge shrinks
proportionally; the center text and arcs scale with the container.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: arc fill respects
threshold escalation (test with values just above/below `warnAt` and
`dangerAt`); center text legible on both themes; sweep animation respects
`prefers-reduced-motion`; the 270° arc spans -135° to +135° (the gap
is at the TOP, not the bottom).
