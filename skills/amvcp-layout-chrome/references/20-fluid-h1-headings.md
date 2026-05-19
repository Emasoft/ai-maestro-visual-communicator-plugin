# 20 — Page H1 fluid sizing (the cover / hero headline)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [The letter-spacing tweak](#the-letter-spacing-tweak)
- [Line-height for display headings](#line-height-for-display-headings)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this clamp on H1](#when-to-use-this-clamp-on-h1)
- [Visual verification](#visual-verification)
- [Picking the IDEAL value (the `Nvw`)](#picking-the-ideal-value-the-nvw)
- [The fully-explicit clamp formula (advanced)](#the-fully-explicit-clamp-formula-advanced)
- [When the H1 is multi-line](#when-the-h1-is-multi-line)
- [The relationship to the cover (ref 27) and hero (ref 29)](#the-relationship-to-the-cover-ref-27-and-hero-ref-29)

A specific application of the fluid heading clamp pattern (ref 15)
to the page-level H1 — the title of the page itself, typically
inside a cover (`.la-cover`) or hero (`.la-hero`) section. The
size range is wider than for in-article headings because the cover
H1 is meant to dominate visually; the clamp typically reaches 64-96px
on desktop and 36-48px on mobile.

## What this is

The page H1 is the FIRST and MOST PROMINENT heading on the page —
typically inside the cover page (ref 27) or the hero band (ref 29).
Unlike an article H2 / H3 (which uses fixed token sizes for
rhythm), the cover H1 should scale fluidly with the viewport to
maintain visual presence across screen sizes.

Recommended values (from the html-effectiveness catalog):

| Use | clamp() values |
|---|---|
| Catalogue / index hero H1 | `clamp(38px, 5.4vw, 62px)` |
| Slide deck title | `clamp(48px, 7vw, 96px)` |
| Cover page H1 | `clamp(40px, 6vw, 64px)` (default) |
| Report cover H1 (longer titles) | `clamp(32px, 5vw, 56px)` |

Notice the MIN values are 32-48px (always large enough to
visually anchor the page on a phone), the MAX values are 56-96px
(never so large they dominate a desktop monitor uncomfortably).
The IDEAL is typically `5vw` to `7vw` (the desktop midpoint).

## Scaffold to emit

A cover page H1:

```html
<section class="la-cover" data-ve-id="cover" data-ve-type="section">
  <h1 class="la-cover__title">Q1 2026 Engineering Review</h1>
  <p class="la-cover__meta">Engineering team · 2026-05-15 · 12 minutes read</p>
</section>
```

```css
.la-cover__title {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-weight: var(--vc-weight-bold, 700);
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1.1;
  margin: 0;
  /* line-height: 1.1 keeps a tight title that doesn't have huge
     gaps between wrapped lines. */
  letter-spacing: -0.02em;
  /* slight tracking negative tightens the look of large display type. */
}
```

A hero band H1 inside `.la-hero` (ref 29):

```html
<section class="la-hero" data-ghost="REPORT" data-ve-id="hero" data-ve-type="section">
  <div class="la-hero__content">
    <h1 class="la-hero__title">Quarterly review</h1>
    <p class="la-hero__lede">A summary of FY2026 Q1 …</p>
  </div>
</section>
```

```css
.la-hero__title {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-weight: var(--vc-weight-bold, 700);
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}
```

A slide deck title is the `slide` technique's job, not layout's;
the pattern is the same with a larger clamp:

```css
.slide-title { font-size: clamp(48px, 7vw, 96px); }
```

## The letter-spacing tweak

Large display type benefits from a slight NEGATIVE letter-spacing
(typically `-0.02em` to `-0.04em`). Letter pairs in a font are
spaced for the typical body-text size; at large display sizes
those spacings feel "open" and the heading reads loose. A small
tracking pull tightens the look.

Do NOT apply negative tracking to body text — at 16px, the same
adjustment makes letters touch and degrades legibility.

The `-0.02em` value is small enough to be subtle but visible. Some
designers prefer `-0.04em` for very large display (`>72px`); both
are acceptable.

## Line-height for display headings

The default body line-height (`1.5` or `1.6`) is too loose for
large display type — wrapped lines feel like separate paragraphs.
Display headings use `line-height: 1.1` to keep wrapped lines
visually together.

## Lib functions called

- None. Pure CSS.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--vc-font-heading` | Georgia, serif | heading family |
| `--vc-weight-bold` | 700 | heading weight |
| `--vc-color-content` | (theme) | heading colour |

Font SIZE is intentionally clamp() literal, not a token, for the
reasons explained in ref 15.

## Selection / comment / decision-mini contract notes

The H1 is INSIDE a parent atom (`.la-cover`, `.la-hero`,
`.la-header`). The parent atom is selectable; the H1 itself is NOT
(headings excluded per R4).

A reviewer comments on the cover ("rename the title", "change the
subtitle") or selects the title text via the snippet handle for
inline-text comments.

## When to use this clamp on H1

- ANY page-level title that needs to scale with the viewport.
- Cover pages, hero bands, slide titles.
- Marketing landing pages.

When NOT to use:
- An article H2 inside a measured column — that should use the
  typography token scale (`--vc-font-3xl`, etc.).
- A button label or any UI control text — controls should be
  predictable; fluid sizing makes hit areas harder to predict.

## Visual verification

Run the universal self-debug checklist before claiming the H1 is
correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For fluid H1 correctness specifically:

- Open dev-browser. Measure the H1 at three viewports:
  ```js
  for (const w of [375, 768, 1280, 1920]) {
    // Set viewport via dev-browser API, then:
    console.log(w, 'px →', getComputedStyle(document.querySelector('h1')).fontSize);
  }
  ```
  Verify the size grows monotonically and clamps at the MIN
  (375px) and MAX (1920px) ends.
- Verify the H1 fits on one line at desktop. If it wraps at 1280px
  for a normal-length title, either the MAX is too large or the
  cover's `padding-inline` is too narrow.
- **R1 — Light + dark themes**: switch themes; the H1 colour
  uses `--vc-color-content`, theme-correct in both.
- The "long title" check: render the cover with a deliberately
  long title (50+ chars); the H1 should wrap gracefully, line-
  height 1.1 keeping wrapped lines tight. If the wrapping is
  too tight (lines touch), bump line-height to 1.2.
- The "tiny phone" check: at 320px viewport, the H1 should be at
  its MIN (e.g. 40px). It should fit at 320px without horizontal
  scroll; if it doesn't, lower MIN or shorten the title.

## Picking the IDEAL value (the `Nvw`)

The IDEAL parameter (`6vw`, `7vw`, etc.) is the slope of the
fluid scaling curve. Higher values produce a steeper scaling
(more growth per viewport pixel); lower values produce a gentler
scaling.

The math: at viewport `W`, the IDEAL value is `Nvw = N * W / 100`.

| `N` | Size at 768px | Size at 1280px | Size at 1920px |
|---|---|---|---|
| 4vw | 30.7px | 51.2px | 76.8px |
| 5vw | 38.4px | 64.0px | 96.0px |
| 6vw | 46.1px | 76.8px | 115.2px |
| 7vw | 53.8px | 89.6px | 134.4px |
| 8vw | 61.4px | 102.4px | 153.6px |

Higher `N` = larger headings on big screens, more dramatic
scaling. Lower `N` = subtler scaling, more conservative
display.

For most cover H1s, `5vw` to `6vw` is the right zone. Go to
`7vw`+ only for very visual marketing pages where the headline
is the page's ENTIRE point.

## The fully-explicit clamp formula (advanced)

The bare `clamp(40px, 6vw, 64px)` produces a clean curve but
the IDEAL grows linearly across the entire viewport range,
which means the curve hits MIN at one specific viewport (where
`6vw = 40px → W = 667px`) and MAX at another (where `6vw =
64px → W = 1067px`). Between those, it's linear.

For fine-tuned control, use the explicit formula:

```css
font-size: clamp(
  40px,
  calc(40px + (64 - 40) * ((100vw - 600px) / (1100 - 600))),
  64px
);
```

This says:
- At 600px viewport, the size is 40px.
- At 1100px viewport, the size is 64px.
- Between 600 and 1100, linearly interpolate.

The visual effect is the same as `clamp(40px, 6vw, 64px)` for
typical viewports, but the breakpoints (600px, 1100px) are
explicit instead of derived.

For most cases, the bare `clamp()` is sufficient. Use the
explicit formula when you need to control the breakpoints
exactly.

## When the H1 is multi-line

A multi-line H1 (a long title that wraps) needs:
- **Tighter line-height** — `1.05` to `1.15`. The default `1.5`
  produces large gaps between wrapped lines.
- **Possibly smaller MAX** — a 96px multi-line H1 is visually
  oppressive. Reduce MAX to 64-72px for any title likely to
  wrap.
- **Consider `text-wrap: balance`** — modern CSS that produces
  visually balanced line breaks (no orphan single-word last
  line). Browser support is good in 2026.

```css
.la-cover__title {
  font-size: clamp(36px, 5vw, 64px);
  line-height: 1.1;
  text-wrap: balance;  /* visually balanced wrapping */
}
```

## The relationship to the cover (ref 27) and hero (ref 29)

The cover H1 typically uses a slightly smaller clamp range
(40-64px) because the cover is a single page that may also
include a meta line and/or subtitle. The hero H1 can go larger
(48-96px) because the hero is shorter and the headline is the
sole focus.

A slide deck title (the slide technique's job) goes largest
(48-96px or more) because slides are presented at very large
sizes — even at projection scale, a 96px H1 reads cleanly.
