# Motion / easing token library (DT-05 + DM-24)

Eight durations × eight easings = the canonical animation vocabulary.
Single source of truth for transition / animation timing across every
component a project ships. Replaces ad-hoc `0.3s ease` / `cubic-bezier(…)`
proliferation with named tokens that communicate INTENT.

## What it does

`amvcpTokens.generateMotionLibrary()` returns:

```
{
  durations: {
    'duration-instant':    50,
    'duration-fast':      100,
    'duration-quick':     200,
    'duration-base':      300,
    'duration-moderate':  400,
    'duration-slow':      500,
    'duration-lazy':      700,
    'duration-glacial':  1000
  },
  easings: {
    'easing-standard':         'cubic-bezier(0.2,0,0,1)',
    'easing-decel':            'cubic-bezier(0,0,0,1)',
    'easing-accel':            'cubic-bezier(0.3,0,1,1)',
    'easing-emphasized-decel': 'cubic-bezier(0.05,0.7,0.1,1)',
    'easing-emphasized-accel': 'cubic-bezier(0.3,0,0.8,0.15)',
    'easing-spring':           'cubic-bezier(0.175,0.885,0.32,1.275)',
    'easing-bounce':           'cubic-bezier(0.34,1.56,0.64,1)',
    'easing-linear':           'linear'
  }
}
```

## When to pick which duration

| Duration | Use |
|---|---|
| `instant` 50ms | tooltip arming, focus-ring fade-out — barely perceptible |
| `fast` 100ms | hover overlays, button press feedback |
| `quick` 200ms | dropdown open, tab switch, micro-state changes |
| `base` 300ms | the default — modal / drawer / accordion open-close |
| `moderate` 400ms | accordion full reveal with content reflow |
| `slow` 500ms | onboarding tour transitions, attention-grabbing changes |
| `lazy` 700ms | hero illustration entrance, page-level transitions |
| `glacial` 1000ms | meditative ambient animations (loading bars, breathing dots) |

## When to pick which easing

| Easing | Personality |
|---|---|
| `standard` | the default — Material's smooth fall-off, equivalent to ease-in-out for short transitions |
| `decel` | "object enters" — content arriving from off-screen |
| `accel` | "object exits" — modal dismissing, toast retreating |
| `emphasized-decel` | longer fall-off, more pause at the end — feels "premium" |
| `emphasized-accel` | sharper acceleration — content gets out of the way fast |
| `spring` | overshoots slightly past the target, settles back — feels alive |
| `bounce` | larger overshoot + recovery, multi-bounce-like — playful, attention-grabbing |
| `linear` | constant velocity — for progress indicators only; everything else feels robotic |

## Scaffold to emit

```yaml
motion:
  duration-instant:  50
  duration-fast:     100
  duration-quick:    200
  duration-base:     300
  duration-moderate: 400
  duration-slow:     500
  duration-lazy:     700
  duration-glacial:  1000
  easing-standard:         "cubic-bezier(0.2,0,0,1)"
  easing-decel:            "cubic-bezier(0,0,0,1)"
  easing-accel:            "cubic-bezier(0.3,0,1,1)"
  easing-emphasized-decel: "cubic-bezier(0.05,0.7,0.1,1)"
  easing-emphasized-accel: "cubic-bezier(0.3,0,0.8,0.15)"
  easing-spring:           "cubic-bezier(0.175,0.885,0.32,1.275)"
  easing-bounce:           "cubic-bezier(0.34,1.56,0.64,1)"
  easing-linear:           "linear"
```

CSS usage:

```css
.dropdown {
  transition:
    opacity   var(--vc-duration-quick) var(--vc-easing-decel),
    transform var(--vc-duration-quick) var(--vc-easing-emphasized-decel);
}
.toast {
  transition: transform var(--vc-duration-base) var(--vc-easing-bounce);
}
```

## Lib functions used

- `amvcpTokens.generateMotionLibrary()` → `{durations, easings}` map
- pair with `amvcpTokens.applyPersonalityDelta` — the `playful` /
  `corporate` / `minimal` deltas multiply every duration by a scalar,
  giving themed motion personality without changing per-call call sites

## DESIGN.md tokens used

- writes: `motion.duration-*` (eight ms integers) and `motion.easing-*`
  (eight cubic-bezier / linear strings)
- emits: `--vc-duration-instant` … `--vc-duration-glacial`,
  `--vc-easing-standard` … `--vc-easing-bounce`, etc.

## Anti-slop interaction

A single `--vc-easing-spring` token shared across every animation makes
the whole artifact feel coherent. Slop is the OPPOSITE — every component
picks a different bespoke `cubic-bezier(…)` and the page feels
uncoordinated. The lint doesn't flag this directly, but
`applyPersonalityDelta('minimal', text)` will multiply every duration by
1.3 (slowing things down), and that's the structural fix when an
artifact feels "twitchy" or "AI-cranked".

## Reduced-motion contract

`amvcp-tokens.css` ships `@media (prefers-reduced-motion: reduce)`
overrides that kill the `.vc-state` overlay transition (sets
`transition: none`). The contact sheet's motion-panel chips also wire
themselves off (`attachMotionDemo` early-returns when reduced motion is
on). **Never** ignore reduced-motion — it's a hard accessibility
contract.

## Selection / comment / decision-mini contract

Motion tokens carry no selection state, but they DO drive selection's
appearance: `--vc-selection-bg` is a static color, but the focus-ring
(`--vc-focus-ring`) and the `.vc-state` hover/focus/pressed overlays
all transition with `var(--vc-duration-quick) var(--vc-easing-standard)`.
A reader's selection draws instantly (no fade in/out), and the focus
ring's fade-in matches the durations defined here.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact sheet
under `dev-browser`, click each easing chip, and observe the chip's
demo dot traverse left→right with the named curve. Verify
**reduced-motion behaviour**: set `await page.emulateMediaFeatures([{
name: 'prefers-reduced-motion', value: 'reduce' }])` and confirm the
demo dot snaps without transitioning. Take screenshots in **both
themes** (R1) — easing tokens have no visible color, so the chip
chrome must theme correctly.
