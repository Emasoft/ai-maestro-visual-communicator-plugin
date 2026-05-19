# Sub-technique D4 — Diff tints from semantic color tokens (never hardcoded)

## Table of Contents

- [D4.1 The four diff tint tokens](#d41-the-four-diff-tint-tokens)
- [D4.2 Why color-mix, not just lower alpha](#d42-why-color-mix-not-just-lower-alpha)
- [D4.3 Why these tokens, not hardcoded green/red](#d43-why-these-tokens-not-hardcoded-greenred)
- [D4.4 The 22% / 60% / 16% / 70% calibration](#d44-the-22--60--16--70-calibration)
- [D4.5 The full fallback chain](#d45-the-full-fallback-chain)
- [D4.6 Adding the diff tints to DESIGN.md (optional)](#d46-adding-the-diff-tints-to-designmd-optional)
- [D4.7 The color-mix syntax — browser support](#d47-the-color-mix-syntax--browser-support)
- [D4.8 Selection tint over diff tint](#d48-selection-tint-over-diff-tint)
- [D4.9 Print stylesheet](#d49-print-stylesheet)
- [D4.10 What an author can override](#d410-what-an-author-can-override)
- [D4.11 Author rules](#d411-author-rules)
- [D4.12 Tokens consumed](#d412-tokens-consumed)
- [D4.13 Cross-references](#d413-cross-references)

Why the `--ve-code-diff-*` tints are built from `--vc-color-success` /
`--vc-color-danger` via `color-mix`, NEVER from hardcoded `#9ece9e` /
`#a84a32`. The theming discipline that lets a DESIGN.md change re-
theme every diff in the plugin.

## D4.1 The four diff tint tokens

```css
:root {
  --ve-code-diff-add-bg: var(--vc-code-diff-add-bg,
    color-mix(in srgb, var(--vc-color-success, #3a6b5c) 22%, transparent));
  --ve-code-diff-del-bg: var(--vc-code-diff-del-bg,
    color-mix(in srgb, var(--vc-color-danger,  #a84a32) 22%, transparent));
  --ve-code-diff-add-gutter: var(--vc-code-diff-add-gutter,
    color-mix(in srgb, var(--vc-color-success, #3a6b5c) 60%, transparent));
  --ve-code-diff-del-gutter: var(--vc-code-diff-del-gutter,
    color-mix(in srgb, var(--vc-color-danger,  #a84a32) 60%, transparent));
}
```

Light-theme mirror:

```css
:root[data-ve-theme="light"] {
  --ve-code-diff-add-bg: var(--vc-code-diff-add-bg,
    color-mix(in srgb, var(--vc-color-success, #3a6b5c) 16%, transparent));
  --ve-code-diff-del-bg: var(--vc-code-diff-del-bg,
    color-mix(in srgb, var(--vc-color-danger,  #a84a32) 16%, transparent));
  --ve-code-diff-add-gutter: var(--vc-code-diff-add-gutter,
    color-mix(in srgb, var(--vc-color-success, #3a6b5c) 70%, transparent));
  --ve-code-diff-del-gutter: var(--vc-code-diff-del-gutter,
    color-mix(in srgb, var(--vc-color-danger,  #a84a32) 70%, transparent));
}
```

The hue source is `--vc-color-success` (olive / project's "good" color)
and `--vc-color-danger` (rust / project's "warning" color). The percent
(22% on dark, 16% on light) is the BG TINT strength; the gutter cell
gets a stronger (60% / 70%) tint because it's smaller and needs to
read at corner-of-eye.

## D4.2 Why color-mix, not just lower alpha

`color-mix(in srgb, var(--token) 22%, transparent)` looks similar to
`rgba(token, 0.22)` but it's not the same:

- **`color-mix`** mixes the token with transparent in the sRGB color
  space. The result has the SAME HUE as the token, just lower alpha.
- **`rgba(token, 0.22)`** isn't possible — `rgba()` needs literal
  values, not a `var()`. (CSS variables containing color-channel
  values exist but require manual decomposition.)

`color-mix` is the standard mechanism for "this color, at lower
intensity". The plugin's runtime uses it everywhere (button hover
states, selection tints, etc.) — diff tints follow the same pattern.

## D4.3 Why these tokens, not hardcoded green/red

Three reasons:

1. **DESIGN.md re-theming.** A DESIGN.md that declares
   `colors.success: olive` vs `colors.success: blue` (rare but real)
   re-tints every diff in the plugin to the chosen success color. No
   per-block override needed.

2. **Color-blind correctness.** A user with deuteranopia sees olive
   and rust differently than a user without — and the project's
   semantic tokens are calibrated for accessibility (see
   `amvcp-design-tokens`'s DT-12 contrast checklist). Hardcoded
   `#9ece9e` / `#a84a32` bypass that calibration.

3. **Visual coherence.** A diff on a page where the page-level
   "success" badge uses one shade of olive should match the diff's
   add tint. Same source token = visual unity.

The catalog mining's CB-01 entry explicitly called out "Shiki's
transformerDiff" as the SKIP because it ships its own hardcoded
red/green — this skill's diff tints exist precisely to NOT do that.

## D4.4 The 22% / 60% / 16% / 70% calibration

The percent values are calibrated for readability:

| Tint | Dark theme | Light theme | Rationale |
|---|---|---|---|
| Add bg | 22% | 16% | Soft enough to not dominate; visible enough to register at a glance. Light theme is slightly lower because the bright surface boosts perceived intensity. |
| Del bg | 22% | 16% | Same as add. |
| Add gutter | 60% | 70% | The gutter cell is smaller — needs more saturation to read. Light theme is HIGHER because the bg behind it is brighter (the contrast goes the opposite way). |
| Del gutter | 60% | 70% | Same as add. |

These are NOT magic numbers — they're the result of contrast-test
iteration against AA standards. Don't tune per-page.

## D4.5 The full fallback chain

For a diff to render correctly, the cascade is:

1. `--ve-code-diff-add-bg` (the bridge var, this file)
2. → `--vc-code-diff-add-bg` (DESIGN.md engine emits if present)
3. → `color-mix(in srgb, var(--vc-color-success, #3a6b5c) 22%, transparent)`
4. → `--vc-color-success` (DESIGN.md engine emits if present)
5. → `#3a6b5c` (hardcoded final fallback)

Five fallback levels — even with NO DESIGN.md, NO `code` group, NO
`colors` group, the diff renders correctly. The chain is robust.

## D4.6 Adding the diff tints to DESIGN.md (optional)

If a project wants project-specific diff colors, the DESIGN.md schema
accepts:

```yaml
colors:
  success: "#3a6b5c"        # source for add tints
  danger:  "#a84a32"        # source for del tints

code:
  # Optional explicit overrides — if absent, the engine doesn't emit
  # --vc-code-diff-* and the bridge falls through to color-mix(success).
  diff-add-bg: "rgba(58, 107, 92, 0.22)"
  diff-del-bg: "rgba(168, 74, 50, 0.22)"
  diff-add-gutter: "rgba(58, 107, 92, 0.60)"
  diff-del-gutter: "rgba(168, 74, 50, 0.60)"
```

The optional `code.diff-*` keys let an author bypass the auto-mix when
they want a SPECIFIC tint (e.g. fully-opaque bands, or a different hue
shift). Most authors don't need this — the auto-mix is correct for
99% of pages.

## D4.7 The color-mix syntax — browser support

`color-mix()` is supported in:
- Chromium 111+ (March 2023)
- Safari 16.2+ (December 2022)
- Firefox 113+ (May 2023)

All within the runtime's supported-browser matrix. Older browsers fall
through to the hardcoded `#9ece9e` / `#a84a32` defaults (the
`color-mix()` declaration is invalid → the `var()` fallback to the
literal hex applies).

For pre-2023 Safari (uncommon now), the fallback is:
- Add bg fallback: a hardcoded `rgba(154, 206, 158, 0.22)` (the olive
  baked at 22%)
- Del bg fallback: a hardcoded `rgba(168, 74, 50, 0.22)` (the rust at
  22%)

The runtime's `:root` declaration provides BOTH the `color-mix` form
AND the rgba fallback — modern browsers use the `color-mix`; older
ones use the rgba. Both are theme-coherent because the fallback rgba
is the SAME numeric value the `color-mix` would compute.

## D4.8 Selection tint over diff tint

When a `.ve-code-line` with `data-ve-diff="add"` ALSO has
`data-ve-pressed="1"`:

- The diff-add bg (olive 22%) is rendered first (CSS source order
  matters here — the diff rule is below the gutter rule in
  `injectStyles()`).
- The selection bg (accent 28%) is rendered ON TOP of the diff bg.
- The result: an amber-olive blend, distinct from "selected non-add"
  (pure amber) AND distinct from "unselected add" (pure olive).

The composition works because both bgs use `color-mix(... transparent)`
— they LAYER correctly. A hardcoded `background:` would have
overridden the diff bg (the selection won), losing the diff context.

## D4.9 Print stylesheet

When printing (`@media print`), the bg tints are amplified to 35% / 25%
(dark theme equivalent applied since print is usually on bright paper).
This compensates for the loss of glow / outline glow when printing.

```css
@media print {
  :root {
    --ve-code-diff-add-bg: color-mix(in srgb, var(--vc-color-success, #3a6b5c) 35%, transparent) !important;
    --ve-code-diff-del-bg: color-mix(in srgb, var(--vc-color-danger,  #a84a32) 35%, transparent) !important;
  }
}
```

## D4.10 What an author can override

- The percent values, by re-declaring `--ve-code-diff-*` on a parent
  element (rare).
- The semantic color source, by overriding `--vc-color-success` /
  `--vc-color-danger` in DESIGN.md (the canonical path).
- The whole bridge layer, by overriding `--ve-code-diff-*` directly in
  page CSS (escape hatch — discouraged because it breaks the chain).

## D4.11 Author rules

| Rule | Why |
|---|---|
| Don't hardcode `#9ece9e` / `#a84a32` on a page | Loses the theming chain; the diff won't re-theme with the page |
| Re-theme via DESIGN.md `colors.success` / `colors.danger`, not via per-page CSS | One source of truth |
| Don't override the percent calibrations | They're contrast-tested for AA; ad-hoc tweaks fail accessibility |
| Print fixtures: trust the print stylesheet's amplification | Manually overriding breaks the print-friendly degradation |

## D4.12 Tokens consumed

- `--vc-color-success` — source for add tints
- `--vc-color-danger` — source for del tints
- The 4 bridge tokens (`--ve-code-diff-*`) this reference defines

## D4.13 Cross-references

- [diff-blocks-unified.md](./diff-blocks-unified.md) — where the
  tints are applied
- [diff-blocks-split.md](./diff-blocks-split.md) — same
- [diff-gutter-old-new.md](./diff-gutter-old-new.md) — twin gutter
  uses the same tint tokens
- [light-dark-mirror-discipline.md](../../amvcp-code-syntax/references/light-dark-mirror-discipline.md)
  — the verification ritual every diff fixture must pass
