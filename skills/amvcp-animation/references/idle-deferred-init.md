# Idle-deferred init — the two-tier init contract

The skill's `init()` runs in TWO tiers: immediate (gating visible
content, runs before first paint) vs deferred (polish + perf, runs
inside `requestIdleCallback`). This keeps the polish layer off
the critical path.

## The two tiers

### Tier 1 — Immediate

Runs synchronously in `init()` because it gates visible content.
Must complete before first paint or content flashes / lands wrong.

```js
function init(root) {
  var d = root || (typeof document !== 'undefined' ? document : null);
  if (!d) { return; }

  // Immediate — content-gating layers.
  var staggers = d.querySelectorAll('[data-va-stagger]');
  for (var i = 0; i < staggers.length; i++) {
    indexStagger(staggers[i]);
  }
  stampAnimatedAtoms(d);
  initScrollReveal(d);

  // Deferred — polish / perf layers.
  deferInit(function () {
    initCardTilt(d);
    initParallaxFallback(d);
    initLoopPause(d);
  });
}
```

Three things are immediate:

1. **`indexStagger`** — fills `--va-index` on each
   `.va-stagger-item`. Must run before the cascade begins (which
   happens immediately on page load for `.va-stagger`). Without
   the indexer, all items animate with `--va-index: 0`, the
   cascade collapses to a single moment.

2. **`stampAnimatedAtoms`** — attaches `data-ve-id` +
   `data-ve-type` to each comment-able atom. Must run before the
   runtime's hover/select CSS engages — those rules query
   `[data-ve-id]` selectors. If stamping is deferred, the user
   sees a card without comment-target affordance for ~200ms,
   confusing.

3. **`initScrollReveal`** — attaches the reveal observer. Must
   run before the user starts scrolling — if the user scrolls
   before the observer attaches, the observer never sees the
   intersection event for the now-visible section, and the
   reveal never fires. Content stays at `opacity: 0` forever.

### Tier 2 — Deferred

Runs inside `requestIdleCallback` because it is polish or perf.
Safe to delay until the browser is idle, never blocking first
paint or first interaction.

```js
deferInit(function () {
  initCardTilt(d);
  initParallaxFallback(d);
  initLoopPause(d);
});
```

Three things are deferred:

1. **`initCardTilt`** — attaches mousemove/mouseleave listeners.
   The tilt is a hover-only effect; the user can't be hovering
   within the first 100ms of page load (they're reading the
   page). Listeners can attach late without missing any events.

2. **`initParallaxFallback`** — attaches the scroll listener.
   The first scroll event almost certainly fires after the
   browser is idle (a user takes >100ms to react to the page
   loading and begin scrolling).

3. **`initLoopPause`** — attaches the loop-pause IO. The first
   loop pause/resume cycle happens on the first scroll past a
   loop element — also late enough to wait for idle.

## The `deferInit` helper

```js
function deferInit(fn) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, { timeout: 2000 });
  } else if (typeof setTimeout === 'function') {
    setTimeout(fn, 1);
  } else {
    fn();
  }
}
```

Three fallback tiers:

1. **`requestIdleCallback`** — modern browsers. Runs `fn` when
   the browser is idle (no pending high-priority work). The
   `timeout: 2000` is a safety cap: if the browser stays busy for
   2 seconds, run `fn` anyway. Without the cap, a permanently-
   busy browser would never run the polish init.

2. **`setTimeout(fn, 1)`** — Safari does not yet ship
   `requestIdleCallback` (status: not implemented as of writing).
   `setTimeout(fn, 1)` defers `fn` to the next event loop tick,
   which is "after the current task completes". On Safari this is
   the best approximation of "wait until idle" available.

3. **`fn()` synchronous** — neither API exists (some embedded
   contexts). Run synchronously. This is the worst case but the
   skill remains correct (init still completes, just on the
   critical path).

## Why two tiers, not one

If everything ran immediately:
- First Input Delay (FID) increases because the main thread is
  busy attaching listeners during init.
- The tilt wiring (which has a `for` loop over potentially many
  cards, each adding two listeners) blocks the main thread
  proportional to the card count.
- The parallax listener attaches before any user has scrolled —
  wasted setup cost for users who never scroll.
- The loop-pause IO attaches before any loop has scrolled
  off-screen — same wasted setup.

If everything was deferred:
- Stagger indexing happens AFTER the stagger animation already
  fired, so the cascade is broken (all items at index 0).
- Comment atoms are unmarked when the runtime tries to attach
  hover/select handlers.
- Scroll-reveal misses early scroll events; content stuck at
  opacity 0.

The split is the right answer: immediate work that must complete
before paint, deferred work that can wait until idle.

## DESIGN.md tokens consumed

None. The defer helper is pure JavaScript with no theming.

## Reduced-motion interaction

The reduce gate is read at INIT (in the module's top-level
`REDUCED = ...` block) and again at every function call (gates
inside `animateStat`, `initCardTilt`). The defer doesn't change
this — gating happens INSIDE each deferred function, just like in
each immediate function.

`initCardTilt`'s reduce gate (`if (REDUCED) { return }`) runs
when the deferred function fires, not at the time of `deferInit`
scheduling. So a user with `reduce` on doesn't get tilt
listeners; a user without `reduce` does.

## Selection + comment + decision integration

Atom stamping (`stampAnimatedAtoms`) runs in Tier 1 (immediate),
BEFORE the reveal observer attaches. The reason: comment hover
affordances should be available from first paint, not from "after
idle". A user who reads a card and wants to comment on it
shouldn't wait 200ms for the affordance to appear.

The decision mini-pill mounting is queued and flushed on the
runtime's `attachDecisionMini` becoming available (which the
runtime publishes as part of its boot). The flush mechanism is
deferred via microtask + DOM-ready listener, not via
`deferInit` — those are different defer mechanisms (Promise
microtask vs `requestIdleCallback`).

## Tier-2 init failure recovery

If the deferred init never fires (e.g. browser permanently busy,
no `setTimeout`, no `requestIdleCallback`), three things break:

1. **Card tilt** — cards don't tilt on hover. The static
   `:hover` rule (if authored separately) still works. Graceful
   degradation.
2. **Parallax** — `--va-scroll-y` never gets written. Parallax
   elements stay at `translateY(0)`. The page is still readable;
   parallax is decorative.
3. **Loop pause** — loops keep running off-screen. CPU usage is
   higher; battery drains faster; no behavioral break.

None of the Tier-2 failures are content-breaking. The page stays
functional. This is intentional: deferred work is by definition
"safe to skip if needed".

## Order of deferred work

```js
deferInit(function () {
  initCardTilt(d);
  initParallaxFallback(d);
  initLoopPause(d);
});
```

All three run in the SAME `requestIdleCallback` callback. The
order is:

1. `initCardTilt` — first because it's the user-facing one (a
   hover-related affordance).
2. `initParallaxFallback` — second because it primes the initial
   `--va-scroll-y` value.
3. `initLoopPause` — last because it scans the whole document for
   loops; longest-running.

If the idle callback is INTERRUPTED mid-execution (the browser
reclaims the main thread for higher-priority work), only the
completed inits stick. The skill is tolerant of partial Tier-2
completion: each init is idempotent; a re-run via `refresh()`
picks up missed work.

## Re-running deferred init

```js
function refresh(root) {
  var d = root || document;
  // ... immediate work first ...
  initScrollReveal(d);
  initCardTilt(d);      // re-run immediately (not deferred!)
  // ... loop-pause rebuild ...
  initLoopPause(d);     // re-run immediately
}
```

`refresh(root)` re-runs the deferred inits IMMEDIATELY, not
deferred. The reasoning: a refresh is a response to a known
dynamic-insertion event; the user explicitly asked for the new
content to wire up. Deferring again would risk missing the
hover/scroll events the user is about to trigger.

The synchronous re-run on refresh is slightly more main-thread-
expensive than the initial deferred run, but refreshes happen
rarely (once per modal open, etc.) — the perf budget is fine.

## Diagnostics

- **Card tilt doesn't work for a moment after page load** →
  expected — the wiring is deferred. If the delay is too long,
  measure with DevTools Performance (look for
  `requestIdleCallback` callbacks).
- **Parallax doesn't activate until the user scrolls** →
  expected — the listener is deferred, so the FIRST scroll event
  primes the initial value via the callback's `_scrollUpdate()`.
- **A loop runs off-screen for the first few seconds** → expected
  — the loop-pause observer is deferred. After it attaches, the
  next scroll cycle will pause off-screen loops.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page. Use `await page.evaluate(() => performance.now())`
   to get the timestamp at load.
2. Use `await page.evaluate(() => document.querySelector('.va-tilt')?.hasAttribute('data-va-tilt-wired'))`
   immediately — should be `false` (not yet wired).
3. Wait 500ms.
4. Re-query — should be `true` (wired in the deferred callback).
5. Use `await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--va-scroll-y'))`
   immediately — should be empty (parallax listener not attached
   yet).
6. Wait 500ms, scroll a tiny amount.
7. Re-query — should be `'0px'` or similar (the prime via
   `_scrollUpdate()` ran).
