# Scroll snap — `.va-snap-root` + `.va-snap-item` on the PAGE root

## Table of Contents

- [The contract](#the-contract)
- [Markup](#markup)
- [Why on the page root, NEVER an inner box](#why-on-the-page-root-never-an-inner-box)
- [Snap-align modes](#snap-align-modes)
- [Combining with reveal / counter / parallax](#combining-with-reveal--counter--parallax)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Combining with the slide-decks skill](#combining-with-the-slide-decks-skill)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Pattern note: the "scroll-snap-only slide deck"](#pattern-note-the-scroll-snap-only-slide-deck)

A scroll-snap mechanism that operates on the document's own scroll
axis — never on an inner `overflow:scroll` box. The natural
companion to a vertical slide deck rendered as a single page.

## The contract

Two classes. `.va-snap-root` on the document's scroll container
(usually `<html>` or `<body>`); `.va-snap-item` on each child that
should be a snap target.

```css
.va-snap-root { scroll-snap-type: y proximity; }
.va-snap-item { scroll-snap-align: start; }
```

The snap-type is `y proximity` — vertical scroll, "proximity" mode
(snap only when the user is close to a snap point and stops
scrolling, not on every micro-scroll). This is the gentler of the
two snap modes; the strict alternative is `y mandatory` (always
snap, no continuous scrolling), used by full-screen slide decks.

The slide-decks skill uses `mandatory` directly; the animation
skill ships only `proximity` as its default (less surprising for
non-deck content).

## Markup

```html
<html class="va-snap-root">
  <body>
    <section class="va-snap-item" style="min-height: 100vh;">…</section>
    <section class="va-snap-item" style="min-height: 100vh;">…</section>
    <section class="va-snap-item" style="min-height: 100vh;">…</section>
  </body>
</html>
```

The snap container MUST be a scrollable element. On the page root,
`<html>` is the scroll container by default. The snap items are
the immediate children that should snap to the viewport edge.

A `min-height: 100vh` on each snap item is the typical pattern —
each item fills the viewport, snap aligns the top of each to the
viewport top. Items shorter than 100vh still snap, but the
viewport will show empty space between the item's bottom and the
next item's top.

## Why on the page root, NEVER an inner box

The no-nested-scrollbars rule is absolute: documents have exactly
ONE scroll axis (the page's own). Scroll-snap implemented on an
inner `overflow:scroll` container introduces a SECOND scroll axis,
which violates the rule.

Concretely, a wrong pattern:

```html
<!-- WRONG — inner scroll container -->
<main style="height: 100vh; overflow-y: scroll;
             scroll-snap-type: y mandatory;">
  <section style="height: 100vh; scroll-snap-align: start;">…</section>
  <section style="height: 100vh; scroll-snap-align: start;">…</section>
</main>
```

The `<main>` has its own scrollbar; the page's outer scroll is
suppressed. Two scrollbars, inner snap-y axis, broken on mobile
where touch gestures get captured by the wrong element.

The right pattern: the snap-type rule on `<html>` (or `<body>`),
no `overflow:scroll` on an inner container. The page expands; the
browser handles snap natively on the document scroll axis.

## Snap-align modes

CSS supports `start`, `center`, `end`:

```css
.va-snap-item--start  { scroll-snap-align: start; }    /* the skill default */
.va-snap-item--center { scroll-snap-align: center; }   /* top of item at viewport center */
.va-snap-item--end    { scroll-snap-align: end; }      /* bottom of item at viewport bottom */
```

The skill ships only `.va-snap-item` (= start). Authors needing
`center` or `end` override the class with their own rule.

For most vertical scroll-snap layouts, `start` is correct: the
user scrolls down, the next item's top edge clicks into the
viewport's top edge.

## Combining with reveal / counter / parallax

Snap-aligned sections can also be reveal targets:

```html
<section class="va-snap-item" data-va-reveal="stagger">
  <h2>Heading</h2>
  <ul>
    <li class="va-stagger-item">First</li>
    <li class="va-stagger-item">Second</li>
  </ul>
</section>
```

The IO threshold for reveal (0.15) is well below the snap-engaged
threshold (the user has scrolled enough to engage snap, which
means the section is mostly in view). The reveal fires; the
stagger cascade plays.

Parallax inside a snap-item works the same — the parallax
listener reads the page's `scrollY`, the snap mechanism aligns the
section to the viewport; both compose without coordination.

## DESIGN.md tokens consumed

None. Scroll-snap is a layout mechanism, not a motion mechanism —
it has no duration, no easing, no scale damper. The browser handles
the snap transition natively with its own (non-configurable)
easing.

If you want the snap transition to have a specific feel, set
`scroll-behavior: smooth` on the snap container:

```css
.va-snap-root { scroll-snap-type: y proximity; scroll-behavior: smooth; }
```

This makes both user scrolling AND programmatic `scrollTo()`
animate smoothly. `scroll-behavior: smooth` is itself respect-
respecting — under `prefers-reduced-motion: reduce`, the browser
falls back to instant scroll.

## Reduced-motion substitute

The skill does not override snap behaviour under `reduce`. The
browser's `scroll-behavior: smooth` is already
`prefers-reduced-motion`-aware (when set, the browser disables
smooth scroll under `reduce`).

For the snap mechanism itself, snapping under `reduce` is fine —
snap is a positional final state, not motion. The user scrolls,
releases, the page snaps to the alignment point. The journey is
the user's scroll; the snap is the destination. No motion to
disable.

The user STILL benefits from snap under `reduce` — it keeps
sections aligned to the viewport edge, which is an information-
preserving layout aid.

## Selection + comment + decision integration

`.va-snap-item` elements are NOT stamped as content atoms by
`stampAnimatedAtoms()` — snap is a layout concept, not a content
concept. The COMMENT-able atom is whatever lives INSIDE the snap
item (a card, a heading, a reveal-stagger list).

If the snap item ITSELF should be commentable, mark it with
`data-va-reveal` too (a section can be both snap and reveal):

```html
<section class="va-snap-item" data-va-reveal>
  …
</section>
```

The `[data-va-reveal]` selector catches it for stamping — the
section gets `data-ve-id` + `data-ve-type="card"` and a decision
pill.

## Combining with the slide-decks skill

The slide-decks skill ships its own snap-deck container (`scroll-
snap-type: y mandatory`, harder snap than this skill's
`proximity`). The two are NOT meant to be combined on the same page
— a slide deck uses its own deck wrapper; ordinary content uses
the animation skill's `va-snap-root`.

If you have a hybrid page (a vertical document with one embedded
deck), use the slide-decks skill for the deck and the animation
skill's snap for the surrounding sections. The two snap mechanisms
operate on different scroll containers (the deck has its own
viewport-sized container, the rest of the page has the document
scroll).

## Diagnostics

- **Snap doesn't fire** → confirm `.va-snap-root` is on the
  document's scroll container (usually `<html>`). If applied to an
  inner non-scrolling element, the snap mechanism has nothing to
  bind to.
- **Snap is too aggressive (interrupts smooth scrolling)** → you
  used `mandatory` instead of `proximity`. The skill default is
  `proximity` — confirm the class is `.va-snap-root` and not a
  hand-overridden rule with `mandatory`.
- **Items don't snap to the top edge** → confirm `.va-snap-item` is
  on the direct children of the snap container. Snap-align fires
  on DIRECT descendants only.
- **Mobile feels janky** → snap fires on momentum-scroll, which can
  feel "sticky". Consider whether snap is the right pattern for
  the content; for long-form prose, snap is usually wrong.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow. The test:

1. Load page with `.va-snap-root` + multiple `.va-snap-item`s.
2. `page.evaluate(() => window.scrollBy(0, 50))` — scroll by 50px
   (intentionally less than a full item).
3. Wait one frame. Get `window.scrollY` — under `proximity`, the
   page should NOT have snapped (scroll is below threshold).
4. `page.evaluate(() => window.scrollBy(0, 600))` — scroll near the
   next item.
5. Wait a short time. Get `window.scrollY` — the page should have
   snapped to the next item's top edge.
6. With `prefers-reduced-motion: reduce`, repeat — snap still
   fires (snap is positional, not motion); only `scroll-behavior:
   smooth` would be affected.

## Pattern note: the "scroll-snap-only slide deck"

The extended-mining catalog (`09-slide-deck.html`) mines a
"scroll-snap-only slide deck" pattern: the entire deck engine is
`scroll-snap-type: y mandatory` + per-slide `scroll-snap-align:
start` + `height: 100vh`. JS only adds arrow-key navigation and a
"1 / 6" counter that updates via IntersectionObserver. Zero deck
framework, zero build.

The slide-decks skill productionises this pattern in its own runtime
(with `mandatory` not `proximity` for slide use). The animation
skill's snap is the same primitive at a softer snap-type — for
non-deck content like a long-form report with sections.
