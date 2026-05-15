---
name: amvcp-design-tokens
description: "Generate, validate, and visualize a design-token system: principled scales (phi spacing, OKLCH color ramp, MD3 elevation, motion library, z-index), named dual-theme presets, semantic-role color maps, and a click-to-copy token contact sheet. Use when asked to 'make a design system', 'pick a palette / theme', 'generate a color ramp', 'show the design tokens', 'render a style guide / living design page', 'check for AI-slop colors', or 'apply a brand preset'. Triggers: 'design tokens', 'token contact sheet', 'color ramp', 'palette preset', 'elevation scale', 'anti-slop check'."
license: MIT
metadata:
  author: Emasoft
---

# Design Tokens

## Overview

The token-vocabulary and token-rendering layer that sits on top of the
DESIGN.md engine (`amvcp-designmd.js`). The engine parses, validates,
resolves `{token.refs}`, and applies a DESIGN.md as `--vc-*` CSS custom
properties. This skill adds: principled algorithmic generators (phi
spacing, OKLCH color ramp, MD3 elevation, motion library, z-index), a
library of ~13 named dual-theme presets, semantic-role color maps
(badge / activity / graph-node / icon-tint), one consolidated
anti-AI-slop gate, and the token contact sheet — a self-contained,
DESIGN.md-themed "living design page" showing every token visually,
click-to-copy. Every other visual-communicator technique themes off the
`--vc-*` vocabulary this skill defines.

## Prerequisites

- Browser (Chromium via `--app=URL` preferred; default browser works).
- `amvcp-designmd.js` colocated with the HTML — the engine; this skill
  expands it and consumes `parseDesignMd` / `resolveTokens` /
  `serializeDesignMd` / `tokenSchema`.
- `amvcp-tokens.js` (generators, presets, role maps, anti-slop gate),
  `amvcp-token-sheet.js` (contact-sheet renderer), `amvcp-tokens.css`
  (derived `--vc-state-*`, the `.vc-state` overlay, the role-map family,
  the contact-sheet chrome, the `.vc-*` utility classes) — all
  dependency-free, dual-export, no build step.
- `amvcp-runtime.js` (optional) — the contact sheet uses its
  `window.__veDesignMd` hot-swap / theme hooks when present.

## Instructions

This is a decision recipe — match the request to one numbered step.

1. **Color ramp** ("generate a color ramp / palette"): call
   `amvcpTokens.generateOklchRamp(seedHex, steps, opts)` — a perceptual
   OKLCH ramp. Map ramp stops to the 15 `--vc-color-*` roles (a mid stop
   → `accent`, a near-white stop → `surface-sunken`, etc.). For tonally
   locked neutrals use `generateNeutralScale(inkHex, stops)`.
2. **Spacing / elevation / motion / z-index scales**: call
   `generatePhiSpacing`, `generateElevationScale`, `generateMotionLibrary`,
   `generateZIndexScale` — they populate a DESIGN.md's `spacing` /
   `elevation` / `motion` / `z-index` groups. See `type-scale` peers.
3. **Pick a theme / apply a brand preset** ("pick a palette", "apply a
   preset"): list `amvcpTokens.PRESETS` (~13 named dual-theme sets),
   pick one by name, emit its frontmatter as the page's
   `<script type="text/design-md">` block. To restyle a finished page,
   call `window.__veDesignMd.hotSwap(presetText)` — the whole page
   re-themes live, no reload. To nudge personality, run
   `applyPersonalityDelta(designmdText, 'warmer'|'playful'|…)`.
4. **Badge / activity / graph-node / icon colors**: call
   `amvcpTokens.renderRoleMapCss(name)` and inject the returned
   `<style>`; apply `data-vc-role="<role>"` to elements.
5. **Check for AI-slop**: run `amvcpTokens.lintTokenSet(designmd)` on
   the token set and `lintHtml(htmlString)` on the final emitted HTML
   before delivering. A non-`ok` result is a hard error — fix the
   source. In a browser dev/check mode, `lintLiveDocument(rootEl)`
   stamps `data-vc-slop-alert` on offenders.
6. **Show the tokens / render a style guide** ("show the design
   tokens", "living design page", "style guide"): parse a DESIGN.md
   with `amvcpDesignMd.parseDesignMd`, then
   `amvcpTokenSheet.mountContactSheet(parsed.designmd, container)` — one
   panel per token group, click-to-copy, both themes, contrast
   annotated.
7. Always end: emit ONE self-contained HTML file, theming exclusively
   off `--vc-*` (zero hardcoded colors/sizes), run `lintHtml` on it,
   then deliver.

## Output

- A self-contained `.html` file: a `<script type="text/design-md">`
  block + colocated `amvcp-designmd.js` / `amvcp-runtime.js` /
  `amvcp-tokens.js` / `amvcp-token-sheet.js` / `amvcp-tokens.css`. No
  CDN, no web font unless the DESIGN.md's stack names one.
- The contact sheet: `<main class="vc-sheet">` with one
  `<section data-vc-panel="…">` per token group; every swatch is a
  `<button data-vc-copy="…">`.

## Error Handling

- Malformed DESIGN.md → `parseDesignMd` returns `ok:false`; the engine
  applies nothing (fail-fast). Surface `errors`, fix the source.
- A preset / token set that fails `lintTokenSet` is a hard error — a
  preset library that ships slop is a contradiction. Shift the offending
  color/font; never weaken the gate.
- Pure `#000000` / `#ffffff` are flagged exact — use an off-black /
  off-white. Inter / Roboto / Open Sans / Lato / Nunito are flagged only
  as the *first* family of a font stack (fine as a fallback).
- Generators fail-fast: `generatePhiSpacing` throws if the scale
  collapses; `generateOklchRamp` throws on an unparseable seed hex.
- Click-to-copy is the ONE deliberate fail-soft — a missing
  `navigator.clipboard` degrades gracefully (it is a convenience, not a
  data contract). Everything else fails fast.
- No nested scrollbars — wide content (the color grid, code `<pre>`)
  extends the page; never an inner `overflow:auto` box.

## Examples

- *"Make a warm design system and show me the tokens."* → pick the
  `heritage` preset (step 3), mount the contact sheet (step 6), run
  `lintHtml` (step 5), deliver one HTML file.
- *"Generate a 10-step blue color ramp."* → `generateOklchRamp('#1d4ed8',
  10)` (step 1), map stops to the color roles, emit the DESIGN.md.
- *"Check this report for AI-slop colors."* → `lintHtml(html)` (step 5),
  report violations, fix the raw hexes / gradient backgrounds.
- *"Apply the factory-dark theme to this page."* →
  `window.__veDesignMd.hotSwap(amvcpTokens.PRESETS['factory-dark'])`
  (step 3) — the page re-themes live.

## Resources

- [token-vocabulary.md](./references/token-vocabulary.md) — the 5-layer
  naming convention, the `@layer` architecture, the 23-variable minimal
  theme contract, the derived `--vc-state-*` family, scoped theming.
- [preset-library.md](./references/preset-library.md) — the ~13 named
  dual-theme presets, `applyPersonalityDelta`, hot-swap restyling.
- [semantic-role-maps.md](./references/semantic-role-maps.md) — the
  badge / activity / graph-node / icon-tint role maps and the
  golden-angle categorical generator.
- [anti-slop-rules.md](./references/anti-slop-rules.md) — the banned
  colors / fonts / patterns reference and how the gate works.
- [contact-sheet-schema.md](./references/contact-sheet-schema.md) — the
  contact-sheet HTML structure, the per-panel data attributes,
  click-to-copy.
