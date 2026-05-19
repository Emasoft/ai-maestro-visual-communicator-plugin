# DESIGN.md tokens read by the chart module

Every fill, stroke, gap, radius, font, duration the chart module renders is
a `--vc-*` CSS custom property read via `var(--vc-…, <fallback>)`. There
are NO hardcoded color literals in the renderer output — only the canonical
fallbacks baked into each `var()` call. A tokenless page still renders
correctly (fallbacks apply); a DESIGN.md-themed page overrides them and
gets full light + dark theming, no re-render needed.

## Table of contents

- [Color tokens](#color-tokens)
- [Type-scale tokens](#type-scale-tokens)
- [Font-family tokens](#font-family-tokens)
- [Weight tokens](#weight-tokens)
- [Spacing tokens](#spacing-tokens)
- [Radius tokens](#radius-tokens)
- [Shadow tokens](#shadow-tokens)
- [Motion tokens](#motion-tokens)
- [Z-index tokens](#z-index-tokens)
- [How DESIGN.md should populate these](#how-designmd-should-populate-these)

---

## Color tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-color-accent` | `#b8861f` | Single-series bar fill, line stroke, donut center text, gauge value arc, lollipop head, dot fill, accent palette anchor, sequential ramp hot end. |
| `--vc-color-on-accent` | `#ffffff` | Comment-handle text, segmented-bar segment label text. |
| `--vc-color-success` | `#3a6b5c` | Diverging-bar positive fill, waterfall rise bar, gauge fill when (none of warn/danger set), metric-card up delta. |
| `--vc-color-danger` | `#a84a32` | Diverging-bar negative fill, waterfall fall bar, gauge fill when `value >= dangerAt`, error banner, metric-card down delta. |
| `--vc-color-warning` | `#a8791f` | Gauge fill when `value >= warnAt`. |
| `--vc-color-surface` | `#ffffff` | Sequential ramp cold end; diverging ramp neutral midpoint; harvey-ball ring fill. |
| `--vc-color-surface-raised` | `#fffdf8` | Metric-card background, tooltip background. |
| `--vc-color-surface-sunken` | `#f1ece0` | Bullet range bg, error-source code bg. |
| `--vc-color-content` | `#1f1a14` | Chart title, value labels, donut center text, mekko x-labels, bullet target tick, matrix cell value. |
| `--vc-color-content-muted` | `#5b5343` | Axis labels, subtitle, funnel drop label, metric-card label, metric-card flat delta. |
| `--vc-color-content-subtle` | `#8a8170` | Source attribution line. |
| `--vc-color-border` | `#e3dcc9` | Gridlines, metric-card border, gauge track, radar grid + spokes, tooltip border, error border. |
| `--vc-color-border-strong` | `#c9bfa3` | Baseline, lollipop stem, waterfall connector, harvey-ball ring stroke. |

The color names follow a 3-tier scheme: SURFACE (background), CONTENT
(text on background), BORDER (lines between surfaces). Each has 2-3
variants (raised/sunken; muted/subtle; strong) for hierarchy.

## Type-scale tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-text-0` | `12px` | Axis labels, value labels, segment labels, metric-card label/unit, legend label, source, tooltip. |
| `--vc-text-1` | `14px` | Subtitle, error banner. |
| `--vc-text-3` | `20px` | Chart title. |
| `--vc-text-4` | `24px` | Donut center text. |
| `--vc-text-5` | `32px` | Metric-card big number. |

The chart module reads only these 5 scale steps; DESIGN.md defines a
fuller scale (0-7) but the chart sticks to a deliberately small subset.

## Font-family tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-font-body` | `system-ui, sans-serif` | Subtitle, axis labels, legend, metric-card unit, segment labels, tooltip body. |
| `--vc-font-heading` | `Georgia, serif` | Chart title, donut center text, metric-card big number. |
| `--vc-font-mono` | `ui-monospace, monospace` | Error-source pre block. |

The body/heading distinction is the chart's main typographic decision —
text inside the chart (axis labels) uses body; text OUTSIDE the chart
(title, big numbers) uses heading.

## Weight tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-weight-medium` | `500` | Value labels, metric-card delta, funnel label. |
| `--vc-weight-bold` | `700` | Chart title, donut center text, metric-card big number, tooltip label, error banner. |

## Spacing tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-space-0` | `4px` | Legend item gap, metric-card value margin. |
| `--vc-space-1` | `8px` | Title margin, source margin, segment label padding, delta badge padding, tooltip padding. |
| `--vc-space-2` | `12px` | Subtitle margin, legend gap, error padding, tooltip padding. |
| `--vc-space-3` | `16px` | Metric-card padding, metric-card grid gap, error padding. |
| `--vc-space-4` | `24px` | Error block margin. |
| `--vc-space-5` | `32px` | Chart figure margin. |

## Radius tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-radius-sm` | `4px` | Bar corner radius, cell corner radius, segment focus outline, tooltip border. |
| `--vc-radius-md` | `8px` | Segmented-bar track corner radius, error block corner. |
| `--vc-radius-lg` | `12px` | Metric-card corner radius. |
| `--vc-radius-full` | `9999px` | Metric-card delta badge (pill shape). |

## Shadow tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-shadow-2` | `0 4px 12px rgba(0,0,0,0.14)` | Tooltip shadow. |

The chart module uses ONE shadow token — the tooltip. Bars / lines / arcs
don't get drop shadows (Tufte rule: no chart-junk).

## Motion tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-duration-fast` | `120ms` | Hover transitions, focus transitions. |
| `--vc-duration-slow` | `600ms` | Bar growUp keyframe, line stroke-dashoffset draw-on. |
| `--vc-easing-decel` | `cubic-bezier(0,0,0,1)` | Decelerating ease used for every entry animation. |

(The RAF-based animations — donut, gauge, radar — use built-in
`1 - (1-t)³` cubic ease-out hardcoded in the JS, not the CSS token. The
CSS-keyframe animations use the token.)

## Z-index tokens

| Token | Canonical fallback | Used for |
|---|---|---|
| `--vc-z-tooltip` | `200` | Tooltip stacking context. |

## How DESIGN.md should populate these

A canonical DESIGN.md block for the chart skill:

```yaml
designmd_version: 1
colors:
  light:
    canvas: "#faf6ee"
    surface: "#ffffff"
    surface-raised: "#fffdf8"
    surface-sunken: "#f1ece0"
    content: "#1f1a14"
    content-muted: "#5b5343"
    content-subtle: "#8a8170"
    border: "#e3dcc9"
    border-strong: "#c9bfa3"
    accent: "#b8861f"
    on-accent: "#ffffff"
    success: "#3a6b5c"
    danger: "#a84a32"
    warning: "#a8791f"
  dark:
    canvas: "#15110b"
    surface: "#1f1a14"
    surface-raised: "#2a241b"
    surface-sunken: "#1a160f"
    content: "#f4eed8"
    content-muted: "#bdb19a"
    content-subtle: "#8a7e68"
    border: "#3a3328"
    border-strong: "#4c4434"
    accent: "#d4a649"
    on-accent: "#1f1a14"
    success: "#7ac5a8"
    danger: "#e9907b"
    warning: "#e0b660"
typography:
  body: "Inter, system-ui, sans-serif"
  heading: "Sentinel, Georgia, serif"
  mono: "JetBrains Mono, ui-monospace, monospace"
  scale:
    text-0: 12px
    text-1: 14px
    text-3: 20px
    text-4: 24px
    text-5: 32px
  weight:
    medium: 500
    bold: 700
spacing:
  scale:
    space-0: 4px
    space-1: 8px
    space-2: 12px
    space-3: 16px
    space-4: 24px
    space-5: 32px
radius:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
motion:
  duration-fast: 120ms
  duration-slow: 600ms
  duration-stagger-step: 60ms
  easing-decel: cubic-bezier(0,0,0,1)
```

The `amvcp-designmd.js` engine reads this YAML and writes the corresponding
`--vc-*` custom properties to `<html>`. On a light/dark toggle, the engine
swaps the color set; SVG charts re-paint automatically; Canvas charts
re-paint via `__veChartRedraw` (called by `scan()` on themechange).

## See also

- [chart-palette-engine.md](./chart-palette-engine.md) — how the palette + ramp helpers derive from these tokens.
- [chart-guardrails.md](./chart-guardrails.md) — Guardrail 8 (theme-driven colors, no hardcoded literals).
- [chart-animations-and-motion.md](./chart-animations-and-motion.md) — motion token usage.
- `scripts/amvcp-designmd.js` — the engine that populates these tokens.
