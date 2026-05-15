---
designmd_version: 1
meta:
  name: "Heritage"
  default_theme: light
colors:
  light:
    canvas:          "#faf6ee"
    surface:         "#ffffff"
    surface-raised:  "#fffdf8"
    surface-sunken:  "#f1ece0"
    content:         "#1f1a14"
    content-muted:   "#5b5343"
    content-subtle:  "#8a8170"
    border:          "#e3dcc9"
    border-strong:   "#c9bfa3"
    accent:          "#b8861f"
    on-accent:       "#ffffff"
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
typography:
  font-heading: "Playfair Display, Georgia, serif"
  font-body:    "Inter, system-ui, sans-serif"
  font-mono:    "JetBrains Mono, ui-monospace, monospace"
  scale:        [12, 14, 16, 20, 24, 32, 48]
  weight-regular: 400
  weight-medium:  500
  weight-bold:    700
  line-height:    1.55
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
radius:
  none: 0
  sm:   4
  md:   8
  lg:   12
  xl:   16
  full: 9999
elevation:
  shadow-sm: "0 1px 2px rgba(0,0,0,0.08)"
  shadow-md: "0 4px 12px rgba(0,0,0,0.12)"
  shadow-lg: "0 12px 32px rgba(0,0,0,0.18)"
motion:
  duration-fast:   120
  duration-normal: 200
  duration-slow:   400
  easing-standard: "cubic-bezier(0.2,0,0,1)"
  easing-accel:    "cubic-bezier(0.3,0,1,1)"
  easing-decel:    "cubic-bezier(0,0,0,1)"
---

# Heritage — visual-communicator design system

This prose body is human-readable documentation. The DESIGN.md engine
does **not** parse anything below the closing `---` fence; only the YAML
frontmatter above is the token source of truth.

## Palette intent

The `light` theme is a warm parchment scheme; the `dark` theme is its
independent night counterpart — neither is derived from the other. Both
themes define the full set of 15 color roles so a hot-swap to either is
total.

## Spacing & rhythm

Spacing and the type scale are strictly-ascending px arrays. Radius runs
from `none` (0) up to `full` (9999, the pill radius).

Token references such as `{colors.light.accent}` resolve at parse time;
this fixture keeps the frontmatter literal so the round-trip test has a
stable byte target.
