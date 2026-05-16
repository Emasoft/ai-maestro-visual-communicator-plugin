# Node primitive — database (cylinder)

The `database` node is the canonical SQL / KV / cache mark: a
cylindrical container drawn as a single `<path>` (two arcs for the
top ellipse + two side lines + one arc for the bottom front). Filled
with `tint-quiet` (lightest accent tier) so it reads as a tinted
container, not a flat block — distinguishes it visually from the
`process` rect at a glance.

## What it renders

A single `<path>` composed of:

- Top ellipse — two `A` (arc) commands tracing the ellipse front and
  back (`rx = w/2`, `ry = clamp(h * 0.12, 16, 60)` in 1000-units).
- Two side lines — vertical segments from the top ellipse to the
  bottom ellipse front.
- Bottom front arc — a single `A` command tracing the bottom-visible
  arc (the back of the bottom ellipse is occluded).

Plus an optional centered `<text>` label.

```
        _______
      ⟝         ⟞
      |          |
      |   text   |
      |          |
       \________/
```

## Scaffold

```html
<script type="application/icon-svg+json" id="database-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Database cylinder demo",
  "primitives": [
    { "type": "database",
      "id": "users-store",
      "x": 280, "y": 200,
      "w": 440, "h": 600,
      "label": "users", "variant": "info" }
  ]
}
</script>
```

The compiled path looks like (formatted):

```
M x (y+ry)
  A rx ry 0 0 0 (x+w) (y+ry)        — top back arc
  A rx ry 0 0 0  x    (y+ry)        — top front arc
M x (y+ry) L x (y+h-ry)             — left side
M (x+w) (y+ry) L (x+w) (y+h-ry)     — right side
M x (y+h-ry)
  A rx ry 0 0 0 (x+w) (y+h-ry)      — bottom front arc
```

with `rx = w/2` and `ry = clamp(h * 0.12, 16, 60)`.

## Geometry — width, height, ry

The cylinder's PROPORTIONS are driven by `h * 0.12` for the ellipse
ry, clamped to [16, 60] in 1000-space. This range is editorial:

- `h = 150` → `ry = 18` — flat squat cylinder (small badge).
- `h = 300` → `ry = 36` — balanced standard cylinder (the typical
  data-store mark).
- `h = 600` → `ry = 60` (clamped) — tall storage tank (a big DB).

`rx` is always `w / 2`, so the cylinder is as wide as the bounding
box. A square `w == h` cylinder reads round-tubed; a tall narrow
`w < h` cylinder reads jar-like; a flat wide `w > h` cylinder reads
disk-like.

## Variants

| `variant` | stroke color |
|---|---|
| `default` (omitted) | `var(--vc-color-content, #1f1a14)` — ink |
| `success` | `var(--vc-color-success, #3a6b5c)` |
| `warning` | `var(--vc-color-warning, #a8791f)` |
| `danger` | `var(--vc-color-danger, #a84a32)` |
| `info` | `var(--vc-color-info, #3464a8)` |

The fill stays `tint-quiet` regardless of variant — the variant
changes only the stroke. To re-tint the FILL too, route to the
`logo` `tint-hierarchy` primitive, which is built for stronger
accent emphasis.

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.nodeDatabase({
  x: 280, y: 200, w: 440, h: 600,
  label: 'users', variant: 'info'
});
```

The builder returns the `<path>` + the `<text>` label, NO wrapping
`<g>`. The compiler adds the `<g data-ve-id>` selection scaffold.

## DESIGN.md tokens consumed

- `--vc-color-content` — default stroke + label fill
- `--vc-color-{success|warning|danger|info}` — variant stroke
- `--isvg-tint-quiet` (derived from `--vc-color-accent`) — the
  cylinder fill
- `--vc-font-body` — label font family

## Selection / comment / decision-mini

Same as every primitive: `data-ve-id`, `data-ve-type="icon-node"`,
`data-ve-comment-id`, `data-ve-label`, and an auto-attached decision
mini-pill.

## When to use

- A SQL table (`users`, `orders`, `posts`).
- A key-value store (`redis:sessions`).
- A cache (`cdn`, `varnish`).
- A queue (use `network` if the queue is distributed; database for a
  classic durable queue).
- A file blob store (`s3:archive`).
- ANYTHING the reader should read as "stored data, not in-flight
  data".

A `database` paired with a `process` reads as "stage → store"; a
`database` paired with a `network` reads as "local store → cloud
sync".

## When NOT to use

- For a generic "block" with no storage semantic — that's `process`.
- For a decision point — that's `decision`.
- For an external dependency that happens to be a database — that's
  `external` (dashed border = "out of our boundary").
- For a cloud / SaaS storage tier — that's `network` (cloud
  silhouette).

## Common authoring patterns

### Single database hero

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Postgres users table",
  "primitives": [
    { "type": "database", "id": "users", "x": 200, "y": 100,
      "w": 600, "h": 800, "label": "users (12.4M rows)" } ] }
```

### Two databases side-by-side (primary + replica)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "database", "id": "primary", "x":  60, "y": 200,
      "w": 400, "h": 600, "label": "primary",  "variant": "success" },
    { "type": "database", "id": "replica", "x": 540, "y": 200,
      "w": 400, "h": 600, "label": "replica",  "variant": "info" } ] }
```

### Process → database mini-flow

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "process",  "id": "wr",  "x":  60, "y": 380,
      "w": 380, "h": 240, "label": "Write" },
    { "type": "database", "id": "db",  "x": 560, "y": 200,
      "w": 380, "h": 600, "label": "users" } ] }
```

(If you actually need the ARROW between them, route to the `diagram`
skill — icon-svg does not draw edges.)

## What NOT to do

- Do NOT override the fill — the cylinder's `tint-quiet` fill is what
  makes it visually distinct from `process`. Overriding kills the
  semantic difference.
- Do NOT set `h < 80` — the cylinder needs vertical room for the top
  + body + bottom ellipses; a flat database reads as a coin.
- Do NOT set `w > 1.5 * h` — a database wider than ~1.5x its height
  starts to read like a horizontal disk; use a vertical aspect for
  most uses.

## Visual verification

In both light AND dark themes, confirm:

- The cylinder's `tint-quiet` fill is visible (NOT 100% transparent,
  NOT 100% the surface color).
- The ink stroke is visible against the tint fill.
- The top ellipse's front + back arcs read as a single solid ellipse
  (not two separate lines).
- The bottom front arc is visible (not occluded by the side lines).

See `skills/amvcp-self-debug-rules/SKILL.md` for the per-rule check
list.
