# Figure and caption — the image + caption typography contract

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why italic caption](#why-italic-caption)
- [Why `opacity: 0.85` (not a colour)](#why-opacity-085-not-a-colour)
- [The CSS counter — `counter-increment` + `counter()`](#the-css-counter--counter-increment--counter)
- [Side-floated figures and body wrap](#side-floated-figures-and-body-wrap)
- [Wide figures and the `100vw` trick](#wide-figures-and-the-100vw-trick)
- [Alt text — non-negotiable](#alt-text--non-negotiable)
- [The `<picture>` element for responsive images](#the-picture-element-for-responsive-images)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to wrap in `<figure>`](#when-not-to-wrap-in-figure)
- [Verification](#verification)
- [Cross-references](#cross-references)

A `<figure>` is a semantic container for self-contained content that's
*illustrative* — an image, a chart, a diagram, a code listing —
optionally with a `<figcaption>` describing it. The typography skill
ships the `<figure>` / `<figcaption>` element-level defaults plus
the `.vc-figure-side`, `.vc-figure-wide`, and `.vc-figure-numbered`
modifiers for common variants.

## What it is

`<figure>` is the semantic HTML5 element for *self-contained
referenceable content* — content that:

- Could be moved away from the main flow (e.g. to an appendix)
  without losing meaning.
- Is *referenced* from the surrounding text ("see Figure 3").
- Has a caption explaining or contextualising it.

The `<figcaption>` is the caption, semantically associated with the
figure. Screen readers announce the figure + caption as a pair.

## The contract

```css
figure {
  margin: 1.5em 0;
  /* No padding — the figure's content is the focus. */
}

/* The figure's contents (typically an <img>, <svg>, <pre>, <table>)
   sit naturally. The contract here is about the figure's vertical
   rhythm and the caption. */

figcaption {
  font-size: var(--vc-text-1);          /* smaller than body */
  font-style: italic;                    /* editorial convention */
  font-family: var(--vc-font-body, inherit);
  line-height: 1.5;
  margin-top: 0.75em;
  /* No color — inherits from --ve-control-fg. */
  /* Slightly dimmer by convention; achieved via opacity, not color. */
  opacity: 0.85;
}

/* Numbered figure variant. */
.vc-figure-numbered {
  counter-increment: vc-figure;
}
.vc-figure-numbered figcaption::before {
  content: "Figure " counter(vc-figure) ". ";
  font-style: normal;
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  opacity: 1;
}

/* Side-floated figure — for narrow figures that body text wraps
   around. */
.vc-figure-side {
  float: right;
  max-width: 40%;
  margin: 0 0 1em 1.5em;
}
.vc-figure-side.vc-figure-left {
  float: left;
  margin: 0 1.5em 1em 0;
}

/* Wide figure — escapes the body column width for hero charts /
   diagrams. */
.vc-figure-wide {
  margin-left: calc(-1 * (100vw - 100%) / 2);
  margin-right: calc(-1 * (100vw - 100%) / 2);
  /* Cap at viewport width. */
  max-width: 100vw;
}
```

## Scaffold

### Standard figure with caption

```html
<figure>
  <img src="/charts/latency-distribution.svg"
       alt="Histogram of request latency, showing the bimodal
            distribution with a sharp 99th percentile spike">
  <figcaption>
    Request latency distribution for 2026-04-12, showing the
    bimodal distribution typical of cache-served vs origin-served
    responses.
  </figcaption>
</figure>
```

### Numbered figure

```html
<figure class="vc-figure-numbered">
  <pre><code class="lang-sql">SELECT customer_id, count(*) FROM …</code></pre>
  <figcaption>
    The aggregation query that triggered the row-level lock
    contention.
  </figcaption>
</figure>
```

The caption renders as "Figure 3. The aggregation query …" (the
number auto-increments via the CSS counter; the agent doesn't
hand-write "Figure 3").

### Side-floated figure

```html
<figure class="vc-figure-side">
  <img src="/diagrams/cache-flow.svg" alt="Cache flow diagram">
  <figcaption>The 3-tier cache flow.</figcaption>
</figure>

<p>The body text wraps around the right-floated figure. The first
   line of this paragraph starts to the left of the figure, the
   second line continues, and so on …</p>
```

### Wide figure

```html
<figure class="vc-figure-wide vc-figure-numbered">
  <img src="/charts/architecture-overview.svg"
       alt="System architecture overview showing the API gateway,
            services, and data stores">
  <figcaption>
    The full system architecture as of 2026-04-12, with the new
    cache-aside pattern highlighted in clay.
  </figcaption>
</figure>
```

The figure extends to the full viewport width — used for hero charts
or detailed diagrams that don't fit in the body column.

## Tokens consumed / extended

- **Consumes:** `--vc-text-1`, `--vc-font-body`, `--vc-weight-label`,
  `--vc-weight-medium`.
- **Extends:** nothing. The `vc-figure` CSS counter is page-local
  (resets per page).

## Why italic caption

The italic captures the editorial convention — captions are
*meta-information* about the figure, not the figure itself. The
italic visually distinguishes the caption from the body prose so
the reader doesn't confuse it with narrative.

The `font-style: normal` override on `.vc-figure-numbered
figcaption::before` keeps the "Figure N." prefix UPRIGHT — the
number is a label, not a meta-comment, so it reads better non-italic.

## Why `opacity: 0.85` (not a colour)

The caption should be visually subordinate to the figure — slightly
dimmer than body text. The two ways to dim:

| Method | Effect | Light theme | Dark theme |
|---|---|---|---|
| `color: #666` | Hardcoded grey | Correct | Wrong (too light against dark bg) |
| `opacity: 0.85` | 85% blend with parent's bg | Correct | Correct |

`opacity` is theme-correct trivially — it dims by blending with
whatever the bg colour is. `color` would need theme-specific values.

## The CSS counter — `counter-increment` + `counter()`

The `.vc-figure-numbered` class uses a CSS counter:

```css
.vc-figure-numbered { counter-increment: vc-figure; }
.vc-figure-numbered figcaption::before {
  content: "Figure " counter(vc-figure) ". ";
}
```

The browser maintains a per-page integer counter `vc-figure` (named
arbitrarily — the typography skill defines the name). Each
`.vc-figure-numbered` increments it; the `::before` reads the value
and prepends "Figure N. " to the caption.

The counter resets per page automatically (each document load starts
at 0). To reset within a page (e.g. each chapter starts at Figure 1):

```css
article { counter-reset: vc-figure; }
```

The typography skill doesn't ship the reset rule — it's a per-document
decision. The default behaviour (counter persists across the whole
document) is correct for most use cases.

## Side-floated figures and body wrap

The `.vc-figure-side` class floats the figure to the right (or left
with `.vc-figure-left`). Body paragraphs WRAP around it via CSS
`float`.

This is a magazine convention. The body text reads top-down on the
unfloated side; once past the figure, the body returns to full
width.

The float is cleared automatically by the next block-level element
that has `clear: both` or that comes after the float ends. The
typography skill doesn't add `clear` to anything — the natural
block flow handles it.

For modern layouts that don't want body wrap (a clean column with the
figure as a sidebar), use CSS Grid via the `layout` skill instead of
`.vc-figure-side`.

## Wide figures and the `100vw` trick

```css
.vc-figure-wide {
  margin-left: calc(-1 * (100vw - 100%) / 2);
  margin-right: calc(-1 * (100vw - 100%) / 2);
}
```

This formula computes the difference between the viewport width
(`100vw`) and the parent's width (`100%`), divides by 2 to get the
margin needed on each side, and applies it as a negative margin.

The net effect: the `.vc-figure-wide` extends past its parent
container, all the way to the viewport edges.

The agent uses this for hero charts, full-bleed diagrams, and any
figure that wants to break out of the body column.

## Alt text — non-negotiable

Every `<img>` inside a `<figure>` MUST have an `alt` attribute:

```html
<img src="…" alt="Description of the image">
```

For decorative images, `alt=""` (empty, NOT missing) tells screen
readers to skip:

```html
<img src="ornament.svg" alt="">
```

The typography skill cannot enforce alt at the CSS level — the
agent provides it; the engine's audit can detect missing alt.

A `<figure>` without alt text on its `<img>` is broken for screen
reader users — the figure is announced as "image" with no
information.

## The `<picture>` element for responsive images

For images that need responsive variants (different formats, different
sizes per viewport):

```html
<figure>
  <picture>
    <source srcset="/charts/latency.avif" type="image/avif">
    <source srcset="/charts/latency.webp" type="image/webp">
    <img src="/charts/latency.png" alt="Latency distribution chart">
  </picture>
  <figcaption>Latency distribution.</figcaption>
</figure>
```

The browser picks the first `<source>` it supports. Typography
contract still applies to `<figure>` and `<figcaption>` unchanged.

## Light + dark — fully covered

The contract uses `opacity` (theme-correct), `var(--vc-*)` font /
size tokens (themed), no hardcoded `color`. Themed correctly.

## Selection-contract conformance

A `<figure>` is a typography atom — the `markTypographyAtoms` walker
SHOULD stamp it as `data-ve-type="type-figure"` (added to the SHAPE
table in the integration pass). The `<figcaption>` is part of the
`<figure>` atom (not separate); the decision-mini-pill anchors to
the figure as a whole.

## When NOT to wrap in `<figure>`

- An inline image in body prose (a small icon, an emoji) — use
  `<img>` directly; `<figure>` is for *referenceable* content.
- An image that's purely decorative — `<img>` directly with
  `alt=""`.
- A `<table>` that's structural data — `<table>` is its own
  semantic; `<figure>` would add a redundant layer.
- A chart that has no caption — `<figure>` without `<figcaption>` is
  technically valid but adds no semantic value over a bare `<img>` /
  `<svg>`.

The rule of thumb: if the content has a CAPTION, use `<figure>`.
If not, use the bare semantic element.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen page with at least one each: bare `<figure>`,
   `.vc-figure-numbered`, `.vc-figure-side`, `.vc-figure-wide`.
2. Confirm captions are italic, slightly dimmer than body.
3. Confirm numbered figures auto-increment ("Figure 1.", "Figure 2.").
4. Confirm side-floated figures wrap body text.
5. Confirm wide figures extend past the body column to the viewport
   edges.
6. Verify in both light + dark themes.
7. Test with a screen reader; confirm the figure + caption are
   announced together.

## Cross-references

- [semantic-hierarchy.md](./semantic-hierarchy.md) — the typography
  contract figures sit inside.
- [code-and-mono.md](./code-and-mono.md) — for `<pre>` figures.
- [spacing-and-vertical-rhythm.md](./spacing-and-vertical-rhythm.md)
  — the figure's 1.5em margin is the same family as paragraph
  spacing.
- `layout` skill — CSS Grid for figure positioning when floats are
  inappropriate.
- `charts-and-dashboards` skill — SVG charts go inside `<figure>`.
