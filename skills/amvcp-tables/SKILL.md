---
name: amvcp-tables
description: "Render data, big-data, matrix/checklist and comparison tables — click-to-sort with numeric auto-detect, window-scroll virtualization with frozen header/columns, status-glyph coverage grids, side-by-side option comparison with an emphasis column, plus copy-as-CSV. Use when presenting tabular data, a feature/coverage audit, a side-by-side comparison, or a many-row dataset. Trigger with 'table', 'sortable table', 'sort by column', 'data table', 'big table', 'feature matrix', 'coverage matrix', 'checklist table', 'comparison table', 'compare options side by side', 'before/after table', 'export table as CSV'."
license: MIT
compatibility: "Browser (no build step). Python 3.12+ via amvcp-select.py. amvcp-tables.js + amvcp-runtime.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Tables

## Overview

Loads when the agent needs a styled, interactive `<table>` that goes beyond the runtime's static-table baseline. Author plain semantic HTML plus one `data-ve-table` attribute; `amvcp-tables.js` injects sorting, virtualization, status glyphs, comparison emphasis and a CSV button. The runtime already ships the table chrome (borders, zebra rows, `<tr>`-as-selectable-atom, no-nested-scrollbars) — this skill adds the five modes on top of it.

## Prerequisites

- Browser (Chromium via `--app=URL` preferred; default browser fallback works).
- Python 3.12+ for `scripts/amvcp-select.py`.
- Three scripts colocated with the HTML, loaded in this order:
  `amvcp-designmd.js` (themes the page) → `amvcp-runtime.js` (table baseline + selection) → `amvcp-tables.js` (the five modes). The runtime's `bootEverything()` calls `window.amvcpTables.init()`; load order is forgiving because `init()` is idempotent and self-runs on `DOMContentLoaded`.

## Instructions

1. **Pick the mode.** Tabular data the reader sorts → `data-ve-table="data"`. A feature/coverage audit → `data-ve-table="matrix"`. Options side-by-side → `data-ve-table="compare"`. Many rows (hundreds+) → add `data-ve-table-virtual="1"` to a `data` table.
2. **Write semantic HTML.** A real `<table>` with `<thead>`/`<tbody>`, `<th scope="col">` on column headers and `<th scope="row">` on the leading cell of matrix/compare body rows. Never hand-author sort arrows, classes, radio columns, or a CSV button — the module injects them.
3. **`data` table:** numbers may carry thousands separators, a leading currency glyph, or a trailing `%` — the detector tolerates all. Per-column opt-out: `<th data-ve-nosort>`. A footer/totals row an author wants pinned: `<tr data-ve-table-nosort>`.
4. **`matrix` table:** each body cell carries `data-ve-val` ∈ `{pass, fail, partial, na}` and is left **empty** — the module injects the glyph + accessible word. Optional `<tfoot>` summary: add `data-ve-matrix-summary` to the `<table>`.
5. **`compare` table:** each option `<th>` carries `data-ve-col-icon="<glyph>"` (a Unicode mark, never emoji). **Zero or one** column may carry `data-ve-col-emphasis="1"` — the recommended/winner/after column.
6. **CSV:** opt-in with `data-ve-table-csv="1"` on the `<table>` — injects a Copy-CSV button (RFC-4180 quoted, clipboard only).
7. **Run:** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`. Open the file — sorting, virtualization and theming work with zero build step.

## Output

Self-contained HTML: the `<table>` markup plus the three `<script>` tags. Every table color/size is a `--vc-*` token (with a light fallback) so light + dark both work — a theme toggle re-themes all five modes with no second stylesheet. Table rows stay selectable `data-ve-id` atoms; selection is positional (sorting before selecting is fine; sorting after keeps already-recorded rows).

## Error Handling

- **No `data-ve-table`** → the table keeps only the runtime's static styling; no sort/matrix/compare wiring. Add the attribute.
- **Hand-authored sort arrows / classes** → collide with the module's injection. Let the module own all chrome.
- **Emoji status glyphs** → forbidden (inconsistent across platforms/screen readers). The matrix mode uses Unicode geometric marks (`✓ ✗ ◐ —`); compare icons must also be Unicode marks.
- **Inner `overflow:auto` on a table/wrapper** → breaks the big-data `position:sticky` header AND violates the no-nested-scrollbars rule. The page expands; never an inner scrollbox.
- **Two `data-ve-col-emphasis` columns** → ambiguous; the module logs one `console.warn` and emphasises only the first.
- **Body `rowspan` cells in a `data` table** → sorting would tear the span; the module declines sorting for that table (one `console.info`). Grouped `<thead>` colspans sort fine.
- **`data-ve-type="table-form"`** → owned by `amvcp-choice-tables`; `amvcp-tables.js` skips it.

## Examples

**Input:** "Show regional revenue, let me sort it." → `<table data-ve-table="data">` with a Region / Revenue / Growth % header. Clicking Revenue auto-detects it as numeric, right-aligns it, and sorts numerically (`980,500` before `1,240,000`, not lexically).

**Input:** "Coverage matrix — components vs themes/mobile/RTL/a11y." → `<table data-ve-table="matrix">`, rows are components, each cell `data-ve-val="pass|fail|partial|na"`. The module injects `✓/✗/◐/—`, tints the cell, and announces "Pass"/"Fail"/… to screen readers.

**Input:** "Compare 3 plans side by side, B is recommended." → `<table data-ve-table="compare">`, three option `<th>`s with `data-ve-col-icon`, the B column carries `data-ve-col-emphasis="1"` for an accent-tinted lane.

## Resources

- [interactive-selection-base.md](../../references/interactive-selection-base.md) — runtime contract, payload, marking selectable elements
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Runtime & Process Caveats
- [table-modes.md](./references/table-modes.md) — per-mode HTML contract + the full `data-ve-*` attribute reference
- [sortable-and-bigdata.md](./references/sortable-and-bigdata.md) — sort algorithm, window-scroll virtualization, frozen rows/cols, scroll-anchor
- [matrix-and-comparison.md](./references/matrix-and-comparison.md) — matrix `data-ve-val` grammar, comparison icon headers + emphasis column
- [sample-readability-dataset.md](./references/sample-readability-dataset.md) — a 15-row anti-pattern→fix dataset, ready paste-in content for a 2-column `compare` table
