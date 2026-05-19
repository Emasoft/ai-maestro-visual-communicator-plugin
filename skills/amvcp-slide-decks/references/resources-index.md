# Resources index — full slide-decks reference catalog

## Table of Contents

- [Foundation refs](#foundation-refs)
- [Layout catalog refs](#layout-catalog-refs)
- [Motion refs](#motion-refs)
- [Block refs (per family)](#block-refs-per-family)
- [Authoring-quality refs](#authoring-quality-refs)
- [Theming refs](#theming-refs)
- [Integration refs](#integration-refs)
- [Debugging refs](#debugging-refs)
- [Routing ref](#routing-ref)
- [Legacy long-form catalog](#legacy-long-form-catalog)

The full progressive-discovery catalog of every slide-deck technique
the skill ships. Open the specific ref that matches the task; this
index is the navigation surface, the per-ref pages are the manuals.

## Foundation refs

- [01-stage-and-letterbox-fitting](./01-stage-and-letterbox-fitting.md) — the fixed-pixel stage,
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Resize behaviour deep dive · Print path: the same stage at natural size · Source provenance
  letterbox vs responsive fit, the `transform: scale()` resize math.
- [02-deck-navigation-and-chrome](./02-deck-navigation-and-chrome.md) — keyboard / swipe / dots /
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Programmatic navigation · Chrome visibility on mixed-background decks · Source provenance
  counter / progress / fullscreen / position persistence.
- [03-json-deck-contract](./03-json-deck-contract.md) — the typed-block authoring
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Source provenance
  contract: every deck-level field, every slide field, every block type.

## Layout catalog refs

- [04-the-16-layout-catalog](./04-the-16-layout-catalog.md) — the 16 canonical layouts +
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Layout-by-role across a 12-slide deck · When a layout choice is wrong · Source provenance
  the "pick by job, not by looks" rule.
- [05-layout-manifesto](./05-layout-manifesto.md) — opening anchor.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — assertion-evidence · Visual verification · Manifestos by talk type · Manifesto vs subject-line vs hashtag · Source provenance
- [06-layout-section-divider](./06-layout-section-divider.md) — ghost numeral chapter break.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — section titles · Visual verification · Numeral formats — what works on the ghost mark · Section-divider density · Divider sequence patterns · Source provenance
- [07-layout-statement](./07-layout-statement.md) — bold pivot claim.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules · Visual verification · Placement in the deck · Comparison to other layouts · Statement frequency in well-structured decks · Statement examples by argument type · Source provenance
- [08-layout-content](./08-layout-content.md) — workhorse heading + bullets.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Content density limits · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Splitting overflowing content · Visual verification · Source provenance
- [09-layout-two-column](./09-layout-two-column.md) — heading + two parallel stacks.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Block-distribution algorithm · Visual verification · Two-column variants by content type · The "second column gives the eye a destination" rule · Source provenance
- [10-layout-comparison](./10-layout-comparison.md) — left vs right contrast.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — item alignment · Visual verification · Source provenance
- [11-layout-quadrant](./11-layout-quadrant.md) — 2×2 phase-space matrix.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — axis labelling · Visual verification · Canonical 2×2 matrix examples · Naming the quadrants · When NOT to use quadrant · Source provenance
- [12-layout-data-story](./12-layout-data-story.md) — chart + headline + annotation.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — chart type by job · Visual verification · Anti-patterns for data-story slides · Source provenance
- [13-layout-metrics](./13-layout-metrics.md) — heading + KPI row.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — value column width · Visual verification · Metric vs metrics-slide vs data-story · When metrics tells a story by itself · Source provenance
- [14-layout-timeline](./14-layout-timeline.md) — heading + horizontal sequence.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — event count vs zoom level · Visual verification · Timeline vs Gantt vs roadmap · Examples by timeline scope · Source provenance
- [15-layout-bento](./15-layout-bento.md) — heading + bento grid summary.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — grid by cardinality · Visual verification · Source provenance
- [16-bento-grid-templates](./16-bento-grid-templates.md) — the 7 named bento grids
  > What this is · DESIGN.md tokens used · When to use this reference · Don'ts · Visual verification · Source provenance
  (`hero` / `gallery` / `asymmetric` / `feature` / `stats` / `split` / `full`).
- [17-layout-stack](./17-layout-stack.md) — heading + layered cards.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — card title and description · Visual verification · Stack vs metrics vs bullets — picking the right list layout · Card-title vs card-description authoring · Source provenance
- [18-layout-full-bleed](./18-layout-full-bleed.md) — edge-to-edge image + overlay text.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — image source guidance · Visual verification · Common pitfalls · Best images for slide-decks · Source provenance
- [19-layout-quote](./19-layout-quote.md) — oversized blockquote + cite.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — quote selection · Visual verification · Quote categories (by source) · Quote slide as deck punctuation · Common quote-slide mistakes · Source provenance
- [20-layout-code-focus](./20-layout-code-focus.md) — heading + one centred code block.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — snippet selection · Visual verification · Languages tested on `lang` field · Diff-style snippets · Source provenance
- [21-layout-closing](./21-layout-closing.md) — wrap / call-to-action / next step.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — closing types · Visual verification · Closing-slide examples by talk type · Strong closing headlines · Closing pairs (`manifesto` + `closing`) · Source provenance

## Motion refs

- [22-moods-and-transitions](./22-moods-and-transitions.md) — the 5 entrance moods +
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Mood by tone · Transition by pacing · Don'ts · Reduced-motion gate · Visual verification · Source provenance
  4 section transitions + reduced-motion gate.

## Block refs (per family)

- [23-block-eyebrow-and-heading](./23-block-eyebrow-and-heading.md) — the title family.
  > What this is · Level selection · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Assertion-evidence rule · Visual verification · Source provenance
- [24-block-bullets-and-text](./24-block-bullets-and-text.md) — the body family + density limits.
  > What this is · Density limits · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Bullets vs text · Don'ts · Visual verification · Source provenance
- [25-block-metric-and-callout](./25-block-metric-and-callout.md) — the impact family (KPI + annotation).
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · When to pick metric vs callout · Don'ts · Visual verification · Source provenance
- [26-block-quote-and-comparison](./26-block-quote-and-comparison.md) — the contrast family.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · When to pick comparison vs two bullets blocks · Don'ts · Visual verification · Source provenance
- [27-block-image-spacer-and-delegated](./27-block-image-spacer-and-delegated.md) — image, spacer, and
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Delegated-block errors · Don'ts · Visual verification · Source provenance
  the three delegated block types (`code` / `diagram` / `chart`).

## Authoring-quality refs

- [28-density-and-overflow-guard](./28-density-and-overflow-guard.md) — `MAX_BULLETS=6` /
  > What this is · Per-layout density limits · Lib functions called · When to use this reference · Splitting overflowing content · No-nested-scrollbars discipline · Visual verification · Source provenance
  `MAX_BODY_WORDS=40`, splitting strategies, the no-nested-scrollbars rule.
- [29-assertion-evidence-headline-rule](./29-assertion-evidence-headline-rule.md) — the soft headline
  > What this is · The rule (literal) · VERB_SIGNALS list (literal) · Pass examples · Fail examples · Known false positives (the rule WARNS but the headline is fine) · Known false negatives (the rule PASSES but the headline is weak) · When to use this reference · Workflow — fix every warning · Don'ts · Visual verification · Source provenance
  validator: pass criteria, the literal verb-signal list, fix examples.
- [34-content-completeness-from-source](./34-content-completeness-from-source.md) — the 5-step process
  > What this is · The completeness test · Lib functions called · When to use this reference · Don'ts · Anti-patterns · Visual verification · Source provenance
  for mapping a source document into a deck without dropping content.
- [35-compositional-variety-and-rhythm](./35-compositional-variety-and-rhythm.md) — deck-level pacing:
  > What this is · What this is NOT · Scaffold to emit · Pacing rules · Lib functions called · When to use this reference · Pacing-test workflow · Don'ts · Composition table (canonical map) · Visual verification · Source provenance
  no run of 3+ identical compositions; dense / sparse alternation;
  full-bleed restraint.

## Theming refs

- [30-design-md-token-mapping](./30-design-md-token-mapping.md) — the AUTHORITATIVE map of
  > What this is · Scaffold — minimum DESIGN.md for a slide deck · Lib functions called · DESIGN.md tokens NOT used by the slide layer · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Source provenance
  every `--vc-*` token the slide layer reads, with light + dark defaults.
- [36-presets-and-named-styles](./36-presets-and-named-styles.md) — the 12 anti-slop named
  > What this is · Scaffold — example presets · How presets ship · Lib functions called · DESIGN.md tokens used · When to use this reference · Picking a preset by tone · The "pick one and commit" rule · Don'ts · Visual verification · Source provenance
  presets, expressed as DESIGN.md YAML fragments.

## Integration refs

- [31-selection-comment-and-decision-mini](./31-selection-comment-and-decision-mini.md) — Phase 2.5
  > What this is · Scaffold to emit · Lib functions called · Selection-ring override (specific to slides) · Hover-glow override (specific to slides) · When to use this reference · Don'ts · Decision-mini attachment timing · Visual verification · Source provenance
  contract: `data-ve-id` / `data-ve-type` / `data-ve-label` / `tabindex`
  attribute stamping; the inset-outline + inset-glow overrides.
- [32-poster-mode](./32-poster-mode.md) — `kind: "poster"` — single-slide static
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · When to pick poster vs single-slide deck · Don'ts · Poster aspect ratio · Print / export workflow · Visual verification · Best layouts for posters · Use cases for posters in practice · Source provenance
  export, no nav chrome, share-card aspect.
- [33-print-and-pdf-export](./33-print-and-pdf-export.md) — `@media print` block,
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Print-preview troubleshooting · Browser quirks · Don'ts · Visual verification · PDF vs PNG export comparison · Page-size tuning by aspect · Source provenance
  one-slide-per-page native browser export.
- [37-speaker-notes-presenter-mode](./37-speaker-notes-presenter-mode.md) — per-slide `notes` field
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · postMessage contract · When to use this reference · When NOT to use notes · Authoring rules · Don'ts · Visual verification · Source provenance
  and the `?notes` window via `postMessage`.
- [38-self-contained-export-and-deps](./38-self-contained-export-and-deps.md) — the deployment
  > What this is · Script load order · Why no CDN · Conditional script ordering — keeping the deck minimal · Lib functions called · DESIGN.md tokens used · `<noscript>` fallback · When to use this reference · Don'ts · Visual verification · Source provenance
  contract: one HTML file + 2 to 5 sibling scripts, no CDN.
- [39-aspect-ratios-deep-dive](./39-aspect-ratios-deep-dive.md) — when to pick `16:9` vs
  > What this is · Why 16:9 is the default · When 4:3 is correct · When 3:2 is correct · What changes per aspect · Layout efficiency by aspect · Scaffold to emit · Mixing aspects — DON'T · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Source provenance
  `4:3` vs `3:2`; layout efficiency table per aspect.

## Debugging refs

- [40-fail-fast-errors-and-debugging](./40-fail-fast-errors-and-debugging.md) — every hard error +
  > What this is · Scaffold — using the warnings programmatically · Lib functions called · When to use this reference · Debugging workflow · Don'ts · Visual verification · Programmatic linting · Worked examples — fix-by-message · Source provenance
  every soft warning the renderer can emit, with the fix.

## Routing ref

- [41-decision-matrix-when-to-choose-slides](./41-decision-matrix-when-to-choose-slides.md) — the full
  > What this is · Decision flowchart · When to pick `slide-decks` · When NOT to pick slide-decks · Boundary cases · Authoring-quality checklist before picking slide-decks · Lib functions called · When to use this reference · Common mis-dispatches · Don'ts · Visual verification · Source provenance
  matrix for picking slide-decks vs prose-pages / charts / diagrams /
  tables / modal-comments / share-pages.

## Legacy long-form catalog

- [slide-deck-mode](./slide-deck-mode.md) — when to switch to deck mode, content
  > When to use slide deck mode · Content completeness · Slide types and visual richness · Compositional variety · Curated presets · The --slides flag on existing prompts
  completeness, the `--slides` flag.
- [slide-patterns](./slide-patterns.md) — the legacy long-form catalog (kept for
  > Planning a Deck from a Source Document · Slide Engine Base · Typography Scale · Cinematic Transitions · Navigation Chrome · SlideEngine JavaScript · Auto-Fit · Slide Type Layouts · Decorative SVG Elements · Proactive Imagery · Compositional Variety · Presentation Readability · Content Density Limits · Responsive Height Breakpoints · Curated Presets · Slide selection wiring
  the `next-slide` and Folio source links; the layouts catalog has been
  deduplicated into the §6 list above and re-organised into the per-layout
  refs `05`-`21`).
