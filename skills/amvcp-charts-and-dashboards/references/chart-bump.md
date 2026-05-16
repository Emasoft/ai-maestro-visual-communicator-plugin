# `chart:bump@1` — bump chart

A line chart whose y-axis is a RANK (1, 2, 3, …) rather than a magnitude.
Each series is one ranked thing; the line shows its rank position across
the x-positions. Crossings between lines visually signal that two items
swapped rank. Rank 1 is at the TOP (y-axis inverted).

## When to choose bump

Use `bump` when:

- The data is a LEADERBOARD evolving over time (top-N song chart, top-N team standings, top-N feature usage).
- The reader cares about RANK MOVEMENT (did A overtake B?), not the absolute magnitudes that produced the ranks.
- Series count is moderate (3-12); past that, the line crossings get tangled.

Pick `line` instead when the y-axis is a magnitude.
Pick `slope` when there are only two time points and many series.

## Authoring shape

```chart:bump@1
{
  "title": "Top 5 features by usage — weekly rank",
  "subtitle": "Search overtook Filters in W3",
  "series": [
    { "label": "Search",  "data": [
      {"x":"W1","rank":2},{"x":"W2","rank":2},
      {"x":"W3","rank":1},{"x":"W4","rank":1}] },
    { "label": "Filters", "data": [
      {"x":"W1","rank":1},{"x":"W2","rank":1},
      {"x":"W3","rank":2},{"x":"W4","rank":3}] },
    { "label": "Sort",    "data": [
      {"x":"W1","rank":3},{"x":"W2","rank":4},
      {"x":"W3","rank":3},{"x":"W4","rank":2}] },
    { "label": "Export",  "data": [
      {"x":"W1","rank":4},{"x":"W2","rank":3},
      {"x":"W3","rank":4},{"x":"W4","rank":4}] },
    { "label": "Share",   "data": [
      {"x":"W1","rank":5},{"x":"W2","rank":5},
      {"x":"W3","rank":5},{"x":"W4","rank":5}] }
  ]
}
```

- Each datum has `{x, rank}` — `rank` is the integer position (1 = best).
- The y-axis is inverted automatically (rank 1 plots at the TOP).
- The y-domain is auto-computed as `[1, series.length]` (the best possible rank to the worst), regardless of the actual rank values used.
- The renderer also accepts `{x, y}` if `y` carries the rank — the spec's `rank` key is the canonical one but `y` works as a fallback (see the renderer code).

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | n/a | Not used (rank is a small integer; the visual position IS the label). |
| `sortDescending` | n/a | The y-axis is inverted; bump doesn't sort. |

## Examples

### 1. Top-N market share over quarters

```chart:bump@1
{ "title": "Browser market share rank — last 4 quarters",
  "series": [
    { "label": "Chrome",  "data": [
      {"x":"Q1","rank":1},{"x":"Q2","rank":1},
      {"x":"Q3","rank":1},{"x":"Q4","rank":1}] },
    { "label": "Safari",  "data": [
      {"x":"Q1","rank":2},{"x":"Q2","rank":2},
      {"x":"Q3","rank":2},{"x":"Q4","rank":2}] },
    { "label": "Edge",    "data": [
      {"x":"Q1","rank":3},{"x":"Q2","rank":4},
      {"x":"Q3","rank":3},{"x":"Q4","rank":3}] },
    { "label": "Firefox", "data": [
      {"x":"Q1","rank":4},{"x":"Q2","rank":3},
      {"x":"Q3","rank":4},{"x":"Q4","rank":4}] }
  ] }
```

### 2. Team standings (rank reordered each round)

```chart:bump@1
{ "title": "Team standings — last 6 rounds",
  "series": [
    { "label": "Alpha",   "data": [
      {"x":"R1","rank":3},{"x":"R2","rank":1},{"x":"R3","rank":1},
      {"x":"R4","rank":2},{"x":"R5","rank":1},{"x":"R6","rank":1}] },
    { "label": "Bravo",   "data": [
      {"x":"R1","rank":1},{"x":"R2","rank":2},{"x":"R3","rank":3},
      {"x":"R4","rank":1},{"x":"R5","rank":2},{"x":"R6","rank":2}] },
    { "label": "Charlie", "data": [
      {"x":"R1","rank":2},{"x":"R2","rank":3},{"x":"R3","rank":2},
      {"x":"R4","rank":3},{"x":"R5","rank":3},{"x":"R6","rank":3}] }
  ] }
```

## What the runtime emits

```html
<svg class="ve-chart-svg" …>
  <!-- NO gridlines (bump doesn't draw them — the lines are the chart). -->
  <!-- Each series renders ONE Catmull-Rom path through rank positions. -->
  <path class="ve-chart-line"
        d="M (x0,rank0) C … (xN-1,rankN-1)"
        fill="none" stroke="(palette[i])"/>
  <g class="ve-chart-points">
    <circle class="ve-chart-point" cx="…" cy="(yScale(rank))" r="4" …/>
    …
  </g>
  <g class="ve-chart-line-labels">
    <text class="ve-chart-series-label" x="…" y="…" text-anchor="start">
      Search
    </text>
    …
  </g>
</svg>
```

`yScale = scale(1, series.length, M.t, yBase)` inverts naturally: rank 1
maps to `M.t` (top), rank N maps to `yBase` (bottom).

## Lib functions called

`renderSvgLine(spec, 'bump', fig)` — branches on `isBump`:

- `dataMin = 1`, `dataMax = series.length` (the rank domain is set, not data-driven).
- `yScale = scale(1, series.length, M.t, yBase)` — INVERTED y-axis.
- `_drawGrid` is SKIPPED (no horizontal gridlines on bump — the lines ARE the grid).
- Per datum, the renderer reads `data[di].rank` (canonical) or `data[di].y` (fallback).
- Curve: `catmullRom(pts)` when ≥ 3 points, `linePath(pts)` for 2.
- Right-edge label per series via `<text class="ve-chart-series-label">`.

## DESIGN.md tokens

Same as `line`. The right-edge labels use `--vc-color-content`.

## Selection / atoms

Each rank point is a `chart-point` atom (one per `{x, rank}` datum). The
atom's `value` field carries the RANK (an integer), not a magnitude — a
downstream comment thread can quote "Filters was rank 1 in W2".

## Anti-patterns

- **Bump with non-rank y values.** The y-axis is forced to `[1, series.length]`; passing magnitudes like `[1000, 5000, 20000]` clips them to the rank-domain visual. Pre-compute ranks.
- **Bump with very many series (15+).** Line crossings become unreadable. Limit to top-N (5-10).
- **Bump where ranks never change.** Becomes 5 parallel horizontal lines — uninformative. Verify that the rank values actually move across x positions before using bump.
- **Mixing rank-1-is-best with rank-1-is-worst.** Always rank 1 = best (top of the chart). If your data has rank 1 = worst, invert before authoring.

## Bump vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Rank-over-time, RANK crossings matter | `bump` | Y-inverted; line crossings = rank inversions. |
| Rank-over-time, MAGNITUDES matter more | `line` | Real value on y-axis; rank crossings invisible. |
| Two-period rank shift, many series | `slope` | Sparse 2-x-position form; perfect for "Mon → Fri rank shift". |
| Rank, single time point | `bar` (sorted) | Don't need the time dimension. |

The bump chart's strength is showing RANK INVERSIONS — when two series
SWAP rank, the lines CROSS. Few alternatives convey this as crisply.

## When the rank stays stable

If most series never change rank position, the chart shows mostly
parallel horizontal lines — uninformative. Verify before authoring:

```js
const ranks = series.map(s => s.data.map(d => d.rank));
const stable = ranks.every(r => r.every((v, i) => i === 0 || v === r[i-1]));
if (stable) console.warn('All series have constant rank — use bar sorted instead.');
```

For a leaderboard that NEVER changes, just show a `bar` sorted.

## Bump with magnitudes (alternative encoding)

The standard bump chart shows ONLY rank, not the underlying
magnitudes that produced the ranks. To convey "how big was the gap?",
PAIR a bump chart with a side-by-side `line` chart showing the actual
magnitudes:

```chart:bump@1
{ "title": "Top 5 features by usage — weekly rank",
  "series": [
    { "label": "Search", "data": [{"x":"W1","rank":2},{"x":"W2","rank":2},{"x":"W3","rank":1},{"x":"W4","rank":1}] },
    …
  ] }
```

```chart:line@1
{ "title": "Top 5 features — weekly usage count",
  "series": [
    { "label": "Search", "data": [{"x":"W1","y":420},{"x":"W2","y":510},{"x":"W3","y":680},{"x":"W4","y":720}] },
    …
  ] }
```

Bump answers "did the order change?"; line answers "by how much?".

## Bump's downside — line tangle

With 8+ series, lines cross densely and tracking individual series gets
hard. Mitigations:

- Limit to top-N (5-7 series typical).
- Use right-edge labels with high contrast (the renderer does this
  automatically via `.ve-chart-series-label`).
- Add subtle line strokes (thinner) so the crossings look less crowded.

For very dense rank movements (50+ items), a `heatmap` of rank-per-time
cells reads better than a tangle of crossing lines.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: rank 1 sits at the top
(y-axis inverted), line crossings are visible (lines should not all stack
at the same y), per-series palette is distinct enough for line-tracking,
right-endpoint labels do not overlap.
