# Reduced-motion gate — the substitute pattern, never `animation: none`

## Table of Contents

- [Why substitute (not disable)](#why-substitute-not-disable)
- [The two categories — information-bearing vs decorative](#the-two-categories--information-bearing-vs-decorative)
- [OS detection at runtime](#os-detection-at-runtime)
- [Live OS-preference updates](#live-os-preference-updates)
- [CSS pattern — every animation, twice](#css-pattern--every-animation-twice)
- [JS pattern — read `REDUCED` once per call](#js-pattern--read-reduced-once-per-call)
- [DESIGN.md `motion.scale: 0` is ORTHOGONAL, not equivalent](#designmd-motionscale-0-is-orthogonal-not-equivalent)
- [The decision-tree for "what substitute do I write?"](#the-decision-tree-for-what-substitute-do-i-write)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Selection / decision integration](#selection--decision-integration)

The single most important accessibility rule in the skill. Every
animation ships TWO branches: full motion under
`prefers-reduced-motion: no-preference`, and a MEANING-PRESERVING
substitute under `prefers-reduced-motion: reduce`. NEVER a blanket
`animation: none` on the reduce branch (which would leave content
stuck at its `from` state).

## Why substitute (not disable)

A user with `prefers-reduced-motion: reduce` set has explicitly
told the browser they get nauseous, dizzy, or distracted from
motion. The naive fix is to disable every animation:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

This is WRONG. Two reasons:

1. **Content stuck invisible.** A `.va-stagger-item` with
   `animation-fill-mode: both` sits at `opacity:0; transform: translateY(24px)`
   before the keyframe starts. `animation: none !important` cancels
   the keyframe, so the `from` state never advances. The element
   stays at `opacity:0` forever. The user sees blank cards.

2. **Meaning lost.** A "the count is now 45,200" animation that
   rolls 0 → 45,200 carries information: the user sees the magnitude
   build up. A `transition: none` substitute that flashes from "0"
   to "45,200" instantly conveys the same final value but the user
   loses the build-up cue. For a `.va-counter`, the meaning is
   preserved by SHOWING THE FINAL VALUE IMMEDIATELY (not rolling,
   but landing on the target).

The substitute rule, stated:

> For every animation, write a `reduce` branch that PRESERVES the
> information the animation conveys (the element appears, the
> value lands, the state changes) while DROPPING the motion (no
> transform, no tick loop, no infinite cycle).

## The two categories — information-bearing vs decorative

Every animation falls into one of two buckets. The substitute
pattern is different for each.

### Information-bearing — substitute with a meaning-preserving fade

These animations CONVEY information:
- "this card just appeared" (entrance)
- "this section is now visible" (scroll reveal)
- "the count is N" (counter roll-up)
- "the page is loading" (skeleton / pulse)

Substitute: replace the keyframe with a 200ms opacity fade (for
entrance/reveal), instant final value (for counter), or a static
final state (for loading indicators). The meaning IS preserved.

### Decorative-only — substitute with REMOVAL

These animations have no information content; they exist for
delight:
- `va-float-y` (a hero ornament bobbing)
- `va-breathe` (a logo pulsing)
- `va-orbit` (a satellite orbiting an icon)
- `va-rotate` (a spinner spinning forever)

Substitute: simply OMIT the animation rule in the `reduce` branch.
The element sits at rest. The "meaning" the loop conveyed (decorative
charm) is OK to drop entirely — there is no information to preserve.

The skill's CSS uses both patterns. Compare:

```css
/* information-bearing (Layer 2 stagger) — substitute is fade-only */
@media (prefers-reduced-motion: reduce) {
  .va-stagger-item { animation: vaFadeOnly 200ms ease both; }
}
@keyframes vaFadeOnly { from { opacity: 0; } to { opacity: 1; } }

/* decorative-only (Layer 4 floats) — substitute is removal */
@media (prefers-reduced-motion: reduce) {
  /* NO rule for .va-float-y, .va-breathe, .va-orbit, .va-rotate */
}
```

## OS detection at runtime

```js
var REDUCED = false;
var _mql = null;
if (typeof window !== 'undefined' && window.matchMedia) {
  _mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  REDUCED = !!_mql.matches;
}
```

`REDUCED` is a module-level boolean read ONCE at boot. JS branches
on it (the count-up's "show final value immediately" path, the
card-tilt's "skip wiring entirely" path). CSS branches on the
matching media query independently — same `prefers-reduced-motion`
preference, two read paths.

## Live OS-preference updates

```js
function _watchReducedMotion() {
  if (!_mql) { return; }
  function onChange(ev) {
    REDUCED = !!(ev && typeof ev.matches === 'boolean'
      ? ev.matches : _mql.matches);
    _api.refresh(document);
  }
  if (typeof _mql.addEventListener === 'function') {
    _mql.addEventListener('change', onChange);
  } else if (typeof _mql.addListener === 'function') {
    _mql.addListener(onChange);
  }
}
```

When the OS preference toggles WHILE a report is open, the
listener fires. `REDUCED` flips, then `refresh(document)` re-scans
the page — already-mounted content respects the new preference
without a reload. This matches the DESIGN.md hot-swap ethos (no
manual reload to see preference changes take effect).

Both modern (`addEventListener`) and legacy (`addListener`) forms
are wired — Safari < 14 only ships the legacy form.

## CSS pattern — every animation, twice

```css
/* full motion */
@media (prefers-reduced-motion: no-preference) {
  .X { animation: keyframeA Xms easing Y; }
}
/* substitute */
@media (prefers-reduced-motion: reduce) {
  .X { animation: keyframeFade 200ms ease both; }
  /* OR — for decorative-only: omit this rule entirely */
}
```

Two media-query branches per class. The default branch
(`no-preference`) holds the full animation. The `reduce` branch
holds the substitute. The order matters slightly — `no-preference`
first means a user agent that supports neither query reads no
rule, which is correct (the element has no animation, no transform
applied, no opacity:0 trap).

**The most common bug:** writing the full animation OUTSIDE the
`no-preference` branch (so it always fires) plus a reduce branch
that tries to undo it. The `from { opacity:0 }` state is hard to
undo from inside `reduce` because the `from` state persists once
applied. Always WRAP the full animation in
`@media (prefers-reduced-motion: no-preference)`.

## JS pattern — read `REDUCED` once per call

```js
function animateStat(el) {
  if (REDUCED || typeof requestAnimationFrame !== 'function') {
    el.textContent = fmt(target);
    return;
  }
  /* ... full tick loop ... */
}
```

Two-line gate at the top of every function that animates. If
`REDUCED`, skip to the final state and return. The substitute is
ALWAYS the same: produce the end-state, do no work between.

```js
function initCardTilt(root) {
  if (REDUCED) { return; }    // skip wiring entirely
  /* ... attach mousemove listeners ... */
}
```

For decorative-only JS effects (card tilt), the substitute is
"skip wiring entirely" — the element gets no listeners, the tilt
is dead. The static hover (a box-shadow change in CSS) still works
because that is a separate `:hover` rule.

## DESIGN.md `motion.scale: 0` is ORTHOGONAL, not equivalent

```yaml
motion:
  scale: 0   # theme-level "calm" mode
```

`motion.scale: 0` is a THEME-level damper (the designer says
"this theme is calm"). It multiplies transform distance, not
animation duration:

```css
.va-stagger-item { --va-rise: calc(24px * var(--vc-motion-scale, 1)); }
```

At `scale: 0`, the rise is 0px — items still FADE in (opacity from
0 to 1) but don't TRAVEL. The keyframe still runs.

This is ORTHOGONAL to `prefers-reduced-motion: reduce`:
- `scale: 0` is set by the THEME author, applies to everyone.
- `reduce` is set by the OS, applies only to users who opted in.

A user with both `scale: 0` AND `prefers-reduced-motion: reduce`
gets the reduce substitute (200ms fade, no travel). A user with
`scale: 0` but `no-preference` gets the full keyframe with no
travel (just the opacity fade). The two combine cleanly.

## The decision-tree for "what substitute do I write?"

```
Does this animation carry information the user needs?
├── YES → substitute is meaning-preserving (fade-only / instant final / static)
│   ├── Entrance / reveal → 200ms opacity fade
│   ├── Counter / numeric → instant final value, no roll
│   ├── Skeleton / loading → static muted block, no shimmer
│   ├── Pulse / awaiting → static ring, no expansion
│   └── Tilt / 3D card → skip wiring (the static hover still works)
└── NO (decorative-only) → substitute is REMOVAL
    └── Float / breathe / orbit / rotate / parallax → omit the rule
```

If you ever find yourself writing `animation: none !important` on a
`prefers-reduced-motion: reduce` branch, STOP. Either:
- The animation is information-bearing → write a meaning-preserving
  substitute.
- The animation is decorative → omit the rule (no need for `!important`
  or `animation: none`).

## Diagnostics

- **Content stuck at opacity:0 with reduce on** → the `reduce`
  branch is missing for that animation class. Add a fade-only
  substitute.
- **`reduce` user complains of motion** → check the JS path; a
  function might be missing the `if (REDUCED) return` early-exit.
  Grep `requestAnimationFrame` in the codebase, confirm every rAF
  loop is gated.
- **`reduce` preference toggle has no effect** → the
  `_watchReducedMotion` listener is detached, or `refresh()` is
  failing. Confirm `window.matchMedia` is available and
  `addEventListener`/`addListener` is on `_mql`.
- **Both branches fire** → impossible if `@media` queries are well-
  formed. Check for `@media (prefers-reduced-motion)` without `:
  reduce` or `: no-preference` — a malformed query matches both.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow. The key test:

1. Load page with `prefers-reduced-motion: no-preference` emulated.
   Run the screenshot strip — observe full motion.
2. In DevTools (Rendering panel), set
   `prefers-reduced-motion: reduce`.
3. Reload the page. Run the screenshot strip again — every
   animated element should appear FADED-IN, never STUCK INVISIBLE.
4. For decorative-only loops, confirm the element exists at its
   rest position (not animated, not stuck mid-frame).

Negative test: if you set `reduce` and any element is stuck at
`opacity:0`, you have a substitute-missing bug. Capture the failure
and the element selector; the fix is "add a reduce branch with
`opacity: 1` or a 200ms fade".

## Selection / decision integration

The reduce gate does not become its own selectable atom. It
modifies the BEHAVIOUR of every other atom, but the atom IDs and
the decision pills are unchanged — a user can still comment on a
card and tag a decision regardless of which motion branch the
card is using.
