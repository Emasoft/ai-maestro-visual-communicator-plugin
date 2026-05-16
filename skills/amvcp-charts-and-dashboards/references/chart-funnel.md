# `chart:funnel@1` — funnel chart

A vertical pile of narrowing trapezoidal stages. The wide top tapers to a
narrow bottom — exactly the shape of a conversion funnel. Drop-off
percentage between consecutive stages prints between trapezoids.

## When to choose funnel

Use `funnel` when:

- The data is a SEQUENTIAL STAGE COUNT (visitors → signups → activated → paid).
- The reader cares about WHERE the largest drop-off is.
- The narrowing geometry visually reinforces the "fewer at each step" story.

Pick `bar` (sorted ascending) instead when the stages are NOT sequential
(e.g. "users by feature usage" — they're independent).
Pick `waterfall` instead when the bars represent DELTAS and the story is a
cumulative bridge.

## Authoring shape

```chart:funnel@1
{
  "title": "Signup funnel — last 30 days",
  "subtitle": "Activation is the biggest drop (50% lost)",
  "series": [{ "label": "users", "data": [
    {"x":"Visited","y":10000},
    {"x":"Signed up","y":4200},
    {"x":"Activated","y":2100},
    {"x":"Paid","y":680}
  ] }]
}
```

- `data[k].x` — the stage label (printed inside the trapezoid).
- `data[k].y` — the count at that stage. The first stage's count establishes the funnel width; every subsequent stage's width is proportional to its y.
- Stages should DESCEND: data[k+1].y < data[k].y, otherwise the funnel inverts visually (each trapezoid widens) — meaningful only in rare cases (a "reverse funnel" / "amplification" story).

## Options

| Key | Default | Effect |
|---|---|---|
| _(none specific to funnel)_ | | |

## Examples

### 1. E-commerce funnel

```chart:funnel@1
{ "title": "Holiday season checkout funnel",
  "series": [{ "label": "sessions", "data": [
    {"x":"Landing","y":48000},
    {"x":"PDP view","y":18200},
    {"x":"Add to cart","y":6400},
    {"x":"Checkout","y":2100},
    {"x":"Purchase","y":840}
  ] }] }
```

### 2. Hiring funnel

```chart:funnel@1
{ "title": "Q4 engineering hiring funnel",
  "series": [{ "label": "candidates", "data": [
    {"x":"Applied","y":840},
    {"x":"Phone screen","y":210},
    {"x":"On-site","y":48},
    {"x":"Offer","y":12},
    {"x":"Hired","y":7}
  ] }] }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
  <g class="ve-chart-funnel">
    <!-- Per stage: ONE polygon (trapezoid) + stage label + drop-off label. -->
    <polygon class="ve-chart-funnel-stage"
             points="(top-left, top-right, bottom-right, bottom-left)"
             fill="(ramp(t, sequential))"
             data-ve-id="ve-chart-N-d0-i0"
             data-ve-type="chart-point" …>
      <title>Visited: 10000</title>
    </polygon>
    <text class="ve-chart-funnel-label" x="(midX)" y="…" text-anchor="middle">
      Visited  10k
    </text>
    <text class="ve-chart-funnel-drop" x="(midX)" y="…" text-anchor="middle">
      ↓ 58% drop
    </text>
    <polygon class="ve-chart-funnel-stage" fill="(next ramp color)" …>
      <title>Signed up: 4200</title>
    </polygon>
    …
  </g>
</svg>
```

Each trapezoid's top width = `(v / maxV) * plotW`, bottom width =
`(nextV / maxV) * plotW`. The first stage's width sets the funnel's
widest point.

## Lib functions called

`_renderFunnel(spec, fig)`:

- `maxV = max(data[*].y)` (default 1).
- For each stage:
  - Compute trapezoid points using `(v / maxV)` for top width and `(nextV / maxV)` for bottom width.
  - Fill via `ramp(1 - di / max(1, n-1), 'sequential')` — top stages paint the darkest accent, bottom stages fade lighter. (This gives the funnel a "weight at top" visual hierarchy.)
  - Append the `<polygon class="ve-chart-funnel-stage">` and `markPoint(stage, …)`.
  - Append `<text class="ve-chart-funnel-label">` centered with stage name + value.
  - Append `<text class="ve-chart-funnel-drop">` showing the drop-off % to the next stage (`Math.round((1 - nextV/v) * 100)`).
- `animateOnView` adds the `.ve-chart-animate` class for entry CSS.

## DESIGN.md tokens

| Token | Used for |
|---|---|
| `--vc-color-accent` | Sequential ramp anchor (each stage's fill is a `color-mix` toward this). |
| `--vc-color-surface` | Sequential ramp cold end (lighter stages mix toward this). |
| `--vc-color-content` | Stage label fill (the label printed inside the trapezoid). |
| `--vc-color-content-muted` | Drop-off label fill. |

## Selection / atoms

Each STAGE polygon is a `chart-point` atom. Selecting "Checkout" lets the
reader comment on "the checkout stage's count" specifically. The labels
are decorative.

## Anti-patterns

- **Increasing y values across stages.** Funnel implies narrowing. If y goes UP at any step, that step's trapezoid is wider than the previous and the visual breaks. Either reorder, or use `bar` (which has no implicit "must narrow" expectation).
- **2 stages.** A 2-stage funnel is just two trapezoids; uninformative. Use `metric-cards` with a delta to communicate "before/after" with one number each.
- **Mixing units across stages.** Like every chart, stages share a unit (sessions, candidates, $). Mixing breaks the narrative.
- **Negative or zero `y` at any stage.** A zero stage collapses to a point; the funnel renders but reads awkwardly. Reorder so zero stages go at the end, or filter them out.

## Funnel vs alternatives — comparison

| Question | Best chart | Why |
|---|---|---|
| Where in the journey do we lose the most users? | `funnel` | Trapezoid narrowing makes the biggest drop visually unmissable. |
| What's the cumulative conversion rate? | `funnel` + a `metric-cards` showing "X% end-to-end" | Funnel visualises path; metric-cards quantifies. |
| Compare conversion rates across cohorts | `connected-dot-plot` per stage | Per-stage paired comparison reads cleaner than two side-by-side funnels. |
| Show cumulative gains/losses (not a journey) | `waterfall` | Waterfall is about CONTRIBUTIONS that add to a total; funnel is about a SEQUENCE that loses count. |

## Funnel + drop-off pattern

The renderer auto-computes and prints the drop-off % BETWEEN consecutive
stages. The visual:

```
[Stage 1: 10000]
    ↓ 58% drop
[Stage 2: 4200]
    ↓ 50% drop
[Stage 3: 2100]
    ↓ 68% drop
[Stage 4: 680]
```

The drop-off label sits midway between two trapezoids. Readers see BOTH
the absolute count AND the per-step loss percentage without doing the
arithmetic themselves.

For a "cumulative conversion rate" call-out (the end-to-end percentage,
e.g. 7% from Stage 1 to Stage 4 in this example), pair the funnel with
a `metric-cards` figure above or below.

## Reverse funnel (amplification)

A "reverse funnel" — counts INCREASING through stages — is supported by
the renderer but read awkwardly. The trapezoids WIDEN instead of
narrow. Use cases:

- A referral chain (1 user invites 3 invites 9 …).
- A leverage chain (1 sponsor → 10 affiliates → 100 buyers).

If the story is genuinely an amplification, the chart works; if the
story is a conversion funnel that happens to have one expanding stage
(unusual), break into two funnels.

## Funnel with custom colors

The funnel uses the SEQUENTIAL OKLCH RAMP (top stage = darkest accent,
bottom stage = palest). This is hardcoded in `_renderFunnel`:

```js
ramp(1 - di / Math.max(1, n - 1), 'sequential')
```

You cannot override the per-stage fill from the spec. To change the
overall feel, edit the DESIGN.md tokens (`--vc-color-accent`,
`--vc-color-surface`).

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: stage labels do not
overlap with the drop-off labels; trapezoid color gradient (sequential
ramp) is consistent on both themes; the `↓` glyph in the drop-off label
renders correctly; trapezoid widths proportional to the y values (the
top trapezoid is widest); the funnel does not exceed the plot area
(width clamps to plotW even when y values are extreme).
