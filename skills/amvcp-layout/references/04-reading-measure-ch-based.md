# 04 — `ch`-based reading measure (the one non-spacing length)

`--la-measure` and `--la-measure-wide` are the layout technique's only
intentionally non-token lengths used for content sizing. Both are
declared in `ch` units (`68ch` and `92ch`), NOT in `--vc-space-N`
tokens or in pixels. This ref explains why that is the right design
choice, what `ch` resolves to in practice, and how the values were
picked.

## What this is

A "reading measure" is the maximum line-length a single column of
running text can extend to before it becomes uncomfortable to read.
Typography research consistently lands at ~66 characters as the
sweet spot; readability degrades steeply at >85 and at <50. The layout
technique picks `68ch` for the comfortable reading column and `92ch`
for wider-bleed content (a code block or wide table whose lines do
not need the same eye-saccade comfort because they break naturally on
their own structure).

The unit `ch` resolves to "the inline-size of a `0` glyph in the
current font". So `68ch` is "the inline-size of 68 zeroes in the
running font". Since prose averages ~5 chars per word, `68ch` is
roughly "13.6 words wide", which matches the
typographic-research sweet spot.

## The ch / px conversion

At the default `16px` body font, one `ch` is approximately `8.4px` for
a typical proportional sans-serif (font-dependent: it is exactly the
width of "0"). So `68ch ≈ 572px`. At an 18px body (a slightly larger
reading size), `68ch ≈ 643px`. At a 14px body, `68ch ≈ 500px`. The
column rescales with the body font automatically — a DESIGN.md that
declares `typography.body.size: 18px` produces a wider reading column
than one at 14px, with no further code.

For comparison, the `--vc-space-*` ladder is in pixels — a `48px`
column would be `--vc-space-6 * 7.5`, which is absurd. The reading
measure is a typographic quantity, not a spacing one. Hardcoding it
to a fixed pixel value would silently break under a DESIGN.md font
change.

## Scaffold to emit

The reading measure ships at the top of `amvcp-layout.css`:

```css
:root {
  --la-measure:      68ch;    /* reading column ≈720px @16px */
  --la-measure-wide: 92ch;    /* wide-bleed children          */
}
```

A custom reading primitive consumes it:

```html
<article class="vc-prose" data-ve-id="prose" data-ve-type="section">
  <p>The fine grained …</p>
  <p>A measured reading column …</p>
</article>
```

```css
.vc-prose {
  max-inline-size: var(--la-measure);
  margin-inline:   auto;
  padding-inline:  var(--la-gutter);  /* horizontal pad: gutter token */
  padding-block:   var(--la-gap-xl);  /* vertical pad: spacing token */
  row-gap:         var(--la-gap);     /* between paragraphs: base gap */
  display:         grid;
}
```

Note the mix: the column WIDTH uses `--la-measure` (typographic),
but the padding-block, row-gap, and padding-inline all use `--la-*`
spacing tokens. This is the correct split: anything sized to text
content is `ch`-based, anything sized to rhythm is token-based.

## Lib functions called

- None. The reading measure is pure CSS.
- The DESIGN.md engine produces the `--vc-font-*` and `--vc-space-*`
  tokens; the `ch` unit derives from the active font, not from any
  layout-emitted property.

## DESIGN.md tokens used

| Token | Default | Used by |
|---|---|---|
| `--la-measure` | 68ch (≈572px @16px) | `.la-article` centre column, custom prose |
| `--la-measure-wide` | 92ch (≈772px @16px) | `.la-article__wide` figures, wide bleeds |
| `--la-gutter` | `--vc-space-5` (32px) | side padding of prose / article shells |
| `--la-gap-xl` | `--vc-space-7` (64px) | top/bottom padding of prose / article shells |
| `--la-gap` | `--vc-space-3` (16px) | row-gap between paragraphs |

The font scale is the DESIGN.md typography subsystem's job — the
reading measure is `ch`-relative, so a typography hot-swap that
changes `body.size` from `16px` to `18px` widens the column
proportionally with no further code. See `skills/amvcp-typography/`
for the font-scale subsystem.

## Selection / comment / decision-mini contract notes

A prose paragraph inside a measured reading column is a selectable
atom (`<p data-ve-comment-id>` per the universal selection model in
`amvcp-runtime.js`). The reading column itself (the `<article>` or
`.vc-prose` wrapper) is also stamped as a `region` atom by
`markLayoutAtoms()` so the user can comment on the column as a
whole ("widen this column", "split into two columns") in addition
to per-paragraph comments.

The 3-segment decision-mini pill (✘ ﹅ ✔︎) attaches to the column-
level atom for region-wide decisions; the per-paragraph pill is the
runtime's existing one. Both fire through the same `data-ve-id`
mechanism, so a DESIGN.md change that widens the column does not
disrupt existing comment threads.

## Why ch, not px

Five reasons, in order of importance:

1. **Typographic correctness.** A reading measure is "characters
   wide", not "pixels wide". The right unit IS `ch`. A pixel value
   would be wrong under any font change.
2. **DESIGN.md font hot-swap.** A typography preset that bumps body
   size from 16px to 18px should widen the column proportionally —
   `ch` does this automatically; `px` requires a recompute.
3. **Theme-invariant.** `ch` does not change across light / dark
   themes (themes change colours, not fonts), so the reading measure
   stays consistent between modes.
4. **Reader-zoom-respectful.** Browser zoom scales both `ch` and the
   body font together, so the column reflows correctly under user
   zoom. A pixel-based column would distort.
5. **Cross-language correctness.** A CJK page has wider `ch` than a
   Latin page (the "0" glyph is wider in CJK fonts), so the column
   widens automatically for languages where each glyph carries more
   information per stroke. A pixel value would over-constrain CJK.

## Why two measures (`68ch` + `92ch`)?

The 68ch column is for RUNNING TEXT — the eye must saccade across
the line, and ~66 chars is the comfort limit. The 92ch wide measure
is for CONTENT that does not need eye-saccade comfort:

- A figure with a caption (the eye dwells on the figure, not the
  caption text)
- A code block (lines break on their own syntax, not on prose flow)
- A wide table (rows scan vertically, not horizontally)

The wide measure caps these at `92ch` so they do not extend
infinitely past the prose column — a small visual anchor — but does
not force them into the narrower prose measure where they would be
cramped.

## When to override

Override `--la-measure` per-instance only when:
- The page is a marketing landing that intentionally uses a tighter
  measure for a "narrow column lede" effect (40-50ch).
- A multi-column layout (newspaper-style) uses 35-45ch per column.

Never override to widen past 92ch — beyond that, prose readability
collapses regardless of font size.

## Visual verification

Run the universal self-debug checklist before claiming any reading-
column change is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For reading-measure correctness specifically:

- Open dev-browser. Run
  ```js
  const w = document.querySelector('.la-article').getBoundingClientRect().width;
  const bodyFont = parseFloat(getComputedStyle(document.body).fontSize);
  console.log('column px:', w, 'one ch ≈', w / 68, 'body font:', bodyFont);
  ```
  Verify the column width is `≈ 68 * (font-size * 0.5)` for a typical
  proportional font (the 0.5 is approximate — `ch` depends on the
  exact glyph metric).
- Mutate the DESIGN.md `typography.body.size` from `16px` to `18px`
  via the engine hot-swap path. The column MUST widen proportionally
  on the next paint. If it does not, the measure was hardcoded to
  pixels somewhere.
- **R1 — Light + dark themes**: switch themes; column width MUST
  NOT change.
- **R2 — No nested scrollbars**: wide-bleed children
  (`.la-article__wide`, `.la-article__bleed`) widen the DOCUMENT,
  never introduce an inner scrollbar.
- The narrow-viewport check: shrink the browser to 600px wide; the
  column's `min(--la-measure, 100% - 2*--la-gutter)` clamp activates
  and the column shrinks to fit. Verify no horizontal scroll
  appears.

## Font-specific `ch` width

The `ch` unit is "the inline-size of the `0` (zero) glyph in
the current font". Different fonts have different `ch` widths:

| Font | `ch` ratio (relative to font-size) |
|---|---|
| Georgia (serif) | ~0.50 |
| Times New Roman (serif) | ~0.48 |
| Verdana (sans) | ~0.55 |
| Helvetica (sans) | ~0.52 |
| Courier (monospace) | ~0.60 |
| Inter (modern sans) | ~0.50 |
| ui-monospace | ~0.60 |

So `68ch` in Georgia at 16px is `68 * 16 * 0.50 = 544px`. In
Verdana at 16px, `68 * 16 * 0.55 = 598px`. Different fonts
produce different reading-column widths for the same `68ch`.

This is INTENTIONAL — a wider-glyph font like Verdana naturally
needs a slightly wider column for the same character count. The
`ch`-based measure adapts.

## CJK languages and `ch`

For Chinese / Japanese / Korean fonts, the `0` glyph is much
wider (typically full-width, ~1.0 ratio to font-size). So
`68ch` in a CJK font at 16px is `68 * 16 * 1.0 = 1088px` — a
much wider column.

This is also CORRECT — CJK characters carry more information per
glyph than Latin letters, so a wider column is appropriate. The
`ch`-based measure accommodates this without per-language
configuration.
