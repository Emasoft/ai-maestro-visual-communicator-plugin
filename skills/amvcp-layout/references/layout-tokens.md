# Layout — derived-token contract (`--la-*`)

The layout technique NEVER sets a `--vc-*` value. The DESIGN.md engine
(`amvcp-designmd.js`) is the single source of truth for those — it emits
`--vc-*` onto `:root` and re-emits them on hot-swap and theme toggle.
The layout CSS only *consumes* `--vc-*` tokens and defines its own
*derived* `--la-*` aliases as `var(--vc-…)` expressions. Hot-swapping a
DESIGN.md re-flows every layout for free, because every `--la-*` is a
thin live alias, never a frozen copy.

## The `:root` alias block (Group 1 — spatial foundation)

This block ships at the top of `amvcp-layout.css`. It gives human names
to the engine's indexed `--vc-space-*` scale so the grid/reading CSS
reads `var(--la-gap)` instead of `var(--vc-space-3)`.

```css
:root {
  --la-gap-xs:  var(--vc-space-1, 8px);     /* tight  */
  --la-gap-sm:  var(--vc-space-2, 12px);    /* small  */
  --la-gap:     var(--vc-space-3, 16px);    /* base   */
  --la-gap-lg:  var(--vc-space-5, 32px);    /* large  */
  --la-gap-xl:  var(--vc-space-7, 64px);    /* xlarge */

  --la-measure:      68ch;                  /* reading column     */
  --la-measure-wide: 92ch;                  /* wide-bleed children */
  --la-gutter:       var(--vc-space-5, 32px); /* article side pad  */
}
```

| Alias | Engine token | Purpose |
|---|---|---|
| `--la-gap-xs` | `--vc-space-1` | tight gaps (TOC list, card sub-gap) |
| `--la-gap-sm` | `--vc-space-2` | small gaps (header padding-block) |
| `--la-gap` | `--vc-space-3` | the base layout gap |
| `--la-gap-lg` | `--vc-space-5` | large gaps (grid column gap) |
| `--la-gap-xl` | `--vc-space-7` | x-large gaps (article padding-block) |
| `--la-gutter` | `--vc-space-5` | article / header side padding |
| `--la-measure` | — (`ch`) | reading-column max width |
| `--la-measure-wide` | — (`ch`) | wide-bleed child max width |

## Why this is an alias layer, not a second `--space-*` ladder

Emitting a parallel `--space-*` ladder beside the engine's
`--vc-space-*` would create two sources of truth — a DESIGN.md spacing
change would update one and not the other. The `--la-*` aliases are the
single-source-of-truth-respecting choice: each is `var(--vc-space-N)`,
so the engine stays authoritative and a hot-swap re-flows everything.

The fallbacks (`8px`, `16px`, …) exist ONLY so a page that forgot to
load the engine still renders something — they are never the intended
value.

## The `ch`-based reading measure (documented exception)

`--la-measure` / `--la-measure-wide` are `ch`-based on purpose. A
reading measure is "≈66-75 characters" — a *typographic* quantity, not
a spacing token. Tying it to `ch` keeps it correct across font scales
and DESIGN.md type-scale changes. This is the only non-token length the
layout CSS uses for content sizing, and it mirrors the
no-nested-scrollbars rule's "text wrapping" carve-out reasoning.

## Recommended DESIGN.md `spacing.scale` (8px grid)

The layout technique recommends an 8px-grid spacing scale in the
DESIGN.md frontmatter:

```yaml
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
```

This is `4px` (a half-step) plus 8px multiples — the canonical 8px-grid
ladder. Picking a non-8px scale changes all layout rhythm: every
`--la-gap*` alias re-resolves, so grids, padding, and the reading
gutter all shift together. This scale is the `design-tokens` skill's
phi/8px-grid output; the layout technique only consumes it.

## The sticky-header z-index — `--vc-z-sticky`

`.la-header` uses `z-index: var(--vc-z-sticky, 200)`. `--vc-z-sticky` is
an engine token in the optional `z-index` group (a fixed 9-level
stacking scale: `behind base raised dropdown sticky overlay modal toast
tooltip`). When a DESIGN.md declares the `z-index` group, the header
sits at the engine's `sticky` level; when it does not, the `200`
fallback applies — above page content, below the runtime's own control
overlays (which use much higher z-indices). The `z-index` group is
optional, so a DESIGN.md authored before it existed still themes the
layout correctly.

## Other documented non-token values

- `@page { margin: 16mm }` — a physical *paper* quantity, correct to
  hardcode (a print margin is not a screen spacing token).
- `768px` — the single canonical mobile breakpoint. The engine has no
  breakpoint token group; a layout breakpoint is not a spacing token.
- `--dev-*` props on `.la-device` — per-element device dimensions
  (width, height, radius, notch). These are *instance* parameters set
  inline on the element, not global tokens — each device mockup sets
  its own. The frame *colour* is still the engine `--vc-color-content`
  token, never a hardcoded `#000`.
