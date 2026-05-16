# `chart:diverging-bar@1` — diverging bar

A bar chart whose values may be POSITIVE or NEGATIVE. Bars rise above the
zero baseline in the success color; bars drop below in the danger color.
Used for signed metrics: sentiment, net change, surplus/deficit, delta vs
benchmark.

## When to choose diverging-bar

Use `diverging-bar` when:

- The metric is signed (`+34`, `-12`) and the SIGN carries semantic weight.
- The reader needs to spot positive vs negative outliers at a glance.
- The zero baseline is a meaningful reference, not an arbitrary axis bottom.

Pick `bar` instead when every value is positive or when the sign is not
meaningful (counts, magnitudes).
Pick `bullet` instead when each value has an associated target rather than a
zero reference.

## Authoring shape

```chart:diverging-bar@1
{
  "title": "Net sentiment by region — Q3",
  "subtitle": "EU softened; APAC lifted on the new model release",
  "series": [{ "label": "Net Promoter score", "data": [
    {"x":"NA","y":34},
    {"x":"EU","y":-12},
    {"x":"APAC","y":21},
    {"x":"LATAM","y":-8}
  ] }]
}
```

- Negative values use `--vc-color-danger`; positive use `--vc-color-success`. The author does NOT set colors per datum — the sign IS the color.
- The y-domain is computed from `[dataMin, dataMax]` (not `[0, dataMax]`) and rounded by `niceTicks(dataMin, dataMax, 4)`. The y-axis crosses zero somewhere in the middle of the plot area.
- Single series only is supported; a multi-series diverging-bar would be ambiguous (which series's sign drives the color?).

## Options

| Key | Default | Effect |
|---|---|---|
| `sortDescending` | `false` | Reorder categories by y (largest positive first, smallest negative last). Useful — places the most positive next to the most negative for visual contrast. |
| `valueLabels` | `false` | Print formatted value above each bar. Recommended for diverging — readers need to confirm the sign. |

## Examples

### 1. Surplus / deficit

```chart:diverging-bar@1
{ "title": "Department budget variance — actual vs plan ($k)",
  "series": [{ "label": "variance", "data": [
    {"x":"Eng","y":-42},
    {"x":"Sales","y":81},
    {"x":"Ops","y":12},
    {"x":"Marketing","y":-18},
    {"x":"Support","y":-7}
  ] }],
  "options": { "sortDescending": true, "valueLabels": true }
}
```

### 2. Sentiment shift (signed delta)

```chart:diverging-bar@1
{ "title": "NPS change — this quarter vs last",
  "series": [{ "label": "ΔNPS", "data": [
    {"x":"Onboarding","y":12},
    {"x":"Pricing","y":-9},
    {"x":"Docs","y":18},
    {"x":"Support","y":-3}
  ] }],
  "options": { "valueLabels": true } }
```

## What the runtime emits

```html
<figure class="ve-chart"
        data-ve-chart-type="diverging-bar"
        data-ve-chart-backend="svg" …>
  <svg class="ve-chart-svg" viewBox="0 0 640 360" …>
    <!-- Gridlines computed from [dataMin, dataMax], not [0, dataMax]. -->
    <g class="ve-chart-gridlines">…</g>
    <!-- The zero baseline sits at yScale(0), not yBase. -->
    <line class="ve-chart-baseline" x1="…" y1="…" x2="…" y2="…"/>
    <g class="ve-chart-bars">
      <!-- Positive bar: from yScale(val) up to zeroY, painted success. -->
      <rect class="ve-chart-bar" fill="var(--vc-color-success, #3a6b5c)" …/>
      <!-- Negative bar: from zeroY down to yScale(val), painted danger. -->
      <rect class="ve-chart-bar" fill="var(--vc-color-danger, #a84a32)" …/>
    </g>
  </svg>
</figure>
```

Note the `<line class="ve-chart-baseline">` sits at `yScale(0)`, not at the
bottom of the plot. This is the key visual signal — the eye picks up the
zero line as the reference, bars on either side as positive/negative.

## Lib functions called

`renderSvgBar(spec, 'diverging-bar', fig)` — branches on `isDiverging`:

- `niceTicks(dataMin, dataMax, 4)` — ticks span the signed domain.
- `domBottom = tk.bottom` — typically a negative value.
- `zeroY = yScale(0)` — the visual zero baseline (NOT `yBase`).
- Per-datum fill: `'var(--vc-color-success, #3a6b5c)'` if `val >= 0`, else `'var(--vc-color-danger, #a84a32)'`.
- The `<line class="ve-chart-baseline">` is drawn at `zeroY`, replacing the usual y=0 axis-floor.

## DESIGN.md tokens (in addition to bar's)

| Token | Used for |
|---|---|
| `--vc-color-success` | Positive-bar fill. |
| `--vc-color-danger` | Negative-bar fill. |

Override these in DESIGN.md to swap the semantic palette (e.g. for a
red-green colorblind audience, swap to blue/orange).

## Selection

Same `chart-point` atom shape as `bar`. The payload's `value` field carries
the raw signed `y` so a downstream comment thread can quote the exact
number ("EU NPS dropped 12 points — why?").

## Diverging-bar vs alternatives

| Goal | Best chart | Why |
|---|---|---|
| Show signed deltas across categories | `diverging-bar` | Sign IS the color signal. |
| Show signed deltas with target reference | `bullet` | Bullet's target tick adds the reference. |
| Show signed values with magnitude weight | `diverging-bar` + `valueLabels:true` | Length encodes magnitude; color encodes sign. |
| Show one positive series with no negative comparison | `bar` sorted | Single-color bar is cleaner when sign is constant. |
| Show two signed series side by side | Two `diverging-bar` charts stacked vertically | Multi-series diverging-bar is ambiguous. |

## Semantic palette swap for colorblind audiences

The default semantic colors:
- POSITIVE = `--vc-color-success` (green in canonical theme)
- NEGATIVE = `--vc-color-danger` (red in canonical theme)

For a colorblind-accessible variant, swap the token values in DESIGN.md:
- `success: "#0072B2"` (blue)
- `danger: "#E69F00"` (orange)

The chart code does NOT change; the theme dictates the colors.

For "down is good" metrics (latency, error count, churn — where
DECREASE is the desirable direction), don't swap the semantic colors —
just INVERT the data in the spec. A reduction of 12ms becomes
`y: 12` (an improvement, painted success); an increase becomes
`y: -8` (painted danger). Add a subtitle clarifying ("Reduction in
p99 latency; up is good").

## Zero baseline behavior

The zero baseline is rendered as a separate `<line class="ve-chart-baseline">`
at `yScale(0)` — NOT at the bottom of the plot. This is the visual
signal that distinguishes diverging-bar from a regular bar chart.

When the data is all-positive, the renderer still uses
`niceTicks(dataMin, dataMax, 4)` which spans the signed domain. If
`dataMin >= 0`, the baseline coincides with the bottom of the plot —
the chart looks like a regular bar. (Sanity check: if your data is
all-positive, just use `bar` — the diverging features add no value.)

## Sort + sign combinations

| `sortDescending` | Sign distribution | Visual effect |
|---|---|---|
| `false` | mixed | Categories in author-supplied order. |
| `true` | all-positive | Largest at left, smallest at right (regular bar). |
| `true` | all-negative | Most-negative at LEFT (largest magnitude); least-negative at right. |
| `true` | mixed | Most-positive at left, most-negative at right (visual contrast: best vs worst side by side). |

The "mixed + sorted descending" case is the strongest visual — the eye
immediately compares the biggest mover up and the biggest mover down.

## Anti-patterns

- **Using a sequential color ramp (oklch).** Diverging-bar uses CATEGORICAL semantic colors (success/danger), not a ramp. The reader needs to distinguish "positive" from "negative" categorically, not "more positive" from "less positive".
- **Multi-series diverging.** Not supported by the renderer (color would be ambiguous). Split into two side-by-side single-series charts.
- **Mixing units.** Like all bar charts, the y-axis represents one quantity. `+12 deals` next to `-3°C` is meaningless.
- **Omitting `valueLabels`.** Strongly recommended — readers misjudge bar lengths near zero, and the sign matters. Show the exact number.
- **Diverging-bar where the metric is conceptually one-sided.** A "score from 0 to 100" doesn't need diverging; use `bar`. Diverging-bar implies zero IS a meaningful reference.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: light + dark theme
contrast for both success and danger colors, the zero baseline is visible
(not invisible against the gridline color), negative-bar value labels do
not collide with positive-bar labels, the y-axis labels span both positive
and negative ticks (e.g. -20, -10, 0, 10, 20, 30, 40).
