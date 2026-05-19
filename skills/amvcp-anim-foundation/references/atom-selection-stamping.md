# Atom selection stamping — the unified contract integration

## Table of Contents

- [The atom kinds the skill stamps](#the-atom-kinds-the-skill-stamps)
- [The stamper](#the-stamper)
- [What "atoms" are in the contract](#what-atoms-are-in-the-contract)
- [The decision mini-pill](#the-decision-mini-pill)
- [Defensive deferral when the runtime isn't loaded yet](#defensive-deferral-when-the-runtime-isnt-loaded-yet)
- [What is NOT stamped](#what-is-not-stamped)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion interaction](#reduced-motion-interaction)
- [Re-stamping on refresh](#re-stamping-on-refresh)
- [Atom ID stability across re-renders](#atom-id-stability-across-re-renders)
- [Selection model integration](#selection-model-integration)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Why the skill stamps (not the runtime)](#why-the-skill-stamps-not-the-runtime)

Every animated atom that the user might COMMENT ON or DECIDE
ABOUT carries `data-ve-id` + `data-ve-type`. The animation skill
runs a stamping pass at init (and again on each `refresh`) to
mark its three atom kinds — cards, revealed sections, counters —
plus attach the per-atom decision mini-pill.

## The atom kinds the skill stamps

```js
var SEL = '.va-stagger-item, [data-va-reveal], .va-counter[data-va-stat]';
```

Three kinds, two type values:

| selector | `data-ve-type` | rationale |
|---|---|---|
| `.va-stagger-item` | `card` | each cascade item is a comment-able card |
| `[data-va-reveal]` | `card` | each revealed section is a comment-able card |
| `.va-counter[data-va-stat]` | `counter` | a numeric counter is a more specific kind |

`counter` wins over `card` when both classes apply (a
`.va-stagger-item.va-counter` is counted as a counter — the
count-up is the more specific behavior).

## The stamper

```js
function stampAnimatedAtoms(root) {
  var d = root || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.querySelectorAll) { return 0; }
  var stamped = 0;
  var SEL = '.va-stagger-item, [data-va-reveal], .va-counter[data-va-stat]';
  var nodes = d.querySelectorAll(SEL);
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var type = 'card';
    if (el.classList && el.classList.contains('va-counter')) {
      type = 'counter';
    }
    var stableId = el.id
      || (el.getAttribute && el.getAttribute('data-ve-id'))
      || ('anim-' + type + '-' + i);
    _stampAtomVa(el, stableId, type);
    _attachDecisionMiniVa(el, stableId);
    stamped++;
  }
  return stamped;
}
```

Three rules baked into the stamper:

1. **Stable ID precedence.** Use `el.id` first, then existing
   `data-ve-id`, then generate `anim-<type>-<i>` from the
   ordinal. Generated IDs are stable for a given page-render
   because the query order is stable; they BREAK if elements are
   re-ordered or inserted. For dynamic insertion, prefer
   author-given `id` attributes.

2. **Type wins by specificity.** A counter is more specific than
   a card. The `if (classList.contains('va-counter'))` overrides
   the default `card` value.

3. **Idempotency.** The stamper uses `_stampAtomVa` which only
   sets attributes if they're absent. Re-running on an already-
   stamped node is a no-op.

## What "atoms" are in the contract

The unified atom contract (TRDD-352ef46a) defines an ATOM as a
single comment-able + decision-tagable unit. Every plugin skill
must:

1. Identify which DOM nodes are atoms.
2. Stamp them with `data-ve-id` (stable across re-renders) and
   `data-ve-type` (one of the contract types: `card`, `counter`,
   `code`, `table-row`, `chart`, etc.).
3. Attach the runtime's decision mini-pill via
   `window.amvcpRuntime.attachDecisionMini(el, id)`.

The animation skill's atoms: cards (cascade items, revealed
sections) and counters. The runtime's hover/select CSS then
queries `[data-ve-id]` to provide hover affordances and
selection highlights.

## The decision mini-pill

```js
function _attachDecisionMiniVa(el, id) {
  if (!el) { return; }
  var rt = (typeof window !== 'undefined') ? window.amvcpRuntime : null;
  if (rt && typeof rt.attachDecisionMini === 'function') {
    try { rt.attachDecisionMini(el, id); }
    catch (e) { /* never block reveal for one bad pill */ }
    return;
  }
  _animDecisionPending.push({ el: el, id: id });
}
```

The mini-pill is a small "UNDECIDED" badge that appears next to
each atom. Users click it to cycle UNDECIDED → KEEP → REJECT →
NEEDS-INFO → back to UNDECIDED. The badge's color reflects the
state.

The pill is attached by the RUNTIME (not by the animation skill),
via the shared `window.amvcpRuntime.attachDecisionMini` helper.
This separation means:
- The pill's look is owned by the runtime (consistent across all
  atoms).
- The pill's behavior is owned by the runtime (state machine, save
  to local storage).
- The animation skill only KNOWS which elements should have a
  pill.

## Defensive deferral when the runtime isn't loaded yet

The animation skill is shipped beside the runtime. At init time,
the runtime might not have yet published its
`window.amvcpRuntime`. The pill attachment queues:

```js
var _animDecisionPending = [];

function _flushAnimDecisionPending() {
  if (typeof window === 'undefined') { return; }
  var rt = window.amvcpRuntime;
  if (!rt || typeof rt.attachDecisionMini !== 'function') { return; }
  var q = _animDecisionPending;
  _animDecisionPending = [];
  for (var i = 0; i < q.length; i++) {
    try { rt.attachDecisionMini(q[i].el, q[i].id); }
    catch (e) { /* swallow */ }
  }
}

// Flush queue on microtask, DOM ready, and timeout — guarantees
// at least one flush regardless of script load order.
if (typeof window !== 'undefined') {
  if (typeof Promise !== 'undefined' && typeof Promise.resolve === 'function') {
    Promise.resolve().then(_flushAnimDecisionPending);
  } else if (typeof setTimeout === 'function') {
    setTimeout(_flushAnimDecisionPending, 0);
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _flushAnimDecisionPending);
    } else if (typeof setTimeout === 'function') {
      setTimeout(_flushAnimDecisionPending, 100);
    }
  }
}
```

Three flush triggers (one of them always fires):
1. `Promise.resolve().then(...)` — microtask immediately after init.
2. `DOMContentLoaded` listener — fires when DOM parses fully.
3. `setTimeout(fn, 100)` — fallback for documents already loaded.

The queue + multi-trigger pattern handles every script-load order:
runtime-before-animation, animation-before-runtime, both async,
both deferred. Whichever order, the pills land.

## What is NOT stamped

Looking at the explicit selector list:

```js
var SEL = '.va-stagger-item, [data-va-reveal], .va-counter[data-va-stat]';
```

Notably excluded:
- **`.va-tilt`** — decoration / interaction polish; the underlying
  card is the atom.
- **`.va-pulse`** — UI status indicator, not content.
- **`.va-skeleton`** — placeholder for not-yet-arrived content;
  not its own atom.
- **`.va-float-y`, `.va-breathe`, `.va-orbit`, `.va-rotate`** —
  decorative ambient loops; not content.
- **`.va-link`** — text decoration; the surrounding content is
  the atom.
- **`.va-progress-bar`** — page-wide UI; not content.
- **`.va-parallax-*`** — depth layer; not content.
- **`.va-snap-item`** — layout aid; the content INSIDE is the atom.

The rule: only CONTENT atoms (cards, sections, counters) are
stamped. UI affordances, decorations, placeholders, layout aids
are not.

## DESIGN.md tokens consumed

None directly. The stamping pass operates on already-themed DOM;
the atom contract is theme-independent. The mini-pill's appearance
IS themed (the runtime reads `--vc-color-*` for its colors), but
the stamping itself doesn't touch tokens.

## Reduced-motion interaction

Stamping is gate-independent — atoms are stamped regardless of
the user's `prefers-reduced-motion` preference. The pill works the
same under `reduce` (it's not an animation, it's a static button).

## Re-stamping on refresh

```js
function refresh(root) {
  // ...
  stampAnimatedAtoms(d);
  // ...
}
```

`refresh(root)` re-runs the stamper. Existing atoms keep their
IDs (the `_stampAtomVa` idempotency guard); new atoms get fresh
IDs.

The decision pills are guarded by the runtime's `attachDecisionMini`
(double-mount safe). The flush mechanism handles the case where
`refresh` runs before the runtime has published its helper.

## Atom ID stability across re-renders

If the page is re-rendered (e.g. a static-site rebuild produces a
new HTML output), the atom IDs are stable ONLY if the markup
explicitly carries `id=` attributes or pre-existing `data-ve-id`
attributes. The fallback ID (`anim-<type>-<i>`) is ORDINAL-based
— a re-render that inserts a new card at position 2 shifts every
subsequent ID.

For comment persistence across re-renders, the author MUST
assign stable IDs to comment-target atoms:

```html
<li class="va-stagger-item" id="metric-revenue">…</li>
<li class="va-stagger-item" id="metric-users">…</li>
```

With explicit IDs, comments + decisions keyed to the IDs survive
re-renders.

## Selection model integration

The runtime's selection model (separate from this skill) reads
`[data-ve-id]` to identify hoverable / selectable atoms. When the
user hovers a `[data-ve-id]` element, the runtime CSS adds an
outline (theme-resolved). When the user clicks, the runtime adds
`[data-ve-selected]`.

The animation skill doesn't participate in the selection model
beyond stamping. The selection visuals are the runtime's job.

## Diagnostics

- **Comment-target affordance missing on a card** → the card
  isn't stamped. Confirm it matches `.va-stagger-item`,
  `[data-va-reveal]`, OR `.va-counter[data-va-stat]`.
- **Pill doesn't appear** → the runtime isn't loaded, or its
  `attachDecisionMini` is missing. Confirm via
  `typeof window.amvcpRuntime?.attachDecisionMini === 'function'`.
- **Pill appears twice on the same atom** → the runtime's guard
  failed; the runtime is responsible for double-mount safety.
- **Atom IDs change between renders** → the fallback ordinal IDs
  shifted. Assign explicit `id=` attributes for stability.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page. Query `document.querySelectorAll('[data-ve-id]')`.
   Confirm count matches the count of stagger items + reveal
   targets + counters.
2. For each, confirm `data-ve-type` is set to either `card` or
   `counter`.
3. Hover an atom; confirm the runtime adds a hover outline.
4. Click an atom; confirm `data-ve-selected` is set.
5. Confirm the decision pill is present on each atom (the pill
   is a child element with a known class — check the runtime's
   pill class).

## Why the skill stamps (not the runtime)

The atom contract requires that each skill know its own atom
kinds. The animation skill knows that a `.va-stagger-item` is a
card; the chart skill knows that a `<canvas data-vc-chart>` is a
chart. Centralizing all stamping in the runtime would require the
runtime to enumerate every skill's selectors — fragile.

Each skill stamps its own atoms; the runtime handles the
selection + pill behavior. Clean separation.
