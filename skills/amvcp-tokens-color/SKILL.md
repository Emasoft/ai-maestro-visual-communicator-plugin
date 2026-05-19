---
name: amvcp-tokens-color
description: "Color generators + role maps for visual-communicator tokens — OKLCh perceptual ramp, neutral scale, golden-angle categorical, P3 wide-gamut, WCAG contrast, semantic role maps (badge, activity, graph-node, icon tint), derived fg/bg/border/icon split, MD3 state opacities, 3-tier dark text hierarchy. Use when generating a palette or wiring badge/activity/graph colors. Trigger with 'color ramp', 'OKLCH', 'WCAG contrast', 'badge colors', 'activity colors', 'icon tint', 'dark text'."
license: MIT
metadata:
  author: Emasoft
---

# Token Color & Role Maps

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling token skills:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) (router) · [amvcp-tokens-scales](../amvcp-tokens-scales/SKILL.md) · [amvcp-tokens-presets](../amvcp-tokens-presets/SKILL.md) · [amvcp-tokens-anti-slop](../amvcp-tokens-anti-slop/SKILL.md) · [amvcp-tokens-contact-sheet](../amvcp-tokens-contact-sheet/SKILL.md).

## Overview

The color layer of the token system — perceptual OKLCh ramp generator (with optional P3 wide-gamut output), single-ink neutral scale via `color-mix(... transparent)`, golden-angle categorical hue rotation, WCAG contrast helper, the family of semantic role maps (MUST/IMO/Q/FYI badge severities, 7-state activity colors, 6-role graph-node colors, 6-color icon-tint rotation), the derived fg/bg/border/icon split per semantic role, the MD3 interaction-state opacity tokens, and the 3-tier dark text hierarchy. All algorithms operate in OKLCh space so perceptual deltas are uniform; conversions to sRGB hex and P3 are shipped as utilities.

## Prerequisites

- `amvcp-tokens.js` colocated with the HTML — exposes `generateOklchRamp`, `generateNeutralScale`, `generateCategoricalHues`, `oklchToHex`, `oklchToP3`, `contrastRatio`, the role-map renderers, the state-token map.
- `amvcp-designmd.js` for the `--vc-color-*` resolution + `applyTokens(map, rootEl)`.
- `amvcp-tokens.css` for `.vc-state` overlay, role-map `[data-vc-role="…"]` rules, and the dark-text-hierarchy family.

## Instructions

1. **Generate a color ramp** — call `amvcpTokens.generateOklchRamp(seedHex, steps, opts)` for a perceptual OKLCh ramp. Map ramp stops to the 15 `--vc-color-*` roles (mid stop → `accent`, near-white stop → `surface-sunken`). See [oklch-color-ramp](./references/oklch-color-ramp.md) for opts; [oklch-color-space](./references/oklch-color-space.md) for the rationale + conversion math.
2. **Neutral scale** — for tonally locked neutrals, call `generateNeutralScale(inkHex, stops)`. Derives the whole gray family from ONE ink via `color-mix(in oklab, var(--ink) X%, transparent)`. Single source of truth. See [neutral-scale-generator](./references/neutral-scale-generator.md).
3. **Categorical / multi-hue palette** — `generateCategoricalHues(N, seedHue)` rotates by 137.5° (golden angle) for N maximally-separated hues. See [golden-angle-categorical](./references/golden-angle-categorical.md).
4. **P3 wide-gamut accent** — pass `opts.p3 = true` to `generateOklchRamp` to emit a P3 variant inside an `@supports (color: color(display-p3 0 0 0))` block. See [p3-wide-gamut](./references/p3-wide-gamut.md).
5. **Verify contrast** — every fg/bg pair MUST pass WCAG AA. Use `amvcpTokens.contrastRatio(fgHex, bgHex)`; AA = 4.5:1 for text, 3:1 for large text or graphical elements. See [wcag-contrast](./references/wcag-contrast.md).
6. **Apply a role map** — for badge severity, activity, graph-node, or icon-tint surfaces, call `amvcpTokens.renderRoleMapCss(name)` and inject the returned `<style>`. Apply `data-vc-role="<role>"` to consuming elements. See [semantic-role-maps](./references/semantic-role-maps.md) for the generic mechanism; the specific maps in [badge-severity-roles](./references/badge-severity-roles.md), [activity-color-map](./references/activity-color-map.md), [graph-node-color-map](./references/graph-node-color-map.md), [icon-tint-rotation](./references/icon-tint-rotation.md).
7. **Derived state color split** — derive `fg`, `bg`, `border`, `icon` for a semantic role via [derived-state-color-split](./references/derived-state-color-split.md) (percentages tuned per WCAG).
8. **Interaction states** — MD3 hover/focus/pressed opacities + the `.vc-state` overlay per [interaction-state-tokens](./references/interaction-state-tokens.md).
9. **Dark text hierarchy** — 3-tier on-surface text set (primary / secondary / tertiary) per [dark-text-hierarchy](./references/dark-text-hierarchy.md).
10. **Always end** — pipe the generated palette through `amvcpTokens.lintTokenSet` (the anti-slop sibling) — the AI purple/violet/indigo cluster is the most common ramp-generator slip.

## Output

- A populated DESIGN.md `color:` group (raw text or parsed shape).
- A CSS file declaring `[data-vc-role="…"]` rules for any applied role map.
- An `@supports`-gated P3 variant block when wide-gamut is requested.

## Error Handling

| Symptom | Fix |
|---|---|
| `generateOklchRamp` throws on seed hex | The seed isn't a parseable 3-/6-digit hex. Convert via the OKLCh conversion utility first. |
| Ramp stop is washed out / too saturated | Tune `opts.lightnessRange` / `opts.chromaShape` per [oklch-color-ramp](./references/oklch-color-ramp.md). |
| `contrastRatio` returns < 4.5 for a text token | The fg/bg pair fails WCAG AA. Pick a darker fg or lighter bg — never weaken the threshold. |
| P3 colors look identical to sRGB | Display isn't wide-gamut OR `@supports` not loaded. Test on a P3-capable display. |
| Role map `[data-vc-role="…"]` has no effect | `renderRoleMapCss` output not injected, OR the element doesn't carry `data-vc-role`. |
| `.vc-state` overlay never fires | Interaction state tokens not loaded OR the element isn't inside a `.vc-state` container. |
| Dark text appears washed out on light surface | The 3-tier hierarchy was built for dark surfaces — for light, use the engine's content roles, see [dark-text-hierarchy](./references/dark-text-hierarchy.md). |
| `lintTokenSet` flags an AI purple/violet/indigo | Re-seed the ramp away from that cluster. Validate by OKLCh hue/chroma — `h: 280-310` and `c > 0.15` is the slop zone. |

## Examples

```
Input:  "Generate a 10-step blue color ramp."
Output: generateOklchRamp('#1d4ed8', 10) (step 1) → 10 stops in OKLCh
        space; map mid stop → --vc-color-accent, near-white →
        --vc-color-surface-sunken. Emit as DESIGN.md color: group.

Input:  "I want gray derived from one ink color."
Output: generateNeutralScale('#1a2026', [5,10,20,40,60,80,95]) (step 2)
        → 7 gray stops via color-mix(in oklab, var(--ink) N%, transparent).

Input:  "Color these 7 activity types distinctly."
Output: generateCategoricalHues(7, baseHue) (step 3) → 7 hues separated
        by 137.5° each; or use the shipped activity role-map directly.

Input:  "Add badge severities (MUST/IMO/Q/FYI)."
Output: step 6 → renderRoleMapCss('badge-severity'), inject the returned
        <style>, apply data-vc-role="must"|"imo"|"q"|"fyi" to elements.

Input:  "Check this report color passes WCAG AA contrast."
Output: contrastRatio('#1a1a1a', '#fafafa') (step 5) → 15.36, well above
        the 4.5:1 AA threshold for body text.
```

## Modes

This skill supports `data-ve-mode="readonly"` only. Color tokens are not decision atoms; the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Composes with `amvcp-tokens-scales` (vocabulary it populates), `amvcp-tokens-presets` (presets ship pre-baked palettes), `amvcp-tokens-contact-sheet` (the color panel reads from here), `amvcp-tokens-anti-slop` (every generated palette gets linted). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [oklch-color-ramp.md](./references/oklch-color-ramp.md) — OKLCh perceptual ramp generator with phi / Radix curves (DT-02 + DM-17).
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [oklch-color-space.md](./references/oklch-color-space.md) — OKLCh rationale + conversion math.
  > Why OKLCh · The conversions · The `oklchToHex` shortcut · The `oklchToP3` shortcut · The `oklabDeltaE` distance · When to use OKLCh in custom widgets · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract
- [neutral-scale-generator.md](./references/neutral-scale-generator.md) — single-ink neutral scale via `color-mix(... transparent)` (DT-11).
  > What it does · When to choose · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Single source of truth · Selection / comment / decision-mini contract · Visual verification
- [golden-angle-categorical.md](./references/golden-angle-categorical.md) — N maximally-separated hues via golden-angle hue rotation.
  > What it does · When to use · Why golden-angle vs. evenly-spaced (`360 / N`) · When to seed from the active accent · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [p3-wide-gamut.md](./references/p3-wide-gamut.md) — P3 wide-gamut accent via `@supports` (DT-18).
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [wcag-contrast.md](./references/wcag-contrast.md) — `contrastRatio` and the contact-sheet's per-cell annotation.
  > What it does · The WCAG thresholds · When to call · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [semantic-role-maps.md](./references/semantic-role-maps.md) — the generic role-map mechanism + index of shipped maps.
  > The generic shape · The shipped maps · The golden-angle categorical generator · Seeding off the active accent
- [badge-severity-roles.md](./references/badge-severity-roles.md) — MUST/IMO/Q/FYI (DT-19).
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [activity-color-map.md](./references/activity-color-map.md) — 7-state productivity convention (DT-22).
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [graph-node-color-map.md](./references/graph-node-color-map.md) — 6-role pipeline / DAG colors (DT-16).
  > What it does · When to use which role · When NOT to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [icon-tint-rotation.md](./references/icon-tint-rotation.md) — 6-color `:nth-child` rotation for icon cards (DT-12 + DT-15).
  > What it does · When to use · Scaffold to emit · DT-15 — the `--icon-color-rgb` legacy alternative · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [derived-state-color-split.md](./references/derived-state-color-split.md) — fg/bg/border/icon split derived per semantic role.
  > What it does · The percentages · When to use the derived family vs. the base role · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [interaction-state-tokens.md](./references/interaction-state-tokens.md) — MD3 state-layer opacities + `.vc-state` overlay (DT-03 + DT-21).
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [dark-text-hierarchy.md](./references/dark-text-hierarchy.md) — 3-tier on-surface text family (DT-08).
  > What it does · When to use which tier · When to use the on-surface family vs. the engine's content roles · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
