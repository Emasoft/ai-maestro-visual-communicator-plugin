# Stagger entry — the canonical `--index`-driven cascade

## Table of Contents

- [The contract in one paragraph](#the-contract-in-one-paragraph)
- [Static markup (JS off, deterministic order)](#static-markup-js-off-deterministic-order)
- [Dynamic markup (runtime-built lists)](#dynamic-markup-runtime-built-lists)
- [The keyframe and its CSS contract](#the-keyframe-and-its-css-contract)
- [Read layout before animate (the AN-04 kept lesson)](#read-layout-before-animate-the-an-04-kept-lesson)
- [Per-index delay formula details](#per-index-delay-formula-details)
- [Combining with scroll reveal (`data-va-reveal="stagger"`)](#combining-with-scroll-reveal-data-va-revealstagger)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute — `vaFadeOnly`](#reduced-motion-substitute--vafadeonly)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Hot-swap with DESIGN.md](#hot-swap-with-designmd)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)

The single highest-impact zero-cost animation in the skill. A list,
grid, or row of cards fades-and-rises in sequence so the user's eye
naturally tracks the order. Both `prefers-reduced-motion`-safe and
DESIGN.md-tokenised; works with JS off.

This file expands `entry-and-scroll.md` Layer 2 into a complete
authoring + diagnostic reference.

## The contract in one paragraph

Wrap a group in `.va-stagger` + `data-va-stagger`. Give each child
`.va-stagger-item`. The runtime sets `style="--va-index:N"` on each
item (or you author it inline for JS-off). The CSS rule reads the
index and computes a per-item delay as `--va-index *
--vc-duration-stagger-step` (80ms default). Each item runs the
`vaFadeSlideUp` keyframe with `animation-fill-mode: both` so it sits
at `opacity:0` BEFORE its delayed start (no flash).

## Static markup (JS off, deterministic order)

```html
<ul class="va-stagger" data-va-stagger>
  <li class="va-stagger-item" style="--va-index:0">First card</li>
  <li class="va-stagger-item" style="--va-index:1">Second card</li>
  <li class="va-stagger-item" style="--va-index:2">Third card</li>
</ul>
```

Inline `--va-index` is RESPECTED by the indexer — it only fills
items that lack a value. This lets an author intentionally start at
a non-zero index (e.g. to chain two staggers visually) without the
auto-indexer overriding the choice.

## Dynamic markup (runtime-built lists)

```html
<div class="va-stagger" data-va-stagger>
  <!-- children inserted by a renderer; --va-index gets filled at init -->
</div>
```

The indexer runs in `init()` synchronously (before first paint of
the animated state), then again in `refresh(root)` if you re-mount
content. Idempotency: an item that already has an inline
`--va-index` is skipped on re-scan.

## The keyframe and its CSS contract

```css
@media (prefers-reduced-motion: no-preference) {
  .va-stagger-item {
    --va-rise: calc(24px * var(--vc-motion-scale, 1));
    animation: vaFadeSlideUp var(--vc-duration-entrance, 600ms)
               var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1)) both;
    animation-delay: calc(var(--va-index, 0)
                       * var(--vc-duration-stagger-step, 80ms));
  }
}

@keyframes vaFadeSlideUp {
  from { opacity: 0; transform: translateY(var(--va-rise, 24px)); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Three contract details that MUST hold:

1. **`animation-fill-mode: both`** (the `both` at the end of the
   shorthand). This is the SINGLE source of the "elements flash, then
   animate" bug. `both` extends the `from` state backwards in time —
   the item sits at `opacity:0` from page load through its delayed
   start. Without `both` the item is at its inherited `opacity:1`
   until the keyframe begins.
2. **Delay computed via `calc(var(--va-index) * --vc-duration-stagger-step)`**
   — not via `:nth-child(n)` selectors. The `--va-index` approach
   works for ANY number of children (no `:nth-child(10)` rule limit)
   and supports dynamic insertion.
3. **Distance is `calc(24px * var(--vc-motion-scale, 1))`** — at
   theme-level `motion.scale: 0` the item still fades (opacity is
   not damped) but does not travel. This is the orthogonal "calm
   mode" that composes with `prefers-reduced-motion`.

## Read layout before animate (the AN-04 kept lesson)

```js
function indexStagger(container) {
  if (!container || !container.querySelectorAll) { return; }
  var items = container.querySelectorAll('.va-stagger-item');
  if (!items.length) { return; }
  void container.offsetHeight;            // FORCE one read
  for (var i = 0; i < items.length; i++) {
    if (!items[i].style.getPropertyValue('--va-index')) {
      items[i].style.setProperty('--va-index', String(i));
    }
  }
}
```

The `void container.offsetHeight` line is load-bearing. It forces
one synchronous layout READ before the loop starts WRITING styles.
Without the read, the browser batches reads and writes in arbitrary
order: a write on item 1 invalidates layout, a read for item 2's
inline style triggers another layout, etc. — a "layout thrash"
where each item costs O(n) layouts.

With the read, the browser knows layout is fresh; the writes all
queue without invalidating each other; the cascade starts on a
single committed layout. **This is the only GSAP best practice the
skill kept verbatim** — and the only reason to keep the line is the
layout-thrash bug, not because the visual result is different (it
is not, on a 10-item list; it matters at 200+ items).

## Per-index delay formula details

Default math: `delay = index * 80ms`.

| index | delay (ms) | timeline note |
|---|---|---|
| 0 | 0 | first item starts immediately |
| 1 | 80 | second item starts at the 80ms mark |
| 5 | 400 | sixth item starts as first item is finishing |
| 9 | 720 | tenth item starts at the 720ms mark |

The entrance duration is `--vc-duration-entrance` (600ms default),
so an item finishes 600ms AFTER its delayed start. For a 10-item
list with 80ms stagger, the FULL sequence runs from 0ms to
`9 * 80 + 600 = 1320ms`. That is the "feels long" threshold — past
that, reduce the stagger step OR reduce the entrance duration.

Tuning advice:
- 8+ items in the cascade — drop `motion.stagger-step` to 50-60ms,
  not 80, or the back of the cascade feels distant.
- 3-5 items — 80ms is correct.
- 1-2 items — stagger does nothing visible; consider a single
  `[data-va-reveal]` instead.
- 20+ items — the cascade pattern itself is wrong; use
  `data-va-reveal="stagger"` so items only enter as they scroll
  into view, not all at once.

## Combining with scroll reveal (`data-va-reveal="stagger"`)

When the staggered group is below the fold, the cascade should
trigger ON SCROLL not on page load — otherwise the user scrolls down
to a fully-rendered list, the cascade already finished while
off-screen.

```html
<ul data-va-reveal="stagger">
  <li class="va-stagger-item">First</li>
  <li class="va-stagger-item">Second</li>
  <li class="va-stagger-item">Third</li>
</ul>
```

The reveal observer indexes the children up front (so the indices
exist before the IO triggers), then adds `.va-in` to the container
on intersect. The CSS `[data-va-reveal="stagger"].va-in
.va-stagger-item` selector flips opacity to 1 with a transition (no
keyframe). This avoids the "all items animate while off-screen"
bug.

Note: `data-va-reveal="stagger"` and `data-va-stagger` are
DIFFERENT triggers — `data-va-stagger` fires on page load (above the
fold), `data-va-reveal="stagger"` fires on IO intersect (below the
fold). Use the right one for the position.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-entrance` (600ms default) | per-item animation duration |
| `--vc-duration-stagger-step` (80ms default) | per-index delay multiplier |
| `--vc-easing-decel` (decel curve) | the entrance curve — arrival semantic |
| `--vc-motion-scale` (1 default) | damps the 24px rise distance |

`--vc-motion-scale: 0` is a theme-level calm mode — items still
fade but do not travel. `prefers-reduced-motion: reduce` is the
SEPARATE OS-level gate (see below).

## Reduced-motion substitute — `vaFadeOnly`

```css
@media (prefers-reduced-motion: reduce) {
  .va-stagger-item { animation: vaFadeOnly 200ms ease both; }
}
@keyframes vaFadeOnly { from { opacity: 0; } to { opacity: 1; } }
```

The substitute KEEPS the meaning (the item appears) but DROPS:
- The per-index delay → all items fade in at once.
- The 24px rise → opacity-only.
- The decel curve → generic `ease`.
- The 600ms duration → 200ms (faster, matches reduce-fade convention).

Meaning preserved: the list still appears. The cascade ordering
information is lost — that is the price of reduced-motion. If the
ordering carries data meaning (e.g. ranked search results), encode
it in the markup (`<ol>`, numbered prefix, etc.), not in the
animation.

## Selection + comment + decision integration

Every `.va-stagger-item` is stamped with `data-ve-id` + `data-ve-type="card"`
on init (the `stampAnimatedAtoms()` pass). The decision mini-pill
is attached too (via `window.amvcpRuntime.attachDecisionMini`), so
each card becomes one comment-able + decision-tagable atom under
the unified contract.

Idempotency: the stamper only sets `data-ve-id` if absent; the pill
helper guards against double-mount. A re-scan via `refresh(root)`
picks up newly inserted items without disturbing existing ones.

## Hot-swap with DESIGN.md

Changing `motion.stagger-step` from 80 to 30 in the DESIGN.md
controller pad re-emits `--vc-duration-stagger-step: 30ms`. The CSS
rule re-evaluates the `calc()` immediately — but ONLY for items
that have NOT YET started their animation. Items mid-flight keep
their original delay (CSS animation delays are not re-read).

For a true cascade re-run, call `amvcpAnimation.refresh(document)`
after the token swap — the indexer + IO reattach fresh and the
cascade replays for any item that has not yet revealed.

## Diagnostics

- **Items flash visible, then animate** → missing `animation-fill-mode: both`
  (only possible if the injected CSS was hand-overridden).
- **All items animate together (no cascade)** → `--va-index` is not
  being set; check `data-va-stagger` attribute on the container.
- **Cascade plays for items still off-screen** → use
  `data-va-reveal="stagger"` instead of `data-va-stagger`.
- **First item delay is non-zero** → an inline `--va-index="1"` on
  the first item; the indexer respects manual values.
- **Cascade too slow at the back end (item 9 starts 720ms in)** →
  reduce `motion.stagger-step` to 40-50ms.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
screenshot workflow. The cascade is best verified with a 5-frame
strip taken at t=0, 80, 200, 400, 700ms — each frame should show
ONE more item further along its entrance than the previous frame.
A frame where all items are at the same opacity is a missing
indexer; a frame where all items are at `opacity:0` past t=80ms is
a missing keyframe rule.

For the `reduce` path, switch the page's `prefers-reduced-motion` in
DevTools (Rendering panel → Emulate CSS media features) and screenshot
again — the cascade should collapse to a single 200ms fade-in for
the whole list.
