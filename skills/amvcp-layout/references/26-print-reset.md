# 26 — Print reset (`@media print` block — hide chrome, preserve tokens)

The `@media print` block in `amvcp-layout.css` strips screen-only
chrome (navigation, sticky headers, toggle buttons), drops
shadows / decorative pseudo-layers (ink-expensive), flattens the
reading grid (a measure is pointless on a fixed A4 page), forces
`print-color-adjust: exact` (so token background tints survive into
the PDF), and adds orphan/widow controls. Together these form the
canonical "print-friendly" reset.

## What this is

When the browser switches from screen to paged-media (print
preview / Save as PDF), it APPLIES the `@media print` block in
addition to the regular CSS. Properties declared in `@media print`
WIN over the same selectors' screen properties because of
specificity (specifically: `@media print` and `@media screen` have
the same specificity, but the print rules come later in the
stylesheet).

The layout's print reset addresses 6 categories of issues:

1. **Hide screen-only chrome** — sticky headers, TOCs, IDE toggle
   buttons, runtime controls.
2. **Sticky → static** — `position: sticky` becomes invalid on
   paper (no scroll); force `position: static` so the header
   appears once at the top.
3. **Drop shadows + decorative pseudo-layers** — `box-shadow` and
   pseudo-element gradients (hero glows, ghost text) are
   ink-expensive AND fragile in print.
4. **Force token tints** — `print-color-adjust: exact` tells the
   browser to preserve all background colours and gradients (Chrome
   strips them by default for "ink saving").
5. **Flatten the reading grid** — `.la-article`'s 3-column grid
   becomes a single block; the measure is meaningless on a fixed
   A4 page.
6. **Orphan / widow control** — headings stay with their first
   paragraph (`break-after: avoid` on h1/h2/h3); figures/tables/
   code blocks stay whole (`break-inside: avoid`).

## The full print reset (from `amvcp-layout.css`)

```css
@media print {
  /* 1. Hide interactive / chrome surfaces — value-free on paper. */
  .no-print,
  .la-header,
  .la-toc,
  .la-ide-toggle { display: none !important; }

  /* 2. Sticky → static so it does not float onto every printed page. */
  .la-header { position: static !important; }

  /* 3. Drop shadows + decorative pseudo-layers — ink-expensive. */
  .la-card { box-shadow: none !important; }
  .la-hero::before,
  .la-hero::after { display: none !important; }

  /* 4. Honour token background tints in the PDF — without this Chrome
   *    strips them and token-coloured cards/callouts vanish on paper. */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* 5. Flatten the reading grid — a measured column is pointless on
   *    a fixed A4 page; let text fill the printable width. */
  .la-article { display: block; }
  .la-article > *,
  .la-article__wide,
  .la-article__bleed {
    grid-column: auto;
    max-inline-size: none;
  }

  /* 6. Orphan/widow control + keep figures whole. */
  h1, h2, h3 { break-after: avoid; }
  figure, pre, table, .la-card { break-inside: avoid; }

  /* 7. The cover should not also force 100dvh on paper. */
  .la-cover { min-block-size: auto; }
}
```

## The `.no-print` utility class

Apart from the standard layout primitives (`.la-header`, `.la-toc`,
`.la-ide-toggle`), authors can hide any element on print by adding
`.no-print`:

```html
<button class="no-print">Export to CSV</button>
<div class="no-print">Last updated: 2026-05-15 (dynamic)</div>
```

`.no-print` is `display: none !important` in print. Reserved for
elements that are CLEARLY screen-only — dynamic timestamps, action
buttons, interactive widgets.

## The `print-color-adjust: exact` rule

This is the most important — and least known — print CSS rule.
By default, Chrome / Edge / Safari STRIP background colours when
printing (to save ink). A `.la-card` with a tinted background
becomes a white card on paper.

`print-color-adjust: exact` (or the older webkit-prefixed
`-webkit-print-color-adjust: exact`) tells the browser:
"preserve all colour decisions, including backgrounds, gradients,
and images, when printing."

Apply universally (`* { … }`) because most layouts use multiple
classes with backgrounds, and forgetting one produces an
inconsistent printout.

The cost is more ink. The benefit is a printout that looks like
the screen version.

## Why `break-after: avoid` on headings

A heading at the bottom of one page, followed by its first
paragraph at the top of the next page, is the classic "orphan
heading" problem — the heading is visually disconnected from its
content. `break-after: avoid` on h1/h2/h3 tells the print engine
"don't break the page after this heading; push the heading to the
next page WITH its content."

`break-after: avoid-page` (more specific) is the modern variant;
`break-after: avoid` works for all break types and is the safer
default.

## Why `break-inside: avoid` on figures / tables / code blocks

A figure split across two pages (caption on one, image on the
next) is hard to read. `break-inside: avoid` keeps the whole
figure on one page. If the figure is too tall to fit a single
page, the browser may still split — but it tries hard not to.

For very tall content (a multi-page chart), the rule has no
effect — physics wins.

## Lib functions called

- None. Pure CSS.
- The browser's print pipeline evaluates `@media print`
  automatically when the user prints / saves as PDF.

## DESIGN.md tokens used

- All `--vc-color-*` tokens are preserved by
  `print-color-adjust: exact`.
- The print pipeline conventionally uses the LIGHT theme — emit
  `<html data-ve-theme="light">` for the print path. The DESIGN.md
  engine respects this and re-emits the light theme's tokens for
  print.

## Selection / comment / decision-mini contract notes

The runtime's comment / decision UI is screen-only. The standard
runtime CSS (`amvcp-runtime.js`) injects rules like:

```css
@media print {
  .ve-comment-bubble,
  .ve-decision-mini,
  .ve-handle { display: none !important; }
}
```

…so the printed PDF shows only the content, no UI chrome. The
LAYOUT technique's print reset handles its own primitives
(`.la-header`, `.la-toc`, etc.); the RUNTIME handles its own.

## When the print reset needs extension

Custom layouts that add their own chrome should also hide it on
print. Examples:

- A search bar: add `.no-print` to it.
- A theme toggle: add `.no-print`.
- A floating "Back to top" button: add `.no-print`.

If a custom layout adds a sticky bar like the ref 19 toolbar,
either add `.no-print` to it or extend the print reset with:

```css
@media print {
  .vc-playground__toolbar { position: static !important; }
}
```

## Visual verification

Run the universal self-debug checklist before claiming the print
reset works — see `skills/amvcp-self-debug-rules/SKILL.md`.

For print reset correctness specifically:

- Open dev-browser. Emulate print:
  ```js
  // Chrome DevTools "Rendering" panel: emulate CSS media type "print"
  ```
  Verify the page looks like the printed version: no sticky
  header, no TOC, no toggle buttons, no comment chrome, no
  decorative shadows.
- Generate a PDF (via Puppeteer / Playwright):
  ```js
  await page.pdf({ path: '/tmp/test.pdf', format: 'A4', printBackground: true });
  ```
  Note `printBackground: true` — equivalent to `print-color-adjust:
  exact`. Open the PDF; verify:
  - Tinted card backgrounds are preserved.
  - Page breaks fall at sensible places (between sections).
  - Headings stay with their first paragraph (no orphan
    headings).
  - Figures / tables are NOT split across pages.
- **R1 — Light theme for print**: emit
  `<html data-ve-theme="light">` for the print path. Verify the
  PDF uses the light theme's colours.
- **R2 — No nested scrollbars**: scrollbars don't print, but
  verify the screen version is clean before printing.
- The "long article" check: render a 20-page article; verify
  every page has consistent margins (16mm via `@page`),
  consistent typography, and no broken figures.
