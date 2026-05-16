# Superscript, subscript, footnotes — the secondary-text register

The `<sup>` and `<sub>` elements render text above/below the
baseline at smaller size — used for footnote markers, chemical
formulas, mathematical exponents, ordinal markers, trademark/
copyright marks. The typography skill ships the element-level
defaults plus the `.vc-footnote` and `.vc-footnote-ref` utilities for
the canonical footnote pattern.

## What it is

Three closely-related typographic shapes:

| Element | Renders as | Use |
|---|---|---|
| `<sup>` | Raised, ~70% size | Exponents (x²), ordinals (1st), footnote markers (¹) |
| `<sub>` | Lowered, ~70% size | Chemical formulas (H₂O), mathematical indices (xₙ) |
| `.vc-footnote` | Numbered list at page bottom | Footnote bodies |
| `.vc-footnote-ref` | Superscript number link in body | Footnote markers in text |

The browser's default `<sup>` and `<sub>` are functional but
typographically crude — they break the line metrics (the line height
of the parent grows to accommodate the raised/lowered glyph). The
typography skill's contract fixes this with `vertical-align` +
`line-height: 0` so superscripts don't bloat the surrounding line.

## The contract

```css
sup,
sub {
  font-size: 0.75em;                   /* 75% of parent size */
  /* line-height: 0 prevents the raised/lowered text from inflating
     the parent's line-height. */
  line-height: 0;
  /* Keep the baseline glued to the parent baseline + N% offset. */
  position: relative;
  vertical-align: baseline;
}

sup {
  top: -0.5em;
}

sub {
  bottom: -0.25em;
}

/* Footnote reference — a numbered superscript link. */
.vc-footnote-ref {
  /* Inherits sup's styling. */
  font-size: 0.75em;
  line-height: 0;
  position: relative;
  top: -0.5em;
  vertical-align: baseline;
  /* Themed link colour. */
  color: var(--vc-color-link, var(--vc-color-accent, currentColor));
  text-decoration: none;
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  /* Small padding so the click target meets WCAG 2.5.5 (24x24). */
  padding: 0.2em;
  margin: -0.2em;
}

.vc-footnote-ref:hover,
.vc-footnote-ref:focus-visible {
  text-decoration: underline;
  text-decoration-thickness: 1px;
}

/* Footnote body — the numbered list at the bottom of a section
   or page. */
.vc-footnotes {
  font-size: var(--vc-text-1);         /* smaller than body */
  font-family: var(--vc-font-body, inherit);
  /* Separator above the footnotes. */
  border-top: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  padding-top: 1em;
  margin-top: 2em;
}

.vc-footnotes ol {
  list-style: decimal;
  padding-left: 1.5em;
}

.vc-footnotes li {
  margin-bottom: 0.5em;
  line-height: 1.4;
}

/* Back-reference arrow — from footnote body back to body marker. */
.vc-footnote-backref {
  margin-left: 0.4em;
  font-size: 0.9em;
  text-decoration: none;
  color: var(--vc-color-link, var(--vc-color-accent, currentColor));
}
.vc-footnote-backref:hover,
.vc-footnote-backref:focus-visible {
  text-decoration: underline;
}
```

## Scaffold

### Inline superscript / subscript

```html
<p>The hydrogen ion is H<sup>+</sup>; the water molecule is H<sub>2</sub>O.</p>
<p>The fall in temperature was 5°C, from 30°C to 25°C — a 2x<sup>2</sup>
   relationship with the duration of the cooling.</p>
```

### Footnote markers and bodies

```html
<article>
  <p>The migration ran over a 47-minute window<a href="#fn-1"
     id="ref-1" class="vc-footnote-ref">1</a> and triggered a SEV-2
     incident in EU-WEST<a href="#fn-2" id="ref-2"
     class="vc-footnote-ref">2</a>.</p>

  <aside class="vc-footnotes" id="footnotes">
    <ol>
      <li id="fn-1">
        The cache stampede started at 14:32 UTC and was mitigated at
        15:19 UTC, per the timeline in §3.2.
        <a href="#ref-1" class="vc-footnote-backref"
           aria-label="Back to reference 1">↩</a>
      </li>
      <li id="fn-2">
        The EU-WEST region serves 23 customers; the SEV-2 was
        de-escalated to SEV-3 once the cache primed in 8 minutes.
        <a href="#ref-2" class="vc-footnote-backref"
           aria-label="Back to reference 2">↩</a>
      </li>
    </ol>
  </aside>
</article>
```

The body marker (`<a class="vc-footnote-ref">1</a>`) links to the
footnote body (`<li id="fn-1">`); the footnote body has a back-arrow
that returns to the body marker. The two-way link is the canonical
pattern.

## Tokens consumed / extended

- **Consumes:** `--vc-color-link`, `--vc-color-accent`,
  `--vc-text-1`, `--vc-weight-label`, `--vc-weight-medium`,
  `--vc-font-body`.
- **Extends:** nothing.

## Why `line-height: 0` on `<sup>` / `<sub>`

Without `line-height: 0`, a line containing `<sup>` is taller than a
line without one — the parent's line height grows to accommodate the
raised glyph. This produces VISIBLE line-spacing irregularity in body
prose with footnote markers.

`line-height: 0` on the `<sup>` itself tells the browser "don't
inflate the parent's line height for this element". The parent's
line-height (e.g. `1.55`) drives the line spacing; the superscript
is rendered within that space.

This is the standard editorial typography fix for `<sup>` /
`<sub>` — universal across publishing.

## Why `vertical-align: baseline` + `position: relative` + `top: -0.5em`

The default `vertical-align: super` (for `<sup>`) and
`vertical-align: sub` (for `<sub>`) work, BUT — they use the font's
own super/sub baseline metrics, which vary across fonts (some fonts
raise superscript by 30%, others by 60%).

Explicit positioning via `vertical-align: baseline` + `top: -0.5em`
locks the offset to a known value regardless of font, producing
consistent visual results across the Anthropic-Claude tri-font stack
and every other supported pairing.

The values: `top: -0.5em` for `<sup>` raises the glyph half the
em-square; `bottom: -0.25em` for `<sub>` lowers a quarter (subscripts
need less offset because the natural lowercase x-height already
provides some downward room).

## Why `font-size: 0.75em`

CSS default is `font-size: smaller` (browser picks ~83%). At ~83%, a
superscript reads as "this is just slightly smaller text"; not
visually distinguished as a superscript.

`0.75em` (75%) is the editorial sweet spot — small enough to clearly
read as superscript, large enough to remain legible.

## The footnote back-reference

The back-arrow (`↩`) in the footnote body links to the body marker
that referenced it. This is critical for keyboard navigation — the
reader Tabs to a footnote marker, presses Enter, lands on the
footnote body, reads it, then Tabs to the back-arrow and presses
Enter to return to where they were.

Without the back-arrow, the reader is stranded at the footnote
body — they must scroll back manually. With the back-arrow, the
navigation is two-way and bidirectional.

The agent provides the back-arrow in the markup; the typography
skill ships the styling.

## Click-target sizing

The bare `<sup>` is a small visual element — at body size, it's only
~9 px tall. WCAG 2.5.5 (target size minimum) requires interactive
targets to be at least 24×24 px.

The `.vc-footnote-ref` rule adds `padding: 0.2em; margin: -0.2em`:

- The padding expands the click target.
- The negative margin pulls the visual position back so the layout
  looks unchanged.

The net effect: a small visual superscript with a larger invisible
click target — meeting WCAG without visual change.

## Ordinal markers — `<sup>` vs `font-variant-numeric: ordinal`

For ordinal numbers ("1st", "2nd") there are two options:

| Option | Markup | Result |
|---|---|---|
| `<sup>` | `1<sup>st</sup>` | 1ˢᵗ (raised) |
| `font-variant-numeric: ordinal` | `<span class="vc-ordinals">1st</span>` | Special font glyph if available |

The `font-variant-numeric: ordinal` option (see
[ligatures-and-opentype-features.md](./ligatures-and-opentype-features.md))
is **better** when the font supports it — it uses the font's
designed ordinal glyph (a tighter, optically-corrected form).

When the font doesn't have ordinal glyphs, the `<sup>` form is the
fallback.

## Mathematical notation — `<sup>` vs MathML / KaTeX

For complex mathematical expressions (integrals, sums, fractions),
`<sup>` alone is insufficient. The `amvcp-math-and-latex` skill
owns mathematical rendering via KaTeX / MathJax.

`<sup>` / `<sub>` are correct for *simple* exponents and indices
embedded in prose ("x² + y²", "Eₙ"). For full equations, use
MathML or KaTeX via the math skill.

## Light + dark — fully covered

The contract uses:

- `var(--vc-color-link, var(--vc-color-accent, currentColor))` for
  the footnote-ref colour — themed.
- `color-mix(in srgb, currentColor 20%, transparent)` for the
  separator — themed.
- NO hardcoded `color`.

Theme-correct in both light and dark.

## Selection-contract conformance

The `.vc-footnotes` block is a typography atom — the
`markTypographyAtoms` walker SHOULD stamp it as
`data-ve-type="type-footnotes"` (added to the SHAPE table in the
integration pass).

Individual footnote items (`<li id="fn-N">`) are inline atoms inside
the parent footnotes block; the parent owns the decision-mini-pill.

The footnote MARKERS (`<a class="vc-footnote-ref">`) are inline links
inside body atoms — they are part of the body atom's content.

## When NOT to use footnotes

- A page with **many** sources — use a numbered references list at
  the end, not inline footnotes.
- A page where the footnotes are short asides — consider inline
  parentheticals instead.
- A page rendered to a mobile screen primarily — the
  jump-and-back navigation is cumbersome on touch; use inline
  asides.
- An accessibility-critical page where screen-reader navigation
  matters — footnotes interrupt the reading flow. Consider
  end-of-section asides instead.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen page with `<sup>`, `<sub>`, footnote markers,
   and a footnotes block.
2. Confirm `<sup>` and `<sub>` don't inflate the parent's line
   height (line spacing is identical to non-superscript paragraphs).
3. Click a footnote marker — confirm scroll lands on the footnote
   body.
4. Click the back-arrow in the footnote — confirm scroll returns to
   the body marker.
5. Tab through the page; confirm both directions of navigation work
   via keyboard.
6. Confirm in light + dark themes.

## Cross-references

- [links-and-anchors.md](./links-and-anchors.md) — the link contract
  the footnote-ref consumes.
- [ligatures-and-opentype-features.md](./ligatures-and-opentype-features.md)
  — the ordinal-marker alternative.
- [accessibility-and-screen-reader.md](./accessibility-and-screen-reader.md)
  — WCAG 2.5.5 target-size and back-arrow navigation.
- `amvcp-math-and-latex` skill — owns full mathematical rendering.
