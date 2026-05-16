# SVG ornament marks — title-mark / divider-mark / accent-mark

A pattern mined from `09-slide-deck.html`: a 56 x 56 inline SVG of
some minimalist combination (circle + cross + center dot; arc + dot;
three dots in a row) used as a TITLE ORNAMENT or DIVIDER. Replaces
the photographic hero image on a title slide with a custom geometric
mark. Lightweight, themed, no asset pipeline.

## The canonical pattern (from `09-slide-deck.html`)

```html
<svg class="title-ornament" viewBox="0 0 56 56"
     aria-hidden="true">
  <circle cx="28" cy="28" r="22"
          fill="none"
          stroke="var(--vc-color-content, #1f1a14)"
          stroke-width="1.5"/>
  <line x1="14" y1="28" x2="42" y2="28"
        stroke="var(--vc-color-content, #1f1a14)"
        stroke-width="1.5"/>
  <line x1="28" y1="14" x2="28" y2="42"
        stroke="var(--vc-color-content, #1f1a14)"
        stroke-width="1.5"/>
  <circle cx="28" cy="28" r="2"
          fill="var(--vc-color-accent, #b8861f)"/>
</svg>
```

Renders a circle with a horizontal + vertical crosshair and a small
accent dot at the center. Reads as a "north star" / "centered" /
"focused" mark — generic but compositional.

## Variants

### Title-mark — circle + dot

```html
<svg class="title-ornament" viewBox="0 0 56 56" aria-hidden="true">
  <circle cx="28" cy="28" r="22"
          fill="none"
          stroke="var(--vc-color-content, #1f1a14)"
          stroke-width="1.5"/>
  <circle cx="28" cy="28" r="6"
          fill="var(--vc-color-accent, #b8861f)"/>
</svg>
```

Simpler — outer ring + inner accent dot. Reads as "core" / "target".

### Divider-mark — three dots in a row

```html
<svg class="divider-ornament" viewBox="0 0 56 16"
     aria-hidden="true">
  <circle cx="14" cy="8" r="2"
          fill="var(--vc-color-content-subtle, #8a8170)"/>
  <circle cx="28" cy="8" r="3"
          fill="var(--vc-color-accent, #b8861f)"/>
  <circle cx="42" cy="8" r="2"
          fill="var(--vc-color-content-subtle, #8a8170)"/>
</svg>
```

A subtle 3-dot ornament for between-section dividers. The center dot
is larger and accent-colored (the focal point); the flanking dots
are smaller and subtle (the "presence" markers).

### Accent-mark — arc + dot

```html
<svg class="accent-ornament" viewBox="0 0 56 32"
     aria-hidden="true">
  <path d="M 4 28 Q 28 4, 52 28"
        fill="none"
        stroke="var(--vc-color-accent, #b8861f)"
        stroke-width="2"/>
  <circle cx="28" cy="10" r="3"
          fill="var(--vc-color-accent, #b8861f)"/>
</svg>
```

A swooping arc with an accent dot at the peak — reads as "high
point" / "arrival" / "milestone".

## When to use

- Title slide ornament (replaces a hero image with a custom mark).
- Section divider in a long-form document.
- Accent flourish at the start of a chapter / article.
- "Stamp" mark next to a quote or key claim.
- Branded heading prefix.

## When NOT to use

- For a functional icon — pick a meaningful primitive (process /
  database / etc.) or a shape (chevron / hexagon).
- For a logo — use a `logo` block.
- For decorative wallpaper / background pattern — use CSS, not SVG.
- For an interactive button — wrap in `interactive-control`.

## Why a custom mark and not a primitive?

Ornament marks are EDITORIAL. The icon-svg primitives are
STRUCTURAL (process / database / etc.). An ornament needs:

- 2-4 visual elements working together (circle + dot + arc + line).
- Editorial composition (the WAY they relate is the visual idea).
- Free pixel placement (the 56x56 viewBox is a hand-tuned grid, not
  the canonical 1000-space).

The icon-svg primitive engine doesn't have a "composition with 4
free elements" mode — for that, hand-author the SVG directly. The
ornament marks are NOT compiled by `buildSceneSvg`; they're written
as inline SVG by the author.

## DESIGN.md tokens to use

- `--vc-color-content` — main strokes / fills (the ink lines)
- `--vc-color-content-muted` — secondary strokes / fills
- `--vc-color-content-subtle` — tertiary marks (faint dots)
- `--vc-color-accent` — the ONE accent element

The 4-color budget (C4-equivalent) still applies — keep ornaments
to ink + accent + maybe ONE supporting muted color, never a rainbow.

## Class naming convention

- `.title-ornament` — for hero / title placement.
- `.divider-ornament` — for between-section placement.
- `.accent-ornament` — for inline editorial flourishes.

Each can have CSS specifying max-size, margin, etc.:

```css
.title-ornament {
  inline-size: 56px;
  block-size: 56px;
  display: block;
  margin: 0 auto 24px;
}
.divider-ornament {
  inline-size: 56px;
  block-size: 16px;
  display: block;
  margin: 32px auto;
}
.accent-ornament {
  inline-size: 56px;
  block-size: 32px;
  display: inline-block;
  vertical-align: middle;
  margin-inline-end: 8px;
}
```

## Visual verification

In both light AND dark:

- The ornament uses `--vc-*` tokens (no raw hex).
- The accent color stands out from the ink (not too subtle).
- The size is appropriate for the placement (title ornament should
  be ~56px, divider should be ~16px tall).
- The ornament reads as a single composed mark, not 3 separate
  shapes.

If the ornament looks like floating fragments instead of a unified
mark, tighten the composition (smaller gaps, fewer elements, or
adjust the proportions).
