# Pinned section — `position: sticky` for full-viewport pinning

## Table of Contents

- [The recipe](#the-recipe)
- [Why `position: sticky` works for this](#why-position-sticky-works-for-this)
- [Combining with view() timeline (native scroll-driven)](#combining-with-view-timeline-native-scroll-driven)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [When to use a pinned section](#when-to-use-a-pinned-section)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Performance](#performance)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Stacking variation](#stacking-variation)
- [Comparison with the snap pattern](#comparison-with-the-snap-pattern)
- [Author extension: the timeline-of-events pattern](#author-extension-the-timeline-of-events-pattern)

A section that "pins" to the top of the viewport as the user
scrolls past it. The user sees the section anchored while the
surrounding content scrolls beneath it. Built on `position:
sticky` — pure CSS, no JS scroll listener.

The skill's scroll-pattern catalog lists `pinned` as a P3
pattern. This file describes the canonical recipe.

## The recipe

```html
<section class="va-pinned" style="height: 100vh;">
  <h1>Pinned hero</h1>
</section>
<section style="height: 200vh;">
  <p>Following content, twice as tall as the viewport.</p>
</section>
```

```css
.va-pinned {
  position: sticky;
  top: 0;
  height: 100vh;
}
```

The pinned section:
1. Scrolls normally while it's BELOW the user's current position.
2. PINS when its top edge reaches the viewport top (`top: 0`).
3. Stays pinned until its BOTTOM edge reaches the viewport top
   (the next section pushes it up and out).
4. Scrolls normally OUT of view above.

The `height: 100vh` is what gives the section its "full
viewport" presence — the user scrolls through one viewport of
content with the pinned section visible the whole time.

## Why `position: sticky` works for this

`position: sticky` is a hybrid — it behaves as `position:
relative` UNTIL the scroll position causes the element to violate
its sticky constraint (`top: 0`), at which point it becomes
`position: fixed` relative to the viewport. When the element's
bottom edge would scroll above the viewport top, sticky releases
back to relative.

This produces the pinned effect WITHOUT a scroll listener — the
browser handles the state transitions automatically.

## Combining with view() timeline (native scroll-driven)

For an extra effect — e.g. fading the pinned section as the user
scrolls past it — combine with `animation-timeline: view()`:

```css
.va-pinned {
  position: sticky;
  top: 0;
  height: 100vh;
  animation: vaPinFade auto linear;
  animation-timeline: view(block 0% 50%);
}

@keyframes vaPinFade {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

The `animation-timeline: view(block 0% 50%)` ties the fade to the
element's visibility window — from "0% in view from below" to
"50% in view" (the midpoint of the scroll). As the user scrolls
past the pinned section, opacity fades from 1 to 0.

In browsers without scroll-timeline support (Safari), the section
still pins but doesn't fade — graceful degradation.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| (none for the pinning itself) | sticky is layout, not motion |
| `--vc-duration-entrance` (if fading is added) | fade duration (only meaningful for time-driven; view() ignores) |

The pinning mechanism is layout-only. The fade (if added via
view() timeline) consumes no duration token because the timeline
is scroll-driven, not time-driven.

## When to use a pinned section

- **Hero / landing sections** that should anchor while the user
  scrolls past them.
- **Section dividers** that announce the upcoming chapter,
  pinning briefly between content blocks.
- **Reading-progress indicators** for long articles — a small
  pinned panel showing "section 3 of 7".
- **Story-driven scrolling** — interactive narratives where each
  pinned section is a "page".

When NOT to use:
- **Inside an inner scrollable container** — `position: sticky`
  pins relative to the NEAREST scrollable ancestor. If you put a
  sticky element inside an `overflow:scroll` div, it pins to
  that div, not the viewport. This violates the no-nested-
  scrollbars rule; keep all scrolling on the document.
- **Pages with many pinned sections in a row** — too many pinned
  sections feel like the page is "snagging" repeatedly.
- **Pages with horizontal scrolling** — sticky is vertical-only
  by default; horizontal sticky requires `top: 0` AND container
  setup that's complex.

## Reduced-motion substitute

```css
.va-pinned { position: sticky; top: 0; height: 100vh; }
@media (prefers-reduced-motion: reduce) {
  /* The pinning is layout — no motion to disable */
  /* If a view() animation was added, disable it: */
  .va-pinned { animation: none; }
}
```

The PINNING itself is layout, not motion — reduce doesn't
disable it. The element still pins; the user can still scroll
past it. The layout aid is INFORMATIONAL (it helps the user keep
their place) so it should be preserved under reduce.

If you added a `view()` timeline animation (fade, scale, etc.),
the reduce branch should override `animation: none` to stop the
motion.

## Selection + comment + decision integration

The pinned section is a `<section>` — a sensible comment-able
atom. Mark it with `[data-va-reveal]` to participate in the
selection contract:

```html
<section class="va-pinned" data-va-reveal style="height: 100vh;">
  <h1>Pinned hero</h1>
</section>
```

The reveal observer adds `.va-in` when the section first crosses
the viewport (which happens BEFORE the sticky engages, since the
threshold is 0.15). The section is stamped as a card atom; the
comment pill mounts.

## Performance

`position: sticky` is layout-only — no scroll listener, no JS.
Cost per frame: zero JS. The browser's compositor handles
sticky efficiently.

For a section with an added `view()` timeline animation, the
animation runs on the compositor too. Still cheap.

## Diagnostics

- **Sticky doesn't engage** → check that the element's PARENT
  has a height greater than the element's, AND check no
  ancestor has `overflow: hidden` (which can break sticky).
- **Sticky engages but releases too early** → the element's
  parent doesn't extend below the sticky element's natural
  position. Wrap in a tall parent or set `min-height` on the
  parent.
- **Sticky element overlaps content** → adjust `top:` value to
  push it down from the viewport top, or wrap the sticky
  element in a container that contains it.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.va-pinned` section.
2. Scroll. Confirm the section's
   `getBoundingClientRect().top` stays at 0 (pinned) as the user
   scrolls within the section's range.
3. Continue scrolling past the section. The section's `top`
   should start going NEGATIVE (the section scrolls up out of
   view) only when the next sibling section reaches the viewport
   bottom.
4. If a `view()` animation is added, capture the opacity at
   strategic scroll positions — should interpolate as the user
   scrolls.
5. With `prefers-reduced-motion: reduce`, the pinning should
   still work, but any animation should be disabled.

## Stacking variation

A "stacking" effect uses MULTIPLE sticky cards, each pinning to
a different offset, with `z-index` increasing per card:

```html
<div class="va-stack-root">
  <article class="va-stack-card" style="z-index: 1;">Card 1</article>
  <article class="va-stack-card" style="z-index: 2;">Card 2</article>
  <article class="va-stack-card" style="z-index: 3;">Card 3</article>
</div>
```

```css
.va-stack-card {
  position: sticky;
  top: 20px;
  margin-bottom: 100vh;   /* Space for each card to scroll past */
  /* On scroll, scale down slightly as later cards stack on top */
  animation: vaStackScale auto linear;
  animation-timeline: view(block 0% 100%);
}
@keyframes vaStackScale {
  from { transform: scale(1); }
  to   { transform: scale(0.85) translateY(20px); }
}
```

Each card pins at `top: 20px`. As the user scrolls, later cards
slide up over earlier cards (incrementing z-index puts later
cards visually on top). The `view()` animation scales each card
DOWN as it's scrolled past, giving a "stacking deck of cards"
illusion.

The skill does NOT ship `.va-stack-root` / `.va-stack-card` —
documented here as a pattern. Author copies the recipe and
applies to their own classes.

## Comparison with the snap pattern

`scroll-snap` and `position: sticky` are different:

- **Scroll-snap** aligns the page scroll to specific items.
  The user scrolls; the page "snaps" each item to the viewport
  edge.
- **Sticky** pins individual elements within their parent's
  scroll range. The element doesn't snap; it sticks.

They CAN combine: a snap-aligned section that contains a sticky
element. The section snaps to the viewport; the sticky element
within it sticks until the section scrolls away.

## Author extension: the timeline-of-events pattern

A common use of pinned sections: a vertical "timeline" where
each event pins briefly:

```html
<div class="va-timeline">
  <section class="va-pinned va-event" data-va-reveal>
    <h2>2025: Founded</h2>
    <p>...</p>
  </section>
  <section class="va-pinned va-event" data-va-reveal>
    <h2>2026: Launched</h2>
    <p>...</p>
  </section>
</div>
```

Each event pins for one viewport, then releases as the next
event comes in. The user reads each event in turn; the timeline
unfolds as they scroll.

The skill ships only `.va-pinned`. Authors compose `.va-event`
and `.va-timeline` as needed.
