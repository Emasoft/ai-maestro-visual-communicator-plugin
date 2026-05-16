# Matrix `<tfoot>` summary — per-column P/F/~ counts

How `data-ve-matrix-summary` fills a `<tfoot>` row with per-column
"pass / fail / partial" counts so the reader sees the column-level
verdict at a glance. Opt-in, span-aware, never opinionated about
which counts to display.

## Table of contents

- [Why a column summary](#why-a-column-summary)
- [Opt-in via the table attribute](#opt-in-via-the-table-attribute)
- [The `<tfoot>` row contract](#the-tfoot-row-contract)
- [The counting algorithm — grid-walked](#the-counting-algorithm--grid-walked)
- [Format — `P/F/~`](#format--pf)
- [`na` cells are excluded from the count](#na-cells-are-excluded-from-the-count)
- [A column with zero ratable cells is left blank](#a-column-with-zero-ratable-cells-is-left-blank)
- [The leading footer cell — author owns its content](#the-leading-footer-cell--author-owns-its-content)
- [Sample HTML](#sample-html)
- [Customising the count format](#customising-the-count-format)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## Why a column summary

A 30-component × 6-criterion coverage matrix has 180 status cells.
The reader cannot count them by eye. A column summary at the bottom
("Light: 27/2/1") immediately tells the reader:
- 27 components pass on light theme,
- 2 components fail,
- 1 component is partial.

That single line surfaces the "this criterion is in trouble" signal
faster than a heatmap or a chart could — the reader's eye lands on
the column with high `F` count and goes investigating.

The summary is **off by default** — most matrix tables are small
enough that the author already knows the column totals. The opt-in
is one attribute on the `<table>`.

## Opt-in via the table attribute

```html
<table data-ve-table="matrix" data-ve-matrix-summary>
  ...
</table>
```

The presence of `data-ve-matrix-summary` (with or without `="1"`)
turns the summary on. The module reads:

```js
if (table.getAttribute('data-ve-matrix-summary') !== null) {
  fillMatrixSummary(table);
}
```

`null` only when the attribute is fully absent. Empty string ("") or
"1" both activate. The author can use either convention.

## The `<tfoot>` row contract

The summary fills the **last row** of `<tfoot>`. The author MUST
provide that row — the module does not create it:

```html
<tfoot>
  <tr>
    <th scope="row">P/F/~</th>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</tfoot>
```

The leading cell (column 0) is author-owned — the module never
touches it. Conventional content: `P/F/~` as a legend, or "Totals",
or empty. The remaining cells (columns 1..N) are filled by the
module.

Why a single `<tfoot>` row, not a generated one? Two reasons:
1. The author owns the leading-cell content and any custom column
   labels.
2. The author can add CSS classes on the `<tr>` to style the
   summary differently from body rows (e.g. bold, top-border).

A table without `<tfoot>` simply has no summary — the module no-ops
if `tfoot` is absent or has no rows.

## The counting algorithm — grid-walked

```js
function fillMatrixSummary(table) {
  var tfoot = table.tFoot;
  if (!tfoot || !tfoot.rows.length) return;
  var gridInfo = buildCellGrid(table);
  var bodyRows = collectBodyRows(table);
  var summaryRow = tfoot.rows[tfoot.rows.length - 1];
  for (var col = 0; col < summaryRow.cells.length && col < gridInfo.colCount; col++) {
    var counts = { pass: 0, fail: 0, partial: 0, na: 0 };
    for (var r = 0; r < bodyRows.length; r++) {
      var ri = indexOfRowInGrid(bodyRows[r]);
      if (ri < 0) continue;
      var slot = gridInfo.grid[ri] ? gridInfo.grid[ri][col] : undefined;
      if (slot && slot.isOrigin) {
        var v = slot.node.getAttribute('data-ve-val');
        if (v && hasOwn(counts, v)) counts[v]++;
      }
    }
    if (counts.pass + counts.fail + counts.partial > 0) {
      summaryRow.cells[col].textContent =
        counts.pass + '/' + counts.fail + '/' + counts.partial;
    }
  }
}
```

The walk is **grid-aware** — it goes through `gridInfo.grid[r][col]`
and `slot.isOrigin`, so:
- A cell with `colspan="2"` is counted once (only at its origin
  column).
- A cell with `rowspan="2"` is counted once (only at its origin
  row).
- The continuation slots contribute nothing — preventing double-
  counting.

This matters because matrix tables sometimes use a `colspan="2"
data-ve-val="pass"` to indicate "both columns audited passing" —
the cell is one fact, counted once.

## Format — `P/F/~`

The counts are formatted as `P/F/~` — three numbers separated by
slashes, in that fixed order:

| `P` | `F` | `~` | format |
|---|---|---|---|
| pass count | fail count | partial count | `5/0/1` means 5 pass, 0 fail, 1 partial |

`na` is excluded from the format (see next section). The slash
separator is concise; a row of `27/2/1` for each column is easy to
scan. Spaces (`27 / 2 / 1`) would consume more horizontal space
without adding clarity.

The format is fixed — there is no `data-ve-summary-format`
attribute. If the author wants a different format ("P:27 F:2 ~:1"),
the right path is to hand-write the `<tfoot>` row's text content and
NOT use `data-ve-matrix-summary`.

## `na` cells are excluded from the count

`na` ("not applicable") is excluded from the displayed format —
counting "not applicable" alongside pass/fail/partial would mislead
the reader into thinking the criterion has more or fewer ratable
cells than it does.

`5/0/0` means 5 pass, 0 fail, 0 partial — and possibly 2 N/A cells
that simply aren't ratable. The column is "5 of 5 ratable passing",
which is what the reader cares about.

Internally the counts object tracks all four values; the format
suppresses `na`. If a future "show NA count" affordance is wanted,
it could be a separate format ("5/0/0/2na"); not implemented today.

## A column with zero ratable cells is left blank

```js
if (counts.pass + counts.fail + counts.partial > 0) {
  summaryRow.cells[col].textContent =
    counts.pass + '/' + counts.fail + '/' + counts.partial;
}
```

A column whose every cell is `na` (or empty) has `0+0+0=0` ratable
cells — the summary cell is left blank. `0/0/0` would be confusing
(is that "zero passes, zero fails, zero partials" or "no data"?).
Blank is the honest signal: the column has nothing meaningful to
summarise.

The author's leading cell of the footer row is similarly never
modified — the module only touches cells `col=1..N` of the summary
row, and only when there is something to write.

## The leading footer cell — author owns its content

`summaryRow.cells[0]` is the row's first cell (column 0). The module
**never** writes to it — that cell is the legend / label for the
row. Author content:

```html
<th scope="row">P/F/~</th>
<!-- or -->
<th scope="row">Totals</th>
<!-- or -->
<td></td>
```

If `<th scope="row">P/F/~</th>` is used, the screen reader announces
"P/F/~. Light. 5/0/1" for each summary cell — providing the legend
that decodes the slash-separated numbers.

## Sample HTML

```html
<table data-ve-table="matrix" data-ve-matrix-summary>
  <thead>
    <tr>
      <th scope="col">Component</th>
      <th scope="col">Light</th>
      <th scope="col">Dark</th>
      <th scope="col">Mobile</th>
      <th scope="col">RTL</th>
      <th scope="col">A11y</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Button</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="partial"></td>
      <td data-ve-val="pass"></td>
    </tr>
    <tr>
      <th scope="row">Card</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="fail"></td>
      <td data-ve-val="na"></td>
      <td data-ve-val="partial"></td>
    </tr>
    <tr>
      <th scope="row">Modal</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="partial"></td>
      <td data-ve-val="na"></td>
      <td data-ve-val="fail"></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">P/F/~</th>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>
  </tfoot>
</table>
```

After enhancement, the footer row reads:

| P/F/~ | 3/0/0 | 3/0/0 | 1/1/1 | (blank) | 1/1/1 |
|---|---|---|---|---|---|

- Light column: 3 pass, 0 fail, 0 partial.
- RTL column: every cell `na`; left blank.
- Mobile/A11y: 1 pass, 1 fail, 1 partial each — flagged columns the
  reader should investigate.

## Customising the count format

The module ships exactly the `P/F/~` format. To customise:

1. **Hand-write the footer row** without `data-ve-matrix-summary` —
   the author owns every cell.
2. **Build a generated row server-side** before the HTML reaches the
   module — the module doesn't touch a row whose first cell already
   has a `data-ve-summary-author` attribute (a future hook; not
   shipped). The simpler path is option 1.

The `P/F/~` format is documented as "the canonical AMVCP coverage
summary" — using it consistently across reports lets the reader skip
the legend mentally.

## DESIGN.md tokens consumed

None — the summary row inherits all table cell styling from the
runtime baseline + DESIGN.md tokens used by the matrix tints (see
[matrix-glyph-injection.md](./matrix-glyph-injection.md)). The
summary row's text reads as plain table text in the active theme.

If the author wants the summary row to stand out, the CSS pattern
is `tfoot tr { font-weight: 600; border-top: 2px solid
var(--vc-color-border-strong); }` — added by the author, not by
the module.

## Selection / comment / decision-mini notes

The `<tfoot>` row is NOT a body row — `collectBodyRows()` excludes
it. Therefore:
- No `data-ve-comment-id` is stamped on it.
- The runtime's atom-paint events do not paint it.
- The decision-mini pill is not attached.

The summary row is structural chrome, not an atom the reader
selects or comments on. If a reader wants to flag a particular
column's verdict, the correct affordance is to select an individual
body cell in that column (matrix cells are per-cell atoms).

## CSV-export contract

The footer row is included in the CSV export — it is part of the
grid:

```csv
Component,Light,Dark,Mobile,RTL,A11y
Button,Pass,Pass,Pass,Partial,Pass
Card,Pass,Pass,Fail,Not applicable,Partial
Modal,Pass,Pass,Partial,Not applicable,Fail
P/F/~,3/0/0,3/0/0,1/1/1,,1/1/1
```

The summary row's content is whatever the module wrote (or whatever
the author wrote — the export reads `textContent`, not the
underlying counts). The "(blank)" column shows as an empty field.
Downstream tooling (pandas, spreadsheets) can identify the summary
row by its leading cell content (`P/F/~`) and treat it specially —
or strip it if it would interfere with column-type detection.
