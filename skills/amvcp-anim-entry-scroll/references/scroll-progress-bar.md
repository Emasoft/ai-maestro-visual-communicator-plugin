# Scroll progress bar — fixed-top read-progress indicator

## Table of Contents

- [The contract](#the-contract)
- [How the progress is computed](#how-the-progress-is-computed)
- [When to use the progress bar](#when-to-use-the-progress-bar)
- [Color and z-index](#color-and-z-index)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Why no transition?](#why-no-transition)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [Selection + comment + decision integration](#selection--comment--decision-integration)
- [Placement guidance](#placement-guidance)
- [Multiple progress bars](#multiple-progress-bars)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [When to combine with the parallax tier](#when-to-combine-with-the-parallax-tier)

A 3px horizontal bar fixed at the top of the viewport, its width
animated to match the user's fraction-scrolled through the
document. Driven by the SAME scroll listener that feeds parallax,
so attaching one is free if either is already on the page.

## The contract

```html
<div class="va-progress-bar" aria-hidden="true"></div>
```

The runtime's scroll listener writes `--va-progress` (0..1) on
`:root` once per frame. The CSS rule scales the bar by that value:

```css
.va-progress-bar {
  position: fixed;
  left: 0;
  top: 0;
  height: 3px;
  width: 100%;
  transform-origin: 0 50%;
  transform: scaleX(var(--va-progress, 0));
  background: var(--vc-color-accent, #b8861f);
  z-index: var(--vc-z-sticky, 100);
}
```

`scaleX(0)` is a closed bar (invisible). `scaleX(1)` is full
width (page fully scrolled). The transform origin at `0 50%` (left
edge, vertically centered) means the bar grows rightward as the
scroll fraction increases — the natural reading direction.

## How the progress is computed

```js
function _scrollUpdate() {
  var docEl = document.documentElement;
  var y = window.scrollY || window.pageYOffset || 0;
  var max = (docEl.scrollHeight - docEl.clientHeight);
  var frac = max > 0 ? (y / max) : 0;
  if (frac < 0) { frac = 0; }
  if (frac > 1) { frac = 1; }
  docEl.style.setProperty('--va-progress', String(frac));
  /* ... and --va-scroll-y for parallax in the same call ... */
}
```

Math: `frac = scrollY / (scrollHeight - clientHeight)`. The
denominator is the "scrollable range" — how much vertical
distance the page has BEYOND the viewport. A page that fits
entirely in the viewport has `max = 0`, and `frac` falls through
to 0 (no division by zero — the conditional handles it).

Clamping to `[0, 1]` defends against:
- Negative `scrollY` (some platforms scroll past the top during
  inertia)
- `scrollY > max` (bounce-back overshoot on iOS Safari)

## When to use the progress bar

- **Long-form reports** (prose-pages output, multi-section
  documents) — gives the reader a "how much is left" cue.
- **Slide decks rendered vertically** — bar shows progress through
  the deck without modal counters.
- **Multi-step forms** — progress through the form sections.

When NOT to use:
- **Short pages** (single viewport) — bar is meaningless.
- **Pages with their own progress UI** (chapter sidebars, stepper
  components) — would compete visually.
- **Print stylesheets** — fixed-position bar overlaps the print
  margin; suppress via `@media print { .va-progress-bar { display:
  none; } }` if needed.

## Color and z-index

The bar uses `--vc-color-accent` — the theme's accent color. This
is the SAME color the pulse-ring uses. The bar reads
`--vc-z-sticky` (default 100) so it stacks above the page content
but below any modal/overlay (which should use `--vc-z-modal` or
higher).

The accent color works in BOTH themes by construction — light and
dark each define `--vc-color-accent` to a value that contrasts
with their `--vc-color-bg`. No theme-specific styling needed for
the bar.

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-color-accent` (`#b8861f` default) | bar fill color |
| `--vc-z-sticky` (100 default) | stacking layer |

Note: the bar has no `--vc-motion-*` token consumption — it is
driven purely by the scroll position via the JS listener. There
is no transition on the `transform: scaleX(...)` — the scale
follows the scroll position instantly.

## Why no transition?

A `transition: transform 100ms` would lag the bar behind the
scroll — at 60 Hz that means up to 6 frames of perceived lag,
which on a fast-scrolling reader feels broken. The bar must
ALWAYS match the current scroll position; the listener's
rAF-coalescing already produces a smooth 60 Hz update without
any transition.

## Reduced-motion substitute

```css
@media (prefers-reduced-motion: reduce) {
  .va-progress-bar { transition: none; }
}
```

The substitute is `transition: none` — but since the base rule
ALREADY has no transition, this is redundant. The rule is kept
defensively in case a downstream stylesheet adds a transition;
the reduce branch wins specifically.

The bar itself is decorative-but-informative — it shows progress
(information) via motion (the scale change). Under `reduce`, the
bar still shows the current progress (the final scale matches the
current scrollY) — it just doesn't animate between positions
(there is no animation TO disable; the scale follows scrollY
instantly in both modes).

## Selection + comment + decision integration

The progress bar is NOT a content atom. It is excluded from
`stampAnimatedAtoms()` (the selector list is explicit). Commenting
on a progress bar makes no sense — there is no decision to make
about it; it is an automatic indicator.

## Placement guidance

The bar is `position: fixed; top: 0; left: 0; width: 100%`. It
covers the top 3px of the viewport. If your page has its own
fixed header (e.g. a sticky page-title bar), the progress bar
will sit ABOVE it. That is correct — the progress bar is the
topmost UI surface.

If you need the progress bar to sit UNDER the page's fixed
header, override its `top`:

```css
.va-progress-bar { top: 56px; /* header height */ }
```

But consider whether you actually want that — the standard
position above the header is what users expect from a read-
progress indicator.

## Multiple progress bars

Only ONE `.va-progress-bar` per page makes sense. The
`--va-progress` custom property is a SINGLE value on `:root`,
shared by every `.va-progress-bar` instance. Authoring two bars
yields two identical bars — pointless.

If you need a "section progress bar" (progress through THIS
section, not the whole document), the existing skill does NOT
provide that. You'd need a per-section IO observer + a per-section
CSS variable. That's a future extension; not currently shipped.

## Diagnostics

- **Bar doesn't appear** → confirm `<div class="va-progress-bar">`
  is in the DOM, confirm the animation skill's CSS is injected
  (look for `va-progress-bar` rule in computed styles).
- **Bar stays at scaleX(0) always** → the scroll listener didn't
  attach. Confirm `[class*="va-parallax-"]` OR `.va-progress-bar`
  was present at init (the listener only attaches if either is
  found, to avoid the cost on pages without parallax/progress).
- **Bar overshoots 100%** → impossible; the clamp at `[0, 1]`
  prevents it. If you see overshoot, the rule was hand-overridden.
- **Bar appears under the page header** → adjust the `top:` value
  or check the `--vc-z-sticky` stack vs the header's z-index.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with content tall enough to scroll (>2 viewports).
2. Screenshot at `scrollY = 0` — bar at scaleX(0), effectively
   invisible (or a 0-px-wide stripe).
3. `page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2))`.
4. Wait one rAF. Screenshot — bar at scaleX(0.5), visible at half
   the viewport width.
5. Scroll to the bottom. Screenshot — bar at scaleX(1), full
   viewport width.
6. With `prefers-reduced-motion: reduce`, repeat — same scaleX
   values (the bar's "animation" is just the JS listener writing
   the custom property; reduce has no behavioural impact here).

## When to combine with the parallax tier

If your page uses BOTH parallax AND a progress bar, the scroll
listener attaches once and feeds both `--va-scroll-y` (for
parallax) and `--va-progress` (for the bar) in the SAME callback.
No double-listener overhead.
