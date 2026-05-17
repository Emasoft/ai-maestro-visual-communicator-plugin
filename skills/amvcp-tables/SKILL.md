---
name: amvcp-tables
description: "Render data, big-data, matrix/checklist and comparison tables — click-to-sort with numeric auto-detect, window-scroll virtualization with frozen header/columns, status-glyph coverage grids, side-by-side option comparison with an emphasis column, plus copy-as-CSV. Also covers the per-row decoration vocabulary (risk dot, severity badge, key/value pill, stat card, chip strip, kanban-as-table, decision matrix, pro/con grid, impact mini-table, token spec table). Use when presenting tabular data, a feature/coverage audit, a side-by-side comparison, a many-row dataset, a triage list, a design-token specification, or any of the per-row decoration patterns. Trigger with 'table', 'sortable table', 'sort by column', 'data table', 'big table', 'feature matrix', 'coverage matrix', 'checklist table', 'comparison table', 'before/after table', 'anti-pattern fix', 'recommended option', 'compare options side by side', 'risk table', 'risks and mitigations', 'severity badge', 'risk dot', 'stat card row', 'metric chip strip', 'kanban triage', 'decision matrix', 'chart picker', 'pro con tradeoff', 'impact summary', 'incident impact', 'token spec table', 'color tokens table', 'chess board', 'colored cell grid', 'export table as CSV'."
license: MIT
compatibility: "Browser (no build step). Python 3.12+ via amvcp-select.py. amvcp-tables.js + amvcp-runtime.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Tables

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads when the agent needs a styled, interactive `<table>` that goes beyond the runtime's static-table baseline. Author plain semantic HTML plus one `data-ve-table` attribute; `amvcp-tables.js` injects sorting, virtualization, status glyphs, comparison emphasis and a CSV button. The runtime already ships the table chrome (borders, zebra rows, `<tr>`-as-selectable-atom, no-nested-scrollbars) — this skill adds the five modes on top of it AND documents the per-row decoration vocabulary (risk dot, severity badge, key/value pill, stat card, chip strip, kanban-as-table, decision matrix, pro/con grid, impact mini-table, token spec table) that composes inside tables and reports.

## When to choose this category

| You want to … | Mode / pattern | Read reference |
|---|---|---|
| Show a sortable data table the reader can click headers on | `data-ve-table="data"` | `references/sort-cycle-3-state.md` + `references/numeric-cell-parser.md` |
| Sort hundreds or thousands of rows without lag | `data` + `data-ve-table-virtual="1"` | `references/virtualization-window-scroll.md` |
| Keep the row identifier visible during horizontal scroll | `data-ve-freeze-cols="N"` | `references/frozen-columns-sticky.md` |
| Audit N items × M criteria (design-system, a11y, browsers) | `data-ve-table="matrix"` | `references/coverage-audit-pattern.md` + `references/matrix-glyph-injection.md` |
| Show "Before / After" or "Anti-pattern → Fix" | `data-ve-table="compare"` (2-col, right column emphasised) | `references/before-after-2col.md` |
| Compare 3-N options with a recommended one | `data-ve-table="compare"` + `data-ve-col-emphasis="1"` | `references/comparison-emphasis-column.md` + `references/icon-headers-unicode.md` |
| Export any table as CSV (clipboard, RFC-4180) | `data-ve-table-csv="1"` | `references/csv-export-rfc4180.md` |
| Show per-column P/F/~ counts at the bottom of a matrix | `data-ve-matrix-summary` | `references/matrix-summary-footer.md` |
| Inline status flag — green/yellow/red dot beside text | `<span class="risk-dot risk-X">` | `references/risk-dot-severity-badge.md` |
| Per-row severity pill (HIGH / MED / LOW) | `<span class="sev sev-X">` | `references/risk-dot-severity-badge.md` |
| 1-line metadata strip (SEV-2 / Resolved / Duration) | `<span class="pill">` row | `references/status-pill-key-value.md` |
| Big-number stat row with one "warn" exception | `<div class="stat-card warn">` | `references/stat-card-warn-modifier.md` |
| Small chip strip for supplementary metrics | `<span class="chip">` row | `references/compact-metric-chip-strip.md` |
| 2-col compact key/value (mini-table) | `<table class="mini-stats">` | `references/impact-mini-table.md` |
| Tradeoff sub-grid (pros + cons) | 2-col `<table>` with `.pro-dot` / `.con-dot` | `references/pro-con-tradeoff-grid.md` |
| Triage list (Now / Next / Later / Cut) | kanban-as-table | `references/kanban-as-table.md` |
| Rules → outcomes decision aid | 3-col `data` table | `references/decision-matrix-pattern.md` |
| DESIGN.md token specification (Role / Hex / System / Notes) | 4-col `data` table with swatch column | `references/token-spec-table.md` |
| Chess board, sudoku grid, 3×3 colored demo | colored-cell board (plain `<table>` + author CSS) | `references/colored-cell-board.md` |

## When NOT to use this skill

- For a `<table data-ve-type="table-form">` (single/multi-select question form), use `amvcp-choice-tables` — it owns the form payload contract. See `references/table-form-scope-skip.md` for the boundary.
- For a free-form HTML block with no semantic table, use `amvcp-prose-pages` or `amvcp-report-doc`.
- For a chart with axes / SVG primitives, use `amvcp-charts-and-dashboards`.

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

## Modes

This skill supports `data-ve-mode="readonly"` (data viz / comparison view — default), `data-ve-mode="single"` (radio: pick one row), `data-ve-mode="multi"` (checkboxes: pick many rows), and `data-ve-mode="max-N"` (cap approved rows at N). Set the mode on the `<table data-ve-type="table-form">` host. See also `amvcp-choice-tables` for the dedicated form-table variant.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple tables (mix of readonly comparison and choice tables) coexist independently. The only exclusive skill is the overlay-runtime (R24).

## Resources

The skill ships with 35 reference files. Start with `table-modes.md` for the complete attribute reference, then drill into the per-feature references for the mode you're using.

### Cross-runtime context
- [interactive-selection-base.md](../../references/interactive-selection-base.md) — runtime contract, payload, marking selectable elements
- [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — visual verification checklist (always run after changes)

### Core contract (read first)
- [table-modes.md](./references/table-modes.md) — per-mode HTML contract + the full `data-ve-*` attribute reference
- [zebra-borders-baseline.md](./references/zebra-borders-baseline.md) — the runtime baseline this module enhances ON TOP of
- [no-nested-scrollbars-rule.md](./references/no-nested-scrollbars-rule.md) — hard invariant: no inner `overflow:auto`
- [light-dark-themes.md](./references/light-dark-themes.md) — token-driven theming; both themes are first-class
- [idempotent-init.md](./references/idempotent-init.md) — `init()` is safe to call N times; how the guards work
- [table-form-scope-skip.md](./references/table-form-scope-skip.md) — boundary with `amvcp-choice-tables` (which owns form tables)

### `data` mode — sortable data tables
- [sortable-and-bigdata.md](./references/sortable-and-bigdata.md) — sort algorithm + virtualization overview
- [sort-cycle-3-state.md](./references/sort-cycle-3-state.md) — none → asc → desc → none cycle, ARIA, keyboard
- [numeric-cell-parser.md](./references/numeric-cell-parser.md) — `parseCellNumber` grammar, currency / percent / thousands
- [string-sort-natural-order.md](./references/string-sort-natural-order.md) — `localeCompare` with `numeric: true`
- [row-move-not-clone.md](./references/row-move-not-clone.md) — why sort moves nodes (preserves selection / comments / pills)
- [spanning-cell-grid.md](./references/spanning-cell-grid.md) — `colspan`/`rowspan`-aware column math (null-slot pattern)
- [keyboard-accessibility.md](./references/keyboard-accessibility.md) — Tab, Enter, Space, `aria-sort`, focus-visible

### Big-data mode
- [virtualization-window-scroll.md](./references/virtualization-window-scroll.md) — page-scroll virtualization, no inner scrollbar
- [frozen-columns-sticky.md](./references/frozen-columns-sticky.md) — `position:sticky` for frozen columns + sticky header

### `matrix` mode
- [matrix-and-comparison.md](./references/matrix-and-comparison.md) — matrix + comparison overview
- [matrix-glyph-injection.md](./references/matrix-glyph-injection.md) — `data-ve-val` → ✓ ✗ ◐ — + accessible word + cell tint
- [matrix-summary-footer.md](./references/matrix-summary-footer.md) — `data-ve-matrix-summary` per-column P/F/~ counts
- [coverage-audit-pattern.md](./references/coverage-audit-pattern.md) — design-system / a11y / cross-browser audit shapes

### `compare` mode
- [comparison-emphasis-column.md](./references/comparison-emphasis-column.md) — `data-ve-col-emphasis="1"` recommended-column lane
- [icon-headers-unicode.md](./references/icon-headers-unicode.md) — `data-ve-col-icon` Unicode glyph palette (no emoji)
- [before-after-2col.md](./references/before-after-2col.md) — the 2-col anti-pattern→fix / before→after variant
- [sample-readability-dataset.md](./references/sample-readability-dataset.md) — a 15-row paste-in dataset, ready content

### Cross-cutting
- [csv-export-rfc4180.md](./references/csv-export-rfc4180.md) — `data-ve-table-csv="1"` clipboard export contract
- [per-cell-decision-pill.md](./references/per-cell-decision-pill.md) — S/A/D pill bridge, defensive against missing runtime

### Per-row decoration vocabulary
- [risk-dot-severity-badge.md](./references/risk-dot-severity-badge.md) — inline 9×9 dot + rounded mono pill
- [status-pill-key-value.md](./references/status-pill-key-value.md) — meta-row pill set (`[SEV-2][Duration: 47 min]`)
- [stat-card-warn-modifier.md](./references/stat-card-warn-modifier.md) — big-number stat row with one `.warn` exception
- [compact-metric-chip-strip.md](./references/compact-metric-chip-strip.md) — lighter alternative to the stat-card row
- [impact-mini-table.md](./references/impact-mini-table.md) — 2-col compact label/value with right-aligned mono numbers
- [pro-con-tradeoff-grid.md](./references/pro-con-tradeoff-grid.md) — 2-col pros + cons sub-grid with colored dots
- [kanban-as-table.md](./references/kanban-as-table.md) — Now / Next / Later / Cut triage table
- [decision-matrix-pattern.md](./references/decision-matrix-pattern.md) — rules → outcomes decision aid (chart picker, error map)
- [token-spec-table.md](./references/token-spec-table.md) — DESIGN.md token specification (Role / Hex / System / Notes)
- [colored-cell-board.md](./references/colored-cell-board.md) — chess board, sudoku grid, 3×3 colored-cell visual

## Visual verification

Every visual change MUST be verified per `skills/amvcp-self-debug-rules/SKILL.md`. Run the dev-browser snippets there for: light + dark theme parity (R1), no-nested-scrollbars (R2), `aria-sort` after each sort cycle, atom-contract stamps (`data-ve-comment-id` on rows / `data-ve-id` on matrix and compare cells), CSV button presence + clipboard copy contents.
