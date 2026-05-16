# Loop-pause observer — auto-pause off-screen infinite loops

A second `IntersectionObserver` toggles `animation-play-state` on
every infinite ambient loop so an off-screen loop costs no CPU.
NOT fire-once — stays attached for the life of the page so each
loop pauses again every time it scrolls out of view.

## The contract

The runtime watches all loop elements with one observer:

```js
var LOOP_SELECTOR =
  '.va-float-y, .va-breathe, .va-orbit, .va-rotate, .va-pulse, .va-skeleton';

function initLoopPause(root) {
  var d = root || document;
  var loops = d.querySelectorAll(LOOP_SELECTOR);
  if (!loops.length || typeof IntersectionObserver === 'undefined') {
    return;
  }
  _loopObserver = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      entries[i].target.style.animationPlayState =
        entries[i].isIntersecting ? 'running' : 'paused';
    }
  });   // default threshold 0 — pause as soon as it fully clears
  for (var k = 0; k < loops.length; k++) {
    _loopObserver.observe(loops[k]);
  }
}
```

Six classes are watched:

| class | reason |
|---|---|
| `.va-float-y` | infinite ambient bob |
| `.va-breathe` | infinite ambient pulse |
| `.va-orbit` | infinite ambient orbit |
| `.va-rotate` | infinite ambient spin |
| `.va-pulse` | infinite loading-state pulse-ring |
| `.va-skeleton` | infinite loading-state shimmer |

Any element with one of these classes gets its
`animation-play-state` flipped between `running` (while in
viewport) and `paused` (while off-screen).

## Why it matters

A CSS `animation: vaFloatY 3s infinite` runs the keyframe at 60
Hz forever — even when the element is scrolled 5000px off the
viewport. The browser compositor produces frames; the GPU paints
them; nothing visible changes. The work is pure waste.

Multiply by 10 ambient loops on a long page and the off-screen
cost becomes visible: scroll feels sluggish, fan spins up, mobile
battery drains. With the loop-pause observer, only loops in the
visible viewport are computing — typically 1-3 at a time on a
long page.

## Default threshold = 0

```js
new IntersectionObserver(function (entries) { ... });
// no { threshold, rootMargin } — uses defaults
```

Threshold 0 means "fire when the element CROSSES the viewport
edge". The transition from running to paused (or vice-versa)
happens AS the element clears the edge. There is no buffer — the
element is either fully off-screen (paused) or even partly visible
(running).

This is the right tradeoff for loops. A reveal-trigger observer
uses `threshold: 0.15` because revealing the section before it's
mostly visible would feel premature; for loop-pause, pausing the
moment the element is fully off-screen is correct — even a sliver
of visibility means the user can see the loop.

## NOT fire-once

```js
// for the reveal observer:
obs.unobserve(entries[j].target);   // fire once

// for the loop-pause observer:
// (no unobserve — stays attached)
```

The reveal observer un-observes after the first trigger because
revealing twice doesn't make sense. The loop-pause observer
re-attaches indefinitely because a loop scrolls in and out of
view potentially many times.

The cost: the loop-pause observer's watch list never shrinks. For
a page with 20 loops, the observer holds 20 entries forever. The
per-scroll cost of the observer's bookkeeping is O(loops in
state-change), not O(all watched) — modern IO is optimized for
this exact pattern.

## When the observer can't attach

```js
if (!loops.length || typeof IntersectionObserver === 'undefined') {
  return;
}
```

Two early-exits:
1. **No loops on the page.** Don't attach an observer that will
   never fire.
2. **No IntersectionObserver.** Pre-2017 browsers. The loops still
   PLAY (the CSS rules apply); they just never pause. The cost is
   continuous animation on every loop forever. The page works,
   just consumes more CPU. The fail-soft is appropriate — better
   than silently breaking the animation.

## Deferred init

The loop-pause observer is wired INSIDE `deferInit(() => {})` —
not immediately. The reasoning:

```js
function init(root) {
  // ... immediate, content-gating layers ...
  deferInit(function () {
    initCardTilt(d);
    initParallaxFallback(d);
    initLoopPause(d);
  });
}
```

`initLoopPause` is polish, not content. If the user is interacting
with the page within the first 100ms (clicking a button, typing),
they don't care that the off-screen loops are paused. The
observer attaches when the browser is IDLE — typically within a
few hundred ms of page load.

This matters for First Input Delay (FID) / Interaction-to-Next-Paint
(INP) metrics: deferring non-critical work to `requestIdleCallback`
keeps the main thread free for user interaction.

## Re-scanning dynamic content

```js
function refresh(root) {
  // ... reveal observer + tilt re-wire ...
  if (_loopObserver) {
    try { _loopObserver.disconnect(); } catch (e) { /* noop */ }
    _loopObserver = null;
  }
  initLoopPause(d);
}
```

The loop-pause observer is REBUILT on refresh, not extended. This
is simpler than tracking which loops were already observed; the
cost is one extra `IntersectionObserver` construction per refresh
(cheap).

A loop that was paused when refresh fires will re-attach to the
new observer; its `animation-play-state` is read on the first
callback (when the observer's initial visibility check fires). No
flicker.

## DESIGN.md tokens consumed

None. The loop-pause observer is a perf mechanism, not a
configurable theme element. There's no `--vc-` token for "pause
threshold" — the threshold is 0 (the viewport edge), period.

## When NOT to apply the loop-pause pattern

If a loop is RUNNING in the page background (e.g. behind a modal,
behind a fixed sticky header), the IntersectionObserver might
report it as still "intersecting" the viewport even when visually
obscured. The observer doesn't know about z-index.

For those cases, the right approach is to REMOVE the loop element
from the DOM when it should pause (e.g. when the modal opens,
remove the background pulse; when it closes, re-add). The
observer can't help here.

## Reduced-motion interaction

Under `prefers-reduced-motion: reduce`, the CSS animation rules
for the floats are OMITTED (decorative-only substitute is
removal). The elements still exist in the DOM but have no
animation running. The loop-pause observer is still attached (the
elements still match `LOOP_SELECTOR`), but `animationPlayState`
on an element with no animation is a no-op — the observer's
toggle does nothing harmful, just nothing useful.

For the skeleton + pulse (which DO get a substitute under
`reduce`, just a static-ring substitute), the substitute is a
single `box-shadow` or solid background — no animation, so again
the observer's toggle is inert.

The observer doesn't cost anything to leave attached under
`reduce`; the toggle is a single style property assignment per
state change.

## Selection + comment + decision integration

The loop-pause observer is invisible to the comment/decision
contract. It does not stamp atoms; it does not affect existing
`data-ve-id` markings. The observer is a pure perf optimization
on the visible side.

## Diagnostics

- **Loops keep running off-screen (CPU usage stays high)** →
  `initLoopPause` didn't run; check the defer ran (look for the
  `_loopObserver` variable being non-null after a few hundred
  ms).
- **Loops never pause** → `IntersectionObserver` is unavailable
  (very old browser). The fail-soft applies — loops play
  continuously, just no pause. Costs more CPU but doesn't break.
- **Loops pause but never resume** → the observer is firing
  `paused` but not `running`. Confirm the `entries[i].isIntersecting`
  ternary is reading correctly; the truthy branch should be
  `'running'`.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.va-float-y` element visible in the
   viewport.
2. Confirm via
   `await page.evaluate(() => getComputedStyle(document.querySelector('.va-float-y')).animationPlayState)`
   that the value is `'running'`.
3. Scroll the element off-screen via `page.evaluate(() => window.scrollBy(0, 2000))`.
4. Wait 500ms (the IO callback is throttled to ~1 callback per
   scroll burst).
5. Re-query `animationPlayState` — should be `'paused'`.
6. Scroll back: `window.scrollBy(0, -2000)`.
7. Wait 500ms. Re-query — should be `'running'` again.
8. Confirm CPU profile (DevTools Performance panel) shows the
   element's compositor work is at zero during the paused
   interval.

## Why a SEPARATE observer (and not the reveal one)?

The reveal observer is FIRE-ONCE (`unobserve` after trigger). The
loop-pause observer is FIRE-RECURRING (stays attached). They have
different lifecycle requirements; combining them into one
observer would require complex per-target state tracking.

Two observers is cheaper than one observer with conditional
branching — the IO callbacks are dispatched per-observer, so
splitting work across two observers is efficient.

## Performance budget for loops

Even with the pause observer, a page can have too many loops.
Guideline:
- **1-3 loops visible per viewport** — comfortable.
- **4-6 loops visible** — noticeable, but acceptable on modern
  hardware.
- **7+ loops visible** — janky on mobile, distracting on any
  device. Reduce count.

The "visible" count is the number of `.va-float-y` /
`.va-breathe` / `.va-orbit` / `.va-rotate` / `.va-pulse` /
`.va-skeleton` elements WITHIN the current viewport. Off-screen
loops are paused (zero cost), so total page count is less
relevant.
