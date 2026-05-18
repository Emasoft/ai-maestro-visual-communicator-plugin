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
5. **For diff blocks** add `data-ve-diff="add|del|ctx|hunk"` per
   `.ve-code-line` (or use `data-ve-lang="diff"` to let the tokenizer's
   diff mode color the leading marker). See
   [diff-blocks-unified.md](./references/diff-blocks-unified.md) and
   [diff-blocks-split.md](./references/diff-blocks-split.md).
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
8. **Wrap mode is mandatory.** Code blocks ride the runtime's `white-
   space:pre-wrap` + hanging-indent + wrap-marker stripe — NEVER set
   `overflow-x:auto` on a `<pre>` or wrap it in an `overflow:auto` box.
   Wide code extends the page. See
   [wrap-and-no-inner-scroll.md](./references/wrap-and-no-inner-scroll.md).

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
- [token-roles-palette.md](./references/token-roles-palette.md) — the 12 `ve-tok-<role>` classes + their `--ve-code-<role>` token bindings, light + dark mirrors, JetBrains Mono pairing.
- [gutter-anatomy.md](./references/gutter-anatomy.md) — per-line `.ve-code-line` atom, absolute-positioned `.ve-code-linenum`, CSS counter, full-height bbox for drag-hit.
- [wrap-and-no-inner-scroll.md](./references/wrap-and-no-inner-scroll.md) — `white-space:pre-wrap`, hanging-indent math, wrap-marker stripe, the no-nested-scrollbars invariant.
- [copy-button.md](./references/copy-button.md) — floating SVG clipboard button, `--success` swap, clipboard API + textarea fallback, byte-exact source.
- [code-atom-selection.md](./references/code-atom-selection.md) — `.ve-code-line` as selectable atom, drag-paint, 3-state hover/select model, 9-level multi-click ladder for code, selection-yield CSS.
- [language-resolution.md](./references/language-resolution.md) — `data-ve-lang` vs `class="language-*"` precedence, alias map (all 17 aliases), null = no highlighting.
- [integrity-probe.md](./references/integrity-probe.md) — the source-fidelity contract, DOM + Node probe paths, the "discard highlight, keep plain" fail-soft.

### B. Visual chrome — block-level styling, theme states, themes
- [block-3-state-model.md](./references/block-3-state-model.md) — normal · hover · selected · hover-over-selected via `:has(.ve-code-line[data-ve-pressed="1"])`. The 4-state outline + halo + `!important` rationale.
- [blueprint-theme.md](./references/blueprint-theme.md) — opt-in `ve-blueprint` graph-paper backdrop, gold grid lines, light-theme bleed.
- [slate-bg-code-panel.md](./references/slate-bg-code-panel.md) — the canonical dark code container (slate bg + ivory text + 12px radius) used by PR / postmortem / explainer compositions.
- [code-block-with-file-path.md](./references/code-block-with-file-path.md) — `<span class="path">infra/config/workers.yaml</span>` mono header inside a code block, file-path provenance pattern.
- [code-block-with-tab-bar.md](./references/code-block-with-tab-bar.md) — header tabbar with active-tab indicator, language-icon glyphs, file-type-icon row, paired with CH-12.

### C. Hand-wrap (inline) highlight — when JS is off the table
- [inline-4class-handwrap.md](./references/inline-4class-handwrap.md) — `kw / str / cm / fn` palette, the 5-rule discipline, when to use vs the JS tokenizer. The catalog's shared 4-class palette mined from every demo file.
- [inline-code-chip.md](./references/inline-code-chip.md) — `<code class="inline">` chip for paragraph mentions, mono + bg + 4px radius.
- [keyword-arrow-highlight.md](./references/keyword-arrow-highlight.md) — single-color highlight of a single keyword run inside a long line, "what changed" markup.

### D. Diff blocks
- [diff-blocks-unified.md](./references/diff-blocks-unified.md) — per-line `data-ve-diff="add|del|ctx|hunk"`, color tints from `--ve-code-diff-*`, single-column rendering, line-through-on-del variant.
- [diff-blocks-split.md](./references/diff-blocks-split.md) — two synced panes sharing the page-level scroll axis, optional collapsed-context regions, copy-resolved-side button.
- [diff-gutter-old-new.md](./references/diff-gutter-old-new.md) — twin-column gutter (old line no + new line no), `@@ hunk header` row, hunk collapsibles.
- [diff-tints-from-semantic-tokens.md](./references/diff-tints-from-semantic-tokens.md) — `color-mix` over `--vc-color-success` / `--vc-color-danger`, never hardcoded red/green, theme-coherent diffs.

### E. Multi-perspective / multi-file compositions
- [tabbed-code-panel.md](./references/tabbed-code-panel.md) — 6-line JS tabbar, `[button.on data-t="0"]` ↔ `[<pre>.on]` toggle, 3-perspectives-on-the-same-change pattern.
- [collapsed-snippets-walkthrough.md](./references/collapsed-snippets-walkthrough.md) — `<details>` per step, mutually-exclusive disclosure (one open at a time via `toggle` event), file:line summary, hot-step modifier.
- [pr-review-page.md](./references/pr-review-page.md) — header (avatar + branch + +N/−N) + risk-map chips + per-file diff cards + comment bubbles anchored to line numbers + collapsed safe files + suggested-next-steps checklist.
- [pr-writeup-page.md](./references/pr-writeup-page.md) — TL;DR + before/after rationale panels + ordered file tour + "where to focus" numbered cards + test-plan checklist + rollout strip.
- [postmortem-code-panel.md](./references/postmortem-code-panel.md) — slate-bg diff panel inside an incident report, paired with timeline + impact mini-table.
- [architecture-explainer-snippets.md](./references/architecture-explainer-snippets.md) — numbered callstack walkthrough, `[badge] [file:line] [prose] [<details> source]`, hot-step modifier on the trust boundary.
- [feature-explainer-tabbed.md](./references/feature-explainer-tabbed.md) — sticky TOC + step-by-step `<details>` + tabbed config samples + callout + Gotchas + FAQ + Files-Read provenance footer.
- [implementation-plan-codepanels.md](./references/implementation-plan-codepanels.md) — 2-col `[migration SQL | optimistic-mutation TS]` code grid, paired with mockups + risk table.
- [compare-n-approaches.md](./references/compare-n-approaches.md) — 3-column "debounced search × 3 implementations" layout, code block + Pro/Con + metric chips + recommendation card per column.

### F. Interactive code editors (the "contenteditable + caret-save + RAF re-highlight" family)
- [contenteditable-code-editor.md](./references/contenteditable-code-editor.md) — `getCaretOffset()` / `setCaretOffset()` via `TreeWalker`, Enter-intercept, paste-as-plain, RAF-debounced re-highlight, prompt-template `{{slot}}` highlighter.
- [live-diff-sidebar.md](./references/live-diff-sidebar.md) — always-visible sidebar showing only changed lines, `computeDiff(state)` per input, Copy-diff / Copy-full / Reset stack.
- [json-editor-with-validation.md](./references/json-editor-with-validation.md) — fenced JSON block + live-validate + error highlight + Copy-as-JSON button.

### G. Diagram-adjacent code surfaces
- [click-step-to-code-panel.md](./references/click-step-to-code-panel.md) — SVG flowchart node click → sticky right-side detail panel with `<pre>` code excerpt, `DETAIL = { k: { title, meta, body, code } }` map.
- [code-snippet-on-diagram-hover.md](./references/code-snippet-on-diagram-hover.md) — hover any chart bar / diagram node → JSX prop snippet renders below with live token values interpolated.

### H. Cross-cutting discipline & escape hatches
- [author-vs-runtime-boundary.md](./references/author-vs-runtime-boundary.md) — what the author writes vs what the runtime injects; the integrity-probe-friendly authoring rules.
- [opting-out-pre.md](./references/opting-out-pre.md) — `data-ve-no-gutter` (skip `initCodeGutter`), why some `<pre>`s (regex graph, overlay snippets) must opt out.
- [csv-and-data-fences.md](./references/csv-and-data-fences.md) — when a `<pre>` is data (CSV / JSON) not code, and the right author-side attributes.
- [light-dark-mirror-discipline.md](./references/light-dark-mirror-discipline.md) — every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions; the verification checklist.

> **Out of scope for this skill.** Shiki / Highlight.js / Prism runtime
> deps (the tokenizer is dependency-free by design — see CB-01 SKIP in
> the PHASE2 backlog). Matplotlib server-side rendering (→ `charts-and-
> dashboards`). Mermaid-theme adapters (→ `diagram` — coherence comes
> from shared `--vc-*` tokens, not Shiki-JSON bridges). The 12-token
> palette **definition** itself (`amvcp-design-tokens` owns it; this
> skill only consumes + documents).
