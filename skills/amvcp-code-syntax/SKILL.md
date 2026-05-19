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
  > A7.1 The resolution rule · A7.2 Why `null` is a deliberate result · A7.3 The two attribute conventions · A7.4 The 17-alias map (the full vocabulary) · A7.5 The class-extraction regex · A7.6 Why JS+TS share one table · A7.7 Unknown ids — the fail-soft path · A7.8 Multi-class robustness · A7.9 Author rules · A7.10 The future-proof shape · A7.11 No tokens consumed (this reference)
3. **Respect the source-fidelity contract.** The tokenizer runs every highlighted line through a probe that strips tags + decodes entities and asserts byte-match with source — if it fails, the line falls back to `escapeHtml(source)`. NEVER hand-inject `<span class="ve-tok-*">`; a buggy hand-wrap defeats the probe. See [integrity-probe](references/integrity-probe.md).
  > A8.1 What it does · A8.2 Why this exists · A8.3 The two probe implementations · A8.4 The call sites · A8.5 The failure-mode catalog (what the probe catches) · A8.6 What the probe does NOT catch · A8.7 The cascade — probe is the LAST line of defence · A8.8 Performance · A8.9 What an author can do (basically nothing) · A8.10 The test contract · A8.11 No tokens consumed
4. **Wrap mode is mandatory.** Code blocks ride the runtime's `white-space:pre-wrap` + hanging-indent + wrap-marker stripe — NEVER set `overflow-x:auto` on a `<pre>` or wrap it in an `overflow:auto` box. Wide code extends the page. See [wrap-and-no-inner-scroll](references/wrap-and-no-inner-scroll.md).
  > A4.1 What it does · A4.2 The rule (verbatim from the project) · A4.3 Why nested scrollbars break code reading specifically · A4.4 The wrap-marker stripe — making wraps visible · A4.5 The hanging-indent math (why it matters here) · A4.6 The author rule · A4.7 Wrap correctness with token spans · A4.8 The vertical-extent corollary · A4.9 What about a really long line (a minified bundle pasted in)? · A4.10 The verification checklist · A4.11 Project-rule cross-reference
5. **Selection + commenting.** Every `.ve-code-line` IS a selectable atom. See [code-atom-selection](references/code-atom-selection.md) for the 9-level multi-click ladder.
  > A6.1 What the runtime ships · A6.2 The 9-level multi-click ladder (code variant) · A6.3 The drag-paint contract · A6.4 The selection payload (the comment-pill format) · A6.5 The comment pill · A6.6 The hover hint (preview state) · A6.7 The yield rule (CRITICAL — re-stated) · A6.8 Author rules · A6.9 The accessibility surface · A6.10 Tokens consumed (selection-specific)
6. **Theme tokens.** Every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions — single-theme = correctness defect. See [light-dark-mirror-discipline](references/light-dark-mirror-discipline.md) and [token-roles-palette](references/token-roles-palette.md).
  > H4.1 The rule · H4.2 The standard CSS shape · H4.3 The hue-family preservation rule · H4.4 The contrast requirement · H4.5 The diff-tint mirror · H4.6 The verification ritual · H4.7 The screenshot-test integration · H4.8 The fail-soft fallback · H4.9 The "single-theme defect" examples · H4.10 Adding new tokens · H4.11 The DESIGN.md override flow · H4.12 Tokens consumed · H4.13 Cross-references

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
  > A1.1 What it does · A1.2 Why it lives outside `amvcp-runtime.js` · A1.3 Dual export · A1.4 Public API · A1.5 The 12 token roles · A1.6 The seven registered languages · A1.7 The stash-and-restore precedence model · A1.8 The integrity probe — non-negotiable · A1.9 Carry state (multi-line constructs) · A1.10 Authoring rules consumers MUST follow · A1.11 The runtime wiring contract · A1.12 Failure modes (all fail-soft) · A1.13 Tokens consumed / extended
- [token-roles-palette](references/token-roles-palette.md) — the 12 `ve-tok-<role>` classes + their `--ve-code-<role>` token bindings, light + dark mirrors, JetBrains Mono pairing.
  > A2.1 The 12 token roles · A2.2 The dark-theme defaults · A2.3 The light-theme mirror — MANDATORY · A2.4 The diff tints · A2.5 The 12 class rules · A2.6 The selection-yield rule (CRITICAL) · A2.7 JetBrains Mono pairing (CB-03 family rule) · A2.8 The verification checklist · A2.9 Tokens consumed / extended
- [gutter-anatomy](references/gutter-anatomy.md) — per-line `.ve-code-line` atom, absolute-positioned `.ve-code-linenum`, CSS counter, full-height bbox for drag-hit.
  > A3.1 What it does · A3.2 Why per-line `<span>`s, not a sibling gutter `<div>` · A3.3 The CSS counter · A3.4 The absolute-positioned linenum cell · A3.5 The per-line dynamic hanging indent · A3.6 The empty-line guard · A3.7 The wrap-marker stripe (anatomy) · A3.8 The pressed-state visual · A3.9 Opt-out: `data-ve-no-gutter` · A3.10 What the author writes · A3.11 Tokens consumed
- [wrap-and-no-inner-scroll](references/wrap-and-no-inner-scroll.md) — `white-space:pre-wrap`, hanging-indent math, wrap-marker stripe, no-nested-scrollbars invariant.
  > A4.1 What it does · A4.2 The rule (verbatim from the project) · A4.3 Why nested scrollbars break code reading specifically · A4.4 The wrap-marker stripe — making wraps visible · A4.5 The hanging-indent math (why it matters here) · A4.6 The author rule · A4.7 Wrap correctness with token spans · A4.8 The vertical-extent corollary · A4.9 What about a really long line (a minified bundle pasted in)? · A4.10 The verification checklist · A4.11 Project-rule cross-reference
- [copy-button](references/copy-button.md) — floating SVG clipboard button, `--success` swap, clipboard API + textarea fallback, byte-exact source.
  > A5.1 What it does · A5.2 Where the byte-exact source comes from · A5.3 The SVG glyphs · A5.4 The button markup the runtime injects · A5.5 The transport — clipboard API + textarea fallback · A5.6 The success swap · A5.7 What the button does NOT do · A5.8 Diff-mode copy: opt for the resolved side · A5.9 The CSV / data-fence variant · A5.10 What an author can override · A5.11 Tokens consumed
- [code-atom-selection](references/code-atom-selection.md) — `.ve-code-line` as selectable atom, drag-paint, 3-state hover/select model, 9-level multi-click ladder, selection-yield CSS.
  > A6.1 What the runtime ships · A6.2 The 9-level multi-click ladder (code variant) · A6.3 The drag-paint contract · A6.4 The selection payload (the comment-pill format) · A6.5 The comment pill · A6.6 The hover hint (preview state) · A6.7 The yield rule (CRITICAL — re-stated) · A6.8 Author rules · A6.9 The accessibility surface · A6.10 Tokens consumed (selection-specific)
- [language-resolution](references/language-resolution.md) — `data-ve-lang` vs `class="language-*"` precedence, 17-alias map, null = no highlighting.
  > A7.1 The resolution rule · A7.2 Why `null` is a deliberate result · A7.3 The two attribute conventions · A7.4 The 17-alias map (the full vocabulary) · A7.5 The class-extraction regex · A7.6 Why JS+TS share one table · A7.7 Unknown ids — the fail-soft path · A7.8 Multi-class robustness · A7.9 Author rules · A7.10 The future-proof shape · A7.11 No tokens consumed (this reference)
- [integrity-probe](references/integrity-probe.md) — source-fidelity contract, DOM + Node probe paths, "discard highlight, keep plain" fail-soft.
  > A8.1 What it does · A8.2 Why this exists · A8.3 The two probe implementations · A8.4 The call sites · A8.5 The failure-mode catalog (what the probe catches) · A8.6 What the probe does NOT catch · A8.7 The cascade — probe is the LAST line of defence · A8.8 Performance · A8.9 What an author can do (basically nothing) · A8.10 The test contract · A8.11 No tokens consumed

### Visual chrome — block-level styling, theme states
- [block-3-state-model](references/block-3-state-model.md) — normal · hover · selected · hover-over-selected via `:has()`. The 4-state outline + halo + `!important` rationale.
  > B1.1 The four states · B1.2 Why `:has()` and not a JS class toggle · B1.3 The CSS-variable neutralization trick · B1.4 The 1.5px backdrop-filter — why it's there · B1.5 The `!important` rationale · B1.6 Why the outline + halo, not a bg fill · B1.7 The 4 states in dev-tools · B1.8 Per-line vs block-level visual responsibility · B1.9 Multi-block pages · B1.10 Tokens consumed · B1.11 Don't override
- [blueprint-theme](references/blueprint-theme.md) — opt-in `ve-blueprint` graph-paper backdrop, gold grid lines, light-theme bleed.
  > B2.1 What it does · B2.2 The CSS · B2.3 Selector specifics · B2.4 Light + dark behaviour · B2.5 Composing with the 3-state model · B2.6 The 1.5px backdrop-filter under blueprint · B2.7 The wrap-marker stripe over blueprint · B2.8 Selection bg tints over blueprint · B2.9 When to use · B2.10 The cross-reference to the wireframe skill · B2.11 Tokens consumed · B2.12 Author rules
- [slate-bg-code-panel](references/slate-bg-code-panel.md) — canonical dark code container (slate bg + ivory text + 12px radius) used by composition skills.
  > B3.1 What it is · B3.2 The visual · B3.3 The markup · B3.4 The CSS (page-stylesheet, NOT runtime) · B3.5 The 12-token palette over slate · B3.6 The selection visual over slate · B3.7 The diff variant · B3.8 The file-path label variant · B3.9 When to use · B3.10 Tokens consumed · B3.11 Author rules
- [code-block-with-file-path](references/code-block-with-file-path.md) — `<span class="path">` mono header, file-path provenance pattern.
  > B4.1 What it does · B4.2 The markup · B4.3 The CSS · B4.4 The file-type icon glyphs · B4.5 The line range · B4.6 Multi-language file paths · B4.7 The selection contract · B4.8 The provenance discipline · B4.9 Pair with code-block-with-tab-bar · B4.10 Tokens consumed · B4.11 Author rules
- [code-block-with-tab-bar](references/code-block-with-tab-bar.md) — header tabbar with active-tab indicator, language-icon glyphs.
  > B5.1 What it does · B5.2 The canonical use cases · B5.3 The markup · B5.4 The 6-line JS handler · B5.5 The CSS · B5.6 The active-tab indicator · B5.7 Composing with file-path / language-icon · B5.8 Visual state during runtime selection · B5.9 The single-pane fallback (no JS) · B5.10 The `data-ve-no-gutter` opt-out per tab · B5.11 When NOT to use · B5.12 Tokens consumed · B5.13 Mined source: `14-research-feature-explainer.html`

### Hand-wrap (inline) highlight — when JS is off the table
- [inline-4class-handwrap](references/inline-4class-handwrap.md) — `kw / str / cm / fn` palette, the 5-rule discipline, when to use vs JS tokenizer.
  > C1.1 What it does · C1.2 When to choose this over the JS tokenizer · C1.3 The markup · C1.4 The CSS (page-stylesheet) · C1.5 The 5-rule discipline · C1.6 Example: a debounced-search hook explanation · C1.7 Selection / copy / accessibility · C1.8 The fallback when DESIGN.md isn't loaded · C1.9 Why this palette is "shared" · C1.10 The migration path to the JS tokenizer · C1.11 Tokens consumed
- [inline-code-chip](references/inline-code-chip.md) — `<code class="inline">` chip for paragraph mentions, mono + bg + 4px radius.
  > C2.1 What it does · C2.2 The markup · C2.3 The CSS · C2.4 The shrink-against-prose rule · C2.5 The `white-space: nowrap` rule · C2.6 When to use vs the inline 4-class hand-wrap vs a full block · C2.7 Common chip contents · C2.8 Accessibility · C2.9 Don't overuse · C2.10 Composition with the prose-pages skill · C2.11 Tokens consumed · C2.12 Don't override
- [keyword-arrow-highlight](references/keyword-arrow-highlight.md) — single-color highlight of a single keyword run inside a long line, "what changed" markup.
  > C3.1 What it does · C3.2 The markup (tokenizer variant) · C3.3 The CSS · C3.4 The link-to-focus JS · C3.5 The :target variant (URL anchor) · C3.6 Selection contract · C3.7 When to use · C3.8 Don't overuse · C3.9 Accessibility · C3.10 Tokens consumed · C3.11 Author rules

### Cross-cutting discipline
- [author-vs-runtime-boundary](references/author-vs-runtime-boundary.md) — what the author writes vs what the runtime injects; integrity-probe-friendly authoring rules.
  > H1.1 The principle · H1.2 The author's input contract · H1.3 The runtime's output contract · H1.4 The contract enforces fail-soft · H1.5 The integrity-probe-friendly authoring rules · H1.6 The runtime's responsibility surface · H1.7 What the author CAN customise · H1.8 What the author CANNOT customise · H1.9 The "post-render injection" escape hatch · H1.10 The architectural reason for this discipline · H1.11 The author's authoring checklist · H1.12 No tokens consumed (this is a discipline reference) · H1.13 Cross-references
- [light-dark-mirror-discipline](references/light-dark-mirror-discipline.md) — every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions; verification checklist.
  > H4.1 The rule · H4.2 The standard CSS shape · H4.3 The hue-family preservation rule · H4.4 The contrast requirement · H4.5 The diff-tint mirror · H4.6 The verification ritual · H4.7 The screenshot-test integration · H4.8 The fail-soft fallback · H4.9 The "single-theme defect" examples · H4.10 Adding new tokens · H4.11 The DESIGN.md override flow · H4.12 Tokens consumed · H4.13 Cross-references
