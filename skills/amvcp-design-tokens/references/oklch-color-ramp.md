# OKLCH perceptual color-ramp generator (DT-02 + DM-17)

A perceptually uniform color ramp. Hold the seed's hue and chroma
constant; vary lightness across N stops. Result: equal-looking brightness
steps to the human eye, no hue-shift artefacts. OKLCh interpolation is
what `color-mix(in oklch, …)` does — generating in the same space gives
ramps that mix cleanly downstream.

## What it does

`amvcpTokens.generateOklchRamp(seedHex, steps, opts)` parses the seed
into OKLCh, builds a lightness sequence per the chosen curve, and emits
a `#rrggbb` ramp.

Two curve modes:

| `opts.curve` | Lightness sequence |
|---|---|
| `'phi'` (default) | `L[n] = Lmax * (PHI^-0.35)^n` — exponential decay, golden-ratio-shaped |
| `'radix'` | the 12-stop Radix-approximating table `[0.99 0.975 0.95 0.92 0.88 0.83 0.77 0.70 0.62 0.54 0.44 0.32]`, interpolated for any N |

Optional `opts.p3: true` attaches a parallel `color(display-p3 r g b)`
array as `ramp.p3` — for P3 wide-gamut progressive enhancement (DT-18).

Fail-fast: an unparseable seed hex throws (the documented error message
points to the seed argument). `steps < 1` throws.

## When to choose

- `'phi'` for an organic ramp with more contrast at the dark end (good
  for accent ramps, banner overlays).
- `'radix'` when you want a UI-system-shape ramp matching Radix's
  signature distribution (lots of near-white background stops, fewer
  mid-tones, a deep accessible-text dark stop).
- `p3: true` only when the artifact will be viewed in a wide-gamut
  context (a P3-capable display, an Apple device) and you want the
  punchier accent there while keeping a clean sRGB fallback.

## Scaffold to emit

The ramp is rarely embedded directly — instead, **map its stops to the
15 `--vc-color-*` roles** the engine expects:

```js
var ramp = amvcpTokens.generateOklchRamp('#1d4ed8', 10);
// → ['#e8f1ff', '#d2e2fb', '#b5cef6', '#94b6ef', '#6e9be5',
//    '#4279d3', '#1d4ed8' /*seed-ish*/, '#163daa', '#102c7c', '#0a1d50']

// Assign stops to roles (example for a light theme):
var lightColors = {
  canvas:           ramp[0],   // very pale
  surface:          '#fefefe',
  'surface-raised': '#fbfcff',
  'surface-sunken': ramp[1],
  content:          ramp[9],   // deep accessible-text
  'content-muted':  ramp[7],
  'content-subtle': ramp[5],
  border:           ramp[2],
  'border-strong':  ramp[3],
  accent:           ramp[6],   // the seed stop
  'on-accent':      '#ffffff',
  // semantic states come from a different ramp (success/warning/danger/info)
};
```

## Lib functions used

- `amvcpTokens.generateOklchRamp(seedHex, steps, opts)` → `string[]`
  (with optional `.p3: string[]` sidecar)
- `amvcpTokens.generateNeutralScale(inkHex, stops)` — pair with the ramp
  when you want tonally-locked grays
- `amvcpTokens.contrastRatio(a, b)` — verify any text-on-bg pairing
  hits WCAG 4.5:1 before committing the assignment

## DESIGN.md tokens used

- writes: any of the 15 `colors.<theme>.<role>` entries
- reads: the seed hex from `colors.light.accent` (typical author flow:
  start from the accent, regenerate the ramp, re-assign stops)

## Anti-slop interaction

Every emitted stop goes through `lintTokenSet` via the preset / final
HTML lint. A seed too close to the banned bright-mid indigo
(`#6366F1` family) WILL flag — that is a feature, not a defect. Shift
the seed by ~25° hue (toward royal blue or teal) and regenerate.

The ramp inherently avoids gradient-as-background slop because it
produces discrete stops, not a `linear-gradient(…)`.

## Selection / comment / decision-mini contract

Color tokens drive the contact-sheet's color panel (4-column grid,
both themes side-by-side, every swatch a click-to-copy button copying
`#rrggbb` to the clipboard). Each swatch carries its WCAG contrast
ratio against `--vc-color-canvas` (or `--vc-color-surface` for the text
roles). Text-role cells whose ratio < 4.5:1 are flagged with
`data-vc-contrast-warn="1"`.

Selection inside the sheet uses the standard `--vc-selection-bg` (a
20%-accent mix against transparent), so dragging across swatches reads
the same way as dragging across body text — visual continuity.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact sheet
under `dev-browser`, screenshot **both themes** (R1), and for every text
role assert `contrastRatio(role, canvas) >= 4.5` via `page.evaluate`. A
ramp generated with too low `Lmax` (e.g. 0.7) yields a low-contrast
content role and the screenshot will visibly read as muddy — fix at the
generator (raise `Lmax`), never by hand-tinting the role after the fact.
