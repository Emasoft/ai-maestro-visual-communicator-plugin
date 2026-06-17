# Report-doc — worked examples

## Table of Contents

- [Technical report](#technical-report)
- [Whitepaper with auto-numbered sections](#whitepaper-with-auto-numbered-sections)
- [Incident postmortem](#incident-postmortem)
- [Implementation plan](#implementation-plan)
- [Essay with selectable paragraphs](#essay-with-selectable-paragraphs)
- [QA-only invocation](#qa-only-invocation)

Six end-to-end invocations of the `report-doc` skill, each pairing a
template with a shape and naming the structural blocks involved.

## Technical report

`<article class="vc-doc vc-doc--technical-report">` with a
`vc-doc-header`, four `<h2>` sections, two
`<aside class="vc-callout vc-callout--warning">` blocks, one
`<table class="vc-rubric">`. Run `runGates(document)` afterward —
every P1 gate should PASS, ok:true.

## Whitepaper with auto-numbered sections

`vc-doc--whitepaper` adds `01`, `02`, `03` leading-zero counters
before each h2, decimal-leading-zero formatting, accent-color marker.
The whole document fits in the 64ch reading measure the template sets
via `--vc-doc-measure`. See
[section-numbering-leading-zero](section-numbering-leading-zero.md).

## Incident postmortem

`incident-postmortem-shape` over `vc-doc--technical-report`. SEV pill +
slate TL;DR + typed-dot timeline + impact mini-table + action-items
checklist + fixed-right TOC.

## Implementation plan

`implementation-plan-shape` over `vc-doc--proposal`. 4-stat band →
milestone timeline → data-flow SVG → paired mockups → 2-col code →
risk table → open-questions callouts → provenance footer.

## Essay with selectable paragraphs

`<article data-ve-prose>`; runtime auto-numbers; double-click insight
→ `{kind:"text", paragraphId:"2.1.3"}`.

## QA-only invocation

Agent inherited a generated HTML file from elsewhere. Load it in a
browser, call
`window.amvcpReportDoc.runGates(document, "inherited-1")` — every
FAILing gate's `fixHint` tells you what to change.
