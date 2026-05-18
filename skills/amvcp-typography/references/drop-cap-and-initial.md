# Drop caps and initial letters — the editorial opening flourish

## Table of Contents

- [What it is](#what-it-is)
- [Scaffold](#scaffold)
- [The contract — the alternative `vc-initial-large`](#the-contract--the-alternative-vc-initial-large)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why the heading face for the first letter](#why-the-heading-face-for-the-first-letter)
- [The `:first-of-type` qualifier — only the first paragraph](#the-first-of-type-qualifier--only-the-first-paragraph)
- [The all-caps risk — `::first-letter` and `text-transform`](#the-all-caps-risk--first-letter-and-text-transform)
- [Multilingual considerations](#multilingual-considerations)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Browser support](#browser-support)
- [Selection-contract conformance](#selection-contract-conformance)
- [When to use a drop cap](#when-to-use-a-drop-cap)
- [When NOT to use a drop cap](#when-not-to-use-a-drop-cap)
- [Verification](#verification)
- [Cross-references](#cross-references)

A *drop cap* is the first letter of a paragraph rendered very large
(3-5 body lines tall), set into the paragraph so the body text wraps
around it. It is the editorial signature that says "this paragraph
opens a chapter" — a typographic gesture inherited from medieval
manuscripts and modern print magazines.

This reference describes the `.vc-drop-cap` modifier (applied to a
paragraph) and the related `.vc-initial-large` variant (a large but
not floated first letter — gentler effect, popular in editorial
prose).

## What it is

CSS `::first-letter` is a pseudo-element that targets the FIRST
typographic letter of an element. It supports a small subset of CSS
properties — font, color, background, padding, margin, border,
text-decoration, vertical-align (limited), text-transform,
letter-spacing, word-spacing, line-height, float — plenty for a drop
cap.

The signature drop cap pattern:

```css
.vc-drop-cap::first-letter {
  float: left;                          /* the body wraps around */
  font-size: 3.2em;                     /* 3-5 lines tall */
  line-height: 1;                       /* don't add line-leading */
  font-weight: var(--vc-weight-display, var(--vc-weight-bold, 700));
  font-family: var(--vc-font-heading, inherit);   /* heading face */
  padding-right: 0.1em;
  padding-top: 0.1em;
  margin-right: 0.05em;
}
```

The values are tuned so the drop cap aligns with:

- The top of the cap-height of the first body line (`line-height: 1`
  + small `padding-top` adjusts).
- The baseline of the third or fourth body line below (the `3.2em`
  size achieves this against a body `line-height: ~1.55`).
- A tight wrap around the cap (the small `padding-right` and
  `margin-right` give the wrapping text just enough breathing room).

## Scaffold

```html
<p class="vc-type-lead vc-drop-cap">
  On 2026-04-12 at 14:32 UTC, the slot-fill rollout triggered a
  47-minute cache stampede that elevated the SEV-2 incident channel
  for 23 customers in the EU-WEST region.
</p>
```

The `.vc-drop-cap` modifier composes with `.vc-type-lead`,
`.vc-type-justify`, `.vc-type-measure` — any paragraph-level
typography utility. The `::first-letter` styling is independent of
the paragraph's outer styling.

## The contract — the alternative `vc-initial-large`

A *non-floating* large initial — same large size, no wrap, sits on
the first line like a tall first letter. Editorial magazines use this
for shorter openers where a full drop cap would be visually too
heavy.

```css
.vc-initial-large::first-letter {
  font-size: 1.8em;                       /* 1.8× body size — large but not "dropped" */
  font-weight: var(--vc-weight-display, var(--vc-weight-bold, 700));
  font-family: var(--vc-font-heading, inherit);
  letter-spacing: -0.02em;
  /* No float — text continues on the same line. */
}
```

Use `.vc-initial-large` for:
- Short callouts where a drop cap would overpower a 2-line paragraph.
- Inline-style "begin this paragraph with emphasis" patterns.
- Pull quotes where the first letter is the visual hook.

Use `.vc-drop-cap` for:
- Long-form editorial articles (single-paragraph opening).
- Chapter openings in a multi-chapter document.

## Tokens consumed / extended

- **Consumes:** `--vc-weight-display`, `--vc-weight-bold`,
  `--vc-font-heading`.
- **Extends:** nothing.

## Why the heading face for the first letter

The drop cap is the **only place in body content** where the heading
face appears inside body text. Editorial convention: the first letter
is a *decorative* element borrowed from the title register, marking
the opening with a register shift.

If the heading face is unset (i.e. the agent has not picked a font
pairing), the `inherit` fallback resolves to the body face — the drop
cap is still large but loses the register-shift effect. The page is
still correct, just less editorial.

## The `:first-of-type` qualifier — only the first paragraph

Sometimes you want a drop cap on the *first paragraph of a section*
only, not on every paragraph the agent tagged as a lead. The
qualifier:

```css
section > .vc-drop-cap:first-of-type::first-letter { /* drop cap */ }
section > .vc-drop-cap:not(:first-of-type)::first-letter {
  /* restore body default */
  font-size: inherit; float: none;
}
```

The `.vc-drop-cap` class is the *opt-in marker*; the `:first-of-type`
selector restricts the actual rendering to the first occurrence. The
typography skill ships only the unrestricted `.vc-drop-cap` — agents
who want the qualifier add it in page-local CSS.

## The all-caps risk — `::first-letter` and `text-transform`

`text-transform: uppercase` on a paragraph turns the first letter into
its uppercase form. The drop cap's font-size override applies AFTER
the case transformation — so a lowercase "o" becomes "O" at drop-cap
size.

This is usually FINE (the drop cap looks identical regardless of
source case). The exception: if the paragraph starts with a digit
("1869 — the year of …") the drop cap is the digit, not a letter.
Some typesetters argue digits shouldn't drop-cap; the typography skill
doesn't enforce a rule — the agent decides whether to rewrite the
opening to start with a letter.

## Multilingual considerations

`::first-letter` is *Unicode-aware* — for languages like Arabic where
"first letter" is more nuanced (combining marks, joining forms), the
browser does its best. For CJK (Chinese, Japanese, Korean) the
concept doesn't really apply — CJK does not use drop caps in
traditional typography.

The typography skill does not ship a CJK drop-cap variant. If the
agent applies `.vc-drop-cap` to a CJK paragraph, the browser renders
the first CJK character at large size, which is visually unfamiliar
to CJK readers. Don't.

## Light + dark — fully covered

The drop cap inherits `color` from the paragraph (which inherits from
`--ve-control-fg` via the runtime). No hardcoded colour. Themed
correctly in both light and dark.

The `padding` / `margin` values are sizes, not colours — theme-
independent.

## Browser support

`::first-letter` is universal. The drop cap pattern (`float: left` +
large font-size) is universal.

The `:first-of-type` selector is universal.

One quirk: in IE and old Edge, `::first-letter` had a buggy
interaction with `float`. The runtime does not support those browsers
(see the engine's compatibility statement), so the quirk doesn't
matter here. Modern browsers all render the pattern correctly.

## Selection-contract conformance

A `.vc-drop-cap` paragraph is the SAME atom as a `.vc-type-lead`
paragraph — the modifier doesn't change the `data-ve-type`. The
decision-mini-pill anchors to the paragraph; the user comments on
"the lead" (which happens to have a drop cap), not on "the drop cap
separately".

If the user wants to comment on the drop cap **specifically** ("the
drop cap is too large"), they comment on the lead atom and write the
text — there is no separate atom for sub-paragraph styling decisions.

## When to use a drop cap

- The single opening paragraph of a long-form editorial article.
- The first paragraph after a chapter heading in a multi-chapter
  document.
- The opening of a magazine-style feature spread.

## When NOT to use a drop cap

- More than one per section — drop caps lose their semantic when
  repeated. Each new drop cap should mark a chapter/section opening,
  not an arbitrary paragraph.
- On reports, dashboards, status pages — drop caps add editorial drama
  that conflicts with the page's tone.
- On pages with very short paragraphs — a 2-line paragraph with a
  3-line drop cap looks unbalanced.
- On pages rendered in compact viewports (mobile portrait) — the drop
  cap eats horizontal space; the body wrap looks cramped.
- On code or technical content — drop caps signal "editorial prose",
  not "engineering content".

## Verification

The Visual Verification procedure
(`skills/amvcp-self-debug-rules/SKILL.md`) for a drop cap:

1. Render the specimen page with one `.vc-drop-cap` paragraph.
2. Confirm: the first letter is ~3.2× body size, sits at the top of
   the paragraph, body text wraps around it.
3. Confirm: the bottom of the cap aligns with the baseline of body
   line 3 or 4.
4. Confirm: the drop cap uses the heading face (visually distinct
   from the body face).
5. Repeat with the dark theme — the drop cap inherits the dark text
   colour.
6. Confirm with a narrow viewport (~400 px) the drop cap still wraps
   correctly (no overlapping text).

## Cross-references

- [lead-paragraph.md](./lead-paragraph.md) — drop caps are the
  editorial modifier on `.vc-type-lead`.
- [tri-font-stack-anthropic.md](./tri-font-stack-anthropic.md) — the
  heading face the drop cap borrows from.
- [variable-font-tokens.md](./variable-font-tokens.md) — the
  `--vc-weight-display` token the drop cap weight reads.
- [multi-column-layout.md](./multi-column-layout.md) — drop caps
  inside multi-column layouts: the drop cap floats in the first
  column only, by `::first-letter` semantics.
