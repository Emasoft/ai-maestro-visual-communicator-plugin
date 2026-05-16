# Composing report-doc with the other 12 element skills

`report-doc` is the *non-element, cross-cutting* technique in the
plugin — its primitives (callout, rubric, TL;DR, stat-band, TOC,
metadata pill strip, glossary, change-log, appendix, references)
EMBED inside any document shape and COMPOSE with the other 12
element skills (charts, diagrams, tables, code-highlight, animation,
typography, layout, design-tokens, wireframe, slide-decks,
interactive-controls, modal-comments).

This reference describes the composition contract: what to embed
where, how the embedded skill's runtime interacts with `report-doc`'s
runtime, what the QA pipeline checks on the composition, and the
compatibility matrix.

## The composition contract

A document shape (e.g. `implementation-plan-shape`) is **a fixed
sequence of sections, each of which delegates to one or more element
skills for its content**. The report-doc skill provides the document
chrome (header, byline, TOC, callouts, footer); the element skills
provide the body content (charts, tables, code, diagrams, etc.).

Three rules:

1. **Element skills render their own runtime** — the report-doc
   skill never re-implements what an element skill already does.
2. **All runtimes use the same `--vc-*` token surface** — light/dark
   theme swap works across the whole composition.
3. **The QA pipeline runs once, on the composed page** — gates
   check the entire DOM, not per-skill.

## The compatibility matrix

| Element skill | Embedded in (typical shapes) | report-doc primitive that wraps it |
|---|---|---|
| `amvcp-charts-and-dashboards` | status-report, implementation-plan, whitepaper | metric-stat-band (for KPIs); inline figure for charts |
| `amvcp-graph-diagrams` | architecture-explainer, rfc, implementation-plan, postmortem | inline figure with figcaption |
| `amvcp-diagram` | concept-explainer, postmortem (timeline), implementation-plan (data-flow) | inline figure |
| `amvcp-tables` | postmortem (impact table), pr-review (risk chips), feature-explainer (config rows) | section with table |
| `amvcp-code-highlight` | pr-writeup, pr-review, postmortem (root cause), feature-explainer | inline `<pre>` block |
| `amvcp-animation` | concept-explainer (state-change), feature-explainer (micro-interactions) | guarded by `prefers-reduced-motion` (Gate 3) |
| `amvcp-typography` | design-system-doc (type-scale rows), all shapes (eyebrow / pull-quote) | inline; tokens read by every report-doc primitive |
| `amvcp-layout` | every shape (column grids, sidebar layouts) | wraps the entire `vc-doc` |
| `amvcp-design-tokens` | design-system-doc (rendered), every shape (consumed) | the `--vc-*` token surface every primitive reads |
| `amvcp-wireframe` | implementation-plan (paired mockups), visual-design-exploration (artboards) | inline mockup card |
| `amvcp-slide-decks` | (separate runtime) | not embedded; pick slide-decks OR a doc shape |
| `amvcp-interactive-controls` | concept-explainer (sliders), retrospective (checkboxes), pr-writeup (test plan) | inline `<form>` / control |
| `amvcp-modal-comments` | every shape that supports decision-minis | floats above the document; not "embedded" |

## Worked example — `implementation-plan-shape`

The most-composed document shape in the plugin. Walk through the
embeds:

| Section | Element skill | What gets rendered | Tokens shared |
|---|---|---|---|
| 1. Summary band | `amvcp-charts-and-dashboards` (metric-card primitive) | 4 `<div class="vc-metric">` cells | `--vc-color-surface`, `--vc-color-content`, `--vc-text-4`, `--vc-radius-md` |
| 2. Milestones | `amvcp-diagram` (timeline primitive) | Vertical timeline with typed dots | `--vc-color-success` / `--vc-color-warning` / `--vc-color-danger` (dot colors), `--vc-color-border` (line) |
| 3. Data-flow | `amvcp-graph-diagrams` | Inline SVG box-and-arrow with `<defs><marker>` | `--vc-color-content-muted` (arrows), `--vc-color-accent` (hot path) |
| 4. Mockups | `amvcp-wireframe` | Two cards in grayscale wireframe mode | `--vc-color-surface` (card bg), `--vc-color-border` (hairlines) |
| 5. Code | `amvcp-code-highlight` | Slate-bg code panels with token highlight | `--code-*` tokens (a sub-namespace of `--vc-*`) |
| 6. Risk table | `amvcp-tables` | 3-col grid with severity-pill cells | `--vc-color-warning`, `--vc-color-danger` (pill bg) |
| 7. Open questions | `amvcp-prose-pages` (callout) | `<aside class="vc-callout vc-callout--note">` per question | `--vc-color-accent` (note variant) |
| 8. Provenance footer | `amvcp-prose-pages` (this skill) | `<footer class="vc-doc-footer">` with auto-pill | `--vc-color-content-muted`, `--vc-color-surface-sunken` |

Every section reads the same token surface; switching the DESIGN.md
theme reskins the entire document without re-rendering.

## Runtime interaction patterns

### Init order

The composed page boots in a deterministic order:

```html
<head>
  <!-- 1. The DESIGN.md engine — sets --vc-* tokens on :root -->
  <script src="amvcp-designmd.js"></script>

  <!-- 2. Each element skill's runtime — reads --vc-* tokens -->
  <script src="amvcp-tokens.js"></script>
  <script src="amvcp-typography.js"></script>
  <script src="amvcp-layout.js"></script>
  <script src="amvcp-tables.js"></script>
  <script src="amvcp-chart.js"></script>
  <script src="amvcp-diagram.js"></script>
  <script src="amvcp-code-highlight.js"></script>
  <script src="amvcp-interactive.js"></script>
  <script src="amvcp-wireframe.js"></script>
  <script src="amvcp-icon-svg.js"></script>
  <script src="amvcp-animation.js"></script>

  <!-- 3. The cross-cutting report-doc — wraps everything -->
  <script src="amvcp-report-doc.js"></script>

  <!-- 4. The visualization controller — runtime hooks -->
  <script src="amvcp-runtime.js"></script>
</head>
```

Order matters because `amvcp-report-doc.js`'s gates need every other
runtime's CSS in the DOM to read computed styles. Inverting the
order causes Gate 2 (`wcag-contrast`) to fail with WARN-grade
"could not resolve token" diagnostics.

### Theme-swap propagation

When `data-theme` changes on `<html>`, the engine swaps `--vc-*`
values. Every embedded primitive re-skins automatically because every
primitive reads the same tokens via CSS custom-property fallbacks.

```js
// User clicks light/dark switcher
document.documentElement.dataset.theme = 'dark';
// Engine swaps --vc-color-canvas, --vc-color-content, etc.
// Charts reskin (chart fills read --vc-color-accent)
// Diagrams reskin (arrow color reads --vc-color-content-muted)
// Tables reskin (cell borders read --vc-color-border)
// Callouts reskin (border + tint read --vc-callout-accent → role)
// Pull-quotes reskin
// TOC reskins
// EVERYTHING reskins via the same mechanism — zero re-render
```

This is the **single most important property of the composition
contract**. Any skill that hardcodes a color (or fails to read a
`--vc-*` token) breaks the contract — the user clicks dark mode and
that one element stays light.

### Selection / decision propagation

When `amvcp-modal-comments` is loaded:

- Every primitive gets a hover-pill that says "comment on this".
- Decision-mini blocks (`<div class="ve-decision">`) inside any
  embedded skill render the modal-comments thread UI.
- The modal-comments runtime reads `data-ve-id` from any element
  with selectable behavior — every primitive in this skill ships
  consistent `data-ve-id` patterns.

## QA on composed pages

`runGates(document, pageId)` runs against the *whole composed page*,
not per-skill. The 7 gates check:

| Gate | Composition concern |
|---|---|
| `no-nested-scrollbars` | Embedded charts / tables / code blocks must not create inner scrollers — see `no-nested-scrollbars.md` rule |
| `wcag-contrast` | Every active text/bg pair across all skills, including charts (axis labels) and diagrams (node text) |
| `reduced-motion` | If `amvcp-animation` is loaded, gate verifies a `prefers-reduced-motion: reduce` block exists |
| `print-css` | The print stylesheet shipped by report-doc covers all primitives by default |
| `semantic-html` | Composed page must use real semantic tags throughout — no div-soup even in embedded blocks |
| `banned-color` | No banned hue in any rendered color anywhere |
| `banned-font` | No banned font as the first family in any token |

Run QA AFTER composition, BEFORE handing the page back. See
`output-qa-pipeline-7-gates.md`.

## When NOT to compose

Some shapes are deliberately self-contained and do not embed
external skills:

| Shape | Rationale |
|---|---|
| `adr-decision-log-shape` | ADRs are short, prose-only, deliberately monochrome |
| `tldr-summary-card` | TL;DRs are 1-3 sentences; embedding anything bloats them |
| `provenance-footer-and-autopill` | Footer is meta-data; embeds defeat the purpose |
| `metadata-keypill-strip` | Pills are short labels; embedded content breaks the strip |
| `pull-quote-cap-one-per-page` | Pull-quotes are pure prose; even inline `<code>` is risky |

Do not "enhance" these primitives by embedding charts or interactive
controls. The plain form is the contract.

## Anti-patterns

- **Embedding skills that hardcode colors** — breaks the theme-swap
  contract. Every embedded primitive MUST read `--vc-*` tokens.
- **Skipping element skills and re-implementing in report-doc** —
  duplicates code, fragments the QA surface, breaks the
  composition contract.
- **Loading element-skill runtimes in the wrong order** — Gate 2
  WARNs because tokens are not resolvable at gate time. Fix by
  ordering: design-tokens → element skills → report-doc → runtime.
- **Composing two slide-deck shapes into one page** — slide decks
  own the viewport. Pick one OR pick a doc shape; do not combine.
- **Forgetting that figures inside callouts inherit callout
  constraints** — a chart inside a callout has the callout's tinted
  background; chart axis colors must contrast against that, not
  against the page canvas.
- **Animation embedded without the reduced-motion fallback** —
  Gate 3 fails. Every animation MUST have a `@media
  (prefers-reduced-motion: reduce)` rule.
- **A modal-comments thread on every primitive** — overwhelms the
  reader. Be selective; comments belong on decisions, not
  decorations.
- **Bypassing report-doc and writing a "raw" HTML document** —
  loses the QA pipeline, the print stylesheet, the TOC scroll-spy,
  the selection wire-format. Always wrap in `vc-doc`.
- **Embedding charts in an ADR or pull-quote** — see "When NOT to
  compose".
- **Mixing report-doc with a different doc framework on the same
  page** — Bootstrap, Tailwind utility classes, MUI, etc. all
  introduce their own token surfaces and break Gate 2 + 6 + 7.
  Use one framework per page.
