# Pulse ring — `.va-pulse` expanding-ring loading indicator

## Table of Contents

- [The contract](#the-contract)
- [The CSS](#the-css)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [When to use the pulse](#when-to-use-the-pulse)
- [Markup recipes](#markup-recipes)
- [Performance — paused while off-screen](#performance--paused-while-off-screen)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Color tuning across themes](#color-tuning-across-themes)
- [Ring size tuning](#ring-size-tuning)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)

A small accent dot with an expanding ring that pulses outward —
the universal "awaiting content here" indicator. Built with
`box-shadow` + `color-mix()` so no `-rgb` companion token is
needed.

## The contract

```html
<span class="va-pulse" aria-label="loading"></span>
```

The `aria-label` is REQUIRED — the pulse conveys a state
("loading", "live", "active") that a screen reader otherwise has
no way to perceive. The label is what the screen reader announces.

## The CSS

```css
.va-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vc-color-accent, #b8861f);
  display: inline-block;
}

@media (prefers-reduced-motion: no-preference) {
  .va-pulse { animation: vaPulseRing 1.6s
              var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1)) infinite; }
}

@media (prefers-reduced-motion: reduce) {
  .va-pulse { box-shadow: 0 0 0 4px color-mix(in srgb,
              var(--vc-color-accent, #b8861f) 25%, transparent); }
}

@keyframes vaPulseRing {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb,
         var(--vc-color-accent, #b8861f) 45%, transparent); }
  70%  { box-shadow: 0 0 0 12px color-mix(in srgb,
         var(--vc-color-accent, #b8861f) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb,
         var(--vc-color-accent, #b8861f) 0%, transparent); }
}
```

Four implementation details:

1. **`color-mix(in srgb, accent X%, transparent)`** — the modern
   way to produce a translucent accent without needing a paired
   `--vc-color-accent-rgb` token. The skill's older design pre-
   `color-mix` would have required `rgba(var(--vc-color-accent-rgb),
   0.45)`, which means TWO tokens (the hex AND the comma-separated
   r,g,b triple). `color-mix` cuts that to one.

2. **`box-shadow: 0 0 0 N` for the ring.** A box-shadow with no
   offset and no blur is a solid expanding outline. From
   `box-shadow: 0 0 0 0` (no ring) to `box-shadow: 0 0 0 12px`
   (12px ring) traces the ring's expansion. The opacity goes from
   45% to 0% over the same window — the ring fades AS it grows.

3. **`1.6s` duration** — long enough that the ring expansion is
   readable (a 0.5s pulse looks frantic), short enough that the
   user perceives "this is loading right now" not "this is
   constantly being loaded".

4. **`infinite` loop** — the pulse runs until the element is
   removed from the DOM (or the loop-pause observer pauses it for
   being off-screen). When the awaited content arrives, REMOVE the
   pulse element; don't try to fade it out.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-color-accent` | dot color + ring color |
| `--vc-easing-decel` (decel curve) | the ring's expansion curve — slow at the start (ramp up) then fast (the ring "shoots out") |

The accent color is theme-resolved — in light mode it's the
warm-gold default; in dark mode it's typically a brighter gold
that contrasts with the dark surface. Both themes work by
construction.

## When to use the pulse

- **Streaming content awaiting** — beside a section header that
  has not yet received its data: "Loading metrics... [PULSE]"
- **Live/active indicator** — beside a feature label: "Live
  [PULSE]" (then `aria-label="live indicator"`)
- **Connection status** — small indicator in a status bar that
  shows "connected and active" when the server is sending heartbeats
- **Recording / streaming** — beside "REC" or "LIVE" labels for
  any in-progress capture

When NOT to use:
- **Multiple pulses on the same screen** — pulses are attention-
  grabbing; more than 1-2 reads as chaos.
- **As a permanent decorative element** — the pulse is for a
  TRANSIENT state. A permanent pulse is a permanent distraction.
- **For "click here" affordances** — the pulse says "wait", not
  "act". Use a different hover state for actionable items.

## Markup recipes

### Loading-section header

```html
<h2>
  Metrics
  <span class="va-pulse" aria-label="loading metrics"
        style="vertical-align: middle; margin-left: 8px;"></span>
</h2>
```

The `vertical-align: middle` aligns the pulse with the heading's
text baseline midpoint.

### Live indicator

```html
<div class="ve-live-pill">
  <span class="va-pulse" aria-label="live"></span>
  Live
</div>
```

A small pill of "Live" text with a pulse dot — common pattern for
live-stream UIs.

### Connection status

```html
<div class="ve-status">
  <span class="va-pulse" aria-label="connected"></span>
  Connected to server
</div>
```

## Performance — paused while off-screen

The pulse is in the `LOOP_SELECTOR` list — when scrolled off-
screen, the animation is paused. The `animation-play-state`
toggles between `running` and `paused` as the user scrolls.

For pulses INSIDE a modal or panel that opens and closes, the
loop-pause observer is the right primitive — but you might also
want to remove the pulse element entirely when the panel closes,
to avoid the pulse running while the panel is hidden but
technically still in the DOM (the observer can't see a
`display: none` element to know it's "off-screen").

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .va-pulse { box-shadow: 0 0 0 4px color-mix(in srgb,
              var(--vc-color-accent, #b8861f) 25%, transparent); }
}
```

The substitute is a STATIC RING — a single `box-shadow` at 4px
expansion, 25% accent opacity, no animation. The dot still has
a visible "ring" around it (the awaiting-state visual cue), but
no motion.

Meaning preserved (this is a loading/active state) without the
motion (the expanding ring).

## Selection + comment + decision integration

The pulse is NOT stamped as a content atom by
`stampAnimatedAtoms()` — it is a UI status indicator, not content.
Commenting on a pulse makes no sense (you can't write a note about
"loading").

If the pulse is INSIDE a content atom (e.g. inside a header that
is a `[data-va-reveal]` section), the section is the comment-able
atom. The pulse rides along as decoration.

## Color tuning across themes

The pulse dot is `var(--vc-color-accent)` — direct. The pulse
ring uses `color-mix(in srgb, var(--vc-color-accent) 45%,
transparent)` for the first frame, fading to `0%` (fully
transparent) by 70%.

In light mode the accent is typically a warm gold (`#b8861f`); in
dark mode it might be a brighter gold (`#d4a445`) to maintain
contrast against the dark surface. The ring's translucent stops
follow whichever accent is active.

For a theme where the accent is a high-saturation red (urgent
indicators), the same code produces a high-saturation pulse — the
visual character of the pulse matches the theme's accent character
by construction.

## Ring size tuning

The default ring expands from 0px to 12px. To make the ring more
prominent (e.g. on a larger dot for a status badge), copy the
keyframe and adjust the box-shadow widths:

```css
.va-pulse--lg {
  width: 16px; height: 16px;
  animation: vaPulseRingLg 1.6s var(--vc-easing-decel) infinite;
}
@keyframes vaPulseRingLg {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--vc-color-accent) 45%, transparent); }
  70%  { box-shadow: 0 0 0 20px color-mix(in srgb, var(--vc-color-accent) 0%, transparent); }
  100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--vc-color-accent) 0%, transparent); }
}
```

The skill ships only one size; authors who need variants extend
the pattern.

## Diagnostics

- **Pulse doesn't animate** → confirm
  `prefers-reduced-motion: no-preference`, confirm the CSS is
  injected (`document.getElementById('va-animation-styles')` is
  not null).
- **Ring is invisible** → `--vc-color-accent` is not set; check
  the DESIGN.md engine is emitting the accent token.
- **Pulse runs forever after content arrives** → the pulse element
  was not removed when the content loaded. Pulses are not auto-
  cleaned; the caller MUST remove them.
- **Ring color looks wrong** → `color-mix(in srgb, ...)` is not
  supported (very old browsers). The static ring substitute uses
  the same `color-mix` so the fallback also breaks. Modern
  baseline assumes `color-mix` is available.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with a `.va-pulse` element.
2. Screenshot at t=0, 400ms, 800ms, 1200ms, 1600ms (one full cycle).
3. The ring should grow from 0px to ~12px over the first ~70% of
   the cycle, then snap back to 0px for the next cycle. The dot
   itself stays unchanged.
4. With `prefers-reduced-motion: reduce`, screenshot once. The
   dot should have a SOLID translucent ring at 4px, unchanged
   across frames.
5. Scroll the pulse off-screen, wait 500ms, scroll back.
   Confirm via `getComputedStyle(el).animationPlayState` was
   `paused` while off-screen.
