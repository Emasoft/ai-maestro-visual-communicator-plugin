# Sort cycle — none → asc → desc → none

The 3-state click cycle used by `data-ve-table="data"` columns. Why
three states (and not two), how clicks advance them, and how the
keyboard and screen-reader contracts attach.

## Table of contents

- [Why three states, not two](#why-three-states-not-two)
- [The cycle table](#the-cycle-table)
- [State lives on the `<table>`, not the column](#state-lives-on-the-table-not-the-column)
- [Single-active-column rule](#single-active-column-rule)
- [Restoring authored order — the snapshot](#restoring-authored-order--the-snapshot)
- [Sort arrow glyphs and CSS hooks](#sort-arrow-glyphs-and-css-hooks)
- [Keyboard contract](#keyboard-contract)
- [`aria-sort` contract](#aria-sort-contract)
- [Sample HTML](#sample-html)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## Why three states, not two

Two-state sort (asc ↔ desc) loses an important UI affordance: there
is no way to **restore the authored row order** after sorting. A
report row order often carries meaning the author chose (rows grouped
by region, then by category, then by date) that no single-column sort
can reproduce. A 3-state cycle gives the reader a single button to
"undo this sort" without rebuilding the page.

The reference tables every reader has seen — GitHub issue lists,
Linear, Notion data tables — all expose 3-state sort. It is the
expected interaction; the asymmetric 2-state cycle confuses readers
who hit a column twice and expect "back to where I was".

## The cycle table

| Current state | Click | Next state |
|---|---|---|
| (none — no active sort) | this header | this column → asc |
| this column → asc | this header | this column → desc |
| this column → desc | this header | none (authored order) |
| this column → asc/desc | a **different** header | new column → asc, old → none |

So a column always starts at `asc` (cheap; reads "smallest first"),
ascends to `desc` on a second click, and resets on a third. A click
on a different column starts that column fresh at `asc` and clears
the previous one — see [Single-active-column rule](#single-active-column-rule).

## State lives on the `<table>`, not the column

The current sort is stored as one record on the `<table>` element:

```js
table.__veSort = { th: <thElement>, dir: 'asc' | 'desc' };
```

The cycle advances by reading and re-writing that record. **No
per-column state.** This is deliberate: a column never "remembers"
its last direction across deactivations — every reactivation starts
at `asc`. The simpler model fits the simpler mental model.

## Single-active-column rule

Multi-column sort (sort by Revenue, then by Region) is **NOT
supported**. The cycle enforces one active column at a time. When the
reader clicks a different column:

1. Every header gets `aria-sort` reset to `"none"`.
2. Every sort arrow gets glyph reset to `↕`.
3. The previously-tinted column gets its `.ve-col-sorted` class
   stripped.
4. The new column is set to `asc`.

The choice traded richness for predictability — most readers do not
discover multi-sort, and the few who want it are better served by a
custom column that pre-merges the values ("RegionRevenue") and
sorting on that. A future "shift-click to chain" affordance is not
ruled out, but is not in the cycle today.

## Restoring authored order — the snapshot

On the **first** sort of a table, the module snapshots the body rows
in authored order:

```js
if (!table.__veOriginalOrder) {
  table.__veOriginalOrder = collectBodyRows(table).slice();
}
```

The `none` state in the cycle then re-appends the rows in that
snapshot order — exactly the original layout, with all
`data-ve-id`/`data-ve-comment-id`/`data-ve-pressed` attributes intact
(re-appending an attached node moves it, never clones it — see
[row-move-not-clone.md](./row-move-not-clone.md)).

A re-init (a second `init()` call) does NOT re-snapshot — the
original-order array, once captured, is the canonical "authored"
state. Dynamically-inserted rows after the first sort would not be
remembered; that escalation is documented but not implemented (a
report table is overwhelmingly static after render).

## Sort arrow glyphs and CSS hooks

The module injects one `<span class="ve-sort-arrow">` per sortable
header and sets the textContent directly:

| `aria-sort` | glyph | CSS class behaviour |
|---|---|---|
| `none` | `↕` (U+2195 UP DOWN ARROW) | dim, opacity 0, visible on hover/focus only |
| `ascending` | `▲` (U+25B2) | solid accent, opacity 1, always visible |
| `descending` | `▼` (U+25BC) | solid accent, opacity 1, always visible |

The CSS picks the visual state off `aria-sort` so a copy/paste of the
table keeps a sensible mark even without the stylesheet:

```css
table[data-ve-table="data"] thead th[data-ve-sortable] .ve-sort-arrow {
  opacity: 0;
  color: color-mix(in srgb,
    var(--vc-color-content-muted, #5b5343) 60%, transparent);
}
table[data-ve-table="data"] thead th[data-ve-sortable]:hover .ve-sort-arrow,
table[data-ve-table="data"] thead th[data-ve-sortable]:focus-visible .ve-sort-arrow {
  opacity: 1;
}
table[data-ve-table="data"] thead th[aria-sort="ascending"] .ve-sort-arrow,
table[data-ve-table="data"] thead th[aria-sort="descending"] .ve-sort-arrow {
  opacity: 1;
  color: var(--vc-color-accent, #b8861f);
}
```

The idle `↕` advertises sortability without screaming — it only
appears on hover or keyboard focus. The active `▲`/`▼` is always
visible because it is the only signal that "this column is currently
the sort key".

## Keyboard contract

Every sortable header gets `tabindex="0"` so Tab reaches it. Two keys
fire the cycle:

| Key | Behaviour |
|---|---|
| `Enter` | advance the cycle on the focused header |
| `Space` | advance the cycle on the focused header (page-scroll suppressed via `preventDefault`) |

`Space` would otherwise scroll the page (its default action on a
focused element); the `preventDefault` is the only way to make Space
mean "sort" rather than "scroll-down-one-screen". The reference is
the WCAG sortable-table pattern.

`KeyboardEvent.key` is checked, not `event.code` — and **with
Shift held**, `Space` produces `' '` (unchanged) and `Enter` produces
`Enter` (unchanged), so a shift-tab-then-enter works. Letter keys
would case-shift under Shift; sort headers do not bind to letters.

## `aria-sort` contract

| value | semantics (per ARIA 1.2) |
|---|---|
| `none` | the column is sortable but is NOT currently the sort key |
| `ascending` | the column is the active sort, ascending |
| `descending` | the column is the active sort, descending |
| (absent) | the column is NOT sortable — paired with absent `data-ve-sortable` |

The screen-reader announcement after a click — "Revenue, column
header, ascending sort" — is automatic; the module only sets the
attribute. The "after" announcement is the contract.

## Sample HTML

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Revenue</th>
      <th scope="col">Growth %</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>EMEA</td><td>1,240,000</td><td>12.4</td></tr>
    <tr><td>APAC</td><td>980,500</td><td>8.1</td></tr>
  </tbody>
</table>
```

The author writes plain semantic HTML — **no arrows, no `tabindex`,
no `aria-sort`, no classes**. The module injects all of those. Hand-
authored arrows would be duplicated by the module; hand-authored
`aria-sort` would be overwritten on every cycle. Let the module own
the chrome.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-accent` | active sort arrow color; sorted-column tint; focus outline |
| `--vc-color-content-muted` | idle sort arrow color (60% mix) |
| `--vc-space-1` | margin-left between header text and arrow |
| `--vc-duration-fast` | arrow opacity/color transition |
| `--vc-easing-standard` | arrow opacity/color easing curve |

A DESIGN.md theme toggle re-paints the active arrow and the sorted-
column tint with no second stylesheet — the same rules just resolve
to the now-active accent token.

## Selection / comment / decision-mini notes

The cycle does NOT change which rows are selected. Sort moves the
`<tr>` nodes; the `data-ve-pressed="1"` attribute, the
`data-ve-comment-id`, and any attached listeners ride along with the
node. Selection is positional in the sort payload (the row recorded
is the row, not the index); a `none` reset restores the rows to
authored positions but keeps every selection state. The
decision-mini pill is attached to the row, not the position — it too
rides along untouched.
