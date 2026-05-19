# Comparison emphasis column — the "recommended" lane

How `data-ve-col-emphasis="1"` on one column header in a
`data-ve-table="compare"` table turns that column into an
accent-tinted lane — the visual cue for "this is the
recommended option / after picture / winner".

## Table of contents

- [What the emphasis column communicates](#what-the-emphasis-column-communicates)
- [The `data-ve-col-emphasis` attribute](#the-data-ve-col-emphasis-attribute)
- [Zero or one — never two](#zero-or-one--never-two)
- [The two-column emphasis warning — fail-fast, console.warn](#the-two-column-emphasis-warning--fail-fast-consolewarn)
- [How the tint is applied — grid-walked column](#how-the-tint-is-applied--grid-walked-column)
- [The accent border-left + border-right](#the-accent-border-left--border-right)
- [The 10% accent wash](#the-10-accent-wash)
- [Icon recoloring on the emphasis header](#icon-recoloring-on-the-emphasis-header)
- [The 2-column anti-pattern → fix variant](#the-2-column-anti-pattern--fix-variant)
- [Pairing emphasis with a deliberate row order](#pairing-emphasis-with-a-deliberate-row-order)
- [Sample HTML — 3-column recommendation](#sample-html--3-column-recommendation)
- [Sample HTML — 2-column before/after](#sample-html--2-column-beforeafter)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## What the emphasis column communicates

A side-by-side comparison table answers "which option / version /
approach should I take?". The columns are the options; the rows are
the criteria; the cells fill in the per-option per-criterion value.

The emphasis column says "**the right answer**". The author already
made a choice when assembling the table — emphasis surfaces that
choice visually so the reader doesn't have to puzzle it out.

| Use | Emphasis column |
|---|---|
| Recommendation | the recommended product / plan / library |
| Before/After | the "After" picture (anti-pattern → fix) |
| A/B test result | the winning variant |
| Migration | the destination platform |
| Buy-vs-build | the verdict |

Without emphasis, a 3-column comparison reads as "here are three
neutral options"; with emphasis, it reads as "here are three options
and B is the answer".

## The `data-ve-col-emphasis` attribute

Attached to ONE option-column `<th>`:

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Criterion</th>
      <th scope="col" data-ve-col-icon="○">Option A</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">Option B</th>
      <th scope="col" data-ve-col-icon="◇">Option C</th>
    </tr>
  </thead>
  ...
</table>
```

The first column (`Criterion`) is the row-label column and never
gets emphasis — it identifies rows, not options.

`data-ve-col-emphasis="1"` is the only accepted value. Any other
value (or the attribute absent) means "not the emphasis column".
This is consistent with HTML boolean-ish attribute conventions in
the rest of the plugin (`data-ve-table-csv="1"`, `data-ve-table-
virtual="1"`).

## Zero or one — never two

A comparison can have:
- **Zero** emphasis columns — neutral comparison, no recommended
  option. Render the table without an accent lane.
- **One** emphasis column — the canonical case. One lane is
  accent-tinted.
- **Two or more** — invalid. The module logs a `console.warn` and
  emphasises only the first.

Two emphasis columns would visually suggest "both are equally
recommended", which contradicts the point of emphasis (signal a
single answer). If the author genuinely wants to say "both A and C
are recommended over B", the correct framing is to flip the table:
make A and C the rows of a 2-column "Yes / No" table where the No
column lists rejected criteria.

## The two-column emphasis warning — fail-fast, console.warn

```js
if (emphasisCount > 1 && console && console.warn) {
  console.warn(
    'amvcp-tables: comparison table "' + tableLabel(table) + '" has ' +
    emphasisCount + ' data-ve-col-emphasis columns — only one is ' +
    'allowed; emphasising the first.'
  );
}
```

The warning is the fail-fast signal. The render proceeds (the
reader sees one emphasised column, which is correct), but the
console shows the author the mistake so they can fix it. Silently
emphasising both, or silently emphasising none, would be a worse
failure mode — the author needs the diagnostic.

`tableLabel(table)` is the table's `data-ve-id`, `data-ve-label`,
`id`, or `"(unnamed table)"` — author-friendly identifier so the
warning points at a specific table in a page with many.

## How the tint is applied — grid-walked column

```js
function applyCompareEmphasis(table, headerColIndex) {
  var gridInfo = buildCellGrid(table);
  var gridCol = headerCellIndexToGridColumn(table, headerColIndex);
  var cells = columnOriginCells(gridInfo, gridCol);
  for (var i = 0; i < cells.length; i++) {
    addClass(cells[i], 've-col-emphasis');
    addClass(cells[i], 've-col-emphasis-left');
    addClass(cells[i], 've-col-emphasis-right');
  }
  var headerCell = firstHeaderRow(table).cells[headerColIndex];
  if (headerCell) addClass(headerCell, 've-col-emphasis');
}
```

The grid walk (see [spanning-cell-grid.md](../../amvcp-tables-special/references/spanning-cell-grid.md))
finds every origin cell in the emphasised grid column. Spanning-safe
— a row whose body cell `colspan="2"` covers columns 1 and 2 would
be picked up correctly if either column 1 OR column 2 is emphasised
(the spanned cell's origin is the leftmost column).

Three CSS classes get added per cell:
1. `.ve-col-emphasis` — the tint and the (header) icon recolor.
2. `.ve-col-emphasis-left` — the left accent border.
3. `.ve-col-emphasis-right` — the right accent border.

Adding all three to every cell in the column means the column reads
as a single lane bordered top to bottom on both sides.

## The accent border-left + border-right

```css
table[data-ve-table="compare"] .ve-col-emphasis-left {
  border-left: 2px solid var(--vc-color-accent, #b8861f);
}
table[data-ve-table="compare"] .ve-col-emphasis-right {
  border-right: 2px solid var(--vc-color-accent, #b8861f);
}
```

A 2px accent border on the left edge of the first emphasised column
cell and the right edge of the last emphasised column cell. Because
the same `.ve-col-emphasis-left` and `.ve-col-emphasis-right` classes
go on EVERY emphasised cell, the borders accumulate visually into
two continuous vertical lines flanking the column.

The accent border is the strongest signal — it pulls the reader's
eye to the column before they read any cell content. Without it,
the 10% tint alone would be too subtle on a busy table.

## The 10% accent wash

```css
table[data-ve-table="compare"] .ve-col-emphasis {
  background: color-mix(in srgb,
    var(--vc-color-accent, #b8861f) 10%, transparent);
}
```

10% (not the 12% used by matrix and sort) because emphasis lights an
ENTIRE column — every cell, every row. A 12% wash would be visually
dominant; 10% reads as "subtly highlighted" without overpowering the
cell text. The two-pixel border supplies the strong signal; the wash
supplies the lane identity.

`color-mix(in srgb, T 10%, transparent)` means the cell shows the
underlying surface (the table's normal background) tinted 10% with
the accent token. A theme flip changes which token defines accent
— the same rules just resolve to the new theme's accent.

## Icon recoloring on the emphasis header

The header icon (the `data-ve-col-icon` glyph) gets the accent color
when its column is emphasised:

```css
table[data-ve-table="compare"] thead th .ve-col-icon {
  color: var(--vc-color-content-muted, #5b5343);
}
table[data-ve-table="compare"] thead th.ve-col-emphasis .ve-col-icon {
  color: var(--vc-color-accent, #b8861f);
}
```

The non-emphasised icons are muted (faint, sit beside the column
label as a glyph that says "this is an option"); the emphasised icon
is solid accent (loud, says "this is the option").

Use distinct glyphs for non-emphasised vs emphasised columns to
reinforce the rank — `○` (open circle) for the alternatives, `◆`
(filled diamond) for the recommended one. See
[icon-headers-unicode.md](../../amvcp-tables-cells-badges/references/icon-headers-unicode.md) for the
canonical icon set.

## The 2-column anti-pattern → fix variant

A 2-column "before / after" or "anti-pattern / fix" table is just
the N=2 case of `compare`. No new mode, no code branch:

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Aspect</th>
      <th scope="col" data-ve-col-icon="○">Anti-pattern</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">Fixed</th>
    </tr>
  </thead>
  ...
</table>
```

The "Fixed" column gets emphasis. Same tint, same border lane, same
icon recolor. See [sample-readability-dataset.md](
../../amvcp-tables-primitives/references/sample-readability-dataset.md) for a ready 15-row paste-in.

The 2-column case is so common that it has its own bundled sample,
but it has no separate mode — keeping the API surface small.

## Pairing emphasis with a deliberate row order

In a `compare` table, rows are **author-curated** — sorting is OFF
by default. This pairs with emphasis: the author selects both the
recommended COLUMN (emphasis) and the criterion ORDER (no sort).
A reader who clicks a row to sort wouldn't be able to anyway — the
table is not `data-ve-table="data"` so no sort wiring attaches.

If the author wants both sorting and emphasis, the trade-off is
explicit: switch to `data-ve-table="data"` and forfeit the compare
chrome (no icons, no emphasis column). The single-valued attribute
makes this a deliberate choice rather than an accidental conflict.

## Sample HTML — 3-column recommendation

```html
<table data-ve-table="compare" data-ve-table-csv="1">
  <thead>
    <tr>
      <th scope="col">Criterion</th>
      <th scope="col" data-ve-col-icon="○">Option A — DIY</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">Option B — Managed</th>
      <th scope="col" data-ve-col-icon="◇">Option C — Hybrid</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Setup time</th>
      <td>2 weeks</td>
      <td>2 days</td>
      <td>1 week</td>
    </tr>
    <tr>
      <th scope="row">Monthly cost</th>
      <td>$120</td>
      <td>$680</td>
      <td>$420</td>
    </tr>
    <tr>
      <th scope="row">On-call burden</th>
      <td>High (you + team)</td>
      <td>None (vendor SLA)</td>
      <td>Medium (split)</td>
    </tr>
    <tr>
      <th scope="row">Lock-in risk</th>
      <td>None</td>
      <td>Medium</td>
      <td>Low</td>
    </tr>
  </tbody>
</table>
```

Reads top-to-bottom: B has the highest monthly cost — but the
emphasis lane signals "still the recommended choice" because the
on-call burden ROI dominates. The author owns that judgement; the
table shows it.

## Sample HTML — 2-column before/after

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Metric</th>
      <th scope="col" data-ve-col-icon="○">Before</th>
      <th scope="col" data-ve-col-icon="◆"
          data-ve-col-emphasis="1">After</th>
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">p99 latency</th><td>1.4 s</td><td>180 ms</td></tr>
    <tr><th scope="row">Error rate</th><td>2.1%</td><td>0.12%</td></tr>
    <tr><th scope="row">Cost / req</th><td>$0.0042</td><td>$0.0019</td></tr>
  </tbody>
</table>
```

The "After" lane reads as the destination state — visually
foregrounded so the improvement is immediate.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-accent` | 10% column wash; 2px left/right borders; emphasised icon color |
| `--vc-color-content-muted` | non-emphasised icon color |

A theme toggle re-paints the entire emphasis lane (wash + borders +
icon) with no extra rules. The light fallback `#b8861f` is the
plugin's canonical light-theme accent; the dark theme's accent is
emitted by `amvcp-designmd.js`.

## Selection / comment / decision-mini notes

Comparison tables have a **dual** selection contract:
1. Every `<tr>` is a row-atom (`data-ve-comment-id="row:<tag>:<n>"`)
   — clicking outside any cell on the row's left edge selects the
   whole row. Use this to comment on "this criterion as a whole".
2. Every body `<td>` is an element-kind atom (`data-ve-id="compare-
   cell:<tag>:r<row>:c<col>"` + `data-ve-type="compare-cell"`) —
   clicking a cell selects that single cell. Use this to comment on
   "this specific option's value for this criterion".

The header `<th>` cells (including the emphasis header) are NOT
atoms — they have their own affordance (the icon, the emphasis
class). Stamping them as atoms would produce two overlapping click
affordances on the same target. The runtime's atom-paint events do
not paint header cells.

The decision-mini pill attaches to both row-atoms and cell-atoms,
so the reader can S/A/D a whole row OR a specific cell.

## CSV-export contract

Emphasis is a visual concern — it does NOT appear in the CSV. The
exported headers and cell values are the literal text; the
recommended column is no more "marked" in the CSV than any other
column.

The author who wants the CSV to carry the recommendation can put it
in the column header text (`Option B (recommended)`) — that string
exports verbatim. The visual emphasis serves the HTML reader; the
header text serves the spreadsheet importer.
