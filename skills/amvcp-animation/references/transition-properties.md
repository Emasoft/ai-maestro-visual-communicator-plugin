# Transition properties — what CSS properties to animate (and avoid)

## Table of Contents

- [The two property categories](#the-two-property-categories)
- [Examples — the skill's choices](#examples--the-skills-choices)
- [Why opacity AND transform together](#why-opacity-and-transform-together)
- [Properties to AVOID animating](#properties-to-avoid-animating)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion substitute](#reduced-motion-substitute)
- [`will-change` hints — when (NOT) to use](#will-change-hints--when-not-to-use)
- [Combining properties on one element](#combining-properties-on-one-element)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [Reference table — animation-safe properties](#reference-table--animation-safe-properties)

Browsers render animations at GPU vs CPU speeds depending on
which CSS properties change. The skill animates ONLY GPU-friendly
properties (transform, opacity) — never layout-triggering
properties (width, height, top, margin, padding).

## The two property categories

### GPU-friendly (cheap)

| property | why cheap | example |
|---|---|---|
| `transform` | compositor moves the layer; no layout/paint | `translateY`, `scale`, `rotate` |
| `opacity` | compositor adjusts alpha; no layout/paint | `opacity: 0 → 1` |
| `filter` | mostly GPU (blur, hue-rotate); some paint work | `filter: blur(5px)` |
| `clip-path` | modern browsers composite this | `clip-path: inset(...)` |
| `backdrop-filter` | mostly GPU | `backdrop-filter: blur(10px)` |

GPU-friendly properties can be animated continuously at 60 Hz
(120 Hz on high-refresh displays) without burdening the main
thread. The browser composites the change in a separate thread.

### Layout-triggering (expensive)

| property | why expensive | layout cost | paint cost |
|---|---|---|---|
| `width`, `height` | re-layout the element + reflow descendants | YES | YES |
| `top`, `left`, `right`, `bottom` | reposition the layout box | YES | YES |
| `margin`, `padding` | re-layout the element + siblings | YES | YES |
| `border-width` | re-layout the element | YES | YES |
| `font-size` | re-layout the entire text run | YES | YES |
| `display`, `position` | drastic layout changes | YES | YES |

Layout-triggering properties cause the browser to RECOMPUTE
layout for the changed element AND any descendant/sibling that
depends on its size. For an animation at 60 Hz, this is 60
layouts per second — quickly exceeding the 16ms frame budget on
non-trivial pages.

The skill animates ONLY GPU-friendly properties. NEVER `width`,
`top`, etc.

## Examples — the skill's choices

### Stagger entry: transform + opacity

```css
@keyframes vaFadeSlideUp {
  from { opacity: 0; transform: translateY(var(--va-rise, 24px)); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Uses `translateY` (a transform), NOT `top: 24px → 0`. The visual
result is similar (element moves up by 24px), but `transform` is
GPU-composited; `top` would trigger layout.

Bad alternative (forbidden by the skill):

```css
/* WRONG — layout-triggering, expensive */
@keyframes vaFadeSlideUpBad {
  from { opacity: 0; top: 24px; }
  to   { opacity: 1; top: 0; }
}
```

### Hover lift: transform

```css
.ve-card:hover {
  transform: translateY(-3px);   /* GPU */
  /* NOT margin-top: -3px (layout) */
}
```

A 3px lift via transform is essentially free. A 3px lift via
margin would re-layout the surrounding cards on every hover.

### Pulse ring: box-shadow

```css
@keyframes vaPulseRing {
  0%   { box-shadow: 0 0 0 0 ...; }
  70%  { box-shadow: 0 0 0 12px ...; }
}
```

`box-shadow` is mostly compositor-friendly in modern browsers
(the painted rendering is composited as a separate layer). Older
browsers would paint the shadow per frame, which is more
expensive but still cheaper than layout.

Bad alternative:

```css
/* WRONG — width animation requires layout */
@keyframes vaPulseRingBad {
  0%   { width: 10px; height: 10px; }
  70%  { width: 34px; height: 34px; }
}
```

### Skeleton shimmer: background-position

```css
@keyframes vaShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

`background-position` is paint-only (no layout). The browser
re-paints the gradient at the new position; no element re-layout.
Cheaper than transform on the background-image (which would
require offscreen rendering).

## Why opacity AND transform together

A common composition: `opacity` for fade + `transform` for
translation. These can compose because they're INDEPENDENT
properties. The browser composites both on the same frame:

```css
@keyframes vaFadeSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

The cost per frame: one alpha multiplication + one matrix multiply.
Both done on the GPU thread. Effectively free.

## Properties to AVOID animating

### Layout properties

`width`, `height`, `top`, `left`, `right`, `bottom`, `margin*`,
`padding*`, `border-width`, `font-size`. NEVER animate these.

If you need an animation that LOOKS like a width change, use a
scale transform:

```css
/* Looks like a width animation; actually a transform */
@keyframes vaGrowOut {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

### Properties that trigger paint without compositing

`background-color`, `color`, `border-color`. These trigger PAINT
(re-paint the element) but not LAYOUT. Cheaper than layout
triggers but more expensive than transforms.

For COLOR transitions on text (hover), this is unavoidable — the
text needs to be repainted. Keep these transitions SHORT (200ms
or less); a long color transition makes the user wait.

### Properties that browsers can't optimize

`box-shadow` is OK but expensive for high-frequency animation (a
shadow animated at 60 Hz with many shadows on the page can
saturate the rasterizer).

`filter` and `backdrop-filter` are compositor-friendly but
expensive to compose (blur requires sampling many pixels). Use
sparingly.

## DESIGN.md tokens consumed

The skill's transitions reference duration + easing tokens:

```css
.va-link {
  transition: background-size var(--vc-duration-normal, 200ms)
              var(--vc-easing-standard, cubic-bezier(0.2, 0, 0, 1));
}
```

| token | role |
|---|---|
| `--vc-duration-fast` | tilt reset (120ms) |
| `--vc-duration-normal` | link underline, hover lift (200ms) |
| `--vc-duration-slow` | counter window (400ms) |
| `--vc-duration-entrance` | stagger entry, scroll reveal (600ms) |
| `--vc-easing-decel` | one-way arrivals |
| `--vc-easing-accel` | one-way departures |
| `--vc-easing-standard` | round-trip transitions |
| `--vc-easing-spring` | playful arrivals (opt-in) |

## Reduced-motion substitute

Under `prefers-reduced-motion: reduce`, the skill replaces
transitions with `transition: none` (the change applies
instantly) or replaces keyframes with the 200ms `vaFadeOnly`
substitute.

Transition properties don't change under reduce — the SAME
properties are still animated; the DURATION goes to 0 (or 200ms
fade for keyframes).

## `will-change` hints — when (NOT) to use

```css
.va-tilt { will-change: transform; }
```

`will-change: transform` tells the browser "this element will
animate; promote it to its own compositor layer". The
optimization can speed up complex transforms; the cost is GPU
memory.

The skill does NOT add `will-change` hints to most rules. Modern
browsers auto-detect transform-animated elements and promote
them — manual `will-change` is rarely needed. Adding it
prematurely (on every `.va-tilt`, every `.va-stagger-item`) costs
GPU memory without speeding up anything.

If you observe jank that you suspect is layer-promotion latency,
add `will-change: transform` to THAT specific element and
measure. Remove if not measurable.

## Combining properties on one element

A `.va-stagger-item.va-tilt` element wants TWO transforms:
- Entrance: `translateY(24px → 0)`.
- Hover: `perspective(800px) rotateY(deg) rotateX(deg)`.

The CSS combine via animation + inline style:
1. The keyframe `vaFadeSlideUp` sets `transform: translateY(...)`
   during the entrance window.
2. After entrance, the rule's `animation-fill-mode: both` keeps the
   `to` state (transform: translateY(0)).
3. On hover, the JS writes `element.style.transform = 'perspective(...) rotateY(...) rotateX(...)'`
   — the inline style overrides the rule.

Mid-entrance hover: the JS overrides the keyframe transform.
The entrance is lost; the tilt is what's shown. Pragmatic
mitigation: don't allow hover during entrance (rare edge case
— entrance is 600ms; hover during that window is unusual).

## Diagnostics

- **Animation feels janky** → check if you're animating
  layout-triggering properties. Use DevTools Performance →
  Rendering panel → enable "Paint flashing" or "Layout shift
  regions".
- **Animation has visual artifacts** → the property combination
  might be straddling compositor and main thread. Try wrapping
  the element in a `transform: translateZ(0)` parent to force a
  compositor layer.
- **Animation works in Chrome but stutters in Safari** → Safari
  has different layer-promotion thresholds. Try adding
  `will-change: transform` to the animated element.
- **`will-change` makes the page worse** → too many promoted
  layers. Remove `will-change` and let auto-detection work.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Open DevTools → Performance.
2. Start recording, trigger the animation, stop recording.
3. Inspect the flame chart. "Paint" and "Composite Layers" tasks
   should be the bulk; "Layout" should be near-zero or absent.
4. If "Layout" appears repeatedly, the animation is animating a
   layout-triggering property. Fix.

## Reference table — animation-safe properties

Safe to animate at 60 Hz:
- `transform` (all functions: translate, scale, rotate, skew, matrix)
- `opacity`
- `clip-path`
- `filter` (use sparingly)
- `backdrop-filter` (use sparingly)
- `background-position`, `background-size` (paint-only, cheap)
- `box-shadow` (paint-only, moderate cost)

Unsafe to animate at 60 Hz (layout-triggering):
- `width`, `height`, `min-width`, `min-height`, etc.
- `top`, `left`, `right`, `bottom`
- `margin*`, `padding*`
- `border-width`, `outline-width`
- `font-size`, `line-height`

Sometimes safe (use with care):
- `color`, `background-color`, `border-color` (paint only — fine
  for short transitions; expensive for long animations on many
  elements)
