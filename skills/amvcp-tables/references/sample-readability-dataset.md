# Sample — readability anti-pattern → fix dataset

A ready paste-in 15-row dataset for a 2-column `compare` table. Each row
pairs a common prose-readability **anti-pattern** with the **CSS fix**.
The "Fixed" column carries `data-ve-col-emphasis="1"` so it reads as the
recommended lane. This is **bundled sample content — no code**; it
doubles as a self-check an author can read while building a prose page.

## Table of contents

- [The paste-in table](#the-paste-in-table)
- [Why each fix](#why-each-fix)

---

## The paste-in table

```html
<table data-ve-table="compare" data-ve-table-csv="1"
       data-ve-label="Prose readability — anti-patterns and fixes">
  <thead>
    <tr>
      <th scope="col">Aspect</th>
      <th scope="col" data-ve-col-icon="○">Anti-pattern</th>
      <th scope="col" data-ve-col-icon="◆" data-ve-col-emphasis="1">Fixed</th>
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">Line length</th>
        <td><code>width: 100%</code> on a prose column</td>
        <td><code>max-width: 65ch; margin-inline: auto</code></td></tr>
    <tr><th scope="row">Text alignment</th>
        <td><code>text-align: justify</code> (rivers of whitespace)</td>
        <td><code>text-align: start</code></td></tr>
    <tr><th scope="row">Line height</th>
        <td>no <code>line-height</code> control (browser default 1.2)</td>
        <td><code>line-height: 1.5</code> for body copy</td></tr>
    <tr><th scope="row">Font size</th>
        <td>body text below <code>16px</code></td>
        <td><code>16px</code>–<code>18px</code> base size</td></tr>
    <tr><th scope="row">Paragraph spacing</th>
        <td>only a first-line indent, no gap</td>
        <td><code>margin-block</code> rhythm between paragraphs</td></tr>
    <tr><th scope="row">Contrast</th>
        <td>light-grey text on white (fails WCAG AA)</td>
        <td>≥ 4.5:1 contrast ratio for body text</td></tr>
    <tr><th scope="row">Hyphenation</th>
        <td>forced <code>hyphens: auto</code> on short columns</td>
        <td><code>hyphens: manual</code>; rely on wrapping</td></tr>
    <tr><th scope="row">Font weight</th>
        <td>thin weights (100–200) for body copy</td>
        <td><code>400</code> regular for body, weight for emphasis</td></tr>
    <tr><th scope="row">All caps</th>
        <td>long runs of <code>text-transform: uppercase</code></td>
        <td>sentence case; caps only for short labels</td></tr>
    <tr><th scope="row">Letter spacing</th>
        <td>negative <code>letter-spacing</code> on body text</td>
        <td>default tracking; positive only for caps</td></tr>
    <tr><th scope="row">Link styling</th>
        <td>color-only links (invisible to color-blind readers)</td>
        <td>underline + color for links in prose</td></tr>
    <tr><th scope="row">Heading hierarchy</th>
        <td>headings sized by <code>&lt;h1&gt;</code>…<code>&lt;h6&gt;</code> tag only, no scale</td>
        <td>a deliberate modular type scale</td></tr>
    <tr><th scope="row">Widows / orphans</th>
        <td>single-word last lines, stranded headings</td>
        <td><code>text-wrap: pretty</code>; <code>break-after</code> control</td></tr>
    <tr><th scope="row">Viewport units</th>
        <td><code>font-size</code> in raw <code>vw</code> (unreadable when zoomed)</td>
        <td><code>clamp()</code> with a <code>rem</code> floor + ceiling</td></tr>
    <tr><th scope="row">Reading flow</th>
        <td>multi-column layout that forces vertical ping-pong</td>
        <td>a single column for long-form reading</td></tr>
  </tbody>
</table>
```

Open the file with `amvcp-tables.js` loaded — the module renders the
icon headers, tints the "Fixed" column as an accent lane, and (because
`data-ve-table-csv="1"` is set) injects a Copy-CSV button.

---

## Why each fix

- **Line length** — 45–75 characters per line is the readable range;
  `width:100%` on a wide viewport produces 150+ char lines the eye
  cannot track back from. `65ch` is a safe target.
- **Text alignment** — justification on a narrow column opens "rivers"
  of whitespace; `start` keeps an even left edge and a natural ragged
  right.
- **Line height** — the browser default (~1.2) crowds descenders into
  the next line's ascenders; `1.5` gives body copy breathing room.
- **Font size** — below 16px, body copy strains most readers and many
  mobile browsers auto-zoom anyway.
- **Contrast** — light-grey-on-white commonly falls below the WCAG AA
  4.5:1 ratio; the text is technically visible but tiring.
- **Viewport units** — raw `vw` font sizing ignores the user's zoom and
  becomes unreadable; `clamp()` with a `rem` floor respects it.
- **Reading flow** — newspaper-style multi-column layout forces the eye
  to jump up after each short column; one column is correct for
  long-form reading on screen.

The rest follow the same principle: defaults and restraint beat
aggressive typographic control for body copy. Caps, thin weights,
negative tracking and forced hyphenation all read fine on a short label
and badly across a paragraph.
