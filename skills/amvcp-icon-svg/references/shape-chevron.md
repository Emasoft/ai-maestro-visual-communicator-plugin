# Decorative shape — chevron

## Table of Contents

- [What it renders](#what-it-renders)
- [Two authoring paths](#two-authoring-paths)
  - [Path A — scene-graph](#path-a--scene-graph)
  - [Path B — CSS-only class](#path-b--css-only-class)
- [Fill options](#fill-options)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [Pagination glyph](#pagination-glyph)
  - [Breadcrumb separator](#breadcrumb-separator)
  - [Scene-graph hero chevron](#scene-graph-hero-chevron)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `chevron` shape is the universal rightward chevron — pagination
"next" arrow, navigation breadcrumb separator, "go deeper" affordance,
sidebar collapse glyph. A 6-point polygon with a "V" notch carved out
of its left side, making it read as a chevron rather than a solid
arrow.

## What it renders

Six points in normalized 0-100 space:

```js
chevron: [
  [75, 0], [100, 50], [75, 100],
  [0, 100], [25, 50], [0, 0]
]
```

Reading clockwise from top-right:

1. Top-right of body: `(75, 0)`
2. Tip / right point: `(100, 50)`
3. Bottom-right of body: `(75, 100)`
4. Bottom-left vertex (notch base): `(0, 100)`
5. Notch apex (carved inward): `(25, 50)` — this is the V notch
6. Top-left vertex (notch base): `(0, 0)`

The "V notch" between vertices 4-5-6 carves a triangular wedge out of
the left edge, giving the chevron its distinctive open-back shape.

## Two authoring paths

### Path A — scene-graph

```html
<script type="application/icon-svg+json" id="chevron-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Chevron right",
  "primitives": [
    { "type": "shape",
      "id": "ch",
      "kind": "chevron",
      "x": 350, "y": 300,
      "w": 300, "h": 400,
      "fill": "accent" }
  ]
}
</script>
```

### Path B — CSS-only class

```html
<span class="isvg-shape isvg-shape-chevron"
      title="chevron"></span>
```

## Fill options

Same as every shape primitive (see `references/shape-triangle-up.md`).

## When to use

- Pagination "next" affordance (e.g. `‹ Prev    Next ›`).
- Breadcrumb separator (`Home › Section › Page`).
- Sidebar collapse / expand arrow.
- Disclosure widget arrow.
- "Tap to drill in" affordance on a list item.
- Carousel "next" glyph.

## When NOT to use

- For an arrow that POINTS at something — use `arrow-right` (solid,
  not open-backed).
- For a "back" affordance — rotate via CSS `transform: scaleX(-1)`.
- For a down-chevron (disclosure expand) — rotate via CSS `transform:
  rotate(90deg)`.

## Common authoring patterns

### Pagination glyph

```html
<button>
  Next
  <span class="isvg-shape isvg-shape-chevron isvg-page-arrow"></span>
</button>
<style>
  .isvg-page-arrow {
    inline-size: 12px; block-size: 16px;
    background: currentColor;
  }
</style>
```

### Breadcrumb separator

```html
<nav class="breadcrumb">
  <a href="/">Home</a>
  <span class="isvg-shape isvg-shape-chevron isvg-crumb-sep"></span>
  <a href="/section">Section</a>
  <span class="isvg-shape isvg-shape-chevron isvg-crumb-sep"></span>
  <span aria-current="page">Page</span>
</nav>
<style>
  .isvg-crumb-sep {
    inline-size: 8px; block-size: 10px;
    background: var(--vc-color-content-subtle);
  }
</style>
```

### Scene-graph hero chevron

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "shape", "id": "ch", "kind": "chevron",
      "x": 100, "y": 200, "w": 800, "h": 600, "fill": "accent" } ] }
```

## What NOT to do

- Do NOT confuse `chevron` (open-backed V-shape) with `triangle-up`
  (filled solid triangle) — they are visually distinct and read as
  different glyphs.
- Do NOT use `chevron` as the only navigation affordance — pair with
  a visible "Next" / "Prev" text label for accessibility.

## Visual verification

Confirm the V notch is clearly carved out (the chevron reads as an
open shape, not a solid triangle). At very small sizes (~8px), the
notch can disappear — bump up the size or use `triangle-up` instead.
