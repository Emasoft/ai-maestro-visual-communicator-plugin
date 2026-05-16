# `chart:segmented-bar@1` — CSS-flex segmented bar

A horizontal bar where each part-of-a-whole renders as a flex segment whose
`flex-grow` equals its value. No SVG — pure CSS Flexbox. The cheapest
possible part-to-whole visualization in terms of DOM weight and code path.

## When to choose segmented-bar

Use `segmented-bar` when:

- You have ONE part-to-whole breakdown (≤ 6 parts typical).
- You want minimal visual chrome — no axes, no gridlines, no legend overhead.
- The visualization sits INSIDE a larger block (a card, a list item, a status panel) and an SVG `<figure>` would be overkill.
- You want each segment to carry its own LABEL inside the bar when wide enough.

Pick `donut` instead when the breakdown is the page's centerpiece and a
circular form is appropriate.
Pick `stacked-bar` (1-column) when you want gridlines / a y-axis / a more
"chart-like" feel.
Pick `mekko` instead when you need MANY part-to-whole columns side by side.

## Authoring shape

```chart:segmented-bar@1
{
  "title": "Disk usage",
  "subtitle": "112 GB allocated of 128 GB",
  "series": [{ "label": "usage", "data": [
    {"x":"Documents","y":42},
    {"x":"Media","y":28},
    {"x":"Backups","y":18},
    {"x":"Free","y":12}
  ] }]
}
```

- Same `series[i].data[k].{x,y}` shape as the bar family.
- The runtime sums every y to compute the total; each segment's `flex-grow` is set to its own y so the segments distribute proportionally without manual percentage math.
- A label is shown INSIDE each segment when it is wide enough; narrower segments hide their label automatically (ellipsis truncation).

## Options

| Key | Default | Effect |
|---|---|---|
| `valueLabels` | n/a | Not used — the per-segment label IS the value affordance. The hover tooltip shows the exact value + percentage. |
| `sortDescending` | n/a | Author-side. Sort the `data` array yourself; the segmented-bar paint order = array order. |

## Examples

### 1. Storage breakdown

```chart:segmented-bar@1
{ "title": "Storage usage by category",
  "series": [{ "label": "GB", "data": [
    {"x":"Documents","y":42}, {"x":"Media","y":28},
    {"x":"Backups","y":18}, {"x":"Apps","y":11},
    {"x":"Free","y":9}
  ] }] }
```

### 2. Budget split (3 categories)

```chart:segmented-bar@1
{ "title": "FY25 budget split",
  "series": [{ "label": "split", "data": [
    {"x":"R&D","y":40},
    {"x":"Sales","y":35},
    {"x":"Ops","y":25}
  ] }] }
```

(This is the same shape `pie` would coerce into — see
`chart-pie-guardrail.md`. Segmented-bar is a better choice than pie for
3-part-of-a-whole.)

### 3. Inline part-to-whole (small)

For a small segmented bar inside a card or a list item, the chart still
fills its parent container — it's `width: 100%; height: 40px`. Wrap it in
a `<div style="width: 240px">` to shrink it; the bar adapts via Flexbox.

## What the runtime emits

```html
<figure class="ve-chart"
        data-ve-chart-type="segmented-bar"
        data-ve-chart-backend="css"
        data-ve-id="ve-chart-N">
  <figcaption class="ve-chart-title">…</figcaption>
  <div class="ve-chart-segmented">
    <div class="ve-chart-segment"
         style="flex-grow: 42; background: …;"
         title="Documents: 42 (38%)"
         data-ve-id="ve-chart-N-d0-i0" data-ve-type="chart-point" …>
      <span class="ve-chart-segment-label">Documents</span>
    </div>
    <div class="ve-chart-segment" style="flex-grow: 28; …" …>…</div>
    …
  </div>
  <ul class="ve-chart-legend">…</ul>
</figure>
```

Note: the figure carries `data-ve-chart-backend="css"` — this is the only
chart type that uses the CSS backend (no SVG, no Canvas). The selection
contract is identical: each `<div class="ve-chart-segment">` is a
`chart-point` atom.

## Lib functions called

`renderCssSegmentedBar(spec, 'segmented-bar', fig)`:

- Compute the total `Σ y` (default 1 to avoid divide-by-zero).
- Create a `<div class="ve-chart-segmented">` track.
- For each datum, create a `<div class="ve-chart-segment">` with `flex-grow = y`, background from `palette(n)`, `title` = label + value + percentage, and `markPoint(seg, …)` for the atom contract.
- Append a label span inside each segment (`<span class="ve-chart-segment-label">…</span>`) — CSS handles ellipsis truncation when the segment is too narrow.
- Append a legend below via `_appendLegend(fig, labels, colors)`.

The CSS for the track + segments:

```css
.ve-chart-segmented {
  display: flex; width: 100%; height: 40px;
  border-radius: var(--vc-radius-md, 8px); overflow: hidden;
}
.ve-chart-segment {
  display: flex; align-items: center; justify-content: center;
  min-width: 0; cursor: pointer;
  transition: filter var(--vc-duration-fast, 120ms) ease;
}
.ve-chart-segment:hover { filter: brightness(1.08); }
.ve-chart-segment-label {
  font-size: var(--vc-text-0, 12px);
  color: var(--vc-color-on-accent, #ffffff);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
```

The `min-width: 0` on each segment is critical — without it, narrow
segments overflow instead of ellipsis-truncating.

## DESIGN.md tokens

| Token | Used for |
|---|---|
| `--vc-radius-md` | Track corner radius. |
| `--vc-color-on-accent` | Segment label text color. |
| `--vc-color-content`, `--vc-color-content-muted` | Title, subtitle, source. |
| `--vc-text-0` | Segment label size. |
| `--vc-duration-fast` | Hover transition. |

Segment fills come from `palette(n)` — golden-angle distinct OKLCH on top of
`--vc-color-accent`.

## Selection / atoms

Each segment is a `chart-point` atom. Selecting a segment toggles the
selected state (segment paints with the accent stroke; the figure gets the
outer ring). The group comment-handle mounts at the left edge of the
`<figure>` — same contract as every other chart type.

The selection payload's `data.value` is the raw `y` (the segment's flex-
grow), NOT the percentage — readers may want the raw count when commenting.

## Anti-patterns

- **Authoring a `pie` chart instead.** `pie` is remapped to a sorted `bar` — for part-of-a-whole, prefer `segmented-bar` (it is both simpler and conveys "part of a whole" without the polar geometry).
- **More than ~6 segments.** The segment labels become unreadable; consider a `donut` (which can have a center text + a separate legend) or split the data.
- **Mixing units.** Like every chart, segments must share a unit. Don't mix `% of users` with `count of sessions`.
- **Authoring a "100%" without checking.** Segmented-bar normalises by the SUM of y values; if the values don't sum to 100, the segments still proportion correctly but the reader who expects 100% will see "wrong" widths. Add a subtitle clarifying the total.

## Visual verification

Verify in `skills/amvcp-self-debug-rules/SKILL.md`: segment label visibility
at narrow widths (ellipsis truncation kicks in), segment color contrast
between adjacent segments on both themes.
