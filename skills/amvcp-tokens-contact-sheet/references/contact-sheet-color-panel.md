# Contact-sheet color panel — the headline deliverable

## Table of Contents

- [What it does](#what-it-does)
- [Why both themes side-by-side](#why-both-themes-side-by-side)
- [The contrast annotation](#the-contrast-annotation)
- [The contrast formula](#the-contrast-formula)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

The `color` panel of the token contact sheet renders BOTH themes
side-by-side, each as a 4-column CSS grid of swatches. Each swatch
shows the role name, hex, and WCAG contrast ratio. Below-4.5:1 text
roles are flagged. The dual-theme contract made visible.

## What it does

`amvcpTokenSheet.renderContactSheet(designmd)` calls `buildColorPanel`
which:

1. resolves `designmd` for BOTH light and dark themes via
   `amvcpDesignMd.resolveTokens`;
2. for each theme, builds a `vc-sheet-color-grid` (a CSS grid of
   4-column auto-fill) — one cell per color role;
3. each cell is a `<button data-vc-copy="<hex>">` with:
   - the role name (e.g. `accent`);
   - the resolved hex (e.g. `#b8861f`);
   - the WCAG contrast ratio against `--vc-color-canvas` (or
     `--vc-color-surface` for the three content roles);
   - `data-vc-contrast-warn="1"` if the ratio < 4.5 for a text role.

The panel emits both themes regardless of the page's CURRENT theme —
the dual-theme view is the panel's POINT.

## Why both themes side-by-side

Most "design system docs" show ONE theme. That hides the dual-theme
defect (a color that works in light but fails in dark). Showing
both at once forces the design system author to FIX the failing
theme; you can't ignore what you can see next to the working theme.

## The contrast annotation

```css
.vc-sheet-color-cell {
  /* per cell, with the role's resolved hex as inline bg/fg */
}
.vc-sheet-color-cell[data-vc-contrast-warn="1"] {
  /* a visible warning marker — dashed outline / icon */
  outline: 2px dashed var(--vc-color-danger);
  outline-offset: -4px;
}
```

The text roles (`content`, `content-muted`, `content-subtle`) are
measured against `surface`; every other role against `canvas`. A
text-role cell whose ratio falls below 4.5:1 gets the warn flag.
The author is supposed to fix the SOURCE (re-pick the color), not
suppress the warning.

## The contrast formula

```
relativeLuminance(hex) = 0.2126 * R + 0.7152 * G + 0.0722 * B
  (R, G, B are gamma-decoded — see srgbChannelToLinear)

contrastRatio(a, b) = (max(L_a, L_b) + 0.05) / (min(L_a, L_b) + 0.05)
```

See `references/wcag-contrast.md` for the full WCAG thresholds.

## Scaffold to emit

The color panel is rendered as part of the full contact sheet:

```js
var parsed = amvcpDesignMd.parseDesignMd(designmdText);
if (!parsed.ok) throw new Error(parsed.errors.join('; '));
var sheet = amvcpTokenSheet.renderContactSheet(parsed.designmd);
document.body.appendChild(sheet);
```

The color panel will be one `<section data-vc-panel="color">` inside
the sheet. To render only the color panel (e.g. for an embedded
"colors" widget), call `buildColorPanel` directly — it's currently
not exposed publicly, so the supported path is the full
`renderContactSheet`.

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd, opts)` → `HTMLElement`
- `amvcpTokenSheet.mountContactSheet(designmd, container, opts)` — same
  but appends to `container`
- `amvcpTokenSheet.contrastRatio(hexA, hexB)` → number (used to
  compute every cell's annotation)
- `amvcpDesignMd.parseDesignMd(text)` / `resolveTokens(designmd,
  theme)` — to produce the resolved per-theme maps the panel reads

## DESIGN.md tokens used

- reads: ALL 15 colors × 2 themes
- emits: NO new tokens (the panel just renders existing ones)

## Anti-slop interaction

The panel is the visual diagnostic for the slop gate. A preset that
passes `lintTokenSet` but has a low-contrast text role still SHIPS A
RED-FLAG SWATCH in the panel — the author sees it and fixes the
source. The two gates (slop + contrast) together catch the full
space: slop catches BANNED colors; contrast catches UNREADABLE
colors.

## Selection / comment / decision-mini contract

Each swatch is a `<button>` so it's keyboard-accessible. Click copies
the hex via `navigator.clipboard.writeText` and flashes a "copied"
tooltip (via the `[data-vc-copied]` CSS rule). The click-to-copy is
the ONE deliberate fail-soft in the system: missing clipboard
support degrades to a hidden `<textarea> + execCommand` fallback,
then to plain selectable text.

The panel itself is themed by the page's CURRENT `--vc-*` tokens (so
the panel chrome — borders, headings, copied-tooltip — themes
correctly), even though the SWATCH grids show both themes' colors
side-by-side.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot the color panel in **both
themes** (R1) — the panel itself is themed, but each grid shows the
opposite theme's swatches too, so the side-by-side is the same in
both screenshots. Verify:

1. NO swatch has `data-vc-contrast-warn="1"` (for a properly
   designed preset);
2. clicking any swatch fires the copy flash (test with
   `page.click('button[data-vc-copy]')` and watch for the
   `[data-vc-copied]` attribute appearing for ~1 second);
3. NO swatch is empty / missing — every role in both themes
   produces a cell (a missing role would mean the engine's
   `resolveTokens` returned an undefined value, which is a parse
   defect).
