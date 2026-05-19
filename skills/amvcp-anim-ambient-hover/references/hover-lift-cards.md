# Hover lift on cards — `transform: translateY(-3px)` + shadow

## Table of Contents

- [The recipe](#the-recipe)
- [The skill does NOT ship `.ve-card`](#the-skill-does-not-ship-ve-card)
- [Combining with `.va-tilt`](#combining-with-va-tilt)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Touch devices](#touch-devices)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Pattern note: the brief outline pulse on click-to-anchor](#pattern-note-the-brief-outline-pulse-on-click-to-anchor)

A canonical hover affordance that combines a 3px upward
translation with a softer shadow and border-color change. The
skill does NOT ship a `.va-card` class (that belongs to the
layout skill); this file documents the canonical recipe so
authors can apply it consistently.

## The recipe

```css
.ve-card {
  transition: transform var(--vc-duration-fast, 120ms)
                var(--vc-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
              box-shadow var(--vc-duration-normal, 200ms)
                var(--vc-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
              border-color var(--vc-duration-normal, 200ms)
                var(--vc-easing-standard, cubic-bezier(0.2, 0, 0, 1));
}

.ve-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);
  border-color: var(--vc-color-accent, #b8861f);
}

.ve-card:focus-visible {
  /* same as hover for keyboard parity */
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);
  border-color: var(--vc-color-accent, #b8861f);
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .ve-card { transition: none; }
}
```

Five details:

1. **3px translation.** Enough to register as "lifted" without
   pushing the card off the surrounding flow. The card sits
   slightly above its baseline; the negative space below feels
   like a small gap.

2. **`box-shadow: 0 10px 30px`.** A soft drop shadow that grows
   on hover. The 30px blur is deliberately large — small blurs
   look like outline shadows; large blurs read as "this object is
   floating above the page".

3. **Border-color transition to accent.** Adds visual emphasis to
   the hover state. For cards without borders (just background),
   skip this transition.

4. **`:focus-visible` parity.** Keyboard users tabbing to a
   focusable card get the same affordance. `outline: none` is OK
   here BECAUSE the lift + shadow + border IS the focus indicator
   — without those, you'd need to keep the outline.

5. **Three transition durations.** Transform on 120ms (fast,
   feels responsive); shadow + border on 200ms (slightly slower,
   gives the lift visual weight). Mixing durations makes the
   compound affordance feel more "physical" — the card lifts
   first, the shadow grows second.

## The skill does NOT ship `.ve-card`

The card class itself belongs to the layout skill (cards are a
layout primitive). The animation skill provides:

- The motion tokens (`--vc-duration-fast`, `--vc-duration-normal`,
  `--vc-easing-standard`) that the recipe uses.
- The `.va-tilt` interactive polish (separate from this hover
  lift; the two CAN combine).

The animation skill does NOT provide:

- `.ve-card` styling (background, padding, border-radius).
- The default border for the un-hovered state.
- The shadow color tokens (if a theme wants themed shadows).

This is documented here because hover lift is a CANONICAL
animation pattern that authors will want to reproduce. The
recipe is the source of truth.

## Combining with `.va-tilt`

A `.ve-card.va-tilt` element gets BOTH the hover lift AND the
3D tilt:

```html
<article class="ve-card va-tilt">
  …
</article>
```

On hover-and-move:
- The lift activates immediately (CSS `:hover` rule).
- The tilt activates on mousemove (JS listener).

The tilt's `transform: perspective(...) rotateX(...) rotateY(...)`
might OVERRIDE the lift's `transform: translateY(-3px)` if both
write to `transform` directly. The lift's transform on
`:hover` PERSISTS in the rule cascade; the tilt's per-frame
`element.style.transform = ...` writes to the inline style which
OVERRIDES the cascaded `:hover` rule.

To preserve BOTH the lift AND the tilt, the tilt's inline write
must include the lift translation:

```js
card.style.transform = 'translateY(-3px) perspective(800px) rotateY(...) rotateX(...)';
```

The skill's current `initCardTilt` does NOT include the lift
translation in its inline write. Combining `va-tilt` + `ve-card`
loses the lift during tilt. The pragmatic solution: pick ONE
hover affordance per card (lift OR tilt), not both.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-fast` (120ms default) | transform duration |
| `--vc-duration-normal` (200ms default) | shadow + border duration |
| `--vc-easing-standard` (ease-in-out) | all three transitions |
| `--vc-color-accent` | border-color on hover |

The shadow color is hardcoded (`rgba(0, 0, 0, 0.10)`) — for a
themed shadow, the layout skill might define a
`--vc-color-shadow` token. The animation skill's recipe
intentionally uses a black shadow at 10% opacity (works in both
light and dark themes by construction — dark themes have lighter
backgrounds get darker shadows, light themes have darker
backgrounds get the same shadow lightly visible).

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .ve-card { transition: none; }
}
```

The substitute is `transition: none` — hover state changes apply
INSTANTLY. The lift, shadow, and border still appear on hover (the
`:hover` rules still match); they just snap rather than animate.

Meaning preserved (hover affordance) without the motion (the
smooth interpolation).

## Touch devices

`:hover` on touch devices is iffy — some browsers fire `:hover`
on the first tap (then on the second tap, it's a "click"); others
don't fire `:hover` at all. For touch-first designs, the hover
lift might not register; consider an alternative:

```css
@media (hover: hover) {
  .ve-card:hover {
    transform: translateY(-3px);
    /* ... */
  }
}
```

This wraps the hover rule in `@media (hover: hover)` so it only
applies on devices with a true hover capability. Touch devices
skip the rule entirely.

The skill does NOT ship this guard — authors targeting touch-first
should add it themselves.

## Selection + comment + decision integration

`.ve-card` elements that are ALSO `[data-va-reveal]` or
`.va-stagger-item` get stamped as content atoms. The hover lift
is independent of the atom contract — the runtime's hover/select
CSS adds an additional outline on hover, which composes with
the lift visually.

## Diagnostics

- **Lift is jittery** → the `transform` transition is missing or
  overridden by another rule. Confirm the cascade.
- **Shadow appears with no animation** → the `box-shadow`
  transition is missing.
- **Border-color flash** → the un-hovered state has no border;
  the transition has nothing to interpolate FROM. Add a base
  `border: 1px solid var(--vc-color-border)` to the un-hovered
  state.
- **Lift doesn't fire on keyboard focus** → `:focus-visible` rule
  is missing. Duplicate the hover rule's body under
  `:focus-visible`.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.ve-card`. Capture
   `getBoundingClientRect().top`.
2. Hover via `page.mouse.move(x, y, { steps: 8 })` — multi-step
   move is required for `:hover` events to fire correctly.
3. Wait 200ms (longest transition).
4. Re-capture `.top` — should be 3px LOWER (negative direction in
   screen coords = lower top value).
5. Re-capture `getComputedStyle(el).boxShadow` — should be the
   hover shadow.
6. Tab to the card via `page.keyboard.press('Tab')`. Confirm same
   lift + shadow appears.
7. With `prefers-reduced-motion: reduce`, repeat. The lift +
   shadow should appear INSTANTLY (no smooth transition).

## Pattern note: the brief outline pulse on click-to-anchor

The html-effectiveness mining catalog (`03-code-review-pr`) notes a
"click chip → smooth-scroll + 1.4s clay outline pulse on target"
pattern. After a smooth-scroll lands on the target, a 1.4s
box-shadow pulse draws attention to the destination.

Recipe (not shipped by this skill, but worth knowing):

```js
function pulseTarget(targetEl) {
  if (REDUCED) { return; }   // gate against reduce
  targetEl.style.boxShadow = '0 0 0 3px rgba(217, 119, 87, 0.35)';
  setTimeout(function () {
    targetEl.style.boxShadow = '';
  }, 1400);
}
```

The `boxShadow` set is JS; the removal is JS too. A smoother
version uses a class toggle and CSS transition:

```css
.va-pulse-once {
  box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.35);
  transition: box-shadow 1.4s ease;
}
```

```js
function pulseTarget(targetEl) {
  if (REDUCED) { return; }
  targetEl.classList.add('va-pulse-once');
  setTimeout(function () { targetEl.classList.remove('va-pulse-once'); }, 100);
  // The 1.4s transition runs as the class is removed, fading the
  // shadow back to zero.
}
```

This is a useful pattern for `click-chip → smooth-scroll → pulse`
flows. The animation skill could ship `.va-pulse-once` as a utility;
not currently included.
