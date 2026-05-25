# Animation plan template (OT-08)

## Table of Contents

- [1. Timing overview](#1-timing-overview)
- [2. Element inventory](#2-element-inventory)
- [3. Entrance sequence](#3-entrance-sequence)
- [4. Idle / loop state](#4-idle--loop-state)
- [5. Interaction responses](#5-interaction-responses)
- [6. Exit sequence](#6-exit-sequence)
- [7. Reduced-motion variants  ← MANDATORY](#7-reduced-motion-variants--mandatory)
- [8. Performance budget  ← MANDATORY](#8-performance-budget--mandatory)
- [9. Dependencies](#9-dependencies)
- [10. Device notes](#10-device-notes)
- [11. Test scenarios](#11-test-scenarios)
- [12. Implementation order](#12-implementation-order)
- [13. Review checkpoints](#13-review-checkpoints)

A fill-in authoring checklist for planning a complex animation sequence
BEFORE implementing it. Copy this file, fill every section, then build.
Sections 7 and 8 are load-bearing — they turn "did you write the
`reduce` branch?" and "is this within the perf budget?" into checklist
items, not afterthoughts.

This is a planning aid, not runtime code.

---

## 1. Timing overview

- Total sequence length (ms): ____
- Phases and their windows: ____
- Which `--vc-duration-*` token drives each phase: ____
- Is the sequence triggered on load, on scroll, or on interaction: ____

> Turn this section into a picture: a
> [keyframe-schedule-strip](keyframe-schedule-strip.md) plots each named
> beat at its ms offset on a single track, so a reviewer sees the
> choreography without reading the CSS. Recommended for any sequence with
> ≥3 beats.

## 2. Element inventory

List every element that moves, with its role:

| element / selector | role | layer | enters via |
|---|---|---|---|
| | | | |

## 3. Entrance sequence

- Order elements appear in: ____
- Stagger step (`--vc-duration-stagger-step`, or a custom delay): ____
- Easing per element (`--vc-easing-decel` for entrances): ____
- Does anything depend on a previous element finishing: ____

## 4. Idle / loop state

- Which elements loop after entering: ____
- Loop class or keyframe per element: ____
- Loop duration (preset character — not a token): ____
- Is the loop decorative-only (so `reduce` removes it) or
  information-bearing (so `reduce` needs a substitute): ____

## 5. Interaction responses

- Hover / focus / click responses and the elements they affect: ____
- Duration token for each response (`--vc-duration-fast` for micro): ____
- Does an interaction interrupt or queue behind an in-flight animation: ____

## 6. Exit sequence

- What animates OUT (if anything), and on what trigger: ____
- Exit easing (`--vc-easing-accel` for exits): ____
- Is the element removed from the DOM after exit, or just hidden: ____

## 7. Reduced-motion variants  ← MANDATORY

For EVERY animation listed above, state its `prefers-reduced-motion:
reduce` substitute. The rule: information-bearing motion gets a
meaning-preserving substitute (the element still appears / the state
still changes); decorative-only motion is removed.

| animation | reduce substitute | meaning preserved? |
|---|---|---|
| | | |

Confirm: no animation uses a blanket `animation: none` where the
element carries meaning. ____ (yes/no)

## 8. Performance budget  ← MANDATORY

- Number of simultaneously-animating elements at peak: ____
- Are all animated properties compositor-friendly (`transform`,
  `opacity`) and NOT layout-triggering (`width`, `top`, `margin`): ____
- Number of infinite loops on the page: ____ — are they all covered by
  the off-screen loop-pause observer (Layer 6): ____
- Is heavy init deferred via `requestIdleCallback` (Layer 6): ____
- Parallax layer count (keep low — P3): ____

## 9. Dependencies

- Confirm: zero JS libraries (no GSAP / anime.js / Lenis / Three.js): ____
- `amvcp-animation.js` + `amvcp-designmd.js` ship beside the HTML: ____
- Does a `motion:` group exist in the DESIGN.md, or are fallbacks
  relied on: ____

## 10. Device notes

- Touch devices — does any effect depend on hover (tilt, underline):
  what is the touch fallback: ____
- Small viewports — does the sequence still read at < 600px wide: ____
- Low-power / throttled CPU — does the loop-pause + idle-defer keep it
  smooth: ____

## 11. Test scenarios

- Above-the-fold elements animate on load: ____
- Below-the-fold reveal fires on scroll, once: ____
- Counter reaches its exact target: ____
- reduced-motion path verified (emulate the OS setting): ____
- Both light and dark themes verified for any painted animation: ____
- No nested scrollbars introduced: ____

## 12. Implementation order

1. Tokens / `motion:` group first (or confirm fallbacks).
2. The `reduce` substitutes alongside each animation — never after.
3. Entrance, then idle/loop, then interaction, then exit.
4. Perf layer (loop-pause, idle-defer) last.

## 13. Review checkpoints

- [ ] Every animation has a `reduce` branch (section 7 complete).
- [ ] Perf budget met (section 8 complete).
- [ ] Zero hardcoded durations / easings / colors — all `--vc-*` tokens.
- [ ] Zero JS libraries.
- [ ] Light + dark both correct.
- [ ] No nested scrollbars.
- [ ] Content never stuck invisible (reveal fail-safe intact).
