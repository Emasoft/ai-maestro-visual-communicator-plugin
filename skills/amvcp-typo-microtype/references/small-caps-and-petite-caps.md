# Small caps and petite caps — the editorial sub-register

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why both `font-variant-caps` AND `font-feature-settings`](#why-both-font-variant-caps-and-font-feature-settings)
- [True vs synthesised small caps](#true-vs-synthesised-small-caps)
- [When to use small caps](#when-to-use-small-caps)
- [When NOT to use small caps](#when-not-to-use-small-caps)
- [Small caps vs `text-transform: uppercase`](#small-caps-vs-text-transform-uppercase)
- [The light + dark coverage](#the-light--dark-coverage)
- [Why `letter-spacing: 0.04em` on `.vc-acronym`](#why-letter-spacing-004em-on-vc-acronym)
- [Comparison with `<abbr title="…">` — semantic abbreviation](#comparison-with-abbr-title--semantic-abbreviation)
- [Selection-contract conformance](#selection-contract-conformance)
- [Browser support](#browser-support)
- [Verification](#verification)
- [Cross-references](#cross-references)

Small caps are *uppercase letterforms at lowercase height* — they
read as "uppercase but quieter". Used for acronyms in body prose
("the API"), for transitional headers ("In conclusion"), and for the
opening few words of a section after a drop cap. Petite caps are
*even smaller* uppercase letterforms, used for the most subtle
emphasis case.

The typography skill ships the `.vc-smallcaps`, `.vc-petitecaps`,
and `.vc-acronym` utility classes for this register, all driven by
the OpenType `smcp` and `pcap` features (or the `font-variant-caps`
property).

## What it is

OpenType fonts can ship *true small caps* — designed letterforms
that match the cap-height of lowercase. These are NOT just shrunken
uppercase glyphs — true small caps have proportions tuned for the
small-cap size (heavier stroke weight, wider proportions).

| CSS | Renders as | Notes |
|---|---|---|
| `font-variant-caps: small-caps` | True small caps if the font has them; else synthesised | Universal browser support. |
| `font-variant-caps: all-small-caps` | Both uppercase AND lowercase as small caps | Useful for acronyms in mixed-case prose. |
| `font-variant-caps: petite-caps` | Even smaller than small caps | True petite caps from font, else synthesised. |
| `font-variant-caps: titling-caps` | Uppercase tuned for all-caps headings | Subtle — only some fonts have. |
| `font-variant-caps: unicase` | Mix of cases (smcp + lowercase, or pcap + uppercase) | Niche. |

The typography skill exposes the most useful variants as utility
classes. Synthesis (browser-faked small caps from regular uppercase)
is fail-soft — fonts without true small caps still render *something*,
just slightly less polished.

## The contract

```css
/* True small caps if available; synthesise if not. */
.vc-smallcaps {
  font-variant-caps: small-caps;
  font-feature-settings: "smcp" 1;     /* belt-and-braces — older browsers */
}

/* For acronyms in body prose — applies to both upper and lower case
   so the acronym "URL" renders all-small-caps without manually
   downcasing. */
.vc-acronym {
  font-variant-caps: all-small-caps;
  font-feature-settings: "smcp" 1, "c2sc" 1;   /* c2sc = capitals-to-small-caps */
  /* Slight tracking — small caps read better with a touch of
     letter-spacing. */
  letter-spacing: 0.04em;
}

/* Even smaller — for the most subtle case. */
.vc-petitecaps {
  font-variant-caps: petite-caps;
  font-feature-settings: "pcap" 1;
}
```

## Scaffold

### Acronym in body prose

```html
<p>The <span class="vc-acronym">API</span> returns JSON for all
   <span class="vc-acronym">HTTP</span> status codes between 200 and
   299.</p>
```

The acronym renders at small-cap size — visually integrated with the
surrounding body prose without the "shouting" effect of full caps.
This is THE canonical use of small caps in modern web typography.

### Section transition

```html
<p>In conclusion, the migration succeeded.</p>

<p><span class="vc-smallcaps">In conclusion,</span> the migration
   succeeded.</p>
```

Two renderings of the same text. The second (with `.vc-smallcaps`)
reads as a subtle transition signal — the opening phrase visually
shifts register before the substance.

### After a drop cap

```html
<p class="vc-drop-cap">
  <span class="vc-smallcaps">In the beginning,</span> the rollout
  was scheduled for 2026-04-12 at 14:32 UTC …
</p>
```

The first few words after a drop cap traditionally render in small
caps — the editorial convention reinforces "this is the opening".
The drop cap takes the first letter; the small caps take the next
few words; ordinary body resumes after.

## Tokens consumed / extended

- **Consumes:** nothing (the OpenType features are font-internal).
- **Extends:** nothing.

The utilities have no token dependency — small caps are a *font
feature*, not a theme variable.

## Why both `font-variant-caps` AND `font-feature-settings`

The two properties overlap — `font-variant-caps: small-caps` is the
higher-level property; `font-feature-settings: "smcp" 1` is the
lower-level OpenType-feature trigger.

The typography skill ships BOTH:

- `font-variant-caps` works in all modern browsers (universal since
  ~2019).
- `font-feature-settings` works in older browsers that pre-date
  `font-variant-caps`.

Setting both is harmless on modern browsers (the values agree); it
adds compatibility for older browsers that the runtime supports.

## True vs synthesised small caps

If the font has true small caps, the browser uses them.

If the font does NOT have small caps, the browser **synthesises**
them by:

- Scaling regular uppercase glyphs to ~75% of the cap height.
- Slightly increasing the stroke weight to compensate for visual
  thinning at the smaller size.

Synthesised small caps look "close enough" — most readers don't
notice. True small caps look better.

Fonts known to ship true small caps:

- **System / OS fonts:** macOS New York, San Francisco; Windows Cambria,
  Constantia; iOS New York.
- **Google Fonts:** IBM Plex Serif, IBM Plex Sans, Fraunces, Crimson
  Pro, Source Sans 3 (subset).

Fonts that lack small caps (browser synthesises):

- Inter, Roboto, Open Sans (also banned per DT-09 anyway).
- System sans-serifs on Linux distros.

## When to use small caps

- **Acronyms in body prose** — the canonical use. `<span
  class="vc-acronym">API</span>` instead of plain "API" or `<abbr>`.
- **Transitional phrases** — "Likewise," "In conclusion,"
  "Subsequently," at the start of a sentence.
- **Stylistic title styling** — book chapter titles in editorial
  prose, where full uppercase would be too shouty.
- **Names in legal-style prose** — "WHEREAS, the parties agree …"
  (legal-document convention).
- **The opening words after a drop cap** — editorial convention.

## When NOT to use small caps

- **Body prose, just for emphasis** — use `<em>` or `<strong>`. Small
  caps are not an emphasis mechanism; they're a register shift.
- **Headings** — headings already have their own size and weight; small
  caps add visual noise.
- **The eyebrow / overline** — eyebrows are ALREADY all-uppercase via
  `text-transform: uppercase`. Adding small caps creates "small caps
  of an already uppercase glyph" — visually confused.
- **For long runs of text** — small caps are readable in short runs
  (1-10 words) but tire the eye over longer runs. They are a
  *seasoning*, not a *register*.

## Small caps vs `text-transform: uppercase`

| Property | Effect | When |
|---|---|---|
| `text-transform: uppercase` | All letters render at FULL cap height | The `.vc-type-overline` eyebrow — when the text MUST stand out. |
| `font-variant-caps: small-caps` | Lowercase letters render at small-cap height; uppercase stays at full cap | A body-prose acronym — when the text SHOULD blend visually. |
| `font-variant-caps: all-small-caps` | Both upper and lower render at small-cap height | An acronym you don't want to manually lowercase. |

The eyebrow uses `text-transform`; the body acronym uses `font-variant-caps`.
They are two different visual decisions.

## The light + dark coverage

Small caps are a *font shape* change — no colour, no background. The
utilities are theme-correct trivially.

The `letter-spacing: 0.04em` on `.vc-acronym` is a width adjustment, not
a colour adjustment. Themed correctly.

## Why `letter-spacing: 0.04em` on `.vc-acronym`

Small caps are wider than lowercase glyphs (their proportions are
designed for visibility at small size). Without tracking, the acronym
*appears* tighter than the surrounding body text — visually crowded.

`0.04em` (a quarter of the eyebrow's `0.08em` tracking) opens the
glyphs just enough to read cleanly without making the acronym
"shouty".

For petite caps (smaller still), the typography skill does NOT add
extra tracking — petite caps are designed for subtle inline use
where any tracking would draw the eye.

## Comparison with `<abbr title="…">` — semantic abbreviation

HTML has `<abbr>` for abbreviations:

```html
<p>The <abbr title="Application Programming Interface">API</abbr>
   returns JSON …</p>
```

The `<abbr>` is *semantically* an abbreviation — screen readers may
read the expanded form; sighted users may see a dotted underline; on
hover, a tooltip shows the expansion.

`<abbr>` and `.vc-acronym` are NOT redundant — they serve different
roles:

- `<abbr>` provides the EXPANSION (accessibility).
- `.vc-acronym` provides the VISUAL TREATMENT (typography).

For maximum semantic richness AND visual polish:

```html
<p>The <abbr title="Application Programming Interface"
   class="vc-acronym">API</abbr> returns JSON …</p>
```

The styling and the semantic are both attached to the same element.
The screen-reader gets the expansion; the sighted reader gets the
small-caps treatment.

## Selection-contract conformance

`.vc-smallcaps` / `.vc-acronym` / `.vc-petitecaps` are INLINE — they
are not typography atoms. They live inside parent atoms (paragraphs,
list items, headings). The parent atom owns the decision-mini-pill.

## Browser support

- `font-variant-caps: small-caps`, `all-small-caps`, `petite-caps`,
  `titling-caps`, `unicase` — universal (since 2019).
- `font-feature-settings: "smcp" 1, "c2sc" 1, "pcap" 1` — universal
  (since 2014).

The double declaration in the utility ensures both work cleanly
across the entire supported browser matrix.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page with one each: `.vc-smallcaps`,
   `.vc-acronym`, `.vc-petitecaps`, an `<abbr class="vc-acronym">`,
   a plain UPPERCASE acronym for comparison.
2. Confirm small caps render at cap-height of lowercase (not full
   uppercase height).
3. Confirm the acronym tracking (0.04em) reads cleanly.
4. Test with a font that HAS true small caps (e.g. IBM Plex Serif)
   and a font that LACKS them (e.g. system-ui Linux) — both render,
   but the true small caps are visibly more polished.
5. Repeat in the dark theme. Confirm shapes adapt unchanged.

## Cross-references

- [eyebrow-overline-label.md](../../amvcp-typo-editorial/references/eyebrow-overline-label.md) — the
  eyebrow's `text-transform: uppercase`; the contrast with
  `font-variant-caps`.
- [drop-cap-and-initial.md](../../amvcp-typo-editorial/references/drop-cap-and-initial.md) — the drop cap;
  pairs with `.vc-smallcaps` on the opening few words.
- [tri-font-stack-anthropic.md](../../amvcp-typo-foundation/references/tri-font-stack-anthropic.md) — the
  font pairings; IBM Plex / Fraunces / Source Sans ship true small
  caps.
- [language-and-locale.md](../../amvcp-typo-i18n-print/references/language-and-locale.md) — small caps are
  Latin-script-only; CJK has its own emphasis system.
