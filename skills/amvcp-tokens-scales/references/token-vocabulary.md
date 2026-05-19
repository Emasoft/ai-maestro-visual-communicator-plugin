# Token vocabulary — naming, `@layer` architecture, the minimal contract

## Table of Contents

- [The 5-layer naming mapping](#the-5-layer-naming-mapping)
- [The 3-tier `@layer` architecture](#the-3-tier-layer-architecture)
- [The 23-variable minimal theme contract](#the-23-variable-minimal-theme-contract)
- [Dark text hierarchy (DT-08)](#dark-text-hierarchy-dt-08)
- [Scoped theming (DT-06)](#scoped-theming-dt-06)
- [Tailwind-shaped utility classes (DT-20 / DM-15)](#tailwind-shaped-utility-classes-dt-20--dm-15)

The DESIGN.md engine's `--vc-*` custom properties ARE the canonical
token names. This document maps the 5-layer naming convention onto them,
gives the `@layer` skeleton emitted HTML uses, and documents the derived
token family that `amvcp-tokens.css` adds.

## The 5-layer naming mapping

| Layer | Concept | Engine `--vc-*` realisation |
|---|---|---|
| 1 primitive scale | a raw color ramp | the OKLCH ramp stops (`generateOklchRamp`), emitted as `--vc-ramp-<n>` on the contact sheet only |
| 2 surface | base / raised / overlay / sunken | `--vc-color-canvas` / `surface` / `surface-raised` / `surface-sunken` |
| 3 content | primary / secondary / tertiary | `--vc-color-content` / `content-muted` / `content-subtle` |
| 4 border | default / strong / focus | `--vc-color-border` / `border-strong`; focus ring → `--vc-focus-ring` |
| 5 semantic state | success / warning / error / info | `--vc-color-success` / `warning` / `danger` / `info` (base role) + the derived `--vc-state-*` split |

The engine ships one color per semantic role. The bg/fg/border/icon
split that real UI needs is **derived** in `amvcp-tokens.css` with
`color-mix`, so no engine change is needed:

```css
--vc-state-success-fg:     var(--vc-color-success);
--vc-state-success-bg:     color-mix(in srgb, var(--vc-color-success) 12%, var(--vc-color-surface));
--vc-state-success-border: color-mix(in srgb, var(--vc-color-success) 32%, var(--vc-color-surface));
--vc-state-success-icon:   var(--vc-color-success);
```

The same 4-line block exists for `warning` / `danger` / `info`. Because
each mixes against `--vc-color-surface` — which flips per theme — every
derived var flips automatically. Never a `@media (prefers-color-scheme)`
fork, never a `.dark` override block for a derived token.

## The 3-tier `@layer` architecture

Emitted HTML opens its `<style>` with a layer declaration so component
CSS never out-specifies the token tier:

```css
@layer ve-primitive, ve-semantic, ve-component;
@layer ve-semantic  { :root { /* derived --vc-state-*, focus-ring */ } }
@layer ve-component { /* component classes from amvcp-tokens.css */ }
```

The `--vc-*` primitives themselves are set by the engine's `applyTokens`
on `document.documentElement.style` (inline style) — they sit OUTSIDE
every `@layer` and therefore override everything. That is correct: they
are the primitive tier and must win.

## The 23-variable minimal theme contract

A complete theme needs **at minimum** the 15 `--vc-color-*` roles for
BOTH themes — the engine hard-fails a DESIGN.md missing `colors.dark`.
Everything else has a sane `var(--vc-…, fallback)`:

- 15 color roles: `canvas, surface, surface-raised, surface-sunken,
  content, content-muted, content-subtle, border, border-strong,
  accent, on-accent, success, warning, danger, info`.
- Plus the 9 `--vc-z-*` levels (optional group; emit them in real
  artifacts, or `var(--vc-z-modal, 400)` with a fallback).
- a fixed radius scale + a fixed type scale round out the leanest
  scaffold.

## Dark text hierarchy (DT-08)

`amvcp-tokens.css` derives a 3-tier on-surface text set — useful on any
surface because it mixes `content` against `surface`:

```css
--vc-on-surface-strong: var(--vc-color-content);
--vc-on-surface-medium: color-mix(in srgb, var(--vc-color-content) 72%, var(--vc-color-surface));
--vc-on-surface-subtle: color-mix(in srgb, var(--vc-color-content) 48%, var(--vc-color-surface));
```

## Scoped theming (DT-06)

`applyTokens(map, rootEl)` accepts ANY element as `rootEl` (it defaults
to `document.documentElement`). So per-section theming is already
mechanically possible — no new engine code:

```js
var map = amvcpDesignMd.resolveTokens(otherDesignmd, 'dark');
amvcpDesignMd.applyTokens(map, sectionEl);  // section themes dark
```

The `--vc-*` vars land on that section's inline style; descendants
inherit, the rest of the page does not. `amvcp-tokens.css` ships a
documented `.vc-theme-scope` marker class (just a positioning context).

## Tailwind-shaped utility classes (DT-20 / DM-15)

`amvcp-tokens.css` ships one `.vc-*` utility class per `--vc-*` token —
`.vc-bg-canvas`, `.vc-text-muted`, `.vc-rounded-md`, `.vc-shadow-2`,
`.vc-p-3`, etc. — namespaced `vc-` so they never collide with a host
page's real Tailwind. LLM-emitted HTML can use the familiar shapes and
stay 100% token-driven (zero raw hexes).
