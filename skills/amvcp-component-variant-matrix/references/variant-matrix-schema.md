# Component variant-matrix schema

## Table of Contents

- [API](#api)
- [Schema shape](#schema-shape)
- [Axes and bands](#axes-and-bands)
- [The atom contract](#the-atom-contract)
- [Grid layout](#grid-layout)
- [Theme handling](#theme-handling)
- [No nested scrollbars](#no-nested-scrollbars)
- [Self-contained output](#self-contained-output)

The component variant matrix shows every size · state · intent of ONE UI
component on a single sheet for review. It is **schema-driven** — you
describe the component, its axes, and its variants, and the renderer lays
them out. Each variant cell is a runtime selection atom.

## API

```
amvcpComponentVariants.renderVariantMatrix(schema, designmd, opts) -> HTMLElement
amvcpComponentVariants.mountVariantMatrix(schema, designmd, container, opts)
```

`designmd` is a PARSED DESIGN.md — `amvcpDesignMd.parseDesignMd(text)
.designmd` — used only by the Theme toggle's standalone fallback; the
matrix itself is themed by the live `--vc-*` tokens the runtime applies.
`opts.sample` supplies default sample-body fields shared by every cell.

## Schema shape

```js
{
  component: "Card",            // the component name (string)
  description: "…",             // optional sub-line under the title
  axes: {                       // 1-3 axes; declaration order matters —
    state:  ["default", "hover", "disabled"],   // axes[0] = the PRIMARY
    intent: ["neutral", "accent", "danger"]     // axis (becomes bands)
  },
  render: {
    variants: [                 // the EXPANDED list of cells (the
      {                         // renderer does NOT multiply axes itself)
        key:   "default-flat",  // unique within the schema (→ atom id)
        label: "Flat",          // the variant-label pill text
        kind:  "flat",          // a built-in treatment name, OR …
        treatment: { … },       // … an explicit treatment object (see
                                //   variant-cell-rendering.md)
        axisValues: { state: "default" },  // where the cell sits per axis
        note:    "best for: …",            // the "best for" line
        snippet: "<Card variant=\"flat\" />",  // the click-to-copy export
        sample:  { title:"…", chips:["A","B"] }  // optional per-cell body
      }
    ]
  }
}
```

Only `component` and `render.variants` (a non-empty array) are required;
`renderVariantMatrix` throws fast if they're missing. `axes` is optional —
with no axes, all variants flow in one grid.

## Axes and bands

The matrix supports **1-3 axes**. The renderer groups cells by the
**primary axis** (`axes[0]`): one labelled band (`.vc-cvm-axis-band`) per
value, in declared order, each followed by a responsive grid of the cells
whose `axisValues[primary]` matches. The remaining axes are conveyed
per-cell (via the variant label, sample, or treatment) — the renderer
does not nest a second grid axis, which keeps the sheet readable. A
variant whose primary-axis value isn't declared still renders, in a
trailing `(ungrouped)` band (fail-soft on schema drift). The header shows
an **axis legend** — one chip per axis listing its values.

## The atom contract

Every cell is a selection atom, mirroring `amvcp-token-sheet.js`'s
color-swatch stamp:

```html
<div class="vc-cvm-cell"
     data-ve-id="component-variant:Card:default-flat"
     data-ve-type="component-variant"
     data-ve-label="Card · Flat"> … </div>
```

- `data-ve-id` — `component-variant:<component>:<variant.key>` — the
  opaque id the agent receives back when the user selects the cell.
- `data-ve-type` — always `component-variant`.
- `data-ve-label` — a human label for the comment thread.

These three stamps are all the runtime needs to layer selection,
highlight, triple-state feedback, and the comment handle. This module
adds NOTHING else for interaction.

## Grid layout

Within a band, cells flow in a CSS grid:
`grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`. It WRAPS
from N columns down to 1 as the viewport narrows — no media queries, no
inner scrollbar. The grid is `align-items:start` so cells of different
heights top-align for easy scanning.

## Theme handling

The matrix is styled entirely with `--vc-*` tokens (the injected
`#vc-cvm-style` sheet uses token references with literal fallbacks), so it
re-themes when the page's DESIGN.md hot-swaps. The header's Theme button
calls `window.__veDesignMd.toggleTheme()` (or, standalone, re-resolves +
re-applies via the engine) — the whole matrix flips light/dark.

## No nested scrollbars

The grid wraps; nothing has `max-height + overflow:auto`; the only
`overflow:hidden` is on the instance card (to clip its accent stripe).
Wide content extends the document's single scroll axis — never an inner
scroller (the no-nested-scrollbars rule).

## Self-contained output

The emitted page embeds the DESIGN.md as `<script type="text/design-md">`
and colocates `amvcp-designmd.js`, `amvcp-runtime.js`,
`amvcp-component-variants.js`. Zero CDN, zero web font unless the
DESIGN.md's font stack names one. One file, opens offline.
