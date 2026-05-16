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
contracts in `references/dispatch-decision-tree.md`.

## Instructions

1. Pick a primitive family — `node`, `logo`, or `shape`.
2. Emit a scene-graph in a `<script type="application/icon-svg+json">`
   or an ` ```icon-svg ` fenced block:
   `{viewBox: [0,0,1000,1000], ariaLabel, primitives: [...]}`.
   The runtime finds, validates, and replaces it with `<figure><svg>`.
3. Every node accepts an optional `variant` (`success` / `warning` /
   `danger` / `info`) — see `references/variant-semantic-stroke.md`.
4. Every primitive needs an `id` (becomes a `data-ve-id` selection
   atom — see `references/data-ve-id-selection.md`).
5. For a device mockup: `window.amvcpIconSvg.deviceFrame({kind, …})`
   — see `references/device-frame-*.md`.
6. For an annotated image: wrap in `<figure class="isvg-annotated">`
   with `<span class="isvg-hotspot" style="--x: 0.42; --y: 0.31">`
   children — see `references/hotspot-annotation.md`.
7. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py"
   <file>.html`.

The full JSON schema, every type, every kind, every variant is in
`references/scene-graph-contract.md`.

## Theming + lint

Every fill / stroke is a `var(--vc-color-*, <hex>)` expression. A
theme swap restyles every SVG with zero JS. Details +
no-engine fallback in `references/theming-tokens.md`. The C1..C7
lint contract (auto-fix vs throw, `<mask>` exemption, semantic-role
collapse) is in `references/lint-c1-to-c7.md`.

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
  `references/error-placeholder.md`.
- Unknown `kind` / `variant` / `type` → fail-fast throw with the
  valid-options list in the message.
- Hotspot in the wrong place → `--x` / `--y` are 0..1 fractions, not
  percentages or pixels.

## Visual verification

For every change touching this skill's CSS, JS, or scene-graph
output, walk the canonical checklist in
**`skills/amvcp-self-debug-rules/SKILL.md`** — both light AND dark
themes, no-nested-scrollbars audit, selection hover state, every
C1..C7 lint pass. Measure with dev-browser; never claim "fixed"
without a screenshot in both themes.

## Resources

The `references/` folder contains 42 self-sufficient technique
references organized into eight groups:

- **Contract** (4) — `dispatch-decision-tree.md`,
  `scene-graph-contract.md`, `theming-tokens.md`, `lint-c1-to-c7.md`.
- **Node primitives** (5) — `node-process-rect.md`,
  `node-database-cylinder.md`, `node-decision-diamond.md`,
  `node-external-dashed.md`, `node-network-cloud.md`.
- **Logo blocks** (6) — `logo-mask-cutout.md`, `logo-arc-bite.md`,
  `logo-zig-zag.md`, `logo-stacked-rects.md`,
  `logo-tint-hierarchy.md`, `logo-current-color.md`.
- **Decorative shapes** (6) — `shape-triangle-up.md`,
  `shape-arrow-right.md`, `shape-chevron.md`,
  `shape-parallelogram.md`, `shape-hexagon.md`, `shape-star.md`.
- **Device frames** (4) — `device-frame-ios.md`,
  `device-frame-android.md`, `device-frame-mac.md`,
  `device-frame-browser.md`.
- **Annotation + reuse + scaffolding** (6) —
  `hotspot-annotation.md`, `defs-use-reuse-pass.md`,
  `variant-semantic-stroke.md`, `data-ve-id-selection.md`,
  `decision-mini-pill.md`, `error-placeholder.md`.
- **Patterns + helpers** (7) — `junction-dot-primitive.md`,
  `inline-style-block-export.md`, `blob-download-helper.md`,
  `inline-thumbnail-pattern.md`, `svg-ornament-marks.md`,
  `named-port-anchors.md`, `empty-state-illustration.md`.
- **Invariants + exclusions** (4) — `reduced-motion-substitutes.md`,
  `no-build-no-dep-invariant.md`, `canvas-pixel-art-exclusion.md`
  (IS-05 SKIP), `fontkit-glyph-exclusion.md` (IS-08 SKIP).
