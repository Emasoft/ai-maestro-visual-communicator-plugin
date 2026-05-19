---
name: amvcp-typography
description: "Router skill for the typography surface — typography split into 6 focused siblings (foundation, editorial, microtype, structure, code+keys, i18n+print+a11y). Use when the user wants ANY typography task (type scale, fonts, hierarchy, drop caps, lists, links, kbd, CJK, print) to route to the right sibling. Trigger with 'typography', 'fluid type scale', 'font pairing', 'eyebrow', 'drop cap', 'pull quote', 'list typography', 'kbd', 'CJK', 'print typography'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography (Router)

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 visual categories.

## Overview

This is the **router** for the typography surface. The typography contract was split into 6 focused siblings so each sibling's embedded TOC fits naturally and progressive discovery works without per-link contortion. The router itself emits no CSS — pick the right sibling per the table below.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- A modern browser. No npm dependency. Google Fonts optional.
- `<html lang="…">` MUST be set — see [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md).

## Instructions

1. Match the user's content shape to a row in the routing matrix below.
2. Load the matched sibling SKILL.md (only one row per task most of the time; combine freely when needed).
3. Follow that sibling's Instructions; come back here only to route a second concern.

## Output

The output is owned by the sibling skill. This router emits nothing.

## Error Handling

| Symptom | Fix |
|---|---|
| Don't know which sibling owns my need | Re-read the routing matrix; default to [foundation](../amvcp-typo-foundation/SKILL.md) when uncertain. |
| Need spans multiple siblings | Compose — load foundation first, then add editorial / structure / microtype / code-keys / i18n-print as needed. |

## Examples

```text
User: "I need an article page with drop-cap opener, pull quote, AAA links, and CJK paragraphs."
Route:
  - foundation     → type scale + font pairing + spacing
  - editorial      → drop cap + pull quote
  - structure      → links with AAA contrast + measure
  - i18n-print     → CJK + <html lang>
```

## Modes

This skill supports `data-ve-mode="readonly"` only — typography is foundational substrate. The per-element 3-state decision pill (R20-R23) does NOT apply to type samples.

## Composability

The 6 typography siblings compose freely with each other and with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

The 6 typography siblings:

- [amvcp-typo-foundation](../amvcp-typo-foundation/SKILL.md) — type scale, semantic hierarchy, font pairings, variable-font tokens, spacing/rhythm, responsive fluid headings (8 refs).
- [amvcp-typo-editorial](../amvcp-typo-editorial/SKILL.md) — eyebrow, lead, drop cap, pull quote / blockquote, figure / caption, badge / pill / chip, emphasis / strong / mark (7 refs).
- [amvcp-typo-microtype](../amvcp-typo-microtype/SKILL.md) — small caps, OpenType ligatures / fractions / ordinals, tabular numerics, sup / sub / footnotes, smart quotes / dashes, hyphenation / justification (6 refs).
- [amvcp-typo-structure](../amvcp-typo-structure/SKILL.md) — lists, links / anchors, heading anchor + sticky TOC, 65ch measure, multi-column body layout (5 refs).
- [amvcp-typo-code-keys](../amvcp-typo-code-keys/SKILL.md) — inline `<code>` / `<pre>` / `<kbd>` / `<samp>` / `<var>`, keyboard-shortcut chords, `<time>` + date columns (3 refs).
- [amvcp-typo-i18n-print](../amvcp-typo-i18n-print/SKILL.md) — `<html lang>` + BCP-47 + RTL, CJK font bridge to DT-25, print stylesheet `@page`, accessibility (semantic HTML + focus rings + reduced-motion) (4 refs).
