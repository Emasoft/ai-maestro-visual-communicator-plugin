# `animation-fill-mode` — the `both` shortcut that prevents flashes

The single most important detail in any delayed CSS animation.
Without `animation-fill-mode: both`, items flash visible before
their delayed animation starts. The "flashing items before
cascade" bug is 100% of the time a missing `both`.

## The four modes

`animation-fill-mode` controls how a CSS animation's `from` and
`to` states are applied OUTSIDE the animation's running window:

| value | behavior before animation starts | behavior after animation ends |
|---|---|---|
| `none` (default) | use the rule's natural CSS values | use the rule's natural CSS values |
| `forwards` | use natural values | hold the `to` state |
| `backwards` | hold the `from` state | use natural values |
| `both` | hold the `from` state | hold the `to` state |

The skill's stagger entry rule uses `both`:

```css
.va-stagger-item {
  animation: vaFadeSlideUp 600ms var(--vc-easing-decel) both;
  animation-delay: calc(var(--va-index, 0) * 80ms);
}
```

The keyframe:

```css
@keyframes vaFadeSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

## Why `both` is required

Consider a `.va-stagger-item` with index 5 and 80ms stagger
step:
- delay = 5 * 80ms = 400ms
- animation starts at t = 400ms
- animation ends at t = 1000ms

Without `both`:
- t = 0 to 400ms: rule's natural CSS values (opacity 1, no
  transform). The item is FULLY VISIBLE.
- t = 400ms to 1000ms: animation runs (opacity 0 → 1, transform
  translateY 24px → 0).
- t > 1000ms: rule's natural CSS values (opacity 1, no
  transform). The item is fully visible.

The visible result: at t = 0 the item is visible. At t = 400ms
the animation STARTS by jumping the opacity to 0 (the `from`
state) and animating to 1. The user sees the item FLASH visible
(at t=0), then disappear (t=400 jump to opacity 0), then fade in
(400ms-1000ms).

With `both`:
- t = 0 to 400ms: hold the `from` state (opacity 0, transform
  translateY 24px). The item is INVISIBLE.
- t = 400ms to 1000ms: animation runs.
- t > 1000ms: hold the `to` state (opacity 1, no transform). The
  item is fully visible.

The visible result: item is invisible from page load through its
delayed start, then animates into place. No flash.

## Why `backwards` alone is insufficient

`animation-fill-mode: backwards` would also prevent the flash:
- t = 0 to 400ms: hold the `from` state.
- t = 400ms to 1000ms: animation runs.
- t > 1000ms: rule's natural CSS values (opacity 1).

But the natural CSS values are not always equal to the `to`
state. If the rule has `opacity: 0.9` (some weird base) and the
keyframe ends at `opacity: 1`, `backwards` ends with opacity
0.9; `both` ends with opacity 1.

For safety, ALWAYS use `both`. The cost (holding the `to` state
after end instead of using natural CSS) is essentially never
wrong — keyframes are designed to end at the desired final state.

## Why not `forwards` alone?

`forwards` would hold the `to` state after the animation ends —
correct for the final state — but does NOTHING about the BEFORE-
start window. With `forwards` only:
- t = 0 to 400ms: rule's natural CSS values. Item visible. FLASH.
- t = 400ms to 1000ms: animation runs.
- t > 1000ms: hold the `to` state. Final state correct.

The flash bug remains. `forwards` alone is insufficient for
DELAYED animations.

## The skill uses `both` everywhere

Every keyframe-animated class in the skill uses `both`:

```css
.va-stagger-item {
  animation: vaFadeSlideUp 600ms var(--vc-easing-decel) both;
}
@media (prefers-reduced-motion: reduce) {
  .va-stagger-item { animation: vaFadeOnly 200ms ease both; }
}
```

The reduce substitute ALSO uses `both` — even though the reduce
duration is 200ms (often shorter than the delay would be), `both`
keeps the gate against any future change where the delay might
matter.

## When `both` doesn't apply

`animation-fill-mode` is for keyframe animations. CSS
transitions (`transition: property duration easing`) DON'T have
fill modes — transitions only interpolate between the current
state and the target state. They don't pre-stage a `from` state.

So for transition-based animations (like the link underline,
which animates `background-size: 0% 2px → 100% 2px` on hover),
no `animation-fill-mode` is needed.

## Reduced-motion interaction

The reduce branch's `vaFadeOnly` substitute also uses `both`:

```css
@media (prefers-reduced-motion: reduce) {
  .va-stagger-item { animation: vaFadeOnly 200ms ease both; }
}
@keyframes vaFadeOnly { from { opacity: 0; } to { opacity: 1; } }
```

Why? The reduce substitute is also a one-shot animation. Even
though there's no delay in the substitute (all items fade at
once), `both` ensures the `from` state (opacity 0) is held BEFORE
the animation starts and the `to` state (opacity 1) is held
AFTER it ends.

Without `both` on the substitute, items might briefly flash
visible-then-fade-in at the very start of the animation cycle.
`both` keeps the gate intact.

## DESIGN.md tokens consumed

None. `animation-fill-mode` is a fixed value (`both`), not
themed.

## How to combine with other animation properties

The CSS animation shorthand is:

```
animation: <name> <duration> <timing-function> <delay>
           <iteration-count> <direction> <fill-mode> <play-state>;
```

The skill writes:

```css
animation: vaFadeSlideUp 600ms var(--vc-easing-decel) both;
```

That's name + duration + timing + fill-mode. The other slots
(delay, iteration-count, direction, play-state) take defaults:
delay 0, iteration-count 1, direction normal, play-state running.

The `animation-delay` is set as a separate rule because the calc
is per-item:

```css
.va-stagger-item {
  animation: vaFadeSlideUp 600ms var(--vc-easing-decel) both;
  animation-delay: calc(var(--va-index, 0) * 80ms);
}
```

Inlining the delay into the shorthand would require per-item
custom calc(), which doesn't work in the shorthand.

## The other fill-mode use cases

### `forwards` for one-shot reveal

A reveal that should hold its end state but NOT pre-stage a from
state (because the element starts at its natural CSS):

```css
.va-reveal-forward {
  animation: vaSlideIn 600ms ease-out forwards;
}
@keyframes vaSlideIn {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
```

But this has the SAME flash problem: the element starts at
`translateX(0)` (natural), flashes visible, then jumps to
`translateX(-100%)` (the `from` state at t=0 of animation), then
animates to `translateX(0)`. Same flash bug. Use `both`.

### `backwards` for pre-staging only

Rare — used when you want to hold the `from` state before, but
want the natural CSS to apply AFTER (e.g. an exit animation that
the element returns to its natural state after). Most animations
don't need this; `both` is safer.

### `none` for transitions or simple state changes

If the rule's natural CSS IS the desired state (no animation),
`none` is correct. The default value.

## Diagnostics

- **Items flash before animating** → 100% of the time, missing
  `animation-fill-mode: both`. Add it.
- **Items disappear after animation ends** → missing `forwards`
  or `both` on the fill-mode. The keyframe's `to` state isn't
  being held; the natural CSS (opacity 0?) is showing.
- **Animation doesn't run** → confirm the keyframe name matches,
  the duration is non-zero, the play-state isn't `paused`.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with staggered items.
2. Screenshot at t=0. Items at indices 1+ should be INVISIBLE
   (held at `from` state via `both`).
3. Screenshot at t=400ms. Item at index 5 (delay = 400ms) should
   be starting its animation (opacity rising from 0).
4. Screenshot at t=1500ms (well past the last animation end).
   All items at full opacity (held at `to` state via `both`).

If any frame shows items briefly visible BEFORE their delayed
start, `animation-fill-mode: both` is missing.

## The `data-va-reveal` rule uses transitions, not animations

The reveal observer adds `.va-in` to trigger a CSS TRANSITION
(not a keyframe animation):

```css
[data-va-reveal] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 600ms ease-out, transform 600ms ease-out;
}
[data-va-reveal].va-in { opacity: 1; transform: none; }
```

No `animation-fill-mode` needed — transitions interpolate from
the CURRENT state (the rule's `opacity: 0; transform: translateY(30px)`)
to the `.va-in` state (`opacity: 1; transform: none`). There's
no `from` state to pre-stage; the rule's defaults ARE the from.

This is one of the two design choices: KEYFRAME animations for
on-load entries (`.va-stagger-item`), TRANSITIONS for IO-
triggered reveals (`[data-va-reveal]`). Each pattern fits its
trigger model.
