# Theming presets

## Table of Contents

- [The `--vc-*` namespace](#the---vc--namespace)
- [Tokens the diagram skill reads](#tokens-the-diagram-skill-reads)
- [Two-color derivation](#two-color-derivation)
- [Mermaid theming (the forwarding contract)](#mermaid-theming-the-forwarding-contract)
- [The six named theme presets](#the-six-named-theme-presets)
- [Anti-AI-slop](#anti-ai-slop)

How a diagram is themed off DESIGN.md `--vc-*` tokens, and the six
named theme presets.

## The `--vc-*` namespace

The diagram skill consumes the **DESIGN.md engine** namespace
(`--vc-color-*`, `--vc-font-*`, `--vc-radius-*`, …) shipped by
`amvcp-designmd.js`. Every value is read via `var(--vc-…, fallback)`,
so the module renders correctly even with no DESIGN.md present.

Scene-graph node fills and strokes are emitted as `var(--vc-color-*)`
expressions **directly into the SVG `fill`/`stroke` attributes**. A
theme swap therefore re-themes the whole diagram with zero JavaScript —
the browser re-resolves the `var()` against the new token values.

## Tokens the diagram skill reads

| Group | Tokens | Used for |
|---|---|---|
| color | `--vc-color-{canvas,surface,surface-sunken,content,content-muted,content-subtle,border,border-strong,accent,on-accent,success,warning,danger,info}` | node/edge/group fills + strokes, error box, labels |
| typography | `--vc-font-{body,mono}`, `--vc-text-{0,1,2}`, `--vc-weight-{medium,bold}` | node labels, edge labels, step badges, ASCII `<pre>` |
| radius | `--vc-radius-{sm,md,lg}` | node corner radii, group/error-box corners |
| motion (optional) | `--vc-duration-slow`, `--vc-easing-decel` | flow-animation `dur`, scroll-reveal transition |

Geometry — the 4-unit grid, stroke widths, the process-flow stride —
is structural and is NOT themed; it lives in named module constants.

## Two-color derivation

A single `--vc-color-accent` produces a harmonious secondary via an
oklch `color-mix` toward white:

```
deriveSecondary(accent) -> "color-mix(in oklch, <accent> 70%, white)"
```

The oklch mix keeps the secondary in-gamut and tonally related. It is
used for the Mermaid `secondaryColor` and is exported so a page can
reference it as `--vc-color-accent-2`.

## Mermaid theming (the forwarding contract)

Mermaid does NOT read CSS custom properties — it bakes colors into the
SVG at `init()` time from a `themeVariables` object.
`buildMermaidThemeVariables()` reads the resolved `--vc-*` values off
`:root` and builds that object: `background` <- `--vc-color-canvas`,
`primaryColor` <- `--vc-color-surface`, `lineColor` <-
`--vc-color-border-strong`, `nodeBorder` <- `--vc-color-accent`,
`fontFamily` <- `--vc-font-body`, and so on. Mermaid is initialised
with `theme: 'base'` (the only theme that honours `themeVariables`).

On a DESIGN.md hot-swap the `themeVariables` are rebuilt and Mermaid is
re-run — see flow-animation.md for the hot-swap path the scene graph
uses (`vc:themechange`).

## The six named theme presets

A preset is a **partial DESIGN.md frontmatter** — a `colors.light` +
`colors.dark` block (BOTH themes always; a single-theme preset is a
correctness defect) plus optional overrides. Apply one via
`data-ve-scene-theme="<name>"` on the `.ve-scene-graph` wrapper; the
`--vc-*` overrides are set on the WRAPPER element, never on `:root`, so
multiple diagrams on one page can carry different presets.

| Preset | Character |
|---|---|
| `default` | the page's own DESIGN.md — no override |
| `dark` | near-black canvas, bright accent |
| `blueprint` | cyan-on-navy engineering look; grid background on |
| `terminal` | green/amber-on-black, mono everything |
| `high-contrast` | AAA contrast, flat fills, thicker hairlines |
| `hand-drawn` | sketchy wobble — an SVG `feTurbulence` filter |

`hand-drawn` deliberately rejects the rough.js dependency. It emulates
the sketchy look with an SVG `<filter>` combining `feTurbulence` +
`feDisplacementMap` applied to the diagram's strokes — a dozen lines of
SVG, zero JavaScript, zero new payload. The filter is static, so it
always applies (it is not gated by `prefers-reduced-motion`).

## Anti-AI-slop

The presets avoid the banned purple / violet / indigo family. The
third-party reference templates' hardcoded `#a78bfa` violet and the
rest of their fixed palette are dropped — every color in an emitted
diagram is a `--vc-*` token derived from the host DESIGN.md accent.
