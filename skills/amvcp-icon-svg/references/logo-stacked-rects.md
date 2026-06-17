# Logo block — stacked-rects

## Table of Contents

- [What it renders](#what-it-renders)
- [Scaffold](#scaffold)
- [Geometry](#geometry)
- [Visual reading](#visual-reading)
- [Lib function](#lib-function)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini](#selection--comment--decision-mini)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [Single stacked-rects (a 3-tier brand mark)](#single-stacked-rects-a-3-tier-brand-mark)
  - [Stacked-rects + tint-hierarchy (sibling marks)](#stacked-rects--tint-hierarchy-sibling-marks)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `stacked-rects` logo block is THREE rounded rectangles stacked
top-to-bottom, each one slightly narrower than the one above (22%
narrower per step), and each one in a DIFFERENT tint tier — top is
`tint-hero`, middle is `tint-mid`, bottom is `tint-quiet`. The
canonical "stepped tier" / "hierarchy ladder" / "layered platform"
mark.

## What it renders

Three `<rect>` elements:

```js
var bandH = h / 3;
var tints = ['tint-hero', 'tint-mid', 'tint-quiet'];
for (var i = 0; i < 3; i++) {
  var bw = w * (1 - i * 0.22);       // 100%, 78%, 56% width
  var bx = x + (w - bw) / 2;          // horizontally centered
  var by = y + bandH * i;             // stacked vertically
  // <rect x="bx" y="by" width="bw" height="bandH*0.82"
  //       rx="16" fill="tokenColor(tints[i])"/>
}
```

Each band's height is `bandH * 0.82` (gives an 18% gap between
bands), each band is centered horizontally on the bounding box, and
each band is FILLED with its tint tier — no stroke (the tier
contrast is the visual divider).

## Scaffold

```html
<script type="application/icon-svg+json" id="stacked-rects-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Stacked rects logo block",
  "primitives": [
    { "type": "logo",
      "id": "lg-stack",
      "kind": "stacked-rects",
      "x": 200, "y": 200,
      "w": 600, "h": 600 }
  ]
}
</script>
```

## Geometry

- `w`, `h` — the outer bounding box.
- Band 0 (top, hero tint): width = `w` (full), height = `h/3 * 0.82`.
- Band 1 (middle, mid tint): width = `w * 0.78` (22% narrower),
  height = `h/3 * 0.82`.
- Band 2 (bottom, quiet tint): width = `w * 0.56` (44% narrower),
  height = `h/3 * 0.82`.
- All bands have `rx = 16` (same as `process`).
- All bands are HORIZONTALLY CENTERED on the bounding box.

The narrowing progression `100% / 78% / 56%` is the editorial choice
— a 22% step per band reads as a clear hierarchy. A different step
would either be too subtle (10%) or too dramatic (40%); 22% is the
chosen balance.

## Visual reading

The narrowing pattern reads as:

1. **A platform stack** — three layers of a layered architecture
   (top = presentation, middle = service, bottom = data — the
   classic 3-tier).
2. **A weight hierarchy** — top is heaviest (hero tint), bottom is
   lightest (quiet tint) — but the WIDTH narrowing inverts:
   bottom is narrower despite lighter color. The two cues
   reinforce each other (hierarchy + base shape).
3. **A pyramid in reverse** — a "stepped pyramid" with the wide end
   at the top, like a podium.

The mark is editorial — it says "tiered, ordered, structured"
without saying anything specific. Pair with a domain icon for
specificity.

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.logoStackedRects({
  x: 200, y: 200, w: 600, h: 600, id: 'lg-stack'
});
```

## DESIGN.md tokens consumed

- `--isvg-tint-hero` — top band (= `--vc-color-accent`)
- `--isvg-tint-mid` — middle band (= `color-mix(in oklch, accent
  55%, surface)`)
- `--isvg-tint-quiet` — bottom band (= `color-mix(in oklch, accent
  25%, surface)`)

All three tints are derived from the SAME `--vc-color-accent` token,
so a theme accent change cascades through all three bands
proportionally.

## Selection / comment / decision-mini

The wrapping `<g data-ve-id>` is added by the compiler; the block is
a single `data-ve-type="icon-node"` atom (the three rects are inside
ONE `<g>`, not three separate atoms — the block is a single mark).

## When to use

- A 3-tier architecture mark.
- A "layered system" / "podium" / "stepped ladder" logo.
- A hierarchy mark (top is dominant, bottom is base).
- A progress / leveling indicator (top = top tier, etc.).
- ANY mark where the tier metaphor is the message.

## When NOT to use

- For a 2-tier or 4-tier mark — `stacked-rects` is FIXED AT 3 bands.
- For an asymmetric stack — all bands here are horizontally
  centered.
- For a left-or-right-aligned stack — none of the bands shift
  horizontally; they all share the same center line.
- For a true pyramid — use a `shape: triangle-up` instead.

## Common authoring patterns

### Single stacked-rects (a 3-tier brand mark)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "3-tier platform mark",
  "primitives": [
    { "type": "logo", "id": "lg", "kind": "stacked-rects",
      "x": 250, "y": 100, "w": 500, "h": 800 } ] }
```

### Stacked-rects + tint-hierarchy (sibling marks)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "logo", "id": "a", "kind": "stacked-rects",
      "x":  60, "y": 200, "w": 380, "h": 600 },
    { "type": "logo", "id": "b", "kind": "tint-hierarchy",
      "x": 560, "y": 200, "w": 380, "h": 600 } ] }
```

(The test fixture's `scene-logo-b`.)

## What NOT to do

- Do NOT modify the tint assignments — the hero/mid/quiet ladder is
  the WHOLE point.
- Do NOT add a stroke — the editorial choice is FILL-ONLY (the tint
  contrast is the divider).
- Do NOT change the 3 bands to 4 — fixed at 3; for more bands,
  hand-author a custom `<rect>` series.
- Do NOT mix with `current-color` — C7 throws.

## Visual verification

In both light AND dark, confirm:

- All 3 bands are visible (the quiet tier is the SOFTEST — confirm
  it isn't invisible against the surface).
- The narrowing progression is clear (top is the widest, bottom is
  the narrowest).
- The 3 bands have proportional gaps between them (the 18% gap reads
  as a clear visual separator).
- Each band uses its assigned tint tier (hero / mid / quiet), NOT a
  fallback color.

A common visual bug: an ancient browser without `color-mix` degrades
all 3 tiers to `--vc-color-accent` — and the 3 bands look identical.
This is the documented engine-absent fallback; the contrast difference
is gone but the narrowing-width hierarchy still reads. To verify the
full ladder, run in Chrome / Firefox / Safari ≥ 2023.
