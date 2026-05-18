# Chart skill handoff — counter primitive and entrance animations

## Table of Contents

- [`animateStat(el)` — the counter primitive](#animatestatel--the-counter-primitive)
- [How the chart skill should call it](#how-the-chart-skill-should-call-it)
- [Why the chart skill doesn't re-implement count-up](#why-the-chart-skill-doesnt-re-implement-count-up)
- [Chart entrance animations](#chart-entrance-animations)
- [Stat-card reveal pattern](#stat-card-reveal-pattern)
- [Chart canvas + animation skill](#chart-canvas--animation-skill)
- [DESIGN.md tokens shared](#designmd-tokens-shared)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Future chart-skill extensions](#future-chart-skill-extensions)

The chart skill consumes two animation primitives from this
skill: `animateStat(el)` for KPI-card counters, and the entrance
animation patterns for chart reveal. This file documents the
contract between the two skills.

## `animateStat(el)` — the counter primitive

Exported on the public API:

```js
amvcpAnimation.animateStat(el);
```

Where `el` is an element with:
- `data-va-stat="N"` — the target value (a finite number)
- (optional) `data-va-stat-decimals="K"` — decimal precision
- (optional) `data-va-stat-suffix="STR"` — suffix appended to formatted values

The helper:
1. Reads the target, decimals, suffix.
2. Reads `--vc-duration-slow` (400ms default) for the count
   window.
3. If `REDUCED` or `requestAnimationFrame` unavailable, sets the
   element's textContent to the final formatted value
   immediately.
4. Otherwise runs a rAF tick loop with easeOutCubic easing,
   updating `el.textContent` each frame.

## How the chart skill should call it

For a KPI card with an animated number:

```html
<div class="chart-kpi">
  <h3>Revenue</h3>
  <p class="chart-kpi-value">
    <span class="va-counter"
          data-va-stat="45200"
          data-va-stat-suffix=" USD">0</span>
  </p>
</div>
```

The chart skill's runtime would either:
1. **Let the animation skill auto-wire it.** The
   `.va-counter[data-va-stat]` selector is observed by the
   animation skill's reveal IO; on intersect, the counter
   animates. NO chart-skill JS needed.
2. **Manually trigger it.** Call
   `amvcpAnimation.animateStat(spanEl)` directly when the chart
   skill knows the card should start counting (e.g. after a
   chart-specific animation cycle).

Option 1 is the preferred pattern — minimal coupling between
skills. The chart skill only needs to author the markup; the
animation skill handles everything.

## Why the chart skill doesn't re-implement count-up

A count-up looks simple. But re-implementing it would mean:
- Re-implementing the rAF tick loop.
- Re-implementing the `REDUCED` early-exit branch.
- Re-implementing the easing function.
- Re-implementing the duration-from-token resolution.
- Re-implementing the formatting (decimals + suffix).
- Re-implementing the fail-fast bad-number handling.

That's a ~30 LOC primitive that already exists in this skill.
Reuse > re-implement.

## Chart entrance animations

Charts have specific entrance patterns:
- **Bar chart**: bars grow up from their base.
- **Line chart**: line draws left-to-right.
- **Pie chart**: arcs sweep from 12 o'clock.
- **Donut chart**: arcs sweep from 12 o'clock (same as pie).
- **Radar chart**: polygon inflates from center.
- **Scatter chart**: dots fade-in in sequence.

The chart skill MAY implement these as CSS keyframes that reuse
the animation skill's tokens:

```css
/* Inside the chart skill's runtime CSS */
.ch-bar-chart .ch-bar {
  animation: vaBarGrow var(--vc-duration-entrance, 600ms)
             var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1)) both;
  animation-delay: calc(var(--ch-bar-index, 0)
                     * var(--vc-duration-stagger-step, 80ms));
  transform-origin: bottom;
}
@keyframes vaBarGrow {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  .ch-bar-chart .ch-bar {
    animation: vaFadeOnly 200ms ease both;
  }
}
```

The chart skill:
- Uses `--vc-duration-entrance` and `--vc-easing-decel` from the
  animation skill's token contract.
- Uses `--vc-duration-stagger-step` for per-bar stagger (same as
  the animation skill's `--va-index` mechanism, but with a
  chart-specific custom property `--ch-bar-index`).
- Reuses `vaFadeOnly` keyframe (shipped by animation skill) for
  the reduce substitute.

The contract: tokens + keyframe NAMES are shared; the chart
skill writes its own per-chart-type rules.

## Stat-card reveal pattern

A common chart-skill pattern: a row of KPI cards that each
contain a counter. Each card cascades in, then the counter
inside it counts up.

```html
<div class="va-stagger" data-va-stagger data-va-reveal="stagger">
  <div class="va-stagger-item ch-kpi-card">
    <h3>Revenue</h3>
    <span class="va-counter" data-va-stat="45200" data-va-stat-suffix=" USD">0</span>
  </div>
  <div class="va-stagger-item ch-kpi-card">
    <h3>Users</h3>
    <span class="va-counter" data-va-stat="1247">0</span>
  </div>
  <div class="va-stagger-item ch-kpi-card">
    <h3>Growth</h3>
    <span class="va-counter" data-va-stat="12.5" data-va-stat-decimals="1" data-va-stat-suffix="%">0</span>
  </div>
</div>
```

The composition:
1. The `[data-va-reveal="stagger"]` parent triggers when scrolled
   into view.
2. The cascade adds `.va-in` to the parent, animating each card
   in sequence (per `--va-index`).
3. EACH card also has a `.va-counter[data-va-stat]` inside.
4. The animation skill's reveal observer also sees the counters
   — but they're inside an already-revealing parent, so the IO
   threshold triggers their count-up at roughly the same time
   the card is animating in.
5. Result: cards cascade in WHILE their counters count up.

Pure composition; no extra coupling required.

## Chart canvas + animation skill

For canvas-based charts (the chart skill might use canvas for
very large datasets), the animation skill's `createLoop(update,
render)` primitive applies:

```js
function animateChartCanvas(canvas, data) {
  if (window.amvcpAnimation.REDUCED) {
    drawFinalChart(canvas, data);
    return;
  }
  var t = 0;
  var dur = parseFloat(getComputedStyle(document.documentElement)
                       .getPropertyValue('--vc-duration-entrance')) / 1000
            || 0.6;
  var loop = amvcpAnimation.createLoop(
    function update(dt) {
      t += dt;
      if (t > dur) { t = dur; loop.stop(); }
    },
    function render() {
      var frac = t / dur;
      var eased = 1 - Math.pow(1 - frac, 3);   // easeOutCubic
      drawChartFrame(canvas, data, eased);
    }
  );
  loop.start();
}
```

The chart skill calls `createLoop` for canvas entrance
animations. The loop primitive provides the correct delta-time
handling; the chart skill provides the chart-specific drawing.

## DESIGN.md tokens shared

| token | role in animation skill | role in chart skill |
|---|---|---|
| `--vc-duration-entrance` | stagger / reveal duration | bar grow, line draw |
| `--vc-duration-slow` | counter window | KPI count-up |
| `--vc-duration-stagger-step` | per-`--va-index` delay | per-bar/per-segment delay |
| `--vc-easing-decel` | arrival curve | chart entrance curve |
| `--vc-motion-scale` | distance damper | applies to chart transforms too |
| `--vc-color-accent` | pulse + progress bar | chart accent line / bar color |

## Reduced-motion substitute

The chart skill should follow the same pattern:
- Information-bearing chart animations → meaning-preserving
  substitute (instant final state).
- Decorative chart animations (if any) → removal.

For an instant-final-state substitute, the chart skill's CSS:

```css
@media (prefers-reduced-motion: reduce) {
  .ch-bar { transform: scaleY(1) !important; animation: none !important; }
  .ch-line-path { stroke-dashoffset: 0 !important; animation: none !important; }
}
```

The reduced-motion-gate.md file in this skill is the
authoritative reference for the substitute patterns.

## Selection + comment + decision integration

Chart elements are commentable atoms. The chart skill stamps:

```js
var SEL = '.ch-bar-chart, .ch-line-chart, .ch-kpi-card, ...';
var nodes = d.querySelectorAll(SEL);
for (var i = 0; i < nodes.length; i++) {
  el.setAttribute('data-ve-id', generateChartId(el));
  el.setAttribute('data-ve-type', 'chart');   // distinct from 'card'
  rt.attachDecisionMini(el, generateChartId(el));
}
```

The chart skill's atom types are `chart`, `kpi-card`, etc. —
different from the animation skill's `card` / `counter`. Both
skills can stamp their own atoms without conflict.

## Diagnostics

- **Counter never fires** → confirm the chart skill's container
  doesn't hide the counter from the IO (no `display: none` on
  the counter or an ancestor).
- **Counter shows placeholder text in static export** → the
  counter never revealed because the page never scrolled
  through it. Pre-render before export.
- **Chart entrance and counter race** → the cascade duration
  (600ms) and counter duration (400ms) overlap. Either is fine;
  if you want sequential, set `animation-delay` on the chart
  entrance to be longer than the counter.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a chart-with-counters block below the fold.
2. Scroll into view.
3. Confirm the cards cascade in AND the counters count up
   simultaneously.
4. Final state: cards fully visible, counters at their target
   values.
5. With `prefers-reduced-motion: reduce`, confirm cards
   fade-in (no cascade) and counters appear at final values
   instantly.

## Future chart-skill extensions

When the chart skill adds:
- **Animated chart transitions** (e.g. data updates causing
  bars to re-grow), use `createLoop` for the canvas path.
- **Radial / arc charts** (pie, donut), use SVG `stroke-dasharray`
  + `stroke-dashoffset` animations with the same token
  contract.
- **Particle / scatter charts**, use `createLoop` with per-
  particle update logic.

In all cases: reuse the animation skill's primitives. Don't
re-implement.
