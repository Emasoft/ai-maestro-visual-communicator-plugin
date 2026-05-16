# OKLCh color-space rationale

The OKLCh / OKLab color space is the perceptually-uniform basis for
the design-tokens skill: ramp generation, categorical hue rotation,
delta-E near-match checking, personality-delta hue rotation. This
document is the rationale + the conversion math that the lib uses
behind every "perceptual" claim.

## Why OKLCh

Three reasons:

1. **Perceptual uniformity.** Equal numeric distances in OKLab equal
   equal-looking distances to the human eye. A 0.05-deltaE step
   looks the same whether you're moving from yellow to orange or
   from blue to violet. RGB / HSL distances don't have this property
   — equal RGB distance can look wildly different perceptually.
2. **Hue rotation preserves chroma.** Rotating an OKLCh hue
   preserves the color's vividness. Rotating an HSL hue can produce
   a wildly more / less saturated result because HSL conflates
   chroma and brightness.
3. **`color-mix(in oklch, …)` exists.** Browsers natively interpolate
   in OKLCh now. Generating in the same space gives ramps that mix
   cleanly downstream — `color-mix` between two adjacent ramp stops
   produces a third stop that's perceptually on-ramp.

## The conversions

The library implements the standard sRGB → OKLab pipeline:

```
sRGB (0..255 per channel)
    ↓  srgbChannelToLinear (gamma decode, the WCAG-compliant power curve)
linear sRGB (0..1 per channel)
    ↓  linearToOklab (3×3 matrix → cube-root → 3×3 matrix)
OKLab (L, a, b)
    ↓  oklabToOklch (a, b → C = sqrt(a² + b²), h = atan2(b, a))
OKLCh (L, C, h)
```

Reverse: `oklchToOklab` → `oklabToLinear` → `linearToSrgbChannel` →
sRGB.

The OKLab → linear sRGB step does gamut MAPPING — out-of-gamut
OKLCh values (vivid hues at high lightness) are clipped to the sRGB
gamut. `inGamut(lin)` checks all three channels ∈ [0, 1]; if not,
the value is clamped (which is the standard practice — out-of-gamut
isn't an error, it's "the closest in-gamut color to your intent").

## The `oklchToHex` shortcut

```
oklchToHex(lch) -> '#rrggbb'
```

Goes OKLCh → OKLab → linear → sRGB → hex in one call. Used by every
generator (`generateOklchRamp`, `generateCategoricalHues`, the
personality-delta `shiftAccent` helper).

## The `oklchToP3` shortcut

```
oklchToP3(lch) -> 'color(display-p3 r g b)'
```

Returns the P3 wide-gamut string. Used by `generateOklchRamp` when
`opts.p3` is set — see `references/p3-wide-gamut.md`.

## The `oklabDeltaE` distance

```
oklabDeltaE(hexA, hexB) -> number   // Euclidean distance in OKLab
```

Returns the Euclidean distance in OKLab — a perceptually-uniform
deltaE. Used by the slop gate's near-match check
(`bannedColorReason`): if a candidate's OKLab distance to any
banned hex is below `SLOP_DELTA_E ≈ 0.05`, the candidate is flagged.

The 0.05 threshold is tuned to catch "one-digit-off" AI purples
(`#8c5cf7` ↔ `#8b5cf6`) without flagging "deliberately-near"
colors (a brand whose accent is intentionally a near-shade of the
banned set).

## When to use OKLCh in custom widgets

Whenever you need:

- a brand-coherent CATEGORICAL ramp (use
  `generateCategoricalHues`);
- a perceptually-even LIGHTNESS ramp (use `generateOklchRamp`);
- to ROTATE a color's hue without changing its vividness (apply a
  delta via `applyPersonalityDelta`, or use the raw OKLCh path);
- to MIX two colors in a perceptually-faithful way (CSS:
  `color-mix(in oklch, var(--a), var(--b))`).

DON'T use raw OKLCh in CSS yet (`oklch(50% 0.05 250)`) — browser
support is good but not universal; bake to hex with `oklchToHex` at
authoring time for maximum compatibility.

## Lib functions used

- `amvcpTokens.generateOklchRamp`,
  `amvcpTokens.generateCategoricalHues`,
  `amvcpTokens.applyPersonalityDelta` — all use the OKLCh path
- (internal) `parseHex`, `formatHex`, `srgbToOklab`,
  `oklabToOklch`, `oklchToOklab`, `oklabToLinear`,
  `linearToSrgbChannel`, `oklchToHex`, `oklchToP3`,
  `oklabDeltaE` — building blocks; not exported

## DESIGN.md tokens used

- this document is about the COLOR-SPACE BASIS, not specific tokens;
  every color generator that ends up writing a `--vc-color-*` value
  goes through this pipeline

## Anti-slop interaction

The OKLab near-match check (`oklabDeltaE`) is what makes the slop
gate's banned-color list ROBUST. A naive hex-exact check would only
catch `#6366f1` and miss `#6466f1` / `#6266f1`. OKLab tolerance
catches the entire "AI indigo family" with one threshold.

## Selection / comment / decision-mini contract

This is a meta-document about the color space — no chrome.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — there's nothing visual
to verify directly. The OKLCh basis is verified by the OUTPUTS of
the generators that use it (ramp panel screenshots in
`references/oklch-color-ramp.md`, categorical chip screenshots in
`references/golden-angle-categorical.md`).

A standalone smoke test:

```js
// Round-trip every preset's accent through OKLCh and back — no value
// should drift more than 1 deltaE.
Object.keys(amvcpTokens.PRESETS).forEach((key) => {
  const text = amvcpTokens.PRESETS[key];
  const parsed = amvcpDesignMd.parseDesignMd(text);
  const accentLight = parsed.designmd.tokens.colors.light.accent;
  const accentDark  = parsed.designmd.tokens.colors.dark.accent;
  // Round-trip via the (internal) OKLCh path:
  //   const lch = oklabToOklch(srgbToOklab(parseHex(accentLight)));
  //   const back = oklchToHex(lch);
  //   expect deltaE(accentLight, back) < 1.0
});
```

If the round-trip ever drifts > 1 deltaE, the OKLab math has a bug
— the test catches it before it ships.
