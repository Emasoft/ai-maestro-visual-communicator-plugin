---
name: amvcp-anim-entry-scroll
description: "Entry + scroll-triggered animation — staggered cascade, fire-once IO reveal (4 variants), stat counter, parallax tiers, scroll progress bar, scroll-snap, pinned section, native scroll-driven timelines, clip wipe, scale pop, SVG line draw. Layer 2 + 3 of the animation contract. Use when adding entrance cascades or scroll-driven reveals. Trigger with 'stagger', 'scroll reveal', 'count up', 'parallax', 'pinned section', 'clip wipe', 'SVG line draw'."
license: MIT
compatibility: "Browser (IntersectionObserver). amvcp-animation.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Animation — Entry + Scroll

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling animation skills:** [amvcp-animation](../amvcp-animation/SKILL.md) (router) · [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) · [amvcp-anim-entry-scroll](../amvcp-anim-entry-scroll/SKILL.md) · [amvcp-anim-ambient-hover](../amvcp-anim-ambient-hover/SKILL.md) · [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md) · [amvcp-anim-handoffs](../amvcp-anim-handoffs/SKILL.md).

## Overview

Layer 2 (entry stagger) + Layer 3 (scroll-triggered) of the animation surface. Staggered cascade via `--va-index`, fire-once IO reveal with 4 variants (`fade` / `scale` / `clip` / `stagger`), stat counter (rAF, locale-formatted), parallax tiers (6 levels, document-axis only), scroll progress bar, page-root scroll-snap, sticky-position pinned section, native `animation-timeline: scroll() / view()`, clip-path wipe, scale-pop, SVG line-draw / fill / polygon-expand. All `prefers-reduced-motion` safe with a meaning-preserving substitute.

## Prerequisites

- The [foundation contract](../amvcp-anim-foundation/SKILL.md) loaded (motion tokens, reduced-motion gate, atom stamping).
- `scripts/amvcp-animation.js` loaded next to the HTML.
- A `motion:` group in DESIGN.md is optional (CSS fallbacks apply).
- Browser with `IntersectionObserver` (fail-safe reveals all content if absent).

## Instructions

1. **Entry stagger** → `.va-stagger` list with `.va-stagger-item` children. Author `style="--va-index:N"` inline. See [stagger-entry](references/stagger-entry.md).
2. **Scroll reveal** → `data-va-reveal="fade|scale|clip|stagger"` on long-scroll sections. See [scroll-reveal](references/scroll-reveal.md).
3. **Stat counter** → `<span class="va-counter" data-va-stat="45200">0</span>`. See [count-up](references/count-up.md).
4. **Parallax** → `.va-parallax-1`..`6` very sparingly (drives the document's own scroll axis). See [parallax-tiers](references/parallax-tiers.md).
5. **Progress bar** → `.va-progress-bar` fixed at the top. See [scroll-progress-bar](references/scroll-progress-bar.md).
6. **Scroll snap** → `.va-snap-root` + `.va-snap-item` at page root. See [scroll-snap](references/scroll-snap.md).
7. **Pinned section** → `position: sticky` recipe. See [pinned-section](references/pinned-section.md).
8. **SVG line draw** → stroke-dashoffset + transition. See [svg-animation](references/svg-animation.md).

## Output

Self-contained HTML with entry stagger and scroll-triggered animations. Every animation has a `reduce` substitute. Every animated atom is stamped per the foundation's `atom-selection-stamping` reference (see `amvcp-anim-foundation`).

## Error Handling

| Symptom | Fix |
|---|---|
| Content stuck invisible | `data-va-reveal` present but `amvcp-animation.js` not loaded — check the `<script>` tag. |
| Stagger items flash then animate | Missing `animation-fill-mode: both` — see foundation `animation-fill-mode` reference. |
| Counter shows `NaN` | `data-va-stat` is not a number. |
| Parallax janky | Too many `.va-parallax-*` layers — reduce the count. |
| Snap not snapping | `.va-snap-root` was placed on an inner box — must be at the document root. |

## Examples

```html
<!-- A stat row that cascades in and counts up -->
<div class="va-stagger" data-va-stagger>
  <div class="va-stagger-item" style="--va-index:0">
    <span class="va-counter" data-va-stat="45200">0</span>
  </div>
  <div class="va-stagger-item" style="--va-index:1">
    <span class="va-counter" data-va-stat="3.4" data-va-stat-decimals="1">0</span>
  </div>
</div>

<!-- A page-long article with scroll-reveal sections -->
<section data-va-reveal="fade">Intro</section>
<section data-va-reveal="scale">Body</section>
<section data-va-reveal="stagger" class="va-stagger">
  <div class="va-stagger-item">item</div>
  <div class="va-stagger-item">item</div>
</section>
```

## Visual verification

Per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — screenshot at t=0, mid, end, in BOTH themes AND both reduced-motion states.

## Modes

`data-ve-mode="readonly"` only — the per-element 3-state decision pill applies via the stamper.

## Composability

Composes freely with the other anim siblings (foundation always required), tables, charts, slide-decks, diagrams. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [stagger-entry](references/stagger-entry.md)
  > The contract in one paragraph · Static markup (JS off, deterministic order) · Dynamic markup (runtime-built lists) · The keyframe and its CSS contract · Read layout before animate (the AN-04 kept lesson) · Per-index delay formula details · Combining with scroll reveal (`data-va-reveal="stagger"`) · DESIGN.md tokens consumed · Reduced-motion substitute — `vaFadeOnly` · Selection + comment + decision integration · Hot-swap with DESIGN.md · Diagnostics · Visual verification
- [scroll-reveal](references/scroll-reveal.md)
  > The contract · The four variants · When to use each variant · Threshold tuning — why 0.15 and -50px · Fail-safe: no IntersectionObserver → reveal everything · Fire-once via `unobserve` · Counter targets are also reveal targets · Combining with stagger (`data-va-reveal="stagger"`) · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Dynamic insertion — `revealNow(el)` and `refresh(root)` · Diagnostics · Visual verification
- [scale-reveal-pop](references/scale-reveal-pop.md)
  > The contract · The CSS · Why 0.94, not 0.85 or 0.97? · When to use scale reveal · DESIGN.md tokens consumed · The transform-origin question · Reduced-motion substitute · Combining with stagger · Selection + comment + decision integration · Performance · Diagnostics · Visual verification · Comparison with spring overshoot
- [clip-reveal-wipe](references/clip-reveal-wipe.md)
  > The contract · The CSS · The `inset()` syntax · When to use clip-reveal · DESIGN.md tokens consumed · Reduced-motion substitute · Counter targets are not clip targets · Selection + comment + decision integration · Performance · Diagnostics · Visual verification
- [count-up](references/count-up.md)
  > Markup · Attributes · The tick loop · Formatting choices · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Hot-swap with DESIGN.md · Chart skill consumer · Diagnostics · Visual verification
- [parallax-tiers](references/parallax-tiers.md)
  > The contract · Markup · The scroll listener — passive, rAF-coalesced · Why parallax reads the DOCUMENT scroll axis only · DESIGN.md tokens consumed · Native scroll-driven animation (`animation-timeline: scroll()`) · Reduced-motion substitute · How many parallax layers is too many? · Selection + comment + decision integration · Diagnostics · Visual verification
- [scroll-progress-bar](references/scroll-progress-bar.md)
  > The contract · How the progress is computed · When to use the progress bar · Color and z-index · DESIGN.md tokens consumed · Why no transition? · Reduced-motion substitute · Selection + comment + decision integration · Placement guidance · Multiple progress bars · Diagnostics · Visual verification · When to combine with the parallax tier
- [scroll-snap](references/scroll-snap.md)
  > The contract · Markup · Why on the page root, NEVER an inner box · Snap-align modes · Combining with reveal / counter / parallax · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Combining with the slide-decks skill · Diagnostics · Visual verification · Pattern note: the "scroll-snap-only slide deck"
- [pinned-section](references/pinned-section.md)
  > The recipe · Why `position: sticky` works for this · Combining with view() timeline (native scroll-driven) · DESIGN.md tokens consumed · When to use a pinned section · Reduced-motion substitute · Selection + comment + decision integration · Performance · Diagnostics · Visual verification · Stacking variation · Comparison with the snap pattern · Author extension: the timeline-of-events pattern
- [scroll-driven-timelines](references/scroll-driven-timelines.md)
  > The two timelines · The catalog of native scroll patterns · Browser support (as of writing) · Authoring the pinned pattern · Authoring the stacking pattern · Authoring the scrub pattern · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Why ship JS fallbacks for everything · Diagnostics · Visual verification · When to opt into the native API
- [svg-animation](references/svg-animation.md)
  > Line draw (stroke-dashoffset) · Fill from zero (fill-opacity) · Polygon expand (radar/spider chart) · Animated arrow head · Path morph (d attribute interpolation) · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Animating SVG with the `<use>` element · Diagnostics · Visual verification · Browser support · Why CSS animation on SVG, not SMIL · Author extension: hand-drawn-feeling SVG
- [entry-and-scroll](references/entry-and-scroll.md)
  > Layer 2 — staggered entry (`.va-stagger`) · Layer 3 — fire-once scroll reveal (`data-va-reveal`) · Layer 3 — stat counter (`.va-counter`) · Layer 3 — cinematic scroll-pattern catalog
