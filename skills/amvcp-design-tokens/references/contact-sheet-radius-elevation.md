# Contact-sheet radius + elevation panels

The `radius` panel renders 6 squares, each `border-radius: var(--vc-
radius-<k>)`. The `elevation` panel renders one neutral card per
`--vc-shadow-<n>` (0-4 + border). Both are direct visual proofs of
their respective scales — squares to compare radii by eye, cards to
compare elevation depths.

## Radius panel

`buildRadiusPanel(designmd)`:

1. reads `designmd.tokens.radius` — the 6-key map (`none, sm, md,
   lg, xl, full`);
2. emits one square per key, each with inline
   `border-radius: var(--vc-radius-<key>)` and a label.

The `none` square is a literal square; `sm` is barely-rounded; `md` /
`lg` / `xl` step up; `full` is a perfect circle (since the square is
square, `border-radius: 9999px` → circle).

## Elevation panel

`buildElevationPanel(designmd)`:

1. reads `designmd.tokens.elevation` — the 5+1 key map (`shadow-0`,
   `shadow-1` … `shadow-4`, `shadow-border`);
2. emits one neutral card per key, each with inline
   `box-shadow: var(--vc-shadow-<key>)` on a `surface-raised` background.

The `shadow-0` card has `box-shadow: none` — visibly flat, no rise
off the page. `shadow-1` lifts subtly; `shadow-4` floats. The
`shadow-border` card has a 1px ring INSTEAD OF a drop shadow (the
border-as-shadow trick — no layout shift).

## Why both panels show literal values

Both panels render the SCALE, not a UI consuming it. The reader sees
the SHAPE (radius's roundness, elevation's depth) and the LABEL
(`var(--vc-radius-md) → 8px`, `var(--vc-shadow-2) → 0 2px 4px …`)
side by side. To pick a value for a real component, they pick from
the scale by visual match.

## Scaffold to emit

```html
<section data-vc-panel="radius" class="vc-sheet-panel">
  <h2>Border-radius scale</h2>
  <div class="vc-sheet-radius-row">
    <button class="vc-sheet-radius-card"
            data-vc-copy="var(--vc-radius-none)"
            style="border-radius: var(--vc-radius-none);">
      <span>none</span><small>0px</small>
    </button>
    <button class="vc-sheet-radius-card"
            data-vc-copy="var(--vc-radius-sm)"
            style="border-radius: var(--vc-radius-sm);">
      <span>sm</span><small>4px</small>
    </button>
    <!-- … md, lg, xl, full … -->
  </div>
</section>

<section data-vc-panel="elevation" class="vc-sheet-panel">
  <h2>Elevation scale</h2>
  <div class="vc-sheet-elevation-row">
    <button class="vc-sheet-elevation-card"
            data-vc-copy="var(--vc-shadow-0)"
            style="box-shadow: var(--vc-shadow-0);">
      shadow-0 — none
    </button>
    <button class="vc-sheet-elevation-card"
            data-vc-copy="var(--vc-shadow-1)"
            style="box-shadow: var(--vc-shadow-1);">
      shadow-1
    </button>
    <!-- … shadow-2, shadow-3, shadow-4, shadow-border … -->
  </div>
</section>
```

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd)` → includes both
  panels
- (internal) `buildRadiusPanel(designmd)`,
  `buildElevationPanel(designmd)` — not exported

## DESIGN.md tokens used

- reads (radius): `radius.{none, sm, md, lg, xl, full}` — 6 keys
- reads (elevation): `elevation.{shadow-0, shadow-1, …, shadow-4,
  shadow-border}` — 6 keys
- emits (via the engine): `--vc-radius-{none, sm, md, lg, xl, full}`,
  `--vc-shadow-{0, 1, 2, 3, 4, border}`

## Anti-slop interaction

Neither scale has colors / fonts, so the slop lint doesn't apply.
Both panels reveal MECHANICAL defects:

- a radius scale where `md > lg` (mis-ordered) shows as visibly
  wrong-sized squares;
- an elevation scale where `shadow-3` is HEAVIER than `shadow-4`
  (mis-ordered) shows as visibly wrong-depth cards.

These are author-side bugs the panels catch by rendering.

## Selection / comment / decision-mini contract

Each square / card is a button. Click-to-copy copies the CSS
variable name (e.g. `var(--vc-radius-md)`).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot both panels in **both themes**
(R1) and verify:

### Radius panel

1. squares get visibly rounder left-to-right;
2. `full` square IS a circle (`border-radius >= half the side
   length`);
3. `getComputedStyle(square).borderRadius` for each square matches
   the labelled pixel value.

### Elevation panel

1. cards get visibly more lifted (deeper / longer shadow) left-to-
   right (except `shadow-border` which shows a HAIRLINE, not a
   drop);
2. on dark theme, the shadows are nearly invisible by physics
   (near-black on dark canvas) — that's expected. If the dark
   theme's shadow rendering is critical, switch to
   `generateElevationScale({ style: 'cinematic' })` or supply
   `tint` to lift them into visibility;
3. `shadow-0` card has `box-shadow: none` (verify
   `getComputedStyle(card0).boxShadow === 'none'`).
