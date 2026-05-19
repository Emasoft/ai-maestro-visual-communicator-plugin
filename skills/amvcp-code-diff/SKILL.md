---
name: amvcp-code-diff
description: "Code diff surface — unified + split diff blocks, twin-column gutter (old/new line numbers + @@ hunk headers), diff tints via `color-mix` over semantic tokens (never hardcoded red/green), PR review pages with comment bubbles anchored to lines, PR write-ups, postmortem code panels, always-visible live diff sidebar. Use when scaffolding a code diff, a side-by-side review, a PR / postmortem / changelog page. Trigger with 'diff', 'split diff', 'unified diff', 'PR review', 'code review', 'pull request', 'postmortem', 'hunk', 'line-diff'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires the same scripts as amvcp-code-syntax (`amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-code-highlight.js` + `.css`). Diff modes layer over the syntax substrate."
metadata:
  author: Emasoft
---

# Code Diff

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md).
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-diff, code-snippets, code-fences.
> **Sibling code skills:** [amvcp-code-syntax](../amvcp-code-syntax/SKILL.md) (load FIRST — substrate) · [amvcp-code-snippets](../amvcp-code-snippets/SKILL.md) · [amvcp-code-fences](../amvcp-code-fences/SKILL.md).

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

1. **Pick unified vs split.** Unified = one column, `data-ve-diff="add|del|ctx"` per `.ve-code-line` (or `data-ve-lang="diff"` to let the tokenizer's diff mode color the leading marker). Split = two `<pre>`s sharing the page-level scroll. See [diff-blocks-unified](references/diff-blocks-unified.md) and [diff-blocks-split](references/diff-blocks-split.md).
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

**Example 1 — unified diff**

```html
<pre data-ve-code="auto" data-ve-lang="diff"><code>
@@ -10,3 +10,3 @@
-const max = 100;
+const max = 200;
 console.log(max);
</code></pre>
```

The `language-diff` tokenizer colors the leading `+ / − / @@` markers;
per-line `data-ve-diff` is inferred from those markers.

**Example 2 — split diff with PR comment bubble**

```html
<div data-ve-diff="split" data-ve-base="server.py@HEAD~1" data-ve-head="server.py">
  <pre data-ve-code="auto" data-ve-lang="py" data-ve-side="base"><code>...</code></pre>
  <pre data-ve-code="auto" data-ve-lang="py" data-ve-side="head"><code>...</code></pre>
</div>
<div class="ve-pr-bubble" data-ve-anchor-line="42">
  <strong>@reviewer</strong> please verify the new max isn't beyond the API quota.
</div>
```

The bubble's `::before` rotates-square anchor lands on line 42 of the
head side.

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
- [diff-blocks-split](references/diff-blocks-split.md) — two synced panes sharing the page-level scroll axis, optional collapsed-context regions, copy-resolved-side button.
- [diff-gutter-old-new](references/diff-gutter-old-new.md) — twin-column gutter (old line no + new line no), `@@ hunk header` row, hunk collapsibles.
- [diff-tints-from-semantic-tokens](references/diff-tints-from-semantic-tokens.md) — `color-mix` over `--vc-color-success` / `--vc-color-danger`, never hardcoded red/green.

### Diff-bearing compositions
- [pr-review-page](references/pr-review-page.md) — header (avatar + branch + +N/−N) + risk-map chips + per-file diff cards + comment bubbles anchored to line numbers + collapsed safe files + suggested-next-steps checklist.
- [pr-writeup-page](references/pr-writeup-page.md) — TL;DR + before/after rationale panels + ordered file tour + "where to focus" numbered cards + test-plan checklist + rollout strip.
- [postmortem-code-panel](references/postmortem-code-panel.md) — slate-bg diff panel inside an incident report, paired with timeline + impact mini-table.
- [live-diff-sidebar](references/live-diff-sidebar.md) — always-visible sidebar showing only changed lines, `computeDiff(state)` per input, Copy-diff / Copy-full / Reset stack.
