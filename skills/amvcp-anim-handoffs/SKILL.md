---
name: amvcp-anim-handoffs
description: "Cross-skill animation handoffs + cross-cutting concerns — chart skill entrance + counter primitive, diagram skill flow-edge reveal, interactive-control stepper spin, slide-deck entrance moods + inter-slide transitions, print + PDF export stylesheet, touch + keyboard parity. Use when wiring animation into another amvcp skill or handling print/touch. Trigger with 'chart entrance', 'flow diagram reveal', 'slide transitions', 'print', 'PDF export', 'touch parity'."
license: MIT
compatibility: "Browser (IntersectionObserver). amvcp-animation.js + amvcp-designmd.js colocated with the HTML."
metadata:
  author: Emasoft
---

# Animation — Cross-Skill Handoffs

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling animation skills:** [amvcp-animation](../amvcp-animation/SKILL.md) (router) · [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) · [amvcp-anim-entry-scroll](../amvcp-anim-entry-scroll/SKILL.md) · [amvcp-anim-ambient-hover](../amvcp-anim-ambient-hover/SKILL.md) · [amvcp-anim-perf](../amvcp-anim-perf/SKILL.md) · [amvcp-anim-handoffs](../amvcp-anim-handoffs/SKILL.md).

## Overview

Cross-skill handoffs from the animation surface plus the cross-cutting concerns (print, touch/keyboard parity). The chart skill consumes `animateStat()` for KPI cards. The diagram skill consumes scroll-reveal for numbered flow walks + SVG edge animations. The interactive-control stepper consumes the spin keyframe for the active step. The slide-deck consumes the 5 entrance moods + 4 inter-slide transitions. The print stylesheet substitutes animation for static content on paper / PDF export. The touch/keyboard parity contract ensures hover-driven animations also fire on keyboard focus.

## Prerequisites

- The [foundation contract](../amvcp-anim-foundation/SKILL.md) loaded.
- For consumers: the corresponding cross-skill (charts, diagrams, slide-decks, interactive-controls).
- `scripts/amvcp-animation.js` loaded next to the HTML.

## Instructions

1. **Chart consumer** → call the exported `animateStat(el)` for counter animations on KPI cards. See [chart-skill-handoff](references/chart-skill-handoff.md).
2. **Diagram consumer** → use `data-va-reveal` for numbered flow walks and SVG-line-draw for edges. See [diagram-skill-handoff](references/diagram-skill-handoff.md).
3. **Stepper consumer** → apply the spin keyframe to the active step. See [interactive-control-stepper](references/interactive-control-stepper.md).
4. **Slide-deck consumer** → choose one of the 5 moods + one of the 4 inter-slide transitions. See [slide-deck-transitions](references/slide-deck-transitions.md).
5. **Print / PDF** → opt into the print stylesheet so animations substitute with their final state. See [print-and-export](references/print-and-export.md).
6. **Touch / keyboard** → ensure every hover-driven animation also fires on `:focus-visible`. See [touch-and-keyboard](references/touch-and-keyboard.md).

## Output

A page whose cross-skill animation handoffs are consistent (one shared `animateStat`, one shared scroll-reveal contract, one shared spin keyframe), whose print export is intelligible (counters show their final value, ambient loops are gone), and whose hover affordances also work on keyboard.

## Error Handling

| Symptom | Fix |
|---|---|
| Chart counter shows `NaN` in static export | Page didn't render fully before export, OR placeholder text isn't the final value — see [print-and-export](references/print-and-export.md). |
| Diagram flow edges don't reveal | `data-va-reveal` not applied to the SVG group — see [diagram-skill-handoff](references/diagram-skill-handoff.md). |
| Stepper spin doesn't start | The keyframe wasn't applied to the active step's class — see [interactive-control-stepper](references/interactive-control-stepper.md). |
| Slide entrance choppy | Mood + transition combination conflicts — see [slide-deck-transitions](references/slide-deck-transitions.md). |
| Hover lift never fires on keyboard | Missing `:focus-visible` paired selector — see [touch-and-keyboard](references/touch-and-keyboard.md). |

## Examples

```js
// Chart consumer — KPI card counter.
// amvcp-animation.js is NOT an ES module — it self-installs the global
// `window.amvcpAnimation` on load. Guard for it, then call the method.
const cardValue = document.querySelector('.kpi-card .value')
cardValue.dataset.vaStat = '45200'
if (window.amvcpAnimation && typeof window.amvcpAnimation.animateStat === 'function') {
  window.amvcpAnimation.animateStat(cardValue)   // counts 0 → 45,200
}
```

```html
<!-- Diagram consumer — numbered flow walk -->
<ol class="va-stagger" data-va-stagger data-va-reveal="stagger">
  <li class="va-stagger-item">Step 1</li>
  <li class="va-stagger-item">Step 2</li>
  <li class="va-stagger-item">Step 3</li>
</ol>
```

## Visual verification

Per [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md) — verify the chart counters, diagram reveals, and slide transitions in BOTH themes AND both reduced-motion states. Run the print preview to confirm the print stylesheet substitutes correctly.

## Modes

`data-ve-mode="readonly"` only — handoffs don't introduce per-element comment surfaces beyond what the consuming skill ships.

## Composability

Composes with the consumer skill (charts, diagrams, slide-decks, interactive-controls) plus the foundation. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [chart-skill-handoff](references/chart-skill-handoff.md)
  > `animateStat(el)` — the counter primitive · How the chart skill should call it · Why the chart skill doesn't re-implement count-up · Chart entrance animations · Stat-card reveal pattern · Chart canvas + animation skill · DESIGN.md tokens shared · Reduced-motion substitute · Selection + comment + decision integration · Diagnostics · Visual verification · Future chart-skill extensions
- [diagram-skill-handoff](references/diagram-skill-handoff.md)
  > Scroll-reveal for numbered flow walks · SVG flow-edge animations · Token contract for diagram animations · Reduced-motion substitute · Selection + comment + decision integration · Interactive flowcharts (click-step → side-panel pattern) · Scroll-reveal trigger on diagrams · Hot-swap with DESIGN.md · Diagnostics · Visual verification · Future diagram-skill extensions
- [interactive-control-stepper](references/interactive-control-stepper.md)
  > The stepper visual · The spin keyframe · DESIGN.md tokens consumed · Reduced-motion substitute · Loop-pause integration · Selection + comment + decision integration · Composing with the progressive stepper's other states · DESIGN.md hot-swap · Diagnostics · Visual verification · Pattern: "this is busy" indicators · Author extension: custom spinner shapes · Why not `<animate>` SMIL on the SVG?
- [slide-deck-transitions](references/slide-deck-transitions.md)
  > The 5 entrance moods · Why moods, not "transitions" · The 4 inter-slide transitions · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Mood selection heuristics · Stagger across the deck · Slide navigation indicators · Loop-pause for slide animations · Diagnostics · Visual verification · Future slide-deck extensions
- [print-and-export](references/print-and-export.md)
  > The default print behavior · The print stylesheet (proposed) · Print-safe authoring · The `prefers-reduced-motion` interaction · PDF export · DESIGN.md tokens consumed · When the skill's elements appear on paper · Counter readability on print · Reduced-motion substitute (for the print medium) · Selection + comment + decision integration · Page-break control · Diagnostics · Visual verification · When NOT to add the print stylesheet · Future runtime addition
- [touch-and-keyboard](references/touch-and-keyboard.md)
  > The categories · Keyboard parity for hover · Touch device handling · Why no `@media (hover: hover)` guard in the skill · Pointer-events: none — when to disable hover entirely · Reduced-motion + touch + keyboard · DESIGN.md tokens consumed · Selection + comment + decision integration · Diagnostics · Visual verification · Pattern note: focus rings · Pattern: `:focus-visible` and `:focus-within`
