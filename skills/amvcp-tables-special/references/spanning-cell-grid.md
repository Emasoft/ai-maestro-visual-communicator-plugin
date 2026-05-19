# Spanning-cell grid — colspan/rowspan-aware column math

How the module addresses "column N" in a table that has `colspan` or
`rowspan` cells without breaking. The naive `cells[N]` /
`:nth-child(N)` approach is wrong the moment a cell spans columns —
this reference explains the grid-map approach that replaces it.

## Table of contents

- [Why `cells[N]` is wrong](#why-cellsn-is-wrong)
- [The HTML "forming a table" algorithm](#the-html-forming-a-table-algorithm)
- [`buildCellGrid()` — the grid map](#buildcellgrid--the-grid-map)
- [Origin vs continuation slots — the null-slot pattern](#origin-vs-continuation-slots--the-null-slot-pattern)
- [Header colspan vs body colspan](#header-colspan-vs-body-colspan)
- [Sort under body rowspan — decline, do not silently mis-sort](#sort-under-body-rowspan--decline-do-not-silently-mis-sort)
- [Column operations that USE the grid](#column-operations-that-use-the-grid)
- [Sample table with grouped headers](#sample-table-with-grouped-headers)
- [Sample table with body rowspan — sort declined](#sample-table-with-body-rowspan--sort-declined)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract under spans](#csv-export-contract-under-spans)

---

## Why `cells[N]` is wrong

Take a header row with one cell spanning two columns:

```html
<thead>
  <tr><th>Region</th><th colspan="2">Revenue</th><th>Notes</th></tr>
</thead>
<tbody>
  <tr><td>EMEA</td><td>2024</td><td>2025</td><td>steady</td></tr>
</tbody>
```

The header has 3 cells (`cells.length === 3`); the body row has 4
cells (`cells.length === 4`). They do NOT line up by index. Asking
"what's in the body's column 1?" with `bodyRow.cells[1]` returns
`2024` — correct. Asking "what's in column 2?" returns `2025` —
**also correct**. But asking "what's the header for body column 2?"
with `headerRow.cells[2]` returns `Notes` — **wrong**; the header
for body column 2 is the `Revenue` span.

The same pathology hits `:nth-child(N)` selectors, `tr.children[N]`,
`Array.from(tr.cells)[N]`, and every other "Nth cell" addressing. The
fix is a grid map that records, for every (row, column) pair, **which
node occupies that slot** — including the slots inside a span.

## The HTML "forming a table" algorithm

The HTML spec defines a precise algorithm for "what cell occupies grid
(row, column)?" that handles both `colspan` and `rowspan`. The short
version:

1. Walk each row in document order.
2. Within a row, walk the cells in DOM order.
3. For each cell, place it at the **leftmost free grid column** in
   the current row.
4. A cell with `colspan=S` and `rowspan=R` occupies `S × R` grid
   slots starting at its placement.
5. Slots taken by a rowspan from an earlier row are skipped during
   placement of later rows' cells.

This is the algorithm `buildCellGrid(table)` implements. The output
is a 2-D array `grid[r][c]` keyed on row index r and grid column
index c — not DOM `cells[]` index.

## `buildCellGrid()` — the grid map

```js
function buildCellGrid(table) {
  var rows = collectAllRows(table);
  var grid = [];
  var colCount = 0;
  var hasBodyRowspan = false;
  for (var r = 0; r < rows.length; r++) {
    if (!grid[r]) grid[r] = [];
    var rowEl = rows[r];
    var inBody = isInTbody(rowEl);
    var cells = rowEl.cells ? rowEl.cells : [];
    var cursor = 0;
    for (var c = 0; c < cells.length; c++) {
      var cell = cells[c];
      while (gridSlotTaken(grid, r, cursor)) cursor++;
      var colspan = readSpan(cell, 'colSpan');
      var rowspan = readSpan(cell, 'rowSpan');
      if (inBody && rowspan > 1) hasBodyRowspan = true;
      for (var dr = 0; dr < rowspan; dr++) {
        for (var dc = 0; dc < colspan; dc++) {
          var gr = r + dr, gc = cursor + dc;
          if (!grid[gr]) grid[gr] = [];
          grid[gr][gc] = {
            node: cell,
            isOrigin: (dr === 0 && dc === 0)
          };
        }
      }
      cursor += colspan;
      if (cursor > colCount) colCount = cursor;
    }
  }
  return { grid: grid, rowCount: grid.length,
           colCount: colCount,
           hasBodyRowspan: hasBodyRowspan };
}
```

Returns `{ grid, rowCount, colCount, hasBodyRowspan }`. Every slot
inside a span references the **same node object**, with `isOrigin`
true only on the top-left slot — the "null-slot" pattern.

## Origin vs continuation slots — the null-slot pattern

The grid records every slot a cell covers. The top-left slot is the
**origin** (`isOrigin: true`); the rest are **continuations**
(`isOrigin: false`). This matters for operations that need to walk a
column without double-counting:

```js
function columnOriginCells(gridInfo, colIndex) {
  var out = [];
  var seen = [];
  for (var r = 0; r < gridInfo.grid.length; r++) {
    var slot = gridInfo.grid[r] ? gridInfo.grid[r][colIndex] : undefined;
    if (slot && slot.isOrigin && indexOf(seen, slot.node) === -1) {
      seen.push(slot.node);
      out.push(slot.node);
    }
  }
  return out;
}
```

`columnOriginCells(N)` returns every node node whose origin is at
column N. A `colspan="2"` cell shows up exactly once (in its left
column); a `rowspan="2"` cell shows up exactly once (in its top
row). The `seen` set is belt-and-braces — origins are already unique
by construction, but a defensive `indexOf` guard keeps the array
clean if the grid is ever mutated mid-call.

## Header colspan vs body colspan

The two kinds of spans behave differently:

| Span | Where | Effect on sort | Effect on column ops |
|---|---|---|---|
| `colspan` in `<thead>` | grouped header | NONE — sort still works | column ops still work |
| `colspan` in `<tbody>` | a multi-column data cell | NONE on sort key (the cell text is the key for ALL columns it covers) | column ops still work |
| `rowspan` in `<thead>` | a header that occupies two header rows | NONE — header row 0 is still the sort header row | column ops still work |
| `rowspan` in `<tbody>` | a body cell that spans multiple rows | **sort DECLINED for the whole table** | column ops still work for non-sorted operations |

The body-rowspan case is the one that breaks sorting: re-ordering
rows would TEAR the span — the cell would visually point at a row
that is no longer below it. The module declines sorting in that
case, logs one `console.info`, and the headers do not get the sort
wiring at all. Grouped HEADERS (colspan in `<thead>`) are fine — the
body rows are independent.

## Sort under body rowspan — decline, do not silently mis-sort

```js
if (gridInfo.hasBodyRowspan) {
  console.info(
    'amvcp-tables: table "' + tableLabel(table) + '" has body ' +
    'rowspan cells — sorting disabled (reordering would tear the span).'
  );
  return;
}
```

The fail-fast contract: do not paint sort arrows the user can click
and then not act on. The HTML is structurally incompatible with the
operation; the right answer is to NOT advertise the operation.

If the author wants both sort AND row-grouping, the fix is to
duplicate the spanned cell into every covered row and let CSS hide
the duplicates (`tr:not(:first-child) td.duplicated { visibility:
hidden }`). Then the rows are independent and sort works. That is
out of scope for the module — it preserves what the author wrote.

## Column operations that USE the grid

The module uses the grid map for every "column N" operation:

| Operation | Why grid-based |
|---|---|
| Numeric column detection | reads the same column across body rows |
| Right-align numeric column | tints every body origin cell in column N |
| Sorted-column tint (`.ve-col-sorted`) | accents every body origin cell |
| Frozen column (`.ve-col-frozen`) | applies sticky-left to all origin cells |
| Compare emphasis (`.ve-col-emphasis`) | tints header + body origin cells of one column |
| CSV export (column alignment) | emits one field per grid column |

If any of those used `cells[N]` instead, a table with a header
`colspan="2"` would silently corrupt — the wrong body cells would be
tinted/right-aligned/exported.

## Sample table with grouped headers

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col" rowspan="2">Region</th>
      <th scope="colgroup" colspan="2">Revenue</th>
      <th scope="col" rowspan="2">Growth %</th>
    </tr>
    <tr>
      <th scope="col">2024</th>
      <th scope="col">2025</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>EMEA</td><td>1,180,000</td><td>1,240,000</td><td>5.1</td></tr>
    <tr><td>APAC</td><td>905,200</td><td>980,500</td><td>8.3</td></tr>
  </tbody>
</table>
```

Sort works on Region (col 0), 2024 (col 1), 2025 (col 2), Growth %
(col 3). The Revenue grouped header is *non-sortable* — it has no
`tabindex`, no arrow, no handler — because it spans columns and its
"text" `Revenue` is not the sort key for either column underneath.

## Sample table with body rowspan — sort declined

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Quarter</th>
      <th scope="col">Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr><th rowspan="2" scope="rowgroup">EMEA</th><td>Q1</td><td>290,000</td></tr>
    <tr><td>Q2</td><td>335,000</td></tr>
    <tr><th rowspan="2" scope="rowgroup">APAC</th><td>Q1</td><td>240,000</td></tr>
    <tr><td>Q2</td><td>250,500</td></tr>
  </tbody>
</table>
```

Sort is **disabled** — the `EMEA`/`APAC` rowspans would visually
tear if rows were reordered. One `console.info` documents why. The
table still renders with the runtime's static styling (borders,
zebra, selection); only the sort wiring is absent.

## DESIGN.md tokens consumed

None — `buildCellGrid` is pure geometry. The visual operations that
consume the grid each have their own tokens (numeric-cell-parser
right-align, sort-cycle accent tint, virtualization-window-scroll
frozen-column background, etc.) — see the per-feature references.

## Selection / comment / decision-mini notes

A spanning cell is still a single DOM node — `<td colspan="3">` is
one `<td>`. The selection contract attaches to the node, not to its
grid slots. Clicking anywhere inside the cell's visible area selects
the one node. The decision-mini pill is attached once per atom node,
so a spanned cell gets exactly one pill (positioned at the cell's
geometric origin).

## CSV-export contract under spans

The grid walk emits **one field per grid column**, even when a cell
spans multiple columns. At the origin slot the field carries the
cell's text (RFC-4180 quoted); at continuation slots the field is
EMPTY (`""`). This keeps column count consistent across all rows in
the CSV — downstream consumers (Excel, Google Sheets, pandas)
parse a fixed-width CSV.

So the grouped-header sample above exports as:

```csv
Region,Revenue,,Growth %
,2024,2025,
EMEA,"1,180,000","1,240,000",5.1
APAC,"905,200","980,500",8.3
```

— a regular 4-column CSV. The header is two rows because the source
header is two rows; the continuation slot for "Revenue" is empty in
row 0 (the spanned cell's value was emitted once at column 1).
Downstream tooling that expects a single-row header should be told
the source has a grouped header, or the author should flatten the
header to a single row (`2024 Revenue`, `2025 Revenue`) before
exporting.
