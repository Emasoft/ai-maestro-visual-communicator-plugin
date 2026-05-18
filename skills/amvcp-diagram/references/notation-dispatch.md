# Notation dispatch — which renderer?

## Table of Contents

- [The decision tree](#the-decision-tree)
- [Why the scene-graph over hand-authored SVG](#why-the-scene-graph-over-hand-authored-svg)
- [What this skill deliberately does NOT do](#what-this-skill-deliberately-does-not-do)
- [Renderer ownership table](#renderer-ownership-table)

Read this BEFORE generating any diagram. Each request routes to exactly
one renderer. Picking the wrong one wastes effort and ships a worse
result.

## The decision tree

```
1. Is the data a series of numbers over an axis (bar / line / pie /
   scatter / timeseries — anything with a numeric axis)?
       -> the `chart` skill. STOP. The diagram skill renders no
          numeric-axis chart.

2. Do you need exact coordinates, engineering precision, or a fixed
   shape vocabulary — a process-flow step lane, a layered architecture
   canvas, a phase/dependency plan, a floor plan, a rack?
       -> the SVG scene-graph (this skill). Emit a JSON scene graph;
          the engine places, routes, and renders it.

3. Do you have nodes and edges but NO coordinates, 9+ nodes, and want
   automatic ranked/force/hierarchical layout?
       -> Graphviz / DOT (the `amvcp-graph-diagrams` skill, `.ve-graph`).

4. Is it a flowchart, sequence, ER, state, class, mindmap, gitgraph, or
   C4-as-flowchart with Mermaid's terse syntax?
       -> Mermaid (the `amvcp-graph-diagrams` skill).

5. Must the output survive with JavaScript disabled, be pasted into a
   terminal, or be a 3-second inline sketch?
       -> ASCII / Unicode (this skill — see ascii-diagrams.md).
```

## Why the scene-graph over hand-authored SVG

An LLM hand-drawing raw SVG produces misaligned shapes, broken edge
routing, and inconsistent sizing. A declarative JSON scene graph fixes
all of that: the engine owns geometry, snapping, routing, and theming;
the agent only describes *what* is in the diagram, never *how* to draw
it. As a bonus every node and edge becomes a `data-ve-id` selection
atom automatically.

## What this skill deliberately does NOT do

- **Numeric charts** — handed off to `chart`. The first branch of the
  tree is the hard stop.
- **D2 / PlantUML / Excalidraw** — forbidden CLI / binary / redundant.
  Mermaid and Graphviz cover their use cases in-browser.
- **Export toolbars (PNG / SVG / PDF)** — consolidated in the
  `interactive-control` skill, not bundled per-technique.
- **Canvas-based graphs** — Canvas pixels are not selectable; that
  breaks the `data-ve-id` SVG contract.

## Renderer ownership table

| Request shape | Renderer | Skill | Selection atoms |
|---|---|---|---|
| Process flow, architecture canvas, phase/dependency graph, floor plan, rack | SVG scene-graph | this skill | `diagram-node` / `diagram-edge` |
| No-JS / terminal / inline sketch | ASCII | this skill | one `ascii-diagram` per `<pre>` |
| Flowchart, sequence, ER, state, class, mindmap, C4 | Mermaid | `amvcp-graph-diagrams` | `mermaid-node` |
| Auto-layout graph, DAG, 9+ ranked nodes | Graphviz/DOT | `amvcp-graph-diagrams` | `graph-node` / `graph-edge` |
| Numeric chart | hand off | `chart` | `chart-point` |
