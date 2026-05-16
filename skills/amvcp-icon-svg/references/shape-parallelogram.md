# Decorative shape — parallelogram

The `parallelogram` shape is a 4-point slanted quadrilateral, leaning
to the LEFT. The classic flowchart "input/output" shape, the
universal "data card" stack glyph, and a common editorial
"slide-forward" affordance. Slanted at 25% horizontal offset.

## What it renders

Four points in normalized 0-100 space:

```js
parallelogram: [[25, 0], [100, 0], [75, 100], [0, 100]]
```

Reading clockwise from top-left:

1. Top-left: `(25, 0)` — shifted RIGHT by 25%
2. Top-right: `(100, 0)`
3. Bottom-right: `(75, 100)` — shifted LEFT by 25%
4. Bottom-left: `(0, 100)`

The two horizontal edges stay parallel; the two slanted edges run
from top-left-quarter down to bottom-left and from top-right down to
bottom-right-quarter. The shape leans LEFT (top slides right, bottom
slides left — the top-right corner is "ahead" of the bottom-right
corner).

## Two authoring paths

### Path A — scene-graph

```html
<script type="application/icon-svg+json" id="parallelogram-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Parallelogram",
  "primitives": [
    { "type": "shape",
      "id": "par",
      "kind": "parallelogram",
      "x": 200, "y": 300,
      "w": 600, "h": 400,
      "fill": "info" }
  ]
}
</script>
```

### Path B — CSS-only class

```html
<span class="isvg-shape isvg-shape-parallelogram"></span>
```

## Fill options

Same as every shape primitive.

## When to use

- Flowchart "input/output" shape (the classic ANSI flowchart symbol
  for data entering/leaving the system).
- Data card mark in a "stack of cards" visualization.
- "Forward" / "shipping" affordance in a process visualization.
- Stylistic decorative shape that's NOT a plain rectangle.

## When NOT to use

- For a flowchart NODE that represents data — use the `database`
  cylinder primitive (icon-svg `node` family). Parallelogram is a
  shape, not a node — it has no label support, no variant.
- For a non-leaning quadrilateral — use a plain `<rect>` or the
  `process` primitive.
- For a trapezoid (one parallel pair, one converging pair) —
  hand-author a custom polygon. Parallelogram has BOTH pairs
  parallel.

## Common authoring patterns

### CSS-only data-card decoration

```html
<div class="data-card">
  <span class="isvg-shape isvg-shape-parallelogram
                isvg-data-mark"></span>
  <span>Customers (12.4K rows)</span>
</div>
<style>
  .isvg-data-mark {
    inline-size: 20px; block-size: 14px;
    background: var(--vc-color-info);
  }
</style>
```

### Scene-graph stylized data block

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "shape", "id": "par", "kind": "parallelogram",
      "x": 100, "y": 300, "w": 800, "h": 400, "fill": "tint-mid" } ] }
```

## What NOT to do

- Do NOT use `parallelogram` for a true flowchart data node — the
  shape has no label support; use the `database` cylinder primitive
  or hand-author a `<polygon>` + `<text>` pair in a `free` scene.
- Do NOT use it for a slide/transition affordance — `chevron` reads
  more cleanly as a direction marker.

## Visual verification

Confirm in both themes the parallelogram leans LEFT (top-right corner
is to the right of the bottom-right corner). The two slanted edges
should be visibly parallel (parallelogram, not trapezoid). If the
shape reads as a "wonky rectangle" rather than a clear lean, bump up
the rendered size — at small sizes the slant can disappear visually.
