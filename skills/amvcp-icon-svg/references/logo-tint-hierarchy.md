# Logo block — tint-hierarchy

The `tint-hierarchy` logo block is THREE filled CIRCLES arranged in a
triangular ladder: ONE hero circle dominating the top center, plus
TWO smaller supporting circles flanking the bottom. The hero uses
`tint-hero`; the supporters use `tint-mid` (left) and `tint-quiet`
(right) — visually communicates "one primary, two supports" / "key +
secondaries" without any text. The most editorial of the 6 logo
blocks.

## What it renders

Three `<circle>` elements:

```js
var heroR = min(w, h) * 0.32;          // hero radius
var supR  = heroR * 0.55;              // supporter radius

// Hero — centered horizontally, upper-middle vertically
<circle cx="x + w*0.5" cy="y + h*0.42" r="heroR"
        fill="var(--isvg-tint-hero, --vc-color-accent)"/>

// Left supporter — at 26% across, 74% down
<circle cx="x + w*0.26" cy="y + h*0.74" r="supR"
        fill="var(--isvg-tint-mid, --vc-color-accent)"/>

// Right supporter — at 74% across, 74% down (mirror)
<circle cx="x + w*0.74" cy="y + h*0.74" r="supR"
        fill="var(--isvg-tint-quiet, --vc-color-accent)"/>
```

The hero is positioned slightly above center (42% from top), giving
visual weight; the two supporters sit symmetrically below it at the
74% vertical line, 26%/74% horizontal — a balanced triangle.

## Scaffold

```html
<script type="application/icon-svg+json" id="tint-hierarchy-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Tint hierarchy logo block",
  "primitives": [
    { "type": "logo",
      "id": "lg-tint",
      "kind": "tint-hierarchy",
      "x": 200, "y": 200,
      "w": 600, "h": 600 }
  ]
}
</script>
```

## Geometry

- `w`, `h` — the outer bounding box.
- Hero radius = `min(w, h) * 0.32` (so the hero scales with the
  shorter dimension to keep proportional in non-square bounds).
- Supporter radius = `heroR * 0.55` (smaller, so the hierarchy is
  visually obvious).
- Hero position: horizontally centered (50% across), 42% down (above
  center).
- Left supporter: 26% across, 74% down.
- Right supporter: 74% across, 74% down (mirror of left).

All coordinates are snapped to the 4-unit grid by the compiler.

## Visual reading

- ONE hero circle at the top center → the dominant element.
- TWO smaller supporting circles below it → the secondary elements.
- A triangle arrangement → the eye reads top-to-bottom hierarchy.
- Tint progression (hero > mid > quiet) → reinforces the visual
  hierarchy with color weight.

The mark reads as "one key thing supported by two helpers" — a
universal pattern for trinities (Father / Son / Spirit; mind / body /
soul; CPU / RAM / disk; etc.).

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.logoTintHierarchy({
  x: 200, y: 200, w: 600, h: 600, id: 'lg-tint'
});
```

## DESIGN.md tokens consumed

- `--isvg-tint-hero` — top center circle (= `--vc-color-accent`)
- `--isvg-tint-mid` — left bottom circle (= `color-mix(in oklch,
  accent 55%, surface)`)
- `--isvg-tint-quiet` — right bottom circle (= `color-mix(in oklch,
  accent 25%, surface)`)

All three are derived from the SAME `--vc-color-accent`; theme accent
change cascades.

## Selection / comment / decision-mini

Single `<g data-ve-id>` atom wrapping all three circles. The block is
one mark, not three independent marks — clicking any of the three
circles selects the WHOLE block.

## When to use

- A primary + secondary + tertiary mark.
- A "hub + two spokes" mark.
- A trinity mark (any thematic triad).
- A leader + 2-supporters mark (team, plan, system).
- A weighted-priority mark (one dominant, two minor).
- ANY mark where the three-tier hierarchy is the message.

## When NOT to use

- For an equal-weight triad (3 peers) — use 3 separate `process` or
  `logo` blocks.
- For a 2-element mark — use a `process` + `logo: arc-bite` pair.
- For a 4+-element mark — hand-author a custom scene with explicit
  circles.
- For a textual hierarchy (heading + subhead + body) — that's
  `typography`, not icon-svg.

## Common authoring patterns

### Single tint-hierarchy (a trinity brand mark)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Trinity mark",
  "primitives": [
    { "type": "logo", "id": "lg", "kind": "tint-hierarchy",
      "x": 200, "y": 200, "w": 600, "h": 600 } ] }
```

### Tint-hierarchy + stacked-rects (sibling marks)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "logo", "id": "a", "kind": "stacked-rects",
      "x":  60, "y": 200, "w": 380, "h": 600 },
    { "type": "logo", "id": "b", "kind": "tint-hierarchy",
      "x": 560, "y": 200, "w": 380, "h": 600 } ] }
```

(The test fixture's `scene-logo-b`.)

### Tint-hierarchy as a comparison piece

Pair with a `tint-hero`-only mark to show "see what happens when the
supporters are removed":

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "logo", "id": "before", "kind": "tint-hierarchy",
      "x":  60, "y": 250, "w": 380, "h": 500 } ] }
```

(Then in a sibling scene, just the hero — but no `logo` kind gives
a single hero; use a `shape: hexagon` or hand-author a `<circle>`.)

## What NOT to do

- Do NOT modify the tier assignments — hero/mid/quiet ladder is the
  message.
- Do NOT add a fourth supporter — the block is FIXED AT 3 circles.
- Do NOT use a stroke — the editorial choice is FILL-ONLY.
- Do NOT mix with `current-color` — C7 throws.

## Visual verification

In both light AND dark, confirm:

- The hero circle is clearly LARGEST and visually DOMINANT.
- The two supporters are SMALLER, SOFTER, and symmetrically placed.
- The tint progression is visible (hero is most saturated, quiet is
  closest to surface).
- All three circles overlap NONE of each other — clean separation.

A common visual bug: at very small render sizes (~60px), the
supporters can render as nearly invisible because their fills are so
close to the surface color. Bump up to ~120px+ to confirm all three
tiers read independently.
