# Responsive fluid headings — `clamp()` deep-dive and the slide-deck pattern

The fluid type-scale engine ([type-scale-engine.md](./type-scale-engine.md))
covers the **body** scale. Headings often want a *more aggressive*
fluidity — a slide-deck title at `clamp(40px, 6vw, 64px)` reads
gracefully across a 13-inch laptop, a 30-inch monitor, and a phone.

This reference deep-dives on `clamp()` for headings — the math, the
viewport-curve tuning, and the slide / dashboard / hero patterns.

## What it is

The CSS `clamp(min, preferred, max)` function picks a value in the
range [min, max], with `preferred` driving the value within that
range. The `preferred` is typically a viewport-relative expression
(`Nvw` for viewport width, `Nrem` for root font-size proportional).

For a heading: a value that grows with viewport but never below
`min` (legibility floor) or above `max` (visual cap).

The classic heading-fluid pattern:

```css
.vc-type-hero { font-size: clamp(40px, 6vw, 96px); }
```

At 400px viewport: `6vw = 24px` → falls below `min=40px` → renders
at `40px`.
At 1067px viewport: `6vw = 64px` → in range → renders at `64px`.
At 2000px viewport: `6vw = 120px` → above `max=96px` → renders at
`96px`.

The font-size scales smoothly from 40px to 96px as the viewport
grows from 667px to 1600px.

## The contract

The typography skill ships a heading-fluid contract on the hero
tier (built into the type-scale engine), with additional patterns
for specific deliverable types:

```css
/* Hero — large, page-title. */
.vc-type-hero {
  font-size: clamp(40px, 6vw, 96px);
  line-height: 1.05;
}

/* Slide-deck title — larger range, tuned for 1920×1080 slides. */
.vc-type-slide-title {
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Slide-deck subtitle. */
.vc-type-slide-subtitle {
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

/* Dashboard hero stat (a single big number). */
.vc-type-stat-hero {
  font-size: clamp(48px, 8vw, 120px);
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;   /* dashboard stats are numeric */
  font-weight: var(--vc-weight-display, var(--vc-weight-bold, 700));
}

/* Catalogue h1 (the "Index of artifacts" page heading). */
.vc-type-catalogue-h1 {
  font-size: clamp(38px, 5.4vw, 62px);
  line-height: 1.1;
}
```

## Why each constant — the tuning

### `.vc-type-hero` — `clamp(40px, 6vw, 96px)`

- **min 40px:** the smallest a hero should be — below 40px it's just
  an H1.
- **preferred 6vw:** at 667px (small desktop), `6vw = 40px` — meets
  min. At 1067px (1920×1080's body width), `6vw = 64px` — comfortable
  hero. At 1600px+, `6vw = 96px+` — capped at max.
- **max 96px:** above 96px the hero needs *display-tier optical
  correction* (`-0.04em` tracking, per TY-08) — also baked in.

### `.vc-type-slide-title` — `clamp(40px, 6vw, 64px)`

- **max 64px:** capped LOWER than `.vc-type-hero` because slides
  are bounded vertically — a 96px slide title would overflow the
  top half of a 1080px slide.
- **6vw preferred:** matches hero curve up to the cap.

### `.vc-type-stat-hero` — `clamp(48px, 8vw, 120px)`

- **8vw preferred:** more aggressive than 6vw because dashboard
  stats are the *focal point*; they should DOMINATE the cell.
- **max 120px:** larger than hero because a stat is a *single* number,
  not a sentence — extreme size is editorially correct for a single
  number.
- **tabular-nums:** built in for live-updating dashboards.

### `.vc-type-catalogue-h1` — `clamp(38px, 5.4vw, 62px)`

- **min 38px:** slightly less than hero (the catalogue is structured
  as a list; the h1 is the column header, not the page focus).
- **5.4vw:** a touch less aggressive than 6vw.

These specific tuning values come from the
`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
corpus (the `09-slide-deck.html` uses `clamp(40px, 6vw, 64px)`; the
`index.html` catalogue uses `clamp(38px, 5.4vw, 62px)`).

## Scaffold

### Slide-deck title

```html
<section class="slide">
  <p class="vc-type-overline">Phase 1 · Discovery</p>
  <h1 class="vc-type-slide-title">Identifying the regression</h1>
  <p class="vc-type-slide-subtitle">In a 47-minute window</p>
</section>
```

### Dashboard stat

```html
<div class="stat-card">
  <p class="vc-type-overline">PRs merged this week</p>
  <p class="vc-type-stat-hero">14</p>
  <p class="vc-type-body-sm">+3 vs last week</p>
</div>
```

The "14" renders at clamp(48px, 8vw, 120px) — visually dominant.

### Catalogue page heading

```html
<header>
  <p class="vc-type-overline">Visual Communicator</p>
  <h1 class="vc-type-catalogue-h1">Index of Demos</h1>
</header>
```

## Tokens consumed / extended

- **Consumes:** `--vc-weight-display`, `--vc-weight-bold`.
- **Extends:** nothing.

## The viewport-curve formula

A `clamp(min, preferred, max)` where preferred is `N vw`:

- *Below* viewport `(min/N * 100)` px wide → falls below min → rendered
  at min.
- *Above* viewport `(max/N * 100)` px wide → exceeds max → rendered
  at max.
- *Between* → linearly interpolated by viewport.

For `clamp(40px, 6vw, 96px)`:
- Below 667px viewport: min 40px (40/0.06).
- Above 1600px viewport: max 96px (96/0.06).
- Between: 6% of viewport width.

The *slope* of the interpolation = `1 / N%` per px of viewport. Lower
N = shallower slope (more gradual scaling); higher N = steeper slope
(more dramatic).

## Why pure `vw` and not `rem + vw`

Some references use `clamp(40px, 2rem + 4vw, 96px)` — a *rem-anchored*
preferred. This is the TY-01 canonical body curve (see
[type-scale-engine.md](./type-scale-engine.md)).

For headings, the typography skill uses PURE `vw` (no `rem`) because:
- A hero / slide title is BIG; the user's root font-size adjustment is
  drowned out by the `vw` component anyway.
- Body type ANCHORS at the user's preferred root size (16px default,
  scalable for accessibility); headings tracking viewport is correct
  visual hierarchy.
- Slides are sized in viewport units anyway — a `vw`-only heading
  matches the slide's design grid.

For mixed content (a heading that should also respect user's
root-size preference), use `clamp(40px, 2rem + 4vw, 96px)` — the
TY-01 body curve, adjusted for the heading scale.

## Height breakpoints — compact viewports

For a slide deck or hero header rendered on a SHORT viewport (a
phone in landscape, a laptop with the bottom toolbar showing),
the heading must shrink VERTICALLY:

```css
@media (max-height: 700px) {
  .vc-type-hero { font-size: clamp(32px, 5vw, 56px); }
  .vc-type-slide-title { font-size: clamp(28px, 5vw, 48px); }
}
@media (max-height: 500px) {
  .vc-type-hero { font-size: clamp(24px, 4vw, 40px); }
  .vc-type-slide-title { font-size: clamp(22px, 4vw, 36px); }
}
```

This is the type-scale engine's `--vc-text-hero` shrinking pattern,
duplicated per heading utility. The typography skill ships these
breakpoints in `amvcp-typography.css`.

## Light + dark — orthogonal

`clamp()` is a size function; no colour. Themed correctly.

## The `clamp()` math when `vw` doesn't work — print and PDF

In *print* media (no viewport), `vw` is undefined — the browser
treats `vw` as the page width. For PDFs generated via Puppeteer /
Playwright with a fixed page size, the rendering is predictable.

For maximum cross-format safety, *cap* both ends:
- The `min` ensures readability.
- The `max` ensures no-overflow.

The `vw` between is *responsive on screen* and *predictable in print*.

## Browser support

- `clamp()` — universal (since 2020).
- `min()`, `max()` — universal (since 2020).
- Viewport units (`vw`, `vh`, `vmin`, `vmax`) — universal.
- `dvh`, `dvw` (dynamic viewport, accounting for mobile browser
  toolbars) — universal since 2023.

For mobile-safe heights, prefer `dvh` over `vh`:
```css
.vc-type-slide-title {
  font-size: clamp(40px, min(6vw, 6dvw), 64px);
}
```

`min(6vw, 6dvw)` — picks the smaller, accounting for mobile chrome.

## Selection-contract conformance

A `.vc-type-slide-title` / `.vc-type-stat-hero` is a typography atom
— the `markTypographyAtoms` walker stamps it as
`data-ve-type="type-hero"` (or a specific `type-slide-title` if
extended). The decision-mini-pill anchors per heading.

## When NOT to use fluid headings

- **Print-first deliverables** — use fixed `pt` sizes (see
  [print-and-paged-media.md](./print-and-paged-media.md)) — the
  page is fixed-width, fluid is unnecessary.
- **Email-rendered content** — many email clients don't support
  `clamp()` reliably. Use fixed `px` sizes.
- **Component libraries / design-system pages** — the design system's
  specimen pages should show a SPECIFIC size, not a fluid range.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen with one each: `.vc-type-hero`,
   `.vc-type-slide-title`, `.vc-type-stat-hero`, `.vc-type-catalogue-h1`.
2. Resize viewport from 320px to 2560px — confirm each heading
   scales smoothly, hits min at narrow, hits max at wide.
3. Resize viewport HEIGHT below 500px — confirm hero / slide titles
   shrink to compact-mode sizes.
4. Confirm in both light + dark themes; rendering identical except
   for colour.
5. Print preview — confirm no `vw` collapse (each heading renders
   at its `max` size or page-width-relative).

## Cross-references

- [type-scale-engine.md](./type-scale-engine.md) — the body scale
  this reference's heading scale builds on.
- [semantic-hierarchy.md](./semantic-hierarchy.md) — the role table;
  the hero / slide-title / stat-hero are tier modifiers.
- [tabular-numerics.md](./tabular-numerics.md) — the `.vc-type-stat-hero`
  consumes tabular numerics for live updates.
- `slide` skill — the slide-deck-specific patterns this reference
  feeds.
- `dashboards` skill — the stat-card pattern that uses
  `.vc-type-stat-hero`.
