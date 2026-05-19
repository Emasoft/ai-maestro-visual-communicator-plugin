---
name: amvcp-tables-special
description: "Special table forms: before/after 2-column, kanban-as-table, pro/con tradeoff grid, spanning cells grid, table-form scope skip, row move not clone, keyboard accessibility. Use when scaffolding non-traditional table shapes (before/after, kanban, pro-con). Trigger with 'before after table', 'kanban table', 'pro con tradeoff', 'spanning cells', 'table form scope', 'row move', 'table a11y'."
license: MIT
compatibility: "Any modern browser. Requires scripts/amvcp-tables.js. No npm runtime dependency."
metadata:
  author: Emasoft
---

# Tables Special Forms

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling table skills:** [amvcp-tables](../amvcp-tables/SKILL.md) (router) · [amvcp-tables-primitives](../amvcp-tables-primitives/SKILL.md) · [amvcp-tables-sort-virt](../amvcp-tables-sort-virt/SKILL.md) · [amvcp-tables-matrix-compare](../amvcp-tables-matrix-compare/SKILL.md) · [amvcp-tables-cells-badges](../amvcp-tables-cells-badges/SKILL.md) · [amvcp-tables-special](../amvcp-tables-special/SKILL.md).

## Overview

Special table forms: before/after 2-column compare, kanban-as-table (vertical columns as <th>), pro/con tradeoff grid, spanning cell grid with `colspan`/`rowspan`, table-form scope skip (per-row mode opt-out), row-move (not clone) helper for kanban moves, and keyboard accessibility (arrow keys, tab cycle, ARIA).

## Prerequisites

- `scripts/amvcp-tables.js` loaded next to the HTML.
- Modern browser. No npm dependency.

## Instructions

1. **Before/after 2-column** — [before-after-2col.md](./references/before-after-2col.md).
 > Why the 2-column case is special · The canonical shape · Choosing the emphasis side · Picking icons — open vs filled · Author the criterion column with intent · Inline code in cells — `<code>` is fine · Showing metrics — left + right + the delta · Sample — anti-pattern → fix (the readability bundled set) · Sample — baseline → improvement (perf) · Sample — A/B prose style · Pairing with the per-row pill · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
2. **Kanban-as-table** — [kanban-as-table.md](./references/kanban-as-table.md).
 > The shape · Why a table instead of cards · The 4-column convention — Now / Next / Later / Cut · Column-top color border = the priority signal · One ticket per cell · Ragged columns — columns of unequal length · Optional drag-to-reorder (out of scope for tables module) · Export as markdown — the "throwaway editor" pattern · Now · Next · Later · Cut · Sample HTML — static kanban table · Sample HTML — kanban with summary footer counts · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
3. **Pro/con tradeoff grid** — [pro-con-tradeoff-grid.md](./references/pro-con-tradeoff-grid.md).
 > The shape · Why a table, not a `<ul>` · Dot color = token, not literal hex · Equal-width columns or content-fit · Row count — keep it tight · Pairing with a code panel · Accessibility — text + color · Sample — 2-column pro/con beside a code panel · Sample — vertical pro-and-con (single column) · Sample — 3-column "Pros / Cons / Open questions" · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
4. **Spanning cells** — [spanning-cell-grid.md](./references/spanning-cell-grid.md).
 > [Why `cells[N]` is wrong](#why-cellsn-is-wrong) · The HTML "forming a table" algorithm · `buildCellGrid()` — the grid map · Origin vs continuation slots — the null-slot pattern · Header colspan vs body colspan · Sort under body rowspan — decline, do not silently mis-sort · Column operations that USE the grid · Sample table with grouped headers · Sample table with body rowspan — sort declined · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract under spans
5. **Table-form scope skip** — [table-form-scope-skip.md](./references/table-form-scope-skip.md).
 > The two table skills · The boundary attribute — `data-ve-type="table-form"` · How the skip works · Why two skills, not one · What the runtime / choice-tables owns · What this module owns · Tables WITHIN a table-form scope are also skipped · Why scope-walking is necessary · Sample — table-form table (NOT handled by this module) · Sample — adjacent tables, mixed ownership · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
6. **Row move (not clone)** — [row-move-not-clone.md](./references/row-move-not-clone.md).
 > What "move vs clone" actually means in the DOM · The one-liner that makes it work · Why cloning is forbidden · Stable-sort decorate / sort / undecorate · Spacing rows under virtualization · Selection survives a sort · Comment threads survive a sort · Decision-mini pills survive a sort · What an author can safely do mid-sort · The escalation we did NOT take · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
7. **Keyboard accessibility** — [keyboard-accessibility.md](./references/keyboard-accessibility.md).
 > The keyboard-operable contract · `tabindex="0"` on sortable headers · Enter and Space both fire the sort · Why `preventDefault` on Space · `aria-sort` — the announcement contract · `scope` attributes on headers · `focus-visible` outline — the focus ring · `tabindex` is NOT added to body cells · Case-insensitive key comparison · Sample HTML · Testing matrix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes

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
<table class="vc-table" data-ve-mode="before-after">
  <thead><tr><th>Before</th><th>After</th></tr></thead>
  <tbody><tr><td>old</td><td>new</td></tr></tbody>
</table>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

Per-skill: see Resources. Some siblings support readonly only; some support form/edit (per-cell-decision-pill in particular implements the 3-state contract from R20-R23).

## Composability

Tables compose freely with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling table skills (core + sort-virt + matrix-compare + cells-badges + special).

## Resources

- [before-after-2col.md](./references/before-after-2col.md)
 > Why the 2-column case is special · The canonical shape · Choosing the emphasis side · Picking icons — open vs filled · Author the criterion column with intent · Inline code in cells — `<code>` is fine · Showing metrics — left + right + the delta · Sample — anti-pattern → fix (the readability bundled set) · Sample — baseline → improvement (perf) · Sample — A/B prose style · Pairing with the per-row pill · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [kanban-as-table.md](./references/kanban-as-table.md)
 > The shape · Why a table instead of cards · The 4-column convention — Now / Next / Later / Cut · Column-top color border = the priority signal · One ticket per cell · Ragged columns — columns of unequal length · Optional drag-to-reorder (out of scope for tables module) · Export as markdown — the "throwaway editor" pattern · Now · Next · Later · Cut · Sample HTML — static kanban table · Sample HTML — kanban with summary footer counts · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [keyboard-accessibility.md](./references/keyboard-accessibility.md)
 > The keyboard-operable contract · `tabindex="0"` on sortable headers · Enter and Space both fire the sort · Why `preventDefault` on Space · `aria-sort` — the announcement contract · `scope` attributes on headers · `focus-visible` outline — the focus ring · `tabindex` is NOT added to body cells · Case-insensitive key comparison · Sample HTML · Testing matrix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [pro-con-tradeoff-grid.md](./references/pro-con-tradeoff-grid.md)
 > The shape · Why a table, not a `<ul>` · Dot color = token, not literal hex · Equal-width columns or content-fit · Row count — keep it tight · Pairing with a code panel · Accessibility — text + color · Sample — 2-column pro/con beside a code panel · Sample — vertical pro-and-con (single column) · Sample — 3-column "Pros / Cons / Open questions" · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [row-move-not-clone.md](./references/row-move-not-clone.md)
 > What "move vs clone" actually means in the DOM · The one-liner that makes it work · Why cloning is forbidden · Stable-sort decorate / sort / undecorate · Spacing rows under virtualization · Selection survives a sort · Comment threads survive a sort · Decision-mini pills survive a sort · What an author can safely do mid-sort · The escalation we did NOT take · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [spanning-cell-grid.md](./references/spanning-cell-grid.md)
 > [Why `cells[N]` is wrong](#why-cellsn-is-wrong) · The HTML "forming a table" algorithm · `buildCellGrid()` — the grid map · Origin vs continuation slots — the null-slot pattern · Header colspan vs body colspan · Sort under body rowspan — decline, do not silently mis-sort · Column operations that USE the grid · Sample table with grouped headers · Sample table with body rowspan — sort declined · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract under spans
- [table-form-scope-skip.md](./references/table-form-scope-skip.md)
 > The two table skills · The boundary attribute — `data-ve-type="table-form"` · How the skip works · Why two skills, not one · What the runtime / choice-tables owns · What this module owns · Tables WITHIN a table-form scope are also skipped · Why scope-walking is necessary · Sample — table-form table (NOT handled by this module) · Sample — adjacent tables, mixed ownership · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
