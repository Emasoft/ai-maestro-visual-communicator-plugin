# Logo block — current-color (the all-currentColor mark)

## Table of Contents

- [What it renders](#what-it-renders)
- [Scaffold](#scaffold)
- [Why the diamond shape?](#why-the-diamond-shape)
- [The C7 constraint — why this mark MUST live in its own scene](#the-c7-constraint--why-this-mark-must-live-in-its-own-scene)
- [Lib function](#lib-function)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini](#selection--comment--decision-mini)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [Single current-color (a runtime-tintable mark)](#single-current-color-a-runtime-tintable-mark)
  - [Sequence — current-color in its own scene, sibling scenes with other logos](#sequence--current-color-in-its-own-scene-sibling-scenes-with-other-logos)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `current-color` logo block is THE ONE MARK in the entire icon-svg
catalog that uses `currentColor` instead of an explicit `--vc-*`
token. The whole mark inherits its color from the wrapper's CSS
`color` property — set `color` on the figure and the mark re-tints
instantly with zero DESIGN.md interaction. The shape is a simple
DIAMOND (rotated square) with a single `<path>`.

## What it renders

A single `<path>` traces a diamond — 4 line segments forming a
rotated square:

```html
<path d="M (x + w*0.5) y
         L (x + w) (y + h*0.5)
         L (x + w*0.5) (y + h)
         L x (y + h*0.5) Z"
      fill="var(--vc-color-content, currentColor)"/>
```

The four vertices:

- Top: `(x + w/2, y)`
- Right: `(x + w, y + h/2)`
- Bottom: `(x + w/2, y + h)`
- Left: `(x, y + h/2)`

The fill is `var(--vc-color-content, currentColor)` — the VALUE is
the content token, but the FALLBACK is `currentColor`. When no
DESIGN.md engine is present, every fill resolves to `currentColor`
and the whole mark tints from the wrapper's `color`. When DESIGN.md
IS present, the fill is the ink token (so the mark still re-themes
with the rest of the page).

## Scaffold

```html
<script type="application/icon-svg+json" id="current-color-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Current color diamond mark",
  "primitives": [
    { "type": "logo",
      "id": "lg-curr",
      "kind": "current-color",
      "x": 250, "y": 250,
      "w": 500, "h": 500 }
  ]
}
</script>
```

## Why the diamond shape?

The `current-color` mark is a SIMPLE, GEOMETRICALLY CLEAN shape so
the runtime can demonstrate the currentColor inheritance contract
without aesthetic distraction. The diamond is:

1. **Symmetric** — 4-fold rotational symmetry, readable at any size.
2. **Single-path** — one `<path d="...Z"/>`, no fill-rule, no
   defs.
3. **Distinguishable** — visually different from the other 5 logo
   kinds, so a logo gallery doesn't read as "five rectangles plus
   one rectangle".
4. **Editorial** — a diamond is a universal "marker" / "tag" /
   "annotation" glyph.

## The C7 constraint — why this mark MUST live in its own scene

Per C7 (no mixed theming), a single SCENE must be all-`currentColor`
OR all-explicit-token, never both. Because `current-color` is the
all-currentColor logo block, it CANNOT share a scene with
`mask-cutout`, `arc-bite`, `zig-zag`, `stacked-rects`, or
`tint-hierarchy` (all of which use explicit `--vc-*` tokens).

The fix: put `current-color` in its OWN `<script type="application/
icon-svg+json">` block (the test fixture's `scene-logo-c` does
exactly this, separated from `scene-logo-a` / `scene-logo-b`).

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.logoCurrentColor({
  x: 250, y: 250, w: 500, h: 500, id: 'lg-curr'
});
```

## DESIGN.md tokens consumed

- `--vc-color-content` — preferred fill (when DESIGN.md is loaded)
- `currentColor` — fallback fill (when DESIGN.md is absent OR the
  token is unset)

This dual-source contract is the WHOLE POINT of the `current-color`
block: it's the only mark that gracefully degrades to a
parent-`color`-driven mode.

## Selection / comment / decision-mini

Same as every primitive — wrapping `<g data-ve-id>`, decision pill.

## When to use

- A page-chrome mark that should match the surrounding text color
  (e.g. a UI affordance glyph next to a link).
- A logo embedded in a context where the page's text color drives
  the mark color (e.g. a footer mark in a colored footer).
- A "runtime-tintable" mark — the consumer can set `color: red` on
  the wrapper and the mark tints red without touching the SVG.
- A mark that needs to read in both light and dark themes WITHOUT
  the DESIGN.md engine loaded (the `currentColor` fallback works in
  a token-less page; the explicit-token marks need at least the
  fallback hex).

## When NOT to use

- For a mark that should reliably be the accent color — use
  `tint-hierarchy` or `mask-cutout`.
- For a mark in the same scene as other logo blocks — C7 throws.
- For a multi-color mark — `current-color` is single-color by
  definition.
- For a mark with shapes other than the fixed diamond — this block
  is the diamond only.

## Common authoring patterns

### Single current-color (a runtime-tintable mark)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Diamond mark",
  "primitives": [
    { "type": "logo", "id": "lg", "kind": "current-color",
      "x": 250, "y": 250, "w": 500, "h": 500 } ] }
```

To re-tint at runtime, set `color` on the figure wrapper:

```html
<figure class="isvg-figure" style="color: var(--vc-color-info)">
  <!-- compiled current-color mark inherits info color -->
</figure>
```

### Sequence — current-color in its own scene, sibling scenes with other logos

```html
<script type="application/icon-svg+json" id="logos-explicit">
{ "viewBox": [0,0,1000,1000],
  "primitives": [
    {"type":"logo","id":"a","kind":"mask-cutout",
     "x":40,"y":350,"w":280,"h":280},
    {"type":"logo","id":"b","kind":"arc-bite",
     "x":360,"y":350,"w":280,"h":280} ] }
</script>

<!-- Separate scene-figure — REQUIRED by C7. -->
<script type="application/icon-svg+json" id="logos-current">
{ "viewBox": [0,0,1000,1000],
  "primitives": [
    {"type":"logo","id":"c","kind":"current-color",
     "x":320,"y":320,"w":360,"h":360} ] }
</script>
```

## What NOT to do

- Do NOT put `current-color` in the same scene as ANY other logo
  kind — C7 throws.
- Do NOT replace `currentColor` with a literal hex — defeats the
  whole purpose of this block.
- Do NOT add a stroke — the editorial choice is FILL-ONLY.
- Do NOT use this block when you need a reliable accent color —
  it's deliberately PARENT-COLOR-DRIVEN.

## Visual verification

In both light AND dark, confirm:

- The mark is filled with the wrapper's `color` (or `--vc-color-
  content` if the wrapper has no `color` override).
- Changing the wrapper's `color` re-tints the mark.
- The mark is a clean diamond (4 vertices on the bounding box's
  midpoints).
- No raw hex appears in the compiled SVG (only `currentColor` and
  `var(--vc-color-content, currentColor)`).

Visual sanity check: open the test fixture's `scene-logo-c`, switch
the page theme, and confirm the diamond re-tints with the page text
color. If it stays a fixed color, the engine is overriding the
currentColor fallback — investigate the `--vc-color-content`
resolution.
