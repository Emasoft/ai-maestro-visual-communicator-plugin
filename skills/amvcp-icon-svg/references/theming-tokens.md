# Theming — the --vc-* token palette

## Table of Contents

- [The 13 canonical color tokens](#the-13-canonical-color-tokens)
- [The 3 derived tint tiers (color-mix off accent)](#the-3-derived-tint-tiers-color-mix-off-accent)
- [The 2 special non-token values](#the-2-special-non-token-values)
- [The semantic-role variant ladder](#the-semantic-role-variant-ladder)
- [Light + dark themes](#light--dark-themes)
- [The no-engine fallback contract](#the-no-engine-fallback-contract)
- [How tokens flow into the compiled SVG](#how-tokens-flow-into-the-compiled-svg)
- [Special token use in non-color attributes](#special-token-use-in-non-color-attributes)
- [What does NOT belong in the palette](#what-does-not-belong-in-the-palette)

Every fill, stroke, font, radius, and shadow the icon-svg module emits
is a `var(--vc-*, <fallback-hex>)` expression. The DESIGN.md token
engine (`scripts/amvcp-designmd.js`) supplies the live values, and a
theme toggle / DESIGN.md hot-swap restyles every authored SVG on the
page with zero JS, zero re-render. The fallback chain inside every
`var(--vc-*, <hex>)` is the SPECIFIED engine-absent path — an authored
SVG still renders themed-by-fallback when no engine is loaded.

## The 13 canonical color tokens

```js
var COLOR_TOKENS = {
  surface:           'var(--vc-color-surface, #ffffff)',
  canvas:            'var(--vc-color-canvas, #faf6ee)',
  content:           'var(--vc-color-content, #1f1a14)',
  'content-muted':   'var(--vc-color-content-muted, #5b5343)',
  'content-subtle':  'var(--vc-color-content-subtle, #8a8170)',
  border:            'var(--vc-color-border, #e3dcc9)',
  'border-strong':   'var(--vc-color-border-strong, #c9bfa3)',
  accent:            'var(--vc-color-accent, #b8861f)',
  'on-accent':       'var(--vc-color-on-accent, #ffffff)',
  success:           'var(--vc-color-success, #3a6b5c)',
  warning:           'var(--vc-color-warning, #a8791f)',
  danger:            'var(--vc-color-danger, #a84a32)',
  info:              'var(--vc-color-info, #3464a8)'
};
```

That's the entire palette. The compiler's `tokenColor(name)` resolves
a semantic name to its CSS expression; an unknown name is a hard throw
(fail-fast). A typo'd `"akccent"` does not render an invisible shape
— it surfaces a build-time error.

## The 3 derived tint tiers (color-mix off accent)

The compiler also resolves three tint names that map onto a
`color-mix(in oklch, …)` ramp off the existing accent token:

| Tint name | CSS expression | When used |
|---|---|---|
| `tint-hero` | `var(--isvg-tint-hero, var(--vc-color-accent, #b8861f))` | strongest accent — hero band, first ring of `tint-hierarchy` |
| `tint-mid` | `var(--isvg-tint-mid, var(--vc-color-accent, #b8861f))` | mid accent — middle band of `stacked-rects`, supporting ring of `tint-hierarchy` |
| `tint-quiet` | `var(--isvg-tint-quiet, var(--vc-color-accent, #b8861f))` | softest accent — `database` / `network` fill, bottom band of `stacked-rects` |

The injected CSS defines the three custom properties:

```css
:root {
  --isvg-tint-hero:  var(--vc-color-accent, #b8861f);
  --isvg-tint-mid:   color-mix(in oklch,
                       var(--vc-color-accent, #b8861f) 55%,
                       var(--vc-color-surface, #ffffff));
  --isvg-tint-quiet: color-mix(in oklch,
                       var(--vc-color-accent, #b8861f) 25%,
                       var(--vc-color-surface, #ffffff));
}
```

So the tint ladder is one custom property per tier, derived from the
SAME `--vc-color-accent` the rest of the page uses. An accent change
in DESIGN.md cascades through all three tiers automatically.

**Ancient-browser degradation**: a UA without `color-mix` (every CSS
engine before ~2023) takes the var fallback and gets the hero token
for all three tiers — still themed, still readable, never broken. The
ramp degrades gracefully, never silently fails.

## The 2 special non-token values

| Name | CSS expression | Meaning |
|---|---|---|
| `none` | `none` | no fill / no stroke |
| `currentColor` | (inline literal `currentColor`) | inherit from wrapper's `color` property — see C7 / `references/logo-current-color.md` |

These two are also resolved by `tokenColor()`; both are exempt from
the C6 "no raw hex" check (`currentColor` is not a color literal).

## The semantic-role variant ladder

Every node primitive accepts an optional `variant`. The variant maps
1:1 to a semantic color token's STROKE:

| `variant` | stroke value |
|---|---|
| `default` (or omitted) | `var(--vc-color-content)` — ink |
| `success` | `var(--vc-color-success)` |
| `warning` | `var(--vc-color-warning)` |
| `danger` | `var(--vc-color-danger)` |
| `info` | `var(--vc-color-info)` |

`external` is the special case: its default stroke is
`var(--vc-color-content-muted)` (it's a system boundary, not a primary
node). A `variant` other than `default` overrides the muted default.

## Light + dark themes

Because every value is a `--vc-*` token and DESIGN.md supplies a light
AND a dark palette, an authored SVG restyles automatically on theme
toggle. The icon-svg module never authors a `dark:` variant, never
inspects `prefers-color-scheme`, never branches on theme. The engine
does all of that, ONCE, in DESIGN.md.

**Hard invariant** (from the project's universal rule R1): every
visual MUST ship a light AND a dark variant. Verify by toggling
`data-ve-theme` on the html element in dev-browser and screenshotting
both — see `skills/amvcp-self-debug-rules/SKILL.md`. A single-theme
icon is a correctness defect.

## The no-engine fallback contract

When `amvcp-designmd.js` is NOT loaded — fresh page, error state,
isolated unit test — every `var(--vc-color-*, <hex>)` falls back to
its baked hex. The fallback hexes are the editorial "lavish-axi"
palette (warm cream + dark ink + amber accent) by convention; they
were chosen so a token-less icon is still themed and still readable,
not so they advertise the brand.

The no-engine fixture (`tests/fixtures/icon-svg-no-engine.html`)
asserts the fallback contract end-to-end: load the icon-svg module
alone (NO designmd.js), render every primitive family, screenshot in
light + dark, confirm every shape is themed, no `--vc-*` resolved to
`initial`, no broken fill, no white-on-white ghost.

## How tokens flow into the compiled SVG

```
DESIGN.md scene
  → amvcp-designmd.js engine
  → :root { --vc-color-accent: #d8a83f; --vc-color-content: #f3ecdd; ... }
  → .isvg-scene <rect fill="var(--vc-color-content, #1f1a14)" ... />
  → browser resolves var() at paint time
  → rendered hairline in the active theme's ink color
```

The SVG carries NO baked color. A theme swap = swap the `:root`
custom properties = every SVG repaints with the new ink. The
mechanism that drives this is a single CSS recompute; there is no
JavaScript in the loop.

## Special token use in non-color attributes

The compiler uses these `--vc-*` tokens in non-color contexts too:

- `font-family` on the label `<text>`:
  `var(--vc-font-body, system-ui, sans-serif)`
- Hotspot border: `var(--vc-color-surface, #ffffff)` (the white
  knockout ring around the hotspot, ensures contrast on any
  underlying image color)
- Device-frame chrome:
  - Title bar background: `var(--vc-color-surface-sunken, #f1ece0)`
  - Title text: `var(--vc-color-content-muted, #5b5343)`
  - URL bar mono text: `var(--vc-font-mono, ui-monospace, monospace)`
- Hotspot hover ring (under `prefers-reduced-motion: reduce`):
  `color-mix(in srgb, var(--vc-color-accent, #b8861f) 35%, transparent)`

A few `var(--vc-radius-*)` and `var(--vc-shadow-*)` tokens are read
by the CSS too:

- Hotspot border-radius: `var(--vc-radius-full, 9999px)`
- iOS Dynamic Island border-radius: `var(--vc-radius-full, 9999px)`
- URL bar field: `var(--vc-radius-sm, 4px)`
- Device-frame box-shadow: `var(--vc-shadow-3, 0 20px 60px
  rgba(0,0,0,0.28))`

Every one of these has the same `var(name, fallback)` shape — a
DESIGN.md-less page still gets a sensible default.

## What does NOT belong in the palette

The icon-svg module never invents new `--vc-*` tokens. The three
`--isvg-tint-*` custom properties are derived FROM `--vc-color-accent`
via `color-mix` — they are NOT requested from DESIGN.md, they are
local to the icon-svg stylesheet. The contract is "icon-svg consumes
the engine's tokens; it never asks the engine to ship icon-svg-
specific names". A new color need in icon-svg means either reusing
one of the 13 canonical tokens or computing a derivative from the
accent — never a new `--vc-color-isvg-*` token.
