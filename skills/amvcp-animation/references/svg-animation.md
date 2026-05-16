# SVG animation — line-draw, fill-from-zero, path-morph patterns

SVG elements animate the same way as HTML elements via CSS
(transforms, opacity). Plus, SVG-specific properties
(stroke-dashoffset, fill, path d-attribute) can be animated to
produce effects that HTML cannot.

This file documents the SVG-specific animation patterns the
skill supports, all with the reduced-motion gate.

## Line draw (stroke-dashoffset)

The canonical SVG entrance: a line that DRAWS itself as if a pen
were tracing it from start to end.

```html
<svg width="200" height="100">
  <path class="va-svg-draw"
        d="M10,50 Q100,10 190,50"
        stroke="var(--vc-color-accent)"
        stroke-width="2"
        fill="none"/>
</svg>
```

```css
.va-svg-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: vaSvgDraw var(--vc-duration-slow, 400ms)
             var(--vc-easing-decel, cubic-bezier(0, 0, 0, 1)) both;
}

@keyframes vaSvgDraw {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .va-svg-draw { stroke-dasharray: 0; animation: none; }
}
```

The mechanism:
1. Set `stroke-dasharray` to a large value (longer than the path
   length) — the line becomes a single long dash.
2. Set `stroke-dashoffset` to that same large value — offsets
   the dash entirely off the start of the path (invisible).
3. Animate `stroke-dashoffset` to 0 — the dash slides into view,
   tracing the path.

The 1000 is a magic number that works for paths shorter than
1000px. For longer paths, increase. Alternatively, use
`pathLength="100"` on the path to normalize:

```html
<path d="..." pathLength="100" stroke-dasharray="100"
      stroke-dashoffset="100"/>
```

```css
@keyframes vaSvgDraw100 {
  to { stroke-dashoffset: 0; }
}
```

The `pathLength="100"` makes the browser treat the path as if
it were 100 units long, regardless of actual length. The
`stroke-dasharray="100"` and `stroke-dashoffset="100"` align.

## Fill from zero (fill-opacity)

For solid SVG shapes (rect, circle, polygon), the entrance fade:

```html
<svg width="100" height="100">
  <circle class="va-svg-fill"
          cx="50" cy="50" r="40"
          fill="var(--vc-color-accent)"/>
</svg>
```

```css
.va-svg-fill {
  fill-opacity: 0;
  animation: vaSvgFill var(--vc-duration-entrance, 600ms)
             var(--vc-easing-decel) both;
}

@keyframes vaSvgFill {
  to { fill-opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .va-svg-fill { fill-opacity: 1; animation: none; }
}
```

`fill-opacity` is SVG-specific (vs `opacity` which fades the
entire element including stroke). For a shape with a colored
fill AND a different-colored stroke, `fill-opacity` lets you
fade the fill while keeping the stroke visible.

## Polygon expand (radar/spider chart)

```svg
<polygon class="va-svg-polygon"
         points="50,10 90,40 80,90 20,90 10,40"
         fill="var(--vc-color-accent)" fill-opacity="0.3"
         stroke="var(--vc-color-accent)" stroke-width="2"/>
```

```css
.va-svg-polygon {
  transform-origin: center;
  transform: scale(0);
  animation: vaSvgExpand var(--vc-duration-slow, 400ms)
             var(--vc-easing-decel) both;
}

@keyframes vaSvgExpand {
  to { transform: scale(1); }
}
```

The polygon scales from 0 (a single point at the center) to
full size. Used for radar/spider charts where each data series
should "inflate" into view.

`transform-origin: center` requires the polygon to have a
defined center. For irregular polygons, calculate the
centroid manually.

## Animated arrow head

```html
<svg width="200" height="50">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10" fill="var(--vc-color-accent)"/>
    </marker>
  </defs>
  <line class="va-svg-draw"
        x1="10" y1="25" x2="190" y2="25"
        stroke="var(--vc-color-accent)" stroke-width="2"
        marker-end="url(#arrow)"/>
</svg>
```

The arrow head is a `<marker>` referenced by `marker-end`. When
the line is fully drawn (animation complete), the arrow head
appears at the end. The marker doesn't animate independently —
it follows the line's endpoint.

For a sequential reveal (line draws first, then arrow appears),
combine with a JS callback at the end of the line animation
that adds the marker via class toggle.

## Path morph (d attribute interpolation)

Modern browsers can interpolate `path` `d` attribute values
when both paths have the SAME number of points:

```css
.va-svg-morph {
  d: path('M10,50 Q100,10 190,50');
  transition: d 600ms ease-in-out;
}
.va-svg-morph.morphed {
  d: path('M10,50 Q100,90 190,50');   /* different curve */
}
```

The path smoothly morphs from one shape to another. The
constraint: both paths must use the SAME commands (Q, M, etc.)
and the same number of points. Mismatched paths jump abruptly.

Used in transition between two related shapes (e.g. animating
between two chart layouts).

## DESIGN.md tokens consumed

| token | role |
|---|---|
| `--vc-duration-slow` (400ms) | line draw, polygon expand |
| `--vc-duration-entrance` (600ms) | fill, longer reveals |
| `--vc-easing-decel` | arrival curve |
| `--vc-color-accent` | stroke/fill default color |

The pathLength normalization (100) is hardcoded — not themed.

## Reduced-motion substitute

For each SVG animation, the reduce branch sets the FINAL state
immediately:

```css
@media (prefers-reduced-motion: reduce) {
  .va-svg-draw   { stroke-dasharray: 0; animation: none; }
  .va-svg-fill   { fill-opacity: 1; animation: none; }
  .va-svg-polygon { transform: scale(1); animation: none; }
  .va-svg-morph  { transition: none; }
}
```

Information preserved (SVG renders in its final state) without
motion.

## Selection + comment + decision integration

SVG elements are NOT directly stamped by `stampAnimatedAtoms()`.
The containing `<figure>` or `<section>` is the comment-able
atom; the SVG is the visual content inside.

For interactive SVG (clickable nodes in a flowchart), each node
can be stamped manually:

```js
document.querySelectorAll('svg .dg-node').forEach(function (node, i) {
  node.setAttribute('data-ve-id', 'flow-node-' + i);
  node.setAttribute('data-ve-type', 'flow-node');
  node.setAttribute('tabindex', '0');   // make focusable
  window.amvcpRuntime.attachDecisionMini(node, 'flow-node-' + i);
});
```

Each node becomes a comment-able atom. The diagram skill owns
this stamping pattern.

## Animating SVG with the `<use>` element

For a single icon SVG sprite reused via `<use>`:

```html
<svg>
  <use href="#icon-star"/>
</svg>
```

```css
.icon-star {
  animation: vaRotate 12s linear infinite;
}
```

Applies the animation skill's `vaRotate` keyframe to the SVG.
The `<use>` element is treated as a single transformable element;
the rotation applies to the entire referenced graphic.

## Diagnostics

- **Line draw doesn't start hidden** → `stroke-dasharray` is
  not set OR `stroke-dashoffset` is 0 instead of equal to
  dasharray. Both must be set to the same large value.
- **Line draw is jerky** → the path is complex; check for many
  control points (which can produce uneven drawing speed).
- **Fill animation looks weird (stroke fades too)** → using
  `opacity` instead of `fill-opacity`. Switch.
- **Morph snaps abruptly** → the two `d` paths have different
  commands or point counts. Match them.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page with an SVG draw animation below the fold.
2. Scroll into view.
3. Capture screenshots at t=100, 200, 300, 400ms.
4. The line should be ~25%, 50%, 75%, 100% drawn at each
   timestamp.
5. With `prefers-reduced-motion: reduce`, the line should be
   FULLY drawn at t=0 (no animation).

## Browser support

| feature | browsers |
|---|---|
| `stroke-dashoffset` | all modern (since 2010s) |
| `fill-opacity` | all modern |
| `transform` on SVG | all modern (with `transform-origin` quirks pre-2017 Safari) |
| `d` attribute interpolation | Chromium 86+, Firefox 100+, Safari 16+ |
| `marker-end` with auto-orient | all modern |

For older browsers, fall back to non-animated SVG (the SVG
renders at its final state thanks to the reduce substitute
pattern, which is technically the right behavior in any
browser without animation support).

## Why CSS animation on SVG, not SMIL

SMIL (`<animate>`, `<animateTransform>`, `<animateMotion>`) is
the legacy SVG animation API. Reasons to AVOID it:
1. Slated for deprecation in Chrome (still supported but
   no longer maintained).
2. Doesn't compose with `prefers-reduced-motion` media query.
3. Doesn't benefit from the animation skill's loop-pause
   observer.
4. Can't be hot-swapped via DESIGN.md tokens.

CSS animation works on SVG elements identically to HTML
elements (with the noted SVG-specific properties like
stroke-dashoffset). Always prefer CSS animation.

## Author extension: hand-drawn-feeling SVG

For a "hand-drawn" feel where the line draws with slight
imperfection:

```css
.va-svg-draw-rough {
  stroke-dasharray: 200 5 100 5 50;   /* varied dash pattern */
  stroke-dashoffset: 360;             /* total length */
  animation: vaSvgDraw 800ms cubic-bezier(0.5, 0, 0.5, 1) both;
}
```

The non-uniform dash array makes the line appear with subtle
"stutter" — feels less mechanical, more like a human drawing.

This is a custom keyframe; the skill ships only the smooth
`stroke-dashoffset: 0` pattern.
