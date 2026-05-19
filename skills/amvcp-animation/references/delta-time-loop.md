# Delta-time loop — `amvcpAnimation.createLoop(update, render)`

## Table of Contents

- [The public API](#the-public-api)
- [The implementation](#the-implementation)
- [The `start()` idempotency](#the-start-idempotency)
- [The `stop()` cancel](#the-stop-cancel)
- [Why ship a primitive nothing uses?](#why-ship-a-primitive-nothing-uses)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion interaction](#reduced-motion-interaction)
- [Example consumer — a hypothetical chart entrance](#example-consumer--a-hypothetical-chart-entrance)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [When NOT to use this primitive](#when-not-to-use-this-primitive)

The canonical canvas game-loop primitive. NOTHING in the
animation skill itself calls it — it ships as a CORRECT primitive
so any future canvas work (animated charts, particle
backgrounds, etc.) reuses it instead of re-inventing a fragile
loop.

## The public API

```js
var loop = amvcpAnimation.createLoop(
  function update(dt) { /* advance state by dt seconds */ },
  function render()   { /* draw the current frame */ }
);
loop.start();
// ... later ...
loop.stop();
loop.isRunning();   // -> boolean
```

`createLoop` takes two callbacks: `update(dt)` for state
advancement (physics, animation tick), `render()` for drawing
(canvas draw calls, DOM updates). Returns an object with three
methods.

## The implementation

```js
function createLoop(update, render) {
  var last = 0;
  var raf = 0;
  var running = false;
  function frame(now) {
    var dt = (now - last) / 1000;
    if (dt > 0.1) { dt = 0.1; }   // cap — anti spiral-of-death
    if (dt < 0) { dt = 0; }
    last = now;
    if (typeof update === 'function') { update(dt); }
    if (typeof render === 'function') { render(); }
    if (running) { raf = requestAnimationFrame(frame); }
  }
  return {
    start: function () {
      if (running) { return; }
      running = true;
      last = (typeof performance !== 'undefined'
        && performance.now) ? performance.now() : Date.now();
      raf = requestAnimationFrame(frame);
    },
    stop: function () {
      running = false;
      if (raf && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(raf);
      }
      raf = 0;
    },
    isRunning: function () { return running; }
  };
}
```

Five critical details:

1. **`dt` capped at 0.1s.** If the tab is backgrounded or the main
   thread stalls, `now - last` can balloon to seconds. Feeding
   that uncapped into a physics step produces a SPIRAL OF DEATH:
   one huge step → physics has more work → next step takes longer
   → larger gap → bigger step → ... → page hangs. The 0.1s cap
   bounds the worst-case step. Any time loss past 0.1s is
   DROPPED, not recovered.

2. **`dt` clamped to ≥ 0.** Defends against a non-monotonic clock
   (rare but possible — NTP adjustments, manual system clock
   change). Without the clamp, a negative `dt` could make physics
   step BACKWARD, producing nonsense.

3. **`performance.now()` preferred over `Date.now()`.** The former
   is monotonic and sub-millisecond. The latter is wall-clock and
   millisecond-precision; subject to clock skew. The `start`
   timestamp uses `performance.now()` if available, falling back
   to `Date.now()` only on very old environments.

4. **`requestAnimationFrame` for the loop.** Aligns updates to
   the browser's frame budget (~16ms at 60Hz, ~8ms at 120Hz). Far
   better than `setInterval(fn, 16)` which doesn't sync to vsync
   and can produce stutter.

5. **`if (running) { raf = ... }` guard.** A `loop.stop()` call
   sets `running = false` AND cancels the pending rAF. But if the
   `frame` function is mid-execution when `stop()` is called
   (rare but possible in async scenarios), the guard prevents
   the cancelled frame from queueing another one.

## The `start()` idempotency

```js
start: function () {
  if (running) { return; }   // second call is a no-op
  // ...
}
```

Calling `start()` twice while the loop is running is a NO-OP.
This is the correct semantic: you don't want two parallel rAF
chains running the same loop.

## The `stop()` cancel

```js
stop: function () {
  running = false;
  if (raf && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(raf);
  }
  raf = 0;
}
```

`stop()` does TWO things:
1. Set `running = false` — the next frame, if it runs, will not
   queue another.
2. Cancel the pending rAF — the next frame won't run at all.

The redundancy is intentional: setting `running = false` alone
would still let one more frame execute (the one already queued);
cancelling alone would leave `running = true` so a future `start()`
might no-op incorrectly. Both belong.

## Why ship a primitive nothing uses?

The animation skill itself uses CSS animations and
`IntersectionObserver` — no canvas work, no game loop. Why ship a
loop primitive at all?

Two reasons:

1. **Future skill consumers.** The chart skill might render
   animated bar charts on canvas (the existing chart implementation
   could move to canvas for very large datasets). The diagram skill
   has talked about an interactive scene-graph engine. Both
   need a loop primitive. Shipping it once, correctly, here means
   neither has to roll their own (and probably get the dt-cap
   wrong).

2. **Demonstrate the correct pattern.** A junior developer faced
   with "write a canvas animation" might write:
   ```js
   setInterval(() => { update(); render(); }, 16);  // BROKEN
   ```
   The pattern is everywhere on the internet. By shipping the
   CORRECT pattern as a documented public API, this skill makes
   the right choice the default.

## DESIGN.md tokens consumed

None directly. The loop primitive is a perf utility, not a themed
animation. If a canvas-using consumer wants to theme its
animations (e.g. read `--vc-easing-decel` to drive a chart
entrance ease), it does so in its own update/render callbacks.

## Reduced-motion interaction

`createLoop` itself does NOT check `REDUCED`. The caller's
`update`/`render` callbacks are responsible for honoring the
reduce gate:

```js
var loop = amvcpAnimation.createLoop(
  function update(dt) {
    if (REDUCED) { return; }   // skip state advance
    // ... full update ...
  },
  function render() {
    // render the current state — even under reduce, you still
    // need to show the final frame
  }
);
```

Or, simpler: don't start the loop under `reduce`. Compute the
final state once and render it.

The reason `createLoop` doesn't bake in the gate: the gate
behavior is consumer-specific. A particle background loop under
`reduce` should NOT run at all (decorative-only); an animated
chart loop under `reduce` should render the FINAL state
immediately (information-bearing). The primitive can't know which.

## Example consumer — a hypothetical chart entrance

```js
function animateChartEntrance(ctx, finalData) {
  if (REDUCED || typeof requestAnimationFrame !== 'function') {
    drawChart(ctx, finalData);   // final state immediately
    return;
  }
  var t = 0;
  var dur = 0.6;   // 600ms (matches --vc-duration-entrance)
  var loop = amvcpAnimation.createLoop(
    function update(dt) {
      t += dt;
      if (t > dur) { t = dur; }
    },
    function render() {
      var frac = t / dur;
      var eased = 1 - Math.pow(1 - frac, 3);   // easeOutCubic
      var current = finalData.map(function (v) { return v * eased; });
      drawChart(ctx, current);
      if (t >= dur) { loop.stop(); }
    }
  );
  loop.start();
}
```

The chart skill (future) might call exactly this pattern. The
loop primitive does the work; the chart code does the math and
the rendering.

## Selection + comment + decision integration

The loop primitive doesn't touch the DOM directly (unless the
caller's `render()` does). It does not stamp atoms or attach
pills. Atoms live in the canvas (or DOM updates) the consumer
draws.

For canvas-based renders, the chart/diagram skill would emit
a single comment-able atom per canvas (e.g. the
`<canvas data-ve-id="chart-1" data-ve-type="chart">` element), not
per drawn shape inside the canvas.

## Diagnostics

- **Loop runs forever after `stop()`** → the consumer is calling
  `start()` repeatedly without checking `isRunning()`, accumulating
  loops. Use `if (!loop.isRunning()) loop.start()`.
- **`dt` is huge (multi-second)** → the cap is working; you're
  seeing `dt = 0.1` (the max). Your `update` should advance by
  0.1s, not panic.
- **Loop is choppy (uneven frame timing)** → check that `update`
  and `render` complete in < 16ms. Profile with DevTools
  Performance.

## Visual verification

Loops produce visual output via the consumer's `render()`. The
loop primitive itself has no visual to verify.

For a canvas consumer:
1. Start the loop.
2. Capture canvas pixels at intervals via
   `canvas.toDataURL()`.
3. Confirm the pixels CHANGE over time (proves update + render
   are firing).
4. Stop the loop.
5. Confirm pixels STOP changing (proves stop worked).

## When NOT to use this primitive

- **Pure CSS animations** (which the skill itself uses). CSS is
  GPU-accelerated, declarative, and doesn't burn main-thread
  cycles. Use CSS for transform/opacity animations.
- **One-shot animations < 1s** with no interactivity. A single
  `setTimeout` + DOM update is simpler.
- **DOM-based animations** that don't need a continuous loop.
  Use CSS transitions or `Element.animate()` (Web Animations API).

The loop primitive is for **canvas** work (particle systems,
animated charts, anything requiring per-frame paint logic in JS).
