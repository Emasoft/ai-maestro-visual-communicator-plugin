---
name: amvcp-diag-architecture
description: "Architecture and dependency diagrams — layered architecture canvas (groups as tiers, bezier cross-layer edges), phase-graph (cards + dependencies + chain-highlight), C4 systems, dependency graphs. Cyan-on-navy blueprint engineering theme. JSON scene-graph engine; every node/edge a click-to-select atom. Use when drawing a layered system, a plan with dependencies, or a C4 diagram. Trigger with 'architecture diagram', 'phase graph', 'dependency graph', 'C4 diagram', 'blueprint diagram'."
license: MIT
compatibility: "Browser (SVG). Python 3.12+ renderer ships amvcp-diagram.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Diagram — Architecture & Dependencies

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling diagram skills:** [amvcp-diagram](../amvcp-diagram/SKILL.md) (router) · [amvcp-diag-flow](../amvcp-diag-flow/SKILL.md) · [amvcp-diag-architecture](../amvcp-diag-architecture/SKILL.md) · [amvcp-diag-time](../amvcp-diag-time/SKILL.md) · [amvcp-diag-network](../amvcp-diag-network/SKILL.md) · [amvcp-diag-ascii](../amvcp-diag-ascii/SKILL.md).

## Overview

Architecture and dependency diagrams rendered through the shared JSON scene-graph engine. Two placed presets: **architecture-canvas** (groups as layers/tiers, bezier edges across layers, ideal for C4-style layered systems) and **phase-graph** (cards with bezier dependency edges, longest-path layering, click-to-chain-highlight interaction for "what depends on this?"). Theme with the **blueprint** preset for cyan-on-navy engineering schematics. Every node and edge is a `data-ve-id` selection atom, themed off DESIGN.md `--vc-*` tokens.

For shared engine fundamentals (scene-graph schema, node-type library, edge routing, validation, selection atoms) see the parent router [amvcp-diagram](../amvcp-diagram/SKILL.md).

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) supplies the `--vc-*` tokens. The diagram module is **fully defensive** — every token read via `var(--vc-…, fallback)`.
- `amvcp-diagram.js` ships beside the output HTML (the renderer co-locates it).
- A Chromium browser with SVG support.

## Instructions

1. **Pick the preset.** Layered system / C4 diagram → `architecture-canvas` ([architecture-canvas-preset](references/architecture-canvas-preset.md)). Plan with phase dependencies → `phase-graph` ([phase-graph-preset](references/phase-graph-preset.md)).
2. **Emit the scene graph** — one `<div class="ve-scene-graph" data-ve-scene-preset="architecture-canvas">` (or `phase-graph`) with an embedded JSON scene-graph carrying `nodes`, `edges`, and `groups`.
3. **Group nodes into layers/tiers** — use the `groups` array. For `architecture-canvas`, each group is a horizontal (or vertical) layer; the preset stacks them. For `phase-graph`, groups become visual containers around related phases.
4. **Tag node roles** — `role: "client" | "service" | "data" | "infra" | "external" | "accent"` semantically tints a node off the `--vc-*` palette.
5. **Theme** — drop `data-ve-scene-theme="blueprint"` on the wrapper for a cyan-on-navy engineering style with grid background ([blueprint-grid-style](references/blueprint-grid-style.md)). Other available themes: `terminal`, `high-contrast`, `hand-drawn`, `dark`, `default`.
6. **Interact** — `phase-graph` ships automatic click-to-highlight-a-dependency-chain ([dependency-chain-highlight](references/dependency-chain-highlight.md)). For navigable architecture diagrams, pair with `click-step-detail-panel` (in parent router).
7. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`.

Copy this checklist and track your progress:

- [ ] Preset chosen (architecture-canvas / phase-graph)
- [ ] Layers/tiers expressed as `groups`
- [ ] Roles assigned for semantic tinting
- [ ] If blueprint theme: grid background, cyan-on-navy palette verified
- [ ] Phase-graph: chain-highlight tested (click → all dependents tint)
- [ ] Selection atoms verified (every node/edge has `data-ve-id`)
- [ ] Light + dark theme verified (per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md))

## Output

Self-contained HTML: the diagram CSS is injected by `amvcp-diagram.js` on boot, the module ships beside the file, no CDN, no build step. SVG defaults to `width:100%; height:auto` — wide architecture canvases extend the document; never an inner scrollbar. For dense/large architecture diagrams, opt in to `data-ve-scene-viewport="<height>"` for a pan/zoom/mini-map surface (see parent router).

## Error Handling

| Symptom | Fix |
|---|---|
| Layers overlap | Group geometry overflowed — increase `width`/`height` on the wrapper, or reduce nodes per layer. See [architecture-canvas-preset](references/architecture-canvas-preset.md). |
| Phase-graph nodes pile in one column | Longest-path layering needs at least one edge per pair to differentiate phases; add the missing dependencies. See [phase-graph-preset](references/phase-graph-preset.md). |
| Chain-highlight doesn't fire on click | `amvcp-runtime.js` not loaded; the module still highlights but click-to-POST needs the runtime. |
| Blueprint theme bleeds onto other elements | The theme override is scoped to the `.ve-scene-graph` wrapper, not the page. Confirm `data-ve-scene-theme` is on the wrapper only. |
| Cycles in phase-graph break layering | The validator flags cycles. Either remove the cycle, or express the cyclic pair as a single composite phase. |

## Examples

**Input:** "show the data-ingestion architecture — ingest layer, processing layer, storage layer, query layer, with the bezier cross-layer edges."

**Output:** a `<div class="ve-scene-graph" data-ve-scene-preset="architecture-canvas">` with 4 horizontal groups (Ingest / Processing / Storage / Query), nodes in each group (Kafka in Ingest, Spark+Flink in Processing, Iceberg+Postgres in Storage, Trino in Query), and bezier edges from each upstream service to its downstream consumers. Theme it with `data-ve-scene-theme="blueprint"` for a cyan-on-navy engineering look.

See [architecture-canvas-preset](references/architecture-canvas-preset.md) for the full layer geometry contract.

**Input:** "show our quarterly plan as a phase graph — discovery through release."

**Output:** a `<div class="ve-scene-graph" data-ve-scene-preset="phase-graph">` with `card` nodes for each phase carrying title + duration, bezier dependency edges, and the automatic chain-highlight interaction. See [phase-graph-preset](references/phase-graph-preset.md) + [dependency-chain-highlight](references/dependency-chain-highlight.md).

## Visual verification

Every visual change MUST be verified per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshot in light theme, then again in dark theme, then a third screenshot mid-interaction (chain-highlight or click-step navigation).

## Modes

This skill supports `data-ve-mode="readonly"` only. Architecture diagrams are explanatory visualizations — the per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composes with every other amvcp-* skill on the same page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [architecture-canvas-preset](references/architecture-canvas-preset.md) — layered system, groups as layers, bezier cross-layer edges.
  > When to choose this preset · Scaffold · Group geometry · The grid background · Bezier edges across layers · Async / sync visual distinction · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Variation: vertical orientation · Theme pairings · Visual verification
- [phase-graph-preset](references/phase-graph-preset.md) — cards + bezier dependencies, longest-path layering, chain interaction.
  > When to choose this preset · Scaffold · Card geometry · Auto-placement (longest-path layering) · Chain-highlight interaction · Edge styling under chain mode · Cycles · DESIGN.md tokens consumed · Selection atoms · Theming patterns · Anti-patterns · Composing with other patterns · Visual verification
- [dependency-chain-highlight](references/dependency-chain-highlight.md) — phase-graph's click-to-highlight-a-chain logic, with accessibility and performance notes.
  > When the chain-highlight interaction shines · The chain walk · Visual treatment · Edge treatment · Clearing the chain · Accessibility · Performance · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
- [blueprint-grid-style](references/blueprint-grid-style.md) — the cyan-on-navy engineering preset, paired with `background: "grid"`.
  > When to choose the blueprint style · Authoring · The blueprint palette · The grid background · Stroke widths · Typography · Edge labels · Theme pairing rules · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
