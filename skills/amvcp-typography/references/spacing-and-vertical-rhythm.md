# Spacing and vertical rhythm — paragraph margins, baseline grids

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why margin-bottom only (not margin-top) on paragraphs](#why-margin-bottom-only-not-margin-top-on-paragraphs)
- [The `:first-child` no-top-margin rule](#the-first-child-no-top-margin-rule)
- [The adjacent-sibling rule for heading-then-paragraph](#the-adjacent-sibling-rule-for-heading-then-paragraph)
- [The eyebrow-then-heading tight pairing](#the-eyebrow-then-heading-tight-pairing)
- [Baseline grid — `.vc-baseline-grid`](#baseline-grid--vc-baseline-grid)
- [Why heading margins decrease with rank](#why-heading-margins-decrease-with-rank)
- [Light + dark — orthogonal](#light--dark--orthogonal)
- [When the agent overrides](#when-the-agent-overrides)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to follow the contract](#when-not-to-follow-the-contract)
- [Verification](#verification)
- [Cross-references](#cross-references)

A document with consistent vertical rhythm reads as *composed* — the
eye perceives the page as a unified system, not as a stack of
random paragraphs. The typography skill ships the inter-paragraph
spacing contract (margins, the `+` adjacent-sibling rule), plus an
opt-in baseline-grid utility for editorial pages where strict
vertical alignment matters.

## What it is

Three layers of vertical spacing in a typographic page:

| Layer | Mechanism | Owns |
|---|---|---|
| Inter-paragraph spacing | `<p>` `margin-top` / `margin-bottom` | Typography (THIS reference) |
| Heading-to-content spacing | Heading `margin-bottom` + first-content `margin-top: 0` | Typography |
| Baseline grid | All elements snap to multiples of the body line-height | Optional (`.vc-baseline-grid` modifier) |

The body line-height (~1.55 × the body font-size) is the *measure*
of vertical rhythm. Most spacing values in the contract are expressed
as multiples of `1em` (the body font-size) for consistency.

## The contract

```css
/* Body paragraphs — generous bottom margin so paragraphs read as
   separate units. */
p {
  margin: 0 0 1em 0;
}

/* Last paragraph in a container — no trailing margin so the
   container's own padding controls the bottom space. */
p:last-child {
  margin-bottom: 0;
}

/* Headings — margin-top to separate from preceding content;
   margin-bottom smaller so the heading visually associates with its
   content. */
h1, .vc-type-hero {
  margin: 2em 0 0.5em 0;
}
h2 {
  margin: 1.75em 0 0.5em 0;
}
h3 {
  margin: 1.5em 0 0.5em 0;
}
h4, h5, h6 {
  margin: 1.25em 0 0.4em 0;
}

/* First heading in a container — no top margin so the container's
   own padding controls the top space. */
section > h1:first-child,
section > h2:first-child,
section > h3:first-child,
article > h1:first-child,
article > h2:first-child {
  margin-top: 0;
}

/* Adjacent sibling — when a paragraph immediately follows a heading
   the heading's bottom margin is sufficient; don't double up. */
h1 + p, h2 + p, h3 + p,
h4 + p, h5 + p, h6 + p {
  margin-top: 0;
}

/* The lead paragraph immediately after a heading — a touch more
   space below the heading. */
h1 + .vc-type-lead,
h2 + .vc-type-lead,
h3 + .vc-type-lead {
  margin-top: 0.25em;                  /* small inset */
}

/* Eyebrow above a heading — no margin between. */
.vc-type-overline + h1,
.vc-type-overline + h2,
.vc-type-overline + h3 {
  margin-top: 0.25em;
}

/* Lists — same as paragraphs. */
ul, ol, dl,
blockquote, pre, figure, table {
  margin: 1em 0;
}

/* Section break — extra space above an `<hr>` separator. */
hr {
  margin: 3em 0;
  border: 0;
  border-top: 1px solid color-mix(in srgb, currentColor 20%, transparent);
}
```

## Scaffold

```html
<article>
  <header>
    <p class="vc-type-overline">Phase 1 · Discovery</p>
    <h1>Identifying the regression</h1>
    <p class="vc-type-lead">
      A summary of the discovery phase.
    </p>
  </header>

  <h2>Methodology</h2>
  <p>The first body paragraph follows the heading with the heading's
     `margin-bottom` controlling the gap.</p>
  <p>The second body paragraph has its own `margin-top: 1em` …
     wait — it doesn't! The adjacent-sibling rule strips the
     top-margin since it follows a paragraph, not a heading. Each
     paragraph has `margin-bottom: 1em` only.</p>

  <hr>

  <h2>Findings</h2>
  <p>The next section starts after the `<hr>` separator's generous
     margin.</p>
</article>
```

## Tokens consumed / extended

- **Consumes:** nothing (all values are `em` multiples of body size).
- **Extends:** nothing.

## Why margin-bottom only (not margin-top) on paragraphs

A common typography mistake is `p { margin: 1em 0; }` — both top
AND bottom margin. When two paragraphs are adjacent, this produces
*two* margins meeting; CSS *collapses* adjacent margins to the
larger of the two (still 1em), but the developer's mental model
breaks down — they expect 2em, browsers compute 1em.

By contrast, `p { margin: 0 0 1em 0; }` produces a SINGLE
bottom-margin per paragraph. Two adjacent paragraphs have a clear
1em gap (the first paragraph's bottom margin, the second paragraph's
top margin is zero). The mental model is predictable.

For consistency with heading-then-paragraph (where the heading's
bottom margin controls the gap), the typography skill uses the
`margin-bottom-only` pattern throughout.

## The `:first-child` no-top-margin rule

The first heading in a container has its top margin stripped:

```css
section > h1:first-child { margin-top: 0; }
```

This lets the container's own `padding-top` control the top space.
Without the rule, a `<section style="padding: 2em;">` with an `<h1>`
inside would render with `2em` of section padding PLUS `2em` of h1
top margin = `4em` of empty space above the heading.

The rule strips the h1's top margin so the container's padding is
the sole controller of top space.

## The adjacent-sibling rule for heading-then-paragraph

```css
h1 + p { margin-top: 0; }
```

When a paragraph immediately follows a heading, the heading's
margin-bottom (`0.5em`) is sufficient; the paragraph doesn't need its
own top margin (it has none — see "margin-bottom only" above) BUT —
the rule is defensive in case the paragraph has been overridden to
have a top margin elsewhere.

## The eyebrow-then-heading tight pairing

```css
.vc-type-overline + h1 { margin-top: 0.25em; }
```

An eyebrow immediately above a heading should be tightly paired —
they read as ONE unit ("Phase 1 · Discovery / Identifying the
regression"). The default heading margin-top (`2em`) would put far
too much space; `0.25em` is the editorial-tight pairing.

## Baseline grid — `.vc-baseline-grid`

For editorial pages where strict vertical alignment matters (the
text baseline of every element snaps to a 24px or similar grid),
the opt-in:

```css
.vc-baseline-grid {
  /* Show a visible baseline grid for design verification. */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 calc(1em * 1.55 - 1px),
    color-mix(in srgb, currentColor 8%, transparent) calc(1em * 1.55 - 1px) calc(1em * 1.55)
  );
}
```

This is a *visualisation* utility — the grid is shown only when
`.vc-baseline-grid` is added (typically in design / dev). Production
pages don't show the grid.

For strict baseline-snapping in production, the typography skill
ships values that are integer multiples of `1.55em` (the line-height):

- `1em` margin = body-line × 0.65 — too small for snap.
- `1.55em` margin = one body-line — snaps.
- `2.3em` margin = 1.5 body-lines — half-snap.
- `3.1em` margin = 2 body-lines — snaps.

The typography skill's default margins (`1em`, `2em`, `3em`, `0.5em`,
`0.25em`) are NOT strict baseline-grid snapped — they prioritise
*editorial reading rhythm* over *grid snap*. Editorial typography
considers baseline-grid snapping a *design constraint*, not a
universal rule.

For strict-grid pages (architectural plans, technical drawings,
typesetting samples), the agent overrides with `1.55em`-multiple
values. The typography skill does not force this — it's the design
decision per page.

## Why heading margins decrease with rank

| Heading | margin-top |
|---|---|
| h1 | 2em |
| h2 | 1.75em |
| h3 | 1.5em |
| h4-h6 | 1.25em |

Higher-rank headings get more breathing room above — they start
LARGER sections. A `<h1>` opens a top-level section; the visual gap
above it signals "major break". A `<h4>` opens a sub-sub-section; a
smaller gap is correct.

The decreasing scale is editorial convention — books, magazines,
manuals all use this gradient.

## Light + dark — orthogonal

All spacing is `em` units, no colour. The `<hr>` separator uses
`currentColor` for the border — themed correctly.

## When the agent overrides

Per-page overrides:

```css
/* This page wants larger gaps between paragraphs. */
.airy-prose p { margin-bottom: 1.5em; }

/* This page wants tighter h2 spacing. */
.compact-layout h2 { margin: 1em 0 0.3em 0; }
```

The typography skill's defaults are the *baseline*; the agent
overrides per-page for specific design tones.

## Selection-contract conformance

Margins / spacing are layout properties, not visual atoms. The
`markTypographyAtoms` walker stamps elements by SHAPE, not by margin.
The decision-mini-pill anchors per element regardless of margin.

## When NOT to follow the contract

- **Inside a card / panel** — the card's own padding handles spacing;
  the contract's external margins should be reset:

```css
.card p:first-child { margin-top: 0; }
.card p:last-child { margin-bottom: 0; }
```

- **Inside a tight UI element** — a button label paragraph or a
  badge text paragraph should NOT have the body margin (it would
  break the UI element's height).

- **Inside a `<dialog>` or modal** — modal content typically has
  custom spacing; the typography skill's contract conflicts.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page with multiple sections, headings,
   paragraphs, lists.
2. Confirm consistent 1em gap between body paragraphs.
3. Confirm heading-to-content gap is tight (0.5em); section-to-
   section gap is generous (~2em).
4. Confirm `.vc-type-overline + h1` is tight-paired.
5. Use the `.vc-baseline-grid` visualisation; confirm element
   positions look intentional (even if not strictly snapped).
6. Confirm in both light + dark themes the spacing is identical.

## Cross-references

- [semantic-hierarchy.md](./semantic-hierarchy.md) — the role-to-token
  contract this reference's spacing complements.
- [lists-and-list-typography.md](./lists-and-list-typography.md) —
  list-specific spacing (li margin) complements paragraph spacing.
- [measure-and-readability.md](./measure-and-readability.md) — the
  horizontal counterpart (column width); spacing is vertical.
- `layout` skill — owns page-level grid and padding; this reference
  is the typography contract that sits inside the layout.
