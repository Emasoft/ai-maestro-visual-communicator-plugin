# Step strip (shared-border pipeline)

A compact alternative to a full SVG flowchart for **linear
processes** that don't need decision branching. Lifted from
`17-pr-writeup` in the html-effectiveness catalog. The "shared-
border step strip" reads as a connected pipeline without
arrows — first/last cards get rounded outer corners, middle
cards have shared borders, the eye reads them as one unified
flow.

## When to choose this pattern

Use the step strip when:

- You have **3-6 sequential steps**, each described in 1-2
  lines, no decisions, no branches.
- The visual should be **compact** — a row of side-by-side cards
  along the top of a section, not a full diagram canvas.
- The diagram is a **summary** of a process described in detail
  elsewhere (the strip is the index; the prose below is the
  body).

Do NOT use the step strip when:

- The process has decisions or branches (use `process-flow-
  preset.md`).
- Any step needs to point back to a previous step (use a full
  diagram with `route: "loop"`).
- The process has more than 6 steps (the strip becomes a tape;
  switch to `numbered-flow-scroll-reveal.md`).

## Scaffold (HTML + CSS, not the scene-graph)

The step strip is **NOT a scene graph** — it's a layout pattern
built with HTML `<div>` cards plus shared-border CSS. It still
participates in the selection model (each card carries a
`data-ve-id`) but the engine that draws it is the layout
system, not the diagram renderer.

```html
<div class="ve-step-strip" data-ve-block="step-strip">
  <div class="ve-step-strip__cell" data-ve-id="vc-step-1">
    <div class="ve-step-strip__num">01</div>
    <div class="ve-step-strip__title">Branch &amp; review</div>
    <div class="ve-step-strip__detail">PR opened; reviewers tagged.</div>
  </div>
  <div class="ve-step-strip__cell" data-ve-id="vc-step-2">
    <div class="ve-step-strip__num">02</div>
    <div class="ve-step-strip__title">CI gates pass</div>
    <div class="ve-step-strip__detail">Tests + lint + type-check green.</div>
  </div>
  <div class="ve-step-strip__cell" data-ve-id="vc-step-3">
    <div class="ve-step-strip__num">03</div>
    <div class="ve-step-strip__title">Merge to main</div>
    <div class="ve-step-strip__detail">Squash + auto-release on tag push.</div>
  </div>
</div>
```

The CSS is the magic — shared borders between adjacent cells,
asymmetric rounding on the outer cells:

```css
.ve-step-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 0;
  border-radius: var(--vc-radius-md);
  overflow: hidden;
}
.ve-step-strip__cell {
  padding: 16px 20px;
  background: var(--vc-color-surface);
  border: 1px solid var(--vc-color-border);
  border-right: none;
}
.ve-step-strip__cell:last-child {
  border-right: 1px solid var(--vc-color-border);
}
.ve-step-strip__num {
  font: var(--vc-text-0) / 1 var(--vc-font-mono);
  color: var(--vc-color-content-muted);
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.ve-step-strip__title {
  font: var(--vc-weight-medium) var(--vc-text-2) / 1.2 var(--vc-font-body);
  color: var(--vc-color-content);
  margin-bottom: 4px;
}
.ve-step-strip__detail {
  font: var(--vc-text-1) / 1.4 var(--vc-font-body);
  color: var(--vc-color-content-muted);
}
```

The result: a 3-cell strip where:

- The outer container has `border-radius` and `overflow: hidden`
  (so the inner corners clip to the rounded outer).
- Each cell has `border: 1px solid` but `border-right: none`.
- The last cell adds `border-right` back.

Net effect: a visually unified strip with one outer rounded
border and inner 1px separators where cells meet. No arrows
needed — the shared border IS the connection.

## Variant: with arrow chevrons

If the cells need more explicit "this leads to that" framing,
add a chevron arrow at the right edge of each cell except the
last:

```css
.ve-step-strip__cell {
  position: relative;
  padding-right: 28px;
}
.ve-step-strip__cell:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 50%;
  width: 16px;
  height: 16px;
  margin-top: -8px;
  background: var(--vc-color-surface);
  border-top: 1px solid var(--vc-color-border);
  border-right: 1px solid var(--vc-color-border);
  transform: rotate(45deg);
  z-index: 1;
}
```

The pseudo-element draws a small square rotated 45 degrees,
matching the cell background and inheriting the border, so it
reads as a chevron pushing into the next cell.

## Authoring contract

Each cell is `data-ve-id` selectable. `data-ve-data` carries:

```json
{ "kind": "step", "index": 1, "title": "Branch & review",
  "detail": "PR opened; reviewers tagged." }
```

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-surface`, `--vc-color-border`, `--vc-color-content`, `--vc-color-content-muted` |
| typography | `--vc-font-body`, `--vc-font-mono`, `--vc-text-0/1/2`, `--vc-weight-medium` |
| radius | `--vc-radius-md` for outer corners |

The strip re-themes on DESIGN.md swap with zero changes — every
value is a `var(--vc-*)` reference.

## Responsive behavior

At narrow viewports (< 720px), the strip wraps to a vertical
stack. Each cell becomes full width; the shared-border rule
flips:

```css
@media (max-width: 720px) {
  .ve-step-strip { grid-auto-flow: row; }
  .ve-step-strip__cell {
    border: 1px solid var(--vc-color-border);
    border-bottom: none;
  }
  .ve-step-strip__cell:last-child {
    border-bottom: 1px solid var(--vc-color-border);
  }
}
```

The reading direction is preserved (top-to-bottom on mobile,
left-to-right on desktop) without restructuring the HTML.

## Variant: numbered prefix instead of "01 02 03"

For a denser look, drop the numeric prefix and just use the
title:

```html
<div class="ve-step-strip__cell">
  <div class="ve-step-strip__title">Branch &amp; review</div>
</div>
```

Loses some "this is a process" framing; gains compactness.
Useful for inline strips in prose ("the flow is X -> Y -> Z").

## When to upgrade to the full process-flow preset

Upgrade when:

- You need to add a `decision` step (a diamond mid-strip).
- The strip grows past 6 cells (visual density crosses a
  threshold).
- You need edges that aren't strictly sequential (a side-channel
  to an `external` actor).

A step strip and a `process-flow` diagram can coexist on the
same page — the strip is the section header summary, the
process-flow is the detailed diagram below.

## Anti-patterns

- Putting the strip inside an `overflow-x: auto` container: that
  creates a nested scrollbar. The strip should wrap responsively
  (per the media query above), not horizontally scroll.
- 8-step strip squeezed into one row at desktop: cells become
  too narrow to read. Either drop steps or switch to the
  vertical-on-mobile + horizontal-on-desktop variant.
- Detail text that wraps to 4 lines per cell: cells become tall;
  the strip loses its "compact" character. Trim the details to
  fit 1-2 lines.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot at light theme, dark theme, AND at narrow viewport
(720px) to verify the responsive flip works. The
shared-border-effect can break silently if a stylesheet on the
page sets `border: none` on `.ve-step-strip__cell` — check the
computed styles in DevTools if cells look like floating
rectangles.
