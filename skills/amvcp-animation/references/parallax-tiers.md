# Parallax tiers — `.va-parallax-1` through `.va-parallax-6`

## Table of Contents

- [The contract](#the-contract)
- [Markup](#markup)
- [The scroll listener — passive, rAF-coalesced](#the-scroll-listener--passive-raf-coalesced)
- [Why parallax reads the DOCUMENT scroll axis only](#why-parallax-reads-the-document-scroll-axis-only)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Native scroll-driven animation (`animation-timeline: scroll()`)](#native-scroll-driven-animation-animation-timeline-scroll)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [How many parallax layers is too many?](#how-many-parallax-layers-is-too-many)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)

Six depth layers driven by a single `--va-scroll-y` CSS custom
property. The page's own scroll axis is the trigger — never an
inner overflow box. Use sparingly: 1-2 layers per page is usually
the right limit. P3 priority.

## The contract

A scroll listener (passive, rAF-coalesced) writes the document's
scroll position into `--va-scroll-y` on `:root` once per frame.
Six CSS classes each translate by a fraction of that distance:

```css
.va-parallax-1 { transform: translateY(calc(var(--va-scroll-y, 0px) *  0.10 * var(--vc-motion-scale, 1) * -1)); }
.va-parallax-2 { transform: translateY(calc(var(--va-scroll-y, 0px) *  0.25 * var(--vc-motion-scale, 1) * -1)); }
.va-parallax-3 { transform: translateY(calc(var(--va-scroll-y, 0px) *  0.50 * var(--vc-motion-scale, 1) * -1)); }
.va-parallax-4 { transform: translateY(calc(var(--va-scroll-y, 0px) *  0.80 * var(--vc-motion-scale, 1) * -1)); }
.va-parallax-5 { transform: translateY(calc(var(--va-scroll-y, 0px) *  1.00 * var(--vc-motion-scale, 1) * -1)); }
.va-parallax-6 { transform: translateY(calc(var(--va-scroll-y, 0px) *  1.20 * var(--vc-motion-scale, 1) * -1)); }
```

The depth factors:

| class | factor | perceptual depth | typical use |
|---|---|---|---|
| `.va-parallax-1` | 0.10 | very far back | distant background pattern, watermark |
| `.va-parallax-2` | 0.25 | back | secondary background, mid-distance ornament |
| `.va-parallax-3` | 0.50 | middle | mid-ground decoration |
| `.va-parallax-4` | 0.80 | near | foreground element behind text |
| `.va-parallax-5` | 1.00 | matches page | element at the natural scroll speed (no parallax visible) |
| `.va-parallax-6` | 1.20 | FOREground (moves FASTER than scroll) | "pops out" effect, use very sparingly |

Levels 1-4 move SLOWER than the page (so they appear to lag behind
as the page scrolls — the classic parallax depth illusion). Level
5 moves at page speed (used for alignment scaffolding). Level 6
moves FASTER than the page (an inverse-parallax that reads as the
element popping toward the viewer).

The `* -1` in the calc flips the direction: as the page scrolls
DOWN (scrollY increases), the parallax element translates UP — the
illusion of staying in place from the viewer's perspective.

## Markup

```html
<section style="position: relative; height: 100vh;">
  <div class="va-parallax-1"
       style="position: absolute; top: 0; left: 0; right: 0;">
    <svg>…</svg>   <!-- distant background pattern -->
  </div>
  <div class="va-parallax-3"
       style="position: absolute; top: 20%; left: 50%;
              transform: translateX(-50%);">
    <img src="ornament.svg" alt="">
  </div>
  <h1 style="position: relative; z-index: 1;">
    Foreground heading
  </h1>
</section>
```

The parallax element MUST be `position: absolute` (or `fixed`) so
its `transform` does not push the surrounding content around. The
CSS rule overrides only `transform`; any `transform: translateX(-50%)`
authored inline gets overwritten — author centering via `left: 50%`
+ `margin-left: -<halfWidth>` instead, or accept the loss of the
inline transform.

## The scroll listener — passive, rAF-coalesced

```js
var _parallaxRaf = 0;

function _scrollUpdate() {
  _parallaxRaf = 0;
  var docEl = document.documentElement;
  var y = window.scrollY || window.pageYOffset || 0;
  docEl.style.setProperty('--va-scroll-y', y + 'px');
  // Progress bar — fraction of the page scrolled, 0..1.
  var max = (docEl.scrollHeight - docEl.clientHeight);
  var frac = max > 0 ? (y / max) : 0;
  if (frac < 0) { frac = 0; }
  if (frac > 1) { frac = 1; }
  docEl.style.setProperty('--va-progress', String(frac));
}

function onScroll() {
  if (!_parallaxRaf && typeof requestAnimationFrame === 'function') {
    _parallaxRaf = requestAnimationFrame(_scrollUpdate);
  } else if (typeof requestAnimationFrame !== 'function') {
    _scrollUpdate();
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
```

Three perf properties of this listener:

1. **Passive.** `{ passive: true }` tells the browser the listener
   never calls `preventDefault`, so the browser can scroll
   immediately without waiting for the JS to return. Without
   passive, every scroll tick blocks until the JS finishes — at 60
   Hz that is 16ms of scroll latency per scroll event.

2. **rAF-coalesced.** Scroll events fire faster than 60 Hz on a
   high-refresh display (a 120 Hz monitor can dispatch 120 scroll
   events/sec). Without coalescing, the style write happens 120
   times/sec — but the browser can only paint at 60 Hz, so half
   the writes are wasted. The `_parallaxRaf` guard ensures
   AT MOST ONE style write per animation frame.

3. **One write, many reads.** The single `--va-scroll-y` write
   triggers the recompute for ALL parallax classes (CSS variable
   inheritance). The browser does the math once per frame in C++.

## Why parallax reads the DOCUMENT scroll axis only

Per the no-nested-scrollbars rule, the page must never have an
inner `overflow:scroll` box that introduces a second scroll axis.
The parallax listener reads `window.scrollY` — the document's
own scroll position. There is no `.scrollTop` of an inner div.

If you find yourself needing parallax inside a scrollable inner
container, you have a layout bug — the inner container should be
removed (let the page expand) and parallax applied at the page
level.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-motion-scale` (1 default) | damps the parallax distance |

`--vc-motion-scale: 0` makes parallax dead — every layer multiplies
by 0 and stays at `translateY(0)`. This is the theme-level "calm
mode" that disables parallax without setting a media query.

No duration / easing tokens — parallax is a continuous mapping
from scroll-Y to translate-Y, no time involved.

## Native scroll-driven animation (`animation-timeline: scroll()`)

Modern browsers support
`animation-timeline: scroll(root block)` which drives a CSS
animation by the document's scroll position natively — no JS
listener needed. The skill does NOT use this API directly for
parallax (the JS listener is universal); but the scroll listener
ALWAYS attaches, even when native scroll-timeline is supported,
because:
- The progress bar (`.va-progress-bar`) is fed by the same listener.
- The native API does not write `--va-scroll-y` — the listener
  is the universal feeder.
- The listener is cheap (one style write/frame), so the duplication
  cost is zero.

When native scroll-timeline becomes a useful primitive, future
catalog entries (`scrub`, `pinned`, `stacking`) lean on it — but
parallax stays JS-driven.

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .va-parallax-1, .va-parallax-2, .va-parallax-3,
  .va-parallax-4, .va-parallax-5, .va-parallax-6 {
    transform: none;
  }
}
```

The substitute is `transform: none` — the parallax element sits
at its document position with no scroll-driven translation. The
element is still THERE (no visibility change); it just doesn't
move with scroll. For an element behind text, this is invisible to
the user; for a hero ornament, the user sees a static ornament
instead of one that drifts. Both are acceptable — parallax is
decorative-only.

## How many parallax layers is too many?

The skill ships 6 because that is enough for any meaningful depth
illusion. PER-PAGE, the right number is:

- **1 layer** — a single distant background pattern. Almost always
  fine.
- **2-3 layers** — a background + a mid-ground element + foreground.
  Usually still fine, watch the per-frame style-recalc time.
- **4+ layers** — janky on low-end devices. Each layer is a separate
  `transform: translateY(...)` write per frame; 4+ writes per frame
  starts to compete with the browser's compositor.
- **6+ layers** — guaranteed jank on mobile. Avoid.

If you find yourself wanting 4+ parallax layers, the right answer
is to consolidate decorative elements into a single SVG that itself
has multiple groups at different parallax tiers — one parallax
class on the SVG, the SVG's interior renders all the layers in one
paint.

## Selection + comment + decision integration

`.va-parallax-N` elements are NOT stamped as content atoms by
`stampAnimatedAtoms()` (the selector list is explicit:
`.va-stagger-item, [data-va-reveal], .va-counter[data-va-stat]`).
Parallax is decorative-only — there is nothing to comment on
or decide about a parallax wrapper. Comment-able atoms live
INSIDE parallax wrappers (e.g. a card that happens to be in a
parallax-3 layer is still a card atom).

## Diagnostics

- **Parallax doesn't move** → confirm the JS module loaded
  (`window.amvcpAnimation` present), confirm `initParallaxFallback`
  ran (look for `--va-scroll-y` in computed styles on `:root`).
- **Parallax is jittery / janky** → too many layers; reduce count
  or consolidate.
- **Parallax pushes surrounding content** → the parallax element
  is `position: static` (the default); change to `position: absolute`
  or `position: fixed`.
- **Parallax inverts direction** → the `* -1` in the calc is the
  source of "moves up as page scrolls down". If you want the
  reverse, override the class with `transform: translateY(calc(var(--va-scroll-y, 0px) * 0.5))`
  (no `* -1`). Rare — usually a bug.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
screenshot workflow. The test:

1. Load page at `scrollY = 0`. Capture the parallax element's
   `getBoundingClientRect().top`.
2. Scroll to `scrollY = 400`. Wait one rAF. Capture the rect again.
3. The TOP value should have moved by approximately
   `400 - 400 * (1 - factor)` — for `.va-parallax-2` (factor 0.25),
   the element should have moved UP 100px relative to the viewport
   (instead of the 400px the rest of the page moved). 400 * (1 - 0.25) =
   300px — the element is 300px LOWER in the document but only
   100px higher than the viewport top.
4. With `prefers-reduced-motion: reduce` emulated, repeat — the
   element's viewport TOP should change by the full 400px (no
   parallax effect).
