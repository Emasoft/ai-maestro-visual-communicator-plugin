---
name: amvcp-tokens-contact-sheet
description: "Token contact-sheet renderer — a self-contained, DESIGN.md-themed 'living design page' showing every token visually with click-to-copy: WCAG-annotated color grid, type specimens, true-pixel spacing bars, radius + elevation cards, motion chips, z-index plates, state demos, code panel. Use when showing design tokens, rendering a style guide, or building a living design page. Trigger with 'token contact sheet', 'living design page', 'style guide', 'token panel'."
license: MIT
metadata:
  author: Emasoft
---

# Token Contact Sheet

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling token skills:** [amvcp-design-tokens](../amvcp-design-tokens/SKILL.md) (router) · [amvcp-tokens-color](../amvcp-tokens-color/SKILL.md) · [amvcp-tokens-scales](../amvcp-tokens-scales/SKILL.md) · [amvcp-tokens-presets](../amvcp-tokens-presets/SKILL.md) · [amvcp-tokens-anti-slop](../amvcp-tokens-anti-slop/SKILL.md).

## Overview

The headline design-tokens deliverable: a rendered, self-contained, DESIGN.md-themed HTML "living design page" that shows every token visually with click-to-copy. The renderer is schema-driven — a new token group in the engine produces a new panel with zero renderer change. Every panel: `data-vc-panel="…"` section, both themes side-by-side where applicable, click-to-copy `<button data-vc-copy="…">` swatches, WCAG-annotated color cells, true-pixel spacing bars, click-to-feel easing chips, overlapping z-index plates. The contact sheet is the ONE place where click-to-copy is a deliberate fail-soft path — a missing `navigator.clipboard` degrades gracefully (it is a convenience, not a data contract).

## Prerequisites

- `amvcp-designmd.js` colocated with the HTML — parses the DESIGN.md, exposes `parseDesignMd`.
- `amvcp-token-sheet.js` — the contact-sheet renderer (`renderContactSheet`, `mountContactSheet`, `contrastRatio`).
- `amvcp-tokens.css` — the contact-sheet chrome (panel grid, swatch styles, copy-affordance, dual-theme split).
- Optional: `amvcp-runtime.js` for the `window.__veDesignMd.toggleTheme()` Theme button in the contact-sheet header strip. Without the runtime the button still flips light/dark standalone via the engine's `resolveTokens` + `applyTokens`.

## Instructions

1. **Parse the DESIGN.md** — `const parsed = amvcpDesignMd.parseDesignMd(text)`. A `parsed.ok === false` means the DESIGN.md is malformed; surface `parsed.errors`, fix the source, never render half-broken.
2. **Mount the contact sheet** — `amvcpTokenSheet.mountContactSheet(parsed.designmd, containerEl, opts)`. The renderer reads `designmd.tokens` and emits ONE `<section data-vc-panel="…">` per token group. See [contact-sheet-schema](./references/contact-sheet-schema.md) for the panel taxonomy.
3. **Color panel** — both themes side-by-side, 4-column CSS grid, each swatch labeled with role name + hex + WCAG contrast ratio (see [contact-sheet-color-panel](./references/contact-sheet-color-panel.md)).
4. **Typography panel** — one specimen line per type-scale step at true px size + the three font stacks ([contact-sheet-typography-panel](./references/contact-sheet-typography-panel.md)).
5. **Spacing panel** — one bar per spacing step, **true pixel width**, never percentages ([contact-sheet-spacing-panel](./references/contact-sheet-spacing-panel.md)).
6. **Radius + elevation panel** — radius squares + elevation cards showing literal values ([contact-sheet-radius-elevation](./references/contact-sheet-radius-elevation.md)).
7. **Motion panel** — click-to-feel easing chips (the animation IS the demo) ([contact-sheet-motion-panel](./references/contact-sheet-motion-panel.md)).
8. **Z-index panel** — overlapping plates that visually demonstrate the stacking order ([contact-sheet-z-panel](./references/contact-sheet-z-panel.md)).
9. **State panel** — frozen state demos + a live instance ([contact-sheet-state-panel](./references/contact-sheet-state-panel.md)).
10. **Code panel** — syntax-highlighted sample + 12-color legend ([contact-sheet-code-panel](./references/contact-sheet-code-panel.md)).
11. **Copy on every swatch** — `<button data-vc-copy="<token-value>">`. An **Alt/Option-click (or Meta-click)** copies the value; a plain click is passed through to the runtime's selection handler (so swatches can be selected + commented on). The copy uses `navigator.clipboard.writeText` with a fail-soft fallback (see [click-to-copy](./references/click-to-copy.md) for the deliberate exception to the plugin's fail-fast policy).
12. **Always end** — pipe the emitted HTML through `amvcpTokens.lintHtml` (the anti-slop sibling). A contact sheet that ships slop is a contradiction.

## Output

- A `<main class="vc-sheet" data-vc-sheet="1">` containing a header strip (doc title + Theme toggle) and one `<section data-vc-panel="…">` per token group. Every swatch is a `<button data-vc-copy="…">`. Both themes side-by-side where applicable. No nested scrollbars — wide grids extend the page width per the no-nested-scrollbars rule.

## Error Handling

| Symptom | Fix |
|---|---|
| `parsed.ok === false` | DESIGN.md malformed — surface `parsed.errors` and fix source. Engine renders nothing (fail-fast). |
| Swatch shows `[unresolved]` | A `{token.ref}` chain failed to resolve — fix the DESIGN.md so every `var(--vc-*)` has a definition. |
| Color panel WCAG ratio is missing | `contrastRatio(fg, bg)` got a non-hex input — the DESIGN.md is using an OKLCh value that can't be hex-converted in-place. Convert via the OKLCh utility first. |
| Copy button silently does nothing | Browser lacks `navigator.clipboard` (HTTP context, old browser) — fail-soft is intentional, the swatch's hex is still visible. NOT an error. |
| Panel order looks random | The renderer follows DESIGN.md group declaration order — reorder the source `tokens:` groups. |
| Contact sheet renders WITH slop colors | The DESIGN.md itself contains AI-slop colors — fix the source DESIGN.md, never weaken the anti-slop gate. |

## Examples

```
Input:  "Render the token contact sheet for the heritage preset."
Output: load the heritage preset (sibling amvcp-tokens-presets):
        const parsed = amvcpDesignMd.parseDesignMd(
                          amvcpTokens.PRESETS['heritage']);
        amvcpTokenSheet.mountContactSheet(parsed.designmd,
                          document.querySelector('#sheet'));
        amvcpTokens.lintHtml(document.documentElement.outerHTML);

Input:  "Show me a click-to-copy color grid for this DESIGN.md."
Output: const parsed = amvcpDesignMd.parseDesignMd(designmdText);
        const sheet = amvcpTokenSheet.renderContactSheet(parsed.designmd);
        // renderContactSheet emits one panel per DESIGN.md token group;
        // the color grid is the first panel. Append `sheet` where wanted.

Input:  "Build a style guide page from this designmd."
Output: step 2 → full mount. The page IS the style guide. The Theme
        button in the header strip flips light/dark live.
```

## Modes

This skill supports `data-ve-mode="readonly"` only. Contact-sheet swatches are click-to-copy affordances, NOT decision atoms; the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply.

## Composability

Composes with `amvcp-tokens-color` (to render color panels), `amvcp-tokens-scales` (to populate spacing / elevation / motion / z-index panels), `amvcp-tokens-presets` (the source DESIGN.md is usually a preset), and `amvcp-tokens-anti-slop` (lintHtml on emitted page). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [contact-sheet-schema.md](./references/contact-sheet-schema.md) — the contact-sheet HTML structure, the per-panel `data-vc-panel` attributes, click-to-copy.
  > API · Page structure · Color cells — contrast annotation · Click-to-copy · Theme handling · No nested scrollbars · Self-contained output
- [contact-sheet-color-panel.md](./references/contact-sheet-color-panel.md) — both-themes-side-by-side color grid with WCAG annotation.
  > What it does · Why both themes side-by-side · The contrast annotation · The contrast formula · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [contact-sheet-typography-panel.md](./references/contact-sheet-typography-panel.md) — type specimens + font-stack rows.
  > What it does · Why one specimen text repeated · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [contact-sheet-spacing-panel.md](./references/contact-sheet-spacing-panel.md) — true-pixel-width spacing bars.
  > What it does · Why true pixels (not percentages) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [contact-sheet-radius-elevation.md](./references/contact-sheet-radius-elevation.md) — radius squares + elevation cards.
  > Radius panel · Elevation panel · Why both panels show literal values · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [contact-sheet-motion-panel.md](./references/contact-sheet-motion-panel.md) — click-to-feel easing chips.
  > What it does · Why an animated demo (vs a static curve plot) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [contact-sheet-z-panel.md](./references/contact-sheet-z-panel.md) — overlapping plates stack.
  > What it does · Why overlap (vs a single-column legend) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [contact-sheet-state-panel.md](./references/contact-sheet-state-panel.md) — frozen state demos + live instance.
  > What it does · Why both frozen AND live · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification · Overview
- [contact-sheet-code-panel.md](./references/contact-sheet-code-panel.md) — syntax-highlighted sample + 12-color legend.
  > What it does · Why a tiny built-in tokenizer · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
- [click-to-copy.md](./references/click-to-copy.md) — the contact-sheet's ONE deliberate fail-soft path.
  > What it does · Why fail-soft (instead of fail-fast) · Scaffold to emit · Lib functions used · DESIGN.md tokens used · Anti-slop interaction · Selection / comment / decision-mini contract · Visual verification
