---
name: amvcp-tables
description: "Router skill for tables — table surface split into 5 focused siblings (core, sort+virt, matrix+compare, cells+badges, special). Use when the user wants ANY table task (sortable, virtualized, matrix, decision pill, kanban) to route to the right sibling. Trigger with 'table', 'sortable table', 'data table', 'feature matrix', 'comparison table', 'kanban triage', 'decision matrix', 'export CSV'."
license: MIT
compatibility: "Browser (no build step). amvcp-tables.js + amvcp-runtime.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Tables (Router)

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 visual categories.

## Overview

This is the **router** for the table surface. The table catalogue was split into 5 focused siblings so each sibling's embedded TOC fits naturally and progressive discovery works without per-link contortion. The router emits no markup itself — pick the right sibling per the table below.

## Prerequisites

- `scripts/amvcp-tables.js` loaded next to the HTML.
- Modern browser. No npm dependency.

## Instructions

1. Match the user's data shape to a row in the routing matrix.
2. Load the matched sibling SKILL.md (often one row covers it; combine when needed).
3. Follow the sibling's Instructions; come back to this router only to route a second concern.

## Output

The output is owned by the sibling skill. This router emits nothing.

## Error Handling

| Symptom | Fix |
|---|---|
| Don't know which sibling owns my need | Re-read the routing matrix; default to [amvcp-tables-primitives](../amvcp-tables-primitives/SKILL.md) when uncertain. |
| Need spans multiple siblings | Compose — load core first, then add the other siblings as needed. |

## Examples

```text
User: "I want a sortable, virtualized table with status pills per row."
Route:
  - amvcp-tables-primitives   → base table scaffold
  - amvcp-tables-sort-virt    → sort + virtualization
  - amvcp-tables-cells-badges → status pill per row

User: "Show the options as a table and let me pick one / vote."
Route:
  - amvcp-choice-tables       → interactive radio/checkbox table-form (returns the pick to the agent)
```

## Modes

Per-skill: see Resources. The router itself is mode-agnostic.

## Composability

The 5 table siblings compose freely with each other and with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

The 5 table siblings:

- [amvcp-tables-primitives](../amvcp-tables-primitives/SKILL.md) — table modes, light/dark themes, no-nested-scrollbars rule, idempotent init, zebra borders, token spec demo, sample dataset (7 refs).
- [amvcp-tables-sort-virt](../amvcp-tables-sort-virt/SKILL.md) — sortable + big-data, virtualization window-scroll, 3-state sort cycle, natural string sort, numeric cell parser, frozen sticky columns, CSV export RFC-4180 (7 refs).
- [amvcp-tables-matrix-compare](../amvcp-tables-matrix-compare/SKILL.md) — matrix + comparison, matrix glyph injection, matrix summary footer, coverage audit, comparison emphasis column, decision matrix (6 refs).
- [amvcp-tables-cells-badges](../amvcp-tables-cells-badges/SKILL.md) — per-cell decision pill, risk dot / severity badge, status pill key-value, compact metric chip strip, stat card warn modifier, colored cell board, Unicode icon headers, impact mini-table (8 refs).
- [amvcp-tables-special](../amvcp-tables-special/SKILL.md) — before-after 2-col, kanban-as-table, pro/con tradeoff grid, spanning cell grid, table-form scope skip, row-move not clone, keyboard accessibility (7 refs).

**Interactive sibling (not part of the 5-way split — it's a separate skill):**

- [amvcp-choice-tables](../amvcp-choice-tables/SKILL.md) — a table that ASKS the user a question: radio (single) / checkbox (multi) per row, Submit returns the selection to the agent. Route here when the user wants to *pick / vote / choose* from the table rather than just read them. Form-mode is owned by `amvcp-runtime.js`, not `amvcp-tables.js`.
