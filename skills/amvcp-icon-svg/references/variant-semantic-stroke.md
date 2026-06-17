# The variant ladder — semantic stroke roles

## Table of Contents

- [The 5 variants](#the-5-variants)
- [The exception — external default](#the-exception--external-default)
- [How to use](#how-to-use)
- [Conventional variant choice per node type](#conventional-variant-choice-per-node-type)
- [Fail-fast — unknown variant](#fail-fast--unknown-variant)
- [Why no `accent` variant?](#why-no-accent-variant)
- [Variants vs shapes](#variants-vs-shapes)
- [C4 lint interaction — the semantic-role collapse](#c4-lint-interaction--the-semantic-role-collapse)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Visual verification](#visual-verification)

Every node primitive (`process`, `database`, `decision`, `external`,
`network`) accepts an optional `variant` field. The variant changes
ONLY the stroke color — not the shape, not the fill (except for
`external`, where the default stroke is muted instead of ink). The 5
variants map 1:1 to semantic `--vc-color-*` roles.

## The 5 variants

| `variant` | Stroke token | Universal meaning |
|---|---|---|
| `default` (or omitted) | `--vc-color-content` (ink) | unmarked, neutral |
| `success` | `--vc-color-success` (green) | healthy, complete, "go" |
| `warning` | `--vc-color-warning` (amber) | attention, "review", pending |
| `danger` | `--vc-color-danger` (red) | failure, error, broken |
| `info` | `--vc-color-info` (blue) | informational, read-only |

These are the SAME 4 semantic roles the rest of the visual-
communicator plugin uses for badges, status pills, callout borders,
and chart series — consistency across all visuals.

## The exception — external default

`external` is the ONE node type whose `default` stroke is NOT ink:
it's `--vc-color-content-muted` (a softer ink). The reasoning: an
external thing fades visually relative to in-scope nodes, so the
muted-by-default makes the boundary marker recede.

A `{type: 'external', variant: 'warning'}` STILL overrides the muted
default with the warning stroke — variant always wins.

## How to use

```json
{ "type": "process",
  "id": "build",
  "x": 60, "y": 380, "w": 380, "h": 240,
  "label": "Build",
  "variant": "success" }
```

The output:

```html
<rect ... stroke="var(--vc-color-success, #3a6b5c)" ... />
```

## Conventional variant choice per node type

| Node type | Conventional variant for "happy" path |
|---|---|
| `process` | `default` (neutral); `success` for "completed" |
| `database` | `default` for normal; `info` for read-replicas |
| `decision` | `warning` (asks the reader to choose) |
| `external` | `default` muted; `warning` for "deprecated" |
| `network` | `default`; `info` for cache-only edges |

These are STYLE GUIDELINES, not enforced rules. A `process` with
`variant: "danger"` is perfectly valid (a "failing build" step in a
CI/CD diagram).

## Fail-fast — unknown variant

```js
{ "type": "process", "variant": "primary" }   // throws
{ "type": "process", "variant": "critical" }  // throws
```

The compiler throws on any variant NOT in `['default', 'success',
'warning', 'danger', 'info']`. The error message lists the valid
options. No silent fallback to `default`.

## Why no `accent` variant?

Accent (`--vc-color-accent`) is the brand color — semantically
distinct from status colors. A node with `variant: "accent"` would
read as "this is brand-aligned" rather than "this is status X"; the
runtime keeps the variant family STATUS-ONLY to preserve the meaning.

For an accent-tinted node, use a `logo` primitive (which IS
accent-based by default) or hand-author a wrapping
`<g style="color: var(--vc-color-accent)">` and use the
`current-color` logo block inside.

## Variants vs shapes

Variant changes STROKE COLOR only. To change the SHAPE, switch the
`type`:

- `process` (rounded rect) → `decision` (diamond) is a shape change.
- `process variant: "success"` → `process variant: "danger"` is a
  variant change (same shape, different color).

To change the FILL (most nodes are outline-only — `process`,
`decision`, `external`), there's no variant for fill. Switch to a
`logo` primitive (which IS filled) or hand-author the fill.

## C4 lint interaction — the semantic-role collapse

Per C4 (≤ 4 distinct token colors), the 4 status roles (success,
warning, danger, info) collapse to a SINGLE color key `"semantic"`.
A scene with success + warning + danger + info nodes counts as 1
color in the C4 budget (the 4 semantic colors are "information-
bearing", not "rainbow decoration"). See
`references/lint-c1-to-c7.md`.

This means you can author a 5-node scene with all 5 variants
(default + success + warning + danger + info) and pass C4 — the
default + the semantic-collapsed 4 = 2 distinct colors, well under
the 4-color cap.

## DESIGN.md tokens consumed

- `--vc-color-content` — default ink
- `--vc-color-content-muted` — external default (the exception)
- `--vc-color-success` / `--vc-color-warning` / `--vc-color-danger`
  / `--vc-color-info` — variant strokes

A theme swap re-tints all variants automatically.

## Visual verification

Render a 5-node scene with all 5 variants. In both light AND dark:

- All 5 stroke colors are visible and distinct.
- The variant colors match the universal status-color expectations
  (green = healthy, amber = warning, red = danger, blue = info).
- `external` with `default` variant uses MUTED ink, not primary
  ink.
- `external` with explicit variant uses the variant's role color.

A common visual bug: in a theme with a non-standard `--vc-color-
success` (e.g. a custom palette that uses a different green hue),
the variant stroke is RIGHT but doesn't match the expected color —
this is correct behavior; the theme is in charge. To override, swap
the `--vc-color-success` token locally on the figure wrapper.
