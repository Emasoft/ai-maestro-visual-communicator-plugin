---
name: amvcp-icon-svg
description: "Author themed inline SVG icons, logos, device frames, shapes, and image hotspots from a JSON scene-graph. 1000x1000 coordinate space, hairline strokes, DESIGN.md tokens, click-to-select atoms. Use when the user asks for an icon, logo mark, device mockup, hotspot, or geometric shape. Trigger with 'icon', 'logo', 'svg icon', 'device frame', 'iphone mockup', 'browser mockup', 'hotspot', 'annotated image', 'scene graph svg', 'cloud icon', 'hexagon'."
license: MIT
compatibility: "Browser (inline SVG + CSS custom properties + color-mix). Node 18+ for the pure helpers (buildSceneSvg, lintSvg, snap). No build step, no XML parser, no fontkit, no Playwright."
metadata:
  author: Emasoft
---

# Icon-SVG

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads when the user asks for an authored asset: an icon, a logo, a
device mockup, a decorative shape, or an annotated image with
hotspots. The module is `scripts/amvcp-icon-svg.js`. Four
sub-techniques in one self-contained, dependency-free runtime:

1. **Authored SVG primitive engine** — a declarative JSON scene-graph
   compiled to a themed `<svg>` via `buildSceneSvg()`. Five
   structural node primitives (process / database / decision /
   external / network), six logo composition blocks, six decorative
   `shape` primitives. One canonical `viewBox="0 0 1000 1000"`
   coordinate space; every coordinate snapped to a 4-unit grid; a
   `<defs><use>` reuse pass when a node type repeats more than twice.
2. **Device frames** — `deviceFrame({kind, title, url, time, content})`
   builds plain DOM + CSS mockup wrappers for ios, android, mac, and
   browser.
3. **Image hotspot annotation** — `.isvg-hotspot` markers positioned
   with inline `--x` / `--y` 0..1 fractions; every hotspot is a
   `data-ve-id` selectable atom.
4. **SVG style contract** — `lintSvg()` is the C1..C7 checker
   (hairline / radius / 4-unit-grid / ≤4 colors / no shadow / no
   raw hex / no mixed theming) enforced on every emitted SVG.

## Prerequisites

- The DESIGN.md token engine (`amvcp-designmd.js`) supplies the
  `--vc-color-*` / `--vc-font-*` / `--vc-radius-*` / `--vc-shadow-*`
  tokens. Icon-svg is fully defensive — every token has a baked
  fallback hex so a token-less page still renders themed.
- `scripts/amvcp-icon-svg.js` ships beside the output HTML. Pure
  ES5-style vanilla JS, no toolchain.
- A modern browser with inline SVG + `color-mix(in oklch, …)`. An
  ancient browser without `color-mix` degrades every tint tier to
  `--vc-color-accent` (still themed, still readable).

## Pick the renderer

```
Need a NODE in a multi-node graph with edges? -> diagram skill
Need a CHART (axis, values, time series)?     -> chart skill
Need a WIREFRAME page layout?                 -> wireframe skill (frames are SHARED)
Need a STANDALONE icon / logo / mark / mockup
  / shape / annotated image?                  -> THIS skill
```

Full routing rules + `diagram` / `chart` / `wireframe` boundary
contracts in [dispatch-decision-tree](references/dispatch-decision-tree.md):

  - The 60-second routing answer
  - The boundary contracts (cross-skill seams)
  - Negative routing — what icon-svg is NOT
  - Choosing a sub-technique inside icon-svg
  - Selection / comment / decision-pill integration
  - When in doubt

## Instructions

1. Pick a primitive family — `node`, `logo`, or `shape`.
2. Emit a scene-graph in a `<script type="application/icon-svg+json">`
   or an ` ```icon-svg ` fenced block:
   `{viewBox: [0,0,1000,1000], ariaLabel, primitives: [...]}`.
   The runtime finds, validates, and replaces it with `<figure><svg>`.
3. Every node accepts an optional `variant` (`success` / `warning` /
   `danger` / `info`) — see [variant-semantic-stroke](references/variant-semantic-stroke.md):
     - The 5 variants
     - The exception — external default
     - How to use
     - Conventional variant choice per node type
     - Fail-fast — unknown variant
     - Why no `accent` variant?
     - Variants vs shapes
     - C4 lint interaction — the semantic-role collapse
     - DESIGN.md tokens consumed
     - Visual verification
4. Every primitive needs an `id` (becomes a `data-ve-id` selection
   atom — see [data-ve-id-selection](references/data-ve-id-selection.md)):
     - The 4 data-ve-* attributes
     - The selection scaffold per primitive
     - The id uniqueness contract
     - The scene `id` synthesis
     - Runtime integration — what the runtime does on click
     - Hotspots are also selection atoms
     - The keyboard comment fallback (Ctrl-+)
     - How to disable selection on an atom
     - Visual verification
5. For a device mockup: `window.amvcpIconSvg.deviceFrame({kind, …})`
   — see `references/device-frame-*.md`.
6. For an annotated image: wrap in `<figure class="isvg-annotated">`
   with `<span class="isvg-hotspot" style="--x: 0.42; --y: 0.31">`
   children — see [hotspot-annotation](references/hotspot-annotation.md):
     - What it renders
     - The `--x` / `--y` contract
     - CSS contract (injected by amvcp-icon-svg.js)
     - Hover state (reduced-motion-aware)
     - Why `<span role="button">` and NOT `<button>`?
     - Selection / comment / decision-mini integration
     - When to use
     - When NOT to use
     - Common authoring patterns
     - DESIGN.md tokens consumed
     - What NOT to do
     - Visual verification
7. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py"
   <file>.html`.

The full JSON schema, every type, every kind, every variant is in
[scene-graph-contract](references/scene-graph-contract.md):

  - The authoring surface
  - SceneGraph schema
  - Primitive — three kinds
  - Validation — fail-fast
  - Auto-fixes (silent — no throw)
  - A worked example — five-node showcase
  - The `<defs><use>` reuse pass
  - The selection / comment / decision-pill scaffold

## Theming + lint

Every fill / stroke is a `var(--vc-color-*, <hex>)` expression. A
theme swap restyles every SVG with zero JS. Details +
no-engine fallback in [theming-tokens](references/theming-tokens.md):

  - The 13 canonical color tokens
  - The 3 derived tint tiers (color-mix off accent)
  - The 2 special non-token values
  - The semantic-role variant ladder
  - Light + dark themes
  - The no-engine fallback contract
  - How tokens flow into the compiled SVG
  - Special token use in non-color attributes
  - What does NOT belong in the palette

The C1..C7 lint contract (auto-fix vs throw, `<mask>` exemption,
semantic-role collapse) is in [lint-c1-to-c7](references/lint-c1-to-c7.md):

  - The 7 constraints
  - Auto-fix vs throw — the boundary
  - The `<mask>` exemption
  - The C4 semantic-role collapse
  - The C7 mixed-theming check
  - The 13-diagram-types NON-clause
  - Return shape
  - Calling lintSvg directly (Node / test harness)
  - Dev-mode lint
  - A worked example — every rule in one bad scene

## Output

Self-contained HTML — CSS injected by `amvcp-icon-svg.js`, no CDN,
no build. The scene SVG is `inline-size: 100%; max-inline-size:
480px` so wide icons center themselves; the page never gets an inner
scrollbar. The ONE sanctioned `overflow: auto` is
`.isvg-frame-content` (a phone screen is a fixed-viewport
application surface — the explicit carve-out in the
no-nested-scrollbars rule).

## Error Handling

- Red error placeholder in the figure → scene JSON is malformed; the
  text carries the precise reason. See
  [error-placeholder](references/error-placeholder.md):
    - What it renders
    - When it appears
    - What triggers the placeholder
    - Why the placeholder uses the danger token
    - Font choice — monospace
    - What the placeholder does NOT do
    - How to recover from a placeholder
    - DESIGN.md tokens consumed
    - Selection / comment / decision-mini
    - Visual verification
    - What if the placeholder ITSELF throws?
- Unknown `kind` / `variant` / `type` → fail-fast throw with the
  valid-options list in the message.
- Hotspot in the wrong place → `--x` / `--y` are 0..1 fractions, not
  percentages or pixels.

## Examples

**Example 1 — authored SVG scene-graph (the `<script type="application/icon-svg+json">` path)**

```html
<script type="application/icon-svg+json" id="pipeline">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Pipeline stages",
  "primitives": [
    { "type": "process",  "id": "in",  "x": 60,  "y": 380,
      "w": 280, "h": 240, "label": "Ingest" },
    { "type": "decision", "id": "v",   "x": 360, "y": 380,
      "w": 280, "h": 240, "label": "Valid?",  "variant": "warning" },
    { "type": "process",  "id": "out", "x": 660, "y": 380,
      "w": 280, "h": 240, "label": "Persist", "variant": "success" }
  ]
}
</script>
```

The same scene also compiles from a fenced ` ```icon-svg ` block (it
renders to `<code class="language-icon-svg">`, which the runtime scans).

**Example 2 — device frame around a screenshot (the `deviceFrame()` JS path)**

```html
<div id="app-mockup"></div>
<script>
  document.getElementById('app-mockup').appendChild(
    window.amvcpIconSvg.deviceFrame({
      kind: 'ios', title: 'My App',
      content: '<img src="./screenshot.png" alt="app screenshot">'
    })
  );
</script>
```

**Example 3 — image with hotspots (annotated callouts — the HTML path)**

```html
<figure class="isvg-annotated">
  <img src="./ui.png" alt="annotated UI">
  <span class="isvg-hotspot" data-ve-id="hs-sidebar"
        style="--x: 0.20; --y: 0.30" role="button" tabindex="0">A — sidebar</span>
  <span class="isvg-hotspot" data-ve-id="hs-main"
        style="--x: 0.62; --y: 0.45" role="button" tabindex="0">B — main panel</span>
</figure>
```

## Visual verification

For every change touching this skill's CSS, JS, or scene-graph
output, walk the canonical checklist in
**[amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md)** — both light AND dark
themes, no-nested-scrollbars audit, selection hover state, every
C1..C7 lint pass. Measure with dev-browser; never claim "fixed"
without a screenshot in both themes.

## Modes

This skill supports `data-ve-mode="readonly"` only. Icons / logos / device frames / hotspot annotations are explanatory — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply. For "pick an icon from a gallery" use `amvcp-form-inputs`'s `ve-gallery-picker` instead.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple icon SVGs coexist independently. The only exclusive skill is the overlay-runtime (R24).

## Resources

The `references/` folder holds 42 self-sufficient technique references in eight
groups. The full annotated catalog — every reference linked with its complete
embedded Table of Contents — lives in
[resources-catalog](references/resources-catalog.md).

  - Contract (4)
  - Node primitives (5)
  - Logo blocks (6)
  - Decorative shapes (6)
  - Device frames (4)
  - Annotation + reuse + scaffolding (6)
  - Patterns + helpers (7)
  - Invariants + exclusions (4)
