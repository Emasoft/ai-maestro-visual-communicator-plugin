---
name: amvcp-code-snippets
description: "Multi-perspective code composition surface — collapsed walkthroughs, snippet-on-hover, tabbed multi-perspective panels, click-step-to-code, N-column compare layouts. Use when scaffolding a code walkthrough, explainer, tutorial, or click-driven code reveal. Trigger with 'walkthrough', 'tabbed code', 'click reveal code', 'snippet', 'explainer', 'tutorial steps', 'compare approaches'."
license: MIT
compatibility: "Any modern browser supporting CSS `:has()` (Chromium 105+, Safari 15.4+, Firefox 121+). Pure JS, no npm runtime dependency. Requires the same scripts as amvcp-code-syntax (`amvcp-designmd.js` + `amvcp-runtime.js` + `amvcp-code-highlight.js` + `.css`)."
metadata:
  author: Emasoft
---

# Code Snippets

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md).
> **Router:** [`skills/amvcp-code-highlight/SKILL.md`](../amvcp-code-highlight/SKILL.md) — load the router to choose between code-syntax, code-diff, code-snippets, code-fences.
> **Sibling code skills:** [amvcp-code-syntax](../amvcp-code-syntax/SKILL.md) (load FIRST — substrate) · [amvcp-code-diff](../amvcp-code-diff/SKILL.md) · [amvcp-code-fences](../amvcp-code-fences/SKILL.md).

## Overview

Composition layer for multi-perspective, multi-step, multi-file code
display — turns syntax-highlighted blocks into walkthroughs, tutorials,
tabbed perspectives, click-driven code reveals, and N-column compare
layouts. This is the "tell a story across multiple code surfaces"
skill.

**What this skill owns.** Eight canonical composition patterns:
collapsed `<details>` walkthroughs with mutually-exclusive disclosure
(one open at a time), code snippets that render below a diagram on
hover, architecture-explainer callstack walks with numbered badges +
file:line + prose + `<details>` source, feature-explainer pages with
sticky TOC + tabbed config samples + callouts + gotchas + FAQ, click-
step-to-code side panels for SVG flowcharts, the tabbed multi-
perspective code panel (3 angles on the same change), the 2-col
implementation-plan code grid (migration SQL + optimistic-mutation
TS), and the N-column compare-approaches layout (3 implementations
with Pro/Con + metric chips + recommendation card).

**What this skill does NOT own.** The syntax substrate (→
`amvcp-code-syntax`). Diff layouts, PR / postmortem compositions (→
`amvcp-code-diff`). Data fences and contenteditable editors (→
`amvcp-code-fences`).

## Prerequisites

- `amvcp-code-syntax` loaded FIRST — every snippet still tokenises
  via the same `.ve-code-block` chrome.
- A modern browser. No npm runtime dependency.
- DESIGN.md slot tokens for accent / surface (the composition chrome
  reads `--vc-color-accent`, `--vc-color-surface`, etc.).

## Instructions

1. **Pick the composition pattern** from the references index below. Each ref is self-sufficient; the markup is compositional but the patterns are codified.
2. **Collapsed walkthroughs.** `<details>` per step, mutually-exclusive disclosure via `toggle` event (one open at a time), file:line summary in the `<summary>`, hot-step modifier for the active step. See [collapsed-snippets-walkthrough](references/collapsed-snippets-walkthrough.md).
  > E2.1 The pattern · E2.2 The markup · E2.3 The CSS · E2.4 The mutually-exclusive disclosure pattern · E2.5 The hot-step modifier · E2.6 The composition with the runtime's code block · E2.7 The walkthrough's role in larger compositions · E2.8 Selection / commenting within an expanded step · E2.9 Accessibility · E2.10 The shape variation: numbered prose without `<details>` · E2.11 Tokens consumed · E2.12 Author rules
3. **Tabbed multi-perspective.** 6-line JS tabbar, `[button.on data-t="0"]` ↔ `[<pre>.on]` toggle, 3-perspectives-on-the-same-change pattern. See [tabbed-code-panel](references/tabbed-code-panel.md).
  > E1.1 The pattern · E1.2 The canonical perspective sets · E1.3 Anti-patterns · E1.4 The composition example: feature-explainer config sample · E1.5 The 6-line JS handler · E1.6 The "first tab is the canonical one" rule · E1.7 Tab labels — discipline · E1.8 The 2-pane variant (Before / After) · E1.9 Auto-collapse adjacent text content · E1.10 Selection / commenting across tabs · E1.11 Pair with collapsed-snippets walkthrough · E1.12 Tokens consumed · E1.13 Author rules (composition-level)
4. **Click-step to code panel.** SVG flowchart node click → sticky right-side detail panel with `<pre>` code excerpt, `DETAIL = { k: { title, meta, body, code } }` map. See [click-step-to-code-panel](references/click-step-to-code-panel.md).
  > G1.1 The pattern · G1.2 The detail map · G1.3 The SVG markup · G1.4 The right panel markup · G1.5 The click handler · G1.6 The `.active` SVG style · G1.7 The 3-marker edge approach (diagram-side) · G1.8 Selection / commenting on the right-panel code · G1.9 Default state (no node selected) · G1.10 Light + dark verification · G1.11 Tokens consumed · G1.12 Author rules · G1.13 Mined source attribution · Overview
5. **Code snippet on diagram hover.** Hover any chart bar / diagram node → JSX prop snippet renders below with live token values interpolated. See [code-snippet-on-diagram-hover](references/code-snippet-on-diagram-hover.md).
  > G2.1 The pattern · G2.2 The markup · G2.3 The hover handler · G2.4 The sliders writing to CSS variables · G2.5 The snippet-template discipline · G2.6 What this pattern is good for · G2.7 What this pattern is NOT good for · G2.8 The mouseleave default · G2.9 Selection / commenting · G2.10 Light + dark verification · G2.11 Tokens consumed · G2.12 Mined source attribution
6. **Architecture / feature explainer.** Long-form composition pages with sticky TOC + step `<details>` + tabbed config + provenance footer. See [architecture-explainer-snippets](references/architecture-explainer-snippets.md) and [feature-explainer-tabbed](references/feature-explainer-tabbed.md).
  > E6.1 The shape · E6.2 The composition with collapsed-snippets-walkthrough · E6.3 The leading SVG diagram · E6.4 The hot-step modifier · E6.5 The sticky right sidebar · E6.6 Composition with the diagram skill · E6.7 Selection / commenting flow · E6.8 Light + dark verification · E6.9 Tokens consumed · E6.10 Mined source attribution
  > E7.1 The shape · E7.2 The page layout · E7.3 The step-by-step `<details>` walkthrough · E7.4 The tabbed code panel — Configuration section · E7.5 The Files-Read provenance footer · E7.6 Anchor links + smooth scroll · E7.7 The Gotchas / FAQ sections · E7.8 Selection / commenting flow · E7.9 Light + dark verification · E7.10 Tokens consumed · E7.11 Mined source attribution
7. **Multi-file plans / comparisons.** 2-col implementation-plan grid, N-column compare-approaches with Pro/Con + metrics. See [implementation-plan-codepanels](references/implementation-plan-codepanels.md) and [compare-n-approaches](references/compare-n-approaches.md).
  > E8.1 The shape · E8.2 The markup · E8.3 Why 2 columns · E8.4 The "load-bearing pair" discipline · E8.5 The narrow-viewport stacking · E8.6 The "describe the pair" prose convention · E8.7 Composition with the risk table · E8.8 Selection / commenting · E8.9 Cross-references · E8.10 Light + dark verification · E8.11 Tokens consumed · E8.12 Mined source attribution
  > E9.1 The shape · E9.2 The page-level grid · E9.3 Per-column markup · E9.4 The Pro/Con sub-grid · E9.5 The metric chips strip · E9.6 The recommendation card · E9.7 The "code panel per column" discipline · E9.8 Selection / commenting per column · E9.9 Cross-references · E9.10 When to use · E9.11 Light + dark verification · E9.12 Tokens consumed · E9.13 Mined source attribution

Copy this checklist and track your progress:

- [ ] Composition pattern picked from the resources index
- [ ] Multi-step walkthroughs use mutually-exclusive `<details>` (one open at a time)
- [ ] Tabbed panels: 6-line JS handler wired
- [ ] Click-step panels: `DETAIL` map declared per node
- [ ] All embedded code blocks still use `class="ve-code-block"` + a `data-ve-lang` (substrate contract)
- [ ] Provenance footer (Files-Read) present for explainer-style pages
- [ ] Screenshot-tested in BOTH light + dark themes (R41)

## Output

A self-contained HTML page where each composition is a coherent
multi-step / multi-perspective / multi-file narrative. Each code
block retains the syntax substrate's tokenisation, gutter, copy
button, selection, and integrity-probe guarantees. Themes re-paint on
a DESIGN.md token swap.

## Error Handling

| Symptom | Fix |
|---|---|
| Multiple `<details>` open at once | Missing `toggle` event handler that closes siblings; see [collapsed-snippets-walkthrough](references/collapsed-snippets-walkthrough.md) |
| Tab click does nothing | The 6-line `[data-t]` ↔ `[data-tab-panel]` handler is not bound, OR the `.on` class is not toggled |
| Click-step panel never updates | `DETAIL` map missing an entry for the clicked node's `data-ve-id` key |
| Hover snippet stays empty | The hover handler's `<template>` substitution did not replace the slot tokens |
| Tabbed code panel loses syntax highlighting on tab switch | The tokenizer was destroyed on `display:none`; use `visibility:hidden` or keep all panels in DOM |
| Compare-approaches columns don't stack on narrow viewport | The CSS grid lacks `grid-template-columns: repeat(auto-fit, minmax(...))` |

## Examples

**Example 1 — tabbed multi-perspective code panel**

```html
<div data-ve-tabs="code">
  <button data-ve-tab="server">server</button>
  <button data-ve-tab="client">client</button>
  <pre data-ve-tab-panel="server" data-ve-code="auto" data-ve-lang="py"><code>...</code></pre>
  <pre data-ve-tab-panel="client" data-ve-code="auto" data-ve-lang="ts"><code>...</code></pre>
</div>
```

The 6-line JS handler toggles `.on` on the button + the matching
`<pre>` — see [tabbed-code-panel](references/tabbed-code-panel.md).

**Example 2 — collapsed walkthrough (one step open at a time)**

```html
<div data-ve-walkthrough>
  <details><summary>Step 1: <span class="path">auth.py:42</span> — validate token</summary>
    <pre data-ve-code="auto" data-ve-lang="py"><code>...</code></pre>
  </details>
  <details><summary>Step 2: <span class="path">db.py:100</span> — load user</summary>
    <pre data-ve-code="auto" data-ve-lang="py"><code>...</code></pre>
  </details>
</div>
```

The `toggle` event closes other open `<details>` in the same
container — exactly one is open at a time.

## Visual verification

Every snippet composition MUST be screenshot-tested in BOTH light AND
dark themes. See
[../amvcp-self-debug-rules/SKILL.md](../amvcp-self-debug-rules/SKILL.md).
Verify (a) the active tab / open step / clicked node is visually
distinct, (b) the embedded code blocks retain their gutter + selection
chrome, (c) the composition chrome (sticky TOC, side panel, comparison
columns) does NOT introduce inner scrollbars (R-no-inner-scroll).

## Modes

Supports `data-ve-mode="readonly"` only. Snippet compositions are for
explanation/tutorial — the per-element 3-state decision pill (R20-R23)
does NOT apply.

## Composability

Composes with every other amvcp-* skill on the same page (R22).
Multiple compositions coexist independently. The only exclusive skill
is the overlay-runtime (R24).

## Resources

### Walkthroughs & single-step reveals
- [collapsed-snippets-walkthrough](references/collapsed-snippets-walkthrough.md) — `<details>` per step, mutually-exclusive disclosure (one open at a time via `toggle` event), file:line summary, hot-step modifier.
  > E2.1 The pattern · E2.2 The markup · E2.3 The CSS · E2.4 The mutually-exclusive disclosure pattern · E2.5 The hot-step modifier · E2.6 The composition with the runtime's code block · E2.7 The walkthrough's role in larger compositions · E2.8 Selection / commenting within an expanded step · E2.9 Accessibility · E2.10 The shape variation: numbered prose without `<details>` · E2.11 Tokens consumed · E2.12 Author rules
- [code-snippet-on-diagram-hover](references/code-snippet-on-diagram-hover.md) — hover any chart bar / diagram node → JSX prop snippet renders below with live token values interpolated.
  > G2.1 The pattern · G2.2 The markup · G2.3 The hover handler · G2.4 The sliders writing to CSS variables · G2.5 The snippet-template discipline · G2.6 What this pattern is good for · G2.7 What this pattern is NOT good for · G2.8 The mouseleave default · G2.9 Selection / commenting · G2.10 Light + dark verification · G2.11 Tokens consumed · G2.12 Mined source attribution

### Tabbed & click-driven panels
- [tabbed-code-panel](references/tabbed-code-panel.md) — 6-line JS tabbar, `[button.on data-t="0"]` ↔ `[<pre>.on]` toggle, 3-perspectives-on-the-same-change pattern.
  > E1.1 The pattern · E1.2 The canonical perspective sets · E1.3 Anti-patterns · E1.4 The composition example: feature-explainer config sample · E1.5 The 6-line JS handler · E1.6 The "first tab is the canonical one" rule · E1.7 Tab labels — discipline · E1.8 The 2-pane variant (Before / After) · E1.9 Auto-collapse adjacent text content · E1.10 Selection / commenting across tabs · E1.11 Pair with collapsed-snippets walkthrough · E1.12 Tokens consumed · E1.13 Author rules (composition-level)
- [click-step-to-code-panel](references/click-step-to-code-panel.md) — SVG flowchart node click → sticky right-side detail panel with `<pre>` code excerpt, `DETAIL = { k: { title, meta, body, code } }` map.
  > G1.1 The pattern · G1.2 The detail map · G1.3 The SVG markup · G1.4 The right panel markup · G1.5 The click handler · G1.6 The `.active` SVG style · G1.7 The 3-marker edge approach (diagram-side) · G1.8 Selection / commenting on the right-panel code · G1.9 Default state (no node selected) · G1.10 Light + dark verification · G1.11 Tokens consumed · G1.12 Author rules · G1.13 Mined source attribution · Overview

### Long-form explainer pages
- [architecture-explainer-snippets](references/architecture-explainer-snippets.md) — numbered callstack walkthrough, `[badge] [file:line] [prose] [<details> source]`, hot-step modifier on the trust boundary.
  > E6.1 The shape · E6.2 The composition with collapsed-snippets-walkthrough · E6.3 The leading SVG diagram · E6.4 The hot-step modifier · E6.5 The sticky right sidebar · E6.6 Composition with the diagram skill · E6.7 Selection / commenting flow · E6.8 Light + dark verification · E6.9 Tokens consumed · E6.10 Mined source attribution
- [feature-explainer-tabbed](references/feature-explainer-tabbed.md) — sticky TOC + step-by-step `<details>` + tabbed config samples + callout + Gotchas + FAQ + Files-Read provenance footer.
  > E7.1 The shape · E7.2 The page layout · E7.3 The step-by-step `<details>` walkthrough · E7.4 The tabbed code panel — Configuration section · E7.5 The Files-Read provenance footer · E7.6 Anchor links + smooth scroll · E7.7 The Gotchas / FAQ sections · E7.8 Selection / commenting flow · E7.9 Light + dark verification · E7.10 Tokens consumed · E7.11 Mined source attribution

### Multi-file plans & comparisons
- [implementation-plan-codepanels](references/implementation-plan-codepanels.md) — 2-col `[migration SQL | optimistic-mutation TS]` code grid, paired with mockups + risk table.
  > E8.1 The shape · E8.2 The markup · E8.3 Why 2 columns · E8.4 The "load-bearing pair" discipline · E8.5 The narrow-viewport stacking · E8.6 The "describe the pair" prose convention · E8.7 Composition with the risk table · E8.8 Selection / commenting · E8.9 Cross-references · E8.10 Light + dark verification · E8.11 Tokens consumed · E8.12 Mined source attribution
- [compare-n-approaches](references/compare-n-approaches.md) — 3-column "debounced search × 3 implementations" layout, code block + Pro/Con + metric chips + recommendation card per column.
  > E9.1 The shape · E9.2 The page-level grid · E9.3 Per-column markup · E9.4 The Pro/Con sub-grid · E9.5 The metric chips strip · E9.6 The recommendation card · E9.7 The "code panel per column" discipline · E9.8 Selection / commenting per column · E9.9 Cross-references · E9.10 When to use · E9.11 Light + dark verification · E9.12 Tokens consumed · E9.13 Mined source attribution

### Inline primitives
- [source-location-chip](references/source-location-chip.md) — the `path:line` atom: mono path in full-contrast `--vc-color-content`, line-range dimmed in `--vc-color-content-muted`; the shared spelling for every walkthrough step / summary / focus-card location label.
  > E10.1 The pattern · E10.2 The markup · E10.3 The CSS · E10.4 Where it appears · E10.5 The line-range forms · E10.6 Selection / commenting · E10.7 Light + dark verification · E10.8 Tokens consumed · E10.9 Anti-patterns · E10.10 Mined source attribution
