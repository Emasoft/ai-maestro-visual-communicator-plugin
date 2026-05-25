---
name: amvcp-component-variant-matrix
description: "Component variant-matrix renderer — a self-contained, DESIGN.md-themed sheet showing every size · state · intent of ONE UI component, laid out for review. Each variant cell is a runtime selection atom (selection / highlight / triple-state feedback / comment come from the runtime, never reinvented); graphic style is fully DESIGN.md-driven, light + dark both; per-cell click-to-copy snippet for export. Use when showing a component's variants, comparing component states, or building a variant matrix. Trigger with 'component variants', 'component states', 'variant matrix', 'show every state of this button', 'every size/state/intent of this card'."
license: MIT
metadata:
  author: Emasoft
---

# Component Variant Matrix

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling sheet skill:** [amvcp-tokens-contact-sheet](../amvcp-tokens-contact-sheet/SKILL.md) (sheets design *tokens*; this sheets a *component's* variants). **Design vocabulary:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md).

## Overview

THE THING: "every size · state · intent of **one UI component**, laid out on a single sheet for review." Distinct from the token contact sheet — that visualizes design *tokens*; this visualizes a *component's* variants. The renderer is schema-driven: you describe the component, its 1-3 axes, and its variants; it lays them out in a responsive grid (one band per primary-axis value) where each cell draws one component instance with one variant's treatment.

Two modes, kept strictly separate (project CLAUDE.md):

1. **Interaction Design Mode = FIXED.** Each variant cell is a selection **atom** stamped `data-ve-id="component-variant:<component>:<axisvalues>"` + `data-ve-type="component-variant"`. The runtime (`amvcp-runtime.js`) supplies selection · highlight · triple-state feedback · comment-box with zero code in this module. It adds NO custom drag, NO custom selection, NO foreign highlight, NO foreign export UX. "Editable" = the runtime's select→comment round-trip ("change the selected variant this way: …"). "Exportable" = per-cell click-to-copy snippet + the runtime selection payload.
2. **Graphic Style Mode = VARIABLE via DESIGN.md.** The grid, cell chrome, variant treatments, axis bands, and legend are themed entirely from `--vc-*` tokens — light + dark both, no hardcoded palette. A theme swap / hot-swap re-themes live.

## Prerequisites

- `amvcp-designmd.js` colocated with the HTML — parses the DESIGN.md, exposes `parseDesignMd` / `resolveTokens` / `applyTokens`.
- `amvcp-runtime.js` — boots the engine, applies the embedded DESIGN.md, and installs the FIXED interaction layer that styles every `[data-ve-id]` atom (selection · hover · triple-state · comment handle). The matrix MUST be loaded with the runtime; it is what makes the cells commentable.
- `amvcp-component-variants.js` — the matrix renderer (`renderVariantMatrix`, `mountVariantMatrix`). It injects its own scoped, `--vc-*`-themed stylesheet (`#vc-cvm-style`) once — graphic-style chrome only, NO selection/hover CSS.

## Instructions

1. **Parse the DESIGN.md** — `const parsed = amvcpDesignMd.parseDesignMd(text)`. A `parsed.ok === false` means the source is malformed; surface `parsed.errors`, fix the source, never render half-broken.
2. **Author the schema** — `{ component, axes:{…}, render:{ variants:[…] } }`. See [variant-matrix-schema](./references/variant-matrix-schema.md) for the full shape, the atom contract, and the grid layout.
3. **Mount the matrix** — `amvcpComponentVariants.mountVariantMatrix(schema, parsed.designmd, containerEl, opts)`. The renderer emits one `<section data-vc-panel="component-variants">` with a header (title + axis legend + Theme toggle) and one axis band per primary-axis value.
4. **Each cell renders a component instance** — fixed sample content (avatar + title + meta chips + a ghost button) so the eye compares *treatments*, not content; the treatment is token-driven (flat / outlined / elevated / accent / inset / danger, or a custom `treatment` object). See [variant-cell-rendering](./references/variant-cell-rendering.md).
5. **Axes lay out the matrix** — 1-3 axes; the first axis becomes labelled section bands, the rest are conveyed per-cell (e.g. size × state grid, intent as sections). Responsive, no nested scrollbars. See [axis-layout](./references/axis-layout.md).
6. **Selection + comment come from the runtime** — a plain click on a cell selects it for comment; the comment handle and triple-state feedback are the runtime's. Do NOT add per-skill selection. See [selection-and-comment](./references/selection-and-comment.md).
7. **Click-to-copy on every cell** — the small `copy` button carries `data-vc-copy="<snippet>"`. An **Alt/Option-click (or Meta-click)** copies the snippet; a plain click is passed through to the runtime selection handler. The copy uses `navigator.clipboard.writeText` with a fail-soft fallback (the ONE deliberate fail-soft path, mirroring the token sheet).

## Output

A `<main class="vc-cvm" data-vc-cvm="1">` containing a header strip (component title + axis legend + Theme toggle) and a `<section data-vc-panel="component-variants">` of axis bands, each followed by a responsive grid of cells. Every cell is a `data-ve-id` / `data-ve-type` atom with a click-to-copy snippet button. Both themes theme correctly. No nested scrollbars — the grid wraps and the page extends per the no-nested-scrollbars rule.

## Error Handling

| Symptom | Fix |
|---|---|
| `parsed.ok === false` | DESIGN.md malformed — surface `parsed.errors` and fix source. Engine renders nothing (fail-fast). |
| `renderVariantMatrix` throws "schema must be …" | The schema is missing `render.variants` (must be an array). Fix the schema shape. |
| A cell shows the default `outlined` look unexpectedly | The variant's `kind` / `treatment` name isn't a built-in and no `treatment` object was given — name a built-in or pass an explicit treatment. |
| Cells don't highlight / select / show a comment handle | The runtime (`amvcp-runtime.js`) isn't loaded, or loaded before the engine. Load order is engine → runtime → component-variants. |
| A treatment color looks wrong on theme swap | The treatment used a literal color instead of a `--vc-*` token — replace it with a token reference (the whole point of Graphic Style Mode). |
| Copy button silently does nothing | Browser lacks `navigator.clipboard` (HTTP context) — fail-soft is intentional; the snippet is still readable. NOT an error. |
| An axis band is missing | No variant declares that primary-axis value in `axisValues` — add the value or remove it from `axes`. |

## Examples

```
Input:  "Show every state of the primary button."
Output: const parsed = amvcpDesignMd.parseDesignMd(designmdText);
        const schema = {
          component: 'Button',
          axes: { state: ['default','hover','disabled'] },
          render: { variants: [
            { key:'default', label:'Default', kind:'elevated',
              axisValues:{state:'default'}, snippet:'<Button />' },
            { key:'disabled', label:'Disabled', kind:'flat',
              axisValues:{state:'disabled'}, snippet:'<Button disabled />' }
          ]}
        };
        amvcpComponentVariants.mountVariantMatrix(
          schema, parsed.designmd, document.querySelector('#m'));

Input:  "Lay out the Card's six structural treatments for review."
Output: one variant per treatment (flat / outlined / elevated / accent /
        inset / danger), no axes → a single responsive grid. Each cell
        is a runtime atom; Alt-click the copy button to grab the snippet.

Input:  "Size × state matrix for the Input component."
Output: axes:{ size:['sm','md','lg'], state:['default','focus','error'] };
        size is the primary axis (becomes bands), state is conveyed per
        cell. The variants list is the expanded product you supply.
```

## Modes

This skill supports `data-ve-mode="readonly"` only. Variant cells are review atoms (select-for-comment), NOT decision atoms; the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply. The "edit" facet is the runtime's select→comment→re-emit channel, not an inline editor.

## Composability

Composes with `amvcp-design-tokens` (the source DESIGN.md / preset that themes the matrix), `amvcp-tokens-contact-sheet` (the sibling sheet for *tokens* rather than *component variants*), and `amvcp-modal-comments` (the comment-thread layer the runtime mounts on selected cells). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [variant-matrix-schema.md](./references/variant-matrix-schema.md) — the input schema, the `data-ve-*` atom contract, the matrix grid layout.
  > API · Schema shape · Axes and bands · The atom contract · Grid layout · Theme handling · No nested scrollbars · Self-contained output
- [variant-cell-rendering.md](./references/variant-cell-rendering.md) — how one cell renders a component instance, themed from DESIGN.md tokens, with the click-to-copy snippet affordance.
  > What it does · The built-in treatments · Why fixed sample content · Custom treatments · The click-to-copy snippet · DESIGN.md tokens used · Selection / comment contract · Visual verification
- [axis-layout.md](./references/axis-layout.md) — laying out 1-3 axes, responsive, no nested scrollbars.
  > What it does · One axis · Two axes · Three axes · Why the page expands (no nested scrollbars) · The responsive grid · DESIGN.md tokens used · Visual verification
- [selection-and-comment.md](./references/selection-and-comment.md) — how cells become commentable atoms via the runtime (reuse, don't reinvent) — the fixed Interaction Mode.
  > What it does · The FIXED Interaction Mode · The atom contract · Plain click vs Alt-click · The comment round-trip = "editable" · Export = snippet + selection payload · What this module must NEVER add · Visual verification
