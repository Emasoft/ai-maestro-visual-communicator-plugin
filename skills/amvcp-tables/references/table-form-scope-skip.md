# Table-form scope skip — `amvcp-choice-tables` boundary

How `amvcp-tables.js` cleanly co-exists with the OTHER table-
processing skill in the plugin: `amvcp-choice-tables` owns the
"question form" tables (radio-button rows, multi-select checkboxes,
submit payloads); this module skips them. The single-attribute
contract that makes the boundary explicit.

## Table of contents

- [The two table skills](#the-two-table-skills)
- [The boundary attribute — `data-ve-type="table-form"`](#the-boundary-attribute--data-ve-typetable-form)
- [How the skip works](#how-the-skip-works)
- [Why two skills, not one](#why-two-skills-not-one)
- [What the runtime / choice-tables owns](#what-the-runtime--choice-tables-owns)
- [What this module owns](#what-this-module-owns)
- [Tables WITHIN a table-form scope are also skipped](#tables-within-a-table-form-scope-are-also-skipped)
- [Why scope-walking is necessary](#why-scope-walking-is-necessary)
- [Sample — table-form table (NOT handled by this module)](#sample--table-form-table-not-handled-by-this-module)
- [Sample — adjacent tables, mixed ownership](#sample--adjacent-tables-mixed-ownership)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## The two table skills

| Skill | Owns | Trigger |
|---|---|---|
| `amvcp-choice-tables` | "question" tables with radio/checkbox rows; the form-style table that the reader submits a choice on | `<table data-ve-type="table-form">` |
| `amvcp-tables` (this) | data / matrix / compare / virtualization / CSV — the "reportable" tables | `<table data-ve-table="data\|matrix\|compare">` |

Both skills enhance `<table>` elements. Both inject CSS. Both stamp
selectable atoms. They MUST not conflict — if a single table fell
under both, the reader would get two competing affordances on the
same DOM.

The boundary is one attribute on the `<table>`:
`data-ve-type="table-form"` puts the table in choice-tables'
scope; the absence of that attribute puts it in this module's scope.
The two attribute namespaces (`data-ve-type` vs `data-ve-table`)
never overlap — a table is one or the other, never both.

## The boundary attribute — `data-ve-type="table-form"`

`amvcp-choice-tables` recognises:

```html
<table data-ve-type="table-form" data-ve-mode="single">
  ...
</table>
```

…and enhances it as a single-choice form. The runtime AND
`amvcp-choice-tables` together inject the radio-glyph column, wire
the submit handler, and produce the `table-form` payload.

`amvcp-tables.js` recognises:

```html
<table data-ve-table="data">    or  matrix  or  compare
  ...
</table>
```

…and enhances it as a sort/matrix/compare table. The two attribute
families don't collide; each module reads only its own.

## How the skip works

`amvcp-tables.js`'s `isTableFormScope(table)` checks the table AND
its ancestors:

```js
function isTableFormScope(table) {
  if (table.getAttribute &&
      table.getAttribute('data-ve-type') === 'table-form') {
    return true;
  }
  var n = table.parentNode;
  while (n) {
    if (n.getAttribute &&
        n.getAttribute('data-ve-type') === 'table-form') {
      return true;
    }
    n = n.parentNode;
  }
  return false;
}
```

The check has two parts:
1. **Direct check** — is THIS table itself a `data-ve-type=
   "table-form"`? If yes, skip.
2. **Ancestor check** — is this table NESTED inside a
   `data-ve-type="table-form"` element? If yes, skip.

The ancestor check matters for nested tables (rare but possible) —
a `<table data-ve-table="data">` inside a `<div data-ve-type=
"table-form">` would be skipped, because the outer scope is
choice-tables' territory.

The `init()` loop applies the check before enhancement:

```js
for (var i = 0; i < tables.length; i++) {
  var table = tables[i];
  if (isTableFormScope(table)) continue;  // ← skipped
  ...
}
```

A `continue` — not an `else` — so the loop moves on without
investing in any per-mode work.

## Why two skills, not one

A single mega-skill that handled both "question forms" AND "data
tables" would be:
- Larger surface area (every change affects both).
- Harder to test (the mode-specific tests pollute each other).
- Confusing to authors (one attribute family with too many values).
- Slower to load (one big JS file for either use case).

The two-skill split lets each skill focus on its semantic core. The
`<table>` element is the shared substrate; the
`data-ve-type` vs `data-ve-table` attributes are the
disambiguators.

## What the runtime / choice-tables owns

The runtime ships the baseline (border, zebra, header divider,
selection contract, no-nested-scrollbars). `amvcp-choice-tables`
adds on top of that for `data-ve-type="table-form"` tables:
- Radio / checkbox glyph column injected at the leading cell of
  each body row.
- Single-select OR multi-select mode (`data-ve-mode="single"` or
  `"multi"`).
- A "submit" affordance — clicking the button posts a
  `table-form` payload to the runtime.
- Per-row click semantics — clicking a body row toggles its
  selection in the form.

These are FORM behaviours, not DATA behaviours. They are correct for
"answer a question by picking one row"; wrong for "view a sortable
data table".

## What this module owns

`amvcp-tables.js` adds on top of the runtime baseline for
`data-ve-table="data|matrix|compare"` tables:
- Sort headers (data mode).
- Numeric auto-detection (data mode).
- Window-scroll virtualization (data + virtual).
- Frozen columns (data + virtual + freeze-cols).
- Matrix status glyphs (matrix mode).
- Comparison emphasis lane (compare mode).
- Comparison icon headers (compare mode).
- CSV export button (all modes + csv opt-in).
- Decision-mini pill bridge (all modes).

These are DATA-PRESENTATION behaviours. They are correct for
"present a table the reader reads / sorts / exports"; wrong for
"answer a question by picking one row".

## Tables WITHIN a table-form scope are also skipped

A `data-ve-table="data"` table NESTED inside a
`data-ve-type="table-form"` element is also skipped:

```html
<div data-ve-type="table-form" data-ve-mode="single">
  <p>Pick one option:</p>
  <table data-ve-table="data">    <!-- nested — also skipped -->
    ...
  </table>
</div>
```

The ancestor walk in `isTableFormScope` catches this. The author's
intent was probably accidental (forgot to remove the outer
`data-ve-type` when refactoring); the skip prevents a confusing
double-enhancement.

If the author truly wants a sortable table inside a form's prose,
they should remove the `data-ve-type` from the outer container
(making it a regular div, not a form scope).

## Why scope-walking is necessary

Direct-attribute check ALONE would miss the nested case. Ancestor-
walk catches it. The walk is O(depth) — typically very shallow
(2-4 levels) in a real document; not a performance concern.

The walk stops at the document root (`n` becomes `null` when
walking off the top of the DOM). No infinite loop possible.

## Sample — table-form table (NOT handled by this module)

```html
<table data-ve-type="table-form" data-ve-mode="single"
       data-ve-form-id="design-direction">
  <thead>
    <tr><th>Direction</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td>Minimal</td><td>Strip everything not essential</td></tr>
    <tr><td>Maximalist</td><td>More callouts, more color, more decoration</td></tr>
    <tr><td>Editorial</td><td>Serif headings + generous whitespace</td></tr>
  </tbody>
</table>
```

This table is owned by `amvcp-choice-tables`. It gets:
- A radio glyph (•) in front of each row.
- One-and-only-one selection semantics (single-mode).
- A submit handler that posts `{form: 'design-direction', choice:
  '<row>'}` to the runtime.

`amvcp-tables.js` skips it entirely. Sort wiring is NOT injected.
The CSV button is NOT added (would be confusing on a form). The
matrix glyph injection does NOT run (no matrix mode here).

## Sample — adjacent tables, mixed ownership

```html
<section>
  <h3>Pick a chart type</h3>
  <table data-ve-type="table-form" data-ve-mode="single"
         data-ve-form-id="chart-type">
    <thead><tr><th>Type</th><th>When</th></tr></thead>
    <tbody>
      <tr><td>Bar</td><td>Categorical comparisons</td></tr>
      <tr><td>Line</td><td>Trends over time</td></tr>
      <tr><td>Scatter</td><td>Correlation between two variables</td></tr>
    </tbody>
  </table>

  <h3>Recent chart performance</h3>
  <table data-ve-table="data" data-ve-table-csv="1">
    <thead>
      <tr>
        <th scope="col">Chart</th>
        <th scope="col">Render (ms)</th>
        <th scope="col">Re-render (ms)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Q1 bar</td><td>120</td><td>32</td></tr>
      <tr><td>Q2 line</td><td>180</td><td>48</td></tr>
      <tr><td>Q3 scatter</td><td>240</td><td>62</td></tr>
    </tbody>
  </table>
</section>
```

Two adjacent tables in the same section. The first is owned by
`amvcp-choice-tables` (the reader picks one chart type); the second
is owned by `amvcp-tables` (the reader sorts the perf data). Each
table gets its appropriate affordances; no conflict.

## DESIGN.md tokens consumed

None — this is a routing concern, not a visual one. Both skills
consume the same `--vc-*` tokens; the runtime ensures cross-skill
consistency.

## Selection / comment / decision-mini notes

A table-form table's selection / comment / decision-mini contracts
are owned by `amvcp-choice-tables` + the runtime — they implement
the "single-select" or "multi-select" semantics. `amvcp-tables.js`
does not stamp `data-ve-comment-id` on table-form rows (the choice
table has its own stamping pass that follows the form's
semantics).

This module's atom stamping (`stampRowAtoms`, etc.) runs only on
non-form tables — `isTableFormScope` guards it. No double-stamping;
no conflict; clean ownership.
