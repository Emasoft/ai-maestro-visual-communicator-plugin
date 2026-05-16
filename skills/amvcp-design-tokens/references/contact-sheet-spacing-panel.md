# Contact-sheet spacing panel — true-pixel rulers

The `spacing` panel renders one horizontal bar per spacing step at
its TRUE PIXEL WIDTH. Not 50% of the panel, not normalised — the
literal `var(--vc-space-N)` value, so a reader can hold a physical
ruler to the screen and verify the engine emitted the right pixel
count.

## What it does

`buildSpacingPanel(designmd)` in `amvcp-token-sheet.js`:

1. reads `designmd.tokens.spacing.scale` — the array of pixel ints;
2. for each step, emits a `<button data-vc-copy="var(--vc-space-N)">`
   whose width is set via inline `style="width: Npx"` (the literal
   pixel count, NOT `width: var(--vc-space-N)` — the inline width
   guarantees the bar's REAL width matches the SCALE's intent even
   if the CSS variable is overridden);
3. labels each bar with `var(--vc-space-N) — Npx`.

## Why true pixels (not percentages)

A `100%`-width bar tells the reader "this is the largest step in the
scale", which is information they can derive without the panel. A
true-pixel bar tells them "this step is exactly 32px" — which is the
actionable information they need when deciding `padding: var(--vc-space-3)`.

The author can literally measure the on-screen bar with a screen
ruler and verify "16px" is in fact 16 pixels — proof the engine and
the renderer agree about scale units.

## Scaffold to emit

The panel is rendered as part of the full contact sheet (see
`references/contact-sheet-color-panel.md` for the entry point).
Standalone use:

```js
var sheet = amvcpTokenSheet.renderContactSheet(parsed.designmd);
// the spacing panel will be one <section data-vc-panel="spacing">
// inside the sheet.
```

For a custom embed, the spacing panel template:

```html
<section data-vc-panel="spacing" class="vc-sheet-panel">
  <h2>Spacing scale</h2>
  <div class="vc-sheet-spacing-row">
    <!-- One row per step; each row contains a label and a bar. -->
    <div class="vc-sheet-spacing-step">
      <button data-vc-copy="var(--vc-space-0)"
              class="vc-sheet-spacing-bar"
              style="width: 4px"
              aria-label="space-0, 4 pixels"></button>
      <span class="vc-sheet-spacing-meta">
        <code>var(--vc-space-0)</code> — 4px
      </span>
    </div>
    <!-- … repeat for each step in the scale … -->
  </div>
</section>
```

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd)` → includes the
  spacing panel as one section
- (internal) `buildSpacingPanel(designmd)` — not currently exported

## DESIGN.md tokens used

- reads: `spacing.scale: number[]` (the array of pixel ints)
- emits (via the engine): `--vc-space-0` … `--vc-space-N`
- the panel itself uses page-theme tokens for its chrome
  (`--vc-color-content`, `--vc-color-border`, etc.) — so the panel
  re-themes correctly on a hot-swap

## Anti-slop interaction

Spacing values have no color/font, so the slop gate doesn't apply.
The panel reveals a different class of defect: a NON-ASCENDING
spacing scale would render as bars whose widths don't increase
monotonically, which is visible as soon as the panel loads. The
generator (`generatePhiSpacing`) throws fail-fast on a non-ascending
result, so this defect normally can't reach the panel — but a
hand-authored DESIGN.md that ships `spacing.scale: [4, 8, 4, 16]`
WOULD render as a broken-rhythm panel, and the visual is the
diagnostic.

## Selection / comment / decision-mini contract

Each bar is a button; click copies the literal `var(--vc-space-N)`
string (handy for pasting into editor / debugger / Stylus tweaks).
Selection across the bars works normally — the labels are
selectable text.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot the spacing panel in **both
themes** (R1) and verify:

1. each bar's `getBoundingClientRect().width` matches the literal
   pixel value labelled on the bar — within 1px of rounding;
2. the bars are strictly ASCENDING (each bar is wider than the
   previous);
3. clicking any bar fires the copy flash (test with
   `page.click('.vc-sheet-spacing-bar')` and watch for
   `[data-vc-copied]` appearing).

Per the no-nested-scrollbars rule: the panel must NOT introduce its
own horizontal scrollbar even when the widest bar (`var(--vc-space-N)`
for the largest N) exceeds the panel's width — wide bars extend the
document's single scroll axis, never an inner scroller. Verify
with `document.querySelectorAll('[data-vc-panel="spacing"]').forEach(
  p => console.assert(getComputedStyle(p).overflow === 'visible'))`.
