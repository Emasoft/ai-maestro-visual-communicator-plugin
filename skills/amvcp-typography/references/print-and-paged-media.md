# Print and paged media — `@page`, page breaks, print stylesheets

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why `11pt` body and not a `var(--vc-text-2)`](#why-11pt-body-and-not-a-var--vc-text-2)
- [Why `1.5cm 1.5cm 2cm 1.5cm` margins](#why-15cm-15cm-2cm-15cm-margins)
- [Why `break-after: avoid` on headings](#why-break-after-avoid-on-headings)
- [Why show URLs for `<a href="http…">`](#why-show-urls-for-a-hrefhttp)
- [The `.vc-no-print` and `.vc-only-print` utilities](#the-vc-no-print-and-vc-only-print-utilities)
- [Forced page breaks](#forced-page-breaks)
- [Disabling animation on print](#disabling-animation-on-print)
- [Light + dark — N/A for print](#light--dark--na-for-print)
- [Browser support](#browser-support)
- [The runtime's print path](#the-runtimes-print-path)
- [Forbidden — inner scrollbars on print](#forbidden--inner-scrollbars-on-print)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to ship print CSS](#when-not-to-ship-print-css)
- [Verification](#verification)
- [Cross-references](#cross-references)

Pages destined for PDF export or paper printing need a separate
typography contract — print-specific sizes, page-break rules,
header/footer running content, no inner scrollbars, no animation.

This reference describes the typography skill's print contract: the
`@page` declarations, `break-*` properties, the print-friendly
font-size overrides, and the explicit "hide for print" / "show for
print" utility classes.

## What it is

Browsers render to two "media types":

| Media | Rendering | Used for |
|---|---|---|
| `screen` (default) | Pixels, on a viewport | Web pages |
| `print` | Pages, paginated | Browser print / Save-as-PDF, Puppeteer/Playwright PDF generation |

CSS lets stylesheets target each medium with `@media screen` /
`@media print`. The browser renders the page applying ONLY the rules
matching the current medium.

The typography skill's main CSS is medium-independent (the contract
works for both `screen` and `print`). The print-specific overrides
live in a `@media print { … }` block at the end of `amvcp-typography.css`.

## The contract

```css
@media print {
  /* Page setup — A4 portrait, 1.5cm margins. */
  @page {
    size: A4 portrait;
    margin: 1.5cm 1.5cm 2cm 1.5cm;     /* extra bottom for footer */
  }

  /* Switch the body to print-friendly settings. */
  body {
    /* Print body type is traditionally 11pt; the typography skill
       maps this onto --vc-text-2 by adjusting the base ratio in the
       calculator, but for an immediate fix the print-only declaration
       below pins the value. */
    font-size: 11pt;
    /* Black text on white background — the print convention. */
    color: black;
    background: white;
  }

  /* Headings should not be alone at the bottom of a page. */
  h1, h2, h3, h4, h5, h6,
  .vc-type-hero {
    break-after: avoid;
    break-inside: avoid;
  }

  /* A heading at the top of a page is fine. */
  h1, h2 {
    break-before: auto;
  }

  /* Avoid splitting a paragraph across a page boundary if it would
     leave fewer than 2 lines on either side. */
  p {
    widows: 2;
    orphans: 2;
  }

  /* Don't break inside a code block or a table. */
  pre,
  table,
  figure,
  blockquote {
    break-inside: avoid;
  }

  /* Show the URL after every external link — print needs the URL
     because the reader can't click. */
  a[href^="http"]::after,
  a[href^="https"]::after {
    content: " (" attr(href) ")";
    font-size: 0.85em;
    font-style: italic;
  }

  /* Don't show the URL for internal anchors (they're useless on
     paper). */
  a[href^="#"]::after {
    content: "";
  }

  /* Print-utility — hide on print only. */
  .vc-no-print { display: none !important; }

  /* Print-utility — show only on print. */
  .vc-only-print { display: block !important; }

  /* Force page break before / after. */
  .vc-page-break-before { break-before: page; }
  .vc-page-break-after  { break-after:  page; }

  /* Disable animation. */
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}

@media screen {
  .vc-only-print { display: none !important; }
}
```

## Scaffold

```html
<!-- A page that prints cleanly to PDF -->
<article>
  <h1>Annual Report</h1>
  <p class="vc-type-lead">…</p>

  <h2>Executive Summary</h2>
  <p>…</p>

  <!-- Hide the toolbar on print -->
  <nav class="vc-no-print">
    <a href="/dashboard">Back to dashboard</a>
  </nav>

  <!-- Show a header only on print -->
  <header class="vc-only-print">
    Annual Report 2026 · CONFIDENTIAL
  </header>

  <!-- Force a page break before a new section -->
  <h2 class="vc-page-break-before">Appendix A</h2>
  <p>…</p>
</article>
```

## Tokens consumed / extended

- **Consumes:** `--vc-text-2` (the body size; overridden to `11pt`
  for print).
- **Extends:** nothing.

## Why `11pt` body and not a `var(--vc-text-2)`

The screen typography is *responsive* — `--vc-text-2` is `clamp(14px,
0.88rem + 0.40vw, 16px)`. On print, there is no viewport `vw` —
the page is paged. `clamp` falls back to its `max` value (`16px`),
which is fine for screen but a touch too small for print.

Print convention is 10-12pt body. `11pt` is the editorial sweet
spot — comfortable to read on paper, fits 60-70 characters per line
on A4 with 1.5cm margins.

The pinning is print-only — the screen contract is unchanged.

## Why `1.5cm 1.5cm 2cm 1.5cm` margins

| Edge | Margin | Why |
|---|---|---|
| Top | 1.5cm | Standard editorial top margin. |
| Right | 1.5cm | Symmetric with left for centered text. |
| Bottom | 2cm | Slightly more — leaves room for a running footer (page number, date, signature line). |
| Left | 1.5cm | Same as right; could be increased for *binding margin* if the doc is printed double-sided and bound (use `@page :left` and `@page :right` for that). |

For a binding-aware double-sided document:

```css
@page :left  { margin: 1.5cm 1.5cm 2cm 2.5cm; }  /* extra left for binding */
@page :right { margin: 1.5cm 2.5cm 2cm 1.5cm; }  /* extra right for binding */
```

The typography skill ships the simpler single-margin version; the
agent extends per-page for binding-aware printing.

## Why `break-after: avoid` on headings

Without this rule, a heading at the bottom of a page can land alone,
with its paragraph starting on the next page. The reader's eye
crosses a page break in mid-section. `break-after: avoid` tells the
print engine: "if this heading would land alone, push it to the next
page along with its content".

This is the print analog of the multi-column `break-after: avoid`
rule (see [multi-column-layout.md](./multi-column-layout.md)).

## Why show URLs for `<a href="http…">`

On screen, the URL is one click away (the reader clicks the link).
On paper, the URL is unreachable unless printed. The standard print
convention is to render the URL in parentheses after the link text:

> See the typography reference (https://example.com/docs/typography).

The CSS `a[href^="http"]::after { content: " (" attr(href) ")"; }`
inserts the URL automatically.

For *internal* anchors (`<a href="#section">`) the URL is useless on
paper (no "back to section X" navigation), so the rule `a[href^="#"]::after
{ content: ""; }` suppresses the URL there.

## The `.vc-no-print` and `.vc-only-print` utilities

`.vc-no-print` is for:

- Navigation menus (the print reader can't click).
- "Skip to content" links (accessibility, screen-only).
- Cookie banners.
- Browser-specific UI affordances.
- Theme switchers.

`.vc-only-print` is for:

- Print-only headers (a "CONFIDENTIAL" watermark line).
- Print-only signatures / signature lines.
- Print-only running footers (handled by `@page @bottom-center` but
  fallback to a separate element on browsers without paged-media
  support).

## Forced page breaks

Sometimes the document structure demands a break — an Appendix
should start on a new page; a "Section 2" might want a clean break
from "Section 1".

| Class | Property | Effect |
|---|---|---|
| `.vc-page-break-before` | `break-before: page` | The element starts on a new page |
| `.vc-page-break-after` | `break-after: page` | A new page starts after the element |
| (none, default) | `break-before: auto` | The engine decides |

Use sparingly — too many forced breaks fragment the document, leaving
half-empty pages.

## Disabling animation on print

A page with CSS transitions / animations is print-rendered at the
"start" frame typically — which may render an animated element as
*invisible* (e.g. a fade-in transition starting at opacity:0).

The blanket `animation: none; transition: none` rule on print
disables both, so every animated element renders at its final
state.

The animation skill's `.vc-reduced-motion` toggle is a sibling
mechanism for the same problem on screen (when the user has
`prefers-reduced-motion: reduce`). The print rule is the always-on
version for print.

## Light + dark — N/A for print

Print is **always** light theme — black text on white paper. The
`color: black; background: white` rule forces this even if the
screen is in dark mode.

The user's browser may also have a "print with backgrounds" toggle —
some browsers DON'T print background colours by default (a
white-on-black layout would render as white-on-white, invisible).
The typography skill's print contract assumes the worst case — it
sets `color: black; background: white` explicitly to ensure print
always works.

## Browser support

- `@media print` — universal.
- `@page` — universal (the `size` and `margin` declarations).
- `break-before / -after / -inside` — universal (since 2020).
- `widows`, `orphans` — universal in print mode.
- `a[href^="http"]::after { content: attr(href) }` — universal.

For Puppeteer / Playwright PDF generation (the canonical "headless
browser → PDF" pipeline), the print contract is what the headless
browser applies when called with `page.pdf()`.

## The runtime's print path

The runtime currently does NOT ship a print contract — pages
print "raw" with browser defaults. Adopting this contract:

1. Append the `@media print { … }` block to `amvcp-typography.css`
   (this is the typography skill's build).
2. The runtime's pages automatically pick up the print contract via
   the inline `<style>` block.
3. The runtime needs no per-page changes.

The print contract is *additive* — it does not modify any existing
runtime rule.

## Forbidden — inner scrollbars on print

Print is the WORST place for inner scrollbars — the printed page
shows ONLY what's in the viewport, the rest is invisible. A `pre`
with `overflow-x: auto` prints with the visible portion only; the
overflow is lost.

The typography skill's `<pre>` contract already has NO `overflow`
rule (compliant with `no-nested-scrollbars.md`). For print, the
absence of inner scrollbars means: wide code blocks extend the
page, and the print engine wraps them onto multiple pages naturally.

## Selection-contract conformance

`.vc-no-print` / `.vc-only-print` / `.vc-page-break-*` are NOT atoms
— they are layout modifiers. The parent element's atom (a `<p>`, a
`<section>`, etc.) is the unit the decision-mini-pill anchors to.

## When NOT to ship print CSS

- A page that will *never* be printed (an embedded widget, a
  modal dialog, an admin panel) — print CSS is harmless but
  unnecessary.
- A page where the print rendering is handled by a separate tool
  (a server-side PDF generator that ignores browser CSS) — print
  CSS is then irrelevant.

The typography skill ships print CSS by default; the runtime opts
out per-page if needed (unlikely — print correctness is cheap).

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page.
2. Open the browser's print preview (Cmd+P / Ctrl+P).
3. Confirm: A4 portrait, 1.5cm margins, 11pt body text, headings
   don't land alone at the bottom of a page.
4. Confirm: `<a href="http…">` links show the URL in parentheses;
   `<a href="#…">` links do not.
5. Confirm: any `.vc-no-print` element is hidden; any `.vc-only-print`
   element is visible.
6. Save as PDF; open the PDF; confirm rendering matches the print
   preview.
7. Print-test for a long document with code blocks and tables —
   confirm `<pre>` and `<table>` do not split across pages.

## Cross-references

- [multi-column-layout.md](./multi-column-layout.md) — multi-column
  has its own widow/orphan rules; print interacts with both.
- [code-and-mono.md](./code-and-mono.md) — `<pre>` has no inner
  scrollbar by contract; print preserves this.
- [accessibility-and-screen-reader.md](./accessibility-and-screen-reader.md)
  — `prefers-reduced-motion` parallels the print animation
  disabling.
- `animation` skill — owns the on-screen reduced-motion gate; this
  reference is the print analog.
