---
name: amvcp-diag-time
description: "Time-axis diagrams — sequence (actors + message arrows + activation bars), state machine (states + guarded transitions + self-loops), timeline (horizontal milestones or vertical history), Gantt bars (tasks + dependencies + today line). JSON scene-graph engine, themed off DESIGN.md `--vc-*`. Use when scaffolding anything that varies along a time or state axis. Trigger with 'sequence diagram', 'state machine', 'state diagram', 'timeline', 'Gantt', 'schedule', 'roadmap'."
license: MIT
compatibility: "Browser (SVG). Python 3.12+ renderer ships amvcp-diagram.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Diagram — Time & State Axis

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling diagram skills:** [amvcp-diagram](../amvcp-diagram/SKILL.md) (router) · [amvcp-diag-flow](../amvcp-diag-flow/SKILL.md) · [amvcp-diag-architecture](../amvcp-diag-architecture/SKILL.md) · [amvcp-diag-time](../amvcp-diag-time/SKILL.md) · [amvcp-diag-network](../amvcp-diag-network/SKILL.md) · [amvcp-diag-ascii](../amvcp-diag-ascii/SKILL.md).

## Overview

Diagrams whose primary axis is **time** or **state**. Four archetypes share the JSON scene-graph engine: **sequence** (actors with message arrows and activation bars), **state machine** (states with guarded transitions and self-loops), **timeline** (horizontal milestone strip or vertical history), and **Gantt** (task bars with dependencies, today line, completion percentages). Every node and edge is a `data-ve-id` selection atom; themed off DESIGN.md `--vc-*` tokens.

For the shared engine fundamentals (scene-graph schema, node-type library, edge routing, validation, selection atoms, theming presets) see the parent router [amvcp-diagram](../amvcp-diagram/SKILL.md).

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) supplies the `--vc-*` tokens. The diagram module is **fully defensive** — every token read via `var(--vc-…, fallback)`.
- `amvcp-diagram.js` ships beside the output HTML (the renderer co-locates it).
- A Chromium browser with SVG support.

## Instructions

1. **Pick the archetype.** Inter-actor message exchange → see [sequence-diagram-svg](references/sequence-diagram-svg.md). State + event vocabulary → see [state-machine-diagram](references/state-machine-diagram.md). Events on a calendar axis → see [timeline-diagram](references/timeline-diagram.md). Task bars with start/end/dependencies → see [gantt-style-bars](references/gantt-style-bars.md).
2. **Emit the scene graph** — one `<div class="ve-scene-graph" data-ve-scene-preset="free">` with an embedded JSON scene-graph. Time-axis diagrams typically use `preset: "free"` because the geometry is intrinsically positional.
3. **For sequence:** use vertical lanes per actor; messages are arrows crossing lanes top-to-bottom. Activation bars sit on the actor lane during processing.
4. **For state machine:** every transition labels `[event]/[guard]`. Self-loops use the `loop` edge route. Guards in square brackets.
5. **For timeline:** events on a single line, evenly-spaced OR proportionally-spaced. Mind the trade-off (see ref).
6. **For Gantt:** the X axis is time; bar X = startDate, width = duration. Dependencies are arrows between bars.
7. Open via `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`.

Copy this checklist and track your progress:

- [ ] Archetype chosen (sequence / state / timeline / Gantt)
- [ ] Scene-graph schema valid (parent router)
- [ ] Sequence: lane assignment correct
- [ ] State machine: events labelled; guards in square brackets
- [ ] Timeline: spacing decision documented (even vs proportional)
- [ ] Gantt: dates are valid; today line position computed
- [ ] Selection atoms verified (every node/edge has `data-ve-id`)
- [ ] Light + dark theme verified (per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md))

## Output

Self-contained HTML: the diagram CSS is injected by `amvcp-diagram.js` on boot, the module ships beside the file, no CDN, no build step. SVG defaults to `width:100%; height:auto` — wide time-axis diagrams extend the document horizontally; never an inner scrollbar. For Gantt charts spanning many months/quarters, opt in to `data-ve-scene-viewport="<height>"` (see parent router).

## Error Handling

| Symptom | Fix |
|---|---|
| Sequence arrows tangle | Re-order actors to minimize crossings; this is a manual decision — see [sequence-diagram-svg](references/sequence-diagram-svg.md). |
| State machine has unreachable states | The validator flags isolated nodes; verify every state is the target of some transition (except the initial). |
| Gantt today line missing | `today` field on the scene-graph omitted or out of range. See [gantt-style-bars](references/gantt-style-bars.md). |
| Timeline cramped | Switch to vertical orientation OR add `data-ve-scene-viewport` for pan. |
| Mermaid would be simpler | Sequence + state-machine can also be drawn with Mermaid via `amvcp-graph-diagrams`. Use the SVG path when you need custom geometry; use Mermaid for the terse declarative form. See `sequence-diagram-svg.md` "When you should just use Mermaid". |

## Examples

**Input:** "show the OAuth handshake as a sequence diagram — User, App, AuthServer, ResourceServer."

**Output:** a `<div class="ve-scene-graph" data-ve-scene-preset="free">` with 4 actor lanes (vertical), 6 message arrows (Authorize → Code → Token-request → Token → Resource-request → Resource), and activation bars on AuthServer and ResourceServer during their respective windows.

See [sequence-diagram-svg](references/sequence-diagram-svg.md) for actor-lane geometry, message-arrow conventions, and activation-bar wiring.

## Visual verification

Every visual change MUST be verified per [`amvcp-self-debug-rules`](../amvcp-self-debug-rules/SKILL.md) — dev-browser screenshot in light theme, then again in dark theme. For interactive diagrams (state-machine click-to-trace, Gantt drag-to-reschedule), a third screenshot mid-interaction.

## Modes

This skill supports `data-ve-mode="readonly"` only. Time-axis diagrams are explanatory visualizations; the per-element 3-state decision pill (R20-R23) does NOT apply.

## Composability

Composes with every other amvcp-* skill on the same page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [sequence-diagram-svg](references/sequence-diagram-svg.md) — native-SVG sequence diagram (when Mermaid isn't enough).
  > When to choose SVG over Mermaid · Scaffold · Message arrows · Activation bars · Notes / annotations · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · When you should just use Mermaid
- [state-machine-diagram](references/state-machine-diagram.md) — states + transitions, self-loops, guards, composite states.
  > When to choose this pattern · Scaffold · State node convention · Transition labels (the event vocabulary) · Self-loops (the same state on different events) · Multiple outgoing edges from one state · Guards / conditions · Actions on entry / exit · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
- [timeline-diagram](references/timeline-diagram.md) — events on a time axis (horizontal milestones or vertical history).
  > When to choose this pattern · Scaffold (horizontal milestone timeline) · Vertical timeline variant · Even spacing vs proportional spacing · Event card styling · Connector style · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification
- [gantt-style-bars](references/gantt-style-bars.md) — task bars with dependencies, today line, completion bars.
  > When to choose this pattern · Scaffold · Authoring math (bar position and width) · Dependency edges · Bar role tinting · DESIGN.md tokens consumed · Selection atoms · Variations · Anti-patterns · Visual verification · Cross-skill seam
