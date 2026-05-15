---
name: amvcp-diagram
description: "Author themed, selectable HTML diagrams from a declarative JSON scene graph — process flows, architecture canvases, phase/dependency graphs — plus an ASCII fallback. Every node and edge is a click-to-select atom. Theme-driven off DESIGN.md --vc-* tokens, light + dark, fail-fast on bad input, animated edges, scroll-reveal. Use when the user asks for a process flow, architecture diagram, dependency graph, phase plan, flowchart, or any node/edge visualization. Trigger with 'diagram', 'process flow', 'architecture diagram', 'dependency graph', 'phase graph', 'flowchart', 'scene graph', 'ASCII diagram'."
license: MIT
compatibility: "Browser (SVG + IntersectionObserver). Python 3.12+ renderer ships amvcp-diagram.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Diagram

## Overview

Loads on requests to draw a process flow, an architecture diagram, a
dependency or phase graph, or any node/edge picture. Renders a
**declarative JSON scene graph** into a themed, selectable SVG — the
agent emits structured data, the runtime draws the SVG. Far more
reliable than hand-authored raw SVG, and every node and edge is a
`data-ve-id` selection atom for free.

Five capabilities, all dependency-free (pure SVG + CSS + vanilla JS):

1. **JSON scene-graph engine** — a `{nodes, edges, groups}` document
   becomes a themed SVG. Three presets — `process-flow`,
   `architecture-canvas`, `phase-graph` — plus a `free` escape hatch.
2. **Theming** — node fills/strokes read DESIGN.md `--vc-*` tokens, so a
   theme swap re-themes the SVG with zero JS. Six named theme presets.
3. **Flow animation** — animated SVG edges (flowing dashes, particle,
   pulse) and `IntersectionObserver` scroll-reveal.
4. **ASCII fallback** — a no-JS, copy-pasteable, page-expanding Unicode
   diagram styled as a themed `<pre>`.
5. **Selection** — every node/edge is a `<g data-ve-id>` click target;
   the `phase-graph` preset adds click-to-highlight-a-dependency-chain.

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) supplies the `--vc-*`
  tokens. The diagram module is **fully defensive** — it renders
  correctly with NO DESIGN.md, every token read via
  `var(--vc-…, fallback)`.
- `amvcp-diagram.js` ships beside the output HTML (the renderer
  co-locates it).
- A Chromium browser with SVG + `IntersectionObserver`. A
  no-IntersectionObserver path reveals all content (never stuck
  invisible).

## Pick the renderer

Before generating any diagram, route the request:

```
Is the data a series of numbers over an axis?      -> chart skill (STOP)
Need exact coordinates / engineering precision /
  a fixed shape vocabulary (process-flow steps,
  layered architecture, phase cards)?              -> SVG scene-graph (this skill)
Need automatic graph layout (nodes+edges, no
  coordinates, 9+ nodes, ranked/force)?            -> Graphviz/DOT (amvcp-graph-diagrams)
A flowchart/sequence/ER/state/class/mindmap with
  Mermaid's terse syntax?                          -> Mermaid (amvcp-graph-diagrams)
Output must survive with JS disabled, paste into
  a terminal, or be a 3-second inline sketch?      -> ASCII (this skill, see below)
```

This skill owns the **SVG scene-graph** and the **ASCII** path. See
`references/notation-dispatch.md` for the full decision tree.

## Instructions

1. **Pick a preset** — `process-flow` for a step lane,
   `architecture-canvas` for a layered system, `phase-graph` for a
   plan with dependencies, `free` when you supply every coordinate.
2. **Emit the scene graph** — one `<div class="ve-scene-graph">` with
   an embedded `<script type="application/json">` carrying the
   `{version, preset, width, height, nodes, edges}` document. The
   runtime finds it, validates it, and replaces the div with the SVG.
3. **Tag node roles** — `role: "client" | "service" | "data" | "infra"
   | "external" | "accent"` semantically tints a node off the
   `--vc-*` palette. Omit it for a neutral surface fill.
4. **Theme** — drop a named preset via `data-ve-scene-theme` on the
   wrapper (`blueprint`, `terminal`, `high-contrast`, `hand-drawn`,
   `dark`, `default`). The override is scoped to the wrapper, not the
   page.
5. **Animate** — set `animate: "flow" | "particle" | "pulse"` on an
   edge, or `data-ve-scene-reveal="scroll"` on the wrapper for a
   draw-on reveal.
6. **ASCII** — author the diagram per a style, validate alignment, then
   paste the validated text into a `<pre class="ve-ascii-diagram">`.
7. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py"
   <file>.html`.

## The scene-graph contract

A scene graph is `{ version: 1, preset, width, height, nodes, edges }`.
Every node is `{ id, type, label }` plus optional `x`/`y`/`role`/
`detail`; `preset != "free"` auto-places nodes that lack coordinates.
Every edge is `{ from, to }` plus optional `label`/`style`/`route`/
`animate`/`arrow`. The full schema, the six node types, the role-to-
token fill map, and edge routing are in
`references/scene-graph-schema.md`.

Validation is **fail-fast** — a bad version, an unknown node type, a
dangling edge, a duplicate id, or a non-positive width throws and the
runtime paints a red error box into the figure (never a blank SVG).

## Theming

Node fills/strokes are emitted as `var(--vc-color-*)` expressions, so a
DESIGN.md theme swap re-themes the SVG with no re-render. Mermaid is
themed by forwarding `--vc-*` into its `themeVariables` (Mermaid bakes
colors at init and cannot read CSS vars). The six named theme presets
and the two-color derivation are in `references/theming-presets.md`.

## Animation

Animated edges use three pure-SVG/SMIL techniques. Every one ships a
`prefers-reduced-motion: reduce` substitute — under reduce the edge
renders static-visible (no march, no particle, no pulse). Scroll-reveal
draws edges on as they enter the viewport. See
`references/flow-animation.md`.

## Output

Self-contained HTML: the diagram CSS is injected by `amvcp-diagram.js`
on boot, the module ships beside the file, no CDN, no build step. The
scene-graph SVG is `width:100%; height:auto` so a wide diagram extends
the document — there is never an inner scrollbar.

## Error Handling

- **Red error box in the figure** → the scene-graph JSON is malformed;
  the box `title` carries the precise reason (unknown node type,
  dangling edge, duplicate id, bad version, non-positive width).
- **A node has no x/y in a `free` scene** → `free` has no auto-layout;
  supply explicit coordinates or switch to a placed preset.
- **Diagram not selectable** → `amvcp-runtime.js` not loaded; the
  module injects its own hover/select CSS so a standalone page still
  shows the affordance, but the click-to-POST wiring needs the runtime.
- **Animation ignored** → the OS `prefers-reduced-motion` is on
  (intended — the static substitute is shown).
- **ASCII diagram misaligned** → run the alignment validator
  (`references/ascii-diagrams.md`) before pasting; double-width
  characters break monospace columns.

## Examples

**Input:** "show the data pipeline as a process flow — ingest, validate,
persist."

**Output:** a `<div class="ve-scene-graph" data-ve-scene-preset=
"process-flow">` with an embedded JSON scene graph: a `start` node, a
`process` node "Ingest" (role `service`), a `decision` node "Valid?", a
`subprocess` node "Persist" (role `data`), and an `end` node. The
runtime auto-places them into a left-to-right lane, numbers the process
step, and makes every node and edge a click-to-select atom.

## Resources

- `references/notation-dispatch.md` — which renderer? the decision tree.
- `references/scene-graph-schema.md` — the JSON scene-graph contract,
  the node-type library, the role-to-token fill map, edge routing.
- `references/theming-presets.md` — `--vc-*` forwarding, the six named
  theme presets, the two-color color-mix derivation.
- `references/flow-animation.md` — animated edges and scroll-reveal.
- `references/ascii-diagrams.md` — the four ASCII styles and the
  build-time alignment validator workflow.
