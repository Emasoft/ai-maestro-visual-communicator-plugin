# 12 — Mobile collapse (the single 768px breakpoint)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [Why a single hardcoded breakpoint instead of a tokenized scale](#why-a-single-hardcoded-breakpoint-instead-of-a-tokenized-scale)
- [When to override](#when-to-override)
- [Visual verification](#visual-verification)
- [The 768px figure in context](#the-768px-figure-in-context)
- [What "mobile collapse" means visually](#what-mobile-collapse-means-visually)
- [The mobile-first vs desktop-first debate](#the-mobile-first-vs-desktop-first-debate)
- [Beyond mobile collapse](#beyond-mobile-collapse)

The layout technique uses exactly ONE mobile-breakpoint value: `768px`.
Below this width, every multi-column grid collapses to a single
column. Above, the grid's normal `template-columns` apply. The
breakpoint is intentionally hardcoded (not a token) because there
is no `--vc-breakpoint-*` group in the DESIGN.md engine — a
breakpoint is not a spacing or colour token, and a multi-breakpoint
system would invite inconsistency.

## What this is

The 768px figure is the legacy "tablet" boundary in the original
Bootstrap mobile-first breakpoint set, and is roughly where iPad
portrait mode and Android tablets start. It is a CONVENTION that
the whole web has converged on — designers consistently target it
as the "things should reflow to a single column below here" boundary.

The layout technique applies the same rule to every multi-column
grid: a single `@media (max-width: 768px)` block per preset that
forces `grid-template-columns: 1fr`.

```css
@media (max-width: 768px) {
  .la-grid--2-1,
  .la-grid--3-1 { grid-template-columns: 1fr; }
}
```

`.la-dashboard` does NOT currently have a mobile-collapse rule
shipped in `amvcp-layout.css` — the 12-column layout reads as
intentionally dense, and at small viewports the user typically zooms
into one card at a time rather than seeing the full overview. If a
mobile-collapse is needed for a custom dashboard, add:

```css
@media (max-width: 768px) {
  .la-dashboard > [data-span] { grid-column: 1 / -1; }
}
```

`.la-ide` does NOT collapse on mobile — a 3-panel IDE on a 375px
phone is not usable; the consuming page should refuse to render
the IDE on mobile and show a "desktop only" message instead.

## Scaffold to emit

The mobile-collapse is automatic when the layout uses `.la-grid--2-1`
or `.la-grid--3-1`. No author action is required.

For custom layouts that include multi-column rules, follow the same
pattern:

```css
.la-my-custom-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--la-gap-lg);
}
@media (max-width: 768px) {
  .la-my-custom-grid {
    grid-template-columns: 1fr;
  }
}
```

The breakpoint value (`768px`) MUST be the same across the entire
layout. Do not introduce a second value (`640px`, `900px`) without
a documented reason.

## Lib functions called

- None. The mobile-collapse is pure CSS media query.
- Browsers fire layout recalc on viewport resize automatically.

## DESIGN.md tokens used

- None directly. The `768px` is a literal value (see "Why not a
  token" below).
- The single-column grid at narrow viewports still consumes
  `--la-gap-lg` for vertical spacing between the now-stacked items.

## Selection / comment / decision-mini contract notes

The selection model is viewport-independent: an atom selectable at
1280px is still selectable at 320px. The bubble handle position
(left edge of the atom) shifts with the layout but the
`data-ve-id` / `data-ve-type` attributes are unchanged.

A comment thread attached to a card persists across the mobile
collapse — the thread is keyed by `data-ve-id`, not by visual
position.

## Why a single hardcoded breakpoint instead of a tokenized scale

Three reasons:

1. **No `--vc-breakpoint-*` group in the engine.** The DESIGN.md
   token groups cover colour, spacing, typography, radius, shadow,
   easing, duration, z-index — not breakpoints. A breakpoint is
   conceptually a CONTENT decision, not a token; what counts as
   "mobile" depends on the content's complexity, not on a global
   design system.

2. **A single breakpoint forces simplicity.** A multi-breakpoint
   system (640 / 768 / 1024 / 1280) tempts authors to invent layout
   variants per breakpoint, producing a layout that looks subtly
   different at every width. The single 768px breakpoint forces:
   "this layout is multi-column above 768px; below, it stacks". The
   resulting layout is consistent and predictable.

3. **The actual breakpoint value is convention, not science.** 768px
   is the legacy Bootstrap boundary; the web has converged on it.
   Picking 720 or 800 or 700 produces almost identical results, but
   diverges from reader expectation.

If a future DESIGN.md schema adds a `breakpoints.scale` array, the
single-value `768px` becomes `var(--vc-breakpoint-mobile)` — but
the SINGLE breakpoint is preserved. The schema would not legitimise
multiple breakpoints; it would just make the one value tokenized.

## When to override

You should rarely override the 768px breakpoint. Acceptable
overrides:
- A dashboard with `data-span="12"` strips needs a mobile-collapse
  rule (the global rule does not cover dashboards). Use the same
  768px value.
- An IDE layout is being adapted for tablet — at 1024px, the
  inspector panel might fold into a tab. Use a SECOND breakpoint
  (1024px) for THIS layout only, and document why.

Unacceptable overrides:
- "The author thinks 720 is better than 768". No — convention
  matters more than the 48px difference.
- "The layout looks bad at 750px so let's collapse earlier". Fix
  the layout to look good at 750px; the breakpoint should not
  reflect content quality issues.

## Visual verification

Run the universal self-debug checklist before claiming a mobile
collapse is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For mobile-collapse correctness specifically:

- Open dev-browser. Set viewport to 1024px and check the grid
  shape:
  ```js
  getComputedStyle(document.querySelector('.la-grid--2-1')).gridTemplateColumns
  ```
  Should resolve to two pixel widths (multi-column).
- Set viewport to 600px. Re-check:
  ```js
  getComputedStyle(document.querySelector('.la-grid--2-1')).gridTemplateColumns
  ```
  Should resolve to one pixel width (single column).
- Verify the collapse happens at exactly 768px:
  ```js
  // At 768px: still multi-column (the @media query is `max-width: 768px`,
  // which fires at 768px and below).
  // At 769px: multi-column.
  // At 768px: single-column.
  ```
- **R2 — No nested scrollbars**: after collapse, the single
  column must not introduce a horizontal scroll on the body.
  If it does, a child has `width: > 100%` somewhere — find and
  fix.
- **R1 — Light + dark themes**: the collapse is theme-invariant;
  flipping the theme must not change the breakpoint behaviour.
- The "in-between" check: scrub the viewport from 1280 → 320 px
  and watch for layout JANK (sudden gaps appearing, sidebar
  disappearing abruptly). A well-designed layout reflows
  smoothly; a sudden, ugly transition usually means a hardcoded
  `width: 600px` somewhere overriding the grid.

## The 768px figure in context

The breakpoint values that have currency in the web ecosystem:

| Value | Source | What it means |
|---|---|---|
| 320px | Original iPhone width | Smallest "modern" viewport |
| 480px | Larger phones | Phone landscape, big phones portrait |
| 600px | Material Design "small" | Phone / phablet |
| 768px | iPad portrait, Bootstrap "md" | THE tablet / mobile boundary (this layout) |
| 992px | Bootstrap "lg" | Small desktop / tablet landscape |
| 1024px | iPad landscape | Tablet landscape boundary |
| 1280px | Standard laptop | Mainstream desktop |
| 1440px | Larger laptop | Wide desktop |
| 1920px | Standard monitor | "Full HD" desktop |

The layout uses 768px because it's the convention everyone
implicitly understands. Going off-convention (e.g. 720px or
800px) introduces unfamiliar reflow points without a clear
benefit.

## What "mobile collapse" means visually

Below 768px, every multi-column layout becomes single-column:
- `.la-grid--2-1` → 1 column (sidebar drops below content)
- `.la-grid--3-1` → 1 column (sidebar drops below content)
- `.la-cardrow` → 1 column (cards stack vertically)
- `.la-kpi-row` → still auto-fit, may produce 1-2 cards/row

The IDE shell (`.la-ide`) does NOT collapse — a 3-panel IDE
on mobile is unusable; the consuming page should refuse to
render the IDE on mobile and show a "desktop only" message.

The dashboard (`.la-dashboard`) does NOT have a built-in
collapse rule shipped in `amvcp-layout.css` — see ref 09 for
the recommended additional rule per dashboard.

## The mobile-first vs desktop-first debate

The layout uses DESKTOP-FIRST media queries (`@media (max-width:
768px)` overrides the desktop layout for mobile). The opposite
is mobile-first (`@media (min-width: 768px)` overrides the
mobile layout for desktop).

Both approaches work; they are equivalent. The layout's
desktop-first choice:
- Most authors think in "desktop layout, then mobile fallback"
  — the desktop-first approach matches that mental model.
- The layout's primary use case is reports (typically read on
  desktop), with mobile as a courtesy adaptation.
- Desktop-first reads naturally: the base CSS is the desktop
  layout; the `@media` block is the mobile override.

If a downstream layout prefers mobile-first, it can author its
custom rules that way — the layout's preset rules are the
default, not a constraint.

## Beyond mobile collapse

For very narrow viewports (<480px), additional considerations:
- **Touch targets:** buttons / links should be ≥44px tall (the
  iOS HIG recommendation for finger taps).
- **Text size:** body should not shrink below 14px.
- **Side gutters:** can shrink to 16px on phone (from the
  default 32px) to maximise content area.

These are TYPOGRAPHY / interactive-control decisions, not
layout decisions. The layout's mobile collapse is just "stack
columns"; the rest is delegated to the relevant techniques.
