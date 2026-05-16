# fontkit / Playwright glyph embedding (IS-08) — out of scope

The original IS-08 source proposed using `fontkit` (npm package) to
extract variable font paths and embed them in SVG, with Playwright
(headless browser) capturing ground-truth glyph layouts at 2x DPR
for pixel-perfect SVG text rendering. The classification phase
marked this **SKIP / P3**. This reference documents WHY and where
to go if you really need it.

## Why it's out of scope

icon-svg is a CLIENT-SIDE HTML report rendering primitive. The
fontkit + Playwright stack is a SERVER-SIDE BUILD PIPELINE:

| Requirement | fontkit + Playwright |
|---|---|
| Dependency-free | NO — fontkit is a heavy npm package + Playwright is a binary browser install |
| No build step | NO — both run server-side in Node before deployment |
| Runs in any browser | NO — Playwright is required, not the user's browser |
| Inline SVG result | YES — the OUTPUT is inline SVG... but the GENERATION is offline |
| Themable | NO — paths are baked at build time; theme color cannot be a `var(--vc-color-*)` because the text was rasterized to paths |
| Selectable | NO — converted `<text>` to `<path>` loses the textContent that drives the data-ve-id selection scaffold |
| Re-flowable | NO — the SVG is fixed-pixel; CSS responsive sizing won't reflow the rasterized glyphs |

## What fontkit + Playwright would BUY

Pixel-perfect text alignment in an SVG. The use case: a print-quality
PDF render where text is converted to `<path>` so the layout doesn't
depend on the consumer's font rendering. The reader sees EXACTLY
the same pixel layout as the author.

## Why it's the wrong tradeoff for visual-communicator

The visual-communicator's reports are CLIENT-SIDE LIVE HTML. The
reader interacts with the page — selects atoms, opens comment
threads, toggles theme, exports SVGs. Every one of those
interactions requires LIVE text:

- Theme toggle re-tints `<text>` via CSS; rasterized paths can't
  re-tint.
- Selection focus reads `textContent` for the click payload;
  rasterized paths have no textContent.
- Export to standalone SVG carries the live text; rasterized output
  carries opaque glyph paths.
- Screen readers can read `<text>` content; they can't read
  `<path>`-as-text.

The "pixel-perfect SVG text" goal is a PRINT-FOR-PUBLICATION
concern. visual-communicator is for interactive HTML — a different
problem.

## The use cases IS-08 ostensibly serves

1. **Print PDF generation** — exact glyph positioning for
   typography-critical layouts.
2. **Cross-browser font fallback insurance** — the rasterized
   layout doesn't depend on the consumer's font rendering.
3. **Variable-font path extraction** — variable axes (weight,
   width) baked into a `<path>` instead of requiring the variable
   font file.

For each, the in-scope alternative is:

| Use case | In-scope alternative |
|---|---|
| Print PDF | Use a separate build step (Pandoc, weasyprint, headless Chrome PDF export); leave icon-svg in HTML-only mode. |
| Font fallback | Use a self-hosted web font + `font-display: swap` + a thorough fallback chain. |
| Variable fonts | Load the variable font normally; let the browser do the variation. |

## When a user REALLY wants this

Direct them to:

- A separate static-site-generator pipeline (Astro, Eleventy) with a
  PDF / Playwright step.
- A Figma export.
- A LaTeX-with-TikZ document.
- A printed-report tool like Typst.

All of these are OUTSIDE the visual-communicator scope. icon-svg's
mandate is the live HTML report; pixel-perfect print is a different
problem.

## What about KaTeX / MathJax?

KaTeX and MathJax DO render `<text>` (and sometimes `<path>`) for
mathematical content. They're allowed in visual-communicator
reports because:

1. The renderer runs CLIENT-SIDE (KaTeX is small + browser-only;
   MathJax has a browser bundle).
2. Math glyph fidelity is genuinely important for readability.
3. The conversion to `<path>` is bounded — only math glyphs, not
   the whole document.

But neither KaTeX nor MathJax uses fontkit + Playwright server-side
extraction. They use bundled SVG glyph data OR live web font
rendering with custom positioning. icon-svg's exclusion is
specifically about the SERVER-SIDE fontkit + Playwright pipeline.

## Cross-skill seam — typography

The `typography` skill is the proper home for any typography
concerns icon-svg DOES need:

- Font stack selection (`--vc-font-body`, `--vc-font-mono`).
- Font scale (`--vc-font-scale`).
- Type hierarchy.
- Line-height tuning.

The typography skill is also CLIENT-SIDE — it sets CSS custom
properties, the browser does the typesetting. No fontkit, no
Playwright.

## The no-dep invariant informs this exclusion

See `references/no-build-no-dep-invariant.md`. Adding fontkit would
double the bundled size of the runtime; adding a Playwright build
step would require Node + a headless browser at build time. Both
violations of the invariant.

## What if the project DID want offline path embedding

Then it would be a SEPARATE BUILD TOOL (`amvcp-print` or
`amvcp-pdf-export`), distributed as a separate npm package, that
runs OFFLINE to produce a static PDF / SVG export of an already-
rendered icon-svg page. icon-svg itself would not change.

This separation keeps:

- icon-svg's no-build invariant intact.
- The runtime's bundle small.
- The print pipeline opt-in (only users who need it install it).

To date, no such build tool has been proposed.

## Cross-skill seam — none

icon-svg has NO integration with fontkit or Playwright. The
runtime renders themed `<text>` elements; the font is whatever the
browser resolves from `--vc-font-body`. There is no path-embedding
step at any layer of icon-svg.

## Visual verification

There is no path embedding to verify. If you find `require('fontkit')`
or Playwright imports in `scripts/amvcp-icon-svg.js`, the
invariant has been violated. Expected count: zero.

```bash
grep -c 'fontkit\|playwright' scripts/amvcp-icon-svg.js
# expected: 0
```

## Source citation

The IS-08 exclusion is documented in:

- `reports/visualizing-triage/20260515_123638+0200-classify-icon-svg.md`
  (IS-08 status SKIP P3, "Belongs (if anywhere) to the typography
  build tooling, not icon-svg").
- `reports/visualizing-triage/20260515_124436+0200-PHASE2-BUILD-BACKLOG.md`
  (excluded list).

The skip decision is permanent unless an explicit unsplit is
proposed via a TRDD with a build-tooling carve-out.
