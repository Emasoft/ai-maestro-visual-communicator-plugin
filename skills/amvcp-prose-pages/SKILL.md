---
name: amvcp-prose-pages
description: "Use when the user wants a written report, executive summary, technical writeup, case study, proposal, whitepaper, RFC, ADR, postmortem, status report, retrospective, design-system doc, essay, or to QA-check / verify / lint an already-generated visual page. Trigger with 'technical report', 'executive summary', 'case study', 'whitepaper', 'RFC', 'ADR', 'postmortem', 'status report', 'retrospective', 'PR writeup', 'feature explainer', 'long-form article', 'render this README', 'QA-check page'."
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

`amvcp-report-doc.js` is the runtime (1538 LOC, dependency-free,
dual-export `window.amvcpReportDoc` + `module.exports`): injected CSS
+ the 7-gate QA pipeline. The skill body is `SKILL.md`; the 37
progressive-discovery references (document shapes, structural
primitives, document chrome, composition + QA) are catalogued in the
[resources-index](references/resources-index.md) — see the "Resources"
section below for the full embedded TOC.

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

## Instructions — scaffold a document, write prose

Steps 1 (scaffold a document — pick template, pick shape, wrap body,
add structural blocks, add a TOC, load the runtime, run QA) and 2
(write prose / article pages — `data-ve-prose`, callouts, the
`amvcp-select.py` round-trip, paragraph vs text selection) are in
[instructions-scaffold-and-prose](references/instructions-scaffold-and-prose.md).
  > Scaffold a document · Prose / article pages

## Instructions — run the QA pipeline

Call `window.amvcpReportDoc.runGates(document, "page-id")` (browser
DOM mode, definitive verdicts) or `runGatesOnHtml(htmlText, "page-id")`
(static mode). The report is `{ ok, mode, gates, loop: { gate,
failedTwice } }`; `ok` is `true` iff every P1 gate PASSed.
`loop.failedTwice` flips on the second consecutive fail of the same
gate for the same `pageId` — escalate, do not auto-retry. Full call
signatures, the 7 gates, gate output shape, banned lists, and the
loop-detection contract are in
[output-qa-pipeline-7-gates](references/output-qa-pipeline-7-gates.md).
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

Failure modes (doc shell unstyled, TOC links don't highlight, theme-
identical callouts, static-mode token WARNs, `failedTwice` never
flips, prose numbering collisions, faded pull-quote, banned-font Gate
7) and their fixes are in [error-handling](references/error-handling.md).
  > Doc shell unstyled · TOC links don't highlight · Callout colors look identical in both themes · QA gate WARNs in static mode that it cannot resolve tokens · `failedTwice` never flips · Prose page numbering collides · Pull-quote fades into body · Banned-font Gate 7 fails on the runtime's own default DESIGN.md

## Examples

Six end-to-end invocations (technical report, auto-numbered
whitepaper, incident postmortem, implementation plan, selectable-
paragraph essay, QA-only) are in [worked-examples](references/worked-examples.md).
  > Technical report · Whitepaper with auto-numbered sections · Incident postmortem · Implementation plan · Essay with selectable paragraphs · QA-only invocation

## Visual verification

For visual verification (does the page actually look right in light,
dark, and print?), see [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).

## Modes

This skill supports `data-ve-mode="readonly"` (the default for prose/report pages — every paragraph is selectable for comment but no decision pill) and `data-ve-mode="choice"` / `single` / `multi` / `max-N` (when the report IS a list of decisions, e.g. a bug-triage list where each finding gets approve/skip/deny). Set the mode on the `<section data-ve-finding-id>` wrapper per finding, or on `<body>` for the whole report.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Prose pages typically embed diagrams, tables, code blocks, math, etc. via their respective skills. The only exclusive skill is the overlay-runtime (R24).

## Resources

The 37-reference progressive-discovery index — document shapes,
primitive blocks, prose-mode rules, QA pipeline, decision tree, and
runtime APIs — lives in its own file so this SKILL.md stays under
the progressive-disclosure budget. Open it to navigate the catalog;
each entry there carries its own embedded TOC.

- [resources-index](references/resources-index.md) — full 37-reference catalog
  > Document shapes · Structural primitives · Document chrome · Composition and QA

### Cross-cutting / shared

- [interactive-selection-base](../../references/interactive-selection-base.md) — wire format, depths 1-7
  > How it works & Page Setup · The selection payload · Selectable Elements · Engine routing — read this BEFORE generating a graph · Runtime & Process Caveats
- [css-patterns](../../references/css-patterns.md) — Prose Page Elements (lead, pullquote, callout)
  > Theme & Atmosphere · Layout & Containers · Content Blocks · Visual Components · Prose Page Elements
- [styling-guide](../../references/styling-guide.md) — Editorial / Paper-ink directions
  > Aesthetic directions · Typography & Color · Surfaces, Hierarchy & Animation · Engines & Illustrations
- [libraries](../../references/libraries.md) — Typography by Voice
  > Mermaid.js — Diagramming Engine · Chart.js — Data Visualizations · anime.js — Orchestrated Animations · Google Fonts — Typography
- [diagram-types](../../references/diagram-types.md) — Prose Accent Elements
  > Diagrams (Mermaid + CSS) · Data Visualizations · Documentation Layouts · Prose Accent Elements
