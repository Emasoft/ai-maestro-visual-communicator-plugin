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
| Show a sortable data table the reader can click headers on | `data-ve-table="data"` | [sort-cycle-3-state](references/sort-cycle-3-state.md) + [numeric-cell-parser](references/numeric-cell-parser.md) |
  > Why three states, not two · The cycle table · State lives on the `<table>`, not the column · Single-active-column rule · Restoring authored order — the snapshot · Sort arrow glyphs and CSS hooks · Keyboard contract · `aria-sort` contract · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
| Sort hundreds or thousands of rows without lag | `data` + `data-ve-table-virtual="1"` | [virtualization-window-scroll](references/virtualization-window-scroll.md) |
  > Why this is hard · The conventional approach — and why we reject it · Window-scroll virtualization — the design · Two spacer rows reserve the page height · Row-height measurement — sample + median · `computeVirtualWindow()` — visible-row math · The scroll listener — passive + rAF-throttled · `requestAnimationFrame` read/write discipline · Find-in-page caveat · Print caveat · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Keep the row identifier visible during horizontal scroll | `data-ve-freeze-cols="N"` | [frozen-columns-sticky](references/frozen-columns-sticky.md) |
  > Why frozen columns matter · `position: sticky` needs no container · The grid-aware column lookup · Cumulative `left` offsets — one read pass, one write pass · Opaque background — the bleed-through trap · `z-index` layering — header beats body, frozen beats non-frozen · The freeze-edge divider · `<thead>` sticky-top stacking · Author contract — what you write · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Audit N items × M criteria (design-system, a11y, browsers) | `data-ve-table="matrix"` | [coverage-audit-pattern](references/coverage-audit-pattern.md) + [matrix-glyph-injection](references/matrix-glyph-injection.md) |
  > The shape · Choosing rows and columns · Cell content discipline — never speculate · Empty vs `na` — the meaningful distinction · Combining glyph + context · `<th scope="row">` is mandatory · Group rows by semantic family · Use the summary footer for column verdicts · Sample — design-system component audit · Sample — accessibility WCAG checklist · Sample — cross-browser compatibility · Anti-patterns · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Show "Before / After" or "Anti-pattern → Fix" | `data-ve-table="compare"` (2-col, right column emphasised) | [before-after-2col](references/before-after-2col.md) |
  > Why the 2-column case is special · The canonical shape · Choosing the emphasis side · Picking icons — open vs filled · Author the criterion column with intent · Inline code in cells — `<code>` is fine · Showing metrics — left + right + the delta · Sample — anti-pattern → fix (the readability bundled set) · Sample — baseline → improvement (perf) · Sample — A/B prose style · Pairing with the per-row pill · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Compare 3-N options with a recommended one | `data-ve-table="compare"` + `data-ve-col-emphasis="1"` | [comparison-emphasis-column](references/comparison-emphasis-column.md) + [icon-headers-unicode](references/icon-headers-unicode.md) |
  > What the emphasis column communicates · The `data-ve-col-emphasis` attribute · Zero or one — never two · The two-column emphasis warning — fail-fast, console.warn · How the tint is applied — grid-walked column · The accent border-left + border-right · The 10% accent wash · Icon recoloring on the emphasis header · The 2-column anti-pattern → fix variant · Pairing emphasis with a deliberate row order · Sample HTML — 3-column recommendation · Sample HTML — 2-column before/after · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Export any table as CSV (clipboard, RFC-4180) | `data-ve-table-csv="1"` | [csv-export-rfc4180](references/csv-export-rfc4180.md) |
  > Opt-in via one attribute · RFC 4180 — the quoting rules · `tableToCsv()` — the grid walk · Spanning cells in the CSV — emit at origin · Header row stripping — `↕` does not export · Matrix cells export the WORD, not the glyph · Numeric cells export the displayed text · Whitespace collapsing · CRLF line endings · Clipboard API + execCommand fallback · Why not a file download · Why no Excel export · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
| Show per-column P/F/~ counts at the bottom of a matrix | `data-ve-matrix-summary` | [matrix-summary-footer](references/matrix-summary-footer.md) |
  > Why a column summary · Opt-in via the table attribute · The `<tfoot>` row contract · The counting algorithm — grid-walked · Format — `P/F/~` · `na` cells are excluded from the count · A column with zero ratable cells is left blank · The leading footer cell — author owns its content · Sample HTML · Customising the count format · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Inline status flag — green/yellow/red dot beside text | `<span class="risk-dot risk-X">` | [risk-dot-severity-badge](references/risk-dot-severity-badge.md) |
  > When to use which · Risk dot — 9×9 circle inline · Severity badge — rounded mono pill · Why no separate "risk" column · Token-driven color palette · Accessibility — the visible label is mandatory · `<span>` semantics, not custom elements · Sample — risk dot in a status column · Sample — severity badge in a risks/mitigations table · Sample — combining both · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Per-row severity pill (HIGH / MED / LOW) | `<span class="sev sev-X">` | [risk-dot-severity-badge](references/risk-dot-severity-badge.md) |
  > When to use which · Risk dot — 9×9 circle inline · Severity badge — rounded mono pill · Why no separate "risk" column · Token-driven color palette · Accessibility — the visible label is mandatory · `<span>` semantics, not custom elements · Sample — risk dot in a status column · Sample — severity badge in a risks/mitigations table · Sample — combining both · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| 1-line metadata strip (SEV-2 / Resolved / Duration) | `<span class="pill">` row | [status-pill-key-value](references/status-pill-key-value.md) |
  > The shape · When to use a meta-pill row vs an inline mini-table · Anatomy — pill, key, value · Variants — neutral / semantic-colored · The key/value spacing trick · `font-family: mono` on the value · Wrap behavior · Inside a table — alongside another pattern · Sample — incident header meta row · Sample — release/version meta row · Sample — table row prefix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
| Big-number stat row with one "warn" exception | `<div class="stat-card warn">` | [stat-card-warn-modifier](references/stat-card-warn-modifier.md) |
  > The shape · Why a row, not a grid · The `.warn` modifier — left-border + extra padding · Card anatomy — number + label + delta · Delta typography — small, signed, muted unless emphasized · `.warn` vs `.good` — only flag exceptions · Wrapping on narrow viewports · Sample — weekly status report header · Sample — implementation plan summary band · Relationship to the mini-table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
| Small chip strip for supplementary metrics | `<span class="chip">` row | [compact-metric-chip-strip](references/compact-metric-chip-strip.md) |
  > The shape · Chip vs card vs pill — visual weight ladder · Anatomy — label colon value · Inline `<strong>` on the value · Wrap behavior · Colored chip variants — `.chip-good` / `.chip-bad` · Sample — PR change-summary strip · Sample — release notes meta strip · Sample — test result strip · Combining with a table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
| 2-col compact key/value (mini-table) | `<table class="mini-stats">` | [impact-mini-table](references/impact-mini-table.md) |
  > The shape · Why no header row · Author it as a `data` table with `nosort` everywhere · Right-aligning the value column · Mono-spaced numbers — tabular-nums · Max-width 460px · Comparison to a list · Sample — incident impact · Sample — perf snapshot · Sample — deploy stats · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Tradeoff sub-grid (pros + cons) | 2-col `<table>` with `.pro-dot` / `.con-dot` | [pro-con-tradeoff-grid](references/pro-con-tradeoff-grid.md) |
  > The shape · Why a table, not a `<ul>` · Dot color = token, not literal hex · Equal-width columns or content-fit · Row count — keep it tight · Pairing with a code panel · Accessibility — text + color · Sample — 2-column pro/con beside a code panel · Sample — vertical pro-and-con (single column) · Sample — 3-column "Pros / Cons / Open questions" · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Triage list (Now / Next / Later / Cut) | kanban-as-table | [kanban-as-table](references/kanban-as-table.md) |
  > The shape · Why a table instead of cards · The 4-column convention — Now / Next / Later / Cut · Column-top color border = the priority signal · One ticket per cell · Ragged columns — columns of unequal length · Optional drag-to-reorder (out of scope for tables module) · Export as markdown — the "throwaway editor" pattern · Sample HTML — static kanban table · Sample HTML — kanban with summary footer counts · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Rules → outcomes decision aid | 3-col `data` table | [decision-matrix-pattern](references/decision-matrix-pattern.md) |
  > The shape · Distinct from a coverage matrix · Distinct from a compare table · Rows are conditions; columns are properties of the outcome · The "default fallback" row · Inline `<code>` for technical conditions · Sample — chart-type decision matrix · Sample — HTTP status response matrix · Sample — sort tie-break decision matrix · Sample — error handling matrix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| DESIGN.md token specification (Role / Hex / System / Notes) | 4-col `data` table with swatch column | [token-spec-table](references/token-spec-table.md) |
  > The shape · Why semantic roles, not descriptive names · 4-column canonical layout · Light + dark — two tables, not two columns · The "System color" column · Inline hex with a swatch · Click-to-copy hex on hover · Sample — color tokens (light) · Sample — color tokens (dark) — same table, different values · Sample — typography tokens · Sample — spacing tokens · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
| Chess board, sudoku grid, 3×3 colored demo | colored-cell board (plain `<table>` + author CSS) | [colored-cell-board](references/colored-cell-board.md) |
  > The shape · Distinct from a matrix table · Cell-driven color via `data-cell-color` · Optional cell glyph or number · Fixed table-layout for uniform cells · Square cells via `aspect-ratio: 1` · Chess-board alternating colors · Sample — 3×3 colored-cell demo · Sample — chess-board with piece glyphs · Sample — sudoku 9×9 grid · Sample — color-coded heat board · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract

## When NOT to use this skill

- For a `<table data-ve-type="table-form">` (single/multi-select question form), use `amvcp-choice-tables` — it owns the form payload contract. See [table-form-scope-skip](references/table-form-scope-skip.md) for the boundary.
  > The two table skills · The boundary attribute — `data-ve-type="table-form"` · How the skip works · Why two skills, not one · What the runtime / choice-tables owns · What this module owns · Tables WITHIN a table-form scope are also skipped · Why scope-walking is necessary · Sample — table-form table (NOT handled by this module) · Sample — adjacent tables, mixed ownership · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
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

The skill ships with 35 reference files. Start with [table-modes](references/table-modes.md) for the complete attribute reference, then drill into the per-feature references for the mode you're using.
  > Baseline — what the runtime already gives you · Mode `data` — sortable data table · Mode `matrix` — coverage / checklist grid · Mode `compare` — side-by-side comparison · Big-data add-on — virtualization · CSV add-on · Full `data-ve-*` attribute reference · Selection — rows stay selectable atoms

### Cross-runtime context
- [interactive-selection-base.md](../../references/interactive-selection-base.md) — runtime contract, payload, marking selectable elements
- [skills/amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md) — visual verification checklist (always run after changes)

### Core contract (read first)
- [table-modes.md](./references/table-modes.md) — per-mode HTML contract + the full `data-ve-*` attribute reference
  > Baseline — what the runtime already gives you · Mode `data` — sortable data table · Mode `matrix` — coverage / checklist grid · Mode `compare` — side-by-side comparison · Big-data add-on — virtualization · CSV add-on · Full `data-ve-*` attribute reference · Selection — rows stay selectable atoms
- [zebra-borders-baseline.md](./references/zebra-borders-baseline.md) — the runtime baseline this module enhances ON TOP of
  > What the baseline gives you · The 1px cell border · The 2px `<thead>` divider · Zebra striping — 6% tint on even body rows · `<tr>`-as-selectable-atom · `overflow-wrap: anywhere` on cells · `display: table; overflow: visible` — the no-nested-scrollbars guard · The `.ve-table-wrapper` hit-zone overlay · What the baseline does NOT do · The module's job — additive, never replacing · Sample HTML (with no mode opt-in) · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [no-nested-scrollbars-rule.md](./references/no-nested-scrollbars-rule.md) — hard invariant: no inner `overflow:auto`
  > The rule · Why the rule exists · The runtime's enforcement · Wide tables — let the page widen · Tall tables — let the page grow · How virtualization respects this · How frozen columns respect this · The text-wrap exception (and why it doesn't apply to tables) · Common anti-patterns to remove on sight · Sample — wide table with horizontal page scroll · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [light-dark-themes.md](./references/light-dark-themes.md) — token-driven theming; both themes are first-class
  > The rule · Why "single-theme is a defect" · The token contract — engine emits ONLY the active theme · `color-mix` over tokens — why it works in both themes · Every fallback hex is the canonical LIGHT default · What the theme toggle re-paints · Mechanical tricks for light vs dark · The sticky-cell background — must be opaque in BOTH themes · Testing the theme flip · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [idempotent-init.md](./references/idempotent-init.md) — `init()` is safe to call N times; how the guards work
  > Why idempotency matters · The three guard layers · `document.__veTablesInit` — module-level flag · Per-table mode guards · Per-cell glyph guards · Per-header sortable guard · Per-table CSV-wrap guard · Style injection is single-stylesheet · What re-init DOES re-do · What re-init does NOT re-do · Dynamic content insertion — how to use re-init · Forgiving load order · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [table-form-scope-skip.md](./references/table-form-scope-skip.md) — boundary with `amvcp-choice-tables` (which owns form tables)
  > The two table skills · The boundary attribute — `data-ve-type="table-form"` · How the skip works · Why two skills, not one · What the runtime / choice-tables owns · What this module owns · Tables WITHIN a table-form scope are also skipped · Why scope-walking is necessary · Sample — table-form table (NOT handled by this module) · Sample — adjacent tables, mixed ownership · DESIGN.md tokens consumed · Selection / comment / decision-mini notes

### `data` mode — sortable data tables
- [sortable-and-bigdata.md](./references/sortable-and-bigdata.md) — sort algorithm + virtualization overview
  > Sort — numeric detection · Sort — the 3-state cycle · Sort — moving nodes, not cloning them · Sort — stability · Sort — spanning-cell safety · Big-data — the no-nested-scrollbars reconciliation · Big-data — row-height measurement · Big-data — the visible window · Big-data — scroll-anchor · Big-data — shrink-wrap (dropped, intentionally)
- [sort-cycle-3-state.md](./references/sort-cycle-3-state.md) — none → asc → desc → none cycle, ARIA, keyboard
  > Why three states, not two · The cycle table · State lives on the `<table>`, not the column · Single-active-column rule · Restoring authored order — the snapshot · Sort arrow glyphs and CSS hooks · Keyboard contract · `aria-sort` contract · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [numeric-cell-parser.md](./references/numeric-cell-parser.md) — `parseCellNumber` grammar, currency / percent / thousands
  > Why auto-detect · The grammar — what counts as a number · `parseCellNumber()` — the exact rules · Detection — one click per column, lazy + cached · The all-empty trap · Mixed columns are string-sorted · Authoring contract — do not pre-strip · Sample HTML — author exactly this · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [string-sort-natural-order.md](./references/string-sort-natural-order.md) — `localeCompare` with `numeric: true`
  > What "natural" means here · The comparator · `numeric: true` — embedded numbers sort numerically · `sensitivity: 'base'` — accents are equal · `undefined` locale — uses the runtime's locale · Case sensitivity — case is also ignored · Empty strings sort first in `asc` · Stability tie-break · Sample — version strings · Sample — file paths · Sample — mixed currency text · When `localeCompare` is wrong · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [row-move-not-clone.md](./references/row-move-not-clone.md) — why sort moves nodes (preserves selection / comments / pills)
  > What "move vs clone" actually means in the DOM · The one-liner that makes it work · Why cloning is forbidden · Stable-sort decorate / sort / undecorate · Spacing rows under virtualization · Selection survives a sort · Comment threads survive a sort · Decision-mini pills survive a sort · What an author can safely do mid-sort · The escalation we did NOT take · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [spanning-cell-grid.md](./references/spanning-cell-grid.md) — `colspan`/`rowspan`-aware column math (null-slot pattern)
  > Why `cells[N]` is wrong · The HTML "forming a table" algorithm · `buildCellGrid()` — the grid map · Origin vs continuation slots — the null-slot pattern · Header colspan vs body colspan · Sort under body rowspan — decline, do not silently mis-sort · Column operations that USE the grid · Sample table with grouped headers · Sample table with body rowspan — sort declined · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract under spans
- [keyboard-accessibility.md](./references/keyboard-accessibility.md) — Tab, Enter, Space, `aria-sort`, focus-visible
  > The keyboard-operable contract · `tabindex="0"` on sortable headers · Enter and Space both fire the sort · Why `preventDefault` on Space · `aria-sort` — the announcement contract · `scope` attributes on headers · `focus-visible` outline — the focus ring · `tabindex` is NOT added to body cells · Case-insensitive key comparison · Sample HTML · Testing matrix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes

### Big-data mode
- [virtualization-window-scroll.md](./references/virtualization-window-scroll.md) — page-scroll virtualization, no inner scrollbar
  > Why this is hard · The conventional approach — and why we reject it · Window-scroll virtualization — the design · Two spacer rows reserve the page height · Row-height measurement — sample + median · `computeVirtualWindow()` — visible-row math · The scroll listener — passive + rAF-throttled · `requestAnimationFrame` read/write discipline · Find-in-page caveat · Print caveat · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [frozen-columns-sticky.md](./references/frozen-columns-sticky.md) — `position:sticky` for frozen columns + sticky header
  > Why frozen columns matter · `position: sticky` needs no container · The grid-aware column lookup · Cumulative `left` offsets — one read pass, one write pass · Opaque background — the bleed-through trap · `z-index` layering — header beats body, frozen beats non-frozen · The freeze-edge divider · `<thead>` sticky-top stacking · Author contract — what you write · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract

### `matrix` mode
- [matrix-and-comparison.md](./references/matrix-and-comparison.md) — matrix + comparison overview
  > Matrix — the `data-ve-val` grammar · Matrix — glyph injection + accessibility · Matrix — cell tint · Matrix — optional column summary · Comparison — icon headers · Comparison — the emphasis column · Comparison — the 2-column anti-pattern variant · Theming — light + dark by construction
- [matrix-glyph-injection.md](./references/matrix-glyph-injection.md) — `data-ve-val` → ✓ ✗ ◐ — + accessible word + cell tint
  > The four allowed values · Why Unicode geometric marks, not emoji · The injection — glyph + sr-only word + aria-label · The `.ve-tables-sr-only` clip pattern · Cell-tint colors come from DESIGN.md tokens · The 12% tint — faint, never drowning · `na` — "not applicable" reads as a dim dash · Unknown values are left untouched · Combining glyph + author text · Why `<th scope="row">` on the leading cell · Idempotent re-init · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [matrix-summary-footer.md](./references/matrix-summary-footer.md) — `data-ve-matrix-summary` per-column P/F/~ counts
  > Why a column summary · Opt-in via the table attribute · The `<tfoot>` row contract · The counting algorithm — grid-walked · Format — `P/F/~` · `na` cells are excluded from the count · A column with zero ratable cells is left blank · The leading footer cell — author owns its content · Sample HTML · Customising the count format · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [coverage-audit-pattern.md](./references/coverage-audit-pattern.md) — design-system / a11y / cross-browser audit shapes
  > The shape · Choosing rows and columns · Cell content discipline — never speculate · Empty vs `na` — the meaningful distinction · Combining glyph + context · `<th scope="row">` is mandatory · Group rows by semantic family · Use the summary footer for column verdicts · Sample — design-system component audit · Sample — accessibility WCAG checklist · Sample — cross-browser compatibility · Anti-patterns · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract

### `compare` mode
- [comparison-emphasis-column.md](./references/comparison-emphasis-column.md) — `data-ve-col-emphasis="1"` recommended-column lane
  > What the emphasis column communicates · The `data-ve-col-emphasis` attribute · Zero or one — never two · The two-column emphasis warning — fail-fast, console.warn · How the tint is applied — grid-walked column · The accent border-left + border-right · The 10% accent wash · Icon recoloring on the emphasis header · The 2-column anti-pattern → fix variant · Pairing emphasis with a deliberate row order · Sample HTML — 3-column recommendation · Sample HTML — 2-column before/after · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [icon-headers-unicode.md](./references/icon-headers-unicode.md) — `data-ve-col-icon` Unicode glyph palette (no emoji)
  > The job an icon header does · The hard rule — Unicode geometric marks only · Pairing icons — open vs filled, the rank signal · The canonical 4-icon palette · Mode-specific icon idioms · The injection — span before the header text · Color is per emphasis state · Why no icons on the row-label column · Sample HTML · Choosing an icon set for a specific comparison · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [before-after-2col.md](./references/before-after-2col.md) — the 2-col anti-pattern→fix / before→after variant
  > Why the 2-column case is special · The canonical shape · Choosing the emphasis side · Picking icons — open vs filled · Author the criterion column with intent · Inline code in cells — `<code>` is fine · Showing metrics — left + right + the delta · Sample — anti-pattern → fix (the readability bundled set) · Sample — baseline → improvement (perf) · Sample — A/B prose style · Pairing with the per-row pill · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [sample-readability-dataset.md](./references/sample-readability-dataset.md) — a 15-row paste-in dataset, ready content
  > The paste-in table · Why each fix

### Cross-cutting
- [csv-export-rfc4180.md](./references/csv-export-rfc4180.md) — `data-ve-table-csv="1"` clipboard export contract
  > Opt-in via one attribute · RFC 4180 — the quoting rules · `tableToCsv()` — the grid walk · Spanning cells in the CSV — emit at origin · Header row stripping — `↕` does not export · Matrix cells export the WORD, not the glyph · Numeric cells export the displayed text · Whitespace collapsing · CRLF line endings · Clipboard API + execCommand fallback · Why not a file download · Why no Excel export · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [per-cell-decision-pill.md](./references/per-cell-decision-pill.md) — S/A/D pill bridge, defensive against missing runtime
  > What the pill is · Why "always on, never gated by selection" · The defensive bridge — runtime helper opt-in · `attachDecisionMiniSafe()` — the failure-tolerant wrapper · Per-mode attachment points · Atom ID stamping — deterministic across re-init · Persistence model · Pill state survives a sort, a virtualization scroll, a theme toggle · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes

### Per-row decoration vocabulary
- [risk-dot-severity-badge.md](./references/risk-dot-severity-badge.md) — inline 9×9 dot + rounded mono pill
  > When to use which · Risk dot — 9×9 circle inline · Severity badge — rounded mono pill · Why no separate "risk" column · Token-driven color palette · Accessibility — the visible label is mandatory · `<span>` semantics, not custom elements · Sample — risk dot in a status column · Sample — severity badge in a risks/mitigations table · Sample — combining both · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [status-pill-key-value.md](./references/status-pill-key-value.md) — meta-row pill set (`[SEV-2][Duration: 47 min]`)
  > The shape · When to use a meta-pill row vs an inline mini-table · Anatomy — pill, key, value · Variants — neutral / semantic-colored · The key/value spacing trick · `font-family: mono` on the value · Wrap behavior · Inside a table — alongside another pattern · Sample — incident header meta row · Sample — release/version meta row · Sample — table row prefix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [stat-card-warn-modifier.md](./references/stat-card-warn-modifier.md) — big-number stat row with one `.warn` exception
  > The shape · Why a row, not a grid · The `.warn` modifier — left-border + extra padding · Card anatomy — number + label + delta · Delta typography — small, signed, muted unless emphasized · `.warn` vs `.good` — only flag exceptions · Wrapping on narrow viewports · Sample — weekly status report header · Sample — implementation plan summary band · Relationship to the mini-table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [compact-metric-chip-strip.md](./references/compact-metric-chip-strip.md) — lighter alternative to the stat-card row
  > The shape · Chip vs card vs pill — visual weight ladder · Anatomy — label colon value · Inline `<strong>` on the value · Wrap behavior · Colored chip variants — `.chip-good` / `.chip-bad` · Sample — PR change-summary strip · Sample — release notes meta strip · Sample — test result strip · Combining with a table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [impact-mini-table.md](./references/impact-mini-table.md) — 2-col compact label/value with right-aligned mono numbers
  > The shape · Why no header row · Author it as a `data` table with `nosort` everywhere · Right-aligning the value column · Mono-spaced numbers — tabular-nums · Max-width 460px · Comparison to a list · Sample — incident impact · Sample — perf snapshot · Sample — deploy stats · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [pro-con-tradeoff-grid.md](./references/pro-con-tradeoff-grid.md) — 2-col pros + cons sub-grid with colored dots
  > The shape · Why a table, not a `<ul>` · Dot color = token, not literal hex · Equal-width columns or content-fit · Row count — keep it tight · Pairing with a code panel · Accessibility — text + color · Sample — 2-column pro/con beside a code panel · Sample — vertical pro-and-con (single column) · Sample — 3-column "Pros / Cons / Open questions" · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [kanban-as-table.md](./references/kanban-as-table.md) — Now / Next / Later / Cut triage table
  > The shape · Why a table instead of cards · The 4-column convention — Now / Next / Later / Cut · Column-top color border = the priority signal · One ticket per cell · Ragged columns — columns of unequal length · Optional drag-to-reorder (out of scope for tables module) · Export as markdown — the "throwaway editor" pattern · Sample HTML — static kanban table · Sample HTML — kanban with summary footer counts · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [decision-matrix-pattern.md](./references/decision-matrix-pattern.md) — rules → outcomes decision aid (chart picker, error map)
  > The shape · Distinct from a coverage matrix · Distinct from a compare table · Rows are conditions; columns are properties of the outcome · The "default fallback" row · Inline `<code>` for technical conditions · Sample — chart-type decision matrix · Sample — HTTP status response matrix · Sample — sort tie-break decision matrix · Sample — error handling matrix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [token-spec-table.md](./references/token-spec-table.md) — DESIGN.md token specification (Role / Hex / System / Notes)
  > The shape · Why semantic roles, not descriptive names · 4-column canonical layout · Light + dark — two tables, not two columns · The "System color" column · Inline hex with a swatch · Click-to-copy hex on hover · Sample — color tokens (light) · Sample — color tokens (dark) — same table, different values · Sample — typography tokens · Sample — spacing tokens · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [colored-cell-board.md](./references/colored-cell-board.md) — chess board, sudoku grid, 3×3 colored-cell visual
  > The shape · Distinct from a matrix table · Cell-driven color via `data-cell-color` · Optional cell glyph or number · Fixed table-layout for uniform cells · Square cells via `aspect-ratio: 1` · Chess-board alternating colors · Sample — 3×3 colored-cell demo · Sample — chess-board with piece glyphs · Sample — sudoku 9×9 grid · Sample — color-coded heat board · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract

## Visual verification

Every visual change MUST be verified per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md). Run the dev-browser snippets there for: light + dark theme parity (R1), no-nested-scrollbars (R2), `aria-sort` after each sort cycle, atom-contract stamps (`data-ve-comment-id` on rows / `data-ve-id` on matrix and compare cells), CSV button presence + clipboard copy contents.
