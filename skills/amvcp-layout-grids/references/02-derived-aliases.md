# 02 — Derived `--la-*` aliases (semantic naming over indexed tokens)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [Why use an alias layer instead of indexed tokens directly?](#why-use-an-alias-layer-instead-of-indexed-tokens-directly)
- [When to add a new `--la-*` alias](#when-to-add-a-new---la--alias)
- [Visual verification](#visual-verification)
- [Worked example: switching to a denser scale](#worked-example-switching-to-a-denser-scale)
- [When DOES an alias need to be added (not just consumed)?](#when-does-an-alias-need-to-be-added-not-just-consumed)
- [What NOT to alias](#what-not-to-alias)

The DESIGN.md engine emits indexed tokens (`--vc-space-1`,
`--vc-space-2`, …). Those numbers are an implementation detail of the
spacing scale. The layout CSS reads them through a SEMANTIC alias layer
— `--la-gap`, `--la-gap-lg`, `--la-gutter`, `--la-measure` — so a rule
that says "the gap between grid columns is `--la-gap-lg`" is readable
without remembering whether index 4 or 5 corresponds to "large".

## What this is

The derived-token layer (`--la-*`) is a one-line `var()` alias over the
engine `--vc-space-N` slot that the technique semantically maps to it.
Each alias is a thin pointer, never a frozen copy. A DESIGN.md hot-swap
that changes `spacing.scale[4]` from `24px` to `28px` flows through
`--la-gap-lg` to every CSS rule that consumed it, on the next paint,
with zero per-component code.

The alias names are PURPOSE-coded:
- **`--la-gap-xs`** — tight gaps (TOC list, card sub-gap)
- **`--la-gap-sm`** — small gaps (header padding-block, label-to-value)
- **`--la-gap`**    — the base layout gap (the default between blocks)
- **`--la-gap-lg`** — large gaps (grid column gap, between sections)
- **`--la-gap-xl`** — x-large gaps (article padding-block, hero pad)
- **`--la-gutter`** — article / header side padding (one shared horiz. unit)
- **`--la-measure`** — reading-column max width (in `ch`, see ref 04)
- **`--la-measure-wide`** — wide-bleed children max width (in `ch`)

## Scaffold to emit

The block ships at the top of `amvcp-layout.css`. A hand-authored layout
page does NOT re-emit it; loading `amvcp-layout.css` makes every alias
available. A new layout primitive MUST consume the existing aliases
rather than reach into the indexed `--vc-space-N` directly:

```css
/* GOOD — readable, hot-swap-correct */
.la-new-thing {
  gap: var(--la-gap-lg);
  padding-inline: var(--la-gutter);
}

/* BAD — indexes the engine directly, breaks the abstraction */
.la-new-thing {
  gap: var(--vc-space-5);
  padding-inline: var(--vc-space-5);
}
```

Both produce the same pixels today. The GOOD variant survives a
DESIGN.md ladder mutation that renumbers slots; the BAD variant breaks
when the index meaning changes.

## Lib functions called

- None. Pure-CSS alias layer.
- The DESIGN.md engine is the producer; the layout CSS is the
  consumer; nothing else is in the path.

## DESIGN.md tokens used

| Alias | Engine token | Default value | Purpose |
|---|---|---|---|
| `--la-gap-xs` | `--vc-space-1` | 4px | tight gaps |
| `--la-gap-sm` | `--vc-space-2` | 8px | small gaps |
| `--la-gap`    | `--vc-space-3` | 16px | base gap |
| `--la-gap-lg` | `--vc-space-5` | 32px | large gaps |
| `--la-gap-xl` | `--vc-space-7` | 64px | x-large gaps |
| `--la-gutter` | `--vc-space-5` | 32px | article/header side padding |

The `--la-measure`/`--la-measure-wide` aliases are `ch`-based, not
indexed — see ref 04 for the typographic-quantity rationale.

## Selection / comment / decision-mini contract notes

The alias layer emits no selectable atoms. It is consumed by other
primitives (article, grid, header) which DO emit selectable atoms via
`markLayoutAtoms()` — see ref 33 for the selection contract.

A DESIGN.md hot-swap that changes the underlying `--vc-space-*` values
re-flows every primitive consuming the alias, but the selection IDs
(`data-ve-id`) are stable across the swap — comment threads attached
to a card remain attached even after the card's padding doubles.

## Why use an alias layer instead of indexed tokens directly?

Two reasons:

1. **Readability under cognitive load.** A rule `gap: var(--la-gap-lg)`
   is self-documenting; `gap: var(--vc-space-5)` requires the reader
   to know the technique's spacing-scale convention. Across 17,000+ LOC
   of layout CSS, the alias layer saves measurable review time.

2. **Insulation from spacing-scale renumbering.** If a future DESIGN.md
   schema renumbers the ladder (`spacing.scale` becomes
   `[6, 12, 18, 24, …]` instead of `[4, 8, 12, 16, …]`), only the
   `--la-*` alias block needs to be re-pointed — every consuming rule
   stays correct. Without aliases, every consuming rule is a search-
   and-replace candidate.

The aliases are NOT a substitute for the indexed tokens (a parallel
ladder would create two sources of truth). They are a thin
single-line `var()` redirect — the engine remains authoritative.

## When to add a new `--la-*` alias

Add a new alias when a new layout primitive consumes a `--vc-space-N`
for a purpose the current names do not cover. Naming conventions:
purpose first (`--la-section-gap`, not `--la-medium-gap`); never index-
suffix. If the new alias would just be a synonym for an existing one,
use the existing one instead.

## Visual verification

Run the universal self-debug checklist before claiming any layout
change is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For alias-layer correctness specifically:

- Open dev-browser. Run
  `getComputedStyle(document.documentElement).getPropertyValue('--la-gap')`
  on a tuned DESIGN.md page; the resolved px value MUST equal the
  current `spacing.scale[2]`.
- Then mutate `spacing.scale[2]` via JS (the engine's
  `applyDesign()` path) and re-read `--la-gap` — the new value must
  appear within one animation frame. If it does not, the alias was
  copied (frozen) instead of aliased (live).
- **R1 — Light + dark themes**: aliases are spacing, not colour;
  flipping the theme should NOT change any `--la-*` value.
- **R2 — No nested scrollbars**: an alias change must not create an
  overflow scroller in the document; if a grid suddenly grows past
  the viewport, check that `min-width: 0` is preserved on grid
  children (see ref 05, 12).

## Worked example: switching to a denser scale

Suppose a downstream layout wants a denser, tighter rhythm — half
the default spacing across the board. The DESIGN.md hot-swap path
is:

```yaml
# Default scale
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]

# Denser variant
spacing:
  scale: [2, 4, 8, 12, 16, 20, 28, 40]
```

After the swap:
- `--vc-space-1: 4px → 2px`
- `--vc-space-3: 16px → 12px`
- `--vc-space-5: 32px → 20px`
- `--vc-space-7: 64px → 40px`

Every `--la-*` alias re-resolves on the next paint:
- `--la-gap-xs` was 4px, now 2px.
- `--la-gap` was 16px, now 12px.
- `--la-gap-lg` was 32px, now 20px.

And every layout primitive consuming those aliases (the grid gap
in `.la-grid`, the article padding in `.la-article`, the card
internal spacing in `.la-card`) re-flows. ZERO per-component
code changed; the entire layout system breathes inwards.

The reverse is also true: a generous "luxury" preset
(`spacing.scale: [6, 12, 20, 28, 40, 56, 80, 112]`) produces a
spacious layout — all from one ladder change.

This is the single biggest reason for the alias layer: it makes
spacing-scale presets a one-config-file decision instead of a
multi-file refactor.

## When DOES an alias need to be added (not just consumed)?

The 8 default aliases cover ~95% of layout needs. Adding one is
appropriate when:

1. A new layout primitive is being added to `amvcp-layout.css`
   AND its purpose-name doesn't fit any existing alias.
2. A consuming layout primitive is being read 5+ times in the
   stylesheet at the same indexed token — a one-line alias
   improves readability.

Naming conventions for new aliases:
- Purpose-coded, not size-coded: `--la-section-gap`, NOT
  `--la-medium-gap`.
- Prefix with `--la-` (the layout-local namespace; never `--vc-`
  which is the engine's namespace).
- Single-word purpose if possible: `--la-gutter`, not
  `--la-side-padding-of-articles-and-headers`.
- Map to a SINGLE indexed token; don't combine multiple via
  `calc()` (a calc'd alias is no longer a thin pointer).

## What NOT to alias

- **Per-instance layout values.** A specific card's padding is the
  card's CSS, not an alias. `padding: var(--la-gap)` reads
  `var(--la-gap)` directly; introducing a `--la-card-padding` for
  the same value is overhead.
- **Component-internal sizing.** A button's padding is the button
  technique's job, not the layout's. Layout aliases stay at the
  PAGE-STRUCTURE level (gaps between sections, side gutters, etc.)
- **Colours, fonts, radii, shadows.** Those have their own engine
  token namespaces (`--vc-color-*`, `--vc-font-*`, `--vc-radius-*`,
  `--vc-shadow-*`). The layout's job is spacing only.
