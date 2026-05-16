# Slide-deck transitions — 5 entrance moods + 4 inter-slide transitions

The slide-decks skill ships its own animation patterns for
slide entrance and slide-to-slide transitions, all using the
animation skill's tokens. This file documents the contract and
the 5+4 catalog.

## The 5 entrance moods

Each slide has an "entrance mood" that determines how its
content animates in when the slide becomes visible. The slide-
decks skill picks one based on the slide's character (formal vs
playful, dense vs sparse, calm vs energetic):

| mood | mechanism | best for |
|---|---|---|
| `calm` | opacity-only fade | text-heavy slides, eulogies, philosophical content |
| `purposeful` | fade + slide up (default stagger pattern) | most content slides |
| `energetic` | fade + scale-up + spring overshoot | celebratory, hero, opening |
| `precise` | fade + clip-wipe LTR | code blocks, technical diagrams |
| `playful` | per-element spring with random delays | personal content, casual decks |

The 5 moods reuse the animation skill's keyframes:

```css
/* calm */
.sd-slide--calm .sd-content {
  animation: vaFadeOnly var(--vc-duration-entrance) ease both;
}

/* purposeful (default) */
.sd-slide--purposeful .va-stagger-item {
  /* uses default vaFadeSlideUp from animation skill */
}

/* energetic */
.sd-slide--energetic .sd-content {
  animation: sdEnergeticEntry var(--vc-duration-slow) var(--vc-easing-spring) both;
}
@keyframes sdEnergeticEntry {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

/* precise */
.sd-slide--precise .sd-content {
  clip-path: inset(0 100% 0 0);
  transition: clip-path var(--vc-duration-entrance) var(--vc-easing-decel);
}
.sd-slide--precise.sd-active .sd-content {
  clip-path: inset(0 0 0 0);
}

/* playful — each element gets a random delay */
.sd-slide--playful .sd-element {
  animation: vaFadeSlideUp var(--vc-duration-slow) var(--vc-easing-spring) both;
  animation-delay: calc(var(--sd-rand-delay, 0) * 1ms);
}
```

The `playful` mood uses a custom `--sd-rand-delay` property
that JS sets at slide-mount time. The other 4 are pure CSS.

## Why moods, not "transitions"

A "transition" implies between slides. The 5 moods are about
how EACH slide ENTERS. Slide-to-slide transitions are separate:

## The 4 inter-slide transitions

How does the deck move from slide N to slide N+1?

| transition | mechanism | feel |
|---|---|---|
| `slide` | translateX swap | smooth horizontal flow |
| `fade` | opacity crossfade | quiet, formal |
| `flip` | rotateY 3D flip | playful, card-like |
| `none` | instant swap | dense decks where smoothness is too slow |

```css
.sd-deck {
  position: relative;
  overflow: hidden;
}

/* slide transition (default) */
.sd-deck--slide .sd-slide {
  position: absolute;
  top: 0; left: 100%;
  width: 100%; height: 100%;
  transition: left var(--vc-duration-entrance) var(--vc-easing-standard);
}
.sd-deck--slide .sd-slide.sd-active { left: 0; }
.sd-deck--slide .sd-slide.sd-past   { left: -100%; }

/* fade transition */
.sd-deck--fade .sd-slide {
  position: absolute;
  top: 0; left: 0;
  opacity: 0;
  transition: opacity var(--vc-duration-entrance) ease;
}
.sd-deck--fade .sd-slide.sd-active { opacity: 1; }

/* flip transition */
.sd-deck--flip .sd-slide {
  position: absolute;
  top: 0; left: 0;
  transform: rotateY(180deg);
  backface-visibility: hidden;
  transition: transform var(--vc-duration-entrance) var(--vc-easing-standard);
}
.sd-deck--flip .sd-slide.sd-active { transform: rotateY(0); }
```

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-entrance` | slide entrance + transition duration |
| `--vc-duration-slow` | energetic/playful mood duration |
| `--vc-easing-decel` | precise mood (clip-wipe) curve |
| `--vc-easing-standard` | slide/flip transition curve |
| `--vc-easing-spring` | energetic/playful mood curve |

## Reduced-motion substitute

All 5 moods collapse to a 200ms fade-in under reduce:

```css
@media (prefers-reduced-motion: reduce) {
  .sd-slide--calm .sd-content,
  .sd-slide--purposeful .va-stagger-item,
  .sd-slide--energetic .sd-content,
  .sd-slide--precise .sd-content,
  .sd-slide--playful .sd-element {
    animation: vaFadeOnly 200ms ease both;
    clip-path: none;
    transform: none;
  }
}
```

All 4 transitions collapse to instant swap under reduce:

```css
@media (prefers-reduced-motion: reduce) {
  .sd-deck .sd-slide {
    transition: none;
  }
}
```

The slide content still appears (information preserved); the
between-slide animation is dropped (instant swap).

## Selection + comment + decision integration

The slide-decks skill stamps slides as atoms:

```js
var SEL = '.sd-slide';
var nodes = d.querySelectorAll(SEL);
for (var i = 0; i < nodes.length; i++) {
  el.setAttribute('data-ve-id', generateSlideId(el, i));
  el.setAttribute('data-ve-type', 'slide');
  rt.attachDecisionMini(el, generateSlideId(el, i));
}
```

Each slide can be commented on / decided about. The 5 moods and
4 transitions don't change the atom contract.

## Mood selection heuristics

The slide-decks skill might auto-detect the mood based on slide
content:

```js
function detectMood(slideEl) {
  // Code blocks → 'precise'
  if (slideEl.querySelector('pre code')) return 'precise';
  // Hero slide (single h1, large text) → 'energetic'
  if (slideEl.querySelector('h1') && !slideEl.querySelector('p')) return 'energetic';
  // Many text items → 'calm'
  if (slideEl.querySelectorAll('p, li').length > 8) return 'calm';
  // Mixed content → 'purposeful'
  return 'purposeful';
}
```

The author can override by setting `data-sd-mood` on the slide:

```html
<section class="sd-slide" data-sd-mood="energetic">
  <h1>Big Idea</h1>
</section>
```

## Stagger across the deck

For a deck where each slide has its OWN cascade (e.g. each
slide is a `[data-va-reveal="stagger"]`), the cascade fires when
the slide becomes active — not when the deck loads. The slide-
decks skill watches active-slide changes and calls
`amvcpAnimation.revealNow(slide)` to trigger the cascade.

## Slide navigation indicators

A slide counter ("3 / 12") can use the animation skill's counter
primitive if it should animate the digit changes. Usually a slide
counter is INSTANT (a quick label), not animated:

```html
<div class="sd-counter">
  <span class="sd-counter-current">3</span>
  <span class="sd-counter-separator">/</span>
  <span class="sd-counter-total">12</span>
</div>
```

The current digit updates via JS (slide-change handler). The
animation skill is NOT involved.

For decks where the counter SHOULD animate (e.g. a quiz deck
showing "Question 1" → "Question 2" with a number-flip
animation), use the `animateStat()` primitive:

```js
var counterEl = document.querySelector('.sd-counter-current');
counterEl.setAttribute('data-va-stat', String(newSlideIndex + 1));
amvcpAnimation.animateStat(counterEl);
```

But this rolls the digit, which is usually not desired for
slide counters. The pragmatic choice: instant update for
counters.

## Loop-pause for slide animations

Slides that are NOT active (off-screen in horizontal scroll,
or hidden in z-stack) should not run their entrance animations.
The slide-decks skill handles this by:

1. CSS rules with `:not(.sd-active)` apply the "stopped" state.
2. The `.sd-active` class is added when the slide becomes
   active; the entrance animation runs ONCE per becoming active.
3. The previous slide's animation is reset (class removed +
   re-added next time) so subsequent visits replay the
   entrance.

The animation skill's loop-pause observer also pauses any
`.va-stagger-item` / `[data-va-reveal]` inside off-screen
slides (since the slide-deck container scrolls them off the
viewport).

## Diagnostics

- **Slide entrance doesn't replay on re-visit** → the
  `.sd-active` class isn't being toggled correctly. Confirm the
  slide-decks skill's navigation logic adds/removes the class.
- **Transition feels too fast/slow** → tune
  `--vc-duration-entrance` in the DESIGN.md.
- **Energetic mood feels too aggressive** → the spring curve has
  ~5-10% overshoot; for a calmer "energetic", use a less-
  aggressive starting scale (e.g. `scale(0.92)` instead of
  `scale(0.85)`).
- **Playful mood is chaotic** → the random delays span too wide
  a range. Limit to a 0-200ms range.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load a deck with multiple slides.
2. Take screenshots of each slide entering (when becoming
   active).
3. Compare moods: calm should fade; purposeful should stagger;
   energetic should overshoot; precise should clip-wipe;
   playful should have random-staggered elements.
4. Take screenshots of slide-to-slide transitions for each
   transition type.
5. With `prefers-reduced-motion: reduce`, confirm all entrances
   are 200ms fades and all transitions are instant.

## Future slide-deck extensions

When the slide-decks skill adds:
- **Slide chunking** (breaking long content across multiple
  slides automatically): each chunk uses the same mood.
- **Cross-slide element animations** (e.g. an element that
  persists across slides with morphing transitions): would
  require Web Animations API; not currently in scope.
- **Interactive slides** (with embedded controls): the animation
  skill's wiring still applies — `data-va-reveal` for sections,
  `.va-counter` for numbers, etc.
