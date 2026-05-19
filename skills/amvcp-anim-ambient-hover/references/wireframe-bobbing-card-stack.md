# Wireframe bobbing card stack — `.va-float-y` + shadow-scale recipe

## Table of Contents

- [The visual](#the-visual)
- [The recipe](#the-recipe)
- [Why ::after for the shadow](#why-after-for-the-shadow)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Loop-pause integration](#loop-pause-integration)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [When to use the bobbing card stack](#when-to-use-the-bobbing-card-stack)
- [Visual verification](#visual-verification)
- [Pattern note: the wireframe-skill connection](#pattern-note-the-wireframe-skill-connection)
- [Combining with hover lift](#combining-with-hover-lift)
- [Custom shadow color](#custom-shadow-color)

A wireframe-skill pattern from the html-effectiveness mining
catalog (`02-exploration-visual-designs`): a "Playful" wireframe
variant with a CSS-only bobbing card stack and a separately-keyed
shadow that scales on the same beat. Pure CSS, no JS, no GIF.

This file documents the recipe — useful for any author who
wants a similar "alive but subtle" treatment on hero or feature
sections.

## The visual

A card (or stack of cards) gently bobs up and down at 3-4
second intervals. Underneath, a soft shadow simultaneously
shrinks (when card is up) and grows (when card is down). The
combined effect: the card looks like it's floating above the
page.

## The recipe

```html
<div class="ve-float-card-stack">
  <article class="ve-float-card">
    <h3>Card title</h3>
    <p>Card content...</p>
  </article>
</div>
```

```css
.ve-float-card {
  position: relative;
  padding: 24px;
  background: var(--vc-color-surface);
  border: 1px solid var(--vc-color-border);
  border-radius: 12px;
  animation: vaFloatY 3.2s ease-in-out infinite;
}

.ve-float-card::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 8%;
  right: 8%;
  height: 12px;
  background: radial-gradient(ellipse at center,
                              var(--vc-color-shadow, rgba(0, 0, 0, 0.15)) 0%,
                              transparent 70%);
  animation: vaFloatShadow 3.2s ease-in-out infinite;
}

@keyframes vaFloatShadow {
  0%, 100% { transform: scale(1);   opacity: 0.4; }
  50%      { transform: scale(0.7); opacity: 0.2; }
}

@media (prefers-reduced-motion: reduce) {
  .ve-float-card,
  .ve-float-card::after {
    animation: none;
  }
  .ve-float-card::after {
    transform: scale(1);
    opacity: 0.4;
  }
}
```

The card uses the animation skill's `vaFloatY` keyframe (16px
bob, ease-in-out, 3.2s — slightly longer than the float-y
default 3s, but the same keyframe).

The shadow uses a custom `vaFloatShadow` keyframe that runs at
the same 3.2s duration. At 0% / 100% (card at rest position,
center of cycle), the shadow is at scale 1 and opacity 0.4
(full size, visible). At 50% (card peak), the shadow is at
scale 0.7 and opacity 0.2 (smaller, dimmer — selling the
"card has lifted" illusion).

The shadow runs in PHASE with the bob — both keyframes start
together, both peak at 50%, both end at 100%. The phase
relationship is critical: if the shadow were 180° out of phase,
the card would peak when the shadow was at FULL size (wrong —
shadow should be smallest when card is highest).

## Why ::after for the shadow

Using `::after` lets the shadow be a SEPARATE animatable element
without adding HTML. The pseudo-element:
- Is `position: absolute` relative to the card.
- Has its own `transform: scale()` independent of the card.
- Has its own animation timing (same duration, but separately
  controllable).

The alternative — animating `box-shadow` directly on the card —
doesn't allow independent scale + opacity animations on the
shadow. The pseudo-element is the cleanest approach.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-color-surface` | card background |
| `--vc-color-border` | card border |
| `--vc-color-shadow` (optional) | shadow gradient (falls back to rgba black) |

The 3.2s duration is preset character — not a token. The 16px
bob is `--vc-motion-scale`-damped (via the inherited `vaFloatY`
keyframe).

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .ve-float-card,
  .ve-float-card::after {
    animation: none;
  }
  .ve-float-card::after {
    transform: scale(1);
    opacity: 0.4;
  }
}
```

The substitute is REMOVAL — the card sits at rest, the shadow
sits at its full-size opacity-0.4 state. This is the canonical
"decorative loop" substitute (motion is the entire point; remove
the animation).

The static shadow at scale 1, opacity 0.4 is the correct "rest
state" — matches the card's rest position visually.

## Loop-pause integration

Both the card and its `::after` shadow are infinite loops. The
loop-pause observer should pause both when off-screen. The
animation skill's `LOOP_SELECTOR` matches the card via
`.va-float-y`-like class names... but `.ve-float-card` is NOT in
the selector. The shadow's pseudo-element is also not in the
selector.

To benefit from loop-pause:
1. Add `.ve-float-card` to the loop-pause selector list at the
   skill level (one approach).
2. Use `.va-float-y` directly instead of `.ve-float-card`
   (alternative — accept the default 3s duration).
3. Add an `IntersectionObserver` in your own JS to toggle
   `animation-play-state` on `.ve-float-card` (custom approach).

The pragmatic choice for most pages: use `.va-float-y` directly
on the card and accept the 3s default. The shadow then runs in
your own custom keyframe at 3s for phase alignment.

## Selection + comment + decision integration

`.ve-float-card` is a card-shaped element — but the animation
skill's `stampAnimatedAtoms` only stamps `.va-stagger-item`,
`[data-va-reveal]`, and `.va-counter[data-va-stat]`. The float
card is NOT stamped unless you also mark it:

```html
<article class="ve-float-card" data-va-reveal>
  <!-- ... -->
</article>
```

Now the card is stamped as a `data-ve-type="card"` atom AND has
the bobbing animation. The two patterns compose.

## When to use the bobbing card stack

- **Hero sections** — a single hero card that should feel
  inviting and alive.
- **Feature highlights** — 1-3 feature cards (more than 3 starts
  to feel busy with all the bobbing).
- **Product showcases** — a "Pinned" or "Featured" item that
  needs gentle emphasis.
- **Empty states** — a card that says "Nothing here yet" can
  bob to feel less harsh.

When NOT to use:
- **Information-heavy cards** — bobbing distracts from reading.
- **Many cards in a row** (4+) — too much bobbing.
- **Actionable cards** (forms, controls) — bobbing makes click
  targets feel unstable.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.ve-float-card`.
2. Screenshot at t=0, 800ms (1/4 cycle), 1600ms (1/2 cycle —
   peak), 2400ms (3/4), 3200ms (one full cycle).
3. Card should be at its TOP position at t=1600ms (16px above
   rest).
4. Shadow at t=1600ms should be at scale 0.7, opacity 0.2 —
   smaller and dimmer than at t=0.
5. With `prefers-reduced-motion: reduce`, card sits at rest,
   shadow at scale 1 / opacity 0.4. No motion.

## Pattern note: the wireframe-skill connection

The mining catalog placed this pattern under "wireframe" because
the original demo was a wireframe variant (style options:
formal, playful, etc.). The PATTERN is general — applies to any
context where a card should feel alive.

The wireframe skill might use this pattern in its
"playful" wireframe variant; other skills (slide-decks, layout)
might use it for hero sections. The animation skill provides the
underlying primitives (`vaFloatY`); each consumer composes the
shadow keyframe.

## Combining with hover lift

A `.ve-float-card.ve-card` would have BOTH the bobbing
(infinite) AND the hover-lift (on hover). The two compose:
- Default: card bobs.
- On hover: card stops bobbing (or — if `animation` and
  `transition` on `transform` race, the hover wins instantly).

The race: the bob is `animation: vaFloatY infinite`; the hover
adds `transform: translateY(-3px)`. The hover's transform
OVERRIDES the keyframe's transform (animation properties cascade
under transitions).

To make the bob STOP cleanly on hover:

```css
.ve-float-card:hover { animation-play-state: paused; }
```

The card pauses mid-bob (at whatever frame it was on) when
hovered, then the hover-lift's `transform: translateY(-3px)`
applies. On mouseleave, the bob resumes from where it paused.

## Custom shadow color

The default `rgba(0, 0, 0, 0.15)` shadow works in both light
and dark themes (a black shadow at 15% reads as a soft fade in
both). For themed shadows:

```yaml
theme:
  light: { shadow: "rgba(0, 0, 0, 0.15)" }
  dark:  { shadow: "rgba(0, 0, 0, 0.4)" }
```

The dark theme uses a denser shadow because the dark background
absorbs more contrast. The lighter shadow under dark mode would
be invisible.

The DESIGN.md engine emits these as `--vc-color-shadow`. The
recipe's `var(--vc-color-shadow, rgba(0, 0, 0, 0.15))` picks
the themed value or falls back.
