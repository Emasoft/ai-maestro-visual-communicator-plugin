---
name: amvcp-concept-demo
description: "Concept explainer as a LIVE manipulable demo — parameter sliders driving an inline-SVG visual (bars/dial/curve) that re-paints instantly, paired with a live values table and a glossary. The interactive sibling of a written explainer: prose tells, this lets the reader turn the knobs and watch the mapping respond. The demo container is a runtime selection atom (selection / highlight / triple-state / comment from the runtime, never reinvented); graphic style is fully DESIGN.md-driven, light + dark both; the current parameter set exports onto the existing selection wire. Use for an interactive concept demo, a manipulable explainer, a 'play with the parameters' widget, or an interactive figure that teaches a relationship. Trigger with 'interactive concept demo', 'manipulable explainer', 'live demo widget', 'let me tune the parameters', 'show how X changes with Y', 'interactive figure'."
license: MIT
metadata:
  author: Emasoft
---

# Concept Demo — the manipulable explainer

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the category skills. **Sibling (static) explainer:** [amvcp-prose-pages](../amvcp-prose-pages/SKILL.md) — long-form written documents; this is its *interactive* counterpart. **Selection wire-format contract:** [`references/interactive-selection-base.md`](../../references/interactive-selection-base.md).

## Overview

THE THING: "a concept, explained by a LIVE manipulable demo." A small set of parameter sliders drives an inline-SVG visual that re-paints **instantly** as the reader drags; a live values table mirrors every parameter, and a glossary names the terms. Where `amvcp-prose-pages` explains a concept in words, this skill explains it by letting the reader *turn the knobs and watch the mapping respond* — the two are siblings (a report can embed a concept-demo as one of its figures).

The renderer is **spec-driven and generic**: you describe the concept (title, the parameters, a human-readable mapping description, a visual kind, a glossary); the module draws the visual once and only re-sets numeric attributes on interaction. The visual is deliberately concept-agnostic — `bars` (one per param), `dial` (first param as a gauge), or `curve` (first param drives a generic power curve, second its amplitude). It carries no concept-specific assumptions, so the same module serves compound-interest, easing-curves, signal-gain, or any "X as a function of these knobs" explainer.

Two modes, kept strictly separate (project CLAUDE.md):

1. **Interaction Design Mode = FIXED.** The demo container is a selection **atom** stamped `data-ve-id="concept-demo:<id>"` + `data-ve-type="concept-demo"`. The runtime (`amvcp-runtime.js`) supplies selection · highlight · triple-state feedback · the comment round-trip with zero code in this module. It adds NO custom selection, NO foreign drag/highlight/export UX. "Editable" = the sliders (explicit) **or** the runtime's select→comment→re-emit channel ("change the selected demo this way: …"). "Exportable" = the current parameter set is pushed onto the **existing** `window.veSelection` wire (see Output).
2. **Graphic Style Mode = VARIABLE via DESIGN.md.** The visual, sliders, table and glossary are themed entirely from `--vc-*` tokens (with warm fallbacks) — light + dark both, no hardcoded palette. The SVG visual is drawn with token references via an injected scoped stylesheet, so a `data-ve-theme` flip / hot-swap **re-paints it with no JS re-render**.

**THE NO-NEW-ELEMENTS RULE (user contract):** moving a slider mutates the EXISTING SVG geometry and the EXISTING table cells in place. It NEVER inserts, clones, or removes a DOM node on interaction — the node count after a slider move equals the node count before it.

## Prerequisites

- `amvcp-designmd.js` colocated with the HTML — parses the embedded DESIGN.md, exposes `parseDesignMd` / `resolveTokens` / `applyTokens`.
- `amvcp-runtime.js` — boots the engine, applies the embedded DESIGN.md, and installs the FIXED interaction layer that styles every `[data-ve-id]` atom (selection · hover · triple-state · comment handle) and owns `window.veSelection`. The demo MUST be loaded with the runtime; it is what makes the container commentable and what carries the export.
- `amvcp-concept-demo.js` — the renderer (`renderConceptDemo`, `mountConceptDemo`, `scanAndRender`, `parseSpec`). It injects its own scoped, `--vc-*`-themed stylesheet (`#vc-concept-demo-style`) once — graphic-style chrome only, NO selection/hover CSS.

Load order is always engine → runtime → concept-demo.

## Instructions

1. **Author the spec** — a JSON object: `{ title, mapping, visual, params:[{key,label,min,max,step,default,unit}], glossary:[{term,def}] }`. `params` is required and non-empty; each param needs a string `key` and numeric `min < max`. `visual` is `"bars"` (default), `"dial"`, or `"curve"`. The renderer is fail-fast — a malformed spec throws from `parseSpec` (or, in the declarative path, stamps `data-vc-concept-error` and logs).
2. **Either declare it** — drop a `<div data-vc-concept-demo>` with an inline `<script type="application/json" class="vc-concept-spec">…</script>`; the module auto-renders it on `DOMContentLoaded` via `scanAndRender`. **Or mount it explicitly** — `amvcpConceptDemo.mountConceptDemo(spec, containerEl, { id })`.
3. **The reader manipulates** — each param gets a range slider; dragging it re-paints the SVG visual and the live values table in place and updates the export entry. The values table shows each param's current value and its range so the reader can read the mapping numerically alongside the visual.
4. **Selection + comment come from the runtime** — a plain click on the demo selects it for comment; the comment handle and triple-state feedback are the runtime's. Do NOT add per-skill selection.
5. **Composition** — embed a concept-demo inside a prose-pages document as one figure, or nest it via `<foreignObject>` next to other elements; it owns its own `data-vc-*` markup and `--vc-*` theming and assumes nothing about its neighbours.

## Output

A `<div class="vc-cd" data-ve-id="concept-demo:<id>" data-ve-type="concept-demo">` containing: a title + mapping description, the inline-SVG **stage**, a `.vc-cd-controls` block of range sliders (one per param), a `.vc-cd-table` of live values, and a `.vc-cd-glossary`. Both themes theme correctly. No nested scrollbars — the page is the only scroller (`overflow:visible` on the stage and table).

**Export contract (rides the existing selection wire — one source of truth):** on initial render and on every slider move, the module pushes / **replaces** a single deduped entry in `window.veSelection`:

```json
{ "kind": "element",
  "entryId": "concept-demo:<id>",
  "id": "concept-demo:<id>",
  "type": "concept-demo",
  "label": "<spec.title>",
  "data": { "kind": "concept-demo", "demoId": "<id>", "params": { "<key>": <value>, … } } }
```

Because it is a `kind:"element"` entry, the standard Submit/Exit flow and the agent's "you selected N items" follow-up handle it with **no special casing** (`references/interactive-selection-base.md` §"The selection payload"). The agent reads `data.params` to know exactly what the reader tuned, and can act on it ("re-emit the demo with these params baked as the new defaults", "explain why the curve looks like that at k=…"). The export NEVER opens a private channel — it reuses the wire every other element uses.

## Error Handling

| Symptom | Fix |
|---|---|
| `parseSpec` throws "spec is not valid JSON" | The fenced/`#ve-concept-spec` block is malformed JSON — fix the source. Engine renders nothing (fail-fast). |
| `parseSpec` throws "params must be a non-empty array" | The spec has no `params` — every concept-demo needs at least one knob. |
| `parseSpec` throws "param … needs numeric min < max" | A param is missing numeric `min`/`max`, or `max <= min` — fix the param. |
| The declarative host shows nothing, has `data-vc-concept-error` | Its inline spec failed to parse — read the attribute's message and fix the spec. |
| The demo doesn't highlight / select / show a comment handle | The runtime (`amvcp-runtime.js`) isn't loaded, or loaded before the engine. Load order is engine → runtime → concept-demo. |
| The SVG visual doesn't change colour on a theme flip | The page overrode a `.vc-cd-svg .vc-cd-*` rule with a literal hex instead of a `--vc-*` token — the whole point of Graphic Style Mode is token references; remove the override. |
| Export entry isn't in `window.veSelection` | The runtime isn't present (e.g. a Node-only context). The renderer is a soft no-op for export when `window.veSelection` is absent — load the runtime in the browser. |
| A slider value appears beyond its range | Should never happen — the module clamps every input to `[min, max]`. If it does, the spec's `min`/`max`/`step` are inconsistent; fix the spec. |

## Examples

```
Input:  "Make an interactive demo of how compound interest grows."
Output: const spec = {
          title: 'Compound interest',
          mapping: 'Balance after each period as the rate compounds.',
          visual: 'bars',
          params: [
            { key:'p0', label:'Period 1', min:0, max:100, step:1, default:20 },
            { key:'p1', label:'Period 2', min:0, max:100, step:1, default:45 },
            { key:'p2', label:'Period 3', min:0, max:100, step:1, default:80 }
          ],
          glossary: [{ term:'Rate', def:'The per-period growth fraction.' }]
        };
        amvcpConceptDemo.mountConceptDemo(spec, document.querySelector('#demo'));

Input:  "Let me play with an easing curve's steepness."
Output: visual:'curve' with two params (steepness, amplitude). Dragging
        steepness re-shapes the power curve in place; the export entry's
        data.params carries {steepness, amplitude} for the agent.

Input:  "An interactive gauge for a single tuning knob."
Output: visual:'dial' — the first param renders as a semicircular gauge
        whose arc + needle move live; the readout shows the value+unit.
```

## Modes

This skill supports `data-ve-mode="readonly"` only. The demo container is a review/comment atom (select-for-comment) AND an explicit slider editor; the per-element 3-state decision pill (R20–R23 of `amvcp-self-debug-rules`) does NOT apply — there is no accept/reject verdict on a demo, only the tuned parameters it exports.

## Composability

Composes with `amvcp-prose-pages` (embed a concept-demo as one interactive figure inside a written explainer — the sibling category), `amvcp-design-tokens` (the source DESIGN.md / preset that themes the demo), `amvcp-animation` / `amvcp-anim-sandbox` (a concept-demo's `curve` visual can illustrate a timing function the animation skills then apply), and `amvcp-modal-comments` (the comment-thread layer the runtime mounts on the selected demo). The only exclusive skill is the overlay-runtime. Nest it via `<foreignObject>` / overlays next to graphs, charts, or tables — it assumes nothing about its neighbours (project CLAUDE.md §5 composability).
