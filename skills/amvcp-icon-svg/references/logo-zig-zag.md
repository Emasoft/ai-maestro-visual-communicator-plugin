# Logo block — zig-zag

The `zig-zag` logo block is a single `<path>` with a SAW-TOOTHED
bottom edge. Six teeth alternating up/down across the bottom 22% of
the rect; the top 78% is a plain accent-filled rectangle. Reads as a
"torn paper" / "perforated edge" / "ticket stub" / "comb" mark.

## What it renders

A single `<path>` with:

- Top edge — straight line `M x y L (x+w) y`.
- Right edge — straight line down to the start of the tooth band.
- Six alternating teeth across the bottom edge (`teeth = 6`, `step =
  w / 6`), each tooth a pair of `L` commands: one going DOWN to the
  full bottom, one coming UP to the tooth band top (`y + h * 0.78`).
- Left edge — straight line back to the start.
- Closing `Z`.

```js
var teeth = 6;
var step = w / teeth;
var topTooth = y + h * 0.78;   // tooth band starts here
var botTooth = y + h;          // tooth band ends here (page edge)
```

The result is a rect with six "up-down" sawteeth along the bottom —
visually like a torn paper edge.

## Scaffold

```html
<script type="application/icon-svg+json" id="zig-zag-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Zig-zag logo block",
  "primitives": [
    { "type": "logo",
      "id": "lg-zig",
      "kind": "zig-zag",
      "x": 250, "y": 250,
      "w": 500, "h": 500 }
  ]
}
</script>
```

## Geometry

- `w`, `h` — the rect's outer dimensions.
- Teeth count: 6 (hard-coded — looks balanced at all sizes).
- Tooth band: bottom 22% of the rect (`y + h*0.78` to `y + h`).
- Tooth pitch: `w / 6` per tooth.

A `w = h` mark has square-ish teeth. A `w >> h` rect (very wide)
gives stretched horizontal teeth (each tooth is wider than it is
tall). A `w << h` rect (very tall) gives narrow tall teeth.

## Why 6 teeth, not parametric?

The icon-svg engine is OPINIONATED about logo aesthetics: the editorial
8-point grid + the C4 4-color cap + the 22% tooth band + the 6-teeth
count are all DELIBERATELY fixed. A parametric "teeth count" knob
would invite "9 teeth, 12 teeth, 18 teeth" experiments that don't
look like a coherent logo system. Six teeth is the editorial choice;
to vary tooth count, hand-author a `<path>` with the count you need
(but that's no longer a logo BLOCK, that's a custom shape).

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.logoZigZag({
  x: 250, y: 250, w: 500, h: 500, id: 'lg-zig'
});
```

## DESIGN.md tokens consumed

- `--vc-color-accent` — the fill (the visible "torn paper" color)

## When to use

- A ticket stub / coupon mark.
- A torn-paper edge as a decorative bottom border.
- A "this is rough / scrappy / handmade" aesthetic.
- A perforated edge mark (stamps, tickets, packaging).
- A receipt mark.

## When NOT to use

- For a clean editorial mark — `tint-hierarchy` or `stacked-rects`
  read smoother.
- For an actual saw blade or gear — those have specific TOOTH
  PROFILES; this is a stylized aesthetic edge.
- For a wave / undulating edge — that's a different shape entirely;
  hand-author a `<path>` with `Q` (quadratic Bezier) commands.

## Common authoring patterns

### Single zig-zag (a ticket-style brand mark)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Ticket logo",
  "primitives": [
    { "type": "logo", "id": "lg", "kind": "zig-zag",
      "x": 200, "y": 300, "w": 600, "h": 400 } ] }
```

### Zig-zag in a logo gallery

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "logo", "id": "a", "kind": "mask-cutout",
      "x":  40, "y": 350, "w": 280, "h": 280 },
    { "type": "logo", "id": "b", "kind": "arc-bite",
      "x": 360, "y": 350, "w": 280, "h": 280 },
    { "type": "logo", "id": "c", "kind": "zig-zag",
      "x": 680, "y": 350, "w": 280, "h": 280 } ] }
```

## What NOT to do

- Do NOT use zig-zag in a polished/luxury context — the torn-paper
  aesthetic reads informal.
- Do NOT mix with `current-color` — C7 throws.
- Do NOT try to control teeth count — it's fixed at 6.
- Do NOT put zig-zag at the TOP of a stacked layout — the teeth point
  DOWN; flipping it upside-down requires a CSS `transform: scaleY(-1)`
  on the wrapping `<g>`.

## Visual verification

In both light AND dark, confirm:

- All 6 teeth are visible and well-defined.
- The tooth-band-top and the tooth-band-bottom are at the correct
  vertical positions (`y + h*0.78` and `y + h`).
- The top edge is a clean straight line.
- The teeth alternate cleanly (no merged adjacent teeth).

A common visual bug at very small render sizes: the teeth merge into
a single jagged line. Bump the rendered size up to ~120px+ to
confirm each tooth is independently readable.
