# Keyframe catalog — every `@keyframes` shipped by the skill

The animation skill defines TEN named `@keyframes` rules. Each
is reused across multiple animations OR is the canonical name
for one specific effect. This file is the index — what each
keyframe does, where it's used, and how to customize it.

## The ten keyframes

| keyframe | purpose | used by | property animated |
|---|---|---|---|
| `vaFadeSlideUp` | stagger entry | `.va-stagger-item` (no-preference) | opacity + transform |
| `vaFadeOnly` | reduce substitute for fades | `.va-stagger-item` (reduce) | opacity |
| `vaFloatY` | vertical bob loop | `.va-float-y` | transform |
| `vaBreathe` | scale pulse loop | `.va-breathe` | transform |
| `vaOrbit` | circular orbit loop | `.va-orbit` | transform |
| `vaRotate` | full spin loop | `.va-rotate` | transform |
| `vaPulseRing` | expanding-ring loop | `.va-pulse` (no-preference) | box-shadow |
| `vaShimmer` | sliding-gradient loop | `.va-skeleton` (no-preference) | background-position |

The skill exposes these keyframes globally (they live in the
injected stylesheet). Authors can reuse them on custom classes:

```css
.my-custom-card {
  animation: vaFadeSlideUp 800ms var(--vc-easing-decel) both;
}
```

## `vaFadeSlideUp` — the entrance default

```css
@keyframes vaFadeSlideUp {
  from { opacity: 0; transform: translateY(var(--va-rise, 24px)); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- **From:** opacity 0, translated DOWN by `--va-rise` (default 24px,
  damped by `--vc-motion-scale`).
- **To:** opacity 1, no translation.

This is the canonical "card slides up from below as it fades in"
keyframe. Used by every `.va-stagger-item` under `no-preference`.

Custom usage:

```css
.my-hero {
  --va-rise: 50px;   /* larger rise for dramatic entrance */
  animation: vaFadeSlideUp 1s var(--vc-easing-decel) both;
}
```

The `--va-rise` custom property is a TUNABLE — the rise distance
defaults to 24px, but a custom class can override it.

## `vaFadeOnly` — the universal reduce substitute

```css
@keyframes vaFadeOnly {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

The simplest possible entrance: opacity 0 → 1, no transform. Used
in every `prefers-reduced-motion: reduce` branch for
information-bearing animations. The reduce substitute pattern
collapses to this keyframe for "the element appears" semantics.

Custom usage (for any custom entrance that needs a reduce
substitute):

```css
.my-fancy-entry {
  animation: myFancyEntry 800ms cubic-bezier(...) both;
}
@media (prefers-reduced-motion: reduce) {
  .my-fancy-entry { animation: vaFadeOnly 200ms ease both; }
}
```

The 200ms duration in reduce mode is a SKILL CONVENTION — every
information-bearing animation collapses to 200ms `ease`. Consistency
across the skill.

## `vaFloatY` — the vertical bob

```css
@keyframes vaFloatY {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(calc(-16px * var(--vc-motion-scale, 1))); }
}
```

A bob between 0 and -16px (up), returning. Three keyframes: 0%,
50%, 100% — the percentage syntax with comma-separated selectors
shares one rule across two stops.

Loop duration 3s, easing-in-out (set in the class rule). Reads as
"weightless drift up and down".

Custom amplitude:

```css
.my-loud-bob {
  animation: vaFloatY 3s ease-in-out infinite;
  --vc-motion-scale: 2;   /* doubles the bob amplitude */
}
```

Or write a custom keyframe with a different amplitude:

```css
@keyframes myBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-30px); }
}
```

## `vaBreathe` — the scale pulse

```css
@keyframes vaBreathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(calc(1 + 0.05 * var(--vc-motion-scale, 1))); }
}
```

Scales from 1.0 to 1.05 (subtle 5% expansion), returning. 4s loop,
ease-in-out.

The `calc(1 + 0.05 * --vc-motion-scale)` math means at
`motion.scale: 0` the scale stays at 1 (no breathe). The keyframe
still runs, but the value is constant.

Custom amplitude:

```css
@keyframes myBreathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }   /* 15% — more pronounced */
}
```

## `vaOrbit` — the circular orbit

```css
@keyframes vaOrbit {
  from { transform: rotate(0)      translateX(20px) rotate(0); }
  to   { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}
```

The composition is:
1. Outer rotate (0 → 360deg) — orbits around the origin.
2. translateX(20px) — places the element 20px from the orbit
   center.
3. Inner counter-rotate (0 → -360deg) — keeps the element upright
   during the orbit.

Without the inner counter-rotate, the element would TUMBLE
(rotate around its own axis while orbiting).

Linear easing, 8s loop. Linear is correct for a continuous orbit
— any other easing would make the orbit speed up/slow down
visibly mid-cycle.

Custom orbit radius:

```css
@keyframes myWideOrbit {
  from { transform: rotate(0)      translateX(40px) rotate(0); }
  to   { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
}
```

## `vaRotate` — the in-place spin

```css
@keyframes vaRotate {
  from { transform: rotate(0); }
  to   { transform: rotate(360deg); }
}
```

The simplest keyframe. Element spins 360° per cycle. 12s loop
(slow — for a spinner this would be too slow; for a hero
ornament it's the right pace).

For a fast spinner (loading indicator):

```css
.my-spinner {
  animation: vaRotate 1s linear infinite;   /* fast spin */
}
```

For a glacial rotation (background pattern):

```css
.my-glacial {
  animation: vaRotate 60s linear infinite;   /* one rotation per minute */
}
```

## `vaPulseRing` — the expanding ring

```css
@keyframes vaPulseRing {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb,
         var(--vc-color-accent, #b8861f) 45%, transparent); }
  70%  { box-shadow: 0 0 0 12px color-mix(in srgb,
         var(--vc-color-accent, #b8861f) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb,
         var(--vc-color-accent, #b8861f) 0%, transparent); }
}
```

The ring expands from 0px (45% accent opacity) to 12px (fully
transparent) by 70%, then collapses back to 0px (still
transparent) by 100%. The transparent collapse hides the ring
between cycles; the opaque expansion is the visible "pulse".

The 70% mark is the visible peak. Why 70% and not 50% (center)?
Because the FADE-OUT happens BEFORE the size reset — the ring
needs to be invisible at 100% to avoid a jarring snap when the
next cycle starts. The 70% peak gives a 30% window for the ring
to fade out gracefully.

Custom ring size:

```css
@keyframes myLargePulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 50%, transparent); }
  70%  { box-shadow: 0 0 0 24px color-mix(in srgb, currentColor 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 0%, transparent); }
}
```

## `vaShimmer` — the sliding gradient

```css
@keyframes vaShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

The simplest possible shimmer: the gradient's horizontal position
slides from 200% (right edge) to -200% (off the left edge). The
class itself sets `background-size: 200%` so the gradient is
larger than the element; the position animation slides the
gradient across.

1.5s loop, ease-in-out. Linear would make the shimmer feel
mechanical; ease-in-out softens the start/end.

For a faster shimmer (urgent loading):

```css
.my-fast-skeleton {
  animation: vaShimmer 0.8s ease-in-out infinite;
}
```

For a slower shimmer (relaxed loading):

```css
.my-slow-skeleton {
  animation: vaShimmer 3s ease-in-out infinite;
}
```

## Composition rules

Keyframes can be combined on a single element via the CSS
animation shorthand:

```css
.my-card {
  animation:
    vaFadeSlideUp 600ms var(--vc-easing-decel) both,
    vaBreathe 4s ease-in-out infinite 600ms;
}
```

The card fades-and-slides-up immediately, THEN starts breathing
after 600ms (the entrance duration). Two animations composed.

For more than 2-3 composed animations on one element, write a
custom keyframe that combines them — easier to debug than
multiple animation declarations.

## DESIGN.md token consumption per keyframe

| keyframe | tokens consumed | how |
|---|---|---|
| `vaFadeSlideUp` | `--vc-motion-scale` | via `--va-rise` calc |
| `vaFadeOnly` | none | pure opacity |
| `vaFloatY` | `--vc-motion-scale` | calc on translateY |
| `vaBreathe` | `--vc-motion-scale` | calc on scale |
| `vaOrbit` | none | radius hardcoded |
| `vaRotate` | none | full rotation |
| `vaPulseRing` | `--vc-color-accent` | color-mix |
| `vaShimmer` | none | uses background-position only; surfaces in the rule |

Keyframes themselves are token-poor (most amplitude/distance is
hardcoded). The TOKEN consumption happens in the rules that
INVOKE the keyframes (the animation shorthand reading
duration/easing tokens).

## Reduced-motion handling

Every keyframe is INTRINSIC — they fire when invoked. The reduce
gate is at the RULE level (which keyframe is invoked, with what
duration), not the keyframe level.

Under `prefers-reduced-motion: reduce`:
- `vaFadeSlideUp` is not invoked; `vaFadeOnly` is invoked
  instead.
- `vaFloatY`/`vaBreathe`/`vaOrbit`/`vaRotate` are not invoked
  (no rule under `reduce`).
- `vaPulseRing` is not invoked; static box-shadow substitute is
  applied.
- `vaShimmer` is not invoked; static background substitute is
  applied.

The keyframes themselves are dormant under `reduce`. They cost no
CPU unless invoked.

## Selection + comment + decision integration

Keyframes don't become selectable atoms. The animated element is
the atom; the keyframe is its motion.

## Diagnostics

- **Keyframe runs in unexpected direction** → swap `from` and
  `to` percentages, or use `animation-direction: reverse`.
- **Keyframe stops at intermediate state** → check
  `animation-fill-mode`: `both` holds the `from` state before
  start AND the `to` state after end; `forwards` holds only the
  `to` state.
- **Keyframe ignores token calc** → `--vc-motion-scale` is not
  set; the fallback (1) is being used. Confirm the DESIGN.md
  engine emits the token.
- **Custom keyframe doesn't see `--va-rise`** → the custom prop
  is set on the class, not on `:root`; ensure your custom class
  also sets it, or use a different name.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow. Test individual keyframes by:

1. Apply a custom class with one keyframe.
2. Screenshot at strategic points (0%, 25%, 50%, 75%, 100%).
3. Confirm each frame matches the expected keyframe state.
4. Toggle `prefers-reduced-motion`; confirm decorative-only
   keyframes (`vaFloatY` etc.) sit at frame 0 forever.
