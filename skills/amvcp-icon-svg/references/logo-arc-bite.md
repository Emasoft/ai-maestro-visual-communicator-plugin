# Logo block — arc-bite

## Table of Contents

- [What it renders](#what-it-renders)
- [Scaffold](#scaffold)
- [Geometry](#geometry)
- [Why a `<path>`, not a mask?](#why-a-path-not-a-mask)
- [Lib function](#lib-function)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `arc-bite` logo block is a single `<path>` that traces a
rectangle and then carves a CRESCENT bite out of one corner using an
`A` (arc) command with `fill-rule="evenodd"`. The result: an
accent-filled rounded block with a half-moon nibbled out of the
top-right area. Visually distinct from `mask-cutout` because the bite
is CRESCENT-shaped (an arc through the rect's edges), not a
COMPLETE-CIRCLE hole.

## What it renders

```html
<path d="M x y L (x+w) y L (x+w) (y+h) L x (y+h) Z
         M (x+w) (y+h*0.5) A R R 0 0 0 (x+w*0.5) y"
      fill-rule="evenodd"
      fill="var(--vc-color-accent, #b8861f)"/>
```

The path has two subpaths:

1. **The outer rect** — `M x y L … L … L … Z` — a complete closed
   rectangle.
2. **The arc bite** — `M (x+w, y+h/2) A R R 0 0 0 (x+w/2, y)` —
   starts at the rect's right edge midpoint, sweeps an arc with
   radius `R = min(w,h) * 0.5` to land at the top edge midpoint.

`fill-rule="evenodd"` makes the area swept by the arc (the bite) be
SUBTRACTED from the rect's fill — the even-odd rule says "fill where
the winding count is odd", and the arc subpath crosses through the
rect interior, making the bitten region count as even (i.e.
unfilled).

## Scaffold

```html
<script type="application/icon-svg+json" id="arc-bite-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Arc bite logo block",
  "primitives": [
    { "type": "logo",
      "id": "lg-arc",
      "kind": "arc-bite",
      "x": 300, "y": 300,
      "w": 400, "h": 400 }
  ]
}
</script>
```

The bite radius is fixed at `min(w, h) * 0.5` — a half-the-smaller-
dimension bite, so the crescent occupies a substantial portion of the
top-right quadrant.

## Geometry

- `w`, `h` — the outer rect dimensions.
- Bite radius `R = min(w, h) * 0.5`.
- Bite anchor: starts at `(x+w, y+h/2)` (right-edge midpoint), ends
  at `(x+w/2, y)` (top-edge midpoint).
- The bite arc sweeps "outward" — `0 0 0` is the short-arc
  counter-clockwise direction in SVG's arc syntax (large-arc-flag=0,
  sweep-flag=0).

A `w = h` mark renders the most balanced crescent. A `w > h` rect
puts the bite in the top-right and the crescent looks elongated. A
`w < h` rect puts the bite in the top-right and the crescent is
narrower vertically.

## Why a `<path>`, not a mask?

`arc-bite` is one `<path>` with `fill-rule="evenodd"` because:

1. **No `<defs>` overhead** — one element, no namespace pollution.
2. **No id needed** — masks need unique ids; paths don't.
3. **Re-used clean** — `<defs><use>` works on `<path>` natively.
4. **Half the bytes** — one path vs `<defs><mask> ... </mask>` +
   the outer rect = ~3x more markup for the mask path.

The mask block is reserved for SHAPE-INTO-SHAPE subtraction where the
subtracted shape is closed (a circle bite); arc-bite is reserved for
CRESCENT subtraction where the bite is an arc through the rect.

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.logoArcBite({
  x: 300, y: 300, w: 400, h: 400, id: 'lg-arc'
});
```

`id` is consumed by the compiler's wrapping `<g data-ve-id>`; the
builder itself doesn't use it.

## DESIGN.md tokens consumed

- `--vc-color-accent` — the rect fill (the visible "moon" color)

## When to use

- A brand mark with a swooshy negative space (Pacman silhouette, moon
  phase, eclipse, brand glyph).
- A "missing piece" / "gap to fill" mark.
- An open container (the bite reveals what should go inside).
- A "view through a window" mark.

## When NOT to use

- For a complete-circle hole — that's `mask-cutout`.
- For a multi-bite mark — `arc-bite` is ONE bite; multiple bites
  need a hand-authored `<path>`.
- For a corner that's just rounded extra-large — that's `process`
  with a higher `rx` (capped at 36 per C2).

## Common authoring patterns

### Single arc-bite (a moon-phase mark)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Phase mark",
  "primitives": [
    { "type": "logo", "id": "lg", "kind": "arc-bite",
      "x": 250, "y": 250, "w": 500, "h": 500 } ] }
```

### Arc-bite in a logo gallery (with siblings)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "logo", "id": "a", "kind": "mask-cutout",
      "x":  40, "y": 350, "w": 280, "h": 280 },
    { "type": "logo", "id": "b", "kind": "arc-bite",
      "x": 360, "y": 350, "w": 280, "h": 280 },
    { "type": "logo", "id": "c", "kind": "zig-zag",
      "x": 680, "y": 350, "w": 280, "h": 280 } ] }
```

(The test fixture's `scene-logo-a`.)

## What NOT to do

- Do NOT put `arc-bite` in the same scene as a `current-color` logo
  — C7 throws (mixed theming).
- Do NOT try to change the bite position by setting `x` / `y` — the
  bite anchor is hard-coded to the top-right corner area; to put the
  bite elsewhere, rotate the whole `<g>` with a CSS transform.
- Do NOT use `arc-bite` for a "smile" mark — the bite is on the TOP
  edge, not the bottom. For a bottom smile, mirror the SVG with
  `transform: scaleY(-1)` on the wrapping `<g>`.

## Visual verification

In both light AND dark, confirm:

- The accent fill is visible.
- The crescent bite is clearly carved out (the page background shows
  through it).
- The bite has clean edges (no aliasing artefact along the arc).
- The bottom-left corner of the rect has the standard right-angle
  corner (NOT rounded — `arc-bite` uses a non-rounded outer rect,
  unlike `mask-cutout`).

A common visual bug: at very small render sizes the `fill-rule="evenodd"`
can render anti-aliased edges that look fuzzy. Bump the rendered size
up to ~120px+ to confirm the crescent reads cleanly.
