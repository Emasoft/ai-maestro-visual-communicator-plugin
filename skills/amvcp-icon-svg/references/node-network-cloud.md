# Node primitive — network (cloud silhouette)

## Table of Contents

- [What it renders](#what-it-renders)
- [Scaffold](#scaffold)
- [Geometry — width-to-height ratio](#geometry--width-to-height-ratio)
- [Variants](#variants)
- [Lib function](#lib-function)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini](#selection--comment--decision-mini)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [Single cloud hero](#single-cloud-hero)
  - [Three clouds (multi-region edge)](#three-clouds-multi-region-edge)
  - [Process → network mini-architecture](#process--network-mini-architecture)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `network` node is the cloud / CDN / distributed-system mark: a
cloud silhouette drawn as a single `<path>` of three overlapping arcs
that form a classic puff-pastry skyline at the bottom of the node
box. Filled with `tint-quiet` (same family as `database`), ink-stroked.
The visual idiom for "this is in the cloud, not on a specific box".

## What it renders

A single `<path>` with 3 connected `A` (arc) commands:

```
            ___
        ___/   \___
      _/           \_
     /               \
    |   (puff/cloud   |
     \                /
      \______________/
```

The path geometry:

```js
var baseY = y + h * 0.78;     // the cloud sits in the bottom 22%
var r1 = h * 0.30;            // left arc radius
var r2 = h * 0.40;            // center arc radius (bigger puff)
var r3 = h * 0.30;            // right arc radius
var d =
  'M' + (x + w * 0.12) + ' ' + baseY +
  ' A' + r1 + ' ' + r1 + ' 0 0 1 ' + (x + w * 0.34) + ' '
       + (y + h * 0.30) +
  ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + (x + w * 0.70) + ' '
       + (y + h * 0.34) +
  ' A' + r3 + ' ' + r3 + ' 0 0 1 ' + (x + w * 0.88) + ' '
       + baseY +
  ' Z';
```

Three arcs of increasing-then-decreasing radius across the top, then
`Z` to close the path back to the start — a complete cloud silhouette
in one `<path>`. Plus an optional centered `<text>` label.

## Scaffold

```html
<script type="application/icon-svg+json" id="network-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Edge CDN node",
  "primitives": [
    { "type": "network",
      "id": "edge",
      "x": 200, "y": 200,
      "w": 600, "h": 600,
      "label": "Cloudflare", "variant": "info" }
  ]
}
</script>
```

The label sits at `y + h/2` per the standard `labelText()` formula,
which is roughly the center of the cloud-shape's body (the cloud's
bottom-third is filled, so the label is centered in the upper
two-thirds of the cloud).

## Geometry — width-to-height ratio

The cloud is authored to fill `w x h` proportionally. The arcs scale
with `h`, so:

- `w = h` (square) — cloud is a balanced 3-puff silhouette.
- `w > h` (wide) — cloud is flat / horizontal CDN-edge banner.
- `w < h` (tall) — cloud reads as a vertical thunderhead, less
  canonical but legal.

Recommended ratios:

- Standard cloud: `w = h` (e.g. 380 x 380).
- Wide CDN banner: `w = 1.5 * h` (e.g. 600 x 400).
- Compact icon: `w = h = 200` (small mark).

## Variants

| `variant` | stroke color |
|---|---|
| `default` (omitted) | `var(--vc-color-content, #1f1a14)` — ink |
| `success` | `var(--vc-color-success, #3a6b5c)` |
| `warning` | `var(--vc-color-warning, #a8791f)` |
| `danger` | `var(--vc-color-danger, #a84a32)` |
| `info` | `var(--vc-color-info, #3464a8)` |

Fill is always `tint-quiet` (lightest accent tier). Variant changes
the stroke only.

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.nodeNetwork({
  x: 200, y: 200, w: 600, h: 600,
  label: 'Cloudflare', variant: 'info'
});
```

## DESIGN.md tokens consumed

- `--vc-color-content` — default stroke + label fill
- `--vc-color-{success|warning|danger|info}` — variant stroke
- `--isvg-tint-quiet` — cloud fill
- `--vc-font-body` — label font family

## Selection / comment / decision-mini

Same as every primitive: wrapping `<g data-ve-id>` + decision pill.

## When to use

- A CDN edge (`Cloudflare`, `Fastly`, `Vercel Edge`).
- A managed PaaS (`Vercel`, `Heroku`, `Render`).
- A cloud function (`AWS Lambda`, `Cloudflare Worker`).
- A managed message bus (`SNS`, `Pub/Sub`).
- A distributed cache (`Cloudflare KV`, `Upstash`).
- ANYTHING the reader should read as "in the cloud, not pinned to a
  specific machine".

## When NOT to use

- For a single classical server — that's `process`.
- For a SQL / KV store — that's `database` (even when hosted in the
  cloud; the SHAPE is database, the LOCATION is incidental).
- For a vendor service the team doesn't own — that's `external`.
- For a generic "internet" cloud spanning a whole diagram — draw
  multiple specific `network` nodes instead of one giant cloud
  containing everything.

## Common authoring patterns

### Single cloud hero

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Cloudflare edge",
  "primitives": [
    { "type": "network", "id": "edge", "x": 200, "y": 200,
      "w": 600, "h": 600, "label": "Cloudflare" } ] }
```

### Three clouds (multi-region edge)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "network", "id": "iad", "x":  60, "y": 380,
      "w": 280, "h": 240, "label": "iad" },
    { "type": "network", "id": "lhr", "x": 360, "y": 380,
      "w": 280, "h": 240, "label": "lhr" },
    { "type": "network", "id": "nrt", "x": 660, "y": 380,
      "w": 280, "h": 240, "label": "nrt" } ] }
```

(Three identical clouds with `<defs><use>` reuse — see
`references/defs-use-reuse-pass.md`.)

### Process → network mini-architecture

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "process", "id": "wr",  "x":  60, "y": 380,
      "w": 380, "h": 240, "label": "Worker" },
    { "type": "network", "id": "cdn", "x": 560, "y": 280,
      "w": 380, "h": 440, "label": "CDN cache" } ] }
```

## What NOT to do

- Do NOT override the fill — the `tint-quiet` fill is the readable
  cloud body. Forcing `none` makes the silhouette ambiguous.
- Do NOT set `h < 200` — below this the three arcs start to overlap
  too much and read as a single puff (use a smaller cloud at a
  smaller h ratio).
- Do NOT use network for an on-prem server cluster — use `process`
  (rack) or several `process` nodes; cloud strongly implies "managed,
  off-prem, distributed".
- Do NOT pile multiple labels on one cloud — a cloud should label
  ONE service. For multiple services on the same edge, draw multiple
  clouds OR switch to a `diagram` skill `group` to outline them
  together.

## Visual verification

In both light AND dark, confirm:

- The three arcs are clearly distinct puffs (not a solid hump).
- The `tint-quiet` fill is visible against the surface.
- The stroke is ink (or variant color) at hairline weight.
- The label sits IN the cloud body, not above or below it.

A common authoring pitfall: at small sizes the three arcs visually
merge. Bump the size up (`h >= 240`) to keep the silhouette readable
as a cloud, not a blob.
