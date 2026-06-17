---
name: amvcp-interactive-controls
description: "Self-contained interactive HTML widgets — tabs, accordion, modal, filter pills, stepper, sortable table, Kanban, slider, theme toggle, TOC, tooltip, popover, lightbox. DESIGN.md-themed, persists to localStorage. Use when the user wants any interactive widget. Trigger with 'tabs', 'accordion', 'filter pills', 'stepper', 'sortable table', 'kanban', 'before/after', 'live editor', 'checklist', 'theme switcher', 'TOC', 'search box', 'tooltip', 'modal', 'popover', 'lightbox'."
license: MIT
metadata:
  author: Emasoft
---

# Interactive Controls

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Emits ~38 scaffoldable, DESIGN.md-themed HTML control widgets —
accordion, tabs, modal, popover/dialog, filter pills, stepper,
virtualized list, sortable table, drag-reorder Kanban, before/after
slider, theme switcher, sticky TOC, tooltip, lightbox, and more. The
complete catalogue is enumerated in
[authoring-guide.md](./references/authoring-guide.md); the Progressive
disclosure rings below route to every widget's reference.

Every widget reads **one** embedded JSON model, persists to
`localStorage`, themes off the `--vc-*` tokens, degrades gracefully
with JS off, and is zero-dependency — opens from `file://`.

## Progressive disclosure

Three concentric rings; pick the right ring for the task and never
read more than you need. Read the **inner ring** first (shared
infrastructure), then the widget reference your brief needs — each
reference is self-sufficient (scaffold, lib functions, DESIGN.md
tokens, selection/comment/decision-mini notes, JS-off degradation,
anti-patterns, verification).

### Inner ring — cross-cutting plumbing (read first)

| Reference | What |
|---|---|
| [state-plumbing.md](./references/state-plumbing.md) | Embedded JSON model + localStorage helper + selection-system seam. **The contract every widget speaks.** |
  > Embedded JSON data model · localStorage persistence helper · The one allowed try/catch · Selection-system seam · 3-state mini-switch — already shipped (seam only)
| [copy-clipboard-fallback.md](./references/copy-clipboard-fallback.md) | `navigator.clipboard.writeText` + `execCommand` fallback + toast helper. |
  > What it is · Helper · Toast confirmation · Standard pattern — wire a button · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [scroll-spy.md](./references/scroll-spy.md) | `IntersectionObserver` engine behind the sticky TOC + slide deck counter. |
  > What it is · Helper · The `rootMargin` trick · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [keyboard-shortcuts.md](./references/keyboard-shortcuts.md) | Case-insensitive key compare + edit-target guard + `?` help overlay. |
  > What it is · Helper — register a shortcut · Standard bindings · Help overlay · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification

### Middle ring — the seven big primitives (the original taxonomy)

| Reference | What |
|---|---|
| [panels-disclosure.md](./references/panels-disclosure.md) | CSS-only accordion / tabs / modal spine. |
  > Accordion — native `<details>`/`<summary>` · Tabs — radio inputs + `:checked` + sibling combinator · Modal — `:target` · no-nested-scrollbars
| [filter-pills.md](./references/filter-pills.md) | Segmented control / filter pills. |
  > HTML skeleton · `display:contents` — the transparent wrapper · Show/hide — CSS-only baseline · JS-enhanced layer · no-nested-scrollbars
| [stepper.md](./references/stepper.md) | Progressive stepper with `animation`-skill seam. |
  > HTML skeleton · State model · JS layer · Spin keyframe — seam with the `animation` technique · prefers-reduced-motion · no-nested-scrollbars
| [virtualized-list.md](./references/virtualized-list.md) | Window-scrolled large-data list, binary-search. |
  > HTML skeleton · Critical constraint — page-level scroll, NOT an inner scroller · The math (pure functions, exported for tests) · Render loop · Threshold — only virtualize past 200 rows · Degradation with JS off
| [live-tweak.md](./references/live-tweak.md) | `setProperty` + `classList`-swap engine. |
  > HTML skeleton · Two modes, one engine · Bridge to the DESIGN.md engine · prefers-reduced-motion · no-nested-scrollbars
| [drag-reorder.md](./references/drag-reorder.md) | Reorderable Kanban + Markdown export. |
  > HTML skeleton · One source of truth · Cards · Markdown export · Persistence · Degradation with JS off · no-nested-scrollbars
| [sortable-table.md](./references/sortable-table.md) | Click-to-sort table with numeric auto-detect. |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification

### Outer ring — composable techniques (pick what fits the brief)

| Reference | What | Choose when |
|---|---|---|
| [css-only-toggle-switch.md](./references/css-only-toggle-switch.md) | iOS-style rocker `<input type="checkbox">` styled | "binary on/off setting" |
  > What it is · Scaffold · Lib functions · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [persistent-checklist.md](./references/persistent-checklist.md) | Multi-item review list, X/N counter, localStorage | "PR test plan", "deploy checklist", "rubric" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [conditional-form-warning-chain.md](./references/conditional-form-warning-chain.md) | Row tint + chip + banner for unmet prerequisites | "this option requires that one" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [light-dark-theme-toggle.md](./references/light-dark-theme-toggle.md) | Auto/Light/Dark rocker + first-paint flash protection | "theme switcher" |
  > What it is · Scaffold · CSS-only theme application (the no-JS path) · JS layer · First-paint flash protection (inline preamble) · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [tabbed-code-samples.md](./references/tabbed-code-samples.md) | 6-line tab pattern over `<pre>` panels | "show the same thing from N angles" |
  > What it is · Scaffold · JS layer — 6 lines · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [mutually-exclusive-details.md](./references/mutually-exclusive-details.md) | Vertical walkthrough, single-open `<details>` | "step-by-step explainer with collapsible bodies" |
  > What it is · Scaffold · Lib functions · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [disclosure-summary-badge.md](./references/disclosure-summary-badge.md) | Collapsed-file `<summary>` with risk dot + stat | "PR file review with safe-files-collapsed" |
  > What it is · Scaffold · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [search-filter-list.md](./references/search-filter-list.md) | Search input + incremental list filter + `<mark>` | "filter long list of findings" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [sticky-table-of-contents.md](./references/sticky-table-of-contents.md) | Auto-built TOC + scroll-spy + smooth-scroll | "long doc needs persistent nav" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [click-chip-scroll-pulse.md](./references/click-chip-scroll-pulse.md) | Risk-map chip → smooth-scroll + 1.4 s outline pulse | "summary token → jump to section" |
  > What it is · Scaffold · JS layer (enhancement) · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [hover-linked-glossary.md](./references/hover-linked-glossary.md) | `.term` ↔ `<dt>` cross-highlight on hover | "concept explainer with glossary" |
  > What it is · Scaffold · JS layer · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [breadcrumb-stack.md](./references/breadcrumb-stack.md) | Where-am-I-in-the-hierarchy strip | "drill-down view" |
  > What it is · Scaffold · Dynamic / API · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [tooltip-on-hover.md](./references/tooltip-on-hover.md) | Three tiers: `title=""`, CSS `::after`, JS popover w/ hover-bridge | "hint on hover" |
  > Three tiers · Tier 1 — `title=""` baseline · Tier 2 — CSS `::after` tooltip · Tier 3 — JS popover with hover-bridge · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [popover-and-dialog.md](./references/popover-and-dialog.md) | Modern `<dialog>` + `popover` attribute | "real modal" or "anchored menu" |
  > Two patterns · `<dialog>` — true modal · `popover` attribute — non-modal disclosure · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [zoom-image-lightbox.md](./references/zoom-image-lightbox.md) | `popover` + `:target` lightbox | "click thumbnail → fullsize" |
  > What it is · Scaffold — `popover` version · Scaffold — `:target` fallback · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [before-after-slider.md](./references/before-after-slider.md) | Two-image wipe slider with handle | "compare two screenshots in register" |
  > What it is · Scaffold · JS layer · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [scroll-snap-deck.md](./references/scroll-snap-deck.md) | `scroll-snap-type: y mandatory` mini deck | "6-slide inline deck" |
  > What it is · Scaffold · no-nested-scrollbars exception · JS layer — arrow keys + counter · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [range-slider-with-output.md](./references/range-slider-with-output.md) | `<input type="range">` + `<output>` + persist | "pick a value" |
  > What it is · Scaffold · JS-enhanced layer · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [range-double-handle.md](./references/range-double-handle.md) | Two stacked range inputs + non-crossing clamp | "pick a min..max range" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [multi-select-with-chips.md](./references/multi-select-with-chips.md) | `<select multiple>` upgraded with chip view | "pick N tags" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [native-dnd-drop-indicator.md](./references/native-dnd-drop-indicator.md) | Single-column drag-reorder + gap drop indicator | "single-list reorder" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [copy-button-on-code-block.md](./references/copy-button-on-code-block.md) | Hover-revealed top-right copy button | "code blocks need a copy" |
  > What it is · Scaffold · JS handler · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [contenteditable-live-highlighter.md](./references/contenteditable-live-highlighter.md) | `<div contenteditable>` + caret save/restore + RAF debounce | "type → see colored tokens" |
  > What it is · Scaffold · JS engine — caret offset save/restore · JS engine — tokenize + re-render + RAF debounce · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [live-diff-sidebar.md](./references/live-diff-sidebar.md) | Always-visible only-changed-lines diff + Copy/Reset | "config / form editor with live diff" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [textarea-autosize.md](./references/textarea-autosize.md) | Textarea that grows with content (no inner scrollbar) | "comment / draft input that fits" |
  > What it is · Scaffold · JS engine · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [iframe-sandbox-host.md](./references/iframe-sandbox-host.md) | `<iframe sandbox>` + `srcdoc` + script clone-recreate | "render untrusted HTML safely" |
  > What it is · Scaffold · JS engine — drop snippet, optionally postMessage · Sandbox policy table · Script clone-recreate trick · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification
| [inline-svg-illustration-controls.md](./references/inline-svg-illustration-controls.md) | Form controls mutating an inline SVG live | "perturb-and-see concept teaching" |
  > What it is · Scaffold · JS engine — concept-explainer "ring" · DESIGN.md tokens · Selection / comment / decision-mini · JS-off degradation · Anti-patterns · Verification

## When to choose this category

The category fans out into several "shapes". Use this table to pick
the right reference quickly:

| If the task is to… | Read |
|---|---|
| Make these findings filterable | `filter-pills.md` |
| Show the pipeline as steps | `stepper.md` |
| Render a 5000-line log | `virtualized-list.md` |
| Drag tickets between columns | `drag-reorder.md` |
| Reorder a single list | `native-dnd-drop-indicator.md` |
| Make this table sortable | `sortable-table.md` |
| Add a "Copy" button next to code | `copy-button-on-code-block.md` |
| Add a "Copy diff" / "Copy markdown" button | `copy-clipboard-fallback.md` |
| Compare two screenshots | `before-after-slider.md` |
| Add a tab pattern | `panels-disclosure.md` |
| Show multiple code views (yaml / ts / curl) | `tabbed-code-samples.md` |
| Add a walkthrough with collapsible steps | `mutually-exclusive-details.md` |
| Add an accordion of FAQ items | `panels-disclosure.md` |
| Wrap collapsed-by-default review files | `disclosure-summary-badge.md` |
| Build a sticky table of contents | `sticky-table-of-contents.md` |
| Add jump-to chips at the top | `click-chip-scroll-pulse.md` |
| Add hover-linked glossary entries | `hover-linked-glossary.md` |
| Add a search box for a long list | `search-filter-list.md` |
| Add a breadcrumb trail | `breadcrumb-stack.md` |
| Add a hover hint to a control | `tooltip-on-hover.md` |
| Open a modal confirmation | `popover-and-dialog.md` |
| Open a non-modal help popover | `popover-and-dialog.md` |
| Add a click-to-zoom image | `zoom-image-lightbox.md` |
| Inline a 6-slide deck | `scroll-snap-deck.md` |
| Add a slider for a numeric value | `range-slider-with-output.md` |
| Add a min..max range picker | `range-double-handle.md` |
| Add a tag picker (multi-select) | `multi-select-with-chips.md` |
| Add a binary toggle switch | `css-only-toggle-switch.md` |
| Add a checklist of items | `persistent-checklist.md` |
| Add a Light/Dark mode switcher | `light-dark-theme-toggle.md` |
| Warn the user that A needs B | `conditional-form-warning-chain.md` |
| Always-visible "what would I commit" diff | `live-diff-sidebar.md` |
| Live-edit text with colored tokens | `contenteditable-live-highlighter.md` |
| Live "tweak a slider, see CSS change" demo | `live-tweak.md` |
| Live perturb an SVG diagram | `inline-svg-illustration-controls.md` |
| Make a textarea grow with content | `textarea-autosize.md` |
| Add keyboard shortcuts (`?` help, `Cmd+K`) | `keyboard-shortcuts.md` |
| Track "current section" while scrolling | `scroll-spy.md` |
| Safely embed untrusted HTML | `iframe-sandbox-host.md` |

## Prerequisites

- A browser (Chromium via `--app=URL` preferred; default browser works).
- `amvcp-designmd.js` + `amvcp-interactive.js` + `amvcp-interactive.css`
  colocated with the HTML. Optionally `amvcp-runtime.js`.
- Script load order in `<head>`: engine → runtime (if used) → interactive.

## Authoring, output & troubleshooting

Emit steps, the runtime output/event contract, the full error-handling
table, and a concrete worked scaffold (filter pills + sortable table)
live in:

- [authoring-guide.md](./references/authoring-guide.md) — how to emit a widget + output contract + troubleshooting + scaffold.
  > Authoring guide — emit steps, output contract, troubleshooting, scaffold · Full widget catalogue · Instructions · Output · Error Handling · Examples · Concrete scaffold — filter pills + sortable table

Two correctness contracts always apply (detail in the guide): **ship
BOTH light and dark themes** and keep the **JS-off CSS-only baseline**
working — verify both via dev-browser screenshots
(`skills/amvcp-self-debug-rules/SKILL.md`).

## Modes

This skill supports `data-ve-mode="readonly"` only. The widgets (tabs, accordion, modal, lightbox, copy button, theme toggle, TOC, etc.) are UI controls — they have their own state (open/closed, selected tab, etc.) but they are NOT 3-state-decision atoms. For "ask the user to pick an option" use `amvcp-form-inputs` or `amvcp-choice-tables` instead.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple control widgets coexist independently. The only exclusive skill is the overlay-runtime (R24).
