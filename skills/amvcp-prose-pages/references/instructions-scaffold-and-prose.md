# Report-doc — scaffold + prose-page instructions

## Table of Contents

- [Scaffold a document](#scaffold-a-document)
- [Prose / article pages](#prose--article-pages)

The two authoring procedures of the `report-doc` skill, in order. Run
the scaffold steps to build the document shell, then the prose-page
steps when the body is long-form article content. (The third workflow,
running the QA pipeline, stays in SKILL.md.)

## Scaffold a document

1. **Pick a template** — `executive-summary`, `technical-report`,
   `case-study`, `proposal`, `whitepaper`, `design-system-doc`. Each
   is a `.vc-doc--<name>` modifier on `<article class="vc-doc">`.
   See [template-presets-six-shapes](template-presets-six-shapes.md) for the picker.
     > When to pick which template · What each template adds · Picking the right template — decision tree · Template stacking · Template + shape mapping · DESIGN.md tokens consumed · Composition · Lib API · Anti-patterns
2. **Pick a shape** — what KIND of deliverable is this? See the 15+
   shape references in `*-shape.md`. Each shape pins the
   section sequence and tells you which element skills to embed.
3. **Wrap the body** in `<article class="vc-doc vc-doc--<template>">`,
   with a `<header class="vc-doc-header">` carrying eyebrow + h1 +
   subtitle + byline. See
   [document-header-byline-subtitle](document-header-byline-subtitle.md).
     > When to add each element · Scaffold · CSS contract (already injected by the runtime) · The eyebrow's job · Title-writing discipline · Subtitle discipline · Byline discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
4. **Add structural blocks as needed** —
   `<aside class="vc-callout vc-callout--<variant>">`,
   `<table class="vc-rubric">`, `<blockquote class="vc-pullquote">`,
   `<div class="vc-metrics">`, `<aside class="vc-tldr">`,
   `<div class="vc-pill-row">`, etc. See the per-primitive
   references.
5. **Add a TOC** for documents with 4+ `<h2>` sections — see
   [toc-and-anchor-system](toc-and-anchor-system.md). The runtime auto-spies the
     > When to add a TOC · Scaffold (default — single-column doc) · CSS (already injected by the runtime) · The scroll-spy (already implemented in `init`) · Variants by layout · DESIGN.md tokens consumed · The heading-anchor offset · Composition with other skills · Lib functions called · Selection / comment notes · Anti-patterns
   active section.
6. **Load the runtime** — `<script src="amvcp-designmd.js"></script>`
   then `<script src="amvcp-report-doc.js"></script>`. The skill
   self-injects its CSS and wires the scroll-spy on
   `DOMContentLoaded` unless `window.__vcReportDocManualInit` is set.
7. **Always run the QA pipeline** before handing the page back — see
   [output-qa-pipeline-7-gates](output-qa-pipeline-7-gates.md).
     > When to run the QA pipeline · The 7 gates · Calling the pipeline · Gate output shape · The loop-detection (failedTwice) · DESIGN.md tokens consumed (by Gate 2) · Banned lists (Gates 6 + 7) · Lib API surface · Visual verification · Anti-patterns

## Prose / article pages

1. Wrap: `<article data-ve-prose>` with real `<h1>`/`<h2>`/`<h3>`/
   `<p>`. Never hand-number — `amvcp-runtime.js` assigns
   `1.2.1`-style ids automatically.
2. `<aside class="callout">` for tips; `<blockquote class="pullquote">`
   ≤1 per page. Sticky-TOC if 4+ sections.
3. Open: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py"
   page.html` to react to user selections.
4. Paragraph clicks → `kind:"element"`/`type:"paragraph"`. Text
   highlights → `kind:"text"` with `paragraphId` + surrounding
   text. See [prose-mode](prose-mode.md).
     > Paragraph numbering + text-snippet selection · Text-snippet selection · Why opt-in via `data-ve-prose` · Authoring rules for prose pages · Reference response patterns
