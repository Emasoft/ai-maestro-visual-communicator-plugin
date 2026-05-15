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
  font-body:    "system-ui, -apple-system, Segoe UI, sans-serif"
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
  shadow-0: "none"
  shadow-1: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)"
  shadow-2: "0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.12)"
  shadow-3: "0 4px 8px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.14)"
  shadow-4: "0 8px 16px rgba(0,0,0,0.10), 0 16px 40px rgba(0,0,0,0.18)"
  shadow-border: "0 0 0 1px rgba(0,0,0,0.08)"
motion:
  duration-instant:  50
  duration-fast:     100
  duration-quick:    200
  duration-base:     300
  duration-moderate: 400
  duration-slow:     500
  duration-lazy:     700
  duration-glacial:  1000
  easing-standard:         "cubic-bezier(0.2,0,0,1)"
  easing-decel:            "cubic-bezier(0,0,0,1)"
  easing-accel:            "cubic-bezier(0.3,0,1,1)"
  easing-emphasized-decel: "cubic-bezier(0.05,0.7,0.1,1)"
  easing-emphasized-accel: "cubic-bezier(0.3,0,0.8,0.15)"
  easing-spring:           "cubic-bezier(0.175,0.885,0.32,1.275)"
  easing-bounce:           "cubic-bezier(0.34,1.56,0.64,1)"
  easing-linear:           "linear"
z-index:
  behind:   -1
  base:     0
  raised:   10
  dropdown: 100
  sticky:   200
  overlay:  300
  modal:    400
  toast:    500
  tooltip:  600
code:
  keyword:     "#a8791f"
  string:      "#3a6b5c"
  number:      "#a84a32"
  comment:     "#8a8170"
  type:        "#3464a8"
  variable:    "#1f1a14"
  function:    "#7a5c9e"
  constant:    "#b8861f"
  operator:    "#5b5343"
  punctuation: "#8a8170"
  tag:         "#a84a32"
  attribute:   "#3a6b5c"
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
