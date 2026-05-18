---
name: amvcp-diagram
description: "Author themed, selectable HTML diagrams from a JSON scene graph — process flows, architecture canvases, dependency graphs, swimlanes, sequence, state machines, decision trees, sankeys, mind maps, timelines, Gantt — plus ASCII fallback. Every node and edge a click-to-select atom. Theme-driven off DESIGN.md tokens. Use when the user asks for a flowchart, architecture diagram, dependency graph, sequence, state diagram, sankey, mind map, timeline. Trigger with 'diagram', 'flowchart', 'process flow', 'architecture diagram', 'dependency graph', 'sequence', 'state diagram', 'sankey', 'swimlane', 'mind map', 'timeline', 'gantt', 'ASCII diagram'."
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
  > The decision tree · Why the scene-graph over hand-authored SVG · What this skill deliberately does NOT do · Renderer ownership table

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
     > When to choose this pattern · The shape · The wiring · Active-node styling · Detail registration patterns · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
   For a teaching diagram, pair with
   [teaching-diagram-perturbable](references/teaching-diagram-perturbable.md) (slider re-renders the
     > When to choose this pattern · The shape · Smooth transitions · The stats panel · Hover-linked glossary · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
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
  > The authoring surface · SceneGraph · Node · Edge · Group · Validation (all fail-fast) · Node-type library · Role -> token fill map · The three presets · Auto-placement (presets other than `free`) · Edge routing · Selection
[node-type-library](references/node-type-library.md).
  > The seven node types · `start` and `end` · `process` · `decision` · `subprocess` · `external` · `card` · Authoring shape correctness · Size customization · Role tinting per type · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Visual verification

Validation is **fail-fast** — a bad version, an unknown node type,
a dangling edge, a duplicate id, or a non-positive width throws
and the runtime paints a red error box into the figure (never a
blank SVG). See [validation-error-handling](references/validation-error-handling.md).
  > What validation catches · The red error box · Why fail-fast (not fallback) · Common errors and fixes · Per-engine error reporting · Console logging · DESIGN.md tokens consumed (by the error box) · Selection atoms · Test pattern · Anti-patterns · Visual verification

## Theming

Node fills/strokes are emitted as `var(--vc-color-*)` expressions,
so a DESIGN.md theme swap re-themes the SVG with no re-render.
Mermaid is themed by forwarding `--vc-*` into its `themeVariables`
(Mermaid bakes colors at init and cannot read CSS vars). The six
named theme presets and the two-color derivation are in
[theming-presets](references/theming-presets.md). The blueprint engineering style
  > The `--vc-*` namespace · Tokens the diagram skill reads · Two-color derivation · Mermaid theming (the forwarding contract) · The six named theme presets · Anti-AI-slop
gets its own deep dive in [blueprint-grid-style](references/blueprint-grid-style.md).
  > When to choose the blueprint style · Authoring · The blueprint palette · The grid background · Stroke widths · Typography · Edge labels · Theme pairing rules · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification

## Animation

Animated edges use three pure-SVG/SMIL techniques. Every one ships
a `prefers-reduced-motion: reduce` substitute (under reduce the
edge renders static-visible — no march, no particle, no pulse).
Scroll-reveal draws edges on as they enter the viewport. See
[flow-animation](references/flow-animation.md) and
  > Accessibility gate (mandatory) · Animated edges · Scroll-reveal · Motion-token consumption · Theme hot-swap
[numbered-flow-scroll-reveal](references/numbered-flow-scroll-reveal.md).
  > When to choose this pattern · Scaffold · Accessibility gate · Hot-step modifier · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification

## Selection + interactions

Every rendered node is `<g data-ve-id data-ve-type="diagram-node">`;
every edge is `<g data-ve-id data-ve-type="diagram-edge">`; every
group is `<g data-ve-id data-ve-type="diagram-group">`. The full
DOM contract — id format, payload schema, hit-area twins, hover
CSS, multi-select, comment-thread anchoring — is in
[selection-atom-payload](references/selection-atom-payload.md).
  > The DOM contract · Payload schemas · ID generation · Why `nodeId` not `data-ve-id` is the stable identifier · Click POST payload · Hover treatment (in CSS, not the payload) · Hit-area twins for thin edges · Group label is also clickable · Multi-select (Shift-click) · Decision-mini attachment · Comment threading · DESIGN.md tokens consumed (by the selection CSS) · Anti-patterns · Visual verification

For the interaction patterns built on top:

- [dependency-chain-highlight](references/dependency-chain-highlight.md) — phase-graph's
  > When the chain-highlight interaction shines · The chain walk · Visual treatment · Edge treatment · Clearing the chain · Accessibility · Performance · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  click-to-highlight-a-chain logic, with accessibility and
  performance notes.
- [click-step-detail-panel](references/click-step-detail-panel.md) — diagram becomes
  > When to choose this pattern · The shape · The wiring · Active-node styling · Detail registration patterns · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  navigable: click a node, side panel updates with title + meta +
  body + code.
- [teaching-diagram-perturbable](references/teaching-diagram-perturbable.md) — diagram becomes
  > When to choose this pattern · The shape · Smooth transitions · The stats panel · Hover-linked glossary · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  explorable: a slider perturbs parameters and the diagram
  recomputes live.
- [group-collapse-handles](references/group-collapse-handles.md) — large-diagram
  > When to choose this pattern · Implementation · Collapsed-state geometry · Expanded state · CSS for the handle · JS wiring · Persistence · Accessibility · DESIGN.md tokens consumed · Selection atom · Variations · Anti-patterns · Visual verification
  ergonomics: collapse a group to one line and back.
- [viewport-scaffold](references/viewport-scaffold.md) — opt-in `data-ve-scene-
  > Why this exists (and why it's allowed) · How to enable · What you get · Comment-handle adjustment · Theme-token usage · When NOT to use viewport mode · Reference test cases
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
  > Why this exists (and why it's allowed) · How to enable · What you get · Comment-handle adjustment · Theme-token usage · When NOT to use viewport mode · Reference test cases

## Error Handling

- **Red error box in the figure** → the scene-graph JSON is
  malformed; the box `title` carries the precise reason (unknown
  node type, dangling edge, duplicate id, bad version,
  non-positive width). See
  [validation-error-handling](references/validation-error-handling.md).
    > What validation catches · The red error box · Why fail-fast (not fallback) · Common errors and fixes · Per-engine error reporting · Console logging · DESIGN.md tokens consumed (by the error box) · Selection atoms · Test pattern · Anti-patterns · Visual verification
- **A node has no x/y in a `free` scene** → `free` has no
  auto-layout; supply explicit coordinates or switch to a placed
  preset. See [free-preset-geometry](references/free-preset-geometry.md).
    > When to choose `free` · Scaffold (a server rack) · Coordinate space · Grid snapping · Background grid · Mixing auto-placed and explicit nodes · Edges in a `free` diagram · Groups as containers · DESIGN.md tokens consumed · Selection atoms · Use-case archetypes · Anti-patterns · Visual verification
- **Diagram not selectable** → `amvcp-runtime.js` not loaded; the
  module injects its own hover/select CSS so a standalone page
  still shows the affordance, but the click-to-POST wiring needs
  the runtime.
- **Animation ignored** → the OS `prefers-reduced-motion` is on
  (intended — the static substitute is shown).
- **ASCII diagram misaligned** → run the alignment validator
  ([ascii-diagrams](references/ascii-diagrams.md)) before pasting; double-width
    > When to use ASCII · The authoring surface · The four styles · Alignment validator (build-time, NEVER shipped) · Page-expansion (the hard rule)
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
  > When to choose this preset · Scaffold · Auto-placement rules · Step badges · Decision branching · Role tinting · DESIGN.md tokens consumed · Selection, comment, decision-mini · Animation patterns that compose with process-flow · Anti-patterns · Visual verification

**Input:** "show our quarterly plan as a phase graph — discovery
through release."

**Output:** a `<div class="ve-scene-graph"
data-ve-scene-preset="phase-graph">` with `card` nodes for each
phase carrying title + duration, bezier dependency edges, and a
chain-highlight interaction that lets the reader click any phase
to see what depends on it. See [phase-graph-preset](references/phase-graph-preset.md)
  > When to choose this preset · Scaffold · Card geometry · Auto-placement (longest-path layering) · Chain-highlight interaction · Edge styling under chain mode · Cycles · DESIGN.md tokens consumed · Selection atoms · Theming patterns · Anti-patterns · Composing with other patterns · Visual verification
and [dependency-chain-highlight](references/dependency-chain-highlight.md).
  > When the chain-highlight interaction shines · The chain walk · Visual treatment · Edge treatment · Clearing the chain · Accessibility · Performance · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification

## Composition with other skills

The diagram skill is one of 13 visualizing skills; see
[composing-with-other-skills](references/composing-with-other-skills.md) for the boundary map
  > The boundary map · Composition patterns · What the diagram skill OWNS vs DELEGATES · When to compose vs when to hand off · Anti-patterns · Visual verification
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
  > The decision tree · Why the scene-graph over hand-authored SVG · What this skill deliberately does NOT do · Renderer ownership table
  tree.

### Scene-graph engine fundamentals
- [scene-graph-schema](references/scene-graph-schema.md) — the JSON scene-graph
  > The authoring surface · SceneGraph · Node · Edge · Group · Validation (all fail-fast) · Node-type library · Role -> token fill map · The three presets · Auto-placement (presets other than `free`) · Edge routing · Selection
  contract.
- [node-type-library](references/node-type-library.md) — the seven node types, when
  > The seven node types · `start` and `end` · `process` · `decision` · `subprocess` · `external` · `card` · Authoring shape correctness · Size customization · Role tinting per type · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Visual verification
  to pick each, role-tinting per type.
- [edge-routing-strategies](references/edge-routing-strategies.md) — `straight` / `ortho` /
  > The four routes · `straight` — the bare line · `ortho` — the workhorse · `bezier` — the curve · `loop` — the back-edge · Edge anchors · Edge labels · Edge styles · Arrowheads · The 14px hit-area twin · DESIGN.md tokens consumed · Anti-patterns · Visual verification
  `bezier` / `loop`; styles; arrowheads; hit-area twins.
- [arrow-marker-defs](references/arrow-marker-defs.md) — marker `<defs>`, the
  > The single-marker base case · Why scene-scoped marker ids matter · Multi-marker edge semantics (3-marker pattern) · When to extend the scheme · Marker geometry · Marker units and stroke-width scaling · `refX` / `refY` — where the marker anchors · Bidirectional edges · Animated arrowheads · DESIGN.md tokens consumed · Anti-patterns · Visual verification
  3-marker scheme (default + success + failure), `context-stroke`.
- [group-container-rects](references/group-container-rects.md) — group rectangles for
  > What a group is (and isn't) · Group schema · Group rendering · Group tint vs node tint · Use cases · Group containment · Nested groups · Selection atoms · DESIGN.md tokens consumed · Anti-patterns · Optional: the group-handle UI · Visual verification
  layers / swimlanes / namespaces / callouts.
- [coordinate-snap-grid](references/coordinate-snap-grid.md) — the 4-unit grid, when to
  > The default 4-unit grid · Overriding the grid step · The visible grid background · When to show the grid vs hide it · How snapping interacts with auto-place · Sub-grid offsets (for centering text within nodes) · The grid is structural, not themed · DESIGN.md tokens consumed (by the visible grid) · Snapping width and height (not just x and y) · Grid coordinate vs CSS pixel · Snapping and re-render · Anti-patterns · Visual verification
  override, snapping interaction with auto-place.
- [validation-error-handling](references/validation-error-handling.md) — fail-fast errors,
  > What validation catches · The red error box · Why fail-fast (not fallback) · Common errors and fixes · Per-engine error reporting · Console logging · DESIGN.md tokens consumed (by the error box) · Selection atoms · Test pattern · Anti-patterns · Visual verification
  the red error box, common mistakes.
- [selection-atom-payload](references/selection-atom-payload.md) — exact `data-ve-id` /
  > The DOM contract · Payload schemas · ID generation · Why `nodeId` not `data-ve-id` is the stable identifier · Click POST payload · Hover treatment (in CSS, not the payload) · Hit-area twins for thin edges · Group label is also clickable · Multi-select (Shift-click) · Decision-mini attachment · Comment threading · DESIGN.md tokens consumed (by the selection CSS) · Anti-patterns · Visual verification
  `data-ve-data` contract, hover CSS, multi-select.

### Presets (deep dives)
- [process-flow-preset](references/process-flow-preset.md) — horizontal step lane,
  > When to choose this preset · Scaffold · Auto-placement rules · Step badges · Decision branching · Role tinting · DESIGN.md tokens consumed · Selection, comment, decision-mini · Animation patterns that compose with process-flow · Anti-patterns · Visual verification
  numbered badges, step ordering, decision branching.
- [architecture-canvas-preset](references/architecture-canvas-preset.md) — layered system,
  > When to choose this preset · Scaffold · Group geometry · The grid background · Bezier edges across layers · Async / sync visual distinction · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Variation: vertical orientation · Theme pairings · Visual verification
  groups as layers, bezier cross-layer edges.
- [phase-graph-preset](references/phase-graph-preset.md) — cards + bezier
  > When to choose this preset · Scaffold · Card geometry · Auto-placement (longest-path layering) · Chain-highlight interaction · Edge styling under chain mode · Cycles · DESIGN.md tokens consumed · Selection atoms · Theming patterns · Anti-patterns · Composing with other patterns · Visual verification
  dependencies, longest-path layering, chain interaction.
- [free-preset-geometry](references/free-preset-geometry.md) — the escape hatch for
  > When to choose `free` · Scaffold (a server rack) · Coordinate space · Grid snapping · Background grid · Mixing auto-placed and explicit nodes · Edges in a `free` diagram · Groups as containers · DESIGN.md tokens consumed · Selection atoms · Use-case archetypes · Anti-patterns · Visual verification
  floor plans, racks, schematics; explicit coordinates.

### Diagram archetypes (specific topologies)
- [data-flow-diagram](references/data-flow-diagram.md) — sync solid + async dashed,
  > The convention (the discipline) · Scaffold · Why this pattern works · Composition with other techniques · Tinting the "hot path" · Convention: edge labels go above (horizontal) / left (vertical) · Convention: every async edge is labelled · Decision points · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Visual verification
  hot-path tinting, conservation discipline.
- [step-strip-pattern](references/step-strip-pattern.md) — compact shared-border
  > When to choose this pattern · Scaffold (HTML + CSS, not the scene-graph) · Variant: with arrow chevrons · Authoring contract · DESIGN.md tokens consumed · Responsive behavior · Variant: numbered prefix instead of "01 02 03" · When to upgrade to the full process-flow preset · Anti-patterns · Visual verification
  horizontal pipeline for linear 3-6 step processes.
- [numbered-flow-scroll-reveal](references/numbered-flow-scroll-reveal.md) — vertical
  > When to choose this pattern · Scaffold · Accessibility gate · Hot-step modifier · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  numbered flow that draws its connectors as you scroll.
- [fan-out-fan-in](references/fan-out-fan-in.md) — parallel processing
  > When to choose this pattern · Scaffold · Fan-out vs fan-in arrow style · Labels above the fan-out and fan-in arcs · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  topology: source -> shards -> merge.
- [queue-diagram-fifo](references/queue-diagram-fifo.md) — FIFO queue snapshot with
  > When to choose this pattern · Scaffold · Direction indicator · Variants · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Visual verification
  head highlight and direction indicator.
- [swimlane-diagram](references/swimlane-diagram.md) — parallel actor lanes
  > When to choose this pattern · Scaffold (horizontal lanes, vertical flow) · Lane geometry conventions · Vertical lanes (horizontal flow) · Cross-lane edge styling · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Variation: with timeline header · Visual verification
  (horizontal or vertical), cross-lane handoffs.
- [sequence-diagram-svg](references/sequence-diagram-svg.md) — native-SVG sequence
  > When to choose SVG over Mermaid · Scaffold · Message arrows · Activation bars · Notes / annotations · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · When you should just use Mermaid
  diagram (when Mermaid isn't enough).
- [state-machine-diagram](references/state-machine-diagram.md) — states + transitions,
  > When to choose this pattern · Scaffold · State node convention · Transition labels (the event vocabulary) · Self-loops (the same state on different events) · Multiple outgoing edges from one state · Guards / conditions · Actions on entry / exit · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  self-loops, guards, composite states.
- [decision-tree-diagram](references/decision-tree-diagram.md) — tree of decisions to
  > When to choose this pattern · Scaffold · Tree geometry conventions · Decision node labels · Outcome node convention · Edge labels (the answer to the question) · Routing convention · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  outcomes, recommendation paths.
- [sankey-flow-diagram](references/sankey-flow-diagram.md) — proportional flow
  > When to choose this pattern · Scaffold · Encoding magnitude in band width · Coloring bands by source · Conservation check (the integrity rule) · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
  bands, conservation, source-tinted bands.
- [tree-hierarchy-diagram](references/tree-hierarchy-diagram.md) — org charts,
  > When to choose this pattern · Scaffold (top-down org-chart style) · Tree layout conventions · Routing convention · File-system tree variation · Class hierarchy variation · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
  file-system trees, class hierarchies.
- [mind-map-radial](references/mind-map-radial.md) — central topic + radial
  > When to choose this pattern · Scaffold · Radial layout math · Branch coloring · Edges convention · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
  branches; fishbone, concept maps.
- [timeline-diagram](references/timeline-diagram.md) — events on a time axis
  > When to choose this pattern · Scaffold (horizontal milestone timeline) · Vertical timeline variant · Even spacing vs proportional spacing · Event card styling · Connector style · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  (horizontal milestones or vertical history).
- [gantt-style-bars](references/gantt-style-bars.md) — task bars with
  > When to choose this pattern · Scaffold · Authoring math (bar position and width) · Dependency edges · Bar role tinting · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
  dependencies, today line, completion bars.

### Theming and animation
- [theming-presets](references/theming-presets.md) — `--vc-*` forwarding, the six
  > The `--vc-*` namespace · Tokens the diagram skill reads · Two-color derivation · Mermaid theming (the forwarding contract) · The six named theme presets · Anti-AI-slop
  named theme presets, the two-color color-mix derivation.
- [blueprint-grid-style](references/blueprint-grid-style.md) — the cyan-on-navy
  > When to choose the blueprint style · Authoring · The blueprint palette · The grid background · Stroke widths · Typography · Edge labels · Theme pairing rules · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  engineering preset, paired with `background: "grid"`.
- [hot-path-tinting](references/hot-path-tinting.md) — marking trust boundaries
  > When to choose this pattern · Implementation · When to use "accent" vs "danger" vs "warning" · Hot-path edges · DESIGN.md tokens consumed · Selection atom · Anti-patterns · Visual verification
  and critical paths with `role: "accent"` or `"danger"`.
- [flow-animation](references/flow-animation.md) — animated edges (`flow` /
  > Accessibility gate (mandatory) · Animated edges · Scroll-reveal · Motion-token consumption · Theme hot-swap
  `particle` / `pulse`) + scroll-reveal, with
  `prefers-reduced-motion` substitutes.

### Interaction patterns
- [dependency-chain-highlight](references/dependency-chain-highlight.md) — phase-graph's
  > When the chain-highlight interaction shines · The chain walk · Visual treatment · Edge treatment · Clearing the chain · Accessibility · Performance · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  click-to-highlight-a-chain logic.
- [click-step-detail-panel](references/click-step-detail-panel.md) — turn a diagram into
  > When to choose this pattern · The shape · The wiring · Active-node styling · Detail registration patterns · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  navigation; side panel updates on click.
- [teaching-diagram-perturbable](references/teaching-diagram-perturbable.md) — slider-driven
  > When to choose this pattern · The shape · Smooth transitions · The stats panel · Hover-linked glossary · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  recomputation for explorable concept diagrams.
- [group-collapse-handles](references/group-collapse-handles.md) — large-diagram
  > When to choose this pattern · Implementation · Collapsed-state geometry · Expanded state · CSS for the handle · JS wiring · Persistence · Accessibility · DESIGN.md tokens consumed · Selection atom · Variations · Anti-patterns · Visual verification
  ergonomics: collapse a group to one line.

### ASCII fallback
- [ascii-diagrams](references/ascii-diagrams.md) — the four ASCII styles and the
  > When to use ASCII · The authoring surface · The four styles · Alignment validator (build-time, NEVER shipped) · Page-expansion (the hard rule)
  build-time alignment validator workflow.
- [ascii-state-machine](references/ascii-state-machine.md) — state machines drawn in
  > When to choose ASCII · Authoring · Glyph vocabulary · Alignment validator (build-time) · State boxes · Transitions · Self-loops · Conditional transitions (guards) · DESIGN.md tokens consumed · Selection atoms · Compactness — when to switch styles · Anti-patterns · Visual verification · Cross-skill seam
  monospace.
- [ascii-tree-and-hierarchy](references/ascii-tree-and-hierarchy.md) — file-system trees,
  > When to choose ASCII trees · Authoring · Glyph vocabulary · Annotations · Alternative glyph styles · Indentation depth · Folder vs file distinction · Hot files / changed files highlighting · Authoring with the `tree` command · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
  package hierarchies, taxonomies.

### Cross-skill composition
- [composing-with-other-skills](references/composing-with-other-skills.md) — boundaries with
  > The boundary map · Composition patterns · What the diagram skill OWNS vs DELEGATES · When to compose vs when to hand off · Anti-patterns · Visual verification
  chart / code-highlight / interactive-controls / modal-comments
  / slide-decks / wireframe / animation / tables / typography.
