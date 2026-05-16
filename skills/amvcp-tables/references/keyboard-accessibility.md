# Keyboard accessibility — Tab, Enter, Space, focus visible

How `data-ve-table="data"` tables become fully keyboard-operable
without a single mouse event. WCAG SC 2.1.1 (Keyboard) compliance,
the standard ARIA sortable-table pattern, and the focus-visible
contract.

## Table of contents

- [The keyboard-operable contract](#the-keyboard-operable-contract)
- [`tabindex="0"` on sortable headers](#tabindex0-on-sortable-headers)
- [Enter and Space both fire the sort](#enter-and-space-both-fire-the-sort)
- [Why `preventDefault` on Space](#why-preventdefault-on-space)
- [`aria-sort` — the announcement contract](#aria-sort--the-announcement-contract)
- [`scope` attributes on headers](#scope-attributes-on-headers)
- [`focus-visible` outline — the focus ring](#focus-visible-outline--the-focus-ring)
- [`tabindex` is NOT added to body cells](#tabindex-is-not-added-to-body-cells)
- [Case-insensitive key comparison](#case-insensitive-key-comparison)
- [Sample HTML](#sample-html)
- [Testing matrix](#testing-matrix)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## The keyboard-operable contract

Every interaction that's possible with a mouse MUST also be possible
with a keyboard. For `amvcp-tables.js` data tables, that means:

| Interaction | Mouse | Keyboard |
|---|---|---|
| Sort by a column | click the header | Tab to the header, then Enter or Space |
| Open the row's comment thread | click the comment handle | Tab to the row, hit the runtime's selection key |
| Copy the table as CSV | click the "Copy CSV" button | Tab to the button, hit Enter or Space |

The module owns the header-sort contract; the runtime owns the
selection / comment / decision-mini contracts. Both must compose
without one breaking the other — the module's `tabindex` additions
on headers do not interfere with the runtime's row-atom focus.

## `tabindex="0"` on sortable headers

```js
function wireSortHeader(table, th, headerColIndex) {
  if (th.getAttribute('data-ve-sortable') !== null) return;
  th.setAttribute('data-ve-sortable', '1');
  th.setAttribute('aria-sort', 'none');
  if (th.getAttribute('tabindex') === null) {
    th.setAttribute('tabindex', '0');
  }
  ...
}
```

Every sortable `<th>` gets `tabindex="0"`:
- `0` (not `-1`) means: "reachable via Tab, in the natural document
  order".
- `tabindex="-1"` would make the element focusable only via
  `el.focus()` — wrong for a keyboard user navigating with Tab.
- The conditional check (`getAttribute('tabindex') === null`) means
  an author who pre-set `tabindex` (e.g. `tabindex="5"` to put
  headers in a custom tab cycle) is respected.

`<th data-ve-nosort>` headers do NOT get `tabindex` added — they
are inert and shouldn't appear in the tab cycle as if they were
operable.

## Enter and Space both fire the sort

```js
th.addEventListener('click', handler);
th.addEventListener('keydown', function (ev) {
  if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    handler();
  }
});
```

`Enter` is the standard "activate the focused control" key. `Space`
is the standard "activate the focused button" key. Both bind to the
sort cycle so the keyboard user has the same affordance as a mouse
user (clicking either fires the cycle).

`ev.key` is the produced character — so on the keyboard layout where
Space sends ` ` (almost all of them) and Enter sends `Enter`, the
handler fires. On a layout where the Space key sends a different
character, the handler doesn't fire — at which point the user
probably can't type either, so the table sort being unsupported is
the least of their problems.

## Why `preventDefault` on Space

Space's default action on a focused element is **scroll the page
down one screen**. Without `preventDefault`, hitting Space on a
focused header would:
1. Fire the sort handler (correct).
2. ALSO scroll the page down (wrong — the table jumps away).

`ev.preventDefault()` blocks the scroll-down so Space cleanly means
"sort". The `Enter` key does NOT scroll by default, so no
`preventDefault` is needed there.

This pattern is the WCAG sortable-table reference — every
WAI-ARIA-conformant sortable table does this. It's not a quirk of
this module.

## `aria-sort` — the announcement contract

```js
th.setAttribute('aria-sort', 'none');             // initial
th.setAttribute('aria-sort', 'ascending');        // after asc sort
th.setAttribute('aria-sort', 'descending');       // after desc sort
th.setAttribute('aria-sort', 'none');             // after cycle complete
```

`aria-sort` is the standard ARIA 1.2 attribute. Screen readers
announce "ascending sort" / "descending sort" / "no sort" when the
attribute changes. The user hears the result of their click/keypress.

Important: `aria-sort` is set on the `<th>`. ALL `<th>` elements in
the sortable header row carry it — `none` for the inactive columns,
`ascending` / `descending` for the active one. This way the screen
reader can tell the user "which column is the active sort" by tabbing
through all of them.

## `scope` attributes on headers

```html
<th scope="col">Region</th>     <!-- column header -->
<th scope="row">EMEA</th>       <!-- row header (matrix/compare) -->
<th scope="rowgroup">2025</th>  <!-- multi-row header (rare) -->
<th scope="colgroup">Revenue</th> <!-- multi-column header (grouped) -->
```

The `scope` attribute tells assistive tech which cells the header
applies to:
- `scope="col"` — applies to every body cell in the column.
- `scope="row"` — applies to every body cell in the row.
- `scope="rowgroup"` / `scope="colgroup"` — applies to a group of
  rows / columns (use with `rowspan` / `colspan`).

When the screen reader announces a body cell, it concatenates the
column scope and the row scope: "EMEA. Region. 1,240,000." The
contextual readout depends entirely on the `scope` attributes being
authored correctly.

The module does NOT add `scope` attributes — that's the author's
responsibility (no module can guess which `<th>` is for a column vs
a row vs a group). The skill's HTML samples always include explicit
`scope` attributes.

## `focus-visible` outline — the focus ring

```css
table[data-ve-table="data"] thead th[data-ve-sortable]:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: -2px;
}
```

When a sortable header has keyboard focus, a 2px accent outline
appears INSIDE the header cell (negative `outline-offset` pulls the
outline inward by 2px so it sits flush with the cell border instead
of overlapping the adjacent cell).

`:focus-visible` (not `:focus`) means the outline appears only when
the focus arrived via keyboard navigation, NOT when the focus
arrived via a mouse click. Mouse clicks already give visual feedback
(the cursor was there); the focus ring would be redundant. Keyboard
focus has no other visual cue; the ring is the only signal.

The accent color matches the active sort arrow color — visual
consistency, "this color = the current focus / sort target".

## `tabindex` is NOT added to body cells

The runtime owns the body-cell selection contract — selection,
hover, decision-mini, comment handle. The runtime's atom-paint
events automatically add `tabindex` to selectable atoms via its own
`enhanceFocus` pass. The module does NOT pre-stamp body cells with
`tabindex` because:

1. The runtime is the source of truth for "which cells are
   selectable".
2. Two competing tabindex managers would fight (the order of
   listeners would matter).
3. The selection-payload model is positional, so a per-cell tabindex
   needs to be derived from the runtime's selection state.

The module's `tabindex` addition is limited to sortable header cells
— that's its territory. Body cells are runtime territory.

## Case-insensitive key comparison

`event.key === ' '` matches Space. `event.key === 'Enter'` matches
Enter. These are produced characters — not key codes, not physical
keys.

A letter key under Shift produces a different `event.key`: holding
Shift while pressing `z` gives `event.key === 'Z'`. The module's
sort cycle does NOT bind to letter keys, so this case doesn't apply
— but the rule generalises: when checking against a letter key,
compare case-insensitively (`key === 'z' || key === 'Z'`) or use
`event.code` (`KeyZ` regardless of modifiers).

This is one of those bugs that's silent for the keyboard user who
doesn't use shift-modified shortcuts and loud for the one who does.
The module avoids the issue by binding only to Space/Enter, which
are the same with or without Shift.

## Sample HTML

```html
<table data-ve-table="data" data-ve-table-csv="1">
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Revenue</th>
      <th scope="col">Growth %</th>
      <th scope="col" data-ve-nosort>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>EMEA</td><td>1,240,000</td><td>12.4</td><td>strong</td></tr>
    <tr><td>APAC</td><td>980,500</td><td>8.1</td><td>steady</td></tr>
    <tr><td>Americas</td><td>$2,100,750</td><td>9.7</td><td>OEM up</td></tr>
  </tbody>
</table>
```

Keyboard walkthrough:
1. Tab into the table — focus lands on Region header (first sortable).
2. Enter or Space → asc sort by Region; "ascending sort" announced.
3. Tab → Revenue header (skipping the Notes column header would
   require an additional Shift+Tab; in default order, Revenue is
   next).
4. Enter → asc sort by Revenue; the column is right-aligned and
   numeric.
5. Tab continues to Growth %; Tab again skips Notes (no tabindex on
   `data-ve-nosort` headers); Tab lands on the Copy CSV button.
6. Enter on the button → CSV copies to clipboard; button label
   changes to "Copied" for ~1.4s.

The keyboard user accomplishes everything the mouse user can.

## Testing matrix

Verify with these manual scenarios:

| Scenario | Expected |
|---|---|
| Tab into table | first sortable header gets focus + outline |
| Tab past `data-ve-nosort` header | header is skipped, no outline appears |
| Space on focused header | sort fires; page does NOT scroll |
| Enter on focused header | sort fires; ARIA announcement |
| Shift+Tab from a body cell | focus returns to the headers in reverse order |
| Cycle Enter ×3 | none → asc → desc → none; ARIA announces each |
| Click after keyboard focus | sort fires; outline disappears (mouse-set focus is not `:focus-visible`) |
| Screen reader on each header click | announces "Revenue, column header, sortable, ascending sort" |

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-accent` | focus outline color; matches the active sort arrow |

The outline-offset `-2px` is fixed (not a token) — it's the geometric
inset that keeps the outline flush with the cell border. Token-izing
it would not improve theming.

## Selection / comment / decision-mini notes

The module's keyboard contract operates on HEADER cells. The runtime's
keyboard contract operates on BODY cells (selection / decision-mini /
comments). They compose without conflict because they own disjoint
DOM scopes — the module never adds `tabindex` to body cells; the
runtime never adds `tabindex` to header cells.

The keyboard sort, like the mouse sort, MOVES `<tr>` nodes — selection
state, comment threads, and the decision-mini pill all ride along. See
[row-move-not-clone.md](./row-move-not-clone.md).
