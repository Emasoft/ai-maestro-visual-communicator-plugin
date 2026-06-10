# 38 — Self-contained export + sibling-module dependencies

## Table of Contents

- [What this is](#what-this-is)
- [Script load order](#script-load-order)
- [Why no CDN](#why-no-cdn)
- [Conditional script ordering — keeping the deck minimal](#conditional-script-ordering--keeping-the-deck-minimal)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [`<noscript>` fallback](#noscript-fallback)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

A slide deck is ONE `.html` file. No CDN. No external CSS. No
external fonts. No build step. The HTML embeds the JSON deck, the
optional DESIGN.md preset, and ships beside the two scripts
(`amvcp-designmd.js` + `amvcp-slide.js`). Optionally three more
sibling modules for delegated blocks (`code`, `diagram`, `chart`).

This reference is the deployment contract: what goes in the HTML,
what ships beside it, what fails fast on missing dependencies.

## What this is

A deployable slide deck is a 3-to-6 file bundle:

| File | Required? | Purpose |
|---|---|---|
| `deck.html` | Yes | The page. Contains the embedded JSON + preset. |
| `amvcp-designmd.js` | Yes | Token engine. ~20 KB minified. |
| `amvcp-slide.js` | Yes | Slide module. ~50 KB minified. |
| `amvcp-code-highlight.js` | Conditional | If any slide uses `code` block. |
| `amvcp-diagram.js` | Conditional | If any slide uses `diagram` block. |
| `amvcp-chart.js` | Conditional | If any slide uses `chart` block. |

All five JS files ship as plain `<script>` tags. No `import`. No
bundler. No build.

The HTML structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Q3 Engineering Readout</title>
  <noscript><style>.vsd-slide{position:static!important;height:100dvh!important;}</style></noscript>
</head>
<body>
  <script type="application/json" id="vsd-deck">
  {"kind":"deck","title":"…","slides":[…]}
  </script>

  <script type="text/markdown" id="vsd-preset">
  ---
  name: Midnight Editorial
  colors: …
  ---
  </script>

  <script src="./amvcp-designmd.js"></script>
  <script src="./amvcp-code-highlight.js"></script>
  <script src="./amvcp-diagram.js"></script>
  <script src="./amvcp-chart.js"></script>
  <script src="./amvcp-slide.js"></script>
</body>
</html>
```

## Script load order

CRITICAL: the script tags must load in this order:

1. `amvcp-designmd.js` — defines `window.amvcpDesignMd`.
2. Sibling modules (any order):
   - `amvcp-code-highlight.js` — defines `window.amvcpCodeHighlight`.
   - `amvcp-diagram.js` — defines `window.amvcpDiagram`.
   - `amvcp-chart.js` — defines `window.amvcpChart`.
3. `amvcp-slide.js` — defines `window.amvcpSlideDeck`. Auto-boots
   on `DOMContentLoaded`.

The slide module's `boot()` checks for the sibling modules at
render time; if a slide uses a delegated block but the sibling
module is missing, the renderer THROWS with a clear message
naming the missing global.

## Why no CDN

The consolidated plan EXPLICITLY excludes reveal.js (SL-06)
because:

1. CDN dependency means the deck breaks offline / on slow
   networks.
2. reveal.js owns its own theming, bypassing the DESIGN.md engine.
3. reveal.js's CSS is too opinionated to integrate with the
   `--vc-*` token system.

The same logic excludes:
- Mermaid CDN (the `amvcp-diagram.js` module renders
  diagrams natively).
- Shiki CDN (the `amvcp-code-highlight.js` module renders code
  natively).
- Chart.js CDN (the `amvcp-chart.js` module renders charts
  natively).
- Google Fonts CDN (the system font stack is the default; custom
  fonts must be embedded as `@font-face` blocks).

The whole bundle is self-contained, offline-runnable, emailable
as one attachment.

## Conditional script ordering — keeping the deck minimal

If a deck doesn't use `code` / `diagram` / `chart`, OMIT those
sibling modules. The slide module's delegate check is at render
time; it only throws if a slide TRIES to use the block. A deck
with no delegated blocks loads zero KB of sibling JS.

```html
<!-- Minimal deck: no code, diagrams, or charts -->
<script src="./amvcp-designmd.js"></script>
<script src="./amvcp-slide.js"></script>
```

The fail-fast behaviour: a slide that uses `type: "code"` without
`amvcp-code-highlight.js` loaded throws with:

```
amvcp-slide: block type "code" needs the code-block
(amvcp-code-highlight.js) renderer module, but
window.amvcpCodeHighlight.renderInto is not available. Include that
module's <script> in the deck.
```

## Lib functions called

- `boot(doc)` in `amvcp-slide.js` — auto-fires on
  `DOMContentLoaded`. Reads `#vsd-deck` + optional `#vsd-preset`.
  Calls `parseDeck()` → `renderDeck()` → `createDeck()` →
  `fitStage()`.
- `renderDelegated(doc, block, type)` — checks `window[meta.global]`
  for each delegated block; throws on missing module.
- `boot(doc)` also reads `window.__vsdManualInit` — if `true`,
  skips auto-boot, letting the caller drive `parseDeck()` /
  `renderDeck()` manually (used by the test harness fixtures).

## DESIGN.md tokens used

None directly — this is the deployment-shape reference, not a
theming reference. See ref #30 for the full token map.

## `<noscript>` fallback

When JavaScript is disabled, the embedded `<noscript>` style block
falls back to "every slide stacks vertically at 100dvh":

```html
<noscript>
  <style>
    .vsd-slide{position:static!important;height:100dvh!important;}
  </style>
</noscript>
```

The reader can still scroll through the slides; they just won't
get the letterbox stage / nav chrome / transitions. The
no-nested-scrollbars rule applies — the page expands; no inner
scroller.

## When to use this reference

Open this ref when:

- Shipping a deck for the first time — verify the file bundle.
- A deck doesn't render — check the script load order + console
  errors for missing modules.
- The user asks "can I email this deck?" — yes, attach all 3-6
  files in one `.zip`; recipient unzips + opens `deck.html`
  locally.
- Auditing a deck for self-containment — verify no external
  `<script src>` / `<link href>` / `@import url()` references.

## Don'ts

- Don't load any of the modules from a CDN. The self-containment
  is the whole value proposition.
- Don't bundle the modules into the HTML via `<script>…</script>`
  inline. Inline `<script>` blocks blow the embedded-JSON
  `<script type="application/json">` size budget and break the
  parse.
- Don't author the HTML by hand. Use a template that fills in the
  embedded JSON + preset; the structure is fixed.
- Don't fork the modules to add features. Adding features in a
  fork makes the deck non-portable (the fork has to ship every
  time). Contribute upstream instead.

## Visual verification

After packaging a deck for shipping:

1. Move the bundle to a fresh directory.
2. Disable network in DevTools.
3. Open `deck.html`.
4. Verify the deck renders fully (no broken images, no missing
   fonts, no console errors about missing modules).
5. Verify all interactive features work (nav, comments,
   decision-minis).
6. Verify the print preview works (Cmd-P → one slide per page).

## Source provenance

- The self-containment rule comes from `slide-patterns.md` line
  21 ("self-contained HTML slide presentations").
- The "no CDN" exclusion of reveal.js is SL-06 in the master
  catalog.
- The 3-6 file bundle is the consolidated deployment contract
  documented in the spec.
- The fail-fast behaviour on missing sibling modules is the
  slide-spec.md §5.4 / §12.2 rule.
- The `<noscript>` fallback is the graceful-degradation pattern
  from the no-nested-scrollbars rule in `~/.claude/rules/
  no-nested-scrollbars.md`.
