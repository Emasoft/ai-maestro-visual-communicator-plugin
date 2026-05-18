# Font fallback chains, FOUT vs FOIT, and `font-display: swap`

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [The Google Fonts URL](#the-google-fonts-url)
- [The preconnect optimisation](#the-preconnect-optimisation)
- [Self-hosting via `@font-face`](#self-hosting-via-font-face)
- [Metric-matched fallbacks — `size-adjust`](#metric-matched-fallbacks--size-adjust)
- [Variable-font weight ranges](#variable-font-weight-ranges)
- [Subsetting — `&text=`](#subsetting--text)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Light + dark — orthogonal](#light--dark--orthogonal)
- [When the network fails](#when-the-network-fails)
- [`font-display: optional` for opt-out](#font-display-optional-for-opt-out)
- [Selection-contract conformance](#selection-contract-conformance)
- [Verification](#verification)
- [When NOT to use a web font](#when-not-to-use-a-web-font)
- [Cross-references](#cross-references)

When a page uses a web font (loaded from Google Fonts, a CDN, or a
self-hosted file), the browser must decide what to render during the
period the font is downloading. The wrong choice is FOIT (Flash of
Invisible Text) — text renders BLANK for up to 3 seconds while the
font loads. The right choice is FOUT (Flash of Unstyled Text) — text
renders in a fallback face immediately, then swaps when the web font
arrives.

The typography skill mandates `font-display: swap` on every web font
load, every system fallback chain ends in a generic family, and the
fallback face is metric-matched where possible to minimise layout
shift on swap.

## What it is

When the browser encounters `font-family: "Playfair Display", Georgia,
serif`, it tries each face in order:

1. **Playfair Display** — try to use it. If it's a web font that's
   still loading, the *load behaviour* (`font-display`) decides what
   to render during the wait.
2. **Georgia** — fall back if Playfair isn't available.
3. **serif** — generic family; the platform's default serif.

The `font-display` property controls the load behaviour:

| Value | Period before swap | Period after swap |
|---|---|---|
| `auto` (default) | ~3s of invisible text (FOIT) | Web font once loaded |
| `block` | ~3s of invisible text (FOIT) | Web font once loaded |
| `swap` | Fallback face shown IMMEDIATELY (FOUT) | Web font once loaded |
| `fallback` | ~100ms FOIT, then fallback for ~3s, then no swap | If web font loads in 100ms, it's used; else fallback forever |
| `optional` | ~100ms FOIT, then fallback forever | If web font loads in 100ms, it's used; else fallback forever |

The typography skill mandates `display=swap` on every Google Fonts
URL — the FOUT trade-off is correct for AMVCP pages (the reader
prefers to see *some* text immediately rather than blank text for
seconds).

## The contract

```css
/* Every font-family stack MUST end in a generic family. */
:root {
  --vc-font-heading: var(--font-heading, "Playfair Display", Georgia, serif);
  --vc-font-body:    var(--font-body, "Source Sans 3", system-ui, sans-serif);
  --vc-font-mono:    var(--font-mono, "JetBrains Mono", ui-monospace, monospace);
}
```

The fallback chain is THREE deep:
- Primary (web font).
- Secondary (system font in the same family — Georgia for serif,
  system-ui for sans, ui-monospace for mono).
- Generic family keyword (`serif`, `sans-serif`, `monospace`) — the
  ultimate fail-safe.

If the web font fails (no network), the secondary system font
renders. If the secondary font is missing (rare), the browser picks
its default for the generic family.

## The Google Fonts URL

The mandatory query parameter:

```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap">
                                                                                ^^^^^^^^^^^^^
                                                                                CRITICAL: display=swap
```

Without `display=swap`, the loaded font defaults to `display: auto`
(FOIT). Every Google Fonts URL the typography skill ships includes
`display=swap`.

## The preconnect optimisation

To minimise the swap delay, two preconnect hints sit before the
stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...&display=swap">
```

`fonts.googleapis.com` serves the CSS; `fonts.gstatic.com` serves the
font binaries. Preconnecting opens the TLS handshakes early so the
font request lands sooner.

The `crossorigin` attribute on the gstatic preconnect is REQUIRED —
fonts are fetched as CORS-restricted resources; without `crossorigin`
the preconnect is wasted (the browser opens a non-CORS connection,
then has to re-open a CORS connection for the font request).

## Self-hosting via `@font-face`

For full control (no third-party CDN), self-host the font files:

```css
@font-face {
  font-family: "Playfair Display";
  src: url("/fonts/playfair-display.woff2") format("woff2");
  font-weight: 400 700;                /* variable font weight range */
  font-display: swap;                  /* MANDATORY */
  font-style: normal;
  unicode-range: U+0000-00FF, U+0131,  /* Latin Basic subset */
                  U+0152-0153, U+02BB-02BC;
}
```

Key declarations:

- `src: url(...) format("woff2")` — WOFF2 is the modern font format;
  smaller than WOFF, universal browser support.
- `font-display: swap` — same FOUT contract as Google Fonts.
- `font-weight: 400 700` — for variable fonts, the supported weight
  range. The browser interpolates between 400 and 700.
- `unicode-range: U+...` — restricts which characters this font file
  serves. If the page uses only Latin characters, restricting to the
  Latin subset cuts the font file size dramatically.

## Metric-matched fallbacks — `size-adjust`

A subtle but powerful technique: when the web font loads (post-swap),
the page layout often SHIFTS because the web font has different
metrics than the fallback. This is "CLS" (Cumulative Layout Shift)
and hurts both UX and Core Web Vitals score.

CSS lets you ADJUST the fallback font's metrics to match the web font:

```css
@font-face {
  font-family: "Playfair Display Fallback";
  src: local("Georgia");
  size-adjust: 105%;                   /* Georgia at 105% matches Playfair */
  ascent-override: 95%;
  descent-override: 22%;
  line-gap-override: 0%;
}

:root {
  --vc-font-heading: "Playfair Display",
                     "Playfair Display Fallback",
                     Georgia,
                     serif;
}
```

Now the fallback (Georgia, adjusted via `size-adjust`) renders at the
same visual size as Playfair — when Playfair loads and swaps in, no
layout shift.

The size-adjust values come from a per-font metric analysis (use
https://fontemetrics.com/ to compute them). The typography skill
ships size-adjust declarations for the 5 named pairings; for custom
fonts the agent computes the values per-font.

## Variable-font weight ranges

For a variable font (e.g. Fraunces, IBM Plex), declare the entire
weight range:

```css
@font-face {
  font-family: "Fraunces";
  src: url("/fonts/fraunces-variable.woff2") format("woff2-variations");
  font-weight: 100 900;                /* full range */
  font-style: normal italic;            /* both upright and italic */
  font-display: swap;
}
```

Then in CSS:

```css
.vc-type-heavy { font-weight: 800; }   /* maps to the variable axis */
.vc-type-light { font-weight: 200; }
```

The variable font interpolates between the supported axis values; the
browser doesn't need a separate font file per weight.

## Subsetting — `&text=`

For *display* fonts used only in a few characters (a title, a
heading), use the `&text=` Google Fonts parameter to subset:

```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Playfair+Display&text=AnnualReport2026&display=swap">
```

The downloaded font contains ONLY the glyphs in "AnnualReport2026"
(plus a few common chars). The file size drops from ~50KB to ~3KB.

Use `&text=` for:
- A page title that's the only place the display font appears.
- A "Hero" tagline that's not used elsewhere.

Don't use `&text=` for:
- Body text — too many distinct characters.
- Headings that may have varied content — the subset would be wrong
  for any heading the page-author hasn't pre-computed.

## Tokens consumed / extended

- **Consumes:** `--font-heading`, `--font-body`, `--font-mono` (set
  by the DESIGN.md frontmatter or page-local).
- **Extends:** nothing.

The font choice is a DESIGN.md decision; the LOADING discipline (the
preconnect, `display=swap`, the fallback chain) is the typography
skill's contract.

## Light + dark — orthogonal

Font loading is theme-orthogonal. The same fonts, same fallbacks,
same swap behaviour apply in both themes.

## When the network fails

With `display=swap` + a system fallback + a generic family in the
chain, the page is ALWAYS readable:

- Network up, fast: web font loads quickly, fallback shown for ~100ms,
  then swap.
- Network up, slow: fallback shown for several seconds, eventual
  swap.
- Network down: fallback shown indefinitely (the page is fully
  readable in the fallback face).

There is no scenario where the page renders blank or unreadable.
This is fail-soft by construction.

## `font-display: optional` for opt-out

For a deliberately minimal-CLS page where the agent prefers the
fallback over the web font when the swap is slow:

```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=optional">
```

`display=optional` gives the browser ~100ms to load the font; if it
arrives in time, it's used; otherwise the fallback renders
permanently for the session. No swap (no CLS).

Use `optional` when:
- The page is performance-critical (a landing page).
- The fallback is well-metric-matched (you're OK with the fallback).

Use `swap` (the default for AMVCP) when:
- The web font is part of the brand identity (must render eventually).
- Slight CLS is acceptable.

## Selection-contract conformance

Font loading is page-level, not per-atom. The typography skill ships
the contract; the runtime emits the `<link rel="stylesheet">` and
`<link rel="preconnect">` tags. There is no per-atom data-ve-id for
"font load behaviour".

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page; open DevTools Network panel.
2. Confirm `<link rel="preconnect">` for both `fonts.googleapis.com`
   and `fonts.gstatic.com` (the latter with `crossorigin`).
3. Confirm every Google Fonts URL includes `display=swap`.
4. Throttle the network to "Slow 3G"; reload. Confirm the page
   renders text immediately in the fallback face; the web font
   swaps in once loaded.
5. Block `fonts.gstatic.com` in DevTools; reload. Confirm the page
   renders permanently in the fallback face (still readable).
6. Confirm the fallback face is metric-matched (no visible CLS on
   swap) using DevTools Performance > Layout Shift.
7. Confirm Core Web Vitals' CLS score is < 0.1.

## When NOT to use a web font

- Performance-critical pages (a status dashboard refreshed every
  second).
- Offline-first apps.
- Embedded widgets (don't impose a font choice on the host page).
- Email-rendered HTML (clients vary; system fonts are safer).

For these cases, use the **System** preset
(see [font-loading-pairings.md](./font-loading-pairings.md)) — no
web fonts loaded, zero network, every page reads instantly.

## Cross-references

- [font-loading-pairings.md](./font-loading-pairings.md) — the five
  named pairings; each ships its own preconnect + `display=swap`
  loading discipline.
- [tri-font-stack-anthropic.md](./tri-font-stack-anthropic.md) — the
  tri-font preset; same loading discipline applies.
- [variable-font-tokens.md](./variable-font-tokens.md) — variable
  fonts use weight ranges in `@font-face`.
