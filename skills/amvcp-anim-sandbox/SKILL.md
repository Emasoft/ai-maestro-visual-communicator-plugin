---
name: amvcp-anim-sandbox
description: "Animation sandbox — ONE transition shown in isolation with live duration + easing tuners, a Replay button, and an export of the tuned {duration, easing} values. Moving the slider or easing select re-runs the transition live; the tuned values export through the runtime selection channel. Light + dark, reduced-motion-aware. Use when tuning a transition, dialling in animation timing, picking an easing curve, or building an easing/duration playground. Trigger with 'animation sandbox', 'tune a transition', 'easing tuner', 'duration slider', 'easing playground', 'pick an easing curve'."
license: MIT
metadata:
  author: Emasoft
---

# Animation Sandbox

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Animation category:** [amvcp-animation](../amvcp-animation/SKILL.md) (router) · [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md) (motion-token + easing contract). **Sibling editor skills:** [amvcp-editor-template](../amvcp-editor-template/SKILL.md), [amvcp-editor-toggles](../amvcp-editor-toggles/SKILL.md). **Selection wire-format:** [`references/interactive-selection-base.md`](../../references/interactive-selection-base.md).

Complete TOC of `interactive-selection-base.md`:
- Interactive Selection — Base Contract
  - ## Table of contents
  - ## How it works & Page Setup
    - ### How it works (one paragraph)
    - ### Page CSS contract (multi-select)
    - ### Mandatory boilerplate
  - ## The selection payload
    - ### Phase 2 — multi-click text selection inside `[data-ve-prose]`
      - #### Phase 3 — block-level depths 4-7 (paragraph / section / chapter / all)
      - #### Phase 3 — math grammar (sub-formula depths 1-3 inside `.ve-math`)
      - #### Phase 3 — code grammar (token / line / block depths 1-3 inside `<pre>`)
      - #### Phase 4 — drag text selection toggles entries (the only deselect path)
      - #### Phase 5 — table row/column handles
      - #### Phase 6 — code line-number gutter
      - #### Phase 7 — touch / mobile compatibility
      - #### Interactive agent reports — `kind:"finding-reply"` (TRDD-eff1aa87)
      - #### Interactive agent reports v2 — modal comment threads
    - ### Required follow-up
  - ## Selectable Elements
    - ### What to make selectable
    - ### Marking elements
  - ## Engine routing — read this BEFORE generating a graph
  - ## Runtime & Process Caveats
    - ### Runner-process pitfalls (Chrome `--app=URL` mode)
    - ### Anti-patterns (selection-system author errors)
    - ### Inlining the runtime (single-file portability)
    - ### Future extensions (not yet implemented)

## Overview

THE THING: "ONE transition shown in isolation, with live duration +
easing tuners, a Replay button, and an export of the tuned values." One
skill, one thing — an interactive *tuning tool* for a single transition.

**Relationship to the animation category (the one-skill-per-THING call).**
The TRDD (gap #07) allowed "`amvcp-anim-sandbox` *or* a mode of
`amvcp-anim-foundation`". `amvcp-anim-foundation` is the animation
*contract* skill — motion tokens, the five easing curves, the
reduced-motion gate, atom stamping — authored to make REAL on-page motion
(entrance / scroll / ambient) correct; its runtime peer (`amvcp-animation.js`)
does entrance / reveal / loop effects, NOT an isolated-transition tuner.
The sandbox is a **distinct thing**: a transition decoupled from any
layout, with live tuners and a values-export — a different verb (*tune &
export*) on a different surface. Per the project's one-skill-per-THING
rule it gets its own skill, and it **consumes** the foundation's easing
vocabulary (its presets resolve through the same `--vc-easing-*` tokens)
rather than re-defining it.

Two modes, kept strictly separate (project CLAUDE.md §4):

1. **Interaction Design Mode = FIXED.** The **stage** is the selection
   atom; the runtime supplies selection · highlight · triple-state
   feedback · comment-box with zero code here. This module adds NO custom
   selection, NO foreign drag, NO foreign export UX. The CONTROLS
   (slider, easing `<select>`, Replay) are plain editing affordances the
   runtime skips. "Editable" = drag the slider / pick an easing / Replay;
   "Exportable" = the **Export** button pushes the tuned `{duration,
   easing}` into `window.veSelection` as a `kind:"element"` entry (the
   universal export channel) — never a bespoke wire.
2. **Graphic Style Mode = VARIABLE via DESIGN.md.** The stage, demo
   element, control chrome and read-out are themed entirely from `--vc-*`
   tokens — light + dark both, no hardcoded palette. A `data-ve-theme`
   flip / hot-swap re-themes live with zero JS.

## Prerequisites

- `amvcp-anim-sandbox.js` colocated with the HTML — the sandbox module
  (`window.amvcpAnimSandbox`: `parseSandboxSpec`, `renderSandbox`,
  `mountSandbox`, `mountAll`). It injects its own scoped, `--vc-*`-themed
  stylesheet (`#vc-anim-sandbox-style`) once and auto-mounts every
  declarative `[data-ve-anim-sandbox]` on DOM-ready.
- `amvcp-runtime.js` — boots the selection runtime and installs
  `window.veToggle` + `window.veSelection`. The Export affordance rides
  this channel; without it, the export still stamps `data-ve-exported`
  on the stage (so `file://` pages observe it), but load the runtime for
  the full select → comment → submit round-trip.
- `amvcp-designmd.js` (optional) — when the page embeds a DESIGN.md, the
  runtime applies its `--vc-*` tokens (including the `--vc-easing-*`
  motion curves the easing presets resolve through) so the sandbox themes
  from the design system rather than the built-in fallbacks.

## Instructions

1. **Author the sandbox spec** — a fenced ```` ```anim-sandbox ```` block
   inside a `<div class="ve-anim-sandbox" data-ve-anim-sandbox id="…">`.
   Keys: `demo` (caption), `property` (transition-property), `from` / `to`
   (CSS-declaration fragments for the start/end state), `duration` (ms,
   seeds the slider), `easings` (comma list of preset names). See
   [anim-sandbox-spec](./references/anim-sandbox-spec.md) for the full
   shape, the atom contract, and the export wire format.
2. **Load order** — engine (`amvcp-designmd.js`) → runtime
   (`amvcp-runtime.js`) → this module (`amvcp-anim-sandbox.js`). The
   module auto-inits on DOM-ready; set `window.__veAnimSandboxManual =
   true` before loading it to call `window.amvcpAnimSandbox.mountAll(document)`
   yourself.
3. **The stage is the selection atom** — it carries
   `data-ve-id="anim-sandbox:<id>"` + `data-ve-type="anim-tuning"`; the
   demo element inside runs the `from→to` transition. The slider, easing
   `<select>`, Replay and Export are controls the runtime skips (they
   never become atoms).
4. **Moving a tuner re-runs the transition live** — slider `input` and
   easing `change` snap the demo to `from` (no transition), force a
   reflow, then apply `to` WITH the tuned `transition-duration` /
   `transition-timing-function` so the browser tweens. The duration
   read-out updates in step.
5. **Reduced-motion: controls always render, preview is gated to Replay**
   — under `prefers-reduced-motion: reduce`, slider/easing changes update
   the values + read-out but do NOT auto-preview; only the **Replay**
   button runs the transition (the user explicitly asked). The root
   carries `data-ve-reduced="1"`. Per
   [amvcp-anim-foundation](../amvcp-anim-foundation/references/reduced-motion-gate.md):
   substitute, never silently disable. Complete TOC of `reduced-motion-gate.md`:
   - Reduced-motion gate — the substitute pattern, never `animation: none`
     - ## Table of Contents
     - ## Why substitute (not disable)
     - ## The two categories — information-bearing vs decorative
       - ### Information-bearing — substitute with a meaning-preserving fade
       - ### Decorative-only — substitute with REMOVAL
     - ## OS detection at runtime
     - ## Live OS-preference updates
     - ## CSS pattern — every animation, twice
     - ## JS pattern — read `REDUCED` once per call
     - ## DESIGN.md `motion.scale: 0` is ORTHOGONAL, not equivalent
     - ## The decision-tree for "what substitute do I write?"
     - ## Diagnostics
     - ## Visual verification
     - ## Selection / decision integration
6. **Export rides the selection channel** — the **Export values** button
   calls `window.veToggle`, landing a `kind:"element"` / `type:"anim-tuning"`
   entry in `window.veSelection` whose `data` carries
   `{ duration, durationCss, easing, easingValue, property, from, to }`.
   Re-exporting toggles the entry (the agent reads the latest tuned
   values from the submit payload). See
   [anim-sandbox-spec](./references/anim-sandbox-spec.md#the-export-contract-windowveselection).

## Output

A `<div class="ve-anim-sandbox" data-ve-type="anim-tuning">` containing a
caption, a stage atom (with the demo element), and a controls row: a
duration range slider + live read-out, an easing `<select>` of the
chosen presets, a Replay button, and an Export button. Both themes theme
correctly off the same `--vc-*` tokens. No nested scrollbars — the stage
uses `overflow:visible` and the controls wrap; the page extends per the
no-nested-scrollbars rule.

## Error Handling

| Symptom | Fix |
|---|---|
| The fenced block didn't render | The container needs both `class="ve-anim-sandbox"` and `data-ve-anim-sandbox`, and the fence must be ```` ```anim-sandbox ```` … ```` ``` ````. `mountAll` skips a host with no parseable spec. |
| `renderSandbox` throws "spec object required" | You passed something other than a spec object — call `parseSandboxSpec(text)` first and pass `.spec`. |
| Stage doesn't highlight / show a comment handle | The runtime (`amvcp-runtime.js`) isn't loaded, or loaded after this module. Load order is engine → runtime → anim-sandbox. The tuners still work (self-wired); the selection/comment layer needs the runtime. |
| Easing change shows the wrong curve | The preset name isn't one of the built-ins (`standard`/`decel`/`accel`/`spring`/`linear`/`ease*`) — unknown names are dropped from the spec with a soft warning. Check the `easings:` line. |
| The transition doesn't visibly move | `from` and `to` describe the same visual state, OR `property` doesn't include the property your `from`/`to` actually change — make `from`≠`to` on a property listed in `property`. |
| No auto-preview when I drag the slider | The OS `prefers-reduced-motion` is on — preview is intentionally gated to the Replay button in that mode (substitute, not disable). Click Replay. |
| Export "does nothing" | Without the runtime there's no `window.veToggle`; the export still stamps `data-ve-exported="1"` on the stage and records `stage.__lastExport`. Load the runtime for the full round-trip. NOT an error. |

## Examples

```
Input:  "Let me tune the card slide-up transition."
Output: <div class="ve-anim-sandbox" data-ve-anim-sandbox id="card-slide">
        ```anim-sandbox
        demo: A card sliding up and fading in
        property: transform, opacity
        from: translateY(28px); opacity:0
        to: translateY(0); opacity:1
        duration: 420
        easings: standard, decel, accel, spring
        ```
        </div>
        The user drags duration to 640ms, picks "spring", clicks Replay
        to preview, then Export — the agent reads {duration:640,
        easing:"spring"} from the selection and applies it to the real card.

Input:  "Easing playground — show me the five curves on one element."
Output: easings: standard, decel, accel, spring, linear — each pick
        re-runs the same from→to so the curves can be compared directly.

Input:  "Dial in a fade and give me the values."
Output: from: opacity:0 / to: opacity:1 / property: opacity; the Export
        entry carries the tuned durationCss + easingValue to paste.
```

## Modes

This skill supports `data-ve-mode="readonly"` semantics for the runtime
selection layer (the stage is a select/comment atom), but the sandbox
itself is genuinely *editable* — the tuners mutate the live transition.
The per-element 3-state decision pill (R20-R23 of
`amvcp-self-debug-rules`) does NOT apply; the editing facet is the
tuners, and the export facet is the `anim-tuning` selection entry, not an
inline decision pill.

## Composability

Composes with [amvcp-anim-foundation](../amvcp-anim-foundation/SKILL.md)
(its easing presets resolve through the same `--vc-easing-*` tokens; the
sandbox's tuned values feed straight into a foundation-authored
animation), [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) (the
source DESIGN.md / preset that themes the stage), and
[amvcp-modal-comments](../amvcp-modal-comments/SKILL.md) (the
comment-thread layer the runtime mounts when the stage is selected).
Nests cleanly via `<foreignObject>` / overlays alongside other elements
(it owns its `--vc-*`-themed markup and assumes nothing about what it is
combined with). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [anim-sandbox-spec.md](./references/anim-sandbox-spec.md) — the
  declarative spec, the fenced `anim-sandbox` block, the easing presets,
  the `data-ve-*` atom contract, and the export wire format.
  > API · The declarative spec · The fenced block · Easing presets · The selection atom contract · The export contract (window.veSelection) · Reduced-motion behaviour · DESIGN.md tokens used · No nested scrollbars · Self-contained output
