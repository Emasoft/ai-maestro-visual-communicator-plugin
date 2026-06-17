# Authoring guide — emit steps, output contract, troubleshooting, scaffold

This file holds the detailed authoring procedure, the runtime output
contract, the error-handling table, and a concrete worked scaffold for
the Interactive Controls category. SKILL.md keeps the routing/decision
tables; consult this file when you are actually emitting a widget.

## Table of Contents

- [Full widget catalogue](#full-widget-catalogue)
- [Instructions](#instructions)
- [Output](#output)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Concrete scaffold — filter pills + sortable table](#concrete-scaffold--filter-pills--sortable-table)

## Full widget catalogue

The category emits scaffoldable, DESIGN.md-themed HTML control widgets —
accordion, tabs, modal, popover/dialog, filter pills, segmented control,
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

### Concrete scaffold — filter pills + sortable table

```html
<link rel="stylesheet" href="amvcp-interactive.css">
<script src="amvcp-designmd.js"></script>
<script src="amvcp-interactive.js"></script>

<!-- Filter pills — class="ic-filterbar", .ic-pill-radio / .ic-pill,
     and sibling .ic-filtered blocks keyed by data-filter-tag. -->
<div class="ic-filterbar" data-ic-persist data-id="findings-filter"
     role="radiogroup" aria-label="Filter findings">
  <span class="ic-pill-group">
    <input class="ic-pill-radio" type="radio" name="findings-filter"
           id="flt-all" value="*" checked>
    <label class="ic-pill" for="flt-all">All
      <span class="ic-pill-count"></span></label>
    <input class="ic-pill-radio" type="radio" name="findings-filter"
           id="flt-high" value="high">
    <label class="ic-pill" for="flt-high">High
      <span class="ic-pill-count"></span></label>
  </span>
</div>

<!-- Sortable table — class="ic-table" + data-ic-sortable, with
     data-ic-sort on each sortable <th> and pre-rendered <tbody> rows. -->
<table class="ic-table" data-ic-sortable data-id="findings" data-ic-persist>
  <thead>
    <tr><th data-ic-sort>Title</th><th data-ic-sort>Severity</th></tr>
  </thead>
  <tbody>
    <tr class="ic-filtered" data-filter-tag="high"><td>Stale credential</td><td>high</td></tr>
    <tr class="ic-filtered" data-filter-tag="med"><td>Slow query</td><td>med</td></tr>
    <tr class="ic-filtered" data-filter-tag="low"><td>Lint warning</td><td>low</td></tr>
  </tbody>
</table>
```

`amvcp-interactive.js` injects ARIA, wires the three-state sort cycle,
and (for the CSS-only filter baseline) you also emit one
`#flt-<id>:checked ~ .ic-filtered … { display:… }` rule pair per pill
(see `filter-pills.md`). The filter bar fires `ic:filter-change`; the
sortable table self-manages its sort state (no event) and persists the
chosen column via `data-ic-persist`.
