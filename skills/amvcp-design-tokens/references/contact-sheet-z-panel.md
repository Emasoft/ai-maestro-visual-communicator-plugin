# Contact-sheet z-index panel — overlapping plates stack

## Table of Contents

- [What it does](#what-it-does)
- [Why overlap (vs a single-column legend)](#why-overlap-vs-a-single-column-legend)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

The `z-index` panel of the token contact sheet renders nine overlapping
plates positioned by `var(--vc-z-<level>)`. Each plate is a click-to-
copy button that copies the literal z-index number. The teaching
artifact for the 9-level semantic stacking scale.

## What it does

`buildZIndexPanel(designmd)`:

1. reads `designmd.tokens['z-index']` — the 9-key number map
   (`behind, base, raised, dropdown, sticky, overlay, modal, toast,
   tooltip`);
2. renders one plate per level, each at a slightly offset position
   inside a relative container, so they OVERLAP visibly;
3. each plate carries `z-index: var(--vc-z-<level>)` so the
   stacking order is determined by the engine's resolved values.

The visual: a staircase of overlapping cards going up and to the
right, with the `behind` plate at the back-left bottom and the
`tooltip` plate at the front-right top.

## Why overlap (vs a single-column legend)

A single-column legend tells the reader "tooltip = 600, modal =
400". The overlap shows them GEOMETRICALLY which plate wins when
two intersect — the actionable insight ("if I put a tooltip near a
modal, the tooltip will sit on top, because 600 > 400").

## Scaffold to emit

The panel template:

```html
<section data-vc-panel="z-index" class="vc-sheet-panel">
  <h2>Z-index stacking</h2>

  <div class="vc-sheet-zstack">
    <button class="vc-sheet-zplate"
            data-vc-copy="-1"
            style="z-index: var(--vc-z-behind); left: 0px; top: 0px;">
      <span class="vc-sheet-zplate-label">behind <small>-1</small></span>
    </button>
    <button class="vc-sheet-zplate"
            data-vc-copy="0"
            style="z-index: var(--vc-z-base); left: 24px; top: 24px;">
      <span class="vc-sheet-zplate-label">base <small>0</small></span>
    </button>
    <!-- … 7 more, each offset by 24px from the previous … -->
    <button class="vc-sheet-zplate"
            data-vc-copy="600"
            style="z-index: var(--vc-z-tooltip); left: 216px; top: 216px;">
      <span class="vc-sheet-zplate-label">tooltip <small>600</small></span>
    </button>
  </div>
</section>
```

The `.vc-sheet-zstack` container is `position: relative; height: 260px`
— a fixed-size box that contains the absolute-positioned plates.

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd)` → includes the z-
  index panel
- (internal) `buildZIndexPanel(designmd)` — not exported

## DESIGN.md tokens used

- reads: `z-index.{behind, base, raised, dropdown, sticky, overlay,
  modal, toast, tooltip}` (the 9-key number map)
- emits (via the engine): `--vc-z-behind` … `--vc-z-tooltip`
- the copied-tooltip itself uses `z-index: var(--vc-z-tooltip)` —
  proof the system is self-consistent (the affordance for explaining
  z-index uses the highest token in the scale)

## Anti-slop interaction

Z-index values have no colors / fonts, so the slop lint doesn't
apply. The panel doesn't reveal slop directly, but a missing
`z-index` group in a DESIGN.md would render with `auto` z-index on
every plate (so the stack order depends on DOM order, which is
arbitrary), and the visual is the diagnostic.

## Selection / comment / decision-mini contract

Each plate is a button — click copies the LITERAL number (`400`),
not the variable name. That's intentional: a developer typically
wants to paste "400" into an editor / debugger, not "var(--vc-z-
modal)".

Hover surfaces the plate to the front via a small `translateZ`
transform (illustrative — z-index doesn't compound with `translateZ`
without `transform-style: preserve-3d`, but the small lift cue
suggests "this is interactive").

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot the z-index panel in **both
themes** (R1) and verify:

1. all 9 plates are visible (none fully occluded);
2. the stacking order matches the semantic level — `tooltip` is in
   front, `behind` is at the back. Use `page.evaluate` to read each
   plate's `getComputedStyle(plate).zIndex` and assert the numeric
   ordering matches the labelled values;
3. clicking any plate fires the copy flash with the LITERAL number
   (verify via `[data-vc-copied]` content);
4. the copied-tooltip itself sits ABOVE every plate it's near (it
   uses `--vc-z-tooltip = 600`, which is the highest level in the
   scale by design — the panel demonstrates its own implementation).
