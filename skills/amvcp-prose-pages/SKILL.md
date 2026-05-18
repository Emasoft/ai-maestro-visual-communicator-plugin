---
name: amvcp-prose-pages
description: "Use when the user wants a written report, executive summary, technical writeup, case study, proposal, whitepaper, RFC, ADR, postmortem, status report, retrospective, design-system documentation, an essay or blog post with paragraph-numbered prose, OR asks to QA-check / verify / lint an already-generated visual page, OR asks 'which visual technique should I use'. Trigger with 'write a technical report', 'executive summary page', 'case study doc', 'proposal document', 'whitepaper', 'RFC', 'ADR', 'incident postmortem', 'status report', 'retrospective', 'PR writeup', 'PR review', 'architecture doc', 'feature explainer', 'concept explainer', 'compare options', 'design exploration', 'design-system documentation', 'essay with pull quotes', 'long-form article', 'render this README', 'paragraph-numbered prose', 'QA-check this page', 'verify the report', 'lint the HTML output', 'which visual technique should I use'."
license: MIT
metadata:
  author: Emasoft
---

# Report-doc — the cross-cutting non-element technique

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

This skill scaffolds long-form static documents (executive summary, technical report, case study, proposal, whitepaper, design-system doc, 15+ deliverable shapes) and runs the 7-gate QA pipeline that verifies any rendered page for nested scrollbars, WCAG AA contrast, prefers-reduced-motion, print CSS, semantic HTML, banned-color, and banned-font violations.

## What this skill does

`report-doc` is the visual-communicator plugin's **non-element,
cross-cutting** technique. Where the other 12 element skills
(charts, diagrams, tables, code-highlight, animation, typography,
layout, design-tokens, wireframe, slide-decks, interactive-controls,
modal-comments) each ship one kind of *content* primitive, this
skill ships:

1. **Document chrome** — header / byline / TOC / callouts / metrics /
   pull-quotes / footers / print stylesheet — that EVERY shape needs.
2. **15+ document shapes** — fixed section sequences for specific
   deliverable types (postmortem, RFC, status report, …) that
   compose with element skills.
3. **The 7-gate QA pipeline** (`runGates` / `runGatesOnHtml`) that
   verifies every rendered page across all skills against the
   plugin's correctness rules.

For interactive reply threads (per-finding chat boxes), reach for
the sibling `render-interactive-report.py` flow instead — that is a
different runtime.

## When to choose this category

The decision matrix for picking `report-doc` over the 12 element
skills:

| Job | Use this skill | Use a different skill |
|---|---|---|
| Long-form, mostly-static document with sections | YES | Per-element output → reach for the relevant element skill |
| Page-level structure (header, TOC, footer, print) | YES | Single primitive → element skill |
| Paragraph-numbered prose with selectable text snippets | YES (`data-ve-prose`) | Diagram-only / chart-only page → element skill |
| Verify any rendered page (nested-scroll, WCAG, banned-color, etc.) | YES (`runGates`) | (no other QA infrastructure exists in the plugin) |
| Pick a deliverable shape (postmortem, RFC, plan, …) | YES (15+ shapes) | One-shot quick figure → element skill |
| Cross-cutting compositional rules (max 3 fonts, max 4 colors, anti-slop) | YES | Skip — element skills assume these are already enforced |
| Document numbering (`01`, `02`, `03` decimal-leading-zero) | YES (whitepaper template) | Inline figure numbers → element skill |
| Decision-matrix routing ("which technique should I use?") | YES (request-routing-decision-tree) | Direct request for a known skill → that skill |

Quick mnemonic: **if the deliverable is a *page* the user reads
top-to-bottom**, you are in `report-doc` territory. If it is a
single *figure* embedded in someone else's page, you are in element-
skill territory.

## Architecture

```
amvcp-report-doc.js   — the runtime + injected CSS + 7-gate QA pipeline
                         (1538 LOC, dependency-free, dual-export
                          window.amvcpReportDoc + module.exports)

skills/amvcp-prose-pages/
├── SKILL.md           ← this file
└── references/        ← 37 progressive-discovery references
    ├── prose-mode.md                 — paragraph numbering + text snippets
    ├── responsive-nav.md             — sticky-TOC / scroll-spy / mobile bar
    │
    ├── DOCUMENT SHAPES (15+):
    ├── implementation-plan-shape.md
    ├── status-report-shape.md
    ├── incident-postmortem-shape.md
    ├── pr-review-reviewer-side-shape.md
    ├── pr-writeup-author-side-shape.md
    ├── architecture-explainer-shape.md
    ├── feature-explainer-shape.md
    ├── concept-explainer-shape.md
    ├── compare-n-approaches-shape.md
    ├── visual-design-exploration-shape.md
    ├── rfc-shape.md
    ├── adr-decision-log-shape.md
    ├── retrospective-shape.md
    ├── design-system-doc-shape.md
    ├── change-log-document-shape.md
    │
    ├── STRUCTURAL PRIMITIVES:
    ├── document-header-byline-subtitle.md
    ├── tldr-summary-card.md
    ├── callout-admonition-blocks.md
    ├── pull-quote-cap-one-per-page.md
    ├── metrics-stat-band.md
    ├── quality-rubric-scored-matrix.md
    ├── metadata-keypill-strip.md
    ├── timeline-typed-dots.md
    ├── action-items-checklist.md
    ├── glossary-and-hover-linked-terms.md
    ├── abstract-keywords-block.md
    ├── appendix-and-references-bibliography.md
    │
    ├── DOCUMENT CHROME:
    ├── toc-and-anchor-system.md
    ├── section-numbering-leading-zero.md
    ├── template-presets-six-shapes.md
    ├── print-stylesheet-and-back-to-top.md
    ├── provenance-footer-and-autopill.md
    │
    └── COMPOSITION + QA:
        ├── output-qa-pipeline-7-gates.md
        ├── request-routing-decision-tree.md
        └── composing-with-other-skills.md
```

## Prerequisites

- Browser + Python 3.12+ runner.
- `amvcp-designmd.js` (the DESIGN.md style engine) loaded — supplies
  the `--vc-*` color/typography/spacing/radius tokens.
- `amvcp-report-doc.js` ships beside the output HTML. Dependency-
  free, dual-export (browser global `window.amvcpReportDoc` + Node
  `module.exports` for a CLI `--qa` step).
- For prose pages, `amvcp-runtime.js` auto-handles paragraph
  numbering + text-snippet selection on `data-ve-prose`.

## Pick the right path

- **Static long-form document** → use the doc shell + a template
  (this skill). Then pick a specific shape from the 15+ in
  `references/*-shape.md`.
- **Interactive report with reply threads** →
  `render-interactive-report.py` (different runtime).
- **Verify an already-generated page** → run
  `runGates(document)` (browser) or `runGatesOnHtml(htmlText)`
  (Node CLI `--qa`). See [output-qa-pipeline-7-gates](references/output-qa-pipeline-7-gates.md).
    > When to run the QA pipeline · The 7 gates · Calling the pipeline · Gate output shape · The loop-detection (failedTwice) · DESIGN.md tokens consumed (by Gate 2) · Banned lists (Gates 6 + 7) · Lib API surface · Visual verification · Anti-patterns
- **Article / essay / README-as-page** → `<article data-ve-prose>`
  for auto numbering + selectable snippets. See
  [prose-mode](references/prose-mode.md).
    > Paragraph numbering + text-snippet selection · Text-snippet selection · Why opt-in via `data-ve-prose` · Authoring rules for prose pages · Reference response patterns
- **"Which technique should I use?"** → walk the decision tree in
  [request-routing-decision-tree](references/request-routing-decision-tree.md).
    > Top-level decision tree · Layering: shape × element skills · Decision matrix — when shapes overlap · The "5-layer infographic composition" mental model (OT-07) · Composition · Anti-patterns

## Instructions

The skill has three workflows. Run them in this order:

1. **Scaffold a document** — pick a template + shape, wrap the body in `<article class="vc-doc">`, add structural blocks (callouts, rubrics, pull-quotes, metrics, TLDR, pill rows), add a TOC if 4+ H2 sections, load the runtime. Full detail in the "Instructions — scaffold a document" subsection below.
2. **Write prose / article pages** — populate the scaffolded shell with content, applying the per-primitive references for callouts, blockquotes, code fences, image figures, etc. Full detail in the "Instructions — prose / article pages" subsection below.
3. **Run the QA pipeline** — the 7-gate quality check that ships with the skill. Verify each gate before handing the page back. Full detail in the "Instructions — run the QA pipeline" subsection below.

Start with "Pick the right path" above to confirm this is the right skill for the input; then proceed through steps 1-3 in order.

## Instructions — scaffold a document

1. **Pick a template** — `executive-summary`, `technical-report`,
   `case-study`, `proposal`, `whitepaper`, `design-system-doc`. Each
   is a `.vc-doc--<name>` modifier on `<article class="vc-doc">`.
   See [template-presets-six-shapes](references/template-presets-six-shapes.md) for the picker.
     > When to pick which template · What each template adds · Picking the right template — decision tree · Template stacking · Template + shape mapping · DESIGN.md tokens consumed · Composition · Lib API · Anti-patterns
2. **Pick a shape** — what KIND of deliverable is this? See the 15+
   shape references in `references/*-shape.md`. Each shape pins the
   section sequence and tells you which element skills to embed.
3. **Wrap the body** in `<article class="vc-doc vc-doc--<template>">`,
   with a `<header class="vc-doc-header">` carrying eyebrow + h1 +
   subtitle + byline. See
   [document-header-byline-subtitle](references/document-header-byline-subtitle.md).
     > When to add each element · Scaffold · CSS contract (already injected by the runtime) · The eyebrow's job · Title-writing discipline · Subtitle discipline · Byline discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
4. **Add structural blocks as needed** —
   `<aside class="vc-callout vc-callout--<variant>">`,
   `<table class="vc-rubric">`, `<blockquote class="vc-pullquote">`,
   `<div class="vc-metrics">`, `<aside class="vc-tldr">`,
   `<div class="vc-pill-row">`, etc. See the per-primitive
   references.
5. **Add a TOC** for documents with 4+ `<h2>` sections — see
   [toc-and-anchor-system](references/toc-and-anchor-system.md). The runtime auto-spies the
     > When to add a TOC · Scaffold (default — single-column doc) · CSS (already injected by the runtime) · The scroll-spy (already implemented in `init`) · Variants by layout · DESIGN.md tokens consumed · The heading-anchor offset · Composition with other skills · Lib functions called · Selection / comment notes · Anti-patterns
   active section.
6. **Load the runtime** — `<script src="amvcp-designmd.js"></script>`
   then `<script src="amvcp-report-doc.js"></script>`. The skill
   self-injects its CSS and wires the scroll-spy on
   `DOMContentLoaded` unless `window.__vcReportDocManualInit` is set.
7. **Always run the QA pipeline** before handing the page back — see
   [output-qa-pipeline-7-gates](references/output-qa-pipeline-7-gates.md).
     > When to run the QA pipeline · The 7 gates · Calling the pipeline · Gate output shape · The loop-detection (failedTwice) · DESIGN.md tokens consumed (by Gate 2) · Banned lists (Gates 6 + 7) · Lib API surface · Visual verification · Anti-patterns

## Instructions — prose / article pages

1. Wrap: `<article data-ve-prose>` with real `<h1>`/`<h2>`/`<h3>`/
   `<p>`. Never hand-number — `amvcp-runtime.js` assigns
   `1.2.1`-style ids automatically.
2. `<aside class="callout">` for tips; `<blockquote class="pullquote">`
   ≤1 per page. Sticky-TOC if 4+ sections.
3. Open: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py"
   page.html` to react to user selections.
4. Paragraph clicks → `kind:"element"`/`type:"paragraph"`. Text
   highlights → `kind:"text"` with `paragraphId` + surrounding
   text. See [prose-mode](references/prose-mode.md).
     > Paragraph numbering + text-snippet selection · Text-snippet selection · Why opt-in via `data-ve-prose` · Authoring rules for prose pages · Reference response patterns

## Instructions — run the QA pipeline

```js
// Browser — DOM mode (computed styles available, definitive verdicts)
const report = window.amvcpReportDoc.runGates(document, "page-id");

// Browser or Node — static mode (HTML string, regex / parsed-DESIGN.md)
const report = window.amvcpReportDoc.runGatesOnHtml(htmlText, "page-id");
```

Each report has shape `{ ok, mode, gates: [...], loop: { gate,
failedTwice } }`. `ok` is `true` iff every P1 gate PASSed. The 7
gates (P1 unless noted): `no-nested-scrollbars`, `wcag-contrast`,
`reduced-motion`, `print-css`, `semantic-html` (P2), `banned-color`,
`banned-font`. WARN-level results are advisory (static-mode
degradations); only a P1 FAIL flips `ok` to `false`.
`loop.failedTwice` becomes `true` on the second consecutive fail of
the same gate for the same `pageId` — escalate, do not auto-retry.

Full coverage: [output-qa-pipeline-7-gates](references/output-qa-pipeline-7-gates.md).
  > When to run the QA pipeline · The 7 gates · Calling the pipeline · Gate output shape · The loop-detection (failedTwice) · DESIGN.md tokens consumed (by Gate 2) · Banned lists (Gates 6 + 7) · Lib API surface · Visual verification · Anti-patterns

## Output

A self-contained HTML file: CSS injected by `amvcp-report-doc.js`
on boot, both runtimes shipped beside the file, no CDN, no build
step. Light + dark are both correct because every paint reads a
`--vc-*` token swapped by the engine. The print stylesheet flips
the four color roles to ink-on-paper (the only sanctioned hardcoded
colors in the skill) so Cmd-P yields a clean PDF without a separate
stylesheet.

For prose pages the selection payload is:

```json
{"kind":"text","text":"highlighted phrase","depth":3,
 "paragraphId":"1.2.1","paragraphText":"…surrounding…"}
```

QA reports are JSON — see [output-qa-pipeline-7-gates](references/output-qa-pipeline-7-gates.md).
  > When to run the QA pipeline · The 7 gates · Calling the pipeline · Gate output shape · The loop-detection (failedTwice) · DESIGN.md tokens consumed (by Gate 2) · Banned lists (Gates 6 + 7) · Lib API surface · Visual verification · Anti-patterns

## Composing with the 12 element skills

Every document shape composes with one or more element skills.
Quick map:

| Element skill | Embed in (typical shapes) |
|---|---|
| `amvcp-charts-and-dashboards` | status-report, implementation-plan, whitepaper |
| `amvcp-graph-diagrams` | architecture-explainer, rfc, postmortem, implementation-plan |
| `amvcp-diagram` | concept-explainer, postmortem (timeline), implementation-plan |
| `amvcp-tables` | postmortem (impact), pr-review (risk chips), feature-explainer (config) |
| `amvcp-code-highlight` | pr-writeup, pr-review, postmortem (root cause), feature-explainer |
| `amvcp-animation` | concept-explainer (state-change), feature-explainer (micro-interactions) |
| `amvcp-typography` | design-system-doc (type-scale rows), all shapes (eyebrow / pull-quote) |
| `amvcp-layout` | every shape (column grids, sidebar layouts) |
| `amvcp-design-tokens` | design-system-doc (rendered), every shape (consumed) |
| `amvcp-wireframe` | implementation-plan (paired mockups), visual-design-exploration (artboards) |
| `amvcp-slide-decks` | (separate runtime — pick slides OR a doc shape) |
| `amvcp-interactive-controls` | concept-explainer (sliders), retrospective (checkboxes), pr-writeup (test plan) |
| `amvcp-modal-comments` | every shape that supports decision-minis |

Full composition contract + interaction patterns:
[composing-with-other-skills](references/composing-with-other-skills.md).
  > The composition contract · The compatibility matrix · Worked example — `implementation-plan-shape` · Runtime interaction patterns · QA on composed pages · When NOT to compose · Anti-patterns

## Error Handling

- **Doc shell unstyled** → `amvcp-report-doc.js` not loaded; check
  the `<script>` tag and that `injectReportDocCSS(document)` was
  called (or that you did not opt out via
  `__vcReportDocManualInit` without re-injecting).
- **TOC links don't highlight** → no IntersectionObserver, OR the
  targets are missing ids. Links still work — only the active
  highlight degrades.
- **Callout colors look identical in both themes** → the engine
  isn't applying `--vc-color-*`; verify `amvcpDesignMd.applyTokens`
  ran.
- **QA gate WARNs in static mode that it cannot resolve tokens** →
  load `amvcp-designmd.js` so the static check can parse the
  embedded DESIGN.md.
- **`failedTwice` never flips** → you're calling `runGates` without
  a `pageId`, OR the call between fails passed; loop state keys on
  `pageId`.
- **Prose page numbering collides** → manual `data-ve-id` on `<p>`
  collides with auto `ve-para-X.Y.Z`. Drop the manual id.
- **Pull-quote fades into body** → cap at one per page; >1 loses
  impact.
- **Banned-font Gate 7 fails on the runtime's own default
  DESIGN.md** → known finding (Inter is on the banned list).
  Belongs to design-tokens reconciliation, not report-doc;
  report-doc's job is to *report*, not silently exempt.

## Examples

1. **Technical report** — `<article class="vc-doc vc-doc--technical-
   report">` with a `vc-doc-header`, four `<h2>` sections, two
   `<aside class="vc-callout vc-callout--warning">` blocks, one
   `<table class="vc-rubric">`. Run `runGates(document)` afterward —
   every P1 gate should PASS, ok:true.
2. **Whitepaper with auto-numbered sections** —
   `vc-doc--whitepaper` adds `01`, `02`, `03` leading-zero counters
   before each h2, decimal-leading-zero formatting, accent-color
   marker. The whole document fits in the 64ch reading measure the
   template sets via `--vc-doc-measure`. See
   [section-numbering-leading-zero](references/section-numbering-leading-zero.md).
     > When to use leading-zero numbering · The whitepaper template's auto-numbering · Cross-referencing by name, not number · Multi-level numbering (sections + subsections) · The standalone `vc-num` eyebrow (alternative) · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
3. **Incident postmortem** — `incident-postmortem-shape` over
   `vc-doc--technical-report`. SEV pill + slate TL;DR + typed-dot
   timeline + impact mini-table + action-items checklist + fixed-
   right TOC.
4. **Implementation plan** — `implementation-plan-shape` over
   `vc-doc--proposal`. 4-stat band → milestone timeline → data-flow
   SVG → paired mockups → 2-col code → risk table → open-questions
   callouts → provenance footer.
5. **Essay with selectable paragraphs** — `<article data-ve-prose>`;
   runtime auto-numbers; double-click insight →
   `{kind:"text", paragraphId:"2.1.3"}`.
6. **QA-only invocation** — agent inherited a generated HTML file
   from elsewhere. Load it in a browser, call
   `window.amvcpReportDoc.runGates(document, "inherited-1")` —
   every FAILing gate's `fixHint` tells you what to change.

## Visual verification

For visual verification (does the page actually look right in light
+ dark + print?), see [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).

## Modes

This skill supports `data-ve-mode="readonly"` (the default for prose/report pages — every paragraph is selectable for comment but no decision pill) and `data-ve-mode="choice"` / `single` / `multi` / `max-N` (when the report IS a list of decisions, e.g. a bug-triage list where each finding gets approve/skip/deny). Set the mode on the `<section data-ve-finding-id>` wrapper per finding, or on `<body>` for the whole report.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Prose pages typically embed diagrams, tables, code blocks, math, etc. via their respective skills. The only exclusive skill is the overlay-runtime (R24).

## Resources

The full 37-reference progressive-discovery index is grouped below by topic — document shapes, primitive blocks, prose-mode rules, QA pipeline, decision tree, and runtime APIs. Load only the reference whose title matches the current job.

### Document shapes (pick one per deliverable)

- [implementation-plan-shape](./references/implementation-plan-shape.md) — 8-section forward-looking plan
  > When to choose this shape · Section order (fixed — do not reorder) · Markdown scaffold · Lib functions called · DESIGN.md tokens consumed · Composition with the 12 element skills · Selection / comment notes · Decision-mini hook · Verification · Anti-patterns
- [status-report-shape](./references/status-report-shape.md) — recurring time-windowed retrospective summary
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The `.vc-metric--warn` modifier · The `vc-auto-pill` provenance pill · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [incident-postmortem-shape](./references/incident-postmortem-shape.md) — SEV / TL;DR / timeline / impact / actions
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The typed-dot timeline · The key/value pill (`vc-pill-k` + `vc-pill-v`) · The slate TL;DR variant · The fixed-right TOC · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [pr-review-reviewer-side-shape](./references/pr-review-reviewer-side-shape.md) — reviewer's writeup with risk chips
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The risk-chip navigator · The 3-column diff subgrid + comment bubble · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [pr-writeup-author-side-shape](./references/pr-writeup-author-side-shape.md) — author's writeup with rollout strip
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The before/after panel pair · The rollout strip (shared borders) · Reading-order file tour vs alphabetical · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [architecture-explainer-shape](./references/architecture-explainer-shape.md) — flow + walkthrough + sticky sidebar
  > When to choose this shape · Section order (fixed) · Layout — 2-column grid with sticky sidebar · Markdown scaffold · The hot-step modifier (`.vc-step--hot`) · The Gotchas panel (clay-bordered sidebar block) · Mutually-exclusive `<details>` (optional) · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [feature-explainer-shape](./references/feature-explainer-shape.md) — TOC + step-by-step + tabbed code + FAQ
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The "Files read" sidebar block · The tabbed code panel · The star callout · The FAQ `<dl>` block · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [concept-explainer-shape](./references/concept-explainer-shape.md) — interactive demo + comparison + glossary
  > When to choose this shape · Section order (fixed) · Layout — main column + sticky right glossary · Markdown scaffold · The interactive demo — slider → recompute → re-render · The hover-linked glossary · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [compare-n-approaches-shape](./references/compare-n-approaches-shape.md) — N columns + Pro/Con + recommendation
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The N-column grid · The Pro/Con sub-grid · The metric-chip strip · The recommendation card (clay left-border) · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [visual-design-exploration-shape](./references/visual-design-exploration-shape.md) — toolbar + artboards + rationale
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The light/dark toolbar switcher · The 2×2 artboard grid · The per-artboard "Risk:" line · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [rfc-shape](./references/rfc-shape.md) — Abstract / Context / Proposal / Alternatives / …
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The RFC status pill · The Alternatives section · The whitepaper template's auto-numbering · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [adr-decision-log-shape](./references/adr-decision-log-shape.md) — Nygard 4-section append-only
  > When to choose this shape · Section order (fixed — Nygard 2011 contract) · Markdown scaffold · The `.vc-adr` modifier · The Status pill — special behaviour · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [retrospective-shape](./references/retrospective-shape.md) — four-quadrant retro + action items
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The four-quadrant grid · The "extract action items from the quadrant" rule · The "follow-up to prior retro" section · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [design-system-doc-shape](./references/design-system-doc-shape.md) — living one-pager of the DESIGN.md
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The swatch grid · The type-scale row atom · The spacing ruler atom · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [change-log-document-shape](./references/change-log-document-shape.md) — versioned-document edit history
  > Overview · When to add a change log · Scaffold (canonical) · CSS contract · Reverse chronological order · Entry-content discipline · Initial-draft entry · When to roll a new version · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns

### Structural primitives (embed inside any shape)

- [document-header-byline-subtitle](./references/document-header-byline-subtitle.md) — eyebrow + h1 + subtitle + byline
  > When to add each element · Scaffold · CSS contract (already injected by the runtime) · The eyebrow's job · Title-writing discipline · Subtitle discipline · Byline discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
- [tldr-summary-card](./references/tldr-summary-card.md) — clay-border summary; slate variant for postmortems
  > When to add a TL;DR · Default scaffold (clay-border) · Slate-bg variant (postmortem / security advisory) · Word-count discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · Anti-patterns
- [callout-admonition-blocks](./references/callout-admonition-blocks.md) — 5 variants (tip / warning / info / note / danger)
  > When to use which variant · Scaffold (canonical) · CSS (already injected by the runtime) · DESIGN.md tokens consumed · Special variants (extensions beyond the 5 builtins) · Composition with other skills · Selection / comment notes · Decision-mini hook · QA notes · Anti-patterns
- [pull-quote-cap-one-per-page](./references/pull-quote-cap-one-per-page.md) — editorial pull-quote, default + display + epigraph
  > When to use a pull-quote · Scaffold · CSS (already injected by the runtime) · The "exactly one per page" rule · Variants · DESIGN.md tokens consumed · Composition with other shapes · Selection / comment notes · Anti-patterns
- [metrics-stat-band](./references/metrics-stat-band.md) — 3-5 stat cells with one-warn modifier
  > When to use a stat-band · Scaffold · CSS (already injected by the runtime) · The `--warn` modifier · Number formatting discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · Anti-patterns
- [quality-rubric-scored-matrix](./references/quality-rubric-scored-matrix.md) — N-row × scored-cell evaluation table
  > When to use · Scaffold (canonical /20 rubric) · CSS (already injected by the runtime) · Custom rubric scales · Runtime auto-sum (optional) · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [metadata-keypill-strip](./references/metadata-keypill-strip.md) — compact key/value pill row + status pills
  > When to use · Scaffold · CSS contract · Status-variant catalog · Severity-pill content discipline · Key/value content discipline · DESIGN.md tokens consumed · Composition with other shapes · Selection / comment notes · Decision-mini hook · Anti-patterns
- [timeline-typed-dots](./references/timeline-typed-dots.md) — vertical timeline; impact / detect / mitigated dots
  > When to use a timeline · Scaffold (incident timeline) · CSS contract · Dot-color semantics · Time-column conventions · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · Anti-patterns
- [action-items-checklist](./references/action-items-checklist.md) — owned + due-dated commitment register
  > When to use · Scaffold (canonical 4-column row) · CSS contract · State modifiers · Owner discipline · Due-date discipline · Composition · Lib hooks · DESIGN.md tokens consumed · Selection / comment notes · Decision-mini hook · Anti-patterns
- [glossary-and-hover-linked-terms](./references/glossary-and-hover-linked-terms.md) — `<dl>` + bidirectional hover-link
  > When to add a glossary · Scaffold — body markup · Scaffold — glossary block · CSS contract · The hover-link runtime · Click-to-jump variant · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · QA notes · Anti-patterns
- [abstract-keywords-block](./references/abstract-keywords-block.md) — formal-document opener (RFC / whitepaper)
  > When to use which · Scaffold · CSS contract · The IMRAD-like structure inside an abstract · Word-count discipline · Keyword discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
- [appendix-and-references-bibliography](./references/appendix-and-references-bibliography.md) — formal-document closer
  > When to add each · Appendix scaffold · CSS for appendices · References scaffold · CSS for references · Citation discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns

### Document chrome

- [prose-mode](./references/prose-mode.md) — `data-ve-prose` paragraph numbering + text-snippet selection
  > Paragraph numbering + text-snippet selection · Text-snippet selection · Why opt-in via `data-ve-prose` · Authoring rules for prose pages · Reference response patterns
- [responsive-nav](./references/responsive-nav.md) — sticky sidebar TOC + mobile horizontal bar
  > Layout Structure · CSS · JavaScript — Scroll Spy · Adaptation Notes
- [toc-and-anchor-system](./references/toc-and-anchor-system.md) — `vc-toc` + scroll-spy + heading-anchor offset
  > When to add a TOC · Scaffold (default — single-column doc) · CSS (already injected by the runtime) · The scroll-spy (already implemented in `init`) · Variants by layout · DESIGN.md tokens consumed · The heading-anchor offset · Composition with other skills · Lib functions called · Selection / comment notes · Anti-patterns
- [section-numbering-leading-zero](./references/section-numbering-leading-zero.md) — CSS-counter `01`, `02`, `03`
  > When to use leading-zero numbering · The whitepaper template's auto-numbering · Cross-referencing by name, not number · Multi-level numbering (sections + subsections) · The standalone `vc-num` eyebrow (alternative) · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
- [template-presets-six-shapes](./references/template-presets-six-shapes.md) — the 6 `vc-doc--<name>` modifiers
  > When to pick which template · What each template adds · Picking the right template — decision tree · Template stacking · Template + shape mapping · DESIGN.md tokens consumed · Composition · Lib API · Anti-patterns
- [print-stylesheet-and-back-to-top](./references/print-stylesheet-and-back-to-top.md) — print CSS + back-to-top affordance
  > Why these matter · Print stylesheet (already shipped) · Print: page numbering (optional) · Print: cover page (optional) · Back-to-top affordance · Back-to-top runtime · DESIGN.md tokens consumed · Composition · Anti-patterns
- [provenance-footer-and-autopill](./references/provenance-footer-and-autopill.md) — auto-pill + sources line + prompt box
  > When to add provenance markers · The auto-pill · The provenance footer · Files-read sidebar variant · The prompt box (provenance for one-shots) · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns

### Composition + QA

- [output-qa-pipeline-7-gates](./references/output-qa-pipeline-7-gates.md) — `runGates`, gate-by-gate reference
  > When to run the QA pipeline · The 7 gates · Calling the pipeline · Gate output shape · The loop-detection (failedTwice) · DESIGN.md tokens consumed (by Gate 2) · Banned lists (Gates 6 + 7) · Lib API surface · Visual verification · Anti-patterns
- [request-routing-decision-tree](./references/request-routing-decision-tree.md) — "which technique should I use?"
  > Top-level decision tree · Layering: shape × element skills · Decision matrix — when shapes overlap · The "5-layer infographic composition" mental model (OT-07) · Composition · Anti-patterns
- [composing-with-other-skills](./references/composing-with-other-skills.md) — embed contract + theme-swap propagation
  > The composition contract · The compatibility matrix · Worked example — `implementation-plan-shape` · Runtime interaction patterns · QA on composed pages · When NOT to compose · Anti-patterns

### Cross-cutting / shared

- [interactive-selection-base](../../references/interactive-selection-base.md) — wire format, depths 1-7
  > How it works & Page Setup · The selection payload · Selectable Elements · Engine routing — read this BEFORE generating a graph · Runtime & Process Caveats
- [css-patterns](../../references/css-patterns.md) — Prose Page Elements (lead, pullquote, callout)
  > Theme & Atmosphere · Layout & Containers · Visual Components · Prose Page Elements · Generated Images
- [styling-guide](../../references/styling-guide.md) — Editorial / Paper-ink directions
  > Aesthetic directions · Typography & Color · Surfaces, Hierarchy & Animation · Engines & Illustrations
- [libraries](../../references/libraries.md) — Typography by Voice
  > Mermaid.js — Diagramming Engine · Chart.js — Data Visualizations · anime.js — Orchestrated Animations · Google Fonts — Typography
- [diagram-types](../../references/diagram-types.md) — Prose Accent Elements
  > Diagrams (Mermaid + CSS) · Data Visualizations · Documentation Layouts · Prose Accent Elements
