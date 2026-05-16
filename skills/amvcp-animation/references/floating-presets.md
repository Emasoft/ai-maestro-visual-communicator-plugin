# Floating presets — four decorative ambient loops

`va-float-y` / `va-breathe` / `va-orbit` / `va-rotate` — named CSS
utility classes for decorative ornaments (hero accents, cover
illustrations, mascot icons). All four are infinite loops; all
four are decorative-only (REMOVED under `prefers-reduced-motion`,
not substituted). Use sparingly: 1-2 per page.

## The four presets

| class | keyframe | duration | curve | amplitude |
|---|---|---|---|---|
| `.va-float-y` | `vaFloatY` (translateY 0 → -16px → 0) | 3s | ease-in-out | 16px vertical bob |
| `.va-breathe` | `vaBreathe` (scale 1 → 1.05 → 1) | 4s | ease-in-out | 5% scale pulse |
| `.va-orbit` | `vaOrbit` (rotate + translate combo) | 8s | linear | 20px-radius orbit |
| `.va-rotate` | `vaRotate` (rotate 0 → 360deg) | 12s | linear | full spin |

The durations (3 / 4 / 8 / 12s) are NOT tokenized — they are preset
character, not design-system values. A 3s float that becomes a 5s
float reads as a DIFFERENT preset, not a "themed float". Authors
who want different timings copy the keyframe and write their own
class.

## The keyframes

```css
@keyframes vaFloatY {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(calc(-16px * var(--vc-motion-scale, 1))); }
}

@keyframes vaBreathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(calc(1 + 0.05 * var(--vc-motion-scale, 1))); }
}

@keyframes vaOrbit {
  from { transform: rotate(0)      translateX(20px) rotate(0); }
  to   { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}

@keyframes vaRotate {
  from { transform: rotate(0); }
  to   { transform: rotate(360deg); }
}
```

The amplitudes (`-16px`, `0.05`) ARE multiplied by
`--vc-motion-scale` so the theme can damp them. At `motion.scale: 0`
the bob distance is 0px, the scale ratio is 1.0 — the element
stays at rest visually even though the keyframe still runs.

## The orbit math

The orbit keyframe is the trickiest of the four:

```css
@keyframes vaOrbit {
  from { transform: rotate(0)      translateX(20px) rotate(0); }
  to   { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}
```

Reads as:
1. `rotate(0)` → `rotate(360deg)` — the element's RELATIVE position
   rotates around the origin (CSS transforms compose right-to-left,
   so the outermost rotate is the orbit).
2. `translateX(20px)` — moves the element 20px to the right of the
   origin AFTER the orbit rotation.
3. `rotate(0)` → `rotate(-360deg)` — counter-rotates the element so
   it stays UPRIGHT during the orbit (otherwise it would spin while
   orbiting, which reads as "tumbling").

To make the element tumble WHILE orbiting, drop the second rotate.
To increase the orbit radius, change the `20px` to your desired
value (and ideally multiply by `var(--vc-motion-scale, 1)` to keep
the calm-mode contract).

## Markup

```html
<div class="va-float-y">
  <svg width="48" height="48">…</svg>   <!-- a hero ornament -->
</div>

<div class="va-breathe">
  <img src="logo.svg" alt="">           <!-- a pulsing logo -->
</div>

<div style="position: relative; width: 100px; height: 100px;">
  <div class="va-orbit"
       style="position: absolute; top: 50%; left: 50%;
              width: 8px; height: 8px; border-radius: 50%;
              background: var(--vc-color-accent);">
  </div>
</div>

<div class="va-rotate">
  <svg>…</svg>   <!-- a spinner that just keeps spinning -->
</div>
```

The orbit class requires a parent with `position: relative` and
the orbiting element with `position: absolute` at the orbit center
— without the absolute positioning, the `translateX(20px)` is
relative to the element's natural position, not the orbit center.

## Performance: the loop-pause observer

All four classes are watched by the loop-pause IntersectionObserver
(see `loop-pause-observer.md`). When the element scrolls off-screen,
`animation-play-state: paused` is set — the loop stops costing CPU.
When the element scrolls back in, `running` is set — the loop
resumes from its paused frame.

This is NOT optional — the observer is wired automatically at init.
If you have 12 hero ornaments scattered through a long page, only
the ones in view are actually animating at any moment.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-motion-scale` (1 default) | damps the amplitude of each loop |

No duration / easing tokens — the durations are preset character
(not values authors are meant to override).

## Reduced-motion substitute — REMOVAL

```css
@media (prefers-reduced-motion: reduce) {
  /* NO rule for .va-float-y, .va-breathe, .va-orbit, .va-rotate */
}
```

The four floating presets are the canonical "decorative-only"
animations — they have NO information content; they exist for
delight only. Under `reduce`, the substitute is REMOVAL of the
animation rule.

The result: the element sits at the keyframe's starting
transform (which is identity — `translateY(0)`, `scale(1)`,
`rotate(0)`). The element is still THERE — it just doesn't move.
This is the textbook "decorative substitute" pattern: omit the
animation rule entirely, no fallback needed.

Compare to information-bearing animations (entrance, reveal,
counter) where the substitute is a 200ms fade — those animations
CONVEY information, so the substitute MUST preserve the meaning.
The floats don't convey anything, so the substitute is just "don't
animate".

## Selection + comment + decision integration

The floating-preset elements are NOT stamped as content atoms by
`stampAnimatedAtoms()` (the selector list excludes them). The
ornament inside a `.va-float-y` wrapper is decorative — comments
on the ornament make no sense. The comment-able atom is whatever
the ornament accompanies (the heading, the section, the card it
decorates), not the ornament itself.

## When to use which preset

- **`.va-float-y`** — for ornaments that should feel weightless or
  drifting. Compass icons, leaves, balloons. Avoid for anchor-text
  ornaments (the bob distracts from the text).
- **`.va-breathe`** — for "alive" things that should pulse like
  they're breathing: logos, mascot icons, heroes. The 5% scale is
  subtle enough to read as ambient.
- **`.va-orbit`** — for satellite indicators (a small dot orbiting
  an icon, suggesting "this is active / loading"). Pair with an
  icon at the orbit center.
- **`.va-rotate`** — for spinners. Loading indicators. Anywhere a
  full continuous spin reads as "in progress".

When NOT to use:
- On TEXT (motion distracts from reading).
- On INTERACTIVE elements (buttons, links — motion masks hover
  state).
- In multiples of 4+ on the same screen (becomes visual noise).

## Bobbing card stack — the mined variant (`02-exploration-visual-designs`)

The html-effectiveness mining catalogue spots a "bobbing card
stack" variant: a card with a separately-keyed shadow that scales
on the same beat as the card's bob. The keyframe pair:

```css
.va-float-card {
  animation: vaFloatY 3s ease-in-out infinite;
}
.va-float-card::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 5%;
  right: 5%;
  height: 8px;
  background: radial-gradient(ellipse at center,
                              var(--vc-color-shadow, rgba(0,0,0,0.15)) 0%,
                              transparent 70%);
  animation: vaFloatShadow 3s ease-in-out infinite;
}
@keyframes vaFloatShadow {
  0%, 100% { transform: scale(1);   opacity: 0.4; }
  50%      { transform: scale(0.7); opacity: 0.2; }
}
```

The card bobs UP (translateY -16px); the shadow simultaneously
shrinks (scale 0.7) and dims (opacity 0.2). When the card lands,
the shadow grows back. This sells the "floating" illusion much
better than a static shadow.

The skill does NOT ship `.va-float-card` as a class — the pattern
is described here as a recipe for authors who want a shadow-paired
float. Copy + paste, adjust the shadow color to your theme's
`--vc-color-shadow` (or a custom token).

## Diagnostics

- **Float doesn't run** → confirm the class is on the element,
  confirm the animation skill's CSS is injected, confirm
  `prefers-reduced-motion` is `no-preference`.
- **Float runs while off-screen (CPU waste)** → the loop-pause
  observer didn't attach. Confirm `initLoopPause` ran (check the
  console for errors), confirm the element is in
  `LOOP_SELECTOR`.
- **Multiple floats feel chaotic** → too many on screen; reduce
  count. Aim for 1-2 per visible viewport.
- **Orbit "tumbles"** → the keyframe's second `rotate(-360deg)` is
  missing; you customized the keyframe.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.va-float-y` element in the viewport.
2. Screenshot at t=0, 750ms (quarter cycle), 1500ms (half cycle —
   peak displacement), 2250ms (three-quarter cycle), 3000ms (one
   full cycle).
3. The element's `getBoundingClientRect().top` should be roughly
   constant at t=0 and t=3000, and ~16px LOWER (the element is
   higher in viewport, so top is smaller) at t=1500.
4. With `prefers-reduced-motion: reduce`, repeat — element's `top`
   should be CONSTANT across all timestamps (no float, sits at
   rest).
5. Scroll the element off-screen, wait 500ms, scroll it back.
   Confirm via `getComputedStyle(el).animationPlayState` that the
   value was `paused` while off-screen and `running` again after
   scrolling back.
