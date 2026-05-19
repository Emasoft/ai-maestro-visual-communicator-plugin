---
name: amvcp-typo-editorial
description: "Editorial typography register for visual-communicator pages — eyebrow/overline labels, lead paragraphs, drop caps, pull quotes/blockquotes, figures/captions, badge/pill/chip typography, emphasis/strong/mark. The publishing register on top of foundation. Use when adding editorial elements (drop caps, pull quotes, leads, captions, badges) to a page. Trigger with 'eyebrow', 'lead paragraph', 'drop cap', 'pull quote', 'blockquote', 'figure caption', 'badge typography', 'em strong mark'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography Editorial Register

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling typography skills:** [amvcp-typography](../amvcp-typography/SKILL.md) (router) · [amvcp-typo-foundation](../amvcp-typo-foundation/SKILL.md) · [amvcp-typo-editorial](../amvcp-typo-editorial/SKILL.md) · [amvcp-typo-microtype](../amvcp-typo-microtype/SKILL.md) · [amvcp-typo-structure](../amvcp-typo-structure/SKILL.md) · [amvcp-typo-code-keys](../amvcp-typo-code-keys/SKILL.md) · [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md).

## Overview

Editorial typography roles: eyebrows above headings, lead paragraphs after headings, drop caps for openers, pull quotes and blockquotes, figures with auto-numbered captions, badges/pills/chips, and the full `<em>`/`<strong>`/`<mark>`/`<ins>`/`<del>`/`<s>`/`<u>` emphasis register. Every role themes off `--vc-*` tokens.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- A modern browser. No npm dependency.
- `<html lang="…">` MUST be set (see [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md)).

## Instructions

1. **Add eyebrow** above headings — [eyebrow-overline-label.md](./references/eyebrow-overline-label.md).
2. **Add lead paragraph** after a heading — [lead-paragraph.md](./references/lead-paragraph.md).
3. **Add drop cap** to editorial openers — [drop-cap-and-initial.md](./references/drop-cap-and-initial.md).
4. **Set up blockquote / pull quote** — [pull-quote-and-blockquote.md](./references/pull-quote-and-blockquote.md).
5. **Auto-number figures + captions** — [figure-and-caption.md](./references/figure-and-caption.md).
6. **Style badges / pills / chips** — [badge-pill-chip-typography.md](./references/badge-pill-chip-typography.md).
7. **Apply inline emphasis** — [emphasis-and-strong.md](./references/emphasis-and-strong.md).

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
<p class="vc-type-eyebrow">SECTION 3</p>
<h2>The contract</h2>
<p class="vc-type-lead">A short, italic-leaning paragraph that introduces the section.</p>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

This skill supports `data-ve-mode="readonly"` only — typography is foundational substrate, not interactive content. The per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composed by every other amvcp-* skill on the page (R22) — typography is the text substrate. The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling typography skills (foundation + editorial + structure + …).

## Resources

- [badge-pill-chip-typography.md](./references/badge-pill-chip-typography.md)
 > What it is · The shared typography contract · Scaffold · Tokens consumed / extended · Why `white-space: nowrap` · Why `border-radius: 999px` for pills, `4px` for chips · Tabular numerics in pills · Auto-pill — the "auto-generated" doc marker · Light + dark — fully covered · Severity colouring — DT-19 ownership · Accessibility · The runtime's current pill use · Selection-contract conformance · When to use each · Verification · Cross-references
- [drop-cap-and-initial.md](./references/drop-cap-and-initial.md)
 > What it is · Scaffold · The contract — the alternative `vc-initial-large` · Tokens consumed / extended · Why the heading face for the first letter · The `:first-of-type` qualifier — only the first paragraph · The all-caps risk — `::first-letter` and `text-transform` · Multilingual considerations · Light + dark — fully covered · Browser support · Selection-contract conformance · When to use a drop cap · When NOT to use a drop cap · Verification · Cross-references
- [emphasis-and-strong.md](./references/emphasis-and-strong.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic and not just colour for `<em>` · Why bold and not bigger for `<strong>` · Why `<mark>` uses a tinted background, not a colour change · `<ins>` and `<del>` — the revision pair · `<u>` — dotted, not solid · `<s>` — generally available, often misused · Combined `<em><strong>` — the absolute-critical case · Light + dark — fully covered · Combinations with `text-transform` · Selection-contract conformance · When NOT to use · Verification · Cross-references
- [eyebrow-overline-label.md](./references/eyebrow-overline-label.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Visual variants · Tracking — why exactly 0.08em · Sizing — why 11px and not 12px · Light + dark — correct for free · Selection-contract conformance · Decision-mini-pill · Comment thread · When to choose this technique · When NOT to use it · No nested scrollbars · Light/dark coverage check · Migration from runtime hard-codes · Cross-references
- [figure-and-caption.md](./references/figure-and-caption.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic caption · Why `opacity: 0.85` (not a colour) · The CSS counter — `counter-increment` + `counter()` · Side-floated figures and body wrap · Wide figures and the `100vw` trick · Alt text — non-negotiable · The `<picture>` element for responsive images · Light + dark — fully covered · Selection-contract conformance · When NOT to wrap in `<figure>` · Verification · Cross-references
- [lead-paragraph.md](./references/lead-paragraph.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why size step 3, not step 4 · Why line-height 1.60 (looser than body's 1.55) · The first-letter drop cap — when to add it · The clay/colour left-border — TL;DR card variant · Light + dark — correct for free · Selection-contract conformance · Why two aliases (`vc-type-lead` AND `vc-type-body-lg`) · When NOT to use a lead · Lead + eyebrow + heading — the standard opener · No nested scrollbars · Cross-references
- [pull-quote-and-blockquote.md](./references/pull-quote-and-blockquote.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why blockquote uses the body face but pull quote uses the heading face · The cite attribution — `<cite>` styling · Border colour — `var(--vc-color-accent, currentColor)` · The pull quote alignment — center vs left · Light + dark — fully covered · The pull quote with opening / closing quotation glyphs · When to use blockquote vs pull quote · When NOT to use a pull quote · Selection-contract conformance · Verification · Cross-references
