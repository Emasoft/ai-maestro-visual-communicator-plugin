# Factory Dark palette — industrial dark-first preset (DT-07)

A dark-first preset with an orange accent. The anti-slop counterpart
to "generic tech dark with purple". Industrial machinery credibility
— Caterpillar yellow / Komatsu orange territory. Tight radii (2/4/6/8)
read as engineered rather than friendly.

## What it is

`amvcpTokens.PRESETS['factory-dark']`. Distinguishing features:

| Token | Light | Dark |
|---|---|---|
| `canvas` | `#f4f2ef` warm-tinted off-white | `#13110f` warm-tinted near-black |
| `accent` | `#d9520e` machinery orange | `#ef6f2e` brightened machinery orange |
| `content` | `#1c1a17` warm near-black | `#f0ede8` warm near-white |
| `success` | `#2f7d4f` deep green | `#5cae7e` brightened green |
| `danger` | `#bd3b2a` rust | `#e0685a` brightened rust |

Typography:

- `font-heading`: `Oswald, Arial Narrow, sans-serif` — condensed,
  industrial, signage-feeling
- `font-body`: `system-ui, -apple-system, Segoe UI, sans-serif`
- `font-mono`: `JetBrains Mono, ui-monospace, monospace`

Radius scale: `[0, 2, 4, 6, 8]` — tight corners, mechanical-feeling.

Default theme: `dark` (the `meta.default_theme` is `dark` so the
artifact loads in dark mode by default; the light theme is still a
real designed variant for `prefers-color-scheme: light` users).

## When to pick

- when the artifact is for INDUSTRIAL / MANUFACTURING / LOGISTICS /
  AUTOMOTIVE contexts;
- when the user says "industrial" / "factory" / "shop floor" /
  "construction";
- when you want to AVOID the AI-default "dark with purple/indigo"
  look — Factory Dark's orange accent is the deliberate counter;
- for code editor / IDE-style artifacts (the tight radii and condensed
  heading font read as "developer tooling").

DON'T pick for:

- consumer marketing (too industrial-utilitarian);
- editorial / heritage contexts (use Heritage or Editorial Crimson);
- artifacts where the orange would clash with a real brand color
  (use Linear Graphite or Zinc Sky as a neutral dark alternative).

## Scaffold to emit

```html
<script type="text/design-md">
<!-- This is amvcpTokens.PRESETS['factory-dark'] verbatim. -->
</script>
```

```js
window.__veDesignMd.hotSwap(amvcpTokens.PRESETS['factory-dark']);
```

## Lib functions used

- `amvcpTokens.PRESETS['factory-dark']` → complete DESIGN.md text
- standard engine pipeline

## DESIGN.md tokens used

- writes (via the preset's text): all 15 colors × 2 themes,
  typography, spacing, radius, elevation, motion, z-index, code
- `meta.default_theme: dark` — the artifact loads dark by default

## Anti-slop interaction

Factory Dark is the SPECIFIC anti-slop reference: its accent
`#d9520e` / `#ef6f2e` is the deliberate counter to the AI-generated
`#6366F1` / `#8B5CF6` indigo. Any artifact that loads Factory Dark
ships a STATEMENT that the author chose this palette, not the
defaults. The lint pass verifies the chosen accent is far from the
banned region (passes by ~50+ OKLab ΔE).

## Selection / comment / decision-mini contract

Selection on Factory Dark is a 20% orange mix against transparent —
a warm amber selection mark, machinery-orange-tinted. Focus ring is
a 45% orange mix — high-contrast, deliberately industrial-feeling.

Comment threads use the brightened-orange accent in dark theme; the
thread chrome maps onto the dark `surface-raised` / `border` /
`content` — reads as deliberately-engineered UI.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open a Factory Dark
sample under `dev-browser`. Screenshot in **both themes** (R1) and
verify:

1. dark canvas is warm-tinted near-black (`#13110f`), NOT cold
   `#0a0a0a` — visible difference because warm darks have a slight
   amber cast;
2. accent is unmistakably orange (machinery / Caterpillar / safety
   vest territory), not the generic AI indigo;
3. heading font reads as CONDENSED (`Oswald`'s narrow forms or the
   `Arial Narrow` fallback);
4. radii are TIGHT — verify a card's
   `getComputedStyle(card).borderRadius === '4px'` (the `md` step in
   Factory Dark's radius scale).
