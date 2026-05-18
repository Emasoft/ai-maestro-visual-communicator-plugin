# Logo block — mask-cutout

## Table of Contents

- [What it renders](#what-it-renders)
- [Scaffold](#scaffold)
- [Geometry](#geometry)
- [C7 implications — accent + mask = explicit token only](#c7-implications--accent--mask--explicit-token-only)
- [The mask `#fff` / `#000` lint exemption](#the-mask-fff--000-lint-exemption)
- [Lib function](#lib-function)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini](#selection--comment--decision-mini)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `mask-cutout` logo block is the canonical "shape subtracts from
container" composition primitive. A `<defs><mask>` defines what to
keep (white) and what to subtract (black); the outer accent-filled
rounded rect carries `mask="url(#id)"`. Visually: a colored rounded
square with a hollow circle bitten out of the middle. The mask
primitive every "letter with a hole punched in it" mark uses.

## What it renders

```html
<defs>
  <mask id="isvg-mask-<id>">
    <rect x="x" y="y" width="w" height="h" fill="#fff"/>
    <circle cx="x+w/2" cy="y+h/2" r="min(w,h)*0.22" fill="#000"/>
  </mask>
</defs>
<rect x="x" y="y" width="w" height="h"
      rx="16"
      fill="var(--vc-color-accent, #b8861f)"
      mask="url(#isvg-mask-<id>)"/>
```

The white rect is "keep all of the outer rect"; the black circle is
"subtract this circle". The outer rounded rect is `--vc-color-accent`
filled with the mask applied. The result: an accent-colored rounded
square with a transparent hole in the middle through which the page
background shows.

## Scaffold

```html
<script type="application/icon-svg+json" id="mask-cutout-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Mask cutout logo block",
  "primitives": [
    { "type": "logo",
      "id": "lg-mask",
      "kind": "mask-cutout",
      "x": 300, "y": 300,
      "w": 400, "h": 400 }
  ]
}
</script>
```

The cutout's circle radius is fixed at `min(w, h) * 0.22` — a
visually-balanced bite that leaves enough accent surface to read as
the dominant mark.

## Geometry

- `w`, `h` — the outer rounded rect's dimensions.
- The cutout circle is centered (`cx = x + w/2`, `cy = y + h/2`).
- Cutout radius = `min(w, h) * 0.22` (auto-derived; no parameter).
- Outer rect radius = `NODE_RADIUS = 16` (the same as `process`).

A `w = h` mark renders a perfectly symmetric "ring with rounded
corners". A `w > h` mark renders a horizontal pill with the cutout
centered horizontally (the cutout's radius is driven by the SMALLER
dimension, so it scales sensibly).

## C7 implications — accent + mask = explicit token only

The mask-cutout block uses `var(--vc-color-accent, #b8861f)` on the
outer rect — an EXPLICIT token. Per C7 (no mixed theming), this scene
must be ALL-explicit-token. You CANNOT put a `current-color` logo
block in the same scene-figure as a `mask-cutout` block — they'd mix
the two coloring contracts and `lintSvg` would throw.

The fix: put each in its own `<script type="application/icon-svg+json">`
block (the test fixture's `scene-logo-a` / `scene-logo-b` / `scene-
logo-c` arrangement).

## The mask `#fff` / `#000` lint exemption

The `<mask>` inner `<rect fill="#fff">` and `<circle fill="#000">` are
raw hex values that would normally trip C6 (no raw hex). But they're
ALPHA-CHANNEL keying values (white = keep, black = cut), NOT theme
colors. The lint's `maskSpans()` pre-scan computes the offsets of every
`<mask>...</mask>` region and EXEMPTS the color checks (C4, C6, C7)
inside those offsets. C1, C2, C3, C5 still apply globally. See
`references/lint-c1-to-c7.md`.

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.logoMaskCutout({
  x: 300, y: 300, w: 400, h: 400, id: 'lg-mask'
});
// fragment includes the <defs><mask> + the outer <rect>.
```

The `id` is needed because the mask's `id` is derived from it
(`isvg-mask-<id>`). Two marks with the same id would produce two
identical mask ids → DOM collision. The compiler passes the
primitive's `id` automatically; the standalone builder requires it.

## DESIGN.md tokens consumed

- `--vc-color-accent` — outer rect fill (the visible "ring" color)

(The white + black inside the mask are NOT tokens — they're alpha
keys, fixed by the SVG mask spec.)

## Selection / comment / decision-mini

The wrapping `<g data-ve-id>` is added by the compiler; the mask block
itself is a `data-ve-type="icon-node"` atom with a `data-ve-label="mask-cutout"`.

## When to use

- A literal "logo with a hole" — the classic punched-out-letter brand
  mark.
- A donut / ring-shaped accent.
- A bullseye target.
- A "container with a viewport" — the cutout reveals what's behind.
- ANY mark where the negative space is informational.

## When NOT to use

- For a generic accent block — that's `process` or
  `tint-hierarchy`.
- For a multi-element mask (multiple cutouts, custom mask shape) —
  hand-author a `<defs><mask>` with the geometry you need; the
  built-in mask-cutout is a SINGLE circle bite.
- For text knockout — SVG `<text>` inside a mask works, but is out of
  scope for icon-svg's pure-shape primitive engine.

## Common authoring patterns

### Single mask-cutout hero

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Brand mark",
  "primitives": [
    { "type": "logo", "id": "lg", "kind": "mask-cutout",
      "x": 250, "y": 250, "w": 500, "h": 500 } ] }
```

### Mask-cutout next to other logo blocks (same scene, all explicit)

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

All three blocks use explicit `--vc-color-accent` tokens (NOT
currentColor), so the scene satisfies C7 — no mixed theming.

## What NOT to do

- Do NOT put a `current-color` logo in the same scene as a
  `mask-cutout` — C7 throws (`mark mixes currentColor and explicit
  --vc- tokens`).
- Do NOT manually set a `fill` on the mask `<rect>` or `<circle>` —
  white-keep / black-subtract is the mask contract, NOT a design
  choice.
- Do NOT use mask-cutout for "a rounded rect with text inside" — SVG
  `<text>` is not the mask block's purpose; use a `process` with a
  label.

## Visual verification

In both light AND dark, confirm:

- The accent-colored ring is visible against the page background.
- The cutout is TRANSPARENT (you can see what's behind the SVG
  through the hole), not a different colored fill.
- The corners of the outer rect are rounded (`rx=16`).
- The cutout is centered horizontally AND vertically.

A common error: the page background is the same color as the accent.
The cutout becomes invisible. Test on `--vc-color-canvas`,
`--vc-color-surface`, and `--vc-color-surface-sunken` to confirm the
hole reads in all three.
