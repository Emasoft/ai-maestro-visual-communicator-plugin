---
name: amvcp-editor-template
description: "Prompt/template tuner — an editable template with {{variable}} slots, a per-variable input panel, and a LIVE re-rendered preview of the filled result that updates as you type. Slots are highlighted by re-painting their own span (no injected overlay). Export rides the existing runtime selection channel: it pushes one kind:\"element\" entry into window.veSelection carrying {template, values, rendered}. Graphic style is fully DESIGN.md-driven (--vc-* tokens), light + dark both. Use when tuning a prompt, filling a template, building a prompt tuner, or showing an editable template with variable slots. Trigger with 'prompt tuner', 'template tuner', 'editable template', 'fill in the template', 'prompt template editor', 'variable slots'."
license: MIT
metadata:
  author: Emasoft
---

# Prompt / Template Tuner

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Selection contract:** [`references/interactive-selection-base.md`](../../references/interactive-selection-base.md). **Design vocabulary:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md).

## Overview

THE THING: "an editable prompt/template with `{{variable}}` slots, the inputs to fill those slots, and a live re-render of the filled result." It is the prompt-tuner custom-editing interface — manipulate the template values in the UI, watch the filled preview update live, then **export** the final `{template, values, rendered}` back to the agent.

Two modes, kept strictly separate (project CLAUDE.md):

1. **Interaction Design Mode = FIXED.** The "edit" facet is the per-variable inputs + the live preview. **Export rides the existing runtime selection channel** — pressing *Export to agent* pushes ONE `kind:"element"` entry into `window.veSelection` (the same array a click toggles), so the agent reads the result through the one selection round-trip it already understands. NO foreign selection / drag / export UX is introduced. Inputs carry `data-ve-overlay="1"` so caret clicks never toggle atom-selection (mirrors how `amvcp-interactive.js` exempts card-note textareas).
2. **Graphic Style Mode = VARIABLE via DESIGN.md.** Every color / radius / font reads a `--vc-*` token via `var(--vc-*, fallback)`; both light + dark themes are correct by construction. A theme swap / hot-swap re-themes live.

The **NO-NEW-ELEMENTS highlight rule** holds: each slot in the preview is a real `<span class="ve-tpl-slot">` in the rendered output; highlighting is a class re-paint of that span — never an injected overlay, ring, or frame.

## Prerequisites

- `amvcp-runtime.js` colocated with the HTML — installs `window.veSelection`, `window.veToggle`, and the FIXED interaction layer the export rides.
- `amvcp-editor-template.js` — the tuner (`window.amvcpEditorTemplate`). It injects its own scoped, `--vc-*`-themed stylesheet (`#vc-editor-template-styles`) once and self-inits every `.ve-editor-template` on `DOMContentLoaded` (no glue code needed).
- Optional `amvcp-designmd.js` — when you ship a DESIGN.md the runtime applies its tokens; otherwise the `var(--vc-*, fallback)` defaults render a usable warm palette.

## Instructions

1. **Drop the declarative markup** — a `<div class="ve-editor-template" data-ve-id="…">` containing a single `<script type="application/json">` model. `data-ve-id` is required (it is also the export entry's `id`).
2. **Author the model** — `{ template, variables }`:
   - `template` (required) — a string with `{{key}}` slots. Whitespace inside the braces is tolerated. A slot whose key is not declared renders the literal `{{key}}` in the preview (fail-visible — flagged with `data-ve-tpl-missing="1"`), never silently dropped.
   - `variables` (required, ≥1) — `[{ key, label?, default?, type?, options? }]`. `type` ∈ `text` (default) · `textarea` · `select`. A `select` variable requires `options[]`.
3. **The module renders** a two-column grid: the variable input panel (left) and the live preview + *Export to agent* button (right). The preview fills in immediately from the defaults.
4. **Live re-render** — every keystroke (`input`) / `change` re-renders the preview, debounced 120 ms. Each filled slot is its own `.ve-tpl-slot` span.
5. **Export** — *Export to agent* calls `exportSelection(el)`, which pushes/replaces one `kind:"element"` entry in `window.veSelection`. Re-exporting after edits replaces the same entry (idempotent by `entryId`), so the agent's submit payload always carries the latest `{template, values, rendered}`.

## The export contract

The entry pushed into `window.veSelection` (and therefore into the page's submit payload — see the selection-base reference) is:

```json
{
  "kind": "element",
  "id": "ve-tpl-summary",
  "type": "editor-template",
  "label": "Template: Write a formal summary of …",
  "data": {
    "template": "Write a {{tone}} summary of {{topic}} in {{count}} words.",
    "values": { "tone": "formal", "topic": "the report", "count": "200" },
    "rendered": "Write a formal summary of the report in 200 words."
  }
}
```

`data.rendered` always equals `renderTemplate(data.template, data.values)` and matches the preview text verbatim — so the agent can act on the filled prompt directly, or re-fill the template with different values. The agent's follow-up (per the selection base) treats it as a `kind:"element"` selection: "You exported the filled template **«label»** — use it / tweak which variable?".

## Output

A `<div class="ve-editor-template" data-ve-type="editor-template">` containing the variable input panel and the live preview + export button. Both themes theme correctly. No nested scrollbars — the preview wraps (`white-space:pre-wrap; overflow-wrap:anywhere`) and the page extends per the no-nested-scrollbars rule.

## Error Handling

| Symptom | Fix |
|---|---|
| `[editor-template error] missing data-ve-id attribute` | Add `data-ve-id` to the `.ve-editor-template` — it is the export entry's `id`. |
| `[editor-template error] missing <script type="application/json"> model` | Add the JSON model block as a direct child of the editor div. |
| `[editor-template error] malformed JSON: …` | Fix the JSON model (trailing comma, unquoted key, …). Engine renders nothing for that editor (fail-fast). |
| `model.template must be a non-empty string` | Provide a `template` string with `{{slots}}`. |
| `model.variables must be a non-empty array` | Declare at least one variable. |
| `select variable "X" needs options[]` | A `type:"select"` variable requires a non-empty `options` array. |
| A slot shows the literal `{{key}}` (caution-tinted) | The template references a key not declared in `variables[]` — add the variable or fix the slot name. Intentional fail-visible behavior, not a crash. |
| Export does nothing / count doesn't change | `amvcp-runtime.js` isn't loaded (no `window.veSelection` / `window.veToggle`). Load the runtime before this module. |
| A token color looks wrong on theme flip | A literal color leaked in instead of a `--vc-*` token — replace with a token reference (the point of Graphic Style Mode). |

## Examples

```
Input:  "Build a prompt tuner for a summary prompt with tone, topic, and word count."
Output: <div class="ve-editor-template" data-ve-id="ve-tpl-summary">
          <script type="application/json">
          { "template": "Write a {{tone}} summary of {{topic}} in {{count}} words.",
            "variables": [
              { "key": "tone",  "label": "Tone",       "default": "concise" },
              { "key": "topic", "label": "Topic",      "default": "the report" },
              { "key": "count", "label": "Word count", "default": "120",
                "type": "select", "options": ["80","120","200"] } ] }
          </script>
        </div>
        (runtime + amvcp-editor-template.js loaded; the user fills the slots,
         watches the live preview, clicks Export → the agent reads the
         {template,values,rendered} from the selection payload.)

Input:  "Let me tweak a system prompt template with a long instructions field."
Output: a variable with "type":"textarea" for the multi-line instructions
        block; every keystroke re-renders the preview.
```

## Modes

This skill supports `data-ve-mode="readonly"` (the default). The editor's "edit" facet is its own inputs + the export-to-selection channel — NOT the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`), which does not apply. The export IS the re-emit step of the FIXED select → edit → re-emit model.

## Composability

Composes with `amvcp-design-tokens` (the DESIGN.md / preset that themes it), `amvcp-prose-pages` / `amvcp-slide-decks` (drop a tuner into a report or a slide), and `amvcp-modal-comments` (comment on the exported result). It is a simple HTML primitive: nest it via `<foreignObject>` or alongside any other element; the single runtime scan inits it. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [`references/interactive-selection-base.md`](../../references/interactive-selection-base.md) — the selection-wire-format contract the export rides (the `selections[]` payload, the agent's follow-up by `kind`). Complete TOC:
  - Interactive Selection — Base Contract
    - Table of contents
    - How it works & Page Setup
      - How it works (one paragraph)
      - Page CSS contract (multi-select)
      - Mandatory boilerplate
    - The selection payload
      - Phase 2 — multi-click text selection inside `[data-ve-prose]`
        - Phase 3 — block-level depths 4-7 (paragraph / section / chapter / all)
        - Phase 3 — math grammar (sub-formula depths 1-3 inside `.ve-math`)
        - Phase 3 — code grammar (token / line / block depths 1-3 inside `<pre>`)
        - Phase 4 — drag text selection toggles entries (the only deselect path)
        - Phase 5 — table row/column handles
        - Phase 6 — code line-number gutter
        - Phase 7 — touch / mobile compatibility
        - Interactive agent reports — `kind:"finding-reply"` (TRDD-eff1aa87)
        - Interactive agent reports v2 — modal comment threads
      - Required follow-up
    - Selectable Elements
      - What to make selectable
      - Marking elements
    - Engine routing — read this BEFORE generating a graph
    - Runtime & Process Caveats
      - Runner-process pitfalls (Chrome `--app=URL` mode)
      - Anti-patterns (selection-system author errors)
      - Inlining the runtime (single-file portability)
      - Future extensions (not yet implemented)
- [`scripts/amvcp-editor-template.js`](../../scripts/amvcp-editor-template.js) — the tuner module. Public API: `init`, `initEditor`, `readModel`, `renderTemplate`, `slotKeys`, `exportSelection`, `injectStyles`.
