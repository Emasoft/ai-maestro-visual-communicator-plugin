# Easing curves — the five canonical curves and when to use each

Every easing in the animation skill is one of FIVE named cubic-bezier
curves, exposed as `--vc-easing-*` tokens by the DESIGN.md engine.
Mixing in a sixth curve is a smell — it almost always means the
intended motion is one of the five and you have not yet identified
which one.

## The five curves

| token | CSS custom property | cubic-bezier | semantic | when to use |
|---|---|---|---|---|
| `motion.easing-standard` | `--vc-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | ease-in-out | symmetric state change — a toggle going A → B → A |
| `motion.easing-decel` | `--vc-easing-decel` | `cubic-bezier(0, 0, 0, 1)` | ease-out | something arrives — entrance / reveal / hover-in |
| `motion.easing-accel` | `--vc-easing-accel` | `cubic-bezier(0.3, 0, 1, 1)` | ease-in | something leaves — exit / dismiss / hover-out |
| `motion.easing-spring` | `--vc-easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | overshoot | playful arrival — settle past target then back |
| `motion.easing-linear` | `--vc-easing-linear` | `linear` | constant | only for continuous loops (orbit, rotate, scrub) |

The four cubic-bezier curves are the Material Design canonical set
(`emphasized` family), simplified to first principles: decel for
arrivals, accel for departures, standard for round-trips, spring for
playfulness. Linear is reserved for infinite loops where any easing
would produce a visibly uneven cadence.

## Picking the curve by question

Run this decision tree before writing an `animation:` / `transition:`
declaration. The answer is one of five — never "a custom curve".

1. **Does it loop forever?** → `--vc-easing-linear`.
2. **Does it animate on AND animate off in one gesture?** (e.g. a panel
   that slides in, sits, then slides out on the same trigger) →
   `--vc-easing-standard` for both phases.
3. **Does it animate ON only?** (e.g. an entrance, a reveal, a
   hover-in transition) → `--vc-easing-decel` — the element arrives
   gently.
4. **Does it animate OFF only?** (e.g. an exit, a dismiss, a
   hover-out, a fade-and-remove) → `--vc-easing-accel` — the element
   leaves with momentum.
5. **Is the motion intentionally playful — a celebration, a stat
   counter that thumps into place, a card that lands like a stamp?**
   → `--vc-easing-spring`. **Sparingly**: spring on EVERY entrance
   feels chaotic; reserve for the one element per page that
   deserves to overshoot.

## Why decel on entrances (not standard)

A standard ease-in-out entrance starts slow, accelerates, then
decelerates to a stop. That trajectory makes sense for a round-trip
but feels lazy for an arrival — the first 30% of the motion is the
element gathering speed, and the user can see the element loitering.

A decel entrance starts at full speed and decelerates to a stop —
the element appears immediately committed to its destination, then
gently settles. Same total duration, perceptually faster.

For the reverse case (an exit), the inverse argument: an accel exit
starts gently and gains momentum — feels decisive. A standard
ease-in-out exit feels indecisive at the start ("am I going? am I
not?"). Pick decel for arrival, accel for departure, always.

## Spring overshoot — the one playful curve

```css
/* spring lands at 1.0 by overshooting to ~1.07 around 60% */
.va-spring-in {
  animation: vaScaleIn var(--vc-duration-slow, 400ms)
             var(--vc-easing-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) both;
}
@keyframes vaScaleIn {
  from { transform: scale(0.92); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
```

The y-axis of the curve goes ABOVE 1 (1.56 at x=0.34), which means
the property value transiently passes its target before settling.
For a `scale(1)` end-state the element transiently scales past 1
(reads as a small "bounce"); for a `translateY(0)` end-state the
element transiently translates past 0 (reads as a "thump").

Caveats:
- Do not use spring on a `transform: translateX` where the element
  is near a viewport edge — the overshoot pushes it off-screen for
  a frame.
- Do not use spring on an `opacity` keyframe — values above 1 are
  clamped, so the overshoot is invisible and you pay the perceptual
  cost (slightly slower mid-animation) for no visual reward.
- Do not use spring inside an infinite loop — overshoot every cycle
  is exhausting. Spring is for one-shot arrivals.

## Reduced-motion: every easing collapses to `ease` 200ms

The `prefers-reduced-motion: reduce` substitute does NOT switch
curves — it switches the entire animation to a 200ms fade with a
generic `ease` curve. The curve choice is irrelevant when there is
no visible motion. The skill's reduce branches uniformly use
`200ms ease` for the opacity-only fade-in substitute (see
`entry-and-scroll.md` for the canonical example).

## DESIGN.md authoring

```yaml
motion:
  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
  easing-decel:    "cubic-bezier(0, 0, 0, 1)"
  easing-accel:    "cubic-bezier(0.3, 0, 1, 1)"
  easing-spring:   "cubic-bezier(0.34, 1.56, 0.64, 1)"
```

All four are emitted by the DESIGN.md engine as
`--vc-easing-*` custom properties. The `motion.easing-linear`
"token" is not actually a custom property — every loop rule that
needs linear writes the literal `linear` keyword (the engine treats
unspecified keys as fallbacks; for `linear` there is no curve to
parameterise).

## Easing-presets-swap-a-single-CSS-var (from html-effectiveness
mining `07-prototype-animation.html`)

The mined "easing-prototype" pattern is itself a best practice for
the authoring flow: write every transition/animation rule with
`var(--vc-easing-decel, …)`, then change a SINGLE custom property
on `:root` to swap curves globally. This makes A/B-ing two curves
on the same page a one-line change:

```css
.va-stagger-item {
  animation: vaFadeSlideUp 600ms var(--vc-easing-decel) both;
}
```

```js
// hot-swap: try the spring curve everywhere
document.documentElement.style.setProperty(
  '--vc-easing-decel',
  'cubic-bezier(0.34, 1.56, 0.64, 1)'
);
```

The skill itself does NOT expose a curve-swapper widget — that is
the DESIGN.md hot-swap pad's job. The point of mentioning this
pattern is: if you ever find yourself hand-editing a curve inside
a `@keyframes`, you have broken the contract. Edit the token.

## Reduced-motion substitute (curve doesn't apply)

Curves only matter when motion is visible. With
`prefers-reduced-motion: reduce`, the substitute branch replaces the
keyframe with a 200ms opacity fade and uses generic `ease`. The
curve token is unread in the reduce branch. Confirm in the
`@media (prefers-reduced-motion: reduce)` block: no `var(--vc-easing-*)`
references — just `ease` or `linear`.

## Visual verification

Curve picks are nearly impossible to ABSOLUTELY verify visually —
they are subjective. The contract you CAN verify mechanically:

- Every `animation:` and `transition:` rule in the injected CSS
  references one of the five `--vc-easing-*` tokens (or the literal
  `linear` keyword inside an infinite loop, or generic `ease` inside
  a `reduce` block).
- No raw `cubic-bezier(…)` values appear outside the CSS token
  declarations themselves.

For the subjective check (does the entrance "feel right"?), see
`skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser screenshot
workflow — capture a 5-frame strip and look for the perceptual jank
("does it lag at the start?" → wrong curve, probably standard where
decel is wanted).

## Selection / decision integration

Curves do not become selectable atoms on their own — they ride on
whatever they are easing. The atom is the `.va-stagger-item` or the
`[data-va-reveal]`, not the curve.
