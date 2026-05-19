# Scroll-driven timelines — `animation-timeline: scroll()` / `view()`

## Table of Contents

- [The two timelines](#the-two-timelines)
- [The catalog of native scroll patterns](#the-catalog-of-native-scroll-patterns)
- [Browser support (as of writing)](#browser-support-as-of-writing)
- [Authoring the pinned pattern](#authoring-the-pinned-pattern)
- [Authoring the stacking pattern](#authoring-the-stacking-pattern)
- [Authoring the scrub pattern](#authoring-the-scrub-pattern)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Why ship JS fallbacks for everything](#why-ship-js-fallbacks-for-everything)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [When to opt into the native API](#when-to-opt-into-the-native-api)

Modern browsers ship a native scroll-driven animation API:
`animation-timeline: scroll()` (animation tied to a scroll
container's scroll position) and `animation-timeline: view()`
(animation tied to one element's visibility within the viewport).
The skill does NOT require this API — every scroll behavior also
has a JS fallback via `--va-scroll-y` — but it composes cleanly
when present.

## The two timelines

### `scroll(root block)` — page-wide scroll progress

```css
@keyframes vaProgressGrow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.va-progress-bar-native {
  animation: vaProgressGrow auto linear;
  animation-timeline: scroll(root block);
}
```

The `auto` duration means "run the animation from the start of
the scroll container's scroll range to the end". `scroll(root
block)` means "the root scrolling element, in the block (vertical)
direction".

This is the IDIOMATIC native version of the JS-driven progress
bar (`--va-progress` writes via the scroll listener). Both
mechanisms can coexist; the JS listener writes the var
regardless, and the native timeline (when supported) drives the
animation directly.

The skill's progress bar uses the JS path universally for
simplicity. To opt into the native path for a single bar, the
author writes a custom CSS rule that overrides
`.va-progress-bar` with the `animation-timeline: scroll()` rule.

### `view(block 0% 100%)` — per-element visibility timeline

```css
@keyframes vaPin {
  from { transform: translateY(0); opacity: 1; }
  to   { transform: translateY(-100%); opacity: 0; }
}
.va-pinned-section {
  animation: vaPin auto linear;
  animation-timeline: view(block 0% 100%);
}
```

The `view()` timeline maps the element's lifecycle — from "just
about to enter viewport" to "just exited viewport" — to the
animation's 0-100% range. As the user scrolls, the element's
position in the viewport drives the animation phase.

`block 0% 100%` means the timeline spans from "element is 0% into
view from below" to "element is 100% out of view from above". The
specific values are tweak-able (e.g. `block 50% 50%` would
narrow the timeline to just when the element is centered).

## The catalog of native scroll patterns

The animation skill's catalog entry table lists 8 scroll patterns:

| pattern | mechanism | reduced-motion |
|---|---|---|
| `parallax` | JS-driven `--va-scroll-y` (universal) | `transform: none` |
| `pinned` | sticky + view() timeline | static |
| `stacking` | sticky cards + view() scale-down | static stack |
| `scrub` | scroll() timeline + animation-range | final frame |
| `clip-reveal` | clip-path on view() timeline | shown |
| `snap` | scroll-snap-type on page root | snap kept (no motion) |
| `rotate-3d` | perspective + rotateY on view() | static |
| `progress-bar` | --va-progress (JS-driven) | bar shown |

The `parallax` and `progress-bar` entries are 100% JS-driven (the
scroll listener writes the custom property). The other six can
opt into the native timeline when supported, but the skill ships
JS fallbacks for all of them so older browsers degrade gracefully.

## Browser support (as of writing)

- **Chrome / Edge**: supports `scroll()` and `view()` (Chromium
  120+).
- **Firefox**: experimental, behind a flag.
- **Safari**: not supported yet.

The skill ships JS-driven primitives that work universally. The
native API is an OPT-IN upgrade for authors targeting Chromium.

## Authoring the pinned pattern

```html
<section class="va-pinned">
  <h1>Pinned hero</h1>
</section>
```

```css
.va-pinned {
  position: sticky;
  top: 0;
  height: 100vh;
  /* Native scroll-timeline upgrade (Chromium) */
  animation: vaPinFade auto linear;
  animation-timeline: view(block 0% 50%);
}
@keyframes vaPinFade {
  from { opacity: 1; }
  to   { opacity: 0; }
}
@supports not (animation-timeline: view()) {
  /* JS fallback: pin via sticky, fade via JS reading view-progress */
}
```

The `position: sticky; top: 0; height: 100vh` is the JS-and-CSS-
universal mechanism — the element pins to the top of the viewport
as the user scrolls past it. The `animation-timeline: view()`
upgrade fades the element's opacity as it scrolls upward through
its second half-range.

In browsers WITHOUT scroll-timeline support, the `@supports not`
block could provide a JS fallback that reads
`getBoundingClientRect().top` per scroll and computes opacity
manually. The skill does NOT ship this fallback yet — the pinned
pattern degrades to "pins but doesn't fade" on Safari.

## Authoring the stacking pattern

```html
<div class="va-stack-root">
  <article class="va-stack-card">Card 1</article>
  <article class="va-stack-card">Card 2</article>
  <article class="va-stack-card">Card 3</article>
</div>
```

```css
.va-stack-card {
  position: sticky;
  top: 20px;
  margin-bottom: 100vh;   /* push the next card down so it scrolls past */
  animation: vaStackScale auto linear;
  animation-timeline: view(block 0% 100%);
}
.va-stack-card:nth-child(1) { z-index: 1; }
.va-stack-card:nth-child(2) { z-index: 2; }
.va-stack-card:nth-child(3) { z-index: 3; }

@keyframes vaStackScale {
  from { transform: scale(1); }
  to   { transform: scale(0.85) translateY(20px); }
}
```

Each card sticks to `top: 20px`. As subsequent cards scroll up
over them, the stacking animation makes each earlier card scale
down + translate slightly down — creating the illusion of cards
stacking on top of each other.

This is a Chromium-only pattern via the native timeline. The skill
documents it; the runtime CSS does not ship `.va-stack-root` /
`.va-stack-card` classes.

## Authoring the scrub pattern

```html
<section class="va-scrub">
  <video src="..." muted playsinline></video>
</section>
```

```css
.va-scrub video {
  animation: vaScrubVideo auto linear;
  animation-timeline: view(block 0% 100%);
  animation-range: entry 0% exit 0%;   /* scrub video as element scrolls */
}
@keyframes vaScrubVideo {
  /* The actual scrub is via `currentTime` set by JS; this is a
     placeholder for an animatable property like opacity */
  from { opacity: 1; }
  to   { opacity: 1; }
}
```

Scrubbing a video frame via scroll is the canonical "scrub"
pattern (think Apple product pages with scroll-driven product
360° rotations). The pattern uses `animation-range` to specify
which part of the view-progress drives the animation phase. The
actual video scrub requires JS to read the timeline progress and
set `video.currentTime`.

The skill does NOT ship video-scrub primitives — they are
content-specific and the implementation is heavy.

## DESIGN.md tokens consumed

None directly. Native scroll-driven animations don't consume
duration/easing tokens — duration is `auto` (scroll-driven), and
the curve is whatever the keyframe is linear-interpolated through.

The `--vc-motion-scale` damper does NOT compose cleanly with
scroll-driven animations either — the transform calculations
inside keyframes can't read the damper from a JS-controlled
property.

This is a limitation of the native API; the skill's JS-driven
parallax DOES respect `--vc-motion-scale`.

## Reduced-motion substitute

`@media (prefers-reduced-motion: reduce)` works in conjunction
with `animation-timeline`. The reduce branch should override the
keyframe to a no-op:

```css
.va-pinned {
  animation: vaPinFade auto linear;
  animation-timeline: view(block 0% 50%);
}
@media (prefers-reduced-motion: reduce) {
  .va-pinned { animation: none; }   /* but the sticky still works */
}
```

The sticky positioning (`position: sticky`) is NOT motion —
it's layout. The reduce branch should leave sticky in place but
disable the animated fade.

For the `transform` keyframes (stacking, parallax-like rotations),
the reduce branch sets `transform: none` to defeat the animation.

## Selection + comment + decision integration

Scroll-driven animations don't change the atom contract —
elements with these animations are still stamped per the usual
selectors. The animation's progress doesn't affect the atom's
selectability.

## Why ship JS fallbacks for everything

The skill's design principle: every scroll behavior has a JS
fallback that works in EVERY browser. The native API is an
upgrade for the modern browsers that support it. This means:

- **Universal correctness.** Safari users see the same behaviors
  as Chrome users, just driven by JS instead of native CSS.
- **No surprise breakages.** A new browser version that doesn't
  ship the native API yet (e.g. Firefox without the flag) doesn't
  see broken animations.
- **Test consistency.** Tests can target the JS path, which works
  in JSDOM and headless harnesses, without requiring real-browser
  scroll-driven animation support.

The cost: the JS listener is always attached (one rAF-coalesced
style write per frame). On modern browsers this is competing with
the native API for the same job — but the cost is negligible
(<1ms per frame).

## Diagnostics

- **Native scroll-driven animation doesn't run** → check browser
  support via DevTools console:
  `CSS.supports('animation-timeline', 'view()')` returns `true`/
  `false`. If `false`, the JS fallback path is what's running.
- **Animation runs INSTANTLY (not scroll-driven)** → the
  `animation-timeline` declaration is missing or misformatted.
  Without it, the animation defaults to a normal time-driven
  animation that runs immediately.
- **Animation only partly works (some keyframes ignore the scroll)**
  → not every property is interpolatable inside scroll-driven
  animations. Confirm the keyframe properties are scalar/transform
  values (transform, opacity, color, etc.).

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. In Chromium, load page with `animation-timeline: view()`
   element below the fold.
2. Scroll progressively. Confirm the animation phase changes IN
   STEP with the scroll position (not over a fixed duration).
3. In a non-supporting browser (e.g. Safari), confirm the
   element either has the JS fallback OR sits at its default
   state (no animation).
4. With `prefers-reduced-motion: reduce`, confirm the animation
   is suppressed (`animation: none`) but the layout (sticky,
   etc.) remains intact.

## When to opt into the native API

- **Chromium-first products** — designs where Chrome/Edge are
  the primary target.
- **Performance-critical pages** — native scroll-driven is GPU-
  composited; JS-driven still does a style recalc per frame.
- **Effects that JS can't easily produce** — frame-perfect scrub
  through a long animation timeline is hard with JS; native
  handles it.

When to STAY on the JS path:
- **Universal targets** — content meant to render correctly in
  every browser.
- **Simple effects** — parallax, progress bar; the JS cost is
  negligible.
- **Test reliability** — JSDOM and headless harnesses are easier
  to test against the JS path.
