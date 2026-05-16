# Sub-technique B2 — The opt-in `ve-blueprint` graph-paper theme

The optional `ve-blueprint` class — graph-paper backdrop, gold grid
lines, parchment background. Survives soft-wrap, composes with the
3-state hover/select model, themes off DESIGN.md. From the runtime's
`injectStyles()`.

## B2.1 What it does

Adding `class="ve-blueprint"` to a `.ve-code-block` (or any ancestor)
replaces the default plain-bg `<pre>` interior with a graph-paper
visual: gold grid lines on a parchment background, 24×24px cells.

This is **opt-in**: the default code-block style is a plain border,
inheriting the host page's interior color. Blueprint is for specific
contexts where "this is a design document" or "this is a wireframe-
adjacent surface" warrants extra visual identity.

## B2.2 The CSS

```css
.ve-blueprint.ve-code-block > pre,
.ve-blueprint .ve-code-block > pre {
  background-color: var(--ve-blueprint-bg, #faf6ee);
  background-image:
    linear-gradient(to right,  color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ve-accent, #b8861f) 16%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Two `linear-gradient`s — one drawing 1px vertical lines, one drawing
1px horizontal lines — overlaid via `background-size: 24px 24px`. Each
grid cell is 24px square.

`color-mix(... 16%, transparent)` gives the grid lines a soft accent
tint that reads on the parchment bg without dominating. 16% was tuned
to match the wireframe skill's blueprint look.

## B2.3 Selector specifics

```css
.ve-blueprint.ve-code-block > pre,
.ve-blueprint .ve-code-block > pre {
```

Two selectors:
1. `.ve-blueprint.ve-code-block > pre` — when `ve-blueprint` is on the
   `.ve-code-block` itself.
2. `.ve-blueprint .ve-code-block > pre` — when `ve-blueprint` is on
   ANY ancestor of the `.ve-code-block`.

This lets an author:
- Mark a single block: `<div class="ve-code-block ve-blueprint">`
- Mark all blocks in a section: `<section class="ve-blueprint">`
- Mark all blocks on a page: `<body class="ve-blueprint">`

## B2.4 Light + dark behaviour

The `--ve-blueprint-bg` token defines the parchment color:

| Theme | `--ve-blueprint-bg` default |
|---|---|
| Dark | `#faf6ee` (parchment) — the blueprint surface is INTENTIONALLY a light island on a dark page. Like a paper sketch on a dark desk. |
| Light | `#faf6ee` (parchment) — already matches the light page; the grid lines provide the visual identity. |

The grid line color tracks `--ve-accent` via `color-mix`, so a DESIGN.md
that changes the accent re-tints the grid live.

## B2.5 Composing with the 3-state model

The blueprint visual lives on the `<pre>` interior. The 3-state hover/
select model lives on the `<pre>`'s outline + halo (NOT the bg). The
two compose:

- Normal blueprint block: parchment + grid, 1px brown border.
- Hover-unselected blueprint block: parchment + grid + 2px accent
  outline + 16px halo.
- Selected blueprint block: parchment + grid + 2px solid accent
  outline (no halo).
- Hover-over-selected: parchment + grid + 2px solid outline + 20px
  halo.

The grid is preserved at all four states — the outline/halo float on
top.

## B2.6 The 1.5px backdrop-filter under blueprint

The `<pre>`'s `backdrop-filter: blur(1.5px)` (see
[block-3-state-model.md](./block-3-state-model.md) §B1.4) STILL applies
to a blueprint block — but since the blueprint paints its own bg, the
backdrop-filter has nothing to blur (no body grid to soften). It's a
no-op cost but doesn't harm.

## B2.7 The wrap-marker stripe over blueprint

The per-line wrap-marker stripe is a darker linear-gradient on the
`.ve-code-line` bg. On a blueprint block, the stripe paints OVER the
grid — the grid is visible above the first row, the stripe is visible
on continuation rows. Both work because:

- The grid is on the `<pre>` bg
- The stripe is on the `.ve-code-line` bg (z-stacked above)
- Both are background-image gradients with `repeat: no-repeat` on the
  stripe and `repeat: repeat` (implicit) on the grid

## B2.8 Selection bg tints over blueprint

The per-line `[data-ve-pressed="1"]` selection tint paints an accent
tint over the `.ve-code-line` bg. On a blueprint block, the tint
appears as a row-wide accent stripe overlaying the grid in that row.
Reads as "this row is selected, the rest of the block is still the
blueprint surface".

## B2.9 When to use

| Use blueprint when… | Use the default when… |
|---|---|
| The whole page is a design document (wireframe + tokens + code samples) | The block is in a regular doc / report / explainer |
| The block is a config sample paired with a wireframe visual | The block is the primary content (no surrounding wireframe context) |
| The DESIGN.md uses blueprint elsewhere (a coherent visual identity) | The DESIGN.md is a corporate-theme look that wouldn't pair with parchment |
| The block is illustrative (an example), not literal source | The block IS the source of record |

A page should not mix blueprint and default code-block styles — pick
one per page (or per section) for visual coherence.

## B2.10 The cross-reference to the wireframe skill

The wireframe skill (`amvcp-wireframe`) uses the same blueprint visual
for low-fidelity mocks. The runtime's CSS rule applies to ALL code
blocks under `.ve-blueprint` (or `.ve-blueprint .ve-code-block`), so a
wireframe section that contains a code sample gets the unified look
automatically.

The `--ve-blueprint-bg` token is shared between the two skills — one
DESIGN.md override re-themes blueprint everywhere.

## B2.11 Tokens consumed

- `--ve-blueprint-bg` (default `#faf6ee`) — the parchment background
- `--ve-accent` (default `#b8861f`) — the grid line color (via
  `color-mix(... 16%, transparent)`)

## B2.12 Author rules

| Rule | Why |
|---|---|
| Add `ve-blueprint` to the block or a section ancestor, not body-wide | Body-wide blueprint affects every block — usually too aggressive |
| Don't combine blueprint with an inline `background-color` style | The inline style wins; the grid disappears. Use the class, not inline CSS. |
| Don't add `ve-blueprint` to a wireframe-skill mockup that ALREADY uses the class | Idempotent; the rule just resolves once. But authoring shows redundant intent. |
| Don't author `<pre style="background-image: linear-gradient(...)">` to mimic blueprint | Defeats the runtime's machinery + the theme tokens. Use the class. |
