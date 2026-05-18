---
name: amvcp-typography
description: "Typography foundation for visual-communicator pages — 33-reference encyclopedia covering every typographic surface a DESIGN.md page emits: fluid clamp() scale + 4 modular systems, semantic role-to-token hierarchy, variable-font (wght/opsz/features) + static-font fallback, banned-font-free pairings + offline loading, eyebrow/lead/drop-cap/blockquote/pull-quote/figure, lists (ul/ol/dl + 6 marker variants), link/anchor/TOC, em/strong/mark/ins/del, small-caps/acronyms, OpenType ligatures, language/CJK bridge, print + page-breaks, accessibility, badge/pill/chip, time, footnote, kbd, smart quotes, fluid headings, multi-column. Theme purely off --vc-* tokens — swap restyles every size/weight/font/leading/tracking live in both light + dark. Use when scaffolding or restyling any type surface. Trigger with 'set up typography', 'fluid type scale', 'font pairing', 'type specimen', 'eyebrow', 'tabular nums', 'drop cap', 'justify column', 'footnotes', 'pull quote', 'CJK', 'print stylesheet', 'small caps', 'sticky TOC', 'keyboard shortcut'."
license: MIT
compatibility: "Any modern browser. Requires the DESIGN.md engine (scripts/amvcp-designmd.js). No npm runtime dependency."
metadata:
  author: Emasoft
---

# Typography

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md) — load the umbrella first to route between the 13 category skills.

## Overview

The typography skill is the **foundation recipe** (Tier 1) that gives
a visual-communicator page a coherent type system: a fluid `clamp()`
type scale, a semantic role-to-token hierarchy, a variable-font axis
layer, curated font pairings, and the full editorial register
(eyebrows, leads, drop caps, pull quotes, captions, badges, kbd
chips, footnotes, citations, smart punctuation). It is **authoring
guidance + a CSS layer + a small JS helper** — not a per-element
renderer.

It consumes the DESIGN.md engine's `--vc-*` typography tokens
(`--vc-text-<i>`, `--vc-font-*`, `--vc-weight-*`, `--vc-line-height`)
and maps them onto semantic element selectors. Because the CSS layer
sets only size / weight / font / leading / tracking / opacity-tint —
never a hardcoded `color` — it is automatically correct in **both
light and dark** themes, and a DESIGN.md hot-swap restyles every type
size live with zero markup change.

`report-doc`, `slide`, `table`, `chart`, and every other content
skill build on this skill's public API — the 11-row semantic
hierarchy contract (see
[semantic-hierarchy.md](./references/semantic-hierarchy.md)) plus the
  > B.1 The contract table · B.2 How it is delivered · B.3 Why the hierarchy is *strict* · B.4 No-nested-scrollbars compliance · B.5 Light + dark — correct for free · B.6 Runtime migration map (NOT this skill's build work) · Tokens consumed
24 extension utility classes documented across the 33 references.

## Progressive discovery

The 33 references are organised so an agent can find the right
technique without reading them all. The top-level
"When to choose this category" table below routes by INTENT; each
reference's own opening paragraph routes further. The skill works
fine if the agent reads only:

1. This SKILL.md (the contract overview).
2. The 1-3 references most directly relevant to the page being
   scaffolded.
3. `semantic-hierarchy.md` once for the contract everything else
   builds on.

## When to choose this category

| If you need to … | Read |
|---|---|
| Set up the fluid `clamp()` body scale | [type-scale-engine.md](./references/type-scale-engine.md) |
  > A.1 What it does · A.2 The clamp() machinery · A.3 The HTML it scaffolds · A.4 The four modular-scale systems · A.5 Pre-computed scales for base 16px · A.6 Display-tier optical correction (TY-08) · A.7 The type-specimen page (sub-technique E) · Tokens consumed / extended · No nested scrollbars
| Bind `<h1>`…`<h6>` / `<p>` / `<small>` to the right tokens | [semantic-hierarchy.md](./references/semantic-hierarchy.md) |
  > B.1 The contract table · B.2 How it is delivered · B.3 Why the hierarchy is *strict* · B.4 No-nested-scrollbars compliance · B.5 Light + dark — correct for free · B.6 Runtime migration map (NOT this skill's build work) · Tokens consumed
| Pick a font pairing from 5 presets + the offline System | [font-loading-pairings.md](./references/font-loading-pairings.md) |
  > D.1 DT-09 banned-font reconciliation · D.2 The five pairings · D.3 Loading discipline · D.4 The offline / System pairing · D.5 CJK — cross-reference to `design-tokens` DT-25 · Tokens consumed
| Use a tri-font stack (serif headings + sans body + mono labels) | [tri-font-stack-anthropic.md](./references/tri-font-stack-anthropic.md) |
  > What it is · Why three faces (not two) · DESIGN.md frontmatter · The three Google-Fonts-served tri-font presets · Banned-font check · Tokens consumed / extended · The `<code>` chip — the integration receipt · Selection-contract conformance · When to choose a tri-font preset · When to choose System over a Google-served preset · Light + dark — orthogonal · Verification · Cross-references
| Load Google Fonts with `display:swap` + preconnect + metric-matched fallback | [font-fallback-and-display-swap.md](./references/font-fallback-and-display-swap.md) |
  > What it is · The contract · The Google Fonts URL · The preconnect optimisation · Self-hosting via `@font-face` · Metric-matched fallbacks — `size-adjust` · Variable-font weight ranges · Subsetting — `&text=` · Tokens consumed / extended · Light + dark — orthogonal · When the network fails · `font-display: optional` for opt-out · Selection-contract conformance · Verification · When NOT to use a web font · Cross-references
| Add the `wght` / `opsz` variable-font tokens + static-font fallback | [variable-font-tokens.md](./references/variable-font-tokens.md) |
  > C.1 What it does · C.2 The semantic weight tokens · C.3 The optical-size tokens · C.4 The variable-font axis layer · C.5 The static-font fallback — fail-soft (TY-04 requirement) · C.6 The JS feature-detect — diagnostic only · C.7 TY-10 — stylistic alternates · Tokens consumed / extended
| Add the canonical eyebrow / overline / label above a heading | [eyebrow-overline-label.md](./references/eyebrow-overline-label.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Visual variants · Tracking — why exactly 0.08em · Sizing — why 11px and not 12px · Light + dark — correct for free · Selection-contract conformance · Decision-mini-pill · Comment thread · When to choose this technique · When NOT to use it · No nested scrollbars · Light/dark coverage check · Migration from runtime hard-codes · Cross-references
| Set up a lead paragraph after a heading | [lead-paragraph.md](./references/lead-paragraph.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why size step 3, not step 4 · Why line-height 1.60 (looser than body's 1.55) · The first-letter drop cap — when to add it · The clay/colour left-border — TL;DR card variant · Light + dark — correct for free · Selection-contract conformance · Why two aliases (`vc-type-lead` AND `vc-type-body-lg`) · When NOT to use a lead · Lead + eyebrow + heading — the standard opener · No nested scrollbars · Cross-references
| Add a drop cap to an editorial opener | [drop-cap-and-initial.md](./references/drop-cap-and-initial.md) |
  > What it is · Scaffold · The contract — the alternative `vc-initial-large` · Tokens consumed / extended · Why the heading face for the first letter · The `:first-of-type` qualifier — only the first paragraph · The all-caps risk — `::first-letter` and `text-transform` · Multilingual considerations · Light + dark — fully covered · Browser support · Selection-contract conformance · When to use a drop cap · When NOT to use a drop cap · Verification · Cross-references
| Set up a blockquote (with cite) or a pull quote | [pull-quote-and-blockquote.md](./references/pull-quote-and-blockquote.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why blockquote uses the body face but pull quote uses the heading face · The cite attribution — `<cite>` styling · Border colour — `var(--vc-color-accent, currentColor)` · The pull quote alignment — center vs left · Light + dark — fully covered · The pull quote with opening / closing quotation glyphs · When to use blockquote vs pull quote · When NOT to use a pull quote · Selection-contract conformance · Verification · Cross-references
| Style bullets, numerals, definition lists, tight / loose / dashed / check / cross | [lists-and-list-typography.md](./references/lists-and-list-typography.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · The density modifiers — tight / loose · The dashed-bullet modifier · The square-bullet modifier (status / report convention) · The check / cross / olive-dot variants · The numeral variants — `type="a"`, `type="A"`, `type="i"`, `type="I"`, `type="1"` · Definition list — `<dl>` typography · Light + dark — fully covered · Nested list rhythm · Selection-contract conformance · When NOT to use a list · Verification · Cross-references
| Style links + anchors with AAA contrast + focus rings + visited / hover states | [links-and-anchors.md](./references/links-and-anchors.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `text-underline-offset: 0.2em` · Why `text-decoration-skip-ink: auto` · Why `text-decoration-thickness: 1px` (not the default) · Focus — `:focus-visible` not `:focus` · The visited-state colour — desaturated, not separate · The `.vc-link-quiet` modifier — underline only on hover · The `.vc-link-button` modifier — button-shaped link · The `.vc-link-external` modifier — small "↗" icon · Light + dark — fully covered · Accessibility — the AAA contrast pair · Selection-contract conformance · When NOT to underline · When the engine has no link token · Verification · Cross-references
| Add `<em>` / `<strong>` / `<mark>` / `<ins>` / `<del>` / `<s>` / `<u>` styling | [emphasis-and-strong.md](./references/emphasis-and-strong.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic and not just colour for `<em>` · Why bold and not bigger for `<strong>` · Why `<mark>` uses a tinted background, not a colour change · `<ins>` and `<del>` — the revision pair · `<u>` — dotted, not solid · `<s>` — generally available, often misused · Combined `<em><strong>` — the absolute-critical case · Light + dark — fully covered · Combinations with `text-transform` · Selection-contract conformance · When NOT to use · Verification · Cross-references
| Render acronyms as small caps in body prose | [small-caps-and-petite-caps.md](./references/small-caps-and-petite-caps.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why both `font-variant-caps` AND `font-feature-settings` · True vs synthesised small caps · When to use small caps · When NOT to use small caps · Small caps vs `text-transform: uppercase` · The light + dark coverage · Why `letter-spacing: 0.04em` on `.vc-acronym` · Comparison with `<abbr title="…">` — semantic abbreviation · Selection-contract conformance · Browser support · Verification · Cross-references
| Enable OpenType ligatures / fractions / ordinals / stylistic alternates | [ligatures-and-opentype-features.md](./references/ligatures-and-opentype-features.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why common-ligatures ON by default · Why discretionary-ligatures OFF by default · Why kerning is explicitly set · Auto-fractions vs Unicode fractions · Stylistic sets — `ss01` through `ss20` · Light + dark — orthogonal · Browser support · When the font doesn't have a feature · Selection-contract conformance · When NOT to opt in · Verification · Cross-references
| Render inline `<code>` chips, `<pre>` blocks, `<kbd>`, `<samp>`, `<var>` | [code-and-mono.md](./references/code-and-mono.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `0.9em` (not `var(--vc-text-N)`) · Why `<pre>` uses `--vc-text-1` (one step down from body) · No nested scrollbars on `<pre>` · `<kbd>` — the 1px border trick · `<var>` — italic mono · Tabular numerics in `<pre>` / `<code>` · Light + dark — fully covered · Selection-contract conformance · When to use which element · Cross-references
| Document a keyboard shortcut (single key, combo, multi-step chord, modifier glyphs) | [keyboard-shortcut-typography.md](./references/keyboard-shortcut-typography.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · The modifier-key glyph mapping · The cross-platform convention · Why `white-space: nowrap` on `.vc-keycombo` · The plus separator opacity · Light + dark — fully covered · Accessibility — `aria-label` for clarity · Selection-contract conformance · When NOT to use `<kbd>` · Verification · Cross-references
| Render `<sup>` / `<sub>` and footnotes with back-references | [superscript-subscript-and-footnotes.md](./references/superscript-subscript-and-footnotes.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `line-height: 0` on `<sup>` / `<sub>` · Why `vertical-align: baseline` + `position: relative` + `top: -0.5em` · Why `font-size: 0.75em` · The footnote back-reference · Click-target sizing · Ordinal markers — `<sup>` vs `font-variant-numeric: ordinal` · Mathematical notation — `<sup>` vs MathML / KaTeX · Light + dark — fully covered · Selection-contract conformance · When NOT to use footnotes · Verification · Cross-references
| Render a `<figure>` + `<figcaption>` with auto-numbering | [figure-and-caption.md](./references/figure-and-caption.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic caption · Why `opacity: 0.85` (not a colour) · The CSS counter — `counter-increment` + `counter()` · Side-floated figures and body wrap · Wide figures and the `100vw` trick · Alt text — non-negotiable · The `<picture>` element for responsive images · Light + dark — fully covered · Selection-contract conformance · When NOT to wrap in `<figure>` · Verification · Cross-references
| Lock numeric columns with tabular numerics | [tabular-numerics.md](./references/tabular-numerics.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · When the data also wants right-alignment · Mono numerics — sibling pattern · Old-style figures vs lining figures · The runtime's existing tabular numerics use · Slashed zero — when to opt in · Fail-soft on fonts without these features · Light + dark — orthogonal to theming · Selection-contract conformance · When NOT to use it · Cross-references
| Render `<time>` + a column of dates as a spreadsheet-grade table | [time-and-datetime-typography.md](./references/time-and-datetime-typography.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why tabular numerics by default for `<time>` · ISO 8601 — the universal datetime form · Why `.vc-datetime-tabular` switches to mono · ISO-week and Year-month · Light + dark — orthogonal · Tabular numerics composition with other numeric features · Inline date format conventions · Timezone display · Selection-contract conformance · The runtime's date use · When NOT to wrap text in `<time>` · Verification · Cross-references
| Cap body prose width at the 65-character readability sweet spot | [measure-and-readability.md](./references/measure-and-readability.md) |
  > What it is · Scaffold · Tokens consumed / extended · The exact numbers — why 65ch · Variations — `.vc-type-measure-narrow`, `.vc-type-measure-wide` · Mixing with `text-align: justify` · Centering vs left-aligned containers · The runtime's body width — current state · When NOT to use measure · When measure conflicts with the grid · Light + dark — orthogonal · Selection-contract conformance · Verification · Cross-references
| Add justification + hyphenation for narrow columns | [hyphenation-and-justification.md](./references/hyphenation-and-justification.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · When to opt in · Why `hyphens: auto` and not `hyphens: manual` · The `.vc-no-hyphens` modifier · The widow / orphan controls · Light + dark — orthogonal · Browser support · The runtime's existing justification use · When NOT to use justification · Forbidden — `text-justify: distribute` · CJK justification · Selection-contract conformance · Cross-references
| Set up multi-column body layout with widows / orphans / column-span | [multi-column-layout.md](./references/multi-column-layout.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · When to choose multi-column · Why `column-width` AND `column-count` · The widow/orphan tuning · Heading fragmentation · Light + dark — fully covered · Browser support · A heading that spans all columns · When the multi-column collapses to 1 · Selection-contract conformance · When NOT to use multi-column · Forbidden — fixed-height multi-columns · Cross-references
| Set inter-paragraph spacing + heading-to-content rhythm + baseline grid | [spacing-and-vertical-rhythm.md](./references/spacing-and-vertical-rhythm.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why margin-bottom only (not margin-top) on paragraphs · The `:first-child` no-top-margin rule · The adjacent-sibling rule for heading-then-paragraph · The eyebrow-then-heading tight pairing · Baseline grid — `.vc-baseline-grid` · Why heading margins decrease with rank · Light + dark — orthogonal · When the agent overrides · Selection-contract conformance · When NOT to follow the contract · Verification · Cross-references
| Set fluid heading sizes for slides, dashboards, hero stats | [responsive-fluid-headings.md](./references/responsive-fluid-headings.md) |
  > What it is · The contract · Why each constant — the tuning · Scaffold · Tokens consumed / extended · The viewport-curve formula · Why pure `vw` and not `rem + vw` · Height breakpoints — compact viewports · Light + dark — orthogonal · The `clamp()` math when `vw` doesn't work — print and PDF · Browser support · Selection-contract conformance · When NOT to use fluid headings · Verification · Cross-references
| Style heading anchors + a sticky / right-margin TOC | [heading-anchor-and-toc.md](./references/heading-anchor-and-toc.md) |
  > What it is · The heading-anchor contract · Scaffold — heading with anchor · TOC contract · Scaffold — TOC · Tokens consumed / extended · Why mono for the anchor "#" · Why the TOC uses `border-left` for hover state · Sticky TOC and `no-nested-scrollbars` · TOC right-side variant — the fixed sidebar · Skip link integration · Light + dark — fully covered · Accessibility — `aria-label` on `<nav>` · When NOT to add heading anchors · When NOT to add a TOC · Selection-contract conformance · Verification · Cross-references
| Style badges, pills, chips, auto-pills (with severity colouring deferred to design-tokens) | [badge-pill-chip-typography.md](./references/badge-pill-chip-typography.md) |
  > What it is · The shared typography contract · Scaffold · Tokens consumed / extended · Why `white-space: nowrap` · Why `border-radius: 999px` for pills, `4px` for chips · Tabular numerics in pills · Auto-pill — the "auto-generated" doc marker · Light + dark — fully covered · Severity colouring — DT-19 ownership · Accessibility · The runtime's current pill use · Selection-contract conformance · When to use each · Verification · Cross-references
| Set `<html lang>` and per-element `lang` (the prereq for hyphenation, quotes, CJK fonts) | [language-and-locale.md](./references/language-and-locale.md) |
  > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and `lang="zh-Hans"` / `"zh-Hant"` / `"ja"` / `"ko"` · Why we don't use `<meta http-equiv="Content-Language">` · The runtime's language declaration · Tokens consumed / extended · Light + dark — orthogonal · Selection-contract conformance · The `:lang()` CSS selector · When NOT to set `lang` · Verification · Cross-references
| Render CJK content (cross-references DT-25 in design-tokens) | [cjk-typography-bridge.md](./references/cjk-typography-bridge.md) |
  > What it is · What the typography skill emits · What the typography skill DEFERS to DT-25 · Scaffold — a CJK-tagged page · Scaffold — mixed Latin / CJK content · Tokens consumed / extended · Why this skill doesn't OWN the CJK contract · The bouten / kenten dot pattern · Why `#ff6600` (Claude orange) · CJK with `<html lang="zh-Hans">` vs `"zh-Hant">` · Light + dark — correct for both · Selection-contract conformance · When NOT to use the CJK contract · Verification · Cross-references
| Use smart curly quotes, em-dashes, en-dashes, ellipses | [quotation-marks-and-smart-typography.md](./references/quotation-marks-and-smart-typography.md) |
  > What it is · The `<q>` element default · Editorial conventions — the four smart-punctuation rules · Typing the Unicode characters · Why the agent should use the Unicode characters directly · Tokens consumed / extended · The `.vc-no-smart-quotes` utility · The hairspace and thinspace — the fine details · Light + dark — orthogonal · Selection-contract conformance · When to ignore the conventions · Verification · Cross-references
| Set up a print stylesheet with `@page`, page breaks, URL-after-link, no-print utilities | [print-and-paged-media.md](./references/print-and-paged-media.md) |
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `11pt` body and not a `var(--vc-text-2)` · Why `1.5cm 1.5cm 2cm 1.5cm` margins · Why `break-after: avoid` on headings · Why show URLs for `<a href="http…">` · The `.vc-no-print` and `.vc-only-print` utilities · Forced page breaks · Disabling animation on print · Light + dark — N/A for print · Browser support · The runtime's print path · Forbidden — inner scrollbars on print · Selection-contract conformance · When NOT to ship print CSS · Verification · Cross-references
| Make the page accessible: semantic HTML, contrast, focus rings, reduced-motion, skip-link | [accessibility-and-screen-reader.md](./references/accessibility-and-screen-reader.md) |
  > What it is · Contract — semantic HTML · The contrast gates · `prefers-reduced-motion` · `prefers-contrast` · `prefers-color-scheme` · Focus rings — the keyboard contract · Skip links — the navigation contract · Alt text — typography's role · Semantic landmarks · The `aria-label` / `aria-labelledby` contract · Tokens consumed / extended · Light + dark — orthogonal · When the agent should override · When NOT to override · Verification · Cross-references

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the
  page — it emits the `--vc-*` tokens this skill themes off.
- A modern browser. No npm dependency. Google Fonts is an optional
  `<link>`; every pairing also ships a system fallback so a page
  works offline.
- `<html lang="…">` MUST be set (see
  [language-and-locale.md](./references/language-and-locale.md)) —
    > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and `lang="zh-Hans"` / `"zh-Hant"` / `"ja"` / `"ko"` · Why we don't use `<meta http-equiv="Content-Language">` · The runtime's language declaration · Tokens consumed / extended · Light + dark — orthogonal · Selection-contract conformance · The `:lang()` CSS selector · When NOT to set `lang` · Verification · Cross-references
  every language-aware typography feature depends on it.

## Instructions

1. **Pick a scale system.** Default **Perfect Fourth** (ratio
   1.333) — strong UI/dashboard hierarchy. Alternatives: Minor Third
   (1.200), Major Third (1.250), Golden (1.618). See
   [type-scale-engine.md](./references/type-scale-engine.md).
     > A.1 What it does · A.2 The clamp() machinery · A.3 The HTML it scaffolds · A.4 The four modular-scale systems · A.5 Pre-computed scales for base 16px · A.6 Display-tier optical correction (TY-08) · A.7 The type-specimen page (sub-technique E) · Tokens consumed / extended · No nested scrollbars
2. **Pick a font pairing** from the five banned-font-free presets,
   the offline **System** pairing, or one of the three **tri-font**
   stacks (serif + sans + mono). See
   [font-loading-pairings.md](./references/font-loading-pairings.md)
     > D.1 DT-09 banned-font reconciliation · D.2 The five pairings · D.3 Loading discipline · D.4 The offline / System pairing · D.5 CJK — cross-reference to `design-tokens` DT-25 · Tokens consumed
   and [tri-font-stack-anthropic.md](./references/tri-font-stack-anthropic.md).
     > What it is · Why three faces (not two) · DESIGN.md frontmatter · The three Google-Fonts-served tri-font presets · Banned-font check · Tokens consumed / extended · The `<code>` chip — the integration receipt · Selection-contract conformance · When to choose a tri-font preset · When to choose System over a Google-served preset · Light + dark — orthogonal · Verification · Cross-references
   NEVER recommend Inter / Roboto / Open Sans / Lato / Nunito as a
   *primary* font (the `design-tokens` DT-09 anti-slop gate).
3. **Embed the DESIGN.md `typography` block.** Put the chosen fonts
   and the generated `scale` array (the reference doc gives
   pre-computed arrays for base 16px) into the page's
   `<script type="text/design-md">` frontmatter. Optionally add
   `scale-hero` + the four semantic `weight-*` keys + `font-features`
   — all optional, all fall back cleanly when the engine does not
   emit them (see
   [variable-font-tokens.md](./references/variable-font-tokens.md)).
     > C.1 What it does · C.2 The semantic weight tokens · C.3 The optical-size tokens · C.4 The variable-font axis layer · C.5 The static-font fallback — fail-soft (TY-04 requirement) · C.6 The JS feature-detect — diagnostic only · C.7 TY-10 — stylistic alternates · Tokens consumed / extended
4. **Embed `amvcp-typography.css` inline** in the page `<head>` (a
   `<style>` block), exactly as the slide/prose skills emit their CSS
   inline. It is ~6 KB, additive and idempotent.
5. **Write plain semantic HTML.** `<h1>`…`<h6>`, `<p>`, `<small>`,
   `<a>`, `<em>`, `<strong>`, `<mark>`, `<code>`, `<pre>`, `<kbd>`,
   `<ul>`, `<ol>`, `<dl>`, `<blockquote>`, `<figure>`, `<time>`,
   `<sup>`, `<sub>` are all correct with **no class** — the CSS
   layer's element defaults bind each to the right token. Use
   `.vc-type-hero` / `.vc-type-lead` / `.vc-type-label` /
   `.vc-type-overline` / `.vc-pullquote` / `.vc-drop-cap` /
   `.vc-tabular-nums` / `.vc-acronym` / `.vc-type-measure` /
   `.vc-type-justify` / `.vc-type-multicol` / `.vc-chip-base` /
   `.vc-toc` / `.vc-skip-link` / `.vc-link-button` /
   `.vc-link-external` / `.vc-no-print` / `.vc-only-print` for
   roles HTML has no native element for.
6. **For live scale switching** add `data-ve-type-scale="<system>"`
   on `<html>` and load
   `skills/amvcp-typography/scripts/amvcp-typography.js`. Its
   calculator recomputes the px anchor array and feeds it through
   the engine round-trip — it never sets `--vc-text-<i>` directly
   (one source of truth). For a static pre-generated scale **no JS
   is needed**.
7. **Set `<html lang>`** to the correct BCP-47 language tag. This is
   the prerequisite for hyphenation, smart quotes, CJK font
   selection, screen-reader TTS pronunciation, and the `:lang()`
   selector chain. See
   [language-and-locale.md](./references/language-and-locale.md).
     > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and `lang="zh-Hans"` / `"zh-Hant"` / `"ja"` / `"ko"` · Why we don't use `<meta http-equiv="Content-Language">` · The runtime's language declaration · Tokens consumed / extended · Light + dark — orthogonal · Selection-contract conformance · The `:lang()` CSS selector · When NOT to set `lang` · Verification · Cross-references

## Output

A DESIGN.md-themed page whose every type size, weight, font, leading,
tracking, opacity-tint is token-driven and theme-correct in BOTH
light and dark themes. The skill's concrete artifact is the
**type-specimen page**
([type-scale-engine.md](./references/type-scale-engine.md) §
  > A.1 What it does · A.2 The clamp() machinery · A.3 The HTML it scaffolds · A.4 The four modular-scale systems · A.5 Pre-computed scales for base 16px · A.6 Display-tier optical correction (TY-08) · A.7 The type-specimen page (sub-technique E) · Tokens consumed / extended · No nested scrollbars
specimen) — a self-contained HTML page visualising the whole scale +
every utility class + light/dark switching, which doubles as the
dev-browser test fixture
(`tests/fixtures/typography-specimen.html`).

## Error Handling

| Symptom | Fix |
|---|---|
| `unknown type-scale system "…"` from the JS calculator | `data-ve-type-scale` must be one of the 4 named systems — the calculator fails fast, it never guesses a ratio. |
| A heading uses a raw `px` size | Wrong — write a bare `<h1>`…`<h6>` or a `.vc-type-*` class; never a literal size. |
| `--vc-text-*` resolves empty | The DESIGN.md engine is not loaded / its `typography` group is malformed. The CSS layer's `var()` fallbacks keep the page coherent, but fix the engine. |
| Banned font flagged by an audit | Swap to a pairing from this skill's list — all five are banned-font-free. |
| Text appears in the wrong (static) weight on a variable font | Confirm `font-variation-settings` is not being overridden; the JS `supportsVariableFonts()` detect (`data-ve-vfont`) tells you which path is live. |
| Hyphens don't appear at narrow widths | Set `<html lang>` correctly — hyphenation is language-aware. |
| `<sup>` / `<sub>` inflate line height | The contract sets `line-height: 0` on `<sup>` / `<sub>` to prevent this; check no override sets a different value. |
| Code block has an inner scrollbar | Wrong — `<pre>` should let the page extend horizontally; remove any `overflow-x: auto` (compliance with `no-nested-scrollbars.md`). |
| Visited links aren't desaturated | The `color-mix(in srgb, var(--vc-color-link) 70%, currentColor)` rule requires `color-mix` browser support (late 2023+). Older browsers render visited at the resting colour — still correct, just no distinction. |
| TOC sidebar has an internal scrollbar | Wrong — `.vc-toc-sticky` does NOT set `overflow: auto` (compliance with `no-nested-scrollbars.md`). Split the document instead. |

## Examples

**Example 1 — fluid type scale**

```html
<article class="vc-doc">
  <h1>Page title</h1>
  <h2>Section heading</h2>
  <p>Body copy using <code>--vc-size-md</code> (the fluid clamp() base).</p>
</article>
```

The type-role tokens (`--vc-size-h1`, `--vc-size-h2`, `--vc-size-md`) auto-clamp between 320 and 1280 px viewports.

**Example 2 — drop-cap pull-quote**

```html
<blockquote class="vc-pullquote" data-vc-dropcap>
  The single most important rule is to ship the document, not perfect it.
</blockquote>
```

**Example 3 — kbd shortcut callout**

```html
<p>Press <kbd>⌘</kbd>+<kbd>K</kbd> to open the palette, then type <kbd>tab</kbd>.</p>
```

## Visual verification

For every visual change, verify per
`skills/amvcp-self-debug-rules/SKILL.md` — a dev-browser screenshot
of the specimen page in BOTH the light and dark themes. The
typography contract is theme-orthogonal by construction (no
hardcoded `color`), so verification confirms the theme-swap renders
correctly.

## Modes

This skill supports `data-ve-mode="readonly"` only. It is the foundational typography layer — every other skill themes its text off the `--vc-text-*` and font tokens this skill defines. The type specimen view itself is readonly. The per-element 3-state decision pill (R20-R23) does NOT apply to type samples.

## Composability

This skill is composed by every other amvcp-* skill on the page (R22) — it is the substrate for text rendering. The only exclusive skill is the overlay-runtime (R24).

## Resources

The 33 references cover every typography surface a page emits.
Listed by category:

### Foundation (the 4 original references — Phase 2 builds)

- [type-scale-engine.md](./references/type-scale-engine.md) — fluid
  > A.1 What it does · A.2 The clamp() machinery · A.3 The HTML it scaffolds · A.4 The four modular-scale systems · A.5 Pre-computed scales for base 16px · A.6 Display-tier optical correction (TY-08) · A.7 The type-specimen page (sub-technique E) · Tokens consumed / extended · No nested scrollbars
  `clamp()` scale + 4 modular-scale systems + display-tier optical
  correction.
- [semantic-hierarchy.md](./references/semantic-hierarchy.md) — the
  > B.1 The contract table · B.2 How it is delivered · B.3 Why the hierarchy is *strict* · B.4 No-nested-scrollbars compliance · B.5 Light + dark — correct for free · B.6 Runtime migration map (NOT this skill's build work) · Tokens consumed
  11-row role-to-token contract (the public API).
- [variable-font-tokens.md](./references/variable-font-tokens.md) —
  > C.1 What it does · C.2 The semantic weight tokens · C.3 The optical-size tokens · C.4 The variable-font axis layer · C.5 The static-font fallback — fail-soft (TY-04 requirement) · C.6 The JS feature-detect — diagnostic only · C.7 TY-10 — stylistic alternates · Tokens consumed / extended
  `wght`/`opsz` token system + static-font fallback +
  `font-feature-settings` stylistic alternates.
- [font-loading-pairings.md](./references/font-loading-pairings.md) —
  > D.1 DT-09 banned-font reconciliation · D.2 The five pairings · D.3 Loading discipline · D.4 The offline / System pairing · D.5 CJK — cross-reference to `design-tokens` DT-25 · Tokens consumed
  the 5 named pairings + Google Fonts loading + System fallback +
  CJK cross-reference.

### Font + loading (3 references — extended Phase 3)

- [tri-font-stack-anthropic.md](./references/tri-font-stack-anthropic.md)
  > What it is · Why three faces (not two) · DESIGN.md frontmatter · The three Google-Fonts-served tri-font presets · Banned-font check · Tokens consumed / extended · The `<code>` chip — the integration receipt · Selection-contract conformance · When to choose a tri-font preset · When to choose System over a Google-served preset · Light + dark — orthogonal · Verification · Cross-references
  — the "serif headings + sans body + mono labels" preset (the most
  reused pattern in the AMVCP catalog).
- [font-fallback-and-display-swap.md](./references/font-fallback-and-display-swap.md)
  > What it is · The contract · The Google Fonts URL · The preconnect optimisation · Self-hosting via `@font-face` · Metric-matched fallbacks — `size-adjust` · Variable-font weight ranges · Subsetting — `&text=` · Tokens consumed / extended · Light + dark — orthogonal · When the network fails · `font-display: optional` for opt-out · Selection-contract conformance · Verification · When NOT to use a web font · Cross-references
  — `font-display`, preconnect, FOUT vs FOIT, metric-matched
  `size-adjust` fallbacks, self-hosted `@font-face`.
- [language-and-locale.md](./references/language-and-locale.md) —
  > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and `lang="zh-Hans"` / `"zh-Hant"` / `"ja"` / `"ko"` · Why we don't use `<meta http-equiv="Content-Language">` · The runtime's language declaration · Tokens consumed / extended · Light + dark — orthogonal · Selection-contract conformance · The `:lang()` CSS selector · When NOT to set `lang` · Verification · Cross-references
  `<html lang>`, BCP-47 tags, per-element `lang` override, `dir=rtl`.

### Inline-emphasis register (5 references)

- [emphasis-and-strong.md](./references/emphasis-and-strong.md) —
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic and not just colour for `<em>` · Why bold and not bigger for `<strong>` · Why `<mark>` uses a tinted background, not a colour change · `<ins>` and `<del>` — the revision pair · `<u>` — dotted, not solid · `<s>` — generally available, often misused · Combined `<em><strong>` — the absolute-critical case · Light + dark — fully covered · Combinations with `text-transform` · Selection-contract conformance · When NOT to use · Verification · Cross-references
  `<em>` / `<strong>` / `<mark>` / `<ins>` / `<del>` / `<s>` / `<u>`.
- [small-caps-and-petite-caps.md](./references/small-caps-and-petite-caps.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why both `font-variant-caps` AND `font-feature-settings` · True vs synthesised small caps · When to use small caps · When NOT to use small caps · Small caps vs `text-transform: uppercase` · The light + dark coverage · Why `letter-spacing: 0.04em` on `.vc-acronym` · Comparison with `<abbr title="…">` — semantic abbreviation · Selection-contract conformance · Browser support · Verification · Cross-references
  — `font-variant-caps`, `.vc-acronym`, `.vc-smallcaps`,
  `.vc-petitecaps`.
- [ligatures-and-opentype-features.md](./references/ligatures-and-opentype-features.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why common-ligatures ON by default · Why discretionary-ligatures OFF by default · Why kerning is explicitly set · Auto-fractions vs Unicode fractions · Stylistic sets — `ss01` through `ss20` · Light + dark — orthogonal · Browser support · When the font doesn't have a feature · Selection-contract conformance · When NOT to opt in · Verification · Cross-references
  — `liga`, `dlig`, `frac`, `ordn`, `salt`, `ss01`–`ss20`.
- [tabular-numerics.md](./references/tabular-numerics.md) —
  > What it is · The contract · Scaffold · Tokens consumed / extended · When the data also wants right-alignment · Mono numerics — sibling pattern · Old-style figures vs lining figures · The runtime's existing tabular numerics use · Slashed zero — when to opt in · Fail-soft on fonts without these features · Light + dark — orthogonal to theming · Selection-contract conformance · When NOT to use it · Cross-references
  `tabular-nums`, `slashed-zero`, `oldstyle-nums`, `.vc-mono-nums`.
- [quotation-marks-and-smart-typography.md](./references/quotation-marks-and-smart-typography.md)
  > What it is · The `<q>` element default · Editorial conventions — the four smart-punctuation rules · Typing the Unicode characters · Why the agent should use the Unicode characters directly · Tokens consumed / extended · The `.vc-no-smart-quotes` utility · The hairspace and thinspace — the fine details · Light + dark — orthogonal · Selection-contract conformance · When to ignore the conventions · Verification · Cross-references
  — curly quotes, em-dash, en-dash, ellipsis, the `<q>` element.

### Block-level prose roles (5 references)

- [eyebrow-overline-label.md](./references/eyebrow-overline-label.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · Visual variants · Tracking — why exactly 0.08em · Sizing — why 11px and not 12px · Light + dark — correct for free · Selection-contract conformance · Decision-mini-pill · Comment thread · When to choose this technique · When NOT to use it · No nested scrollbars · Light/dark coverage check · Migration from runtime hard-codes · Cross-references
  — `.vc-type-overline` / `.vc-type-label` mono-tracked strip.
- [lead-paragraph.md](./references/lead-paragraph.md) —
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why size step 3, not step 4 · Why line-height 1.60 (looser than body's 1.55) · The first-letter drop cap — when to add it · The clay/colour left-border — TL;DR card variant · Light + dark — correct for free · Selection-contract conformance · Why two aliases (`vc-type-lead` AND `vc-type-body-lg`) · When NOT to use a lead · Lead + eyebrow + heading — the standard opener · No nested scrollbars · Cross-references
  `.vc-type-lead` / `.vc-type-body-lg`.
- [drop-cap-and-initial.md](./references/drop-cap-and-initial.md) —
  > What it is · Scaffold · The contract — the alternative `vc-initial-large` · Tokens consumed / extended · Why the heading face for the first letter · The `:first-of-type` qualifier — only the first paragraph · The all-caps risk — `::first-letter` and `text-transform` · Multilingual considerations · Light + dark — fully covered · Browser support · Selection-contract conformance · When to use a drop cap · When NOT to use a drop cap · Verification · Cross-references
  `.vc-drop-cap` + `.vc-initial-large`.
- [pull-quote-and-blockquote.md](./references/pull-quote-and-blockquote.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why blockquote uses the body face but pull quote uses the heading face · The cite attribution — `<cite>` styling · Border colour — `var(--vc-color-accent, currentColor)` · The pull quote alignment — center vs left · Light + dark — fully covered · The pull quote with opening / closing quotation glyphs · When to use blockquote vs pull quote · When NOT to use a pull quote · Selection-contract conformance · Verification · Cross-references
  — `<blockquote>` + `.vc-pullquote` + `.vc-quote-marks`.
- [figure-and-caption.md](./references/figure-and-caption.md) —
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic caption · Why `opacity: 0.85` (not a colour) · The CSS counter — `counter-increment` + `counter()` · Side-floated figures and body wrap · Wide figures and the `100vw` trick · Alt text — non-negotiable · The `<picture>` element for responsive images · Light + dark — fully covered · Selection-contract conformance · When NOT to wrap in `<figure>` · Verification · Cross-references
  `<figure>` + `<figcaption>` + `.vc-figure-numbered` /
  `.vc-figure-side` / `.vc-figure-wide`.

### Lists (1 reference)

- [lists-and-list-typography.md](./references/lists-and-list-typography.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · The density modifiers — tight / loose · The dashed-bullet modifier · The square-bullet modifier (status / report convention) · The check / cross / olive-dot variants · The numeral variants — `type="a"`, `type="A"`, `type="i"`, `type="I"`, `type="1"` · Definition list — `<dl>` typography · Light + dark — fully covered · Nested list rhythm · Selection-contract conformance · When NOT to use a list · Verification · Cross-references
  — `<ul>` / `<ol>` / `<dl>` + `.vc-list-tight` / `.vc-list-loose`
  / `.vc-list-dashed` / `.vc-list-square` / `.vc-list-check` /
  `.vc-list-cross`.

### Code, kbd, time (3 references)

- [code-and-mono.md](./references/code-and-mono.md) — inline `<code>`
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `0.9em` (not `var(--vc-text-N)`) · Why `<pre>` uses `--vc-text-1` (one step down from body) · No nested scrollbars on `<pre>` · `<kbd>` — the 1px border trick · `<var>` — italic mono · Tabular numerics in `<pre>` / `<code>` · Light + dark — fully covered · Selection-contract conformance · When to use which element · Cross-references
  chip, `<pre>` block, `<kbd>`, `<samp>`, `<var>`.
- [keyboard-shortcut-typography.md](./references/keyboard-shortcut-typography.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · The modifier-key glyph mapping · The cross-platform convention · Why `white-space: nowrap` on `.vc-keycombo` · The plus separator opacity · Light + dark — fully covered · Accessibility — `aria-label` for clarity · Selection-contract conformance · When NOT to use `<kbd>` · Verification · Cross-references
  — `.vc-keycombo` + `.vc-key-mod` + `.vc-keychord` + the modifier
  glyph mapping.
- [time-and-datetime-typography.md](./references/time-and-datetime-typography.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why tabular numerics by default for `<time>` · ISO 8601 — the universal datetime form · Why `.vc-datetime-tabular` switches to mono · ISO-week and Year-month · Light + dark — orthogonal · Tabular numerics composition with other numeric features · Inline date format conventions · Timezone display · Selection-contract conformance · The runtime's date use · When NOT to wrap text in `<time>` · Verification · Cross-references
  — `<time>` + `.vc-datetime-tabular`.

### Links + footnotes + TOC + chips (4 references)

- [links-and-anchors.md](./references/links-and-anchors.md) — `<a>`
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `text-underline-offset: 0.2em` · Why `text-decoration-skip-ink: auto` · Why `text-decoration-thickness: 1px` (not the default) · Focus — `:focus-visible` not `:focus` · The visited-state colour — desaturated, not separate · The `.vc-link-quiet` modifier — underline only on hover · The `.vc-link-button` modifier — button-shaped link · The `.vc-link-external` modifier — small "↗" icon · Light + dark — fully covered · Accessibility — the AAA contrast pair · Selection-contract conformance · When NOT to underline · When the engine has no link token · Verification · Cross-references
  AAA contrast, focus rings, `.vc-link-quiet` / `.vc-link-button` /
  `.vc-link-external`.
- [superscript-subscript-and-footnotes.md](./references/superscript-subscript-and-footnotes.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `line-height: 0` on `<sup>` / `<sub>` · Why `vertical-align: baseline` + `position: relative` + `top: -0.5em` · Why `font-size: 0.75em` · The footnote back-reference · Click-target sizing · Ordinal markers — `<sup>` vs `font-variant-numeric: ordinal` · Mathematical notation — `<sup>` vs MathML / KaTeX · Light + dark — fully covered · Selection-contract conformance · When NOT to use footnotes · Verification · Cross-references
  — `<sup>` / `<sub>` + `.vc-footnote-ref` + `.vc-footnotes` +
  back-references.
- [heading-anchor-and-toc.md](./references/heading-anchor-and-toc.md)
  > What it is · The heading-anchor contract · Scaffold — heading with anchor · TOC contract · Scaffold — TOC · Tokens consumed / extended · Why mono for the anchor "#" · Why the TOC uses `border-left` for hover state · Sticky TOC and `no-nested-scrollbars` · TOC right-side variant — the fixed sidebar · Skip link integration · Light + dark — fully covered · Accessibility — `aria-label` on `<nav>` · When NOT to add heading anchors · When NOT to add a TOC · Selection-contract conformance · Verification · Cross-references
  — `.vc-heading-anchor` + `.vc-toc` + `.vc-toc-sticky` +
  `.vc-toc-right`.
- [badge-pill-chip-typography.md](./references/badge-pill-chip-typography.md)
  > What it is · The shared typography contract · Scaffold · Tokens consumed / extended · Why `white-space: nowrap` · Why `border-radius: 999px` for pills, `4px` for chips · Tabular numerics in pills · Auto-pill — the "auto-generated" doc marker · Light + dark — fully covered · Severity colouring — DT-19 ownership · Accessibility · The runtime's current pill use · Selection-contract conformance · When to use each · Verification · Cross-references
  — `.vc-chip-base` + `.badge` + `.pill` + `.chip` + `.auto-pill`.

### Layout-typography integration (4 references)

- [measure-and-readability.md](./references/measure-and-readability.md)
  > What it is · Scaffold · Tokens consumed / extended · The exact numbers — why 65ch · Variations — `.vc-type-measure-narrow`, `.vc-type-measure-wide` · Mixing with `text-align: justify` · Centering vs left-aligned containers · The runtime's body width — current state · When NOT to use measure · When measure conflicts with the grid · Light + dark — orthogonal · Selection-contract conformance · Verification · Cross-references
  — `.vc-type-measure` (45/65/80 ch).
- [hyphenation-and-justification.md](./references/hyphenation-and-justification.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · When to opt in · Why `hyphens: auto` and not `hyphens: manual` · The `.vc-no-hyphens` modifier · The widow / orphan controls · Light + dark — orthogonal · Browser support · The runtime's existing justification use · When NOT to use justification · Forbidden — `text-justify: distribute` · CJK justification · Selection-contract conformance · Cross-references
  — `.vc-type-justify` + `hyphens: auto` + `text-justify` +
  `.vc-no-hyphens`.
- [multi-column-layout.md](./references/multi-column-layout.md) —
  > What it is · The contract · Scaffold · Tokens consumed / extended · When to choose multi-column · Why `column-width` AND `column-count` · The widow/orphan tuning · Heading fragmentation · Light + dark — fully covered · Browser support · A heading that spans all columns · When the multi-column collapses to 1 · Selection-contract conformance · When NOT to use multi-column · Forbidden — fixed-height multi-columns · Cross-references
  `.vc-type-multicol` + widows / orphans + `column-span: all`.
- [spacing-and-vertical-rhythm.md](./references/spacing-and-vertical-rhythm.md)
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why margin-bottom only (not margin-top) on paragraphs · The `:first-child` no-top-margin rule · The adjacent-sibling rule for heading-then-paragraph · The eyebrow-then-heading tight pairing · Baseline grid — `.vc-baseline-grid` · Why heading margins decrease with rank · Light + dark — orthogonal · When the agent overrides · Selection-contract conformance · When NOT to follow the contract · Verification · Cross-references
  — paragraph margins + heading-to-content rhythm + the optional
  baseline-grid visualisation.

### Responsive headings (1 reference)

- [responsive-fluid-headings.md](./references/responsive-fluid-headings.md)
  > What it is · The contract · Why each constant — the tuning · Scaffold · Tokens consumed / extended · The viewport-curve formula · Why pure `vw` and not `rem + vw` · Height breakpoints — compact viewports · Light + dark — orthogonal · The `clamp()` math when `vw` doesn't work — print and PDF · Browser support · Selection-contract conformance · When NOT to use fluid headings · Verification · Cross-references
  — `.vc-type-hero` + `.vc-type-slide-title` + `.vc-type-slide-subtitle`
  + `.vc-type-stat-hero` + `.vc-type-catalogue-h1`.

### Cross-format + cross-cultural (3 references)

- [print-and-paged-media.md](./references/print-and-paged-media.md) —
  > What it is · The contract · Scaffold · Tokens consumed / extended · Why `11pt` body and not a `var(--vc-text-2)` · Why `1.5cm 1.5cm 2cm 1.5cm` margins · Why `break-after: avoid` on headings · Why show URLs for `<a href="http…">` · The `.vc-no-print` and `.vc-only-print` utilities · Forced page breaks · Disabling animation on print · Light + dark — N/A for print · Browser support · The runtime's print path · Forbidden — inner scrollbars on print · Selection-contract conformance · When NOT to ship print CSS · Verification · Cross-references
  `@page` + page breaks + `.vc-no-print` / `.vc-only-print` +
  URL-after-link.
- [accessibility-and-screen-reader.md](./references/accessibility-and-screen-reader.md)
  > What it is · Contract — semantic HTML · The contrast gates · `prefers-reduced-motion` · `prefers-contrast` · `prefers-color-scheme` · Focus rings — the keyboard contract · Skip links — the navigation contract · Alt text — typography's role · Semantic landmarks · The `aria-label` / `aria-labelledby` contract · Tokens consumed / extended · Light + dark — orthogonal · When the agent should override · When NOT to override · Verification · Cross-references
  — semantic HTML + WCAG contrast + focus rings + reduced-motion +
  skip-link + landmarks.
- [cjk-typography-bridge.md](./references/cjk-typography-bridge.md)
  > What it is · What the typography skill emits · What the typography skill DEFERS to DT-25 · Scaffold — a CJK-tagged page · Scaffold — mixed Latin / CJK content · Tokens consumed / extended · Why this skill doesn't OWN the CJK contract · The bouten / kenten dot pattern · Why `#ff6600` (Claude orange) · CJK with `<html lang="zh-Hans">` vs `"zh-Hant">` · Light + dark — correct for both · Selection-contract conformance · When NOT to use the CJK contract · Verification · Cross-references
  — `:lang(zh/ja/ko)` + the DT-25 bridge to `design-tokens`.

> **Out of scope for the skill build:** migrating the runtime's 25
> hard-coded `font-size` literals is a separate refactor task —
> this skill defines the destination tokens (see
> [semantic-hierarchy.md](./references/semantic-hierarchy.md) §B.6),
> it does not perform the migration. The CJK token home is owned by
> the `design-tokens` skill (DT-25); the typography skill ships only
> the `:lang()` bridge.
