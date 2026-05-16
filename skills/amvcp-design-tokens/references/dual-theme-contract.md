# Dual-theme contract — EVERY artifact ships light AND dark (DM-11)

The engine REQUIRES both `colors.light` AND `colors.dark` for every
DESIGN.md — `parseDesignMd` fails fast on a missing theme. Every other
visual must theme correctly in BOTH themes. This document is the
canonical reference for WHY single-theme artifacts are a defect, HOW
the theme flip works mechanically, and the verification protocol that
every emitted artifact MUST pass.

## Why dual-theme is mandatory (not "nice to have")

The user's memory file (`feedback_light_dark_themes.md`) is explicit:
"every visual must ship BOTH themes; single-theme = correctness
defect". The reasons:

1. **`prefers-color-scheme` is universal.** Every modern browser
   exposes the system theme preference. An artifact that locks one
   theme FLASHES the wrong theme during load + forces the reader to
   either accept it or visually fight it. That's eye strain — a
   physical harm.
2. **Embedding context is unknown.** An artifact emailed as an
   attachment, embedded in a host page, opened in Notion / Reader
   mode / a custom in-app viewer — each has its own theme. The
   artifact must adapt.
3. **The cost is trivial.** ALL the mechanics (token resolution,
   `color-mix` derivations, CSS layering) work IDENTICALLY for both
   themes — the only author work is supplying the 15-role color map
   TWICE (light + dark). 30 lines of YAML vs. forever-eye-strain.

## How the engine enforces it

`amvcpDesignMd.parseDesignMd(text)`:

```
if (!designmd.tokens.colors.light) → ok: false, errors: ["colors.light required"]
if (!designmd.tokens.colors.dark)  → ok: false, errors: ["colors.dark required"]
```

A DESIGN.md missing either theme block produces `ok: false`; the
engine applies NOTHING (fail-fast). The agent surfaces the error and
fixes the source.

## How the theme flip works

1. `applyTokens` reads the CURRENT theme attribute on `<html>` (e.g.
   `data-ve-theme="light"`).
2. `resolveTokens(designmd, theme)` walks the parsed tree, resolves
   `{token.refs}`, and returns a flat `{ '--vc-color-canvas': '#faf6ee',
   …, '--vc-color-accent': '#b8861f', … }` map for that theme.
3. The map is applied as INLINE STYLE on `document.documentElement`.
4. Every descendant inherits the inline `--vc-*` values; every
   `var(--vc-color-canvas)` declaration in any stylesheet recomputes.
5. Derived `color-mix(... var(--vc-color-surface))` expressions
   recompute too — because they reference `--vc-color-surface`,
   which just changed.

`window.__veDesignMd.toggleTheme()` flips the attribute and re-runs
`applyTokens`. Zero new mechanism — same engine path, different
theme argument.

## The mechanical tricks for dual-theme correctness

The self-debug rule R1 summarises:

> Switch BORDERS ↔ BACKGROUNDS between themes (light: dark border on
> light bg → dark: light border on dark bg). Switch TEXT ↔ BG colors.
> Selection emphasis is SUBTRACTIVE in light (push toward black) vs
> ADDITIVE in dark (push toward white).

The engine + `amvcp-tokens.css` derived family handle most of this
automatically (color-mix against `--vc-color-surface`). The cases an
author still needs to think about:

- **Brand-specific imagery.** A logo SVG that's near-black for light
  theme needs a near-white sibling for dark. Encode via
  `currentColor` if the logo is monochrome.
- **Charts / diagrams.** Hard-coded series colors fail. Use the role
  maps + categorical generator (`generateCategoricalHues(accent, N)`)
  so the series re-tints when the accent flips.
- **Shadows.** Near-black shadows are nearly invisible on dark
  canvases. Use the `cinematic` elevation style (more layers, more
  blur compensates) or a `tint`-ed shadow ink.
- **Selection.** Don't override `::selection` per-theme. The default
  `var(--vc-selection-bg)` (a 20% accent mix against transparent)
  composes correctly because the BACKGROUND it composes against is
  the per-theme surface.

## Scaffold to emit

```yaml
---
designmd_version: 1
colors:
  light:
    canvas:          "#faf6ee"
    surface:         "#fffefb"
    surface-raised:  "#fffdf8"
    surface-sunken:  "#f1ece0"
    content:         "#1f1a14"
    content-muted:   "#5b5343"
    content-subtle:  "#8a8170"
    border:          "#e3dcc9"
    border-strong:   "#c9bfa3"
    accent:          "#b8861f"
    on-accent:       "#fffdf9"
    success:         "#3a6b5c"
    warning:         "#a8791f"
    danger:          "#a84a32"
    info:            "#3464a8"
  dark:
    canvas:          "#16130d"
    surface:         "#211c14"
    surface-raised:  "#2a241a"
    surface-sunken:  "#0f0d09"
    content:         "#f3ecdd"
    content-muted:   "#b8ad96"
    content-subtle:  "#857c68"
    border:          "#3a3325"
    border-strong:   "#564c36"
    accent:          "#e0aa3e"
    on-accent:       "#16130d"
    success:         "#6fae9b"
    warning:         "#d8aa54"
    danger:          "#dd8068"
    info:            "#6f9bd8"
---
```

Every preset in `amvcpTokens.PRESETS` follows this shape. The
`themeColorsYaml` function in `amvcp-tokens.js` is the templating
authority — preset authors call it twice (once for each theme), the
agent sees the result.

## Lib functions used

- `amvcpDesignMd.parseDesignMd(text)` — fails fast on a missing theme
- `amvcpDesignMd.resolveTokens(designmd, themeName)` — resolves ONE
  theme to a flat map; call once per theme to inspect both
- `amvcpDesignMd.applyTokens(map, rootEl)` — applies one resolved
  theme map
- `amvcpTokens.lintTokenSet(designmd)` — `coerceToTokenMap` merges
  BOTH themes via `mergeThemeMaps` so a slop color hiding only in
  dark is still caught

## DESIGN.md tokens used

- writes: BOTH `colors.light.*` (15 roles) AND `colors.dark.*` (15
  roles) — 30 color assignments minimum per theme contract
- writes (optional): theme-specific overrides of OTHER groups (e.g.
  a darker `elevation.shadow-1` for dark theme), but this is
  uncommon — the engine's standard pattern is "color flips per
  theme; everything else stays the same".

## Anti-slop interaction

The slop gate INSPECTS both themes simultaneously
(`mergeThemeMaps`). A banned indigo accent that ONLY appears in
`colors.dark.accent` is still caught. The build-time
`every_preset_passes_gate` test runs `lintTokenSet` on every preset
— that's how every shipped PRESETS entry is dual-theme-safe.

## Selection / comment / decision-mini contract

Selection's `--vc-selection-bg` is theme-agnostic by mechanism (a
percent mix that composes against the active surface). Comment
threads and decision-mini widgets inherit the per-theme tokens
without special-casing — they paint with `var(--vc-color-*)`, the
engine swaps the underlying values, the widgets re-paint.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — R1 is the canonical
check. The minimum protocol:

```js
const themes = await page.evaluate(() => {
  const html = document.documentElement;
  const orig = html.getAttribute('data-ve-theme');
  const out = {};
  for (const t of ['light', 'dark']) {
    html.setAttribute('data-ve-theme', t);
    out[t] = {
      bg:     getComputedStyle(document.body).backgroundColor,
      text:   getComputedStyle(document.body).color,
      accent: getComputedStyle(html).getPropertyValue('--vc-color-accent').trim(),
    };
  }
  html.setAttribute('data-ve-theme', orig || 'light');
  return out;
});
// Both themes MUST have non-empty distinct values for bg, text, accent.
```

Screenshot the artifact in BOTH themes for the visual sanity check
too — measurements alone miss layout regressions (e.g. a chart whose
axis labels become invisible in dark mode because they were
hardcoded `#000`).
