---
name: amvcp-tables-sort-virt
description: "Sortable tables, big-data virtualization, sort cycles, natural string sort, numeric cell parser, frozen sticky columns, CSV export RFC-4180. Use when adding sort/virtualization/CSV-export to a table. Trigger with 'sortable table', 'virtualized table', 'sort cycle', 'natural sort', 'numeric cell parser', 'frozen columns', 'CSV export', 'RFC 4180'."
license: MIT
compatibility: "Any modern browser. Requires scripts/amvcp-tables.js. No npm runtime dependency."
metadata:
  author: Emasoft
---

# Tables Sort + Virtualization

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling table skills:** [amvcp-tables](../amvcp-tables/SKILL.md) (router) · [amvcp-tables-primitives](../amvcp-tables-primitives/SKILL.md) · [amvcp-tables-sort-virt](../amvcp-tables-sort-virt/SKILL.md) · [amvcp-tables-matrix-compare](../amvcp-tables-matrix-compare/SKILL.md) · [amvcp-tables-cells-badges](../amvcp-tables-cells-badges/SKILL.md) · [amvcp-tables-special](../amvcp-tables-special/SKILL.md).

## Overview

Sort + virtualization + export: a 3-state sort cycle (asc/desc/none), natural-order string sort, numeric cell parser, sortable + big-data table modes, virtualization with window-scroll for 1000+ rows, frozen sticky columns, and CSV export per RFC-4180.

## Prerequisites

- `scripts/amvcp-tables.js` loaded next to the HTML.
- Modern browser. No npm dependency.

## Instructions

1. **Make table sortable** — [sortable-and-bigdata.md](./references/sortable-and-bigdata.md).
 > Sort — numeric detection · Sort — the 3-state cycle · Sort — moving nodes, not cloning them · Sort — stability · Sort — spanning-cell safety · Big-data — the no-nested-scrollbars reconciliation · Big-data — row-height measurement · Big-data — the visible window · Big-data — scroll-anchor · Big-data — shrink-wrap (dropped, intentionally)
2. **Virtualize 1000+ row tables** — [virtualization-window-scroll.md](./references/virtualization-window-scroll.md).
 > Why this is hard · The conventional approach — and why we reject it · Window-scroll virtualization — the design · Two spacer rows reserve the page height · Row-height measurement — sample + median · `computeVirtualWindow()` — visible-row math · The scroll listener — passive + rAF-throttled · `requestAnimationFrame` read/write discipline · Find-in-page caveat · Print caveat · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
3. **Implement 3-state sort cycle** — [sort-cycle-3-state.md](./references/sort-cycle-3-state.md).
 > Why three states, not two · The cycle table · State lives on the `<table>`, not the column · Single-active-column rule · Restoring authored order — the snapshot · Sort arrow glyphs and CSS hooks · Keyboard contract · `aria-sort` contract · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
4. **Natural string sort** — [string-sort-natural-order.md](./references/string-sort-natural-order.md).
 > What "natural" means here · The comparator · `numeric: true` — embedded numbers sort numerically · `sensitivity: 'base'` — accents are equal · `undefined` locale — uses the runtime's locale · Case sensitivity — case is also ignored · Empty strings sort first in `asc` · Stability tie-break · Sample — version strings · Sample — file paths · Sample — mixed currency text · When `localeCompare` is wrong · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
5. **Numeric cell parser** — [numeric-cell-parser.md](./references/numeric-cell-parser.md).
 > Why auto-detect · The grammar — what counts as a number · `parseCellNumber()` — the exact rules · Detection — one click per column, lazy + cached · The all-empty trap · Mixed columns are string-sorted · Authoring contract — do not pre-strip · Sample HTML — author exactly this · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
6. **Freeze sticky columns** — [frozen-columns-sticky.md](./references/frozen-columns-sticky.md).
 > Why frozen columns matter · `position: sticky` needs no container · The grid-aware column lookup · Cumulative `left` offsets — one read pass, one write pass · Opaque background — the bleed-through trap · `z-index` layering — header beats body, frozen beats non-frozen · The freeze-edge divider · `<thead>` sticky-top stacking · Author contract — what you write · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
7. **Export to CSV (RFC-4180)** — [csv-export-rfc4180.md](./references/csv-export-rfc4180.md).
 > Opt-in via one attribute · RFC 4180 — the quoting rules · `tableToCsv()` — the grid walk · Spanning cells in the CSV — emit at origin · Header row stripping — `↕` does not export · Matrix cells export the WORD, not the glyph · Numeric cells export the displayed text · Whitespace collapsing · CRLF line endings · Clipboard API + execCommand fallback · Why not a file download · Why no Excel export · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes

## Output

A themed, atom-stamped table whose rows/cells participate in the standard `data-ve-id` / decision-pill contract. Theme-orthogonal: works correctly in BOTH light and dark.

## Error Handling

| Symptom | Fix |
|---|---|
| Table renders but JS doesn't enhance it | Confirm `amvcp-tables.js` is loaded and the table has `data-ve-table="data"`. |
| Sticky / frozen column doesn't stick | Verify `position: sticky` ancestor isn't `overflow: hidden`. |
| Sort doesn't fire | Confirm the table has `data-ve-table="data"` and `amvcp-tables.js` is loaded before DOM-ready. Numeric sort is auto-detected per column; opt a column out with `data-ve-nosort` on its `<th>`. |

## Examples

`data-ve-table="data"` makes every header sortable (numeric auto-detected per column); `data-ve-table-csv` adds the copy-as-CSV affordance:

```html
<table data-ve-table="data" data-ve-table-csv>
  <thead><tr><th>N</th></tr></thead>
  <tbody><tr><td>1.5</td></tr></tbody>
</table>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

Per-skill: see Resources. Some siblings support readonly only; some support form/edit (per-cell-decision-pill in particular implements the 3-state contract from R20-R23).

## Composability

Tables compose freely with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling table skills (core + sort-virt + matrix-compare + cells-badges + special).

## Resources

- [csv-export-rfc4180.md](./references/csv-export-rfc4180.md)
 > Opt-in via one attribute · RFC 4180 — the quoting rules · `tableToCsv()` — the grid walk · Spanning cells in the CSV — emit at origin · Header row stripping — `↕` does not export · Matrix cells export the WORD, not the glyph · Numeric cells export the displayed text · Whitespace collapsing · CRLF line endings · Clipboard API + execCommand fallback · Why not a file download · Why no Excel export · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [frozen-columns-sticky.md](./references/frozen-columns-sticky.md)
 > Why frozen columns matter · `position: sticky` needs no container · The grid-aware column lookup · Cumulative `left` offsets — one read pass, one write pass · Opaque background — the bleed-through trap · `z-index` layering — header beats body, frozen beats non-frozen · The freeze-edge divider · `<thead>` sticky-top stacking · Author contract — what you write · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [numeric-cell-parser.md](./references/numeric-cell-parser.md)
 > Why auto-detect · The grammar — what counts as a number · `parseCellNumber()` — the exact rules · Detection — one click per column, lazy + cached · The all-empty trap · Mixed columns are string-sorted · Authoring contract — do not pre-strip · Sample HTML — author exactly this · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [sort-cycle-3-state.md](./references/sort-cycle-3-state.md)
 > Why three states, not two · The cycle table · State lives on the `<table>`, not the column · Single-active-column rule · Restoring authored order — the snapshot · Sort arrow glyphs and CSS hooks · Keyboard contract · `aria-sort` contract · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [sortable-and-bigdata.md](./references/sortable-and-bigdata.md)
 > Sort — numeric detection · Sort — the 3-state cycle · Sort — moving nodes, not cloning them · Sort — stability · Sort — spanning-cell safety · Big-data — the no-nested-scrollbars reconciliation · Big-data — row-height measurement · Big-data — the visible window · Big-data — scroll-anchor · Big-data — shrink-wrap (dropped, intentionally)
- [string-sort-natural-order.md](./references/string-sort-natural-order.md)
 > What "natural" means here · The comparator · `numeric: true` — embedded numbers sort numerically · `sensitivity: 'base'` — accents are equal · `undefined` locale — uses the runtime's locale · Case sensitivity — case is also ignored · Empty strings sort first in `asc` · Stability tie-break · Sample — version strings · Sample — file paths · Sample — mixed currency text · When `localeCompare` is wrong · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [virtualization-window-scroll.md](./references/virtualization-window-scroll.md)
 > Why this is hard · The conventional approach — and why we reject it · Window-scroll virtualization — the design · Two spacer rows reserve the page height · Row-height measurement — sample + median · `computeVirtualWindow()` — visible-row math · The scroll listener — passive + rAF-throttled · `requestAnimationFrame` read/write discipline · Find-in-page caveat · Print caveat · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
