---
name: amvcp-code-syntax
description: "Syntax-highlight surface — dependency-free tokenizer, 12-token palette, gutter, copy, light + dark themes. Use when scaffolding a syntax-highlighted code block, configuring tokenizer / language detection, defining `--ve-code-*` theme tokens, or debugging gutter / copy / selection chrome. Trigger with 'syntax highlight', 'code block', 'tokenizer', 'line numbers', 'copy code button', 'gutter', 'token palette', 'language detect'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires `scripts/amvcp-designmd.js` (token engine) + `scripts/amvcp-runtime.js` (gutter + selection chrome) + `scripts/amvcp-code-highlight.js` (tokenizer) + `scripts/amvcp-code-highlight.css` (12-token palette)."
metadata:
  author: Emasoft
---

# Code Syntax

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between category skills.
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-diff, code-snippets, code-fences.
> **Substrate sub-skills:** [amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md) (tokenizer + gutter + selection) · [amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md) (visual chrome + inline hand-wrap).
> **Sibling code skills:** [amvcp-code-diff](../amvcp-code-diff/SKILL.md) · [amvcp-code-snippets](../amvcp-code-snippets/SKILL.md) · [amvcp-code-fences](../amvcp-code-fences/SKILL.md).

## Overview

Umbrella for the code-display **substrate** — how a `<pre><code>` becomes a
highlighted, gutter-decorated, copy-able, selectable, theme-coherent block.
The substrate is split into two focused sub-skills (route via the table
below); this umbrella holds only the shared troubleshooting + examples.

- **[amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md)** — the
  dependency-free 7-language tokenizer, the 12-token `--ve-code-*` palette,
  the per-line `.ve-code-line` gutter atom, the copy button, the drag-paint
  selection model (9-level ladder), the byte-fidelity integrity probe.
- **[amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md)** — the
  block 3-state model, blueprint theme, slate-bg panel, file-path / tab-bar
  headers, inline `<code>` chip, 4-class hand-wrap palette, keyword-arrow
  highlight, author-vs-runtime + light/dark discipline.

**Does NOT own** diff blocks (→ `amvcp-code-diff`), multi-perspective
compositions (→ `amvcp-code-snippets`), data fences (→ `amvcp-code-fences`),
or the palette **definition** (→ `amvcp-design-tokens`; the substrate
*consumes* `--ve-code-*`).

## Routing table

| User says / job | Load this sub-skill |
|---|---|
| "tokenizer", "language detect", "line numbers", "copy button", "gutter", "selection on code lines", "integrity probe", "token roles" | **[amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md)** — tokenizer + gutter + selection. Load FIRST for any code surface. |
| "block hover/select states", "blueprint theme", "slate-bg panel", "file-path header", "tab-bar header", "inline code chip", "hand-wrap palette", "keyword highlight in a line", "author-vs-runtime boundary", "light/dark mirror for code tokens" | **[amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md)** — visual chrome + inline hand-wrap. |

Most code surfaces load **both**: the engine produces the tokenized,
gutter-decorated, selectable block; the chrome styles its container.

## Prerequisites

Modern browser; no npm/WASM/build step. Load in order: DESIGN.md engine
(`scripts/amvcp-designmd.js`, live re-theme), then the runtime
(`scripts/amvcp-runtime.js`, owns `.ve-code-block` chrome), then the
tokenizer + CSS (`scripts/amvcp-code-highlight.js` +
`scripts/amvcp-code-highlight.css`).

## Instructions

Author **semantic HTML only**; the runtime + tokenizer build the rest.
This umbrella routes; the step-level detail lives in the two sub-skills.

1. **Identify what you need** from the routing table above — tokenizer / gutter / selection (engine) vs container chrome / inline hand-wrap (chrome).
2. **Load [amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md) FIRST** — it owns the `<pre><code class="language-<id> ve-code-block">` markup contract, language resolution, the integrity probe, mandatory wrap, line selection, and the 12 token roles.
3. **Load [amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md)** if your block needs a styled container (3-state, blueprint, slate-bg), a header (file-path / tab-bar), an inline chip / hand-wrap, or the light/dark mirror discipline.
4. **Follow each loaded sub-skill's checklist**, then verify in BOTH themes.

Checklist: ☐ engine sub-skill loaded as substrate ☐ chrome sub-skill loaded
if container styling needed ☐ semantic `language-<id>` markup ☐ no
hand-injected `ve-tok-*` ☐ no `overflow-x:auto` ☐ both `:root` token mirrors
present ☐ screenshot-tested light + dark.

## Output

A self-contained HTML page where every code surface is a token-themed,
selectable, copy-able, no-inner-scrollbar block; a DESIGN.md token swap
re-themes every color and chrome detail. Authors write semantic HTML only.

## Error Handling

Symptom → fix table → [troubleshooting](references/troubleshooting.md) (its
full TOC is embedded in the Resources index below).

## Examples

Authoring snippets (basic highlight · file-path header · inline chip)
→ [examples](references/examples.md) (full TOC in the Resources index below).

## Visual verification

Screenshot-test EVERY technique in BOTH light + dark themes (single-theme =
defect). Loop → [../amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md)
(dev-browser → JPEG-97 → side-by-side). Verify tokens differentiated, lines
byte-match source, chrome reads on both themes.

## Modes

`data-ve-mode="readonly"` only. Lines are selectable for comment (each
carries `data-ve-comment-id`), but the per-line 3-state decision pill
(R20-R23 of `amvcp-self-debug-rules`) does NOT apply — code is for
explanation/review, not multiple-choice.

## Composability

Composes with every amvcp-* skill on the same page (R22); multiple code
blocks coexist independently. The only exclusive skill is the
overlay-runtime (R24).

## Resources

The substrate's technique references live in the two sub-skills — route
to them via the **Routing table** above:

- **[amvcp-code-syntax-engine](../amvcp-code-syntax-engine/SKILL.md)** — tokenizer-contract, token-roles-palette, gutter-anatomy, wrap-and-no-inner-scroll, copy-button, code-atom-selection, language-resolution, integrity-probe (8 references with complete embedded TOCs).
- **[amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md)** — block-3-state-model, blueprint-theme, slate-bg-code-panel, code-block-with-file-path, code-block-with-tab-bar, inline-4class-handwrap, inline-code-chip, keyword-arrow-highlight, author-vs-runtime-boundary, light-dark-mirror-discipline (10 references with complete embedded TOCs).

This umbrella holds only the shared troubleshooting + examples below.
Each carries its OWN complete `## Table of Contents`; the embedded title
list mirrors it verbatim (per the never-shrink-a-TOC rule).

- [troubleshooting](references/troubleshooting.md) — the symptom → fix table.

  Complete TOC of `troubleshooting.md`:
  - Symptom → fix table

- [examples](references/examples.md) — basic highlight · file-path header · inline chip authoring snippets.

  Complete TOC of `examples.md`:
  - Example 1 — basic syntax highlight
  - Example 2 — code block with a file-path header
  - Example 3 — inline code chip in prose
