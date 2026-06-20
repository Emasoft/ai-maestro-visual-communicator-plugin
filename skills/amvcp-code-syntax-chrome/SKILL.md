---
name: amvcp-code-syntax-chrome
description: "Visual chrome + inline hand-wrap for code blocks — block 3-state hover/select model, blueprint theme, slate-bg panel, file-path / tab-bar headers, inline code chip, 4-class hand-wrap palette, keyword-arrow highlight, plus the author-vs-runtime + light/dark cross-cutting discipline. Use when styling a code block's container, adding a file-path or tab-bar header, hand-wrapping inline code without the JS tokenizer, or wiring light/dark token mirrors. Trigger with 'block hover state', 'blueprint theme', 'slate panel', 'file-path header', 'tab-bar', 'inline code chip', 'hand-wrap', 'keyword highlight', 'light dark code mirror', 'author vs runtime'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires `scripts/amvcp-designmd.js` (token engine) + `scripts/amvcp-runtime.js` (gutter + selection chrome) + `scripts/amvcp-code-highlight.js` (tokenizer) + `scripts/amvcp-code-highlight.css` (12-token palette + chrome)."
metadata:
  author: Emasoft
---

# Code Syntax — Chrome

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between category skills.
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-syntax-engine, code-syntax-chrome, code-diff, code-snippets, code-fences.
> **Sibling:** [amvcp-code-syntax](../amvcp-code-syntax/SKILL.md) (umbrella) · [amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md) (tokenizer + gutter + selection).

## Overview

The **chrome half** of the code-syntax substrate: block-level visual
states (normal · hover · selected · hover-over-selected via `:has()`),
the opt-in blueprint theme, the canonical slate-bg code panel, file-path
and tab-bar headers, the inline `<code>` chip, the JS-free 4-class
hand-wrap palette, the keyword-arrow focus highlight, plus the two
cross-cutting disciplines — author-vs-runtime boundary and the light/dark
mirror requirement.

**Owns** how a tokenized code block *looks* at the container level and
how inline code is hand-coloured. **Does NOT own** the tokenizer / gutter
/ selection machinery (→ [amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md)),
diff blocks (→ `amvcp-code-diff`), or the palette **definition**
(→ `amvcp-design-tokens`).

## Prerequisites

Modern browser; no npm/WASM/build step. Load in order: DESIGN.md engine
(`scripts/amvcp-designmd.js`, live re-theme), then the runtime
(`scripts/amvcp-runtime.js`, owns `.ve-code-block` chrome), then the
tokenizer + CSS (`scripts/amvcp-code-highlight.js` +
`scripts/amvcp-code-highlight.css`).

## Instructions

Pick the chrome treatment your block needs; each step's deep reference
lives in **Resources** below (full TOCs there).

1. **Block 3-state visual** — the runtime drives normal / hover / selected / hover-over-selected via `:has()`; never override with a JS class toggle. → `block-3-state-model`.
2. **Opt-in surfaces** — `ve-blueprint` graph-paper backdrop, slate-bg dark panel; both survive soft-wrap and theme off DESIGN.md. → `blueprint-theme` + `slate-bg-code-panel`.
3. **Headers** — `<span class="path">` file-path provenance, or a tab-bar above the block for multi-variant containers. → `code-block-with-file-path` + `code-block-with-tab-bar`.
4. **Inline code** — a `<code class="inline">` chip for prose mentions, or the JS-free 4-class hand-wrap when the tokenizer is off the table. → `inline-code-chip` + `inline-4class-handwrap`.
5. **Focus** — single-keyword highlight with a gutter arrow when the prose asks the reader to focus one token. → `keyword-arrow-highlight`.
6. **Cross-cutting** — respect the author-vs-runtime boundary; every `--ve-code-*` MUST have both `:root` mirrors. → `author-vs-runtime-boundary` + `light-dark-mirror-discipline`.

Checklist: ☐ block 3-state left to the runtime ☐ headers semantic
☐ inline hand-wrap only when JS unavailable ☐ both `:root` token mirrors
present ☐ screenshot-tested light + dark.

## Output

A self-contained HTML page where every code container is theme-coherent:
3-state outlines, optional blueprint / slate backdrop, file-path or
tab-bar headers, clean inline chips, and a DESIGN.md token swap re-themes
every colour and chrome detail.

## Modes

`data-ve-mode="readonly"` only — chrome treatments are visual, not
interactive decision surfaces. The per-line 3-state decision pill
(R20-R23 of `amvcp-self-debug-rules`) does NOT apply to code.

## Composability

Composes with every amvcp-* skill on the same page (R22); the chrome
treatments layer onto blocks produced by
[amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md). Multiple
styled blocks coexist independently. The only exclusive skill is the
overlay-runtime (R24).

## Resources

Each reference carries its OWN complete `## Table of Contents`; the
embedded title list below mirrors it verbatim (per the never-shrink-a-TOC
rule).

### Visual chrome — block-level styling, theme states

- [block-3-state-model](references/block-3-state-model.md) — normal · hover · selected · hover-over-selected via `:has()`. The 4-state outline + halo + `!important` rationale.

  Complete TOC of `block-3-state-model.md`:
  - B1.1 The four states
  - B1.2 Why `:has()` and not a JS class toggle
  - B1.3 The CSS-variable neutralization trick
  - B1.4 The 1.5px backdrop-filter — why it's there
  - B1.5 The `!important` rationale
  - B1.6 Why the outline + halo, not a bg fill
  - B1.7 The 4 states in dev-tools
  - B1.8 Per-line vs block-level visual responsibility
  - B1.9 Multi-block pages
  - B1.10 Tokens consumed
  - B1.11 Don't override

- [blueprint-theme](references/blueprint-theme.md) — opt-in `ve-blueprint` graph-paper backdrop, gold grid lines, light-theme bleed.

  Complete TOC of `blueprint-theme.md`:
  - B2.1 What it does
  - B2.2 The CSS
  - B2.3 Selector specifics
  - B2.4 Light + dark behaviour
  - B2.5 Composing with the 3-state model
  - B2.6 The 1.5px backdrop-filter under blueprint
  - B2.7 The wrap-marker stripe over blueprint
  - B2.8 Selection bg tints over blueprint
  - B2.9 When to use
  - B2.10 The cross-reference to the wireframe skill
  - B2.11 Tokens consumed
  - B2.12 Author rules

- [slate-bg-code-panel](references/slate-bg-code-panel.md) — canonical dark code container (slate bg + ivory text + 12px radius) used by composition skills.

  Complete TOC of `slate-bg-code-panel.md`:
  - B3.1 What it is
  - B3.2 The visual
  - B3.3 The markup
  - B3.4 The CSS (page-stylesheet, NOT runtime)
  - B3.5 The 12-token palette over slate
  - B3.6 The selection visual over slate
  - B3.7 The diff variant
  - B3.8 The file-path label variant
  - B3.9 When to use
  - B3.10 Tokens consumed
  - B3.11 Author rules

- [code-block-with-file-path](references/code-block-with-file-path.md) — `<span class="path">` mono header, file-path provenance pattern.

  Complete TOC of `code-block-with-file-path.md`:
  - B4.1 What it does
  - B4.2 The markup
  - B4.3 The CSS
  - B4.4 The file-type icon glyphs
  - B4.5 The line range
  - B4.6 Multi-language file paths
  - B4.7 The selection contract
  - B4.8 The provenance discipline
  - B4.9 Pair with code-block-with-tab-bar
  - B4.10 Tokens consumed
  - B4.11 Author rules

- [code-block-with-tab-bar](references/code-block-with-tab-bar.md) — header tabbar with active-tab indicator, language-icon glyphs.

  Complete TOC of `code-block-with-tab-bar.md`:
  - B5.1 What it does
  - B5.2 The canonical use cases
  - B5.3 The markup
  - B5.4 The 6-line JS handler
  - B5.5 The CSS
  - B5.6 The active-tab indicator
  - B5.7 Composing with file-path / language-icon
  - B5.8 Visual state during runtime selection
  - B5.9 The single-pane fallback (no JS)
  - B5.10 The `data-ve-no-gutter` opt-out per tab
  - B5.11 When NOT to use
  - B5.12 Tokens consumed
  - B5.13 Mined source: `14-research-feature-explainer.html`

### Hand-wrap (inline) highlight — when JS is off the table

- [inline-4class-handwrap](references/inline-4class-handwrap.md) — `kw / str / cm / fn` palette, the 5-rule discipline, when to use vs JS tokenizer.

  Complete TOC of `inline-4class-handwrap.md`:
  - C1.1 What it does
  - C1.2 When to choose this over the JS tokenizer
  - C1.3 The markup
  - C1.4 The CSS (page-stylesheet)
  - C1.5 The 5-rule discipline
  - C1.6 Example: a debounced-search hook explanation
  - C1.7 Selection / copy / accessibility
  - C1.8 The fallback when DESIGN.md isn't loaded
  - C1.9 Why this palette is "shared"
  - C1.10 The migration path to the JS tokenizer
  - C1.11 Tokens consumed

- [inline-code-chip](references/inline-code-chip.md) — `<code class="inline">` chip for paragraph mentions, mono + bg + 4px radius.

  Complete TOC of `inline-code-chip.md`:
  - C2.1 What it does
  - C2.2 The markup
  - C2.3 The CSS
  - C2.4 The shrink-against-prose rule
  - C2.5 The `white-space: nowrap` rule
  - C2.6 When to use vs the inline 4-class hand-wrap vs a full block
  - C2.7 Common chip contents
  - C2.8 Accessibility
  - C2.9 Don't overuse
  - C2.10 Composition with the prose-pages skill
  - C2.11 Tokens consumed
  - C2.12 Don't override

- [keyword-arrow-highlight](references/keyword-arrow-highlight.md) — single-color highlight of a single keyword run inside a long line, "what changed" markup.

  Complete TOC of `keyword-arrow-highlight.md`:
  - C3.1 What it does
  - C3.2 The markup (tokenizer variant)
  - C3.3 The CSS
  - C3.4 The link-to-focus JS
  - C3.5 The :target variant (URL anchor)
  - C3.6 Selection contract
  - C3.7 When to use
  - C3.8 Don't overuse
  - C3.9 Accessibility
  - C3.10 Tokens consumed
  - C3.11 Author rules

### Cross-cutting discipline

- [author-vs-runtime-boundary](references/author-vs-runtime-boundary.md) — what the author writes vs what the runtime injects; integrity-probe-friendly authoring rules.

  Complete TOC of `author-vs-runtime-boundary.md`:
  - H1.1 The principle
  - H1.2 The author's input contract
  - H1.3 The runtime's output contract
  - H1.4 The contract enforces fail-soft
  - H1.5 The integrity-probe-friendly authoring rules
  - H1.6 The runtime's responsibility surface
  - H1.7 What the author CAN customise
  - H1.8 What the author CANNOT customise
  - H1.9 The "post-render injection" escape hatch
  - H1.10 The architectural reason for this discipline
  - H1.11 The author's authoring checklist
  - H1.12 No tokens consumed (this is a discipline reference)
  - H1.13 Cross-references

- [light-dark-mirror-discipline](references/light-dark-mirror-discipline.md) — every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions; verification checklist.

  Complete TOC of `light-dark-mirror-discipline.md`:
  - The rule and the canonical CSS shape
  - Per-token defaults — hue family, contrast, diff tints
  - Verification ritual and screenshot tests
  - Fail-soft fallback and "single-theme defect" examples
  - Authoring workflow — adding tokens and the DESIGN.md override
  - Tokens consumed and cross-references
