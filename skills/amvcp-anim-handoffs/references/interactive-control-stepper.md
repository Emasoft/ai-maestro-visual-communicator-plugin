# Interactive-control stepper — spin keyframe for in-progress step

## Table of Contents

- [The stepper visual](#the-stepper-visual)
- [The spin keyframe](#the-spin-keyframe)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Loop-pause integration](#loop-pause-integration)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Composing with the progressive stepper's other states](#composing-with-the-progressive-steppers-other-states)
- [DESIGN.md hot-swap](#designmd-hot-swap)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Pattern: "this is busy" indicators](#pattern-this-is-busy-indicators)
- [Author extension: custom spinner shapes](#author-extension-custom-spinner-shapes)
- [Why not `<animate>` SMIL on the SVG?](#why-not-animate-smil-on-the-svg)

The interactive-controls skill ships a progressive stepper
component (`step--done` / `step--active` / `step--pending`). The
ACTIVE step has a spinning icon to indicate "this step is
currently running"; the spin keyframe is owned by this animation
skill (the spinning is animation territory, not interactive-
control territory).

This file documents the contract: the spin keyframe + the
classes the interactive-control skill expects.

## The stepper visual

A vertical stepper showing N steps:

```
[✓] Step 1 — Validate input
    DONE

[⟳] Step 2 — Connect to database
    IN PROGRESS — connecting…

[ ] Step 3 — Process records
    PENDING

[ ] Step 4 — Send confirmation
    PENDING
```

The DONE step shows a checkmark (`✓`). The IN PROGRESS step
shows a spinning icon (`⟳`). The PENDING steps show an empty
bracket.

## The spin keyframe

```css
@keyframes vaSpinIcon {
  from { transform: rotate(0); }
  to   { transform: rotate(360deg); }
}

.ic-step--active .ic-step-icon {
  display: inline-block;
  animation: vaSpinIcon 1.2s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ic-step--active .ic-step-icon {
    /* substitute: static icon, no spin */
    animation: none;
  }
}
```

The `vaSpinIcon` keyframe is the simplest possible spin (0 to
360°, linear, infinite). 1.2s is the canonical spinner duration
— fast enough to feel active, not so fast that it reads as
frantic.

NOTE: The keyframe `vaSpinIcon` is essentially identical to
`vaRotate` (which the animation skill already ships for
decorative loops). The interactive-control skill could just use
`vaRotate` directly — no need for a separate keyframe.

```css
.ic-step--active .ic-step-icon {
  animation: vaRotate 1.2s linear infinite;
}
```

This is the recommended composition: reuse the existing
`vaRotate` keyframe; provide the duration + iteration count in
the rule.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| (none for the spin itself) | duration is preset character (1.2s) |
| `--vc-color-accent` (potentially) | active step icon color |

The 1.2s duration is hardcoded — NOT tokenized. A spin that takes
2.5s would feel "slow"; a spin that takes 0.6s would feel
"frantic". 1.2s is the canonical "this is busy".

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .ic-step--active .ic-step-icon {
    animation: none;
  }
}
```

The substitute is REMOVAL — the icon sits at rest. The "IN
PROGRESS" status is conveyed by:
- The `--active` class adding a distinct color/style.
- A text label ("connecting...", "uploading...") inside the
  step body.

Removing the spin doesn't remove the "in progress" meaning —
the user still sees the color/label cues.

This is the "decorative-only" substitute pattern: the spin is
decorative (the color + label carries the meaning), so removal
is correct.

## Loop-pause integration

If the spinner is in the viewport while the user is reading
another section, the spin keeps running (the loop-pause observer
only pauses spinners OFF-screen). On-screen spinners stay
animating because they convey "still happening".

If the page has MANY simultaneous spinners (e.g. 10 concurrent
async operations each with a stepper), the spinners can become
visually busy. Mitigation: limit the number of concurrent
spinners shown, OR design the stepper to show only the next 2-3
in-progress steps (collapse the rest into a "+N more pending"
indicator).

## Selection + comment + decision integration

The stepper is an interactive-control atom (the stepper as a
whole, or each step individually). The interactive-control skill
stamps its own atoms; the animation skill doesn't stamp the
spinner icon.

If a step is comment-able (a user can decide on it), the step
element should have `data-ve-id` / `data-ve-type` per the
interactive-control's selection contract.

## Composing with the progressive stepper's other states

The interactive-control's stepper might also animate state
transitions (e.g. when a step transitions from `--active` to
`--done`, the check mark could draw in):

```css
@keyframes vaCheckDraw {
  from { stroke-dashoffset: 100; }
  to   { stroke-dashoffset: 0; }
}

.ic-step--done .ic-step-icon-check {
  stroke-dasharray: 100;
  animation: vaCheckDraw 220ms var(--vc-easing-decel) forwards;
}
```

The `vaCheckDraw` keyframe is task-specific (drawing an SVG
check mark via stroke-dashoffset). The interactive-control skill
owns this keyframe — it's specific to the stepper's visuals.

The animation skill provides the building blocks (`--vc-easing-decel`,
the reduce gate); the interactive-control composes them with
its own keyframes.

## DESIGN.md hot-swap

Changing `motion.easing-decel` mid-session updates the check-draw
curve. Changing `motion.scale: 0` to `motion.scale: 1` doesn't
affect the spin (no scale damping) but might affect other
animations on the page.

## Diagnostics

- **Spinner doesn't spin** → confirm the animation rule
  references the right keyframe (`vaRotate` or `vaSpinIcon`),
  confirm `animation-iteration-count: infinite` is set.
- **Spinner spins under `reduce`** → the reduce branch override
  is missing or has a typo.
- **Spinner is visually too small to see the rotation** → the
  icon's design needs a clear "directional" element (an arrow
  segment, an asymmetric pointer). Pure radial symmetry (a full
  ring) doesn't read as rotating.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a stepper showing an active step.
2. Confirm the spinner is rotating visually (screenshot at
   intervals; the icon should be at different rotations).
3. Confirm `getComputedStyle(spinnerIcon).animationName` is
   `vaRotate` (or `vaSpinIcon`).
4. With `prefers-reduced-motion: reduce`, the spinner should
   stop rotating but remain visible.
5. Off-screen behavior: the loop-pause observer pauses the
   spinner. On-screen, it resumes.

## Pattern: "this is busy" indicators

A few canonical visual cues for "something is happening":

| visual | use | spin? |
|---|---|---|
| Spinning ring icon | Long-running async operation | yes |
| Pulse dot | Live / connected / awaiting | no (pulse instead) |
| Progress bar | Quantifiable progress | no (bar fills) |
| Skeleton shimmer | Loading data | no (shimmer instead) |
| Pulsing background | Important pending action | no (pulse via opacity) |

The spinner is the canonical "indeterminate progress" indicator.
For determinate (we know N of M done), use a progress bar
instead.

## Author extension: custom spinner shapes

The animation skill ships `vaRotate` which spins any element.
The interactive-control skill's spinner icon design is its own —
typically a 3/4 circle or a quarter-arc that reads as a clear
"this is rotating" shape:

```svg
<svg class="ic-step-icon" viewBox="0 0 24 24">
  <path d="M12 4 a 8 8 0 0 1 8 8" stroke="currentColor"
        stroke-width="2" fill="none"/>
</svg>
```

The path draws a quarter-arc; spinning it makes the arc trace
a full circle visually.

Author choices for spinner icon:
- Quarter arc (above) — clean, single-directional.
- Three-quarter arc — slightly more visual weight.
- Two opposing dots — abstract, geometric.
- Dashed circle — multiple dashes that rotate.

Pick one and stick with it for consistency across the
interactive-control's spinners.

## Why not `<animate>` SMIL on the SVG?

A pure-SVG spinner can use SMIL:

```svg
<svg viewBox="0 0 24 24">
  <path d="M12 4 a 8 8 0 0 1 8 8" stroke="currentColor"
        stroke-width="2" fill="none">
    <animateTransform attributeName="transform" type="rotate"
                      from="0 12 12" to="360 12 12"
                      dur="1.2s" repeatCount="indefinite"/>
  </path>
</svg>
```

This works without CSS. But:
1. SMIL is on the deprecation track.
2. Doesn't compose with `prefers-reduced-motion` media query
   automatically.
3. The animation skill's loop-pause observer doesn't see SMIL
   animations.

Prefer CSS animation for spinners (and any new animation).
SMIL is legacy.
