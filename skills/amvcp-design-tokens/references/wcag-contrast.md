# WCAG contrast — `contrastRatio` and the contact-sheet annotation

## Table of Contents

- [What it does](#what-it-does)
- [The WCAG thresholds](#the-wcag-thresholds)
- [When to call](#when-to-call)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

WCAG 2.x contrast ratio between two hex colors. The single function
behind the contact-sheet's per-cell contrast annotation, the
`data-vc-contrast-warn` flag on under-contrast text cells, and every
"is this color pair readable" check across the plugin.

## What it does

```js
amvcpTokens.contrastRatio(hexA, hexB) -> number   // 1.0 … 21.0
amvcpTokens.relativeLuminance(hex)    -> number   // 0.0 … 1.0
```

`relativeLuminance` implements the WCAG formula:

```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
  (R, G, B are gamma-decoded — see srgbChannelToLinear)
```

`contrastRatio`:

```
ratio = (Lmax + 0.05) / (Lmin + 0.05)
```

Returns 1.0 (identical colors) … 21.0 (pure black vs pure white).

The function lives in `amvcp-tokens.js` and is also exposed on
`amvcpTokenSheet.contrastRatio` (the sheet pulls it directly so the
sheet is usable as a standalone in any browser test harness).

## The WCAG thresholds

| Use | Minimum ratio | WCAG level |
|---|---|---|
| body text, AA | **4.5:1** | required for typical text under 18pt regular / 14pt bold |
| body text, AAA | 7.0:1 | upgraded — for accessibility-strict artifacts |
| large text (≥18pt regular / ≥14pt bold), AA | 3.0:1 | the relaxed band for big text |
| UI components / focus indicators (border / accent against bg), AA | 3.0:1 | per WCAG 2.1 SC 1.4.11 |
| decorative (logos, incidental graphics, inactive UI) | no minimum | exempt |

The contact sheet uses 4.5:1 as the warn threshold for the three
content roles (`content`, `content-muted`, `content-subtle`) against
`surface`; every other role is checked against `canvas`. A failing
cell gets `data-vc-contrast-warn="1"` — `amvcp-tokens.css` stamps a
visible warning marker on it.

## When to call

- **Before assigning a color pair** — after generating an OKLCh ramp,
  spot-check `contrastRatio(rampStop, canvasHex)` for the candidate
  `content` role; if `< 4.5`, pick a different stop.
- **In a CI test** — assert every preset's body text passes 4.5:1 (the
  build test suite would call `contrastRatio` over every preset's
  `(content, canvas)`, `(content-muted, surface)`, etc.).
- **In a custom widget** — when emitting a chip with bg derived from
  one role and fg from another, verify the pair before shipping.

## Scaffold to emit

The check is INTERNAL — the agent typically doesn't expose it to the
reader. The contact-sheet annotation is the visible affordance:

```html
<!-- The contact-sheet's color panel renders cells like this: -->
<button data-vc-copy="#5b5343"
        data-vc-contrast-warn="0"
        style="background: var(--vc-color-content-muted);
               color:      var(--vc-color-surface);">
  content-muted
  <small>#5b5343 — 7.42:1</small>
</button>

<!-- A cell that fails 4.5:1 gets data-vc-contrast-warn="1" and
     amvcp-tokens.css adds a "low contrast" indicator. -->
```

## Lib functions used

- `amvcpTokens.contrastRatio(hexA, hexB)` → `number`
- `amvcpTokens.relativeLuminance(hex)` → `number` (a building block,
  usually you want `contrastRatio` directly)
- `amvcpTokenSheet.contrastRatio` — identical, exposed on the
  contact-sheet API for standalone use

## DESIGN.md tokens used

- reads (per call): two hex values (typically resolved from
  `--vc-color-*` tokens)
- writes: NOTHING — the function is pure

## Anti-slop interaction

A theme that ships `content` = `#0e1014` against `canvas` = `#0e1014`
(identical hex) would visually be invisible text, but the slop gate
doesn't catch it — `lintTokenSet` only checks for banned colors /
fonts. The contrast check is the COMPLEMENTARY safety net: the
build's `every_preset_passes_gate` test also asserts
`contrastRatio(content, canvas) >= 4.5` for every preset.

## Selection / comment / decision-mini contract

Selection (`--vc-selection-bg`) is a 20%-accent mix against
transparent — its effective contrast against the underlying text
depends on what's underneath. A `contrastRatio('var(--vc-selection-bg)
resolved', textHex)` check is meaningless because `var()` doesn't
resolve to a hex (it's a `color-mix` expression). For selection
contrast, eyeball-test or rely on the engine's accent choice (a sane
accent ensures selection is visible).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact sheet
under `dev-browser`, screenshot the color panel in **both themes**
(R1), and visually scan for any swatch with
`data-vc-contrast-warn="1"`. The CSS for that attribute should make
the warning unmistakeable (an outline / icon). Use `page.evaluate(
() => Array.from(document.querySelectorAll('[data-vc-contrast-warn=\"1\"]'))
  .length)` to programmatically count failing swatches — for a
production preset the count should be 0.

A preset that ships with 1+ failing swatches is a build defect; fix
the source DESIGN.md rather than weakening the threshold.
