# Report-doc — error handling

## Table of Contents

- [Doc shell unstyled](#doc-shell-unstyled)
- [TOC links don't highlight](#toc-links-dont-highlight)
- [Callout colors look identical in both themes](#callout-colors-look-identical-in-both-themes)
- [QA gate WARNs in static mode that it cannot resolve tokens](#qa-gate-warns-in-static-mode-that-it-cannot-resolve-tokens)
- [`failedTwice` never flips](#failedtwice-never-flips)
- [Prose page numbering collides](#prose-page-numbering-collides)
- [Pull-quote fades into body](#pull-quote-fades-into-body)
- [Banned-font Gate 7 fails on the runtime's own default DESIGN.md](#banned-font-gate-7-fails-on-the-runtimes-own-default-designmd)

The failure modes of the `report-doc` skill and how to resolve each.

## Doc shell unstyled

`amvcp-report-doc.js` not loaded; check the `<script>` tag and that
`injectReportDocCSS(document)` was called (or that you did not opt out
via `__vcReportDocManualInit` without re-injecting).

## TOC links don't highlight

No IntersectionObserver, OR the targets are missing ids. Links still
work — only the active highlight degrades.

## Callout colors look identical in both themes

The engine isn't applying `--vc-color-*`; verify
`amvcpDesignMd.applyTokens` ran.

## QA gate WARNs in static mode that it cannot resolve tokens

Load `amvcp-designmd.js` so the static check can parse the embedded
DESIGN.md.

## `failedTwice` never flips

You're calling `runGates` without a `pageId`, OR the call between
fails passed; loop state keys on `pageId`.

## Prose page numbering collides

Manual `data-ve-id` on `<p>` collides with auto `ve-para-X.Y.Z`. Drop
the manual id.

## Pull-quote fades into body

Cap at one per page; >1 loses impact.

## Banned-font Gate 7 fails on the runtime's own default DESIGN.md

Known finding (Inter is on the banned list). Belongs to design-tokens
reconciliation, not report-doc; report-doc's job is to *report*, not
silently exempt.
