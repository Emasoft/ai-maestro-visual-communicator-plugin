---
name: amvcp-anim-foundation
description: "Foundation animation contract — motion tokens, easing curves, reduced-motion gate, decorative-vs-informational binary, fill-mode, keyframe catalog, CSS injection bootstrap, atom stamping, dynamic refresh APIs, anti-patterns, OT-08 plan template. Tier-1 substrate every other animation sub-skill builds on. Use when authoring or fixing any amvcp animation surface. Trigger with 'motion tokens', 'easing', 'reduced motion', 'animation contract', 'keyframe'."
license: MIT
compatibility: "Browser (IntersectionObserver). amvcp-animation.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Animation Foundation

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling animation skills:** [amvcp-animation](../amvcp-animation/SKILL.md) (router) · [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) · [amvcp-anim-entry-scroll](../amvcp-anim-entry-scroll/SKILL.md) · [amvcp-anim-ambient-hover](../amvcp-anim-ambient-hover/SKILL.md) · [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md) · [amvcp-anim-handoffs](../amvcp-anim-handoffs/SKILL.md).

## Overview

Foundation layer for the animation surface — the `--vc-motion-*` / `--vc-duration-*` / `--vc-easing-*` token contract, the five canonical easing curves, the `prefers-reduced-motion` substitute pattern (never `animation: none`), the informational-vs-decorative binary that drives substitute choice, `animation-fill-mode: both` invariant, the per-property animation-safety guide, the ten ships-with keyframes, the `injectAnimationCSS()` bootstrap, the atom selection stamping contract (`data-ve-id` + `data-ve-type` + decision mini-pill), the `refresh(root)` / `revealNow(el)` dynamic APIs, the 20 anti-patterns, and the OT-08 13-section authoring plan template.

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the page.
- `amvcp-animation.js` loaded next to the HTML.
- A modern browser. No npm dependency.

## Instructions

1. **Wire the motion tokens** — see [motion-tokens](references/motion-tokens.md) and [easing-curves](references/easing-curves.md). Add a `motion:` group to DESIGN.md or rely on canonical fallbacks.
2. **Apply the reduced-motion gate** — every animation ships a substitute, see [reduced-motion-gate](references/reduced-motion-gate.md). Decide info-vs-decorative per [decorative-vs-informational](references/decorative-vs-informational.md).
3. **Use `animation-fill-mode: both`** on every staggered entry — see [animation-fill-mode](references/animation-fill-mode.md).
4. **Animate only safe properties** — see [transition-properties](references/transition-properties.md).
5. **Stamp atoms** with `data-ve-id` and a decision mini-pill — see [atom-selection-stamping](references/atom-selection-stamping.md).
6. **For complex sequences**, fill in [animation-plan-template](references/animation-plan-template.md) before implementing.

## Output

A DESIGN.md-themed page whose animation substrate is token-driven, accessibility-compliant in both `no-preference` and `reduce` modes, and atom-stamped for selection + decision pills. Verification: dev-browser screenshots in both themes + both reduced-motion states per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).

## Error Handling

| Symptom | Fix |
|---|---|
| `--vc-motion-*` resolves empty | DESIGN.md `motion:` group missing — canonical CSS fallbacks keep the page coherent. |
| Stagger items flash then animate | Missing `animation-fill-mode: both` — see [animation-fill-mode](references/animation-fill-mode.md). |
| Motion ignored entirely | DESIGN.md `motion.scale: 0`, OR the OS `prefers-reduced-motion` is on (both intended). |
| Atom decision pill never mounts | `atom-selection-stamping` deferral never fired — check the runtime is loaded. |

## Examples

```html
<!-- A foundation-only animated card -->
<div class="va-stagger" data-va-stagger>
  <div class="va-stagger-item" style="--va-index:0">Card 1</div>
  <div class="va-stagger-item" style="--va-index:1">Card 2</div>
</div>
```

Under `prefers-reduced-motion: reduce` the cards fade in with no travel, per the substitute pattern.

## Visual verification

For every change to this skill's CSS or JS, run the dev-browser workflow from [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — screenshots in BOTH light and dark themes, AND both `no-preference` + `reduce` states.

## Modes

This skill supports `data-ve-mode="readonly"` only — the per-element 3-state decision pill (R20-R23) DOES apply via the stamper. See [atom-selection-stamping](references/atom-selection-stamping.md).

## Composability

Composed by every other amvcp-anim-* sibling skill (R22) — foundation is the substrate. The only exclusive skill is the overlay-runtime (R24). Combine freely with all amvcp-* skills.

## Resources

- [motion-tokens](references/motion-tokens.md)
  > The `motion:` group in DESIGN.md · CSS custom properties consumed · `--vc-motion-scale` — the master damper · Why durations are not light/dark themed · Token absence is safe
- [easing-curves](references/easing-curves.md)
  > The five curves · Picking the curve by question · Why decel on entrances (not standard) · Spring overshoot — the one playful curve · Reduced-motion: every easing collapses to `ease` 200ms · DESIGN.md authoring · Easing-presets-swap-a-single-CSS-var (from html-effectiveness) · Reduced-motion substitute (curve doesn't apply) · Visual verification · Selection / decision integration
- [reduced-motion-gate](references/reduced-motion-gate.md)
  > Why substitute (not disable) · The two categories — information-bearing vs decorative · OS detection at runtime · Live OS-preference updates · CSS pattern — every animation, twice · JS pattern — read `REDUCED` once per call · DESIGN.md `motion.scale: 0` is ORTHOGONAL, not equivalent · The decision-tree for "what substitute do I write?" · Diagnostics · Visual verification · Selection / decision integration
- [decorative-vs-informational](references/decorative-vs-informational.md)
  > Overview · The two categories defined · The decision tree · Worked examples · What about edge cases? · Why the category matters for selection · Why the category matters for performance · Mistakes to avoid · DESIGN.md tokens by category · Authoring checklist · Diagnostics · Visual verification
- [animation-fill-mode](references/animation-fill-mode.md)
  > The four modes · Why `both` is required · Why `backwards` alone is insufficient · Why not `forwards` alone? · The skill uses `both` everywhere · When `both` doesn't apply · Reduced-motion interaction · DESIGN.md tokens consumed · How to combine with other animation properties · The other fill-mode use cases · Diagnostics · Visual verification · The `data-va-reveal` rule uses transitions, not animations
- [transition-properties](references/transition-properties.md)
  > The two property categories · Examples — the skill's choices · Why opacity AND transform together · Properties to AVOID animating · DESIGN.md tokens consumed · Reduced-motion substitute · `will-change` hints — when (NOT) to use · Combining properties on one element · Diagnostics · Visual verification · Reference table — animation-safe properties
- [keyframe-catalog](references/keyframe-catalog.md)
  > The ten keyframes · `vaFadeSlideUp` — the entrance default · `vaFadeOnly` — the universal reduce substitute · `vaFloatY` — the vertical bob · `vaBreathe` — the scale pulse · `vaOrbit` — the circular orbit · `vaRotate` — the in-place spin · `vaPulseRing` — the expanding ring · `vaShimmer` — the sliding gradient · Composition rules · DESIGN.md token consumption per keyframe · Reduced-motion handling · Selection + comment + decision integration · Diagnostics · Visual verification
- [css-injection-bootstrap](references/css-injection-bootstrap.md)
  > The injection function · Why ship CSS inside the JS module · The injected stylesheet contents · Auto-init vs manual init · The test fixture also uses manual init · The dual export (browser + Node) · DESIGN.md tokens consumed · Reduced-motion interaction · Why `data-va="animation"` not `data-amvcp="animation"` · Test hooks — `window.__veAnimation` · Diagnostics · Visual verification · When to opt into manual init
- [atom-selection-stamping](references/atom-selection-stamping.md)
  > The atom kinds the skill stamps · The stamper · What "atoms" are in the contract · The decision mini-pill · Defensive deferral when the runtime isn't loaded yet · What is NOT stamped · DESIGN.md tokens consumed · Reduced-motion interaction · Re-stamping on refresh · Atom ID stability across re-renders · Selection model integration · Diagnostics · Visual verification · Why the skill stamps (not the runtime)
- [dynamic-content-refresh](references/dynamic-content-refresh.md)
  > `refresh(root)` — re-scan a subtree · Idempotency · When to call `refresh()` · `revealNow(el)` — force-reveal one element immediately · When to use `revealNow()` vs `refresh()` · The reveal observer's `_revealCount` test hook · DESIGN.md tokens consumed · Reduced-motion interaction · Selection + comment + decision integration · Live OS-preference toggle · Diagnostics · Visual verification · When refresh fails silently
- [animation-plan-template](references/animation-plan-template.md)
  > 1. Timing overview · 2. Element inventory · 3. Entrance sequence · 4. Idle / loop state · 5. Interaction responses · 6. Exit sequence · 7. Reduced-motion variants  ← MANDATORY · 8. Performance budget  ← MANDATORY · 9. Dependencies · 10. Device notes · 11. Test scenarios · 12. Implementation order · 13. Review checkpoints
- [anti-patterns](references/anti-patterns.md)
  > 1. `animation: none !important` on `prefers-reduced-motion: reduce` · 2. Animating layout-triggering properties · 3. Missing `animation-fill-mode: both` on staggered entry · 4. Setting `--va-index` via `:nth-child` selectors · 5. Forgetting `:focus-visible` on hover-driven animations · 6. Removing focus rings without replacement · 7. `transform-origin: 0 0` on a centered element · 8. Infinite loops without loop-pause · 9. Mocking the runtime in tests instead of loading it · 10. Calling `init()` multiple times without `refresh()` · 11. Using SMIL instead of CSS for SVG animations · 12. Hardcoded durations / easings in CSS · 13. Using `text-decoration` for animated underlines · 14. Mixing GSAP / anime.js / Lenis / etc. · 15. Storing animation state in JS closures instead of CSS · 16. Adding `will-change` everywhere · 17. Animation duration in CSS, but JS reads a different value · 18. Animating elements outside the viewport unnecessarily · 19. Static `box-shadow` for hover (no transition) · 20. Treating `prefers-reduced-motion` as binary on/off only · Quick reference table
