# Coordinate snap grid

The engine's 4-unit grid system: how coordinates snap, why, when
to override the grid step, and how the grid integrates with the
optional `background: "grid"` visual.

## The default 4-unit grid

By default, every node and edge endpoint is snapped to a 4-unit
grid:

```js
function snap(v) {
  return Math.round(v / grid) * grid;
}
```

With `grid = 4`, every x/y/w/h is rounded to the nearest
multiple of 4. The author can supply `x: 137.4` and the engine
will render at x=136 (snapping to the grid).

Why 4? Two reasons:

1. **Visual alignment** — snapping eliminates sub-pixel jitter
   between adjacent nodes. Two nodes both placed at "the same"
   x-coordinate render at exactly the same x.
2. **Modest constraint** — a 4-unit grid is fine enough that
   the snapping is invisible to the eye but tight enough that
   manual coordinates fall on the grid without effort.

## Overriding the grid step

Set `grid: <N>` in the scene:

```json
{
  "version": 1,
  "preset": "free",
  "grid": 20,
  "width": 1000,
  "height": 600,
  "nodes": [...]
}
```

| `grid` value | Use case |
|---|---|
| `1` | NO snapping; preserve exact author coordinates |
| `4` (default) | balanced — fine alignment, low constraint |
| `8` | tighter alignment grid for marketing-style diagrams |
| `20` | coarse engineering schematic grid (cells visible to the eye) |

Pick the grid based on the visual character of the diagram. A
schematic with a 20-unit grid LOOKS like an engineering drawing.

## The visible grid background

`background: "grid"` paints a faint grid in the SVG background:

- 4-unit minor grid at low alpha (~5% of `--vc-color-border`).
- 20-unit major grid at higher alpha (~15%).
- 100-unit "feature" grid (slightly darker still) on diagrams
  > 600 units wide.

The grid alignment matches the snap grid, so node edges visually
sit ON the grid lines when properly authored. Mismatch is a
useful debugging signal: if your nodes don't align with the
grid, your coordinates are off.

## When to show the grid vs hide it

Show the grid (`background: "grid"`) when:

- The diagram is **engineering / schematic** in character
  (blueprint preset is the canonical pairing).
- The reader benefits from seeing the alignment grid (a `free`
  preset diagram where exact positioning matters).

Hide the grid (`background: "plain"` or `"none"`) when:

- The diagram is **marketing / product** in character (the
  grid would feel cluttered).
- The diagram sits on a textured or photographic background
  where the grid would be visible noise.

## How snapping interacts with auto-place

When the engine auto-places nodes (`process-flow`,
`architecture-canvas`, `phase-graph`), the assigned coordinates
ALREADY snap to the grid (the engine computes positions in
grid units). Your author-supplied `x`/`y` (if any) are snapped
separately. There's no double-snap collision.

If you want a node to land EXACTLY where you authored, set
`grid: 1` for the whole scene; both auto-place and explicit
coordinates will preserve exact values.

## Sub-grid offsets (for centering text within nodes)

Text positioning inside nodes is NOT snapped to the scene's
grid — text needs to be centered within each node, and the
center can fall at any fractional offset. The engine computes
text positions internally using `getBBox()` results.

If you author SVG by hand (instead of using the scene graph) and
want grid-snapping for your text, snap manually.

## The grid is structural, not themed

The grid step is a NUMERIC constant — not a `--vc-*` token. The
grid is geometry, not color/typography. The grid LINE COLOR is
themed (it reads `--vc-color-border` at low alpha) but the
spacing is fixed per-scene.

## DESIGN.md tokens consumed (by the visible grid)

| Token | Use |
|---|---|
| `--vc-color-border` | the grid line color (alpha-blended) |
| `--vc-color-surface` | the SVG background fill (so the grid sits on a surface) |

## Snapping width and height (not just x and y)

`w` and `h` are also snapped:

```js
node.w = snap(node.w);
node.h = snap(node.h);
```

This ensures node SIZES align with the grid too — a 161-wide
node becomes a 160-wide one (or 164 if the snap is to 4). You
don't get rectangles whose right-edge sits between two grid
columns.

## Grid coordinate vs CSS pixel

The scene's `width` and `height` define the SVG viewBox. The
viewBox is rendered into a CSS pixel area determined by the
page's layout. A 1000-wide viewBox at 50% page width renders at
500 CSS pixels.

The grid lives in viewBox units — a 4-unit grid in a 1000-wide
viewBox renders as 4-CSS-pixel cells at full size, 2-CSS-pixel
cells at 50%.

This means a coarse grid (20 units) renders more visibly at
small zoom than a fine grid (4 units). Pick the grid step for
the typical RENDER SIZE, not the viewBox size.

## Snapping and re-render

On theme swap (`vc:themechange`), the engine re-renders the
scene from the cached JSON. The snap runs again. Idempotent —
snapping the same JSON twice produces the same coordinates.

## Anti-patterns

- Mixing `grid: 1` and explicit-grid coordinates in the same
  scene: confusion. Either snap or don't.
- Setting `grid: 100` and expecting nodes to render at 4-unit
  intervals: the snap collapses everything to the 100-unit
  grid; multi-node rows become single overlapping blocks.
- Showing the grid on a marketing diagram: clutters; turn it
  off.
- Hand-authoring nodes off-grid (`x: 137`): they snap to 136 or
  140; the author wonders why their coordinates "moved".

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark of a diagram with `background:
"grid"`. Verify:

- Node edges visually sit ON the grid lines.
- The grid is faint enough not to dominate (you should see the
  nodes first, the grid second).
- The grid spacing matches the diagram's character (fine for
  product/marketing, coarse for engineering).
