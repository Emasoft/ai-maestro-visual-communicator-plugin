# Touch and keyboard — affordances beyond mouse-only

## Table of Contents

- [The categories](#the-categories)
- [Keyboard parity for hover](#keyboard-parity-for-hover)
- [Touch device handling](#touch-device-handling)
- [Why no `@media (hover: hover)` guard in the skill](#why-no-media-hover-hover-guard-in-the-skill)
- [Pointer-events: none — when to disable hover entirely](#pointer-events-none--when-to-disable-hover-entirely)
- [Reduced-motion + touch + keyboard](#reduced-motion--touch--keyboard)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Pattern note: focus rings](#pattern-note-focus-rings)
- [Pattern: `:focus-visible` and `:focus-within`](#pattern-focus-visible-and-focus-within)

Many animations in the skill assume mouse-based interaction
(hover, mousemove). Touch users and keyboard users need
equivalent or substitute affordances. This file enumerates
where touch/keyboard parity matters and how to provide it.

## The categories

### Hover-based animations

| animation | mouse trigger | touch behavior | keyboard substitute |
|---|---|---|---|
| `.va-link` underline grow | `:hover` | first tap may show, second tap is click | `:focus-visible` matches `:hover` (already in skill) |
| `.va-tilt` 3D card tilt | `mousemove` | no event (touch doesn't fire mousemove) | no keyboard equivalent (skip on touch) |
| Hover lift on cards | `:hover` | first tap shows, second tap is click | `:focus-visible` matches `:hover` (recipe in `hover-lift-cards.md`) |

### Non-hover animations

| animation | trigger | touch behavior | keyboard substitute |
|---|---|---|---|
| `.va-stagger-item` cascade | page load | runs identically | runs identically |
| `[data-va-reveal]` scroll-reveal | scroll into view | runs identically | runs identically |
| `.va-counter` count-up | scroll into view | runs identically | runs identically |
| `.va-pulse` loading | always | runs identically | runs identically |
| `.va-skeleton` shimmer | always | runs identically | runs identically |
| Decorative loops (`.va-float-y`, etc.) | always | runs identically | runs identically |
| Parallax (`.va-parallax-N`) | scroll | runs identically | runs identically |

Non-hover animations work the same across input modes — they
don't require any input-mode-specific handling.

## Keyboard parity for hover

### `:focus-visible` matches `:hover`

CSS supports `:focus-visible` to detect keyboard-driven focus
(as opposed to mouse-click focus). Use it to mirror hover rules:

```css
.va-link {
  background-size: 0% 2px;
  transition: background-size var(--vc-duration-normal) var(--vc-easing-standard);
}
.va-link:hover,
.va-link:focus-visible {
  background-size: 100% 2px;
}
```

A keyboard user tabbing through the page hits the link via
`Tab`; the underline grows just like for a mouse hover.

The skill's `.va-link` rule INCLUDES `:focus-visible`. Author-
recipe rules (`.ve-card` hover lift) should follow the same
pattern.

### When to OMIT `:focus-visible`

If the animation requires `mousemove` data (the 3D card tilt
needs pointer position), there's no keyboard equivalent. Skip
the focus-visible rule — the JS listener won't fire on focus
anyway.

For tilt cards, the keyboard substitute is the STATIC `:hover`
effect (box-shadow lift) — the static affordance still applies
on focus-visible (via the duplicate CSS rule).

## Touch device handling

Touch devices fire DIFFERENT events than mouse:

| event | touch behavior | implication |
|---|---|---|
| `mouseover` | fires on first tap (then maybe again, depends on browser) | hover state can stick after tap |
| `mousemove` | rarely fires | tilt JS doesn't run |
| `mouseleave` | fires when user taps elsewhere | hover state clears |
| `click` | fires on tap-release | normal click path |
| `touchstart` / `touchmove` / `touchend` | actual touch events | use for touch-specific UX |

The skill's animations work on touch like this:

- **Stagger cascade, scroll-reveal, counter, skeleton, pulse,
  decorative loops** — these don't depend on input events.
  Identical behavior across input modes.
- **Link underline** — first tap may show the underline; the
  user's next tap is treated as a click. Some browsers don't
  fire `:hover` at all on touch. Graceful degradation: the link
  still works as a link.
- **Card tilt** — touch devices don't fire `mousemove`. The
  tilt JS does nothing on touch. The STATIC `:hover` rule (if
  authored, e.g. a box-shadow lift) might fire on the first
  tap, then the second tap navigates. Graceful degradation:
  card is still interactive.

## Why no `@media (hover: hover)` guard in the skill

The skill could wrap mouse-only animations in
`@media (hover: hover)`:

```css
@media (hover: hover) {
  .va-tilt:hover {
    /* hover styles for mouse only */
  }
}
```

This would skip the hover rule entirely on touch devices,
avoiding the sticky-hover-state issue.

The skill does NOT add this guard because:
1. Most animations don't depend on hover (only `.va-link`,
   `.va-tilt`, and the hover-lift recipe).
2. The graceful degradation on touch (rule fires on first tap,
   second tap clicks) is acceptable for the typical UX.
3. Adding the guard adds complexity for marginal benefit.

Authors targeting touch-first UX should add the guard to THEIR
own rules.

## Pointer-events: none — when to disable hover entirely

For decorative elements that should NOT respond to user
interaction (e.g. a floating ornament behind the hero text), set
`pointer-events: none` to make them transparent to all events:

```css
.va-float-y {
  pointer-events: none;   /* doesn't capture clicks or hovers */
}
```

The skill does NOT set `pointer-events: none` on the float
classes — the author decides. For a hero ornament that should
NOT be clickable, add the rule yourself.

`pointer-events: none` is the cleanest fix for "decorative
elements that block clicks on the content behind them".

## Reduced-motion + touch + keyboard

The reduce gate applies regardless of input mode:
- Touch user with `reduce` on → same reduced behavior as mouse
  user with `reduce` on.
- Keyboard user with `reduce` on → same reduced behavior.

The skill's reduce substitutes are input-mode-independent.

## DESIGN.md tokens consumed

No additional tokens — touch/keyboard parity is a behavioral
concern, not a theming concern. The same `--vc-duration-*` and
`--vc-easing-*` tokens drive animations regardless of input.

## Selection + comment + decision integration

The selection contract (atom stamping + decision pills) works
across all input modes:
- Mouse hover shows the comment affordance.
- Touch tap shows the comment affordance.
- Keyboard `Tab` focuses an atom; the runtime should show the
  comment affordance on `:focus-visible` (the runtime owns this
  behavior).

The animation skill stamps atoms; the runtime is responsible for
the hover/focus visuals. Verify the runtime's selection CSS
includes `:focus-visible` rules — without them, keyboard users
can't see selected atoms.

## Diagnostics

- **Hover state sticks on touch device** → expected; the
  browser fires `:hover` on touch-tap and doesn't fire
  `:hover-out` until another tap. Mitigation: wrap in
  `@media (hover: hover)` to skip hover entirely on touch.
- **Keyboard user can't see hover state** → missing
  `:focus-visible` rule. Duplicate the `:hover` body under
  `:focus-visible`.
- **Tilt doesn't work on touch** → expected; touch doesn't fire
  `mousemove`. The static hover lift (if authored) DOES fire
  on touch-tap.
- **Tab navigation skips a comment-able atom** → the atom isn't
  focusable. Add `tabindex="0"` to make it keyboard-reachable.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

### Keyboard test
1. Load page. `page.keyboard.press('Tab')` repeatedly.
2. After each Tab, screenshot. Confirm the focused element has
   a visible affordance (outline, underline, lift) via
   `:focus-visible`.
3. Compare to the same element with mouse hover. The affordance
   should be the SAME (or at least equivalent) under both
   modes.

### Touch test
1. Use DevTools touch emulation (Sensors → Touch).
2. Simulate a tap on a `.va-link`. Check if `:hover` fires.
3. Simulate a tap on a `.va-tilt` card. Confirm no tilt (no
   `mousemove`).
4. Confirm the static `:hover` (lift, shadow) does fire on
   first tap.

### Reduce + input parity
1. Set `prefers-reduced-motion: reduce`.
2. Repeat keyboard and touch tests.
3. Affordances should be the same (instant, not animated). No
   missing focus states.

## Pattern note: focus rings

The default browser focus ring (a blue outline) is the keyboard
user's fallback affordance. The skill does NOT remove focus
rings — `outline: none` should ONLY be used WHEN a custom focus
visual replaces it.

For elements where the skill or recipe provides a custom focus
state (e.g. the card hover-lift recipe's
`.ve-card:focus-visible { outline: none; }` paired with a lift +
shadow), the custom state IS the focus indicator.

For elements without a custom focus state, KEEP the browser's
focus ring. Removing it without replacement breaks keyboard
accessibility entirely.

## Pattern: `:focus-visible` and `:focus-within`

`:focus-visible` matches when an element has focus AND the
browser determines a focus indicator should show (typically:
keyboard focus, not mouse-click focus).

`:focus-within` matches when an element OR any descendant has
focus. Useful for parent elements that should highlight when
their child is focused.

Both can compose:

```css
.va-card-input-group:focus-within {
  border-color: var(--vc-color-accent);
}
.va-card-input-group input:focus-visible {
  outline: 2px solid var(--vc-color-accent);
}
```

The skill does NOT use `:focus-within` (none of the skill's atoms
have child focusables). Author extension.
