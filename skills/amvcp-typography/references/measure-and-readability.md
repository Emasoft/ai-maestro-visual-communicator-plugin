# Measure — the readability sweet spot of 45–75 characters per line

The single most under-applied typography rule: a body paragraph
should be no wider than ~75 characters and no narrower than ~45
characters per line. Outside that band the reader's eye loses its
return-to-next-line rhythm (too wide) or has to switch lines too
often (too narrow). The typography skill ships a utility class —
`.vc-type-measure` — that pins a paragraph's `max-width` to the
optimal measure.

This is the canonical *micro-typography* hygiene rule. The catalog
mining (see
`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
§3.2 "Two-column responsive panel with max-width:880px collapse")
shows that the Anthropic-Claude reference corpus's body columns sit
in the 60–72 character range, validating the rule empirically across
21 deliverables.

## What it is

The CSS `ch` unit is the width of the "0" character in the current
font — a *character-width* unit. `max-width: 65ch` means "no wider
than 65 characters of the current font". The browser does the math
based on the live `font-family` + `font-size`; the rule stays correct
when the font or size changes.

The `.vc-type-measure` utility:

```css
.vc-type-measure {
  /* 65 chars is the editorial sweet spot — between Robert Bringhurst's
     45-75 char band (The Elements of Typographic Style §2.1.2). */
  max-width: 65ch;
  /* Center the column inside its parent. Margin-auto on a max-width-d
     block centers it; no JS, no flex. */
  margin-left: auto;
  margin-right: auto;
}
```

## Scaffold

Wrap the body text of a section in a `.vc-type-measure` div, OR put
the utility on the section itself:

```html
<!-- Apply to a wrapper -->
<section class="vc-type-measure">
  <p>Body text here, capped at 65 characters per line…</p>
  <p>Next paragraph, same measure…</p>
</section>

<!-- Or to a single paragraph -->
<p class="vc-type-measure">
  This single paragraph is capped at 65 characters per line, and
  centered in its parent column.
</p>
```

Most pages use the section wrapper — every paragraph inside inherits
the measure.

## Tokens consumed / extended

- **Consumes:** nothing — the utility is a pure CSS rule.
- **Extends:** nothing.

The `ch` unit is unit-only; it does not reference any token. The
measure stays correct across DESIGN.md theme swaps automatically,
because the unit is *relative* to the live font.

## The exact numbers — why 65ch

Bringhurst's *Elements of Typographic Style* §2.1.2 specifies:
"Anything from 45 to 75 characters is widely regarded as a
satisfactory length of line for a single-column page set in a
serifed text face in a text size. The 66-character line (counting
both letters and spaces) is widely regarded as ideal."

The catalog's mined value (60–72 chars) brackets 66. The utility
picks 65 as the round-number sweet spot:

- 65 chars at 16 px body = ~520 px column width — fits comfortably
  in a 720 px or wider viewport with margin.
- 65 chars at 18 px body (large reading mode) = ~585 px column —
  still fits a 720 px viewport.
- 65 chars at the smallest readable body (14 px) = ~455 px column —
  fits a phone in landscape; on a phone in portrait the column
  occupies the full viewport width (which is below 65ch — fine,
  measure is a *cap*, not a floor).

## Variations — `.vc-type-measure-narrow`, `.vc-type-measure-wide`

For specific use-cases the utility ships two sibling classes:

```css
.vc-type-measure-narrow {
  max-width: 45ch;
  margin-left: auto;
  margin-right: auto;
}
.vc-type-measure-wide {
  max-width: 80ch;
  margin-left: auto;
  margin-right: auto;
}
```

Use `.vc-type-measure-narrow` (45 ch) for:
- Editorial standfirsts (a lead that wants the magazine-style narrow
  column).
- Slide-deck body text (the slide is small; the column should fit
  comfortably).
- Pull quotes / callouts (visually distinct from surrounding wider
  body).

Use `.vc-type-measure-wide` (80 ch) for:
- Tables of mostly-numeric data where the rows want more horizontal
  room.
- Code blocks (`<pre>`) — but code blocks are NOT prose; the measure
  rule doesn't really apply. Use `.vc-type-measure-wide` only if you
  want the code to be wider than the prose above it.
- Reports where the audience is engineers (slight readability hit
  in exchange for fitting more lines per screen).

For body prose, `.vc-type-measure` (65 ch) is the default.

## Mixing with `text-align: justify`

Measure pairs especially well with `.vc-type-justify`. Justified
text at the optimal measure (65 ch) produces clean inter-word
spacing — wide enough that the justification gaps are small,
narrow enough that the gaps don't yawn.

```html
<section class="vc-type-measure vc-type-justify">
  <p>Justified body prose at the editorial measure…</p>
</section>
```

NEVER apply `.vc-type-justify` to a `.vc-type-measure-wide` (80 ch) —
that's too wide for justification to add value; ragged-right reads
better there.

## Centering vs left-aligned containers

The utility centers the column inside its parent (`margin-left: auto;
margin-right: auto`). This is the editorial convention — body text
sits in a centered column. Some page tones (a left-rail sidebar
layout) want the column **left-aligned** instead:

```css
.vc-type-measure-left {
  max-width: 65ch;
  /* No margin-auto — the column sits flush left. */
}
```

The `.vc-type-measure-left` variant is for *grid-based* layouts where
the column position is set by the grid, not by margin-auto.

## The runtime's body width — current state

The runtime currently caps the prose `<article>` width with a
hard-coded `max-width: 720px` (≈45-48 ch at the default body size).
This is in Bringhurst's band but on the narrow side. Migrating to
`.vc-type-measure` (65 ch) would loosen the prose by ~5-15 ch — a
mild reading improvement but a visible layout change.

The typography skill ships the utility; the runtime migration is a
**separate refactor task**. Do not change `amvcp-runtime.js` from
this skill.

## When NOT to use measure

- **Headings** — headings should fit on 1-2 lines and never wrap to
  the measure. Letting a heading hit the measure cap is wrong; widen
  the heading column or shorten the heading. The hierarchy contract
  (B in `semantic-hierarchy.md`) doesn't apply `.vc-type-measure` to
  headings for this reason.
- **Tables / data grids** — measure is for *prose*. Data wants to fit
  its content, not be capped.
- **Code blocks** — see above; code's width is determined by the
  content.
- **The hero tier** (`.vc-type-hero`) — a hero is a single visual
  element, not paragraphs. Let it be wide.

## When measure conflicts with the grid

A grid layout that sets a column's width *to a specific px value* may
already be enforcing the measure (or its opposite). Putting
`.vc-type-measure` on a child of such a grid is harmless — `max-width`
is a cap, so if the grid column is narrower than 65 ch the cap never
fires; if the grid column is wider, the cap pulls the text in.

If the grid column is much wider than 65 ch (e.g. a 1200 px wide
column) the centered text inside will look like a stranded island in
the middle. In that case either:

- accept the layout decision (the grid is the boss), OR
- swap the wrapping element to use `.vc-type-measure-left` so the
  text sits flush with the grid column's left edge, OR
- re-architect the grid to use a narrower content column.

## Light + dark — orthogonal

`.vc-type-measure` sets only `max-width` and `margin`. No colour, no
font, no theme dependency. Correct in light and dark trivially.

## Selection-contract conformance

A `.vc-type-measure` wrapper is NOT a typography atom — it is a
*container* for atoms. The `markTypographyAtoms` walker stamps the
paragraphs *inside* the wrapper, not the wrapper itself. The
decision-mini-pill anchors to each inner paragraph, not to the
container.

## Verification

The Visual Verification procedure
(`skills/amvcp-self-debug-rules/SKILL.md`) for measure:

1. Render the specimen page.
2. Confirm a body paragraph wraps at ~65 characters per line (count
   one line manually).
3. Resize the viewport from 400 px to 2000 px wide.
4. Confirm: in narrow viewports the column is the full width (under
   the cap); in wide viewports the column stays centered at 65 ch.
5. Repeat with the dark theme.

## Cross-references

- [hyphenation-and-justification.md](./hyphenation-and-justification.md)
  — pairs with `.vc-type-justify` for narrow columns.
- [lead-paragraph.md](./lead-paragraph.md) — leads usually want
  `.vc-type-measure-narrow` to feel like a magazine standfirst.
- [semantic-hierarchy.md](./semantic-hierarchy.md) — the body role
  the measure caps width on.
- `layout` skill — owns the page-grid; measure is the *typography*
  cap on top of the grid's column width.
