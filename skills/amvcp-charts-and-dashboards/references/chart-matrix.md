# `chart:matrix@1` — labeled value matrix

A heatmap with the per-cell VALUE printed inside each cell. Same color-ramp
encoding as `heatmap`, but the reader gets exact numbers without hovering.
Best for small grids where every value matters.

## When to choose matrix

Use `matrix` when:

- The grid is SMALL (≤ ~10 × 10 cells).
- Readers need to know the exact value per cell, not just the relative
  intensity.
- The chart is referenced in a discussion ("Pro × API = 2" — the audience
  is going to quote specific cells).

Pick `heatmap` instead when the grid is larger OR when the color intensity
alone tells the story (the reader doesn't need exact numbers per cell).

## Authoring shape

Identical to `heatmap`. The only difference is the type tag and the
renderer's added value-glyph layer.

```chart:matrix@1
{
  "title": "Feature support by plan",
  "subtitle": "Enterprise alone unlocks all 3",
  "series": [{ "label": "score", "data": [] }],
  "options": {
    "grid": [
      [3, 1, 2],
      [2, 3, 1],
      [1, 2, 3]
    ],
    "rowLabels": ["Free","Pro","Team"],
    "colLabels": ["API","SSO","Audit"]
  }
}
```

For the full options/shape reference, see [chart-heatmap.md](./chart-heatmap.md).

## Options

Same as `heatmap`:
- `grid` (2-D number array)
- `rowLabels`, `colLabels`
- `logScale`, `diverging`

The matrix renderer additionally prints a `<text class="ve-chart-cell-value">`
centered in each cell.

## Examples

### 1. Compatibility grid

```chart:matrix@1
{ "title": "API support across SDK versions",
  "series": [{ "label": "support", "data": [] }],
  "options": {
    "grid": [
      [1, 1, 1, 1],
      [0, 1, 1, 1],
      [0, 0, 1, 1],
      [0, 0, 0, 1]
    ],
    "rowLabels": ["v3.0","v3.5","v4.0","v4.5"],
    "colLabels": ["users.list","users.create","webhooks","audit-log"]
  } }
```

Treat 0/1 as "absent / present" — the value glyph "0" or "1" reads
clearly inside each cell.

### 2. Coverage matrix (counts)

```chart:matrix@1
{ "title": "Tests by module × type",
  "series": [{ "label": "count", "data": [] }],
  "options": {
    "grid": [
      [42, 18,  6],
      [28, 12,  3],
      [62, 34, 14],
      [18,  8,  2]
    ],
    "rowLabels": ["auth","catalog","orders","payments"],
    "colLabels": ["unit","integration","e2e"]
  } }
```

### 3. Risk × likelihood matrix

```chart:matrix@1
{ "title": "Q4 risk register — impact × likelihood",
  "series": [{ "label": "score", "data": [] }],
  "options": {
    "grid": [
      [1, 2, 4, 7],
      [2, 4, 6, 9],
      [3, 6, 8, 12]
    ],
    "rowLabels": ["Low","Med","High"],
    "colLabels": ["Rare","Possible","Likely","Certain"]
  } }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" …>
  <g class="ve-chart-grid">
    <rect class="ve-chart-cell" …
          fill="(ramp(t, sequential|diverging))"
          data-ve-id="ve-chart-N-d0-i0"
          data-ve-type="chart-point" …>
      <title>Free × API: 3</title>
    </rect>
    <text class="ve-chart-cell-value"
          x="(cell center x)" y="(cell center y + 4)"
          text-anchor="middle">
      3
    </text>
    …
  </g>
  …
</svg>
```

The text glyph is decorative (not a chart-point atom); the underlying rect
is the atom.

## Lib functions called

`renderSvgGrid(spec, 'matrix', fig)` — branches on `type === 'matrix'`:

- All of the `heatmap` rendering plus:
- For each cell, append `<text class="ve-chart-cell-value" x=cellCenter y=cellCenter+4 text-anchor="middle">` with `fmtNum(value)`.

The value-glyph CSS:
```css
.ve-chart-cell-value {
  fill: var(--vc-color-content, #1f1a14);
  font-size: 10px;
  font-family: var(--vc-font-body, system-ui, sans-serif);
}
```

## DESIGN.md tokens

Same as `heatmap` plus:

| Token | Used for |
|---|---|
| `--vc-color-content` | Cell value glyph fill. |

## Selection / atoms

Same as `heatmap` — each cell rect is a `chart-point` atom (the value glyph
is decorative). Selecting a cell lets the reader comment on "this cell's
value is wrong" or "this is the value to investigate".

## Anti-patterns

- **Using `matrix` for large grids.** The value glyph at 10px becomes unreadable past ~15 columns / 12 rows. Use `heatmap` and let readers hover for exact values.
- **Float values with many decimals.** `fmtNum` keeps up to 2 decimals (`3.14`, not `3.141592`); for higher precision, pre-round in the spec.
- **Non-numeric values.** `fmtNum(NaN)` returns the input as a string; the cell may print "null" or similar. Sanitise the spec.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: value glyph readable on
all cell fills (dark text on a dark hot cell is unreadable — verify the
contrast); both themes are legible; the chart has not switched to Canvas
backend (matrix is SVG-only — Canvas threshold doesn't apply).
