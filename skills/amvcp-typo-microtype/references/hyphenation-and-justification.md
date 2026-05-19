# Hyphenation, justification, and the readability of narrow columns

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [When to opt in](#when-to-opt-in)
- [Why `hyphens: auto` and not `hyphens: manual`](#why-hyphens-auto-and-not-hyphens-manual)
- [The `.vc-no-hyphens` modifier](#the-vc-no-hyphens-modifier)
- [The widow / orphan controls](#the-widow--orphan-controls)
- [Light + dark — orthogonal](#light--dark--orthogonal)
- [Browser support](#browser-support)
- [The runtime's existing justification use](#the-runtimes-existing-justification-use)
- [When NOT to use justification](#when-not-to-use-justification)
- [Forbidden — `text-justify: distribute`](#forbidden--text-justify-distribute)
- [CJK justification](#cjk-justification)
- [Selection-contract conformance](#selection-contract-conformance)
- [Cross-references](#cross-references)

When a body paragraph renders in a narrow column (a slide-deck
sidebar, a 3-column report grid, a mobile viewport), the default
left-aligned ragged-right setting produces *gaping* end-of-line
whitespace and *orphaned* short words on their own line. Two
typography settings fix this: `text-align: justify` + `hyphens: auto`.
The pair is opt-in via the `.vc-type-justify` utility — the typography
skill ships the rule, the agent picks where to apply it.

## What it is

Browsers default body text to `text-align: left` (a.k.a.
*ragged-right*). Words flow until the next would overflow; the line
ends short; the next line starts. In a wide column (≥60 characters
per line, the readability sweet spot) this is fine — the right edge
is "ragged" but the gaps are small.

In a *narrow* column (<40 characters per line) ragged-right becomes
visually ugly: every line ends with a different amount of whitespace,
short words ("a", "an", "of") sit alone at line ends, and the
paragraph looks chewed.

The fix:

- `text-align: justify` — the browser stretches inter-word spacing
  on each line so the right edge aligns.
- `hyphens: auto` — the browser hyphenates long words at end-of-line
  so the inter-word stretches stay small.

Without `hyphens: auto`, justification alone produces RIVERS of
whitespace (long horizontal gaps through the paragraph). With it,
justification produces tight, visually-pleasing prose even at narrow
widths.

## The contract

```css
.vc-type-justify {
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;       /* Safari prefix; the same property,
                                  but Safari requires the explicit -webkit. */
  hyphenate-limit-chars: 6 3 3; /* shortest word: 6 chars; min before
                                  hyphen: 3; min after hyphen: 3 */
  hyphenate-limit-lines: 2;    /* never more than 2 consecutive
                                  hyphenated lines */
  text-justify: inter-word;    /* spread inter-word, not inter-character.
                                  The latter produces "modern art" text. */
}
```

The four extra properties (`hyphenate-limit-chars`,
`hyphenate-limit-lines`, `text-justify`) tune the algorithm to
produce *editorial* hyphenation rather than aggressive hyphenation.
A typesetter would call this "newspaper-grade" hyphenation.

## Scaffold

```html
<!-- Standalone narrow column -->
<aside class="vc-type-justify" style="max-width: 24ch;">
  <p>The default left-aligned ragged-right setting produces gaping
     end-of-line whitespace and orphaned short words on their own
     line. Justification fixes both.</p>
</aside>

<!-- Inside a slide-deck sidebar -->
<section class="slide">
  <div class="sidebar vc-type-justify">
    <p>This sidebar is 200 pixels wide — easily 25 characters per line.
       Ragged-right would look chewed. Justified with hyphenation
       looks like a magazine sidebar.</p>
  </div>
</section>
```

## Tokens consumed / extended

- **Consumes:** nothing — the utility is a pure CSS rule with no
  token dependency.
- **Extends:** nothing.

`hyphens: auto` is language-aware — the browser uses the document's
`lang` attribute to pick the hyphenation dictionary. Always set
`<html lang="en">` (or the appropriate language tag) on the page,
otherwise hyphens default to the user's browser locale, which may
mismatch the content.

## When to opt in

| Column width | Recommendation |
|---|---|
| ≥60 characters per line (the body readability target) | Do NOT justify — ragged-right reads beautifully. |
| 40–60 characters per line (typical body in a slide) | OPTIONAL — justify if the right edge bothers you, leave ragged if the prose has many short words. |
| <40 characters per line (narrow sidebar / mobile) | YES — justify + hyphens essential. |

The 60-character heuristic is the *measure* of the column —
empirically, prose reads fastest at 45-75 characters per line.
Justification's value is inverse to the column width: wider columns
don't need it, narrower columns can't read without it.

## Why `hyphens: auto` and not `hyphens: manual`

`hyphens: manual` lets the author hand-insert `&shy;` (soft-hyphen
HTML entity) at every legal break — the browser only hyphenates at
those marked points. This is correct for **single-language** content
where the author has time to insert soft hyphens by hand.

`hyphens: auto` uses the browser's built-in hyphenation dictionary
for the document's language. It works on any prose without
hand-marking. Slightly less precise than `manual` but the right
trade-off for AMVCP — the agent will not hand-insert soft hyphens.

`hyphens: none` disables hyphenation entirely — sometimes correct
for a brand-name-rich prose ("Anthropic" should NOT hyphenate as
"Anth-ropic"), but the `.vc-type-no-hyphens` modifier below handles
that case at a finer grain than disabling for the whole column.

## The `.vc-no-hyphens` modifier

Sometimes a *specific* word inside an otherwise-justified paragraph
should not hyphenate (a brand name, a proper noun, a technical term
the reader needs to recognise at a glance). The modifier:

```css
.vc-no-hyphens { hyphens: none; -webkit-hyphens: none; }
```

Usage:
```html
<p class="vc-type-justify">
  We integrate with <span class="vc-no-hyphens">Anthropic</span>'s
  API to deliver…
</p>
```

The span scopes `hyphens: none` to just the brand name; the
surrounding paragraph remains justified.

## The widow / orphan controls

A *widow* is a single word on the last line of a paragraph; an
*orphan* is a single line of a paragraph at the bottom of a column
that breaks to the next column. Both are typesetting eye-sores.

CSS provides `widows` and `orphans` to control them (works only in
multi-column layouts, NOT in single-flow body text):

```css
.vc-type-multicol p {
  widows: 2;     /* never less than 2 lines at the bottom of a column */
  orphans: 2;    /* never less than 2 lines at the top of a column */
}
```

These properties only apply to *fragmented* content (CSS Columns,
paged media, print). For the default single-column body flow they
are no-ops. The `.vc-type-multicol` utility (see
[multi-column-layout.md](../../amvcp-typo-structure/references/multi-column-layout.md)) is the home for
multi-column setting.

## Light + dark — orthogonal

Hyphenation and justification affect *line breaking* only — they
have no colour, no background, no font impact. The utility is theme-
correct trivially.

## Browser support

- `text-align: justify` — universal.
- `hyphens: auto` — universal (Safari needs `-webkit-hyphens: auto`
  alias; the utility above ships both).
- `hyphenate-limit-chars`, `hyphenate-limit-lines` — newer (Chrome
  109+, Firefox 117+, Safari 17+). Older browsers ignore them
  (fail-soft: hyphenation still works, just with defaults).
- `text-justify: inter-word` — universal.

## The runtime's existing justification use

The runtime does NOT currently use `text-align: justify` or `hyphens:
auto`. The prose subsystem (`[data-ve-prose]`) inherits left-aligned
ragged-right. Adopting the `.vc-type-justify` class is opt-in per
content block — the typography skill ships the utility, the runtime
does not retro-apply it.

The migration target is the *slide* skill's sidebar: a slide deck
with narrow side-panels will benefit visibly from justification +
hyphenation. The agent owns that opt-in at the slide-template level.

## When NOT to use justification

- **Wide single-column body prose** (≥60 chars/line) — ragged-right is
  better. The reader's eye uses the irregular right edge as a
  scanning cue.
- **Headings** — never justify a heading. Headings should NEVER
  hyphenate; they should fit on one or two lines and the line break
  is an authorial decision.
- **All-caps text** (eyebrows, badges) — justification + caps + tracking
  produces visible irregular gaps. Stick to ragged-right.
- **Code blocks** (`<pre>`) — never justify. Code's whitespace IS
  semantic.
- **Lists** (`<ul>`, `<ol>`) — list items are short; justifying them
  produces large gaps. Default is correct.
- **Single-language pages where `<html lang>` is missing** — without a
  language, hyphenation can't use a dictionary and will hyphenate
  badly. Fix the `<html lang>` first.

## Forbidden — `text-justify: distribute`

`text-justify: distribute` (or its deprecated alias
`text-justify: inter-character`) spreads spaces *between every glyph*,
not just between words. This is the "stretched modern art" look — it
makes prose unreadable. The `.vc-type-justify` utility explicitly
sets `text-justify: inter-word` to lock the algorithm to word-level
spreading. NEVER change this.

## CJK justification

For CJK content (Chinese, Japanese, Korean) the rules are different
— CJK justifies at a per-character level (CJK has no inter-word
spaces, so inter-word distribution is meaningless). The browser
handles this automatically when `<html lang="zh">` / `"ja"` / `"ko"`
is set; the typography skill does not ship a CJK-specific
justification utility (DT-25 in `design-tokens` owns the CJK
typography contract; the typography skill defers).

## Selection-contract conformance

A `.vc-type-justify` paragraph is a typography atom — the
`markTypographyAtoms` walker stamps it as `type-body` (justification
is a *modifier*, not a different role). The atom inherits the
decision-mini-pill.

## Cross-references

- [lead-paragraph.md](../../amvcp-typo-editorial/references/lead-paragraph.md) — lead paragraphs in
  narrow columns also benefit from `.vc-type-justify` (often paired
  with `.vc-type-lead.vc-type-justify`).
- [multi-column-layout.md](../../amvcp-typo-structure/references/multi-column-layout.md) — the
  `.vc-type-multicol` utility where `widows` / `orphans` take effect.
- [language-and-locale.md](../../amvcp-typo-i18n-print/references/language-and-locale.md) — the `<html
  lang>` and `lang` attributes hyphenation depends on.
- `design-tokens` skill — DT-25 owns the CJK typography contract.
