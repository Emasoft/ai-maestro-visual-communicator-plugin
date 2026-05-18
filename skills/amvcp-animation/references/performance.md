# Performance & advanced loops — Layer 6

## Table of Contents

- [Off-screen loop pause (AN-11)](#off-screen-loop-pause-an-11)
- [Idle-deferred init (AN-11)](#idle-deferred-init-an-11)
- [Delta-time loop primitive (AN-12)](#delta-time-loop-primitive-an-12)
- [Re-scanning dynamic content](#re-scanning-dynamic-content)
- [Live reduced-motion changes](#live-reduced-motion-changes)

Three perf mechanisms that keep motion cheap: off-screen loop pause,
idle-deferred init, and a correct delta-time loop primitive.

## Off-screen loop pause (AN-11)

An infinite ambient loop scrolled off-screen still burns CPU compositing
frames nobody sees. A second `IntersectionObserver` toggles
`animation-play-state` on every loop element:

- `.va-float-y`, `.va-breathe`, `.va-orbit`, `.va-rotate` — ambient loops
- `.va-pulse`, `.va-skeleton` — loading-state loops

When an element clears the viewport its `animation-play-state` becomes
`paused`; when it scrolls back in, `running`. This observer is **NOT**
fire-once — it stays attached for the life of the page so the loop
pauses again every time it leaves the viewport.

This runs automatically — applying any of the loop classes is enough.

## Idle-deferred init (AN-11)

Init is split into two tiers:

1. **Immediate** — runs synchronously in `init()` because it gates
   visible content: the stagger indexer, the scroll-reveal observer,
   the counter observer. These must run before first paint or content
   flashes / lands wrong.
2. **Deferred** — runs inside `requestIdleCallback` (Safari fallback:
   `setTimeout(fn, 1)`): card-tilt wiring, the parallax-fallback scroll
   listener, the loop-pause observer. These are polish / perf — safe to
   run when the browser is idle, so they never block first paint or
   first interaction.

A page with many cards or many ambient loops therefore pays its wiring
cost off the critical path.

## Delta-time loop primitive (AN-12)

`createLoop(update, render)` is the canonical canvas game-loop, exported
on the public API. **Nothing in the animation skill itself calls it** —
it ships as a CORRECT primitive so any future canvas work (animated
chart renders, particle backgrounds, etc.) reuses it instead of
re-inventing a fragile loop.

```js
var loop = amvcpAnimation.createLoop(
  function update(dt) { /* advance state by dt seconds */ },
  function render()   { /* draw the current frame */ }
);
loop.start();
// … later …
loop.stop();
loop.isRunning();   // -> boolean
```

The critical detail: `dt` is **capped at 0.1s**. If the tab is
backgrounded or the main thread stalls, `now - last` can balloon to
seconds; feeding that uncapped into a physics step produces a
spiral-of-death (one huge step → more work → an even bigger gap). The
cap bounds the worst-case step. `dt` is also clamped to `>= 0` to
defend against a non-monotonic clock.

`start()` is idempotent (a second call while running is a no-op);
`stop()` cancels the pending `requestAnimationFrame`.

## Re-scanning dynamic content

When content is inserted after init (e.g. an `interactive-control`
swaps a panel), call:

- `amvcpAnimation.refresh(root)` — re-runs the indexer, rebuilds the
  reveal observer, re-wires card tilt, rebuilds the loop-pause
  observer. Already-revealed elements keep their `.va-in` class so they
  do not flash. Tilt wiring is idempotent (a `data-va-tilt-wired`
  guard).
- `amvcpAnimation.revealNow(el)` — force one element into its revealed
  state immediately, bypassing the scroll trigger (for content that
  appears without a scroll event).

## Live reduced-motion changes

The module reads the OS `prefers-reduced-motion` preference once at
load, then keeps a `matchMedia` listener attached. Toggling the OS
setting while a report is open re-evaluates the gate and re-scans
mounted content — matching the DESIGN.md hot-swap ethos (no reload
needed).
