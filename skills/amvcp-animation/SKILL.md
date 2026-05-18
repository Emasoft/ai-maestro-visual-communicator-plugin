---
name: amvcp-animation
description: "Add motion to visual-communicator HTML — staggered entry, scroll reveal, stat counters, loading skeletons, hover polish, 3D card tilt, parallax, spring overshoot, SVG line-draw. CSS + vanilla JS, zero libraries, DESIGN.md motion tokens, prefers-reduced-motion safe. Use when the user asks to animate, add scroll/entrance reveal, count-up, skeleton, parallax, hover lift. Trigger with 'animate', 'entrance', 'scroll reveal', 'stagger', 'count up', 'skeleton', 'parallax', 'spring', 'tilt', 'hover lift', 'reduce motion'."
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
| "animate the cards" / "cascade in" / "stagger" | Layer 2 stagger | [stagger-entry](references/stagger-entry.md) |
  > The contract in one paragraph · Static markup (JS off, deterministic order) · Dynamic markup (runtime-built lists) · The keyframe and its CSS contract · Read layout before animate (the AN-04 kept lesson) · Per-index delay formula details · Combining with scroll reveal (`data-va-reveal="stagger"`) · DESIGN.md tokens consumed · Reduced-motion substitute — `vaFadeOnly` · Selection + comment + decision integration · Hot-swap with DESIGN.md · Diagnostics · Visual verification
| "reveal on scroll" / "fade in when visible" | Layer 3 scroll-reveal | [scroll-reveal](references/scroll-reveal.md) |
  > The contract · The four variants · When to use each variant · Threshold tuning — why 0.15 and -50px · Fail-safe: no IntersectionObserver → reveal everything · Fire-once via `unobserve` · Counter targets are also reveal targets · Combining with stagger (`data-va-reveal="stagger"`) · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Dynamic insertion — `revealNow(el)` and `refresh(root)` · Diagnostics · Visual verification
| "count up" / "animated number" / "rolling counter" | Layer 3 counter | [count-up](references/count-up.md) |
  > Markup · Attributes · The tick loop · Formatting choices · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Hot-swap with DESIGN.md · Chart skill consumer · Diagnostics · Visual verification
| "loading skeleton" / "shimmer placeholder" | Layer 5 skeleton | [skeleton-shimmer](references/skeleton-shimmer.md) |
  > The contract · The CSS · DESIGN.md tokens consumed · When to use which modifier · Markup recipes · Replacing the skeleton with real content · Performance — paused while off-screen · Reduced-motion substitute · Selection + comment + decision integration · Color contrast — light vs dark · Diagnostics · Visual verification · When NOT to use a skeleton
| "loading dot" / "pulse" / "awaiting indicator" | Layer 5 pulse | [pulse-ring](references/pulse-ring.md) |
  > The contract · The CSS · DESIGN.md tokens consumed · When to use the pulse · Markup recipes · Performance — paused while off-screen · Reduced-motion substitute · Selection + comment + decision integration · Color tuning across themes · Ring size tuning · Diagnostics · Visual verification
| "floating" / "bobbing" / "breathing" / "spinning" / "orbiting" | Layer 4 floats | [floating-presets](references/floating-presets.md) |
  > The four presets · The keyframes · The orbit math · Markup · Performance: the loop-pause observer · DESIGN.md tokens consumed · Reduced-motion substitute — REMOVAL · Selection + comment + decision integration · When to use which preset · Bobbing card stack — the mined variant (`02-exploration-visual-designs`) · Diagnostics · Visual verification
| "card tilt on hover" / "3D card" | Layer 4 tilt | [card-tilt-3d](references/card-tilt-3d.md) |
  > The contract · The CSS · The JS · The perspective formula · The 10° max angle · DESIGN.md tokens consumed · When to use · Performance · Reduced-motion substitute · Combining with static hover · Selection + comment + decision integration · Dynamic insertion · Diagnostics · Visual verification
| "animated link underline" / "underline grows on hover" | Layer 4 link | [link-underline](references/link-underline.md) |
  > The contract · The CSS · DESIGN.md tokens consumed · When to use · Why a left-grow (and not center-out)? · Underline thickness · Reduced-motion substitute · Why standard easing, not decel? · Selection + comment + decision integration · Mined pattern note: hover lift on cards (`index.html`, `06`) · Diagnostics · Visual verification
| "parallax" / "depth layers" / "background moves slower" | Layer 3 parallax | [parallax-tiers](references/parallax-tiers.md) |
  > The contract · Markup · The scroll listener — passive, rAF-coalesced · Why parallax reads the DOCUMENT scroll axis only · DESIGN.md tokens consumed · Native scroll-driven animation (`animation-timeline: scroll()`) · Reduced-motion substitute · How many parallax layers is too many? · Selection + comment + decision integration · Diagnostics · Visual verification
| "read-progress bar" / "page progress indicator" | Layer 3 progress bar | [scroll-progress-bar](references/scroll-progress-bar.md) |
  > The contract · How the progress is computed · When to use the progress bar · Color and z-index · DESIGN.md tokens consumed · Why no transition? · Reduced-motion substitute · Selection + comment + decision integration · Placement guidance · Multiple progress bars · Diagnostics · Visual verification · When to combine with the parallax tier
| "scroll snap" / "snap sections to viewport" | Layer 3 snap | [scroll-snap](references/scroll-snap.md) |
  > The contract · Markup · Why on the page root, NEVER an inner box · Snap-align modes · Combining with reveal / counter / parallax · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Combining with the slide-decks skill · Diagnostics · Visual verification · Pattern note: the "scroll-snap-only slide deck"
| "pinned section" / "sticky hero" | Layer 3 pinned | [pinned-section](references/pinned-section.md) |
  > The recipe · Why `position: sticky` works for this · Combining with view() timeline (native scroll-driven) · DESIGN.md tokens consumed · When to use a pinned section · Reduced-motion substitute · Selection + comment + decision integration · Performance · Diagnostics · Visual verification · Stacking variation · Comparison with the snap pattern · Author extension: the timeline-of-events pattern
| "clip wipe reveal" / "wipe in from left" | Layer 3 clip reveal | [clip-reveal-wipe](references/clip-reveal-wipe.md) |
  > The contract · The CSS · The `inset()` syntax · When to use clip-reveal · DESIGN.md tokens consumed · Reduced-motion substitute · Counter targets are not clip targets · Selection + comment + decision integration · Performance · Diagnostics · Visual verification
| "scale in" / "card pop in" / "fade and scale" | Layer 3 scale reveal | [scale-reveal-pop](references/scale-reveal-pop.md) |
  > The contract · The CSS · Why 0.94, not 0.85 or 0.97? · When to use scale reveal · DESIGN.md tokens consumed · The transform-origin question · Reduced-motion substitute · Combining with stagger · Selection + comment + decision integration · Performance · Diagnostics · Visual verification · Comparison with spring overshoot
| "spring" / "overshoot" / "bouncy entrance" | Layer 4 spring | [spring-overshoot](references/spring-overshoot.md) |
  > The curve · When to use · Markup example — a spring scale-in · The skill DOES NOT ship a default `.va-spring-in` class · DESIGN.md tokens consumed · Reduced-motion substitute · Confetti pop — the mined variant (`07-prototype-animation.html`) · Settle keyframe — the 3-keyframe spring · Selection + comment + decision integration · Diagnostics · Visual verification · How the curve is constructed
| "hover lift" / "elevate on hover" / "card shadow on hover" | Layer 4 hover lift | [hover-lift-cards](references/hover-lift-cards.md) |
  > The recipe · The skill does NOT ship `.ve-card` · Combining with `.va-tilt` · DESIGN.md tokens consumed · Reduced-motion substitute · Touch devices · Selection + comment + decision integration · Diagnostics · Visual verification · Pattern note: the brief outline pulse on click-to-anchor
| "SVG line draw" / "trace path" / "draw chart line" | Layer 3 SVG | [svg-animation](references/svg-animation.md) |
  > Line draw (stroke-dashoffset) · Fill from zero (fill-opacity) · Polygon expand (radar/spider chart) · Animated arrow head · Path morph (d attribute interpolation) · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Animating SVG with the `<use>` element · Diagnostics · Visual verification · Browser support · Why CSS animation on SVG, not SMIL · Author extension: hand-drawn-feeling SVG
| "respect reduce motion" / "accessibility motion gate" | Layer 1 reduce | [reduced-motion-gate](references/reduced-motion-gate.md) |
  > Why substitute (not disable) · The two categories — information-bearing vs decorative · OS detection at runtime · Live OS-preference updates · CSS pattern — every animation, twice · JS pattern — read `REDUCED` once per call · DESIGN.md `motion.scale: 0` is ORTHOGONAL, not equivalent · The decision-tree for "what substitute do I write?" · Diagnostics · Visual verification · Selection / decision integration
| "motion tokens" / "duration token" / "easing token" | Layer 0 tokens | [motion-tokens](references/motion-tokens.md) |
  > The `motion:` group in DESIGN.md · CSS custom properties consumed · `--vc-motion-scale` — the master damper · Why durations are not light/dark themed · Token absence is safe
| "ease out" / "ease in" / "cubic-bezier" / "which curve" | Layer 0 easing | [easing-curves](references/easing-curves.md) |
  > The five curves · Picking the curve by question · Why decel on entrances (not standard) · Spring overshoot — the one playful curve · Reduced-motion: every easing collapses to `ease` 200ms · DESIGN.md authoring · Easing-presets-swap-a-single-CSS-var (from html-effectiveness · Reduced-motion substitute (curve doesn't apply) · Visual verification · Selection / decision integration
| "performance" / "loop pause" / "idle defer" | Layer 6 perf | [performance](references/performance.md), [loop-pause-observer](references/loop-pause-observer.md), [idle-deferred-init](references/idle-deferred-init.md) |
  > Off-screen loop pause (AN-11) · Idle-deferred init (AN-11) · Delta-time loop primitive (AN-12) · Re-scanning dynamic content · Live reduced-motion changes
  > The contract · Why it matters · Default threshold = 0 · NOT fire-once · When the observer can't attach · Deferred init · Re-scanning dynamic content · DESIGN.md tokens consumed · When NOT to apply the loop-pause pattern · Reduced-motion interaction · Selection + comment + decision integration · Diagnostics · Visual verification · Why a SEPARATE observer (and not the reveal one)? · Performance budget for loops
  > The two tiers · The `deferInit` helper · Why two tiers, not one · DESIGN.md tokens consumed · Reduced-motion interaction · Selection + comment + decision integration · Tier-2 init failure recovery · Order of deferred work · Re-running deferred init · Diagnostics · Visual verification
| "canvas loop" / "game loop" / "rAF loop" | Layer 6 loop primitive | [delta-time-loop](references/delta-time-loop.md) |
  > The public API · The implementation · The `start()` idempotency · The `stop()` cancel · Why ship a primitive nothing uses? · DESIGN.md tokens consumed · Reduced-motion interaction · Example consumer — a hypothetical chart entrance · Selection + comment + decision integration · Diagnostics · Visual verification · When NOT to use this primitive
| "stepper spinner" / "active step rotating" | Interactive-control handoff | [interactive-control-stepper](references/interactive-control-stepper.md) |
  > The stepper visual · The spin keyframe · DESIGN.md tokens consumed · Reduced-motion substitute · Loop-pause integration · Selection + comment + decision integration · Composing with the progressive stepper's other states · DESIGN.md hot-swap · Diagnostics · Visual verification · Pattern: "this is busy" indicators · Author extension: custom spinner shapes · Why not `<animate>` SMIL on the SVG?
| "slide entrance moods" / "slide-to-slide transitions" | Slide-deck handoff | [slide-deck-transitions](references/slide-deck-transitions.md) |
  > The 5 entrance moods · Why moods, not "transitions" · The 4 inter-slide transitions · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Mood selection heuristics · Stagger across the deck · Slide navigation indicators · Loop-pause for slide animations · Diagnostics · Visual verification · Future slide-deck extensions
| "chart entrance" / "KPI counter card" | Chart handoff | [chart-skill-handoff](references/chart-skill-handoff.md) |
  > `animateStat(el)` — the counter primitive · How the chart skill should call it · Why the chart skill doesn't re-implement count-up · Chart entrance animations · Stat-card reveal pattern · Chart canvas + animation skill · DESIGN.md tokens shared · Reduced-motion substitute · Selection + comment + decision integration · Diagnostics · Visual verification · Future chart-skill extensions
| "flow diagram reveal" / "animated edges" | Diagram handoff | [diagram-skill-handoff](references/diagram-skill-handoff.md) |
  > Scroll-reveal for numbered flow walks · SVG flow-edge animations · Token contract for diagram animations · Reduced-motion substitute · Selection + comment + decision integration · Interactive flowcharts (click-step → side-panel pattern) · Scroll-reveal trigger on diagrams · Hot-swap with DESIGN.md · Diagnostics · Visual verification · Future diagram-skill extensions
| "wireframe bobbing card" / "playful variant" | Wireframe recipe | [wireframe-bobbing-card-stack](references/wireframe-bobbing-card-stack.md) |
  > The visual · The recipe · Why ::after for the shadow · DESIGN.md tokens consumed · Reduced-motion substitute · Loop-pause integration · Selection + comment + decision integration · When to use the bobbing card stack · Visual verification · Pattern note: the wireframe-skill connection · Combining with hover lift · Custom shadow color
| "selection / comment / decision pill on atom" | Atom contract | [atom-selection-stamping](references/atom-selection-stamping.md) |
  > The atom kinds the skill stamps · The stamper · What "atoms" are in the contract · The decision mini-pill · Defensive deferral when the runtime isn't loaded yet · What is NOT stamped · DESIGN.md tokens consumed · Reduced-motion interaction · Re-stamping on refresh · Atom ID stability across re-renders · Selection model integration · Diagnostics · Visual verification · Why the skill stamps (not the runtime)
| "after dynamic insertion" / "modal opened" / "refresh wiring" | Dynamic refresh | [dynamic-content-refresh](references/dynamic-content-refresh.md) |
  > `refresh(root)` — re-scan a subtree · Idempotency · When to call `refresh()` · `revealNow(el)` — force-reveal one element immediately · When to use `revealNow()` vs `refresh()` · The reveal observer's `_revealCount` test hook · DESIGN.md tokens consumed · Reduced-motion interaction · Selection + comment + decision integration · Live OS-preference toggle · Diagnostics · Visual verification · When refresh fails silently
| "print" / "export to PDF" / "page break" | Print substitute | [print-and-export](references/print-and-export.md) |
  > The default print behavior · The print stylesheet (proposed) · Print-safe authoring · The `prefers-reduced-motion` interaction · PDF export · DESIGN.md tokens consumed · When the skill's elements appear on paper · Counter readability on print · Reduced-motion substitute (for the print medium) · Selection + comment + decision integration · Page-break control · Diagnostics · Visual verification · When NOT to add the print stylesheet · Future runtime addition
| "touch / keyboard parity" / "focus-visible" | Input parity | [touch-and-keyboard](references/touch-and-keyboard.md) |
  > The categories · Keyboard parity for hover · Touch device handling · Why no `@media (hover: hover)` guard in the skill · Pointer-events: none — when to disable hover entirely · Reduced-motion + touch + keyboard · DESIGN.md tokens consumed · Selection + comment + decision integration · Diagnostics · Visual verification · Pattern note: focus rings · Pattern: `:focus-visible` and `:focus-within`
| "what's the right CSS property to animate" | Properties guide | [transition-properties](references/transition-properties.md) |
  > The two property categories · Examples — the skill's choices · Why opacity AND transform together · Properties to AVOID animating · DESIGN.md tokens consumed · Reduced-motion substitute · `will-change` hints — when (NOT) to use · Combining properties on one element · Diagnostics · Visual verification · Reference table — animation-safe properties
| "animation-fill-mode" / "items flash before stagger" | Fill mode | [animation-fill-mode](references/animation-fill-mode.md) |
  > The four modes · Why `both` is required · Why `backwards` alone is insufficient · Why not `forwards` alone? · The skill uses `both` everywhere · When `both` doesn't apply · Reduced-motion interaction · DESIGN.md tokens consumed · How to combine with other animation properties · The other fill-mode use cases · Diagnostics · Visual verification · The `data-va-reveal` rule uses transitions, not animations
| "list of every keyframe" / "what does vaFloatY do" | Keyframe catalog | [keyframe-catalog](references/keyframe-catalog.md) |
  > The ten keyframes · `vaFadeSlideUp` — the entrance default · `vaFadeOnly` — the universal reduce substitute · `vaFloatY` — the vertical bob · `vaBreathe` — the scale pulse · `vaOrbit` — the circular orbit · `vaRotate` — the in-place spin · `vaPulseRing` — the expanding ring · `vaShimmer` — the sliding gradient · Composition rules · DESIGN.md token consumption per keyframe · Reduced-motion handling · Selection + comment + decision integration · Diagnostics · Visual verification
| "informational or decorative" / "what substitute pattern" | Categorization | [decorative-vs-informational](references/decorative-vs-informational.md) |
  > Overview · The two categories defined · The decision tree · Worked examples · What about edge cases? · Why the category matters for selection · Why the category matters for performance · Mistakes to avoid · DESIGN.md tokens by category · Authoring checklist · Diagnostics · Visual verification
| "scroll-driven CSS" / "animation-timeline" / "view()" | Native scroll-driven | [scroll-driven-timelines](references/scroll-driven-timelines.md) |
  > The two timelines · The catalog of native scroll patterns · Browser support (as of writing) · Authoring the pinned pattern · Authoring the stacking pattern · Authoring the scrub pattern · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Why ship JS fallbacks for everything · Diagnostics · Visual verification · When to opt into the native API
| "what NOT to do" / "common mistakes" / "antipatterns" | Anti-patterns | [anti-patterns](references/anti-patterns.md) |
  > 1. `animation: none !important` on `prefers-reduced-motion: reduce` · 2. Animating layout-triggering properties · 3. Missing `animation-fill-mode: both` on staggered entry · 4. Setting `--va-index` via `:nth-child` selectors · 5. Forgetting `:focus-visible` on hover-driven animations · 6. Removing focus rings without replacement · 7. `transform-origin: 0 0` on a centered element · 8. Infinite loops without loop-pause · 9. Mocking the runtime in tests instead of loading it · 10. Calling `init()` multiple times without `refresh()` · 11. Using SMIL instead of CSS for SVG animations · 12. Hardcoded durations / easings in CSS · 13. Using `text-decoration` for animated underlines · 14. Mixing GSAP / anime.js / Lenis / etc. · 15. Storing animation state in JS closures instead of CSS · 16. Adding `will-change` everywhere · 17. Animation duration in CSS, but JS reads a different value · 18. Animating elements outside the viewport unnecessarily · 19. Static `box-shadow` for hover (no transition) · 20. Treating `prefers-reduced-motion` as binary on/off only · Quick reference table
| "how does the CSS get on the page" / "manual init" | Bootstrap | [css-injection-bootstrap](references/css-injection-bootstrap.md) |
  > The injection function · Why ship CSS inside the JS module · The injected stylesheet contents · Auto-init vs manual init · The test fixture also uses manual init · The dual export (browser + Node) · DESIGN.md tokens consumed · Reduced-motion interaction · Why `data-va="animation"` not `data-amvcp="animation"` · Test hooks — `window.__veAnimation` · Diagnostics · Visual verification · When to opt into manual init
| "planning a complex animation" / "13-section checklist" | Authoring aid | [animation-plan-template](references/animation-plan-template.md) |
  > 1. Timing overview · 2. Element inventory · 3. Entrance sequence · 4. Idle / loop state · 5. Interaction responses · 6. Exit sequence · 7. Reduced-motion variants  ← MANDATORY · 8. Performance budget  ← MANDATORY · 9. Dependencies · 10. Device notes · 11. Test scenarios · 12. Implementation order · 13. Review checkpoints
| "ambient + loading overview" | Layer 4+5 overview | [ambient-and-loading](references/ambient-and-loading.md) |
  > Layer 4 — four floating presets · Layer 4 — animated link underline (`.va-link`) · Layer 4 — 3D card tilt (`.va-tilt`) · Layer 5 — pulse-ring dot (`.va-pulse`) · Layer 5 — shimmer skeleton (`.va-skeleton`)
| "entry + scroll overview" | Layer 2+3 overview | [entry-and-scroll](references/entry-and-scroll.md) |
  > Layer 2 — staggered entry (`.va-stagger`) · Layer 3 — fire-once scroll reveal (`data-va-reveal`) · Layer 3 — stat counter (`.va-counter`) · Layer 3 — cinematic scroll-pattern catalog

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
9. **Verify** with the dev-browser screenshot workflow ([amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md)) — light + dark themes both, `prefers-reduced-motion: reduce` emulated, no nested scrollbars introduced.

## The motion-token contract

The skill reads 10 `motion:` keys via `var(--vc-*, fallback)`. See [motion-tokens](references/motion-tokens.md) for the full contract. The four animation-specific keys: `duration-entrance` (600ms), `stagger-step` (80ms), `easing-spring`, `scale` (the 0..1 master damper that multiplies transform distance — `scale: 0` is a theme-level calm mode). Durations/easings are theme-agnostic; painted animations (skeleton, pulse) read `--vc-color-*` so both light and dark are correct.
  > The `motion:` group in DESIGN.md · CSS custom properties consumed · `--vc-motion-scale` — the master damper · Why durations are not light/dark themed · Token absence is safe

## Output

Self-contained HTML: CSS injected by `amvcp-animation.js` on boot, the module shipped beside the file, no CDN, no build step. Every animation has a `reduce` substitute — information-bearing motion gets a meaning-preserving fallback; decorative-only loops are simply removed. Every animated atom carries `data-ve-id` + `data-ve-type` per the unified contract; a decision mini-pill mounts via the runtime.

## Error Handling

- **Content stuck invisible** → `data-va-reveal` present but `amvcp-animation.js` not loaded; check the `<script>` tag.
- **Stagger items flash then animate** → missing `animation-fill-mode: both` (see [animation-fill-mode](references/animation-fill-mode.md)).
  > The four modes · Why `both` is required · Why `backwards` alone is insufficient · Why not `forwards` alone? · The skill uses `both` everywhere · When `both` doesn't apply · Reduced-motion interaction · DESIGN.md tokens consumed · How to combine with other animation properties · The other fill-mode use cases · Diagnostics · Visual verification · The `data-va-reveal` rule uses transitions, not animations
- **Counter shows `NaN`** → `data-va-stat` is not a number.
- **Motion ignored entirely** → DESIGN.md `motion.scale: 0`, OR the OS `prefers-reduced-motion` is on (both intended).
- **Parallax janky** → too many `.va-parallax-*` layers; reduce the count.
- **Tilt doesn't fire** → `prefers-reduced-motion: reduce` is on (intentional — skipped under reduce).
- **Counter shows placeholder text in static export** → ensure the page rendered fully before export, OR set the placeholder text to the final value (see [print-and-export](references/print-and-export.md)).
  > The default print behavior · The print stylesheet (proposed) · Print-safe authoring · The `prefers-reduced-motion` interaction · PDF export · DESIGN.md tokens consumed · When the skill's elements appear on paper · Counter readability on print · Reduced-motion substitute (for the print medium) · Selection + comment + decision integration · Page-break control · Diagnostics · Visual verification · When NOT to add the print stylesheet · Future runtime addition
- **Loop runs off-screen** → confirm `.va-float-y` etc. is in `LOOP_SELECTOR`; custom infinite loops need to be added there or get their own IO (see [loop-pause-observer](references/loop-pause-observer.md)).
  > The contract · Why it matters · Default threshold = 0 · NOT fire-once · When the observer can't attach · Deferred init · Re-scanning dynamic content · DESIGN.md tokens consumed · When NOT to apply the loop-pause pattern · Reduced-motion interaction · Selection + comment + decision integration · Diagnostics · Visual verification · Why a SEPARATE observer (and not the reveal one)? · Performance budget for loops

## Examples

**Input:** "animate the metrics row so the cards cascade in and the numbers count up."

**Output:** wrap the row in `.va-stagger` with `data-va-stagger`, give each card `.va-stagger-item`, put `class="va-counter" data-va-stat="N"` on each number. On load the cards fade-and-rise in sequence; each counter rolls 0→N. With reduced motion on, cards fade in with no travel and counters show their final value at once.

**Input:** "add a 3D tilt to the feature cards and a hover lift on every card."

**Output:** add `.va-tilt` to the feature cards (3D rotation on mousemove, JS-wired). Add the hover-lift recipe (see [hover-lift-cards](references/hover-lift-cards.md)) to all `.ve-card` rules — `transform: translateY(-3px)` + `box-shadow` + `border-color: accent` on `:hover` + `:focus-visible`. With reduced motion on, the tilt JS is skipped entirely; the lift becomes instant (no transition).
  > The recipe · The skill does NOT ship `.ve-card` · Combining with `.va-tilt` · DESIGN.md tokens consumed · Reduced-motion substitute · Touch devices · Selection + comment + decision integration · Diagnostics · Visual verification · Pattern note: the brief outline pulse on click-to-anchor

**Input:** "make the hero ornament gently float and add a parallax background pattern."

**Output:** wrap the ornament in a `<div class="va-float-y">` (3s vertical bob, decorative, removed under reduce). Add a `<div class="va-parallax-2">` containing the background pattern SVG (0.25 depth factor — moves at quarter scroll speed). With reduced motion on, the float disables (ornament sits at rest) and the parallax flattens (`transform: none`).

## Authoring aid

For complex multi-stage sequences, fill in [animation-plan-template](references/animation-plan-template.md) (the 13-section OT-08 checklist) before implementing — sections 7 (reduced-motion variants) and 8 (performance budget) make the accessibility gate and the perf layer checklist items, not afterthoughts.
  > 1. Timing overview · 2. Element inventory · 3. Entrance sequence · 4. Idle / loop state · 5. Interaction responses · 6. Exit sequence · 7. Reduced-motion variants  ← MANDATORY · 8. Performance budget  ← MANDATORY · 9. Dependencies · 10. Device notes · 11. Test scenarios · 12. Implementation order · 13. Review checkpoints

## Visual verification

For every change to the animation skill's CSS or JS, run the dev-browser workflow from [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md):
- Screenshot at strategic frames (t=0, mid-animation, end).
- Verify in BOTH light and dark themes (the skill paints with `--vc-color-*` tokens).
- Verify in BOTH `prefers-reduced-motion: no-preference` AND `prefers-reduced-motion: reduce`.
- Verify the no-nested-scrollbars invariant (the parallax + snap + progress-bar all drive the document's own scroll axis).

## Modes

This skill supports `data-ve-mode="readonly"` only. Output is view-only/illustrative animation — the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Multiple instances on one page are allowed; each gets an independent `data-ve-id` namespace. The only exclusive skill is the overlay-runtime (R24).

## Resources

### Layer 0 — Motion tokens
- [motion-tokens](references/motion-tokens.md) — the `--vc-motion-*` token contract.
  > The `motion:` group in DESIGN.md · CSS custom properties consumed · `--vc-motion-scale` — the master damper · Why durations are not light/dark themed · Token absence is safe
- [easing-curves](references/easing-curves.md) — the five canonical curves (standard, decel, accel, spring, linear).
  > The five curves · Picking the curve by question · Why decel on entrances (not standard) · Spring overshoot — the one playful curve · Reduced-motion: every easing collapses to `ease` 200ms · DESIGN.md authoring · Easing-presets-swap-a-single-CSS-var (from html-effectiveness · Reduced-motion substitute (curve doesn't apply) · Visual verification · Selection / decision integration

### Layer 1 — Accessibility gate
- [reduced-motion-gate](references/reduced-motion-gate.md) — the substitute pattern, never `animation: none`.
  > Why substitute (not disable) · The two categories — information-bearing vs decorative · OS detection at runtime · Live OS-preference updates · CSS pattern — every animation, twice · JS pattern — read `REDUCED` once per call · DESIGN.md `motion.scale: 0` is ORTHOGONAL, not equivalent · The decision-tree for "what substitute do I write?" · Diagnostics · Visual verification · Selection / decision integration
- [decorative-vs-informational](references/decorative-vs-informational.md) — the binary that drives substitute choice.
  > Overview · The two categories defined · The decision tree · Worked examples · What about edge cases? · Why the category matters for selection · Why the category matters for performance · Mistakes to avoid · DESIGN.md tokens by category · Authoring checklist · Diagnostics · Visual verification

### Layer 2 — Entry animation
- [stagger-entry](references/stagger-entry.md) — `--va-index`-driven cascade (complete contract).
  > The contract in one paragraph · Static markup (JS off, deterministic order) · Dynamic markup (runtime-built lists) · The keyframe and its CSS contract · Read layout before animate (the AN-04 kept lesson) · Per-index delay formula details · Combining with scroll reveal (`data-va-reveal="stagger"`) · DESIGN.md tokens consumed · Reduced-motion substitute — `vaFadeOnly` · Selection + comment + decision integration · Hot-swap with DESIGN.md · Diagnostics · Visual verification
- [animation-fill-mode](references/animation-fill-mode.md) — why `both` is mandatory.
  > The four modes · Why `both` is required · Why `backwards` alone is insufficient · Why not `forwards` alone? · The skill uses `both` everywhere · When `both` doesn't apply · Reduced-motion interaction · DESIGN.md tokens consumed · How to combine with other animation properties · The other fill-mode use cases · Diagnostics · Visual verification · The `data-va-reveal` rule uses transitions, not animations

### Layer 3 — Scroll-triggered
- [scroll-reveal](references/scroll-reveal.md) — fire-once IO engine + 4 variants.
  > The contract · The four variants · When to use each variant · Threshold tuning — why 0.15 and -50px · Fail-safe: no IntersectionObserver → reveal everything · Fire-once via `unobserve` · Counter targets are also reveal targets · Combining with stagger (`data-va-reveal="stagger"`) · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Dynamic insertion — `revealNow(el)` and `refresh(root)` · Diagnostics · Visual verification
- [scale-reveal-pop](references/scale-reveal-pop.md) — `data-va-reveal="scale"` cards.
  > The contract · The CSS · Why 0.94, not 0.85 or 0.97? · When to use scale reveal · DESIGN.md tokens consumed · The transform-origin question · Reduced-motion substitute · Combining with stagger · Selection + comment + decision integration · Performance · Diagnostics · Visual verification · Comparison with spring overshoot
- [clip-reveal-wipe](references/clip-reveal-wipe.md) — `data-va-reveal="clip"` LTR wipe.
  > The contract · The CSS · The `inset()` syntax · When to use clip-reveal · DESIGN.md tokens consumed · Reduced-motion substitute · Counter targets are not clip targets · Selection + comment + decision integration · Performance · Diagnostics · Visual verification
- [count-up](references/count-up.md) — rAF counter, exported `animateStat()`.
  > Markup · Attributes · The tick loop · Formatting choices · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Hot-swap with DESIGN.md · Chart skill consumer · Diagnostics · Visual verification
- [parallax-tiers](references/parallax-tiers.md) — `.va-parallax-1` through `.va-parallax-6`.
  > The contract · Markup · The scroll listener — passive, rAF-coalesced · Why parallax reads the DOCUMENT scroll axis only · DESIGN.md tokens consumed · Native scroll-driven animation (`animation-timeline: scroll()`) · Reduced-motion substitute · How many parallax layers is too many? · Selection + comment + decision integration · Diagnostics · Visual verification
- [scroll-progress-bar](references/scroll-progress-bar.md) — `.va-progress-bar` fixed top.
  > The contract · How the progress is computed · When to use the progress bar · Color and z-index · DESIGN.md tokens consumed · Why no transition? · Reduced-motion substitute · Selection + comment + decision integration · Placement guidance · Multiple progress bars · Diagnostics · Visual verification · When to combine with the parallax tier
- [scroll-snap](references/scroll-snap.md) — `.va-snap-root` + `.va-snap-item` (page-root snap).
  > The contract · Markup · Why on the page root, NEVER an inner box · Snap-align modes · Combining with reveal / counter / parallax · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Combining with the slide-decks skill · Diagnostics · Visual verification · Pattern note: the "scroll-snap-only slide deck"
- [pinned-section](references/pinned-section.md) — `position: sticky` for full-viewport pinning.
  > The recipe · Why `position: sticky` works for this · Combining with view() timeline (native scroll-driven) · DESIGN.md tokens consumed · When to use a pinned section · Reduced-motion substitute · Selection + comment + decision integration · Performance · Diagnostics · Visual verification · Stacking variation · Comparison with the snap pattern · Author extension: the timeline-of-events pattern
- [scroll-driven-timelines](references/scroll-driven-timelines.md) — native `animation-timeline: scroll()/view()`.
  > The two timelines · The catalog of native scroll patterns · Browser support (as of writing) · Authoring the pinned pattern · Authoring the stacking pattern · Authoring the scrub pattern · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Why ship JS fallbacks for everything · Diagnostics · Visual verification · When to opt into the native API
- [svg-animation](references/svg-animation.md) — line-draw, fill-from-zero, polygon expand.
  > Line draw (stroke-dashoffset) · Fill from zero (fill-opacity) · Polygon expand (radar/spider chart) · Animated arrow head · Path morph (d attribute interpolation) · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Animating SVG with the `<use>` element · Diagnostics · Visual verification · Browser support · Why CSS animation on SVG, not SMIL · Author extension: hand-drawn-feeling SVG
- [entry-and-scroll](references/entry-and-scroll.md) — overview of Layer 2+3.
  > Layer 2 — staggered entry (`.va-stagger`) · Layer 3 — fire-once scroll reveal (`data-va-reveal`) · Layer 3 — stat counter (`.va-counter`) · Layer 3 — cinematic scroll-pattern catalog

### Layer 4 — Ambient + hover polish
- [floating-presets](references/floating-presets.md) — `va-float-y`, `va-breathe`, `va-orbit`, `va-rotate`.
  > The four presets · The keyframes · The orbit math · Markup · Performance: the loop-pause observer · DESIGN.md tokens consumed · Reduced-motion substitute — REMOVAL · Selection + comment + decision integration · When to use which preset · Bobbing card stack — the mined variant (`02-exploration-visual-designs`) · Diagnostics · Visual verification
- [link-underline](references/link-underline.md) — `.va-link` background-size grow.
  > The contract · The CSS · DESIGN.md tokens consumed · When to use · Why a left-grow (and not center-out)? · Underline thickness · Reduced-motion substitute · Why standard easing, not decel? · Selection + comment + decision integration · Mined pattern note: hover lift on cards (`index.html`, `06`) · Diagnostics · Visual verification
- [card-tilt-3d](references/card-tilt-3d.md) — `.va-tilt` perspective rotation.
  > The contract · The CSS · The JS · The perspective formula · The 10° max angle · DESIGN.md tokens consumed · When to use · Performance · Reduced-motion substitute · Combining with static hover · Selection + comment + decision integration · Dynamic insertion · Diagnostics · Visual verification
- [hover-lift-cards](references/hover-lift-cards.md) — the `.ve-card` hover-lift recipe.
  > The recipe · The skill does NOT ship `.ve-card` · Combining with `.va-tilt` · DESIGN.md tokens consumed · Reduced-motion substitute · Touch devices · Selection + comment + decision integration · Diagnostics · Visual verification · Pattern note: the brief outline pulse on click-to-anchor
- [spring-overshoot](references/spring-overshoot.md) — `--vc-easing-spring` for playful arrivals.
  > The curve · When to use · Markup example — a spring scale-in · The skill DOES NOT ship a default `.va-spring-in` class · DESIGN.md tokens consumed · Reduced-motion substitute · Confetti pop — the mined variant (`07-prototype-animation.html`) · Settle keyframe — the 3-keyframe spring · Selection + comment + decision integration · Diagnostics · Visual verification · How the curve is constructed
- [wireframe-bobbing-card-stack](references/wireframe-bobbing-card-stack.md) — bobbing card + shadow-scale recipe.
  > The visual · The recipe · Why ::after for the shadow · DESIGN.md tokens consumed · Reduced-motion substitute · Loop-pause integration · Selection + comment + decision integration · When to use the bobbing card stack · Visual verification · Pattern note: the wireframe-skill connection · Combining with hover lift · Custom shadow color

### Layer 5 — Loading states
- [pulse-ring](references/pulse-ring.md) — `.va-pulse` expanding-ring indicator.
  > The contract · The CSS · DESIGN.md tokens consumed · When to use the pulse · Markup recipes · Performance — paused while off-screen · Reduced-motion substitute · Selection + comment + decision integration · Color tuning across themes · Ring size tuning · Diagnostics · Visual verification
- [skeleton-shimmer](references/skeleton-shimmer.md) — `.va-skeleton` sliding-gradient placeholder.
  > The contract · The CSS · DESIGN.md tokens consumed · When to use which modifier · Markup recipes · Replacing the skeleton with real content · Performance — paused while off-screen · Reduced-motion substitute · Selection + comment + decision integration · Color contrast — light vs dark · Diagnostics · Visual verification · When NOT to use a skeleton
- [ambient-and-loading](references/ambient-and-loading.md) — overview of Layer 4+5.
  > Layer 4 — four floating presets · Layer 4 — animated link underline (`.va-link`) · Layer 4 — 3D card tilt (`.va-tilt`) · Layer 5 — pulse-ring dot (`.va-pulse`) · Layer 5 — shimmer skeleton (`.va-skeleton`)

### Layer 6 — Performance + advanced
- [performance](references/performance.md) — Layer 6 overview (IO-pause, idle-defer, delta loop).
  > Off-screen loop pause (AN-11) · Idle-deferred init (AN-11) · Delta-time loop primitive (AN-12) · Re-scanning dynamic content · Live reduced-motion changes
- [loop-pause-observer](references/loop-pause-observer.md) — auto-pause off-screen loops.
  > The contract · Why it matters · Default threshold = 0 · NOT fire-once · When the observer can't attach · Deferred init · Re-scanning dynamic content · DESIGN.md tokens consumed · When NOT to apply the loop-pause pattern · Reduced-motion interaction · Selection + comment + decision integration · Diagnostics · Visual verification · Why a SEPARATE observer (and not the reveal one)? · Performance budget for loops
- [idle-deferred-init](references/idle-deferred-init.md) — the two-tier init contract.
  > The two tiers · The `deferInit` helper · Why two tiers, not one · DESIGN.md tokens consumed · Reduced-motion interaction · Selection + comment + decision integration · Tier-2 init failure recovery · Order of deferred work · Re-running deferred init · Diagnostics · Visual verification
- [delta-time-loop](references/delta-time-loop.md) — `createLoop(update, render)` primitive.
  > The public API · The implementation · The `start()` idempotency · The `stop()` cancel · Why ship a primitive nothing uses? · DESIGN.md tokens consumed · Reduced-motion interaction · Example consumer — a hypothetical chart entrance · Selection + comment + decision integration · Diagnostics · Visual verification · When NOT to use this primitive

### Cross-skill handoffs
- [chart-skill-handoff](references/chart-skill-handoff.md) — counter primitive + entrance for charts.
  > `animateStat(el)` — the counter primitive · How the chart skill should call it · Why the chart skill doesn't re-implement count-up · Chart entrance animations · Stat-card reveal pattern · Chart canvas + animation skill · DESIGN.md tokens shared · Reduced-motion substitute · Selection + comment + decision integration · Diagnostics · Visual verification · Future chart-skill extensions
- [diagram-skill-handoff](references/diagram-skill-handoff.md) — flow edges + scroll reveal for diagrams.
  > Scroll-reveal for numbered flow walks · SVG flow-edge animations · Token contract for diagram animations · Reduced-motion substitute · Selection + comment + decision integration · Interactive flowcharts (click-step → side-panel pattern) · Scroll-reveal trigger on diagrams · Hot-swap with DESIGN.md · Diagnostics · Visual verification · Future diagram-skill extensions
- [interactive-control-stepper](references/interactive-control-stepper.md) — spin keyframe for active step.
  > The stepper visual · The spin keyframe · DESIGN.md tokens consumed · Reduced-motion substitute · Loop-pause integration · Selection + comment + decision integration · Composing with the progressive stepper's other states · DESIGN.md hot-swap · Diagnostics · Visual verification · Pattern: "this is busy" indicators · Author extension: custom spinner shapes · Why not `<animate>` SMIL on the SVG?
- [slide-deck-transitions](references/slide-deck-transitions.md) — 5 moods + 4 transitions for slides.
  > The 5 entrance moods · Why moods, not "transitions" · The 4 inter-slide transitions · DESIGN.md tokens consumed · Reduced-motion substitute · Selection + comment + decision integration · Mood selection heuristics · Stagger across the deck · Slide navigation indicators · Loop-pause for slide animations · Diagnostics · Visual verification · Future slide-deck extensions

### Contract + bootstrap
- [atom-selection-stamping](references/atom-selection-stamping.md) — `data-ve-id` + decision-pill contract.
  > The atom kinds the skill stamps · The stamper · What "atoms" are in the contract · The decision mini-pill · Defensive deferral when the runtime isn't loaded yet · What is NOT stamped · DESIGN.md tokens consumed · Reduced-motion interaction · Re-stamping on refresh · Atom ID stability across re-renders · Selection model integration · Diagnostics · Visual verification · Why the skill stamps (not the runtime)
- [dynamic-content-refresh](references/dynamic-content-refresh.md) — `refresh()` + `revealNow()` APIs.
  > `refresh(root)` — re-scan a subtree · Idempotency · When to call `refresh()` · `revealNow(el)` — force-reveal one element immediately · When to use `revealNow()` vs `refresh()` · The reveal observer's `_revealCount` test hook · DESIGN.md tokens consumed · Reduced-motion interaction · Selection + comment + decision integration · Live OS-preference toggle · Diagnostics · Visual verification · When refresh fails silently
- [css-injection-bootstrap](references/css-injection-bootstrap.md) — `injectAnimationCSS()` + manual-init opt-out.
  > The injection function · Why ship CSS inside the JS module · The injected stylesheet contents · Auto-init vs manual init · The test fixture also uses manual init · The dual export (browser + Node) · DESIGN.md tokens consumed · Reduced-motion interaction · Why `data-va="animation"` not `data-amvcp="animation"` · Test hooks — `window.__veAnimation` · Diagnostics · Visual verification · When to opt into manual init
- [keyframe-catalog](references/keyframe-catalog.md) — every `@keyframes` the skill ships.
  > The ten keyframes · `vaFadeSlideUp` — the entrance default · `vaFadeOnly` — the universal reduce substitute · `vaFloatY` — the vertical bob · `vaBreathe` — the scale pulse · `vaOrbit` — the circular orbit · `vaRotate` — the in-place spin · `vaPulseRing` — the expanding ring · `vaShimmer` — the sliding gradient · Composition rules · DESIGN.md token consumption per keyframe · Reduced-motion handling · Selection + comment + decision integration · Diagnostics · Visual verification
- [transition-properties](references/transition-properties.md) — what CSS properties to animate (and avoid).
  > The two property categories · Examples — the skill's choices · Why opacity AND transform together · Properties to AVOID animating · DESIGN.md tokens consumed · Reduced-motion substitute · `will-change` hints — when (NOT) to use · Combining properties on one element · Diagnostics · Visual verification · Reference table — animation-safe properties

### Cross-cutting concerns
- [print-and-export](references/print-and-export.md) — `@media print` substitute behavior.
  > The default print behavior · The print stylesheet (proposed) · Print-safe authoring · The `prefers-reduced-motion` interaction · PDF export · DESIGN.md tokens consumed · When the skill's elements appear on paper · Counter readability on print · Reduced-motion substitute (for the print medium) · Selection + comment + decision integration · Page-break control · Diagnostics · Visual verification · When NOT to add the print stylesheet · Future runtime addition
- [touch-and-keyboard](references/touch-and-keyboard.md) — touch + keyboard affordance parity.
  > The categories · Keyboard parity for hover · Touch device handling · Why no `@media (hover: hover)` guard in the skill · Pointer-events: none — when to disable hover entirely · Reduced-motion + touch + keyboard · DESIGN.md tokens consumed · Selection + comment + decision integration · Diagnostics · Visual verification · Pattern note: focus rings · Pattern: `:focus-visible` and `:focus-within`
- [anti-patterns](references/anti-patterns.md) — what NOT to do, with diagnostics.
  > 1. `animation: none !important` on `prefers-reduced-motion: reduce` · 2. Animating layout-triggering properties · 3. Missing `animation-fill-mode: both` on staggered entry · 4. Setting `--va-index` via `:nth-child` selectors · 5. Forgetting `:focus-visible` on hover-driven animations · 6. Removing focus rings without replacement · 7. `transform-origin: 0 0` on a centered element · 8. Infinite loops without loop-pause · 9. Mocking the runtime in tests instead of loading it · 10. Calling `init()` multiple times without `refresh()` · 11. Using SMIL instead of CSS for SVG animations · 12. Hardcoded durations / easings in CSS · 13. Using `text-decoration` for animated underlines · 14. Mixing GSAP / anime.js / Lenis / etc. · 15. Storing animation state in JS closures instead of CSS · 16. Adding `will-change` everywhere · 17. Animation duration in CSS, but JS reads a different value · 18. Animating elements outside the viewport unnecessarily · 19. Static `box-shadow` for hover (no transition) · 20. Treating `prefers-reduced-motion` as binary on/off only · Quick reference table

### Authoring aid
- [animation-plan-template](references/animation-plan-template.md) — OT-08 13-section authoring checklist.
  > 1. Timing overview · 2. Element inventory · 3. Entrance sequence · 4. Idle / loop state · 5. Interaction responses · 6. Exit sequence · 7. Reduced-motion variants  ← MANDATORY · 8. Performance budget  ← MANDATORY · 9. Dependencies · 10. Device notes · 11. Test scenarios · 12. Implementation order · 13. Review checkpoints
