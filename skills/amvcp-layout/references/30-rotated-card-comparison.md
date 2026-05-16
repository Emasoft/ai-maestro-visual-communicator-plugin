# 30 — Rotated card comparison (the "two paper" hero variant)

A decorative pattern from `index.html` of the html-effectiveness
demo set: two cards rotated at opposite angles (`-2.5deg` and
`+1.5deg`) overlap visually to suggest "two pieces of paper on a
desk". Common in marketing pages comparing Before/After or
"format A vs format B" — the markdown-vs-HTML rendering on the
gallery hero. Pure CSS, no JS, no images.

## What this is

A pair of `<article>` cards placed in a small grid, each rotated
to produce a "sketch / stack of paper" feel. The trick is to make
the cards LOOK like physical paper:
- Slight rotation (`-2.5deg` for the back card, `+1.5deg` for the
  front card).
- A small `translateY` to overlap them vertically.
- A drop shadow to suggest depth.
- Bold contrasting colours / typography to distinguish them.

The result is a visually striking hero that argues "here are two
different things, compare them" without text labels.

## Scaffold to emit

```html
<section class="vc-comparison-hero" data-ve-id="comparison-hero" data-ve-type="section">
  <article class="vc-comparison-card vc-comparison-card--md"
           data-ve-id="comparison-card-md" data-ve-type="card">
    <h2>Markdown</h2>
    <pre><code># Title
A paragraph.
- bullet
- bullet</code></pre>
  </article>

  <article class="vc-comparison-card vc-comparison-card--html"
           data-ve-id="comparison-card-html" data-ve-type="card">
    <h2>HTML</h2>
    <h1 style="font:24px Georgia">Title</h1>
    <p>A paragraph.</p>
    <ul><li>bullet</li><li>bullet</li></ul>
  </article>
</section>
```

The CSS is NOT in `amvcp-layout.css` (it's a downstream custom
layout); add to the consuming page:

```css
.vc-comparison-hero {
  display: grid;
  /* Two cards in a small grid, slightly overlapping. */
  grid-template-columns: 1fr 1fr;
  gap: var(--la-gap);
  padding: var(--la-gap-xl) var(--la-gutter);
  position: relative;
  isolation: isolate;
}

.vc-comparison-card {
  background: var(--vc-color-surface);
  color: var(--vc-color-content);
  border: 1px solid var(--vc-color-border);
  border-radius: var(--vc-radius-md);
  padding: var(--la-gap);
  box-shadow: var(--vc-shadow-3);
  /* The visual rotation + translate creates the "stacked paper" feel. */
}

.vc-comparison-card--md {
  transform: rotate(-2.5deg) translateY(6px);
  /* "Back" card — slightly rotated counterclockwise, dropped down 6px. */
  z-index: 1;
}

.vc-comparison-card--html {
  transform: rotate(1.5deg);
  /* "Front" card — slightly rotated clockwise, on top. */
  z-index: 2;
}

@media (max-width: 768px) {
  .vc-comparison-hero { grid-template-columns: 1fr; }
  .vc-comparison-card { transform: none; }
  /* On mobile, stack them straight — rotation doesn't read on small
     phones (the gimmick becomes confusing when the cards are full
     width). */
}
```

## The transform values are the gimmick

`rotate(-2.5deg)` and `rotate(+1.5deg)` are deliberately small —
NOT 5° or 10°. The slight tilt suggests "casual placement", not
"deliberate composition". Larger angles read as overly
art-directed and become annoying after the first glance.

The `translateY(6px)` on the back card simulates "the back paper
slipped down a bit", creating depth WITHOUT shadow tricks.

## The mobile-stack override

The rotation gimmick works at desktop widths where the cards have
room to overlap visually. At mobile (<768px), forcing two
rotated full-width cards stacks them awkwardly. The `@media
(max-width: 768px)` override:
- Collapses the grid to one column.
- Removes the rotation (`transform: none`).
- The cards become plain stacked cards.

## Lib functions called

- `markLayoutAtoms()` stamps `data-ve-id` / `data-ve-type="card"`
  on each `.vc-comparison-card`. Each card is a selectable atom.
- The `data-ve-type="section"` on the hero container also stamps
  the whole comparison as a section atom.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap` | 16px | gap between cards |
| `--la-gap-xl` | 64px | hero padding-block |
| `--la-gutter` | 32px | hero padding-inline |
| `--vc-color-surface` | (theme) | card background |
| `--vc-color-content` | (theme) | card text |
| `--vc-color-border` | (theme) | card border |
| `--vc-radius-md` | 8px | card corner |
| `--vc-shadow-3` | (theme) | card shadow |

## Selection / comment / decision-mini contract notes

Each card is a selectable atom (`card` type). The whole comparison
section is a selectable atom too (the author's hand-stamped
`data-ve-id` on the container).

A reviewer can:
- Comment on either individual card.
- Comment on the whole hero ("change the rotation angles").
- Comment on specific text inside via snippet selection.

The rotation does not affect the bubble handle positioning
(the runtime measures from the element's bounding rect, which
accounts for the transform).

## When to use this pattern

- A marketing landing page comparing two approaches.
- A gallery / index hero illustrating "Format A vs Format B".
- A presentation slide showing Before/After.

When NOT to use:
- A formal report (this is whimsical; a formal report wants
  conservative composition).
- A dashboard (the comparison takes vertical space and conveys no
  data).
- A documentation page (instructions need clear visual structure;
  rotation is distracting).

## Visual verification

Run the universal self-debug checklist before claiming the
comparison hero is correct — see
`skills/amvcp-self-debug-rules/SKILL.md`.

For rotated comparison correctness specifically:

- Open dev-browser. Verify the rotation:
  ```js
  const back = document.querySelector('.vc-comparison-card--md');
  console.log(getComputedStyle(back).transform);
  // Should be a matrix value representing rotate(-2.5deg) + translateY(6px).
  ```
- Verify the z-index stack (front card on top):
  ```js
  const front = document.querySelector('.vc-comparison-card--html');
  console.log(getComputedStyle(front).zIndex);  // 2
  console.log(getComputedStyle(back).zIndex);   // 1
  ```
- At mobile width (<768px), verify the cards stack without
  rotation:
  ```js
  // Set viewport to 600px
  console.log(getComputedStyle(back).transform);  // 'none'
  ```
- **R1 — Light + dark themes**: switch themes; both cards must
  use theme-appropriate colours.
- **R2 — No nested scrollbars**: neither card has `overflow:auto`
  — content inside (the code block, the rendered HTML) flows
  naturally. The rotation doesn't introduce overflow.
- **R5 — bubble handles**: hover over each card; the bubble
  handle should appear at the left edge (accounting for the
  rotation — the handle floats at the rotated bounding rect's
  left edge). If the handle appears in the wrong place, the
  runtime's measurement code may need to use
  `getBoundingClientRect()` (rotated) instead of `offsetWidth`
  (un-rotated).
- The "visual sanity" check: take a screenshot at desktop width;
  the two cards should overlap subtly, suggesting "two pieces of
  paper". If the cards look completely separate (no overlap), the
  `gap` between them is too large — reduce.
