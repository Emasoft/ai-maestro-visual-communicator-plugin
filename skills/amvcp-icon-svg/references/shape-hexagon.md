# Decorative shape — hexagon

## Table of Contents

- [What it renders](#what-it-renders)
- [Two authoring paths](#two-authoring-paths)
  - [Path A — scene-graph](#path-a--scene-graph)
  - [Path B — CSS-only class](#path-b--css-only-class)
- [Fill options](#fill-options)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [Single hexagon hero (a platform badge)](#single-hexagon-hero-a-platform-badge)
  - [CSS-only honeycomb tile pattern](#css-only-honeycomb-tile-pattern)
  - [Hexagon as a chemistry mark](#hexagon-as-a-chemistry-mark)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `hexagon` shape is the universal 6-sided badge: chemistry, hex
grid game tiles, "platform" / "service" mark, badge / award glyph,
sci-fi UI ornament. A 6-point polygon — a regular-ish hexagon with
vertices at the corners of the bounding box's midpoints.

## What it renders

Six points in normalized 0-100 space:

```js
hexagon: [
  [25, 0], [75, 0],
  [100, 50], [75, 100],
  [25, 100], [0, 50]
]
```

Reading clockwise from top-left:

1. Top-left vertex: `(25, 0)`
2. Top-right vertex: `(75, 0)`
3. Right vertex (point): `(100, 50)`
4. Bottom-right vertex: `(75, 100)`
5. Bottom-left vertex: `(25, 100)`
6. Left vertex (point): `(0, 50)`

The 4 corner vertices sit 25% inset from the bounding box edges; the
2 "point" vertices touch the left and right edge midpoints. The
result is a hexagon with the points on the HORIZONTAL axis (a
"pointy-side" hexagon, not a "flat-top" hexagon).

## Two authoring paths

### Path A — scene-graph

```html
<script type="application/icon-svg+json" id="hexagon-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Hexagon badge",
  "primitives": [
    { "type": "shape",
      "id": "hex",
      "kind": "hexagon",
      "x": 200, "y": 200,
      "w": 600, "h": 600,
      "fill": "accent" }
  ]
}
</script>
```

### Path B — CSS-only class

```html
<span class="isvg-shape isvg-shape-hexagon"></span>
```

## Fill options

Same as every shape primitive.

## When to use

- Chemistry / molecule / scientific mark.
- Hex-grid game tile.
- Badge / award / achievement mark.
- "Platform" / "service" / "module" mark (the hex is a common SaaS
  brand glyph).
- Sci-fi / cyber aesthetic UI ornament.
- Honeycomb-pattern decoration (multiple hexagons tiled together).

## When NOT to use

- For a 6-sided shape with text inside — `hexagon` has no label
  support; use a `process` rect with a label, or hand-author a
  `<polygon>` + `<text>` pair in a `free` scene.
- For a flat-top hexagon — `hexagon` has POINTS on the horizontal
  axis; for a flat-top, rotate via `transform: rotate(30deg)`.
- For an irregular hexagon — `hexagon` is regular; hand-author for
  irregular.

## Common authoring patterns

### Single hexagon hero (a platform badge)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "shape", "id": "hex", "kind": "hexagon",
      "x": 250, "y": 250, "w": 500, "h": 500, "fill": "accent" } ] }
```

### CSS-only honeycomb tile pattern

Honeycomb tiling needs offsetting alternating columns; the
`.isvg-shape-hexagon` class is just one tile. For an actual
honeycomb pattern, use CSS Grid or Flexbox to lay multiple `<span>`s
with the class.

### Hexagon as a chemistry mark

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Benzene ring placeholder",
  "primitives": [
    { "type": "shape", "id": "ring", "kind": "hexagon",
      "x": 250, "y": 250, "w": 500, "h": 500, "fill": "tint-quiet" } ] }
```

(For a real benzene ring with bond lines, hand-author a custom SVG
in a `free` scene-graph.)

## What NOT to do

- Do NOT use the hexagon shape as a "node with a label" — pick
  `process` rect or hand-author. The shape primitive has no `label`
  support.
- Do NOT stretch `w` >> `h` or vice versa to extremes — the hexagon
  warps into a flat lozenge. Keep `w/h` between 0.5 and 2.

## Visual verification

Confirm all 6 vertices are visible, the two horizontal points (left
and right edge midpoints) are sharp, and the corner-inset vertices
(at 25% / 75%) are at the correct positions. A common visual bug:
at small sizes, the corners can read as a rounded hexagon (which
icon-svg does not produce — vertices are sharp). If yours looks
rounded, suspect anti-aliasing at small sizes; bump up the render
size.
