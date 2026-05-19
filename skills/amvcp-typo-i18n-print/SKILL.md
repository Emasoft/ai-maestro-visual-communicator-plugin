---
name: amvcp-typo-i18n-print
description: "I18n + print + accessibility typography for visual-communicator pages — html lang, BCP-47 tags, RTL, CJK font bridge (DT-25), at-page print stylesheet, no-print utilities, semantic HTML, focus rings, reduced-motion. Use when setting up i18n, print stylesheets, or a11y features. Trigger with 'html lang', 'BCP-47', 'CJK typography', 'RTL', 'print stylesheet', 'a11y typography', 'screen reader'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography I18n + Print + A11y

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling typography skills:** [amvcp-typography](../amvcp-typography/SKILL.md) (router) · [amvcp-typo-foundation](../amvcp-typo-foundation/SKILL.md) · [amvcp-typo-editorial](../amvcp-typo-editorial/SKILL.md) · [amvcp-typo-microtype](../amvcp-typo-microtype/SKILL.md) · [amvcp-typo-structure](../amvcp-typo-structure/SKILL.md) · [amvcp-typo-code-keys](../amvcp-typo-code-keys/SKILL.md) · [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md).

## Overview

International + print + accessibility typography: setting `<html lang>` with BCP-47 tags (the prereq for hyphenation + smart quotes + CJK font selection), bridging to CJK fonts via the `design-tokens` DT-25 contract, the print stylesheet contract with `@page` + URL-after-link + no-print utilities, and the screen-reader/keyboard accessibility contract (semantic HTML + contrast gates + focus rings + reduced-motion).

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- A modern browser. No npm dependency.
- `<html lang="…">` MUST be set (see [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md)).

## Instructions

1. **Set `<html lang>`** correctly — [language-and-locale.md](./references/language-and-locale.md).
2. **Render CJK content** — [cjk-typography-bridge.md](./references/cjk-typography-bridge.md).
3. **Set up print stylesheet** — [print-and-paged-media.md](./references/print-and-paged-media.md).
4. **Make the page accessible** — [accessibility-and-screen-reader.md](./references/accessibility-and-screen-reader.md).

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
<!DOCTYPE html>
<html lang="en">
<head><title>Doc</title></head>
<body><p lang="ja">日本語の段落。</p></body>
</html>
```

## Visual verification

For every visual change, verify per `skills/amvcp-self-debug-rules/SKILL.md` — dev-browser screenshots in BOTH light and dark themes.

## Modes

This skill supports `data-ve-mode="readonly"` only — typography is foundational substrate, not interactive content. The per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composed by every other amvcp-* skill on the page (R22) — typography is the text substrate. The only exclusive skill is the overlay-runtime (R24). Combine freely with sibling typography skills (foundation + editorial + structure + …).

## Resources

- [accessibility-and-screen-reader.md](./references/accessibility-and-screen-reader.md)
 > What it is · Contract — semantic HTML · The contrast gates · `prefers-reduced-motion` · `prefers-contrast` · `prefers-color-scheme` · Focus rings — the keyboard contract · Skip links — the navigation contract · Alt text — typography's role · Semantic landmarks · The `aria-label` / `aria-labelledby` contract · Tokens consumed / extended · Light + dark — orthogonal · When the agent should override · When NOT to override · Verification · Cross-references
- [cjk-typography-bridge.md](./references/cjk-typography-bridge.md)
 > What it is · What the typography skill emits · What the typography skill DEFERS to DT-25 · Scaffold — a CJK-tagged page · Scaffold — mixed Latin / CJK content · Tokens consumed / extended · Why this skill doesn't OWN the CJK contract · The bouten / kenten dot pattern · Why `#ff6600` (Claude orange) · CJK with `<html lang="zh-Hans">` vs `"zh-Hant">` · Light + dark — correct for both · Selection-contract conformance · When NOT to use the CJK contract · Verification · Cross-references
- [language-and-locale.md](./references/language-and-locale.md)
 > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and `lang="zh-Hans"` / `"zh-Hant"` / `"ja"` / `"ko"` · Why we don't use `<meta http-equiv="Content-Language">` · The runtime's language declaration · Tokens consumed / extended · Light + dark — orthogonal · Selection-contract conformance · The `:lang()` CSS selector · When NOT to set `lang` · Verification · Cross-references
- [print-and-paged-media.md](./references/print-and-paged-media.md)
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `11pt` body and not a `var(--vc-text-2)` · Why `1.5cm 1.5cm 2cm 1.5cm` margins · Why `break-after: avoid` on headings · Why show URLs for `<a href="http…">` · The `.vc-no-print` and `.vc-only-print` utilities · Forced page breaks · Disabling animation on print · Light + dark — N/A for print · Browser support · The runtime's print path · Forbidden — inner scrollbars on print · Selection-contract conformance · When NOT to ship print CSS · Verification · Cross-references
