---
name: amvcp-typo-foundation
description: "Foundation typography for visual-communicator pages — type scale, font pairings, semantic hierarchy, variable fonts, spacing/rhythm, responsive fluid headings. The Tier-1 substrate other typography skills build on. Use when setting up the type substrate of any page (scale, fonts, hierarchy, spacing). Trigger with 'type scale', 'font pairing', 'semantic hierarchy', 'variable font', 'spacing rhythm', 'fluid heading'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography Foundation

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling typography skills:** [amvcp-typography](../amvcp-typography/SKILL.md) (router) · [amvcp-typo-foundation](../amvcp-typo-foundation/SKILL.md) · [amvcp-typo-editorial](../amvcp-typo-editorial/SKILL.md) · [amvcp-typo-microtype](../amvcp-typo-microtype/SKILL.md) · [amvcp-typo-structure](../amvcp-typo-structure/SKILL.md) · [amvcp-typo-code-keys](../amvcp-typo-code-keys/SKILL.md) · [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md).

## Overview

Foundation typography: fluid `clamp()` scale, semantic `<h1>`–`<h6>` / `<p>` / `<small>` hierarchy, font pairings (5 banned-font-free presets + System fallback + 3 tri-font stacks), variable-font axis tokens, spacing/vertical-rhythm contract, and responsive fluid heading sizes for slides/hero. Theme off `--vc-*` typography tokens emitted by the DESIGN.md engine.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- A modern browser. No npm dependency.
- `<html lang="…">` MUST be set (see [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md)).

## Instructions

1. **Pick a scale system** (Perfect Fourth default). See [type-scale-engine.md](./references/type-scale-engine.md).
2. **Pick a font pairing.** See [font-loading-pairings.md](./references/font-loading-pairings.md). NEVER recommend Inter / Roboto / Open Sans / Lato / Nunito as primary.
3. **Embed the DESIGN.md `typography` block** with fonts + scale.
4. **Apply the semantic hierarchy** — see [semantic-hierarchy.md](./references/semantic-hierarchy.md).
5. **Add variable-font tokens** if using variable fonts. See [variable-font-tokens.md](./references/variable-font-tokens.md).
6. **Set spacing/rhythm** per [spacing-and-vertical-rhythm.md](./references/spacing-and-vertical-rhythm.md).

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
<article class="vc-doc">
  <h1>Page title</h1>
  <h2>Section heading</h2>
  <p>Body copy using the fluid clamp() base.</p>
</article>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

This skill supports `data-ve-mode="readonly"` only — typography is foundational substrate, not interactive content. The per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composed by every other amvcp-* skill on the page (R22) — typography is the text substrate. The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling typography skills (foundation + editorial + structure + …).

## Resources

- [font-fallback-and-display-swap.md](./references/font-fallback-and-display-swap.md)
 > What it is · The contract · The Google Fonts URL · The preconnect optimisation · Self-hosting via `@font-face` · Metric-matched fallbacks — `size-adjust` · Variable-font weight ranges · Subsetting — `&text=` · Tokens consumed / extended · Light + dark — orthogonal · When the network fails · `font-display: optional` for opt-out · Selection-contract conformance · Verification · When NOT to use a web font · Cross-references
- [font-loading-pairings.md](./references/font-loading-pairings.md)
 > D.1 DT-09 banned-font reconciliation · D.2 The five pairings · D.3 Loading discipline · D.4 The offline / System pairing · D.5 CJK — cross-reference to `design-tokens` DT-25 · Tokens consumed
- [responsive-fluid-headings.md](./references/responsive-fluid-headings.md)
 > What it is · The contract · Why each constant — the tuning · Scaffold · Tokens consumed / extended · The viewport-curve formula · Why pure `vw` and not `rem + vw` · Height breakpoints — compact viewports · Light + dark — orthogonal · The `clamp()` math when `vw` doesn't work — print and PDF · Browser support · Selection-contract conformance · When NOT to use fluid headings · Verification · Cross-references
- [semantic-hierarchy.md](./references/semantic-hierarchy.md)
 > B.1 The contract table · B.2 How it is delivered · B.3 Why the hierarchy is *strict* · B.4 No-nested-scrollbars compliance · B.5 Light + dark — correct for free · B.6 Runtime migration map (NOT this skill's build work) · Tokens consumed
- [spacing-and-vertical-rhythm.md](./references/spacing-and-vertical-rhythm.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why margin-bottom only (not margin-top) on paragraphs · The `:first-child` no-top-margin rule · The adjacent-sibling rule for heading-then-paragraph · The eyebrow-then-heading tight pairing · Baseline grid — `.vc-baseline-grid` · Why heading margins decrease with rank · Light + dark — orthogonal · When the agent overrides · Selection-contract conformance · When NOT to follow the contract · Verification · Cross-references
- [tri-font-stack-anthropic.md](./references/tri-font-stack-anthropic.md)
 > What it is · Why three faces (not two) · DESIGN.md frontmatter · The three Google-Fonts-served tri-font presets · Banned-font check · Tokens consumed / extended · The `<code>` chip — the integration receipt · Selection-contract conformance · When to choose a tri-font preset · When to choose System over a Google-served preset · Light + dark — orthogonal · Verification · Cross-references
- [type-scale-engine.md](./references/type-scale-engine.md)
 > A.1 What it does · A.2 The clamp() machinery · A.3 The HTML it scaffolds · A.4 The four modular-scale systems · A.5 Pre-computed scales for base 16px · A.6 Display-tier optical correction (TY-08) · A.7 The type-specimen page (sub-technique E) · Tokens consumed / extended · No nested scrollbars
- [variable-font-tokens.md](./references/variable-font-tokens.md)
 > C.1 What it does · C.2 The semantic weight tokens · C.3 The optical-size tokens · C.4 The variable-font axis layer · C.5 The static-font fallback — fail-soft (TY-04 requirement) · C.6 The JS feature-detect — diagnostic only · C.7 TY-10 — stylistic alternates · Tokens consumed / extended
