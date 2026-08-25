---
name: amvcp-tokens-presets
description: "Named dual-theme presets + personality tooling — 14 brand presets (heritage, factory-dark, wireframe-grayscale, cjk-claude, ...) each a complete DESIGN.md fixture, 9-category taxonomy, personality deltas (warmer / cooler / playful / minimal), hot-swap, scoped theming, dual-theme contract, syntax tokens. Use when picking a palette, applying a preset, or restyling. Trigger with 'pick a palette', 'apply preset', 'design system', 'hot swap theme', 'warmer', 'playful'."
license: MIT
metadata:
  author: Emasoft
---

# Token Presets & Personality

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling token skills:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) (router) · [amvcp-tokens-color](../amvcp-tokens-color/SKILL.md) · [amvcp-tokens-scales](../amvcp-tokens-scales/SKILL.md) · [amvcp-tokens-anti-slop](../amvcp-tokens-anti-slop/SKILL.md) · [amvcp-tokens-contact-sheet](../amvcp-tokens-contact-sheet/SKILL.md).

## Overview

The named-preset layer of the token system. Ships 14 dual-theme presets (heritage, factory-dark, wireframe-grayscale, cjk-claude, etc.), each a complete DESIGN.md fixture passing both the dual-theme contract AND the anti-slop gate. A 9-category aesthetic taxonomy (Bold/Warm/Dark/Clean/...) lets the picker steer by mood. Personality deltas (warmer/cooler/playful/corporate/minimal) nudge any preset along a single axis without rewriting the whole token set. Hot-swap restyling re-themes a live page via `window.__veDesignMd.hotSwap(text)`. The in-page playground exposes sliders + radios that write to `--vc-*` for live tuning. Scoped theming applies a DESIGN.md to a sub-tree only. The dual-theme contract is the structural rule every preset MUST obey.

## Prerequisites

- `amvcp-designmd.js` colocated with the HTML — parses, validates, resolves, applies.
- `amvcp-tokens.js` for `amvcpTokens.PRESETS` (the named library), `applyPersonalityDelta`.
- `amvcp-runtime.js` for the hot-swap hook (`window.__veDesignMd.hotSwap`).
- `amvcp-tokens.css` for the `.vc-*` utility classes the tuner UI uses (`vc-bg-*`, `vc-p-*`, `vc-rounded-*`, `vc-shadow-*`); the playground itself ships its own inline `<style>` (see [live-token-playground](./references/live-token-playground.md)).

## Instructions

1. **Pick a preset** — list `amvcpTokens.PRESETS` for the 14 named dual-theme sets. Pick by name (`heritage`, `factory-dark`, `wireframe-grayscale`, ...) and emit the preset's frontmatter as the page's `<script type="text/design-md">` block. See [preset-library](./references/preset-library.md) for the full list + [preset-category-system](./references/preset-category-system.md) for the 9-category taxonomy.
2. **Apply a brand preset** — instantiate one of the showcase presets per its dedicated reference: [heritage-warm-palette](./references/heritage-warm-palette.md), [factory-dark-palette](./references/factory-dark-palette.md), [wireframe-grayscale-palette](./references/wireframe-grayscale-palette.md), [cjk-typography-tokens](./references/cjk-typography-tokens.md).
3. **Tune personality** — `applyPersonalityDelta(designmdText, 'warmer'|'cooler'|'playful'|'corporate'|'minimal')` nudges the preset along ONE axis. Compose multiple deltas by chaining. See [personality-deltas](./references/personality-deltas.md).
4. **Hot-swap a live page** — `window.__veDesignMd.hotSwap(presetText)` re-themes the whole page live, no reload. See [hot-swap-restyling](./references/hot-swap-restyling.md).
5. **Ship a token playground** — embed [live-token-playground](./references/live-token-playground.md) for sliders / pickers that write to `--vc-*` for in-page tuning. The hover→snippet preview pattern (DM-22) shows the resulting CSS snippet live.
6. **Scope a theme to a sub-tree** — resolve a flat map first, then apply it to ONE element subtree only: `amvcpDesignMd.applyTokens(amvcpDesignMd.resolveTokens(parsed.designmd, 'light'), rootEl)`. `applyTokens` takes a resolved `{ '--vc-*': value }` map (NOT the raw token tree). See [scoped-theming](./references/scoped-theming.md).
7. **Honor the dual-theme contract** — EVERY artifact ships BOTH light AND dark. The engine enforces this mechanically; see [dual-theme-contract](./references/dual-theme-contract.md) for why and how.
8. **Syntax-highlight tokens** — for code samples, the 12-token vocabulary in [code-syntax-tokens](./references/code-syntax-tokens.md) ships pre-theme'd per preset.
9. **Always end** — pipe the final emitted DESIGN.md + HTML through `amvcpTokens.lintTokenSet` and `lintHtml` (the anti-slop sibling). A preset that fails the gate is a contradiction.

## Output

- A `<script type="text/design-md">` block emitting the picked preset's frontmatter.
- Optional: a `.vc-playground` chrome with sliders/pickers for live tuning.
- A self-contained HTML page that themes exclusively off the `--vc-*` tokens declared by the preset.

## Error Handling

| Symptom | Fix |
|---|---|
| Preset not found in `amvcpTokens.PRESETS` | Typo in preset name. List `Object.keys(amvcpTokens.PRESETS)` to see all 14. |
| `applyPersonalityDelta` returns unchanged text | Delta name typo (must be exactly `warmer`/`cooler`/`playful`/`corporate`/`minimal`). |
| `hotSwap` doesn't re-theme | `amvcp-runtime.js` not loaded — without the runtime, the hook is undefined. |
| Playground slider has no effect | The slider's target token doesn't exist in the active DESIGN.md, OR the slider is writing to a `:root` var that's being shadowed by a more-specific selector. |
| Scoped theme leaks out of the sub-tree | The `rootEl` passed to `applyTokens` is wrong, OR there are descendant rules using `:root` (use `&:root` scoping). |
| Theme flip causes a flash | Tokens are being applied AFTER paint instead of before. Inline the preset as a `<script type="text/design-md">` BEFORE the first stylesheet link. |
| Preset fails `lintTokenSet` | Shift the offending color/font in the preset's frontmatter; never weaken the gate. |

## Examples

```
Input:  "Apply the heritage warm theme."
Output: step 4 → window.__veDesignMd.hotSwap(amvcpTokens.PRESETS['heritage'])
        The page re-themes live, no reload.

Input:  "Make this page warmer + more playful."
Output: step 3 (compose two deltas):
        let m = amvcpTokens.PRESETS['trust-indigo'];
        m = applyPersonalityDelta(m, 'warmer');
        m = applyPersonalityDelta(m, 'playful');
        window.__veDesignMd.hotSwap(m);

Input:  "Wireframe this design first."
Output: steps 2 + 4 → hotSwap(amvcpTokens.PRESETS['wireframe-grayscale'])
        Zero hue, zero radius — pure structural draft.

Input:  "Add a live tuner so I can adjust the accent."
Output: step 5 → mount the live-token-playground reference into the
        page; sliders write directly to --vc-* variables.
```

## Modes

This skill supports `data-ve-mode="readonly"` only. The playground UI exposes sliders that write to `--vc-*`, but they are configuration controls, NOT decision atoms; the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Composes with every other amvcp-tokens-* skill — presets bundle generated palettes (color sibling), full scale sets (scales sibling), get lint-checked (anti-slop sibling), and render through the contact sheet. The only exclusive skill is the overlay-runtime (R24).

## Resources

- [preset-library.md](./references/preset-library.md) — the 14 named dual-theme presets, `applyPersonalityDelta`, hot-swap restyling.
  > The presets · Anti-slop note — `trust-indigo` · Personality deltas — `applyPersonalityDelta` · Hot-swap restyling · Scoped theming with a preset
- [preset-category-system.md](./references/preset-category-system.md) — the 9-category aesthetic taxonomy (Bold/Warm/Dark/Clean/...) (DT-26).
  > The nine categories · When to use which category · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Adding a new preset to a category · Selection / comment / decision-mini contract · Visual verification
- [heritage-warm-palette.md](./references/heritage-warm-palette.md) — the runtime default preset (DT-10 territory).
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [factory-dark-palette.md](./references/factory-dark-palette.md) — the industrial-orange dark-first preset (DT-07).
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [wireframe-grayscale-palette.md](./references/wireframe-grayscale-palette.md) — the zero-hue zero-radius preset (DT-24).
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [cjk-typography-tokens.md](./references/cjk-typography-tokens.md) — Source Han + line-height 1.8 + letter-spacing 0.05em (DT-25).
  > What it is · When to pick · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [personality-deltas.md](./references/personality-deltas.md) — playful / corporate / minimal / warmer / cooler deltas.
  > What it does · When to use which delta · Composing deltas · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [hot-swap-restyling.md](./references/hot-swap-restyling.md) — `window.__veDesignMd.hotSwap(text)` (DM-25).
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification · Overview
- [live-token-playground.md](./references/live-token-playground.md) — sliders / pickers writing to `--vc-*` for live tuning.
  > What it does · When to ship a playground · Scaffold to emit · The hover→snippet preview pattern (DM-22 reference) · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [multi-brand-mixer.md](./references/multi-brand-mixer.md) — recipe to blend two DESIGN.mds with per-role rules (DM-23; a self-contained recipe to inline per page — NOT a lib API).
  > What it does · When to use · The per-role rules (suggested defaults) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [scoped-theming.md](./references/scoped-theming.md) — per-section / per-component DESIGN.md via `applyTokens(map, rootEl)`.
  > What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [dual-theme-contract.md](./references/dual-theme-contract.md) — why every artifact ships BOTH light AND dark, mechanically (DM-11).
  > Why dual-theme is mandatory (not "nice to have") · How the engine enforces it · How the theme flip works · The mechanical tricks for dual-theme correctness · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [code-syntax-tokens.md](./references/code-syntax-tokens.md) — 12-token syntax-highlight vocabulary (DM-26).
  > The 12 tokens · What it does · When to use · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
