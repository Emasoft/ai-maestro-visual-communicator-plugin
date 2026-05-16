# `chart:harvey-ball@1` — Harvey ball row

The McKinsey "qualitative rating" glyph: a row of circles, each filled
0/25/50/75/100% to denote a coarse rating. Originally pencil-drawn into
Consumer Reports comparison tables; now the convention for quick qualitative
comparison across items.

## When to choose harvey-ball

Use `harvey-ball` when:

- You have a small set of items (3-8) to rate qualitatively (poor / fair / good / great / excellent).
- The reader needs to scan the row left-to-right and pick out high/low scores at a glance.
- Precise values are NOT important — the 5-level qualitative scale is sufficient.

Pick `bullet` instead when each item has a numeric target.
Pick `bar` (sorted) instead when readers must compare exact values.
Pick `gauge` instead when there is only ONE item to rate.

## Authoring shape

```chart:harvey-ball@1
{
  "title": "Vendor comparison",
  "subtitle": "Documentation is the deal-breaker",
  "series": [{ "label": "score", "data": [
    {"x":"Pricing",       "y": 0.75},
    {"x":"Performance",   "y": 1.00},
    {"x":"Documentation", "y": 0.25},
    {"x":"Support",       "y": 0.50},
    {"x":"Integrations",  "y": 0.75}
  ] }]
}
```

- Each datum is `{x: <criterion>, y: <fill-fraction>}`.
- `y` accepts either:
  - `[0, 1]` — interpreted as a fraction (0.25 = quarter-full).
  - `[0, 100]` — interpreted as a percentage (25 = quarter-full).
  - The renderer auto-detects: if `y > 1` it divides by 100; otherwise it uses `y` directly.
- The canonical qualitative scale is 0, 0.25, 0.50, 0.75, 1.00 — but the renderer accepts any fraction (a 0.42 ball just renders 42% filled). For canonical Harvey-ball semantics, stick to the 5-step scale.

## Options

| Key | Default | Effect |
|---|---|---|
| _(none specific to harvey-ball)_ | | The chart has no per-type options. |

## Examples

### 1. Tool comparison (5-step qualitative)

```chart:harvey-ball@1
{ "title": "Static analyser comparison — Python",
  "series": [{ "label": "rating", "data": [
    {"x":"ruff",     "y": 1.00},
    {"x":"pyright",  "y": 0.75},
    {"x":"pylint",   "y": 0.50},
    {"x":"mypy",     "y": 0.75},
    {"x":"flake8",   "y": 0.25}
  ] }] }
```

### 2. Framework support matrix (per criterion, 4-step)

```chart:harvey-ball@1
{ "title": "Framework SSR support",
  "series": [{ "label": "ssr", "data": [
    {"x":"Next.js",  "y": 100},
    {"x":"Remix",    "y": 100},
    {"x":"Nuxt",     "y": 100},
    {"x":"SvelteKit","y": 75},
    {"x":"Astro",    "y": 50}
  ] }] }
```

## What the runtime emits

```html
<figure class="ve-chart" data-ve-chart-type="harvey-ball" data-ve-chart-backend="svg" …>
  <figcaption class="ve-chart-title">…</figcaption>
  <svg class="ve-chart-svg" viewBox="0 W 156" preserveAspectRatio="xMidYMid meet">
    <g class="ve-chart-harvey">
      <!-- Per item: ring + filled wedge + label under. -->
      <circle class="ve-chart-harvey-ring"
              cx="…" cy="68" r="46"
              fill="var(--vc-color-surface, #ffffff)"
              stroke="var(--vc-color-border-strong, #c9bfa3)"/>
      <path class="ve-chart-arc ve-chart-harvey-fill"
            d="(describeArc cx cy r 0 0 angle)"
            fill="var(--vc-color-accent, #b8861f)"
            data-ve-id="ve-chart-N-d0-i0"
            data-ve-type="chart-point" …>
        <title>Pricing: 75%</title>
      </path>
      <text class="ve-chart-axis-label" x="…" y="118" text-anchor="middle">
        Pricing
      </text>
      …
    </g>
  </svg>
</figure>
```

The viewBox width depends on the number of items
(`n * 96 + (n-1) * 24 + 40`). The chart is HORIZONTAL — items are laid out
left to right in a single row.

## Lib functions called

`_renderHarveyBall(spec, fig)`:

- For each datum:
  1. Append the OUTLINE circle (`<circle class="ve-chart-harvey-ring">`).
  2. If `v > 0`, append the FILLED wedge: `<path class="ve-chart-arc ve-chart-harvey-fill" d=describeArc(cx, cy, r, 0, 0, 360 * v)>` — a full annular wedge with `rInner = 0` (pie-shaped, since the ring outline gives the chart its donut feel).
  3. Append a label under the ball.
- Only the FILLED wedge is a `chart-point` atom (the outline ring is decorative).
- The renderer normalises `y > 1` to `y / 100` (auto-detect fraction vs percent).

## DESIGN.md tokens

| Token | Used for |
|---|---|
| `--vc-color-surface` | Outline ring fill (the unfilled "empty" portion). |
| `--vc-color-border-strong` | Outline ring stroke. |
| `--vc-color-accent` | Filled wedge fill. |

## Selection / atoms

Only the FILLED wedge is a `chart-point` atom. Selecting a ball lets the
reader comment on that criterion's rating. The atom's `value` field
carries the percentage (an integer 0-100, never the fractional form).

## Anti-patterns

- **Harvey ball for precise scores (e.g. NPS 47.3).** The qualitative-glyph form is wrong for precise values. Use `dot-plot` or `bullet`.
- **Continuous data on Harvey balls.** Use a heatmap-style ramp; balls are categorical/qualitative.
- **Two-series Harvey balls.** Not supported — each item gets ONE ball. For multi-series comparison, lay out two Harvey-ball rows side by side (one per series) or switch to `matrix`.
- **More than ~8 balls in a row.** Becomes unreadable. Split into multiple rows or switch to `matrix`.

## Harvey-ball vs alternatives

| Story | Best chart | Why |
|---|---|---|
| Coarse 0/25/50/75/100% rating per item | `harvey-ball` | Conventional McKinsey glyph; immediate visual scan. |
| Precise score per criterion | `dot-plot` or `bar` | Position encodes precise value. |
| Multiple items × multiple criteria | `matrix` (heatmap with cell values) | Row × col grid handles both axes. |
| Single rating with threshold | `gauge` | Single-value circular form with warn/danger. |

The Harvey ball is qualitative by design — it sacrifices precision for
visual scannability. A row of 5 balls reads at a glance; a row of 5
bars demands measurement.

## The five canonical ball states

The qualitative scale, paint patterns, and intended semantic:

| Value | Visual | Meaning |
|---|---|---|
| 0.00 (0%) | Empty ring | Absent / not supported / failed |
| 0.25 (25%) | Quarter-filled wedge | Poor / minimal / 1-out-of-4 |
| 0.50 (50%) | Half-filled wedge | Fair / partial / passable |
| 0.75 (75%) | Three-quarters-filled wedge | Good / most criteria met |
| 1.00 (100%) | Fully-filled disk | Excellent / fully supported / best-in-class |

When authoring, stick to these 5 levels for canonical Harvey-ball
semantics. Non-canonical values (like 0.42 = 42%) render correctly but
break the convention's qualitative reading.

## Multiple Harvey-ball rows (per-criterion comparison)

The chart type doesn't support multi-series natively — each `data[k]`
is one ball, period. For a comparison matrix (multiple criteria across
multiple items), author MULTIPLE Harvey-ball figures stacked
vertically:

```chart:harvey-ball@1
{ "title": "Pricing",
  "series": [{ "label": "score", "data": [
    {"x":"Acme",   "y": 1.00},
    {"x":"Globex", "y": 0.50},
    {"x":"Initech","y": 0.75}
  ] }] }
```

```chart:harvey-ball@1
{ "title": "Performance",
  "series": [{ "label": "score", "data": [
    {"x":"Acme",   "y": 0.75},
    {"x":"Globex", "y": 1.00},
    {"x":"Initech","y": 0.50}
  ] }] }
```

```chart:harvey-ball@1
{ "title": "Documentation",
  "series": [{ "label": "score", "data": [
    {"x":"Acme",   "y": 0.25},
    {"x":"Globex", "y": 0.75},
    {"x":"Initech","y": 1.00}
  ] }] }
```

The chart spec's `title` becomes the criterion name; the row of balls is
the per-item rating. Stacking 3-5 of these reads like a comparison
table where the cell glyphs are circles.

For SINGLE-figure multi-criterion comparison, switch to `matrix` (heatmap
with cell values) — it natively supports 2-D grids.

## Auto-detected fraction vs percentage

The renderer accepts both `[0, 1]` and `[0, 100]` y values:

```js
if (v > 1) { v = v / 100; }
```

So `y: 0.75` and `y: 75` produce identical balls. This means a typo
won't fail loud — `y: 75` "works" even if the author thought they were
on the 0-1 scale. The accessibility hint: use one convention
consistently within a project. The mining catalog convention is `[0, 100]`
(percentage-like), which matches the McKinsey usage.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: outline ring visible
even when wedge is 0% (no balls "disappear" for missing data); filled
wedge color contrasts with outline on both themes; the 5 canonical fill
levels are visually distinct (25% vs 50% vs 75% should look clearly
different).
