---
name: amvcp-animation
description: "Add motion to visual-communicator HTML — staggered entry, scroll reveal, stat counters, loading skeletons, ambient float loops, hover polish, 3D card tilt, parallax tiers, scroll progress bar, spring overshoot, SVG line-draw. All CSS + vanilla JS, zero libraries, themed off DESIGN.md motion tokens, prefers-reduced-motion safe in every case. Use when the user asks to animate, add entrance/scroll/reveal animation, a count-up number, a loading skeleton, a floating/pulsing element, motion to a report/slide/chart, hover affordances on cards or links, a 3D tilt, a parallax background, a scroll-progress bar, or any keyframe / transition / loop. Trigger with 'animate', 'animation', 'entrance', 'scroll reveal', 'fade in', 'stagger', 'counter', 'count up', 'skeleton', 'loading state', 'parallax', 'progress bar', 'spring', 'overshoot', 'tilt', 'hover lift', 'underline animation', 'easing curve', 'reduce motion', 'a11y motion'."
license: MIT
compatibility: "Browser (IntersectionObserver). Python 3.12+ renderer ships amvcp-animation.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Animation

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads on requests to animate, add an entrance / scroll reveal / count-up / loading skeleton / floating element / hover polish / 3D tilt / parallax / spring overshoot / progress bar / SVG line-draw. Adds **motion** to any visual-communicator artifact through six layers — all dependency-free CSS + vanilla JS, all `prefers-reduced-motion` safe with a meaning-preserving substitute (never a blanket `animation: none`), all themed off the DESIGN.md `--vc-motion-*` / `--vc-duration-*` / `--vc-easing-*` / `--vc-color-*` tokens.

The skill is **information-bearing vs decorative aware**: informational animations (entrance, reveal, counter, loading) substitute with a meaning-preserving fade; decorative loops (`.va-float-y` etc.) substitute with removal. The atom selection contract (TRDD-352ef46a) stamps every informational atom with `data-ve-id` + `data-ve-type` + decision mini-pill so each animated card / counter / section is one comment-able + decision-tagable unit under the unified contract.

Six layers shipped:
1. **Motion tokens** — durations, easings, stagger step, master damper, scale.
2. **Accessibility gate** — every animation ships a `reduce` substitute, live-toggled.
3. **Entry animation** — `--va-index`-driven staggered insertion for lists / cards / grids.
4. **Scroll-triggered** — fire-once IO reveal, 8-pattern catalog, stat counter, parallax tiers, progress bar, snap, pinned, clip-reveal.
5. **Loading states** — pulse-ring dot, shimmer skeleton.
6. **Ambient & hover polish** — float-y / breathe / orbit / rotate, link underline, 3D card tilt.
7. **Performance** — off-screen loop pause, idle-deferred init, delta-time loop primitive.

## When to choose this category

| User says | Pick | Reference file |
|---|---|---|
| "animate the cards" / "cascade in" / "stagger" | Layer 2 stagger | `references/stagger-entry.md` |
| "reveal on scroll" / "fade in when visible" | Layer 3 scroll-reveal | `references/scroll-reveal.md` |
| "count up" / "animated number" / "rolling counter" | Layer 3 counter | `references/count-up.md` |
| "loading skeleton" / "shimmer placeholder" | Layer 5 skeleton | `references/skeleton-shimmer.md` |
| "loading dot" / "pulse" / "awaiting indicator" | Layer 5 pulse | `references/pulse-ring.md` |
| "floating" / "bobbing" / "breathing" / "spinning" / "orbiting" | Layer 4 floats | `references/floating-presets.md` |
| "card tilt on hover" / "3D card" | Layer 4 tilt | `references/card-tilt-3d.md` |
| "animated link underline" / "underline grows on hover" | Layer 4 link | `references/link-underline.md` |
| "parallax" / "depth layers" / "background moves slower" | Layer 3 parallax | `references/parallax-tiers.md` |
| "read-progress bar" / "page progress indicator" | Layer 3 progress bar | `references/scroll-progress-bar.md` |
| "scroll snap" / "snap sections to viewport" | Layer 3 snap | `references/scroll-snap.md` |
| "pinned section" / "sticky hero" | Layer 3 pinned | `references/pinned-section.md` |
| "clip wipe reveal" / "wipe in from left" | Layer 3 clip reveal | `references/clip-reveal-wipe.md` |
| "scale in" / "card pop in" / "fade and scale" | Layer 3 scale reveal | `references/scale-reveal-pop.md` |
| "spring" / "overshoot" / "bouncy entrance" | Layer 4 spring | `references/spring-overshoot.md` |
| "hover lift" / "elevate on hover" / "card shadow on hover" | Layer 4 hover lift | `references/hover-lift-cards.md` |
| "SVG line draw" / "trace path" / "draw chart line" | Layer 3 SVG | `references/svg-animation.md` |
| "respect reduce motion" / "accessibility motion gate" | Layer 1 reduce | `references/reduced-motion-gate.md` |
| "motion tokens" / "duration token" / "easing token" | Layer 0 tokens | `references/motion-tokens.md` |
| "ease out" / "ease in" / "cubic-bezier" / "which curve" | Layer 0 easing | `references/easing-curves.md` |
| "performance" / "loop pause" / "idle defer" | Layer 6 perf | `references/performance.md`, `references/loop-pause-observer.md`, `references/idle-deferred-init.md` |
| "canvas loop" / "game loop" / "rAF loop" | Layer 6 loop primitive | `references/delta-time-loop.md` |
| "stepper spinner" / "active step rotating" | Interactive-control handoff | `references/interactive-control-stepper.md` |
| "slide entrance moods" / "slide-to-slide transitions" | Slide-deck handoff | `references/slide-deck-transitions.md` |
| "chart entrance" / "KPI counter card" | Chart handoff | `references/chart-skill-handoff.md` |
| "flow diagram reveal" / "animated edges" | Diagram handoff | `references/diagram-skill-handoff.md` |
| "wireframe bobbing card" / "playful variant" | Wireframe recipe | `references/wireframe-bobbing-card-stack.md` |
| "selection / comment / decision pill on atom" | Atom contract | `references/atom-selection-stamping.md` |
| "after dynamic insertion" / "modal opened" / "refresh wiring" | Dynamic refresh | `references/dynamic-content-refresh.md` |
| "print" / "export to PDF" / "page break" | Print substitute | `references/print-and-export.md` |
| "touch / keyboard parity" / "focus-visible" | Input parity | `references/touch-and-keyboard.md` |
| "what's the right CSS property to animate" | Properties guide | `references/transition-properties.md` |
| "animation-fill-mode" / "items flash before stagger" | Fill mode | `references/animation-fill-mode.md` |
| "list of every keyframe" / "what does vaFloatY do" | Keyframe catalog | `references/keyframe-catalog.md` |
| "informational or decorative" / "what substitute pattern" | Categorization | `references/decorative-vs-informational.md` |
| "scroll-driven CSS" / "animation-timeline" / "view()" | Native scroll-driven | `references/scroll-driven-timelines.md` |
| "what NOT to do" / "common mistakes" / "antipatterns" | Anti-patterns | `references/anti-patterns.md` |
| "how does the CSS get on the page" / "manual init" | Bootstrap | `references/css-injection-bootstrap.md` |
| "planning a complex animation" / "13-section checklist" | Authoring aid | `references/animation-plan-template.md` |
| "ambient + loading overview" | Layer 4+5 overview | `references/ambient-and-loading.md` |
| "entry + scroll overview" | Layer 2+3 overview | `references/entry-and-scroll.md` |

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) present — supplies the motion tokens.
- `amvcp-animation.js` + `amvcp-designmd.js` ship beside the output HTML.
- A `motion:` group in the DESIGN.md is **optional** — every CSS rule carries a canonical fallback, so a token-less DESIGN.md still animates correctly.
- Chromium browser with `IntersectionObserver` (a fail-safe reveals all content if it is absent — content is never stuck invisible).

## Instructions

1. **Pick a layer / pattern** from the table above. Read the matching reference file for the full contract.
2. **Apply the class or `data-va-*` attribute** to your markup. The runtime auto-initializes — no manual JS call needed unless you opted into manual init.
3. **Entry stagger** → `.va-stagger` list with `.va-stagger-item` children (author `style="--va-index:N"` inline, or let the indexer fill it).
4. **Scroll reveal** → `data-va-reveal` on long-scroll sections (`fade` / `scale` / `clip` / `stagger` variants).
5. **Stat counter** → `<span class="va-counter" data-va-stat="45200">0</span>` (optional `data-va-stat-decimals`, `data-va-stat-suffix`).
6. **Loading** → `.va-skeleton` (+ `--text` / `--title` / `--block`) for streamed content; `.va-pulse` for an awaiting indicator.
7. **Ambient** → `.va-float-y` / `.va-breathe` / `.va-orbit` / `.va-rotate` sparingly on hero/cover; `.va-link` underline; `.va-tilt` card.
8. **Parallax** → `.va-parallax-1`..`6` very sparingly (P3 — drives the page's own scroll axis, never an inner box).
9. **Verify** with the dev-browser screenshot workflow (`skills/amvcp-self-debug-rules/SKILL.md`) — light + dark themes both, `prefers-reduced-motion: reduce` emulated, no nested scrollbars introduced.

## The motion-token contract

The skill reads 10 `motion:` keys via `var(--vc-*, fallback)`. See `references/motion-tokens.md` for the full contract. The four animation-specific keys: `duration-entrance` (600ms), `stagger-step` (80ms), `easing-spring`, `scale` (the 0..1 master damper that multiplies transform distance — `scale: 0` is a theme-level calm mode). Durations/easings are theme-agnostic; painted animations (skeleton, pulse) read `--vc-color-*` so both light and dark are correct.

## Output

Self-contained HTML: CSS injected by `amvcp-animation.js` on boot, the module shipped beside the file, no CDN, no build step. Every animation has a `reduce` substitute — information-bearing motion gets a meaning-preserving fallback; decorative-only loops are simply removed. Every animated atom carries `data-ve-id` + `data-ve-type` per the unified contract; a decision mini-pill mounts via the runtime.

## Error Handling

- **Content stuck invisible** → `data-va-reveal` present but `amvcp-animation.js` not loaded; check the `<script>` tag.
- **Stagger items flash then animate** → missing `animation-fill-mode: both` (see `references/animation-fill-mode.md`).
- **Counter shows `NaN`** → `data-va-stat` is not a number.
- **Motion ignored entirely** → DESIGN.md `motion.scale: 0`, OR the OS `prefers-reduced-motion` is on (both intended).
- **Parallax janky** → too many `.va-parallax-*` layers; reduce the count.
- **Tilt doesn't fire** → `prefers-reduced-motion: reduce` is on (intentional — skipped under reduce).
- **Counter shows placeholder text in static export** → ensure the page rendered fully before export, OR set the placeholder text to the final value (see `references/print-and-export.md`).
- **Loop runs off-screen** → confirm `.va-float-y` etc. is in `LOOP_SELECTOR`; custom infinite loops need to be added there or get their own IO (see `references/loop-pause-observer.md`).

## Examples

**Input:** "animate the metrics row so the cards cascade in and the numbers count up."

**Output:** wrap the row in `.va-stagger` with `data-va-stagger`, give each card `.va-stagger-item`, put `class="va-counter" data-va-stat="N"` on each number. On load the cards fade-and-rise in sequence; each counter rolls 0→N. With reduced motion on, cards fade in with no travel and counters show their final value at once.

**Input:** "add a 3D tilt to the feature cards and a hover lift on every card."

**Output:** add `.va-tilt` to the feature cards (3D rotation on mousemove, JS-wired). Add the hover-lift recipe (see `references/hover-lift-cards.md`) to all `.ve-card` rules — `transform: translateY(-3px)` + `box-shadow` + `border-color: accent` on `:hover` + `:focus-visible`. With reduced motion on, the tilt JS is skipped entirely; the lift becomes instant (no transition).

**Input:** "make the hero ornament gently float and add a parallax background pattern."

**Output:** wrap the ornament in a `<div class="va-float-y">` (3s vertical bob, decorative, removed under reduce). Add a `<div class="va-parallax-2">` containing the background pattern SVG (0.25 depth factor — moves at quarter scroll speed). With reduced motion on, the float disables (ornament sits at rest) and the parallax flattens (`transform: none`).

## Authoring aid

For complex multi-stage sequences, fill in `references/animation-plan-template.md` (the 13-section OT-08 checklist) before implementing — sections 7 (reduced-motion variants) and 8 (performance budget) make the accessibility gate and the perf layer checklist items, not afterthoughts.

## Visual verification

For every change to the animation skill's CSS or JS, run the dev-browser workflow from `skills/amvcp-self-debug-rules/SKILL.md`:
- Screenshot at strategic frames (t=0, mid-animation, end).
- Verify in BOTH light and dark themes (the skill paints with `--vc-color-*` tokens).
- Verify in BOTH `prefers-reduced-motion: no-preference` AND `prefers-reduced-motion: reduce`.
- Verify the no-nested-scrollbars invariant (the parallax + snap + progress-bar all drive the document's own scroll axis).

## Resources

### Layer 0 — Motion tokens
- `references/motion-tokens.md` — the `--vc-motion-*` token contract.
- `references/easing-curves.md` — the five canonical curves (standard, decel, accel, spring, linear).

### Layer 1 — Accessibility gate
- `references/reduced-motion-gate.md` — the substitute pattern, never `animation: none`.
- `references/decorative-vs-informational.md` — the binary that drives substitute choice.

### Layer 2 — Entry animation
- `references/stagger-entry.md` — `--va-index`-driven cascade (complete contract).
- `references/animation-fill-mode.md` — why `both` is mandatory.

### Layer 3 — Scroll-triggered
- `references/scroll-reveal.md` — fire-once IO engine + 4 variants.
- `references/scale-reveal-pop.md` — `data-va-reveal="scale"` cards.
- `references/clip-reveal-wipe.md` — `data-va-reveal="clip"` LTR wipe.
- `references/count-up.md` — rAF counter, exported `animateStat()`.
- `references/parallax-tiers.md` — `.va-parallax-1` through `.va-parallax-6`.
- `references/scroll-progress-bar.md` — `.va-progress-bar` fixed top.
- `references/scroll-snap.md` — `.va-snap-root` + `.va-snap-item` (page-root snap).
- `references/pinned-section.md` — `position: sticky` for full-viewport pinning.
- `references/scroll-driven-timelines.md` — native `animation-timeline: scroll()/view()`.
- `references/svg-animation.md` — line-draw, fill-from-zero, polygon expand.
- `references/entry-and-scroll.md` — overview of Layer 2+3.

### Layer 4 — Ambient + hover polish
- `references/floating-presets.md` — `va-float-y`, `va-breathe`, `va-orbit`, `va-rotate`.
- `references/link-underline.md` — `.va-link` background-size grow.
- `references/card-tilt-3d.md` — `.va-tilt` perspective rotation.
- `references/hover-lift-cards.md` — the `.ve-card` hover-lift recipe.
- `references/spring-overshoot.md` — `--vc-easing-spring` for playful arrivals.
- `references/wireframe-bobbing-card-stack.md` — bobbing card + shadow-scale recipe.

### Layer 5 — Loading states
- `references/pulse-ring.md` — `.va-pulse` expanding-ring indicator.
- `references/skeleton-shimmer.md` — `.va-skeleton` sliding-gradient placeholder.
- `references/ambient-and-loading.md` — overview of Layer 4+5.

### Layer 6 — Performance + advanced
- `references/performance.md` — Layer 6 overview (IO-pause, idle-defer, delta loop).
- `references/loop-pause-observer.md` — auto-pause off-screen loops.
- `references/idle-deferred-init.md` — the two-tier init contract.
- `references/delta-time-loop.md` — `createLoop(update, render)` primitive.

### Cross-skill handoffs
- `references/chart-skill-handoff.md` — counter primitive + entrance for charts.
- `references/diagram-skill-handoff.md` — flow edges + scroll reveal for diagrams.
- `references/interactive-control-stepper.md` — spin keyframe for active step.
- `references/slide-deck-transitions.md` — 5 moods + 4 transitions for slides.

### Contract + bootstrap
- `references/atom-selection-stamping.md` — `data-ve-id` + decision-pill contract.
- `references/dynamic-content-refresh.md` — `refresh()` + `revealNow()` APIs.
- `references/css-injection-bootstrap.md` — `injectAnimationCSS()` + manual-init opt-out.
- `references/keyframe-catalog.md` — every `@keyframes` the skill ships.
- `references/transition-properties.md` — what CSS properties to animate (and avoid).

### Cross-cutting concerns
- `references/print-and-export.md` — `@media print` substitute behavior.
- `references/touch-and-keyboard.md` — touch + keyboard affordance parity.
- `references/anti-patterns.md` — what NOT to do, with diagnostics.

### Authoring aid
- `references/animation-plan-template.md` — OT-08 13-section authoring checklist.
