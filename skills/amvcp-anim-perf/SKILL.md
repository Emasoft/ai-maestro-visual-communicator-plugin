---
name: amvcp-anim-perf
description: "Performance + advanced animation primitives — off-screen loop pause (AN-11), idle-deferred initialization two-tier contract (AN-11), delta-time rAF loop primitive (AN-12), re-scanning dynamic content, live reduced-motion-preference toggles. Layer 6 of the animation contract. Use when budgeting animation CPU or wiring custom rAF loops. Trigger with 'loop pause', 'idle defer', 'rAF loop', 'delta time', 'pause off-screen'."
license: MIT
compatibility: "Browser (IntersectionObserver, requestAnimationFrame, requestIdleCallback with setTimeout fallback). amvcp-animation.js."
metadata:
  author: Emasoft
---

# Animation — Performance + Advanced

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling animation skills:** [amvcp-animation](../amvcp-animation/SKILL.md) (router) · [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) · [amvcp-anim-entry-scroll](../amvcp-anim-entry-scroll/SKILL.md) · [amvcp-anim-ambient-hover](../amvcp-anim-ambient-hover/SKILL.md) · [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md) · [amvcp-anim-handoffs](../amvcp-anim-handoffs/SKILL.md).

## Overview

Layer 6 of the animation surface — performance + advanced primitives. The off-screen loop-pause IntersectionObserver auto-pauses any `.va-float-y` / `.va-breathe` / `.va-orbit` / `.va-rotate` / custom infinite loop while it sits below the viewport. The two-tier idle-deferred initialization contract (Tier 1: immediate; Tier 2: `requestIdleCallback` deferred). The delta-time loop primitive (`createLoop(update, render)`) for canvas / game-loop consumers. Re-scanning dynamic content after subtree insertions.

## Prerequisites

- The [foundation contract](../amvcp-anim-foundation/SKILL.md) loaded.
- `scripts/amvcp-animation.js` loaded next to the HTML.

## Instructions

1. **Loop-pause** is automatic for ships-with selectors — see [loop-pause-observer](references/loop-pause-observer.md). Custom loops MUST attach their own IO or join `LOOP_SELECTOR`.
2. **Idle defer** — for any non-Tier-1 wiring, hand the work to the deferred queue. See [idle-deferred-init](references/idle-deferred-init.md).
3. **Custom canvas / game loop** → `createLoop(update, render)` primitive. See [delta-time-loop](references/delta-time-loop.md).
4. **After dynamic insertion** → call `refresh(root)` (see foundation's `dynamic-content-refresh` reference).
5. **Verify perf budget** per [performance](references/performance.md).

## Output

A page whose infinite loops cost zero CPU while off-screen, whose non-critical wiring runs after the page is interactive, and whose canvas consumers share one rAF heartbeat instead of N independent loops.

## Error Handling

| Symptom | Fix |
|---|---|
| Loop runs off-screen | Confirm the loop selector is in `LOOP_SELECTOR`; custom infinite loops need to be added there or get their own IO (see [loop-pause-observer](references/loop-pause-observer.md)). |
| Tier-2 init didn't fire | `requestIdleCallback` rejected by the browser — the setTimeout fallback fires anyway. See [idle-deferred-init](references/idle-deferred-init.md). |
| `createLoop` not stopping | Caller didn't invoke `stop()` — `start()` is idempotent but `stop()` is required to cancel. See [delta-time-loop](references/delta-time-loop.md). |
| Custom loop drift across browsers | Use `dt` from `createLoop`'s render callback; never compute time from wall-clock subtraction. |

## Examples

```js
// Use the delta-time primitive for a canvas
import { createLoop } from './amvcp-animation.js'

const loop = createLoop(
  (dt) => { /* update — use dt seconds */ },
  ()    => { /* render */ }
)
loop.start()
// ...later
loop.stop()
```

```js
// Idle-defer non-critical wiring
import { deferInit } from './amvcp-animation.js'

deferInit(() => {
  // expensive, non-critical wiring runs after the page is interactive
})
```

## Visual verification

Per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — confirm off-screen ambient loops pause (Performance > Frames panel in dev-browser), and Tier-2 init fires within ~50ms of `load`.

## Modes

`data-ve-mode="readonly"` only — performance primitives have no per-element comment surface.

## Composability

Performance primitives compose with every other amvcp-* skill. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [performance](references/performance.md)
  > Off-screen loop pause (AN-11) · Idle-deferred init (AN-11) · Delta-time loop primitive (AN-12) · Re-scanning dynamic content · Live reduced-motion changes
- [loop-pause-observer](references/loop-pause-observer.md)
  > The contract · Why it matters · Default threshold = 0 · NOT fire-once · When the observer can't attach · Deferred init · Re-scanning dynamic content · DESIGN.md tokens consumed · When NOT to apply the loop-pause pattern · Reduced-motion interaction · Selection + comment + decision integration · Diagnostics · Visual verification · Why a SEPARATE observer (and not the reveal one)? · Performance budget for loops
- [idle-deferred-init](references/idle-deferred-init.md)
  > The two tiers · The `deferInit` helper · Why two tiers, not one · DESIGN.md tokens consumed · Reduced-motion interaction · Selection + comment + decision integration · Tier-2 init failure recovery · Order of deferred work · Re-running deferred init · Diagnostics · Visual verification
- [delta-time-loop](references/delta-time-loop.md)
  > The public API · The implementation · The `start()` idempotency · The `stop()` cancel · Why ship a primitive nothing uses? · DESIGN.md tokens consumed · Reduced-motion interaction · Example consumer — a hypothetical chart entrance · Selection + comment + decision integration · Diagnostics · Visual verification · When NOT to use this primitive
