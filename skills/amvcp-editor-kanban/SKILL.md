---
name: amvcp-editor-kanban
description: "Ticket-triage kanban editor — a self-contained, DESIGN.md-themed board whose tickets the user drags between Now / Next / Later / Cut columns, then EXPORTS the resulting priority ordering as markdown back to the agent. Drag is mouse + touch + pen; state lives only in existing classes + the runtime's brightness/glow (no new frames/ghosts/outlines); export rides the runtime selection channel (a kind:element entry whose data.markdown carries the ordering); fully DESIGN.md-themed, light + dark both. Use when triaging tickets, prioritizing a backlog, sorting work into priority buckets, or building a drag triage board. Trigger with 'triage board', 'triage tickets', 'prioritize backlog', 'Now/Next/Later/Cut', 'drag tickets between columns', 'kanban triage'."
license: MIT
metadata:
  author: Emasoft
---

# Editor — Ticket Triage Kanban

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Selection-wire contract:** [`references/interactive-selection-base.md`](../../references/interactive-selection-base.md). **Sibling drag widgets:** the rank-list / tier-list inside [amvcp-form-inputs](../amvcp-form-inputs/SKILL.md) (same shared pointer-sortable pattern). **Design vocabulary:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md).

## Overview

THE THING: a **ticket-triage board**. The user drags tickets between the fixed Now / Next / Later / Cut columns (configurable), and the board **exports the resulting left-to-right priority ordering as markdown** the agent can read and act on. It is the drag-triage member of the "custom editing interface" class (manipulate state in the UI → export it back to the agent), realized through amvcp's existing selection-payload round-trip — never a foreign export UX.

Two modes, kept strictly separate (project CLAUDE.md):

1. **Interaction Design Mode = FIXED.** The board is a composable HTML primitive. Drag-in-flight, drop-target, and column membership live ONLY in existing-element CSS classes + the runtime's brightness/glow — NEVER a new frame, ghost, outline, or injected node (the NO-NEW-ELEMENTS rule). Selection · highlight · triple-state feedback · the comment-box round-trip come from `amvcp-runtime.js`; this module reinvents none of it. "Editable" = drag-to-reprioritize + the runtime's select→comment round-trip ("change the selected board this way: …"). "Exportable" = a single `kind:"element"` entry pushed into `window.veSelection` whose `data.markdown` carries the full ordering, returned verbatim by the runtime Submit/Enter — the export RIDES the existing selection channel (no second POST path).
2. **Graphic Style Mode = VARIABLE via DESIGN.md.** Columns, ticket cards, count badges, and drop-target tinting are themed entirely from `--vc-*` tokens — light + dark both, no hardcoded palette. A theme swap / hot-swap re-themes live.

## Prerequisites

- `amvcp-designmd.js` colocated with the HTML — parses the embedded **fenced** DESIGN.md and injects the `--vc-*` tokens (and drives the live `data-ve-theme` swap). The runtime injects DESIGN.md tokens as inline style on `<html>`, so the board MUST be themed from a fenced DESIGN.md, not a plain `<style>` block (a plain block loses to the inline tokens' specificity).
- `amvcp-runtime.js` — boots the engine, applies the embedded DESIGN.md, and installs the FIXED interaction layer + the selection channel (`window.veSelection`, `amvcpRuntime.buildSubmissionPayload`) the export rides on. Load order: designmd → runtime → editor-kanban.
- `amvcp-editor-kanban.js` — the board renderer (`window.amvcpEditorKanban` · `init` / `injectStyles` / `initBoard`). It injects its own scoped, `--vc-*`-themed stylesheet (`#vc-editor-kanban-styles`) once — graphic-style chrome only, NO selection/hover CSS.

## Instructions

1. **Author the board markup** — one `<div class="ve-editor-kanban" data-ve-id="…">` with a child `<script type="application/json">` carrying `{ label?, columns?, tickets[] }`. See [editor-kanban-markup](./references/editor-kanban-markup.md) for the full schema, the export wire-format, and the no-new-elements rule.
2. **Tickets** — each `{ key, title, column?, meta? }`. `column` is the starting column (defaults to the first column); the left-to-right column order is the exported priority order.
3. **Columns** — default `Now / Next / Later / Cut`; override with `columns: [{ key, label, tone? }]`. Order is meaningful — it is the priority gradient the markdown preserves.
4. **Mount** — load the three scripts (designmd → runtime → editor-kanban). The module auto-boots and scans every `.ve-editor-kanban`; or set `window.__vcEditorKanbanManualInit = true` and call `amvcpEditorKanban.injectStyles(doc)` + `amvcpEditorKanban.init(doc)` yourself after the runtime is up.
5. **Drag = reprioritize** — pointer events (mouse + touch + pen), 6px threshold so a sub-threshold tap still reaches the runtime's click-to-select model. Dropping over a ticket inserts before/after at its Y-midpoint; dropping over empty bucket space appends.
6. **Export rides the selection channel** — on every reorder (and once at mount) the board pushes/replaces ONE `kind:"element"` entry (`type:"kanban-export"`, stable `entryId`) into `window.veSelection`. `data.markdown` is the human-readable ordering; `data.ordering` is `{ columnKey: [ticketKey…] }`. Pressing Enter / the runtime Submit returns it verbatim — re-export updates the same entry (never duplicates). See [editor-kanban-markup](./references/editor-kanban-markup.md#export-contract).
7. **Persistence** — column placement is saved to `localStorage` (`amvcp-editor-kanban:<id>`) so a reload restores the triage; the engine degrades silently on Safari private mode.

## Output

A `<div class="ve-editor-kanban" data-ve-type="editor-kanban">` containing an optional label, a `.ve-editor-kanban-columns` flex row of `.ve-editor-kanban-col` columns (each with a count badge), and `.ve-editor-kanban-ticket` cards the user drags between columns. Both themes theme correctly. No nested scrollbars — the columns wrap and the page extends per the no-nested-scrollbars rule. On submit, the agent receives a `kanban-export` selection entry whose `data.markdown` is the priority ordering.

## Error Handling

| Symptom | Fix |
|---|---|
| `[editor-kanban error] missing data-ve-id attribute` | Add `data-ve-id="…"` to the `.ve-editor-kanban` div (fail-fast). |
| `[editor-kanban error] editor-kanban requires tickets[] with >= 1 ticket` | The `<script type="application/json">` must define `tickets` as a non-empty array. |
| `[editor-kanban error] malformed JSON: …` | Fix the JSON in the child `<script type="application/json">`. |
| Tickets don't highlight / select / show a comment handle | The runtime (`amvcp-runtime.js`) isn't loaded, or loaded before nothing stamps selection. Load order is designmd → runtime → editor-kanban. |
| Theme swap doesn't re-paint | The board was themed from a plain `<style>` block instead of a fenced DESIGN.md — the runtime's inline `--vc-*` tokens on `<html>` win on specificity. Use a fenced `<script type="text/design-md">` + `amvcp-designmd.js`. |
| A ticket lands in the wrong column on load | Stale `localStorage` placement — clear `amvcp-editor-kanban:<id>` or change the `data-ve-id`. Saved placement wins over the model `column`. |
| The export entry is missing from `veSelection` | `amvcp-runtime.js` wasn't loaded before the board booted, so `window.veSelection` didn't exist when `init()` ran. |
| A drag selected the board (spurious selection) | Should not happen — the engine suppresses exactly one trailing click via a window-capture listener. If it does, another module removed that listener or the runtime load order is wrong. |

## Examples

```
Input:  "Make a triage board for these six tickets so I can drag them into Now/Next/Later/Cut and hand you back the ordering."
Output: <div class="ve-editor-kanban" data-ve-id="triage:sprint-19">
          <script type="application/json">{
            "label":"Sprint 19 triage",
            "tickets":[
              {"key":"auth","title":"Fix auth redirect loop","column":"now","meta":"P0 · #412"},
              {"key":"cache","title":"Add response cache","column":"next","meta":"P1 · #420"}
            ]}</script>
        </div>
        // default columns Now/Next/Later/Cut; user drags; submit returns
        // a kanban-export entry whose data.markdown is the ordering.

Input:  "Triage these into three buckets: Ship / Soon / Backlog."
Output: columns:[{"key":"ship","label":"Ship"},{"key":"soon","label":"Soon"},
        {"key":"backlog","label":"Backlog"}]; tickets each with a starting
        column. The exported markdown has one `## Heading` per bucket in
        left-to-right priority order.

Input:  "I dragged everything — give me the result."
Output: (the user clicks Submit) → the agent receives one selection entry
        type:"kanban-export"; act on entry.data.markdown.
```

## Modes

This skill supports `data-ve-mode="readonly"` only — the board is itself the editor (drag-to-reprioritize), so the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply. The "edit" facet is the drag + the runtime's select→comment→re-emit channel; the "export" facet is the `kanban-export` selection entry.

## Composability

Composes with `amvcp-design-tokens` (the source DESIGN.md / preset that themes the board), `amvcp-form-inputs` (the sibling rank-list / tier-list, same shared pointer-sortable pattern for a single-list reorder), and `amvcp-modal-comments` (the comment-thread layer the runtime mounts on the selected board). Like every element it nests via HTML/SVG `<foreignObject>` / overlays alongside other elements with no rigid container. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [editor-kanban-markup.md](./references/editor-kanban-markup.md) — the input schema, the `data-ve-*` atom contract, the EXPORT wire-format, the pointer-drag model, and the no-new-elements rule.
  > API · Markup contract · Ticket + column schema · The export contract (rides the selection channel) · Pointer-drag (mouse + touch + pen) · No-new-elements · DESIGN.md theming · No nested scrollbars · Self-contained output
