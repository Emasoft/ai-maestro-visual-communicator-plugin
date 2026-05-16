# 31 — RTL logical properties (the cross-cutting authoring rule)

Every directional CSS property emitted by the layout technique
MUST use the LOGICAL variant (`margin-inline-start`,
`inset-block-start`, `inline-size`, …) instead of the physical one
(`margin-left`, `top`, `width`). A page with `dir="rtl"` on the
root then mirrors every grid, sidebar, padding, indent, and
header with zero extra CSS — the layout works in RTL languages
(Arabic, Hebrew, Persian, …) for free.

This is a CROSS-CUTTING rule, not a feature. It applies to EVERY
ref in the catalog. A single physical property leaked anywhere
silently breaks RTL.

## What this is

CSS logical properties replace the physical (LTR-specific)
properties with direction-aware equivalents:

| Physical (FORBIDDEN in layout) | Logical (REQUIRED) |
|---|---|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` / `margin-inline` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` / `padding-inline` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `top` / `bottom` | `inset-block-start` / `inset-block-end` |
| `width` / `height` | `inline-size` / `block-size` |
| `min-width` / `min-height` | `min-inline-size` / `min-block-size` |
| `max-width` / `max-height` | `max-inline-size` / `max-block-size` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `float: left` | `float: inline-start` |

Under `dir="ltr"` (default in English), logical and physical
resolve identically:
- `margin-inline-start: 8px` = `margin-left: 8px`
- `inset-block-start: 0` = `top: 0`

Under `dir="rtl"` (Arabic, Hebrew), the inline axis FLIPS:
- `margin-inline-start: 8px` = `margin-RIGHT: 8px` (start = right in RTL)
- `inset-inline-start: 0` = `right: 0`

The block axis (top / bottom, height) does NOT flip in RTL — text
in Arabic / Hebrew still flows top-to-bottom — so
`inset-block-start` always means "top".

## The "documented exception" rule

The layout technique allows EXACTLY ONE physical property:
`transform: translateX(-50%)` for symmetric self-centring (the
device notch in ref 28). Why allowed:
- The notch is symmetric around the device's vertical axis.
- Mirroring it under RTL produces an IDENTICAL result.
- The transform is direction-NEUTRAL — no physical bias.

The `translateX(-50%)` is the canonical centring trick for an
absolutely-positioned element (`inset-inline-start: 50%` +
`translateX(-50%)`).

No other physical property is permitted in any layout CSS.

## How to enforce

The HARD review gate is documented in `references/layout-patterns.md`
("Authoring gate — logical properties only (RTL)"). When reviewing
any layout PR:

1. `grep -E "(margin-left|margin-right|padding-left|padding-right|border-left|border-right|left:|right:|top:|bottom:|width:|height:)" file.css`
2. For every hit, evaluate: is this a physical directional
   property? If yes, replace with the logical equivalent.
3. The only acceptable exception is the `transform: translateX(-50%)`
   self-centring pattern.

This grep is approximate (it catches `width:` which can be
`inline-size:`, but ALSO catches `font-width:` which isn't
directional). False positives are normal; review every hit.

## Why this matters for RTL languages

Arabic, Hebrew, Persian, Urdu speakers expect:
- Text flows right-to-left.
- The "primary" side is the RIGHT (where reading starts).
- A sidebar that's "on the right" in LTR should be "on the LEFT"
  in RTL (since left = "start side" in RTL).
- An icon "at the left of a label" in LTR should be "at the right
  of the label" in RTL.

A layout authored with physical properties (`margin-left`,
`float: left`) keeps the sidebar on the right in RTL — but the
sidebar's CONTENTS read left-to-right, breaking the mental model.
The RTL user sees a broken layout.

A layout authored with logical properties (`margin-inline-start`,
`inset-inline-start`) mirrors EVERYTHING — the sidebar moves to
the left, the icons move to the right of labels, the page reads
as a native RTL document.

## The `text-align: start` nuance

`text-align: left` is correct in LTR for left-aligned text. But
RTL text aligned "to the left" is wrong (RTL text should align to
the right).

`text-align: start` aligns to the start of the reading flow:
- LTR: start = left.
- RTL: start = right.

So `text-align: start` is the correct "left-aligned in LTR,
right-aligned in RTL" choice. Use it instead of `text-align: left`
everywhere.

The exception is when text MUST be aligned to a specific physical
side regardless of direction — e.g. a sortable table column header
that should always be right-aligned for numbers. In that case
`text-align: right` is correct (the number is right-aligned in
both LTR and RTL — numbers are LTR even inside RTL text).

## Scaffold to apply

Every CSS rule in `amvcp-layout.css` already follows this. A
custom layout MUST also follow it:

```css
/* GOOD — works in LTR and RTL */
.vc-my-thing {
  padding-inline: var(--la-gutter);
  padding-block: var(--la-gap);
  margin-inline-start: var(--la-gap);
  border-inline-end: 1px solid var(--vc-color-border);
  inset-block-start: 0;
}

/* BAD — breaks in RTL */
.vc-my-thing {
  padding: 0 var(--la-gutter);
  padding-top: var(--la-gap);
  padding-bottom: var(--la-gap);
  margin-left: var(--la-gap);
  border-right: 1px solid var(--vc-color-border);
  top: 0;
}
```

A custom layout's `<html>` element supports RTL via:
```html
<html lang="ar" dir="rtl">
```

The layout's CSS will mirror automatically.

## Lib functions called

- None. RTL is pure CSS via logical properties.
- The runtime's selection / comment code uses
  `getBoundingClientRect()` which returns viewport coordinates
  (already RTL-aware), so the bubble handles position correctly
  in both directions.

## DESIGN.md tokens used

- All `--vc-space-*` / `--la-*` tokens are direction-neutral
  (they are just lengths). They apply to logical properties
  the same as physical ones.

## Selection / comment / decision-mini contract notes

The selection model is direction-neutral. A selectable atom's
`data-ve-id` doesn't care about direction. The bubble handle's
position is rendered relative to the atom's bounding rect, which
is automatically mirrored in RTL.

A reviewer's comment thread is keyed by `data-ve-id`, not by
visual position — the thread persists across LTR ↔ RTL.

## When a physical property is unavoidable

Extremely rare cases:
- Hardcoding the layout for a specific direction (e.g. a graph
  that must always go left-to-right regardless of page direction).
  In that case use physical properties INSIDE the graph, but
  document why.
- An animation that must always slide from a specific physical
  side (e.g. a notification that always slides in from the right
  edge). Use `transform: translateX(100%)` (physical, but
  intentional).

For everything else, logical is the right answer.

## Visual verification

Run the universal self-debug checklist before claiming the layout
is RTL-correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For RTL correctness specifically:

- Open dev-browser. Set the root direction:
  ```js
  document.documentElement.setAttribute('dir', 'rtl');
  ```
  Take a screenshot. Compare to the LTR screenshot — they should
  be MIRROR IMAGES (sidebar moves from right to left, indents
  move from left to right, etc.).
- Grep the CSS for physical properties:
  ```bash
  grep -nE "(margin-left|margin-right|padding-left|padding-right|border-left|border-right|left:|right:|width:|height:|text-align:\s*(left|right))" amvcp-layout.css
  ```
  Every hit must be evaluated. Acceptable: `transform:
  translateX(-50%)`, `border-radius` properties, `text-align:
  right` on numeric tables. Everything else is a bug.
- The "RTL specific layouts" check: a TOC link with a left-border
  indent should mirror to a right-border indent in RTL. Verify
  this visually.
- **R1 — Light + dark themes**: RTL is independent of theme; both
  themes must work in both directions (4 combinations to verify).
- **R2 — No nested scrollbars**: RTL doesn't introduce overflow;
  if your LTR layout was clean, RTL should be too.
