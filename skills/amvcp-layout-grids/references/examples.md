# Examples

Input: user asks for a content+sidebar article page with a sticky sidebar TOC.
Output: a `.la-grid--2-1` wrapping the `.la-article` body + a sticky sidebar:

```html
<div class="la-grid--2-1" data-ve-id="page">
  <article class="la-article" data-ve-id="body">
    <h1>Title</h1>
    <p>The lead paragraph…</p>
    <figure class="la-article__wide" data-ve-id="chart">
      <img src="chart.png" alt="…">
    </figure>
  </article>
  <aside data-ve-id="sidebar" style="align-self: start; position: sticky; inset-block-start: var(--la-space-3);">
    <nav class="la-toc">…</nav>
  </aside>
</div>
```

More examples:

- A long-form article: `.la-article` (3-col grid) with `.la-article__wide` for a chart and `.la-article__bleed` for a full-bleed hero image.
- A magazine cardrow: `.la-cardrow` of 3 `.la-card`s using subgrid to align titles, bodies, and footers across cards.
- A gallery: `auto-fill` grid with `minmax(min(316px, 100%), 1fr)` — reflows naturally from many-across to one-across on phones.
- An RTL article (Arabic): same scaffold, just `dir="rtl"` on the root — every logical property mirrors automatically.
