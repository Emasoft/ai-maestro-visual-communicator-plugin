# Motion tokens — the `--vc-motion-*` contract (Layer 0)

The animation skill themes every duration, easing, stagger delay, and
decorative amplitude off CSS custom properties resolved by the DESIGN.md
engine (`amvcp-designmd.js`). This document is the contract.

## The `motion:` group in DESIGN.md

The `motion:` group is **optional** — a DESIGN.md with no `motion:`
group still animates correctly because every CSS rule references its
token with a hardcoded canonical fallback (`var(--vc-duration-entrance,
600ms)`). When the group is present, these 10 keys are read:

```yaml
motion:
  # durations the runtime UI and the animation skill share
  duration-fast:     120        # ms — micro-interactions (hover, toggle, tilt reset)
  duration-normal:   200        # ms — state changes (panel, tab, link underline)
  duration-slow:     400        # ms — entrances, modals, stat count-up window
  # animation-skill additions
  duration-entrance: 600        # ms — staggered entry / scroll reveal
  stagger-step:      80         # ms — per-index delay inside a staggered group
  easing-standard:   "cubic-bezier(0.2,0,0,1)"   # ease-in-out semantics
  easing-decel:      "cubic-bezier(0,0,0,1)"     # ease-out semantics
  easing-accel:      "cubic-bezier(0.3,0,1,1)"   # ease-in semantics
  easing-spring:     "cubic-bezier(0.34,1.56,0.64,1)"   # overshoot
  scale:             1          # number 0..1 — master motion damper
```

## CSS custom properties consumed

| token | CSS custom property | fallback | role |
|---|---|---|---|
| `motion.duration-fast` | `--vc-duration-fast` | `120ms` | tilt reset, micro |
| `motion.duration-normal` | `--vc-duration-normal` | `200ms` | link underline, reduce substitute |
| `motion.duration-slow` | `--vc-duration-slow` | `400ms` | stat counter window |
| `motion.duration-entrance` | `--vc-duration-entrance` | `600ms` | entry / reveal |
| `motion.stagger-step` | `--vc-duration-stagger-step` | `80ms` | per-index delay |
| `motion.easing-standard` | `--vc-easing-standard` | `cubic-bezier(0.2,0,0,1)` | ease-in-out |
| `motion.easing-decel` | `--vc-easing-decel` | `cubic-bezier(0,0,0,1)` | ease-out |
| `motion.easing-spring` | `--vc-easing-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | overshoot |
| `motion.scale` | `--vc-motion-scale` | `1` | transform-distance damper |

`stagger-step` is a duration so it maps into the `--vc-duration-*`
family the controller pad groups together; the CSS var name is
`--vc-duration-stagger-step`.

## `--vc-motion-scale` — the master damper

`--vc-motion-scale` is a number `0..1`. It multiplies **transform
distance and decorative amplitude only — NEVER duration**. It is
consumed inside `calc()`:

```css
.va-stagger-item { --va-rise: calc(24px * var(--vc-motion-scale, 1)); }
```

At `scale: 0` a keyframe still runs (opacity still fades) but the
`translateY` distance is 0 — a theme-level "calm" mode that composes
with, and is orthogonal to, the OS `prefers-reduced-motion` gate. A
theme can therefore damp motion without disabling it entirely.

## Why durations are not light/dark themed

A 200ms transition is 200ms in both themes — duration is a perceptual
constant, not a palette value. The DESIGN.md engine emits the motion
tokens once (theme-agnostic). What IS theme-dependent is anything an
animation *paints*: the shimmer skeleton's gradient and the pulse
ring's color read `--vc-color-surface-*` / `--vc-color-accent`, which
the engine resolves per active theme — so those animations are correct
in both themes by construction.

## Token absence is safe

If the `motion:` group is omitted, or a single key inside it is
omitted, the engine simply does not emit that CSS var. `getComputedStyle`
returns an empty string, the `var(--vc-…, fallback)` resolves to the
fallback, and the JS helpers (`readDurationMs`, `readNumber`) return
their own matching default. The fallback values listed in the table
above are the single canonical default set — they are duplicated in
the YAML comments and in `amvcp-animation.js`, kept in sync.
