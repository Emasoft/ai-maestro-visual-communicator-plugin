---
name: amvcp-wireframe
description: "Slim router for the 4-skill wireframe family: amvcp-wf-fidelity (fidelity ramp + 19-class kit), amvcp-wf-devices (iOS/Android/MacBook/browser bezels), amvcp-wf-screens (multi-screen nav + domain screens), amvcp-wf-archetypes (4 page skeletons + pattern families). Use when planning a wireframe. Trigger with 'wireframe', 'mockup', 'prototype', 'lo-fi', 'clickable prototype', 'device frame', 'fidelity ramp'."
license: MIT
compatibility: "Browser. Companion: amvcp-wireframe.css + amvcp-wireframe.js + amvcp-designmd.js."
metadata:
  author: Emasoft
---

# Wireframe (Router)

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13+ category skills. **This skill** is the wireframe family router — pick the right sibling below.

## Overview

The wireframe family renders navigable grayscale UI wireframes. As of the 4-way split, the original monolithic skill is now a thin router pointing at four focused siblings — each with its own SKILL.md and references/. Pick the sibling matching your task.

## The four sibling wireframe skills

| Pick this sibling | When you want to… | Surface |
|---|---|---|
| **[amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md)** | Pick a fidelity stage, build a ramp/slider, author kit blocks, verify grayscale lock, set theme-relative grayscale | Fidelity ramp (wireframe/low/mid/hi), 19-class kit, grayscale + radius-zero contract, theme/dark mode, spacing + typography tokens, copy conventions |
| **[amvcp-wf-devices](../amvcp-wf-devices/SKILL.md)** | Wrap a wireframe in a phone/laptop/browser bezel, size for a specific viewport | iOS / Android / MacBook / browser bezels, viewport breakpoints, no-nested-scrollbars contract |
| **[amvcp-wf-screens](../amvcp-wf-screens/SKILL.md)** | Wire N screens with anchor navigation, translate a spec to screens, build clickable prototypes, add a11y / selection / rationale panels | Multi-screen nav (paged vs scroll), clickable prototype shapes, mobile / ecommerce / auth / email / CMS / onboarding / landing-page domain screens, selection + comments, a11y, visual verification, troubleshooting, integration |
| **[amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md)** | Pick a page-skeleton shape, compose dashboards / settings / modals / forms / tables / blank states | 4 base archetypes (app, web, mobile, modal), dashboard (app-grid) / settings / modal / blank-state pattern families, navigation bars, forms, data tables |

## How to combine the siblings

A typical wireframe loads more than one sibling because the layers compose:

1. **Pick an archetype** (`amvcp-wf-archetypes`) → the page-skeleton shape.
2. **Author kit blocks** (`amvcp-wf-fidelity`) → labelled grey placeholder blocks inside the archetype.
3. **Wire navigation** (`amvcp-wf-screens`) → one `.wf-root` with N `.wf-screen` blocks, anchor links between them.
4. **Set fidelity** (`amvcp-wf-fidelity`) → `data-wf-fidelity="wireframe"` (default).
5. **Optionally frame it** (`amvcp-wf-devices`) → wrap in `wf-frame--ios` / `--android` / `--macbook` / `--browser`.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`).
- `scripts/amvcp-wireframe.css` + `scripts/amvcp-wireframe.js`.
- A modern browser. A static wireframe at a fixed fidelity needs ZERO JS — the kit + grayscale CSS are pure CSS.

## Instructions

Pick the right sibling skill from the table above, then follow its `Instructions` section. This router does not author wireframes itself — its only job is routing.

Checklist:

- [ ] Identified which sibling skill matches the task
- [ ] Read that sibling's `Instructions` section
- [ ] Followed its prerequisites + steps
- [ ] Composed with other siblings as needed

## Output

The selected sibling skill produces the wireframe. This router produces only the routing decision.

## Error Handling

| Symptom | Fix |
|---|---|
| Unsure which sibling to pick | Re-read the table above — match your task verb (pick fidelity, wrap in bezel, wire screens, pick archetype). |
| Need cross-sibling composition | Follow the "How to combine the siblings" workflow above. |
| Sibling not found | Verify the sibling directory exists at `skills/amvcp-wf-{fidelity,devices,screens,archetypes}/SKILL.md`. |

## Examples

**Input:** "wireframe the checkout flow."

**Output:** Route to [amvcp-wf-screens](../amvcp-wf-screens/SKILL.md) (multi-screen with clickable prototype) + [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md) (web archetype) + [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) (wireframe fidelity).

**Input:** "mobile onboarding mockup, lo-fi."

**Output:** Route to [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) (lo-fi stage) + [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md) (mobile archetype) + [amvcp-wf-devices](../amvcp-wf-devices/SKILL.md) (iOS frame).

**Input:** "show this dashboard at increasing fidelity."

**Output:** Route to [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) (`.wf-ramp` with 4 stages) + [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md) (app archetype + dashboard pattern).

## Visual verification

Every sibling skill mandates dev-browser visible-mode screenshots in BOTH themes per `skills/amvcp-self-debug-rules/SKILL.md` (R41).

## Modes

Routing-only — modes are owned by the destination sibling skill.

## Composability

Composes with every sibling wireframe skill (fidelity, devices, screens, archetypes) and every other amvcp-* skill on the page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

The wireframe family is now split into 4 sibling skills:

- [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) — fidelity engine, 19-class kit, theme-relative grayscale, spacing/type, copy conventions.
- [amvcp-wf-devices](../amvcp-wf-devices/SKILL.md) — device bezels, viewport breakpoints.
- [amvcp-wf-screens](../amvcp-wf-screens/SKILL.md) — multi-screen nav, clickable prototypes, domain screen libraries, selection, a11y, verification.
- [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md) — 4 page skeletons, pattern families (dashboard, settings, modal, blank-state, forms, tables, nav).
