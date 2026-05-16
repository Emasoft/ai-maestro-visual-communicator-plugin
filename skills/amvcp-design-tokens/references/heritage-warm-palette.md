# Heritage warm palette — the runtime default

The runtime's default preset. Cream / parchment / honey palette + a
slight serif heading + system body. Print-heritage editorial feel
without being heavy. The "no preset chosen" preset — every artifact
loads this if the DESIGN.md is missing or omits a theme.

## What it is

`amvcpTokens.PRESETS['heritage']` is a complete dual-theme DESIGN.md
text. Distinguishing features:

| Token | Light | Dark |
|---|---|---|
| `canvas` | `#faf6ee` cream | `#16130d` near-black warm |
| `surface` | `#fffefb` pure cream | `#211c14` raised warm |
| `accent` | `#b8861f` honey | `#e0aa3e` brightened honey |
| `content` | `#1f1a14` warm near-black | `#f3ecdd` warm near-white |
| `success` | `#3a6b5c` deep teal | `#6fae9b` brightened teal |
| `danger` | `#a84a32` terracotta | `#dd8068` brightened terracotta |

Typography:

- `font-heading`: `Playfair Display, Georgia, serif` — display serif
- `font-body`: `system-ui, -apple-system, Segoe UI, sans-serif`
- `font-mono`: `JetBrains Mono, ui-monospace, monospace`

Radius scale: `[0, 4, 8, 12, 16]` — mid-soft (an 8px md radius).

## When to pick

- when no specific brand is provided — the runtime default reads as
  warm, professional, editorial without claiming a particular brand;
- when the artifact is a REPORT, an ARTICLE, a LONG-FORM document —
  the serif heading + warm tones read as "deliberate" / "human";
- when the user says "make it warm" / "make it editorial" /
  "heritage-feeling".

DON'T pick for:

- product UI / dashboards (Linear-Graphite or Zinc-Sky is the better
  default for those);
- explicitly dark-first contexts (Factory-Dark);
- wireframes (Wireframe-Grayscale).

## Scaffold to emit

```html
<script type="text/design-md">
<!-- This is amvcpTokens.PRESETS['heritage'] verbatim. -->
</script>
```

Programmatically:

```js
var heritageText = amvcpTokens.PRESETS['heritage'];
// → a multi-line DESIGN.md frontmatter string

// Embed in a page:
var script = document.getElementById('design-md-script');
script.textContent = heritageText;

// Or hot-swap into an already-loaded page:
window.__veDesignMd.hotSwap(heritageText);
```

## Lib functions used

- `amvcpTokens.PRESETS['heritage']` → a complete DESIGN.md text
- the engine pipeline (`parseDesignMd` → `resolveTokens` →
  `applyTokens`) processes it like any other DESIGN.md

## DESIGN.md tokens used

- writes (via the preset's text): all 15 color roles × 2 themes,
  typography, spacing, radius, elevation, motion, z-index, code
- the preset is a FULL DESIGN.md — every group the engine knows is
  populated

## Anti-slop interaction

The heritage preset is anti-slop by construction: the cream canvas
(`#faf6ee`) is NOT pure `#ffffff` (exact-banned); the warm-tinted
near-black (`#1f1a14`) is NOT pure `#000000`; the honey accent
(`#b8861f`) is far from the banned indigo radius. The build-time
`every_preset_passes_gate` test re-verifies on every commit.

## Selection / comment / decision-mini contract

Selection (`--vc-selection-bg`) on heritage is a 20% honey mix
against transparent — a soft amber selection mark that reads on the
cream canvas. Focus ring is a 45% honey mix — a soft amber ring,
not a stark blue (which would be out-of-palette).

Comment threads inherit the heritage palette automatically; the
thread chrome (card surface, border, content, timestamp) maps onto
`surface-raised`, `border`, `content`, `content-subtle` —
brand-coherent without any thread-specific styling.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open a heritage-themed
sample under `dev-browser`. Screenshot in **both themes** (R1) and
verify:

1. canvas reads as cream (light) or warm-near-black (dark) — NOT
   pure white / pure black;
2. accent reads as honey in both themes (not a generic blue / orange);
3. heading text reads as serif (Playfair Display loaded if available;
   Georgia / system serif fallback otherwise — verify the FALLBACK
   isn't itself a banned font by checking the second family in the
   stack is `Georgia, serif`).
