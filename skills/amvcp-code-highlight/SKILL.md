---
name: amvcp-code-highlight
description: "Render code, diffs and code-derived chrome — syntax-highlighted blocks driven by a dependency-free 7-language tokenizer, line-number gutter atoms, soft-wrap with hanging-indent + wrap-marker stripe, drag-paint per-line selection, floating copy button, unified + split diff views, tabbed multi-perspective panels, annotated PR review with comment bubbles anchored to line numbers, inline 4-class hand-wrapped highlighter, live-diff sidebar, contenteditable code editors with caret-preserved re-highlight, file-path + tab-bar code headers, mutually-exclusive disclosure snippet walkthroughs, click-step-to-side-panel code reveal, and a 12-token palette that re-themes light + dark via DESIGN.md. Use when scaffolding any code-display surface, a PR diff, a postmortem code panel, a tabbed config sample, a live JSON editor, or any visual whose atoms are source lines. Trigger with 'code block', 'syntax highlight', 'highlight code', 'show diff', 'split diff', 'unified diff', 'PR review', 'annotated diff', 'code review', 'tabbed code', 'multi-perspective code', 'collapsed snippet', 'config example', 'inline code chip', 'file-path label', 'JSON editor', 'live diff', 'prompt template', 'contenteditable code', 'line numbers', 'gutter', 'wrap code', 'copy code button'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires `scripts/amvcp-designmd.js` (token engine) + `scripts/amvcp-runtime.js` (gutter + selection chrome) + `scripts/amvcp-code-highlight.js` (tokenizer) + `scripts/amvcp-code-highlight.css` (12-token palette)."
metadata:
  author: Emasoft
---

# Code Highlight

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads when an agent needs to scaffold a code-display surface — a syntax-
highlighted block, a diff view, a tabbed multi-perspective code panel, a
PR review with comment bubbles anchored to line numbers, a code-snippet
walkthrough, an annotated postmortem, or a live contenteditable editor.

**What this category owns.** Every visual whose atoms are *source lines*.
The runtime (`scripts/amvcp-runtime.js → initCodeGutter`) already ships
the structural baseline: a `<pre><code>` is rebuilt into per-line
`<span class="ve-code-line">` atoms, each with a CSS-counter line-number
gutter, an absolute-positioned `.ve-code-linenum` cell that survives soft-
wrap, a hanging-indent wrap-marker stripe, drag-paint per-line selection,
a 3-state hover/select model, a floating top-right `.ve-code-copy-btn`
that copies byte-exact source, and the no-nested-scrollbars invariant
(`overflow:visible` on `<pre>` — wide code extends the page). This skill
**adds the missing layers on top**: syntax color (`scripts/amvcp-code-
highlight.js` + `.css`), diff modes, tabbed/collapsed/click-reveal
chrome, hand-wrapped 4-class inline highlighting, and a small library of
canonical PR-review / postmortem / explainer compositions.

**What this category does NOT own.** Prose paragraphs (→
`amvcp-prose-pages`). Table cells (→ `amvcp-tables`). The 12-token color
palette itself (→ `amvcp-design-tokens` — this skill *consumes*
`--ve-code-*` and contributes the `code` group's optional engine keys).
Chart axes that happen to render code-like labels (→ `amvcp-charts-and-
dashboards`).

## When to choose this category

| Job | Choose this category when… | Pick another when… |
|---|---|---|
| Show 1 source file | …it has ≥ 3 lines OR readers must reference specific lines | …it is a single inline term → prose `<code>` chip |
| Show 2 files side-by-side | …both are code AND comparison is the point | …one is prose → 2-col layout, not 2-col code |
| Show a change | …unified / split diff lives here | …the change is data, not source → `tables` compare mode |
| Show "the same change from 3 angles" | …tabbed code panel (CH-12) | …the angles are unrelated → 3 separate code blocks |
| Show 1 line in a paragraph | …inline `<code>` chip pattern (CH-08) | …never use a full code block for one line |
| Highlight `{{slot}}` in a live editor | …contenteditable + caret-save/restore (CH-19) | …the input is plain text → `<textarea>` |
| Annotate a PR | …per-file diff cards + comment bubbles (CH-13) | …it is a *review* of intent, not lines → prose page |

## Prerequisites

- A modern browser. No npm runtime dependency, no WASM, no build step.
- The DESIGN.md engine loaded first (`scripts/amvcp-designmd.js`) so
  every `--ve-code-*` re-themes live on a token swap.
- The runtime loaded second (`scripts/amvcp-runtime.js`) — owns the
  `.ve-code-block` chrome (gutter, copy button, selection, wrap-marker).
- The tokenizer + its CSS loaded third
  (`scripts/amvcp-code-highlight.js` + `scripts/amvcp-code-highlight.css`)
  — adds syntax color on top of the runtime chrome.

## Instructions

1. **Pick the technique** from the references index below. Each
   reference is self-sufficient — start at the file that matches the job
   the user actually described, not at this SKILL.md.
2. **Author plain semantic HTML.** A real `<pre><code class="language-py
   ve-code-block">` — never hand-author gutter spans, copy buttons,
   `<span class="ve-tok-*">` tokens, or diff row colors. The runtime
   builds the gutter (`initCodeGutter`); the tokenizer fills each line's
   `.ve-code-content` with `<span class="ve-tok-*">` markup; the diff
   CSS reads `data-ve-diff="add|del|ctx"` per line.
3. **Declare the language ONCE** on the `<pre>` or its `<code>` — either
   `class="language-<id>"` (CommonMark / highlight.js convention) or
   `data-ve-lang="<id>"`. Recognised ids + aliases: `js` (`javascript`,
   `ts`, `typescript`, `jsx`, `tsx`, `mjs`, `cjs`), `python` (`py`,
   `python3`), `json` (`json5`, `jsonc`), `bash` (`sh`, `shell`, `zsh`,
   `console`), `html` (`xml`, `svg`, `htm`), `css` (`scss`, `less`),
   `diff` (`patch`, `udiff`). Unknown / absent → block renders
   **plain** (byte-correct, never corrupted).
4. **Respect the source-fidelity contract.** The tokenizer runs every
   highlighted line through a probe that strips tags + decodes entities
   and asserts byte-match with the source — if it fails, the line falls
   back to `escapeHtml(source)`. Authors should NEVER hand-inject
   `<span class="ve-tok-*">` markup; a buggy hand-wrap can defeat the
   probe and corrupt source. See
   [tokenizer-contract.md](./references/tokenizer-contract.md).
     > A1.1 What it does · A1.2 Why it lives outside `amvcp-runtime.js` · A1.3 Dual export · A1.4 Public API · A1.5 The 12 token roles · A1.6 The seven registered languages · A1.7 The stash-and-restore precedence model · A1.8 The integrity probe — non-negotiable · A1.9 Carry state (multi-line constructs) · A1.10 Authoring rules consumers MUST follow · A1.11 The runtime wiring contract · A1.12 Failure modes (all fail-soft) · A1.13 Tokens consumed / extended
5. **For diff blocks** add `data-ve-diff="add|del|ctx|hunk"` per
   `.ve-code-line` (or use `data-ve-lang="diff"` to let the tokenizer's
   diff mode color the leading marker). See
   [diff-blocks-unified.md](./references/diff-blocks-unified.md) and
     > D1.1 What it does · D1.2 The author markup — preferred form · D1.3 The author markup — explicit form (when needed) · D1.4 The CSS (diff tints) · D1.5 The tints come from semantic tokens — NEVER hardcoded · D1.6 The line-through-on-del variant · D1.7 The hunk header · D1.8 Collapsing context regions (CB-01 reframed §C2) · D1.9 Copy behaviour · D1.10 Selection + commenting · D1.11 Light + dark verification · D1.12 Tokens consumed · D1.13 Author rules
   [diff-blocks-split.md](./references/diff-blocks-split.md).
     > D2.1 What it does · D2.2 The markup · D2.3 The CSS · D2.4 Where to put the diff tints · D2.5 Line-number alignment · D2.6 No shared scroll axis · D2.7 Copy behaviour per pane · D2.8 Selection across panes · D2.9 Composing with file-path label · D2.10 When to use split vs unified · D2.11 Light + dark verification · D2.12 Tokens consumed · D2.13 Author rules
6. **For PR / postmortem / explainer compositions** (multi-file diffs,
   collapsed walk-throughs, tabbed perspectives, click-step side panels)
   start at the matching composition reference — the markup is
   compositional, but the patterns are codified.
7. **Selection + commenting.** Every `.ve-code-line` IS a selectable
   atom. The runtime's `data-ve-pressed="1"` marker handles single-line
   selection; multi-line drag-paint selection produces a multi-select
   payload identical to prose paragraphs and table rows. The 9-level
   multi-click ladder applies — see
   [code-atom-selection.md](./references/code-atom-selection.md).
     > A6.1 What the runtime ships · A6.2 The 9-level multi-click ladder (code variant) · A6.3 The drag-paint contract · A6.4 The selection payload (the comment-pill format) · A6.5 The comment pill · A6.6 The hover hint (preview state) · A6.7 The yield rule (CRITICAL — re-stated) · A6.8 Author rules · A6.9 The accessibility surface · A6.10 Tokens consumed (selection-specific)
8. **Wrap mode is mandatory.** Code blocks ride the runtime's `white-
   space:pre-wrap` + hanging-indent + wrap-marker stripe — NEVER set
   `overflow-x:auto` on a `<pre>` or wrap it in an `overflow:auto` box.
   Wide code extends the page. See
   [wrap-and-no-inner-scroll.md](./references/wrap-and-no-inner-scroll.md).
     > A4.1 What it does · A4.2 The rule (verbatim from the project) · A4.3 Why nested scrollbars break code reading specifically · A4.4 The wrap-marker stripe — making wraps visible · A4.5 The hanging-indent math (why it matters here) · A4.6 The author rule · A4.7 Wrap correctness with token spans · A4.8 The vertical-extent corollary · A4.9 What about a really long line (a minified bundle pasted in)? · A4.10 The verification checklist · A4.11 Project-rule cross-reference

## Output

A self-contained HTML page where every code surface is a token-themed,
selectable, copy-able, no-inner-scrollbar block. A DESIGN.md token swap
re-themes every code color, every diff tint, and every UI chrome
detail. Authors write **semantic HTML only** — no hand-injected color
spans, no hand-authored gutter cells, no per-block CSS.

## Error Handling

| Symptom | Fix |
|---|---|
| Tokens render as a single color | `class="language-<id>"` or `data-ve-lang="<id>"` missing on `<pre>` / `<code>` — the runtime cannot guess, an undeclared block stays plain by design. |
| Source byte-altered (a character lost) | A custom hand-wrap defeated the integrity probe. NEVER hand-author `<span class="ve-tok-*">`; let the tokenizer do it. |
| Gutter or copy button absent | The runtime's `initCodeGutter` skips a `<pre>` whose `<code>` already has child elements. Plain text only, no nested highlighter markup at author time. |
| Horizontal scrollbar on a `<pre>` | A CSS rule somewhere set `overflow-x:auto` — remove it. The page expands; wide code wraps. See `wrap-and-no-inner-scroll.md`. |
| Diff colours wrong on dark theme | `data-ve-diff` mistyped, or the page's `:root[data-ve-theme="light"]` mirror is missing. Both themes are mandatory — single-theme = correctness defect. |
| Highlighter "swallows" a backtick / quote | Edge case in the language table. The integrity probe catches it and falls back to plain text — file a bug against `amvcp-code-highlight.js`, do NOT bypass with hand-wrapped spans. |
| `_block` selection markers don't yield to token color | Confirm `data-ve-code-sel` / `data-ve-code-sel-block` / `data-ve-pressed="1"` CSS rules from `scripts/amvcp-code-highlight.css` are loaded — they set `color: inherit` on every `.ve-tok-*` span so tokens read on the selection bg. |

## Examples

**Example 1 — basic syntax highlight**

```html
<pre data-ve-code="auto" data-ve-lang="js"><code>
const greet = (name) => `Hello, ${name}!`;
</code></pre>
```

Loads `amvcp-code-highlight.js` which tokenises on `DOMContentLoaded` and stamps `.ve-tok-keyword`, `.ve-tok-string`, `.ve-tok-fn` spans. Gutter, copy button and wrap-marker are added automatically.

**Example 2 — split-diff PR review**

```html
<div data-ve-diff="split" data-ve-base="oldfile.js" data-ve-head="newfile.js">
  <pre data-ve-code="auto" data-ve-lang="js" data-ve-side="base"><code>const x = 1;</code></pre>
  <pre data-ve-code="auto" data-ve-lang="js" data-ve-side="head"><code>const x = 2;</code></pre>
</div>
```

Renders a 2-column diff with `--ve-diff-add` / `--ve-diff-del` colors that re-theme cleanly under both light + dark.

**Example 3 — tabbed multi-perspective code**

```html
<div data-ve-tabs="code">
  <button data-ve-tab="server">server</button>
  <button data-ve-tab="client">client</button>
  <pre data-ve-tab-panel="server" data-ve-code="auto" data-ve-lang="py"><code>...</code></pre>
  <pre data-ve-tab-panel="client" data-ve-code="auto" data-ve-lang="ts"><code>...</code></pre>
</div>
```

## Visual verification

Every code-highlight technique MUST be screenshot-tested in BOTH light
AND dark themes. A single-theme visual is a correctness defect. See
[../amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md)
for the standard verification loop (dev-browser screenshot → JPEG-97 →
side-by-side diff). Verify that (a) tokens are visibly differentiated,
(b) the integrity probe text-content of every line byte-matches the
source, (c) the gutter, copy button, wrap-marker and selection rings
read on both themes.

## Modes

This skill supports `data-ve-mode="readonly"` only. Code lines are selectable for comment (every `.ve-code-line` carries `data-ve-comment-id`), but the per-line 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply — code is shown for explanation/review, not multiple-choice.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple code blocks, diffs, tabbed panels coexist independently. The only exclusive skill is the overlay-runtime (R24).

## Resources

The 30+ reference files below cover every code-display technique this
skill scaffolds. Read the references — this SKILL.md is an index, not
the implementation. The library is grouped:

### A. Foundation — the runtime + tokenizer contract (every other technique stands on these)
- [tokenizer-contract.md](./references/tokenizer-contract.md) — 7-language descriptor model, stash-and-restore precedence, integrity probe, `highlightLine` / `highlightBlock` / `detectLanguage` API.
  > A1.1 What it does · A1.2 Why it lives outside `amvcp-runtime.js` · A1.3 Dual export · A1.4 Public API · A1.5 The 12 token roles · A1.6 The seven registered languages · A1.7 The stash-and-restore precedence model · A1.8 The integrity probe — non-negotiable · A1.9 Carry state (multi-line constructs) · A1.10 Authoring rules consumers MUST follow · A1.11 The runtime wiring contract · A1.12 Failure modes (all fail-soft) · A1.13 Tokens consumed / extended
- [token-roles-palette.md](./references/token-roles-palette.md) — the 12 `ve-tok-<role>` classes + their `--ve-code-<role>` token bindings, light + dark mirrors, JetBrains Mono pairing.
  > A2.1 The 12 token roles · A2.2 The dark-theme defaults · A2.3 The light-theme mirror — MANDATORY · A2.4 The diff tints · A2.5 The 12 class rules · A2.6 The selection-yield rule (CRITICAL) · A2.7 JetBrains Mono pairing (CB-03 family rule) · A2.8 The verification checklist · A2.9 Tokens consumed / extended
- [gutter-anatomy.md](./references/gutter-anatomy.md) — per-line `.ve-code-line` atom, absolute-positioned `.ve-code-linenum`, CSS counter, full-height bbox for drag-hit.
  > A3.1 What it does · A3.2 Why per-line `<span>`s, not a sibling gutter `<div>` · A3.3 The CSS counter · A3.4 The absolute-positioned linenum cell · A3.5 The per-line dynamic hanging indent · A3.6 The empty-line guard · A3.7 The wrap-marker stripe (anatomy) · A3.8 The pressed-state visual · A3.9 Opt-out: `data-ve-no-gutter` · A3.10 What the author writes · A3.11 Tokens consumed
- [wrap-and-no-inner-scroll.md](./references/wrap-and-no-inner-scroll.md) — `white-space:pre-wrap`, hanging-indent math, wrap-marker stripe, the no-nested-scrollbars invariant.
  > A4.1 What it does · A4.2 The rule (verbatim from the project) · A4.3 Why nested scrollbars break code reading specifically · A4.4 The wrap-marker stripe — making wraps visible · A4.5 The hanging-indent math (why it matters here) · A4.6 The author rule · A4.7 Wrap correctness with token spans · A4.8 The vertical-extent corollary · A4.9 What about a really long line (a minified bundle pasted in)? · A4.10 The verification checklist · A4.11 Project-rule cross-reference
- [copy-button.md](./references/copy-button.md) — floating SVG clipboard button, `--success` swap, clipboard API + textarea fallback, byte-exact source.
  > A5.1 What it does · A5.2 Where the byte-exact source comes from · A5.3 The SVG glyphs · A5.4 The button markup the runtime injects · A5.5 The transport — clipboard API + textarea fallback · A5.6 The success swap · A5.7 What the button does NOT do · A5.8 Diff-mode copy: opt for the resolved side · A5.9 The CSV / data-fence variant · A5.10 What an author can override · A5.11 Tokens consumed
- [code-atom-selection.md](./references/code-atom-selection.md) — `.ve-code-line` as selectable atom, drag-paint, 3-state hover/select model, 9-level multi-click ladder for code, selection-yield CSS.
  > A6.1 What the runtime ships · A6.2 The 9-level multi-click ladder (code variant) · A6.3 The drag-paint contract · A6.4 The selection payload (the comment-pill format) · A6.5 The comment pill · A6.6 The hover hint (preview state) · A6.7 The yield rule (CRITICAL — re-stated) · A6.8 Author rules · A6.9 The accessibility surface · A6.10 Tokens consumed (selection-specific)
- [language-resolution.md](./references/language-resolution.md) — `data-ve-lang` vs `class="language-*"` precedence, alias map (all 17 aliases), null = no highlighting.
  > A7.1 The resolution rule · A7.2 Why `null` is a deliberate result · A7.3 The two attribute conventions · A7.4 The 17-alias map (the full vocabulary) · A7.5 The class-extraction regex · A7.6 Why JS+TS share one table · A7.7 Unknown ids — the fail-soft path · A7.8 Multi-class robustness · A7.9 Author rules · A7.10 The future-proof shape · A7.11 No tokens consumed (this reference)
- [integrity-probe.md](./references/integrity-probe.md) — the source-fidelity contract, DOM + Node probe paths, the "discard highlight, keep plain" fail-soft.
  > A8.1 What it does · A8.2 Why this exists · A8.3 The two probe implementations · A8.4 The call sites · A8.5 The failure-mode catalog (what the probe catches) · A8.6 What the probe does NOT catch · A8.7 The cascade — probe is the LAST line of defence · A8.8 Performance · A8.9 What an author can do (basically nothing) · A8.10 The test contract · A8.11 No tokens consumed

### B. Visual chrome — block-level styling, theme states, themes
- [block-3-state-model.md](./references/block-3-state-model.md) — normal · hover · selected · hover-over-selected via `:has(.ve-code-line[data-ve-pressed="1"])`. The 4-state outline + halo + `!important` rationale.
  > B1.1 The four states · B1.2 Why `:has()` and not a JS class toggle · B1.3 The CSS-variable neutralization trick · B1.4 The 1.5px backdrop-filter — why it's there · B1.5 The `!important` rationale · B1.6 Why the outline + halo, not a bg fill · B1.7 The 4 states in dev-tools · B1.8 Per-line vs block-level visual responsibility · B1.9 Multi-block pages · B1.10 Tokens consumed · B1.11 Don't override
- [blueprint-theme.md](./references/blueprint-theme.md) — opt-in `ve-blueprint` graph-paper backdrop, gold grid lines, light-theme bleed.
  > B2.1 What it does · B2.2 The CSS · B2.3 Selector specifics · B2.4 Light + dark behaviour · B2.5 Composing with the 3-state model · B2.6 The 1.5px backdrop-filter under blueprint · B2.7 The wrap-marker stripe over blueprint · B2.8 Selection bg tints over blueprint · B2.9 When to use · B2.10 The cross-reference to the wireframe skill · B2.11 Tokens consumed · B2.12 Author rules
- [slate-bg-code-panel.md](./references/slate-bg-code-panel.md) — the canonical dark code container (slate bg + ivory text + 12px radius) used by PR / postmortem / explainer compositions.
  > B3.1 What it is · B3.2 The visual · B3.3 The markup · B3.4 The CSS (page-stylesheet, NOT runtime) · B3.5 The 12-token palette over slate · B3.6 The selection visual over slate · B3.7 The diff variant · B3.8 The file-path label variant · B3.9 When to use · B3.10 Tokens consumed · B3.11 Author rules
- [code-block-with-file-path.md](./references/code-block-with-file-path.md) — `<span class="path">infra/config/workers.yaml</span>` mono header inside a code block, file-path provenance pattern.
  > B4.1 What it does · B4.2 The markup · B4.3 The CSS · B4.4 The file-type icon glyphs · B4.5 The line range · B4.6 Multi-language file paths · B4.7 The selection contract · B4.8 The provenance discipline · B4.9 Pair with code-block-with-tab-bar · B4.10 Tokens consumed · B4.11 Author rules
- [code-block-with-tab-bar.md](./references/code-block-with-tab-bar.md) — header tabbar with active-tab indicator, language-icon glyphs, file-type-icon row, paired with CH-12.
  > B5.1 What it does · B5.2 The canonical use cases · B5.3 The markup · B5.4 The 6-line JS handler · B5.5 The CSS · B5.6 The active-tab indicator · B5.7 Composing with file-path / language-icon · B5.8 Visual state during runtime selection · B5.9 The single-pane fallback (no JS) · B5.10 The `data-ve-no-gutter` opt-out per tab · B5.11 When NOT to use · B5.12 Tokens consumed · B5.13 Mined source: `14-research-feature-explainer.html`

### C. Hand-wrap (inline) highlight — when JS is off the table
- [inline-4class-handwrap.md](./references/inline-4class-handwrap.md) — `kw / str / cm / fn` palette, the 5-rule discipline, when to use vs the JS tokenizer. The catalog's shared 4-class palette mined from every demo file.
  > C1.1 What it does · C1.2 When to choose this over the JS tokenizer · C1.3 The markup · C1.4 The CSS (page-stylesheet) · C1.5 The 5-rule discipline · C1.6 Example: a debounced-search hook explanation · C1.7 Selection / copy / accessibility · C1.8 The fallback when DESIGN.md isn't loaded · C1.9 Why this palette is "shared" · C1.10 The migration path to the JS tokenizer · C1.11 Tokens consumed
- [inline-code-chip.md](./references/inline-code-chip.md) — `<code class="inline">` chip for paragraph mentions, mono + bg + 4px radius.
  > C2.1 What it does · C2.2 The markup · C2.3 The CSS · C2.4 The shrink-against-prose rule · C2.5 The `white-space: nowrap` rule · C2.6 When to use vs the inline 4-class hand-wrap vs a full block · C2.7 Common chip contents · C2.8 Accessibility · C2.9 Don't overuse · C2.10 Composition with the prose-pages skill · C2.11 Tokens consumed · C2.12 Don't override
- [keyword-arrow-highlight.md](./references/keyword-arrow-highlight.md) — single-color highlight of a single keyword run inside a long line, "what changed" markup.
  > C3.1 What it does · C3.2 The markup (tokenizer variant) · C3.3 The CSS · C3.4 The link-to-focus JS · C3.5 The :target variant (URL anchor) · C3.6 Selection contract · C3.7 When to use · C3.8 Don't overuse · C3.9 Accessibility · C3.10 Tokens consumed · C3.11 Author rules

### D. Diff blocks
- [diff-blocks-unified.md](./references/diff-blocks-unified.md) — per-line `data-ve-diff="add|del|ctx|hunk"`, color tints from `--ve-code-diff-*`, single-column rendering, line-through-on-del variant.
  > D1.1 What it does · D1.2 The author markup — preferred form · D1.3 The author markup — explicit form (when needed) · D1.4 The CSS (diff tints) · D1.5 The tints come from semantic tokens — NEVER hardcoded · D1.6 The line-through-on-del variant · D1.7 The hunk header · D1.8 Collapsing context regions (CB-01 reframed §C2) · D1.9 Copy behaviour · D1.10 Selection + commenting · D1.11 Light + dark verification · D1.12 Tokens consumed · D1.13 Author rules
- [diff-blocks-split.md](./references/diff-blocks-split.md) — two synced panes sharing the page-level scroll axis, optional collapsed-context regions, copy-resolved-side button.
  > D2.1 What it does · D2.2 The markup · D2.3 The CSS · D2.4 Where to put the diff tints · D2.5 Line-number alignment · D2.6 No shared scroll axis · D2.7 Copy behaviour per pane · D2.8 Selection across panes · D2.9 Composing with file-path label · D2.10 When to use split vs unified · D2.11 Light + dark verification · D2.12 Tokens consumed · D2.13 Author rules
- [diff-gutter-old-new.md](./references/diff-gutter-old-new.md) — twin-column gutter (old line no + new line no), `@@ hunk header` row, hunk collapsibles.
  > D3.1 What it does · D3.2 The markup · D3.3 The CSS · D3.4 The runtime extension · D3.5 Hunk header rendering in twin mode · D3.6 Collapsing hunks · D3.7 Drag-paint selection across the twin gutter · D3.8 The copy behaviour · D3.9 Composition with split view · D3.10 When to use · D3.11 Light + dark verification · D3.12 Tokens consumed · D3.13 Author rules
- [diff-tints-from-semantic-tokens.md](./references/diff-tints-from-semantic-tokens.md) — `color-mix` over `--vc-color-success` / `--vc-color-danger`, never hardcoded red/green, theme-coherent diffs.
  > D4.1 The four diff tint tokens · D4.2 Why color-mix, not just lower alpha · D4.3 Why these tokens, not hardcoded green/red · D4.4 The 22% / 60% / 16% / 70% calibration · D4.5 The full fallback chain · D4.6 Adding the diff tints to DESIGN.md (optional) · D4.7 The color-mix syntax — browser support · D4.8 Selection tint over diff tint · D4.9 Print stylesheet · D4.10 What an author can override · D4.11 Author rules · D4.12 Tokens consumed · D4.13 Cross-references

### E. Multi-perspective / multi-file compositions
- [tabbed-code-panel.md](./references/tabbed-code-panel.md) — 6-line JS tabbar, `[button.on data-t="0"]` ↔ `[<pre>.on]` toggle, 3-perspectives-on-the-same-change pattern.
  > E1.1 The pattern · E1.2 The canonical perspective sets · E1.3 Anti-patterns · E1.4 The composition example: feature-explainer config sample · E1.5 The 6-line JS handler · E1.6 The "first tab is the canonical one" rule · E1.7 Tab labels — discipline · E1.8 The 2-pane variant (Before / After) · E1.9 Auto-collapse adjacent text content · E1.10 Selection / commenting across tabs · E1.11 Pair with collapsed-snippets walkthrough · E1.12 Tokens consumed · E1.13 Author rules (composition-level)
- [collapsed-snippets-walkthrough.md](./references/collapsed-snippets-walkthrough.md) — `<details>` per step, mutually-exclusive disclosure (one open at a time via `toggle` event), file:line summary, hot-step modifier.
  > E2.1 The pattern · E2.2 The markup · E2.3 The CSS · E2.4 The mutually-exclusive disclosure pattern · E2.5 The hot-step modifier · E2.6 The composition with the runtime's code block · E2.7 The walkthrough's role in larger compositions · E2.8 Selection / commenting within an expanded step · E2.9 Accessibility · E2.10 The shape variation: numbered prose without `<details>` · E2.11 Tokens consumed · E2.12 Author rules
- [pr-review-page.md](./references/pr-review-page.md) — header (avatar + branch + +N/−N) + risk-map chips + per-file diff cards + comment bubbles anchored to line numbers + collapsed safe files + suggested-next-steps checklist.
  > E3.1 The shape · E3.2 The header · E3.3 The risk-map chips · E3.4 The per-file diff card · E3.5 The comment bubble — `::before` rotated-square trick · E3.6 Anchoring comments to line numbers · E3.7 Collapsed safe files · E3.8 The next-steps checklist · E3.9 Cross-references · E3.10 Light + dark verification · E3.11 Tokens consumed · E3.12 Mined source attribution
- [pr-writeup-page.md](./references/pr-writeup-page.md) — TL;DR + before/after rationale panels + ordered file tour + "where to focus" numbered cards + test-plan checklist + rollout strip.
  > E4.1 The shape · E4.2 The TL;DR card · E4.3 The Why section — Before/After panels · E4.4 The file-by-file tour — ordered FOR READING · E4.5 The badges · E4.6 The "Where to focus" numbered cards · E4.7 The test plan checklist · E4.8 The rollout strip · E4.9 The narrow-viewport stack · E4.10 Cross-references · E4.11 Tokens consumed · E4.12 Mined source attribution
- [postmortem-code-panel.md](./references/postmortem-code-panel.md) — slate-bg diff panel inside an incident report, paired with timeline + impact mini-table.
  > E5.1 The placement · E5.2 The markup · E5.3 Why slate-bg here specifically · E5.4 The pairing with the Impact mini-table · E5.5 Selection / commenting on root-cause lines · E5.6 The "preserved evidence" principle · E5.7 The "fix is part of the evidence" principle · E5.8 The narrow-viewport rendering · E5.9 Don't combine with split-view diffs · E5.10 The light + dark verification · E5.11 Tokens consumed · E5.12 Mined source attribution
- [architecture-explainer-snippets.md](./references/architecture-explainer-snippets.md) — numbered callstack walkthrough, `[badge] [file:line] [prose] [<details> source]`, hot-step modifier on the trust boundary.
  > E6.1 The shape · E6.2 The composition with collapsed-snippets-walkthrough · E6.3 The leading SVG diagram · E6.4 The hot-step modifier · E6.5 The sticky right sidebar · E6.6 Composition with the diagram skill · E6.7 Selection / commenting flow · E6.8 Light + dark verification · E6.9 Tokens consumed · E6.10 Mined source attribution
- [feature-explainer-tabbed.md](./references/feature-explainer-tabbed.md) — sticky TOC + step-by-step `<details>` + tabbed config samples + callout + Gotchas + FAQ + Files-Read provenance footer.
  > E7.1 The shape · E7.2 The page layout · E7.3 The step-by-step `<details>` walkthrough · E7.4 The tabbed code panel — Configuration section · E7.5 The Files-Read provenance footer · E7.6 Anchor links + smooth scroll · E7.7 The Gotchas / FAQ sections · E7.8 Selection / commenting flow · E7.9 Light + dark verification · E7.10 Tokens consumed · E7.11 Mined source attribution
- [implementation-plan-codepanels.md](./references/implementation-plan-codepanels.md) — 2-col `[migration SQL | optimistic-mutation TS]` code grid, paired with mockups + risk table.
  > E8.1 The shape · E8.2 The markup · E8.3 Why 2 columns · E8.4 The "load-bearing pair" discipline · E8.5 The narrow-viewport stacking · E8.6 The "describe the pair" prose convention · E8.7 Composition with the risk table · E8.8 Selection / commenting · E8.9 Cross-references · E8.10 Light + dark verification · E8.11 Tokens consumed · E8.12 Mined source attribution
- [compare-n-approaches.md](./references/compare-n-approaches.md) — 3-column "debounced search × 3 implementations" layout, code block + Pro/Con + metric chips + recommendation card per column.
  > E9.1 The shape · E9.2 The page-level grid · E9.3 Per-column markup · E9.4 The Pro/Con sub-grid · E9.5 The metric chips strip · E9.6 The recommendation card · E9.7 The "code panel per column" discipline · E9.8 Selection / commenting per column · E9.9 Cross-references · E9.10 When to use · E9.11 Light + dark verification · E9.12 Tokens consumed · E9.13 Mined source attribution

### F. Interactive code editors (the "contenteditable + caret-save + RAF re-highlight" family)
- [contenteditable-code-editor.md](./references/contenteditable-code-editor.md) — `getCaretOffset()` / `setCaretOffset()` via `TreeWalker`, Enter-intercept, paste-as-plain, RAF-debounced re-highlight, prompt-template `{{slot}}` highlighter.
  > Overview · F1.1 The pattern · F1.2 Why contenteditable, not textarea · F1.3 The 4 building blocks · F1.4 Intercepting Enter · F1.5 Intercepting paste · F1.6 The slot-finder regex pattern · F1.7 Per-slot validation · F1.8 The 3-sample preview pattern · F1.9 Selection / commenting · F1.10 The localStorage save pattern · F1.11 Tokens consumed · F1.12 When to use · F1.13 Author rules · F1.14 Mined source attribution
- [live-diff-sidebar.md](./references/live-diff-sidebar.md) — always-visible sidebar showing only changed lines, `computeDiff(state)` per input, Copy-diff / Copy-full / Reset stack.
  > F2.1 The pattern · F2.2 The page layout · F2.3 The state model · F2.4 The diff renderer · F2.5 The Copy / Reset actions · F2.6 The "warning banner" pairing · F2.7 The "no changes yet" empty state · F2.8 Selection / commenting · F2.9 The "throwaway editor + export" framing · F2.10 Tokens consumed · F2.11 Author rules · F2.12 Mined source attribution
- [json-editor-with-validation.md](./references/json-editor-with-validation.md) — fenced JSON block + live-validate + error highlight + Copy-as-JSON button.
  > F3.1 The pattern · F3.2 The validation pass · F3.3 The error highlight at a character position · F3.4 The Format (Prettify) button · F3.5 The Copy button · F3.6 Schema-aware validation (optional) · F3.7 Integration with the runtime's gutter · F3.8 Selection / commenting · F3.9 Compose with live-diff-sidebar · F3.10 Light + dark verification · F3.11 Tokens consumed · F3.12 Author rules

### G. Diagram-adjacent code surfaces
- [click-step-to-code-panel.md](./references/click-step-to-code-panel.md) — SVG flowchart node click → sticky right-side detail panel with `<pre>` code excerpt, `DETAIL = { k: { title, meta, body, code } }` map.
  > Overview · G1.1 The pattern · G1.2 The detail map · G1.3 The SVG markup · G1.4 The right panel markup · G1.5 The click handler · G1.6 The `.active` SVG style · G1.7 The 3-marker edge approach (diagram-side) · G1.8 Selection / commenting on the right-panel code · G1.9 Default state (no node selected) · G1.10 Light + dark verification · G1.11 Tokens consumed · G1.12 Author rules · G1.13 Mined source attribution
- [code-snippet-on-diagram-hover.md](./references/code-snippet-on-diagram-hover.md) — hover any chart bar / diagram node → JSX prop snippet renders below with live token values interpolated.
  > G2.1 The pattern · G2.2 The markup · G2.3 The hover handler · G2.4 The sliders writing to CSS variables · G2.5 The snippet-template discipline · G2.6 What this pattern is good for · G2.7 What this pattern is NOT good for · G2.8 The mouseleave default · G2.9 Selection / commenting · G2.10 Light + dark verification · G2.11 Tokens consumed · G2.12 Mined source attribution

### H. Cross-cutting discipline & escape hatches
- [author-vs-runtime-boundary.md](./references/author-vs-runtime-boundary.md) — what the author writes vs what the runtime injects; the integrity-probe-friendly authoring rules.
  > H1.1 The principle · H1.2 The author's input contract · H1.3 The runtime's output contract · H1.4 The contract enforces fail-soft · H1.5 The integrity-probe-friendly authoring rules · H1.6 The runtime's responsibility surface · H1.7 What the author CAN customise · H1.8 What the author CANNOT customise · H1.9 The "post-render injection" escape hatch · H1.10 The architectural reason for this discipline · H1.11 The author's authoring checklist · H1.12 No tokens consumed (this is a discipline reference) · H1.13 Cross-references
- [opting-out-pre.md](./references/opting-out-pre.md) — `data-ve-no-gutter` (skip `initCodeGutter`), why some `<pre>`s (regex graph, overlay snippets) must opt out.
  > H2.1 The attribute · H2.2 When to opt out · H2.3 What opting out preserves · H2.4 What opting out loses · H2.5 The runtime's check · H2.6 Opt-out and `data-ve-snippet-popup` · H2.7 The opt-out vs the data-block discipline · H2.8 The author's mental model · H2.9 Selection / commenting on opt-out blocks · H2.10 Re-opting-in · H2.11 The opt-out hierarchy · H2.12 No tokens consumed · H2.13 Author rules
- [csv-and-data-fences.md](./references/csv-and-data-fences.md) — when a `<pre>` is data (CSV / JSON) not code, and the right author-side attributes.
  > H3.1 The "is this code or data?" question · H3.2 JSON (data, but typically declared as `language-json`) · H3.3 YAML (data, often declared as `language-yaml`) · H3.4 CSV / TSV · H3.5 TOML / INI · H3.6 Diff data · H3.7 The "is this fence DATA-WITH-PROVENANCE?" check · H3.8 The "is this fence SAMPLE OUTPUT?" check · H3.9 The "raw data dump" fallback · H3.10 The selection model · H3.11 The runtime's class-language separation · H3.12 Author rules · H3.13 No tokens consumed (this reference) · H3.14 Cross-references
- [light-dark-mirror-discipline.md](./references/light-dark-mirror-discipline.md) — every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions; the verification checklist.
  > H4.1 The rule · H4.2 The standard CSS shape · H4.3 The hue-family preservation rule · H4.4 The contrast requirement · H4.5 The diff-tint mirror · H4.6 The verification ritual · H4.7 The screenshot-test integration · H4.8 The fail-soft fallback · H4.9 The "single-theme defect" examples · H4.10 Adding new tokens · H4.11 The DESIGN.md override flow · H4.12 Tokens consumed · H4.13 Cross-references

> **Out of scope for this skill.** Shiki / Highlight.js / Prism runtime
> deps (the tokenizer is dependency-free by design — see CB-01 SKIP in
> the PHASE2 backlog). Matplotlib server-side rendering (→ `charts-and-
> dashboards`). Mermaid-theme adapters (→ `diagram` — coherence comes
> from shared `--vc-*` tokens, not Shiki-JSON bridges). The 12-token
> palette **definition** itself (`amvcp-design-tokens` owns it; this
> skill only consumes + documents).
