# Node primitive — process (rounded rect)

The `process` node is the workhorse of every authored scene: a rounded
rectangle, hairline-stroked, no fill, with a centered label. Maps to
"a step", "a stage", "a function", "a service", "a generic block" —
anything that fits a rectangle without further semantics.

## What it renders

A single `<rect>`:

- `rx = ry = 16` in 1000-space (well under the C2 cap of 36 — a soft
  editorial radius, not a pill, not a bubble).
- `fill = "none"` (the editorial style is OUTLINE only — never a
  flat colored block).
- `stroke = var(--vc-color-content, #1f1a14)` by default, or the
  variant's semantic role when `variant` is set.
- `stroke-width = 2` in 1000-space — hairline at any rendered size.

Plus an optional centered `<text>` label.

## Scaffold

```html
<script type="application/icon-svg+json" id="process-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Process node demo",
  "primitives": [
    { "type": "process",
      "id": "ingest",
      "x": 250, "y": 380,
      "w": 500, "h": 240,
      "label": "Ingest" }
  ]
}
</script>
```

Compiles to (whitespace added):

```html
<svg viewBox="0 0 1000 1000" role="img" tabindex="0"
     class="isvg-scene"
     data-ve-id="process-demo" data-ve-type="icon-svg"
     data-ve-comment-id="icon-svg:process-demo"
     data-ve-label="Process node demo"
     aria-label="Process node demo">
  <g data-ve-id="ingest" data-ve-type="icon-node"
     data-ve-comment-id="icon-node:ingest"
     data-ve-label="Ingest">
    <rect x="252" y="380" width="500" height="240"
          rx="16" ry="16"
          fill="none"
          stroke="var(--vc-color-content, #1f1a14)"
          stroke-width="2"/>
    <text x="502" y="500" text-anchor="middle"
          dominant-baseline="central"
          font-family="var(--vc-font-body, system-ui, sans-serif)"
          font-size="48"
          fill="var(--vc-color-content, #1f1a14)">Ingest</text>
  </g>
</svg>
```

Note that `x = 250` was snapped to `252` (the nearest multiple of 4
that is ≥ 250 round-trips to 252 via `Math.round(250 / 4) * 4 =
252`); this is the C3 auto-fix happening silently.

## Variants

| `variant` | stroke color | When to use |
|---|---|---|
| `default` (omitted) | `var(--vc-color-content, #1f1a14)` — ink | unmarked process |
| `success` | `var(--vc-color-success, #3a6b5c)` | completed / healthy step |
| `warning` | `var(--vc-color-warning, #a8791f)` | needs attention |
| `danger` | `var(--vc-color-danger, #a84a32)` | failure / error step |
| `info` | `var(--vc-color-info, #3464a8)` | informational / read-only step |

The variant changes ONLY the stroke; the fill stays `none`. To
re-color the fill, switch to a `logo` primitive or hand-author an
override (which will lint-fail unless you tag the scene as a logo).

## Geometry — what `w` and `h` mean

`w` and `h` are the rendered rectangle dimensions in the 1000-space.
Authoring suggestions:

- Compact process (a single noun): w=280, h=150 (small lozenge).
- Standard process (one or two words): w=380, h=180 (the test
  fixture's default).
- Wide process (a short sentence): w=500, h=240 (the demo above).
- Tall process (text wraps in label conceptually — though SVG won't
  wrap it for you): h up to 360 before the rectangle reads as a wall.

The text size scales with `h`: `font-size = max(28, round(h * 0.20))`
in 1000-space. A 150-tall process renders the label at 30; a 240-tall
process renders the label at 48; a 360-tall process renders the
label at 72. Authoring tip: text fits when the label is ≤ 12
characters at standard widths; longer labels need a wider w.

## Lib function (directly callable)

The pure builder is exposed as `builders.nodeProcess`:

```js
var amvcpIconSvg = require('/path/to/amvcp-icon-svg.js');
var fragment = amvcpIconSvg.builders.nodeProcess({
  x: 252, y: 380, w: 500, h: 240,
  label: 'Ingest', variant: 'default'
});
// fragment is the inner SVG markup (the <rect> + <text>), NO wrapping <g>
```

The wrapping `<g data-ve-id>` is added by the compiler in
`compilePrimitive(prim, id, …)`. To use the builder standalone (in a
custom container), wrap it yourself with `<g data-ve-id="…">`.

## DESIGN.md tokens consumed

- `--vc-color-content` — default stroke + label fill
- `--vc-color-{success|warning|danger|info}` — variant stroke
- `--vc-font-body` — label font family

A theme toggle restyles every process node on the page automatically.

## Selection / comment / decision-mini

Every `process` node automatically gets:

- `data-ve-id="<id>"` on the wrapping `<g>` — selection atom
- `data-ve-type="icon-node"` — kind hint for the runtime's payload
- `data-ve-comment-id="icon-node:<id>"` — scope key for the Ctrl-+
  keyboard comment-thread fallback
- `data-ve-label="<label>"` — friendly name in the click payload (when
  `label` is set)
- A 3-radio Skip / Approve / Deny mini-pill attached by
  `attachDecisionMinisToAtoms()` at the end of `compileFencedBlocks()`
  (independent of selection state — see
  `references/decision-mini-pill.md`)

The author writes 6 fields of JSON; the runtime gets a full
click-to-comment, selectable, decidable atom.

## Common authoring patterns

### One process — a labelled rect for a hero figure

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "process", "id": "p", "x": 100, "y": 400,
      "w": 800, "h": 200, "label": "Make it work" } ] }
```

### Three processes — a manual lane

Auto-layout lives in the `diagram` skill, not here. To show three
processes in a row in icon-svg, author all three coordinates by hand:

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "process", "id": "a", "x":  60, "y": 380,
      "w": 280, "h": 240, "label": "Ingest" },
    { "type": "process", "id": "b", "x": 360, "y": 380,
      "w": 280, "h": 240, "label": "Transform", "variant": "warning" },
    { "type": "process", "id": "c", "x": 660, "y": 380,
      "w": 280, "h": 240, "label": "Persist", "variant": "success" } ] }
```

If you need automatic placement + edges, route to the `diagram` skill
with `preset: "process-flow"` instead.

### Eight identical processes — the `<defs><use>` path

When you author 8 process nodes with the same w / h / variant /
label, the compiler hoists the shape into `<defs>` once and emits 8
`<use>` instances. See `references/defs-use-reuse-pass.md`.

## What NOT to do

- Do NOT supply a `fill` — process is OUTLINE only. The compiler
  ignores it; lintSvg flags any author-pasted SVG with a filled
  process.
- Do NOT exceed `stroke-width = 2` — C1 hairline cap throws.
- Do NOT set `rx > 36` — auto-fix clamps silently but the shape
  starts to read as a pill (use `logo` `stacked-rects` for a pill).
- Do NOT use process for a database (cylinder) or a decision (diamond)
  — pick the right primitive type so the semantic role is correct.

## Visual verification

Render in light AND dark, confirm:

- Stroke is the ink color in both themes (matches `--vc-color-content`).
- Variant stroke matches the role color.
- Label is readable, centered, vertically in the middle.
- Hover state shows the runtime's selection ring (the `<g
  data-ve-id>` is picked up by the runtime's
  `svg g[data-ve-id]:hover > rect` CSS).

Run `skills/amvcp-self-debug-rules/SKILL.md` R1 (light + dark) and R4
(selection atom) after authoring a new process node.
