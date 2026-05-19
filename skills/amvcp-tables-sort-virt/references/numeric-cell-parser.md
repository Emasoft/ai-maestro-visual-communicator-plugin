# Numeric cell parser — the column-type detector

How `amvcp-tables.js` decides whether a `data` column is "numbers"
without forcing the author to declare it. The numeric parser is the
single rule that drives auto-right-align, numeric sort, and the column
"numeric or string?" choice.

## Table of contents

- [Why auto-detect](#why-auto-detect)
- [The grammar — what counts as a number](#the-grammar--what-counts-as-a-number)
- [`parseCellNumber()` — the exact rules](#parsecellnumber--the-exact-rules)
- [Detection — one click per column, lazy + cached](#detection--one-click-per-column-lazy--cached)
- [The all-empty trap](#the-all-empty-trap)
- [Mixed columns are string-sorted](#mixed-columns-are-string-sorted)
- [Authoring contract — do not pre-strip](#authoring-contract--do-not-pre-strip)
- [Sample HTML — author exactly this](#sample-html--author-exactly-this)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## Why auto-detect

Report tables routinely mix currencies, percents, and free text:

```
Region        Revenue       Growth %    Notes
EMEA          1,240,000     12.4        strong
APAC          980,500       8.1         steady
Americas      $2,100,750    9.7         OEM channel up
```

The author should NEVER have to add `<th data-type="number">` to
that table — the rule "every non-empty body cell parses as a number,
therefore the column is numeric" is unambiguous, fast, and matches the
reader's mental model. The auto-detect runs once per column, lazily on
the first click of that column's header.

## The grammar — what counts as a number

A cell's text is treated as a number iff, after these five
normalisation steps, the remainder is a finite JavaScript number:

| Step | Strip | Reason |
|---|---|---|
| 1 | leading + trailing whitespace | text-fragment slack the author can't see |
| 2 | one optional leading `$`, `€`, `£`, or `¥` | "$2,100,750" is one number |
| 3 | one optional trailing `%` | "12.4%" is one number |
| 4 | all `,` thousands separators | "1,240,000" → "1240000" |
| 5 | all interior whitespace | spreadsheet exports often pad |

Then `Number(remainder)`. **NOT `parseFloat`** — `parseFloat('12abc')`
silently returns `12` (the trailing garbage is dropped), which would
let a string column be wrongly classified numeric. `Number('12abc')`
correctly returns `NaN`.

Empty string after normalisation is **NOT a number** — the cell is
*skipped* during detection rather than disqualifying the column. An
all-empty column is then string-sorted (there is nothing meaningful
to sort numerically).

## `parseCellNumber()` — the exact rules

```js
function parseCellNumber(text) {
  if (typeof text !== 'string') return { ok: false, value: 0 };
  var s = text.replace(/^\s+|\s+$/g, '');
  if (s === '') return { ok: false, value: 0 };
  s = s.replace(/^[$€£¥]/, '');     // one leading currency
  s = s.replace(/%$/, '');           // one trailing %
  s = s.replace(/[,\s]/g, '');       // thousands + interior ws
  if (s === '') return { ok: false, value: 0 };
  var n = Number(s);
  if (isNaN(n) || !isFinite(n)) return { ok: false, value: 0 };
  return { ok: true, value: n };
}
```

Returns `{ ok, value }` — never a bare number — so callers can
distinguish "0 (a real number)" from "not a number". The detector
relies on that distinction: a `0` cell is a valid numeric value; an
empty cell is skipped; a `"n/a"` cell makes the column string.

Trillions of leading zeros after the strip ("000123") are still a
number — `Number("000123") === 123`. Negative numbers ("-12.4")
parse — `Number` accepts leading `-`. Scientific notation ("1.2e3")
parses too. The implementation is intentionally permissive on shape
and strict on the final `Number()` check.

## Detection — one click per column, lazy + cached

```js
function detectNumericColumn(bodyRows, cellTextOf) {
  var sawValue = false;
  for (var i = 0; i < bodyRows.length; i++) {
    var text = cellTextOf(bodyRows[i]);
    if (text.replace(/^\s+|\s+$/g, '') === '') continue;
    var parsed = parseCellNumber(text);
    if (!parsed.ok) return false;
    sawValue = true;
  }
  return sawValue;
}
```

Detection runs **once per column, lazily on the first click of that
column's header**, and the boolean is cached on the `<th>`
(`th.__veNumeric`). A re-click never re-detects. This matters at scale
— a 2000-row table reads 2000 cells per column, and we don't want to
do that every sort cycle.

A detected numeric column is also visually marked: every body cell in
that column gets `class="ve-cell-num"`, which applies
`text-align:right; font-variant-numeric:tabular-nums` — numbers line
up at the decimal point.

## The all-empty trap

If EVERY body cell in a column is empty, `sawValue` stays `false` and
the column is **not** classified numeric. This is correct — sorting an
all-empty column has no meaning. The column gets string-sorted (which
also no-ops since the localeCompare is always 0), and the click is
effectively visual feedback only.

If most cells are empty but one is `"100"`, the column **IS** numeric
— the single value still defines the sort order. Empty cells in a
numeric column sort to the end (the comparator treats unparseable +
empty as `+Infinity` in `asc`).

## Mixed columns are string-sorted

A column with `"12,345"`, `"7,200"`, `"draft"` has one non-numeric
cell — the parser returns `ok:false` on `"draft"`, the column is
demoted to string, and `localeCompare(b, undefined, {numeric:true,
sensitivity:'base'})` is used instead. That comparator gives natural
ordering (`item2` before `item10`) AND treats numbers-inside-strings
sensibly. The string-sort path is the safe fallback — never silently
mis-sort a mixed column as numeric.

## Authoring contract — do not pre-strip

**Author the values as they should display.** The numeric parser was
built to read the author's literal cell text, not a sanitised version:

- DO write `1,240,000` — the comma is a thousands separator.
- DO write `$2.4M` — sorts as `2.4` (the `M` makes it string-sort
  unless every cell has the same suffix; if so, drop the M and use a
  column heading "Revenue ($M)" instead).
- DO write `12.4%` — sorts as `12.4`.
- DO write empty cells — they are skipped, not zero.
- DO NOT write `data-sort-value="1240000"` (the parser would ignore
  it — it reads `textContent`, not attributes).
- DO NOT write `1240000` instead of `1,240,000` — you lose readability
  for no benefit.

## Sample HTML — author exactly this

```html
<table data-ve-table="data">
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
    <tr><td>LATAM</td><td>410,000</td><td>−2.1</td><td>contraction</td></tr>
  </tbody>
</table>
```

After the first click on Revenue:
- the column is right-aligned + tabular-nums;
- the rows sort `410,000 < 980,500 < 1,240,000 < $2,100,750`;
- the sort arrow turns solid accent.

After the first click on Notes: the `data-ve-nosort` opt-out means
nothing happens — the column header has no arrow, no `tabindex`, no
handler.

## DESIGN.md tokens consumed

Numeric columns are styled via:

```css
table[data-ve-table] .ve-cell-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
```

No tokens consumed for the alignment itself — the rule is type-only.
The accent tint on the sorted column reads
`var(--vc-color-accent, #b8861f)` so a DESIGN.md `accent` change
re-paints which column is "highlighted".

## Selection / comment / decision-mini notes

A numeric column lives inside a `data` table — every `<tr>` is a
selectable atom (`data-ve-comment-id="row:<tag>:<n>"`). Sorting moves
the `<tr>` nodes (it does NOT clone them — see
`row-move-not-clone.md`), so `data-ve-pressed`,
`data-ve-comment-id`, attached listeners and the decision-mini pill
all ride along with the row. The selection payload is positional:
record-then-sort keeps the rows; sort-then-record records the
post-sort rows.

## CSV-export contract

`data-ve-table-csv="1"` exports the **literal cell text** —
`1,240,000` (not `1240000`), `$2,100,750` (not `2100750`), `12.4`
(not `12.4%`). The CSV preserves the author's display values; the
numeric parser is a sort-time/right-align concern only, not an
export-time one. RFC-4180 quoting wraps a field that contains `,`,
`"`, `\r`, or `\n` in double quotes — so `1,240,000` exports as
`"1,240,000"` (preserving the comma without breaking CSV parsing).

The header row is included verbatim, with one exception: the injected
sort-arrow span (`.ve-sort-arrow`) is stripped from the header before
export. So `Revenue ↕` exports as `Revenue`, not `Revenue↕`.
