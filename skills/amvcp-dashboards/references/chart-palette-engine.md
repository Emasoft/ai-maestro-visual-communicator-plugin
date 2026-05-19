# The color & gradient engine

The chart module ships TWO complementary color systems, both anchored to the
DESIGN.md `--vc-color-accent` token. They are the ONLY palette decisions
the chart module makes — there is no per-spec `color` field on any datum,
no per-chart palette override, no per-series color array. The palette
follows from DESIGN.md so a theme swap re-themes every chart with no
re-render.

## Table of contents

- [Categorical: the golden-angle palette](#categorical-the-golden-angle-palette)
- [Sequential / diverging: OKLCH ramps](#sequential--diverging-oklch-ramps)
- [Accent extraction — _accentLCH()](#accent-extraction--_accentlch)
- [Why no per-datum colors](#why-no-per-datum-colors)
- [Light + dark](#light--dark)
- [Public API](#public-api)

---

## Categorical: the golden-angle palette

The `palette(n)` helper returns `n` CSS color strings sized for series
distinctness. Successive hues step by the GOLDEN ANGLE
(`137.5077...°`) on top of the accent's hue.

```js
function palette(n) {
  var base = _accentLCH();              // { L, C, H } derived from --vc-color-accent
  var out = [];
  for (var i = 0; i < n; i++) {
    var hue = (base.H + i * GOLDEN_ANGLE) % 360;
    out.push('oklch(' + base.L.toFixed(3) + ' '
      + base.C.toFixed(3) + ' ' + hue.toFixed(1) + ')');
  }
  return out;
}
```

Why the golden angle? Successive hues separated by `137.5077°` are
MAXIMALLY DISTINCT for any series count. A naive `i * (360/n)` palette
becomes degenerate when n is even (opposite colors clash) and harder to
distinguish at large n (small angular steps look similar). The golden
angle solves both: every n ≥ 2 produces distinct hues, and adding a new
series doesn't change the existing series' hues meaningfully.

Lightness (L) and chroma (C) are DERIVED from the accent — never
hardcoded — so a dark-theme accent produces dark-appropriate palette
colors, and a light-theme accent produces light-appropriate ones. See
`_accentLCH()` below.

### Used by

- `bar`, `stacked-bar`, `lollipop`, `dot-plot`, `connected-dot-plot`, `bullet` — multi-series fills.
- `line`, `area`, `step-area`, `slope`, `bump` — line stroke colors.
- `donut`, `harvey-ball` — slice fills (n = slice count).
- `mekko` — stack-layer fills.
- `radar` — polygon fill (semi-transparent) and stroke.
- `segmented-bar` — segment fills.
- `metric-cards` — NOT used (cards are surface-tinted, not palette-tinted).
- `heatmap`, `matrix`, `activity-heatmap` — NOT used (these use the ramp).
- `gauge` — NOT used (single value, fills via accent/warn/danger).

## Sequential / diverging: OKLCH ramps

The `ramp(t, mode)` helper returns a CSS color for a `t` in `[0, 1]`. Two
modes:

```js
function ramp(t, mode) {
  if (mode === 'diverging') {
    // 0 -> danger, 0.5 -> neutral surface, 1 -> success.
    if (t < 0.5) {
      var k0 = (0.5 - t) / 0.5;
      return 'color-mix(in oklch, var(--vc-color-surface) ' +
        ((1 - k0) * 100) + '%, var(--vc-color-danger))';
    }
    var k1 = (t - 0.5) / 0.5;
    return 'color-mix(in oklch, var(--vc-color-surface) ' +
      ((1 - k1) * 100) + '%, var(--vc-color-success))';
  }
  // sequential
  return 'color-mix(in oklch, var(--vc-color-surface) ' +
    ((1 - t) * 100) + '%, var(--vc-color-accent))';
}
```

### Sequential mode

`t=0` returns the surface color (cold end); `t=1` returns the accent
(hot end). Intermediate `t` returns a `color-mix(in oklch, surface, accent)`
at that percentage. The OKLCH color space is PERCEPTUALLY UNIFORM — equal
`t` steps look like equal perceptual steps, unlike RGB where the eye
disproportionately notices mid-tones.

### Diverging mode

`t=0` is danger (red), `t=0.5` is the surface (neutral), `t=1` is success
(green). The midpoint is the surface color, NOT gray — this avoids the
"dead-gray midpoint" problem of naive RGB interpolation where a 50%-mix
of red and green is muddy gray rather than the page's natural background.

### `rampT(value, maxValue, logScale)`

Helper that maps a raw value to a `t` in `[0, 1]`:

```js
function rampT(value, maxValue, logScale) {
  if (!isNum(value) || !isNum(maxValue) || maxValue <= 0) { return 0; }
  if (logScale) {
    return Math.log(1 + value) / Math.log(1 + maxValue);
  }
  return value / maxValue;
}
```

`logScale: true` (a heatmap option) flattens sparse high outliers so the
rest of the grid stays distinguishable. Use it when one or two cells are
10-100× the rest.

### Used by

- `heatmap`, `matrix`, `activity-heatmap` — cell fills.
- `funnel` — stage fills (sequential, top stage = darkest accent, bottom
  fades).

## Accent extraction — `_accentLCH()`

The function that converts the DESIGN.md `--vc-color-accent` token into an
`{L, C, H}` triple the palette can rotate hue against:

```js
function _accentLCH() {
  var raw = readVar('--vc-color-accent') || '#b8861f';
  // Parse hex -> sRGB -> HSL (cheap, good enough as a hue anchor).
  // Map HSL.l + HSL.s to OKLCH-ish L and C anchors:
  //   L = clamp(0.55 + (l - 0.5) * 0.5, 0.45, 0.78)
  //   C = 0.07 + s * 0.10
  return { L: L, C: C, H: hueDegrees };
}
```

The conversion is NOT a perfect color-space transform — it just needs to
derive a hue anchor + a lightness/chroma register. The browser resolves
`oklch(L C H)` at paint time, so the final colors are accurate.

## Why no per-datum colors

The chart module DOES NOT expose a `color` field on a datum or a
`series[i].color` field, and DOES NOT honor a `palette` array passed in
the spec. The reasons:

1. **Single source of truth.** Theme colors live in DESIGN.md. Allowing
   per-spec overrides would scatter color decisions across every fenced
   block.
2. **Light + dark.** A spec with hardcoded `#b8861f` does NOT theme — the
   color shows on the dark theme as a clash. The `--vc-color-accent` token
   has both a light value and a dark value.
3. **Series count agnostic.** The author writes 4 series today; tomorrow
   adds a 5th. A pre-chosen palette has to grow; the golden-angle palette
   just generates one more distinct hue.
4. **Semantic encoding.** Some colors are semantic — diverging-bar uses
   success/danger to encode SIGN; gauge uses warn/danger to encode
   THRESHOLD. These map to `--vc-color-*` tokens, not arbitrary colors.

If you need to override the palette for one chart, edit DESIGN.md (which
will re-theme every chart on the page, intentionally), or post-process the
SVG after `scan()` runs:

```js
amvcpChart.scan(document);
document.querySelectorAll('figure[data-ve-id="ve-chart-3"] .ve-chart-bar')
  .forEach((rect, i) => {
    if (i === 0) rect.style.fill = '#highlight';
  });
```

(But avoid this — it bypasses the contract and breaks theme-hot-swap.)

## Light + dark

The palette anchors are derived from `--vc-color-accent` and a small
heuristic. DESIGN.md must provide BOTH a light value and a dark value:

```yaml
colors:
  light:
    accent: "#b8861f"      # warm gold for light backgrounds
  dark:
    accent: "#d4a649"      # brighter gold for dark backgrounds
```

When the user toggles theme:

- CSS `var(--vc-color-accent)` resolves to the new color at paint time.
- SVG fills using `var(--vc-color-accent)` re-paint with no JS.
- Palette CSS strings using `oklch(L C H)` are NOT auto-updated (they're
  computed from the OLD accent at render time). To re-theme the palette,
  re-run `amvcpChart.scan(document)` — this is what `themechange`
  listeners do (Canvas charts call `__veChartRedraw()`; SVG charts get
  re-rendered).

## Public API

The chart module exposes both helpers globally:

```js
window.amvcpChart.palette(5);
//=> ['oklch(...)', 'oklch(...)', 'oklch(...)', 'oklch(...)', 'oklch(...)']

window.amvcpChart.ramp(0.7, 'sequential');
//=> 'color-mix(in oklch, var(--vc-color-surface) 30.0%, var(--vc-color-accent))'

window.amvcpChart.ramp(0.2, 'diverging');
//=> 'color-mix(in oklch, var(--vc-color-surface) 40.0%, var(--vc-color-danger))'
```

Useful for custom one-off colors in adjacent runtime code (e.g. a
post-render highlight that needs to match the chart's palette).

## See also

- [chart-design-tokens.md](./chart-design-tokens.md) — the full `--vc-*` token table.
- [chart-heatmap.md](../../amvcp-charts-multi-dim/references/chart-heatmap.md) — uses the ramp for cell fills.
- [chart-bar.md](../../amvcp-charts-bar/references/chart-bar.md) — uses the palette for multi-series fills.
