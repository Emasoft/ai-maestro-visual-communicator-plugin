# Decorative shape — arrow-right

The `arrow-right` shape is the universal rightward arrow — flow
direction, "next" affordance, progression marker, time advances,
result-of operator. A 7-point polygon — a rectangular shaft with a
triangular arrowhead on the right.

## What it renders

Seven points in normalized 0-100 space (mapped to the 1000-space by
the compiler):

```js
'arrow-right': [
  [0, 20], [75, 20], [75, 0], [100, 50],
  [75, 100], [75, 80], [0, 80]
]
```

Reading the polygon clockwise from top-left of the shaft:

1. Top-left of shaft: `(0, 20)` — left edge, 20% down
2. Top-right of shaft / left of arrowhead base: `(75, 20)`
3. Top of arrowhead base: `(75, 0)` — extends UP to 0% above the
   shaft top
4. Arrowhead tip: `(100, 50)` — right edge, middle
5. Bottom of arrowhead base: `(75, 100)` — extends DOWN to 100%
6. Bottom-right of shaft / right of arrowhead base: `(75, 80)`
7. Bottom-left of shaft: `(0, 80)` — left edge, 80% down

The shaft is 60% tall (rows 20% to 80%), 75% wide. The arrowhead is
a triangle extending from 75% to 100% horizontally, full 0% to 100%
vertically.

## Two authoring paths

### Path A — scene-graph shape primitive

```html
<script type="application/icon-svg+json" id="arrow-right-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Right arrow",
  "primitives": [
    { "type": "shape",
      "id": "arr",
      "kind": "arrow-right",
      "x": 200, "y": 400,
      "w": 600, "h": 200,
      "fill": "accent" }
  ]
}
</script>
```

Compiles to a `<polygon points="200,440 650,440 650,400 800,500
650,600 650,560 200,560" fill="var(--vc-color-accent)"/>` inside a
selection atom.

### Path B — CSS-only class

```html
<span class="isvg-shape isvg-shape-arrow-right"></span>
```

Renders a 120x120 `inline-block` with the same arrow `clip-path`.

## Fill options

Same as every shape primitive: `accent` (default), `success`,
`warning`, `danger`, `info`, `content`, `tint-hero`, `tint-mid`,
`tint-quiet`, `none`.

## DESIGN.md tokens consumed

- `--vc-color-<role>` per the `fill` option.

## When to use

- Flow direction in a diagram.
- "Next" / "result of" affordance.
- Arrow connector (NOT a true diagram edge — that's the `diagram`
  skill).
- Process step indicator (e.g. "step 1 → step 2 → step 3" with arrow
  glyphs between).
- Decorative pointer.

## When NOT to use

- For a true diagram edge with a label and endpoint anchoring — use
  the `diagram` skill's `Edge` primitive instead.
- For a leftward arrow — rotate the CSS class with `transform:
  scaleX(-1)` OR hand-author a `<polygon>` with mirrored x-
  coordinates.
- For an up/down arrow — rotate with `transform: rotate(…)` OR use
  the `triangle-up` shape (for a simple direction marker).

## Common authoring patterns

### CSS-only step separator

```html
<div class="step-row">
  <span class="step">Ingest</span>
  <span class="isvg-shape isvg-shape-arrow-right
                isvg-step-arrow"></span>
  <span class="step">Persist</span>
</div>
<style>
  .isvg-step-arrow {
    inline-size: 24px; block-size: 16px;
    background: var(--vc-color-content-subtle);
  }
</style>
```

### Scene-graph wide-arrow hero

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "shape", "id": "arr", "kind": "arrow-right",
      "x": 100, "y": 400, "w": 800, "h": 200, "fill": "accent" } ] }
```

## What NOT to do

- Do NOT use `arrow-right` as a clickable button — wrap it in a
  proper `interactive-control` button.
- Do NOT use multiple `arrow-right` shapes to fake an edge — use the
  `diagram` skill's edge primitives.
- Do NOT stretch `w >> h` to extremes — the arrowhead-to-shaft
  proportion becomes weird. Keep `w/h ≈ 3:1` or smaller.

## Visual verification

Confirm the arrowhead points cleanly to the right, the shaft is
visible, and the fill matches the token.
