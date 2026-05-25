---
name: amvcp-tokens-scales
description: "Algorithmic scale generators + token vocabulary — phi spacing, MD3 + cinematic elevation, motion library (8 durations × 8 easings), 9-level z-index, Tailwind utility classes, 5-layer naming, `@layer` cascade (primitive < semantic < component), centralised pattern, `var()` delegation chain. Use when generating spacing/elevation/motion/z-index scales or wiring the `--vc-*` architecture. Trigger with 'phi spacing', 'elevation', 'motion tokens', 'z-index scale', 'token vocabulary', '@layer'."
license: MIT
metadata:
  author: Emasoft
---

# Token Scales & Vocabulary

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling token skills:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) (router) · [amvcp-tokens-color](../amvcp-tokens-color/SKILL.md) · [amvcp-tokens-presets](../amvcp-tokens-presets/SKILL.md) · [amvcp-tokens-anti-slop](../amvcp-tokens-anti-slop/SKILL.md) · [amvcp-tokens-contact-sheet](../amvcp-tokens-contact-sheet/SKILL.md).

## Overview

The algorithmic scale generators (phi spacing, MD3 + cinematic elevation, 8×8 motion library, 9-level semantic z-index) AND the foundational token-vocabulary architecture (5-layer naming convention, 23-variable minimal theme contract, `@layer ve-primitive < ve-semantic < ve-component` cascade, centralised token pattern with single source of truth, `var()` delegation chain for fallback). The Tailwind-shaped `.vc-*` utility class layer that exposes the tokens as compositional class names. These are the structural scaffolding every other token skill builds on — color and preset skills assume this vocabulary exists.

## Prerequisites

- `amvcp-designmd.js` colocated with the HTML — exposes `parseDesignMd`, `resolveTokens`, `applyTokens`.
- `amvcp-tokens.js` for the generators (`generatePhiSpacing`, `generateElevationScale`, `generateMotionLibrary`, `generateZIndexScale`).
- `amvcp-tokens.css` for the `.vc-*` utility classes + the `@layer` cascade declaration.
- Optional: `amvcp-runtime.js` to apply scoped scales to a sub-tree via `applyTokens(map, rootEl)`.

## Instructions

1. **Phi spacing scale** — call `amvcpTokens.generatePhiSpacing(basePx, steps)` (positional: base px size + step count) to produce a golden-ratio progression of spacing tokens. Populates the DESIGN.md `spacing:` group. See [phi-spacing-generator](./references/phi-spacing-generator.md).
2. **Elevation scale** — call `generateElevationScale(opts)` (`opts.style` = `'md3'` (default) or `'cinematic'`; `opts.tint` optional) for the MD3 5-level scale plus cinematic shadow variants. Populates the `elevation:` group. See [elevation-scale](./references/elevation-scale.md).
3. **Motion library** — call `generateMotionLibrary()` (no args) for 8 durations × 8 easings + the master damper. Populates the `motion:` group. Reduced-motion gates handled by consumers. See [motion-token-library](./references/motion-token-library.md).
4. **Z-index scale** — call `generateZIndexScale()` (no args) for the 9-level semantic stacking scale (behind / base / raised / dropdown / sticky / overlay / modal / toast / tooltip). Populates the `z-index:` group. See [z-index-scale](./references/z-index-scale.md).
5. **Token vocabulary** — wire the 5-layer naming (primitive → semantic → component → utility → state) per [token-vocabulary](./references/token-vocabulary.md). Use [layer-architecture](./references/layer-architecture.md) to declare `@layer ve-primitive, ve-semantic, ve-component` in the right order.
6. **Centralised pattern** — keep ONE source of truth for primitives per [centralised-token-pattern](./references/centralised-token-pattern.md). Never duplicate a primitive in two `.css` files.
7. **Delegation chain** — for component-local overrides, use the `var(--primary, var(--secondary, fallback))` fallback chain per [token-delegation-chain](./references/token-delegation-chain.md).
8. **Tailwind-shaped utilities** — `.vc-*` classes expose the tokens as composable utilities per [tailwind-utility-classes](./references/tailwind-utility-classes.md). Use them when authoring component markup that should automatically theme off the DESIGN.md.
9. **Always end** — pipe the generated DESIGN.md / emitted CSS through `amvcpTokens.lintTokenSet` (the anti-slop sibling).

## Output

- A populated DESIGN.md `spacing:` / `elevation:` / `motion:` / `z-index:` group (raw text or parsed shape).
- A CSS file declaring the `@layer ve-primitive, ve-semantic, ve-component` cascade and the `.vc-*` utility classes.
- A 23-variable minimal-theme contract that any consumer skill can rely on.

## Error Handling

| Symptom | Fix |
|---|---|
| `generatePhiSpacing` throws | `basePx` is not a positive finite number, or `steps` is not a positive integer. Pass valid positional args, e.g. `generatePhiSpacing(4, 10)`. |
| `generateElevationScale` produces flat shadows | `opts.style` typo — must be exactly `'md3'` or `'cinematic'` (any other value falls back to `'md3'`). |
| `@layer` cascade has no effect | Declaration order is wrong. The `@layer ve-primitive, ve-semantic, ve-component;` line MUST come BEFORE any rule that uses those layers. |
| Component reads `--vc-color-accent` and gets empty | The DESIGN.md has no `color.accent:` defined, AND the consumer doesn't use a fallback chain. Either define the primitive in DESIGN.md OR add `var(--vc-color-accent, fallback)` at the consumer. |
| `.vc-*` utility class has no effect | The `amvcp-tokens.css` file isn't loaded OR the class is being overridden by a more-specific selector that doesn't read tokens. |
| Two CSS files define the same primitive | Violates the centralised pattern — pick one source of truth and have the other read it via `var()`. |
| Token delegation chain produces wrong color | The fallback's hex was hand-typed instead of derived. Replace the hand-typed hex with another `var()` reference up the chain. |

## Examples

```
Input:  "Generate a φ-spaced spacing scale starting from 4px."
Output: generatePhiSpacing(4, 10) (step 1) → 10 integer-rounded stops
        4, 6, 10, 17, 27, 44, 72, 116, 188, 304 (φ ≈ 1.618).
        Apply via resolveTokens + applyTokens. Verify in the contact-sheet
        spacing panel.

Input:  "Set up the MD3 elevation tokens."
Output: generateElevationScale({ style: 'md3' }) (step 2) → shadow-0
        through shadow-4 plus shadow-border, each a box-shadow with
        MD3-tuned blur and offset for material elevation levels 0–4.

Input:  "Establish the @layer cascade for a new page."
Output: step 5 — emit at the top of the stylesheet:
        @layer ve-primitive, ve-semantic, ve-component;
        then declare each layer's rules inside @layer <name> { ... }.

Input:  "Use var() fallbacks for a component-scoped accent."
Output: step 7 — three-level chain, last token a literal:
        color: var(--my-component-accent,
                   var(--vc-color-accent,
                       oklch(0.6 0.15 230)));
```

## Modes

This skill supports `data-ve-mode="readonly"` only. Scale generators emit DESIGN.md content; they do not introduce per-element decision atoms. The per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Composes with every other amvcp-tokens-* skill — color skills consume the `--vc-color-*` vocabulary defined here, presets consume the full token contract, the contact sheet renders one panel per generated scale, anti-slop lints the emitted token set. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [phi-spacing-generator.md](./references/phi-spacing-generator.md) — golden-ratio spacing progression (DT-01).
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [elevation-scale.md](./references/elevation-scale.md) — MD3 + cinematic shadow scales (DT-04).
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [motion-token-library.md](./references/motion-token-library.md) — 8 durations × 8 easings (DT-05 + DM-24).
  > What it does · When to pick which duration · When to pick which easing · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Reduced-motion contract · Selection / comment / decision-mini contract · Visual verification
- [z-index-scale.md](./references/z-index-scale.md) — 9-level semantic stacking scale (DT-14).
  > What it does · When to use which level · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [token-vocabulary.md](./references/token-vocabulary.md) — the 5-layer naming convention + 23-variable minimal theme contract.
  > The 5-layer naming mapping · The 3-tier `@layer` architecture · The 23-variable minimal theme contract · Dark text hierarchy (DT-08) · Scoped theming (DT-06) · Tailwind-shaped utility classes (DT-20 / DM-15)
- [layer-architecture.md](./references/layer-architecture.md) — `@layer ve-primitive < ve-semantic < ve-component` cascade (DM-08).
  > What it does · Why this order · Why empty `ve-primitive`? · Host-page interactions · When to add things to which layer · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [centralised-token-pattern.md](./references/centralised-token-pattern.md) — single-source-of-truth pattern (LaTeX `signalflowdiagram.sty` precedent).
  > What it demonstrates · The AMVCP equivalent · When to invoke this lesson · Default-color delegation chain (companion pattern) · Separate-file token + vendor overrides (companion pattern) · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [token-delegation-chain.md](./references/token-delegation-chain.md) — `var(--primary, var(--secondary, fallback))` strategy.
  > What it is · Why both uses · When to use delegation · When to use fallback · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [tailwind-utility-classes.md](./references/tailwind-utility-classes.md) — `.vc-*` utility class layer (DT-20 + DM-15).
  > What it does · When to use · When NOT to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Tailwind v4 `@theme` export shape (DM-15) · Selection / comment / decision-mini contract · Visual verification
