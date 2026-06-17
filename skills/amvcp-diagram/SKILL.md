---
name: amvcp-diagram
description: "Router skill for themed, selectable HTML diagrams from a JSON scene graph. Routes to 5 sibling skills (flow / architecture / time / network / ASCII) and owns the shared scene-graph engine, theming, and interaction primitives. Use when the user asks for any diagram. Trigger with 'diagram', 'flowchart', 'architecture diagram', 'sequence', 'state diagram', 'sankey', 'swimlane', 'mind map', 'timeline', 'gantt', 'ASCII diagram'."
license: MIT
compatibility: "Browser (SVG + IntersectionObserver). Python 3.12+ renderer ships amvcp-diagram.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Diagram — Router

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Router for diagram authoring. The diagram family is split into **5 focused sibling skills** along diagram-family cleavage planes (so each child skill stays small and the agent can load only what it needs), plus **this router** which owns the shared scene-graph engine fundamentals.

| Request shape | Sibling skill |
|---|---|
| Process flow, swimlane, decision tree, step-by-step, journey map, fan-out/fan-in, data-flow, FIFO queue, animated edges | [amvcp-diag-flow](../amvcp-diag-flow/SKILL.md) |
| Architecture canvas, phase-graph, layered architecture, dependency graph, C4 diagram, blueprint engineering theme | [amvcp-diag-architecture](../amvcp-diag-architecture/SKILL.md) |
| Sequence diagram, state machine, timeline, Gantt, schedule | [amvcp-diag-time](../amvcp-diag-time/SKILL.md) |
| Sankey proportional flow, mind map, fishbone, concept map, tree hierarchy, org chart, file-system tree | [amvcp-diag-network](../amvcp-diag-network/SKILL.md) |
| ASCII / Unicode plaintext diagrams (no-JS, terminal, code-comment fallback) | [amvcp-diag-ascii](../amvcp-diag-ascii/SKILL.md) |

This router owns:
- The **JSON scene-graph engine** (schema, node types, edge routing, validation).
- The **theming layer** (`--vc-*` forwarding, the 6 named theme presets, two-color derivation).
- The **selection / interaction primitives** (selection-atom payload, hover CSS, click-step navigation, perturbable teaching diagrams, group collapse, viewport scaffold).
- The **escape-hatch `free` preset** (used by sequence, sankey, gantt, racks, floor plans — anywhere coordinates are intrinsic).
- The **renderer-routing decision tree** (when to use scene-graph vs Mermaid vs Graphviz vs chart skill).

When in doubt, look up the table above and load the matching sibling. Then come back here for the shared fundamentals.

## When to choose a sibling vs this router

| You want | Load |
|---|---|
| A scene-graph for ANY archetype | the matching sibling skill (table above) |
| To understand the scene-graph schema, validation, or node-type library | this router + [scene-graph-schema](references/scene-graph-schema.md) |
| To theme any diagram (light/dark, blueprint, terminal, hand-drawn) | this router + [theming-presets](references/theming-presets.md) |
| To add a comment thread, click-to-detail panel, or teaching slider to a diagram | this router + [selection-atom-payload](references/selection-atom-payload.md) and the interaction patterns below |
| To use the `free` preset for explicit-coordinate geometry (racks, floor plans, sequence lanes, sankey columns) | this router + [free-preset-geometry](references/free-preset-geometry.md) |

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) supplies the `--vc-*` tokens. The diagram module is **fully defensive** — it renders correctly with NO DESIGN.md, every token read via `var(--vc-…, fallback)`.
- `amvcp-diagram.js` ships beside the output HTML (the renderer co-locates it).
- A Chromium browser with SVG + `IntersectionObserver`. A no-IntersectionObserver path reveals all content (never stuck invisible).

## Instructions

1. **Route first.** Match the user's request against the table above. Load the matching sibling SKILL.md.
2. **Pick a preset** in the sibling. Each sibling owns its preset-specific guidance.
3. **Use this router's references for shared fundamentals** — the scene-graph schema, node-type library, edge routing, validation, theming, selection atoms, interaction patterns, viewport scaffold.
4. **Emit the scene graph** — one `<div class="ve-scene-graph">` with an embedded `<script type="application/json">` carrying the `{version, preset, width, height, nodes, edges}` document.
5. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`.

Copy this checklist and track your progress:

- [ ] Sibling skill chosen (flow / architecture / time / network / ASCII)
- [ ] Scene-graph schema valid (see [scene-graph-schema](references/scene-graph-schema.md))
- [ ] Theme verified in BOTH light and dark (per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md))
- [ ] Selection atoms present (every node/edge has `data-ve-id`)
- [ ] Interaction tested (if click-step / chain-highlight / teaching slider)

## Output

Self-contained HTML: the diagram CSS is injected by `amvcp-diagram.js` on boot, the module ships beside the file, no CDN, no build step. The scene-graph SVG defaults to `width:100%; height:auto` so a wide diagram extends the document — there is never an inner scrollbar. Opt in to `data-ve-scene-viewport="<height>"` on the host for a fixed-height pannable / zoomable surface with mini-map; see [viewport-scaffold](references/viewport-scaffold.md).

## Error Handling

- **Red error box in the figure** → the scene-graph JSON is malformed; the box `title` carries the precise reason. See [validation-error-handling](references/validation-error-handling.md).
- **A node has no x/y in a `free` scene** → `free` has no auto-layout; supply explicit coordinates or switch to a placed preset. See [free-preset-geometry](references/free-preset-geometry.md).
- **Diagram not selectable** → `amvcp-runtime.js` not loaded; the module injects its own hover/select CSS so a standalone page still shows the affordance, but the click-to-POST wiring needs the runtime.
- **Animation ignored** → the OS `prefers-reduced-motion` is on (intended — the static substitute is shown).

## Examples

**Input:** "show the data pipeline as a process flow — ingest, validate, persist."

**Output:** Route to [amvcp-diag-flow](../amvcp-diag-flow/SKILL.md), then emit a process-flow scene graph there. See that skill's Examples section.

**Input:** "show our quarterly plan as a phase graph — discovery through release."

**Output:** Route to [amvcp-diag-architecture](../amvcp-diag-architecture/SKILL.md). See that skill's Examples section.

**Input:** "show the OAuth handshake as a sequence diagram."

**Output:** Route to [amvcp-diag-time](../amvcp-diag-time/SKILL.md). See that skill's Examples section.

## Visual verification

Every visual change MUST be verified per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshot in light theme, then again in dark theme. For interactive diagrams (chain-highlight, click-step, teaching slider), a third screenshot mid-interaction.

## Modes

This skill supports `data-ve-mode="readonly"` only. Diagrams are explanatory visualizations — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple diagrams (different presets, different siblings) coexist independently. The only exclusive skill is the overlay-runtime (R24).

## Resources

### Renderer routing
- [notation-dispatch](references/notation-dispatch.md) — which renderer? the decision tree.
  > The decision tree · Why the scene-graph over hand-authored SVG · What this skill deliberately does NOT do · Renderer ownership table

### Scene-graph engine fundamentals (shared by all sibling skills)
- [scene-graph-schema](references/scene-graph-schema.md) — the JSON scene-graph contract.
  > The authoring surface · SceneGraph · Node · Edge · Group · Validation (all fail-fast) · Node-type library · Role -> token fill map · The three presets · Auto-placement (presets other than `free`) · Edge routing · Selection
- [node-type-library](references/node-type-library.md) — the seven node types, when to pick each, role-tinting per type.
  > The seven node types · `start` and `end` · `process` · `decision` · `subprocess` · `external` · `card` · Authoring shape correctness · Size customization · Role tinting per type · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Visual verification
- [diagram-legend](references/diagram-legend.md) — the key that decodes shapes / role tints / edge styles; a chip row mirroring the node-type and role vocabulary, themed off the same `--vc-*` tokens.
  - When a diagram needs a legend
  - The chip-row markup
  - The CSS
  - Shape chips — mirroring the node-type vocabulary
  - Role chips — mirroring the role tints
  - Edge chips — mirroring edge styles
  - DESIGN.md tokens consumed
  - Composition
  - Anti-patterns
  - Visual verification
- [edge-routing-strategies](references/edge-routing-strategies.md) — `straight` / `ortho` / `bezier` / `loop`; styles; arrowheads; hit-area twins.
  > The four routes · `straight` — the bare line · `ortho` — the workhorse · `bezier` — the curve · `loop` — the back-edge · Edge anchors · Edge labels · Edge styles · Arrowheads · The 14px hit-area twin · DESIGN.md tokens consumed · Anti-patterns · Visual verification
- [arrow-marker-defs](references/arrow-marker-defs.md) — marker `<defs>`, the 3-marker scheme, `context-stroke`.
  > The single-marker base case · Why scene-scoped marker ids matter · Multi-marker edge semantics (3-marker pattern) · When to extend the scheme · Marker geometry · Marker units and stroke-width scaling · `refX` / `refY` — where the marker anchors · Bidirectional edges · Animated arrowheads · DESIGN.md tokens consumed · Anti-patterns · Visual verification
- [group-container-rects](references/group-container-rects.md) — group rectangles for layers / swimlanes / namespaces / callouts.
  > What a group is (and isn't) · Group schema · Group rendering · Group tint vs node tint · Use cases · Group containment · Nested groups · Selection atoms · DESIGN.md tokens consumed · Anti-patterns · Optional: the group-handle UI · Visual verification
- [coordinate-snap-grid](references/coordinate-snap-grid.md) — the 4-unit grid, when to override, snapping interaction with auto-place.
  > The default 4-unit grid · Overriding the grid step · The visible grid background · When to show the grid vs hide it · How snapping interacts with auto-place · Sub-grid offsets (for centering text within nodes) · The grid is structural, not themed · DESIGN.md tokens consumed (by the visible grid) · Snapping width and height (not just x and y) · Grid coordinate vs CSS pixel · Snapping and re-render · Anti-patterns · Visual verification
- [validation-error-handling](references/validation-error-handling.md) — fail-fast errors, the red error box, common mistakes.
  > What validation catches · The red error box · Why fail-fast (not fallback) · Common errors and fixes · Per-engine error reporting · Console logging · DESIGN.md tokens consumed (by the error box) · Selection atoms · Test pattern · Anti-patterns · Visual verification
- [selection-atom-payload](references/selection-atom-payload.md) — exact `data-ve-id` / `data-ve-data` contract, hover CSS, multi-select.
  > The DOM contract · Payload schemas · ID generation · Why `nodeId` not `data-ve-id` is the stable identifier · Click POST payload · Hover treatment (in CSS, not the payload) · Hit-area twins for thin edges · Group label is also clickable · Multi-select (Shift-click) · Decision-mini attachment · Comment threading · DESIGN.md tokens consumed (by the selection CSS) · Anti-patterns · Visual verification

### Escape-hatch preset (used by sequence, sankey, gantt, racks, floor plans)
- [free-preset-geometry](references/free-preset-geometry.md) — the escape hatch for floor plans, racks, schematics; explicit coordinates.
  > When to choose `free` · Scaffold (a server rack) · Coordinate space · Grid snapping · Background grid · Mixing auto-placed and explicit nodes · Edges in a `free` diagram · Groups as containers · DESIGN.md tokens consumed · Selection atoms · Use-case archetypes · Anti-patterns · Visual verification

### Theming (shared)
- [theming-presets](references/theming-presets.md) — `--vc-*` forwarding, the six named theme presets, the two-color color-mix derivation.
  > The `--vc-*` namespace · Tokens the diagram skill reads · Two-color derivation · Mermaid theming (the forwarding contract) · The six named theme presets · Anti-AI-slop
- [hot-path-tinting](references/hot-path-tinting.md) — marking trust boundaries and critical paths with `role: "accent"` or `"danger"`.
  > When to choose this pattern · Implementation · When to use "accent" vs "danger" vs "warning" · Hot-path edges · DESIGN.md tokens consumed · Selection atom · Anti-patterns · Visual verification

### Interaction patterns (shared)
- [click-step-detail-panel](references/click-step-detail-panel.md) — turn a diagram into navigation; side panel updates on click.
  > When to choose this pattern · The shape · The wiring · Active-node styling · Detail registration patterns · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
- [teaching-diagram-perturbable](references/teaching-diagram-perturbable.md) — slider-driven recomputation for explorable concept diagrams.
  > When to choose this pattern · The shape · Smooth transitions · The stats panel · Hover-linked glossary · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
- [group-collapse-handles](references/group-collapse-handles.md) — large-diagram ergonomics: collapse a group to one line.
  > When to choose this pattern · Implementation · Collapsed-state geometry · Expanded state · CSS for the handle · JS wiring · Persistence · Accessibility · DESIGN.md tokens consumed · Selection atom · Variations · Anti-patterns · Visual verification
- [viewport-scaffold](references/viewport-scaffold.md) — opt-in `data-ve-scene-viewport` mode for dense/large diagrams: fixed-height stage with pan, mouse-wheel zoom, toolbar, and mini-map.
  > Why this exists (and why it's allowed) · How to enable · What you get · Comment-handle adjustment · Theme-token usage · When NOT to use viewport mode · Reference test cases

### Cross-skill composition
- [composing-with-other-skills](references/composing-with-other-skills.md) — boundaries with chart / code-highlight / interactive-controls / modal-comments / slide-decks / wireframe / animation / tables / typography.
  > The boundary map · Composition patterns · What the diagram skill OWNS vs DELEGATES · When to compose vs when to hand off · Anti-patterns · Visual verification
