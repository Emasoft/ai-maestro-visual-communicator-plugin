---
name: amvcp-typo-microtype
description: "Microtypography polish for visual-communicator pages — small caps, OpenType ligatures/fractions/ordinals/stylistic alternates, tabular numerics, superscript/subscript/footnotes, smart curly quotes/em-dashes/en-dashes, hyphenation/justification. Use when polishing typography microtype features (small caps, ligatures, tabular nums, smart quotes, hyphenation). Trigger with 'small caps', 'ligatures', 'OpenType features', 'tabular nums', 'superscript subscript', 'smart quotes', 'hyphens justify'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography Microtype Features

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling typography skills:** [amvcp-typography](../amvcp-typography/SKILL.md) (router) · [amvcp-typo-foundation](../amvcp-typo-foundation/SKILL.md) · [amvcp-typo-editorial](../amvcp-typo-editorial/SKILL.md) · [amvcp-typo-microtype](../amvcp-typo-microtype/SKILL.md) · [amvcp-typo-structure](../amvcp-typo-structure/SKILL.md) · [amvcp-typo-code-keys](../amvcp-typo-code-keys/SKILL.md) · [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md).

## Overview

Microtypography polish: `font-variant-caps` for small caps, OpenType ligatures/fractions/ordinals via `font-feature-settings`, tabular numerics for spreadsheet columns, `<sup>`/`<sub>`/footnotes with back-references, smart curly quotes / em-dashes / en-dashes / ellipses, and `hyphens: auto` + `text-align: justify` for narrow columns. Every feature themes off `--vc-*` tokens.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- A modern browser. No npm dependency.
- `<html lang="…">` MUST be set (see [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md)).

## Instructions

1. **Render acronyms as small caps** — [small-caps-and-petite-caps.md](./references/small-caps-and-petite-caps.md).
2. **Enable ligatures / fractions / ordinals** — [ligatures-and-opentype-features.md](./references/ligatures-and-opentype-features.md).
3. **Lock numeric columns with tabular numerics** — [tabular-numerics.md](./references/tabular-numerics.md).
4. **Render `<sup>` / `<sub>` and footnotes** — [superscript-subscript-and-footnotes.md](./references/superscript-subscript-and-footnotes.md).
5. **Use smart curly quotes / em-dashes** — [quotation-marks-and-smart-typography.md](./references/quotation-marks-and-smart-typography.md).
6. **Add justification + hyphenation for narrow columns** — [hyphenation-and-justification.md](./references/hyphenation-and-justification.md).

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
<p><abbr class="vc-acronym" title="American Standard Code for Information Interchange">ASCII</abbr> is small-capped.</p>
<table class="vc-tabular-nums"><tr><td>1,234.56</td></tr></table>
<p>“Smart” curly quotes — em-dashes — and en-dashes.</p>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

This skill supports `data-ve-mode="readonly"` only — typography is foundational substrate, not interactive content. The per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composed by every other amvcp-* skill on the page (R22) — typography is the text substrate. The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling typography skills (foundation + editorial + structure + …).

## Resources

- [hyphenation-and-justification.md](./references/hyphenation-and-justification.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · When to opt in · Why `hyphens: auto` and not `hyphens: manual` · The `.vc-no-hyphens` modifier · The widow / orphan controls · Light + dark — orthogonal · Browser support · The runtime's existing justification use · When NOT to use justification · Forbidden — `text-justify: distribute` · CJK justification · Selection-contract conformance · Cross-references
- [ligatures-and-opentype-features.md](./references/ligatures-and-opentype-features.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why common-ligatures ON by default · Why discretionary-ligatures OFF by default · Why kerning is explicitly set · Auto-fractions vs Unicode fractions · Stylistic sets — `ss01` through `ss20` · Light + dark — orthogonal · Browser support · When the font doesn't have a feature · Selection-contract conformance · When NOT to opt in · Verification · Cross-references
- [quotation-marks-and-smart-typography.md](./references/quotation-marks-and-smart-typography.md)
 > What it is · The `<q>` element default · Editorial conventions — the four smart-punctuation rules · Typing the Unicode characters · Why the agent should use the Unicode characters directly · Tokens consumed / extended · The `.vc-no-smart-quotes` utility · The hairspace and thinspace — the fine details · Light + dark — orthogonal · Selection-contract conformance · When to ignore the conventions · Verification · Cross-references
- [small-caps-and-petite-caps.md](./references/small-caps-and-petite-caps.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why both `font-variant-caps` AND `font-feature-settings` · True vs synthesised small caps · When to use small caps · When NOT to use small caps · Small caps vs `text-transform: uppercase` · The light + dark coverage · Why `letter-spacing: 0.04em` on `.vc-acronym` · Comparison with `<abbr title="…">` — semantic abbreviation · Selection-contract conformance · Browser support · Verification · Cross-references
- [superscript-subscript-and-footnotes.md](./references/superscript-subscript-and-footnotes.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `line-height: 0` on `<sup>` / `<sub>` · Why `vertical-align: baseline` + `position: relative` + `top: -0.5em` · Why `font-size: 0.75em` · The footnote back-reference · Click-target sizing · Ordinal markers — `<sup>` vs `font-variant-numeric: ordinal` · Mathematical notation — `<sup>` vs MathML / KaTeX · Light + dark — fully covered · Selection-contract conformance · When NOT to use footnotes · Verification · Cross-references
- [tabular-numerics.md](./references/tabular-numerics.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · When the data also wants right-alignment · Mono numerics — sibling pattern · Old-style figures vs lining figures · The runtime's existing tabular numerics use · Slashed zero — when to opt in · Fail-soft on fonts without these features · Light + dark — orthogonal to theming · Selection-contract conformance · When NOT to use it · Cross-references
