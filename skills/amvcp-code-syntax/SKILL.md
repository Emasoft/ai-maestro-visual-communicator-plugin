---
name: amvcp-code-syntax
description: "Syntax-highlight surface — dependency-free 7-language tokenizer, 12-token palette, per-line gutter, copy button, drag-paint selection, integrity probe, light + dark theme contract. Use when scaffolding a syntax-highlighted code block, configuring tokenizer / language detection, defining `--ve-code-*` theme tokens, or debugging gutter / copy / selection chrome. Trigger with 'syntax highlight', 'code block', 'tokenizer', 'line numbers', 'copy code button', 'gutter', 'token palette', 'language detect'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires `scripts/amvcp-designmd.js` (token engine) + `scripts/amvcp-runtime.js` (gutter + selection chrome) + `scripts/amvcp-code-highlight.js` (tokenizer) + `scripts/amvcp-code-highlight.css` (12-token palette)."
metadata:
  author: Emasoft
---

# Code Syntax

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between category skills.
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-diff, code-snippets, code-fences.
> **Sibling code skills:** [amvcp-code-diff](../amvcp-code-diff/SKILL.md) · [amvcp-code-snippets](../amvcp-code-snippets/SKILL.md) · [amvcp-code-fences](../amvcp-code-fences/SKILL.md).

## Overview

Substrate for every code-display surface — the dependency-free 7-language
tokenizer, the 12-token `--ve-code-*` palette with mandatory light + dark
mirrors, the per-line `.ve-code-line` gutter atom, the floating copy
button, the drag-paint selection model with 9-level multi-click ladder,
and the byte-fidelity integrity probe that guarantees a highlighted line
never alters source. Also owns the visual-chrome layer (block 3-state
model, blueprint theme, slate-bg panel, file-path / tab-bar headers, the
inline `<code>` chip, the hand-wrap 4-class palette) and the author-vs-
runtime boundary that keeps the integrity probe satisfied.

**What this skill owns.** Every detail of how a `<pre><code>` becomes a
syntax-highlighted, gutter-decorated, copy-able, selectable, theme-
coherent block. The tokenizer descriptor model, the 17-alias language
map, the integrity probe, the gutter geometry, the wrap-marker stripe,
the copy-byte-exact-source transport, the 3-state hover/select model,
and the light-dark mirror discipline.

**What this skill does NOT own.** Diff blocks (→ `amvcp-code-diff`).
Multi-perspective compositions (PR review, walkthroughs, tabbed panels,
contenteditable editors → `amvcp-code-snippets`). Data fences (CSV /
JSON-as-data) and the opt-out attribute (→ `amvcp-code-fences`). The
12-token palette **definition** itself (→ `amvcp-design-tokens` — this
skill *consumes* `--ve-code-*` and documents per-role usage).

## Prerequisites

- A modern browser. No npm runtime dependency, no WASM, no build step.
- The DESIGN.md engine loaded first (`scripts/amvcp-designmd.js`) so
  every `--ve-code-*` re-themes live on a token swap.
- The runtime loaded second (`scripts/amvcp-runtime.js`) — owns the
  `.ve-code-block` chrome (gutter, copy button, selection, wrap-marker).
- The tokenizer + its CSS loaded third
  (`scripts/amvcp-code-highlight.js` + `scripts/amvcp-code-highlight.css`).

## Instructions

1. **Author plain semantic HTML.** `<pre><code class="language-py ve-code-block">` — never hand-author gutter spans, copy buttons, `<span class="ve-tok-*">` tokens, or selection rings. The runtime builds the gutter (`initCodeGutter`); the tokenizer fills each line's `.ve-code-content` with `<span class="ve-tok-*">` markup.
2. **Declare the language ONCE** on the `<pre>` or its `<code>` — either `class="language-<id>"` or `data-ve-lang="<id>"`. See [language-resolution](references/language-resolution.md) for the 17-alias map. Unknown / absent → block renders **plain** (byte-correct, never corrupted).
3. **Respect the source-fidelity contract.** The tokenizer runs every highlighted line through a probe that strips tags + decodes entities and asserts byte-match with source — if it fails, the line falls back to `escapeHtml(source)`. NEVER hand-inject `<span class="ve-tok-*">`; a buggy hand-wrap defeats the probe. See [integrity-probe](references/integrity-probe.md).
4. **Wrap mode is mandatory.** Code blocks ride the runtime's `white-space:pre-wrap` + hanging-indent + wrap-marker stripe — NEVER set `overflow-x:auto` on a `<pre>` or wrap it in an `overflow:auto` box. Wide code extends the page. See [wrap-and-no-inner-scroll](references/wrap-and-no-inner-scroll.md).
5. **Selection + commenting.** Every `.ve-code-line` IS a selectable atom. See [code-atom-selection](references/code-atom-selection.md) for the 9-level multi-click ladder.
6. **Theme tokens.** Every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions — single-theme = correctness defect. See [light-dark-mirror-discipline](references/light-dark-mirror-discipline.md) and [token-roles-palette](references/token-roles-palette.md).

Copy this checklist and track your progress:

- [ ] `<pre><code class="language-<id> ve-code-block">` markup authored
- [ ] Language declared once via `class="language-*"` OR `data-ve-lang`
- [ ] No hand-injected `<span class="ve-tok-*">` (integrity probe)
- [ ] No `overflow-x:auto` on `<pre>` or ancestor (wrap mandatory)
- [ ] `--ve-code-*` token definitions present in BOTH `:root` and `:root[data-ve-theme="light"]`
- [ ] Screenshot-tested in BOTH light + dark themes

## Output

A self-contained HTML page where every code surface is a token-themed,
selectable, copy-able, no-inner-scrollbar block. A DESIGN.md token swap
re-themes every code color and chrome detail. Authors write **semantic
HTML only** — no hand-injected color spans, no hand-authored gutter
cells, no per-block CSS.

## Error Handling

| Symptom | Fix |
|---|---|
| Tokens render as a single color | `class="language-<id>"` or `data-ve-lang="<id>"` missing — runtime cannot guess, undeclared blocks stay plain by design |
| Source byte-altered (a character lost) | A custom hand-wrap defeated the integrity probe. NEVER hand-author `<span class="ve-tok-*">`; let the tokenizer do it |
| Gutter or copy button absent | `initCodeGutter` skips a `<pre>` whose `<code>` already has child elements. Plain text only at author time |
| Horizontal scrollbar on a `<pre>` | A CSS rule set `overflow-x:auto` — remove it. The page expands; wide code wraps. See [wrap-and-no-inner-scroll](references/wrap-and-no-inner-scroll.md) |
| Colors wrong on light theme | `:root[data-ve-theme="light"]` mirror is missing for one or more `--ve-code-*` tokens. See [light-dark-mirror-discipline](references/light-dark-mirror-discipline.md) |
| `_block` selection markers don't yield to token color | Confirm `data-ve-code-sel` / `data-ve-pressed="1"` rules from `scripts/amvcp-code-highlight.css` are loaded — they set `color: inherit` on every `.ve-tok-*` span |

## Examples

**Example 1 — basic syntax highlight**

```html
<pre data-ve-code="auto" data-ve-lang="js"><code>
const greet = (name) => `Hello, ${name}!`;
</code></pre>
```

Loads `amvcp-code-highlight.js` which tokenises on `DOMContentLoaded` and
stamps `.ve-tok-keyword`, `.ve-tok-string`, `.ve-tok-fn` spans. Gutter,
copy button and wrap-marker are added automatically.

**Example 2 — code block with a file-path header**

```html
<pre data-ve-code="auto" data-ve-lang="yaml"><code><span class="path">infra/config/workers.yaml</span>
queue:
  name: jobs
  visibility_timeout_seconds: 30
</code></pre>
```

The `<span class="path">` header pattern marks the file provenance; see
[code-block-with-file-path](references/code-block-with-file-path.md).

**Example 3 — inline code chip in prose**

```html
<p>Run <code class="inline">npm test</code> to verify.</p>
```

A short mono chip with bg + 4px radius; see
[inline-code-chip](references/inline-code-chip.md).

## Visual verification

Every syntax-highlight technique MUST be screenshot-tested in BOTH light
AND dark themes. A single-theme visual is a correctness defect. See
[../amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md)
for the standard verification loop (dev-browser screenshot → JPEG-97 →
side-by-side diff). Verify that (a) tokens are visibly differentiated,
(b) the integrity probe text-content of every line byte-matches the
source, (c) the gutter, copy button, wrap-marker and selection rings
read on both themes.

## Modes

Supports `data-ve-mode="readonly"` only. Code lines are selectable for
comment (every `.ve-code-line` carries `data-ve-comment-id`), but the
per-line 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`)
does NOT apply — code is shown for explanation/review, not multiple-
choice.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple
code blocks coexist independently. The only exclusive skill is the
overlay-runtime (R24).

## Resources

### Foundation — runtime + tokenizer contract
- [tokenizer-contract](references/tokenizer-contract.md) — 7-language descriptor model, stash-and-restore precedence, integrity probe, `highlightLine` / `highlightBlock` / `detectLanguage` API.
- [token-roles-palette](references/token-roles-palette.md) — the 12 `ve-tok-<role>` classes + their `--ve-code-<role>` token bindings, light + dark mirrors, JetBrains Mono pairing.
- [gutter-anatomy](references/gutter-anatomy.md) — per-line `.ve-code-line` atom, absolute-positioned `.ve-code-linenum`, CSS counter, full-height bbox for drag-hit.
- [wrap-and-no-inner-scroll](references/wrap-and-no-inner-scroll.md) — `white-space:pre-wrap`, hanging-indent math, wrap-marker stripe, no-nested-scrollbars invariant.
- [copy-button](references/copy-button.md) — floating SVG clipboard button, `--success` swap, clipboard API + textarea fallback, byte-exact source.
- [code-atom-selection](references/code-atom-selection.md) — `.ve-code-line` as selectable atom, drag-paint, 3-state hover/select model, 9-level multi-click ladder, selection-yield CSS.
- [language-resolution](references/language-resolution.md) — `data-ve-lang` vs `class="language-*"` precedence, 17-alias map, null = no highlighting.
- [integrity-probe](references/integrity-probe.md) — source-fidelity contract, DOM + Node probe paths, "discard highlight, keep plain" fail-soft.

### Visual chrome — block-level styling, theme states
- [block-3-state-model](references/block-3-state-model.md) — normal · hover · selected · hover-over-selected via `:has()`. The 4-state outline + halo + `!important` rationale.
- [blueprint-theme](references/blueprint-theme.md) — opt-in `ve-blueprint` graph-paper backdrop, gold grid lines, light-theme bleed.
- [slate-bg-code-panel](references/slate-bg-code-panel.md) — canonical dark code container (slate bg + ivory text + 12px radius) used by composition skills.
- [code-block-with-file-path](references/code-block-with-file-path.md) — `<span class="path">` mono header, file-path provenance pattern.
- [code-block-with-tab-bar](references/code-block-with-tab-bar.md) — header tabbar with active-tab indicator, language-icon glyphs.

### Hand-wrap (inline) highlight — when JS is off the table
- [inline-4class-handwrap](references/inline-4class-handwrap.md) — `kw / str / cm / fn` palette, the 5-rule discipline, when to use vs JS tokenizer.
- [inline-code-chip](references/inline-code-chip.md) — `<code class="inline">` chip for paragraph mentions, mono + bg + 4px radius.
- [keyword-arrow-highlight](references/keyword-arrow-highlight.md) — single-color highlight of a single keyword run inside a long line, "what changed" markup.

### Cross-cutting discipline
- [author-vs-runtime-boundary](references/author-vs-runtime-boundary.md) — what the author writes vs what the runtime injects; integrity-probe-friendly authoring rules.
- [light-dark-mirror-discipline](references/light-dark-mirror-discipline.md) — every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions; verification checklist.
