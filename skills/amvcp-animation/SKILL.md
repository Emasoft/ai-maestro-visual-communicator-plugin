---
name: amvcp-animation
description: "Add motion to visual-communicator HTML — staggered entry, scroll reveal, stat counters, loading skeletons, ambient float loops, hover polish. All CSS + vanilla JS, zero libraries, themed off DESIGN.md motion tokens, prefers-reduced-motion safe. Use when the user asks to animate, add entrance/scroll/reveal animation, a count-up number, a loading skeleton, a floating/pulsing element, or motion to a report/slide/chart. Trigger with 'animate', 'animation', 'entrance', 'scroll reveal', 'fade in', 'stagger', 'counter', 'count up', 'skeleton', 'loading state', 'parallax'."
license: MIT
compatibility: "Browser (IntersectionObserver). Python 3.12+ renderer ships amvcp-animation.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Animation

## Overview

Loads on requests to animate, add an entrance/scroll reveal, a count-up number, a loading skeleton, or a floating/pulsing element. Adds **motion** to any visual-communicator artifact through six layers — all dependency-free CSS + vanilla JS, all `prefers-reduced-motion` safe, all themed off the DESIGN.md `--vc-*` motion tokens.

1. **Motion tokens** — durations, easings, stagger step, master damper.
2. **Accessibility gate** — every animation ships a `reduce` substitute.
3. **Entry animation** — staggered insertion for lists / cards / grids.
4. **Scroll-triggered** — fire-once reveal, stat counters, parallax.
5. **Loading states** — pulse-ring dot, shimmer skeleton.
6. **Performance** — off-screen loop pause, idle defer, delta-time loop.

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) present — supplies the motion tokens.
- `amvcp-animation.js` + `amvcp-designmd.js` ship beside the output HTML.
- A `motion:` group in the DESIGN.md is **optional** — every CSS rule carries a canonical fallback, so a token-less DESIGN.md still animates correctly.
- Chromium browser with `IntersectionObserver` (a fail-safe reveals all content if it is absent — content is never stuck invisible).

## Instructions

1. **Pick a layer**, apply the class or `data-va-*` attribute. The runtime auto-initializes — no manual JS call.
2. **Entry stagger** → `.va-stagger` list with `.va-stagger-item` children (author `style="--va-index:N"` inline, or let the indexer fill it).
3. **Scroll reveal** → `data-va-reveal` on long-scroll sections (`fade` / `scale` / `clip` / `stagger` variants).
4. **Stat counter** → `<span class="va-counter" data-va-stat="45200">0</span>` (optional `data-va-stat-decimals`, `data-va-stat-suffix`).
5. **Loading** → `.va-skeleton` (+ `--text` / `--title` / `--block`) for streamed content; `.va-pulse` for an awaiting indicator.
6. **Ambient** → `.va-float-y` / `.va-breathe` / `.va-orbit` / `.va-rotate` sparingly on hero/cover; `.va-link` underline; `.va-tilt` card.
7. **Parallax** → `.va-parallax-1`..`6` very sparingly (P3 — drives the page's own scroll axis, never an inner box).

## The motion-token contract

The skill reads 10 `motion:` keys via `var(--vc-*, fallback)`. See `references/motion-tokens.md` for the full contract. The four animation-specific keys: `duration-entrance` (600ms), `stagger-step` (80ms), `easing-spring`, `scale` (the 0..1 master damper that multiplies transform distance — `scale: 0` is a theme-level calm mode). Durations/easings are theme-agnostic; painted animations (skeleton, pulse) read `--vc-color-*` so both light and dark are correct.

## Output

Self-contained HTML: CSS injected by `amvcp-animation.js` on boot, the module shipped beside the file, no CDN, no build step. Every animation has a `reduce` substitute — information-bearing motion gets a meaning-preserving fallback; decorative-only loops are simply removed.

## Error Handling

- **Content stuck invisible** → `data-va-reveal` present but `amvcp-animation.js` not loaded; check the `<script>` tag.
- **Stagger items flash then animate** → missing `animation-fill-mode: both` (only if the CSS was hand-overridden).
- **Counter shows `NaN`** → `data-va-stat` is not a number.
- **Motion ignored entirely** → DESIGN.md `motion.scale: 0`, OR the OS `prefers-reduced-motion` is on (both intended).
- **Parallax janky** → too many `.va-parallax-*` layers; reduce the count.

## Examples

**Input:** "animate the metrics row so the cards cascade in and the numbers count up."

**Output:** wrap the row in `.va-stagger` with `data-va-stagger`, give each card `.va-stagger-item`, put `class="va-counter" data-va-stat="N"` on each number. On load the cards fade-and-rise in sequence; each counter rolls 0→N. With reduced motion on, cards fade in with no travel and counters show their final value at once.

## Authoring aid

For complex multi-stage sequences, fill in `references/animation-plan-template.md` (the 13-section OT-08 checklist) before implementing — sections 7 (reduced-motion variants) and 8 (performance budget) make the accessibility gate and the perf layer checklist items, not afterthoughts.

## Resources

- `references/motion-tokens.md` — Layer 0, the `--vc-motion-*` token contract.
- `references/entry-and-scroll.md` — Layers 2+3 (stagger, IO reveal, catalog, counter).
- `references/ambient-and-loading.md` — Layers 4+5 (float presets, hover, skeleton).
- `references/performance.md` — Layer 6 (IO-pause, idle-defer, delta loop).
- `references/animation-plan-template.md` — OT-08 13-section authoring checklist.
