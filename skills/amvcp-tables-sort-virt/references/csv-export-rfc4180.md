# CSV export — RFC 4180 quoting, clipboard only

The cross-cutting Copy-CSV affordance for any `data` / `matrix` /
`compare` table. Opt-in via one attribute, RFC-4180 compliant, no
file download, no library dependency.

## Table of contents

- [Opt-in via one attribute](#opt-in-via-one-attribute)
- [RFC 4180 — the quoting rules](#rfc-4180--the-quoting-rules)
- [`tableToCsv()` — the grid walk](#tabletocsv--the-grid-walk)
- [Spanning cells in the CSV — emit at origin](#spanning-cells-in-the-csv--emit-at-origin)
- [Header row stripping — `↕` does not export](#header-row-stripping---does-not-export)
- [Matrix cells export the WORD, not the glyph](#matrix-cells-export-the-word-not-the-glyph)
- [Numeric cells export the displayed text](#numeric-cells-export-the-displayed-text)
- [Whitespace collapsing](#whitespace-collapsing)
- [CRLF line endings](#crlf-line-endings)
- [Clipboard API + execCommand fallback](#clipboard-api--execcommand-fallback)
- [Why not a file download](#why-not-a-file-download)
- [Why no Excel export](#why-no-excel-export)
- [Sample HTML](#sample-html)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## Opt-in via one attribute

```html
<table data-ve-table="data" data-ve-table-csv="1">
```

The `data-ve-table-csv="1"` attribute injects a top-right "Copy CSV"
button. Opt-in (NOT default) because most report tables are visual
artefacts the reader wants to read, not data the reader wants to
re-process — the button would be noise on a small comparison table.
A data table the reader might want to pivot or filter elsewhere
should opt in; a matrix table with 4 columns and 6 rows usually
shouldn't.

The button label is `Copy CSV` and changes to `Copied` for ~1.4
seconds after a click. No icon, no menu, no download options — one
button, one action.

## RFC 4180 — the quoting rules

RFC 4180 is the de-facto interchange format for CSV. The rules the
module implements:

1. Fields are separated by **commas**.
2. Records are separated by **CRLF** (`\r\n`), NOT just `\n`.
3. A field that contains `,`, `"`, `\r`, or `\n` is wrapped in
   double quotes.
4. Inside a quoted field, a literal `"` is escaped by doubling it
   (`""`).
5. The header row is included as the first record.

The module's quote function:

```js
function csvQuote(field) {
  if (/[",\r\n]/.test(field)) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}
```

A field without any of the four special characters is emitted bare.
Excel / Google Sheets / pandas all parse this correctly.

## `tableToCsv()` — the grid walk

The export walks the **grid map** (see [spanning-cell-grid.md](
../../amvcp-tables-special/references/spanning-cell-grid.md)) so spans are exported correctly:

```js
function tableToCsv(table) {
  var gridInfo = buildCellGrid(table);
  var lines = [];
  for (var r = 0; r < gridInfo.grid.length; r++) {
    var fields = [];
    for (var c = 0; c < gridInfo.colCount; c++) {
      var slot = gridInfo.grid[r] ? gridInfo.grid[r][c] : undefined;
      if (!slot) {
        fields.push('');           // ragged table — empty grid cell
      } else if (!slot.isOrigin) {
        fields.push('');           // continuation slot — value at origin
      } else {
        fields.push(csvQuote(cellExportText(slot.node)));
      }
    }
    lines.push(fields.join(','));
  }
  return lines.join('\r\n');
}
```

The function is exposed on the module's public API
(`window.amvcpTables.tableToCsv`) for tests and for programmatic
export.

## Spanning cells in the CSV — emit at origin

A cell with `colspan="3"` is one DOM `<td>` covering three grid
columns. The export emits its value at the **origin** slot (the
left-most column it covers) and **empty fields** at the
continuation slots — keeping the column count consistent across
every row in the CSV.

A `<tr>` with `<td colspan="3">Total</td><td>1,420,500</td>`
exports as:

```csv
Total,,,"1,420,500"
```

Four fields — same as every other row in the table. The downstream
parser sees a fixed-width CSV.

This is the only spec-compliant way: CSV has no native concept of
"cell that spans multiple columns". The receiving spreadsheet will
import "Total" into one column and three empties into the next
three columns; the human reader can re-merge if needed.

## Header row stripping — `↕` does not export

The module injects a sort-arrow span into every sortable header:

```html
<th data-ve-sortable="1">Revenue<span class="ve-sort-arrow">↕</span></th>
```

If the export naively read `textContent`, the header would export as
`Revenue↕`. The exporter strips `.ve-sort-arrow` spans before
reading text:

```js
function cellExportText(cell) {
  var val = cell.getAttribute && cell.getAttribute('data-ve-val');
  if (val && hasOwn(MATRIX_WORD, val)) {
    return MATRIX_WORD[val];
  }
  if (cell.cloneNode && cell.querySelectorAll) {
    var clone = cell.cloneNode(true);
    var arrows = clone.querySelectorAll('.ve-sort-arrow');
    for (var i = 0; i < arrows.length; i++) {
      arrows[i].parentNode.removeChild(arrows[i]);
    }
    var t = clone.textContent || '';
    return t.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
  }
  return (cell.textContent || '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}
```

A defensive `cloneNode(true) + querySelectorAll(.ve-sort-arrow) +
removeChild` is used so the live header keeps its arrow. The clone
is discarded.

If the author injects an `<sup>*</sup>` footnote marker into a
header (`Revenue<sup>*</sup>`), the export keeps it — that is part
of the author's header content. Only module-injected chrome (the
sort arrow) is stripped.

## Matrix cells export the WORD, not the glyph

A matrix cell carries `data-ve-val="pass|fail|partial|na"` and is
visually rendered with a Unicode glyph (`✓ ✗ ◐ —`). The CSV
exports the WORD:

| `data-ve-val` | CSV exports |
|---|---|
| `pass` | `Pass` |
| `fail` | `Fail` |
| `partial` | `Partial` |
| `na` | `Not applicable` |

Exporting `✓ ✗ ◐ —` would force the receiving tool to parse
geometric Unicode characters — most spreadsheets can but the result
is hard to filter (sorting by ✓ < ✗ is not meaningful). The word is
human-readable, sort-friendly, and machine-parseable.

If the cell has author text *after* the glyph (`<td data-ve-val=
"pass">Verified</td>`), the export emits the word `Pass`, not
`Pass Verified`. The author text is presentational; the canonical
fact is the `data-ve-val`. If both pieces are wanted in the export,
the author should put the text in an adjacent column.

## Numeric cells export the displayed text

A `data` cell with `1,240,000` exports as `"1,240,000"` (quoted
because of the comma) — NOT as `1240000`. The CSV preserves the
author's display values; the numeric parser is a sort-time concern
only.

A cell with `$2,100,750` exports as `"$2,100,750"`. The receiving
tool may want to interpret it as a number; that's the tool's
problem. The plugin does not normalise to "raw" numbers — that would
lose information (currency symbol, locale-specific thousands
separator).

## Whitespace collapsing

A multi-line `<td>` like:

```html
<td>
  Acme Industries
  (renewal Q3)
</td>
```

exports as `Acme Industries (renewal Q3)` — interior whitespace and
newlines are collapsed to a single space, and the leading/trailing
trimmed. This matches the rendered visual: HTML collapses interior
whitespace, the CSV does too.

A cell with intentional `\n` in author text (e.g. `<td>line1<br>
line2</td>`) currently exports as `line1 line2` — the `<br>` is
treated as inline whitespace by `textContent`. A future enhancement
could honour `<br>` as a CSV-newline (would force the cell to be
quoted, per RFC 4180 rule 3); not implemented today.

## CRLF line endings

The output uses `\r\n` between records, per RFC 4180. This works
correctly in Excel, Google Sheets, Numbers, LibreOffice Calc, and
every UNIX CSV tool I'm aware of (`csvkit`, `pandas`, `awk -F,`).
A `\n`-only CSV usually also works, but Excel on Windows
historically miscounts rows in `\n`-only files; CRLF is the safe
choice.

The trailing CRLF is **omitted** — the output is N records
separated by N-1 CRLFs. Some parsers tolerate a trailing newline;
some emit a phantom empty record. Omitting is the conservative
default.

## Clipboard API + execCommand fallback

Modern browsers (HTTPS context) support
`navigator.clipboard.writeText(text)` — an async Promise-returning
API. The module prefers it:

```js
if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard.writeText(csv).then(done, function () {
    legacyCopy(csv, done);
  });
} else {
  legacyCopy(csv, done);
}
```

The fallback `legacyCopy` creates a hidden `<textarea>`, selects it,
and calls `document.execCommand('copy')`. This is the only path
that works in insecure contexts (`file://` URLs, some old browsers).
`execCommand('copy')` is deprecated in favor of the async API but is
still implemented for back-compat — feature-detect before calling.

After a successful copy, the button label changes to `Copied` for
~1.4 seconds, then reverts. The reader sees confirmation; no toast,
no modal.

## Why not a file download

A "download as .csv file" affordance would:
- Require either a `<a download>` link or `URL.createObjectURL` —
  both work, both add UI weight.
- Force a filename — `<table-id>-<timestamp>.csv` is a guess; the
  reader's OS will append `(1)`, `(2)` on repeat downloads;
  the reader has to clean up.
- Diverge from the report's "everything stays in the browser"
  ergonomic.

Clipboard is **friction-free**: copy, switch tab, paste. The reader
chooses where the data goes. No filename to manage, no Downloads
folder pollution.

## Why no Excel export

`.xlsx` is a zip-of-XML format. Generating it client-side requires:
- Either a 100+ KB JS library (`SheetJS`, `ExcelJS`) — the plugin
  refuses heavy deps.
- Or a server-side renderer (Go `excelize/v2`, Python `openpyxl`) —
  the plugin emits self-contained HTML, not a build pipeline.

CSV is the universal export. Every spreadsheet imports it. Every
data-analysis tool reads it. It is small, plain-text,
diff-friendly, and shippable in 0 KB of runtime.

`.xlsx` features the CSV doesn't have (AutoFilter, formulas,
multi-sheet, formatting, formulas) are out of scope. The receiving
tool can apply AutoFilter on the imported CSV in one click.

## Sample HTML

```html
<!-- a data table with CSV opt-in -->
<table data-ve-table="data" data-ve-table-csv="1">
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

Click "Copy CSV"; paste into any spreadsheet. The result:

```csv
Region,Revenue,Growth %
EMEA,"1,240,000",12.4
APAC,"980,500",8.1
```

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-content` | button text color |
| `--vc-color-surface` | button background |
| `--vc-color-border` | button 1px border |
| `--vc-color-accent` | button hover background (12% accent over surface) |
| `--vc-text-1` | button font size |
| `--vc-space-1`, `--vc-space-2` | button padding |
| `--vc-radius-sm` | button border-radius |
| `--vc-duration-fast` | button hover transition |
| `--vc-easing-standard` | button hover transition easing |

The button re-themes automatically on a DESIGN.md theme toggle — the
same rules just resolve to the new theme's tokens.

## Selection / comment / decision-mini notes

The Copy-CSV button is a `<button>` element — it is NOT a selectable
atom. The runtime's atom-paint contract attaches to `<tr>` and `<td>`
nodes; a sibling `<button>` is structural chrome and has no
`data-ve-id`. Clicking the button does not affect any selection; it
copies and reverts.
