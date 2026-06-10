---
trdd-id: 7114fb4e-f53a-4230-954c-ff2bc11db106
title: Touch parity for drag-reorder widgets via a shared pointer-events sortable (G3)
column: backburner
created: 2026-06-10T12:16:44+0200
updated: 2026-06-10T12:16:44+0200
current-owner: amvcp-dev
assignee: amvcp-dev
priority: 3
severity: HIGH
effort: L
labels: [audit-gaps, touch, accessibility, form-inputs, interactive, G3, architecture-decision]
task-type: feature
parent-trdd: TRDD-503fb3af
npt: []
eht: []
blocked-by: []
relevant-rules: []
release-via: publish
delivery: direct-push
target-branch: main
feature-branch: feat/audit-gap-fixes
merge-strategy: squash
must-pass-tests-before-merge: true
test-requirements: [dev-browser-headless]
review-requirements: [human-review]
runtime-targets: [macos, linux, windows]
impacts: [public-api]
attempts: 0
test-failures: 0
last-test-result: not-run
external-refs: []
---

# TRDD-7114fb4e — touch parity for drag-reorder widgets (G3)

**Filename:** `design/tasks/TRDD-20260610_121644+0200-7114fb4e-touch-parity-pointer-sortable.md`
**Tracked in:** this repo (`design/tasks/` is git-tracked)

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative) — 2026-06-10

**Status:** PLANNED. Facts verified; an ARCHITECTURE DECISION is required
before implementation (see "Decision needed"). Recommended path is **Opt 3**
(below) — it delivers touch parity for 2 of the 3 widgets with NO architecture
violation and NO new module, and isolates the genuinely-hard kanban case.

**NEXT ACTION:** get the user's call on the architecture fork, then implement
Opt 3 phase 1 (rank-list + tier-list pointer-sortable inside amvcp-form-inputs.js).

## The gap (verified against current code)

All three drag-reorder widgets use **HTML5 drag-and-drop** (`draggable=true` +
`dragstart`/`dragover`/`drop`), which **does not fire on touch devices** — so
reordering is impossible on phones/tablets:

| Widget | File:lines | Data model (verified) | Drop semantics |
|---|---|---|---|
| `ve-rank-list` | amvcp-form-inputs.js:1786-1877 | DOM order is truth; `readOrder()` from DOM | positional insert before/after target by pointer-Y midpoint |
| `ve-tier-list` | amvcp-form-inputs.js:1693-1778 | DOM distribution is truth; `flush()` from DOM | move item → append to target bucket |
| kanban card | amvcp-interactive.js:927-1018 | **model** is truth; sets `card.col`, full `render()` | move card → target column, re-render |

The 3 differ enough that any shared helper MUST be **callback-based** (the widget
supplies hit-testing + the commit step); a one-size body cannot serve all three.

Kanban is the hard one: cards are **selection-contract atoms** (`stampAtom`,
decision mini-pills, contentEditable notes), the DOM is **rebuilt on every drop**
by `render()`, and `saveNotes()` must run before re-render. A pointer drag there
must survive the re-render (the dragged DOM node is destroyed).

## The architecture fork (why this isn't a clean autonomous build)

`amvcp-form-inputs.js` is, by explicit design, **"a dependency-free module"**
(its own header). There is **no shared util module** in `scripts/`, and the two
files are independent IIFEs (`window.amvcpFormInputs`, `window.amvcpInteractive`).
The composability principle (CLAUDE.md §5) relies on each element being a
self-contained primitive that "just works" when dropped into an arbitrary page.

The audit's option A ("one **shared** pointer-events helper used by all three")
collides with that:

- **Opt 1 — new shared module** (`amvcp-sortable.js`): true reuse / one version,
  BUT relaxes the deliberate dependency-free design and needs load-wiring in
  ~10 skill consumers + every fixture + every composed page. A composed page
  that loads the widget but forgets the shared module silently breaks — directly
  against the composability principle. High blast radius.
- **Opt 2 — duplicate the helper** in both files: keeps dependency-free, BUT two
  copies of the same ~150-LOC helper = **violates the mandate's "only one
  version of the code must exist"** rule. Rejected.
- **Opt 3 — within-file reuse + defer kanban (RECOMMENDED):** put ONE internal,
  extraction-ready pointer-sortable helper inside `amvcp-form-inputs.js`, used by
  BOTH rank-list and tier-list (they already share the file → zero duplication,
  zero new module, zero dependency-free violation). Deliver touch parity for 2 of
  3 widgets now. DEFER kanban: it lives in a different module AND carries the
  model/selection-atom/re-render complexity. If/when kanban reuses the helper, the
  Opt-1-vs-Opt-2 question is decided THEN, with a proven helper to extract.
- **Opt 4 — additive touch-shim, keep HTML5 DnD:** lowest desktop-regression risk
  (desktop path untouched) but the new touch code still faces the same
  shared-vs-duplicate fork, and it leaves two drag mechanisms (mouse=DnD,
  touch=pointer) — arguably two paths. Not preferred under "one version."

## Decision needed (user)

For full all-three coverage: **introduce a shared `amvcp-sortable.js` module
(Opt 1, relaxes dependency-free + heavy wiring) or keep modules independent?**
Recommendation: **start with Opt 3** (rank-list + tier-list, no fork), and make
the kanban-sharing call separately once the helper is proven.

## Design (Opt 3 — the recommended first slice)

A single internal helper in `amvcp-form-inputs.js`, written pure + callback-based
so it is trivially extractable to a module later:

```
makePointerSortable({
  items,                 // draggable elements
  containers,            // drop containers (1 for rank-list, N for tier-list)
  hitTest(x, y) -> {container, beforeNode|null},  // widget supplies geometry
  onCommit(item, container, beforeNode),          // widget supplies the move + persist
  draggingClass, dropTargetClass                  // reuse existing CSS classes
})
```

- **Pointer Events only** (replace HTML5 DnD → ONE path for mouse+touch+pen, per
  "one version"). `setPointerCapture` on pointerdown; a small move threshold
  (~6px) so a tap/click is NOT a drag; `touch-action:none` on draggable items so
  touch-drag doesn't scroll the page; `pointercancel` aborts cleanly.
- **Preserve the existing CSS classes** (`ve-rank-dragging`/`-drop-target`,
  `ve-tier-dragging`/`-drop-target`) so the themed visual feedback is unchanged —
  the FIXED interaction mode (selection/hover/selected + comment round-trip) is
  untouched; only the drag plumbing changes.
- rank-list `hitTest` returns `{container: ol, beforeNode}` from Y-midpoint of the
  li under the pointer (same rule as today's `drop`). `onCommit` = insertBefore +
  `readOrder()` + saveValue + emitChange.
- tier-list `hitTest` returns `{container: bucketUnderPointer, beforeNode: null}`.
  `onCommit` = append to bucket + `flush()`.

## Test strategy (TDD)

`tests/scripts/test-touch-sortable.js` + fixture, driven by **synthetic
PointerEvents** (the dev-browser harness can dispatch `pointerdown`/`pointermove`/
`pointerup` with `pointerType:'touch'` AND `'mouse'`):

- rank-list: touch-drag item 3 above item 1 → order updates in DOM **and** the
  emitted `ve-form-change` payload (verify in ≥2 places per the 3-places rule).
- tier-list: touch-drag an item into the B bucket → assignment updates + change
  event fires.
- Regression: the SAME gestures with `pointerType:'mouse'` still reorder (desktop
  parity preserved after dropping HTML5 DnD).
- a11y bonus (optional): keyboard reorder (↑/↓ when focused) — only if cheap.

## Risks / recheck

- **Desktop regression:** replacing native HTML5 DnD removes the browser's native
  drag ghost; the pointer path must reproduce acceptable desktop feel. Mitigated
  by the mouse-pointerType regression tests above.
- **`touch-action:none`** must be scoped to the draggable items only, or it kills
  page scroll. Verify on a fixture taller than the viewport.
- **Do not touch** `amvcp-runtime.js` / `amvcp-tokens.js`. Opt 3 needs neither.
- **EHT (docs):** update `amvcp-form-inputs/SKILL.md` (+ any rank/tier reference)
  to state touch is supported; remove any "desktop-only" caveat.

## Delivery

Same branch `feat/audit-gap-fixes` (off `main`); pre-push hook keeps it local.
No push, no PR — awaits user merge + publish.py.
