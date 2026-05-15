---
name: amvcp-report-doc
description: "Scaffold a long-form static document (executive summary, technical report, case study, proposal, whitepaper, design-system doc) as a single-file DESIGN.md-themed HTML page; render callouts and scored rubrics; and run the Output QA pipeline that verifies any generated page for nested scrollbars, WCAG AA contrast, prefers-reduced-motion, print CSS, semantic HTML, and anti-slop colors/fonts. Use when the user wants a written report, executive summary, case study, proposal, whitepaper, design-system documentation, an essay or blog post with paragraph-numbered prose, or asks to QA-check / verify / lint an already-generated visual page. Trigger with 'write a technical report', 'executive summary page', 'case study doc', 'proposal document', 'whitepaper', 'design-system documentation', 'essay with pull quotes', 'long-form article', 'render this README', 'paragraph-numbered prose', 'QA-check this page', 'verify the report', 'lint the HTML output', 'which visual technique should I use'."
license: MIT
metadata:
  author: Emasoft
---

# Report-doc

## Overview

`report-doc` is the plugin's **non-element, cross-cutting** technique. It does two things no element skill does:

1. **Scaffold long-form, mostly-static documents** — executive summaries, technical reports, case studies, proposals, whitepapers, design-system docs. Six templates differ only in reading measure + (whitepaper) decimal-leading-zero section numbering; everything else (typography, color, spacing, callouts, rubrics, TOC) is shared and themed off `--vc-*` tokens. Also covers article-style prose pages — `<article data-ve-prose>` enables paragraph numbering (`1.2.1`), text-snippet selection, pull quotes, lead paragraphs, sticky-TOC.
2. **Verify the output of every other technique** — the **Output QA pipeline** (`runGates` / `runGatesOnHtml`). Closes the plugin's "rules stated but never verified" loop: 7 gates check no-nested-scrollbars, WCAG AA contrast, prefers-reduced-motion, print CSS, semantic HTML, banned-color, banned-font.

For interactive reply threads (per-finding chat boxes), reach for the sibling `render-interactive-report.py` flow instead — that is a different runtime.

## Prerequisites

- Browser + Python 3.12+ runner.
- `amvcp-designmd.js` (the DESIGN.md style engine) loaded — supplies the `--vc-*` color/typography/spacing/radius tokens.
- `amvcp-report-doc.js` ships beside the output HTML. It is dependency-free, dual-export (browser global `window.amvcpReportDoc` + Node `module.exports` for a CLI `--qa` step).
- For prose pages, `amvcp-runtime.js` auto-handles paragraph numbering + text-snippet selection on `data-ve-prose`.

## Pick the right path

- **Static document** → use the doc shell + a template (this skill).
- **Interactive report with reply threads** → `render-interactive-report.py`.
- **Verify an already-generated page** → run `runGates(document)` (browser) or `runGatesOnHtml(htmlText)` (Node CLI `--qa`).
- **Article / essay / README-as-page** → `<article data-ve-prose>` for auto numbering + selectable snippets.

## Instructions — scaffold a document

1. **Pick a template** — `executive-summary`, `technical-report`, `case-study`, `proposal`, `whitepaper`, or `design-system-doc`. Each is a `.vc-doc--<name>` modifier on `<article class="vc-doc">`.
2. **Wrap the body** in `<article class="vc-doc vc-doc--<template>">`, with a `<header class="vc-doc-header">` carrying a real `<h1>`, optional `<p class="vc-doc-subtitle">`, and `<p class="vc-doc-byline">`. Real `<h2>`/`<h3>` for sections — never hand-number; the whitepaper template auto-numbers via CSS counters.
3. **Add structural blocks as needed** — `<aside class="vc-callout vc-callout--<variant>">` (variants: `tip`, `warning`, `info`, `note`, `danger`); `<table class="vc-rubric">` for scored matrices; `<blockquote class="vc-pullquote">` for case-study / whitepaper highlights (cap at one per page); `<div class="vc-metrics">` containing `<div class="vc-metric">` blocks for hero numbers.
4. **TOC** — for documents with 4+ `<h2>` sections, add a `<nav class="vc-toc">` with an `<ol>` of anchor links. The runtime's TOC scroll-spy adds `.vc-toc-active` to the link of whichever section is in view; degrades to plain links with no IntersectionObserver.
5. **Load the runtime** — `<script src="amvcp-designmd.js"></script>` then `<script src="amvcp-report-doc.js"></script>`. The skill self-injects its CSS and wires the scroll-spy on `DOMContentLoaded` unless `window.__vcReportDocManualInit` is set.
6. **Always run the QA pipeline** before handing the page back — see below.

## Instructions — prose / article pages

1. Wrap: `<article data-ve-prose>` with real `<h1>`/`<h2>`/`<h3>`/`<p>`. Never hand-number — `amvcp-runtime.js` assigns `1.2.1`-style ids automatically.
2. `<aside class="callout">` for tips; `<blockquote class="pullquote">` ≤1 per page. Sticky-TOC if 4+ sections.
3. Open: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" page.html` to react to user selections.
4. Paragraph clicks → `kind:"element"`/`type:"paragraph"`. Text highlights → `kind:"text"` with `paragraphId` + surrounding text.

## Instructions — run the QA pipeline

```js
// Browser — DOM mode (computed styles available, definitive verdicts).
const report = window.amvcpReportDoc.runGates(document, "page-id");

// Browser or Node — static mode (HTML string, regex / parsed-DESIGN.md).
const report = window.amvcpReportDoc.runGatesOnHtml(htmlText, "page-id");
```

Each report has shape `{ ok, mode, gates: [...], loop: { gate, failedTwice } }`. `ok` is `true` iff every P1 gate PASSed. The 7 gates (P1 unless noted): `no-nested-scrollbars`, `wcag-contrast`, `reduced-motion`, `print-css`, `semantic-html` (P2), `banned-color`, `banned-font`. WARN-level results are advisory (static-mode degradations); only a P1 FAIL flips `ok` to `false`. `loop.failedTwice` becomes `true` on the second consecutive fail of the same gate for the same `pageId` — escalate, do not auto-retry.

## Output

A self-contained HTML file: CSS injected by `amvcp-report-doc.js` on boot, both runtimes shipped beside the file, no CDN, no build step. Light + dark are both correct because every paint reads a `--vc-*` token swapped by the engine. The print stylesheet flips the four color roles to ink-on-paper (the only sanctioned hardcoded colors in the skill) so Cmd-P yields a clean PDF without a separate stylesheet.

For prose pages the selection payload is:

```json
{"kind":"text","text":"highlighted phrase","depth":3,
 "paragraphId":"1.2.1","paragraphText":"…surrounding…"}
```

QA reports are JSON — see the API call above.

## Error Handling

- **Doc shell unstyled** → `amvcp-report-doc.js` not loaded; check the `<script>` tag and that `injectReportDocCSS(document)` was called (or that you did not opt out via `__vcReportDocManualInit` without re-injecting).
- **TOC links don't highlight** → no IntersectionObserver, OR the targets are missing ids. Links still work — only the active highlight degrades.
- **Callout colors look identical in both themes** → the engine isn't applying `--vc-color-*`; verify `amvcpDesignMd.applyTokens` ran.
- **QA gate WARNs in static mode that it cannot resolve tokens** → load `amvcp-designmd.js` so the static check can parse the embedded DESIGN.md.
- **`failedTwice` never flips** → you're calling `runGates` without a `pageId`, OR the call between fails passed; loop state keys on `pageId`.
- **Prose page numbering collides** → manual `data-ve-id` on `<p>` collides with auto `ve-para-X.Y.Z`. Drop the manual id.
- **Pull-quote fades into body** → cap at one per page; >1 loses impact.
- **Banned-font Gate 7 fails on the runtime's own default DESIGN.md** → known finding (Inter is on the banned list). Belongs to design-tokens reconciliation, not report-doc; report-doc's job is to *report*, not silently exempt.

## Examples

1. **Technical report** — `<article class="vc-doc vc-doc--technical-report">` with a `vc-doc-header`, four `<h2>` sections, two `<aside class="vc-callout vc-callout--warning">` blocks, one `<table class="vc-rubric">`. Run `runGates(document)` afterward — every P1 gate should PASS, ok:true.
2. **Whitepaper with auto-numbered sections** — `vc-doc--whitepaper` adds `01`, `02`, `03` leading-zero counters before each `h2`, decimal-leading-zero formatting, accent-color marker. The whole document fits in the 64ch reading measure the template sets via `--vc-doc-measure`.
3. **Essay with selectable paragraphs** — `<article data-ve-prose>`; runtime auto-numbers; double-click insight → `{kind:"text", paragraphId:"2.1.3"}`.
4. **QA-only invocation** — agent inherited a generated HTML file from elsewhere. Load it in a browser, call `window.amvcpReportDoc.runGates(document, "inherited-1")` — every FAILing gate's `fixHint` tells you what to change.

## Resources

- [prose-mode](./references/prose-mode.md) — paragraph numbering, snippet wire format, text-selection rules
- [responsive-nav](./references/responsive-nav.md) — sticky-TOC, scroll-spy, mobile bar
- [interactive-selection-base](../../references/interactive-selection-base.md) — wire format, depths 1-7
- [css-patterns](../../references/css-patterns.md) — Prose Page Elements (lead, pullquote, callout)
- [styling-guide](../../references/styling-guide.md) — Editorial / Paper-ink directions
- [libraries](../../references/libraries.md) — Typography by Voice
- [diagram-types](../../references/diagram-types.md) — Prose Accent Elements
