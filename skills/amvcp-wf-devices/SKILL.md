---
name: amvcp-wf-devices
description: "Device-frame bezels — pure-CSS hardware enclosures (iOS, Android, MacBook, browser; tablet + TV extension points), bezel geometry budget, screen-content masking via wf-frame__content, fixed-dark-bezel exception, and responsive viewport/breakpoint mapping. Use when wrapping a wireframe in a phone/laptop/browser frame, or sizing screens for a specific viewport. Trigger with 'device frame', 'iPhone frame', 'Android frame', 'MacBook frame', 'browser frame', 'bezel', 'viewport', 'breakpoint'."
license: MIT
compatibility: "Pure CSS — no images, no SVG, no iframes. Browser-only. Companion: amvcp-wireframe.css (frame classes)."
metadata:
  author: Emasoft
---

# Wireframe Devices

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Router:** [`skills/amvcp-wireframe/SKILL.md`](../amvcp-wireframe/SKILL.md). **Sibling wireframe skills:** [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) · [amvcp-wf-screens](../amvcp-wf-screens/SKILL.md) · [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md).

## Overview

Wrap a wireframe in a CSS-only device bezel. Four hardware frames ship — `wf-frame--ios` (iPhone 15 Pro), `wf-frame--android` (Pixel-class), `wf-frame--macbook` (MacBook Pro 14"), and `wf-frame--browser` (desktop window chrome). Each frame is a pure-CSS shell with the geometry baked in (width, height, radius, bezel border); the screen content area (`.wf-frame__content`) keeps `overflow: visible` so a tall screen extends the page (no nested scrollbars). The bezel itself is fixed-dark across both themes — a documented exception to the theming rules, because real hardware bezels are not theme-responsive. Responsive breakpoints map frames to viewport sizes; below 460px the frames degrade gracefully (border thins, radius shrinks).

## Prerequisites

- `scripts/amvcp-wireframe.css` loaded — supplies all frame classes.
- A modern browser (CSS `clip-path` + `mask` are not required; frames use plain `border-radius` + nested elements).
- The DESIGN.md engine for the screen content (not for the bezel itself, which is theme-fixed).

## Instructions

1. **Pick a frame** by device class — see the device table in [`device-frames.md`](references/device-frames.md).
2. **Wrap your screen** — `<div class="wf-frame wf-frame--ios"><div class="wf-frame__content">… your `.wf-archetype--mobile` here …</div></div>`.
3. **Author the screen content** as a normal `.wf-root` (composes with [amvcp-wf-fidelity](../amvcp-wf-fidelity/SKILL.md) and [amvcp-wf-archetypes](../amvcp-wf-archetypes/SKILL.md)).
4. **Never set `overflow` on `.wf-frame__content`** — the no-nested-scrollbars invariant.
5. **Pick a viewport range** per [`responsive-and-breakpoints.md`](references/responsive-and-breakpoints.md) when sizing the page around the frame.
  > The standard breakpoint set · Mobile-first vs desktop-first authoring · The 3-viewport screenshot test · Responsive grid patterns · Container queries — the modern alternative · Show / hide per viewport · Touch target sizes (44 × 44 minimum) · Fluid typography (clamp + vw) · Hover-on-touch fallbacks · Orientation (portrait / landscape) handling · Common responsive bugs in wireframes
6. **Customise geometry** via the per-frame `--wf-frame-*` tokens if you need a non-default size.

Checklist:

- [ ] Frame wraps a `.wf-frame__content`, which wraps the screen
- [ ] `.wf-frame__content` has no `overflow` override
- [ ] Viewport sized appropriately for the frame's device class
- [ ] Dark bezel renders identically in light + dark themes

## Output

A wireframe screen wrapped in a hardware-realistic bezel that grows vertically to fit tall content (page scrolls, not the inner content), themes correctly inside the bezel, and degrades for narrow viewports.

## Error Handling

| Symptom | Fix |
|---|---|
| Inner scrollbar appears in a frame | `overflow` was set on `.wf-frame__content` — remove it (must stay `visible`). |
| Frame too wide on mobile viewport | Below 460px, frames auto-degrade; if you set a fixed width explicitly, remove it. |
| Bezel changes color in dark theme | A `--vc-color-*` token leaked into a bezel rule — restore the fixed hex (documented exception). |
| Frame crops the screen content | The frame uses `overflow: visible` by design; if content is clipped, an ancestor is clipping it. |

## Examples

**Input:** "show this mobile app on an iPhone bezel."

**Output:** `<div class="wf-frame wf-frame--ios"><div class="wf-frame__content"><div class="wf-root wf-archetype--mobile" data-wf-fidelity="wireframe">…</div></div></div>`

**Input:** "desktop app inside a browser window."

**Output:** `wf-frame--browser` wrapping a `.wf-archetype--app` `.wf-root`.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` (R41 — dev-browser visible mode). Screenshot in BOTH themes; verify the bezel is identical and the screen content paints correctly inside.

## Modes

Supports `data-ve-mode="readonly"` only — device frames are presentation-only chrome. Decision pills attach to the screen content atoms, not the bezel.

## Composability

Composes with every sibling wireframe skill (fidelity, screens, archetypes) and every other amvcp-* skill on the same page (R22). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [device-frames.md](references/device-frames.md) — 4 frames, geometry table, fixed-dark-bezel exception, no-nested-scrollbars invariant.
- [responsive-and-breakpoints.md](references/responsive-and-breakpoints.md) — breakpoints, grid patterns, touch targets, fluid type, frame-aware sizing.
  > The standard breakpoint set · Mobile-first vs desktop-first authoring · The 3-viewport screenshot test · Responsive grid patterns · Container queries — the modern alternative · Show / hide per viewport · Touch target sizes (44 × 44 minimum) · Fluid typography (clamp + vw) · Hover-on-touch fallbacks · Orientation (portrait / landscape) handling · Common responsive bugs in wireframes
