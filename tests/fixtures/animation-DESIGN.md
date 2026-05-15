---
designmd_version: 1
meta:
  name: "Animation Fixture"
  default_theme: light
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
    warning: "#a8791f"
    danger: "#a84a32"
    info: "#3464a8"
  dark:
    canvas: "#1b1813"
    surface: "#262119"
    surface-raised: "#2f2920"
    surface-sunken: "#15120d"
    content: "#f3ecdd"
    content-muted: "#b5ab93"
    content-subtle: "#857c66"
    border: "#3a3327"
    border-strong: "#564c39"
    accent: "#d8a83f"
    on-accent: "#1b1813"
    success: "#6db89c"
    warning: "#d8a83f"
    danger: "#d8765c"
    info: "#6d9cd8"
typography:
  font-heading: "Playfair Display, Georgia, serif"
  font-body: "Inter, system-ui, sans-serif"
  font-mono: "JetBrains Mono, ui-monospace, monospace"
  scale: [12, 14, 16, 20, 24, 32, 48]
  weight-regular: 400
  weight-medium: 500
  weight-bold: 700
  line-height: 1.55
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
radius:
  none: 0
  sm: 4
  md: 8
  lg: 12
  xl: 16
  full: 9999
motion:
  duration-fast: 120
  duration-slow: 400
  easing-standard: "cubic-bezier(0.2,0,0,1)"
  easing-decel: "cubic-bezier(0,0,0,1)"
---

# Animation Fixture DESIGN.md

A schema-valid DESIGN.md used by `tests/scripts/test-animation.js`.

The frontmatter `motion:` group above uses only keys the shipped
DESIGN.md engine accepts today (`duration-fast`, `duration-slow`,
`easing-standard`, `easing-decel`). The four animation-skill motion
tokens — `--vc-duration-entrance`, `--vc-duration-stagger-step`,
`--vc-easing-spring`, `--vc-motion-scale` — are supplied to the fixture
page directly via an inline `:root` block, so the animation module's
token consumption is exercised end-to-end without depending on the
(separately-built) engine extension. The animation module reads every
token through `var(--vc-…, fallback)`, so it animates correctly either
way.
