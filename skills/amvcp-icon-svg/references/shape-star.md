# Decorative shape — star

## Table of Contents

- [What it renders](#what-it-renders)
- [Two authoring paths](#two-authoring-paths)
  - [Path A — scene-graph](#path-a--scene-graph)
  - [Path B — CSS-only class](#path-b--css-only-class)
- [Fill options](#fill-options)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [CSS-only rating row](#css-only-rating-row)
  - [Scene-graph hero star (a single big achievement mark)](#scene-graph-hero-star-a-single-big-achievement-mark)
  - [Featured content sticker](#featured-content-sticker)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `star` shape is the universal 5-point star: rating, favorite,
featured, achievement, accolade. A 10-point polygon (alternating
outer + inner vertices around a circle) — a classic 5-pointed star
with concave inner vertices between each point.

## What it renders

Ten points in normalized 0-100 space:

```js
star: [
  [50,  0], [61, 35], [98, 35], [68, 57], [79, 91],
  [50, 70], [21, 91], [32, 57], [ 2, 35], [39, 35]
]
```

The pattern is 5 OUTER points (at 0%/35%/91%/70%/35% etc. — the
points of the star) interleaved with 5 INNER points (the concave
notches between the points). Reading clockwise from the top:

1. Top outer point: `(50, 0)`
2. Upper-right inner notch: `(61, 35)`
3. Far-right outer point: `(98, 35)`
4. Right inner notch: `(68, 57)`
5. Bottom-right outer point: `(79, 91)`
6. Bottom inner notch: `(50, 70)`
7. Bottom-left outer point: `(21, 91)`
8. Left inner notch: `(32, 57)`
9. Far-left outer point: `(2, 35)`
10. Upper-left inner notch: `(39, 35)`

The standard 5-point star geometry; the inner/outer radius ratio is
~0.38 (the inner radius is 38% of the outer radius), which produces
the classic golden-ratio star proportions.

## Two authoring paths

### Path A — scene-graph

```html
<script type="application/icon-svg+json" id="star-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Star rating mark",
  "primitives": [
    { "type": "shape",
      "id": "star",
      "kind": "star",
      "x": 250, "y": 250,
      "w": 500, "h": 500,
      "fill": "warning" }
  ]
}
</script>
```

### Path B — CSS-only class

```html
<span class="isvg-shape isvg-shape-star"></span>
```

## Fill options

Same as every shape primitive. The conventional choice for a rating
star is `warning` (the amber-gold color matches the universal
"rated / starred" visual idiom).

## When to use

- Star rating glyph (1-star, 5-star).
- "Favorite" / "starred" affordance.
- "Featured content" mark.
- Achievement / accolade glyph.
- Sticker / promo mark ("New!", "Hot!").
- Generic celebrating glyph.

## When NOT to use

- For an N-pointed star where N ≠ 5 — hand-author with the polygon
  points you need.
- For a hollow / outlined star — `star` is FILL-ONLY; the icon-svg
  primitive engine doesn't stroke shapes. To get a hollow star,
  hand-author with `fill="none" stroke="..."`.
- For a star burst / starburst with rays — that's a different
  geometry; hand-author or use an inline SVG.

## Common authoring patterns

### CSS-only rating row

```html
<div class="rating">
  <span class="isvg-shape isvg-shape-star rated"></span>
  <span class="isvg-shape isvg-shape-star rated"></span>
  <span class="isvg-shape isvg-shape-star rated"></span>
  <span class="isvg-shape isvg-shape-star rated"></span>
  <span class="isvg-shape isvg-shape-star empty"></span>
</div>
<style>
  .rating .isvg-shape {
    inline-size: 16px; block-size: 16px;
  }
  .rating .rated { background: var(--vc-color-warning); }
  .rating .empty { background: var(--vc-color-content-subtle); }
</style>
```

### Scene-graph hero star (a single big achievement mark)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "shape", "id": "s", "kind": "star",
      "x": 200, "y": 200, "w": 600, "h": 600, "fill": "warning" } ] }
```

### Featured content sticker

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Featured marker",
  "primitives": [
    { "type": "shape", "id": "feat", "kind": "star",
      "x": 350, "y": 50, "w": 300, "h": 300, "fill": "accent" } ] }
```

## What NOT to do

- Do NOT use `star` as a button — wrap in `interactive-control`.
- Do NOT use `star` for a literal asterisk character — use the
  text character `*` in CSS / HTML; the star polygon is decorative,
  not text.
- Do NOT use `star` to mean "5 distinct items" — for a count,
  spell out the count in text alongside the star.

## Visual verification

Confirm all 5 outer points are sharp and clearly visible, the 5 inner
notches make the star clearly 5-pointed (not a pentagon), and the
fill matches the chosen token. At very small sizes (~8px) the star
can read as a blob; bump up the size to ~16px+ for cleanly readable
points.
