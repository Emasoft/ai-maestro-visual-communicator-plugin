# Frozen columns — position:sticky, no scroll container

How `data-ve-freeze-cols="N"` keeps the first N columns visible while
the rest of the table scrolls horizontally — without introducing an
inner scroll container. Sticky positioning is the mechanic; cumulative
`left` offsets are the math; the freeze edge is the visual.

## Table of contents

- [Why frozen columns matter](#why-frozen-columns-matter)
- [`position: sticky` needs no container](#position-sticky-needs-no-container)
- [The grid-aware column lookup](#the-grid-aware-column-lookup)
- [Cumulative `left` offsets — one read pass, one write pass](#cumulative-left-offsets--one-read-pass-one-write-pass)
- [Opaque background — the bleed-through trap](#opaque-background--the-bleed-through-trap)
- [`z-index` layering — header beats body, frozen beats non-frozen](#z-index-layering--header-beats-body-frozen-beats-non-frozen)
- [The freeze-edge divider](#the-freeze-edge-divider)
- [`<thead>` sticky-top stacking](#thead-sticky-top-stacking)
- [Author contract — what you write](#author-contract--what-you-write)
- [Sample HTML](#sample-html)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## Why frozen columns matter

A wide table — one with 12+ columns or one column that's text-heavy
— extends past the viewport horizontally. The page scrolls
horizontally (the document's single horizontal scrollbar). Without
freezing, the **row identifier** (typically the first column: ID,
name, region) scrolls out of view, and the reader cannot tell what
row they are looking at when they are 6 columns to the right.

Freezing the first column (or the first few) pins them in place so
the row identifier is always on screen. Same idea as Excel's "Freeze
First Column" and Google Sheets's "Freeze Up To Column A".

## `position: sticky` needs no container

A common misconception: `position: sticky` requires an
`overflow:hidden` (or `auto`) ancestor. **It does NOT.** Sticky
positioning sticks relative to its **nearest scrollable ancestor**
— the `<html>` element (the document viewport) qualifies as
scrollable. So `position: sticky` works in normal document flow
without an inner scrollbox.

This is the key insight that makes frozen columns compatible with
the no-nested-scrollbars rule:

```css
table[data-ve-table-virtual] .ve-col-frozen {
  position: -webkit-sticky;   /* iOS Safari legacy prefix */
  position: sticky;
  z-index: 1;
  background: var(--vc-color-surface, #ffffff);
}
```

No `overflow:auto` wrapper. The frozen cell sticks within the
document's horizontal scroll.

## The grid-aware column lookup

`applyFrozenColumns(table, freezeCols)` uses the cell-grid (see
[spanning-cell-grid.md](./spanning-cell-grid.md)) to find every
origin cell in the first N columns:

```js
function applyFrozenColumns(table, freezeCols) {
  var gridInfo = buildCellGrid(table);
  for (var col = 0; col < freezeCols && col < gridInfo.colCount; col++) {
    var cells = columnOriginCells(gridInfo, col);
    for (var i = 0; i < cells.length; i++) {
      addClass(cells[i], 've-col-frozen');
      if (col === freezeCols - 1) {
        addClass(cells[i], 've-col-frozen-edge');
      }
    }
  }
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(function () {
      positionFrozenColumns(table, freezeCols);
    });
  }
}
```

A header `colspan="2"` that covers columns 0 and 1 with
`freezeCols=1` would naively be missed (`cells[0]` would not return
the spanned header). The grid map sees it correctly: column 0's
origin cells include the spanned header, so freezing column 0
includes the header. This is the same correctness property that
makes column tinting / right-align work — it is grid-aware
everywhere.

## Cumulative `left` offsets — one read pass, one write pass

A frozen column needs a `left` value equal to the cumulative width
of the columns to its left:

| Column | `left` |
|---|---|
| 0 (first frozen) | `0px` |
| 1 (second frozen, if any) | `widthOf(col 0)` |
| 2 (third frozen, if any) | `widthOf(col 0) + widthOf(col 1)` |

Computed after layout in a single `requestAnimationFrame`:

```js
function positionFrozenColumns(table, freezeCols) {
  var gridInfo = buildCellGrid(table);
  var widths = [];
  // READ pass — measure
  for (var col = 0; col < freezeCols && col < gridInfo.colCount; col++) {
    var cells = columnOriginCells(gridInfo, col);
    var w = cells.length ? cells[0].getBoundingClientRect().width : 0;
    widths.push(w);
  }
  // WRITE pass — apply
  var left = 0;
  for (var col = 0; col < widths.length; col++) {
    var colCells = columnOriginCells(gridInfo, col);
    for (var i = 0; i < colCells.length; i++) {
      colCells[i].style.left = left + 'px';
    }
    left += widths[col];
  }
}
```

The read/write separation avoids layout thrash — see
[virtualization-window-scroll.md](./virtualization-window-scroll.md)
for why this matters. Widths are measured once; if columns later
resize (font load, content change), a re-init re-measures. A real-
time width tracker is not implemented (over-engineered for static
report tables).

## Opaque background — the bleed-through trap

A sticky cell is in the layout flow but visually "above" the cells
behind it. If the sticky cell is transparent, the scrolled body
cells **bleed through** — the reader sees overlapping text.

The fix:

```css
table[data-ve-table-virtual] .ve-col-frozen {
  background: var(--vc-color-surface, #ffffff);
}
```

`--vc-color-surface` is the table's own background color (light or
dark, depending on theme). It is always opaque. A transparent token
would defeat the whole pattern.

The bleed-through is the single most common bug in a "I built my own
sticky column" attempt. The token is correct in both themes; the
fallback is a safe opaque white for the engine-absent case.

## `z-index` layering — header beats body, frozen beats non-frozen

Three sticky surfaces overlap in a virtualized table:

1. `<thead>` sticky-top (header pins to viewport top)
2. `.ve-col-frozen` sticky-left (frozen cells pin to viewport left)
3. The intersection — a `<thead> th.ve-col-frozen` is BOTH sticky-top
   AND sticky-left

Each needs a `z-index` that puts it above the cells it should cover:

```css
table[data-ve-table-virtual] thead th     { z-index: 2; }
table[data-ve-table-virtual] .ve-col-frozen { z-index: 1; }
/* the corner cell — both — gets the highest layer */
table[data-ve-table-virtual] thead th.ve-col-frozen { z-index: 3; }
```

| Layer | Stack | Why |
|---|---|---|
| 0 | scrolled body cells | the normal flow |
| 1 | frozen column body cells | over scrolled body |
| 2 | sticky header cells | over scrolled body |
| 3 | frozen column header cell | over EVERYTHING — at the table's top-left corner |

Without the corner-cell bump to z-index:3, the header's z-index:2
would be the same as the frozen column's z-index:1 wrong order would
let one peek through the other. The 3-layer pattern is correct.

## The freeze-edge divider

The last frozen column gets `.ve-col-frozen-edge`, which adds a
stronger 2px right border:

```css
table[data-ve-table-virtual] .ve-col-frozen-edge {
  border-right: 2px solid var(--vc-color-border-strong, #c9bfa3);
}
```

The reader needs a visual signal where the frozen lane ends and the
scrolling lane begins — without it, the table looks like the scroll
is broken because rows abruptly change horizontal position. The 2px
border is a clear "this is the freeze edge".

## `<thead>` sticky-top stacking

The header row is sticky-top regardless of whether columns are
frozen — it pins to the viewport top so the reader can always see
column names:

```css
table[data-ve-table-virtual] thead th {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--vc-color-surface, #ffffff);
}
```

This activates automatically on a `data-ve-table-virtual="1"` table.
Frozen columns are independent: a table can have a sticky header and
no frozen columns, or both. The `top: 0` means it sticks to the
viewport top; if the report has its own sticky banner, the offset
would need to grow — that escalation is documented but not the
default.

## Author contract — what you write

| Attribute | Value | Effect |
|---|---|---|
| `data-ve-freeze-cols="N"` | a non-negative integer | freeze the first N columns |
| absent / `0` | (default) | no frozen columns |
| `-1` or NaN | (defensive) | parsed as 0 — no frozen columns |

The attribute applies ONLY when the table is also `data-ve-table-
virtual="1"` (a `data-ve-table="data"` table). On a non-virtual
table the attribute is ignored — frozen columns without
virtualization are usually unwanted (a small table fits on screen).

## Sample HTML

```html
<table data-ve-table="data"
       data-ve-table-virtual="1"
       data-ve-freeze-cols="2"
       data-ve-table-csv="1">
  <thead>
    <tr>
      <th scope="col">ID</th>
      <th scope="col">Name</th>
      <th scope="col">Region</th>
      <th scope="col">Sector</th>
      <th scope="col">Revenue 2024</th>
      <th scope="col">Revenue 2025</th>
      <th scope="col">Growth %</th>
      <th scope="col">Status</th>
      <th scope="col">Owner</th>
      <th scope="col">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>0001</td><td>Acme</td><td>EMEA</td><td>SaaS</td>
        <td>1,180,000</td><td>1,240,000</td><td>5.1</td>
        <td>active</td><td>jdoe@</td><td>renewal Q3</td></tr>
    <!-- … hundreds more rows -->
  </tbody>
</table>
```

`freeze-cols="2"` freezes ID and Name. The reader can scroll right
through Region → Sector → Revenue → Growth → Status → Owner → Notes
while ID + Name stay pinned to the viewport left. The Copy-CSV
button is opt-in and unaffected by the freeze.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-surface` | opaque background on sticky cells (header + frozen column) |
| `--vc-color-border-strong` | 2px right divider on the freeze edge |

Both tokens flip on theme toggle automatically — sticky cells become
dark in dark theme, the freeze edge picks up the dark-theme strong
border. No second stylesheet, no media query.

## Selection / comment / decision-mini notes

A frozen column cell is still a normal cell — it carries the same
`data-ve-id` / `data-ve-comment-id` stamps as any other cell, and it
takes the same selection/decision-mini affordances. The pill
positioning is computed relative to the cell's `getBoundingClientRect`
which is correct for sticky cells (the rect reports the on-screen
position, not the pre-sticky position).

The row-as-atom contract is unchanged — the row IS the atom; freezing
some of its cells doesn't change which atom the click selects. A
click on a frozen cell selects the same row a click on a scrolled
cell would.

## CSV-export contract

CSV export is unaffected by which columns are frozen. Every column
exports as a field, every row exports as a record. The CSV is a
data export, not a layout export.
