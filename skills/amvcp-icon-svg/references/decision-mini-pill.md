# Per-atom decision mini-pill (Skip / Approve / Deny)

## Table of Contents

- [What it renders](#what-it-renders)
- [Where the wiring lives](#where-the-wiring-lives)
- [The atoms that get pills](#the-atoms-that-get-pills)
- [Defensive integration](#defensive-integration)
- [Public re-attachment surface](#public-re-attachment-surface)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Why "independent of selection state"?](#why-independent-of-selection-state)
- [When pills are NOT attached](#when-pills-are-not-attached)
- [Visual verification](#visual-verification)

Phase 2.5 User Requirement #10: every selection atom on the page gets
a 3-radio Skip / Approve / Deny mini-pill from the runtime,
INDEPENDENT of selection state. The mini-pill is rendered by
`window.amvcpRuntime.attachDecisionMini(el, id)` — the icon-svg
module calls this for every atom it emits.

## What it renders

A small floating pill anchored to each atom (placement: top-right
corner by default; the runtime decides the exact placement). The
pill has 3 radio buttons:

- Skip (default — no decision yet)
- Approve (positive — `--vc-color-success`)
- Deny (negative — `--vc-color-danger`)

The selected state is persisted to localStorage (keyed by
`data-ve-id`) so refreshing the page keeps the decision.

## Where the wiring lives

The icon-svg module exposes:

```js
function attachDecisionMinisToAtoms(root) {
  var d = root || document;
  if (!d.querySelectorAll) return;
  if (typeof window === 'undefined') return;
  var rt = window.amvcpRuntime;
  if (!rt || typeof rt.attachDecisionMini !== 'function') return;
  var atoms = d.querySelectorAll(
    'svg.isvg-scene[data-ve-id], '
    + 'svg.isvg-scene g[data-ve-id], '
    + '.isvg-hotspot[data-ve-id]'
  );
  for (var i = 0; i < atoms.length; i++) {
    var el = atoms[i];
    var id = el.getAttribute('data-ve-id');
    try { rt.attachDecisionMini(el, id); } catch (e) { /* defensive */ }
  }
}
```

Called from `compileFencedBlocks()` AND from `refresh()`. Idempotent:
the runtime's `attachDecisionMini` short-circuits when a pill is
already attached.

## The atoms that get pills

| Selector | What |
|---|---|
| `svg.isvg-scene[data-ve-id]` | The scene SVG itself (one pill per scene) |
| `svg.isvg-scene g[data-ve-id]` | Every per-primitive `<g>` (one pill per primitive) |
| `.isvg-hotspot[data-ve-id]` | Every hotspot marker |

So a scene with 5 nodes + 2 hotspots gets 8 pills total: 1 for the
scene + 5 for the nodes + 2 for the hotspots.

## Defensive integration

The icon-svg module does NOT REQUIRE the runtime to be present —
it's a DEFENSIVE call:

- If `window.amvcpRuntime` is undefined → no-op.
- If `attachDecisionMini` is missing → no-op.
- If a single attachment throws → caught + ignored (the loop
  continues).

This means an icon-svg page WITHOUT the runtime loaded renders
visually intact, just without the pills. The runtime is what adds
the per-atom decision mechanic; icon-svg provides the atoms it
attaches to.

## Public re-attachment surface

```js
// Re-attach pills after dynamically inserting new atoms
window.amvcpIconSvg.attachDecisionMinisToAtoms(root);

// Or via the test hook
window.__veIconSvg.attachDecisionMinisToAtoms(root);
```

Use cases:

- The host injects a new hotspot via AJAX → re-attach.
- The host clones a figure → re-attach on the clone.
- The host calls `refresh()` after editing the DOM → re-attach
  happens automatically.

## DESIGN.md tokens consumed

The pill itself is styled by the runtime, not by icon-svg. The
runtime uses:

- `--vc-color-success` — Approve radio color
- `--vc-color-danger` — Deny radio color
- `--vc-color-content-muted` — Skip radio color
- `--vc-color-surface` — pill background
- `--vc-color-border` — pill border

A theme swap re-tints the pills automatically (the runtime's CSS is
`--vc-*` token-based).

## Why "independent of selection state"?

A user can DECIDE on an atom without SELECTING it. Selection is a
session-scoped focus state; decision is a persistent verdict.
Separating them means:

- Approving 5 atoms doesn't require clicking each one first.
- A selected atom that's been Approved keeps its Approve state.
- Refreshing the page restores decisions (selection is cleared).

## When pills are NOT attached

- The atom is NOT in the icon-svg query (`svg.isvg-scene`, etc.) —
  only icon-svg atoms get pills via this helper. Other skills'
  atoms (diagram nodes, chart bars) get pills via THEIR skill's
  attach call.
- The runtime is not loaded — no `attachDecisionMini` available.
- The runtime is loaded but `attachDecisionMini` was disabled (e.g.
  a test fixture sets `window.__amvcpDisableDecisionMini = true`).

## Visual verification

In both light AND dark:

- Every icon-svg atom has a visible pill near it.
- The pill has 3 readable radio buttons (Skip / Approve / Deny).
- Clicking Approve persists the choice (refresh the page; the
  Approve state survives).
- The pill's colors match the theme's success / danger / muted
  tokens.

See `reports/designmd-engine/20260516_011126+0200-p25-compose-all.md`
for the Phase 2.5 compose-test that asserts pills appear on every
atom across all 13 skills.
