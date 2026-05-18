---
name: amvcp-slide-decks
description: "Author magazine-quality slide decks as one self-contained interactive HTML from a JSON deck contract. Letterbox stage, 16 layouts, 5 moods, 4 transitions, dependency-free (no reveal.js, no GSAP). Use when the user asks for a presentation, slide deck, talk slides, pitch deck. Trigger with 'slide deck', 'presentation', 'pitch deck', 'turn this into slides', '/amvcp-generate-slides'."
license: MIT
compatibility: "Browser (ResizeObserver, requestAnimationFrame). Python 3.12+ renderer ships amvcp-slide.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Slide Decks

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

Loads on requests for a presentation, slide deck, pitch deck, or "turn this into slides". Renders a deck of fixed-aspect "stage" slides from a JSON deck contract — the consolidated top-of-stack composite that converged five third-party slide projects into one dependency-free renderer. Seven sub-systems, all themed off the DESIGN.md `--vc-*` tokens, all `prefers-reduced-motion` safe, all light + dark correct by construction.

1. **Stage & viewport fitting** — fixed-pixel stage with `transform: scale(ratio)` letterbox, or responsive 100dvh fallback for mobile. No nested scrollbars ever.
2. **Deck navigation** — keyboard, touch swipe, dot click, fullscreen, position persisted to localStorage.
3. **JSON typed-block authoring contract** — the agent emits a deck as JSON; the renderer turns it into themed HTML.
4. **Named layout / composition catalog** — 16 deduplicated layouts (manifesto, content, two-column, comparison, quadrant, data-story, metrics, timeline, bento, stack, full-bleed, quote, code-focus, closing, statement, section-divider). Bento has 7 grid sub-templates.
5. **Theme / preset system** — every preset is a DESIGN.md file the Phase-1 engine resolves. No re-implementation of token resolution.
6. **Entrance & transition animation** — 5 moods (minimal, editorial, dramatic, playful, techy), 4 transitions (crossfade, slide-left, zoom, page-turn), all CSS-only.
7. **Authoring-quality rules** — the assertion-evidence headline rule (≥5 words + verb-or-stat) and content-density guard (≤6 bullets, ≤40 body words). Soft warnings, never thrown.

## Prerequisites

- The DESIGN.md engine (`amvcp-designmd.js`) loaded **before** the slide module — supplies the `--vc-*` tokens.
- `amvcp-slide.js` ships beside the output HTML.
- Optional sibling renderers when the deck uses delegated blocks: `amvcp-codeblock.js` (`code` block), `amvcp-graphdiagram.js` (`diagram` block), `amvcp-charts.js` (`chart` block). Absent module + delegated block → throws a clear error naming the missing module (fail-fast — never a broken placeholder).
- A `motion:` group in the DESIGN.md is **optional** — every CSS rule carries a canonical `--vc-*` fallback, so a token-less DESIGN.md still themes the deck correctly.

## Instructions

1. **Inventory the source content** — never drop content to fit a slide budget. Add slides instead.
2. **Pick ONE preset id**, state why; commit to it. Mixing presets reads as indecision.
3. **Choose `aspect`** (16:9 / 4:3 / 3:2; default 16:9), **`fit`** (letterbox / responsive; default letterbox), **`mood`** (minimal / editorial / dramatic / playful / techy; default minimal), **`transition`** (crossfade / slide-left / zoom / page-turn; default crossfade).
4. **For each slide**, pick a `layout` from the catalog **by job, not by looks** (the Folio discipline) and write its `blocks`.
5. **Write every `heading` as a full declarative sentence** (assertion-evidence — §10.1 of the spec). Headlines `<5` words with no verb and no stat collect a `data-vsd-headline-warn` attribute and a console warning; the deck still renders.
6. **Respect density limits**: ≤6 bullets, ≤40 body words per slide. Overflow collects `data-vsd-overflow` (soft warning).
7. **Emit the deck JSON** into `<script type="application/json" id="vsd-deck">…</script>` (XSS-safe, escape-free). Optionally embed the preset DESIGN.md as `<script type="text/markdown" id="vsd-preset">…</script>`. The slide module's `boot(doc)` reads them on `DOMContentLoaded` (or set `window.__vsdManualInit = true` to drive injection + render manually from a fixture).

## The deck JSON contract

```jsonc
{
  "kind": "deck",                 // "deck" | "poster"
  "title": "Q3 Engineering Readout",
  "aspect": "16:9",               // "16:9" | "4:3" | "3:2"
  "fit": "letterbox",             // "letterbox" | "responsive"
  "mood": "minimal",
  "transition": "crossfade",
  "loop": false,
  "slides": [
    { "layout": "manifesto",
      "blocks": [
        { "type": "eyebrow", "text": "Q3 2026" },
        { "type": "heading", "text": "Latency dropped 38% after the cache rewrite shipped." },
        { "type": "text",    "text": "Every p99 path now clears 200ms." }]}
  ]
}
```

## Output

Single self-contained HTML file: embedded deck JSON + optional embedded preset DESIGN.md + `amvcp-designmd.js` + `amvcp-slide.js` shipped beside, no CDN, no build step. Every `.vsd-slide` carries `data-ve-id` / `data-ve-type="slide"` / `data-ve-label` so the runtime's selection layer keeps slides click-selectable / commentable. Native browser "Save as PDF" produces one slide per page (the `@media print` block restores the natural stage size and unhides every slide).

## Error Handling

- **Unknown block `type`** / **unknown `layout`** / **unknown `mood`/`transition`/`aspect`/`fit`** → fail-fast throw with the offending JSON path (e.g. `slides[3].blocks[1]: unknown block type "mermaidd"`).
- **Delegated block + missing sibling module** → throw naming the module (`window.amvcpCodeBlock.renderInto is not available`).
- **Headline weak** → soft warning (`console.warn` + `data-vsd-headline-warn`); deck still renders. Stylistic judgement, not a structural error.
- **Slide overflows density limits** → `data-vsd-overflow` attribute + a `densityWarnings` entry; no scrollbar is ever added.
- **Reduced motion** → every entrance + transition substitutes to opacity-only / instant; no `animation:none` that leaves a block stuck at opacity 0.
- **JS disabled** → the embedded `<noscript>` would expand the deck into a vertical stack of full-height slides (page expands, no inner scroll).

## Examples

**Input:** "Turn the Q3 readout into a 6-slide deck. Use a dramatic entrance and crossfade between slides."

**Output:** A single HTML file with a 6-slide JSON deck embedded under `id="vsd-deck"` (`mood: dramatic`, `transition: crossfade`, `aspect: 16:9`, `fit: letterbox`). Six `<section class="vsd-slide" data-ve-id="s1..s6" data-ve-type="slide">` carry layouts picked by job: `manifesto` for the opening anchor, `metrics` for the stats row, `data-story` for the chart, `comparison` for the then/now contrast, `bullets` inside `content` for the action items, `closing` for the wrap. Click any slide to open the comment modal (the runtime's selection layer reads the standard `data-ve-*` attributes unchanged).

## Module API surface

`window.amvcpSlideDeck` (browser) and `module.exports` (Node, for the test harness):

- `injectSlideCSS(doc)` — append the deck `<style>` to `doc.head`. Idempotent.
- `parseDeck(jsonText|object)` — validate a deck; returns the normalised deck object. Throws on any structural violation.
- `renderDeck(deck, mountEl)` — build the deck DOM into `mountEl`. Returns the built `.vsd-viewport`.
- `createDeck(viewportEl)` — wire navigation; returns a `Deck` (with `go`/`next`/`prev`/`current`/`count`).
- `fitStage(viewportEl)` — recompute the letterbox scale.
- `validateHeadline(text)` — assertion-evidence soft check; returns `{ok, reason}`.
- `boot(doc)` — full self-init from an embedded deck JSON.
- `refresh(viewportEl)` — re-fit after dynamic DOM changes.

## Authoring discipline (the headline rule)

Bad: `Q3 Results` (label, no verb, 2 words). Good: `Latency dropped 38% after the cache rewrite shipped.` (claim, verb `dropped`, stat `38%`). Every heading is a complete sentence the audience can disagree with — the single highest-leverage anti-slop rule the deck enforces.

## When to choose this category (decision matrix)

| User says / wants | Pick `amvcp-slide-decks` if... | Otherwise route to... |
|---|---|---|
| "slides" / "deck" / "presentation" / "pitch deck" / "slide show" / "talk slides" | ALWAYS. Explicit ask. | — |
| `/amvcp-generate-slides` slash command | Always. | — |
| `--slides` flag on another slash command | Always (the flag opts in). | — |
| "Turn this into a deck" / "format for projection" / "make this presentable" | Always. | — |
| "Make a one-pager" / "make a shareable graphic" | YES → use `kind: "poster"` in this skill. | — |
| Multi-slide artefact that is PACED (paged by `→` or by the presenter) | YES. | — |
| Scrollable article / report read at the reader's pace | NO — scrollable, not paced. | `amvcp-prose-pages` |
| Single chart driving a finding (no surrounding deck context) | NO — pick the chart skill directly. | `amvcp-charts-and-dashboards` |
| Single diagram standalone (no surrounding deck context) | NO. | `amvcp-graph-diagrams` |
| Comparison table of N options | NO — pick the table skill directly. | `amvcp-choice-tables` |
| "Make a comment thread on this artefact" | NO — that's the modal-comments layer, not the slide layer. | `amvcp-modal-comments` |
| "Print this for a handout" | YES if the source naturally paginates as slides (cover-letter / project plan). NO if it's an article. | `amvcp-prose-pages` for articles. |

See [41-decision-matrix-when-to-choose-slides](references/41-decision-matrix-when-to-choose-slides.md) for the full
  > What this is · Decision flowchart · When to pick `slide-decks` · When NOT to pick slide-decks · Boundary cases · Authoring-quality checklist before picking slide-decks · Lib functions called · When to use this reference · Common mis-dispatches · Don'ts · Visual verification · Source provenance
boundary-case discussion.

## Modes

This skill supports `data-ve-mode="readonly"` only. Slides are presentation content — every slide block is selectable for comment, but the per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply. For a "rate each slide" or "approve/deny each slide" flow, use `amvcp-tables` with each row referencing a slide.

## Composability

Composes with every other amvcp-* skill on the same page (R22). Slides typically embed diagrams, charts, code blocks, math via their respective skills. The only exclusive skill is the overlay-runtime (R24).

## Resources

The references catalog progressive disclosure of every slide-deck technique
the skill ships. Open the specific ref that matches the task; the SKILL.md
above is the entry-point, not the manual.

### Foundation refs

- [01-stage-and-letterbox-fitting](references/01-stage-and-letterbox-fitting.md) — the fixed-pixel stage,
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Resize behaviour deep dive · Print path: the same stage at natural size · Source provenance
  letterbox vs responsive fit, the `transform: scale()` resize math.
- [02-deck-navigation-and-chrome](references/02-deck-navigation-and-chrome.md) — keyboard / swipe / dots /
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Programmatic navigation · Chrome visibility on mixed-background decks · Source provenance
  counter / progress / fullscreen / position persistence.
- [03-json-deck-contract](references/03-json-deck-contract.md) — the typed-block authoring
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Source provenance
  contract: every deck-level field, every slide field, every block type.

### Layout catalog refs

- [04-the-16-layout-catalog](references/04-the-16-layout-catalog.md) — the 16 canonical layouts +
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Layout-by-role across a 12-slide deck · When a layout choice is wrong · Source provenance
  the "pick by job, not by looks" rule.
- [05-layout-manifesto](references/05-layout-manifesto.md) — opening anchor.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — assertion-evidence · Visual verification · Manifestos by talk type · Manifesto vs subject-line vs hashtag · Source provenance
- [06-layout-section-divider](references/06-layout-section-divider.md) — ghost numeral chapter break.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — section titles · Visual verification · Numeral formats — what works on the ghost mark · Section-divider density · Divider sequence patterns · Source provenance
- [07-layout-statement](references/07-layout-statement.md) — bold pivot claim.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules · Visual verification · Placement in the deck · Comparison to other layouts · Statement frequency in well-structured decks · Statement examples by argument type · Source provenance
- [08-layout-content](references/08-layout-content.md) — workhorse heading + bullets.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Content density limits · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Splitting overflowing content · Visual verification · Source provenance
- [09-layout-two-column](references/09-layout-two-column.md) — heading + two parallel stacks.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Block-distribution algorithm · Visual verification · Two-column variants by content type · The "second column gives the eye a destination" rule · Source provenance
- [10-layout-comparison](references/10-layout-comparison.md) — left vs right contrast.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — item alignment · Visual verification · Source provenance
- [11-layout-quadrant](references/11-layout-quadrant.md) — 2×2 phase-space matrix.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — axis labelling · Visual verification · Canonical 2×2 matrix examples · Naming the quadrants · When NOT to use quadrant · Source provenance
- [12-layout-data-story](references/12-layout-data-story.md) — chart + headline + annotation.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — chart type by job · Visual verification · Anti-patterns for data-story slides · Source provenance
- [13-layout-metrics](references/13-layout-metrics.md) — heading + KPI row.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — value column width · Visual verification · Metric vs metrics-slide vs data-story · When metrics tells a story by itself · Source provenance
- [14-layout-timeline](references/14-layout-timeline.md) — heading + horizontal sequence.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — event count vs zoom level · Visual verification · Timeline vs Gantt vs roadmap · Examples by timeline scope · Source provenance
- [15-layout-bento](references/15-layout-bento.md) — heading + bento grid summary.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — grid by cardinality · Visual verification · Source provenance
- [16-bento-grid-templates](references/16-bento-grid-templates.md) — the 7 named bento grids
  > What this is · DESIGN.md tokens used · When to use this reference · Don'ts · Visual verification · Source provenance
  (`hero` / `gallery` / `asymmetric` / `feature` / `stats` / `split` / `full`).
- [17-layout-stack](references/17-layout-stack.md) — heading + layered cards.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — card title and description · Visual verification · Stack vs metrics vs bullets — picking the right list layout · Card-title vs card-description authoring · Source provenance
- [18-layout-full-bleed](references/18-layout-full-bleed.md) — edge-to-edge image + overlay text.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — image source guidance · Visual verification · Common pitfalls · Best images for slide-decks · Source provenance
- [19-layout-quote](references/19-layout-quote.md) — oversized blockquote + cite.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — quote selection · Visual verification · Quote categories (by source) · Quote slide as deck punctuation · Common quote-slide mistakes · Source provenance
- [20-layout-code-focus](references/20-layout-code-focus.md) — heading + one centred code block.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — snippet selection · Visual verification · Languages tested on `lang` field · Diff-style snippets · Source provenance
- [21-layout-closing](references/21-layout-closing.md) — wrap / call-to-action / next step.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Authoring rules — closing types · Visual verification · Closing-slide examples by talk type · Strong closing headlines · Closing pairs (`manifesto` + `closing`) · Source provenance

### Motion refs

- [22-moods-and-transitions](references/22-moods-and-transitions.md) — the 5 entrance moods +
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Mood by tone · Transition by pacing · Don'ts · Reduced-motion gate · Visual verification · Source provenance
  4 section transitions + reduced-motion gate.

### Block refs (per family)

- [23-block-eyebrow-and-heading](references/23-block-eyebrow-and-heading.md) — the title family.
  > What this is · Level selection · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Assertion-evidence rule · Visual verification · Source provenance
- [24-block-bullets-and-text](references/24-block-bullets-and-text.md) — the body family + density limits.
  > What this is · Density limits · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Bullets vs text · Don'ts · Visual verification · Source provenance
- [25-block-metric-and-callout](references/25-block-metric-and-callout.md) — the impact family (KPI + annotation).
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · When to pick metric vs callout · Don'ts · Visual verification · Source provenance
- [26-block-quote-and-comparison](references/26-block-quote-and-comparison.md) — the contrast family.
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · When to pick comparison vs two bullets blocks · Don'ts · Visual verification · Source provenance
- [27-block-image-spacer-and-delegated](references/27-block-image-spacer-and-delegated.md) — image, spacer, and
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Delegated-block errors · Don'ts · Visual verification · Source provenance
  the three delegated block types (`code` / `diagram` / `chart`).

### Authoring-quality refs

- [28-density-and-overflow-guard](references/28-density-and-overflow-guard.md) — `MAX_BULLETS=6` /
  > What this is · Per-layout density limits · Lib functions called · When to use this reference · Splitting overflowing content · No-nested-scrollbars discipline · Visual verification · Source provenance
  `MAX_BODY_WORDS=40`, splitting strategies, the no-nested-scrollbars rule.
- [29-assertion-evidence-headline-rule](references/29-assertion-evidence-headline-rule.md) — the soft headline
  > What this is · The rule (literal) · VERB_SIGNALS list (literal) · Pass examples · Fail examples · Known false positives (the rule WARNS but the headline is fine) · Known false negatives (the rule PASSES but the headline is weak) · When to use this reference · Workflow — fix every warning · Don'ts · Visual verification · Source provenance
  validator: pass criteria, the literal verb-signal list, fix examples.
- [34-content-completeness-from-source](references/34-content-completeness-from-source.md) — the 5-step process
  > What this is · The completeness test · Lib functions called · When to use this reference · Don'ts · Anti-patterns · Visual verification · Source provenance
  for mapping a source document into a deck without dropping content.
- [35-compositional-variety-and-rhythm](references/35-compositional-variety-and-rhythm.md) — deck-level pacing:
  > What this is · What this is NOT · Scaffold to emit · Pacing rules · Lib functions called · When to use this reference · Pacing-test workflow · Don'ts · Composition table (canonical map) · Visual verification · Source provenance
  no run of 3+ identical compositions; dense / sparse alternation;
  full-bleed restraint.

### Theming refs

- [30-design-md-token-mapping](references/30-design-md-token-mapping.md) — the AUTHORITATIVE map of
  > What this is · Scaffold — minimum DESIGN.md for a slide deck · Lib functions called · DESIGN.md tokens NOT used by the slide layer · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Source provenance
  every `--vc-*` token the slide layer reads, with light + dark defaults.
- [36-presets-and-named-styles](references/36-presets-and-named-styles.md) — the 12 anti-slop named
  > What this is · Scaffold — example presets · How presets ship · Lib functions called · DESIGN.md tokens used · When to use this reference · Picking a preset by tone · The "pick one and commit" rule · Don'ts · Visual verification · Source provenance
  presets, expressed as DESIGN.md YAML fragments.

### Integration refs

- [31-selection-comment-and-decision-mini](references/31-selection-comment-and-decision-mini.md) — Phase 2.5
  > What this is · Scaffold to emit · Lib functions called · Selection-ring override (specific to slides) · Hover-glow override (specific to slides) · When to use this reference · Don'ts · Decision-mini attachment timing · Visual verification · Source provenance
  contract: `data-ve-id` / `data-ve-type` / `data-ve-label` / `tabindex`
  attribute stamping; the inset-outline + inset-glow overrides.
- [32-poster-mode](references/32-poster-mode.md) — `kind: "poster"` — single-slide static
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · When to pick poster vs single-slide deck · Don'ts · Poster aspect ratio · Print / export workflow · Visual verification · Best layouts for posters · Use cases for posters in practice · Source provenance
  export, no nav chrome, share-card aspect.
- [33-print-and-pdf-export](references/33-print-and-pdf-export.md) — `@media print` block,
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Print-preview troubleshooting · Browser quirks · Don'ts · Visual verification · PDF vs PNG export comparison · Page-size tuning by aspect · Source provenance
  one-slide-per-page native browser export.
- [37-speaker-notes-presenter-mode](references/37-speaker-notes-presenter-mode.md) — per-slide `notes` field
  > What this is · Scaffold to emit · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · postMessage contract · When to use this reference · When NOT to use notes · Authoring rules · Don'ts · Visual verification · Source provenance
  + the `?notes` window via `postMessage`.
- [38-self-contained-export-and-deps](references/38-self-contained-export-and-deps.md) — the deployment
  > What this is · Script load order · Why no CDN · Conditional script ordering — keeping the deck minimal · Lib functions called · DESIGN.md tokens used · `<noscript>` fallback · When to use this reference · Don'ts · Visual verification · Source provenance
  contract: one HTML file + 2 to 5 sibling scripts, no CDN.
- [39-aspect-ratios-deep-dive](references/39-aspect-ratios-deep-dive.md) — when to pick `16:9` vs
  > What this is · Why 16:9 is the default · When 4:3 is correct · When 3:2 is correct · What changes per aspect · Layout efficiency by aspect · Scaffold to emit · Mixing aspects — DON'T · Lib functions called · DESIGN.md tokens used · Selection / comment / decision-mini contract notes · When to use this reference · Don'ts · Visual verification · Source provenance
  `4:3` vs `3:2`; layout efficiency table per aspect.

### Debugging refs

- [40-fail-fast-errors-and-debugging](references/40-fail-fast-errors-and-debugging.md) — every hard error +
  > What this is · Scaffold — using the warnings programmatically · Lib functions called · When to use this reference · Debugging workflow · Don'ts · Visual verification · Programmatic linting · Worked examples — fix-by-message · Source provenance
  every soft warning the renderer can emit, with the fix.

### Routing ref

- [41-decision-matrix-when-to-choose-slides](references/41-decision-matrix-when-to-choose-slides.md) — the full
  > What this is · Decision flowchart · When to pick `slide-decks` · When NOT to pick slide-decks · Boundary cases · Authoring-quality checklist before picking slide-decks · Lib functions called · When to use this reference · Common mis-dispatches · Don'ts · Visual verification · Source provenance
  matrix for picking slide-decks vs prose-pages / charts / diagrams /
  tables / modal-comments / share-pages.

### Legacy long-form catalog

- [slide-deck-mode](references/slide-deck-mode.md) — when to switch to deck mode, content
  > When to use slide deck mode · Content completeness · Slide types and visual richness · Compositional variety · Curated presets · The --slides flag on existing prompts
  completeness, the `--slides` flag.
- [slide-patterns](references/slide-patterns.md) — the legacy long-form catalog (kept for
  > Planning a Deck from a Source Document · Slide Engine Base · Typography Scale · Cinematic Transitions · Navigation Chrome · SlideEngine JavaScript · Auto-Fit · Slide Type Layouts · Decorative SVG Elements · Proactive Imagery · Compositional Variety · Presentation Readability · Content Density Limits · Responsive Height Breakpoints · Curated Presets · Slide selection wiring
  the `next-slide` and Folio source links; the layouts catalog has been
  deduplicated into the §6 list above and re-organised into the per-layout
  refs `05`-`21`).

## Visual verification

Every authoring change to a deck — new slide, new layout choice,
new preset, new transition — MUST be verified via the dev-browser
screenshot path described in [amvcp-self-debug-rules](../amvcp-self-debug-rules/SKILL.md).
Capture light + dark at 1280×720; verify the deck reads at projection
distance; verify the console reports zero `amvcp-slide:` errors and
that any `data-vsd-headline-warn` / `data-vsd-overflow` warnings are
either fixed or acknowledged as intentional.
