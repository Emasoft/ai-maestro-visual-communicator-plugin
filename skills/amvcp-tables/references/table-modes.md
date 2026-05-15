# Table modes — HTML contract + attribute reference

The complete per-mode HTML contract for `amvcp-tables.js`. Author the
semantic markup below; the module injects all interactive chrome (sort
arrows, glyphs, icons, the CSV button, virtualization spacers). Never
hand-author that chrome.

## Table of contents

- [Baseline — what the runtime already gives you](#baseline--what-the-runtime-already-gives-you)
- [Mode `data` — sortable data table](#mode-data--sortable-data-table)
- [Mode `matrix` — coverage / checklist grid](#mode-matrix--coverage--checklist-grid)
- [Mode `compare` — side-by-side comparison](#mode-compare--side-by-side-comparison)
- [Big-data add-on — virtualization](#big-data-add-on--virtualization)
- [CSV add-on](#csv-add-on)
- [Full `data-ve-*` attribute reference](#full-data-ve--attribute-reference)
- [Selection — rows stay selectable atoms](#selection--rows-stay-selectable-atoms)

---

## Baseline — what the runtime already gives you

`amvcp-runtime.js` ships a styled-table baseline that this skill builds
ON TOP of and never re-implements:

1. **Styled tables** — `border-collapse`, 1px cell borders, a 2px
   `<thead>` bottom divider with a sunken background, a 6% zebra tint on
   even rows, `overflow-wrap:anywhere` on cells.
2. **`<tr>`-as-selectable-atom** — every `<tr data-ve-id>` is a 3-state
   selectable atom (normal / hover+glow / pressed). A sort re-orders the
   underlying `<tr>` nodes *in place*, so `data-ve-id`,
   `data-ve-comment-id`, `data-ve-pressed` and any listeners ride along
   with the node.
3. **No-nested-scrollbars** — the runtime forces `display:table` and
   `overflow:visible` on tables and `[data-ve-table-wrapper]`. A wide or
   tall table extends the page; there is never an inner scrollbox. The
   big-data mode honours this with window-scroll virtualization.

You do not opt into the baseline — it is always on. You opt into the
five enhanced modes with the `data-ve-table` attribute.

---

## Mode `data` — sortable data table

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
  </tbody>
</table>
```

- `data-ve-table="data"` is the opt-in. Without it the table keeps only
  the static baseline (no sort wiring).
- The module injects a sort arrow into each sortable `<th>`, detects
  numeric columns lazily on the first click, right-aligns numeric
  columns, and cycles `none → asc → desc → none` on click / Enter /
  Space.
- `<th data-ve-nosort>` makes one header inert (e.g. an actions column).
- `<tr data-ve-table-nosort>` pins a totals/footer row — it is excluded
  from the sort.
- Numbers may carry `,` thousands separators, one leading `$ € £ ¥`, or
  a trailing `%`.

---

## Mode `matrix` — coverage / checklist grid

```html
<table data-ve-table="matrix">
  <thead>
    <tr>
      <th scope="col">Component</th>
      <th scope="col">Light</th><th scope="col">Dark</th>
      <th scope="col">Mobile</th><th scope="col">RTL</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Button</th>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="pass"></td>
      <td data-ve-val="partial"></td>
    </tr>
  </tbody>
</table>
```

- `data-ve-table="matrix"` is the mode marker.
- Each body cell carries `data-ve-val` ∈ `{pass, fail, partial, na}` and
  is left **empty** — the module prepends the glyph (`✓ ✗ ◐ —`), a
  visually-hidden word, and an `aria-label`.
- The leading cell of each row is `<th scope="row">` — a real header so
  screen readers announce both the row item and the column criterion.
- `na` ("not applicable") renders a dim `—`.
- Optional `<tfoot>` per-column `P/F/~` summary: add
  `data-ve-matrix-summary` to the `<table>` and a `<tfoot>` row with one
  empty cell per column.
- Sorting is NOT offered on a matrix (sorting glyph columns is rarely
  meaningful) — a matrix table is not `data-ve-table="data"`.

---

## Mode `compare` — side-by-side comparison

```html
<table data-ve-table="compare">
  <thead>
    <tr>
      <th scope="col">Criterion</th>
      <th scope="col" data-ve-col-icon="◇">Option A</th>
      <th scope="col" data-ve-col-icon="◆" data-ve-col-emphasis="1">Option B</th>
      <th scope="col" data-ve-col-icon="○">Option C</th>
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">Setup cost</th><td>Low</td><td>Medium</td><td>High</td></tr>
  </tbody>
</table>
```

- `data-ve-table="compare"` is the mode marker.
- Each option `<th>` carries `data-ve-col-icon="<glyph>"` — a Unicode
  mark (NEVER emoji); the module renders it before the label. The first
  column ("Criterion") is the row-label column and has no icon.
- **Zero or one** column may carry `data-ve-col-emphasis="1"` — the
  recommended/after/winner column, given an accent-tinted lane.
- Body rows lead with `<th scope="row">` (the criterion name).
- Sorting is off by default — the row order is author-curated. To also
  allow sorting, set `data-ve-table="data"` instead of `"compare"`; the
  attribute is single-valued, so a compare table that needs sorting uses
  the `data` mode and forfeits the compare chrome (icons/emphasis).

---

## Big-data add-on — virtualization

```html
<table data-ve-table="data"
       data-ve-table-virtual="1"
       data-ve-freeze-cols="1">
  <thead><tr><th scope="col">ID</th><th scope="col">Name</th> … </tr></thead>
  <tbody>
    <!-- N rows authored normally; the module virtualizes them -->
  </tbody>
</table>
```

- `data-ve-table-virtual="1"` opts a `data` table into virtualization —
  only the visible-window rows live in the DOM, the rest are held in a
  JS array. It is never automatic (virtualization has tradeoffs:
  find-in-page sees only rendered rows).
- `data-ve-freeze-cols="N"` freezes the first N columns (sticky-left).
- The header row freezes automatically when virtualization is on.
- `data-ve-table-viewport="<px>"` is reserved for a future explicit
  window height; the default derives from the live viewport.
- See `sortable-and-bigdata.md` for the no-nested-scrollbars design.

---

## CSV add-on

- `data-ve-table-csv="1"` on any `data` / `matrix` / `compare` table
  injects a top-right "Copy CSV" button. RFC-4180 quoted; matrix cells
  export the word (`Pass`/`Fail`/…), not the glyph. Clipboard only — no
  file download.

---

## Full `data-ve-*` attribute reference

| Attribute | On | Effect |
|---|---|---|
| `data-ve-table="data"` | `<table>` | sortable data table |
| `data-ve-table="matrix"` | `<table>` | coverage / checklist grid |
| `data-ve-table="compare"` | `<table>` | side-by-side comparison |
| `data-ve-table-virtual="1"` | `<table>` (with `data`) | window-scroll virtualization |
| `data-ve-freeze-cols="N"` | `<table>` (with virtual) | freeze the first N columns |
| `data-ve-table-csv="1"` | `<table>` | inject the Copy-CSV button |
| `data-ve-matrix-summary` | `<table>` (matrix) | fill a `<tfoot>` P/F/~ summary |
| `data-ve-nosort` | `<th>` | make one column header inert |
| `data-ve-table-nosort` | `<tr>` | pin a row (excluded from sort) |
| `data-ve-val="pass\|fail\|partial\|na"` | `<td>` (matrix) | status-glyph cell |
| `data-ve-col-icon="<glyph>"` | `<th>` (compare) | icon before the header label |
| `data-ve-col-emphasis="1"` | `<th>` (compare) | accent-tinted lane (max one) |

Module-injected (do NOT hand-author): `.ve-sort-arrow`,
`aria-sort`, `data-ve-sortable`, `.ve-matrix-glyph`, `.ve-tables-sr-only`,
`.ve-col-icon`, `.ve-col-emphasis`, `.ve-col-frozen`, `.ve-cell-num`,
`.ve-col-sorted`, `tr[data-ve-table-spacer]`, `.ve-table-csv-btn`.

---

## Selection — rows stay selectable atoms

A sort MOVES the `<tr>` nodes (`appendChild` on an attached node is a
move, not a copy) — so `data-ve-id`, `data-ve-comment-id`,
`data-ve-pressed` and listeners survive. Selection is positional: the
selection payload records the resolved row at selection time. **Sorting
before selecting is fine; sorting after selecting keeps the
already-recorded rows.** No selection-payload schema change.
