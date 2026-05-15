# Token contact-sheet schema

The token contact sheet is the headline design-tokens deliverable: a
rendered, self-contained, DESIGN.md-themed HTML "living design page"
that shows every token visually, click-to-copy.

## API

```
amvcpTokenSheet.renderContactSheet(designmd, opts) -> HTMLElement
amvcpTokenSheet.mountContactSheet(designmd, container, opts)
amvcpTokenSheet.contrastRatio(hexA, hexB) -> number
```

`designmd` is a PARSED DESIGN.md — `amvcpDesignMd.parseDesignMd(text)
.designmd`. The renderer reads `designmd.tokens` and is **schema-driven**
— a new token group in the engine produces a new panel with no renderer
change.

## Page structure

A single `<main class="vc-sheet" data-vc-sheet="1">`, a header strip
(doc title + a Theme toggle button), then one
`<section data-vc-panel="…">` per token group:

| `data-vc-panel` | Shows |
|---|---|
| `color` | a 4-column CSS-grid color grid, BOTH themes, each cell a swatch with role name + hex + WCAG contrast ratio |
| `typography` | one specimen line per type-scale step at its true px size + the three font stacks |
| `spacing` | one bar per spacing step, **true pixel width** (not %) |
| `radius` | 6 squares, each `border-radius:var(--vc-radius-<k>)` |
| `elevation` | one neutral card per `--vc-shadow-<n>` (0-4 + border) |
| `motion` | one demo chip per easing — click to feel the curve; static under reduced-motion |
| `z-index` | a stack diagram — 9 overlapping plates positioned by `var(--vc-z-<k>)` |
| `state` | interaction-state demos — idle / hover / focus / pressed / disabled + a live instance |
| `code` | a syntax-highlighted sample (tiny built-in tokenizer) + a 12-color legend |
| `semantic-roles` | the badge / activity / graph-node role maps as labelled chip rows |

An optional engine group that the loaded DESIGN.md omits (e.g. no
`elevation:`) produces NO panel — the sheet is exactly the loaded
DESIGN.md's token surface.

## Color cells — contrast annotation

Each color cell shows the WCAG contrast ratio of that color: text roles
(`content`, `content-muted`, `content-subtle`) are measured against
`surface`; every other role against `canvas`. A text-role cell whose
ratio is below 4.5:1 gets `data-vc-contrast-warn="1"`. The contrast
formula is the WCAG 2.x one — `(Lmax+0.05)/(Lmin+0.05)`, relative
luminance `L = 0.2126R + 0.7152G + 0.0722B` on gamma-decoded channels.
The color panel renders BOTH the active theme's grid AND the opposite
theme's grid, side by side — the dual-theme contract made visible.

## Click-to-copy

Every swatch / specimen / bar / chip is a `<button>` (keyboard-
accessible) carrying `data-vc-copy="<value>"`. One delegated `click`
listener on the sheet root copies the value via
`navigator.clipboard.writeText` and flashes a "copied" tooltip
(`[data-vc-copied]` CSS).

**Graceful degradation** — copying is a CONVENIENCE affordance, not a
data contract, so this is the ONE deliberate fail-soft path: if
`navigator.clipboard` is unavailable (insecure context / old browser),
it falls back to a hidden `<textarea>` + `document.execCommand('copy')`;
if that also fails, the button still shows the value as selectable text.

## Theme handling

The sheet is styled entirely with `--vc-*` tokens, so it re-themes when
the page's DESIGN.md hot-swaps. The header's Theme button calls
`window.__veDesignMd.toggleTheme()` (or, standalone, re-resolves +
re-applies via the engine) — the whole sheet flips.

## No nested scrollbars

Every panel's content WRAPS or extends the page. The color grid wraps;
the code sample is a `<pre>` with `overflow:visible`; no panel has
`max-height + overflow:auto`. Wide content extends the document's single
scroll axis — never an inner scroller.

## Self-contained output

The emitted contact-sheet HTML embeds the DESIGN.md as
`<script type="text/design-md">` and colocates `amvcp-designmd.js`,
`amvcp-runtime.js`, `amvcp-tokens.js`, `amvcp-token-sheet.js`,
`amvcp-tokens.css`. Zero CDN, zero web font unless the DESIGN.md's font
stack names one. One file, opens offline.
