# Variant cell rendering

## Table of Contents

- [What it does](#what-it-does)
- [The built-in treatments](#the-built-in-treatments)
- [Why fixed sample content](#why-fixed-sample-content)
- [Custom treatments](#custom-treatments)
- [The click-to-copy snippet](#the-click-to-copy-snippet)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment contract](#selection--comment-contract)
- [Visual verification](#visual-verification)

One cell renders ONE component instance drawn with ONE variant's
treatment. The cell is a runtime selection atom; the only affordance this
module wires on the cell is the click-to-copy snippet button.

## What it does

`buildCell(component, variant, opts)`:

1. creates the atom `<div class="vc-cvm-cell" data-ve-id="…"
   data-ve-type="component-variant" data-ve-label="…">`;
2. adds a head row with the variant-label pill and (if `variant.snippet`)
   the `copy` button;
3. renders a component instance via `renderComponentInstance`, applying
   the resolved treatment as inline style off `--vc-*` tokens;
4. adds the "best for" note line if `variant.note` is set.

## The built-in treatments

Mined as GRAPHIC-STYLE ideas from the source example
(`06-component-variants.html`) — six structural treatments, each
expressed PURELY as `--vc-*` token references (NONE carry a literal
color, so a theme swap re-skins them):

| `kind` | Treatment |
|---|---|
| `flat` | `surface` background, no border, no shadow |
| `outlined` | `surface` background, `1px solid border`, no shadow |
| `elevated` | `surface-raised` background, `--vc-shadow-2` |
| `accent` | outlined + a top accent stripe (`--vc-color-accent`) |
| `inset` | `surface-sunken` background, no border |
| `danger` | outlined with `--vc-color-danger` border + danger stripe |

A variant names a treatment via `kind` (or `treatment` as a string). An
unknown name falls back to `outlined`.

## Why fixed sample content

Every instance draws the SAME sample body — an avatar, a title, a
subtitle, two meta chips (the last accent-tinted), and a ghost button.
The point of a variant matrix is to compare **treatments**, so the
content is held constant and only the treatment varies. Holding content
fixed is what lets the eye see the structural difference between, say,
`flat` and `elevated` at a glance. Override the body per cell with
`variant.sample` (`title` / `subtitle` / `initials` / `chips` / `action`)
or globally with `opts.sample`.

## Custom treatments

Pass a `treatment` OBJECT to extend or override a named base:

```js
{ key:"brand", label:"Brand", kind:"elevated",
  treatment: { stripe: "var(--vc-color-info)", layout: "row" },
  axisValues: { state:"default" }, snippet:"<Card layout=\"row\" />" }
```

Recognised keys: `background`, `border`, `boxShadow` (all token
references), `stripe` (a top accent bar color), `layout: "row"` (a
horizontal/compact card). Anything you pass is merged over the named base,
so `kind:"elevated"` + `{ stripe: … }` gives an elevated card WITH a
stripe.

## The click-to-copy snippet

The `copy` button carries `data-vc-copy="<snippet>"`. One delegated click
listener on the matrix root copies the value via
`navigator.clipboard.writeText` and flashes a "copied" tooltip
(`[data-vc-copied]::after`). This is the EXPORT facet: it turns a cell
back into source the agent can read/commit.

Copying is a CONVENIENCE, not a data contract, so it is the ONE
deliberate fail-soft path: a missing `navigator.clipboard` falls back to
a hidden `<textarea>` + `document.execCommand('copy')`; if that also
fails, the snippet stays readable. A PLAIN click is NOT a copy — it is
left to the runtime's selection handler (Alt/Option- or Meta-click
copies). See `selection-and-comment.md`.

## DESIGN.md tokens used

- reads: `--vc-color-surface`, `--vc-color-surface-raised`,
  `--vc-color-surface-sunken`, `--vc-color-canvas`, `--vc-color-border`,
  `--vc-color-content`, `--vc-color-content-muted`,
  `--vc-color-content-subtle`, `--vc-color-accent`, `--vc-color-danger`,
  `--vc-shadow-2`, `--vc-radius-sm/md/lg/full`, `--vc-space-1..5`,
  `--vc-text-0..5`, `--vc-font-body/heading/mono`,
  `--vc-weight-medium/bold`, `--vc-duration-fast`, `--vc-z-tooltip`
- writes: NOTHING (it only renders existing tokens)

## Selection / comment contract

The cell is the atom; the runtime owns its selection. This module injects
NO selection / hover / highlight CSS — verify by inspecting `#vc-cvm-style`
(it must contain no `data-ve-selected`, `:hover`, `ve-comment-handle`,
`brightness(` rules). The runtime's injected CSS styles
`[data-ve-id][data-ve-selected="1"]` and `[data-ve-id]:hover` uniformly
across every element type, so the cells get the same triple-state
treatment as a chart point or a table row.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the matrix under
`dev-browser` in BOTH themes (R1). Verify:

1. each cell shows the right structural treatment (flat is borderless,
   elevated has a shadow, accent/danger have a top stripe);
2. an accent stripe's `::before` background equals the resolved
   `--vc-color-accent` (token-driven, not hardcoded);
3. Alt-clicking the `copy` button fires the copy flash (watch for the
   `[data-vc-copied]` attribute appearing for ~1 second);
4. a plain click selects the cell (the runtime adds
   `data-ve-selected="1"` and the comment handle appears).
