# Ligatures and OpenType features — `liga`, `dlig`, `frac`, `ordn`, `calt`

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why common-ligatures ON by default](#why-common-ligatures-on-by-default)
- [Why discretionary-ligatures OFF by default](#why-discretionary-ligatures-off-by-default)
- [Why kerning is explicitly set](#why-kerning-is-explicitly-set)
- [Auto-fractions vs Unicode fractions](#auto-fractions-vs-unicode-fractions)
- [Stylistic sets — `ss01` through `ss20`](#stylistic-sets--ss01-through-ss20)
- [Light + dark — orthogonal](#light--dark--orthogonal)
- [Browser support](#browser-support)
- [When the font doesn't have a feature](#when-the-font-doesnt-have-a-feature)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to opt in](#when-not-to-opt-in)
- [Verification](#verification)
- [Cross-references](#cross-references)

OpenType ligatures are special combined glyphs for letter pairs that
collide at standard spacing — "fi", "fl", "ffl", "Th", "ct", "st".
Modern fonts ship dozens of ligature classes; the browser exposes
them via `font-variant-ligatures` and `font-feature-settings`.

The typography skill exposes the most-used ligature classes as
utility classes and as defaults on the body face — common ligatures
ON, discretionary ligatures OFF by default.

## What it is

OpenType defines FIVE ligature feature classes:

| Feature | Property | Default | Typical glyphs |
|---|---|---|---|
| `liga` | `common-ligatures` | ON | fi, fl, ffl, Th, ti — the universally-expected ones |
| `dlig` | `discretionary-ligatures` | OFF | ct, st, sp, ck — the editorial ones |
| `hlig` | `historical-ligatures` | OFF | ſh, ſſ — the very-old ones |
| `clig` | `contextual-ligatures` | ON | letter pairs that depend on context |
| `rlig` | `required-ligatures` | ON | mandatory for some scripts |

`liga` and `rlig` are ON by default in browsers (Safari has slightly
different defaults for some scripts but converges on this). `dlig`
and `hlig` are OFF — they require explicit opt-in.

Beyond ligatures, OpenType also provides:

| Feature | Effect |
|---|---|
| `frac` | Auto-fractions (`1/2` → ½) |
| `ordn` | Ordinal markers (`1st` → 1<sup>st</sup>) |
| `calt` | Contextual alternates (e.g. swash forms in italic) |
| `kern` | Kerning (already ON by default in browsers) |
| `cv01` … `cv99` | Character variants — per-glyph alternate forms |
| `ss01` … `ss20` | Stylistic sets — per-set alternate forms |
| `salt` | Stylistic alternates — alternative glyph forms |

## The contract

`amvcp-typography.css` sets sensible defaults on `:root` so the entire
page benefits without opt-in:

```css
:root {
  font-variant-ligatures: common-ligatures contextual;
  /* common + contextual = the universally-expected ligatures. */
  font-kerning: normal;
  /* Kerning is on by default, but the explicit declaration overrides
     `font-kerning: none` from a malformed stylesheet. */
}

/* Body text already inherits the :root settings. */

/* Discretionary ligatures — opt-in for editorial prose. */
.vc-dlig {
  font-variant-ligatures: common-ligatures contextual discretionary-ligatures;
  font-feature-settings: "dlig" 1;
}

/* Auto-fractions — for numeric content. */
.vc-fractions {
  font-variant-numeric: diagonal-fractions;
  font-feature-settings: "frac" 1;
}

/* Ordinal markers. */
.vc-ordinals {
  font-variant-numeric: ordinal;
  font-feature-settings: "ordn" 1;
}

/* Stylistic alternates — the TY-10 utility (from
   variable-font-tokens.md), referenced here for completeness. */
.vc-type-alt {
  font-feature-settings: var(--vc-font-features, "salt" 1, "ss01" 1);
}
```

## Scaffold

### Ordinary body — common ligatures auto

```html
<p>The first official release of the platform shipped in October.</p>
```

The "ffl" in "official", the "fi" in "first", the "fi" in "shipped"
— all render as ligatures. Reader doesn't notice; designer does.

### Discretionary ligatures for editorial

```html
<p class="vc-dlig">The cathedral stood at the centre of the square.</p>
```

If the body font has discretionary ligatures (e.g. Fraunces, IBM
Plex Serif, Crimson Pro), the "ct" in "cathedral" and "centre" render
as a connected ligature. Editorial polish.

### Auto-fractions

```html
<p>The dosage is <span class="vc-fractions">1/2</span> tablespoon
   per cup.</p>
```

The "1/2" renders as ½ (true fraction glyph) if the font supports
it. Falls back to "1/2" as plain text if not.

### Ordinal markers

```html
<p>This was our <span class="vc-ordinals">1st</span> shipment to
   the EU region.</p>
```

The "1st" renders as 1<sup>st</sup> (raised st) if the font supports
it.

## Tokens consumed / extended

- **Consumes:** nothing.
- **Extends:** `--vc-font-features` (optional engine key) drives the
  `.vc-type-alt` stylistic alternates — see
  [variable-font-tokens.md](../../amvcp-typo-foundation/references/variable-font-tokens.md) for the
  variable-font axis layer.

## Why common-ligatures ON by default

Common ligatures are *universally expected* in good typography. The
"fi" pair has been a ligature since Gutenberg; the absence of the
ligature in modern web type was a regression from CSS's early years,
fixed by the `font-variant-ligatures` property.

ON by default means: every page benefits without the agent thinking
about it. The body font's ligature library is used to the maximum.

## Why discretionary-ligatures OFF by default

Discretionary ligatures (`ct`, `st`, `sp`, etc.) are *editorial* —
they belong in long-form prose where the font is the storyteller. In
a status report or a dashboard, the `ct` ligature in "context" reads
as visual noise.

OFF by default means: only editorial prose (which opts into `.vc-dlig`)
gets them.

## Why kerning is explicitly set

`font-kerning: normal` is the browser default, BUT — some old or
malformed stylesheets set `font-kerning: none` (typically to
"normalise" type rendering across browsers, a mistake). Setting
`font-kerning: normal` on `:root` ensures the typography layer is
the source of truth, immune to those overrides.

## Auto-fractions vs Unicode fractions

There are three ways to render a fraction in HTML:

| Method | Markup | Result |
|---|---|---|
| Auto-fraction | `<span class="vc-fractions">1/2</span>` | ½ if font supports |
| Unicode literal | `½` | ½ always |
| Fraction tag | `<sup>1</sup>⁄<sub>2</sub>` | tiny 1 over 2 |

For *one or two* fractions in body text, the Unicode literal is
simpler — copy-paste the character into the markup.

For *many* fractions (a recipe list, a measurement table), use
`.vc-fractions` on the surrounding text — the agent doesn't have to
know every fraction's Unicode codepoint.

For *uncommon* fractions (5/8, 7/16), neither the Unicode literal
nor `<sup>` works well; rely on `.vc-fractions` and the font's
auto-fraction feature, which generates the fraction shape on the fly.

## Stylistic sets — `ss01` through `ss20`

OpenType allows per-font *stylistic sets* — collections of alternate
glyph shapes the font designer named. Each font has a different set
of meanings:

- IBM Plex: `ss01` = single-story `a`, `ss02` = single-story `g`,
  `ss03` = alternate `R`, …
- Fraunces: `ss01` = soft alternates, `ss02` = alternate `t`, …

The typography skill exposes the `.vc-type-alt` class for the most
common opt-in (`salt` + `ss01`), and the per-page agent can declare
their own custom stylistic-set utilities via DESIGN.md's
`typography.font-features` key.

## Light + dark — orthogonal

OpenType features are *glyph-shape* changes, not colour changes.
Every utility above is theme-correct trivially.

## Browser support

- `font-variant-ligatures` — universal (since ~2015).
- `font-feature-settings` — universal (since ~2014).
- `font-variant-numeric` (the property `.vc-fractions` /
  `.vc-ordinals` use) — universal.
- Per-feature glyph shapes — font-dependent, not browser-dependent.

The page is *correct* on every supported browser; the page is
*polished* only when the chosen font ships the right OpenType
features.

## When the font doesn't have a feature

If the body font is `system-ui` and doesn't have discretionary
ligatures, `.vc-dlig` is a no-op — `font-feature-settings: "dlig" 1`
is silently ignored. The text renders without ligatures.

This is fail-soft: the page is never broken. Just less polished on
fonts that lack the feature.

The agent picks fonts (via [font-loading-pairings.md](../../amvcp-typo-foundation/references/font-loading-pairings.md))
that DO ship rich OpenType features when editorial polish matters.
The Anthropic-Claude `ui-serif` / `ui-sans` / `ui-mono` stack is
medium polish (most platforms have `liga` but not `dlig`); the
Fraunces / IBM Plex / DM stack is high polish.

## Selection-contract conformance

`.vc-dlig` / `.vc-fractions` / `.vc-ordinals` / `.vc-type-alt` are
INLINE — not typography atoms. Their parent paragraph owns the
decision-mini-pill.

## When NOT to opt in

- **Code** — code fonts have ligatures for `==`, `=>`, `!=` etc., but
  these are *programming* ligatures (Fira Code, JetBrains Mono).
  They are usually NOT desired in source-displayed code (the reader
  needs to see the literal characters). The mono code block
  contract in `code-and-mono.md` does NOT enable ligatures by default.

- **Acronyms** — `.vc-acronym` already handles small-cap rendering;
  adding `.vc-dlig` on top would be visual chaos.

- **Numbers** — `.vc-tabular-nums` and `.vc-fractions` are
  *competing* features (one wants uniform digit widths, the other
  wants the fraction-bar glyph). They CAN combine, but the result
  depends on the font.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page with text containing "fi", "fl", "ffl"
   (e.g. "official", "official"); check the ligature renders.
2. Render text with `.vc-dlig` containing "ct" and "st"; check the
   discretionary ligature renders if the font has it.
3. Render `<span class="vc-fractions">1/2 1/4 3/8</span>`; check
   true fractions render if the font has them.
4. Repeat with multiple font pairings — confirm the polish level
   matches the font's OpenType library.
5. Light + dark themes; confirm rendering unchanged.

## Cross-references

- [tri-font-stack-anthropic.md](../../amvcp-typo-foundation/references/tri-font-stack-anthropic.md) — the
  font pairings; not all fonts have all OpenType features.
- [variable-font-tokens.md](../../amvcp-typo-foundation/references/variable-font-tokens.md) — the
  `.vc-type-alt` and `--vc-font-features` cross-reference.
- [code-and-mono.md](../../amvcp-typo-code-keys/references/code-and-mono.md) — programming ligatures on
  mono fonts; the contract that disables them by default.
- [tabular-numerics.md](./tabular-numerics.md) — the parallel feature
  for numeric widths.
