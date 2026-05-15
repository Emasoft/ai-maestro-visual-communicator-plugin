---
name: amvcp-slide-decks
description: "Author magazine-quality slide decks as one self-contained interactive HTML file from a JSON deck contract. Fixed-aspect letterbox stage, 16 named layouts, 5 entrance moods, 4 transitions, theme-aware light + dark, dependency-free renderer (no reveal.js, no GSAP, no CDN). Use when the user asks for a presentation, slide deck, talk slides, pitch deck, or to turn a plan into slides. Trigger with 'slide deck', 'presentation', 'pitch deck', 'turn this into slides', '/amvcp-generate-slides', or '--slides'."
license: MIT
compatibility: "Browser (ResizeObserver, requestAnimationFrame). Python 3.12+ renderer ships amvcp-slide.js + amvcp-designmd.js beside the HTML."
metadata:
  author: Emasoft
---

# Slide Decks

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

## Resources

- `references/slide-deck-mode.md` — when to switch to deck mode, content completeness, the `--slides` flag.
- `references/slide-patterns.md` — the legacy long-form catalog (kept for the `next-slide` and Folio source links; the layouts catalog has been deduplicated into the §6 list above).
