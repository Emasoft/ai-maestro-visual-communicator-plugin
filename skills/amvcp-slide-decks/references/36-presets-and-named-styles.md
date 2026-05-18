# 36 — Named anti-slop presets (DESIGN.md as the preset format)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold — example presets](#scaffold--example-presets)
- [How presets ship](#how-presets-ship)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [When to use this reference](#when-to-use-this-reference)
- [Picking a preset by tone](#picking-a-preset-by-tone)
- [The "pick one and commit" rule](#the-pick-one-and-commit-rule)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

A preset is a DESIGN.md file. That's the consolidated decision:
instead of inventing a slide-specific preset format, the slide skill
uses DESIGN.md as the preset language. Switching presets means
swapping DESIGN.mds; theming is the engine's job, not the slide
module's.

This reference catalogues the named presets the slide-deck triage
identified (36+ across the catalogues), expressed here as DESIGN.md
fragments. Each preset is a complete `--vc-*` token bundle for a
specific aesthetic direction.

## What this is

The 12 anti-slop presets identified in SL-02 (the P4 anti-slop
catalogue):

| Preset name | Tone | Key colours |
|---|---|---|
| Bold Signal | Loud, attention-grabbing | Bright accent, high contrast |
| Electric Studio | Synthwave / neon | Deep purple + cyan |
| Creative Voltage | Confident, art-direction | Saturated brand colour + black |
| Dark Botanical | Premium, considered | Deep green + warm gold |
| Notebook Tabs | Editorial / scholarly | Paper cream + ink |
| Pastel Geometry | Friendly, accessible | Pastel set + minimal black |
| Split Pastel | Modern editorial | Two pastel pairs + bold accent |
| Vintage Editorial | Classic magazine | Sepia + serif heavy |
| Neon Cyber | Terminal / dystopian | Black + electric green + hot pink |
| Terminal Green | Pure terminal | Black + monochrome green + mono font |
| Swiss Modern | Brutalist, grid-first | White + black + red |
| Paper & Ink | Letterpress, tactile | Cream + ink + warm wood-accent |

Each preset becomes a `DESIGN.md` file the agent ships beside the
deck HTML.

## Scaffold — example presets

### Terminal Green

```yaml
---
name: Terminal Green
colors:
  light:
    canvas: "#f8fff8"
    content: "#0a0a0a"
    content-muted: "#3a3a3a"
    accent: "#0e6e0e"
    accent-2: "#0c5a0c"
    surface: "#eef9ee"
    divider: "#d4ecd4"
  dark:
    canvas: "#0a0e14"
    content: "#50fa7b"
    content-muted: "#3a9a4a"
    accent: "#50fa7b"
    accent-2: "#82ff9e"
    surface: "#0e1a18"
    divider: "#1a2a26"
fonts:
  heading: "JetBrains Mono, ui-monospace, monospace"
  body:    "JetBrains Mono, ui-monospace, monospace"
  mono:    "JetBrains Mono, ui-monospace, monospace"
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
---
```

A deck with this preset reads as a terminal: monospace everything,
green accent, dark canvas in dark mode.

### Midnight Editorial

```yaml
---
name: Midnight Editorial
colors:
  light:
    canvas: "#faf8f2"
    content: "#1a1814"
    content-muted: "#7a7468"
    accent: "#b8860b"
    accent-2: "#7a6a3a"
    surface: "#fffdf5"
    divider: "rgba(30, 30, 50, 0.16)"
  dark:
    canvas: "#0f1729"
    content: "#e8e4d8"
    content-muted: "#9a9484"
    accent: "#d4a73a"
    accent-2: "#aa8a2a"
    surface: "#1d2b52"
    divider: "rgba(200, 180, 140, 0.16)"
fonts:
  heading: "Instrument Serif, Georgia, serif"
  body:    "Instrument Serif, Georgia, serif"
  mono:    "JetBrains Mono, SF Mono, monospace"
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
---
```

Deep navy + warm gold + serif everything. Cinematic, premium.

### Swiss Modern

```yaml
---
name: Swiss Modern
colors:
  light:
    canvas: "#ffffff"
    content: "#0a0a0a"
    content-muted: "#5a5a5a"
    accent: "#dc2626"
    accent-2: "#0a0a0a"
    surface: "#f5f5f5"
    divider: "#e0e0e0"
  dark:
    canvas: "#0a0a0a"
    content: "#ffffff"
    content-muted: "#a0a0a0"
    accent: "#ef4444"
    accent-2: "#ffffff"
    surface: "#1a1a1a"
    divider: "#2a2a2a"
fonts:
  heading: "Helvetica Neue, Inter, system-ui, sans-serif"
  body:    "Helvetica Neue, Inter, system-ui, sans-serif"
  mono:    "JetBrains Mono, monospace"
spacing:
  scale: [4, 8, 16, 24, 32, 48, 64, 96]   # 8-multiples (brutalist grid)
---
```

White + black + red. Helvetica. Strong grid. Brutalist.

### Warm Signal

```yaml
---
name: Warm Signal
colors:
  light:
    canvas: "#fdf6e3"
    content: "#141413"
    content-muted: "#6a6258"
    accent: "#D97757"
    accent-2: "#788C5D"
    surface: "#f5edd6"
    divider: "#e8dfc4"
  dark:
    canvas: "#1a1815"
    content: "#fdf6e3"
    content-muted: "#a8a094"
    accent: "#D97757"
    accent-2: "#9aae74"
    surface: "#2a2722"
    divider: "#3a352e"
fonts:
  heading: "Source Serif Pro, Georgia, serif"
  body:    "Source Sans Pro, system-ui, sans-serif"
  mono:    "JetBrains Mono, monospace"
---
```

Warm cream + terracotta + olive. Editorial but earthy.

## How presets ship

The agent embeds the DESIGN.md as a `<script type="text/markdown">`
block in the deck HTML:

```html
<script type="text/markdown" id="vsd-preset">
---
name: Terminal Green
colors:
  light:
    canvas: "#f8fff8"
    ...
---
</script>
```

The slide module's `boot(doc)` reads it:

```js
var presetEl = doc.getElementById('vsd-preset');
if (presetEl && window.amvcpDesignMd) {
  var raw = presetEl.textContent || '';
  if (raw.trim()) {
    var parsed = window.amvcpDesignMd.parseDesignMd(raw);
    var mode = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
    var map = window.amvcpDesignMd.resolveTokens(parsed, mode);
    window.amvcpDesignMd.applyTokens(map, d.documentElement);
  }
}
```

The DESIGN.md engine parses the YAML, resolves to a token map,
applies the tokens to `:root`. The slide CSS reads them on the next
paint.

## Lib functions called

- `boot(doc)` in `amvcp-slide.js` — reads `#vsd-preset`, hands off
  to the engine.
- `window.amvcpDesignMd.parseDesignMd(rawText)` — parses the YAML
  + section structure.
- `window.amvcpDesignMd.resolveTokens(tree, mode)` — flattens to a
  `Map<name, value>` for the active mode.
- `window.amvcpDesignMd.applyTokens(map, doc.documentElement)` —
  writes each token as a CSS custom property on `:root`.

## DESIGN.md tokens used

The full token set documented in ref #30 — every preset is a
complete bundle of those tokens. The 4 example presets above
override:

- `colors.light.*` and `colors.dark.*` (8 colour tokens per mode).
- `fonts.heading` / `fonts.body` / `fonts.mono`.
- Optional: `spacing.scale` (overrides the default `[4,8,12,16,24,
  32,48,64]` ladder).

## When to use this reference

Open this ref when:

- Picking a preset for a new deck.
- A user asks for a specific aesthetic ("make it look like a
  terminal" → `Terminal Green`).
- Authoring a custom preset — use the examples above as templates.

## Picking a preset by tone

| User intent | Preset |
|---|---|
| Default professional | (none — uses the canonical fallbacks) |
| Premium / cinematic | `Midnight Editorial` |
| Terminal / engineering | `Terminal Green` |
| Brutalist / Swiss | `Swiss Modern` |
| Warm / earthy | `Warm Signal` |
| Magazine / editorial | `Vintage Editorial` |
| Loud / attention | `Bold Signal` |
| Playful pastel | `Pastel Geometry` or `Split Pastel` |
| Cyberpunk / neon | `Neon Cyber` |
| Synthwave | `Electric Studio` |

## The "pick one and commit" rule

A deck uses ONE preset for ALL slides. Mixing presets reads as
indecision — slide 3 in Terminal Green followed by slide 4 in
Midnight Editorial is a visual whiplash.

The same preset across 12 slides allows the agent to vary content
freely; the visual language stays cohesive.

## Don'ts

- Don't ship 36 presets at once and ask the agent to "pick one".
  The decision paralysis blows the token budget. The 12 anti-slop
  presets above are the curated set.
- Don't author colours / fonts in the deck JSON. The JSON is
  THEME-FREE by contract; theming is the DESIGN.md's job.
- Don't override per-slide colours via inline styles. The
  engine's token system handles per-element theming uniformly;
  inline overrides break the consistency.
- Don't pick a preset because it "looks cool". Pick because the
  tone matches the talk's purpose. A finance review in Neon
  Cyber reads as a joke.

## Visual verification

After applying a preset:

1. Reload the deck; verify the colours match the preset's tokens.
2. Toggle `prefers-color-scheme` between light + dark in DevTools;
   verify both modes work.
3. Check every layout in the deck reflects the preset (headings
   in the preset's heading font; metrics in the preset's accent
   colour; etc.).
4. Capture light + dark at 1280×720 via the dev-browser path in
   `skills/amvcp-self-debug-rules/SKILL.md`.

## Source provenance

- SL-02 — 36+ Named Slide Style Presets (Anti-Slop). The 12
  catalogued presets above are from the P4 anti-slop set.
- The DESIGN.md-as-preset decision is the consolidated plan's
  consolidation (the slide skill does NOT invent a separate preset
  format).
- DM-04 / DM-05 / DM-07 / DM-08 — the DESIGN.md schema + token
  naming convention the preset YAML uses.
- The "pick one and commit" rule is the SL-02 commentary in the
  master catalog ("Style name communicates intent to the LLM").
