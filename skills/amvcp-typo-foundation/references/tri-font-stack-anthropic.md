# Tri-font stack — the "serif headings + sans body + mono labels" preset

## Table of Contents

- [What it is](#what-it-is)
- [Why three faces (not two)](#why-three-faces-not-two)
- [DESIGN.md frontmatter](#designmd-frontmatter)
- [The three Google-Fonts-served tri-font presets](#the-three-google-fonts-served-tri-font-presets)
- [Banned-font check](#banned-font-check)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [The `<code>` chip — the integration receipt](#the-code-chip--the-integration-receipt)
- [Selection-contract conformance](#selection-contract-conformance)
- [When to choose a tri-font preset](#when-to-choose-a-tri-font-preset)
- [When to choose System over a Google-served preset](#when-to-choose-system-over-a-google-served-preset)
- [Light + dark — orthogonal](#light--dark--orthogonal)
- [Verification](#verification)
- [Cross-references](#cross-references)

The single most-replicated font-pairing pattern in the AMVCP
catalog: a **three-face stack** locked across an entire deliverable —
serif for hero / title / section H; sans-serif for body; mono for
labels, code, file paths, chip text. The Anthropic-Claude reference
corpus uses this combination across all 21 demo HTML files in
`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
§3.3 ("locked combo across the whole repo").

This reference describes the *tri-font* preset as a first-class font
pairing — a sixth option alongside the five pairings in
[font-loading-pairings.md](./font-loading-pairings.md), specifically
optimised for **technical content** (reports, dashboards, prose
pages, slide decks with code) where the reader's eye needs three
distinct visual registers.

## What it is

Three font families bound to three roles:

| DESIGN.md key | Role | Default value (the System tri-font preset) |
|---|---|---|
| `font-heading` | Hero / `<h1>` / `<h2>` / `<h3>` | Serif — `ui-serif, Georgia, "Times New Roman", serif` |
| `font-body` | `<p>`, `<li>`, `<small>`, lead | Sans-serif — `system-ui, -apple-system, "Segoe UI", sans-serif` |
| `font-mono` | `<code>`, `<kbd>`, `<pre>`, `.vc-mono` | Monospaced — `ui-monospace, "SF Mono", Menlo, Consolas, monospace` |

The pairing's *visual signature* is the **register contrast**: serif
adds editorial weight to titles, sans adds quiet legibility to body
prose, mono adds technical authority to code and file paths. The
reader's eye knows which is which without having to read the content
to confirm.

## Why three faces (not two)

A two-face (serif+sans) pairing is fine for **prose-only** content
— editorial articles, blog posts, policy documents. The moment a
deliverable carries:

- a file path (`src/components/Card.tsx`),
- a config value (`port: 5432`),
- a CLI command (`uv run script.py`),
- a chip label (`SEV-2`, `+0kb`),
- an inline value in a sentence (`(N=47)`),

…the *body sans* face renders those technical tokens in the same
register as the surrounding prose, and the reader loses the visual
distinction. A monospace face for those tokens restores the
distinction at zero ambiguity cost.

This is why every technical-content AMVCP deliverable (report-doc,
slide deck for engineers, dashboard, prose-page on a technical topic)
ships the tri-font stack — the mono face is the *third register* the
content needs.

## DESIGN.md frontmatter

```yaml
typography:
  font-heading: "ui-serif, Georgia, 'Times New Roman', serif"
  font-body:    "system-ui, -apple-system, 'Segoe UI', sans-serif"
  font-mono:    "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
```

This is the **System tri-font** — zero CDN, zero network. The
fallbacks are `ui-serif`, `system-ui`, `ui-monospace` (the canonical
generic-family keywords), which map to the platform's native faces:

| Platform | Serif | Sans | Mono |
|---|---|---|---|
| macOS | New York | San Francisco | SF Mono |
| Windows | Cambria | Segoe UI | Cascadia Code |
| Linux | DejaVu Serif | DejaVu Sans / Cantarell | DejaVu Sans Mono |
| iOS | New York | San Francisco | Menlo |
| Android | Noto Serif | Roboto | Droid Sans Mono |

Every platform has a serif, a sans, and a mono — and they all look
**right** at their platform's optical sizes. No font download. No
licensing dance.

## The three Google-Fonts-served tri-font presets

For projects that want a branded look without the System variation,
three presets are pre-configured. Each picks faces that share x-height
and weight density so the three registers sit cleanly together.

### Preset T-1 — "Editorial" (Playfair Display + Source Sans 3 + JetBrains Mono)

```yaml
typography:
  font-heading: "'Playfair Display', ui-serif, Georgia, serif"
  font-body:    "'Source Sans 3', system-ui, -apple-system, sans-serif"
  font-mono:    "'JetBrains Mono', ui-monospace, Menlo, monospace"
```

Loading:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
```

- Heading face: high-contrast modern-serif, dramatic — best for
  editorial reports where the title carries the deliverable.
- Body face: clean low-contrast humanist sans — exceptional readability
  at small sizes.
- Mono face: code-optimised mono with deep ligatures.

### Preset T-2 — "Structured" (IBM Plex Serif + IBM Plex Sans + IBM Plex Mono)

```yaml
typography:
  font-heading: "'IBM Plex Serif', ui-serif, Georgia, serif"
  font-body:    "'IBM Plex Sans', system-ui, -apple-system, sans-serif"
  font-mono:    "'IBM Plex Mono', ui-monospace, Menlo, monospace"
```

Loading:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
```

The Plex family is purpose-designed as a tri-stack — the serif, sans,
and mono all share x-height, stroke modulation, and weight density.
Best when the page tone is "engineering report" — terse, technical,
no editorial drama.

### Preset T-3 — "Warm-Modern" (Fraunces + DM Sans + DM Mono)

```yaml
typography:
  font-heading: "'Fraunces', ui-serif, Georgia, serif"
  font-body:    "'DM Sans', system-ui, -apple-system, sans-serif"
  font-mono:    "'DM Mono', ui-monospace, Menlo, monospace"
```

Loading:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap">
```

Fraunces is a *variable* font with both `opsz` (optical size) and
`wght` axes, so the variable-font axis layer
([variable-font-tokens.md](./variable-font-tokens.md)) is fully active
on the heading face — large hero text uses the display optical master,
small headings use the text master, automatically.

## Banned-font check

All three Google-served presets above pass the DT-09 banned-primary-
font gate:

- T-1 Source Sans 3 — not banned (the banned list is Inter / Roboto /
  Open Sans / Lato / Nunito; "Source Sans 3" is the 2022 rename of
  Adobe's Source Sans Pro, distinct from "Open Sans").
- T-2 IBM Plex Sans — not banned.
- T-3 DM Sans — not banned.

The System preset (`system-ui` body) is trivially safe — it is the
platform's native sans face.

## Tokens consumed / extended

- **Consumes:** `--vc-font-heading`, `--vc-font-body`, `--vc-font-mono`
  (engine).
- **Extends:** nothing. The pairing only chooses values for the three
  existing font tokens.

## The `<code>` chip — the integration receipt

The single most visible demonstration of the tri-font stack is the
inline `<code>` chip pattern (from
`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
§3.10):

```css
code, .vc-code-inline {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: 0.9em;                 /* slightly smaller than surrounding body */
  background: var(--ve-surface-soft, rgba(0,0,0,0.05));
  padding: 0.1em 0.4em;
  border-radius: 4px;
}
```

The chip pattern is owned by `amvcp-code-highlight`, not by
typography — but it CONSUMES `--vc-font-mono`, so the tri-font preset
is what makes the chip work. Pick a tri-font preset and every inline
`<code>` chip on the page renders in the picked mono face, automatically.

## Selection-contract conformance

A tri-font preset is a **document-level decision**, not an atom. It
sets values into the DESIGN.md frontmatter; the runtime emits
`--vc-font-*` from those values; every typography element on the page
reads `--vc-font-*` via the typography CSS layer. There is no per-atom
data-ve-id stamped for "the font choice" — the agent comments on the
choice by editing DESIGN.md.

## When to choose a tri-font preset

- ALWAYS for reports, dashboards, prose-pages on technical topics.
- ALWAYS for slide decks that mix editorial titles with code/data.
- ALWAYS for the default System preset when network access is uncertain.
- NEVER for pure-editorial content with no technical tokens —
  a two-face (serif+sans) pairing reads better.
- NEVER for ASCII-art or pure-code content — a mono-only "Mono" style
  axis (see `design-tokens` skill's `data-style="mono"` orthogonal
  axis) renders the whole page in mono.

## When to choose System over a Google-served preset

- The deliverable must work **offline**.
- The deliverable is a one-shot email attachment that may render
  before any external resource loads.
- The deliverable's audience is on bandwidth-constrained networks.
- The deliverable's tone is *system-native* — looks like the host OS,
  not branded — e.g. an in-app technical doc.

A System preset's `font-display: swap` is **N/A** — no Google Fonts
loaded, no swap, no FOUT. The fallback chain just resolves to the
platform face on the first paint.

## Light + dark — orthogonal

The tri-font preset sets `font-family` only — no `color`, no
`background`. It is correct in BOTH the light and dark themes
identically. A theme swap re-skins the page's *colours*; the
*registers* (serif / sans / mono) stay the same.

## Verification

The Visual Verification procedure
(`skills/amvcp-self-debug-rules/SKILL.md`) for a tri-font preset:

1. Generate the specimen page with the chosen preset embedded.
2. Screenshot in the light theme.
3. Screenshot in the dark theme.
4. Confirm: a heading row is clearly in the SERIF face; the body
   paragraph below is clearly in the SANS face; a `<code>` chip is
   clearly in the MONO face. Three visually-distinct registers.
5. Confirm: the heading + body + chip render with **identical
   weights** between the two themes (only colours differ).
6. Confirm: with `display: swap` and the Google Fonts CDN
   unreachable (simulate by blocking `fonts.gstatic.com` in DevTools'
   network panel) the page still renders all three registers — the
   System fallback fills in.

## Cross-references

- [font-loading-pairings.md](./font-loading-pairings.md) — the five
  named font pairings + the System pairing this is one of.
- [variable-font-tokens.md](./variable-font-tokens.md) — the
  variable-font axis layer that activates automatically on T-3
  Fraunces.
- [code-and-mono.md](../../amvcp-typo-code-keys/references/code-and-mono.md) — the inline `<code>` chip /
  `<pre>` block stylings that consume `--vc-font-mono`.
- `design-tokens` skill — owns the orthogonal `data-style="mono"` axis
  that flips the body face to mono globally for ASCII-art / terminal
  pages.
