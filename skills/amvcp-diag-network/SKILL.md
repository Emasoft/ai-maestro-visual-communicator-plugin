---
name: amvcp-diag-network
description: "Network and hierarchy diagrams — sankey proportional flows, radial mind maps, top-down org/file-system/class tree hierarchies. JSON scene-graph engine, themed off DESIGN.md `--vc-*` tokens, every node/edge a click-to-select atom. Use when visualizing magnitude bands of flow, branching concept maps, or tree hierarchies that fit one screen. Trigger with 'sankey', 'mind map', 'fishbone', 'concept map', 'tree diagram', 'org chart', 'file tree', 'class hierarchy'."
license: MIT
compatibility: "Browser (SVG). Python 3.12+ renderer ships amvcp-diagram.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Diagram — Network & Hierarchy

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling diagram skills:** [amvcp-diagram](../amvcp-diagram/SKILL.md) (router) · [amvcp-diag-flow](../amvcp-diag-flow/SKILL.md) · [amvcp-diag-architecture](../amvcp-diag-architecture/SKILL.md) · [amvcp-diag-time](../amvcp-diag-time/SKILL.md) · [amvcp-diag-network](../amvcp-diag-network/SKILL.md) · [amvcp-diag-ascii](../amvcp-diag-ascii/SKILL.md).

## Overview

Network and hierarchy diagrams rendered through the shared JSON scene-graph engine: **sankey** (proportional flow bands with conservation discipline), **mind map** (central topic + radial branches; fishbone and concept-map variants), and **tree hierarchy** (top-down org charts, file-system trees, class hierarchies). Every node and edge is a `data-ve-id` selection atom, themed off DESIGN.md `--vc-*` tokens, and theme-correct in both light and dark for free.

For the shared engine fundamentals (scene-graph schema, node-type library, edge routing, validation, selection atoms, theming presets) see the parent router [amvcp-diagram](../amvcp-diagram/SKILL.md).

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) supplies the `--vc-*` tokens. The diagram module is **fully defensive** — it renders correctly with no DESIGN.md, every token read via `var(--vc-…, fallback)`.
- `amvcp-diagram.js` ships beside the output HTML (the renderer co-locates it).
- A Chromium browser with SVG support.

## Instructions

1. **Pick an archetype.** Proportional flow bands → see [sankey-flow-diagram](references/sankey-flow-diagram.md). Central topic with radial branches → see [mind-map-radial](references/mind-map-radial.md). Top-down hierarchy → see [tree-hierarchy-diagram](references/tree-hierarchy-diagram.md).
  > When to choose this pattern · Scaffold · Encoding magnitude in band width · Coloring bands by source · Conservation check (the integrity rule) · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
2. **Emit the scene graph** — one `<div class="ve-scene-graph">` with an embedded `<script type="application/json">` carrying the `{version, preset, width, height, nodes, edges}` document.
3. **For sankey:** enforce conservation — sum of band widths leaving a node must equal the sum entering it. The validator flags any imbalance.
4. **For mind map:** central node is the root; branches radiate at evenly-spaced angles. Tint branches by category via `role`.
5. **For tree:** layout top-down by default. File-system and class-hierarchy variants share the same scaffold with different node-type choices.
6. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`.

Copy this checklist and track your progress:

- [ ] Archetype chosen (sankey / mind-map / tree)
- [ ] Scene-graph schema valid (see parent router)
- [ ] Sankey: conservation check passes
- [ ] Mind-map: branches evenly spaced
- [ ] Tree: hierarchy is acyclic (no back-edges)
- [ ] Selection atoms verified (every node/edge has `data-ve-id`)
- [ ] Light + dark theme verified (per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md))

## Output

Self-contained HTML: the diagram CSS is injected by `amvcp-diagram.js` on boot, the module ships beside the file, no CDN, no build step. SVG defaults to `width:100%; height:auto` so wide diagrams extend the document — there is never an inner scrollbar. Opt in to a fixed-height pan/zoom viewport via `data-ve-scene-viewport="<height>"` (see parent router).

## Error Handling

| Symptom | Fix |
|---|---|
| Sankey bands don't sum cleanly | Conservation check failed — every flow leaving a node must equal flow entering. See [sankey-flow-diagram](references/sankey-flow-diagram.md). |
| Mind-map branches overlap | Too many branches at one level — split the topic, or use a tree-hierarchy instead. See [mind-map-radial](references/mind-map-radial.md). |
| Tree has cycles | A hierarchy is by definition acyclic — convert cycles into "see also" hints. Use [phase-graph-preset](../amvcp-diag-architecture/references/phase-graph-preset.md) if you genuinely need DAG with shared dependencies. |
| Diagram not selectable | `amvcp-runtime.js` not loaded; the module injects its own hover/select CSS so a standalone page still shows the affordance, but the click-to-POST wiring needs the runtime. |
| Diagram graph too dense | Try the `data-ve-scene-viewport` mode (pan + zoom + mini-map). See `viewport-scaffold` in parent router. |

The cross-skill `phase-graph-preset` reference above covers:
> When to choose this preset · Scaffold and card geometry · Auto-placement, chain-highlight, and cycles · DESIGN.md tokens consumed and selection atoms · Theming patterns and anti-patterns · Composing with other patterns and visual verification

## Examples

**Input:** "show our user-acquisition funnel as a sankey — top-of-funnel split across 3 channels, two conversion stages."

**Output:**

```html
<div class="ve-scene-graph" data-ve-scene-preset="free">
  <script type="application/json">
  {
    "version": 1, "preset": "free", "width": 800, "height": 320,
    "nodes": [
      {"id":"source","type":"card","label":"Top of funnel","x":0,"y":120,"width":120,"height":80},
      {"id":"organic","type":"card","label":"Organic","x":240,"y":40,"width":120,"height":60,"role":"service"},
      {"id":"paid","type":"card","label":"Paid","x":240,"y":120,"width":120,"height":60,"role":"accent"},
      {"id":"referral","type":"card","label":"Referral","x":240,"y":220,"width":120,"height":60,"role":"data"},
      {"id":"convert","type":"card","label":"Converted","x":640,"y":120,"width":120,"height":80}
    ],
    "edges": [
      {"from":"source","to":"organic","label":"45%"},
      {"from":"source","to":"paid","label":"35%"},
      {"from":"source","to":"referral","label":"20%"},
      {"from":"organic","to":"convert","label":"12%"},
      {"from":"paid","to":"convert","label":"6%"},
      {"from":"referral","to":"convert","label":"4%"}
    ]
  }
  </script>
</div>
```

See [sankey-flow-diagram](references/sankey-flow-diagram.md) for proportional band-width encoding and conservation discipline.

## Visual verification

Every visual change MUST be verified per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshot in light theme, then again in dark theme, then a third screenshot if the change involves interaction (click, hover).

## Modes

This skill supports `data-ve-mode="readonly"` only. Network/hierarchy diagrams are explanatory visualizations — the per-element 3-state decision pill (R20-R23) does NOT apply to nodes and edges. When asking the user to choose between alternatives, render them as `amvcp-tables` or `amvcp-choice-tables`.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple diagrams (different presets) coexist independently. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [sankey-flow-diagram](references/sankey-flow-diagram.md) — proportional flow bands, conservation, source-tinted bands.
  > When to choose this pattern · Scaffold · Encoding magnitude in band width · Coloring bands by source · Conservation check (the integrity rule) · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
- [mind-map-radial](references/mind-map-radial.md) — central topic + radial branches; fishbone, concept maps.
  > When to choose this pattern · Scaffold · Radial layout math · Branch coloring · Edges convention · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
- [tree-hierarchy-diagram](references/tree-hierarchy-diagram.md) — org charts, file-system trees, class hierarchies.
  > When to choose this pattern · Scaffold (top-down org-chart style) · Tree layout conventions · Routing convention · File-system tree variation · Class hierarchy variation · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
