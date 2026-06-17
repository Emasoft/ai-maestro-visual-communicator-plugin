---
name: amvcp-code-highlight
description: "Router skill for the code-display surface — dispatches to 4 sibling skills: code-syntax, code-diff, code-snippets, code-fences. Use when scaffolding ANY code-display surface and you don't yet know which sub-surface fits. Trigger with 'code', 'code block', 'syntax highlight', 'diff', 'PR review', 'walkthrough', 'tabbed code', 'CSV data', 'JSON editor'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires `scripts/amvcp-designmd.js` + `scripts/amvcp-runtime.js` + `scripts/amvcp-code-highlight.js` + `scripts/amvcp-code-highlight.css`."
metadata:
  author: Emasoft
---

# Code Highlight (Router)

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.
> **Sibling code skills:** [amvcp-code-syntax](../amvcp-code-syntax/SKILL.md) (substrate) · [amvcp-code-diff](../amvcp-code-diff/SKILL.md) · [amvcp-code-snippets](../amvcp-code-snippets/SKILL.md) · [amvcp-code-fences](../amvcp-code-fences/SKILL.md).

## Overview

Router for the code-display surface. Picks one of 4 focused sibling
skills based on the kind of code surface you need.

This skill itself contains **no implementation references** — every
technique lives under one of the four sibling skills below. Pick the
right sibling from the routing table, load it, and follow its
SKILL.md.

## Routing table

| User says / job | Pick this skill |
|---|---|
| "show a code block", "syntax highlight", "language detect", "line numbers", "copy button", "gutter", "selection on code lines", "block hover/select states", "blueprint theme", "slate-bg panel", "file-path header", "tab-bar header", "inline code chip", "hand-wrap palette", "keyword highlight in a line", "author-vs-runtime boundary", "light/dark mirror for code tokens" | **[amvcp-code-syntax](../amvcp-code-syntax/SKILL.md)** — the substrate. ALWAYS load FIRST. |
| "show a diff", "unified diff", "split diff", "PR review", "code review", "pull request page", "twin-column gutter", "hunk header", "collapsible hunks", "diff tints from semantic tokens", "live diff sidebar", "postmortem code panel", "PR write-up" | **[amvcp-code-diff](../amvcp-code-diff/SKILL.md)** — diff layer on top of the syntax substrate. |
| "walkthrough", "collapsed steps", "tabbed code", "click step to code panel", "snippet on diagram hover", "architecture explainer", "feature explainer", "implementation plan with code", "compare N approaches", "tutorial" | **[amvcp-code-snippets](../amvcp-code-snippets/SKILL.md)** — multi-perspective compositions on top of the syntax substrate. |
| "CSV data", "JSON data", "YAML data", "fenced data not code", "opt-out gutter", "no line numbers", "regex graph block", "overlay snippet", "live JSON editor", "contenteditable code editor", "prompt template editor with slots" | **[amvcp-code-fences](../amvcp-code-fences/SKILL.md)** — fenced data + editable code on top of the syntax substrate. |

## Load order

The 4 siblings share a single runtime stack — load it once in this
order regardless of which sibling(s) you use:

1. `scripts/amvcp-designmd.js` (token engine — every `--ve-code-*` re-themes on swap)
2. `scripts/amvcp-runtime.js` (gutter + selection chrome — owns `.ve-code-block`)
3. `scripts/amvcp-code-highlight.js` (tokenizer — adds syntax color)
4. `scripts/amvcp-code-highlight.css` (12-token palette + visual chrome)

## When to combine siblings

A single page often combines multiple siblings:

- **A PR page** uses `amvcp-code-syntax` (substrate) + `amvcp-code-diff` (the diff blocks + PR review composition).
- **An architecture explainer** uses `amvcp-code-syntax` (substrate) + `amvcp-code-snippets` (the walkthrough/tabbed composition) + occasionally `amvcp-code-fences` (config samples shown as YAML data).
- **A tutorial** uses `amvcp-code-syntax` (substrate) + `amvcp-code-snippets` (collapsed walkthroughs) + `amvcp-code-fences` (CSV input/output samples) + possibly `amvcp-code-diff` (before/after blocks).
- **A live JSON editor pane** uses `amvcp-code-syntax` (substrate) + `amvcp-code-fences` (the contenteditable + validate composition).

Always load **amvcp-code-syntax FIRST** — it is the substrate every
other sibling extends. Then load the additional siblings as needed.

## Prerequisites

- A modern browser supporting CSS `:has()`.
- The DESIGN.md engine on the page.
- No npm runtime dependency.

## Instructions

1. **Identify the surface kind** from the routing table above.
2. **Load `amvcp-code-syntax`** first (always — it is the substrate).
3. **Load additional siblings** if your page combines surfaces (see "When to combine siblings").
4. **Follow each loaded sibling's SKILL.md** for technique-level guidance.
5. **Verify** in BOTH light + dark themes per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) (R41).

Copy this checklist and track your progress:

- [ ] Surface kind identified
- [ ] `amvcp-code-syntax` loaded as substrate
- [ ] Additional siblings loaded per the combine rules
- [ ] Each sibling's checklist completed
- [ ] Screenshot-tested in BOTH light + dark themes (R41)

## Output

A self-contained HTML page composed from one or more code siblings.
Authors write semantic HTML only; the runtime + tokenizer build the
chrome. A DESIGN.md token swap re-themes every block.

## Error Handling

If you are unsure which sibling owns a technique, fall back to the
sibling whose SKILL.md "What this skill owns / does NOT own" section
explicitly names it. The four siblings have non-overlapping
ownership — every reference file in this category sits in exactly one
sibling.

## Examples

```
Input:  "show a code block with line numbers and copy button"
Output: load amvcp-code-syntax → wrap source in <pre><code class="language-X">,
        runtime auto-adds gutter + copy button.

Input:  "render this PR diff in split view"
Output: load amvcp-code-syntax (substrate) + amvcp-code-diff → emit
        <pre class="ve-code-diff ve-diff-split"> with twin-gutter markup.

Input:  "build a tabbed walkthrough with 4 perspectives on this auth flow"
Output: load amvcp-code-syntax (substrate) + amvcp-code-snippets → use
        the tabbed-code-panel composition.

Input:  "let the user edit this JSON with live validation"
Output: load amvcp-code-syntax (substrate) + amvcp-code-fences → use
        contenteditable + JSON live-validate composition.
```

## Modes

This router has no modes — see each sibling's "Modes" section.

## Composability

Composes with every other amvcp-* skill on the same page (R22). The
only exclusive skill is the overlay-runtime (R24).

## Resources

The 4 sibling skills. Each is a complete, self-contained surface:

- **[amvcp-code-syntax](../amvcp-code-syntax/SKILL.md)** — the substrate: tokenizer + 12-token palette + per-line gutter + copy button + drag-paint selection + integrity probe + visual chrome (block 3-state, blueprint theme, slate-bg, file-path / tab-bar headers, inline chip, hand-wrap palette, keyword highlight) + cross-cutting discipline (author-vs-runtime boundary, light-dark mirror). 18 reference files.
- **[amvcp-code-diff](../amvcp-code-diff/SKILL.md)** — diff blocks (unified + split), twin-column gutter (old/new line numbers + hunk headers), diff tints via `color-mix` over semantic tokens, PR review pages, PR write-ups, postmortem code panels, live diff sidebar. 8 reference files.
- **[amvcp-code-snippets](../amvcp-code-snippets/SKILL.md)** — collapsed walkthroughs, code snippet on diagram hover, architecture-explainer callstack, feature-explainer tabbed config samples, click-step-to-code side panel, tabbed multi-perspective panel, 2-col implementation-plan code grid, N-column compare-approaches layout (the read-each-approach card narrative; for the matrix-scan table variant — code-in-a-cell + trade-off rows + an emphasis column — see [approaches-comparison.md](../amvcp-tables-matrix-compare/references/approaches-comparison.md)). 8 reference files.
  - TOC of [approaches-comparison.md](../amvcp-tables-matrix-compare/references/approaches-comparison.md):
    - Approaches comparison — N code approaches side-by-side with inline trade-offs
    - Table of contents
    - When this recipe vs the code-snippets E9 recipe
    - The two layouts — table-based vs card-grid
    - Layout A — the compare table (trade-offs are rows)
    - The recommended approach — the emphasis column
    - The code cell — a real code block inside a `<td>`
    - Inline trade-off callouts
    - Layout B — the free-form card grid
    - Selection atoms per approach
    - Sample HTML — table-based, 3 approaches
    - Sample HTML — card-grid, 3 approaches
    - DESIGN.md tokens consumed
    - Anti-patterns
- **[amvcp-code-fences](../amvcp-code-fences/SKILL.md)** — CSV / JSON / YAML data fences (code-vs-data discipline), `data-ve-no-gutter` opt-out attribute, contenteditable code editor (TreeWalker caret save/restore, Enter-intercept, paste-as-plain, RAF-debounced re-highlight), JSON editor with live validate. 4 reference files.
