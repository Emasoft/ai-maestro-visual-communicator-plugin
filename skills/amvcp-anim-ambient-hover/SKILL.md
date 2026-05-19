---
name: amvcp-anim-ambient-hover
description: "Ambient + hover polish + loading states — four floating presets (float-y, breathe, orbit, rotate), animated link underline, 3D card tilt, hover lift on cards, spring overshoot easing, wireframe bobbing card stack, pulse-ring loading dot, shimmer skeleton placeholder. Layer 4 + 5 of the animation contract. Trigger with 'float', 'bobbing', 'breathe', 'orbit', 'spin', 'link underline', '3D card tilt', 'hover lift', 'spring', 'pulse', 'skeleton', 'shimmer'."
license: MIT
compatibility: "Browser (IntersectionObserver). amvcp-animation.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Animation — Ambient + Hover + Loading

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling animation skills:** [amvcp-animation](../amvcp-animation/SKILL.md) (router) · [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) · [amvcp-anim-entry-scroll](../amvcp-anim-entry-scroll/SKILL.md) · [amvcp-anim-ambient-hover](../amvcp-anim-ambient-hover/SKILL.md) · [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md) · [amvcp-anim-handoffs](../amvcp-anim-handoffs/SKILL.md).

## Overview

Layer 4 (ambient + hover polish) + Layer 5 (loading states) of the animation surface. Four ambient floating presets (`.va-float-y` / `.va-breathe` / `.va-orbit` / `.va-rotate` — decorative loops with REMOVAL substitute under `reduce`), animated link underline (`.va-link` — background-size grow), 3D card tilt (`.va-tilt` — perspective rotation on mousemove), hover lift recipe for `.ve-card`, spring overshoot easing (the one playful curve), wireframe bobbing card stack, pulse-ring loading dot (`.va-pulse`), shimmer skeleton placeholder (`.va-skeleton`).

## Prerequisites

- The [foundation contract](../amvcp-anim-foundation/SKILL.md) loaded (motion tokens, reduced-motion gate, atom stamping, loop-pause integration).
- For loop-paused ambient animations: the loop-pause observer from [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md).
- `scripts/amvcp-animation.js` loaded next to the HTML.

## Instructions

1. **Ambient loops** → `.va-float-y` / `.va-breathe` / `.va-orbit` / `.va-rotate` sparingly on hero/cover. See [floating-presets](references/floating-presets.md).
2. **Animated link underline** → `.va-link` on prominent inline links. See [link-underline](references/link-underline.md).
3. **3D card tilt** → `.va-tilt` on feature cards (JS-wired, perspective rotation). See [card-tilt-3d](references/card-tilt-3d.md).
4. **Hover lift** → translate + box-shadow + border-color recipe. See [hover-lift-cards](references/hover-lift-cards.md).
5. **Spring overshoot** → opt into `--vc-easing-spring` for playful arrivals. See [spring-overshoot](references/spring-overshoot.md).
6. **Loading dot** → `.va-pulse` for awaiting indicators. See [pulse-ring](references/pulse-ring.md).
7. **Skeleton** → `.va-skeleton` + modifiers (`--text` / `--title` / `--block`) for streamed content. See [skeleton-shimmer](references/skeleton-shimmer.md).

## Output

A page with ambient + hover polish + loading states, all token-driven and reduced-motion safe. Informational loaders (skeleton/pulse) substitute with meaning-preserving fades; decorative loops (`.va-float-y` etc.) substitute with REMOVAL.

## Error Handling

| Symptom | Fix |
|---|---|
| Float / orbit keeps running while off-screen | Loop-pause observer not loaded — see [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md). |
| Tilt doesn't fire | `prefers-reduced-motion: reduce` is on (intentional). |
| Hover lift not transitioning | Static `box-shadow` without a `transition` declaration — see [hover-lift-cards](references/hover-lift-cards.md). |
| Skeleton color washes out in dark | Skeleton paints with `--vc-color-*` tokens — confirm DESIGN.md `color:` group is present. |
| Pulse ring grows too large in tight UI | Tune the ring-size variable per [pulse-ring](references/pulse-ring.md). |

## Examples

```html
<!-- Hero with floating ornament -->
<header>
  <h1>Welcome</h1>
  <div class="va-float-y">★</div>
</header>

<!-- A 3D tilt card with hover lift -->
<div class="ve-card va-tilt">Feature</div>

<!-- A loading skeleton row -->
<div class="va-skeleton va-skeleton--title"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--text"></div>

<!-- An awaiting indicator -->
<button>Run <span class="va-pulse"></span></button>
```

## Visual verification

Per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — screenshot in BOTH themes AND both reduced-motion states. Confirm the float/orbit/breathe loops actually pause when scrolled off-screen.

## Modes

`data-ve-mode="readonly"` only — the per-element 3-state decision pill applies via the stamper.

## Composability

Composes freely with the other anim siblings (foundation always required). Ambient loops should be sparse; one per hero is plenty. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [floating-presets](references/floating-presets.md)
  > The four presets · The keyframes · The orbit math · Markup · Performance: the loop-pause observer · DESIGN.md tokens consumed · Reduced-motion substitute — REMOVAL · Selection + comment + decision integration · When to use which preset · Bobbing card stack — the mined variant (`02-exploration-visual-designs`) · Diagnostics · Visual verification
- [link-underline](references/link-underline.md)
  > The contract · The CSS · DESIGN.md tokens consumed · When to use · Why a left-grow (and not center-out)? · Underline thickness · Reduced-motion substitute · Why standard easing, not decel? · Selection + comment + decision integration · Mined pattern note: hover lift on cards (`index.html`, `06`) · Diagnostics · Visual verification
- [card-tilt-3d](references/card-tilt-3d.md)
  > The contract · The CSS · The JS · The perspective formula · The 10° max angle · DESIGN.md tokens consumed · When to use · Performance · Reduced-motion substitute · Combining with static hover · Selection + comment + decision integration · Dynamic insertion · Diagnostics · Visual verification
- [hover-lift-cards](references/hover-lift-cards.md)
  > The recipe · The skill does NOT ship `.ve-card` · Combining with `.va-tilt` · DESIGN.md tokens consumed · Reduced-motion substitute · Touch devices · Selection + comment + decision integration · Diagnostics · Visual verification · Pattern note: the brief outline pulse on click-to-anchor
- [spring-overshoot](references/spring-overshoot.md)
  > The curve · When to use · Markup example — a spring scale-in · The skill DOES NOT ship a default `.va-spring-in` class · DESIGN.md tokens consumed · Reduced-motion substitute · Confetti pop — the mined variant (`07-prototype-animation.html`) · Settle keyframe — the 3-keyframe spring · Selection + comment + decision integration · Diagnostics · Visual verification · How the curve is constructed
- [wireframe-bobbing-card-stack](references/wireframe-bobbing-card-stack.md)
  > The visual · The recipe · Why ::after for the shadow · DESIGN.md tokens consumed · Reduced-motion substitute · Loop-pause integration · Selection + comment + decision integration · When to use the bobbing card stack · Visual verification · Pattern note: the wireframe-skill connection · Combining with hover lift · Custom shadow color
- [pulse-ring](references/pulse-ring.md)
  > The contract · The CSS · DESIGN.md tokens consumed · When to use the pulse · Markup recipes · Performance — paused while off-screen · Reduced-motion substitute · Selection + comment + decision integration · Color tuning across themes · Ring size tuning · Diagnostics · Visual verification
- [skeleton-shimmer](references/skeleton-shimmer.md)
  > The contract · The CSS · DESIGN.md tokens consumed · When to use which modifier · Markup recipes · Replacing the skeleton with real content · Performance — paused while off-screen · Reduced-motion substitute · Selection + comment + decision integration · Color contrast — light vs dark · Diagnostics · Visual verification · When NOT to use a skeleton
- [ambient-and-loading](references/ambient-and-loading.md)
  > Layer 4 — four floating presets · Layer 4 — animated link underline (`.va-link`) · Layer 4 — 3D card tilt (`.va-tilt`) · Layer 5 — pulse-ring dot (`.va-pulse`) · Layer 5 — shimmer skeleton (`.va-skeleton`)
