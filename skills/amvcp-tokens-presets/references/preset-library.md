# Preset library — the named dual-theme token sets

## Table of Contents

- [The presets](#the-presets)
- [Anti-slop note — `trust-indigo`](#anti-slop-note--trust-indigo)
- [Personality deltas — `applyPersonalityDelta`](#personality-deltas--applypersonalitydelta)
- [Hot-swap restyling](#hot-swap-restyling)
- [Scoped theming with a preset](#scoped-theming-with-a-preset)

`amvcpTokens.PRESETS` is a map of `{ name -> DESIGN.md frontmatter text }`.
Each entry is a **complete dual-theme DESIGN.md** — all 15 `--vc-color-*`
roles × light + dark, plus the typography / spacing / radius groups and
the elevation / motion / z-index / code groups. The agent picks one by
name; the skill emits its frontmatter as the page's
`<script type="text/design-md">` block; the runtime applies it.

## The presets

| Name | Category | Accent (light) | Notes |
|---|---|---|---|
| `heritage` | Warm | `#b8861f` honey | the runtime default |
| `factory-dark` | Dark | `#d9520e` / `#ef6f2e` orange | industrial, dark-first |
| `parchment` | Clean/Warm | `#8a5a2a` umber | soft borders, serif body |
| `editorial-crimson` | Bold | `#a6192e` crimson | near-white canvas |
| `trust-indigo` | Clean | `#1d4ed8` royal blue | see anti-slop note below |
| `growth-navy` | Jewel | `#04936a` emerald | fintech, navy-tinted base |
| `linear-graphite` | Dark | `#3b73a8` / `#5b9dd6` sky | graphite product UI |
| `zinc-sky` | Dark | `#0e87c5` / `#38bdf8` sky | neutral zinc |
| `near-black` | Monochrome | achromatic grey | off-black canvas |
| `ivory-slate` | Nature | `#8b7355` clay | ivory canvas |
| `neon-cyber` | Neon | `#0a8f7a` / `#00ffcc` cyan | near-black, vivid |
| `cjk-claude` | Warm | `#ff6600` Claude-orange | CJK-friendly font stack |
| `wireframe-grayscale` | Monochrome | zero-hue grey | `radius:0`, for wireframes |

Every preset is dual-theme by construction — the engine *requires* both
`colors.light` and `colors.dark`, so a preset omitting `dark` fails
`parseDesignMd`. For the dark-first presets (`factory-dark`,
`near-black`, `neon-cyber`, `linear-graphite`) the `light` theme is
still a real, designed light variant — never a placeholder.

## Anti-slop note — `trust-indigo`

The bright-mid AI indigo family (`#6366F1` / `#7C3AED`) is on the
anti-slop banned list. `trust-indigo` therefore uses a deep **royal
blue** `#1d4ed8` (light) and a brightened royal `#4f9bf0` (dark) — both
sit clearly outside the banned purple/violet OKLab radius. Every preset
is run through `lintTokenSet` at build time (the
`every_preset_passes_gate` test); a preset library that ships slop is a
contradiction. If a future preset's color flags, shift the color — never
weaken the gate.

## Personality deltas — `applyPersonalityDelta`

`amvcpTokens.applyPersonalityDelta(designmdText, deltaName)` parses a
DESIGN.md, mutates its token tree by a named delta, and re-serializes.
One source of truth: the delta is applied to the *parsed token tree*,
never to two copies.

| Delta | Effect |
|---|---|
| `playful` | radius → larger, accent chroma +20%, motion faster |
| `corporate` | radius → smaller, accent chroma -10%, motion normal |
| `minimal` | radius → 0, accent chroma -30%, motion slower |
| `warmer` | accent hue shifted toward orange |
| `cooler` | accent hue shifted toward blue |

The accent chroma / hue shift uses the OKLCh path — chroma is
multiplied, hue is rotated — and is applied to BOTH themes so the
dual-theme contract holds.

## Hot-swap restyling

The runtime exposes `window.__veDesignMd.hotSwap(text)`. Picking a
different preset is just feeding its frontmatter text to `hotSwap`:

```js
window.__veDesignMd.hotSwap(amvcpTokens.PRESETS['factory-dark']);
```

The whole page re-themes live — no reload, no new mechanism. The
contact sheet, every component, the page chrome — all re-resolve their
`--vc-*` tokens. `window.__veDesignMd.toggleTheme()` flips light/dark
the same way.

## Scoped theming with a preset

To theme one section with a different preset, parse it and apply to
that section as the `rootEl`:

```js
var parsed = amvcpDesignMd.parseDesignMd(amvcpTokens.PRESETS['parchment']);
var map = amvcpDesignMd.resolveTokens(parsed.designmd, 'light');
amvcpDesignMd.applyTokens(map, sectionEl);
```

The section and its descendants inherit the parchment tokens; the rest
of the page keeps its own.
