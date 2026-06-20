---
name: amvcp-code-syntax-engine
description: "Tokenizer + runtime engine for syntax-highlighted code — dependency-free 7-language tokenizer, 12-token palette, per-line gutter, copy button, drag-paint selection, byte-fidelity integrity probe. Use when configuring tokenizer / language detection, defining the 12 `ve-tok-*` token roles, or debugging gutter / copy-button / line-selection chrome. Trigger with 'tokenizer', 'language detect', 'line numbers', 'copy code button', 'gutter', 'token palette', 'code line selection', 'integrity probe', 'highlightLine'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires `scripts/amvcp-designmd.js` (token engine) + `scripts/amvcp-runtime.js` (gutter + selection chrome) + `scripts/amvcp-code-highlight.js` (tokenizer) + `scripts/amvcp-code-highlight.css` (12-token palette)."
metadata:
  author: Emasoft
---

# Code Syntax — Engine

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between category skills.
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-syntax-engine, code-syntax-chrome, code-diff, code-snippets, code-fences.
> **Sibling:** [amvcp-code-syntax](../amvcp-code-syntax/SKILL.md) (umbrella) · [amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md) (visual chrome + inline hand-wrap).

## Overview

The **engine half** of the code-syntax substrate: the dependency-free
7-language tokenizer, the 12-token `--ve-code-*` palette, the per-line
`.ve-code-line` gutter atom, the copy button, the drag-paint selection
model (9-level ladder), and the byte-fidelity integrity probe.

**Owns** how raw source becomes tokenized, gutter-decorated, copy-able,
selectable lines. **Does NOT own** block-level visual chrome / inline
hand-wrap (→ [amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md)),
diff blocks (→ `amvcp-code-diff`), or the palette **definition**
(→ `amvcp-design-tokens`; this skill *consumes* `--ve-code-*`).

## Prerequisites

Modern browser; no npm/WASM/build step. Load in order: DESIGN.md engine
(`scripts/amvcp-designmd.js`, live re-theme), then the runtime
(`scripts/amvcp-runtime.js`, owns `.ve-code-block` chrome), then the
tokenizer + CSS (`scripts/amvcp-code-highlight.js` +
`scripts/amvcp-code-highlight.css`).

## Instructions

Author **semantic HTML only**; the runtime + tokenizer build the rest.
Each step's deep reference lives in **Resources** below (full TOCs there).

1. **Plain `<pre><code class="language-<id> ve-code-block">`** — never hand-author gutter spans, copy buttons, `ve-tok-*` spans, or selection rings; the runtime (`initCodeGutter`) + tokenizer inject them.
2. **Declare the language ONCE** (`class="language-<id>"` or `data-ve-lang`); unknown/absent → renders **plain** (byte-correct). → `language-resolution`.
3. **Source-fidelity contract** — the tokenizer byte-match-probes each line and falls back to `escapeHtml` on mismatch; NEVER hand-inject `ve-tok-*`. → `integrity-probe`.
4. **Wrap is mandatory** — `white-space:pre-wrap` + hanging-indent + wrap-marker; NEVER `overflow-x:auto` on a `<pre>` or ancestor. → `wrap-and-no-inner-scroll`.
5. **Selection** — every `.ve-code-line` is a selectable atom (9-level ladder, drag-paint). → `code-atom-selection`.
6. **Token tokens** — every `--ve-code-*` role needs a light + dark mirror; single-theme = defect. → `token-roles-palette`.

Checklist: ☐ semantic `language-<id>` markup ☐ language declared once
☐ no hand-injected `ve-tok-*` ☐ no `overflow-x:auto` ☐ both `:root`
token mirrors present ☐ screenshot-tested light + dark.

## Output

A self-contained HTML page where every code surface is a token-themed,
selectable, copy-able, no-inner-scrollbar block. Authors write semantic
HTML only; the runtime + tokenizer build the gutter, copy button, token
spans, and selection chrome.

## Modes

`data-ve-mode="readonly"` only. Lines are selectable for comment (each
carries `data-ve-comment-id`), but the per-line 3-state decision pill
(R20-R23 of `amvcp-self-debug-rules`) does NOT apply — code is for
explanation/review, not multiple-choice.

## Composability

Composes with every amvcp-* skill on the same page (R22); multiple code
blocks coexist independently. The block-level visual treatments (3-state
model, blueprint, slate-bg, headers, inline chip) live in
[amvcp-code-syntax-chrome](../amvcp-code-syntax-chrome/SKILL.md). The
only exclusive skill is the overlay-runtime (R24).

## Resources

Each reference carries its OWN complete `## Table of Contents`; the
embedded title list below mirrors it verbatim (per the never-shrink-a-TOC
rule).

- [tokenizer-contract](references/tokenizer-contract.md) — 7-language descriptor model, stash-and-restore precedence, integrity probe, `highlightLine` / `highlightBlock` / `detectLanguage` API.

  Complete TOC of `tokenizer-contract.md`:
  - A1.1 What it does
  - A1.2 Why it lives outside `amvcp-runtime.js`
  - A1.3 Dual export
  - A1.4 Public API
  - A1.5 The 12 token roles
  - A1.6 The seven registered languages
  - A1.7 The stash-and-restore precedence model
  - A1.8 The integrity probe — non-negotiable
  - A1.9 Carry state (multi-line constructs)
  - A1.10 Authoring rules consumers MUST follow
  - A1.11 The runtime wiring contract
  - A1.12 Failure modes (all fail-soft)
  - A1.13 Tokens consumed / extended

- [token-roles-palette](references/token-roles-palette.md) — the 12 `ve-tok-<role>` classes + their `--ve-code-<role>` token bindings, light + dark mirrors, JetBrains Mono pairing.

  Complete TOC of `token-roles-palette.md`:
  - A2.1 The 12 token roles
  - A2.2 The dark-theme defaults
  - A2.3 The light-theme mirror — MANDATORY
  - A2.4 The diff tints
  - A2.5 The 12 class rules
  - A2.6 The selection-yield rule (CRITICAL)
  - A2.7 JetBrains Mono pairing (CB-03 family rule)
  - A2.8 The verification checklist
  - A2.9 Tokens consumed / extended

- [gutter-anatomy](references/gutter-anatomy.md) — per-line `.ve-code-line` atom, absolute-positioned `.ve-code-linenum`, CSS counter, full-height bbox for drag-hit.

  Complete TOC of `gutter-anatomy.md`:
  - A3.1 What it does
  - A3.2 Why per-line `<span>`s, not a sibling gutter `<div>`
  - A3.3 The CSS counter
  - A3.4 The absolute-positioned linenum cell
  - A3.5 The per-line dynamic hanging indent
  - A3.6 The empty-line guard
  - A3.7 The wrap-marker stripe (anatomy)
  - A3.8 The pressed-state visual
  - A3.9 Opt-out: `data-ve-no-gutter`
  - A3.10 What the author writes
  - A3.11 Tokens consumed

- [wrap-and-no-inner-scroll](references/wrap-and-no-inner-scroll.md) — `white-space:pre-wrap`, hanging-indent math, wrap-marker stripe, no-nested-scrollbars invariant.

  Complete TOC of `wrap-and-no-inner-scroll.md`:
  - A4.1 What it does
  - A4.2 The rule (verbatim from the project)
  - A4.3 Why nested scrollbars break code reading specifically
  - A4.4 The wrap-marker stripe — making wraps visible
  - A4.5 The hanging-indent math (why it matters here)
  - A4.6 The author rule
  - A4.7 Wrap correctness with token spans
  - A4.8 The vertical-extent corollary
  - A4.9 What about a really long line (a minified bundle pasted in)?
  - A4.10 The verification checklist
  - A4.11 Project-rule cross-reference

- [copy-button](references/copy-button.md) — floating SVG clipboard button, `--success` swap, clipboard API + textarea fallback, byte-exact source.

  Complete TOC of `copy-button.md`:
  - A5.1 What it does
  - A5.2 Where the byte-exact source comes from
  - A5.3 The SVG glyphs
  - A5.4 The button markup the runtime injects
  - A5.5 The transport — clipboard API + textarea fallback
  - A5.6 The success swap
  - A5.7 What the button does NOT do
  - A5.8 Diff-mode copy: opt for the resolved side
  - A5.9 The CSV / data-fence variant
  - A5.10 What an author can override
  - A5.11 Tokens consumed

- [code-atom-selection](references/code-atom-selection.md) — `.ve-code-line` as selectable atom, drag-paint, 3-state hover/select model, 9-level multi-click ladder, selection-yield CSS.

  Complete TOC of `code-atom-selection.md`:
  - A6.1 What the runtime ships
  - A6.2 The 9-level multi-click ladder (code variant)
  - A6.3 The drag-paint contract
  - A6.4 The selection payload (the comment-pill format)
  - A6.5 The comment pill
  - A6.6 The hover hint (preview state)
  - A6.7 The yield rule (CRITICAL — re-stated)
  - A6.8 Author rules
  - A6.9 The accessibility surface
  - A6.10 Tokens consumed (selection-specific)

- [language-resolution](references/language-resolution.md) — `data-ve-lang` vs `class="language-*"` precedence, alias map, null = no highlighting.

  Complete TOC of `language-resolution.md`:
  - A7.1 The resolution rule
  - A7.2 Why `null` is a deliberate result
  - A7.3 The two attribute conventions
  - A7.4 The alias map (the full vocabulary)
  - A7.5 The class-extraction regex
  - A7.6 Why JS+TS share one table
  - A7.7 Unknown ids — the fail-soft path
  - A7.8 Multi-class robustness
  - A7.9 Author rules
  - A7.10 The future-proof shape
  - A7.11 No tokens consumed (this reference)

- [integrity-probe](references/integrity-probe.md) — source-fidelity contract, DOM + Node probe paths, "discard highlight, keep plain" fail-soft.

  Complete TOC of `integrity-probe.md`:
  - A8.1 What it does
  - A8.2 Why this exists
  - A8.3 The two probe implementations
  - A8.4 The call sites
  - A8.5 The failure-mode catalog (what the probe catches)
  - A8.6 What the probe does NOT catch
  - A8.7 The cascade — probe is the LAST line of defence
  - A8.8 Performance
  - A8.9 What an author can do (basically nothing)
  - A8.10 The test contract
  - A8.11 No tokens consumed
