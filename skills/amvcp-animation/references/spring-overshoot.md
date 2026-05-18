# Spring overshoot — `--vc-easing-spring` for playful arrivals

## Table of Contents

- [The curve](#the-curve)
- [When to use](#when-to-use)
- [Markup example — a spring scale-in](#markup-example--a-spring-scale-in)
- [The skill DOES NOT ship a default `.va-spring-in` class](#the-skill-does-not-ship-a-default-va-spring-in-class)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Confetti pop — the mined variant (`07-prototype-animation.html`)](#confetti-pop--the-mined-variant-07-prototype-animationhtml)
- [Settle keyframe — the 3-keyframe spring](#settle-keyframe--the-3-keyframe-spring)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [How the curve is constructed](#how-the-curve-is-constructed)

The one curve in the skill that goes ABOVE 1 — playful, attention-
grabbing, intentionally not standard. Reserve for the one element
per page that deserves to overshoot its target.

## The curve

`cubic-bezier(0.34, 1.56, 0.64, 1)`. The Y value 1.56 at X=0.34
means the property value transiently passes its target by 56%
before settling at 1. The curve composes with linear-interpolatable
properties (transform values, opacity) to produce a transient
"overshoot" — the element passes its destination then bounces back.

```
Y axis (property value)
1.56 ┤            ╱─╮
 1   ┤   ╱──────╯  ╰──── (target — settles here)
 0   ┼──╯              
     0    0.34       1   X axis (time fraction)
```

## When to use

- **The hero arrival** — when the page's primary element appears
  (one per page).
- **Celebration** — a "task complete" affordance, a counter that
  lands.
- **Card landing** — when a card is dropped into a deck (e.g.
  drag-and-drop end animation).
- **Modal entry** — a modal appearing with a slight overshoot
  reads as confident, not formal.

When NOT to use:
- **Every entrance.** Spring on every card in a list is exhausting.
- **Infinite loops.** Spring overshoots once, then settles —
  applying it to a loop makes every cycle overshoot, which reads
  as broken.
- **Opacity-only animations.** Opacity values above 1 are clamped,
  so the overshoot is invisible. The perceptual cost (slower mid-
  animation) remains; no visual reward.
- **Elements near a viewport edge.** Overshoot pushes the element
  off-screen for the overshoot frames; jarring.

## Markup example — a spring scale-in

```html
<div class="va-spring-in">
  <svg>…</svg>   <!-- a celebration icon -->
</div>
```

```css
.va-spring-in {
  animation: vaScaleIn var(--vc-duration-slow, 400ms)
             var(--vc-easing-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) both;
}
@keyframes vaScaleIn {
  from { transform: scale(0.92); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .va-spring-in { animation: vaFadeOnly 200ms ease both; }
}
```

The element starts at `scale(0.92)` and animates to `scale(1)`.
With the spring curve, the actual rendered scale TRANSIENTLY passes
1.0 (peaks around `0.92 + (1.0 - 0.92) * 1.56 = 1.045` ≈ 5%
overshoot) then settles at 1.0. The transient peak reads as a
small "thump".

Opacity goes from 0 to 1 in the same window — the spring overshoot
on opacity is clamped (values > 1 are illegal), so opacity rises
straight to 1 without overshoot. Visible only on the transform.

## The skill DOES NOT ship a default `.va-spring-in` class

The spring is an INTENTIONAL deviation — applied to ONE element per
page, by the author's hand. The skill ships:

- The TOKEN (`--vc-easing-spring`) — themed and accessible.
- The CURVE (`cubic-bezier(0.34, 1.56, 0.64, 1)`) — fallback.
- Documentation of the pattern (this file).

The skill does NOT ship:
- A `.va-spring-in` utility class. (Author writes their own.)
- A spring on `.va-stagger-item` or `[data-va-reveal]`. (Standard
  is decel; spring is opt-in.)

This is by design: the spring is a STYLE CHOICE, not a default
animation primitive. Defaults should feel safe and predictable;
the spring is intentional flavor.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-easing-spring` | the overshoot curve |
| `--vc-duration-slow` (400ms default) OR custom duration | the spring window |

Spring works best at 300-500ms — too short and the overshoot is
invisible; too long and the bounce reads as broken.

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .va-spring-in { animation: vaFadeOnly 200ms ease both; }
}
```

The substitute REPLACES the spring keyframe with the standard
`vaFadeOnly` 200ms fade. No spring, no overshoot, no scale —
opacity only.

Meaning preserved (the element arrives) without the motion (the
spring + scale). This is the same substitute pattern used for the
`.va-stagger-item` — the underlying animation differs (spring vs
decel), but the reduce branch collapses both to the same opacity
fade.

## Confetti pop — the mined variant (`07-prototype-animation.html`)

The html-effectiveness mining catalog notes a "CSS-only confetti
pop" pattern at `07-prototype-animation.html`:

```html
<span class="va-confetti" style="--dx:60px; --dy:-80px; --rot:45deg;"></span>
<span class="va-confetti" style="--dx:-50px; --dy:-90px; --rot:-20deg;"></span>
<!-- 6 absolutely-positioned 6×6 squares -->
```

```css
.va-confetti {
  position: absolute;
  width: 6px; height: 6px;
  background: var(--vc-color-accent);
  animation: vaPop 520ms cubic-bezier(.34, 1.56, .64, 1) forwards;
}
@keyframes vaPop {
  0%   { transform: translate(0, 0) rotate(0); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
         opacity: 0; }
}
```

Each confetti particle reads its OWN `--dx`, `--dy`, `--rot` custom
properties (so 6 particles fly in 6 different directions with 6
different rotations from one shared keyframe). The spring curve is
applied to the translation — particles overshoot their final
position then snap back to it as they fade.

The skill does NOT ship `.va-confetti` (that's task-specific UI,
not a general primitive). Reference here: spring composes well
with multi-particle systems where each particle moves
independently.

## Settle keyframe — the 3-keyframe spring

The mining catalog also notes a "spring settle" pattern as a
3-keyframe spring fake:

```css
.va-settle {
  animation: vaSettle 300ms cubic-bezier(.34, 1.56, .64, 1) forwards;
}
@keyframes vaSettle {
  0%   { transform: scale(0.8); }
  55%  { transform: scale(1.18); }  /* overshoot peak — manually authored */
  100% { transform: scale(1.0); }   /* settle */
}
```

This is the "spring without physics" pattern — author the
keyframe with an explicit overshoot peak at 55%, use the spring
easing for the in-betweens. Composes deterministically (you know
exactly where the peak is), unlike a single-keyframe spring where
the peak is implicit in the curve.

The skill does NOT ship `.va-settle` — same reasoning as
`.va-confetti`. Pattern is documented for authors.

## Selection + comment + decision integration

A spring-in element is comment-able IF it's also marked as a
content atom (`[data-va-reveal]`, `.va-stagger-item`, or
`.va-counter[data-va-stat]`). The spring curve doesn't change the
atom contract.

```html
<div class="va-spring-in" data-va-reveal>
  …
</div>
```

The reveal observer fires on scroll-in, the spring animation
plays, the user can comment on the element.

## Diagnostics

- **Spring doesn't overshoot visibly** → the property being
  animated is opacity-only (clamped). Spring is invisible on
  opacity; needs transform.
- **Spring overshoots and stays overshot** → the keyframe's `to`
  state is at the overshoot value, not the target. Author the
  `to` state at the target (e.g. `transform: scale(1)`), not the
  peak.
- **Spring feels too aggressive** → reduce the source-to-target
  delta (e.g. start at `scale(0.95)` instead of `scale(0.8)`); the
  overshoot is proportional to the delta.
- **Spring under `reduce` still runs** → the reduce branch is
  missing the substitute. Add the 200ms fade fallback.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a spring-in element below the fold.
2. Scroll into view. Capture screenshots at t=100, 200, 300, 400ms
   after reveal.
3. The scale at t=200 should be ABOVE 1.0 (the overshoot peak —
   roughly 1.04-1.06 for a 0.92→1.0 spring).
4. The scale at t=400 should be exactly 1.0 (settled).
5. With `prefers-reduced-motion: reduce`, repeat. The element
   should fade-in over 200ms with no scale change.

## How the curve is constructed

The cubic-bezier control points are `(0.34, 1.56)` and
`(0.64, 1.0)`. The first control point's Y above 1.0 is what
makes the curve overshoot — the interpolation passes above the
endpoint before easing back.

If you want a SOFTER spring (less overshoot), reduce the first Y
value: `cubic-bezier(0.34, 1.2, 0.64, 1)` overshoots by 20%
instead of 56%.

If you want a more AGGRESSIVE spring (more overshoot, more
bounce), increase: `cubic-bezier(0.34, 1.8, 0.64, 1)` overshoots
by 80%. Above 1.6 the bounce starts to feel uncanny — like the
element doesn't know where to stop.

The skill ships only one spring curve (`1.56` overshoot, ~5-10%
visual peak depending on the property delta). Authors who need
variants override the `--vc-easing-spring` custom property at the
element level.
