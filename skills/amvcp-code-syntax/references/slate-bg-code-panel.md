# Sub-technique B3 — The slate-bg dark code panel (PR / postmortem / explainer canonical container)

## Table of Contents

- [B3.1 What it is](#b31-what-it-is)
- [B3.2 The visual](#b32-the-visual)
- [B3.3 The markup](#b33-the-markup)
- [B3.4 The CSS (page-stylesheet, NOT runtime)](#b34-the-css-page-stylesheet-not-runtime)
- [B3.5 The 12-token palette over slate](#b35-the-12-token-palette-over-slate)
- [B3.6 The selection visual over slate](#b36-the-selection-visual-over-slate)
- [B3.7 The diff variant](#b37-the-diff-variant)
- [B3.8 The file-path label variant](#b38-the-file-path-label-variant)
- [B3.9 When to use](#b39-when-to-use)
- [B3.10 Tokens consumed](#b310-tokens-consumed)
- [B3.11 Author rules](#b311-author-rules)

The canonical dark-on-dark code container used by every PR review,
postmortem, and architecture explainer in the AMVCP visual library.
Mined from the html-effectiveness extended catalog (`12-incident-
report`, `03-code-review-pr`, `04-code-understanding`, `17-pr-writeup`,
`16-implementation-plan`).

The pattern: `background: slate; color: #E8E6DC; border-radius: 12px;
padding: 18-20px`. Implemented as a `data-ve-code-panel="slate"`
attribute on a `.ve-code-block` wrapper, or as a class composition.

## B3.1 What it is

A code block visually presented as a "panel" — dark background, ivory
text, 12px rounded corners, generous internal padding. This is THE
container shape PR reviews and postmortems use for diff blocks and
critical code excerpts. It's distinct from the default code-block
visual (transparent interior, host-bg shows through) and from blueprint
(parchment + grid).

Mined catalog quote: *"`background: slate; color: #E8E6DC; border-
radius:12px; padding:18-20px; overflow-x:auto`. The standard code
container."* — except we drop the `overflow-x: auto` (no-nested-
scrollbars) and keep everything else.

## B3.2 The visual

| Property | Value | Token source |
|---|---|---|
| Background | dark slate (`#141413` on light-theme, deeper on dark-theme) | `--ve-slate-panel` (alias to `--vc-color-neutral-90` when present) |
| Text color | warm ivory (`#E8E6DC`) | `--ve-control-fg-on-slate` |
| Border radius | 12px (matches the project's standard panel radius) | `--vc-radius-md` |
| Padding | 18px on small screens, 20px on wide | `--vc-space-3` / `--vc-space-4` |
| Border | none (the slate bg + radius is the container) | — |
| Shadow | optional 1px-soft 8% black on light page bgs (lifts the panel) | `--ve-shadow-1` |

## B3.3 The markup

```html
<div class="ve-code-block ve-code-panel-slate">
  <pre><code class="language-typescript">…source…</code></pre>
</div>
```

OR via data-attribute:

```html
<div class="ve-code-block" data-ve-code-panel="slate">
  <pre><code class="language-typescript">…source…</code></pre>
</div>
```

Both forms are equivalent — pick one per project for consistency. The
data-attribute form is more discoverable when the runtime is doing the
attribute-driven theming (consistent with `data-ve-table`, `data-ve-
diagram`, etc.).

## B3.4 The CSS (page-stylesheet, NOT runtime)

This is a **page-skill** convention, not a runtime baseline. The
runtime doesn't ship slate-panel CSS by default. Pages that need it
add this snippet (or it's added by a parent composition skill like
`pr-review-page`):

```css
.ve-code-block.ve-code-panel-slate > pre,
.ve-code-block[data-ve-code-panel="slate"] > pre {
  background-color: var(--ve-slate-panel, #141413);
  color: var(--ve-control-fg-on-slate, #E8E6DC);
  border: none;
  border-radius: var(--vc-radius-md, 12px);
  padding: var(--vc-space-3, 18px);
}
@media (min-width: 720px) {
  .ve-code-block.ve-code-panel-slate > pre,
  .ve-code-block[data-ve-code-panel="slate"] > pre {
    padding: var(--vc-space-4, 20px);
  }
}
```

Light-theme mirror (mandatory):

```css
:root[data-ve-theme="light"] {
  --ve-slate-panel: #141413;          /* the slate stays slate even in light theme */
  --ve-control-fg-on-slate: #E8E6DC;  /* ivory text stays ivory */
}
```

The slate panel is intentionally a DARK ISLAND on a LIGHT page (in
light theme) — it reads as "this is the code, distinct from the prose
around it". This is correct behaviour; the light-theme verification
checklist for slate-panel asks "does it read as a dark code island, not
as a hole in the page?".

## B3.5 The 12-token palette over slate

Every `--ve-code-*` token MUST be tuned to read on slate. The default
dark-theme palette already does (the colours were calibrated for a
dark interior). On light-theme, where the wider page is bright but the
slate panel is dark, the slate-panel selector should FORCE the dark-
theme palette inside:

```css
.ve-code-block.ve-code-panel-slate,
.ve-code-block[data-ve-code-panel="slate"] {
  --ve-code-keyword:  #c98ec0;
  --ve-code-string:   #9ece9e;
  /* … all 12 roles forced to dark-theme values … */
}
```

This is the "force a sub-tree to a specific theme" pattern, applied
specifically because the slate panel is theme-island.

## B3.6 The selection visual over slate

The per-line `[data-ve-pressed="1"]` tint reads correctly on slate
(the accent gold mixed at 28% over slate is a warm-amber row tint).
The 3-state hover/select model's outlines still apply — accent-on-
slate is high-contrast and reads well.

The yield rule still applies — every `.ve-tok-*` inside a selected
line inherits `color: #E8E6DC` (the slate panel's text colour),
keeping the line readable.

## B3.7 The diff variant

A slate panel with diff lines:

```html
<div class="ve-code-block ve-code-panel-slate">
  <pre><code class="language-diff">…</code></pre>
</div>
```

The diff tints (`--ve-code-diff-add-bg` / `--ve-code-diff-del-bg`)
are `color-mix(... var(--vc-color-success/danger), 22%, transparent)`
— so on slate they render as olive-green-tinted (add) and rust-red-
tinted (del) row bands.

The result: a GitHub-style dark-mode diff panel that re-themes with
DESIGN.md. Authors using slate-panel get this for free.

## B3.8 The file-path label variant

PR reviews often pair a slate panel with a file-path header:

```html
<div class="ve-code-block ve-code-panel-slate">
  <div class="ve-code-path">
    <span class="ve-code-path__icon">📄</span>
    <span class="ve-code-path__name">infra/config/workers.yaml</span>
  </div>
  <pre><code class="language-yaml">…</code></pre>
</div>
```

The path label is a mono-font line above the code with a gray-500 colour
— see [code-block-with-file-path.md](./code-block-with-file-path.md).

The slate-panel CSS extends to include the path:

```css
.ve-code-block.ve-code-panel-slate > .ve-code-path {
  background-color: var(--ve-slate-panel, #141413);
  color: var(--ve-control-fg-on-slate-meta, #87867F);
  border-radius: var(--vc-radius-md, 12px) var(--vc-radius-md, 12px) 0 0;
  padding: 10px 18px 6px;
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
}
.ve-code-block.ve-code-panel-slate > .ve-code-path + pre {
  border-radius: 0 0 var(--vc-radius-md, 12px) var(--vc-radius-md, 12px);
  padding-top: 12px;       /* the path label already provides top space */
}
```

The path + pre share corners (the path's bottom-radius is 0, the pre's
top-radius is 0), so they read as one rounded panel.

## B3.9 When to use

| Use slate-panel when… | Use the default code-block when… |
|---|---|
| The page is a PR review, postmortem, or architecture explainer | The page is a tutorial / guide / casual doc |
| The code is "the thing being analysed" (load-bearing) | The code is illustrative (read-once) |
| The page has multiple distinct code blocks that need visual hierarchy ("this is the actual diff", "this is a quoted example") | The page has one or two code blocks inline with prose |
| The dark visual identity matches the page's reader role (incident-respondent, code-reviewer) | The light/parchment visual identity matches the page (casual reading) |

A page should pick ONE of {default, blueprint, slate-panel} per code-
block role, not mix arbitrarily.

## B3.10 Tokens consumed

- `--ve-slate-panel` — the slate bg (default `#141413`)
- `--ve-control-fg-on-slate` — the ivory text colour (default `#E8E6DC`)
- `--ve-control-fg-on-slate-meta` — the gray-500 for path labels
- `--vc-radius-md` — 12px panel radius
- `--vc-space-3` / `--vc-space-4` — padding
- `--vc-font-mono` — for the file-path label
- `--vc-text-small` — for the file-path label

## B3.11 Author rules

| Rule | Why |
|---|---|
| Add `ve-code-panel-slate` to the WRAPPER, not the inner `<pre>` | The runtime's `initCodeGutter` re-parents the `<pre>` into the wrapper; the class on the wrapper survives |
| Force the dark token palette inside slate panels (see §B3.5) | On light theme, otherwise the palette would mismatch the slate interior |
| Don't use slate-panel for inline-prose code chips | Use `<code class="inline">` — see [inline-code-chip.md](./inline-code-chip.md) |
| Don't override the slate colour per-block — use the token | Token = re-themable; per-block = drift |
| Pair with file-path label for PR / postmortem use | Establishes provenance; the path IS the reader's anchor |
