# Scroll-spy — `IntersectionObserver`-driven "you are here"

The reusable engine behind `references/sticky-table-of-contents.md`,
slide-deck position indicators, and "current section" badges. Watch
N elements; tell the observer when each enters the viewport; emit
a single "current" event whenever it changes.

## What it is

Polling the scroll position is wrong (CPU, jank, debounce hell).
`IntersectionObserver` is the right primitive: the browser fires the
callback only when an element actually crosses a threshold.

The reusable engine returns a small object with three pieces:

- `observe(el)` — adds an element to the watch list.
- `unobserve(el)` — removes one.
- `subscribe(fn)` — fires `fn(currentEl)` whenever the topmost-in-
  viewport element changes.

This is the seam every "current X" indicator can plug into.

## Helper

```js
function createScrollSpy(opts) {
  opts = opts || {};
  var rootMargin = opts.rootMargin || '-20% 0% -60% 0%';
  var threshold  = opts.threshold  || 0;

  var visible    = new Set();
  var subscribers = [];
  var current    = null;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { visible.add(e.target); }
      else                  { visible.delete(e.target); }
    });
    // Choose the topmost visible element (smallest top in viewport).
    var pick = null;
    var pickTop = Infinity;
    visible.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < pickTop) { pick = el; pickTop = top; }
    });
    if (pick !== current) {
      current = pick;
      subscribers.forEach(function (fn) { fn(current); });
    }
  }, { rootMargin: rootMargin, threshold: threshold });

  return {
    observe:   function (el) { io.observe(el); },
    unobserve: function (el) { io.unobserve(el); visible.delete(el); },
    subscribe: function (fn) { subscribers.push(fn); return current; },
    disconnect: function () { io.disconnect(); }
  };
}
```

Usage — auto-highlight a "current section" badge:

```js
var spy = createScrollSpy();
document.querySelectorAll('h2[id]').forEach(spy.observe);
var badge = document.getElementById('current-section-badge');
spy.subscribe(function (heading) {
  if (heading) { badge.textContent = heading.textContent; }
});
```

## The `rootMargin` trick

The default `rootMargin: 0px` makes an element "intersecting" the
moment any pixel enters the viewport. For a scroll-spy that's
wrong — the user perceives a section as "current" when it's at the
top of their visual field, not when its last sentence is still
visible above.

`'-20% 0% -60% 0%'` defines a thin band 20%-40% from the top of the
viewport. An element is "in" only when its top crosses this band.
Tune to taste:

- Steeper top bias (`-10% / -80%`) — the indicator changes earlier;
  less work to scroll one screen.
- Shallow (`-40% / -20%`) — the indicator changes later; more
  conservative.

The `0%` on the horizontal axes are irrelevant for vertical
scrolling but required by the syntax.

## DESIGN.md tokens

The spy itself emits no DOM; consumers pick their own tokens.
Common patterns:

- A "current section" badge styled with `--vc-color-accent` +
  `--ve-control-bg`.
- A TOC link styled with `--vc-color-accent` border-left + colored
  text (see `references/sticky-table-of-contents.md`).
- A progress-bar fill width = (visible-index / total).

## Selection / comment / decision-mini

The spy is a behaviour, not a widget — no atoms, no selection, no
decisions.

## JS-off degradation

**No "current section" indicator.** With JS off:

- The spy doesn't run.
- Any consumer that relies on `spy.subscribe(fn)` shows a static
  default (e.g. the first heading).
- The page itself is fully readable.

The pattern is purely enhancement; static fallbacks should show a
sensible default (the first item, an "All" label, the most
important section).

## Anti-patterns

- Polling `window.scrollY` and computing distances every frame.
  Burns CPU, flakes on mobile.
- Calling `getBoundingClientRect()` for every watched element on
  every scroll. The observer's job is to AVOID that — only the
  topmost-visible element is measured per callback.
- A `setTimeout`-based check. Misses fast scrolls.
- One observer per element. The Set + Map approach in
  `createScrollSpy` is O(1) per add; one observer batches every
  callback.
- Putting business logic inside the IO callback. Subscribe a
  handler; the callback only updates `current` and notifies.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
const spy = createScrollSpy();
const hs = document.querySelectorAll('h2');
let lastSeen = null;
spy.subscribe(h => { lastSeen = h; });
hs.forEach(spy.observe);

// Scroll to the 3rd heading — the spy reports it.
hs[2].scrollIntoView();
await new Promise(r => setTimeout(r, 300));   // IO is async
console.assert(lastSeen === hs[2], 'spy did not update');

// Scroll past — different heading becomes topmost.
window.scrollBy(0, 1000);
await new Promise(r => setTimeout(r, 300));
console.assert(lastSeen !== hs[2]);
```

For automated regression: synthesise scroll-into-view, give the
IO callback one frame, then assert the subscribed handler fired
with the right element.
