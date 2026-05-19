---
name: amvcp-diag-flow
description: "Process and flow diagrams — process-flow with numbered steps and decision branching, swimlanes (parallel actor lanes), decision trees, step-strip, scroll-reveal flow, fan-out/fan-in, data-flow (sync solid + async dashed), FIFO queue, animated edges. JSON scene-graph engine; every node/edge a click-to-select atom. Use for any step-by-step process, journey map, or decision pathway. Trigger with 'flowchart', 'process flow', 'swimlane', 'decision tree', 'journey map', 'fan-out', 'data flow'."
license: MIT
compatibility: "Browser (SVG + IntersectionObserver). Python 3.12+ renderer ships amvcp-diagram.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Diagram — Process & Flow

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling diagram skills:** [amvcp-diagram](../amvcp-diagram/SKILL.md) (router) · [amvcp-diag-flow](../amvcp-diag-flow/SKILL.md) · [amvcp-diag-architecture](../amvcp-diag-architecture/SKILL.md) · [amvcp-diag-time](../amvcp-diag-time/SKILL.md) · [amvcp-diag-network](../amvcp-diag-network/SKILL.md) · [amvcp-diag-ascii](../amvcp-diag-ascii/SKILL.md).

## Overview

Process / flow / journey diagrams rendered through the shared JSON scene-graph engine. Nine archetypes ship: **process-flow** (the headline preset — numbered step badges, decision branching), **swimlane** (parallel actor lanes), **decision-tree** (branching questions → outcomes), **step-strip** (compact horizontal 3-6 step pipeline), **numbered-flow-scroll-reveal** (vertical numbered flow with on-scroll connector draw), **fan-out / fan-in** (parallel processing topology), **data-flow** (sync solid + async dashed; hot-path tinting), **queue-diagram-fifo** (FIFO snapshot with head highlight), and **flow-animation** (animated edges + scroll-reveal with `prefers-reduced-motion` substitutes).

For shared engine fundamentals (scene-graph schema, node-type library, edge routing, validation, selection atoms, theming presets) see the parent router [amvcp-diagram](../amvcp-diagram/SKILL.md).

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) supplies the `--vc-*` tokens. The diagram module is **fully defensive** — every token read via `var(--vc-…, fallback)`.
- `amvcp-diagram.js` ships beside the output HTML (the renderer co-locates it).
- A Chromium browser with SVG + `IntersectionObserver`. A no-IntersectionObserver path reveals all content (never stuck invisible).

## Instructions

1. **Pick the archetype.** Linear step sequence → `process-flow` ([process-flow-preset](references/process-flow-preset.md)). Parallel actors → [swimlane-diagram](references/swimlane-diagram.md). Branching question → outcome → [decision-tree-diagram](references/decision-tree-diagram.md). Compact 3-6 step header → [step-strip-pattern](references/step-strip-pattern.md). Vertical flow that draws on scroll → [numbered-flow-scroll-reveal](references/numbered-flow-scroll-reveal.md). Parallel processing → [fan-out-fan-in](references/fan-out-fan-in.md). Sync + async paths → [data-flow-diagram](references/data-flow-diagram.md). FIFO buffer → [queue-diagram-fifo](references/queue-diagram-fifo.md). Edge animation → [flow-animation](references/flow-animation.md).
2. **Emit the scene graph** — one `<div class="ve-scene-graph">` with the matching `data-ve-scene-preset` and an embedded JSON scene-graph document.
3. **Tag node roles** — `role: "client" | "service" | "data" | "infra" | "external" | "accent"` semantically tints a node off the `--vc-*` palette.
4. **Decision branching** — process-flow's decision nodes auto-render labelled branches (`Yes` / `No` or any pair). Multiple branches use a decision-tree instead.
5. **Animate edges** — set `animate: "flow" | "particle" | "pulse"` on an edge for animated wire, or `data-ve-scene-reveal="scroll"` on the wrapper for draw-on reveal. Every animation ships a `prefers-reduced-motion` substitute.
6. **Step-strip** is the only pattern that is pure HTML/CSS (not the scene-graph) — used for compact 3-6 step headers.
7. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`.

Copy this checklist and track your progress:

- [ ] Archetype chosen (process-flow / swimlane / decision-tree / step-strip / ...)
- [ ] Scene-graph schema valid (parent router)
- [ ] Decision branches labelled (`Yes` / `No` or task-specific pair)
- [ ] Async/sync edges visually distinct (data-flow only)
- [ ] Animations ship `prefers-reduced-motion` substitute
- [ ] Selection atoms verified (every node/edge has `data-ve-id`)
- [ ] Light + dark theme verified (per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md))

## Output

Self-contained HTML: the diagram CSS is injected by `amvcp-diagram.js` on boot, the module ships beside the file, no CDN, no build step. SVG defaults to `width:100%; height:auto` — wide process flows extend the document; never an inner scrollbar. For dense/large flows, opt in to `data-ve-scene-viewport="<height>"` for pan/zoom/mini-map (see parent router).

## Error Handling

| Symptom | Fix |
|---|---|
| process-flow nodes don't auto-place | `preset != "process-flow"` — set the wrapper attribute, or supply explicit `x`/`y` coords. See [process-flow-preset](references/process-flow-preset.md). |
| Decision-tree branches collide | Re-balance the tree — collapse same-outcome branches; tree is currently too dense. See [decision-tree-diagram](references/decision-tree-diagram.md). |
| Swimlane handoff arrow ambiguous | Add explicit `from`/`to` lane labels and an `accent` role on the cross-lane edge. See [swimlane-diagram](references/swimlane-diagram.md). |
| Step-strip overflowing on mobile | Step-strip is for 3-6 steps. Above 6, switch to `process-flow` preset. See [step-strip-pattern](references/step-strip-pattern.md). |
| Animation runs under reduced-motion | Bug — every animation MUST honor the OS setting. The static substitute is mandatory. See [flow-animation](references/flow-animation.md). |

## Examples

**Input:** "show the data pipeline as a process flow — ingest, validate, persist."

**Output:** a `<div class="ve-scene-graph" data-ve-scene-preset="process-flow">` with an embedded JSON scene graph: a `start` node, a `process` node "Ingest" (role `service`), a `decision` node "Valid?", a `subprocess` node "Persist" (role `data`), and an `end` node. The runtime auto-places them into a left-to-right lane, numbers the process steps, and makes every node and edge a click-to-select atom. See [process-flow-preset](references/process-flow-preset.md) for the full pattern.

## Visual verification

Every visual change MUST be verified per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshot in light theme, then again in dark theme, then a third screenshot if the change involves interaction (click, scroll-reveal, animated edges).

## Modes

This skill supports `data-ve-mode="readonly"` only. Flow diagrams are explanatory visualizations — the per-element 3-state decision pill (R20-R23) does NOT apply to nodes and edges.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple flow diagrams coexist. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [process-flow-preset](references/process-flow-preset.md) — horizontal step lane, numbered badges, step ordering, decision branching.
  > When to choose this preset · Scaffold · Auto-placement rules · Step badges · Decision branching · Role tinting · DESIGN.md tokens consumed · Selection, comment, decision-mini · Animation patterns that compose with process-flow · Anti-patterns · Visual verification
- [swimlane-diagram](references/swimlane-diagram.md) — parallel actor lanes (horizontal or vertical), cross-lane handoffs.
  > When to choose this pattern · Scaffold (horizontal lanes, vertical flow) · Lane geometry conventions · Vertical lanes (horizontal flow) · Cross-lane edge styling · DESIGN.md tokens consumed · Selection atoms · Anti-patterns · Variation: with timeline header · Visual verification
- [decision-tree-diagram](references/decision-tree-diagram.md) — tree of decisions to outcomes, recommendation paths.
  > When to choose this pattern · Scaffold · Tree geometry conventions · Decision node labels · Outcome node convention · Edge labels (the answer to the question) · Routing convention · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
- [step-strip-pattern](references/step-strip-pattern.md) — compact shared-border horizontal pipeline for linear 3-6 step processes.
  > When to choose this pattern · Scaffold (HTML + CSS, not the scene-graph) · Variant: with arrow chevrons · Authoring contract · DESIGN.md tokens consumed · Responsive behavior · Variant: numbered prefix instead of "01 02 03" · When to upgrade to the full process-flow preset · Anti-patterns · Visual verification
- [numbered-flow-scroll-reveal](../amvcp-diagram/references/numbered-flow-scroll-reveal.md) — vertical numbered flow that draws its connectors as you scroll. (To be moved to this skill in batch 5b.)
- [fan-out-fan-in](../amvcp-diagram/references/fan-out-fan-in.md) — parallel processing topology: source -> shards -> merge. (To be moved to this skill in batch 5b.)
- [data-flow-diagram](../amvcp-diagram/references/data-flow-diagram.md) — sync solid + async dashed, hot-path tinting, conservation discipline. (To be moved to this skill in batch 5b.)
- [queue-diagram-fifo](../amvcp-diagram/references/queue-diagram-fifo.md) — FIFO queue snapshot with head highlight and direction indicator. (To be moved to this skill in batch 5b.)
- [flow-animation](../amvcp-diagram/references/flow-animation.md) — animated edges (`flow` / `particle` / `pulse`) + scroll-reveal, with `prefers-reduced-motion` substitutes. (To be moved to this skill in batch 5b.)
