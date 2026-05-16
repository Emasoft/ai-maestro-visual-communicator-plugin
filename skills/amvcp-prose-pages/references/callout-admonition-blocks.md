# Callout / admonition blocks (`vc-callout`)

The five callout variants exposed by `amvcp-report-doc.js`:
`tip` / `warning` / `info` / `note` / `danger`. Each is a single
`<aside>` block with a left-border accent, a geometric Unicode glyph,
a bolded title, and one or more body paragraphs. Colors are read from
`--vc-color-*` roles via a single `--vc-callout-accent` CSS variable;
light + dark themes mirror automatically because the engine swaps the
role values.

Callouts are the most-used prose primitive after the paragraph and the
heading. The reference HTML corpus uses one or two per document; the
admonition style was popularized by Material for MkDocs and adopted by
GitBook, Docusaurus, and most static-site generators since.

## When to use which variant

| Variant | When | Role consumed | Glyph |
|---|---|---|---|
| `tip` | An optional improvement the reader could make | `--vc-color-success` | ▸ (BLACK RIGHT-POINTING SMALL TRIANGLE) |
| `warning` | The reader could hurt themselves; non-fatal | `--vc-color-warning` | ▲ (BLACK UP-POINTING TRIANGLE) |
| `info` | Background context the reader may not have | `--vc-color-info` | ⓘ (CIRCLED LATIN SMALL LETTER I) |
| `note` | Author commentary / aside / "by the way" | `--vc-color-accent` | ✎ (LOWER RIGHT PENCIL) |
| `danger` | Data loss / security / breaking change risk | `--vc-color-danger` | ■ (BLACK SQUARE) |

Glyphs are neutral geometric Unicode chosen deliberately: no SVG, no
icon font, no emoji (emoji are AI-slop-adjacent and fail the anti-slop
pass).

## Scaffold (canonical)

```html
<aside class="vc-callout vc-callout--warning">
  <div class="vc-callout-glyph" aria-hidden="true"></div>
  <div class="vc-callout-body">
    <p class="vc-callout-title">Token rename in progress</p>
    <p><code>--vc-color-brand</code> is renamed to
       <code>--vc-color-accent</code> in v2026.Q3 — update consumers
       before the cutover.</p>
  </div>
</aside>
```

Notes on the markup contract:

- `<aside>`, not `<div>` — the semantic-HTML gate (Gate 5) cares.
- `aria-hidden="true"` on the glyph — the glyph is decorative;
  screen-readers don't need to announce "black square".
- `<p class="vc-callout-title">` before the body — title is **optional**
  but recommended; if omitted, the body starts immediately.
- Multiple `<p>` inside `.vc-callout-body` are supported and styled
  with proper margins (the injected CSS handles first/last child).

## CSS (already injected by the runtime)

The CSS lives in `amvcp-report-doc.js`'s `CSS_LINES` and is auto-
injected on `DOMContentLoaded`. The relevant rules:

```css
.vc-callout {
  display: flex;
  gap: var(--vc-space-3, 12px);
  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);
  margin-block: var(--vc-space-5, 32px);
  border-inline-start: 3px solid var(--vc-callout-accent);
  border-radius: 0 var(--vc-radius-md, 8px) var(--vc-radius-md, 8px) 0;
  background: color-mix(in srgb, var(--vc-callout-accent) 8%, transparent);
}
.vc-callout-glyph {
  color: var(--vc-callout-accent);
  font-weight: var(--vc-weight-bold, 700);
  flex: none;
}
.vc-callout-title {
  font-weight: var(--vc-weight-bold, 700);
  margin: 0 0 var(--vc-space-1, 4px);
}
.vc-callout-body > p:first-child { margin-block-start: 0; }
.vc-callout-body > p:last-child  { margin-block-end: 0; }

/* Variant -> which --vc-color-* role drives the accent */
.vc-callout--tip     { --vc-callout-accent: var(--vc-color-success, #3a6b5c); }
.vc-callout--warning { --vc-callout-accent: var(--vc-color-warning, #a8791f); }
.vc-callout--info    { --vc-callout-accent: var(--vc-color-info,    #3464a8); }
.vc-callout--note    { --vc-callout-accent: var(--vc-color-accent,  #b8861f); }
.vc-callout--danger  { --vc-callout-accent: var(--vc-color-danger,  #a84a32); }

/* Glyphs are CSS ::before content — no inline SVG, no icon font, no emoji */
.vc-callout--tip     .vc-callout-glyph::before { content: "\25B8"; }  /* ▸ */
.vc-callout--warning .vc-callout-glyph::before { content: "\25B2"; }  /* ▲ */
.vc-callout--info    .vc-callout-glyph::before { content: "\24D8"; }  /* ⓘ */
.vc-callout--note    .vc-callout-glyph::before { content: "\270E"; }  /* ✎ */
.vc-callout--danger  .vc-callout-glyph::before { content: "\25A0"; }  /* ■ */
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-success` | tip variant accent |
| `--vc-color-warning` | warning variant accent |
| `--vc-color-info` | info variant accent |
| `--vc-color-accent` | note variant accent |
| `--vc-color-danger` | danger variant accent |
| `--vc-space-1` / `--vc-space-3` / `--vc-space-4` / `--vc-space-5` | gap, padding, margin |
| `--vc-radius-md` | corner radius (only on the trailing edge) |
| `--vc-weight-bold` | glyph + title weight |

The single derived var `--vc-callout-accent` drives both the border
color AND the tinted background (via `color-mix(8%)`). Swapping a
theme swaps the underlying role value; the callout re-renders
automatically without any per-theme rule.

## Special variants (extensions beyond the 5 builtins)

| Variant | Defined by | When |
|---|---|---|
| `star` | `feature-explainer-shape` (one-off) | The ONE thing in a feature explainer the reader must not miss |
| `cite` / `attribution` | Author-defined | Quote attribution block at the end of a pull-quote |
| `quote` | Author-defined | Inline block-quote with custom glyph |

To extend, define a new variant in your own CSS:

```css
.vc-callout--star {
  --vc-callout-accent: var(--vc-color-accent, #b8861f);
}
.vc-callout--star .vc-callout-glyph::before { content: "\2605"; }  /* ★ */
```

Do not invent variants that overlap with the 5 builtins (no
`success` / `alert` / `error` / `caution` — they are aliases of
the existing variants and dilute the contract).

## Composition with other skills

Callouts can EMBED content from other skills — code, tables, figures
all work inside `.vc-callout-body`. Common patterns:

| Embedded skill | Use inside callout? | Notes |
|---|---|---|
| `amvcp-code-highlight` | Yes | A 1-2 line code snippet showing the fix |
| `amvcp-tables` | Sparingly | A small 2-3 row table is fine; large tables belong outside callouts |
| `amvcp-charts-and-dashboards` | No | Charts deserve their own figure block |
| `amvcp-graph-diagrams` | No | Same |
| `amvcp-interactive-controls` | Yes | A single checkbox or button is fine; complex controls belong outside |
| `amvcp-prose-pages` paragraphs | Yes | Multiple `<p>` are styled correctly |

## Selection / comment notes

- A callout is selectable as a unit (`{type:"callout",
  variant:"warning"}`) so a reviewer can comment "this warning
  doesn't apply" without highlighting the text.
- The callout title is selectable independently — useful for "rename
  this" comments.
- Body paragraphs inside the callout are selectable via the normal
  `data-ve-prose` paragraph numbering.

## Decision-mini hook

Notes and danger callouts frequently host a decision-mini:

```html
<aside class="vc-callout vc-callout--note">
  <div class="vc-callout-glyph" aria-hidden="true"></div>
  <div class="vc-callout-body">
    <p class="vc-callout-title">Deprecation timeline</p>
    <p>Legacy endpoint sunsets 2026-08-01. Should we shorten the window?</p>
    <div class="ve-decision" data-decision-id="deprecation-window">
      <button data-choice="keep">Keep Aug 1</button>
      <button data-choice="shorten">Shorten to Jul 1</button>
      <button data-choice="extend">Extend to Sep 1</button>
    </div>
  </div>
</aside>
```

## QA notes

- Gate 2 (`wcag-contrast`) checks the callout glyph color against
  the callout background. The 8% color-mix background keeps the
  contrast >4.5:1 against a `--vc-color-accent` foreground in both
  light and dark themes — but new variants with custom accents
  must be checked.
- Gate 7 (`banned-font`) does NOT scan callouts specifically; they
  inherit the body font.

## Anti-patterns

- **Using emoji glyphs (`✅` `⚠️` `❌` `💡`)** — they trigger the
  anti-slop pass and break in plaintext. The geometric Unicode
  glyphs survive everywhere.
- **Custom border colors that don't read from `--vc-color-*`** —
  breaks theme swap; the callout becomes the only un-themable thing
  on the page.
- **More than 3 callouts in a row** — the page becomes a wall of
  highlighted boxes and nothing stands out. If you have many,
  consolidate into a single block or convert to a bulleted list.
- **Callouts inside other callouts** — visually busy and semantically
  wrong; an aside-inside-aside has no clean reading order.
- **A callout title that is a question** — callouts are statements;
  questions belong in `<dl>` FAQ blocks or open-question lists.
- **`<aside>` without a variant class** — the runtime treats
  variant-less callouts as `info` by default, but defaulting hides
  intent. Always pick one of the 5.
- **A callout with no body** — a title-only callout is decoration;
  if the title is enough, use a heading.
- **Banned-list violations inside the callout body** — Gate 6
  (`banned-color`) and Gate 7 (`banned-font`) scan the whole page,
  including callouts; an inline `style="color: #8B5CF6"` in a
  callout fails the same as anywhere else.
