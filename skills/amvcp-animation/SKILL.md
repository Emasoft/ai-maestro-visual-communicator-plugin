---
name: amvcp-animation
description: "Router skill for the animation surface — animation split into 5 focused siblings (foundation, entry+scroll, ambient+hover, perf, handoffs). Use when the user wants ANY animation task (entrance, scroll reveal, counter, parallax, hover lift, skeleton, loop-pause, slide transitions) to route to the right sibling. Trigger with 'animate', 'entrance', 'scroll reveal', 'stagger', 'count up', 'skeleton', 'parallax', 'tilt', 'hover lift', 'reduce motion', 'spring', 'loading'."
license: MIT
compatibility: "Browser (IntersectionObserver). amvcp-animation.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Animation (Router)

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 visual categories.

## Overview

This is the **router** for the animation surface. The animation contract was split into 5 focused siblings so each sibling's embedded TOC fits naturally and progressive discovery works without per-link contortion. The router itself emits no CSS/JS — pick the right sibling per the table below.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- `amvcp-animation.js` loaded next to the HTML.
- A modern browser. No npm dependency.

## Instructions

1. Match the user's animation need to a row in the routing matrix below.
2. Load the matched sibling SKILL.md (the foundation sibling is always required as substrate; the others compose).
3. Follow that sibling's Instructions; come back here only to route a second concern.

## Output

The output is owned by the sibling skill. This router emits nothing.

## Error Handling

| Symptom | Fix |
|---|---|
| Don't know which sibling owns my need | Re-read the routing matrix; default to [foundation](../amvcp-anim-foundation/SKILL.md) when uncertain. |
| Need spans multiple siblings | Compose — load foundation first, then add entry-scroll / ambient-hover / perf / handoffs as needed. |

## Examples

```text
User: "animate the cards so they cascade in and count up, and add a 3D tilt + skeleton loader."
Route:
  - foundation        → motion tokens + reduced-motion gate + atom stamping
  - entry-scroll      → stagger cascade + count-up
  - ambient-hover     → 3D tilt + skeleton loader
```

## Modes

Per-skill: see Resources. The router itself is mode-agnostic.

## Composability

The 5 animation siblings compose freely with each other and with every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24).

## Routing matrix

| User says | Pick |
|---|---|
| "motion tokens" / "easing" / "reduce motion" / "keyframe" / "atom stamping" / "fill mode" / "anti-pattern" | [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) |
| "stagger" / "scroll reveal" / "count up" / "parallax" / "scroll snap" / "pinned" / "clip wipe" / "SVG line draw" / "progress bar" | [amvcp-anim-entry-scroll](../amvcp-anim-entry-scroll/SKILL.md) |
| "float" / "bobbing" / "breathe" / "orbit" / "link underline" / "3D tilt" / "hover lift" / "spring" / "pulse" / "skeleton" | [amvcp-anim-ambient-hover](../amvcp-anim-ambient-hover/SKILL.md) |
| "loop pause" / "idle defer" / "rAF loop" / "delta time" | [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md) |
| "chart counter" / "diagram reveal" / "stepper spin" / "slide transitions" / "print" / "PDF export" / "touch parity" | [amvcp-anim-handoffs](../amvcp-anim-handoffs/SKILL.md) |

## Resources

The 5 animation siblings:

- [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) — motion tokens, easing curves, reduced-motion gate, decorative-vs-informational, animation-fill-mode, transition-properties, keyframe catalog, CSS injection bootstrap, atom selection stamping, dynamic refresh APIs, OT-08 13-section plan template, 20 anti-patterns (12 refs).
- [amvcp-anim-entry-scroll](../amvcp-anim-entry-scroll/SKILL.md) — stagger entry, fire-once scroll reveal (4 variants), stat counter, parallax tiers, progress bar, scroll-snap, pinned section, native scroll-driven timelines, clip wipe, scale pop, SVG line draw (12 refs).
- [amvcp-anim-ambient-hover](../amvcp-anim-ambient-hover/SKILL.md) — four floating presets, animated link underline, 3D card tilt, hover lift, spring overshoot, wireframe bobbing card stack, pulse-ring loading dot, shimmer skeleton placeholder (9 refs).
- [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md) — off-screen loop-pause IO, idle-deferred two-tier init, delta-time rAF loop primitive, performance overview (4 refs).
- [amvcp-anim-handoffs](../amvcp-anim-handoffs/SKILL.md) — chart counter handoff, diagram reveal handoff, stepper spin handoff, slide-deck moods + transitions, print + PDF stylesheet, touch + keyboard parity (6 refs).
