# Decorative vs informational — the binary that drives every choice

Every animation in the skill falls into ONE of two categories.
The category drives:
- The reduced-motion substitute (preserve or remove).
- The selection contract (atom-stamp or skip).
- The performance pattern (loop-pause or fire-once).
- The DESIGN.md token consumption (color-painted or geometry-only).

Getting the category right is the FIRST authoring decision. Get
it wrong and the substitute is wrong, the perf is wrong, the
selection contract is wrong.

## The two categories defined

### Decorative

Animations that exist for DELIGHT only. No information content.
The user perceives them as "page is alive" or "page is polished".
Removing them does not change what the user learns from the page.

Examples:
- `.va-float-y`, `.va-breathe`, `.va-orbit`, `.va-rotate` — ambient
  loops.
- `.va-tilt` — 3D card tilt on hover.
- `.va-link` underline animation.
- Parallax depth tiers (`.va-parallax-1` through `.va-parallax-6`).
- The orbiting satellite indicator (mascot animations).
- A celebration confetti pop on task-completion.

### Informational

Animations that CONVEY meaning. The user perceives them as "this
just appeared" or "this is now N" or "this is loading here".
Removing them loses meaning.

Examples:
- `.va-stagger-item` — "this card is part of a cascade; the order
  matters".
- `[data-va-reveal]` — "this section just became visible — pay
  attention".
- `.va-counter` — "this is the count; the build-up shows you the
  magnitude".
- `.va-skeleton` — "content is loading here; this is the
  placeholder".
- `.va-pulse` — "this is awaiting / active right now".
- The scroll-progress bar — "you are N% through the document".

## The decision tree

```
Does removing this animation change what the user LEARNS from the page?
├── YES → INFORMATIONAL
│   │   reduce substitute: meaning-preserving (fade-only, instant-final, static-state)
│   │   atom contract: STAMP the element with data-ve-id + data-ve-type
│   │   perf pattern: fire-once IO (reveal) or one-shot rAF (counter)
│   └   token consumption: may paint with --vc-color-* (theme-aware)
└── NO  → DECORATIVE
    │   reduce substitute: REMOVAL (omit the rule)
    │   atom contract: do NOT stamp
    │   perf pattern: loop-pause IO (for infinite loops)
    └   token consumption: usually --vc-motion-scale only (geometry-only)
```

## Worked examples

### Card entrance (informational)

A `.va-stagger-item` cascading in conveys: "these cards are
appearing in order; you are looking at the start of the
sequence". The cascade communicates information (the order, the
arrival).

- **Reduce substitute:** opacity-only fade in 200ms. Meaning
  preserved (cards appear); cascade information dropped (all
  appear at once).
- **Atom contract:** stamp `data-ve-type="card"`, mount decision
  pill.
- **Perf:** the cascade is one-shot per page load. No loop-pause
  needed (no infinite animation).
- **Tokens:** `--vc-duration-entrance`, `--vc-duration-stagger-step`,
  `--vc-easing-decel`, `--vc-motion-scale`.

### Floating hero ornament (decorative)

A `.va-float-y` SVG ornament bobbing in the hero conveys:
nothing. It's pretty. Remove it and the hero still tells the
reader everything.

- **Reduce substitute:** removal. The ornament sits at rest. No
  meaning lost.
- **Atom contract:** do NOT stamp. The ornament isn't comment-
  able.
- **Perf:** loop-pause IO so off-screen ornaments don't burn
  CPU.
- **Tokens:** `--vc-motion-scale` damps the bob amplitude. No
  duration tokens (3s is preset character).

### Stat counter (informational)

A `.va-counter` rolling 0 → 45,200 conveys: "the count is
45,200; watch it build up so you appreciate the magnitude".

- **Reduce substitute:** show final value immediately. Meaning
  preserved (the count is 45,200); build-up dropped.
- **Atom contract:** stamp `data-ve-type="counter"` (more
  specific than `card`).
- **Perf:** fire-once (one rAF tick loop per IO trigger). No
  loop-pause (the count terminates).
- **Tokens:** `--vc-duration-slow`. NO motion-scale (numeric
  counters have no transform).

### 3D card tilt (decorative)

A `.va-tilt` card following the mouse with rotateY/rotateX
conveys: "this card is responsive; you can interact with it".
But the STATIC `:hover` rule (a box-shadow lift) ALSO conveys
this. The tilt's specific role is delight, not information.

- **Reduce substitute:** removal (the JS listener doesn't
  attach). The static hover lift remains, preserving the
  "responsive" affordance.
- **Atom contract:** do NOT stamp `.va-tilt` directly; the
  underlying card (if `.va-stagger-item` or `[data-va-reveal]`)
  is the atom.
- **Perf:** no rAF loop, no loop-pause. The mousemove listener
  fires only when the user is interacting.
- **Tokens:** `--vc-motion-scale` damps the max tilt angle.
  `--vc-duration-fast`, `--vc-easing-standard` for the
  mouseleave reset.

## What about edge cases?

### Skeleton — decorative or informational?

A `.va-skeleton` shimmer occupies the visual space of content
that has NOT YET arrived. It tells the user "loading here". The
SHAPE is informational (where loading is happening); the SHIMMER
is decorative (visual delight on top of the shape).

The skill handles this nuance:
- **Reduce substitute:** the shape stays (a flat muted block).
  The shimmer is dropped.
- **Atom contract:** do NOT stamp (the skeleton is a transient
  placeholder, not real content).
- **Perf:** loop-pause IO (the shimmer is an infinite loop).

The decomposition: shape = informational substrate; shimmer =
decorative overlay. The reduce substitute keeps the substrate,
drops the overlay.

### Link underline — decorative or informational?

The animated underline on `.va-link` is decorative — the static
underline (or any other hover treatment) ALSO conveys "this is a
link / this is hoverable". The animation specifically is delight.

- **Reduce substitute:** the underline still appears on hover
  (the `:hover` rule still matches), just without the smooth
  grow. Meaning (link affordance) preserved; motion dropped.
- **Atom contract:** do NOT stamp (the link is a navigation
  element; the surrounding content is what gets commented on).
- **Perf:** no IO, no loop-pause. The transition fires only on
  hover.

### Scroll-progress bar — decorative or informational?

The bar's WIDTH conveys progress through the document
(informational). The CHANGE in width as the user scrolls is
mechanical (not motion in the perceptual sense — it's a 1:1
mapping from scroll position).

- **Reduce substitute:** the bar still shows the current
  progress (the `scaleX` value matches the current scroll
  position). The "animation" is actually a JS-driven custom
  property write; there's no keyframe to disable. The bar
  works the same under reduce.
- **Atom contract:** do NOT stamp (the bar is page UI, not
  content).
- **Perf:** no IO, no loop-pause. The scroll listener feeds
  the bar regardless.

## Why the category matters for selection

The selection contract (the `stampAnimatedAtoms` pass) only
stamps INFORMATIONAL atoms — content the user can comment on or
make decisions about. Decorative elements are not stamped because
there's nothing to discuss.

Stamping a decorative atom would:
- Pollute the comment thread tree with non-content nodes.
- Mount unnecessary decision pills (visual clutter).
- Confuse the user ("why is there a comment pill on this
  ornament?").

The selector list in `stampAnimatedAtoms`:

```js
var SEL = '.va-stagger-item, [data-va-reveal], .va-counter[data-va-stat]';
```

ONLY informational atoms. The decorative elements
(`.va-float-y`, `.va-tilt`, `.va-link`, etc.) are EXCLUDED.

## Why the category matters for performance

Decorative loops run forever (infinite animations). Without
loop-pause, an off-screen `.va-float-y` would burn CPU
indefinitely. The skill's loop-pause IO covers exactly the
decorative loops:

```js
var LOOP_SELECTOR =
  '.va-float-y, .va-breathe, .va-orbit, .va-rotate, .va-pulse, .va-skeleton';
```

Note: `.va-pulse` and `.va-skeleton` are informational
(loading indicators) but they're also infinite loops, so they
benefit from loop-pause. The category determines the SUBSTITUTE
pattern, not the perf pattern. Both informational loops AND
decorative loops get loop-pause.

Informational ONE-SHOT animations (`.va-stagger-item`,
`[data-va-reveal]`, `.va-counter`) don't need loop-pause —
they fire once and terminate.

## Mistakes to avoid

### Treating decorative as informational

If you stamp `.va-float-y` as an atom, the comment thread
becomes polluted. If you write a fade-only reduce substitute
for `.va-orbit`, the orbiting satellite suddenly stops mid-
orbit and fades out (jarring). The substitute should be REMOVAL.

### Treating informational as decorative

If you omit the reduce substitute for `.va-stagger-item`,
users with `reduce` see blank cards (stuck at opacity 0). If you
don't stamp `[data-va-reveal]` sections, they're not commentable.

### Half-stamping

If you stamp `.va-stagger-item` but don't mount the decision
pill, the user sees a comment-able card without the pill — the
contract is violated. Both ARE atomically required.

## DESIGN.md tokens by category

| category | typical token consumption |
|---|---|
| Informational entrance | duration + easing + motion-scale (geometry damper) |
| Informational counter | duration only (numeric — no transform) |
| Informational loading | color tokens (theme-painted) + animation duration |
| Decorative loop | motion-scale only (preset durations) |
| Decorative hover | duration + easing (one-shot transitions) |
| Decorative scroll | motion-scale only (continuous mapping) |

Decorative elements consume FEWER tokens — durations are usually
preset character, colors are usually `currentColor` (inherited).

## Authoring checklist

For every animation you add:
- [ ] Identify the category (decorative or informational).
- [ ] Write the reduce substitute according to the category.
- [ ] Update the selection contract: stamp if informational, skip
      if decorative.
- [ ] Pick the perf pattern: loop-pause if infinite, fire-once
      otherwise.
- [ ] Tokenize what makes sense for the category.
- [ ] Document the category in the keyframe / class comment.

## Diagnostics

- **A reduce substitute feels wrong** → re-check the category.
  Decorative loops should NOT have a reduce substitute; if you
  wrote one, the substitute is the wrong pattern.
- **An atom isn't comment-able** → is it informational? If yes,
  add to the stamper selector list. If no, leave it alone.
- **A loop costs CPU when off-screen** → confirm it's in the
  `LOOP_SELECTOR`. If you added a custom infinite loop class
  that's not in the selector, add it.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow. The category-driven tests:

1. **Reduce substitute correctness:** for each animated class,
   confirm the reduce branch preserves meaning (information) or
   removes (decorative).
2. **Selection contract:** confirm `[data-ve-id]` is present on
   informational atoms, absent on decorative.
3. **Loop pause:** confirm `animation-play-state` is `paused`
   for off-screen decorative loops AND off-screen informational
   loops (skeleton, pulse).
