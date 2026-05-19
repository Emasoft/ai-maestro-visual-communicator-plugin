---
name: amvcp-tables-primitives
description: "Core table primitives for visual-communicator pages — table modes, light/dark themes, no-nested-scrollbars rule, idempotent init, zebra borders, token spec table, sample readability dataset. Use when scaffolding the basic table layer of any page. Trigger with 'table mode', 'table theme', 'zebra borders', 'no scrollbar rule', 'idempotent init', 'token spec table'."
license: MIT
compatibility: "Any modern browser. Requires scripts/amvcp-tables.js. No npm runtime dependency."
metadata:
  author: Emasoft
---

# Tables Core

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling table skills:** [amvcp-tables](../amvcp-tables/SKILL.md) (router) · [amvcp-tables-primitives](../amvcp-tables-primitives/SKILL.md) · [amvcp-tables-sort-virt](../amvcp-tables-sort-virt/SKILL.md) · [amvcp-tables-matrix-compare](../amvcp-tables-matrix-compare/SKILL.md) · [amvcp-tables-cells-badges](../amvcp-tables-cells-badges/SKILL.md) · [amvcp-tables-special](../amvcp-tables-special/SKILL.md).

## Overview

Core table primitives: the data-ve-mode contract (readonly/form/edit), light/dark theme conformance, the no-nested-scrollbars rule (page extends, never inner scroller), idempotent script init, zebra/borders/baseline styling, a token-spec demo table, and a sample readability dataset.

## Prerequisites

- `scripts/amvcp-tables.js` loaded next to the HTML.
- Modern browser. No npm dependency.

## Instructions

1. **Pick a table mode** (readonly / form / edit). See [table-modes.md](./references/table-modes.md).
 > Baseline — what the runtime already gives you · Mode `data` — sortable data table · Mode `matrix` — coverage / checklist grid · Mode `compare` — side-by-side comparison · Big-data add-on — virtualization · CSV add-on · Full `data-ve-*` attribute reference · Selection — rows stay selectable atoms
2. **Apply light + dark themes** — [light-dark-themes.md](./references/light-dark-themes.md).
 > The rule · Why "single-theme is a defect" · The token contract — engine emits ONLY the active theme · Colors — Light theme · Colors — Dark theme · `color-mix` over tokens — why it works in both themes · Every fallback hex is the canonical LIGHT default · What the theme toggle re-paints · Mechanical tricks for light vs dark · The sticky-cell background — must be opaque in BOTH themes · Testing the theme flip · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
3. **Verify no-nested-scrollbars** — [no-nested-scrollbars-rule.md](./references/no-nested-scrollbars-rule.md).
 > The rule · Why the rule exists · The runtime's enforcement · Wide tables — let the page widen · Tall tables — let the page grow · How virtualization respects this · How frozen columns respect this · The text-wrap exception (and why it doesn't apply to tables) · Common anti-patterns to remove on sight · Sample — wide table with horizontal page scroll · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
4. **Init script idempotently** — [idempotent-init.md](./references/idempotent-init.md).
 > Why idempotency matters · The three guard layers · `document.__veTablesInit` — module-level flag · Per-table mode guards · Per-cell glyph guards · Per-header sortable guard · Per-table CSV-wrap guard · Style injection is single-stylesheet · What re-init DOES re-do · What re-init does NOT re-do · Dynamic content insertion — how to use re-init · Forgiving load order · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
5. **Apply zebra + borders** — [zebra-borders-baseline.md](./references/zebra-borders-baseline.md).
 > What the baseline gives you · The 1px cell border · The 2px `<thead>` divider · Zebra striping — 6% tint on even body rows · `<tr>`-as-selectable-atom · `overflow-wrap: anywhere` on cells · `display: table; overflow: visible` — the no-nested-scrollbars guard · The `.ve-table-wrapper` hit-zone overlay · What the baseline does NOT do · The module's job — additive, never replacing · Sample HTML (with no mode opt-in) · DESIGN.md tokens consumed · Selection / comment / decision-mini notes

## Output

A themed, atom-stamped table whose rows/cells participate in the standard `data-ve-id` / decision-pill contract. Theme-orthogonal: works correctly in BOTH light and dark.

## Error Handling

| Symptom | Fix |
|---|---|
| Table renders but JS doesn't enhance it | Confirm `amvcp-tables.js` is loaded and the table has `data-ve-mode="..."`. |
| Sticky / frozen column doesn't stick | Verify `position: sticky` ancestor isn't `overflow: hidden`. |
| Sort doesn't fire | Confirm header has `data-vc-sort` and the script is loaded before DOM-ready. |

## Examples

```html
<table class="vc-table" data-ve-mode="readonly">
  <thead><tr><th>A</th><th>B</th></tr></thead>
  <tbody><tr><td>1</td><td>2</td></tr></tbody>
</table>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

Per-skill: see Resources. Some siblings support readonly only; some support form/edit (per-cell-decision-pill in particular implements the 3-state contract from R20-R23).

## Composability

Tables compose freely with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling table skills (core + sort-virt + matrix-compare + cells-badges + special).

## Resources

- [idempotent-init.md](./references/idempotent-init.md)
 > Why idempotency matters · The three guard layers · `document.__veTablesInit` — module-level flag · Per-table mode guards · Per-cell glyph guards · Per-header sortable guard · Per-table CSV-wrap guard · Style injection is single-stylesheet · What re-init DOES re-do · What re-init does NOT re-do · Dynamic content insertion — how to use re-init · Forgiving load order · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [light-dark-themes.md](./references/light-dark-themes.md)
 > The rule · Why "single-theme is a defect" · The token contract — engine emits ONLY the active theme · Colors — Light theme · Colors — Dark theme · `color-mix` over tokens — why it works in both themes · Every fallback hex is the canonical LIGHT default · What the theme toggle re-paints · Mechanical tricks for light vs dark · The sticky-cell background — must be opaque in BOTH themes · Testing the theme flip · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [no-nested-scrollbars-rule.md](./references/no-nested-scrollbars-rule.md)
 > The rule · Why the rule exists · The runtime's enforcement · Wide tables — let the page widen · Tall tables — let the page grow · How virtualization respects this · How frozen columns respect this · The text-wrap exception (and why it doesn't apply to tables) · Common anti-patterns to remove on sight · Sample — wide table with horizontal page scroll · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [sample-readability-dataset.md](./references/sample-readability-dataset.md)
 > The paste-in table · Why each fix
- [table-modes.md](./references/table-modes.md)
 > Baseline — what the runtime already gives you · Mode `data` — sortable data table · Mode `matrix` — coverage / checklist grid · Mode `compare` — side-by-side comparison · Big-data add-on — virtualization · CSV add-on · Full `data-ve-*` attribute reference · Selection — rows stay selectable atoms
- [token-spec-table.md](./references/token-spec-table.md)
 > The shape · Why semantic roles, not descriptive names · 4-column canonical layout · Light + dark — two tables, not two columns · The "System color" column · Inline hex with a swatch · Click-to-copy hex on hover · Sample — color tokens (light) · Sample — color tokens (dark) — same table, different values · Sample — typography tokens · Sample — spacing tokens · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [zebra-borders-baseline.md](./references/zebra-borders-baseline.md)
 > What the baseline gives you · The 1px cell border · The 2px `<thead>` divider · Zebra striping — 6% tint on even body rows · `<tr>`-as-selectable-atom · `overflow-wrap: anywhere` on cells · `display: table; overflow: visible` — the no-nested-scrollbars guard · The `.ve-table-wrapper` hit-zone overlay · What the baseline does NOT do · The module's job — additive, never replacing · Sample HTML (with no mode opt-in) · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
