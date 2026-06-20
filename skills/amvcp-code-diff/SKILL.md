---
name: amvcp-code-diff
description: "Code diff surface — unified + split diff blocks, twin-column gutter, semantic diff tints, PR review pages with line-anchored comments. Use when scaffolding a code diff, a side-by-side review, a PR / postmortem / changelog page. Trigger with 'diff', 'split diff', 'unified diff', 'PR review', 'code review', 'pull request', 'postmortem', 'hunk', 'line-diff'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires the same scripts as amvcp-code-syntax (`amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-code-highlight.js` + `.css`). Diff modes layer over the syntax substrate."
metadata:
  author: Emasoft
---

# Code Diff

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md).
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-diff, code-snippets, code-fences.
> **Sibling code skills:** [amvcp-code-syntax](../amvcp-code-syntax/SKILL.md) (load FIRST — substrate) · [amvcp-code-snippets](../amvcp-code-snippets/SKILL.md) · [amvcp-code-fences](../amvcp-code-fences/SKILL.md).
> **Heavyweight alternative:** [amvcp-pierre-diff](../amvcp-pierre-diff/SKILL.md) — Shiki-quality highlighting + line virtualizer + merge-conflict resolver + streaming code. Escalate to it when a diff is ≥ ~500 lines, needs merge-conflict (`<<<<<<<`) resolution, or renders streaming-generated code. This skill stays the right pick for small inline diffs in a larger report.

## Overview

Diff layer on top of the `amvcp-code-syntax` substrate — turns the
syntax-highlighted code block into a diff block (unified or split),
adds the twin-column gutter (old line no + new line no + `@@ hunk
header` row), tints each line via `color-mix` over `--vc-color-success`
/ `--vc-color-danger` (NEVER hardcoded green/red — both theme mirrors
follow). Also owns the higher-level diff-bearing compositions: PR
review pages, PR write-ups, postmortem code panels, and the always-
visible live diff sidebar that renders ONLY changed lines as the user
edits.

**What this skill owns.** Every per-line `data-ve-diff="add|del|ctx|
hunk"` semantics, the unified vs split layout, the twin-column gutter
geometry, the hunk-header row, the collapsible hunks, the diff-tint
math (color-mix percentages, alpha vs lightness rationale), the PR
review chrome (header avatar/branch/+N-−N, risk-map chips, per-file
diff cards, comment bubbles anchored to line numbers, suggested-next-
steps checklist), the PR write-up chrome (TL;DR, before/after panels,
ordered file tour, test plan), the postmortem-code-panel placement
inside an incident report, and the live-diff sidebar (always-visible
side rail rendering only changed lines).

**What this skill does NOT own.** The syntax substrate, gutter
chrome, copy button, integrity probe (→ `amvcp-code-syntax`). Multi-
perspective snippet compositions that are NOT diffs (→
`amvcp-code-snippets`). Data fences (→ `amvcp-code-fences`).

## Prerequisites

- `amvcp-code-syntax` loaded FIRST — the diff layer extends its
  per-line gutter atom and reads its `--ve-code-*` token palette.
- DESIGN.md must expose `--vc-color-success` and `--vc-color-danger`
  (the diff tints `color-mix` over them — never use raw red / green).

## Instructions

1. **Pick unified vs split.** Unified = one column, `data-ve-diff="add|del|ctx"` per `.ve-code-line` (or `data-ve-lang="diff"` to let the tokenizer's diff mode color the leading marker). Split = two `<pre>`s sharing the page-level scroll. See [diff-blocks-unified](references/diff-blocks-unified.md) and [diff-blocks-split](references/diff-blocks-split.md) (full TOCs under [Resources](#resources)).
2. **Twin-column gutter (PR style).** Add `data-ve-diff-gutter="twin"` on the `.ve-code-block` wrapper. The runtime renders old line no + new line no + `@@` hunk-header rows + collapsible hunks. See [diff-gutter-old-new](references/diff-gutter-old-new.md).
3. **Tints from semantic tokens.** Every diff color uses `color-mix(in oklab, var(--vc-color-success) 22%, transparent)` — NEVER hardcoded `#26a641` or `green`. Both light and dark themes inherit automatically. See [diff-tints-from-semantic-tokens](references/diff-tints-from-semantic-tokens.md).
4. **PR review composition.** For a full PR review page (header + risk chips + per-file diff cards + comment bubbles + checklist), follow [pr-review-page](references/pr-review-page.md). For a PR write-up (TL;DR + before/after + file tour + test plan), follow [pr-writeup-page](references/pr-writeup-page.md).
5. **Postmortem composition.** A slate-bg diff panel embedded inside an incident report, paired with timeline + impact mini-table. See [postmortem-code-panel](references/postmortem-code-panel.md).
6. **Live diff sidebar (editor surface).** Always-visible sidebar rendering only changed lines as the user types. See [live-diff-sidebar](references/live-diff-sidebar.md).

Copy this checklist and track your progress:

- [ ] Picked unified vs split layout
- [ ] Per-line `data-ve-diff` semantics declared
- [ ] Diff tints use `color-mix` over `--vc-color-success`/`--vc-color-danger` (no hardcoded green/red)
- [ ] BOTH `:root` and `:root[data-ve-theme="light"]` tint mirrors verified
- [ ] Twin-gutter `data-ve-diff-gutter="twin"` set when PR-style line numbers are needed
- [ ] Comment bubbles (PR review) anchored to line numbers, not absolute coordinates
- [ ] Screenshot-tested in BOTH light + dark themes (R41)

## Output

A self-contained HTML page where every diff surface is theme-coherent
(tints derived from semantic colors, not hardcoded), gutter-decorated
with line numbers, selectable for inline commenting, and re-themes
cleanly on a DESIGN.md token swap. PR review and write-up pages
compose the diff block with header chrome, risk-map chips, and
ordered narrative panels.

## Error Handling

| Symptom | Fix |
|---|---|
| Diff colors wrong on dark theme | `data-ve-diff` mistyped, or the `:root[data-ve-theme="light"]` mirror missing for `--ve-code-diff-*` tokens |
| Hardcoded red/green appears on theme swap | A custom rule used `#ff0000` or `green` instead of `color-mix(--vc-color-danger ...)`. See [diff-tints-from-semantic-tokens](references/diff-tints-from-semantic-tokens.md) |
| Twin-column gutter missing | `data-ve-diff-gutter="twin"` not set on the wrapper, OR the runtime extension for twin mode is not loaded |
| Hunk collapsibles don't toggle | `<details>` not nested correctly inside the `@@ hunk` row, or the runtime's hunk handler is suppressed by a parent `data-ve-no-gutter` |
| Comment bubbles float over wrong line | The `::before` rotated-square trick depends on line numbers being absolute-positioned `.ve-code-linenum` cells — confirm the syntax substrate's gutter is intact |
| Live diff sidebar shows nothing | `computeDiff(state)` was not wired on input; the sidebar re-renders only on state mutation |

## Examples

Two copy-paste starting points — a unified diff (`data-ve-lang="diff"`
markers inferred per line) and a split diff with a line-anchored PR
comment bubble — live in [references/diff-examples.md](references/diff-examples.md).

Complete TOC of `diff-examples.md`:

- Example 1 — unified diff
- Example 2 — split diff with PR comment bubble

## Visual verification

Every diff technique MUST be screenshot-tested in BOTH light AND dark
themes. See
[../amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md)
— verify that (a) add/del tints are visibly differentiated but stay
theme-coherent (not blood-red on light), (b) the twin-column gutter
aligns old and new line numbers correctly, (c) hunk headers read on
both themes, (d) PR comment bubbles do not occlude line numbers.

## Modes

Supports `data-ve-mode="readonly"` only. Diff lines are selectable
for comment but the per-line 3-state decision pill (R20-R23) does NOT
apply — diffs are for review, not decision capture.

## Composability

Composes with every other amvcp-* skill on the same page (R22).
Multiple diff blocks coexist independently. The only exclusive skill
is the overlay-runtime (R24).

## Resources

### Diff block layouts
- [diff-blocks-unified](references/diff-blocks-unified.md) — per-line `data-ve-diff="add|del|ctx|hunk"`, single-column rendering, line-through-on-del variant.
  - D1.1 What it does · D1.2 The author markup — preferred form · D1.3 The author markup — explicit form (when needed) · D1.4 The CSS (diff tints) · D1.5 The tints come from semantic tokens — NEVER hardcoded · D1.6 The line-through-on-del variant · D1.7 The hunk header · D1.8 Collapsing context regions (CB-01 reframed §C2) · D1.9 Copy behaviour · D1.10 Selection + commenting · D1.11 Light + dark verification · D1.12 Tokens consumed · D1.13 Author rules
- [diff-blocks-split](references/diff-blocks-split.md) — two synced panes sharing the page-level scroll axis, optional collapsed-context regions, copy-resolved-side button.
  - D2.1 What it does · D2.2 The markup · D2.3 The CSS · D2.4 Where to put the diff tints · D2.5 Line-number alignment · D2.6 No shared scroll axis · D2.7 Copy behaviour per pane · D2.8 Selection across panes · D2.9 Composing with file-path label · D2.10 When to use split vs unified · D2.11 Light + dark verification · D2.12 Tokens consumed · D2.13 Author rules
- [diff-gutter-old-new](references/diff-gutter-old-new.md) — twin-column gutter (old line no + new line no), `@@ hunk header` row, hunk collapsibles.
  - D3.1 What it does · D3.2 The markup · D3.3 The CSS · D3.4 The runtime extension · D3.5 Hunk header rendering in twin mode · D3.6 Collapsing hunks · D3.7 Drag-paint selection across the twin gutter · D3.8 The copy behaviour · D3.9 Composition with split view · D3.10 When to use · D3.11 Light + dark verification · D3.12 Tokens consumed · D3.13 Author rules
- [diff-tints-from-semantic-tokens](references/diff-tints-from-semantic-tokens.md) — `color-mix` over `--vc-color-success` / `--vc-color-danger`, never hardcoded red/green.
  - D4.1 The four diff tint tokens · D4.2 Why color-mix, not just lower alpha · D4.3 Why these tokens, not hardcoded green/red · D4.4 The 22% / 60% / 16% / 70% calibration · D4.5 The full fallback chain · D4.6 Adding the diff tints to DESIGN.md (optional) · D4.7 The color-mix syntax — browser support · D4.8 Selection tint over diff tint · D4.9 Print stylesheet · D4.10 What an author can override · D4.11 Author rules · D4.12 Tokens consumed · D4.13 Cross-references

### Diff-bearing compositions
- [pr-review-page](references/pr-review-page.md) — header (avatar + branch + +N/−N) + risk-map chips + per-file diff cards + comment bubbles anchored to line numbers + collapsed safe files + suggested-next-steps checklist.
  - E3.1 The shape · E3.2 The header · E3.3 The risk-map chips · E3.3b The risk legend · E3.4 The per-file diff card · E3.4b The per-file risk-tag badge · E3.5 The comment bubble — `::before` rotated-square trick · E3.6 Anchoring comments to line numbers · E3.7 Collapsed safe files · E3.8 The next-steps checklist · E3.9 Cross-references · E3.10 Light + dark verification · E3.11 Tokens consumed · E3.12 Mined source attribution
- [pr-writeup-page](references/pr-writeup-page.md) — TL;DR + before/after rationale panels + ordered file tour + "where to focus" numbered cards + test-plan checklist + rollout strip.
  - E4.1 The shape · E4.2 The TL;DR card · E4.3 The Why section — Before/After panels · E4.4 The file-by-file tour — ordered FOR READING · E4.5 The badges · E4.6 The "Where to focus" numbered cards · E4.7 The test plan checklist · E4.8 The rollout strip · E4.9 The narrow-viewport stack · E4.10 Cross-references · E4.11 Tokens consumed · E4.12 Mined source attribution
- [postmortem-code-panel](references/postmortem-code-panel.md) — slate-bg diff panel inside an incident report, paired with timeline + impact mini-table.
  - E5.1 The placement · E5.2 The markup · E5.3 Why slate-bg here specifically · E5.4 The pairing with the Impact mini-table · E5.5 Selection / commenting on root-cause lines · E5.6 The "preserved evidence" principle · E5.7 The "fix is part of the evidence" principle · E5.8 The narrow-viewport rendering · E5.9 Don't combine with split-view diffs · E5.10 The light + dark verification · E5.11 Tokens consumed · E5.12 Mined source attribution
- [live-diff-sidebar](references/live-diff-sidebar.md) — always-visible sidebar showing only changed lines, `computeDiff(state)` per input, Copy-diff / Copy-full / Reset stack.
  - F2.1 The pattern · F2.2 The page layout · F2.3 The state model · F2.4 The diff renderer · F2.5 The Copy / Reset actions · F2.6 The "warning banner" pairing · F2.7 The "no changes yet" empty state · F2.8 Selection / commenting · F2.9 The "throwaway editor + export" framing · F2.10 Tokens consumed · F2.11 Author rules · F2.12 Mined source attribution
