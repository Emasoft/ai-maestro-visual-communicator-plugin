# Clip-reveal wipe — `data-va-reveal="clip"` left-to-right unmask

A scroll-reveal variant that "wipes" the element in from left to
right via `clip-path: inset()`. The content is FULLY rendered (no
opacity:0); only the clip mask animates. Reads as "the page is
drawing the element in".

## The contract

```html
<section data-va-reveal="clip">
  …
</section>
```

The element starts FULLY VISIBLE with a clip-path that hides
everything (`inset(0 100% 0 0)` = inset on the right by 100% =
nothing visible). On reveal (when the IntersectionObserver
triggers), the clip-path animates to `inset(0 0 0 0)` (nothing
inset = everything visible).

## The CSS

```css
[data-va-reveal="clip"] {
  clip-path: inset(0 100% 0 0);
  transform: none;
  /* transition from base [data-va-reveal] rule */
}
[data-va-reveal].va-in {
  opacity: 1;
  transform: none;
  clip-path: inset(0 0 0 0);
}
```

The base `[data-va-reveal]` rule sets `opacity: 0`, but the
`clip` variant overrides `transform: none` (the base uses
`translateY(30px)`); the `clip-path: inset(0 100% 0 0)` provides
the masking. When `.va-in` is added, opacity transitions to 1,
the clip-path transitions to fully open.

The transition rule from the base applies to BOTH opacity and
transform but NOT clip-path — the clip-path is transitioned via
its own implicit interpolation (browsers can interpolate
`inset()` keyword arguments).

To explicitly transition the clip-path, the skill could add:

```css
[data-va-reveal] {
  transition: opacity var(--vc-duration-entrance) var(--vc-easing-decel),
              transform var(--vc-duration-entrance) var(--vc-easing-decel),
              clip-path var(--vc-duration-entrance) var(--vc-easing-decel);
}
```

The current rules omit the `clip-path` transition explicitly,
relying on browser default transition behavior. This works in all
modern browsers (Chromium, Firefox, Safari 14+).

## The `inset()` syntax

`inset(top right bottom left)` — four insets defining the visible
region:

| state | inset values | visible region |
|---|---|---|
| start | `0 100% 0 0` | top 0, right 100%, bottom 0, left 0 → nothing visible (right inset eats the whole element) |
| `25%` of reveal | `0 75% 0 0` | right 75% inset → 25% visible from the left |
| `50%` of reveal | `0 50% 0 0` | half visible |
| end | `0 0 0 0` | no insets → fully visible |

The wipe happens by transitioning the RIGHT inset from 100% to 0%.
The element is uncovered left-to-right. To wipe right-to-left,
swap to `inset(0 0 0 100%)` initial state (left inset starts at
100%):

```css
[data-va-reveal="clip-rtl"]    { clip-path: inset(0 0 0 100%); }
[data-va-reveal].va-in { clip-path: inset(0 0 0 0); }
```

The skill ships only the LTR clip wipe — RTL is a custom
extension.

## When to use clip-reveal

- **Horizontal rule / divider** — a section break wipes in,
  emphasizing the transition.
- **Code blocks** — the code "draws itself" in left-to-right,
  matching how the user reads.
- **Image / chart entry** — alternative to fade-and-rise for
  elements where translation feels wrong (e.g. centered hero
  image).
- **Banner / hero** — a wide hero element wipes in dramatically.

When NOT to use:
- **Vertical lists** — list items should cascade with stagger,
  not wipe.
- **Text paragraphs** — text wiping in left-to-right looks
  artificial because the user is already reading left-to-right;
  the wipe competes with the reading direction.
- **Square / portrait-oriented elements** — the LTR wipe reads as
  awkward on a tall narrow element.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-entrance` (600ms default) | wipe duration |
| `--vc-easing-decel` (decel curve) | the arrival curve |

`--vc-motion-scale` is NOT consumed by the clip variant (the
clip-path doesn't have a "distance" to damp). At `motion.scale: 0`
the clip still animates fully — the calm-mode contract is for
TRANSFORM distance, not clip animations.

## Reduced-motion substitute

The base reveal rule's `reduce` branch covers the clip variant
too:

```css
@media (prefers-reduced-motion: reduce) {
  [data-va-reveal]       { opacity: 0;
                           transition: opacity 200ms ease; }
  [data-va-reveal].va-in { opacity: 1; }
}
```

The clip-path is NOT set in the reduce branch — meaning the
default rules from above (which include
`clip-path: inset(0 100% 0 0)`) would still apply, hiding the
element entirely.

This is a BUG in the current rule order — the reduce branch needs
to explicitly override the clip-path for the clip variant:

```css
@media (prefers-reduced-motion: reduce) {
  [data-va-reveal="clip"] { clip-path: none; opacity: 0; }
  [data-va-reveal="clip"].va-in { opacity: 1; }
}
```

This file documents the intended behavior; the runtime CSS would
need a small fix to ship the explicit clip-path override under
`reduce`. Audit the runtime CSS during the next pass.

## Counter targets are not clip targets

A `.va-counter` is observed by the same IO but the reveal action
is the count-up — not a clip animation. The counter rolls 0→N;
the clip variant is for content that REVEALS, not for content
that COUNTS.

You can combine them at the markup level if needed:

```html
<div data-va-reveal="clip">
  <span class="va-counter" data-va-stat="100">0</span>
</div>
```

The outer `<div>` wipes in (clip animation). The inner `.va-counter`
stays visible (no clip-path on it specifically) but its
count-up triggers separately via the counter selector hit.

## Selection + comment + decision integration

`[data-va-reveal="clip"]` elements are stamped with `data-ve-id`
+ `data-ve-type="card"` — same as any reveal target. The clip
variant doesn't change the atom contract.

## Performance

`clip-path` is a compositor-friendly property in modern browsers
(animated on the GPU thread). The wipe animation costs negligible
CPU.

Older browsers (pre-2018) sometimes layout-flushed on clip-path
changes. Modern baseline is fine.

## Diagnostics

- **Element appears INSTANTLY with no wipe** → the `clip-path`
  transition is being suppressed; check the parent has no
  `overflow: hidden` clipping that overrides the inset visually
  (the inset still animates but the parent crops first).
- **Element stays hidden after reveal** → the `.va-in` class
  isn't being added (IntersectionObserver issue) OR the
  `clip-path: inset(0 0 0 0)` rule isn't being applied. Inspect
  the computed clip-path value after reveal.
- **Wipe is too fast/slow** → tune `--vc-duration-entrance` in
  the DESIGN.md, OR override on the element:
  `style="transition-duration: 800ms"`.
- **Wipe under `reduce` hides element entirely** → known bug;
  the reduce branch needs a `clip-path: none` override for the
  clip variant. Override at the page level if encountered.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `[data-va-reveal="clip"]` element below the
   fold.
2. Confirm initial state: `getComputedStyle(el).clipPath` is
   `inset(0px 100% 0px 0px)` (or equivalent).
3. Scroll the element into view.
4. Wait 600ms (the entrance duration).
5. Confirm final state: `clipPath` is `inset(0px 0px 0px 0px)` or
   `inset(0)` (browsers normalize).
6. Take a screenshot at t=200ms (mid-wipe). The element should be
   ~33% visible from the left.
7. With `prefers-reduced-motion: reduce`, repeat. The element
   should fade-in over 200ms WITHOUT the clip wipe (and ideally
   without the clip-path hiding it entirely — see the bug note
   above).
