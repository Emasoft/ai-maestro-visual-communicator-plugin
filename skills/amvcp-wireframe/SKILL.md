---
name: amvcp-wireframe
description: "Render navigable grayscale UI wireframes — fidelity-locked placeholder blocks, multi-screen anchor navigation, device-frame bezels (iOS/Android/MacBook/browser), and a wireframe→low→mid→hi fidelity ramp. Grayscale is derived by desaturating the DESIGN.md theme; rising fidelity re-introduces the real accent. Use when the user says 'wireframe', 'mockup', 'prototype', 'low-fidelity', 'lo-fi screen', 'UX layout', 'sketch the UI', or wants to plan a screen before visual design. Trigger with 'wireframe', 'mockup', 'prototype', 'lo-fi', 'low-fidelity', 'clickable prototype', 'app chrome', 'device frame', 'fidelity ramp'."
license: MIT
compatibility: "Browser (CSS + plain anchors; the optional fidelity engine is vanilla JS). Python 3.12+ renderer ships amvcp-wireframe.js + amvcp-wireframe.css + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Wireframe

## Overview

Loads on requests to wireframe, mock up, prototype, or sketch a UI at low fidelity. Renders a **navigable grayscale wireframe** through four cohesive layers — all dependency-free CSS + plain HTML, with one small vanilla-JS module for the fidelity engine.

1. **Semantic kit** — ~19 fidelity-locked classes (`wf-card`, `wf-button`, `wf-nav`, `wf-image`…), each a labelled grey placeholder block.
2. **Anchor navigation** — N named screens in one file; plain `<a href="#screen-id">` jumps between them. Zero JS.
3. **Layout archetypes** — four ready page skeletons: desktop app chrome, web page, mobile screen, modal.
4. **Device frames** — pure-CSS iOS / Android / MacBook / browser hardware bezels.
5. **Fidelity ramp** — the same screen at four fidelities side-by-side, or one screen plus a slider.

**The differentiator is fidelity-lock.** A wireframe physically cannot leak brand color: at fidelity `wireframe` the engine desaturates every `--vc-color-*` token to pure grayscale (chroma 0, lightness preserved). As the fidelity attribute rises (`wireframe → low → mid → hi`) the real accent is progressively re-introduced. One DESIGN.md theme, one fidelity dial, four rendered fidelities.

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) present — supplies the `--vc-color-*` tokens the desaturation engine reads. Without it the wireframe still renders (canonical fallback hexes), but the grayscale is fixed rather than theme-derived.
- `amvcp-wireframe.css` + `amvcp-wireframe.js` ship beside the output HTML.
- A static wireframe at a fixed fidelity with no slider needs **zero JS** — layers 1, 2, 3 are pure CSS + plain anchors.
- Chromium browser (the optional fidelity slider needs `<input type="range">` support — degrades to the `wireframe`-fidelity screen with JS off).

## Instructions

1. **Pick archetype(s)** — `wf-archetype--app` / `--web` / `--mobile` / `--modal` (see `references/layout-archetypes.md`).
2. **Build each screen** — a `<section class="wf-screen" id="screen-x" data-ve-id="…">`, filled with kit classes (`references/wireframe-kit.md`).
3. **Wire navigation** — `<a href="#screen-id">` between screens; set `data-wf-nav="scroll"` (default, stacked) or `"paged"` (one screen at a time, pure CSS `:target`).
4. **Set fidelity** — `data-wf-fidelity` on the `.wf-root` (`wireframe` default). For a comparison, use a `.wf-ramp` (four stages) or the `.wf-fidelity-slider` (`references/fidelity-ramp.md`).
5. **Optionally frame it** — wrap a `wf-archetype--mobile` in a `wf-frame--ios` / `--android`, or a page in `wf-frame--macbook` / `--browser` (`references/device-frames.md`).
6. **Link** `amvcp-wireframe.css` + `amvcp-wireframe.js` + the runtime + the DESIGN.md engine. Never hand-author the desaturation — the JS owns it.

## The `--vc-*` token contract

The skill is a pure **consumer** — it emits no `--vc-*` of its own and never extends the engine. Every wireframe color reads `var(--vc-color-*, <fallback>)`; every size is a `--wf-*` custom property `calc()`'d off `--vc-space-*`. At fidelity `wireframe` the JS publishes a desaturated `--vc-color-*` set onto the wireframe root, so every kit block — and any nested component — paints grey. See `references/wireframe-kit.md` for the full token table and `references/fidelity-ramp.md` for the desaturation algorithm.

## Output

Self-contained HTML: one file, no external assets, no iframes. The CSS is a colocated `<link>`; the fidelity engine is the colocated `amvcp-wireframe.js`. Every `.wf-screen` and kit block carries `data-ve-id` + `data-ve-type="wireframe-screen"|"wireframe-block"`, so a click sends the selection to the agent like any other selectable atom. Both light and dark themes are correct by construction — the grayscale ramp is theme-relative (lightness preserved, chroma zeroed).

## Error Handling

- **Invalid `data-wf-fidelity`** → `amvcpWireframe.init()` throws naming the bad value — fail-fast, no silent coercion. Use exactly `wireframe` / `low` / `mid` / `hi`.
- **Wireframe leaks brand color** → a hardcoded hex was used instead of a `--vc-color-*` token; the desaturation only rewrites `--vc-color-*` custom properties, so a raw hex bypasses the fidelity-lock. Always use tokens.
- **Inner scrollbar on a device frame** → `overflow` was set on `.wf-frame__content`; it must stay `visible` (a long screen extends the page, never an inner viewport).
- **Nested `.wf-root` inside another `.wf-root`** → undefined behaviour, forbidden — one wireframe root per subtree.
- **Slider does nothing with JS off** → expected; it degrades to the `wireframe`-fidelity screen (the safe default).

## Examples

**Input:** "wireframe the checkout flow."

**Output:** three `.wf-screen`s (cart / payment / confirm) in one file under a `wf-archetype--web`, `data-wf-nav="paged"`, `data-wf-fidelity="wireframe"`. `<a href="#screen-payment">` advances; pure CSS `:target` shows one screen at a time.

**Input:** "mobile onboarding mockup, lo-fi."

**Output:** a `wf-archetype--mobile` screen wrapped in `wf-frame--ios`, `data-wf-fidelity="wireframe"` — a grayscale app running on an iPhone bezel.

**Input:** "show this dashboard at increasing fidelity."

**Output:** a `.wf-ramp` with the same screen duplicated four times at `wireframe` / `low` / `mid` / `hi` — or one screen plus a `.wf-fidelity-slider`.

## Resources

- `references/wireframe-kit.md` — the 19-class table, per-class HTML contract, the grayscale rule, the fidelity-lock attribute mechanics, the desaturation token table.
- `references/layout-archetypes.md` — the 4 copy-paste archetype skeletons (app / web / mobile / modal).
- `references/device-frames.md` — the 4 bezels, the geometry table, the documented fixed-dark-bezel exception.
- `references/fidelity-ramp.md` — the 4-stage fidelity model, the desaturation `k`-factor table, the side-by-side + slider authoring.
