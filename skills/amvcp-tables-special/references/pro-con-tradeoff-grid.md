# Pro / Con tradeoff sub-grid — colored dot + label rows

A compact 2-column "pros and cons" presentation: olive dot for Pro,
clay dot for Con, one bullet per row. Fits inside a card column or
beside a code panel — the canonical "this approach has these
upsides and these downsides" shape.

## Table of contents

- [The shape](#the-shape)
- [Why a table, not a `<ul>`](#why-a-table-not-a-ul)
- [Dot color = token, not literal hex](#dot-color--token-not-literal-hex)
- [Equal-width columns or content-fit](#equal-width-columns-or-content-fit)
- [Row count — keep it tight](#row-count--keep-it-tight)
- [Pairing with a code panel](#pairing-with-a-code-panel)
- [Accessibility — text + color](#accessibility--text--color)
- [Sample — 2-column pro/con beside a code panel](#sample--2-column-procon-beside-a-code-panel)
- [Sample — vertical pro-and-con (single column)](#sample--vertical-pro-and-con-single-column)
- [Sample — 3-column "Pros / Cons / Open questions"](#sample--3-column-pros--cons--open-questions)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The shape

```
┌──────────────────────────────┬──────────────────────────────┐
│   Pros                       │   Cons                       │
│ ● Fast time-to-value         │ ● Recurring cost             │
│ ● No infra to maintain       │ ● Vendor lock-in             │
│ ● 24/7 SLA                   │ ● Limited customisation      │
└──────────────────────────────┴──────────────────────────────┘
```

Two columns. Each cell holds one row's bullet. The dot color
encodes Pro (success token, often olive/green) vs Con (danger
token, often clay/red). The column header makes the categorisation
explicit; the dot reinforces it.

Often appears as a sub-grid INSIDE a card or beside a code snippet
— "this option's pros and cons, here in two compact columns
instead of a wall of prose".

## Why a table, not a `<ul>`

Two parallel `<ul>` lists in a CSS grid would also work:

```html
<div class="pro-con">
  <ul class="pros"><li>...</li><li>...</li></ul>
  <ul class="cons"><li>...</li><li>...</li></ul>
</div>
```

Both shapes are valid. The TABLE form is preferred when:
- The author wants row-aligned comparisons (Pro N corresponds to
  Con N — "this benefit is balanced by this cost"). Tables align
  rows; parallel lists don't.
- The author wants the runtime's atom contract (per-row selection,
  per-row comment, per-row decision-mini pill).
- The author wants CSV export (Pros / Cons as paired columns in a
  spreadsheet).

The `<ul>` form is preferred when:
- The pros and cons are NOT row-paired (any-pro vs any-con).
- The author wants screen-reader users to navigate as "two
  separate lists" rather than "a 2-column table".

This reference covers the table form.

## Dot color = token, not literal hex

```html
<td><span class="pro-dot" aria-hidden="true"></span> Fast time-to-value</td>
```

```css
.pro-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: 1px;
  background: var(--vc-color-success, #788C5D);   /* olive in HTML-effectiveness */
}
.con-dot {
  background: var(--vc-color-danger, #D97757);    /* clay in HTML-effectiveness */
}
```

The HTML-effectiveness reference palette uses olive (`#788C5D`) for
Pro and clay (`#D97757`) for Con. The plugin's DESIGN.md tokens
`--vc-color-success` and `--vc-color-danger` are the abstract
equivalents — different actual hex values per project, but the
semantic mapping is stable.

`--vc-color-success` and `--vc-color-danger` flip with the theme.
The olive in light becomes a brighter olive in dark; the clay in
light becomes a brighter clay in dark.

## Equal-width columns or content-fit

Two options:

```css
/* equal-width columns — symmetric look */
.pro-con-table { table-layout: fixed; width: 100%; }
.pro-con-table td { width: 50%; }
```

```css
/* content-fit columns — each side as wide as it needs */
.pro-con-table { table-layout: auto; }
```

Equal-width is the canonical default — the visual symmetry
reinforces the "two equally-weighted sides" balance. Content-fit is
appropriate when one side has much shorter labels (e.g. perf-cost
tradeoff: "fast" vs "expensive at scale due to ...").

Default to `table-layout: fixed; width: 100%; td { width: 50% }`
unless there's a specific reason for content-fit.

## Row count — keep it tight

3–6 rows per column is the sweet spot. Fewer, and the table looks
empty; more, and the reader stops scanning and starts skimming.

For 7+ pros and 7+ cons, the shape is wrong — break the comparison
into multiple smaller tradeoff grids (e.g. one for "performance
tradeoffs", one for "operational tradeoffs", one for "developer
ergonomics tradeoffs").

## Pairing with a code panel

The canonical use from `01-exploration-code-approaches`: place the
pro/con grid BESIDE a code snippet that demonstrates the approach.

```html
<div class="approach-card">
  <h3>Approach A — manual error handling</h3>
  <pre><code>try {
  await db.connect();
} catch (e) {
  if (e.code === 'ECONNREFUSED') { ... }
  else if (e.code === 'ETIMEDOUT') { ... }
  else { throw e; }
}</code></pre>
  <table class="pro-con-table">
    <thead>
      <tr><th scope="col">Pros</th><th scope="col">Cons</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="pro-dot" aria-hidden="true"></span> Explicit recovery</td>
        <td><span class="con-dot" aria-hidden="true"></span> Verbose at call site</td>
      </tr>
      <tr>
        <td><span class="pro-dot" aria-hidden="true"></span> No DSL to learn</td>
        <td><span class="con-dot" aria-hidden="true"></span> Easy to forget a branch</td>
      </tr>
    </tbody>
  </table>
</div>
```

The reader sees the CODE and the TRADEOFFS together; the snippet
shows "what" and the table shows "why this matters".

## Accessibility — text + color

The dot is `aria-hidden` (its color is the visual signal). The text
after it carries the actual content. Screen readers read the text
content of each cell, with the column header context ("Pros." +
"Fast time-to-value").

The column headers (`<th scope="col">Pros</th>`) are critical —
they're what the screen reader uses to disambiguate the columns.

For color-blind readers (deuteranopia, protanopia), the olive vs
clay can look identical. The column headers (Pros / Cons) and the
text content remain unambiguous. The dot is a peripheral-vision
cue, not the only channel.

## Sample — 2-column pro/con beside a code panel

```html
<div class="approach">
  <h3>Approach B — Result-type</h3>
  <pre><code>type Result&lt;T, E&gt; = { ok: true, value: T } | { ok: false, err: E };
const r = await db.connect();
if (!r.ok) handleError(r.err);</code></pre>
  <table class="pro-con-table">
    <thead>
      <tr>
        <th scope="col">Pros</th>
        <th scope="col">Cons</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="pro-dot" aria-hidden="true"></span> Compiler-enforced handling</td>
        <td><span class="con-dot" aria-hidden="true"></span> Requires a `Result` type alias</td>
      </tr>
      <tr>
        <td><span class="pro-dot" aria-hidden="true"></span> Exhaustive match</td>
        <td><span class="con-dot" aria-hidden="true"></span> Adds 4 lines per call site</td>
      </tr>
      <tr>
        <td><span class="pro-dot" aria-hidden="true"></span> Co-locates error type with success type</td>
        <td><span class="con-dot" aria-hidden="true"></span> Less familiar to JS-only readers</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Sample — vertical pro-and-con (single column)

When horizontal space is tight (sidebar, mobile), collapse to one
column. Use TWO `<tbody>` sections:

```html
<table class="pro-con-table">
  <tbody class="pros">
    <tr><th scope="row">Pros</th></tr>
    <tr><td><span class="pro-dot" aria-hidden="true"></span> Fast time-to-value</td></tr>
    <tr><td><span class="pro-dot" aria-hidden="true"></span> No infra to maintain</td></tr>
    <tr><td><span class="pro-dot" aria-hidden="true"></span> 24/7 SLA</td></tr>
  </tbody>
  <tbody class="cons">
    <tr><th scope="row">Cons</th></tr>
    <tr><td><span class="con-dot" aria-hidden="true"></span> Recurring cost</td></tr>
    <tr><td><span class="con-dot" aria-hidden="true"></span> Vendor lock-in</td></tr>
    <tr><td><span class="con-dot" aria-hidden="true"></span> Limited customisation</td></tr>
  </tbody>
</table>
```

Each `<tbody>` is its own section with its own heading row. The
runtime treats each row as selectable; the headers are themselves
selectable but they're scope="row" hints, not separate `<thead>`
rows.

## Sample — 3-column "Pros / Cons / Open questions"

For an exploration that hasn't yet resolved, add a third column for
unresolved questions:

```html
<table class="pro-con-table">
  <thead>
    <tr>
      <th scope="col">Pros</th>
      <th scope="col">Cons</th>
      <th scope="col">Open questions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="pro-dot" aria-hidden="true"></span> Cheap</td>
      <td><span class="con-dot" aria-hidden="true"></span> Sync only</td>
      <td><span class="q-dot" aria-hidden="true"></span> Can we batch the writes?</td>
    </tr>
  </tbody>
</table>
```

The `.q-dot` is `--vc-color-content-muted` (neutral) — distinct
from Pro and Con. Open questions don't fit the pro/con binary; the
third column captures them without forcing a judgment.

This is the pattern from `08-prototype-interaction` (the
"prototype + rationale + open questions" 3-panel layout, reframed
as a table).

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-success` | Pro dot background |
| `--vc-color-danger` | Con dot background |
| `--vc-color-content-muted` | Open-question dot background |

A theme toggle re-paints both dot colors via these tokens. The
visual hierarchy (success vs danger vs muted) preserves; the actual
hex values flip.

## Selection / comment / decision-mini notes

Each `<tr>` is a row-atom (`data-ve-comment-id="row:<tag>:<n>"`).
The reader can:
- Comment on a single row to argue against one specific pro/con
  pairing.
- Select multiple rows to comment on a thematic group.
- Use the decision-mini pill to S/A/D each row — useful for
  "approve this approach overall" workflows.

The dual-stamp contract from `compare` is NOT active here (this is
a `data` table or a plain table). To get per-cell granularity,
switch to `data-ve-table="compare"`.

## CSV-export contract

A 2-column pro/con exports as 2 fields per row:

```csv
Pros,Cons
"Fast time-to-value","Recurring cost"
"No infra to maintain","Vendor lock-in"
"24/7 SLA","Limited customisation"
```

The dots are NOT in the export (no text). The receiving spreadsheet
sees a normal 2-column table; the visual distinction of pro vs con
is encoded only in the column header. To preserve the dot color in
a tabular export, the author can add a third column ("type: pro" /
"type: con") — at the cost of the single-table compactness.
