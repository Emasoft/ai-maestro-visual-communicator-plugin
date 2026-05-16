# 9-category palette system (DT-26)

The umbrella taxonomy that organises the 13 named presets into nine
aesthetic categories: Bold / Warm / Dark / Clean / Nature / Neon /
Pastel / Jewel / Monochrome. Helps the agent (and the human) pick a
preset by INTENT instead of by name.

## The nine categories

| Category | What it conveys | Shipped presets |
|---|---|---|
| **Bold** | high contrast, primary colors, magazine-like authority | `editorial-crimson` |
| **Warm** | clay / coral / amber family, print heritage, editorial | `heritage`, `parchment`, `cjk-claude` |
| **Dark** | near-black surfaces, dark-first artifacts | `factory-dark`, `linear-graphite`, `zinc-sky`, `neon-cyber` |
| **Clean** | pure white + single accent, minimal-friendly | `trust-indigo` |
| **Nature** | earth tones, foliage, calm | `ivory-slate` |
| **Neon** | saturated on dark, cyberpunk, vivid | `neon-cyber` |
| **Pastel** | low-chroma light, soft | (no shipped preset yet — `applyPersonalityDelta(playful, parchment)` approximates) |
| **Jewel** | deep saturated gems, premium | `growth-navy` |
| **Monochrome** | single hue + neutrals, no chroma | `near-black`, `wireframe-grayscale` |

A preset can sit in MULTIPLE categories (e.g. `neon-cyber` is both
**Dark** and **Neon**); pick the dominant one for the picker UI.

## When to use which category

Match the artifact's INTENT to a category:

- **Editorial articles / heritage brands** → Warm (Heritage, Parchment, Ivory Slate)
- **Corporate B2B / fintech / serious** → Clean / Jewel (Trust Indigo, Growth Navy)
- **Magazine / publishing / bold marketing** → Bold (Editorial Crimson)
- **Code editor / dev tools / IDE** → Dark (Linear Graphite, Zinc Sky)
- **Industrial / manufacturing / construction** → Dark (Factory Dark)
- **Cybersecurity / gaming / cyberpunk** → Neon (Neon Cyber)
- **Wireframe / structural review** → Monochrome (Wireframe Grayscale, Near Black)
- **Asian-language content** → Warm-CJK (CJK Claude)

## Scaffold to emit

A category-picker UI (illustrative):

```html
<select id="category-picker">
  <optgroup label="Warm">
    <option value="heritage">Heritage — runtime default</option>
    <option value="parchment">Parchment</option>
    <option value="cjk-claude">CJK Claude</option>
  </optgroup>
  <optgroup label="Dark">
    <option value="factory-dark">Factory Dark</option>
    <option value="linear-graphite">Linear Graphite</option>
    <option value="zinc-sky">Zinc Sky</option>
    <option value="neon-cyber">Neon Cyber</option>
  </optgroup>
  <optgroup label="Bold">
    <option value="editorial-crimson">Editorial Crimson</option>
  </optgroup>
  <optgroup label="Clean">
    <option value="trust-indigo">Trust Indigo</option>
  </optgroup>
  <optgroup label="Nature">
    <option value="ivory-slate">Ivory Slate</option>
  </optgroup>
  <optgroup label="Jewel">
    <option value="growth-navy">Growth Navy</option>
  </optgroup>
  <optgroup label="Monochrome">
    <option value="near-black">Near Black</option>
    <option value="wireframe-grayscale">Wireframe Grayscale</option>
  </optgroup>
</select>

<script>
  document.getElementById('category-picker').addEventListener('change', function (ev) {
    window.__veDesignMd.hotSwap(amvcpTokens.PRESETS[ev.target.value]);
  });
</script>
```

## Lib functions used

- `amvcpTokens.PRESETS` — the data map
- `window.__veDesignMd.hotSwap(text)` — live preset swap

## DESIGN.md tokens used

- (none — this is a taxonomy for organising presets, not a token
  surface itself)

## Anti-slop interaction

Every preset under every category is dual-theme + linted at build
time. So picking ANY preset from this taxonomy is safe. The category
labels themselves aren't enforced — they're a discovery aid for the
human / agent, not a runtime check.

## Adding a new preset to a category

To ship a new preset:

1. Add a descriptor to `PRESET_DESCRIPTORS` in `amvcp-tokens.js` (full
   dual-theme color tuples, font stacks, radius, code colors, blurb);
2. Verify `parseDesignMd(PRESETS['new-key']).ok === true` (the build's
   `every_preset_parses` test);
3. Verify `lintTokenSet(PRESETS['new-key']).ok === true` (the build's
   `every_preset_passes_gate` test);
4. Verify the body text contrast hits 4.5:1 in both themes (a manual
   spot check or a CI assertion);
5. Add the key to this document's category table.

## Selection / comment / decision-mini contract

Each preset's selection / focus-ring / state-overlay derive from its
own accent — see `references/derived-state-color-split.md` and
`references/dual-theme-contract.md`. So switching CATEGORY also
switches the selection mark hue, the focus ring hue, and the
categorical role-map ramps — all coherent with the new accent.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — render a sample
artifact, cycle through every preset via the picker above, screenshot
each under `dev-browser` in BOTH themes (R1). Eyeball-check that:

1. each category's presets feel like THE category (Warm presets feel
   warm; Dark presets feel dark; Bold presets feel high-contrast);
2. no two presets in the same category look identical (within Warm,
   Heritage vs Parchment vs CJK Claude are visibly different);
3. cross-category switches produce DRAMATICALLY different artifacts
   (Heritage → Factory Dark is night-and-day; Heritage → Parchment
   is subtle but distinct).
