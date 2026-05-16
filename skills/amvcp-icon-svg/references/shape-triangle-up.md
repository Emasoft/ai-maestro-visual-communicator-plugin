# Decorative shape — triangle-up

The `triangle-up` shape is the universal upward-pointing triangle —
sort indicator, arrow-up, mountain peak, hierarchy top, increase
direction. Renders as either a filled SVG `<polygon>` (inside a
`scene-graph` block) or as a CSS-only `clip-path` rectangle (the
`.isvg-shape-triangle-up` class — zero SVG, zero JS).

## What it renders

Three points (in normalized 0-100 space, mapped into the 1000-space
by the compiler):

```js
'triangle-up': [[50, 0], [100, 100], [0, 100]]
```

- Top vertex: 50% across, 0% down
- Bottom-right vertex: 100% across, 100% down
- Bottom-left vertex: 0% across, 100% down

In a scene-graph, it compiles to a `<polygon points="...">`. As CSS,
the same coordinates drive `clip-path: polygon(50% 0%, 100% 100%,
0% 100%)`.

## Two authoring paths

### Path A — scene-graph shape primitive

```html
<script type="application/icon-svg+json" id="triangle-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Triangle up",
  "primitives": [
    { "type": "shape",
      "id": "tri",
      "kind": "triangle-up",
      "x": 300, "y": 300,
      "w": 400, "h": 400,
      "fill": "accent" }
  ]
}
</script>
```

Compiles to a `<polygon points="500,300 700,700 300,700"
fill="var(--vc-color-accent, #b8861f)"/>` inside a
`<g data-ve-id="tri">` selection atom.

### Path B — CSS-only class (zero SVG, zero JS)

```html
<span class="isvg-shape isvg-shape-triangle-up"
      title="triangle-up"></span>
```

Renders as a `120x120px` `inline-block` `<span>` with
`background: var(--vc-color-accent)` and
`clip-path: polygon(50% 0%, 100% 100%, 0% 100%)`. NO SVG element,
NO data-ve-id. Use for purely decorative placement (a UI icon in a
button, a divider glyph) where selectability isn't needed.

## Fill options (scene-graph path)

| `fill` | Resolved value |
|---|---|
| `"accent"` (default) | `var(--vc-color-accent)` |
| `"success"` | `var(--vc-color-success)` |
| `"warning"` | `var(--vc-color-warning)` |
| `"danger"` | `var(--vc-color-danger)` |
| `"info"` | `var(--vc-color-info)` |
| `"content"` | `var(--vc-color-content)` (ink) |
| `"tint-hero"` / `"tint-mid"` / `"tint-quiet"` | accent tint tiers |
| `"none"` | unfilled (only the polygon outline, but `triangle-up` has no stroke — so an unfilled triangle is invisible) |

## DESIGN.md tokens consumed

- `--vc-color-<role>` per the `fill` option
- (CSS path) `--vc-color-accent` for the default background

## Selection / comment / decision-mini (scene-graph path)

Wrapping `<g data-ve-id>` makes the triangle a selection atom.

## When to use

- Sort indicator (sortable column header).
- Increase arrow / upward trend.
- Mountain / peak / hierarchy top.
- Play button (rotated 90° — but for a play button, route to
  `interactive-control`).
- Generic upward direction marker.

## When NOT to use

- For a triangle pointing in a non-up direction — rotate via CSS
  `transform: rotate(…)` on the wrapping `<g>` OR hand-author a
  custom polygon with the rotated points.
- For an isosceles vs equilateral choice — `triangle-up` is
  ISOSCELES with the apex at top-center; for equilateral, hand-author
  with three 0/120/240-degree points.

## Common authoring patterns

### CSS-only icon row (a sortable-column glyph)

```html
<span class="isvg-shape isvg-shape-triangle-up"
      style="inline-size: 12px; block-size: 12px;
             background: var(--vc-color-content-subtle);"></span>
```

### Scene-graph selectable hero triangle

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "shape", "id": "tri", "kind": "triangle-up",
      "x": 200, "y": 200, "w": 600, "h": 600, "fill": "accent" } ] }
```

## What NOT to do

- Do NOT stroke a triangle — `triangle-up` is FILL-ONLY.
- Do NOT mix the CSS class with a scene-graph shape — pick one
  authoring path per element.

## Visual verification

Confirm in both themes the triangle reads with clean vertices and the
fill color matches the chosen `fill` token.
