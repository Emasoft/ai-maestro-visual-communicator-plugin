# Per-cell decision-mini pill — S/A/D, always on, defensive bridge

The Skip / Approve / Deny pill that attaches to every selectable
atom in a table — INDEPENDENT of selection state. Persists to
localStorage. Owned by the runtime; the module bridges defensively.

## Table of contents

- [What the pill is](#what-the-pill-is)
- [Why "always on, never gated by selection"](#why-always-on-never-gated-by-selection)
- [The defensive bridge — runtime helper opt-in](#the-defensive-bridge--runtime-helper-opt-in)
- [`attachDecisionMiniSafe()` — the failure-tolerant wrapper](#attachdecisionminisafe--the-failure-tolerant-wrapper)
- [Per-mode attachment points](#per-mode-attachment-points)
- [Atom ID stamping — deterministic across re-init](#atom-id-stamping--deterministic-across-re-init)
- [Persistence model](#persistence-model)
- [Pill state survives a sort, a virtualization scroll, a theme toggle](#pill-state-survives-a-sort-a-virtualization-scroll-a-theme-toggle)
- [Sample HTML](#sample-html)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## What the pill is

A small floating control attached to every selectable atom (row,
matrix cell, or compare cell) with three segments: **Skip /
Approve / Deny**. The reader clicks a segment to record a per-atom
decision; the segment lights up; the state persists.

Use cases:
- **Review workflow.** Approve / deny each row of a Risks & Mitigations
  table; the reader's verdicts are captured per row.
- **Audit triage.** Skip / approve each cell in a coverage matrix;
  "skip" means "I haven't audited this one yet"; "approve" means
  "I've verified it"; "deny" means "I'm flagging it for re-audit".
- **Per-criterion decisions.** Approve / deny each row of a 2-column
  before/after table; the reader's per-aspect verdicts feed into a
  later summary.

The pill is **independent of selection state**. A row that has
never been selected still carries a pill; the pill is part of the
atom contract, not the selection contract.

## Why "always on, never gated by selection"

A selection-gated pill ("only show the pill on selected atoms")
would force the reader to TWO clicks per decision (click to select,
click to S/A/D). The single-click affordance is the point — read,
decide, move on.

The pill is small (8–12px tall), positioned at the atom's edge so
it does NOT compete with the atom's content. It is visually present
but visually subordinate; the reader's eye trains on it after a few
exposures.

From the runtime documentation (NEW USER REQ #10): "the always-on
S/A/D decision pill is attached defensively". Every module that
enhances a selectable surface must call
`attachDecisionMini(atomEl, atomId)` for each atom it stamps; the
runtime's helper owns the visual / persistence / event logic.

## The defensive bridge — runtime helper opt-in

The runtime's helper is `window.amvcpRuntime.attachDecisionMini(
atomEl, atomId)`. The module wraps it defensively:

```js
function attachDecisionMiniSafe(atomEl, atomId) {
  if (!atomEl || !atomId) return;
  if (typeof window === 'undefined') return;
  var rt = window.amvcpRuntime;
  if (!rt || typeof rt.attachDecisionMini !== 'function') {
    return; // sibling helper not loaded — silent no-op
  }
  try {
    rt.attachDecisionMini(atomEl, atomId);
  } catch (_e) {
    // A buggy helper version must never crash the table enhancer.
  }
}
```

The wrapper handles four failure modes:
1. **No element or no id** — guard clause; can't attach.
2. **No `window`** — running under Node (the test harness); skip
   gracefully.
3. **Helper not loaded** — the runtime is still booting, or the
   table-only fixture omits the runtime; silent no-op so the module
   degrades cleanly.
4. **Helper throws** — a buggy helper version (the runtime and the
   module may roll out of sync); swallow the throw so the rest of
   the table enhancement still completes.

The "silent no-op when the helper is absent" is the most important
property: a standalone tables fixture (just `amvcp-tables.js` + a
test HTML, no runtime) still works for sort / matrix / compare. The
pills are missing but the table is functional.

## `attachDecisionMiniSafe()` — the failure-tolerant wrapper

The wrapper is called from every atom-stamping pass:

```js
function stampRowAtoms(table) {
  var rows = collectBodyRows(table);
  for (var i = 0; i < rows.length; i++) {
    var tr = rows[i];
    var atomId;
    if (tr.hasAttribute('data-ve-comment-id')) {
      atomId = tr.getAttribute('data-ve-comment-id');
    } else {
      atomId = 'row:' + tag + ':' + (i + 1);
      tr.setAttribute('data-ve-comment-id', atomId);
    }
    attachDecisionMiniSafe(tr, atomId);  // ← here
  }
}
```

Same pattern in `stampMatrixCellAtoms()` and
`stampCompareCellAtoms()`. Every atom that gets a stable id ALSO
gets the pill attached.

The pill's persistence is keyed on the atom id — so re-init does
NOT lose pill state, because re-init produces the SAME atom id for
the SAME row position.

## Per-mode attachment points

| Mode | Atom | Pill granularity |
|---|---|---|
| `data` | `<tr>` (row) | one pill per row |
| `data` + virtualization | `<tr>` (row, in-window only) | one pill per visible row; off-screen rows have no pill (no DOM) but pill state persists |
| `matrix` | each `<td data-ve-val>` (cell) | one pill per cell |
| `compare` | both `<tr>` AND each body `<td>` | one pill per row AND one pill per cell |

The `compare` mode's DUAL stamping means the reader can S/A/D either
a whole row (criterion) or a specific cell (option's value for that
criterion). Both pills coexist; they target different atoms.

## Atom ID stamping — deterministic across re-init

The atom id pattern:

| Atom | Pattern | Example |
|---|---|---|
| row in data table | `row:<table-tag>:<row-number>` | `row:t-tables-abc123:1` |
| matrix cell | `matrix-cell:<table-tag>:r<r>:c<c>` | `matrix-cell:my-coverage:r3:c2` |
| compare cell | `compare-cell:<table-tag>:r<r>:c<c>` | `compare-cell:options:r5:c2` |

The `<table-tag>` is:
1. `data-ve-id` if author-set (highest priority).
2. The `<table>`'s `id` attribute (next priority).
3. An auto-generated `ve-table-XXXXXX` short id (fallback).

The auto-generated id is stored on `table.__veAtomTag` (a JS
property, not a DOM attribute) — the renderer doesn't add a
`data-ve-id` to the table itself, because the runtime treats
table-level `data-ve-id` as "select the whole table", which is
suppressed by the CSS (only rows are selectable).

The row number is 1-based, deterministic across re-init: row 0 of
the body (visually the first body row) is always atom id `row:
<tag>:1`. A re-init produces the SAME id; localStorage state is
preserved.

The row number does NOT account for sort — sorting rearranges
display order, but the atom id stays with the row node (because the
sort MOVES nodes, not clones, so the `data-ve-comment-id` attribute
rides along). So a row that was position 3 might now be displayed
at position 7 after a sort, but its atom id is still `row:<tag>:3`
— the index that was assigned at first enhancement.

This makes the pill state stable across sorts: the reader's "approve"
on a specific row stays with that row whether the row is at position
3 or position 7.

## Persistence model

The runtime helper writes to localStorage. The key shape (subject
to the runtime's own contract) is approximately:

```
ve-decision:<atomId> = 'skip' | 'approve' | 'deny' | (absent for null state)
```

A re-load of the page reads the localStorage at boot and restores
each pill's segment state. A re-init also re-reads; the helper is
expected to be idempotent (no duplicate event listeners, no
duplicate DOM).

The module does NOT touch localStorage itself — that's entirely the
runtime helper's responsibility. The module's job is to produce
stable atom ids and call the helper.

## Pill state survives a sort, a virtualization scroll, a theme toggle

- **Sort.** `<tr>` is moved (not cloned); `data-ve-comment-id`
  rides along; the runtime helper's `Map` (atomId → pill state)
  matches; pill state is unchanged.
- **Virtualization scroll.** Off-screen rows lose their DOM (pill
  too); on-screen rows get the pill re-attached on next render; the
  localStorage state is the source of truth, so the re-attached
  pill shows the persisted decision.
- **Theme toggle.** The pill is owned by the runtime; the runtime's
  CSS reads `--vc-*` tokens; the pill re-paints automatically.
- **Re-init.** The module's stamping passes are idempotent (skip
  cells/rows that already have an atom id); the helper's `attach`
  call is idempotent (it checks if a pill already exists on the
  atom). No double-pills.

## Sample HTML

For a `compare` table with the dual pill contract:

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Risk</th>
      <th scope="col" data-ve-col-icon="○">Probability</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">Mitigation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">DB migration fails mid-deploy</th>
      <td>Low</td>
      <td>Run on canary; auto-rollback on health-check fail</td>
    </tr>
    <tr>
      <th scope="row">Client cache poisons replicas</th>
      <td>Medium</td>
      <td>Bump cache version on deploy; flush on rollback</td>
    </tr>
  </tbody>
</table>
```

After the module enhances (and assuming the runtime helper is
loaded), every row carries a pill (S/A/D on the row's right edge);
every body cell ALSO carries a pill (S/A/D on the cell's right
edge). The reader can:
- Approve/deny each ROW to vote on "this risk is acceptable / not
  acceptable".
- Approve/deny each CELL to vote on "this specific value is
  correct / wrong" — useful for fact-checking the probability
  rating or the mitigation text.

## DESIGN.md tokens consumed

The pill's visuals are owned by the runtime helper. The module
attaches via the helper bridge; it does not style the pill itself.
The helper reads `--vc-color-success` (for approve), `--vc-color-
danger` (for deny), `--vc-color-content-muted` (for skip), and
`--vc-color-accent` (for the active segment) — same tokens, same
theme behavior as everything else.

## Selection / comment / decision-mini notes

The pill is the decision-mini contract — fully separate from the
selection contract (`data-ve-pressed`) and the comment contract
(the modal-comment thread). All three are PARALLEL channels:

| Channel | What it captures | Where stored |
|---|---|---|
| Selection | "is this atom currently selected" | DOM attribute (`data-ve-pressed`) |
| Comment | a thread of message turns | runtime in-memory `Map`, keyed on `data-ve-comment-id` |
| Decision-mini (pill) | "skip / approve / deny" | localStorage, keyed on atom id |

A single atom can be all three at once: selected (pressed), with an
open comment thread, and with a "approve" pill segment lit. The
visuals don't conflict — they sit at different positions around the
atom.

The module's job here is just to ensure every selectable atom has a
stable id AND a pill bridge call.
