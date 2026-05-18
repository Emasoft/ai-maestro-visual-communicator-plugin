# Elevation shadow scale (DT-04)

## Table of Contents

- [What it does](#what-it-does)
- [When to choose](#when-to-choose)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

Two production-tested elevation models, expressed as a 5-step shadow
scale + a `shadow-border` (the 1-px ring trick). Authored once, themed
everywhere via `--vc-shadow-*`.

## What it does

`amvcpTokens.generateElevationScale(opts)` returns a map:

```
{
  "shadow-0":      "none",
  "shadow-1":      "<box-shadow string>",
  "shadow-2":      "<box-shadow string>",
  "shadow-3":      "<box-shadow string>",
  "shadow-4":      "<box-shadow string>",
  "shadow-border": "0 0 0 1px <ink>"
}
```

Two styles:

| `opts.style` | Behaviour |
|---|---|
| `'md3'` (default) | the Material 3 two-layer key+ambient model — short tight key drop + longer soft ambient halo |
| `'cinematic'` | a 2/3/4/6-layer penumbra stack — `0/1/2/4/8/16/32 px` blur halos with decaying alpha (0.12, 0.10, 0.08, 0.06, 0.04, 0.02), film-lighting realism |

`opts.tint` (a brand hex) — when set, the shadow ink is
`color-mix(in srgb, <tint> N%, transparent)` instead of pure black, so
the shadow tints toward the brand accent. Subtle but visible on
near-white surfaces.

## When to choose

- **MD3** for product UI / dashboards / cards / dialogs — the standard
  Google / iOS / web-app feel.
- **Cinematic** for hero cards, testimonial blocks, product imagery —
  any place where a more photographic, realistic depth is wanted.
- **Tinted** when the brand has a strong warm or cool cast (heritage
  honey, factory orange, ivory clay) and the cool-black shadow reads
  as out-of-system.
- **`shadow-border`** — use as a `box-shadow` (not `border`) when the
  hairline needs to coexist with a real shadow on the same element
  without layout shift; the border ring stacks under any other shadow.

## Scaffold to emit

```yaml
elevation:
  shadow-0: "none"
  shadow-1: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)"
  shadow-2: "0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.12)"
  shadow-3: "0 4px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.14)"
  shadow-4: "0 8px 16px rgba(0,0,0,0.10), 0 16px 40px rgba(0,0,0,0.18)"
  shadow-border: "0 0 0 1px rgba(0,0,0,0.08)"
```

Programmatic:

```js
var elevation = amvcpTokens.generateElevationScale({
  style: 'cinematic',
  tint: '#b8861f',
});
parsed.designmd.tokens.elevation = elevation;
```

## Lib functions used

- `amvcpTokens.generateElevationScale(opts)` → `{shadow-0…4, shadow-border}`

## DESIGN.md tokens used

- writes: `elevation.{shadow-0, shadow-1, shadow-2, shadow-3,
  shadow-4, shadow-border}`
- emits: `--vc-shadow-0` … `--vc-shadow-4`, `--vc-shadow-border`
- Tailwind-shaped class layer (`amvcp-tokens.css`) exposes:
  `.vc-shadow-0` … `.vc-shadow-4`, `.vc-shadow-border`

## Anti-slop interaction

A page that emits a `box-shadow: linear-gradient(…)` (glassmorphism-on-
gradient slop) WILL flag in `lintHtml`. Using `--vc-shadow-*` instead is
the structural fix: pre-baked, opaque-pixel shadows never look like
glassmorphism.

The MD3 ramp keeps shadow alpha realistic (0.06–0.18). Anything above
0.25 reads as a cartoon drop-shadow — if a designer asks for "stronger"
shadow, raise the **shadow-3 → shadow-4** step (more layers, more
blur) before raising the per-layer alpha.

## Selection / comment / decision-mini contract

Elevation has no inherent selection state. The contact-sheet's
elevation panel shows one neutral card per shadow level — each card is
a click-to-copy button that copies the literal `box-shadow` string. The
shadows themselves DO NOT change under selection — the selection
highlight (`--vc-selection-bg`) overlays the card without disturbing
the shadow geometry.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — screenshot the elevation
panel in **both themes** (R1). On dark canvas, near-black shadows are
nearly invisible by physics; the panel's neutral card backgrounds
(`--vc-color-surface-raised`) sit on a darker canvas, so the shadow's
*compression* of the surrounding canvas pixels gives the impression of
depth without a literal dark ring. If shadows are invisible in dark
mode, switch the model to `style: 'cinematic'` (more layers compensate
for low per-layer alpha) or tint the shadow ink toward the accent.

`shadow-0` MUST render as `none` (zero pixels of shadow). Verify with
`getComputedStyle(card0).boxShadow === 'none'`.
