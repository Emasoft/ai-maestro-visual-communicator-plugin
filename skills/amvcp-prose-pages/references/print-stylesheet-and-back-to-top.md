# Print stylesheet + back-to-top affordance

## Table of Contents

- [Why these matter](#why-these-matter)
- [Print stylesheet (already shipped)](#print-stylesheet-already-shipped)
- [Print: page numbering (optional)](#print-page-numbering-optional)
- [Print: cover page (optional)](#print-cover-page-optional)
- [Back-to-top affordance](#back-to-top-affordance)
- [Back-to-top runtime](#back-to-top-runtime)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition](#composition)
- [Anti-patterns](#anti-patterns)

Two cross-cutting affordances every long document needs: an
**`@media print`** stylesheet that flips the document to ink-on-paper
when the reader hits Cmd-P, and a **back-to-top** anchor link that
appears after the reader has scrolled past 1.5 viewport heights.

The print stylesheet is shipped by `amvcp-report-doc.js`'s injected
CSS by default — every `vc-doc` instance gets it. The back-to-top
link is opt-in (the runtime ships the CSS but not the runtime that
shows/hides the link).

## Why these matter

- **Print** — many engineering teams print PRDs, postmortems, RFCs,
  whitepapers for offline annotation. A document that prints
  poorly (giant headers per page, missing footer page numbers,
  black-on-black callouts) signals the author did not finish the
  job.
- **Back-to-top** — long documents (≥3 viewport heights) without a
  back-to-top link force the reader to scroll-spam to the top to
  re-read the TOC or the header. The cost is small (one DOM node,
  ~30 lines of CSS+JS) and the affordance is essential.

## Print stylesheet (already shipped)

Every `vc-doc` page automatically inherits this print stylesheet
from `amvcp-report-doc.js`'s `CSS_LINES`:

```css
@page { margin: 18mm 16mm; }

@media print {
  /* Flip the four color roles to print-safe ink-on-paper */
  .vc-doc {
    --vc-color-canvas:         #ffffff;
    --vc-color-surface:        #ffffff;
    --vc-color-surface-raised: #ffffff;
    --vc-color-surface-sunken: #ffffff;
    --vc-color-content:        #000000;
    --vc-color-border:         #999999;
    max-width: none;
    padding: 0;
    font-size: 10.5pt;
    line-height: 1.45;
  }

  /* Hide interactive chrome — buttons, modals, decision-minis */
  .ve-style-pad, .ve-comment-modal, .ve-hover-pill,
  .ve-decision, .ve-finding-thread, .ve-report-banner,
  .vc-back-to-top { display: none !important; }

  /* Headings stay with their first paragraph */
  .vc-doc h1, .vc-doc h2, .vc-doc h3, .vc-doc h4 {
    break-after: avoid; page-break-after: avoid;
  }
  .vc-doc p, .vc-doc li, .vc-doc blockquote {
    break-inside: avoid; page-break-inside: avoid;
    orphans: 3; widows: 3;
  }
  .vc-callout, .vc-rubric, .vc-figure,
  .vc-doc table, .vc-doc pre, .vc-metrics {
    break-inside: avoid; page-break-inside: avoid;
  }

  /* Expand collapsed <details> */
  .vc-doc details { border: none; }
  .vc-doc details > summary { display: none; }
  .vc-doc details > *:not(summary) { display: block !important; }

  /* Add URL after every external link */
  .vc-doc a[href]:not([href^="#"])::after {
    content: " (" attr(href) ")";
    font-size: 0.85em; color: #555555;
  }
  .vc-doc a {
    color: #000000;
    text-decoration: underline;
  }
}
```

The four color-role overrides flip EVERY component to ink-on-paper at
once — one source of truth. This is the **only sanctioned use of
hardcoded colors** in the whole skill.

The block also:

- Hides interactive chrome (decision-minis, comment buttons,
  back-to-top affordance) — none of it makes sense on paper.
- Expands collapsed `<details>` so all content prints.
- Adds the URL after external links so the reader can follow them
  later.
- Sets `orphans: 3` and `widows: 3` to avoid single-line orphans at
  page breaks.

## Print: page numbering (optional)

For documents that need page numbers, add to the page CSS:

```css
@page {
  margin: 18mm 16mm;
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
    font-family: Georgia, serif;
    font-size: 9pt;
    color: #666666;
  }
}
```

This is opt-in because Chromium / WebKit support `@page` margin boxes
inconsistently as of 2026. Test in the actual print preview, not just
the dev-tools "rendering: print" emulation.

## Print: cover page (optional)

For multi-page reports (whitepapers, postmortems), add a print-only
cover page that breaks immediately:

```css
@media print {
  .vc-doc-cover {
    display: block !important;  /* hidden in screen view */
    height: 100vh;
    page-break-after: always;
    text-align: center;
    padding-top: 30vh;
  }
  .vc-doc-cover h1 { font-size: 36pt; }
  .vc-doc-cover .vc-doc-byline { font-size: 11pt; }
}
.vc-doc-cover { display: none; }  /* hidden in screen view */
```

Then add the cover at the top of the document:

```html
<div class="vc-doc-cover">
  <h1>Authentication subsystem — postmortem</h1>
  <p class="vc-doc-byline">INC-2026-0412 · 2026-05-15 · @alice</p>
</div>
```

The cover prints as page 1; the body starts on page 2.

## Back-to-top affordance

A small floating link in the bottom-right corner that appears after
the reader has scrolled past 1.5 viewport heights.

```html
<a href="#top" class="vc-back-to-top" aria-label="Back to top">↑</a>
```

The `↑` is a Unicode upward arrow (U+2191) — see
`callout-admonition-blocks.md` for the no-emoji rule.

```css
.vc-back-to-top {
  position: fixed;
  bottom: var(--vc-space-5, 32px);
  inset-inline-end: var(--vc-space-5, 32px);
  display: none;  /* shown by JS on scroll */
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: var(--vc-color-surface, #ffffff);
  color: var(--vc-color-content, #1f1a14);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: 50%;
  font-size: var(--vc-text-3, 20px);
  text-decoration: none;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.vc-back-to-top.vc-back-to-top--visible {
  display: flex;
}
.vc-back-to-top:hover {
  background: var(--vc-color-accent, #b8861f);
  color: var(--vc-color-on-accent, #ffffff);
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .vc-back-to-top { transition: none; }
  .vc-back-to-top:hover { transform: none; }
}
```

## Back-to-top runtime

```js
(function () {
  const link = document.querySelector('.vc-back-to-top');
  if (!link) return;

  const SHOW_AFTER = 1.5;  // viewport heights

  function update() {
    const threshold = window.innerHeight * SHOW_AFTER;
    if (window.scrollY > threshold) {
      link.classList.add('vc-back-to-top--visible');
    } else {
      link.classList.remove('vc-back-to-top--visible');
    }
  }

  // Throttle to 60fps via rAF
  let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { update(); pending = false; });
  }, { passive: true });

  // Smooth scroll on click; respect reduced-motion
  link.addEventListener('click', e => {
    e.preventDefault();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: reduced ? 'auto' : 'smooth'
    });
  });

  update();  // initial state
})();
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-surface` | Back-to-top background (default) |
| `--vc-color-content` | Back-to-top arrow color |
| `--vc-color-border` | Back-to-top border |
| `--vc-color-accent` | Back-to-top hover background |
| `--vc-color-on-accent` | Back-to-top hover arrow color |
| `--vc-space-5` | Position offset from edges |
| `--vc-text-3` | Arrow size |

In print, the entire back-to-top is hidden via the `display: none
!important` rule in the print block.

## Composition

- **Every shape** SHOULD have the back-to-top link if the document
  is ≥3 viewport heights long. Skip for short docs (status report
  ≤1 page, ADR, TL;DR-only artifacts).
- **Every shape** GETS the print stylesheet automatically — no
  per-shape opt-in.
- **`incident-postmortem-shape`** is the most common shape printed
  for offline review; the cover-page pattern is most relevant
  there.

## Anti-patterns

- **Animated back-to-top button** — visual noise. Use a static
  affordance with a hover-lift only.
- **Back-to-top visible at scroll-Y = 0** — looks ridiculous when
  the user is already at the top. The `1.5 * vh` threshold is the
  sweet spot.
- **Back-to-top with text "Back to top"** — too much chrome. The
  arrow `↑` is enough; the `aria-label` carries the long form for
  screen readers.
- **`display: block` on print-only cover page in screen view** —
  cover is screen-hidden by default; the print block reveals it.
- **Hardcoded colors in the print block other than the four
  document-color overrides** — the print block is the *one* place
  hardcoded `#000000` / `#ffffff` is allowed; everywhere else is
  `--vc-*` tokens.
- **`break-inside: avoid` on body paragraphs** — paragraphs DO
  break inside; the rule is for `<p>` only as `orphans: 3` /
  `widows: 3` (don't leave 1-2 orphan lines).
- **Failing to expand `<details>` in print** — the print version
  loses the body content of every collapsed disclosure. The
  shipped print block expands them automatically.
- **External links printed without their URL** — the reader cannot
  follow them. The `a[href]:not([href^="#"])::after { content: "
  (" attr(href) ")" }` rule fixes this.
- **No `aria-label` on the back-to-top arrow** — screen-reader
  users hear "↑" with no context.
- **Smooth-scroll without the reduced-motion check** — fails Gate
  3 of the QA pipeline.
