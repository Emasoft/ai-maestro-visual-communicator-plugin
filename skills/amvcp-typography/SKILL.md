---
name: amvcp-typography
description: "Typography foundation for visual-communicator pages — fluid clamp() scale + 4 modular systems, semantic role hierarchy, variable + static font fallback, banned-font-free pairings, eyebrow/lead/drop-cap/blockquote, lists, links/TOC, OpenType ligatures, CJK bridge, print + accessibility. Theme off --vc-* tokens. Use when scaffolding or restyling any type surface. Trigger with 'typography', 'fluid type scale', 'font pairing', 'eyebrow', 'tabular nums', 'drop cap', 'pull quote', 'CJK', 'print stylesheet', 'small caps'."
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
 > B.1 The contract table · B.2 How it is delivered · B.3 Why the hierarchy is *strict* · B.4 No-nested-scrollbars compliance · B.5 Light + dark — correct for · …
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
 > A.1 What it does · A.2 The clamp() machinery · A.3 The HTML it scaffolds · A.4 The four modular-scale systems · A.5 Pre-computed scales for base 16px · · …
| Bind `<h1>`…`<h6>` / `<p>` / `<small>` to the right tokens | [semantic-hierarchy.md](./references/semantic-hierarchy.md) |
| Pick a font pairing from 5 presets + the offline System | [font-loading-pairings.md](./references/font-loading-pairings.md) |
  > D.1 DT-09 banned-font reconciliation · D.2 The five pairings · D.3 Loading discipline · D.4 The offline / System pairing · D.5 CJK — cross-reference to `design-tokens` DT-25 · Tokens consumed
| Use a tri-font stack (serif headings + sans body + mono labels) | [tri-font-stack-anthropic.md](./references/tri-font-stack-anthropic.md) |
 > What it is · Why three faces (not two) · DESIGN.md frontmatter · The three Google-Fonts-served tri-font presets · Banned-font check · Tokens consumed / extended · The `<code>` · …
| Load Google Fonts with `display:swap` + preconnect + metric-matched fallback | [font-fallback-and-display-swap.md](./references/font-fallback-and-display-swap.md) |
 > What it is · The contract · The Google Fonts URL · The preconnect optimisation · Self-hosting via `@font-face` · Metric-matched fallbacks — `size-adjust` · Variable-font weight ranges · · …
| Add the `wght` / `opsz` variable-font tokens + static-font fallback | [variable-font-tokens.md](./references/variable-font-tokens.md) |
 > C.1 What it does · C.2 The semantic weight tokens · C.3 The optical-size tokens · C.4 The variable-font axis layer · C.5 The static-font fallback — fail-soft (TY-04 · …
| Add the canonical eyebrow / overline / label above a heading | [eyebrow-overline-label.md](./references/eyebrow-overline-label.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Visual variants · Tracking — why exactly 0.08em · Sizing — why 11px and not · …
| Set up a lead paragraph after a heading | [lead-paragraph.md](./references/lead-paragraph.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why size step 3, not step 4 · Why line-height 1.60 (looser than body's 1.55) · …
| Add a drop cap to an editorial opener | [drop-cap-and-initial.md](./references/drop-cap-and-initial.md) |
 > What it is · Scaffold · The contract — the alternative `vc-initial-large` · Tokens consumed / extended · Why the heading face for the first letter · The `:first-of-type` · …
| Set up a blockquote (with cite) or a pull quote | [pull-quote-and-blockquote.md](./references/pull-quote-and-blockquote.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why blockquote uses the body face but pull quote uses the heading face · The · …
| Style bullets, numerals, definition lists, tight / loose / dashed / check / cross | [lists-and-list-typography.md](./references/lists-and-list-typography.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · The density modifiers — tight / loose · The dashed-bullet modifier · The square-bullet modifier · …
| Style links + anchors with AAA contrast + focus rings + visited / hover states | [links-and-anchors.md](./references/links-and-anchors.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `text-underline-offset: 0.2em` · Why `text-decoration-skip-ink: auto` · Why `text-decoration-thickness: 1px` (not the default) · · …
| Add `<em>` / `<strong>` / `<mark>` / `<ins>` / `<del>` / `<s>` / `<u>` styling | [emphasis-and-strong.md](./references/emphasis-and-strong.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic and not just colour for `<em>` · Why bold and not bigger for · …
| Render acronyms as small caps in body prose | [small-caps-and-petite-caps.md](./references/small-caps-and-petite-caps.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why both `font-variant-caps` AND `font-feature-settings` · True vs synthesised small caps · When to use · …
| Enable OpenType ligatures / fractions / ordinals / stylistic alternates | [ligatures-and-opentype-features.md](./references/ligatures-and-opentype-features.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why common-ligatures ON by default · Why discretionary-ligatures OFF by default · Why kerning is · …
| Render inline `<code>` chips, `<pre>` blocks, `<kbd>`, `<samp>`, `<var>` | [code-and-mono.md](./references/code-and-mono.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `0.9em` (not `var(--vc-text-N)`) · Why `<pre>` uses `--vc-text-1` (one step down from body) · · …
| Document a keyboard shortcut (single key, combo, multi-step chord, modifier glyphs) | [keyboard-shortcut-typography.md](./references/keyboard-shortcut-typography.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · The modifier-key glyph mapping · The cross-platform convention · Why `white-space: nowrap` on `.vc-keycombo` · · …
| Render `<sup>` / `<sub>` and footnotes with back-references | [superscript-subscript-and-footnotes.md](./references/superscript-subscript-and-footnotes.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `line-height: 0` on `<sup>` / `<sub>` · Why `vertical-align: baseline` + `position: relative` + · …
| Render a `<figure>` + `<figcaption>` with auto-numbering | [figure-and-caption.md](./references/figure-and-caption.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why italic caption · Why `opacity: 0.85` (not a colour) · The CSS counter — · …
| Lock numeric columns with tabular numerics | [tabular-numerics.md](./references/tabular-numerics.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · When the data also wants right-alignment · Mono numerics — sibling pattern · Old-style figures · …
| Render `<time>` + a column of dates as a spreadsheet-grade table | [time-and-datetime-typography.md](./references/time-and-datetime-typography.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why tabular numerics by default for `<time>` · ISO 8601 — the universal datetime form · …
| Cap body prose width at the 65-character readability sweet spot | [measure-and-readability.md](./references/measure-and-readability.md) |
 > What it is · Scaffold · Tokens consumed / extended · The exact numbers — why 65ch · Variations — `.vc-type-measure-narrow`, `.vc-type-measure-wide` · Mixing with `text-align: justify` · Centering · …
| Add justification + hyphenation for narrow columns | [hyphenation-and-justification.md](./references/hyphenation-and-justification.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · When to opt in · Why `hyphens: auto` and not `hyphens: manual` · The `.vc-no-hyphens` · …
| Set up multi-column body layout with widows / orphans / column-span | [multi-column-layout.md](./references/multi-column-layout.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · When to choose multi-column · Why `column-width` AND `column-count` · The widow/orphan tuning · Heading · …
| Set inter-paragraph spacing + heading-to-content rhythm + baseline grid | [spacing-and-vertical-rhythm.md](./references/spacing-and-vertical-rhythm.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why margin-bottom only (not margin-top) on paragraphs · The `:first-child` no-top-margin rule · The adjacent-sibling · …
| Set fluid heading sizes for slides, dashboards, hero stats | [responsive-fluid-headings.md](./references/responsive-fluid-headings.md) |
 > What it is · The contract · Why each constant — the tuning · Scaffold · Tokens consumed / extended · The viewport-curve formula · Why pure `vw` and · …
| Style heading anchors + a sticky / right-margin TOC | [heading-anchor-and-toc.md](./references/heading-anchor-and-toc.md) |
 > What it is · The heading-anchor contract · Scaffold — heading with anchor · TOC contract · Scaffold — TOC · Tokens consumed / extended · Why mono for · …
| Style badges, pills, chips, auto-pills (with severity colouring deferred to design-tokens) | [badge-pill-chip-typography.md](./references/badge-pill-chip-typography.md) |
 > What it is · The shared typography contract · Scaffold · Tokens consumed / extended · Why `white-space: nowrap` · Why `border-radius: 999px` for pills, `4px` for chips · · …
| Set `<html lang>` and per-element `lang` (the prereq for hyphenation, quotes, CJK fonts) | [language-and-locale.md](./references/language-and-locale.md) |
 > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and · …
| Render CJK content (cross-references DT-25 in design-tokens) | [cjk-typography-bridge.md](./references/cjk-typography-bridge.md) |
 > What it is · What the typography skill emits · What the typography skill DEFERS to DT-25 · Scaffold — a CJK-tagged page · Scaffold — mixed Latin / · …
| Use smart curly quotes, em-dashes, en-dashes, ellipses | [quotation-marks-and-smart-typography.md](./references/quotation-marks-and-smart-typography.md) |
 > What it is · The `<q>` element default · Editorial conventions — the four smart-punctuation rules · Typing the Unicode characters · Why the agent should use the Unicode · …
| Set up a print stylesheet with `@page`, page breaks, URL-after-link, no-print utilities | [print-and-paged-media.md](./references/print-and-paged-media.md) |
 > What it is · The contract · Scaffold · Tokens consumed / extended · Why `11pt` body and not a `var(--vc-text-2)` · Why `1.5cm 1.5cm 2cm 1.5cm` margins · · …
| Make the page accessible: semantic HTML, contrast, focus rings, reduced-motion, skip-link | [accessibility-and-screen-reader.md](./references/accessibility-and-screen-reader.md) |
 > What it is · Contract — semantic HTML · The contrast gates · `prefers-reduced-motion` · `prefers-contrast` · `prefers-color-scheme` · Focus rings — the keyboard contract · Skip links — · …

## Prerequisites

- The DESIGN.md engine (`scripts/amvcp-designmd.js`) loaded on the
  page — it emits the `--vc-*` tokens this skill themes off.
- A modern browser. No npm dependency. Google Fonts is an optional
  `<link>`; every pairing also ships a system fallback so a page
  works offline.
- `<html lang="…">` MUST be set (see
  [language-and-locale.md](./references/language-and-locale.md)) —
 > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and · …
  every language-aware typography feature depends on it.

## Instructions

1. **Pick a scale system.** Default **Perfect Fourth** (ratio
   1.333) — strong UI/dashboard hierarchy. Alternatives: Minor Third
   (1.200), Major Third (1.250), Golden (1.618). See
   [type-scale-engine.md](./references/type-scale-engine.md).
 > A.1 What it does · A.2 The clamp() machinery · A.3 The HTML it scaffolds · A.4 The four modular-scale systems · A.5 Pre-computed scales for base 16px · · …
2. **Pick a font pairing** from the five banned-font-free presets,
   the offline **System** pairing, or one of the three **tri-font**
   stacks (serif + sans + mono). See
   [font-loading-pairings.md](./references/font-loading-pairings.md)
     > D.1 DT-09 banned-font reconciliation · D.2 The five pairings · D.3 Loading discipline · D.4 The offline / System pairing · D.5 CJK — cross-reference to `design-tokens` DT-25 · Tokens consumed
   and [tri-font-stack-anthropic.md](./references/tri-font-stack-anthropic.md).
 > What it is · Why three faces (not two) · DESIGN.md frontmatter · The three Google-Fonts-served tri-font presets · Banned-font check · Tokens consumed / extended · The `<code>` · …
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
 > C.1 What it does · C.2 The semantic weight tokens · C.3 The optical-size tokens · C.4 The variable-font axis layer · C.5 The static-font fallback — fail-soft (TY-04 · …
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
 > What it is · The contract · Which typography features depend on language · Scaffold — mixed-language content · The `dir` attribute — right-to-left scripts · CJK fonts and · …

## Output

A DESIGN.md-themed page whose every type size, weight, font, leading,
tracking, opacity-tint is token-driven and theme-correct in BOTH
light and dark themes. The skill's concrete artifact is the
**type-specimen page**
([type-scale-engine.md](./references/type-scale-engine.md) §
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
  `clamp()` scale + 4 modular-scale systems + display-tier optical
  correction.
- [semantic-hierarchy.md](./references/semantic-hierarchy.md) — the
  11-row role-to-token contract (the public API).
- [variable-font-tokens.md](./references/variable-font-tokens.md) —
  `wght`/`opsz` token system + static-font fallback +
  `font-feature-settings` stylistic alternates.
- [font-loading-pairings.md](./references/font-loading-pairings.md) —
  the 5 named pairings + Google Fonts loading + System fallback +
  CJK cross-reference.

### Font + loading (3 references — extended Phase 3)

- [tri-font-stack-anthropic.md](./references/tri-font-stack-anthropic.md)
  — the "serif headings + sans body + mono labels" preset (the most
  reused pattern in the AMVCP catalog).
- [font-fallback-and-display-swap.md](./references/font-fallback-and-display-swap.md)
  — `font-display`, preconnect, FOUT vs FOIT, metric-matched
  `size-adjust` fallbacks, self-hosted `@font-face`.
- [language-and-locale.md](./references/language-and-locale.md) —
  `<html lang>`, BCP-47 tags, per-element `lang` override, `dir=rtl`.

### Inline-emphasis register (5 references)

- [emphasis-and-strong.md](./references/emphasis-and-strong.md) —
  `<em>` / `<strong>` / `<mark>` / `<ins>` / `<del>` / `<s>` / `<u>`.
- [small-caps-and-petite-caps.md](./references/small-caps-and-petite-caps.md)
  — `font-variant-caps`, `.vc-acronym`, `.vc-smallcaps`,
  `.vc-petitecaps`.
- [ligatures-and-opentype-features.md](./references/ligatures-and-opentype-features.md)
  — `liga`, `dlig`, `frac`, `ordn`, `salt`, `ss01`–`ss20`.
- [tabular-numerics.md](./references/tabular-numerics.md) —
  `tabular-nums`, `slashed-zero`, `oldstyle-nums`, `.vc-mono-nums`.
- [quotation-marks-and-smart-typography.md](./references/quotation-marks-and-smart-typography.md)
  — curly quotes, em-dash, en-dash, ellipsis, the `<q>` element.

### Block-level prose roles (5 references)

- [eyebrow-overline-label.md](./references/eyebrow-overline-label.md)
  — `.vc-type-overline` / `.vc-type-label` mono-tracked strip.
- [lead-paragraph.md](./references/lead-paragraph.md) —
  `.vc-type-lead` / `.vc-type-body-lg`.
- [drop-cap-and-initial.md](./references/drop-cap-and-initial.md) —
  `.vc-drop-cap` + `.vc-initial-large`.
- [pull-quote-and-blockquote.md](./references/pull-quote-and-blockquote.md)
  — `<blockquote>` + `.vc-pullquote` + `.vc-quote-marks`.
- [figure-and-caption.md](./references/figure-and-caption.md) —
  `<figure>` + `<figcaption>` + `.vc-figure-numbered` /
  `.vc-figure-side` / `.vc-figure-wide`.

### Lists (1 reference)

- [lists-and-list-typography.md](./references/lists-and-list-typography.md)
  — `<ul>` / `<ol>` / `<dl>` + `.vc-list-tight` / `.vc-list-loose`
  / `.vc-list-dashed` / `.vc-list-square` / `.vc-list-check` /
  `.vc-list-cross`.

### Code, kbd, time (3 references)

- [code-and-mono.md](./references/code-and-mono.md) — inline `<code>`
  chip, `<pre>` block, `<kbd>`, `<samp>`, `<var>`.
- [keyboard-shortcut-typography.md](./references/keyboard-shortcut-typography.md)
  — `.vc-keycombo` + `.vc-key-mod` + `.vc-keychord` + the modifier
  glyph mapping.
- [time-and-datetime-typography.md](./references/time-and-datetime-typography.md)
  — `<time>` + `.vc-datetime-tabular`.

### Links + footnotes + TOC + chips (4 references)

- [links-and-anchors.md](./references/links-and-anchors.md) — `<a>`
  AAA contrast, focus rings, `.vc-link-quiet` / `.vc-link-button` /
  `.vc-link-external`.
- [superscript-subscript-and-footnotes.md](./references/superscript-subscript-and-footnotes.md)
  — `<sup>` / `<sub>` + `.vc-footnote-ref` + `.vc-footnotes` +
  back-references.
- [heading-anchor-and-toc.md](./references/heading-anchor-and-toc.md)
  — `.vc-heading-anchor` + `.vc-toc` + `.vc-toc-sticky` +
  `.vc-toc-right`.
- [badge-pill-chip-typography.md](./references/badge-pill-chip-typography.md)
  — `.vc-chip-base` + `.badge` + `.pill` + `.chip` + `.auto-pill`.

### Layout-typography integration (4 references)

- [measure-and-readability.md](./references/measure-and-readability.md)
  — `.vc-type-measure` (45/65/80 ch).
- [hyphenation-and-justification.md](./references/hyphenation-and-justification.md)
  — `.vc-type-justify` + `hyphens: auto` + `text-justify` +
  `.vc-no-hyphens`.
- [multi-column-layout.md](./references/multi-column-layout.md) —
  `.vc-type-multicol` + widows / orphans + `column-span: all`.
- [spacing-and-vertical-rhythm.md](./references/spacing-and-vertical-rhythm.md)
  — paragraph margins + heading-to-content rhythm + the optional
  baseline-grid visualisation.

### Responsive headings (1 reference)

- [responsive-fluid-headings.md](./references/responsive-fluid-headings.md)
  — `.vc-type-hero` + `.vc-type-slide-title` + `.vc-type-slide-subtitle`
  + `.vc-type-stat-hero` + `.vc-type-catalogue-h1`.

### Cross-format + cross-cultural (3 references)

- [print-and-paged-media.md](./references/print-and-paged-media.md) —
  `@page` + page breaks + `.vc-no-print` / `.vc-only-print` +
  URL-after-link.
- [accessibility-and-screen-reader.md](./references/accessibility-and-screen-reader.md)
  — semantic HTML + WCAG contrast + focus rings + reduced-motion +
  skip-link + landmarks.
- [cjk-typography-bridge.md](./references/cjk-typography-bridge.md)
  — `:lang(zh/ja/ko)` + the DT-25 bridge to `design-tokens`.

> **Out of scope for the skill build:** migrating the runtime's 25
> hard-coded `font-size` literals is a separate refactor task —
> this skill defines the destination tokens (see
> [semantic-hierarchy.md](./references/semantic-hierarchy.md) §B.6),
