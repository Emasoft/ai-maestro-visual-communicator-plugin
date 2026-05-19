# Resources index — full 37-reference progressive-discovery list

## Table of Contents

- [Document shapes](#document-shapes)
- [Structural primitives](#structural-primitives)
- [Document chrome](#document-chrome)
- [Composition and QA](#composition-and-qa)

The full 37-reference progressive-discovery index for the
`amvcp-prose-pages` skill, grouped by topic. Load only the reference
whose title matches the current job — agents do not need to read this
index file unless they're navigating the document-shape catalog from
scratch.

## Document shapes

Pick one shape per deliverable; each pins the section sequence and
tells you which element skills to embed.

- [implementation-plan-shape](./implementation-plan-shape.md) — 8-section forward-looking plan
  > When to choose this shape · Section order (fixed — do not reorder) · Markdown scaffold · Lib functions called · DESIGN.md tokens consumed · Composition with the 12 element skills · Selection / comment notes · Decision-mini hook · Verification · Anti-patterns
- [status-report-shape](./status-report-shape.md) — recurring time-windowed retrospective summary
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The `.vc-metric--warn` modifier · The `vc-auto-pill` provenance pill · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [incident-postmortem-shape](./incident-postmortem-shape.md) — SEV / TL;DR / timeline / impact / actions
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The typed-dot timeline · The key/value pill (`vc-pill-k` + `vc-pill-v`) · The slate TL;DR variant · The fixed-right TOC · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [pr-review-reviewer-side-shape](./pr-review-reviewer-side-shape.md) — reviewer's writeup with risk chips
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The risk-chip navigator · The 3-column diff subgrid + comment bubble · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [pr-writeup-author-side-shape](./pr-writeup-author-side-shape.md) — author's writeup with rollout strip
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The before/after panel pair · The rollout strip (shared borders) · Reading-order file tour vs alphabetical · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [architecture-explainer-shape](./architecture-explainer-shape.md) — flow + walkthrough + sticky sidebar
  > When to choose this shape · Section order (fixed) · Layout — 2-column grid with sticky sidebar · Markdown scaffold · The hot-step modifier (`.vc-step--hot`) · The Gotchas panel (clay-bordered sidebar block) · Mutually-exclusive `<details>` (optional) · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [feature-explainer-shape](./feature-explainer-shape.md) — TOC + step-by-step + tabbed code + FAQ
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The "Files read" sidebar block · The tabbed code panel · The star callout · The FAQ `<dl>` block · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [concept-explainer-shape](./concept-explainer-shape.md) — interactive demo + comparison + glossary
  > When to choose this shape · Section order (fixed) · Layout — main column + sticky right glossary · Markdown scaffold · The interactive demo — slider → recompute → re-render · The hover-linked glossary · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [compare-n-approaches-shape](./compare-n-approaches-shape.md) — N columns + Pro/Con + recommendation
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The N-column grid · The Pro/Con sub-grid · The metric-chip strip · The recommendation card (clay left-border) · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [visual-design-exploration-shape](./visual-design-exploration-shape.md) — toolbar + artboards + rationale
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The light/dark toolbar switcher · The 2×2 artboard grid · The per-artboard "Risk:" line · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [rfc-shape](./rfc-shape.md) — Abstract / Context / Proposal / Alternatives / …
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The RFC status pill · The Alternatives section · The whitepaper template's auto-numbering · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [adr-decision-log-shape](./adr-decision-log-shape.md) — Nygard 4-section append-only
  > When to choose this shape · Section order (fixed — Nygard 2011 contract) · Markdown scaffold · The `.vc-adr` modifier · The Status pill — special behaviour · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [retrospective-shape](./retrospective-shape.md) — four-quadrant retro + action items
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The four-quadrant grid · The "extract action items from the quadrant" rule · The "follow-up to prior retro" section · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [design-system-doc-shape](./design-system-doc-shape.md) — living one-pager of the DESIGN.md
  > When to choose this shape · Section order (fixed) · Markdown scaffold · The swatch grid · The type-scale row atom · The spacing ruler atom · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [change-log-document-shape](./change-log-document-shape.md) — versioned-document edit history
  > Overview · When to add a change log · Scaffold (canonical) · CSS contract · Reverse chronological order · Entry-content discipline · Initial-draft entry · When to roll a new version · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns

## Structural primitives

Embed inside any shape; orthogonal to the shape's section sequence.

- [document-header-byline-subtitle](./document-header-byline-subtitle.md) — eyebrow + h1 + subtitle + byline
  > When to add each element · Scaffold · CSS contract (already injected by the runtime) · The eyebrow's job · Title-writing discipline · Subtitle discipline · Byline discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
- [tldr-summary-card](./tldr-summary-card.md) — clay-border summary; slate variant for postmortems
  > When to add a TL;DR · Default scaffold (clay-border) · Slate-bg variant (postmortem / security advisory) · Word-count discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · Anti-patterns
- [callout-admonition-blocks](./callout-admonition-blocks.md) — 5 variants (tip / warning / info / note / danger)
  > When to use which variant · Scaffold (canonical) · CSS (already injected by the runtime) · DESIGN.md tokens consumed · Special variants (extensions beyond the 5 builtins) · Composition with other skills · Selection / comment notes · Decision-mini hook · QA notes · Anti-patterns
- [pull-quote-cap-one-per-page](./pull-quote-cap-one-per-page.md) — editorial pull-quote, default + display + epigraph
  > When to use a pull-quote · Scaffold · CSS (already injected by the runtime) · The "exactly one per page" rule · Variants · DESIGN.md tokens consumed · Composition with other shapes · Selection / comment notes · Anti-patterns
- [metrics-stat-band](./metrics-stat-band.md) — 3-5 stat cells with one-warn modifier
  > When to use a stat-band · Scaffold · CSS (already injected by the runtime) · The `--warn` modifier · Number formatting discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · Anti-patterns
- [quality-rubric-scored-matrix](./quality-rubric-scored-matrix.md) — N-row × scored-cell evaluation table
  > When to use · Scaffold (canonical /20 rubric) · CSS (already injected by the runtime) · Custom rubric scales · Runtime auto-sum (optional) · DESIGN.md tokens consumed · Composition with other skills · Lib functions called · Selection / comment notes · Decision-mini hook · Anti-patterns
- [metadata-keypill-strip](./metadata-keypill-strip.md) — compact key/value pill row + status pills
  > When to use · Scaffold · CSS contract · Status-variant catalog · Severity-pill content discipline · Key/value content discipline · DESIGN.md tokens consumed · Composition with other shapes · Selection / comment notes · Decision-mini hook · Anti-patterns
- [timeline-typed-dots](./timeline-typed-dots.md) — vertical timeline; impact / detect / mitigated dots
  > When to use a timeline · Scaffold (incident timeline) · CSS contract · Dot-color semantics · Time-column conventions · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · Anti-patterns
- [action-items-checklist](./action-items-checklist.md) — owned + due-dated commitment register
  > When to use · Scaffold (canonical 4-column row) · CSS contract · State modifiers · Owner discipline · Due-date discipline · Composition · Lib hooks · DESIGN.md tokens consumed · Selection / comment notes · Decision-mini hook · Anti-patterns
- [glossary-and-hover-linked-terms](./glossary-and-hover-linked-terms.md) — `<dl>` + bidirectional hover-link
  > When to add a glossary · Scaffold — body markup · Scaffold — glossary block · CSS contract · The hover-link runtime · Click-to-jump variant · DESIGN.md tokens consumed · Composition · Selection / comment notes · Decision-mini hook · QA notes · Anti-patterns
- [abstract-keywords-block](./abstract-keywords-block.md) — formal-document opener (RFC / whitepaper)
  > When to use which · Scaffold · CSS contract · The IMRAD-like structure inside an abstract · Word-count discipline · Keyword discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
- [appendix-and-references-bibliography](./appendix-and-references-bibliography.md) — formal-document closer
  > When to add each · Appendix scaffold · CSS for appendices · References scaffold · CSS for references · Citation discipline · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns

## Document chrome

Page-level structure: prose mode, TOC, navigation, print, provenance.

- [prose-mode](./prose-mode.md) — `data-ve-prose` paragraph numbering + text-snippet selection
  > Paragraph numbering + text-snippet selection · Text-snippet selection · Why opt-in via `data-ve-prose` · Authoring rules for prose pages · Reference response patterns
- [responsive-nav](./responsive-nav.md) — sticky sidebar TOC + mobile horizontal bar
  > Layout Structure · CSS · JavaScript — Scroll Spy · Adaptation Notes
- [toc-and-anchor-system](./toc-and-anchor-system.md) — `vc-toc` + scroll-spy + heading-anchor offset
  > When to add a TOC · Scaffold (default — single-column doc) · CSS (already injected by the runtime) · The scroll-spy (already implemented in `init`) · Variants by layout · DESIGN.md tokens consumed · The heading-anchor offset · Composition with other skills · Lib functions called · Selection / comment notes · Anti-patterns
- [section-numbering-leading-zero](./section-numbering-leading-zero.md) — CSS-counter `01`, `02`, `03`
  > When to use leading-zero numbering · The whitepaper template's auto-numbering · Cross-referencing by name, not number · Multi-level numbering (sections + subsections) · The standalone `vc-num` eyebrow (alternative) · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns
- [template-presets-six-shapes](./template-presets-six-shapes.md) — the 6 `vc-doc--<name>` modifiers
  > When to pick which template · What each template adds · Picking the right template — decision tree · Template stacking · Template + shape mapping · DESIGN.md tokens consumed · Composition · Lib API · Anti-patterns
- [print-stylesheet-and-back-to-top](./print-stylesheet-and-back-to-top.md) — print CSS + back-to-top affordance
  > Why these matter · Print stylesheet (already shipped) · Print: page numbering (optional) · Print: cover page (optional) · Back-to-top affordance · Back-to-top runtime · DESIGN.md tokens consumed · Composition · Anti-patterns
- [provenance-footer-and-autopill](./provenance-footer-and-autopill.md) — auto-pill + sources line + prompt box
  > When to add provenance markers · The auto-pill · The provenance footer · Files-read sidebar variant · The prompt box (provenance for one-shots) · DESIGN.md tokens consumed · Composition · Selection / comment notes · Anti-patterns

## Composition and QA

How to embed element skills inside doc shapes, and the 7-gate QA
verifier.

- [output-qa-pipeline-7-gates](./output-qa-pipeline-7-gates.md) — `runGates`, gate-by-gate reference
  > When to run the QA pipeline · The 7 gates · Calling the pipeline · Gate output shape · The loop-detection (failedTwice) · DESIGN.md tokens consumed (by Gate 2) · Banned lists (Gates 6 + 7) · Lib API surface · Visual verification · Anti-patterns
- [request-routing-decision-tree](./request-routing-decision-tree.md) — "which technique should I use?"
  > Top-level decision tree · Layering: shape × element skills · Decision matrix — when shapes overlap · The "5-layer infographic composition" mental model (OT-07) · Composition · Anti-patterns
- [composing-with-other-skills](./composing-with-other-skills.md) — embed contract + theme-swap propagation
  > The composition contract · The compatibility matrix · Worked example — `implementation-plan-shape` · Runtime interaction patterns · QA on composed pages · When NOT to compose · Anti-patterns
