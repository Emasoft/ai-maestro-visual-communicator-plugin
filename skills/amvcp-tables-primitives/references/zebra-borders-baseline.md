# Zebra rows, borders, dividers — the runtime baseline

The styled-table baseline `amvcp-runtime.js` ships unconditionally —
cell borders, the `<thead>` divider, the 6% zebra tint, the wrapper
contract, the `overflow-wrap: anywhere` rule. This is what every
table inherits BEFORE the mode-specific module enhancement runs.

## Table of contents

- [What the baseline gives you](#what-the-baseline-gives-you)
- [The 1px cell border](#the-1px-cell-border)
- [The 2px `<thead>` divider](#the-2px-thead-divider)
- [Zebra striping — 6% tint on even body rows](#zebra-striping--6-tint-on-even-body-rows)
- [`<tr>`-as-selectable-atom](#tr-as-selectable-atom)
- [`overflow-wrap: anywhere` on cells](#overflow-wrap-anywhere-on-cells)
- [`display: table; overflow: visible` — the no-nested-scrollbars guard](#display-table-overflow-visible--the-no-nested-scrollbars-guard)
- [The `.ve-table-wrapper` hit-zone overlay](#the-ve-table-wrapper-hit-zone-overlay)
- [What the baseline does NOT do](#what-the-baseline-does-not-do)
- [The module's job — additive, never replacing](#the-modules-job--additive-never-replacing)
- [Sample HTML (with no mode opt-in)](#sample-html-with-no-mode-opt-in)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## What the baseline gives you

Even a plain `<table>` with NO `data-ve-table` attribute renders
nicely under `amvcp-runtime.js`:

| Feature | Provided by | When |
|---|---|---|
| 1px cell border | runtime CSS | always |
| 2px `<thead>` divider | runtime CSS | always |
| 6% zebra tint on even body rows | runtime CSS | always |
| `<tr>`-as-selectable-atom (3-state) | runtime JS | always (rows with `data-ve-id` or stamped by a module) |
| `overflow-wrap: anywhere` on cells | runtime CSS | always |
| `display: table; overflow: visible !important` | runtime CSS | always |
| `.ve-table-wrapper` hit-zone overlay | runtime JS | always (a per-table wrapper element) |

The author writes plain semantic HTML; the runtime turns it into a
styled, selectable table. The module adds sort / matrix / compare /
virtualization / CSV ON TOP.

## The 1px cell border

```css
table { border-collapse: collapse; }
td, th { border: 1px solid var(--vc-color-border, #e3dcc9); }
```

`border-collapse: collapse` shares borders between adjacent cells
(no 2px doubled lines at the boundary). The 1px solid border in
`--vc-color-border` is the lightest separator that still reads as a
cell boundary; flips to the dark-theme equivalent on theme toggle.

A `<th>` and a `<td>` get the same border — header cells are
visually distinct via the divider + background (see next section),
not via border weight.

## The 2px `<thead>` divider

```css
thead tr:last-child th {
  border-bottom: 2px solid var(--vc-color-border-strong, #c9bfa3);
  background: color-mix(in srgb,
    var(--vc-color-content, #1f1a14) 4%, transparent);
}
```

The header row's bottom border is 2px (vs 1px elsewhere) using
`--vc-color-border-strong` — a higher-contrast border that visually
separates header from body. Plus a 4% wash of `--vc-color-content`
giving the header a faint "sunken" tint.

The combination — bottom border + tint — makes the header read as a
distinct band. Without it, a stack of similar-weight rows blurs
together.

The `tr:last-child th` selector targets the last header row (so
multi-row headers get the divider only at their bottom edge — not
between sub-header rows of a grouped header).

## Zebra striping — 6% tint on even body rows

```css
tbody tr:nth-child(even) {
  background: color-mix(in srgb,
    var(--vc-color-content, #1f1a14) 6%, transparent);
}
```

Every other body row gets a 6% wash of `--vc-color-content`.
Subtle — not so loud it competes with the cell content; loud enough
to give the eye a horizontal-tracking guide across wide rows.

6% is the canonical zebra intensity (the same scale family as the
sort tint 8%, emphasis 10%, matrix 12% — the visual hierarchy is
intentional). Higher percentages start to feel "loud"; lower
percentages become invisible.

`tr:nth-child(even)` is body-row only (the rule is scoped under
`tbody`). The `<thead>` and `<tfoot>` rows do not get zebra.

## `<tr>`-as-selectable-atom

The runtime stamps every body `<tr>` with a `data-ve-id` (auto-
generated) or honours an author-provided one. The 3-state visual
contract:

1. **Normal** — no `data-ve-pressed`, no `data-ve-selected`.
2. **Hover + glow** — bright outer ring on `:hover` / `:focus-
   visible`.
3. **Pressed / selected** — `data-ve-pressed="1"` on the row;
   accent-tinted background.

The module's enhancements PRESERVE this contract:
- A sort moves the `<tr>` (see [row-move-not-clone.md](
  ../../amvcp-tables-special/references/row-move-not-clone.md)); the pressed state rides along.
- The matrix mode adds a per-cell `data-ve-id`; the per-row contract
  still works for any row whose body cells aren't themselves the
  primary atoms.
- The compare mode dual-stamps row AND cell — both contracts are
  active.

See [matrix-glyph-injection.md](../../amvcp-tables-matrix-compare/references/matrix-glyph-injection.md),
[comparison-emphasis-column.md](../../amvcp-tables-matrix-compare/references/comparison-emphasis-column.md), and
the runtime documentation for the full atom-contract spec.

## `overflow-wrap: anywhere` on cells

```css
td, th { overflow-wrap: anywhere; }
```

`overflow-wrap: anywhere` (CSS3 newer than `word-wrap: break-word`)
allows a cell to wrap at ANY character, including inside an
unbroken token. A cell with `https://very-long-domain.example.com/
deeply/nested/path/to/resource` wraps inside the URL rather than
forcing the cell wider.

The alternative — keeping URLs unwrapped — would force the table
column wider, which the no-nested-scrollbars rule would absorb by
extending the page (not by an inner scrollbar). Wrapping is a saner
default for prose-y cells.

For numeric cells, this rule is moot — numbers don't have long
unbroken tokens. For code-snippet cells, the author can opt-out
with a custom CSS class.

## `display: table; overflow: visible` — the no-nested-scrollbars guard

```css
table {
  display: table !important;
  overflow: visible !important;
}
.ve-table-wrapper, [data-ve-table-wrapper] {
  overflow: visible !important;
  max-width: none !important;
}
```

The `!important` modifiers enforce the no-nested-scrollbars rule
even against author CSS. A `<table style="display:block;overflow-x
:auto">` (the common "responsive table" anti-pattern) gets stripped:
the table reverts to `display:table; overflow:visible`. The page
widens; no inner scrollbar appears.

See [no-nested-scrollbars-rule.md](./no-nested-scrollbars-rule.md)
for the full rationale and the rule text.

## The `.ve-table-wrapper` hit-zone overlay

The runtime wraps every `<table>` in a `.ve-table-wrapper` div on
enhancement. The wrapper hosts the hit-zone handles:
- Row hit-zone (a transparent strip that captures clicks on the
  row's outer area, for selection).
- Column hit-zone (a transparent strip that captures clicks on the
  column header's outer area).

The wrapper is `position: relative` so the handles can be
absolutely-positioned children. The wrapper itself has
`overflow: visible` so it does NOT clip the handles even if they
extend slightly beyond the cell bounds.

The CSV-export wrap (`.ve-table-csv-wrap`, added by the module)
nests INSIDE the runtime wrapper or wraps the table directly — the
two layouts coexist. See [csv-export-rfc4180.md](
../../amvcp-tables-sort-virt/references/csv-export-rfc4180.md) for the CSV wrap shape.

## What the baseline does NOT do

The runtime baseline is intentionally minimal. It does NOT:

- **Sort.** Click-to-sort is the module's `data` mode.
- **Right-align numeric columns.** Same — `data` mode + numeric
  detection.
- **Virtualize.** Same — `data-ve-table-virtual="1"` opt-in.
- **Freeze columns.** Same — `data-ve-freeze-cols="N"`.
- **Inject status glyphs.** That's the `matrix` mode.
- **Emphasize a column.** That's the `compare` mode + emphasis attr.
- **Export to CSV.** That's the `data-ve-table-csv="1"` opt-in.

The baseline is "the table looks good"; the module is "the table is
interactive". An author who wants only good-looking tables can write
plain `<table>` and skip the module entirely.

## The module's job — additive, never replacing

`amvcp-tables.js` enhancements are ADDITIVE on top of the baseline.
The module:
- Injects sort arrows; the baseline still draws borders.
- Tints sorted columns; the baseline still zebras even rows.
- Stamps matrix glyphs; the baseline still draws cell borders around
  them.
- Freezes columns; the baseline still applies cell padding.
- Adds the CSV button; the baseline still wraps in
  `.ve-table-wrapper`.

The module never RE-IMPLEMENTS baseline features. If a third-party
table CSS library defined competing border / zebra rules, the
runtime's `!important` wins; the module doesn't fight that.

## Sample HTML (with no mode opt-in)

```html
<table>
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
    <tr><td>Americas</td><td>2,100,750</td><td>9.7</td></tr>
  </tbody>
</table>
```

Result: styled table with cell borders, header divider, zebra rows,
selectable `<tr>` atoms. NO sort arrows, NO numeric right-align, NO
CSV button (none of the mode opt-ins are present). This is the
baseline.

Adding `data-ve-table="data"` opt-in enhances it to a sortable
table; adding `data-ve-table-csv="1"` adds the CSV button. The
baseline doesn't change; the module composes on top.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-border` | 1px cell border |
| `--vc-color-border-strong` | 2px `<thead>` bottom divider |
| `--vc-color-content` | 4% header wash; 6% zebra tint (color-mix base) |
| `--vc-color-surface` | table background (implicit, inherited from `<body>`) |

A theme toggle re-paints every baseline visual via these tokens; no
second baseline stylesheet exists.

## Selection / comment / decision-mini notes

The baseline is what the runtime's atom contract attaches to. The
`<tr>` is the row atom; the runtime stamps `data-ve-id` and the
selection/comment/decision-mini contracts engage. The module's
enhancements preserve every contract — the sort moves nodes, the
matrix per-cell stamping adds element-kind atoms, the compare
dual-stamps. See per-mode references for details.
