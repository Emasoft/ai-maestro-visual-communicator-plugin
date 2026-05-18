---
name: amvcp-icon-svg
description: "Author themed, lint-clean, selectable inline SVG icons, logos, device frames, decorative shapes, and image hotspots from a declarative JSON scene-graph. One 1000x1000 coordinate space, hairline strokes that stay hairline at any rendered size, 4-unit grid snapping, max-4-color cap, light + dark themes off DESIGN.md --vc-* tokens. Every primitive is a click-to-select atom. Use when the user asks for an icon, a logo mark, a process/database/decision/network node, a device mockup (iOS/Android/Mac/browser), a clip-path geometric shape, or an annotated image with hotspots. Trigger with 'icon', 'logo', 'svg icon', 'authored svg', 'device frame', 'iphone mockup', 'browser mockup', 'hotspot', 'annotated image', 'scene graph svg', 'process node', 'database cylinder', 'decision diamond', 'cloud icon', 'clip-path shape', 'hexagon', 'star', 'chevron'."
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
contracts in [dispatch-decision-tree](references/dispatch-decision-tree.md).
  > The 60-second routing answer · The boundary contracts (cross-skill seams) · Negative routing — what icon-svg is NOT · Choosing a sub-technique inside icon-svg · Selection / comment / decision-pill integration · When in doubt

## Instructions

1. Pick a primitive family — `node`, `logo`, or `shape`.
2. Emit a scene-graph in a `<script type="application/icon-svg+json">`
   or an ` ```icon-svg ` fenced block:
   `{viewBox: [0,0,1000,1000], ariaLabel, primitives: [...]}`.
   The runtime finds, validates, and replaces it with `<figure><svg>`.
3. Every node accepts an optional `variant` (`success` / `warning` /
   `danger` / `info`) — see [variant-semantic-stroke](references/variant-semantic-stroke.md).
     > The 5 variants · The exception — external default · How to use · Conventional variant choice per node type · Fail-fast — unknown variant · Why no `accent` variant? · Variants vs shapes · C4 lint interaction — the semantic-role collapse · DESIGN.md tokens consumed · Visual verification
4. Every primitive needs an `id` (becomes a `data-ve-id` selection
   atom — see [data-ve-id-selection](references/data-ve-id-selection.md)).
     > The 4 data-ve-* attributes · The selection scaffold per primitive · The id uniqueness contract · The scene `id` synthesis · Runtime integration — what the runtime does on click · Hotspots are also selection atoms · The keyboard comment fallback (Ctrl-+) · How to disable selection on an atom · Visual verification
5. For a device mockup: `window.amvcpIconSvg.deviceFrame({kind, …})`
   — see `references/device-frame-*.md`.
6. For an annotated image: wrap in `<figure class="isvg-annotated">`
   with `<span class="isvg-hotspot" style="--x: 0.42; --y: 0.31">`
   children — see [hotspot-annotation](references/hotspot-annotation.md).
     > What it renders · The `--x` / `--y` contract · CSS contract (injected by amvcp-icon-svg.js) · Hover state (reduced-motion-aware) · Why `<span role="button">` and NOT `<button>`? · Selection / comment / decision-mini integration · When to use · When NOT to use · Common authoring patterns · DESIGN.md tokens consumed · What NOT to do · Visual verification
7. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py"
   <file>.html`.

The full JSON schema, every type, every kind, every variant is in
[scene-graph-contract](references/scene-graph-contract.md).
  > The authoring surface · SceneGraph schema · Primitive — three kinds · Validation — fail-fast · Auto-fixes (silent — no throw) · A worked example — five-node showcase · The `<defs><use>` reuse pass · The selection / comment / decision-pill scaffold

## Theming + lint

Every fill / stroke is a `var(--vc-color-*, <hex>)` expression. A
theme swap restyles every SVG with zero JS. Details +
no-engine fallback in [theming-tokens](references/theming-tokens.md). The C1..C7
  > The 13 canonical color tokens · The 3 derived tint tiers (color-mix off accent) · The 2 special non-token values · The semantic-role variant ladder · Light + dark themes · The no-engine fallback contract · How tokens flow into the compiled SVG · Special token use in non-color attributes · What does NOT belong in the palette
lint contract (auto-fix vs throw, `<mask>` exemption, semantic-role
collapse) is in [lint-c1-to-c7](references/lint-c1-to-c7.md).
  > The 7 constraints · Auto-fix vs throw — the boundary · The `<mask>` exemption · The C4 semantic-role collapse · The C7 mixed-theming check · The 13-diagram-types NON-clause · Return shape · Calling lintSvg directly (Node / test harness) · Dev-mode lint · A worked example — every rule in one bad scene

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
  [error-placeholder](references/error-placeholder.md).
    > What it renders · When it appears · What triggers the placeholder · Why the placeholder uses the danger token · Font choice — monospace · What the placeholder does NOT do · How to recover from a placeholder · DESIGN.md tokens consumed · Selection / comment / decision-mini · Visual verification · What if the placeholder ITSELF throws?
- Unknown `kind` / `variant` / `type` → fail-fast throw with the
  valid-options list in the message.
- Hotspot in the wrong place → `--x` / `--y` are 0..1 fractions, not
  percentages or pixels.

## Examples

**Example 1 — inline SVG icon**

```html
<figure data-ve-icon-svg data-ve-id="icon-search">
  <pre><code class="language-svg-scene">
{"kind":"icon","variant":"search","size":24,"color":"currentColor"}
  </code></pre>
</figure>
```

**Example 2 — device frame around a screenshot**

```html
<figure data-ve-icon-svg data-ve-id="frame-app">
  <pre><code class="language-svg-scene">
{"kind":"device-frame","variant":"ios","content":{"img":"./screenshot.png"}}
  </code></pre>
</figure>
```

**Example 3 — image with hotspots (annotated callouts)**

```html
<figure data-ve-icon-svg data-ve-id="annotations">
  <pre><code class="language-svg-scene">
{"kind":"hotspot","image":"./ui.png","points":[
  {"x":0.20,"y":0.30,"label":"A — sidebar"},
  {"x":0.62,"y":0.45,"label":"B — main panel"}
]}
  </code></pre>
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

The `references/` folder contains 42 self-sufficient technique
references organized into eight groups:

- **Contract** (4) — [dispatch-decision-tree](references/dispatch-decision-tree.md),
  > The 60-second routing answer · The boundary contracts (cross-skill seams) · Negative routing — what icon-svg is NOT · Choosing a sub-technique inside icon-svg · Selection / comment / decision-pill integration · When in doubt
  [scene-graph-contract](references/scene-graph-contract.md), [theming-tokens](references/theming-tokens.md), [lint-c1-to-c7](references/lint-c1-to-c7.md).
    > The authoring surface · SceneGraph schema · Primitive — three kinds · Validation — fail-fast · Auto-fixes (silent — no throw) · A worked example — five-node showcase · The `<defs><use>` reuse pass · The selection / comment / decision-pill scaffold
    > The 13 canonical color tokens · The 3 derived tint tiers (color-mix off accent) · The 2 special non-token values · The semantic-role variant ladder · Light + dark themes · The no-engine fallback contract · How tokens flow into the compiled SVG · Special token use in non-color attributes · What does NOT belong in the palette
    > The 7 constraints · Auto-fix vs throw — the boundary · The `<mask>` exemption · The C4 semantic-role collapse · The C7 mixed-theming check · The 13-diagram-types NON-clause · Return shape · Calling lintSvg directly (Node / test harness) · Dev-mode lint · A worked example — every rule in one bad scene
- **Node primitives** (5) — [node-process-rect](references/node-process-rect.md),
  > What it renders · Scaffold · Variants · Geometry — what `w` and `h` mean · Lib function (directly callable) · DESIGN.md tokens consumed · Selection / comment / decision-mini · Common authoring patterns · What NOT to do · Visual verification
  [node-database-cylinder](references/node-database-cylinder.md), [node-decision-diamond](references/node-decision-diamond.md),
    > What it renders · Scaffold · Geometry — width, height, ry · Variants · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
    > What it renders · Scaffold · Geometry — keep w = h for a true diamond · Why `decision` is hand-drawn as `<polygon>`, not a rotated rect · Variants · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
  [node-external-dashed](references/node-external-dashed.md), [node-network-cloud](references/node-network-cloud.md).
    > What it renders · Scaffold · Variants · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
    > What it renders · Scaffold · Geometry — width-to-height ratio · Variants · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
- **Logo blocks** (6) — [logo-mask-cutout](references/logo-mask-cutout.md), [logo-arc-bite](references/logo-arc-bite.md),
  > What it renders · Scaffold · Geometry · C7 implications — accent + mask = explicit token only · The mask `#fff` / `#000` lint exemption · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
  > What it renders · Scaffold · Geometry · Why a `<path>`, not a mask? · Lib function · DESIGN.md tokens consumed · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
  [logo-zig-zag](references/logo-zig-zag.md), [logo-stacked-rects](references/logo-stacked-rects.md),
    > What it renders · Scaffold · Geometry · Why 6 teeth, not parametric? · Lib function · DESIGN.md tokens consumed · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
    > What it renders · Scaffold · Geometry · Visual reading · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
  [logo-tint-hierarchy](references/logo-tint-hierarchy.md), [logo-current-color](references/logo-current-color.md).
    > What it renders · Scaffold · Geometry · Visual reading · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
    > What it renders · Scaffold · Why the diamond shape? · The C7 constraint — why this mark MUST live in its own scene · Lib function · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
- **Decorative shapes** (6) — [shape-triangle-up](references/shape-triangle-up.md),
  > What it renders · Two authoring paths · Fill options (scene-graph path) · DESIGN.md tokens consumed · Selection / comment / decision-mini (scene-graph path) · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
  [shape-arrow-right](references/shape-arrow-right.md), [shape-chevron](references/shape-chevron.md),
    > What it renders · Two authoring paths · Fill options · DESIGN.md tokens consumed · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
    > What it renders · Two authoring paths · Fill options · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
  [shape-parallelogram](references/shape-parallelogram.md), [shape-hexagon](references/shape-hexagon.md), [shape-star](references/shape-star.md).
    > What it renders · Two authoring paths · Fill options · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
    > What it renders · Two authoring paths · Fill options · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
    > What it renders · Two authoring paths · Fill options · When to use · When NOT to use · Common authoring patterns · What NOT to do · Visual verification
- **Device frames** (4) — [device-frame-ios](references/device-frame-ios.md),
  > What it renders · Two authoring paths · Required parameters (JS path) · Status bar glyphs · The home indicator · Dynamic Island · CSS-only path classes · DESIGN.md tokens consumed · The `.isvg-frame-content` overflow: auto carve-out · Selection / comment / decision-mini · When to use · When NOT to use · What NOT to do · Visual verification
  [device-frame-android](references/device-frame-android.md), [device-frame-mac](references/device-frame-mac.md),
    > What it renders · Two authoring paths · Required parameters (JS path) · The punch-hole camera · The gesture bar · CSS-only path classes · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · What NOT to do · Visual verification
    > What it renders · Two authoring paths · Required parameters (JS path) · The traffic lights · CSS-only path classes · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · What NOT to do · Visual verification
  [device-frame-browser](references/device-frame-browser.md).
    > What it renders · Two authoring paths · Required parameters (JS path) · The URL bar · The tab label · CSS-only path classes · DESIGN.md tokens consumed · Selection / comment / decision-mini · When to use · When NOT to use · What NOT to do · Visual verification
- **Annotation + reuse + scaffolding** (6) —
  [hotspot-annotation](references/hotspot-annotation.md), [defs-use-reuse-pass](references/defs-use-reuse-pass.md),
    > What it renders · The `--x` / `--y` contract · CSS contract (injected by amvcp-icon-svg.js) · Hover state (reduced-motion-aware) · Why `<span role="button">` and NOT `<button>`? · Selection / comment / decision-mini integration · When to use · When NOT to use · Common authoring patterns · DESIGN.md tokens consumed · What NOT to do · Visual verification
    > When the pass fires · The output structure · Why the threshold is N > 2 · When the pass does NOT fire · What the geometry key collapses · A worked example · When NOT to expect reuse · Selection / comment / decision-mini behavior · What NOT to do · Visual verification
  [variant-semantic-stroke](references/variant-semantic-stroke.md), [data-ve-id-selection](references/data-ve-id-selection.md),
    > The 5 variants · The exception — external default · How to use · Conventional variant choice per node type · Fail-fast — unknown variant · Why no `accent` variant? · Variants vs shapes · C4 lint interaction — the semantic-role collapse · DESIGN.md tokens consumed · Visual verification
    > The 4 data-ve-* attributes · The selection scaffold per primitive · The id uniqueness contract · The scene `id` synthesis · Runtime integration — what the runtime does on click · Hotspots are also selection atoms · The keyboard comment fallback (Ctrl-+) · How to disable selection on an atom · Visual verification
  [decision-mini-pill](references/decision-mini-pill.md), [error-placeholder](references/error-placeholder.md).
    > What it renders · Where the wiring lives · The atoms that get pills · Defensive integration · Public re-attachment surface · DESIGN.md tokens consumed · Why "independent of selection state"? · When pills are NOT attached · Visual verification
    > What it renders · When it appears · What triggers the placeholder · Why the placeholder uses the danger token · Font choice — monospace · What the placeholder does NOT do · How to recover from a placeholder · DESIGN.md tokens consumed · Selection / comment / decision-mini · Visual verification · What if the placeholder ITSELF throws?
- **Patterns + helpers** (7) — [junction-dot-primitive](references/junction-dot-primitive.md),
  > What it renders · How to author one · Why icon-svg doesn't have a junction primitive · When you DO need a junction in icon-svg (the edge case) · Cross-skill seam — junction dots in the `diagram` skill · Visual verification · Why this reference exists
  [inline-style-block-export](references/inline-style-block-export.md), [blob-download-helper](references/blob-download-helper.md),
    > The pattern · Why this matters for icon-svg · How to inject the embedded style at export time · When this pattern is overkill · When to use this pattern · Cross-skill seam — chart skill also adopts this · Visual verification · What NOT to do
    > The 6-line helper · Usage · Combined with the inline-style block pattern · Why a Blob, not a data URI? · The MIME type · Browser compatibility · Filename suggestions · What NOT to do · Visual verification
  [inline-thumbnail-pattern](references/inline-thumbnail-pattern.md), [svg-ornament-marks](references/svg-ornament-marks.md),
    > The pattern · Why short class names · Cross-skill seam — gallery indexes · DESIGN.md tokens consumed · When to use · When NOT to use · What NOT to do · Visual verification
    > The canonical pattern (from `09-slide-deck.html`) · Variants · When to use · When NOT to use · Why a custom mark and not a primitive? · DESIGN.md tokens to use · Class naming convention · Visual verification
  [named-port-anchors](references/named-port-anchors.md), [empty-state-illustration](references/empty-state-illustration.md).
    > Why this matters for icon-svg · The TikZ source pattern (for reference) · The HTML/SVG analog · Where this pattern actually lives in this plugin · When the pattern would extend icon-svg · Documented as an idea, not a feature · When you actually need this · What if I really must in icon-svg?
    > The canonical anatomy · The visual grammar · When to use · When NOT to use · How icon-svg can help (or not) · DESIGN.md tokens to use · CSS sizing · Common variants · What NOT to do · Visual verification
- **Invariants + exclusions** (4) — [reduced-motion-substitutes](references/reduced-motion-substitutes.md),
  > The contract · The implemented case — hotspot hover · Why "no-preference" not the default · When to apply this pattern · What kinds of substitutes work · Testing · DESIGN.md tokens consumed · Why this matters · Visual verification
  [no-build-no-dep-invariant](references/no-build-no-dep-invariant.md), [canvas-pixel-art-exclusion](references/canvas-pixel-art-exclusion.md)
    > What the invariant means · Why this is a hard invariant · What this rules out · What this DOES allow · Sister modules with the same invariant · What changes if the runtime EVER needs a dep · Visual verification · The Node export — for testing
    > Why it's out of scope · The use cases pixel art ostensibly serves · When a user REALLY wants pixel art · What would the runtime gain by including pixel art? · The C5 lint constraint informs this exclusion · What if the project DID want pixel art · Cross-skill seam — none · Visual verification · Source citation
  (IS-05 SKIP), [fontkit-glyph-exclusion](references/fontkit-glyph-exclusion.md) (IS-08 SKIP).
    > Why it's out of scope · What fontkit + Playwright would BUY · Why it's the wrong tradeoff for visual-communicator · The use cases IS-08 ostensibly serves · When a user REALLY wants this · What about KaTeX / MathJax? · Cross-skill seam — typography · The no-dep invariant informs this exclusion · What if the project DID want offline path embedding · Cross-skill seam — none · Visual verification · Source citation
