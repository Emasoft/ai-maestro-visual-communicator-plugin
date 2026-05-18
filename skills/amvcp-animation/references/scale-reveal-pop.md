# Scale reveal pop — `data-va-reveal="scale"` fade + scale-up

## Table of Contents

- [The contract](#the-contract)
- [The CSS](#the-css)
- [Why 0.94, not 0.85 or 0.97?](#why-094-not-085-or-097)
- [When to use scale reveal](#when-to-use-scale-reveal)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [The transform-origin question](#the-transform-origin-question)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Combining with stagger](#combining-with-stagger)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Performance](#performance)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Comparison with spring overshoot](#comparison-with-spring-overshoot)

A scroll-reveal variant that fades the element in WHILE scaling
from 0.94 to 1.0 — reads as "the element just landed on the
page". Use for cards, charts, and infographics that have a focal
center; avoid for translation-suitable content (use the default
fade+rise instead).

## The contract

```html
<section data-va-reveal="scale">
  <!-- card / chart / infographic / any element with a focal point -->
</section>
```

The element starts at `opacity: 0; transform: scale(0.94)`. On
reveal (IntersectionObserver fires), the transition takes opacity
to 1 and scale to 1.0. The combined effect is a "pop in" that's
gentler than a 0.5 → 1 scale (which would feel cartoonish) but
more present than a fade-only (which feels static).

## The CSS

```css
[data-va-reveal] {
  opacity: 0;
  transform: translateY(calc(30px * var(--vc-motion-scale, 1)));
  transition: opacity var(--vc-duration-entrance, 600ms)
                var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1)),
              transform var(--vc-duration-entrance, 600ms)
                var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1));
}

[data-va-reveal="scale"] { transform: scale(0.94); }

[data-va-reveal].va-in   { opacity: 1; transform: none;
                           clip-path: inset(0 0 0 0); }
```

The base `[data-va-reveal]` rule sets `translateY(30px)` and the
transition. The `[data-va-reveal="scale"]` variant OVERRIDES
`transform` to `scale(0.94)` (cancelling the translation). On
`.va-in`, the transform goes to `none` (which means `scale(1) translateY(0)`),
animating from `scale(0.94)` to `scale(1)` via the same
transition.

The transition rule covers BOTH translation AND scale because
both are `transform` values — the browser interpolates the entire
transform property.

## Why 0.94, not 0.85 or 0.97?

The 0.94 starting scale is a tuned middle-ground:

- **0.97** — too subtle. Almost imperceptible scale change; reads
  as "did it scale?" — uncertain.
- **0.94** — perfect. Visible scale, but not jarring. Reads as
  "the element grew into place".
- **0.90** — too pronounced. Starts to feel cartoonish; the
  element "pops" rather than "lands".
- **0.80** — too cartoonish. The user reads this as a CTA or a
  celebration, not a quiet reveal.

A 6% scale-up over 600ms gives the eye time to register the
change without becoming a focal event in itself.

## When to use scale reveal

- **Cards** — the canonical use. Cards have a clear focal center
  (their content); scale-up reads as "this card just landed
  here".
- **Charts** — scale-from-center makes a chart feel like it's
  being placed, not slid.
- **Infographics** — same as charts, scaled.
- **Hero images** — a hero image scaling-in from 94% reads as
  "this image is settling into the layout".
- **Quote blocks** — a pull quote scaling-in subtly emphasizes its
  importance.

When NOT to use:
- **Text paragraphs** — text shouldn't scale; reads as zoom.
- **List items** — scale every item in a list is exhausting; use
  the stagger cascade with default fade+rise.
- **Inline elements** — scale on an inline element pushes
  surrounding text around.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-entrance` (600ms default) | reveal duration |
| `--vc-easing-decel` (decel curve) | arrival curve |
| `--vc-motion-scale` (1 default) | NOT consumed by the scale variant |

The `--vc-motion-scale` master damper does NOT damp the
scale-from-0.94 amount. The starting scale is hardcoded. To make
the variant respect `motion.scale`, the rule would need:

```css
[data-va-reveal="scale"] {
  transform: scale(calc(1 - 0.06 * var(--vc-motion-scale, 1)));
}
```

At `motion.scale: 0`, the transform becomes `scale(1)` (no
scale-up), the element only fades in. This is a minor extension
the current rule does NOT include; documented here as a possible
enhancement.

## The transform-origin question

`transform: scale(0.94)` defaults to `transform-origin: 50% 50%`
— the element scales from its center. Both edges (top and bottom,
left and right) recede toward the center.

For some elements you might want a different origin:

```css
[data-va-reveal="scale-from-top"] {
  transform: scale(0.94);
  transform-origin: 50% 0%;   /* scale from top edge */
}
```

This makes the element "drop in from above" — the top edge stays
in place; the bottom edge grows downward. Useful for cards that
appear above their original position.

The skill ships only the default center origin — variants are
author-extended.

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  [data-va-reveal]       { opacity: 0;
                           transition: opacity 200ms ease; }
  [data-va-reveal].va-in { opacity: 1; }
}
```

The base reduce branch covers the scale variant — opacity fade
over 200ms, no transform. The scale-from-0.94 is dropped under
reduce; the element fades-in at its final size.

This is the correct substitute: the meaning (element appears) is
preserved; the motion (scale + fade) is reduced to fade only.

## Combining with stagger

The reveal-stagger variant uses the SAME 24px rise as the
auto-stagger; the scale variant uses a 0.94 scale. They are
DIFFERENT visual treatments; you can't combine them on the same
element.

If you want a STAGGERED list where each item scales-in:

```html
<div data-va-reveal="stagger">
  <div class="va-stagger-item" data-va-reveal="scale">First</div>
  <div class="va-stagger-item" data-va-reveal="scale">Second</div>
</div>
```

But this is conflict-prone: the parent's `data-va-reveal="stagger"`
expects children with the cascade transition pattern; the
children's `data-va-reveal="scale"` overrides their transform to
`scale(0.94)`, removing the translation the cascade uses.

The pragmatic answer: pick stagger OR scale, not both. If you
need scale-in items in a list, write a custom keyframe:

```css
.va-card-pop {
  animation: vaCardPop var(--vc-duration-entrance) var(--vc-easing-decel) both;
  animation-delay: calc(var(--va-index, 0) * var(--vc-duration-stagger-step, 80ms));
}
@keyframes vaCardPop {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
}
```

Then `.va-card-pop` is a stagger-aware scale animation. The skill
doesn't ship this — author extension.

## Selection + comment + decision integration

`[data-va-reveal="scale"]` elements are stamped with
`data-ve-id` + `data-ve-type="card"` — same as any reveal target.
The scale variant doesn't change the atom contract.

## Performance

`transform: scale(...)` is a compositor-friendly property
(animated on the GPU thread). No layout work, no paint work. The
scale animation costs negligible CPU.

## Diagnostics

- **Element appears at final size with no scale** → the
  `[data-va-reveal="scale"]` selector isn't matching; check the
  attribute value is exactly `"scale"` (case-sensitive).
- **Scale stops at a weird intermediate** → the `.va-in` class
  wasn't added; the IO trigger didn't fire. Confirm the element
  has crossed the 0.15 threshold.
- **Element flashes at full size, then scales** → the base
  `[data-va-reveal] { opacity: 0 }` rule didn't apply early
  enough; check the animation skill's CSS injected before content
  rendered.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `[data-va-reveal="scale"]` element below
   the fold.
2. Initial state: `getComputedStyle(el).transform` is
   `matrix(0.94, 0, 0, 0.94, 0, 0)` (the matrix form of
   `scale(0.94)`).
3. Scroll into view.
4. At t=300ms (mid-reveal), the transform matrix should be
   approximately `matrix(0.97, 0, 0, 0.97, 0, 0)` (interpolated
   halfway).
5. At t=600ms, the transform should be `matrix(1, 0, 0, 1, 0, 0)`
   or `none`.
6. With `prefers-reduced-motion: reduce`, repeat. The element
   should fade-in over 200ms without any scale change.

## Comparison with spring overshoot

The `scale` reveal variant scales-up to exactly 1.0 — it does NOT
overshoot. For an overshoot scale, use the spring curve (see
`spring-overshoot.md`):

```css
.va-spring-pop {
  animation: vaScaleIn 400ms var(--vc-easing-spring) both;
}
@keyframes vaScaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
```

This is a more playful variant — the element scales past 1.0 then
settles. Reserve for one element per page (e.g. a celebration).
The default `data-va-reveal="scale"` is the calm variant for any
card.
