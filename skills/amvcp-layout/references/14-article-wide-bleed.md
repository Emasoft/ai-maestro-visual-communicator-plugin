# 14 — `.la-article__wide` and `.la-article__bleed` — wide-content escape hatches

The two modifier classes on `.la-article` children that let wide
content (tables, code blocks, figures, hero images) extend past the
measured reading column without breaking the layout. Both are
solutions to the same fundamental problem — wide content in a
measured article — at two different widths.

## What this is

`.la-article` (ref 13) constrains children to a 68ch reading
column (`--la-measure`). For prose this is correct. But:

- A table with 7 columns or a code block with long lines does not
  fit 68ch comfortably.
- A figure with a caption benefits from a slightly wider canvas to
  show detail.
- A hero image / banner wants to extend edge-to-edge of the
  document.

The two escape hatches:

| Class | grid-column | max-inline-size | Use for |
|---|---|---|---|
| `.la-article__wide` | `1 / -1` | `--la-measure-wide` (92ch) | wider content that should still feel "part of the article" — tables, code blocks, figures with captions |
| `.la-article__bleed` | `1 / -1` | (none — full width) | full-width banners, hero images, dividers |

Both classes occupy all 3 columns of the article grid (gutters
included). `__wide` adds a `max-inline-size: 92ch` cap so the
content does not stretch infinitely on wide viewports; `__bleed`
has no cap and extends to the article's full width (which is the
document width minus the article's `padding-inline`, which is
typically zero, so effectively the viewport width).

## Scaffold to emit

A wide table:

```html
<article class="la-article">
  <p>Some prose introducing the table …</p>

  <figure class="la-article__wide" data-ve-id="figure-revenue" data-ve-type="section">
    <table>
      <thead>
        <tr>
          <th>Period</th>
          <th>Revenue</th>
          <th>Cost</th>
          <th>Margin</th>
          <th>Headcount</th>
          <th>Customers</th>
          <th>NPS</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Q1</td><td>$1.1M</td><td>$0.9M</td><td>18%</td><td>34</td><td>120</td><td>+42</td></tr>
        <tr><td>Q2</td><td>$1.3M</td><td>$1.0M</td><td>23%</td><td>38</td><td>140</td><td>+45</td></tr>
      </tbody>
    </table>
    <figcaption>Quarterly snapshot, FY2026.</figcaption>
  </figure>

  <p>Prose continues here, back in the measured column …</p>
</article>
```

A full-width hero banner:

```html
<article class="la-article">
  <img class="la-article__bleed"
       src="hero.jpg"
       alt="Project banner"
       data-ve-id="hero-banner"
       data-ve-type="section">

  <h1>Title</h1>
  <p>Article body in the measured column …</p>
</article>
```

A full-width divider between sections:

```html
<hr class="la-article__bleed" aria-hidden="true">
```

The CSS ships in `amvcp-layout.css`:

```css
.la-article__wide {
  grid-column: 1 / -1;
  max-inline-size: var(--la-measure-wide);
  margin-inline: auto;
}
.la-article__bleed { grid-column: 1 / -1; }
```

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type="section"`
  on hand-stamped figures (the SHAPES list does not include
  `figure` directly; the author's `data-ve-id` is the trigger).
- Tables inside the figure: the runtime's standard
  per-`<tr>` selection still applies; rows are selectable atoms.
  See ref 33.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-measure-wide` | 92ch | `.la-article__wide` cap |
| (none for `__bleed`) | — | the bleed class has no max-width |

## Selection / comment / decision-mini contract notes

A figure inside `.la-article__wide` (or `__bleed`) gets its own
`data-ve-id` from the author (the scaffold above does this), so
it's a selectable atom. The runtime renders its per-atom decision
pill via `_attachDecisionMiniSafe()` like any other atom.

A wide table's rows are independently selectable (the runtime
stamps `<tr>` with `data-ve-comment-id`); a reviewer can comment on
the whole figure ("this needs a chart instead") OR on a specific
row ("this number is wrong").

## When to use `__wide` vs `__bleed`

Use **`__wide`** when:
- The content is still semantically "part of the article" (a
  table presenting data the prose discusses, a code block
  illustrating a concept).
- A `max-inline-size: 92ch` cap improves readability (the eye
  can scan the row without re-focusing).
- The visual coherence with the article body matters more than
  edge-to-edge presentation.

Use **`__bleed`** when:
- The content is decorative or a visual divider (banners,
  full-bleed images, hero photos).
- The content is structurally "above" the article (a hero
  banner at the top).
- Edge-to-edge presentation IS the point.

If unsure, use `__wide`. Bleed is the louder choice; wide is the
quieter, more flexible default.

## Why a 92ch cap on `__wide`

Two reasons:
1. **Readability ceiling.** Tables / code blocks past 92ch start
   to feel ungainly on wide viewports — the eye saccade across a
   100ch row is uncomfortable. The cap is a soft ceiling.
2. **Visual anchor.** The wide content stays roughly "centred-ish"
   relative to the prose, giving the article a coherent silhouette.
   Without the cap, on a 1920px monitor the table would extend
   the full width while the prose stays at 68ch, producing a
   visually jarring shape.

If a downstream layout genuinely needs an UNCAPPED wide variant,
use `__bleed` instead.

## Why `margin-inline: auto` on `__wide`

The 3-column grid puts `__wide` in `1 / -1` (spanning everything),
but the `max-inline-size: 92ch` cap means the element is narrower
than the grid. `margin-inline: auto` centres the capped element
within the spanning columns. Without it, the element would left-
align under LTR and right-align under RTL — visually awkward.

## Visual verification

Run the universal self-debug checklist before claiming the wide
/ bleed escape hatches work — see `skills/amvcp-self-debug-rules/SKILL.md`.

For wide / bleed correctness specifically:

- Open dev-browser. Render an article with one `.la-article__wide`
  and one `.la-article__bleed` child. Measure their widths:
  ```js
  const article = document.querySelector('.la-article');
  const wide = article.querySelector('.la-article__wide');
  const bleed = article.querySelector('.la-article__bleed');
  console.log(
    'article=', article.getBoundingClientRect().width,
    'wide=', wide.getBoundingClientRect().width,
    'bleed=', bleed.getBoundingClientRect().width,
  );
  ```
  The bleed width should equal the article width.
  The wide width should be `min(article-width, 92ch * fontPx * 0.5)`.
  The article width should be the document/viewport width minus
  the document body's padding (typically 0 inside the article).
- **R1 — Light + dark themes**: switch themes; both classes
  must render identically in both. A bleed banner image needs
  light AND dark variants (use `<picture>` with `prefers-color-scheme`
  media queries) — never a single image that's "OK" in both.
- **R2 — No nested scrollbars**: this is THE rule the escape
  hatches solve. After adding a wide content, verify NO inner
  scrollbar appears anywhere. The document's outer scrollbar
  may extend (if the content is wider than the viewport), which
  is the correct behaviour.
- The "narrow viewport" check: at 320px viewport, both
  classes should occupy 100% width (the grid columns collapse
  via the `min(--la-measure, 100% - 2*--la-gutter)` clamp).
  Neither should overflow.
