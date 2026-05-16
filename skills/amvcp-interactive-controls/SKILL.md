---
name: amvcp-interactive-controls
description: "Author self-contained interactive HTML control widgets — CSS-only accordion/tabs/modal, filter pills, segmented control, progressive stepper, virtualized list, sortable table, live-tweak visualizer, drag-reorder Kanban, single-column drag-list, before/after image slider, click-chip→scroll+pulse, hover-linked glossary, mutually-exclusive details walkthrough, tabbed code samples, copy button on code block, copy-to-clipboard with execCommand fallback, contenteditable live highlighter, live diff sidebar, persistent checklist, CSS-only toggle switch, conditional form warning chain, light/dark theme toggle, sticky table-of-contents, scroll-spy, keyboard shortcuts, search-filter list, scroll-snap deck, double-handle range, multi-select with chips, breadcrumb stack, tooltip on hover, native popover and dialog, iframe sandbox host, inline SVG illustration controls, textarea autosize, zoom-image lightbox, disclosure summary badge. All DESIGN.md-themed, state persisted to localStorage, every widget degrades gracefully when JS is off. Use when the user wants tabs, an accordion, a filterable list, a step/progress flow, a long windowed list, an interactive 'tweak a control' demo, a Kanban, a comparison slider, a sortable table, a copy button, a live editor, a checklist, a toggle, a theme switcher, a TOC, a search box, a slide deck, a min/max picker, a tag chip picker, a breadcrumb, a tooltip, a modal/popover, a sandboxed embed, an interactive SVG, an autosizing textarea, or an image lightbox. Trigger with 'tabs', 'accordion', 'collapsible', 'filter pills', 'segmented control', 'stepper', 'progress steps', 'virtualized list', 'sortable table', 'live demo', 'kanban', 'drag to reorder', 'before/after', 'copy button', 'live editor', 'live highlighter', 'live diff', 'checklist', 'toggle', 'switch', 'theme switcher', 'dark mode', 'table of contents', 'TOC', 'scroll spy', 'keyboard shortcut', 'search box', 'slide deck', 'range picker', 'tag picker', 'multi-select chips', 'breadcrumb', 'tooltip', 'modal', 'popover', 'dialog', 'sandbox iframe', 'interactive svg', 'autosize textarea', 'lightbox', 'click to zoom'."
license: MIT
metadata:
  author: Emasoft
---

# Interactive Controls

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Emits scaffoldable, DESIGN.md-themed HTML control widgets — accordion,
tabs, modal, popover/dialog, filter pills, segmented control,
checklist, toggle switch, stepper, virtualized list, sortable table,
live-tweak visualizer, drag-reorder Kanban, single-column drag list,
before/after slider, click-chip → scroll-spy → pulse, hover-linked
glossary, mutually-exclusive `<details>` walkthrough, tabbed code
samples, copy button on code block, copy-to-clipboard helper,
contenteditable live highlighter, live diff sidebar, conditional-form
warning chain, light/dark theme switcher, sticky table-of-contents,
scroll-spy, keyboard shortcuts, search-filter list, scroll-snap deck,
double-handle range, multi-select chip picker, breadcrumb stack,
hover tooltip, iframe sandbox host, inline-SVG illustration controls,
textarea autosize, zoom-image lightbox, collapsed-file disclosure
summary.

Every widget reads its data from **one** embedded JSON model, persists
state to `localStorage`, themes off the `--vc-*` token engine, and
**degrades gracefully when JS is off** (the CSS-only baseline keeps
working). Zero dependencies, no CDN, no build step, no server —
opens from `file://`.

## Progressive disclosure

Three concentric rings; pick the right ring for the task and never
read more than you need.

### Inner ring — cross-cutting plumbing (read first)

| Reference | What |
|---|---|
| [state-plumbing.md](./references/state-plumbing.md) | Embedded JSON model + localStorage helper + selection-system seam. **The contract every widget speaks.** |
| [copy-clipboard-fallback.md](./references/copy-clipboard-fallback.md) | `navigator.clipboard.writeText` + `execCommand` fallback + toast helper. |
| [scroll-spy.md](./references/scroll-spy.md) | `IntersectionObserver` engine behind the sticky TOC + slide deck counter. |
| [keyboard-shortcuts.md](./references/keyboard-shortcuts.md) | Case-insensitive key compare + edit-target guard + `?` help overlay. |

### Middle ring — the seven big primitives (the original taxonomy)

| Reference | What |
|---|---|
| [panels-disclosure.md](./references/panels-disclosure.md) | CSS-only accordion / tabs / modal spine. |
| [filter-pills.md](./references/filter-pills.md) | Segmented control / filter pills. |
| [stepper.md](./references/stepper.md) | Progressive stepper with `animation`-skill seam. |
| [virtualized-list.md](./references/virtualized-list.md) | Window-scrolled large-data list, binary-search. |
| [live-tweak.md](./references/live-tweak.md) | `setProperty` + `classList`-swap engine. |
| [drag-reorder.md](./references/drag-reorder.md) | Reorderable Kanban + Markdown export. |
| [sortable-table.md](./references/sortable-table.md) | Click-to-sort table with numeric auto-detect. |

### Outer ring — composable techniques (pick what fits the brief)

| Reference | What | Choose when |
|---|---|---|
| [css-only-toggle-switch.md](./references/css-only-toggle-switch.md) | iOS-style rocker `<input type="checkbox">` styled | "binary on/off setting" |
| [persistent-checklist.md](./references/persistent-checklist.md) | Multi-item review list, X/N counter, localStorage | "PR test plan", "deploy checklist", "rubric" |
| [conditional-form-warning-chain.md](./references/conditional-form-warning-chain.md) | Row tint + chip + banner for unmet prerequisites | "this option requires that one" |
| [light-dark-theme-toggle.md](./references/light-dark-theme-toggle.md) | Auto/Light/Dark rocker + first-paint flash protection | "theme switcher" |
| [tabbed-code-samples.md](./references/tabbed-code-samples.md) | 6-line tab pattern over `<pre>` panels | "show the same thing from N angles" |
| [mutually-exclusive-details.md](./references/mutually-exclusive-details.md) | Vertical walkthrough, single-open `<details>` | "step-by-step explainer with collapsible bodies" |
| [disclosure-summary-badge.md](./references/disclosure-summary-badge.md) | Collapsed-file `<summary>` with risk dot + stat | "PR file review with safe-files-collapsed" |
| [search-filter-list.md](./references/search-filter-list.md) | Search input + incremental list filter + `<mark>` | "filter long list of findings" |
| [sticky-table-of-contents.md](./references/sticky-table-of-contents.md) | Auto-built TOC + scroll-spy + smooth-scroll | "long doc needs persistent nav" |
| [click-chip-scroll-pulse.md](./references/click-chip-scroll-pulse.md) | Risk-map chip → smooth-scroll + 1.4 s outline pulse | "summary token → jump to section" |
| [hover-linked-glossary.md](./references/hover-linked-glossary.md) | `.term` ↔ `<dt>` cross-highlight on hover | "concept explainer with glossary" |
| [breadcrumb-stack.md](./references/breadcrumb-stack.md) | Where-am-I-in-the-hierarchy strip | "drill-down view" |
| [tooltip-on-hover.md](./references/tooltip-on-hover.md) | Three tiers: `title=""`, CSS `::after`, JS popover w/ hover-bridge | "hint on hover" |
| [popover-and-dialog.md](./references/popover-and-dialog.md) | Modern `<dialog>` + `popover` attribute | "real modal" or "anchored menu" |
| [zoom-image-lightbox.md](./references/zoom-image-lightbox.md) | `popover` + `:target` lightbox | "click thumbnail → fullsize" |
| [before-after-slider.md](./references/before-after-slider.md) | Two-image wipe slider with handle | "compare two screenshots in register" |
| [scroll-snap-deck.md](./references/scroll-snap-deck.md) | `scroll-snap-type: y mandatory` mini deck | "6-slide inline deck" |
| [range-slider-with-output.md](./references/range-slider-with-output.md) | `<input type="range">` + `<output>` + persist | "pick a value" |
| [range-double-handle.md](./references/range-double-handle.md) | Two stacked range inputs + non-crossing clamp | "pick a min..max range" |
| [multi-select-with-chips.md](./references/multi-select-with-chips.md) | `<select multiple>` upgraded with chip view | "pick N tags" |
| [native-dnd-drop-indicator.md](./references/native-dnd-drop-indicator.md) | Single-column drag-reorder + gap drop indicator | "single-list reorder" |
| [copy-button-on-code-block.md](./references/copy-button-on-code-block.md) | Hover-revealed top-right copy button | "code blocks need a copy" |
| [contenteditable-live-highlighter.md](./references/contenteditable-live-highlighter.md) | `<div contenteditable>` + caret save/restore + RAF debounce | "type → see colored tokens" |
| [live-diff-sidebar.md](./references/live-diff-sidebar.md) | Always-visible only-changed-lines diff + Copy/Reset | "config / form editor with live diff" |
| [textarea-autosize.md](./references/textarea-autosize.md) | Textarea that grows with content (no inner scrollbar) | "comment / draft input that fits" |
| [iframe-sandbox-host.md](./references/iframe-sandbox-host.md) | `<iframe sandbox>` + `srcdoc` + script clone-recreate | "render untrusted HTML safely" |
| [inline-svg-illustration-controls.md](./references/inline-svg-illustration-controls.md) | Form controls mutating an inline SVG live | "perturb-and-see concept teaching" |

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

## Instructions

1. Put the page's structured data in **one** `<script type="application/json"
   id="ic-data">` block. Optionally embed a
   `<script type="text/design-md" id="ic-designmd">` to theme the page.
2. Choose the widget(s) and emit the documented HTML skeleton for each
   (the reference files give the exact markup). Reference
   `amvcp-interactive.css` once.
3. Add `data-ic-persist` + a unique `data-id` to anything that should
   survive a reload.
4. For a virtualized list, only emit `.ic-vlist` when
   `items.length >= 200`; always include a `<noscript>` static fallback.
   For tabs and filter pills, emit one per-page `#id:checked ~ …`
   show/hide rule pair per tab/filter.
5. Never hand-author ARIA on tabs/steppers — `amvcp-interactive.js`
   injects it. Never use raw hex or raw px in CSS — reference `--vc-*` /
   `--ve-*` tokens with a `var(…, #fallback)` slot.
6. **Always design BOTH light and dark themes.** Every visual must work
   in both. Verify both via dev-browser screenshots before declaring
   done (see `skills/amvcp-self-debug-rules/SKILL.md`).
7. **JS-off baseline is mandatory.** Every widget MUST work CSS-only
   when JS is disabled — the appropriate reference's "JS-off degradation"
   section is the contract.

## Output

A single self-contained HTML file. Widgets fire namespaced
`CustomEvent`s a host page can listen to: `ic:tab-change`,
`ic:filter-change`, `ic:step-nav`, `ic:reorder`, `ic:checklist-change`,
`ic:msel-change`, `ic:rg2-change`, `ic:search-change`, `ic:slider-change`,
`ic:sandbox-message`, `themechange` (event-driven, no polling). The
Kanban also exports its state as Markdown (`##` columns, `- [ ]` cards).

## Error Handling

| Failure | Symptom | Fix |
|---|---|---|
| Embedded JSON malformed / missing | Widget does not render; console error | Fix the `<script type="application/json">` block — it must be valid JSON |
| `data-ic-persist` without `data-id` | Console error; state not persisted | Add a unique `data-id` |
| Virtualized `.ic-vlist` with JS off | Empty list | The scaffold's `<noscript>` static fallback must be present |
| Hand-authored `role="tab"` / `aria-selected` | Doubled / conflicting ARIA | Let `amvcp-interactive.js` inject ARIA — author only the documented skeleton |
| Inner `overflow:auto` on a panel/modal/list | Nested scrollbar | Remove it — the page expands; the virtualized list is window-scrolled |
| Raw hex / raw px in component CSS | Theme hot-swap does not recolor / rescale | Reference `--vc-*` / `--ve-*` tokens with a `var(…, #fallback)` slot |
| `innerHTML` used to inject model data | XSS risk with user data | Use `createElement` + `textContent` |
| Stepper redefines `@keyframes` when `animation` skill present | Duplicate keyframe | Use the guarded single-injection (`injectSpinKeyframe`) |
| Theme toggle flashes wrong theme on load | First paint shows light, then flips to saved theme | Add the inline preamble (see `light-dark-theme-toggle.md`) |
| Tooltip vanishes when cursor enters it | Floating tooltip never reachable | Add the 180 ms hover-bridge (see `tooltip-on-hover.md`) |
| Shift-modified shortcut silently no-ops | `Cmd+Shift+Z` doesn't redo | Case-insensitive key compare (see `keyboard-shortcuts.md`) |
| Iframe escapes sandbox | Untrusted code modifies parent | Never combine `allow-scripts` + `allow-same-origin` |
| Double-handle range crossing | Lo handle above hi | Apply non-crossing clamp in JS |

## Examples

- *"Make these findings filterable by severity."* → `filter-pills.md`.
- *"Show the deploy pipeline as steps."* → `stepper.md`.
- *"Render this 5000-line log."* → `virtualized-list.md`.
- *"Let me drag tickets between columns."* → `drag-reorder.md`.
- *"Add a 'Copy diff' button to this form."* → `live-diff-sidebar.md` +
  `copy-clipboard-fallback.md`.
- *"Add light/dark mode."* → `light-dark-theme-toggle.md`.
- *"Add a sortable risk-table."* → `sortable-table.md`.
- *"Show before/after of the redesign."* → `before-after-slider.md`.
- *"Add a sticky TOC for this long postmortem."* →
  `sticky-table-of-contents.md`.
- *"Add `?` keyboard help overlay."* → `keyboard-shortcuts.md` +
  `popover-and-dialog.md`.

## Resources

All 31 reference files live under `./references/`. Read the **inner ring**
(state-plumbing, copy-clipboard, scroll-spy, keyboard-shortcuts) first
since they're the shared infrastructure; then jump to whichever widget
references your brief. Each reference is self-sufficient — 200–600
lines covering scaffold, lib functions, DESIGN.md tokens,
selection/comment/decision-mini notes, JS-off degradation behavior,
anti-patterns, and verification snippets.
