# 33 — Selection atoms (the `markLayoutAtoms()` SHAPES list + decision-mini contract)

## Table of Contents

- [What this is](#what-this-is)
- [Why layout containers are EXCLUDED](#why-layout-containers-are-excluded)
- [The decision-mini pill contract](#the-decision-mini-pill-contract)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [The fake-heading exclusion](#the-fake-heading-exclusion)
- [When to add a new shape](#when-to-add-a-new-shape)
- [Idempotency](#idempotency)
- [Selection / comment / decision-mini contract summary](#selection--comment--decision-mini-contract-summary)
- [Visual verification](#visual-verification)

The layout technique stamps `data-ve-id` and `data-ve-type` on
every layout-shaped element so the universal selection model in
`amvcp-runtime.js` treats it as a commentable atom. The function
`markLayoutAtoms()` in `amvcp-layout.js` walks a SHAPES list and
stamps each match. The decision-mini pill (the 3-segment ✘ ﹅ ✔︎)
attaches to each stamped atom via `_attachDecisionMiniSafe()`.

## What this is

The runtime's selection model says: every "commentable thing" on
the page is an ATOM with `data-ve-id` (unique identifier) and
`data-ve-type` (kind: card, region, hero, …). Hover an atom →
bubble handle appears at the left edge → click the handle →
comment modal opens → comment is keyed by the atom's
`data-ve-id`.

`markLayoutAtoms(root)` is the layout's contribution to this
model. Called automatically by `boot()` (and on demand by
`window.amvcpLayout.markLayoutAtoms()`), it walks every layout-
shape element under `root` (default: `document`) and stamps the
missing attributes.

The SHAPES list (from `amvcp-layout.js` lines 505-512):

```js
var SHAPES = [
  ['.la-card',     'card'],
  ['.la-kpi-row',  'kpi-row'],
  ['.la-device',   'device-mockup'],
  ['.la-region',   'region'],
  ['.la-hero',     'hero'],
  ['.la-cover',    'cover']
];
```

Each pair is `[CSS selector, data-ve-type value]`. The function
walks the SHAPES in order (innermost first — a `.la-card` inside
a `.la-region` is stamped before the surrounding region).

For each match:
- If the element lacks `data-ve-id`, stamp with `el.id ||
  (type + '-' + index)`.
- If it lacks `data-ve-type`, stamp with the type.
- Attach the decision-mini pill via `_attachDecisionMiniSafe()`.

## Why layout containers are EXCLUDED

`.la-grid`, `.la-cardrow`, `.la-ide`, `.la-dashboard`, `.la-article`
are NOT in the SHAPES list. These are LAYOUT CONTAINERS, not
commentable atoms — a reviewer commenting on "the grid" is rarely
meaningful; they comment on its CHILDREN.

A reviewer who genuinely wants to comment on a layout container
can hand-stamp `data-ve-id` on it; `markLayoutAtoms()` does NOT
overwrite an author-supplied `data-ve-id`. The function only adds
attributes that are MISSING.

## The decision-mini pill contract

Each stamped atom gets the 3-segment decision-mini pill (per NEW
USER REQ #10). The pill has three states:
- **Skip** (`﹅`, blue) — "exclude this from the final output"
- **Approve** (`✔︎`, green) — "include this as-is"
- **Deny** (`✘`, red) — "change required before approval"

The pill is attached by `_attachDecisionMiniSafe()`, which:
1. Checks if `window.amvcpRuntime.attachDecisionMini` is available.
   If yes, calls it.
2. If not, queues the attachment in `_layoutPillQueue` for later.
3. On a microtask + DOMContentLoaded, flushes the queue.

This defensive guard handles the case where the layout JS loads
BEFORE the runtime JS (the helper isn't available yet) — the pills
are deferred until the helper appears.

## Scaffold to emit

The author does NOT need to stamp `data-ve-id` on layout primitives
— `markLayoutAtoms()` does it. But for primitives NOT in the
SHAPES list (custom containers), the author hand-stamps:

```html
<!-- Auto-stamped by markLayoutAtoms() — no action needed. -->
<article class="la-card">
  <h3 class="la-card__title">Card title</h3>
  <div class="la-card__body">…</div>
  <footer class="la-card__footer">…</footer>
</article>

<!-- The author chose meaningful IDs (better than auto-generated). -->
<article class="la-card" data-ve-id="card-revenue">…</article>

<!-- A custom container — author hand-stamps to make it commentable. -->
<section class="vc-my-custom-container" data-ve-id="custom" data-ve-type="region">
  …
</section>
```

## Lib functions called

- `markLayoutAtoms(root, opts)` — main entry. Walks SHAPES,
  stamps attributes, attaches pills. `opts.attachPill = false`
  disables pill attachment (rare; only useful for headless
  rendering where the runtime isn't loaded).
- `_attachDecisionMiniSafe(el, id)` — defensive wrapper. Calls
  the runtime helper or queues.
- `_flushLayoutPillQueue()` — flushes deferred pill attachments
  when the runtime becomes available.
- `boot()` — called automatically on DOMContentLoaded; calls
  `markLayoutAtoms()` as part of its sequence (alongside
  `initTOC`, `initStickyHeader`, `initSidebarToggle`).

## DESIGN.md tokens used

- None directly. The pill / bubble handle styling is the
  runtime's job (`amvcp-runtime.js`). The layout primitives use
  `--vc-color-*` tokens for their own backgrounds / borders.

## The fake-heading exclusion

Per R4 in the self-debug rules, the runtime excludes "fake
headings" from selection — `<p>` whose entire visible content is
a single `<strong>` / `<b>` / `<em>` / `<i>` element is treated
as a heading and made inert. This rule is enforced by
`stripFakeHeadingCommentIds()` in the runtime, not by the layout.

The layout's `markLayoutAtoms()` doesn't operate on `<p>`
elements — it only stamps the SHAPES classes. So fake-heading
exclusion doesn't interact with layout stamping.

## When to add a new shape

If a custom layout primitive becomes widely-used (e.g. a
`vc-metric` card class shared across multiple reports), it
deserves a SHAPES entry. The right way:
1. Open `amvcp-layout.js`.
2. Add an entry to the SHAPES list: `['.vc-metric', 'metric']`.
3. The CSS class must match; the type string should be a
   recognisable noun (singular).
4. Update the SKILL.md / refs to document the new selectable
   type.

Don't add one-off custom containers to SHAPES — let the author
hand-stamp those.

## Idempotency

`markLayoutAtoms()` is IDEMPOTENT — running it twice on the same
DOM produces the same result. Re-runs only stamp elements that
LACK the contract attrs (`if (!el.hasAttribute('data-ve-id'))`).
This means the function can be re-run safely after dynamic DOM
mutations (e.g. a chart re-renders, a new card is added) and
only the new elements pick up the contract.

The boot path calls it once on DOMContentLoaded; manual re-runs
via `window.amvcpLayout.markLayoutAtoms()` are safe.

## Selection / comment / decision-mini contract summary

| Layout shape | data-ve-type | Selectable? | Comment thread? | Decision pill? |
|---|---|---|---|---|
| `.la-card` | `card` | Yes | Yes | Yes |
| `.la-kpi-row` | `kpi-row` | Yes | Yes | Yes |
| `.la-device` | `device-mockup` | Yes | Yes | Yes |
| `.la-region` | `region` | Yes | Yes | Yes |
| `.la-hero` | `hero` | Yes | Yes | Yes |
| `.la-cover` | `cover` | Yes | Yes | Yes |
| `.la-grid` | — | No (layout container) | If hand-stamped | If hand-stamped |
| `.la-cardrow` | — | No (layout container) | If hand-stamped | If hand-stamped |
| `.la-ide` | — | No (layout container) | If hand-stamped | If hand-stamped |
| `.la-dashboard` | — | No (layout container) | If hand-stamped | If hand-stamped |
| `.la-article` | — | No (layout container) | If hand-stamped | If hand-stamped |
| `.la-header` | — | No (page chrome) | If hand-stamped | If hand-stamped |
| `.la-toc` | — | No (in-page nav) | If hand-stamped | If hand-stamped |

Headings (`<h1>`-`<h6>`), buttons, inputs, anchors are EXCLUDED
from selection by R4 and never get pills.

## Visual verification

Run the universal self-debug checklist before claiming the layout
atoms are correctly stamped — see
`skills/amvcp-self-debug-rules/SKILL.md`.

For atom-stamping correctness specifically:

- Open dev-browser. After `boot()`, verify every layout-shape
  element has both attributes:
  ```js
  const SHAPES = [
    ['.la-card', 'card'],
    ['.la-kpi-row', 'kpi-row'],
    ['.la-device', 'device-mockup'],
    ['.la-region', 'region'],
    ['.la-hero', 'hero'],
    ['.la-cover', 'cover'],
  ];
  SHAPES.forEach(([sel, type]) => {
    const els = document.querySelectorAll(sel);
    els.forEach(el => {
      console.assert(el.hasAttribute('data-ve-id'), `${sel} missing data-ve-id`);
      console.assert(el.getAttribute('data-ve-type') === type, `${sel} wrong data-ve-type`);
    });
  });
  ```
- Verify decision-mini pills are attached (if the runtime
  loaded):
  ```js
  const pills = document.querySelectorAll('.ve-decision-mini-seg');
  console.log('pills:', pills.length);
  // Should equal the number of stamped atoms (or 0 if the runtime
  // hasn't loaded yet — pills are queued).
  ```
- Hover an atom; the bubble handle should appear at the left
  edge.
- Click the bubble handle; the comment modal should open,
  keyed by the atom's `data-ve-id`.
- **R3 — 3-state visual model**: hover an atom; the background
  should tint + a glow appears. Click to select; outline appears.
- **R4 — atom selection model**: verify that layout containers
  (`.la-grid`, `.la-cardrow`) do NOT have the bubble handle (they
  weren't stamped). Headings / buttons / inputs don't either.
- **R5 — two independent bubble handles**: the layout atom
  handle is gold (`--ve-accent`); text-snippet selection inside
  the atom produces a teal snippet handle. Both work
  independently.
