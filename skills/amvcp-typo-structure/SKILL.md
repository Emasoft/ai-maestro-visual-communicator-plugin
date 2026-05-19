---
name: amvcp-typo-structure
description: "Structural typography for visual-communicator pages — bullets/numbered/definition lists, links/anchors with AAA contrast, heading anchors and sticky/right-margin TOC, 65ch readability measure, multi-column body with widows/orphans. Use when adding lists/links/anchors/TOC/measure/multi-column to a page. Trigger with 'list typography', 'link styling', 'heading anchor', 'TOC sidebar', 'measure readability', 'multi-column layout'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography Structure

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling typography skills:** [amvcp-typography](../amvcp-typography/SKILL.md) (router) · [amvcp-typo-foundation](../amvcp-typo-foundation/SKILL.md) · [amvcp-typo-editorial](../amvcp-typo-editorial/SKILL.md) · [amvcp-typo-microtype](../amvcp-typo-microtype/SKILL.md) · [amvcp-typo-structure](../amvcp-typo-structure/SKILL.md) · [amvcp-typo-code-keys](../amvcp-typo-code-keys/SKILL.md) · [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md).

## Overview

Structural typography: `<ul>`/`<ol>`/`<dl>` lists with tight/loose/dashed/check/cross modifiers, links with AAA-contrast underlines + focus rings, heading anchors + a sticky/right-margin TOC, 65ch body measure cap, and multi-column body layout with `column-width` + `column-count` + widow/orphan tuning.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- A modern browser. No npm dependency.
- `<html lang="…">` MUST be set (see [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md)).

## Instructions

1. **Style bullets / numerals / definition lists** — [lists-and-list-typography.md](./references/lists-and-list-typography.md).
2. **Style links + anchors** with AAA contrast — [links-and-anchors.md](./references/links-and-anchors.md).
3. **Style heading anchors + sticky TOC** — [heading-anchor-and-toc.md](./references/heading-anchor-and-toc.md).
4. **Cap body prose width at 65ch** — [measure-and-readability.md](./references/measure-and-readability.md).
5. **Set up multi-column body layout** — [multi-column-layout.md](./references/multi-column-layout.md).

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
<article class="vc-type-measure">
  <h2 id="context">Context <a class="vc-anchor" href="#context">#</a></h2>
  <ul class="vc-list-dashed"><li>one</li><li>two</li></ul>
</article>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

This skill supports `data-ve-mode="readonly"` only — typography is foundational substrate, not interactive content. The per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composed by every other amvcp-* skill on the page (R22) — typography is the text substrate. The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling typography skills (foundation + editorial + structure + …).

## Resources

- [heading-anchor-and-toc.md](./references/heading-anchor-and-toc.md)
 > What it is · The heading-anchor contract · Scaffold — heading with anchor · TOC contract · Scaffold — TOC · Tokens consumed / extended · Why mono for the anchor "#" · Why the TOC uses `border-left` for hover state · Sticky TOC and `no-nested-scrollbars` · TOC right-side variant — the fixed sidebar · Skip link integration · Light + dark — fully covered · Accessibility — `aria-label` on `<nav>` · When NOT to add heading anchors · When NOT to add a TOC · Selection-contract conformance · Verification · Cross-references
- [links-and-anchors.md](./references/links-and-anchors.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `text-underline-offset: 0.2em` · Why `text-decoration-skip-ink: auto` · Why `text-decoration-thickness: 1px` (not the default) · Focus — `:focus-visible` not `:focus` · The visited-state colour — desaturated, not separate · The `.vc-link-quiet` modifier — underline only on hover · The `.vc-link-button` modifier — button-shaped link · The `.vc-link-external` modifier — small "↗" icon · Light + dark — fully covered · Accessibility — the AAA contrast pair · Selection-contract conformance · When NOT to underline · When the engine has no link token · Verification · Cross-references
- [lists-and-list-typography.md](./references/lists-and-list-typography.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · The density modifiers — tight / loose · The dashed-bullet modifier · The square-bullet modifier (status / report convention) · The check / cross / olive-dot variants · The numeral variants — `type="a"`, `type="A"`, `type="i"`, `type="I"`, `type="1"` · Definition list — `<dl>` typography · Light + dark — fully covered · Nested list rhythm · Selection-contract conformance · When NOT to use a list · Verification · Cross-references
- [measure-and-readability.md](./references/measure-and-readability.md)
 > What it is · Scaffold · Tokens consumed / extended · The exact numbers — why 65ch · Variations — `.vc-type-measure-narrow`, `.vc-type-measure-wide` · Mixing with `text-align: justify` · Centering vs left-aligned containers · The runtime's body width — current state · When NOT to use measure · When measure conflicts with the grid · Light + dark — orthogonal · Selection-contract conformance · Verification · Cross-references
- [multi-column-layout.md](./references/multi-column-layout.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · When to choose multi-column · Why `column-width` AND `column-count` · The widow/orphan tuning · Heading fragmentation · Light + dark — fully covered · Browser support · A heading that spans all columns · When the multi-column collapses to 1 · Selection-contract conformance · When NOT to use multi-column · Forbidden — fixed-height multi-columns · Cross-references
