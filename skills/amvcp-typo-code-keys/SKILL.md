---
name: amvcp-typo-code-keys
description: "Code, key, and time typography for visual-communicator pages — inline code chips, pre blocks, kbd/samp/var, keyboard shortcuts (single key, combo, multi-step chord with modifier glyphs), time element + date-column spreadsheet table. Use when styling code snippets, keyboard shortcuts, or time/date columns on a page. Trigger with 'inline code typography', 'pre block', 'kbd', 'keyboard shortcut typography', 'time date typography'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography Code, Keys, Time

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling typography skills:** [amvcp-typography](../amvcp-typography/SKILL.md) (router) · [amvcp-typo-foundation](../amvcp-typo-foundation/SKILL.md) · [amvcp-typo-editorial](../amvcp-typo-editorial/SKILL.md) · [amvcp-typo-microtype](../amvcp-typo-microtype/SKILL.md) · [amvcp-typo-structure](../amvcp-typo-structure/SKILL.md) · [amvcp-typo-code-keys](../amvcp-typo-code-keys/SKILL.md) · [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md).

## Overview

Code + key + time typography: inline `<code>` chips at `0.9em`, `<pre>` blocks at `--vc-text-1`, `<kbd>` / `<samp>` / `<var>` styled for shortcut documentation (including multi-step chords with `⌘`/`⌥`/`⌃`/`⇧` modifier glyphs), and `<time>` elements with tabular numerics for spreadsheet-grade date columns.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- A modern browser. No npm dependency.
- `<html lang="…">` MUST be set (see [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md)).

## Instructions

1. **Render inline `<code>` chips, `<pre>` blocks, `<kbd>`, `<samp>`, `<var>`** — [code-and-mono.md](./references/code-and-mono.md).
2. **Document keyboard shortcuts** — [keyboard-shortcut-typography.md](./references/keyboard-shortcut-typography.md).
3. **Render `<time>` + a column of dates** — [time-and-datetime-typography.md](./references/time-and-datetime-typography.md).

## Output

A DESIGN.md-themed page whose typography surfaces are token-driven and theme-correct in BOTH light and dark themes. Verification page: the typography specimen (see `tests/fixtures/typography-specimen.html`).

## Error Handling

| Symptom | Fix |
|---|---|
| `--vc-text-*` resolves empty | DESIGN.md engine not loaded — its `typography` group is missing or malformed. CSS `var()` fallbacks keep the page coherent. |
| A heading uses a raw `px` size | Wrong — write a bare `<h1>`…`<h6>` or a `.vc-type-*` class; never literal sizes. |
| Banned font flagged by audit | Use a pairing from the [foundation](../amvcp-typo-foundation/SKILL.md) — all 5 presets are banned-font-free. |

## Examples

```html
<p>Press <kbd>⌘</kbd>+<kbd>K</kbd> to open the palette.</p>
<p>Inline <code>const x = 1;</code> chips.</p>
<time datetime="2026-05-19">May 19, 2026</time>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

This skill supports `data-ve-mode="readonly"` only — typography is foundational substrate, not interactive content. The per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composed by every other amvcp-* skill on the page (R22) — typography is the text substrate. The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling typography skills (foundation + editorial + structure + …).

## Resources

- [code-and-mono.md](./references/code-and-mono.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `0.9em` (not `var(--vc-text-N)`) · Why `<pre>` uses `--vc-text-1` (one step down from body) · No nested scrollbars on `<pre>` · `<kbd>` — the 1px border trick · `<var>` — italic mono · Tabular numerics in `<pre>` / `<code>` · Light + dark — fully covered · Selection-contract conformance · When to use which element · Cross-references
- [keyboard-shortcut-typography.md](./references/keyboard-shortcut-typography.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · The modifier-key glyph mapping · The cross-platform convention · Why `white-space: nowrap` on `.vc-keycombo` · The plus separator opacity · Light + dark — fully covered · Accessibility — `aria-label` for clarity · Selection-contract conformance · When NOT to use `<kbd>` · Verification · Cross-references
- [time-and-datetime-typography.md](./references/time-and-datetime-typography.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why tabular numerics by default for `<time>` · ISO 8601 — the universal datetime form · Why `.vc-datetime-tabular` switches to mono · ISO-week and Year-month · Light + dark — orthogonal · Tabular numerics composition with other numeric features · Inline date format conventions · Timezone display · Selection-contract conformance · The runtime's date use · When NOT to wrap text in `<time>` · Verification · Cross-references
