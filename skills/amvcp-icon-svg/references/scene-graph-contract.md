# Scene-graph JSON contract

The declarative input to `buildSceneSvg(scene)`. The agent emits this
document; `amvcp-icon-svg.js` compiles it to a themed, lint-clean,
`data-ve-id`-tagged `<svg>` string. Pure function — no DOM, no
side-effect, no random — the same input always produces the same SVG.

## The authoring surface

Two equivalent embeddings — pick whichever the page's markdown
pipeline tolerates better. Both are picked up by `init()` and replaced
in place with the compiled `<figure><svg>...</svg></figure>`.

### Form A — `<script type="application/icon-svg+json">`

```html
<script type="application/icon-svg+json" id="hero">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Pipeline stages",
  "primitives": [
    { "type": "process",  "id": "in",  "x": 60,  "y": 380,
      "w": 280, "h": 240, "label": "Ingest" },
    { "type": "decision", "id": "v",   "x": 360, "y": 380,
      "w": 280, "h": 240, "label": "Valid?",  "variant": "warning" },
    { "type": "process",  "id": "out", "x": 660, "y": 380,
      "w": 280, "h": 240, "label": "Persist", "variant": "success" }
  ]
}
</script>
```

### Form B — fenced code block

````
```icon-svg
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Pipeline stages",
  "primitives": [ /* same as above */ ]
}
```
````

Both forms are equivalent at the compiler level; pick by what your
markdown pipeline already does well. Fenced blocks survive a wider
range of markdown processors; `<script>` blocks survive a stricter
sanitizer.

## SceneGraph schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `viewBox` | `[0, 0, 1000, 1000]` | yes | MUST be exactly this — the hairline + 4-unit-grid invariants are only meaningful here |
| `id` | string | no | becomes the scene's `data-ve-id`; auto-synthesized when absent |
| `ariaLabel` | string | no | the `<svg aria-label>` value; defaults to "Authored diagram" |
| `label` | string | no | synonym for `ariaLabel` |
| `primitives` | Primitive[] | yes | at least one primitive |

## Primitive — three kinds

Every primitive shares the geometric envelope `{x, y, w, h}` in the
1000-space. All four are MANDATORY and must be finite numbers
(`Infinity`, `NaN`, `"42"` string-numbers throw). `w` and `h` MUST be
positive after grid-snapping.

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `"process" \| "database" \| "decision" \| "external" \| "network" \| "logo" \| "shape"` | yes | the primitive family |
| `id` | string | yes | unique within the scene; becomes a `data-ve-id` |
| `x`, `y` | number | yes | top-left in the 1000-space |
| `w`, `h` | number | yes | width / height in the 1000-space |
| `label` | string | no | centered text inside the primitive (nodes only) |
| `variant` | `"default" \| "success" \| "warning" \| "danger" \| "info"` | no | semantic stroke role (nodes only); default = `"default"` |
| `kind` | string | yes for `logo` / `shape` | which logo or shape (see below) |
| `fill` | string | no | shape primitives only — overrides default `accent` |

### type: "process" / "database" / "decision" / "external" / "network"

The five **structural node primitives**. Each is one shape:

- `process` — rounded rect (`rx = ry = 16`), no fill, ink stroke.
- `database` — cylinder (a single `<path>` with two arcs), `tint-quiet`
  fill, ink stroke.
- `decision` — diamond (`<polygon>` with 4 points on the grid), no
  fill, ink stroke.
- `external` — DASHED rounded rect (`stroke-dasharray="16 12"`), no
  fill, muted stroke (or `variant` stroke when set).
- `network` — cloud silhouette (a single `<path>` of 3 overlapping
  arcs), `tint-quiet` fill, ink stroke.

The stroke ladder for the `variant` is:
`success → --vc-color-success`, `warning → --vc-color-warning`,
`danger → --vc-color-danger`, `info → --vc-color-info`,
`default → --vc-color-content`.

### type: "logo", kind: ...

The six **logo composition blocks**. `kind` discriminates:

- `mask-cutout` — `<defs><mask>` with a white rect keep + a black
  circle subtract; outer accent rounded rect carries
  `mask="url(#id)"`.
- `arc-bite` — `<path>` rounded body with an `A` carving a crescent
  bite out of one corner.
- `zig-zag` — alternating up/down teeth across the bottom edge.
- `stacked-rects` — 3 rects of decreasing width, each a different
  tint tier.
- `tint-hierarchy` — a hero circle + two supporting circles in the
  lighter tiers.
- `current-color` — the one all-currentColor diamond (a mark that
  inherits its color from the wrapper's `color` property).

The `current-color` mark is the C7 reason logos cannot mix
all-currentColor and explicit-token primitives in the SAME scene —
put `current-color` in its own scene-figure.

### type: "shape", kind: ...

The six **decorative shapes**. Inside a scene-graph each shape compiles
to a filled `<polygon>`; the standalone CSS-only path is the `.isvg-
shape-<kind>` class library (zero SVG, zero JS — see
`references/shape-triangle-up.md` and siblings).

- `triangle-up`
- `arrow-right`
- `chevron`
- `parallelogram`
- `hexagon`
- `star`

`fill` defaults to `"accent"`; any other token name (`"info"`,
`"tint-mid"`, etc.) overrides.

## Validation — fail-fast

The compiler throws a hard `Error` on the first violation; the runtime
catches the throw at the per-block boundary and paints a red error
placeholder into THAT figure. The rest of the page continues to
compile.

Throws on:

- `viewBox` not exactly `[0, 0, 1000, 1000]`.
- `primitives` not an array.
- A primitive missing `x` / `y` / `w` / `h` or any of them non-finite.
- A primitive with non-positive `w` or `h` after snapping.
- An unknown `type` (`"primary"`, `"square"`, etc.).
- An unknown `variant` for a node (`"critical"`, `"highlight"`, etc.).
- An unknown `kind` for a logo / shape.
- A duplicate `id` within the scene.
- A non-auto-fixable lint violation in the compiled SVG (C1 / C4 / C5 /
  C6 / C7 — see `references/lint-c1-to-c7.md`).

## Auto-fixes (silent — no throw)

- C2 — `rx` / `ry` greater than the cap (36 in 1000-space) is clamped.
- C3 — non-grid coordinates are snapped to the nearest 4-unit multiple
  before any builder sees them.

These two never raise; they appear in the `report.autofixed[]` array
returned by `lintSvg()` so dev-mode introspection sees them.

## A worked example — five-node showcase

```html
<script type="application/icon-svg+json" id="five-nodes">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "All five structural node primitives",
  "primitives": [
    { "type": "process",  "id": "p1", "x": 60,  "y": 60,
      "w": 380, "h": 150, "label": "Ingest" },
    { "type": "database", "id": "d1", "x": 560, "y": 60,
      "w": 380, "h": 230, "label": "Store", "variant": "info" },
    { "type": "decision", "id": "x1", "x": 320, "y": 360,
      "w": 320, "h": 280, "label": "Valid?", "variant": "warning" },
    { "type": "external", "id": "e1", "x": 60,  "y": 740,
      "w": 380, "h": 180, "label": "Vendor API" },
    { "type": "network",  "id": "n1", "x": 560, "y": 700,
      "w": 380, "h": 240, "label": "CDN", "variant": "success" }
  ]
}
</script>
```

The compiled output is one `<svg viewBox="0 0 1000 1000" role="img"
tabindex="0" data-ve-id="five-nodes" data-ve-type="icon-svg">
...</svg>` containing five `<g data-ve-id="p1|d1|x1|e1|n1">` selection
atoms, each tinted off the DESIGN.md palette, hairline-stroked,
4-unit-grid-snapped, lint-clean.

## The `<defs><use>` reuse pass

When the same node `type` + size + variant + label appears MORE THAN
TWICE, the compiler hoists the shape to a `<defs><g id="isvg-def-N">`
once and emits a `<use href="#isvg-def-N" x="..." y="...">` at each
occurrence. This keeps a 5-node showcase compact (5x the markup, no
reuse) AND a 12-node identical-process-step lane DRY (one `<defs>` +
12 `<use>`). See `references/defs-use-reuse-pass.md`.

## The selection / comment / decision-pill scaffold

Every primitive emits:

```html
<g data-ve-id="<id>"
   data-ve-type="icon-node"
   data-ve-comment-id="icon-node:<id>"
   data-ve-label="<label or kind>">
  <!-- the primitive's SVG fragment -->
</g>
```

And the scene's outer `<svg>` carries:

```html
<svg ...
     data-ve-id="<scene id>"
     data-ve-type="icon-svg"
     data-ve-comment-id="icon-svg:<scene id>"
     data-ve-label="<ariaLabel>"
     tabindex="0"
     role="img"
     aria-label="<ariaLabel>">
  ...
</svg>
```

The runtime's click handler picks up every `data-ve-id`, the per-atom
keyboard comment fallback (Ctrl-+) uses `data-ve-comment-id`, and the
decision-pill helper attaches a 3-radio Skip / Approve / Deny mini-pill
to every atom on init. See `references/data-ve-id-selection.md` and
`references/decision-mini-pill.md`.
