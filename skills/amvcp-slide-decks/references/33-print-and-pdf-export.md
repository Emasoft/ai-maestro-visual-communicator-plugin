# 33 — Print + PDF export (native browser, one slide per page)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Print-preview troubleshooting](#print-preview-troubleshooting)
- [Browser quirks](#browser-quirks)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [PDF vs PNG export comparison](#pdf-vs-png-export-comparison)
- [Page-size tuning by aspect](#page-size-tuning-by-aspect)
- [Source provenance](#source-provenance)

The slide module ships a `@media print` block that does ONE specific
job: when the user picks "Save as PDF" (or hits Cmd-P), every slide
becomes one page. No nav chrome, no transitions, no letterbox bars
— each slide at the stage's natural size, one per sheet, in
declared order.

This is the cheapest possible PDF export — no headless browser
runner, no Puppeteer, no Playwright. The user's browser does it
natively because the print CSS told it how.

## What this is

The injected stylesheet ends with a `@media print` block:

```css
@media print {
  /* Show every slide; remove transforms; restore natural pixel size. */
  .vsd-stage {
    transform: none !important;
    width: 1920px !important;
    height: auto !important;
  }
  .vsd-slide[hidden] { display: flex !important; }
  .vsd-slide {
    position: static;
    inset: auto;
    break-after: page;
    page-break-after: always;
    box-shadow: none !important;
    outline: none !important;
  }
  .vsd-slide:last-child {
    break-after: avoid;
    page-break-after: avoid;
  }
  /* Hide nav chrome. */
  .vsd-progress, .vsd-dots, .vsd-counter,
  .vsd-hints, .vsd-fs-btn {
    display: none !important;
  }
  /* Print everything in light theme regardless of the user's prefs. */
  @page {
    margin: 0;
    size: 1920px 1080px landscape;
  }
}
```

Five things happen in print:

1. The `transform: scale()` letterbox is removed — slides render at
   their natural pixel size.
2. Every slide is unhidden (deck-mode hides all but the current
   slide).
3. Each slide gets `break-after: page` so it occupies one page.
4. Nav chrome is hidden.
5. `@page` is set to the stage aspect ratio so paper matches.

## Scaffold to emit

Nothing — the print CSS is automatic. The user just hits Cmd-P (or
Ctrl-P on Windows).

To test:

```bash
# In Chrome:
# 1. Open the deck.
# 2. Cmd-P → "Save as PDF" → Destination.
# 3. Verify one slide per page in the preview.
```

## Lib functions called

None — the print path is pure CSS. JavaScript stays out of the
print pipeline (it doesn't fire on `Cmd-P`).

## DESIGN.md tokens used

The print CSS reads the same `--vc-*` tokens as the screen CSS.
The deck themes the same in print as on screen — UNLESS the user
has dark-mode active, in which case the print would dump a
dark-themed PDF (every cell of black ink). To prevent this:

The print CSS can optionally FORCE light mode by overriding the
canvas + content tokens:

```css
@media print {
  :root {
    --vc-color-canvas: #ffffff !important;
    --vc-color-content: #000000 !important;
    /* ... rest of light-mode overrides ... */
  }
}
```

The current implementation does NOT force light mode — the user's
DESIGN.md / system preference wins. This is the right default for
share-internal-PDFs but the wrong default for ink-printing. A
future enhancement is a `printTheme: "light" | "dark" | "preserve"`
deck-level field.

## Selection / comment / decision-mini contract notes

Selection state, comments, and decision-mini pills do NOT print.
The print CSS hides them via the chrome selectors. A printed PDF is
the deck's CONTENT, not its review surface.

## When to use this reference

Open this ref when:

- A user asks "how do I save this as a PDF?"
- Print preview looks wrong (missing slides, garbled layout, dark
  background).
- An archive of the deck is needed for a wiki / handoff doc.
- A conference asks for "PDF of your deck please".

## Print-preview troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Only the first slide prints | The `hidden` attribute didn't strip in print | Verify the print CSS contains `.vsd-slide[hidden] { display: flex !important; }`. |
| Slides print at fractional size | The transform didn't reset | Verify the print CSS contains `.vsd-stage { transform: none !important; }`. |
| Nav chrome prints | The display:none didn't apply | Verify the print CSS contains the chrome-hiding selectors. |
| Dark-themed pages print (lots of ink) | System / DESIGN.md is dark | Switch to light mode before printing OR override `--vc-color-canvas` in print. |
| Multiple slides crowd one page | Missing `page-break-after` | Verify the print CSS contains `break-after: page; page-break-after: always;`. |
| Pages have white borders | Default page margins | Verify `@page { margin: 0; }`. |
| Pages are portrait when stage is landscape | Default page orientation | Verify `@page { size: 1920px 1080px landscape; }`. |

## Browser quirks

| Browser | Status |
|---|---|
| Chrome / Edge (Chromium) | Full support; the canonical implementation tested against. |
| Safari | Works; `@page size` is honoured. |
| Firefox | Works; `break-after` syntax preferred over `page-break-after`. |
| Mobile Safari / Chrome on iOS | Print sheet is generated; `@page size` may be ignored on small viewports. |

## Don'ts

- Don't add JavaScript to the print path. The user's print dialog
  fires SYNCHRONOUSLY; any JS that would resize / regenerate the
  DOM doesn't run.
- Don't rely on print for the deck's primary distribution. PDFs
  are an archive format; the deck's natural surface is the
  browser. Use the share-page skill for distribution.
- Don't add background images that depend on opacity-blending.
  Some printers / PDF generators handle opacity poorly; test the
  full-bleed slides specifically.
- Don't ship a deck where the print output is the ONLY way to
  read it. The browser-served version must be the primary
  surface.

## Visual verification

After every deck-touching change:

1. Open the deck in Chrome.
2. Cmd-P → print preview.
3. Verify: every slide renders, one per page, in declared order,
   chrome absent, page aspect matches stage.
4. Page count = `deck.slides.length`.
5. Page 1 = slide 1 (manifesto); last page = closing.

Capture a screenshot of the print preview at 1024×768 via
`skills/amvcp-self-debug-rules/SKILL.md` for spot-check.

## PDF vs PNG export comparison

| Export | Tool | Output | Best for |
|---|---|---|---|
| Browser "Save as PDF" | Cmd-P | Vector PDF, one slide per page | Archives, handouts, email attachments. |
| DevTools screenshot (full-page) | Cmd-Shift-P → "Capture full size screenshot" | Single PNG of the deck (when in scroll-snap mode) | Quick visual snapshot for chat. |
| Headless Chrome / Playwright | `--screenshot=foo.png` | Per-slide PNG | Automated documentation generation. |
| Print-to-image driver | macOS Preview / Win Snipping Tool | One PNG per print page | Slow but works on any OS. |

For 95% of cases, the browser's native "Save as PDF" is the right
answer — it's vector (sharp at any zoom), one slide per page, and
zero infrastructure.

## Page-size tuning by aspect

The print CSS sets `@page { size: 1920px 1080px landscape; }` —
matched to the 16:9 stage. For a deck at a different aspect, the
size should match the stage:

```css
/* For aspect: "4:3" — 1280×960 */
@media print {
  @page { size: 1280px 960px landscape; }
}

/* For aspect: "3:2" — 1620×1080 */
@media print {
  @page { size: 1620px 1080px landscape; }
}
```

The current implementation hard-codes 1920×1080 in the print CSS —
which works for 16:9 decks but letterboxes 4:3 / 3:2 decks on the
PDF page. A future enhancement is per-aspect print sizing; for now,
the 16:9 default is correct for the most common aspect.

## Source provenance

- The `@media print { transform: none; width: 1920px }` pattern is
  SL-01's print-export rule lifted verbatim
  (`reports/visualizing-triage/20260515_112406+0200-MASTER-CONSOLIDATED.md`
  line 1866).
- `break-after: page; page-break-after: always;` is the
  cross-browser pagination spec — `break-after` is the modern
  syntax; `page-break-after` is the legacy fallback.
- The `@page { margin: 0; size: ... landscape; }` is the
  page-setup spec from the W3C Paged Media module.
- The chrome-hiding selectors are the slide module's own; the
  chrome was authored as `.vsd-progress` / `.vsd-dots` / etc.
  precisely so the print CSS could hide them with stable
  selectors.
