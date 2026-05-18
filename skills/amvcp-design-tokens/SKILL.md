---
name: amvcp-design-tokens
description: "Token-vocabulary and rendering layer on the DESIGN.md engine — phi spacing, OKLCh color ramp, MD3 elevation, motion library, z-index scale, 13 dual-theme presets, semantic role maps, anti-AI-slop gate, click-to-copy token contact sheet. Every other amvcp technique themes off the --vc-* tokens this skill defines. Use when the user wants to scaffold tokens, pick a palette, build a style guide, run anti-slop checks. Trigger with 'design tokens', 'design system', 'style guide', 'color ramp', 'color palette', 'OKLCH', 'anti-slop check', 'theme generator', 'hot-swap restyle'."
license: MIT
metadata:
  author: Emasoft
---

# Design Tokens

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

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

## When to choose this category

The decision recipe in §Instructions is the primary entry point. Match
the request to a step; each step links to one or more references for
the deep dive.

| If the user asks for … | Start at step | Then read |
|---|---|---|
| "make a design system" / "design tokens" | step 3 + step 6 | [preset-library.md](./references/preset-library.md), [contact-sheet-schema.md](./references/contact-sheet-schema.md), [dual-theme-contract.md](./references/dual-theme-contract.md) |
  > The presets · Anti-slop note — `trust-indigo` · Personality deltas — `applyPersonalityDelta` · Hot-swap restyling · Scoped theming with a preset
  > API · Page structure · Color cells — contrast annotation · Click-to-copy · Theme handling · No nested scrollbars · Self-contained output
  > Why dual-theme is mandatory (not "nice to have") · How the engine enforces it · How the theme flip works · The mechanical tricks for dual-theme correctness · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "show me the design tokens" / "living design page" / "style guide" | step 6 | [contact-sheet-schema.md](./references/contact-sheet-schema.md), [contact-sheet-color-panel.md](./references/contact-sheet-color-panel.md), [click-to-copy.md](./references/click-to-copy.md) |
  > API · Page structure · Color cells — contrast annotation · Click-to-copy · Theme handling · No nested scrollbars · Self-contained output
  > What it does · Why both themes side-by-side · The contrast annotation · The contrast formula · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it does · Why fail-soft (instead of fail-fast) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "generate a color ramp" / "blue palette" | step 1 | [oklch-color-ramp.md](./references/oklch-color-ramp.md), [oklch-color-space.md](./references/oklch-color-space.md), [wcag-contrast.md](./references/wcag-contrast.md) |
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > Why OKLCh · The conversions · The `oklchToHex` shortcut · The `oklchToP3` shortcut · The `oklabDeltaE` distance · When to use OKLCh in custom widgets · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it does · The WCAG thresholds · When to call · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "pick a palette" / "apply a preset" / "make it warm" | step 3 | [preset-library.md](./references/preset-library.md), [preset-category-system.md](./references/preset-category-system.md), [heritage-warm-palette.md](./references/heritage-warm-palette.md), [factory-dark-palette.md](./references/factory-dark-palette.md) |
  > The presets · Anti-slop note — `trust-indigo` · Personality deltas — `applyPersonalityDelta` · Hot-swap restyling · Scoped theming with a preset
  > The nine categories · When to use which category · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Adding a new preset to a category · Selection / comment / decision-mini contract · Visual verification
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "make it warmer / cooler / playful / corporate" | step 3 | [personality-deltas.md](./references/personality-deltas.md), [hot-swap-restyling.md](./references/hot-swap-restyling.md) |
  > What it does · When to use which delta · Composing deltas · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > Overview · What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "live-token playground" / "token tuner UI" | step 3 | [live-token-playground.md](./references/live-token-playground.md), [hot-swap-restyling.md](./references/hot-swap-restyling.md) |
  > What it does · When to ship a playground · Scaffold to emit · The hover→snippet preview pattern (DM-22 reference) · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > Overview · What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "spacing scale" / "8pt grid" / "phi spacing" | step 2 | [phi-spacing-generator.md](./references/phi-spacing-generator.md) |
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "elevation" / "shadow scale" / "cinematic shadows" | step 2 | [elevation-scale.md](./references/elevation-scale.md) |
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "motion tokens" / "easing library" / "duration scale" | step 2 | [motion-token-library.md](./references/motion-token-library.md), [contact-sheet-motion-panel.md](./references/contact-sheet-motion-panel.md) |
  > What it does · When to pick which duration · When to pick which easing · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Reduced-motion contract · Selection / comment / decision-mini contract · Visual verification
  > What it does · Why an animated demo (vs a static curve plot) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "z-index scale" / "stacking levels" | step 2 | [z-index-scale.md](./references/z-index-scale.md), [contact-sheet-z-panel.md](./references/contact-sheet-z-panel.md) |
  > What it does · When to use which level · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it does · Why overlap (vs a single-column legend) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "neutral gray scale" / "derived from one ink" | step 2 | [neutral-scale-generator.md](./references/neutral-scale-generator.md) |
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Single source of truth · Selection / comment / decision-mini contract · Visual verification
| "interaction states" / "hover/focus/pressed" | (downstream of step 3) | [interaction-state-tokens.md](./references/interaction-state-tokens.md), [contact-sheet-state-panel.md](./references/contact-sheet-state-panel.md) |
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > Overview · What it does · Why both frozen AND live · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "dark text hierarchy" / "on-surface text tiers" | (downstream of step 3) | [dark-text-hierarchy.md](./references/dark-text-hierarchy.md) |
  > What it does · When to use which tier · When to use the on-surface family vs. the engine's content roles · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "badge / severity colors" (MUST/IMO/Q/FYI) | step 4 | [badge-severity-roles.md](./references/badge-severity-roles.md), [derived-state-color-split.md](./references/derived-state-color-split.md) |
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it does · The percentages · When to use the derived family vs. the base role · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "activity colors" (working/meeting/break/...) | step 4 | [activity-color-map.md](./references/activity-color-map.md), [golden-angle-categorical.md](./references/golden-angle-categorical.md) |
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it does · When to use · Why golden-angle vs. evenly-spaced (`360 / N`) · When to seed from the active accent · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "graph-node colors" (source/filter/transform/...) | step 4 | [graph-node-color-map.md](./references/graph-node-color-map.md) |
  > What it does · When to use which role · When NOT to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "icon tints" / "auto-tinted feature cards" | step 4 | [icon-tint-rotation.md](./references/icon-tint-rotation.md) |
  > What it does · When to use · Scaffold to emit · DT-15 — the `--icon-color-rgb` legacy alternative · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "check for AI-slop" / "anti-slop audit" | step 5 | [anti-slop-rules.md](./references/anti-slop-rules.md), [lint-live-document.md](./references/lint-live-document.md) |
  > API · Banned colors · Banned primary fonts · Banned patterns · Output discipline — fail-fast, report-only · Where it runs
  > What it does · Why a live walk vs. linting source · When to run · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "code syntax highlighting" / "code theme" | step 7 (CSS class) | [code-syntax-tokens.md](./references/code-syntax-tokens.md), [contact-sheet-code-panel.md](./references/contact-sheet-code-panel.md) |
  > The 12 tokens · What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it does · Why a tiny built-in tokenizer · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "syntax-highlight tokens / Code panel" | step 6 | [code-syntax-tokens.md](./references/code-syntax-tokens.md), [contact-sheet-code-panel.md](./references/contact-sheet-code-panel.md) |
  > The 12 tokens · What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it does · Why a tiny built-in tokenizer · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "CJK / Japanese / Chinese / Korean typography" | step 3 | [cjk-typography-tokens.md](./references/cjk-typography-tokens.md) |
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "wireframe colors / grayscale" | step 3 | [wireframe-grayscale-palette.md](./references/wireframe-grayscale-palette.md) |
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "P3 wide-gamut accent" | step 1 (opts.p3) | [p3-wide-gamut.md](./references/p3-wide-gamut.md) |
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "scope theme to one section" / "sidebar with different palette" | step 3 (per-rootEl) | [scoped-theming.md](./references/scoped-theming.md) |
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "multi-brand blend" / "co-branded artifact" | (advanced) | [multi-brand-mixer.md](./references/multi-brand-mixer.md) |
  > What it does · When to use · The per-role rules (suggested defaults) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "Tailwind-shaped utility classes" / "what classes exist" | step 7 | [tailwind-utility-classes.md](./references/tailwind-utility-classes.md) |
  > What it does · When to use · When NOT to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Tailwind v4 `@theme` export shape (DM-15) · Selection / comment / decision-mini contract · Visual verification
| "@layer architecture" / "CSS cascade" | (architecture) | [layer-architecture.md](./references/layer-architecture.md), [token-vocabulary.md](./references/token-vocabulary.md) |
  > What it does · Why this order · Why empty `ve-primitive`? · Host-page interactions · When to add things to which layer · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > The 5-layer naming mapping · The 3-tier `@layer` architecture · The 23-variable minimal theme contract · Dark text hierarchy (DT-08) · Scoped theming (DT-06) · Tailwind-shaped utility classes (DT-20 / DM-15)
| "delegate one token to another" | (architecture) | [token-delegation-chain.md](./references/token-delegation-chain.md), [centralised-token-pattern.md](./references/centralised-token-pattern.md) |
  > What it is · Why both uses · When to use delegation · When to use fallback · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  > What it demonstrates · The AMVCP equivalent · When to invoke this lesson · Default-color delegation chain (companion pattern) · Separate-file token + vendor overrides (companion pattern) · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
| "dual-theme contract" / "why both light AND dark" | (rationale) | [dual-theme-contract.md](./references/dual-theme-contract.md) |
  > Why dual-theme is mandatory (not "nice to have") · How the engine enforces it · How the theme flip works · The mechanical tricks for dual-theme correctness · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification

## Modes

This skill supports `data-ve-mode="readonly"` only. It is the foundational token-vocabulary layer — every other skill themes off the `--vc-*` tokens it defines. Token swatches in the contact-sheet view are click-to-copy, NOT decision atoms; the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

This skill is composed by EVERY other amvcp-* skill on the page (R22) — it is the substrate. The contact-sheet view itself composes with all other visual surfaces. The only exclusive skill is the overlay-runtime (R24).

## Resources

### Architecture and vocabulary

- [token-vocabulary.md](./references/token-vocabulary.md) — the 5-layer
  > The 5-layer naming mapping · The 3-tier `@layer` architecture · The 23-variable minimal theme contract · Dark text hierarchy (DT-08) · Scoped theming (DT-06) · Tailwind-shaped utility classes (DT-20 / DM-15)
  naming convention mapped onto the engine's `--vc-*` set, the 23-variable
  minimal theme contract, the derived `--vc-state-*` family.
- [layer-architecture.md](./references/layer-architecture.md) — the
  > What it does · Why this order · Why empty `ve-primitive`? · Host-page interactions · When to add things to which layer · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  `@layer ve-primitive, ve-semantic, ve-component` cascade and why the
  primitive tier wins via inline-style.
- [centralised-token-pattern.md](./references/centralised-token-pattern.md)
  > What it demonstrates · The AMVCP equivalent · When to invoke this lesson · Default-color delegation chain (companion pattern) · Separate-file token + vendor overrides (companion pattern) · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — prior art for the "one source of truth for all primitives" pattern
  (LaTeX `signalflowdiagram.sty` precedent).
- [token-delegation-chain.md](./references/token-delegation-chain.md) —
  > What it is · Why both uses · When to use delegation · When to use fallback · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  `var(--primary, var(--secondary, fallback))` cascade strategy.
- [dual-theme-contract.md](./references/dual-theme-contract.md) — why
  > Why dual-theme is mandatory (not "nice to have") · How the engine enforces it · How the theme flip works · The mechanical tricks for dual-theme correctness · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  every artifact ships BOTH light AND dark, mechanically.
- [scoped-theming.md](./references/scoped-theming.md) — per-section /
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  per-component DESIGN.md via `applyTokens(map, rootEl)`.

### Scale generators

- [phi-spacing-generator.md](./references/phi-spacing-generator.md) — φ
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  spacing scale generator (DT-01).
- [oklch-color-ramp.md](./references/oklch-color-ramp.md) — OKLCh
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  perceptual ramp generator with phi / Radix curves (DT-02 + DM-17).
- [oklch-color-space.md](./references/oklch-color-space.md) — the OKLCh
  > Why OKLCh · The conversions · The `oklchToHex` shortcut · The `oklchToP3` shortcut · The `oklabDeltaE` distance · When to use OKLCh in custom widgets · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  color-space rationale + conversion math.
- [neutral-scale-generator.md](./references/neutral-scale-generator.md)
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Single source of truth · Selection / comment / decision-mini contract · Visual verification
  — single-ink neutral scale via `color-mix(... transparent)` (DT-11).
- [elevation-scale.md](./references/elevation-scale.md) — MD3 +
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  cinematic shadow scales (DT-04).
- [motion-token-library.md](./references/motion-token-library.md) —
  > What it does · When to pick which duration · When to pick which easing · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Reduced-motion contract · Selection / comment / decision-mini contract · Visual verification
  8 durations × 8 easings (DT-05 + DM-24).
- [z-index-scale.md](./references/z-index-scale.md) — 9-level semantic
  > What it does · When to use which level · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  stacking scale (DT-14).
- [golden-angle-categorical.md](./references/golden-angle-categorical.md)
  > What it does · When to use · Why golden-angle vs. evenly-spaced (`360 / N`) · When to seed from the active accent · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — N maximally-separated hues via golden-angle hue rotation.
- [p3-wide-gamut.md](./references/p3-wide-gamut.md) — P3 wide-gamut
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  accent via `@supports` (DT-18).
- [dark-text-hierarchy.md](./references/dark-text-hierarchy.md) — 3-tier
  > What it does · When to use which tier · When to use the on-surface family vs. the engine's content roles · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  on-surface text family (DT-08).
- [interaction-state-tokens.md](./references/interaction-state-tokens.md)
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — MD3 state-layer opacities + `.vc-state` overlay (DT-03 + DT-21).
- [derived-state-color-split.md](./references/derived-state-color-split.md)
  > What it does · The percentages · When to use the derived family vs. the base role · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — fg/bg/border/icon split derived per semantic role.
- [wcag-contrast.md](./references/wcag-contrast.md) — `contrastRatio`
  > What it does · The WCAG thresholds · When to call · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  + the contact-sheet's per-cell annotation.

### Presets and personality

- [preset-library.md](./references/preset-library.md) — the 13 named
  > The presets · Anti-slop note — `trust-indigo` · Personality deltas — `applyPersonalityDelta` · Hot-swap restyling · Scoped theming with a preset
  dual-theme presets, `applyPersonalityDelta`, hot-swap restyling.
- [preset-category-system.md](./references/preset-category-system.md) —
  > The nine categories · When to use which category · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Adding a new preset to a category · Selection / comment / decision-mini contract · Visual verification
  the 9-category aesthetic taxonomy (Bold/Warm/Dark/Clean/...) (DT-26).
- [heritage-warm-palette.md](./references/heritage-warm-palette.md) —
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  the runtime default preset (DT-10 territory).
- [factory-dark-palette.md](./references/factory-dark-palette.md) —
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  the industrial-orange dark-first preset (DT-07).
- [wireframe-grayscale-palette.md](./references/wireframe-grayscale-palette.md)
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — the zero-hue zero-radius preset (DT-24).
- [cjk-typography-tokens.md](./references/cjk-typography-tokens.md) —
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  Source Han + line-height 1.8 + letter-spacing 0.05em (DT-25).
- [personality-deltas.md](./references/personality-deltas.md) — playful
  > What it does · When to use which delta · Composing deltas · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  / corporate / minimal / warmer / cooler deltas.
- [hot-swap-restyling.md](./references/hot-swap-restyling.md) —
  > Overview · What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  `window.__veDesignMd.hotSwap(text)` (DM-25).
- [live-token-playground.md](./references/live-token-playground.md) —
  > What it does · When to ship a playground · Scaffold to emit · The hover→snippet preview pattern (DM-22 reference) · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  sliders / pickers writing to `--vc-*` for live tuning.
- [multi-brand-mixer.md](./references/multi-brand-mixer.md) — blend two
  > What it does · When to use · The per-role rules (suggested defaults) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  DESIGN.mds with per-role rules (DM-23).

### Semantic role maps

- [semantic-role-maps.md](./references/semantic-role-maps.md) — the
  > The generic shape · The shipped maps · The golden-angle categorical generator · Seeding off the active accent
  generic role-map mechanism + index of shipped maps.
- [badge-severity-roles.md](./references/badge-severity-roles.md) —
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  MUST/IMO/Q/FYI (DT-19).
- [activity-color-map.md](./references/activity-color-map.md) —
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  7-state productivity convention (DT-22).
- [graph-node-color-map.md](./references/graph-node-color-map.md) —
  > What it does · When to use which role · When NOT to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  6-role pipeline / DAG colors (DT-16).
- [icon-tint-rotation.md](./references/icon-tint-rotation.md) —
  > What it does · When to use · Scaffold to emit · DT-15 — the `--icon-color-rgb` legacy alternative · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  6-color `:nth-child` rotation for icon cards (DT-12 + DT-15).

### Anti-slop gate

- [anti-slop-rules.md](./references/anti-slop-rules.md) — the banned
  > API · Banned colors · Banned primary fonts · Banned patterns · Output discipline — fail-fast, report-only · Where it runs
  colors / fonts / patterns reference and how the gate works.
- [lint-live-document.md](./references/lint-live-document.md) — the
  > What it does · Why a live walk vs. linting source · When to run · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  in-browser DOM-walking variant.

### Token vocabulary (per-token-group)

- [code-syntax-tokens.md](./references/code-syntax-tokens.md) —
  > The 12 tokens · What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  12-token syntax-highlight vocabulary (DM-26).
- [tailwind-utility-classes.md](./references/tailwind-utility-classes.md)
  > What it does · When to use · When NOT to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Tailwind v4 `@theme` export shape (DM-15) · Selection / comment / decision-mini contract · Visual verification
  — the `.vc-*` utility class layer (DT-20 + DM-15).

### Contact sheet — the headline deliverable

- [contact-sheet-schema.md](./references/contact-sheet-schema.md) — the
  > API · Page structure · Color cells — contrast annotation · Click-to-copy · Theme handling · No nested scrollbars · Self-contained output
  contact-sheet HTML structure, the per-panel `data-vc-panel` attributes,
  click-to-copy.
- [contact-sheet-color-panel.md](./references/contact-sheet-color-panel.md)
  > What it does · Why both themes side-by-side · The contrast annotation · The contrast formula · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — both-themes-side-by-side color grid with WCAG annotation.
- [contact-sheet-typography-panel.md](./references/contact-sheet-typography-panel.md)
  > What it does · Why one specimen text repeated · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — type specimens + font-stack rows.
- [contact-sheet-spacing-panel.md](./references/contact-sheet-spacing-panel.md)
  > What it does · Why true pixels (not percentages) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — true-pixel-width spacing bars.
- [contact-sheet-radius-elevation.md](./references/contact-sheet-radius-elevation.md)
  > Radius panel · Elevation panel · Why both panels show literal values · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — radius squares + elevation cards.
- [contact-sheet-motion-panel.md](./references/contact-sheet-motion-panel.md)
  > What it does · Why an animated demo (vs a static curve plot) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — click-to-feel easing chips.
- [contact-sheet-z-panel.md](./references/contact-sheet-z-panel.md) —
  > What it does · Why overlap (vs a single-column legend) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  overlapping plates stack.
- [contact-sheet-state-panel.md](./references/contact-sheet-state-panel.md)
  > Overview · What it does · Why both frozen AND live · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — frozen state demos + live instance.
- [contact-sheet-code-panel.md](./references/contact-sheet-code-panel.md)
  > What it does · Why a tiny built-in tokenizer · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  — syntax-highlighted sample + 12-color legend.
- [click-to-copy.md](./references/click-to-copy.md) — the contact-sheet's
  > What it does · Why fail-soft (instead of fail-fast) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
  ONE deliberate fail-soft path.
