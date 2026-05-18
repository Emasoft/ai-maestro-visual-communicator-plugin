# Skeleton shimmer — `.va-skeleton` placeholder for streamed content

## Table of Contents

- [The contract](#the-contract)
- [The CSS](#the-css)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [When to use which modifier](#when-to-use-which-modifier)
- [Markup recipes](#markup-recipes)
- [Replacing the skeleton with real content](#replacing-the-skeleton-with-real-content)
- [Performance — paused while off-screen](#performance--paused-while-off-screen)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Color contrast — light vs dark](#color-contrast--light-vs-dark)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [When NOT to use a skeleton](#when-not-to-use-a-skeleton)

A sliding-gradient placeholder that occupies the visual space of
content NOT YET ARRIVED. The gradient is built from two surface
tokens (`--vc-color-surface-sunken` + `--vc-color-surface`) so the
skeleton is automatically correct in both light and dark themes
with zero hardcoded greys.

## The contract

```html
<div class="va-skeleton va-skeleton--title"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--block"></div>
```

Three shape modifiers:

| modifier | shape | typical use |
|---|---|---|
| `.va-skeleton--text` | one line, `height: 1em` + vertical margin | paragraph line placeholder |
| `.va-skeleton--title` | taller line, `height: 1.6em` | heading placeholder |
| `.va-skeleton--block` | full-height card, `min-height: 80px` | card / image placeholder |

The base `.va-skeleton` class supplies the gradient + animation;
the modifier supplies the dimensions.

## The CSS

```css
.va-skeleton {
  background: linear-gradient(90deg,
    var(--vc-color-surface-sunken, #f1ece0) 25%,
    var(--vc-color-surface, #ffffff)        50%,
    var(--vc-color-surface-sunken, #f1ece0) 75%);
  background-size: 200% 100%;
  border-radius: var(--vc-radius-sm, 4px);
  display: block;
}
@media (prefers-reduced-motion: no-preference) {
  .va-skeleton { animation: vaShimmer 1.5s ease-in-out infinite; }
}
@media (prefers-reduced-motion: reduce) {
  .va-skeleton { background: var(--vc-color-surface-sunken, #f1ece0); }
}
@keyframes vaShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.va-skeleton--text  { height: 1em; margin-block: 0.35em; }
.va-skeleton--title { height: 1.6em; margin-block: 0.5em; }
.va-skeleton--block { height: 100%; min-height: 80px; }
```

Four design decisions worth knowing:

1. **The gradient is THREE stops, not two.** A 0%-50%-100% gradient
   from sunken to surface back to sunken creates a "highlight"
   sweeping across the element — the visual effect of light moving
   across a surface. Two stops (sunken → surface) would give a
   gradient that fades from left to right, not a moving highlight.

2. **`background-size: 200% 100%`.** The gradient is RENDERED at
   double its container width. Combined with the animation
   shifting `background-position` from `200% 0` to `-200% 0`, the
   gradient slides across at twice the width — meaning one full
   sweep takes one full animation duration (1.5s). Without the
   `200%` size, the gradient would only cover the element width,
   the slide would be limited, and the highlight would barely
   move.

3. **`200% 0` to `-200% 0` direction.** The position goes from
   POSITIVE to NEGATIVE, which moves the gradient from RIGHT to
   LEFT — the highlight enters from the right edge and exits on
   the left. For visually right-to-left languages (Arabic, Hebrew)
   you might want LTR shimmer; override the keyframe direction.

4. **Color tokens via `var()` with explicit fallbacks.** Both
   `--vc-color-surface-sunken` and `--vc-color-surface` are
   theme-resolved (light: warm beiges and white; dark: deeper
   surfaces and near-black). The fallbacks (`#f1ece0` and
   `#ffffff`) are light-theme values — correct for an unrouted
   page but visually wrong in dark mode. The DESIGN.md engine MUST
   resolve these tokens for the skeleton to look right in dark.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-color-surface-sunken` | gradient base (the "off" color) |
| `--vc-color-surface` | gradient highlight (the "on" color) |
| `--vc-radius-sm` (4px default) | corner roundness |

The skeleton's color tokens are PAINT tokens (theme-dependent) —
this is the canonical example of "painted animation" needing both
light and dark color resolution. Compare to the stagger entry
which only paints opacity transitions (theme-independent).

## When to use which modifier

- **`.va-skeleton--text`** — placeholder for prose paragraphs.
  Author 3-5 stacked text skeletons to mimic a paragraph block,
  with a shorter last line to suggest line-end ragging.
- **`.va-skeleton--title`** — placeholder for a heading. Width is
  typically less than 100% — author with `style="width: 60%"` to
  suggest a heading length.
- **`.va-skeleton--block`** — placeholder for a card, an image, or
  a chart. `min-height: 80px` is the minimum; for a larger card
  pass an explicit `height` style.

## Markup recipes

### Paragraph placeholder

```html
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--text" style="width: 65%;"></div>
```

The last line at 65% mimics natural paragraph ragging — the user
reads "this is a paragraph being loaded" not "this is four
identical bars".

### Card placeholder

```html
<div class="va-skeleton va-skeleton--block"
     style="height: 200px; margin-bottom: 12px;"></div>
<div class="va-skeleton va-skeleton--title" style="width: 70%;"></div>
<div class="va-skeleton va-skeleton--text"></div>
<div class="va-skeleton va-skeleton--text" style="width: 80%;"></div>
```

A block for the image, a title-shaped line for the card heading,
two text lines for the body. This skeleton occupies the visual
weight of an actual card.

### Chart placeholder

```html
<div class="va-skeleton va-skeleton--block"
     style="height: 300px;"></div>
```

For a chart, a single block of the expected chart size is
enough — the user doesn't need internal structure mimicked.

## Replacing the skeleton with real content

When the streamed content arrives, REPLACE the skeleton element —
do NOT fade-swap. A fade-swap would itself need a `reduce` branch
(crossfade with motion, instant swap without), which doubles the
code path. A straight replace is simpler and meaning-equivalent
("the placeholder went away, the real content appeared").

```js
function replaceSkeleton(skeletonEl, realContent) {
  if (skeletonEl && skeletonEl.parentNode) {
    skeletonEl.parentNode.replaceChild(realContent, skeletonEl);
  }
}
```

If the real content has its own entrance animation (a
`data-va-reveal` or `.va-stagger-item`), the entrance plays
naturally — but you may need `amvcpAnimation.refresh(parentRoot)`
to wire it. Or, if the content appears via a known interaction
(modal open, tab toggle), `amvcpAnimation.revealNow(realContent)`
forces the reveal immediately.

## Performance — paused while off-screen

The skeleton is in the `LOOP_SELECTOR` list — when scrolled
off-screen, the shimmer is paused. CPU is not burned compositing
a sliding gradient nobody sees.

The shimmer is also paused when the element is NOT in the viewport
the user is looking at, regardless of WHY (modal open over it,
sibling content covering it, etc.).

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .va-skeleton { background: var(--vc-color-surface-sunken, #f1ece0); }
}
```

The substitute is a FLAT MUTED BLOCK — the gradient is replaced
with a solid surface-sunken color. No shimmer, no slide. The
SHAPE still occupies the right visual space; the user knows
"content is loading here" from the rectangle, not from the
shimmer.

Meaning preserved (something is loading here) without the motion
(the sliding highlight).

## Selection + comment + decision integration

`.va-skeleton` elements are NOT stamped as content atoms by
`stampAnimatedAtoms()` — they are transient placeholders, not
content. Commenting on a skeleton makes no sense; the comment
would attach to the placeholder rather than the real content
underneath.

When the real content arrives and replaces the skeleton, IT
becomes the comment-able atom (via the normal stamping pass on
re-mount).

## Color contrast — light vs dark

In light mode:
- Sunken: warm beige (e.g. `#f1ece0`)
- Surface: white (e.g. `#ffffff`)
- The highlight is a SOFT white moving across a beige bg.

In dark mode:
- Sunken: deep neutral (e.g. `#1a1a1a`)
- Surface: lighter neutral (e.g. `#2a2a2a`)
- The highlight is a SOFT light-grey moving across a near-black bg.

Both themes have low-contrast shimmers — by design. A
high-contrast shimmer reads as "the page is glitching" rather than
"the page is loading". The DESIGN.md engine MUST emit
surface-sunken and surface that differ by 5-15% lightness — too
similar = invisible shimmer, too different = jarring shimmer.

## Diagnostics

- **Shimmer doesn't appear (skeleton is flat)** → the animation
  rule is overridden, or `prefers-reduced-motion: reduce` is active.
- **Shimmer is too high contrast (jarring)** → the
  surface-sunken-to-surface lightness delta is too large; the
  DESIGN.md engine needs tuning.
- **Shimmer is invisible** → surface-sunken and surface are too
  close; widen the delta.
- **Skeleton has wrong color in dark mode** → the engine isn't
  resolving the color tokens for dark theme; check the DESIGN.md
  has `theme.dark.surface-sunken` defined.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with skeletons in the viewport.
2. Screenshot at t=0, 500ms, 1000ms, 1500ms (one full cycle).
3. Each screenshot should show the gradient at a DIFFERENT
   position — the highlight sweeping across the skeleton.
4. Switch to dark theme. Repeat. The shimmer should be present
   but with darker base colors.
5. With `prefers-reduced-motion: reduce`, repeat. The skeleton
   should be a FLAT muted block in both themes — no gradient
   visible.

## When NOT to use a skeleton

- **For non-streamed content** (everything is already in the HTML).
  A skeleton is for content that arrives async.
- **For UI states** (errors, empty states). Those want different
  visual treatments — text, icons, illustrations.
- **For interactive controls** (forms, buttons). Skeletons are
  read-only — they don't represent functional things.
