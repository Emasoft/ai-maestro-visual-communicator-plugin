# Z-index semantic scale (DT-14 + DM-07-zindex)

Nine named stacking levels. Eliminates z-index wars — every layer has a
SEMANTIC name and a numeric value derived from a fixed exponential rung,
so engineers reason about stacking via INTENT (a tooltip beats a modal
because tooltips are arming overlays) rather than the cargo-culted
"999999 z-index trap".

## What it does

`amvcpTokens.generateZIndexScale()` returns the canonical map:

```
{
  behind:   -1,
  base:      0,
  raised:   10,
  dropdown: 100,
  sticky:   200,
  overlay:  300,
  modal:    400,
  toast:    500,
  tooltip:  600
}
```

Spacing of 100 between most levels leaves room for one-off in-between
levels (an "above-modal-but-below-toast" loading veil at 450) without
renumbering.

## When to use which level

| Level | Use |
|---|---|
| `behind` (-1) | decorative bg art, watermarks — below the canvas itself |
| `base` (0) | normal document flow — the default |
| `raised` (10) | hover/elevated cards that should win over inline siblings |
| `dropdown` (100) | select menus, autocomplete popups, in-flow menus |
| `sticky` (200) | sticky page header / toolbar / sidebar |
| `overlay` (300) | full-page dim layer behind a modal/sidebar |
| `modal` (400) | modal dialog / drawer surface |
| `toast` (500) | notification toasts (over the modal so a modal error is visible) |
| `tooltip` (600) | hover tooltips & focus arming overlays (always on top so they explain whatever else is up) |

## Scaffold to emit

```yaml
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
```

CSS usage (with safe fallback for pages that omit the group):

```css
.modal     { z-index: var(--vc-z-modal, 400); }
.tooltip   { z-index: var(--vc-z-tooltip, 600); }
.bg-art    { z-index: var(--vc-z-behind, -1); }
```

## Lib functions used

- `amvcpTokens.generateZIndexScale()` → 9-key number map
- engine `applyTokens` mints `--vc-z-behind` … `--vc-z-tooltip`

## DESIGN.md tokens used

- writes: `z-index.{behind, base, raised, dropdown, sticky, overlay,
  modal, toast, tooltip}` (the engine's `z-index` group)
- emits: `--vc-z-<level>` per entry

## Anti-slop interaction

The scale doesn't trigger the slop lint (no colors / fonts), but it
prevents a class of bug that LOOKS like slop: a tooltip rendered
*behind* a modal because some component hardcoded `z-index: 999`.
Sticking to named tokens makes the bug impossible — the convention is
visible in the source.

## Selection / comment / decision-mini contract

The contact sheet's z-index panel renders a stack of 9 overlapping
plates positioned by `var(--vc-z-<key>)`. Each plate is a click-to-copy
button — copying the literal number (e.g. `400`) so the reader can paste
it into an editor / debugger. Hover surfaces the plate to the front via
a small `translateZ` transform (illustrative — z-index doesn't compound
with transforms in 2D, but the visual cue still teaches the order).

The copied-tooltip itself uses `z-index: var(--vc-z-tooltip)` — proof
the system is self-consistent (the meta-affordance for explaining
z-index uses the highest token in the scale, so it always wins).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — screenshot the z-index
panel in **both themes** (R1). Each plate must visibly overlap the one
below it (the `tooltip` plate at the top of the stack, the `behind`
plate at the bottom — partially obscured by `base`). Use
`page.evaluate(() => getComputedStyle(plate).zIndex)` to confirm every
plate carries the right numeric value — a missing `--vc-z-modal`
declaration shows as `auto` instead of `400`, indicating the engine
didn't apply the group (typo in the YAML, or the DESIGN.md omitted the
`z-index` group entirely — both are author errors).
