# Dynamic content refresh — `refresh(root)` and `revealNow(el)`

The two API hooks for content inserted AFTER the initial `init()`.
The runtime calls these whenever an interactive-control swaps a
panel; authors call them when manually inserting content.

## `refresh(root)` — re-scan a subtree

```js
amvcpAnimation.refresh(root);
```

Re-runs four passes over the given root (defaults to `document`):

1. **Stagger indexer** — fills `--va-index` on new
   `.va-stagger-item`s.
2. **Atom stamper** — attaches `data-ve-id` + `data-ve-type` + the
   decision pill to new comment-able atoms.
3. **Scroll-reveal observer** — disconnects the old observer,
   builds a fresh one covering all reveal targets in `root`.
4. **Card-tilt wiring** — attaches mousemove/mouseleave to new
   `.va-tilt` cards.
5. **Loop-pause observer** — rebuilds the loop-pause IO covering
   all loop elements in `root`.

The implementation:

```js
function refresh(root) {
  var d = root || document;
  var staggers = d.querySelectorAll('[data-va-stagger]');
  for (var i = 0; i < staggers.length; i++) {
    indexStagger(staggers[i]);
  }
  if (_revealObserver) {
    try { _revealObserver.disconnect(); } catch (e) { /* noop */ }
    _revealObserver = null;
  }
  stampAnimatedAtoms(d);
  initScrollReveal(d);
  initCardTilt(d);
  if (_loopObserver) {
    try { _loopObserver.disconnect(); } catch (e) { /* noop */ }
    _loopObserver = null;
  }
  initLoopPause(d);
}
```

Note that the deferred-init pattern is NOT used here. `refresh()`
is a response to an EXPLICIT dynamic event (the caller knows new
content arrived); the user is about to interact with the new
content. Deferring would risk missing the first hover or scroll
on the new content.

## Idempotency

`refresh()` is idempotent for already-mounted content:

- **Stagger indexer** — only sets `--va-index` if absent; existing
  items keep their index.
- **Atom stamper** — only sets `data-ve-id` if absent; existing
  atoms keep their IDs.
- **Decision pill** — the runtime's `attachDecisionMini` guards
  against double-mount.
- **Card-tilt** — the `data-va-tilt-wired` attribute prevents
  double-wiring.
- **Loop-pause observer** — DISCONNECT and REBUILD; the new
  observer covers all loops (including ones it covered before).

The reveal observer is the one piece that's REBUILT not extended.
Already-revealed elements keep their `.va-in` class (they're
listed in the observer's old watch list and won't be re-observed
in the new one — but they don't need to be; they're already
revealed). New reveal targets get observed in the new instance.

## When to call `refresh()`

- **After an interactive-control swap.** The runtime calls
  `refresh()` when the user clicks a tab and a new panel mounts.
- **After streaming content arrives.** Replace skeletons with real
  content, then `refresh()` to wire animations on the new content.
- **After a modal opens with animated content.** The modal's
  inner content needs the IO/tilt/loop-pause wiring.
- **After a dynamic re-render** (e.g. React/Vue/Svelte mount).
  Call `refresh()` once the new DOM is in place.

When NOT to call:
- **For static pages.** If nothing changes after init, refresh is
  unnecessary. The init pass already covered everything.
- **For purely cosmetic DOM updates** (changing a text node, a
  color class). Refresh doesn't observe text changes; the existing
  animations don't care.

## `revealNow(el)` — force-reveal one element immediately

```js
amvcpAnimation.revealNow(el);
```

Bypasses the scroll trigger and immediately reveals one element.
Used for content that appears WITHOUT a scroll event:

- Content swapped into a modal that's already open.
- Content swapped into a tab panel that's already in the viewport.
- Content shown via a "Show more" button that doesn't scroll the
  page.

The implementation:

```js
function revealNow(el) {
  if (_revealObserver && el) {
    try { _revealObserver.unobserve(el); } catch (e) { /* noop */ }
  }
  _doReveal(el);
}
```

Two steps:

1. **Un-observe** if the element was being observed. Without this,
   the scroll-reveal observer might also fire later (when the
   element next intersects), wastefully re-running `_doReveal()`.
2. **`_doReveal(el)`** directly. For a `data-va-reveal` element,
   adds `.va-in`. For a `.va-counter`, runs the count-up.

## When to use `revealNow()` vs `refresh()`

| scenario | use |
|---|---|
| New content inserted, has multiple `data-va-reveal` items | `refresh(root)` |
| New content has ONE specific item that should reveal now | `revealNow(el)` |
| Modal opens with content already rendered, just needs to wire | `refresh(modal)` |
| Tab panel content swap, content was pre-rendered hidden | `refresh(tabContent)` |
| Single counter should start counting immediately | `revealNow(counterEl)` |
| Single section should fade-in immediately | `revealNow(sectionEl)` |

`revealNow` is a SINGLE-element shortcut. `refresh` is a
SUBTREE-wide rewire.

## The reveal observer's `_revealCount` test hook

```js
var _revealCount = 0;
// ... in _doReveal: _revealCount++ ...
```

A test can probe `window.__veAnimation.revealCount()` (the exposed
test API) to confirm the reveal observer worked correctly:

1. Load page with elements above + below the fold.
2. Confirm `revealCount` equals the count of elements above the
   fold (those revealed immediately at init).
3. Scroll. Confirm `revealCount` increased by the count of
   elements that just scrolled into view.
4. Scroll back up and down. Confirm `revealCount` did NOT increase
   (proves `unobserve` worked — each element reveals once).
5. Call `revealNow(unrevealedEl)`. Confirm `revealCount` increased
   by 1.

## DESIGN.md tokens consumed

None directly. The refresh helpers operate on already-themed
content; they don't re-emit tokens or modify the DESIGN.md state.

## Reduced-motion interaction

`refresh()` re-runs gate checks via the inner init functions:

- `initCardTilt(root)` checks `REDUCED` and exits early if `true`.
- Counter behavior in `_doReveal` for `.va-counter` elements
  checks `REDUCED` inside `animateStat`.

So a refresh under `reduce` correctly skips tilt wiring and
collapses counter rolls to instant final values. The skill
handles the gate at the function level, not at the refresh level.

## Selection + comment + decision integration

`refresh()` re-stamps atoms via `stampAnimatedAtoms(d)`. New
content gets `data-ve-id` + `data-ve-type` and decision pills.
Existing atoms keep their assignments.

For dynamic insertion of CONTENT atoms (a new `.va-stagger-item`
card), the refresh ensures the new card is comment-able from the
moment it mounts. Users can attach decisions and comments to it
just like any pre-existing card.

## Live OS-preference toggle

The skill's `_watchReducedMotion` listener calls
`_api.refresh(document)` when `prefers-reduced-motion` toggles
mid-session. This is the "hot-swap" path for reduced-motion: the
user toggles the OS preference, the listener fires, refresh
re-evaluates the gates for all already-mounted content.

The behavior change:

- A counter that was rolling under `no-preference` continues
  rolling (the rAF tick captures `REDUCED` at function entry,
  not on every tick — so a counter already mid-flight finishes).
- A counter scheduled to fire LATER (still below the fold when
  reduce was toggled) will fire with the instant-final path.
- Card tilt is re-wired but the JS gate now blocks listener
  attachment.
- The CSS gates (which the browser reads from the new media
  query) take effect immediately for all CSS animations.

The hot-swap is incomplete in one edge case: a tilt listener
attached BEFORE the reduce toggle stays attached. The user gets
"reduce" CSS (no static hover lift?) but live tilt (mousemove
listeners still firing). A page reload fully syncs.

## Diagnostics

- **Refreshed content doesn't animate** → confirm `refresh(root)`
  was called with the right root. If the root excludes the new
  content, the new content isn't seen.
- **`revealNow` doesn't work on a counter** → check the element
  has `data-va-stat="<number>"`; non-numeric is silently skipped.
- **Multiple refreshes cause performance issues** → each refresh
  rebuilds the reveal observer; for very large pages this is
  measurable. Don't call `refresh()` on every minor DOM change;
  batch up to one refresh per logical user action.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a tab control. Confirm tab #1 content has
   `data-ve-id` stamped.
2. Click tab #2 (which inserts new content). Without `refresh()`,
   the new content has NO `data-ve-id`.
3. Trigger `amvcpAnimation.refresh(tabContainer)`. Re-query — the
   new content NOW has `data-ve-id`.
4. Use `revealNow(el)` on a specific new element; confirm the
   element has `.va-in` immediately after the call.

## When refresh fails silently

If `root` does not include the new content (e.g. the new content
is appended OUTSIDE `root`), `refresh(root)` is a no-op for the
new content — the queries don't find it.

The common bug: appending to a modal sibling, but calling
`refresh(modal)` instead of `refresh(modal.parentNode)`. Confirm
the query subtree contains the new content.
