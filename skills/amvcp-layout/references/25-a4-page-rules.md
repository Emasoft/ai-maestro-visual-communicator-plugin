# 25 — A4 page rules (`@page` size + margin for print / PDF)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [Why a hardcoded 16mm](#why-a-hardcoded-16mm)
- [When to override the default](#when-to-override-the-default)
- [Visual verification](#visual-verification)
- [The print-vs-screen mental shift](#the-print-vs-screen-mental-shift)
- [Common print pitfalls](#common-print-pitfalls)
- [Browser-specific print quirks](#browser-specific-print-quirks)
- [Generating PDFs programmatically](#generating-pdfs-programmatically)

The `@page` CSS at-rule controls the page box for paged media
(print, PDF export). The layout technique ships a single
`@page { size: A4; margin: 16mm }` declaration in
`amvcp-layout.css` to standardise the printed output on European
A4 paper with a comfortable 16mm margin (the canonical
business-document standard).

## What this is

`@page` is the at-rule for declaring properties on the printed
page itself — its size, its margins, its orientation. Unlike
viewport-based CSS (which describes the SCREEN), `@page` describes
the PHYSICAL PAPER. Browsers consult `@page` when:
- The user prints (Ctrl/Cmd+P).
- The user "Save as PDF" via the print dialog.
- A headless tool (Chrome's `--print-to-pdf`, Puppeteer's
  `page.pdf()`) renders the page.

The layout ships:

```css
@page { size: A4; margin: 16mm; }
```

- `size: A4` selects the A4 page size (210mm × 297mm portrait).
  Equivalent values: `Letter` (US 8.5"×11"), `Legal`, `A5`,
  `Tabloid`, or a custom `100mm 150mm`.
- `margin: 16mm` reserves 16mm of empty space on every edge of
  every page. The printable area is then 178mm × 265mm.

The 16mm figure is the canonical business-document margin — wide
enough to leave room for binding / hole-punches, narrow enough to
not waste paper. It is hardcoded as a literal because a print
margin is a PAPER quantity, not a screen spacing token — see
`amvcp-layout.css` lines 384-386:

> The @page margin `16mm` is a physical paper quantity — correct
> to hardcode. break-* (logical) is used over the legacy
> page-break-*.

## Scaffold to emit

The `@page` rule ships in `amvcp-layout.css` and applies to ANY
page that loads the stylesheet. Authors don't add it per-page; the
layout owns the print page box.

If a custom layout needs to override (e.g. letter-size for a US
audience), the author can ADD a more-specific declaration in
their page's `<style>`:

```css
@page { size: Letter; margin: 1in; }
```

The more-specific declaration wins. The layout's `@page` is the
default; authors override only when needed.

For landscape orientation:

```css
@page { size: A4 landscape; margin: 12mm; }
```

For a per-page-element rule (a specific landscape table on an
otherwise-portrait page):

```css
@page wide-table { size: A4 landscape; margin: 12mm; }
.la-table-wide { page: wide-table; break-before: page; }
```

(The `page` property on the element selects which `@page` rule to
use. This is rarely needed but useful for mixed-orientation docs.)

## Lib functions called

- None. `@page` is pure CSS, evaluated by the browser's print
  pipeline.
- The layout technique ships NO JS for print — print is the
  browser's job; the layout only provides the styling.

## DESIGN.md tokens used

- None directly. The `16mm` is a literal physical-paper quantity
  (see "Why hardcoded" below).
- The print pipeline still consumes `--vc-color-*` tokens (e.g.
  for `.la-card` backgrounds — see ref 26 for the
  `print-color-adjust: exact` rule that preserves them).
- The print pipeline forces the LIGHT theme by convention — emit
  `<html data-ve-theme="light">` for printed output. The DESIGN.md
  engine respects this and re-emits the light theme's `--vc-color-*`
  values, which the print pipeline then uses.

## Selection / comment / decision-mini contract notes

`@page` does not affect the selection model. Comments / decision
pills are SCREEN-only — they are not printed (the `.no-print`
class on the runtime's comment overlay hides them in print; see
ref 26).

A reviewer cannot "comment on the page size" — that's a layout
decision the author makes once. If the page is being printed
incorrectly, the reviewer comments on the article ("force
landscape" or "letter size for US market") and the author updates
the `@page` rule.

## Why a hardcoded 16mm

The DESIGN.md engine's spacing scale (`--vc-space-*`) is in PIXELS.
A 16mm margin in pixels would be `16mm = 60.48px` (at 96dpi
screen). But on PAPER, 16mm is 16mm regardless of dpi — pixel-based
tokens are the wrong unit for paper.

The browser auto-converts CSS `px` to physical units when printing
(96 CSS px = 1 inch), so a `padding: 64px` would print as
`64 / 96 = 0.667 inch = 16.9mm`. Close to 16mm, but the
conversion is implicit and fragile. Hardcoding `16mm` is explicit
and reliable.

If a future DESIGN.md schema adds a `print.margins` group, the
literal `16mm` could become `var(--vc-print-margin)`. Until then,
the literal is the right choice.

## When to override the default

- A US-market document: override to `Letter` size, `1in` margin.
- A booklet / pamphlet: override to `A5` size, narrower margin.
- A landscape table or chart-heavy report: override to A4 landscape.
- A poster: override to a custom size (e.g. `841mm 1189mm` for A0).

NEVER reduce the margin below `10mm` — printers reserve ~5-7mm of
non-printable edge by default, and many home / office printers
clip content within `8mm` of the edge.

NEVER set `margin: 0` — content will clip at the edge, and printers
will refuse to print right to the edge.

## Visual verification

Run the universal self-debug checklist before claiming the print
layout is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For `@page` correctness specifically:

- Open dev-browser. Use the print preview emulation:
  ```js
  // Chrome DevTools: emulate print
  // Via puppeteer / playwright: page.emulateMediaType('print');
  ```
  Then verify the layout reflows correctly for paper.
- Generate a PDF:
  ```js
  // Via puppeteer:
  await page.pdf({path: '/tmp/test.pdf', format: 'A4', margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' }});
  ```
  Open the PDF; verify the content fits within the A4 page box,
  no clipping, and the margins are ~16mm.
- The "page boundaries" check: insert long content (multi-page
  article); verify page breaks fall at sensible places (between
  sections, not mid-paragraph). See ref 27 for the page-break
  utilities that control this.
- **R1 — Light theme for print**: emit `<html data-ve-theme="light">`
  for the printed page. A deliberately-dark DESIGN.md (where the
  user explicitly wants a dark printed page) is respected, but
  the convention is light.
- **R2 — No nested scrollbars**: scrollbars are visual; on paper
  they don't appear. But the no-nested-scrollbars rule still
  matters for the screen version BEFORE printing — verify the
  screen version is clean, then print.

## The print-vs-screen mental shift

Print is a different medium from screen:
- **Fixed page size** — A4 is 210mm × 297mm, period. Content
  must FIT or be split across pages.
- **No scrolling** — the entire content must be visible (across
  potentially many pages); the user navigates by flipping
  pages.
- **No interaction** — buttons, toggles, hovers, clicks are
  meaningless on paper.
- **Ink cost matters** — backgrounds, decorative shadows,
  large coloured areas consume ink. The print reset (ref 26)
  drops decorative shadows for this reason.
- **Resolution is much higher** — 300dpi printer vs 96dpi
  screen. Vector graphics (SVG) render crisply; bitmap images
  may look pixellated.

Designing for print means thinking about page boundaries — see
ref 27 (`.la-break-*` utilities) for the explicit page-break
controls.

## Common print pitfalls

1. **Headings orphaned at page bottom.** A heading at the bottom
   of one page with its content on the next page reads as
   "what is this section?". Fixed by `h1, h2, h3 { break-after:
   avoid }` in the print reset (ref 26).
2. **Tables split awkwardly.** A table where rows 1-3 are on
   page 1 and rows 4-6 are on page 2 is hard to read. Fixed by
   `table { break-inside: avoid }` (ref 26 default).
3. **Backgrounds stripped.** Chrome strips backgrounds by
   default. Fixed by `* { print-color-adjust: exact }` (ref 26).
4. **Sticky elements floating on every page.** A `position:
   sticky` header without a print override appears at the top
   of every printed page. Fixed by `.la-header { position:
   static !important }` in `@media print` (ref 26).

The default print reset in `amvcp-layout.css` handles all four.

## Browser-specific print quirks

- **Chrome / Edge:** strict about `print-color-adjust`. Without
  it, backgrounds vanish.
- **Firefox:** more lenient — backgrounds usually preserved. But
  honours `print-color-adjust: exact` too.
- **Safari:** preserves backgrounds by default but is FRAGILE
  with grid layouts in print — sometimes a grid-positioned
  element appears in the wrong place. Test critical print
  layouts in Safari specifically.

The layout's print reset uses both `print-color-adjust: exact`
and `-webkit-print-color-adjust: exact` for cross-browser
coverage.

## Generating PDFs programmatically

For automated PDF generation (a build step that emits the
report's PDF version), use:

```bash
# Chrome headless
chrome --headless --disable-gpu \
  --print-to-pdf=/tmp/report.pdf \
  --no-pdf-header-footer \
  https://example.com/report.html

# Or via Puppeteer (Node.js)
node -e "
const p = require('puppeteer');
(async () => {
  const b = await p.launch();
  const page = await b.newPage();
  await page.goto('https://example.com/report.html');
  await page.pdf({path: '/tmp/report.pdf', format: 'A4',
                  printBackground: true,
                  margin: {top: '16mm', right: '16mm',
                           bottom: '16mm', left: '16mm'}});
  await b.close();
})();
"
```

The `--no-pdf-header-footer` flag (Chrome) or the absence of
`displayHeaderFooter: true` (Puppeteer) produces a clean PDF
with no page numbers in the margins. If page numbers are
needed, use the `@page` margin boxes (`@top-center`,
`@bottom-right`) — see Paged Media Module Level 3.
