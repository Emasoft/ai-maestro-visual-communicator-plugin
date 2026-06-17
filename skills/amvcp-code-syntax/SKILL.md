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
> **Sibling code skills:** [amvcp-code-diff](../amvcp-code-diff/SKILL.md) · [amvcp-code-snippets](../amvcp-code-snippets/SKILL.md) · [amvcp-code-fences](../amvcp-code-fences/SKILL.md).

## Overview

Substrate for every code-display surface: the dependency-free 7-language
tokenizer, the 12-token `--ve-code-*` palette (light + dark mirrors), the
per-line `.ve-code-line` gutter atom, the copy button, the drag-paint
selection model (9-level ladder), the byte-fidelity integrity probe, and the
visual-chrome layer (3-state block model, blueprint theme, slate-bg panel,
file-path / tab-bar headers, inline `<code>` chip, hand-wrap 4-class palette).

**Owns** how a `<pre><code>` becomes a highlighted, gutter-decorated,
copy-able, selectable, theme-coherent block. **Does NOT own** diff blocks
(→ `amvcp-code-diff`), multi-perspective compositions (→
`amvcp-code-snippets`), data fences (→ `amvcp-code-fences`), or the palette
**definition** (→ `amvcp-design-tokens`; this skill *consumes* `--ve-code-*`).

## Prerequisites

Modern browser; no npm/WASM/build step. Load in order: DESIGN.md engine
(`scripts/amvcp-designmd.js`, live re-theme), then the runtime
(`scripts/amvcp-runtime.js`, owns `.ve-code-block` chrome), then the
tokenizer + CSS (`scripts/amvcp-code-highlight.js` +
`scripts/amvcp-code-highlight.css`).

## Instructions

Author **semantic HTML only**; the runtime + tokenizer build the rest. Each
step's deep reference lives in the **Resources** index below (full TOCs there).

1. **Plain `<pre><code class="language-<id> ve-code-block">`** — never hand-author gutter spans, copy buttons, `ve-tok-*` spans, or selection rings; the runtime (`initCodeGutter`) + tokenizer inject them.
2. **Declare the language ONCE** (`class="language-<id>"` or `data-ve-lang`); unknown/absent → renders **plain** (byte-correct). → `language-resolution`.
3. **Source-fidelity contract** — the tokenizer byte-match-probes each line and falls back to `escapeHtml` on mismatch; NEVER hand-inject `ve-tok-*`. → `integrity-probe`.
4. **Wrap is mandatory** — `white-space:pre-wrap` + hanging-indent + wrap-marker; NEVER `overflow-x:auto` on a `<pre>` or ancestor. → `wrap-and-no-inner-scroll`.
5. **Selection** — every `.ve-code-line` is a selectable atom (9-level ladder, drag-paint). → `code-atom-selection`.
6. **Theme tokens** — every `--ve-code-*` needs BOTH `:root` and `:root[data-ve-theme="light"]`; single-theme = defect. → `light-dark-mirror-discipline` + `token-roles-palette`.

Checklist: ☐ semantic `language-<id>` markup ☐ language declared once ☐ no
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

Each reference carries its OWN complete `## Table of Contents` (open the
file for the full, verbatim heading list); the per-link line below names the
heading-id span it covers.

### Foundation — runtime + tokenizer contract
- [tokenizer-contract](references/tokenizer-contract.md) — 7-language descriptor model, stash-and-restore precedence, integrity probe, `highlightLine` / `highlightBlock` / `detectLanguage` API.
  > TOC A1.1–A1.13: what-it-does · why-outside-runtime · dual-export · public-API · 12 token roles · 7 languages · stash-and-restore · integrity probe · carry state · authoring rules · runtime wiring · failure modes · tokens.
- [token-roles-palette](references/token-roles-palette.md) — the 12 `ve-tok-<role>` classes + their `--ve-code-<role>` token bindings, light + dark mirrors, JetBrains Mono pairing.
  > TOC A2.1–A2.9: 12 token roles · dark defaults · light mirror (MANDATORY) · diff tints · 12 class rules · selection-yield (CRITICAL) · JetBrains Mono (CB-03) · verification · tokens.
- [gutter-anatomy](references/gutter-anatomy.md) — per-line `.ve-code-line` atom, absolute-positioned `.ve-code-linenum`, CSS counter, full-height bbox for drag-hit.
  > TOC A3.1–A3.11: what-it-does · per-line spans · CSS counter · linenum cell · hanging indent · empty-line guard · wrap-marker · pressed state · `data-ve-no-gutter` · author input · tokens.
- [wrap-and-no-inner-scroll](references/wrap-and-no-inner-scroll.md) — `white-space:pre-wrap`, hanging-indent math, wrap-marker stripe, no-nested-scrollbars invariant.
  > TOC A4.1–A4.11: what-it-does · the rule · why nested scroll breaks code · wrap-marker · hanging-indent math · author rule · token-span wrap · vertical extent · very-long line · verification · project rule.
- [copy-button](references/copy-button.md) — floating SVG clipboard button, `--success` swap, clipboard API + textarea fallback, byte-exact source.
  > TOC A5.1–A5.11: what-it-does · byte-exact source · SVG glyphs · button markup · transport (clipboard + textarea) · success swap · what-it-doesn't · diff-mode copy · CSV variant · overrides · tokens.
- [code-atom-selection](references/code-atom-selection.md) — `.ve-code-line` as selectable atom, drag-paint, 3-state hover/select model, 9-level multi-click ladder, selection-yield CSS.
  > TOC A6.1–A6.10: runtime ships · 9-level ladder · drag-paint · selection payload · comment pill · hover hint · yield rule (CRITICAL) · author rules · accessibility · tokens.
- [language-resolution](references/language-resolution.md) — `data-ve-lang` vs `class="language-*"` precedence, alias map, null = no highlighting.
  > TOC A7.1–A7.11: resolution rule · why null · two conventions · alias map · class regex · JS+TS one table · unknown ids · multi-class · author rules · future-proof · tokens.
- [integrity-probe](references/integrity-probe.md) — source-fidelity contract, DOM + Node probe paths, "discard highlight, keep plain" fail-soft.
  > TOC A8.1–A8.11: what-it-does · why · two implementations · call sites · failure catalog · what-it-misses · cascade (last defence) · performance · author (nothing) · test contract · tokens.

### Visual chrome — block-level styling, theme states
- [block-3-state-model](references/block-3-state-model.md) — normal · hover · selected · hover-over-selected via `:has()`. The 4-state outline + halo + `!important` rationale.
  > TOC B1.1–B1.11: four states · why `:has()` · CSS-var neutralization · 1.5px backdrop-filter · `!important` · outline+halo not fill · 4 states in dev-tools · per-line vs block · multi-block · tokens · don't override.
- [blueprint-theme](references/blueprint-theme.md) — opt-in `ve-blueprint` graph-paper backdrop, gold grid lines, light-theme bleed.
  > TOC B2.1–B2.12: what-it-does · CSS · selectors · light+dark · compose 3-state · backdrop-filter · wrap-marker · selection tints · when to use · wireframe x-ref · tokens · author rules.
- [slate-bg-code-panel](references/slate-bg-code-panel.md) — canonical dark code container (slate bg + ivory text + 12px radius) used by composition skills.
  > TOC B3.1–B3.11: what-it-is · visual · markup · CSS · 12-token over slate · selection over slate · diff variant · file-path variant · when to use · tokens · author rules.
- [code-block-with-file-path](references/code-block-with-file-path.md) — `<span class="path">` mono header, file-path provenance pattern.
  > TOC B4.1–B4.11: what-it-does · markup · CSS · file-type icons · line range · multi-language paths · selection contract · provenance · pair with tab-bar · tokens · author rules.
- [code-block-with-tab-bar](references/code-block-with-tab-bar.md) — header tabbar with active-tab indicator, language-icon glyphs.
  > TOC B5.1–B5.13: what-it-does · use cases · markup · 6-line JS handler · CSS · active-tab indicator · compose file-path/icon · selection state · no-JS fallback · per-tab opt-out · when NOT to use · tokens · mined source.

### Hand-wrap (inline) highlight — when JS is off the table
- [inline-4class-handwrap](references/inline-4class-handwrap.md) — `kw / str / cm / fn` palette, the 5-rule discipline, when to use vs JS tokenizer.
  > TOC C1.1–C1.11: what-it-does · when over JS · markup · CSS · 5-rule discipline · debounce-hook example · selection/copy/a11y · DESIGN.md fallback · why shared · migration to JS · tokens.
- [inline-code-chip](references/inline-code-chip.md) — `<code class="inline">` chip for paragraph mentions, mono + bg + 4px radius.
  > TOC C2.1–C2.12: what-it-does · markup · CSS · shrink-vs-prose · `nowrap` · when to use · chip contents · a11y · don't overuse · prose-pages compose · tokens · don't override.
- [keyword-arrow-highlight](references/keyword-arrow-highlight.md) — single-color highlight of a single keyword run inside a long line, "what changed" markup.
  > TOC C3.1–C3.11: what-it-does · markup (tokenizer) · CSS · link-to-focus JS · `:target` variant · selection contract · when to use · don't overuse · a11y · tokens · author rules.

### Cross-cutting discipline
- [author-vs-runtime-boundary](references/author-vs-runtime-boundary.md) — what the author writes vs what the runtime injects; integrity-probe-friendly authoring rules.
  > TOC H1.1–H1.13: principle · author input · runtime output · fail-soft · probe-friendly rules · runtime surface · author CAN · author CANNOT · post-render escape · architecture reason · checklist · tokens · x-refs.
- [light-dark-mirror-discipline](references/light-dark-mirror-discipline.md) — every `--ve-code-*` MUST have both `:root` and `:root[data-ve-theme="light"]` definitions; verification checklist.
  > TOC: the rule + canonical CSS · per-token defaults (hue/contrast/diff tints) · verification + screenshot tests · fail-soft + single-theme-defect examples · authoring workflow + DESIGN.md override · tokens + x-refs.

### Troubleshooting + examples
- [troubleshooting](references/troubleshooting.md) — the symptom → fix table.
  > TOC: Symptom → fix table.
- [examples](references/examples.md) — basic highlight · file-path header · inline chip authoring snippets.
  > TOC: Example 1 basic highlight · Example 2 file-path header · Example 3 inline chip.
