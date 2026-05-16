# 30 — DESIGN.md token mapping (every `--vc-*` the deck reads)

The slide module is fully DESIGN.md-themed — every colour, every
font, every size, every duration in the injected CSS is a
`var(--vc-*, fallback)` reference. The engine
(`amvcp-designmd.js`) is the producer; the slide CSS is the
consumer.

This reference is the AUTHORITATIVE mapping of every token the slide
module reads, the canonical fallback that applies when the engine
hasn't supplied a value, and which slide surface each token themes.

## What this is

Every CSS rule in `injectSlideCSS()` carries a `var(--vc-NAME,
DEFAULT)` reference. The fallback is the canonical default — the
value the deck renders correctly with when no DESIGN.md is loaded.
The engine, when active, swaps the token; every CSS rule
recomputes on the next paint, no further JS code needed.

The complete token map:

### Color tokens

| Token | Light default | Dark default | Themes |
|---|---|---|---|
| `--vc-color-canvas` | `#ffffff` | `#0f1217` | Stage + viewport background, letterbox bars. |
| `--vc-color-content` | `#1f1a14` | `#e8eaef` | Default text, heading text, bullet text. |
| `--vc-color-content-muted` | `#5b5343` | `#9a9484` | Subtitles, metric labels, pane titles. |
| `--vc-color-accent` | `#b8861f` | `#d4a73a` | Eyebrows, metric values, bullet markers, progress bar. |
| `--vc-color-accent-2` | `#788C5D` | `#d4a73a` | Second-series chart colour, alternate callout. |
| `--vc-color-divider` | `#e1ddd1` | `#2a2e35` | Inter-pane dividers, callout borders. |
| `--vc-color-surface` | `#f5f0e6` | `#1a2030` | Card backgrounds (bento, stack). |
| `--vc-color-info` | `#3b82f6` | `#60a5fa` | Info-variant callout. |
| `--vc-color-success` | `#788C5D` | `#3fb950` | Tip-variant callout, positive metric delta. |
| `--vc-color-warning` | `#f59e0b` | `#fb923c` | Warning-variant callout. |
| `--vc-color-danger` | `#b04a3f` | `#f85149` | Danger-variant callout, negative metric delta. |
| `--vc-color-overlay-text` | `#ffffff` (always) | `#ffffff` (always) | Full-bleed overlay text. |
| `--vc-color-overlay-scrim` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.6)` | Full-bleed scrim. |
| `--vc-color-callout-info-bg` | `#f0f5fc` | `#1a2a3e` | Info callout background. |
| `--vc-color-callout-tip-bg` | `#f0f7f0` | `#1a2e1a` | Tip callout background. |
| `--vc-color-callout-warning-bg` | `#fef3e2` | `#3e2a1a` | Warning callout background. |
| `--vc-color-callout-danger-bg` | `#fde8e6` | `#3e1a1a` | Danger callout background. |

### Font tokens

| Token | Default | Themes |
|---|---|---|
| `--vc-font-body` | `system-ui, sans-serif` | Bullets, text, callouts, default. |
| `--vc-font-heading` | `Georgia, serif` | Heading, eyebrow (some moods). |
| `--vc-font-mono` | `ui-monospace, monospace` | Eyebrow, metric labels, cite, code-block. |
| `--vc-font-quote` | `Georgia, serif` (italic) | Quote blockquote. |
| `--vc-weight-bold` | `800` | Heading weight, metric value weight. |
| `--vc-weight-regular` | `400` | Body weight. |

### Text size tokens (fluid via clamp)

| Token | Default | Themes |
|---|---|---|
| `--vc-text-6` | `128 px` | Metric value (hero tier). |
| `--vc-text-5` | `96 px` | H1 heading (manifesto, statement, closing). |
| `--vc-text-4` | `64 px` | H2 heading (content, comparison, etc.). |
| `--vc-text-3` | `40 px` | Bullet text, text block, default body. |
| `--vc-text-2` | `28 px` | Bullet sub-text, pane titles. |
| `--vc-text-1` | `20 px` | Eyebrow, metric label, cite. |
| `--vc-text-quote` | `48 px` | Quote text. |
| `--vc-text-code` | `18 px` | Code block (delegated, also reads). |
| `--vc-line-height` | `1.15` | Heading + bullet line-height. |
| `--vc-line-height-quote` | `1.35` | Quote line-height (relaxed). |

### Space tokens (the spatial ladder)

| Token | Default | Themes |
|---|---|---|
| `--vc-space-1` | `4 px` | Tight gaps (icon-to-label). |
| `--vc-space-2` | `8 px` | Bullet marker size, small gaps. |
| `--vc-space-3` | `24 px` | Default block gap, bullet gap. |
| `--vc-space-4` | `40 px` | Bullet padding-left, block stack gap. |
| `--vc-space-5` | `32 px` | Layout grid gap (content, two-column, bento). |
| `--vc-space-6` | `48 px` | Slide padding-block (content, comparison). |
| `--vc-space-7` | `64 px` | Heavy slide padding (manifesto, closing, quote). |

### Radius tokens

| Token | Default | Themes |
|---|---|---|
| `--vc-radius-card` | `12 px` | Bento card, callout, stack card. |
| `--vc-radius-image` | `12 px` | Image block (non-full-bleed). |
| `--vc-radius-full` | `9999 px` | Bullet marker, dot row. |

### Motion tokens (optional)

| Token | Default | Themes |
|---|---|---|
| `--vc-duration-fast` | `120 ms` | Hover, dot-active. |
| `--vc-duration-normal` | `200 ms` | Block fade-ins. |
| `--vc-duration-slow` | `400 ms` | Slide-left transition, hint fade. |
| `--vc-ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Block entrance easing. |
| `--vc-ease-back` | `cubic-bezier(0.34,1.56,0.64,1)` | Playful bounce. |

### Shadow / elevation tokens

| Token | Default | Themes |
|---|---|---|
| `--vc-shadow-card` | `0 1px 3px rgba(0,0,0,0.08)` | Bento card, stack card. |
| `--vc-shadow-elevated` | `0 4px 12px rgba(0,0,0,0.15)` | Hovered cards. |
| `--vc-border-width-callout` | `4 px` | Callout left border. |

## Scaffold — minimum DESIGN.md for a slide deck

A deck themes correctly with NO DESIGN.md (every token has a
canonical fallback). To override theming, ship a DESIGN.md with
just the tokens you need:

```yaml
---
colors:
  light:
    canvas: "#faf9f5"
    content: "#141413"
    accent: "#D97757"
    surface: "#E3DACC"
  dark:
    canvas: "#141413"
    content: "#FAF9F5"
    accent: "#D97757"
fonts:
  heading: "Instrument Serif, Georgia, serif"
  body: "Inter, system-ui, sans-serif"
spacing:
  scale: [4, 8, 12, 16, 24, 32, 48, 64]
---
```

The engine resolves the YAML → emits `--vc-color-canvas: #faf9f5`,
etc. on `:root`. The slide CSS picks them up.

## Lib functions called

- `readToken(name, fallback)` — internal helper. Reads
  `:root`-applied CSS custom property via `getComputedStyle`;
  returns `fallback` when the token is absent / empty / unreadable.
  Used by the duration helpers `readDurationMs()`.
- `injectSlideCSS(doc)` — the entry point that appends the
  ~600-line stylesheet to `doc.head`. Idempotent.
- `window.amvcpDesignMd.parseDesignMd(rawText)` —
  called by `boot()` when the page has both the slide module + the
  designmd engine + an embedded `<script type="text/markdown"
  id="vsd-preset">` block. Returns the parsed token tree.
- `window.amvcpDesignMd.resolveTokens(tree, mode)` — flattens the
  parsed tree to a `Map<token-name, value>`.
- `window.amvcpDesignMd.applyTokens(map, doc.documentElement)` —
  writes each token as a CSS custom property on `:root`.

## DESIGN.md tokens NOT used by the slide layer

The slide layer specifically does NOT read:
- `--vc-tab-*` (tab UI tokens) — slides don't have tabs.
- `--vc-form-*` (form-control tokens) — slides don't have forms.
- `--vc-modal-*` — the comment modal is the runtime's layer, not the
  slide layer's.
- `--vc-toc-*` (table-of-contents tokens) — the deck nav uses dots,
  not a TOC.

When the slide layer needs a token that doesn't exist in the
DESIGN.md canonical set, it adds a new `--vc-*` token (e.g.
`--vc-color-overlay-scrim` is slide-specific). New tokens MUST
follow the engine's `--vc-` prefix convention so the engine can
resolve them.

## Selection / comment / decision-mini contract notes

The slide layer also reads:
- `data-ve-selected="1"` attribute on slides (runtime selection
  state) — paints the selection ring inset.
- `:focus-visible` pseudo-class — paints the keyboard focus ring
  inset.
- `:hover` — paints an inset box-shadow glow.

These don't use `--vc-*` tokens directly — they use `color-mix(in
srgb, var(--vc-color-accent) 35%, transparent)` to derive the
selection / hover colours from the accent token. The result: every
selection state themes with the deck's accent automatically.

## When to use this reference

Open this ref when:

- Picking which `--vc-*` tokens a custom DESIGN.md needs to override
  for a slide-specific theme.
- Debugging "why isn't my colour change taking effect" — check the
  token name against this table.
- Adding a new visual surface to the slide layer — ensure the surface
  reads a `--vc-*` token, not a literal hex.

## Don'ts

- Don't write literal colours / sizes / durations in slide CSS. Every
  visual property reads a `--vc-*` token with a fallback.
- Don't invent new token prefixes (`--slide-`, `--vsd-color-`). All
  theming tokens use the engine's `--vc-` prefix.
- Don't override the canonical fallback to something exotic. The
  fallback is the deck's "no-theme" appearance — making it weird
  means the no-theme experience is weird.
- Don't strip the fallback. Every `var(--vc-NAME)` MUST have a
  fallback; without it a missing-token failure shows as a blank /
  black surface.

## Visual verification

After a DESIGN.md change:

1. Reload the deck; verify the new colours apply in light + dark.
2. Open DevTools → Elements → `:root`; verify the `--vc-*` tokens
   are set to the DESIGN.md values.
3. Hover any element; verify the computed CSS is reading the token
   not the fallback (the fallback appears in italics in Chrome
   DevTools when the token is present).
4. Toggle `prefers-color-scheme` between light and dark; verify the
   token swap happens (the engine listens to the media query).

## Source provenance

- The full token map is the consolidated `--vc-*` namespace from
  DM-07 / DM-08 (the 3-tier token architecture).
- The light + dark defaults come from the Anthropic-Claude design
  language documented in DM-12 and the extended-mining catalogue
  (`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
  lines 482-495).
- Every `var(--vc-*, FALLBACK)` carries the canonical fallback per
  slide-spec.md §13 ("a token-less DESIGN.md still themes the deck
  correctly").
- The `readToken(name, fallback)` helper is the slide module's
  defensive token reader at lines 154-167 of `amvcp-slide.js`.
