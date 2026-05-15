---
name: amvcp-interactive-controls
description: "Author self-contained interactive HTML control widgets — CSS-only accordion/tabs/modal, filter pills, progressive stepper, virtualized list, live-tweak visualizer, drag-reorder Kanban — all DESIGN.md-themed, state persisted to localStorage, degrading gracefully with JS off. Use when the user wants tabs, an accordion, a filterable list, a step/progress flow, a long windowed list, an interactive 'tweak a control' demo, or a drag-reorder board. Trigger with 'tabs', 'accordion', 'collapsible', 'filter pills', 'segmented control', 'stepper', 'progress steps', 'virtualized list', 'live demo', 'kanban', 'drag to reorder'."
license: MIT
metadata:
  author: Emasoft
---

# Interactive Controls

## Overview

Emits scaffoldable, DESIGN.md-themed HTML control widgets — accordion, tabs, modal, filter pills, stepper, virtualized list, live-tweak visualizer, drag-reorder Kanban. Every widget reads its data from one embedded JSON model, persists state to localStorage, themes off the `--vc-*` token engine, and degrades gracefully when JS is off. Zero dependencies, no CDN, no build step, no server — opens from `file://`.

## Prerequisites

- A browser (Chromium via `--app=URL` preferred; default browser works).
- `amvcp-designmd.js` + `amvcp-interactive.js` + `amvcp-interactive.css` colocated with the HTML. Optionally `amvcp-runtime.js`.
- Script load order in `<head>`: engine → runtime (if used) → interactive.

## Instructions

1. Put the page's structured data in **one** `<script type="application/json" id="ic-data">` block. Optionally embed a `<script type="text/design-md" id="ic-designmd">` to theme the page.
2. Choose the widget(s) and emit the documented HTML skeleton for each (the reference files give the exact markup). Reference `amvcp-interactive.css` once.
3. Add `data-ic-persist` + a unique `data-id` to anything that should survive a reload.
4. For a virtualized list, only emit `.ic-vlist` when `items.length >= 200`; always include a `<noscript>` static fallback. For tabs and filter pills, emit one per-page `#id:checked ~ …` show/hide rule pair per tab/filter.
5. Never hand-author ARIA on tabs/steppers — `amvcp-interactive.js` injects it. Never use raw hex or raw px in CSS — reference `--vc-*` / `--ve-*` tokens with a `var(…, #fallback)` slot.

## Output

A single self-contained HTML file. Widgets fire namespaced `CustomEvent`s a host page can listen to: `ic:tab-change`, `ic:filter-change`, `ic:step-nav`, `ic:reorder` (event-driven, no polling). The Kanban also exports its state as Markdown (`##` columns, `- [ ]` cards).

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

## Examples

- *"Make these findings filterable by severity."* → filter pills (`references/filter-pills.md`).
- *"Show the deploy pipeline as steps."* → progressive stepper (`references/stepper.md`).
- *"Render this 5000-line log."* → virtualized list (`references/virtualized-list.md`).
- *"Let me drag tickets between columns."* → drag-reorder Kanban (`references/drag-reorder.md`).

## Resources

- [state-plumbing.md](./references/state-plumbing.md) — embedded JSON model + localStorage helper contract; selection-system seam.
- [panels-disclosure.md](./references/panels-disclosure.md) — accordion / tabs / modal HTML + CSS spine.
- [filter-pills.md](./references/filter-pills.md) — segmented control / filter pills.
- [stepper.md](./references/stepper.md) — progressive stepper + the `animation`-skill keyframe seam.
- [virtualized-list.md](./references/virtualized-list.md) — windowed large-data list, window-scrolled.
- [live-tweak.md](./references/live-tweak.md) — `setProperty` + `classList`-swap engine.
- [drag-reorder.md](./references/drag-reorder.md) — reorderable list / Kanban + Markdown export.
