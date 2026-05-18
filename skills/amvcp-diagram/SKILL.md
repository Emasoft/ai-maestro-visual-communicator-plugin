---
name: amvcp-diagram
description: "Author themed, selectable HTML diagrams from a declarative JSON scene graph — process flows, architecture canvases, phase/dependency graphs, swimlanes, sequence diagrams, state machines, decision trees, sankeys, trees, mind maps, timelines, Gantt-style bars, fan-out/fan-in, queues — plus an ASCII fallback. Every node and edge is a click-to-select atom. Theme-driven off DESIGN.md --vc-* tokens, light + dark, fail-fast on bad input, animated edges, scroll-reveal, chain-highlight, click-step + detail panel, perturbable teaching diagrams. Use when the user asks for a process flow, architecture diagram, dependency graph, phase plan, flowchart, swimlane, sequence diagram, state machine, decision tree, sankey, tree, mind map, timeline, Gantt chart, or any node/edge visualization. Trigger with 'diagram', 'process flow', 'architecture diagram', 'dependency graph', 'phase graph', 'flowchart', 'sequence', 'state machine', 'state diagram', 'decision tree', 'sankey', 'swimlane', 'tree', 'mind map', 'org chart', 'timeline', 'roadmap', 'gantt', 'scene graph', 'ASCII diagram'."
license: MIT
compatibility: "Browser (SVG + IntersectionObserver). Python 3.12+ renderer ships amvcp-diagram.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Diagram

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads on requests to draw a process flow, an architecture diagram,
a dependency or phase graph, a swimlane, a sequence diagram, a
state machine, a decision tree, a sankey, a tree, a mind map, a
timeline, Gantt-style bars, fan-out/fan-in, or any node/edge
picture. Renders a **declarative JSON scene graph** into a themed,
selectable SVG — the agent emits structured data, the runtime
draws the SVG. Far more reliable than hand-authored raw SVG, and
every node and edge is a `data-ve-id` selection atom for free.

Five core capabilities, all dependency-free (pure SVG + CSS +
vanilla JS):

1. **JSON scene-graph engine** — a `{nodes, edges, groups}`
   document becomes a themed SVG. Three placed presets —
   `process-flow`, `architecture-canvas`, `phase-graph` — plus a
   `free` escape hatch for floor plans / schematics / racks.
2. **Theming** — node fills/strokes read DESIGN.md `--vc-*`
   tokens, so a theme swap re-themes the SVG with zero JS. Six
   named theme presets, including a full blueprint engineering
   style.
3. **Flow animation** — animated SVG edges (flowing dashes,
   particle, pulse) and `IntersectionObserver` scroll-reveal. Every
   animated edge ships a `prefers-reduced-motion: reduce`
   substitute.
4. **ASCII fallback** — a no-JS, copy-pasteable, page-expanding
   Unicode diagram styled as a themed `<pre>`. Variants for state
   machines and tree hierarchies.
5. **Selection + interactions** — every node/edge/group is a
   `<g data-ve-id>` click target; the `phase-graph` preset adds
   click-to-highlight-a-dependency-chain; click-step + detail
   panel turns the diagram into navigation; perturbable teaching
   diagrams turn it into an explorable learning surface.

## When to choose this category — decision matrix

Before generating any diagram, route the request:

| Request shape | Where to send it |
|---|---|
| Process flow, architecture canvas, phase/dependency graph, floor plan, rack, swimlane, sequence diagram, state machine, decision tree, sankey, tree, mind map, timeline, Gantt bars, fan-out/fan-in, queue | **SVG scene-graph (this skill)** |
| Numeric chart (bar / line / pie / scatter / sparkline / heatmap) | the `amvcp-chart` skill |
| Auto-layout graph with 9+ nodes (ranked / force / hierarchical) | the `amvcp-graph-diagrams` skill (Graphviz) |
| Flowchart / sequence / ER / state / class / mindmap with Mermaid's terse syntax | the `amvcp-graph-diagrams` skill (Mermaid) |
| Output must survive with JS disabled, paste into a terminal, or be a 3-second inline sketch | **ASCII (this skill)** |
| UI mockup / device-framed wireframe | the `amvcp-wireframe` skill |
| 2D data matrix or tabular comparison | the `amvcp-tables` skill |

See [notation-dispatch](references/notation-dispatch.md) for the full decision tree.

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

## Instructions

1. **Pick a preset** — `process-flow` for a step lane,
   `architecture-canvas` for a layered system, `phase-graph` for a
   plan with dependencies, `free` when you supply every coordinate
   (floor plan / rack / schematic / sequence / sankey / Gantt /
   any geometry-bearing diagram). See the preset-specific
   references for deep dives.
2. **Emit the scene graph** — one `<div class="ve-scene-graph">`
   with an embedded `<script type="application/json">` carrying
   the `{version, preset, width, height, nodes, edges}` document.
   The runtime finds it, validates it, and replaces the div with
   the SVG.
3. **Tag node roles** — `role: "client" | "service" | "data" |
   "infra" | "external" | "accent"` semantically tints a node off
   the `--vc-*` palette. Omit it for a neutral surface fill.
4. **Theme** — drop a named preset via `data-ve-scene-theme` on
   the wrapper (`blueprint`, `terminal`, `high-contrast`,
   `hand-drawn`, `dark`, `default`). The override is scoped to the
   wrapper, not the page.
5. **Animate** — set `animate: "flow" | "particle" | "pulse"` on
   an edge, or `data-ve-scene-reveal="scroll"` on the wrapper for
   a draw-on reveal. Both honor `prefers-reduced-motion`.
6. **Interact** — for a navigable diagram, pair with
   [click-step-detail-panel](references/click-step-detail-panel.md) (side panel updates on click).
   For a teaching diagram, pair with
   [teaching-diagram-perturbable](references/teaching-diagram-perturbable.md) (slider re-renders the
   scene). For a phase graph, the chain-highlight is automatic.
7. **ASCII** — when SVG is wrong (no-JS, terminal, comment), use
   `<pre class="ve-ascii-diagram">` with the ASCII glyphs. Run
   the alignment validator before pasting.
8. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py"
   <file>.html`.

## The scene-graph contract

A scene graph is `{ version: 1, preset, width, height, nodes,
edges }`. Every node is `{ id, type, label }` plus optional `x`/
`y`/`role`/`detail`; `preset != "free"` auto-places nodes that
lack coordinates. Every edge is `{ from, to }` plus optional
`label`/`style`/`route`/`animate`/`arrow`. The full schema, the
seven node types, the role-to-token fill map, and edge routing are
in [scene-graph-schema](references/scene-graph-schema.md) and
[node-type-library](references/node-type-library.md).

Validation is **fail-fast** — a bad version, an unknown node type,
a dangling edge, a duplicate id, or a non-positive width throws
and the runtime paints a red error box into the figure (never a
blank SVG). See [validation-error-handling](references/validation-error-handling.md).

## Theming

Node fills/strokes are emitted as `var(--vc-color-*)` expressions,
so a DESIGN.md theme swap re-themes the SVG with no re-render.
Mermaid is themed by forwarding `--vc-*` into its `themeVariables`
(Mermaid bakes colors at init and cannot read CSS vars). The six
named theme presets and the two-color derivation are in
[theming-presets](references/theming-presets.md). The blueprint engineering style
gets its own deep dive in [blueprint-grid-style](references/blueprint-grid-style.md).

## Animation

Animated edges use three pure-SVG/SMIL techniques. Every one ships
a `prefers-reduced-motion: reduce` substitute (under reduce the
edge renders static-visible — no march, no particle, no pulse).
Scroll-reveal draws edges on as they enter the viewport. See
[flow-animation](references/flow-animation.md) and
[numbered-flow-scroll-reveal](references/numbered-flow-scroll-reveal.md).

## Selection + interactions

Every rendered node is `<g data-ve-id data-ve-type="diagram-node">`;
every edge is `<g data-ve-id data-ve-type="diagram-edge">`; every
group is `<g data-ve-id data-ve-type="diagram-group">`. The full
DOM contract — id format, payload schema, hit-area twins, hover
CSS, multi-select, comment-thread anchoring — is in
[selection-atom-payload](references/selection-atom-payload.md).

For the interaction patterns built on top:

- [dependency-chain-highlight](references/dependency-chain-highlight.md) — phase-graph's
  click-to-highlight-a-chain logic, with accessibility and
  performance notes.
- [click-step-detail-panel](references/click-step-detail-panel.md) — diagram becomes
  navigable: click a node, side panel updates with title + meta +
  body + code.
- [teaching-diagram-perturbable](references/teaching-diagram-perturbable.md) — diagram becomes
  explorable: a slider perturbs parameters and the diagram
  recomputes live.
- [group-collapse-handles](references/group-collapse-handles.md) — large-diagram
  ergonomics: collapse a group to one line and back.
- [viewport-scaffold](references/viewport-scaffold.md) — opt-in `data-ve-scene-
  viewport` mode for dense/large diagrams: fixed-height stage with
  pan, mouse-wheel zoom, toolbar, and mini-map (the documented
  "true application surface" exception to no-nested-scrollbars).

## Output

Self-contained HTML: the diagram CSS is injected by
`amvcp-diagram.js` on boot, the module ships beside the file, no
CDN, no build step. The scene-graph SVG defaults to `width:100%;
height:auto` so a wide diagram extends the document — there is
never an inner scrollbar. **Opt-in:** add
`data-ve-scene-viewport="<height>"` to the host for a fixed-height
pannable / zoomable surface with mini-map; see
[viewport-scaffold](references/viewport-scaffold.md).

## Error Handling

- **Red error box in the figure** → the scene-graph JSON is
  malformed; the box `title` carries the precise reason (unknown
  node type, dangling edge, duplicate id, bad version,
  non-positive width). See
  [validation-error-handling](references/validation-error-handling.md).
- **A node has no x/y in a `free` scene** → `free` has no
  auto-layout; supply explicit coordinates or switch to a placed
  preset. See [free-preset-geometry](references/free-preset-geometry.md).
- **Diagram not selectable** → `amvcp-runtime.js` not loaded; the
  module injects its own hover/select CSS so a standalone page
  still shows the affordance, but the click-to-POST wiring needs
  the runtime.
- **Animation ignored** → the OS `prefers-reduced-motion` is on
  (intended — the static substitute is shown).
- **ASCII diagram misaligned** → run the alignment validator
  ([ascii-diagrams](references/ascii-diagrams.md)) before pasting; double-width
  characters break monospace columns.

## Examples

**Input:** "show the data pipeline as a process flow — ingest,
validate, persist."

**Output:** a `<div class="ve-scene-graph"
data-ve-scene-preset="process-flow">` with an embedded JSON scene
graph: a `start` node, a `process` node "Ingest" (role
`service`), a `decision` node "Valid?", a `subprocess` node
"Persist" (role `data`), and an `end` node. The runtime
auto-places them into a left-to-right lane, numbers the process
steps, and makes every node and edge a click-to-select atom. See
[process-flow-preset](references/process-flow-preset.md) for the full pattern.

**Input:** "show our quarterly plan as a phase graph — discovery
through release."

**Output:** a `<div class="ve-scene-graph"
data-ve-scene-preset="phase-graph">` with `card` nodes for each
phase carrying title + duration, bezier dependency edges, and a
chain-highlight interaction that lets the reader click any phase
to see what depends on it. See [phase-graph-preset](references/phase-graph-preset.md)
and [dependency-chain-highlight](references/dependency-chain-highlight.md).

## Composition with other skills

The diagram skill is one of 13 visualizing skills; see
[composing-with-other-skills](references/composing-with-other-skills.md) for the boundary map
and composition patterns (diagram + code-highlight, diagram +
chart, diagram + slide-decks, diagram + modal-comments, etc.).

## Visual verification

Every visual change MUST be verified per
[amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — dev-browser
screenshot in light theme, then again in dark theme, then a
third screenshot if the change involves interaction (click,
slider, hover). A diagram that works light + dark + interactive
is a correct diagram.

## Modes

This skill supports `data-ve-mode="readonly"` only. Diagrams are explanatory visualizations (process flow, architecture, sequence, state machine, etc.) — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply to nodes and edges. When asking the user to choose between alternatives, render them as `amvcp-tables` or `amvcp-choice-tables` with the diagram alongside for context.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple diagrams (different presets) coexist independently. The only exclusive skill is the overlay-runtime (R24).

## Resources

### Renderer routing
- [notation-dispatch](references/notation-dispatch.md) — which renderer? the decision
  tree.

### Scene-graph engine fundamentals
- [scene-graph-schema](references/scene-graph-schema.md) — the JSON scene-graph
  contract.
- [node-type-library](references/node-type-library.md) — the seven node types, when
  to pick each, role-tinting per type.
- [edge-routing-strategies](references/edge-routing-strategies.md) — `straight` / `ortho` /
  `bezier` / `loop`; styles; arrowheads; hit-area twins.
- [arrow-marker-defs](references/arrow-marker-defs.md) — marker `<defs>`, the
  3-marker scheme (default + success + failure), `context-stroke`.
- [group-container-rects](references/group-container-rects.md) — group rectangles for
  layers / swimlanes / namespaces / callouts.
- [coordinate-snap-grid](references/coordinate-snap-grid.md) — the 4-unit grid, when to
  override, snapping interaction with auto-place.
- [validation-error-handling](references/validation-error-handling.md) — fail-fast errors,
  the red error box, common mistakes.
- [selection-atom-payload](references/selection-atom-payload.md) — exact `data-ve-id` /
  `data-ve-data` contract, hover CSS, multi-select.

### Presets (deep dives)
- [process-flow-preset](references/process-flow-preset.md) — horizontal step lane,
  numbered badges, step ordering, decision branching.
- [architecture-canvas-preset](references/architecture-canvas-preset.md) — layered system,
  groups as layers, bezier cross-layer edges.
- [phase-graph-preset](references/phase-graph-preset.md) — cards + bezier
  dependencies, longest-path layering, chain interaction.
- [free-preset-geometry](references/free-preset-geometry.md) — the escape hatch for
  floor plans, racks, schematics; explicit coordinates.

### Diagram archetypes (specific topologies)
- [data-flow-diagram](references/data-flow-diagram.md) — sync solid + async dashed,
  hot-path tinting, conservation discipline.
- [step-strip-pattern](references/step-strip-pattern.md) — compact shared-border
  horizontal pipeline for linear 3-6 step processes.
- [numbered-flow-scroll-reveal](references/numbered-flow-scroll-reveal.md) — vertical
  numbered flow that draws its connectors as you scroll.
- [fan-out-fan-in](references/fan-out-fan-in.md) — parallel processing
  topology: source -> shards -> merge.
- [queue-diagram-fifo](references/queue-diagram-fifo.md) — FIFO queue snapshot with
  head highlight and direction indicator.
- [swimlane-diagram](references/swimlane-diagram.md) — parallel actor lanes
  (horizontal or vertical), cross-lane handoffs.
- [sequence-diagram-svg](references/sequence-diagram-svg.md) — native-SVG sequence
  diagram (when Mermaid isn't enough).
- [state-machine-diagram](references/state-machine-diagram.md) — states + transitions,
  self-loops, guards, composite states.
- [decision-tree-diagram](references/decision-tree-diagram.md) — tree of decisions to
  outcomes, recommendation paths.
- [sankey-flow-diagram](references/sankey-flow-diagram.md) — proportional flow
  bands, conservation, source-tinted bands.
- [tree-hierarchy-diagram](references/tree-hierarchy-diagram.md) — org charts,
  file-system trees, class hierarchies.
- [mind-map-radial](references/mind-map-radial.md) — central topic + radial
  branches; fishbone, concept maps.
- [timeline-diagram](references/timeline-diagram.md) — events on a time axis
  (horizontal milestones or vertical history).
- [gantt-style-bars](references/gantt-style-bars.md) — task bars with
  dependencies, today line, completion bars.

### Theming and animation
- [theming-presets](references/theming-presets.md) — `--vc-*` forwarding, the six
  named theme presets, the two-color color-mix derivation.
- [blueprint-grid-style](references/blueprint-grid-style.md) — the cyan-on-navy
  engineering preset, paired with `background: "grid"`.
- [hot-path-tinting](references/hot-path-tinting.md) — marking trust boundaries
  and critical paths with `role: "accent"` or `"danger"`.
- [flow-animation](references/flow-animation.md) — animated edges (`flow` /
  `particle` / `pulse`) + scroll-reveal, with
  `prefers-reduced-motion` substitutes.

### Interaction patterns
- [dependency-chain-highlight](references/dependency-chain-highlight.md) — phase-graph's
  click-to-highlight-a-chain logic.
- [click-step-detail-panel](references/click-step-detail-panel.md) — turn a diagram into
  navigation; side panel updates on click.
- [teaching-diagram-perturbable](references/teaching-diagram-perturbable.md) — slider-driven
  recomputation for explorable concept diagrams.
- [group-collapse-handles](references/group-collapse-handles.md) — large-diagram
  ergonomics: collapse a group to one line.

### ASCII fallback
- [ascii-diagrams](references/ascii-diagrams.md) — the four ASCII styles and the
  build-time alignment validator workflow.
- [ascii-state-machine](references/ascii-state-machine.md) — state machines drawn in
  monospace.
- [ascii-tree-and-hierarchy](references/ascii-tree-and-hierarchy.md) — file-system trees,
  package hierarchies, taxonomies.

### Cross-skill composition
- [composing-with-other-skills](references/composing-with-other-skills.md) — boundaries with
  chart / code-highlight / interactive-controls / modal-comments
  / slide-decks / wireframe / animation / tables / typography.
