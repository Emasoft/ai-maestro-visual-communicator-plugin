# Anti-patterns — what NOT to do, and why

## Table of Contents

- [1. `animation: none !important` on `prefers-reduced-motion: reduce`](#1-animation-none-important-on-prefers-reduced-motion-reduce)
- [2. Animating layout-triggering properties](#2-animating-layout-triggering-properties)
- [3. Missing `animation-fill-mode: both` on staggered entry](#3-missing-animation-fill-mode-both-on-staggered-entry)
- [4. Setting `--va-index` via `:nth-child` selectors](#4-setting---va-index-via-nth-child-selectors)
- [5. Forgetting `:focus-visible` on hover-driven animations](#5-forgetting-focus-visible-on-hover-driven-animations)
- [6. Removing focus rings without replacement](#6-removing-focus-rings-without-replacement)
- [7. `transform-origin: 0 0` on a centered element](#7-transform-origin-0-0-on-a-centered-element)
- [8. Infinite loops without loop-pause](#8-infinite-loops-without-loop-pause)
- [9. Mocking the runtime in tests instead of loading it](#9-mocking-the-runtime-in-tests-instead-of-loading-it)
- [10. Calling `init()` multiple times without `refresh()`](#10-calling-init-multiple-times-without-refresh)
- [11. Using SMIL instead of CSS for SVG animations](#11-using-smil-instead-of-css-for-svg-animations)
- [12. Hardcoded durations / easings in CSS](#12-hardcoded-durations--easings-in-css)
- [13. Using `text-decoration` for animated underlines](#13-using-text-decoration-for-animated-underlines)
- [14. Mixing GSAP / anime.js / Lenis / etc.](#14-mixing-gsap--animejs--lenis--etc)
- [15. Storing animation state in JS closures instead of CSS](#15-storing-animation-state-in-js-closures-instead-of-css)
- [16. Adding `will-change` everywhere](#16-adding-will-change-everywhere)
- [17. Animation duration in CSS, but JS reads a different value](#17-animation-duration-in-css-but-js-reads-a-different-value)
- [18. Animating elements outside the viewport unnecessarily](#18-animating-elements-outside-the-viewport-unnecessarily)
- [19. Static `box-shadow` for hover (no transition)](#19-static-box-shadow-for-hover-no-transition)
- [20. Treating `prefers-reduced-motion` as binary on/off only](#20-treating-prefers-reduced-motion-as-binary-onoff-only)
- [Quick reference table](#quick-reference-table)

A curated list of mistakes that look reasonable but produce bugs,
performance issues, or accessibility violations. Each entry is a
"don't do this" with the diagnostic for catching it.

## 1. `animation: none !important` on `prefers-reduced-motion: reduce`

```css
/* WRONG */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

**Why wrong:** Elements with `animation-fill-mode: both` and a
keyframe `from { opacity: 0 }` get STUCK invisible. The blanket
override cancels the keyframe but leaves the held `from` state.
Users see blank cards under `reduce`.

**Right pattern:** write a substitute (see `reduced-motion-gate.md`)
that preserves meaning OR removes for decorative-only.

**Diagnostic:** set `reduce`, take a screenshot, look for
visible-empty-rectangles where content should be.

## 2. Animating layout-triggering properties

```css
/* WRONG */
@keyframes badGrow {
  from { width: 0; }
  to   { width: 200px; }
}

/* WRONG */
.bad-card:hover {
  margin-top: -3px;   /* layout */
  /* should be: transform: translateY(-3px); */
}
```

**Why wrong:** `width`, `margin`, `top`, `padding` trigger LAYOUT
on every frame. 60 layouts/sec on a complex page exceeds the
16ms frame budget, producing jank.

**Right pattern:** animate `transform` (translate, scale, rotate)
and `opacity` only. See `transition-properties.md`.

**Diagnostic:** DevTools Performance → Rendering → enable
"Layout Shift regions". Layout flashes on every frame = bad.

## 3. Missing `animation-fill-mode: both` on staggered entry

```css
/* WRONG */
.va-stagger-item {
  animation: vaFadeSlideUp 600ms ease-out;
  animation-delay: calc(var(--va-index, 0) * 80ms);
  /* MISSING: animation-fill-mode: both; */
}
```

**Why wrong:** items flash visible before their delayed
animation starts. The browser uses the rule's natural CSS
(opacity 1) until the animation begins, then jumps to the
keyframe's `from` state (opacity 0).

**Right pattern:** include `both` in the shorthand:

```css
animation: vaFadeSlideUp 600ms ease-out both;
```

**Diagnostic:** screenshot at t=0; items at indices > 0 should
be invisible (held at `from`). If visible, `both` is missing.

## 4. Setting `--va-index` via `:nth-child` selectors

```css
/* WRONG — fragile, limited */
.va-stagger-item:nth-child(1) { --va-index: 0; }
.va-stagger-item:nth-child(2) { --va-index: 1; }
.va-stagger-item:nth-child(3) { --va-index: 2; }
/* ... etc for every possible position ... */
```

**Why wrong:** breaks for dynamic lists (you can't write 100
rules for 100 items). Breaks for filtered lists (item 3 might
be hidden, but the rule still applies index 2 to whatever's at
position 3 in the DOM).

**Right pattern:** use the JS indexer
(`amvcpAnimation.indexStagger`), or author inline
`style="--va-index:0"` if the list is static.

**Diagnostic:** insert a new card dynamically; if it animates
with the wrong index (or all items animate at the same time),
the `:nth-child` pattern is in use.

## 5. Forgetting `:focus-visible` on hover-driven animations

```css
/* WRONG — keyboard users see nothing */
.va-link:hover { background-size: 100% 2px; }

/* BAD — no keyboard parity */
.ve-card:hover { transform: translateY(-3px); }
```

**Why wrong:** keyboard users tab to focusable elements but
don't trigger `:hover`. Without `:focus-visible`, they have no
visible affordance that they've focused an element.

**Right pattern:** duplicate the rule under `:focus-visible`:

```css
.va-link:hover, .va-link:focus-visible {
  background-size: 100% 2px;
}
```

**Diagnostic:** disable mouse, tab through the page, confirm
each focusable element shows a visible affordance.

## 6. Removing focus rings without replacement

```css
/* WRONG */
.ve-card { outline: none; }

/* WRONG */
button { outline: none; }
```

**Why wrong:** the browser's default focus ring is the keyboard
user's fallback. Removing it without providing a custom focus
indicator breaks accessibility entirely.

**Right pattern:** if you provide a custom focus visual (a lift,
a custom outline, a colored border), THEN `outline: none` is
safe. Without the custom visual, KEEP the focus ring.

**Diagnostic:** tab to the element; if no visible change, the
focus ring was removed without replacement.

## 7. `transform-origin: 0 0` on a centered element

```css
/* WRONG — scaleS from corner, not center */
.va-card-scale {
  animation: vaScaleIn 400ms ease both;
  transform-origin: 0 0;
}
```

**Why wrong:** `transform-origin: 0 0` means scale from the
TOP-LEFT corner. For a centered card, this looks like the card
is "growing out of its corner" — wrong feel.

**Right pattern:** default origin is `50% 50%` (center) — let
it default unless you specifically want corner origin (e.g. a
toolbar button popping out of its anchor point).

**Diagnostic:** scale animation looks "off-center" → check
`transform-origin`.

## 8. Infinite loops without loop-pause

```css
/* WRONG — runs forever, off-screen waste */
.my-custom-loop {
  animation: vaFloatY 3s infinite;
}
/* No matching entry in LOOP_SELECTOR, so loop-pause doesn't
   pause it when scrolled off-screen. */
```

**Why wrong:** off-screen infinite loop burns CPU continuously.
Multiplied across many loops, scroll feels laggy, mobile battery
drains.

**Right pattern:** use the animation skill's built-in classes
(`.va-float-y`, `.va-breathe`, etc.) OR add your custom class
to the `LOOP_SELECTOR` list at the skill level OR attach your
own `IntersectionObserver` to toggle `animation-play-state`.

**Diagnostic:** open DevTools Performance, scroll, look for
non-zero compositor work on off-screen elements.

## 9. Mocking the runtime in tests instead of loading it

```js
// WRONG — mocked runtime
window.amvcpRuntime = { attachDecisionMini: function() {} };
amvcpAnimation.init(document);
```

**Why wrong:** the mocked runtime doesn't actually mount the
pill. Tests pass; production breaks (the real runtime might fail
to mount the pill, but the mocked version always "works").

**Right pattern:** load the REAL runtime in tests. If the
runtime isn't available, the animation skill's defensive queue
holds pending pill mounts until the runtime publishes its
`attachDecisionMini`.

**Diagnostic:** confirm tests use the real runtime; check that
pill DOM nodes exist (not just stubbed function calls).

## 10. Calling `init()` multiple times without `refresh()`

```js
// WRONG — duplicate observers, duplicate listeners
amvcpAnimation.init(document);
amvcpAnimation.init(document);   // re-init: bad
```

**Why wrong:** each `init()` attaches a NEW IntersectionObserver
without disconnecting the old. Each `init()` re-wires tilt
listeners (the guard prevents double-wiring, but the iteration
cost doubles). The reveal counter (`_revealCount`) becomes
unreliable.

**Right pattern:** call `init()` ONCE at page load (or let the
auto-init fire). For dynamic insertion, call `refresh(root)`
instead of `init()`.

**Diagnostic:** count observers via DevTools Memory snapshot;
`init()` doubling shows up as duplicate IO instances.

## 11. Using SMIL instead of CSS for SVG animations

```svg
<!-- WRONG — SMIL on deprecation track -->
<circle r="5">
  <animateTransform attributeName="transform" type="rotate"
                    from="0 12 12" to="360 12 12"
                    dur="1.2s" repeatCount="indefinite"/>
</circle>
```

**Why wrong:** SMIL doesn't compose with `prefers-reduced-motion`,
doesn't benefit from loop-pause, can't be hot-swapped via DESIGN.md
tokens.

**Right pattern:** use CSS `animation: vaRotate ... infinite` on
the SVG element. CSS animations interpolate transforms on SVG
just fine.

**Diagnostic:** grep for `<animate`, `<animateTransform`,
`<animateMotion` in SVG — replace with CSS.

## 12. Hardcoded durations / easings in CSS

```css
/* WRONG — bypasses the token contract */
.my-fade { animation: fade 800ms cubic-bezier(0.42, 0, 0.58, 1); }
```

**Why wrong:** the duration and curve are not themed. The
DESIGN.md hot-swap pad can't change them; the skill's reduce
substitute can't override them.

**Right pattern:** use `--vc-duration-*` and `--vc-easing-*`
tokens with hardcoded fallbacks:

```css
.my-fade {
  animation: fade
             var(--vc-duration-slow, 400ms)
             var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1));
}
```

**Diagnostic:** grep CSS for `cubic-bezier(` or `ms` literal
durations outside the token declarations themselves.

## 13. Using `text-decoration` for animated underlines

```css
/* WRONG — animating text-decoration */
.bad-link { text-decoration: underline; transition: text-decoration 200ms; }
```

**Why wrong:** `text-decoration` is essentially non-animatable
across browsers. The transition might apply to the color but not
the offset; behavior is inconsistent.

**Right pattern:** use `background: linear-gradient(currentColor,
currentColor)` + `background-size` animation (see
`link-underline.md`).

**Diagnostic:** the underline doesn't animate smoothly → check
the technique.

## 14. Mixing GSAP / anime.js / Lenis / etc.

```js
// WRONG — pulled in a library
import { gsap } from 'gsap';
gsap.from(items, { y: 40, stagger: 0.08 });
```

**Why wrong:** the animation skill is dependency-free by design.
Adding GSAP adds ~50KB of JS, locks into a non-token-aware
animation system, and bypasses the reduce gate and loop-pause.

**Right pattern:** use the skill's CSS animation classes
(`.va-stagger-item` + the indexer for stagger). For canvas, use
the `createLoop` primitive.

**Diagnostic:** grep `package.json` and source for `gsap`,
`anime`, `lenis`, `motion-one`, etc.

## 15. Storing animation state in JS closures instead of CSS

```js
// WRONG — JS-managed transform values
let cardPositions = items.map((el, i) => ({ y: 0 }));
function tick() {
  cardPositions.forEach((pos, i) => {
    pos.y += 1;
    items[i].style.transform = `translateY(${pos.y}px)`;
  });
  requestAnimationFrame(tick);
}
```

**Why wrong:** JS-managed state requires per-frame style writes
(60 writes/sec), which compete with the GPU compositor. Browser
can't optimize.

**Right pattern:** declare the animation in CSS keyframes; let
the browser composite on the GPU thread. JS only modifies
class names or custom properties.

**Diagnostic:** DevTools Performance → look for "Recalculate
Style" tasks every frame; that's the JS thrashing.

## 16. Adding `will-change` everywhere

```css
/* WRONG — premature optimization */
.va-stagger-item { will-change: transform, opacity; }
.va-counter { will-change: contents; }
.va-link { will-change: background-size; }
```

**Why wrong:** `will-change` reserves GPU memory and promotes
each element to its own compositor layer. Too many promoted
layers exhaust GPU memory; the browser falls back to less-
optimized paths.

**Right pattern:** add `will-change` ONLY when you've measured
specific jank and the hint demonstrably helps. Remove it after
the animation completes (`will-change: auto` on completion).

**Diagnostic:** DevTools Memory → look for excessive layer
allocations.

## 17. Animation duration in CSS, but JS reads a different value

```js
// WRONG — JS-read duration doesn't match CSS
var dur = 600;   // hardcoded
setTimeout(callback, dur);
```

**Why wrong:** the CSS animation reads
`--vc-duration-entrance` (could be 800ms if the user changed
it). The JS waits 600ms. Callback fires 200ms before the
animation completes — visible glitch.

**Right pattern:** read the actual token value via
`readDurationMs('--vc-duration-entrance', 600)` (the skill's
helper) or via `getComputedStyle()`.

**Diagnostic:** the callback fires before the animation
completes → check the JS duration source.

## 18. Animating elements outside the viewport unnecessarily

```html
<!-- WRONG — pre-renders 100 staggered items, all cascade off-screen -->
<ul class="va-stagger" data-va-stagger>
  <li class="va-stagger-item">Item 1</li>
  <!-- ... 99 more -->
</ul>
```

**Why wrong:** cascade plays for items the user can't see. By
the time they scroll down, the cascade is over.

**Right pattern:** for long lists, use
`data-va-reveal="stagger"` instead of `data-va-stagger`. The
cascade triggers when the container scrolls into view, not on
page load.

**Diagnostic:** scroll a long list; if items are already at
their `to` state when scrolled into view, the cascade already
fired off-screen.

## 19. Static `box-shadow` for hover (no transition)

```css
/* WRONG — instant snap */
.bad-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);
}
```

**Why wrong:** the shadow snaps in instantly on hover. Visually
jarring; lacks the smooth feel of a properly-animated affordance.

**Right pattern:** transition the box-shadow:

```css
.ve-card {
  transition: box-shadow 200ms ease;
}
.ve-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);
}
```

**Diagnostic:** screenshot before + after hover; shadow appears
without intermediate frames → no transition.

## 20. Treating `prefers-reduced-motion` as binary on/off only

```js
// WRONG — checking only at startup, no live update
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // disable animations forever
}
```

**Why wrong:** users can change the OS preference mid-session
(they take a break, change Settings, come back). The startup
check doesn't reflect the new preference.

**Right pattern:** attach a `change` listener on the matchMedia
query; re-evaluate on change. The skill does this in
`_watchReducedMotion()`.

**Diagnostic:** toggle the OS preference while a page is open;
animations should react without a reload.

## Quick reference table

| anti-pattern | symptom | fix |
|---|---|---|
| `animation: none !important` on reduce | stuck invisible | substitute pattern |
| Animating `width` / `top` / `margin` | jank | use `transform` |
| Missing `animation-fill-mode: both` | flash before stagger | add `both` |
| `:nth-child` for `--va-index` | fragile, broken on dynamic | use indexer |
| Missing `:focus-visible` | keyboard users blind | duplicate `:hover` |
| `outline: none` without replacement | A11y failure | provide custom focus |
| `transform-origin: 0 0` on centered | scales from corner | use default 50% 50% |
| Infinite loop without loop-pause | CPU waste | add to selector OR custom IO |
| Mocked runtime in tests | mounts fail in prod | use real runtime |
| `init()` called twice | duplicate observers | use `refresh()` |
| SMIL on SVG | no compose with reduce | use CSS animation |
| Hardcoded duration/curve | not themed | use tokens |
| `text-decoration` animated | inconsistent | use background-size |
| GSAP / library | bloat + non-tokenized | use built-ins |
| JS-managed style writes/frame | jank | CSS keyframes |
| `will-change` everywhere | GPU exhaustion | measure first |
| JS dur mismatch CSS dur | callback glitch | read the token |
| Animating off-screen items | wasted cascade | use scroll-reveal |
| Static box-shadow hover | snap-in | transition |
| Startup-only reduce check | live toggle ignored | attach `change` listener |
