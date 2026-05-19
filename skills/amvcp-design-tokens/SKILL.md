---
name: amvcp-design-tokens
description: "Router skill for the design-tokens family — routes to the right sibling. Color ramp / role maps → amvcp-tokens-color. Spacing / elevation / motion / z-index / utilities → amvcp-tokens-scales. Brand presets + personality + hot-swap → amvcp-tokens-presets. Anti-slop gate → amvcp-tokens-anti-slop. Click-to-copy contact sheet → amvcp-tokens-contact-sheet. Use when scaffolding design tokens. Trigger with 'design tokens', 'design system', 'style guide', 'color ramp', 'theme generator'."
license: MIT
metadata:
  author: Emasoft
---

# Design Tokens — Router

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.
>
> **Sibling token skills:** [amvcp-tokens-color](../amvcp-tokens-color/SKILL.md) · [amvcp-tokens-scales](../amvcp-tokens-scales/SKILL.md) · [amvcp-tokens-presets](../amvcp-tokens-presets/SKILL.md) · [amvcp-tokens-anti-slop](../amvcp-tokens-anti-slop/SKILL.md) · [amvcp-tokens-contact-sheet](../amvcp-tokens-contact-sheet/SKILL.md).

## Overview

Router for the design-tokens family. The token-vocabulary and token-rendering layer that sits on top of the DESIGN.md engine (`amvcp-designmd.js`) has been split into 5 focused sibling skills so the orchestrator only loads the one needed per request. This skill itself emits no CSS/JS — it picks the right sibling by matching the user's request to a cleavage plane. Every other amvcp-* skill themes off the `--vc-*` vocabulary the siblings collectively define.

## Prerequisites

- The orchestrator runtime that can load sibling skills by name.
- The DESIGN.md engine (`amvcp-designmd.js`) colocated with the HTML — every sibling relies on it.

## Instructions

Match the user's request to a sibling using the routing matrix in §When to choose this category, then load that sibling and follow its `Instructions` section. The router itself does NOT emit markup.

1. Read the user's request.
2. Find the matching row in the routing matrix.
3. Load the named sibling skill.
4. Hand control to the sibling — its `Instructions` section is the recipe.
5. Always end (per the sibling): pipe the final emitted DESIGN.md + HTML through `amvcpTokens.lintTokenSet` / `lintHtml` from the anti-slop sibling.

## Output

This router emits no markup. The downstream sibling produces the actual artifact (DESIGN.md frontmatter, CSS, contact-sheet HTML, anti-slop report, etc.).

## Error Handling

| Symptom | Fix |
|---|---|
| Request doesn't match any sibling | Re-read the request — it likely belongs to a different amvcp-* family (typography, animation, charts, ...). Route via the parent umbrella `amvcp-visual-communication`. |
| Multiple siblings could plausibly handle it | Route to the one that owns the PRIMARY noun in the request (e.g. "generate a palette + show me the contact sheet" → tokens-color first, then tokens-contact-sheet). |
| Sibling skill not yet registered | The 5 new sibling skill names must be added to `cpv.allow_orchestrator_traversal` in `.claude-plugin/plugin.json` for the orchestrator to find them. |

## Examples

```
Input:  "Generate a 10-step blue color ramp."
Output: load amvcp-tokens-color, run step 1 (generateOklchRamp).

Input:  "Make a warm design system and show me the tokens."
Output: load amvcp-tokens-presets (pick the heritage preset), then
        amvcp-tokens-contact-sheet (mount the sheet), then
        amvcp-tokens-anti-slop (lint the emitted HTML).

Input:  "Set up the phi spacing scale."
Output: load amvcp-tokens-scales, run step 1 (generatePhiSpacing).

Input:  "Apply the factory-dark theme to this page."
Output: load amvcp-tokens-presets, run step 4 (hot-swap).

Input:  "Check this report for AI-slop colors."
Output: load amvcp-tokens-anti-slop, run step 2 (lintHtml).
```

## When to choose this category

The routing matrix below maps user phrases to the right sibling.

| If the user asks for … | Load sibling | Then read |
|---|---|---|
| "make a design system" / "design tokens" / "style guide" | `amvcp-tokens-presets` + `amvcp-tokens-contact-sheet` | sibling SKILL.md |
| "show me the design tokens" / "living design page" / "contact sheet" | `amvcp-tokens-contact-sheet` | sibling SKILL.md |
| "generate a color ramp" / "OKLCH palette" / "blue palette" | `amvcp-tokens-color` | sibling step 1 |
| "neutral gray scale" / "derived from one ink" | `amvcp-tokens-color` | sibling step 2 |
| "categorical hues" / "golden-angle palette" | `amvcp-tokens-color` | sibling step 3 |
| "P3 wide-gamut accent" | `amvcp-tokens-color` | sibling step 4 |
| "WCAG contrast" / "AA-passing pair" | `amvcp-tokens-color` | sibling step 5 |
| "badge / severity colors" (MUST/IMO/Q/FYI) | `amvcp-tokens-color` (role map) | sibling step 6 |
| "activity colors" (working/meeting/break/...) | `amvcp-tokens-color` (role map) | sibling step 6 |
| "graph-node colors" (source/filter/transform/...) | `amvcp-tokens-color` (role map) | sibling step 6 |
| "icon tints" / "auto-tinted feature cards" | `amvcp-tokens-color` (role map) | sibling step 6 |
| "fg/bg/border/icon split" / "derived state colors" | `amvcp-tokens-color` | sibling step 7 |
| "interaction states" / "hover/focus/pressed opacities" | `amvcp-tokens-color` | sibling step 8 |
| "dark text hierarchy" / "on-surface text tiers" | `amvcp-tokens-color` | sibling step 9 |
| "spacing scale" / "8pt grid" / "phi spacing" | `amvcp-tokens-scales` | sibling step 1 |
| "elevation" / "shadow scale" / "cinematic shadows" | `amvcp-tokens-scales` | sibling step 2 |
| "motion tokens" / "easing library" / "duration scale" | `amvcp-tokens-scales` | sibling step 3 |
| "z-index scale" / "stacking levels" | `amvcp-tokens-scales` | sibling step 4 |
| "@layer architecture" / "CSS cascade" / "token vocabulary" | `amvcp-tokens-scales` | sibling steps 5-7 |
| "Tailwind-shaped utility classes" / "what classes exist" | `amvcp-tokens-scales` | sibling step 8 |
| "pick a palette" / "apply a preset" | `amvcp-tokens-presets` | sibling step 1 |
| "warm theme" / "factory-dark" / "wireframe" / "CJK" | `amvcp-tokens-presets` | sibling step 2 |
| "make it warmer / cooler / playful / corporate" | `amvcp-tokens-presets` | sibling step 3 |
| "hot-swap the theme" / "live restyle" | `amvcp-tokens-presets` | sibling step 4 |
| "live-token playground" / "token tuner UI" | `amvcp-tokens-presets` | sibling step 5 |
| "multi-brand blend" / "co-branded artifact" | `amvcp-tokens-presets` | sibling step 6 |
| "scope theme to one section" / "sidebar with different palette" | `amvcp-tokens-presets` | sibling step 7 |
| "dual-theme contract" / "why both light AND dark" | `amvcp-tokens-presets` | sibling step 8 |
| "code syntax highlighting" / "code theme" | `amvcp-tokens-presets` | sibling step 9 |
| "check for AI-slop" / "anti-slop audit" | `amvcp-tokens-anti-slop` | sibling steps 1-3 |
| "banned colors" / "banned fonts" | `amvcp-tokens-anti-slop` | sibling reference |
| "live slop overlay" / "in-browser audit" | `amvcp-tokens-anti-slop` | sibling step 3 |

## Modes

This router supports `data-ve-mode="readonly"` only. The router itself emits no markup; downstream siblings each declare their own mode policy (all `readonly`).

## Composability

This skill is the entry point for the token family — it routes to one of 5 siblings. Each sibling composes with every other amvcp-* skill on the page (R22) — the token family is the substrate. The only exclusive skill is the overlay-runtime (R24).

## Resources

The router has no `references/` of its own. All content lives in the 5 sibling skills.

- [amvcp-tokens-color](../amvcp-tokens-color/SKILL.md) — OKLCh ramp, neutral scale, golden-angle categorical, P3, WCAG, semantic role maps (badge / activity / graph / icon), derived state split, interaction-state opacities, dark text hierarchy. **14 refs.**
- [amvcp-tokens-scales](../amvcp-tokens-scales/SKILL.md) — phi spacing, MD3 + cinematic elevation, motion library, 9-level z-index, 5-layer token vocabulary, `@layer` cascade, centralised pattern, `var()` delegation chain, Tailwind utility classes. **9 refs.**
- [amvcp-tokens-presets](../amvcp-tokens-presets/SKILL.md) — 13 named dual-theme presets, 9-category taxonomy, personality deltas, hot-swap, playground, multi-brand mixer, scoped theming, dual-theme contract, code-syntax tokens. **13 refs.**
- [amvcp-tokens-anti-slop](../amvcp-tokens-anti-slop/SKILL.md) — `lintTokenSet` / `lintHtml` / `lintLiveDocument`, banned colors / fonts / patterns, live `data-vc-slop-alert` DOM walker. **2 refs.**
- [amvcp-tokens-contact-sheet](../amvcp-tokens-contact-sheet/SKILL.md) — the headline deliverable: a self-contained, DESIGN.md-themed "living design page" with click-to-copy. **10 refs.**
