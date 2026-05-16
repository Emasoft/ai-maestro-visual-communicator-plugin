# 15 — Fluid heading sizes (clamp() between min and max)

A heading like `h1 { font-size: clamp(40px, 6vw, 64px) }` produces a
heading that scales smoothly with the viewport: 40px on a phone, 64px
on a desktop, and a smooth gradient in between. No media queries
needed — the browser interpolates. Used universally on hero / cover
headings where a fixed size feels wrong at one viewport extreme.

## What this is

`clamp(MIN, IDEAL, MAX)` is a CSS function that resolves to:
- `MIN` if the IDEAL is below MIN
- `MAX` if the IDEAL is above MAX
- `IDEAL` otherwise

For `clamp(40px, 6vw, 64px)`:
- At 600px viewport: `6vw = 36px → clamp(40, 36, 64) → 40px` (MIN floor)
- At 800px viewport: `6vw = 48px → clamp(40, 48, 64) → 48px` (IDEAL)
- At 1100px viewport: `6vw = 66px → clamp(40, 66, 64) → 64px` (MAX ceiling)
- At 1280px viewport: `6vw = 76.8px → clamp(40, 76.8, 64) → 64px` (MAX)

The result is a heading that grows smoothly from 40px (small phone)
to 64px (desktop) without any media query, and stops growing past
the max so on 4K monitors it doesn't become absurdly large.

## When to use

- The H1 / title of a cover page or hero band — these are visually
  load-bearing and benefit from being large on big screens, small on
  small screens.
- A slide deck title (this is `slide` technique's job, but the
  pattern is the same).
- Any "display" typography where the visual weight should scale with
  context.

When NOT to use:
- Body text. Body should stay at a comfortable reading size (16-18px)
  regardless of viewport — scaling body text breaks the reading
  measure (ref 04) and degrades readability.
- H2/H3/H4 of an article. These are reading-flow headings, not
  display headings; they should use the typography token scale
  (`--vc-font-2xl`, `--vc-font-xl`, etc.) for consistent rhythm.
- Anything inside a measured reading column (`.la-article > h2`) —
  the column width is the visual anchor; the heading should follow
  the same convention.

## Scaffold to emit

```html
<header class="la-hero" data-ghost="REPORT" data-ve-id="hero" data-ve-type="section">
  <div class="la-hero__content">
    <h1 class="la-hero__title">Quarterly review</h1>
    <p class="la-hero__lede">A summary of FY2026 Q1 …</p>
  </div>
</header>
```

```css
.la-hero__title {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-weight: var(--vc-weight-bold, 700);
  /* Fluid sizing — scales from 40px (mobile) to 64px (desktop) */
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1.1;
  margin: 0;
}
.la-hero__lede {
  /* Body — stay at the typography token size, do NOT scale */
  font-size: var(--vc-font-lg, 18px);
  color: var(--vc-color-content-muted);
  margin: 0;
}
```

For a slide deck title:
```css
.slide-title {
  font-size: clamp(48px, 7vw, 96px);
}
```

For an article H1 inside a measured column:
```css
.la-article > h1 {
  /* DO NOT use clamp here — use the typography token scale */
  font-size: var(--vc-font-3xl, 32px);
}
```

## The math behind picking MIN, IDEAL, MAX

A useful starting heuristic:
- **MIN**: the smallest font size that's still legible as a title
  on a small phone. Typically 32-48px for an H1, 24-32px for an H2.
- **MAX**: the largest font size before the heading dominates the
  page. Typically 64-96px for an H1 (rarely larger; readers do not
  benefit from 120px headlines).
- **IDEAL**: usually `5vw` to `8vw`. `6vw` is the canonical middle.
  At 1000px viewport, 6vw = 60px, which falls comfortably between
  most MIN/MAX pairs.

A safer formula (recommended in CSS-Tricks):
```css
font-size: clamp(MIN, calc(MIN + (MAX - MIN) * ((100vw - SMALL_VW) / (LARGE_VW - SMALL_VW))), MAX);
```
where SMALL_VW and LARGE_VW are the viewport widths at which the
font should hit MIN and MAX respectively. This gives more control
than a bare `6vw` IDEAL. For most headings, the simpler `clamp(MIN,
6vw, MAX)` is sufficient.

## Lib functions called

- None. Pure CSS.
- The fluid sizing reflows automatically on browser resize; no JS
  listener needed.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-font-heading` | Georgia, serif | hero / cover heading font |
| `--vc-weight-bold` | 700 | hero / cover heading weight |
| `--vc-color-content` | (theme) | heading colour |
| `--vc-color-content-muted` | (theme) | lede / subtitle colour |

The font SIZE for fluid headings is intentionally NOT a token — the
`clamp(MIN, IDEAL, MAX)` triple is a SHAPE (a sizing curve), not a
value. Tokenising the curve would require a `--vc-font-fluid-*`
group, which the DESIGN.md engine does not currently offer.

## Selection / comment / decision-mini contract notes

A hero title is part of a `.la-hero` section (`data-ve-type="hero"`).
The hero is a selectable atom (see `markLayoutAtoms()` SHAPES list).
The H1 inside is NOT independently selectable (the runtime excludes
headings — `<h1>-<h6>` — from the selection model; see
`amvcp-self-debug-rules` R4).

A reviewer comments on the hero as a whole ("change the title")
or via a snippet-handle text selection on the title text itself
(drag-select the H1 text → snippet bubble appears).

## When the clamp values need adjustment

- A hero on a multi-line title (the title wraps) — reduce MAX or
  reduce IDEAL so the title stays on one line at desktop.
- A cover page with a long subtitle — the title needs more visual
  weight; increase MIN and MAX both.
- An ultra-wide monitor (>2560px) — at this viewport, even
  `6vw = 153px` is hitting the MAX ceiling, which is correct
  behaviour. If you want larger, raise MAX (rarely advisable).

## Visual verification

Run the universal self-debug checklist before claiming a fluid
heading is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For fluid heading correctness specifically:

- Open dev-browser. Measure the heading at three viewports:
  ```js
  const h1 = document.querySelector('h1');
  for (const w of [375, 768, 1280]) {
    // Set viewport via dev-browser API, then:
    console.log(w, 'px →', getComputedStyle(h1).fontSize);
  }
  ```
  Verify the font size grows monotonically with viewport.
- The MIN clamp: at the smallest viewport tested, the size must
  equal the MIN value.
- The MAX clamp: at the largest viewport tested (>1100px),
  the size must equal the MAX value.
- **R1 — Light + dark themes**: switch themes; the heading must
  use the theme-appropriate `--vc-color-content` colour.
- The wrap check: at the smallest viewport, the heading must
  not overflow. If it does, the MIN is too large OR the heading
  text is too long; consider shortening the title or reducing MIN.
- The "looks reasonable" check: open the page at 1280px in
  dev-browser, screenshot it, look at the heading visually — it
  should feel comfortable, not "huge" or "tiny". If it feels
  wrong, adjust MAX (for "too big") or MIN (for "too small").

## The clamp() variants worth knowing

CSS clamp() with a viewport-based IDEAL is the most common, but
several variants serve different purposes:

| Pattern | Use case |
|---|---|
| `clamp(MIN, Nvw, MAX)` | Standard fluid heading (this ref) |
| `clamp(MIN, 100%, MAX)` | Width-constrained element (e.g. a card max-width that fits the parent up to a cap) |
| `clamp(MIN, calc(100vh - 200px), MAX)` | Height-bounded element (rarely used in layout) |
| `clamp(MIN, calc(MIN + var(--scale) * 1px), MAX)` | A scale-controlled value (advanced) |

The third variant ("height-bounded") is occasionally useful for
modal dialogs or popups that should be tall but capped. For
layout use, the viewport-based variant is the standard.

## The "fluid type scale" extension

Some design systems extend fluid sizing to ALL typography (h1,
h2, h3, body, caption) using a single `clamp()` formula
parameterised by the type scale. The layout doesn't ship this —
typography is the typography technique's job.

The reasoning: a fully-fluid type system means EVERY text
element scales with the viewport. Body text at 16px on a phone
becomes 18px on a desktop. While elegant, this disrupts the
reading measure (ref 04) — the column width is `ch`-based, so
larger body text = wider column = potentially uncomfortable
saccade.

The layout's stance: keep BODY at a fixed comfortable size
(16px or 18px); only DISPLAY headings (cover H1, hero H1)
scale fluidly.

## Browser support

`clamp()` is supported in:
- Chrome 79+ (December 2019)
- Edge 79+
- Firefox 75+ (April 2020)
- Safari 13.1+ (March 2020)

By 2026, support is universal. No `@supports` fallback needed.

## Container-query alternative (advanced)

CSS container queries (`@container`) let an element respond to
its CONTAINER's width instead of the viewport's. For headings
inside a container that may itself vary in size (e.g. a hero
inside a sidebar that's wider on some pages than others), a
container-query-based clamp is more robust:

```css
.la-hero {
  container-type: inline-size;
}
.la-hero h1 {
  font-size: clamp(36px, 8cqw, 72px);
  /*                    ^ 8% of CONTAINER width, not viewport */
}
```

The `cqw` unit is "container-query width". A 1000px-wide
container produces `8cqw = 80px` regardless of viewport.

The layout doesn't currently use this — the container queries
add complexity for limited benefit. But it's available for
custom layouts that need it.

## When clamp() is the WRONG choice

- Form input fields (size should be predictable for the user).
- Buttons (hit targets should be predictable).
- Code blocks (line lengths should be predictable for diff
  comparison).
- Anything with a fixed-pixel design intent that should NOT
  scale.

For those, use a fixed token (`var(--vc-font-base)`,
`var(--vc-font-sm)`).
