---
name: amvcp-tables-cells-badges
description: "Per-cell decoration: 3-state decision pill, risk dot/severity badge, status pill key-value, compact metric chip strip, stat-card warn modifier, colored cell board, Unicode icon headers, impact mini-table. Use when decorating individual cells with badges/pills/chips. Trigger with 'decision pill', 'risk dot', 'severity badge', 'status pill', 'metric chip', 'stat card', 'colored cell', 'icon header', 'impact mini table'."
license: MIT
compatibility: "Any modern browser. Requires scripts/amvcp-tables.js. No npm runtime dependency."
metadata:
  author: Emasoft
---

# Tables Cells + Badges

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling table skills:** [amvcp-tables](../amvcp-tables/SKILL.md) (router) · [amvcp-tables-primitives](../amvcp-tables-primitives/SKILL.md) · [amvcp-tables-sort-virt](../amvcp-tables-sort-virt/SKILL.md) · [amvcp-tables-matrix-compare](../amvcp-tables-matrix-compare/SKILL.md) · [amvcp-tables-cells-badges](../amvcp-tables-cells-badges/SKILL.md) · [amvcp-tables-special](../amvcp-tables-special/SKILL.md).

## Overview

Per-cell decoration: 3-state decision pill (R20-R23) per row, risk-dot severity badges, status pill key-value rows, compact metric chip strip, stat-card with warn modifier, colored cell board for status grids, Unicode icon column headers, and impact mini-table (single-purpose summary).

## Prerequisites

- `scripts/amvcp-tables.js` loaded next to the HTML.
- Modern browser. No npm dependency.

## Instructions

1. **Add per-cell decision pill** — [per-cell-decision-pill.md](./references/per-cell-decision-pill.md).
 > What the pill is · Why "always on, never gated by selection" · The defensive bridge — runtime helper opt-in · `attachDecisionMiniSafe()` — the failure-tolerant wrapper · Per-mode attachment points · Atom ID stamping — deterministic across re-init · Persistence model · Pill state survives a sort, a virtualization scroll, a theme toggle · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
2. **Risk dot / severity badge** — [risk-dot-severity-badge.md](./references/risk-dot-severity-badge.md).
 > When to use which · Risk dot — 9×9 circle inline · Severity badge — rounded mono pill · Why no separate "risk" column · Token-driven color palette · Accessibility — the visible label is mandatory · `<span>` semantics, not custom elements · Sample — risk dot in a status column · Sample — severity badge in a risks/mitigations table · Sample — combining both · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
3. **Status pill key-value** — [status-pill-key-value.md](./references/status-pill-key-value.md).
 > The shape · When to use a meta-pill row vs an inline mini-table · Anatomy — pill, key, value · Variants — neutral / semantic-colored · The key/value spacing trick · `font-family: mono` on the value · Wrap behavior · Inside a table — alongside another pattern · Sample — incident header meta row · Sample — release/version meta row · Sample — table row prefix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
4. **Compact metric chip strip** — [compact-metric-chip-strip.md](./references/compact-metric-chip-strip.md).
 > The shape · Chip vs card vs pill — visual weight ladder · Anatomy — label colon value · Inline `<strong>` on the value · Wrap behavior · Colored chip variants — `.chip-good` / `.chip-bad` · Sample — PR change-summary strip · Sample — release notes meta strip · Sample — test result strip · Combining with a table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
5. **Stat card with warn modifier** — [stat-card-warn-modifier.md](./references/stat-card-warn-modifier.md).
 > The shape · Why a row, not a grid · The `.warn` modifier — left-border + extra padding · Card anatomy — number + label + delta · Delta typography — small, signed, muted unless emphasized · `.warn` vs `.good` — only flag exceptions · Wrapping on narrow viewports · Sample — weekly status report header · Sample — implementation plan summary band · Relationship to the mini-table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
6. **Colored cell board** — [colored-cell-board.md](./references/colored-cell-board.md).
 > The shape · Distinct from a matrix table · Cell-driven color via `data-cell-color` · Optional cell glyph or number · Fixed table-layout for uniform cells · Square cells via `aspect-ratio: 1` · Chess-board alternating colors · Sample — 3×3 colored-cell demo · Sample — chess-board with piece glyphs · Sample — sudoku 9×9 grid · Sample — color-coded heat board · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
7. **Unicode icon column headers** — [icon-headers-unicode.md](./references/icon-headers-unicode.md).
 > The job an icon header does · The hard rule — Unicode geometric marks only · Pairing icons — open vs filled, the rank signal · The canonical 4-icon palette · Mode-specific icon idioms · The injection — span before the header text · Color is per emphasis state · Why no icons on the row-label column · Sample HTML · Choosing an icon set for a specific comparison · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
8. **Impact mini-table** — [impact-mini-table.md](./references/impact-mini-table.md).
 > The shape · Why no header row · Author it as a `data` table with `nosort` everywhere · Right-aligning the value column · Mono-spaced numbers — tabular-nums · Max-width 460px · Comparison to a list · Sample — incident impact · Sample — perf snapshot · Sample — deploy stats · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract

## Output

A themed, atom-stamped table whose rows/cells participate in the standard `data-ve-id` / decision-pill contract. Theme-orthogonal: works correctly in BOTH light and dark.

## Error Handling

| Symptom | Fix |
|---|---|
| Badge `<span>` renders unstyled | These badges are author-written `<span>`s — you must ship the `.sev` / `.risk-dot` / `.chip` CSS yourself (see each reference). The tables module does NOT inject them. |
| Decision pill missing on rows | The 3-state pill is injected by the runtime's `attachDecisionMini()`, not by author markup — confirm `amvcp-runtime.js` is loaded and the table opts into a mode (`data-ve-table="data\|matrix\|compare"`). |
| Color-only badge fails a11y | Always pair the color with a visible text label or `aria-label`; never rely on color alone. |

## Examples

Badges are plain author `<span>`s with author-defined CSS (the module does not inject them). A severity badge in a risks table:

```html
<table data-ve-table="data">
  <tbody>
    <tr><th scope="row">X</th><td><span class="sev sev-high" aria-label="High severity">HIGH</span></td></tr>
  </tbody>
</table>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

Per-skill: see Resources. Some siblings support readonly only; some support form/edit (per-cell-decision-pill in particular implements the 3-state contract from R20-R23).

## Composability

Tables compose freely with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling table skills (core + sort-virt + matrix-compare + cells-badges + special).

## Resources

- [colored-cell-board.md](./references/colored-cell-board.md)
 > The shape · Distinct from a matrix table · Cell-driven color via `data-cell-color` · Optional cell glyph or number · Fixed table-layout for uniform cells · Square cells via `aspect-ratio: 1` · Chess-board alternating colors · Sample — 3×3 colored-cell demo · Sample — chess-board with piece glyphs · Sample — sudoku 9×9 grid · Sample — color-coded heat board · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [compact-metric-chip-strip.md](./references/compact-metric-chip-strip.md)
 > The shape · Chip vs card vs pill — visual weight ladder · Anatomy — label colon value · Inline `<strong>` on the value · Wrap behavior · Colored chip variants — `.chip-good` / `.chip-bad` · Sample — PR change-summary strip · Sample — release notes meta strip · Sample — test result strip · Combining with a table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [icon-headers-unicode.md](./references/icon-headers-unicode.md)
 > The job an icon header does · The hard rule — Unicode geometric marks only · Pairing icons — open vs filled, the rank signal · The canonical 4-icon palette · Mode-specific icon idioms · The injection — span before the header text · Color is per emphasis state · Why no icons on the row-label column · Sample HTML · Choosing an icon set for a specific comparison · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [impact-mini-table.md](./references/impact-mini-table.md)
 > The shape · Why no header row · Author it as a `data` table with `nosort` everywhere · Right-aligning the value column · Mono-spaced numbers — tabular-nums · Max-width 460px · Comparison to a list · Sample — incident impact · Sample — perf snapshot · Sample — deploy stats · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [per-cell-decision-pill.md](./references/per-cell-decision-pill.md)
 > What the pill is · Why "always on, never gated by selection" · The defensive bridge — runtime helper opt-in · `attachDecisionMiniSafe()` — the failure-tolerant wrapper · Per-mode attachment points · Atom ID stamping — deterministic across re-init · Persistence model · Pill state survives a sort, a virtualization scroll, a theme toggle · Sample HTML · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [risk-dot-severity-badge.md](./references/risk-dot-severity-badge.md)
 > When to use which · Risk dot — 9×9 circle inline · Severity badge — rounded mono pill · Why no separate "risk" column · Token-driven color palette · Accessibility — the visible label is mandatory · `<span>` semantics, not custom elements · Sample — risk dot in a status column · Sample — severity badge in a risks/mitigations table · Sample — combining both · DESIGN.md tokens consumed · Selection / comment / decision-mini notes · CSV-export contract
- [stat-card-warn-modifier.md](./references/stat-card-warn-modifier.md)
 > The shape · Why a row, not a grid · The `.warn` modifier — left-border + extra padding · Card anatomy — number + label + delta · Delta typography — small, signed, muted unless emphasized · `.warn` vs `.good` — only flag exceptions · Wrapping on narrow viewports · Sample — weekly status report header · Sample — implementation plan summary band · Relationship to the mini-table · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
- [status-pill-key-value.md](./references/status-pill-key-value.md)
 > The shape · When to use a meta-pill row vs an inline mini-table · Anatomy — pill, key, value · Variants — neutral / semantic-colored · The key/value spacing trick · `font-family: mono` on the value · Wrap behavior · Inside a table — alongside another pattern · Sample — incident header meta row · Sample — release/version meta row · Sample — table row prefix · DESIGN.md tokens consumed · Selection / comment / decision-mini notes
