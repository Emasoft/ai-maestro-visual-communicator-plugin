---
name: amvcp-tables-matrix-compare
description: "Matrix tables (N items x M criteria with pass/fail/partial), comparison tables (N-way option compare), matrix glyphs (check/cross/dot), matrix summary footer, coverage audit pattern, comparison emphasis column, decision matrix. Use when scaffolding comparison/matrix tables. Trigger with 'matrix table', 'comparison table', 'coverage matrix', 'decision matrix', 'matrix glyph', 'matrix summary footer', 'comparison emphasis'."
license: MIT
compatibility: "Any modern browser. Requires scripts/amvcp-tables.js. No npm runtime dependency."
metadata:
  author: Emasoft
---

# Tables Matrix + Compare

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling table skills:** [amvcp-tables](../amvcp-tables/SKILL.md) (router) · [amvcp-tables-primitives](../amvcp-tables-primitives/SKILL.md) · [amvcp-tables-sort-virt](../amvcp-tables-sort-virt/SKILL.md) · [amvcp-tables-matrix-compare](../amvcp-tables-matrix-compare/SKILL.md) · [amvcp-tables-cells-badges](../amvcp-tables-cells-badges/SKILL.md) · [amvcp-tables-special](../amvcp-tables-special/SKILL.md).

## Overview

Matrix + comparison tables: N items x M criteria with pass/fail/partial glyphs, N-way option comparison, matrix summary footer with aggregates, coverage audit pattern, comparison emphasis column (highlight the winner), and decision matrix scaffold.

## Prerequisites

- `scripts/amvcp-tables.js` loaded next to the HTML.
- Modern browser. No npm dependency.

## Instructions

1. **Scaffold a matrix or comparison table** — [matrix-and-comparison.md](./references/matrix-and-comparison.md).
 > Matrix — the `data-ve-val` grammar · Matrix — glyph injection + accessibility · Matrix — cell tint · Matrix — optional column summary · Comparison — icon headers · Comparison — the emphasis column · Comparison — the 2-column anti-pattern variant · Theming — light + dark by construction
2. **Inject matrix glyphs** (check / cross / dot) — [matrix-glyph-injection.md](./references/matrix-glyph-injection.md).
 > The four allowed values · Why Unicode geometric marks, not emoji · The injection — glyph + sr-only word + aria-label · The `.ve-tables-sr-only` clip pattern · Cell-tint colors come from DESIGN.md tokens · The 12% tint — faint, never drowning · `na` — "not applicable" reads as a dim dash · Unknown values are left untouched · Combining glyph + author text · Why `<th scope="row">` on the leading cell · Idempotent re-init · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
3. **Add matrix summary footer** — [matrix-summary-footer.md](./references/matrix-summary-footer.md).
 > Why a column summary · Opt-in via the table attribute · The `<tfoot>` row contract · The counting algorithm — grid-walked · Format — `P/F/~` · `na` cells are excluded from the count · A column with zero ratable cells is left blank · The leading footer cell — author owns its content · Sample HTML · Customising the count format · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
4. **Coverage audit pattern** — [coverage-audit-pattern.md](./references/coverage-audit-pattern.md).
 > The shape · Choosing rows and columns · Cell content discipline — never speculate · Empty vs `na` — the meaningful distinction · Combining glyph + context · `<th scope="row">` is mandatory · Group rows by semantic family · Use the summary footer for column verdicts · Sample — design-system component audit · Sample — accessibility WCAG checklist · Sample — cross-browser compatibility · Anti-patterns · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
5. **Comparison emphasis column** — [comparison-emphasis-column.md](./references/comparison-emphasis-column.md).
 > What the emphasis column communicates · The `data-ve-col-emphasis` attribute · Zero or one — never two · The two-column emphasis warning — fail-fast, console.warn · How the tint is applied — grid-walked column · The accent border-left + border-right · The 10% accent wash · Icon recoloring on the emphasis header · The 2-column anti-pattern → fix variant · Pairing emphasis with a deliberate row order · Sample HTML — 3-column recommendation · Sample HTML — 2-column before/after · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
6. **Decision matrix scaffold** — [decision-matrix-pattern.md](./references/decision-matrix-pattern.md).
 > The shape · Distinct from a coverage matrix · Distinct from a compare table · Rows are conditions; columns are properties of the outcome · The "default fallback" row · Inline `<code>` for technical conditions · Sample — chart-type decision matrix · Sample — HTTP status response matrix · Sample — sort tie-break decision matrix · Sample — error handling matrix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract

## Output

A themed, atom-stamped table whose rows/cells participate in the standard `data-ve-id` / decision-pill contract. Theme-orthogonal: works correctly in BOTH light and dark.

## Error Handling

| Symptom | Fix |
|---|---|
| Table renders but JS doesn't enhance it | Confirm `amvcp-tables.js` is loaded and the table has `data-ve-table="matrix"` (or `"compare"`). |
| Glyph doesn't appear in a matrix cell | Confirm the `<td>` has `data-ve-val="pass\|fail\|partial\|na"` — only those four values inject a glyph; unknown values are left untouched. |
| Emphasis column not highlighted | Confirm `data-ve-col-emphasis` is on exactly one `<th>` — two emphasis columns trigger a `console.warn` and neither is applied. |

## Examples

`data-ve-table="matrix"` enhances each `<td data-ve-val="…">` into a glyph + screen-reader word. Allowed values: `pass` / `fail` / `partial` / `na`:

```html
<table data-ve-table="matrix">
  <thead><tr><th>Item</th><th>A11y</th><th>Perf</th></tr></thead>
  <tbody><tr><th scope="row">X</th><td data-ve-val="pass"></td><td data-ve-val="partial"></td></tr></tbody>
</table>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

Per-skill: see Resources. Some siblings support readonly only; some support form/edit (per-cell-decision-pill in particular implements the 3-state contract from R20-R23).

## Composability

Tables compose freely with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling table skills (core + sort-virt + matrix-compare + cells-badges + special).

## Resources

- [comparison-emphasis-column.md](./references/comparison-emphasis-column.md)
 > What the emphasis column communicates · The `data-ve-col-emphasis` attribute · Zero or one — never two · The two-column emphasis warning — fail-fast, console.warn · How the tint is applied — grid-walked column · The accent border-left + border-right · The 10% accent wash · Icon recoloring on the emphasis header · The 2-column anti-pattern → fix variant · Pairing emphasis with a deliberate row order · Sample HTML — 3-column recommendation · Sample HTML — 2-column before/after · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [coverage-audit-pattern.md](./references/coverage-audit-pattern.md)
 > The shape · Choosing rows and columns · Cell content discipline — never speculate · Empty vs `na` — the meaningful distinction · Combining glyph + context · `<th scope="row">` is mandatory · Group rows by semantic family · Use the summary footer for column verdicts · Sample — design-system component audit · Sample — accessibility WCAG checklist · Sample — cross-browser compatibility · Anti-patterns · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [decision-matrix-pattern.md](./references/decision-matrix-pattern.md)
 > The shape · Distinct from a coverage matrix · Distinct from a compare table · Rows are conditions; columns are properties of the outcome · The "default fallback" row · Inline `<code>` for technical conditions · Sample — chart-type decision matrix · Sample — HTTP status response matrix · Sample — sort tie-break decision matrix · Sample — error handling matrix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [matrix-and-comparison.md](./references/matrix-and-comparison.md)
 > Matrix — the `data-ve-val` grammar · Matrix — glyph injection + accessibility · Matrix — cell tint · Matrix — optional column summary · Comparison — icon headers · Comparison — the emphasis column · Comparison — the 2-column anti-pattern variant · Theming — light + dark by construction
- [matrix-glyph-injection.md](./references/matrix-glyph-injection.md)
 > The four allowed values · Why Unicode geometric marks, not emoji · The injection — glyph + sr-only word + aria-label · The `.ve-tables-sr-only` clip pattern · Cell-tint colors come from DESIGN.md tokens · The 12% tint — faint, never drowning · `na` — "not applicable" reads as a dim dash · Unknown values are left untouched · Combining glyph + author text · Why `<th scope="row">` on the leading cell · Idempotent re-init · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [matrix-summary-footer.md](./references/matrix-summary-footer.md)
 > Why a column summary · Opt-in via the table attribute · The `<tfoot>` row contract · The counting algorithm — grid-walked · Format — `P/F/~` · `na` cells are excluded from the count · A column with zero ratable cells is left blank · The leading footer cell — author owns its content · Sample HTML · Customising the count format · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
