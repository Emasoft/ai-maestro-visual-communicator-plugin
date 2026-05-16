# Pull quotes and blockquotes — the larger-than-body emphasised text block

A *blockquote* (`<blockquote>`) is body content that is *quoted from
elsewhere*. A *pull quote* is body content from *this* document
pulled out and emphasised for visual scanning. Both render larger
than body, slightly looser leading, with a visual cue (a colour
accent bar, an opening glyph, or an italic tone) marking them as set
apart.

This reference describes the `<blockquote>` element-level default and
the `.vc-pullquote` utility class — two distinct shapes with shared
typography roots.

## What it is

**Blockquote** (`<blockquote>`):
- Semantic HTML element with native screen-reader announcement
  ("blockquote start" / "blockquote end").
- Used for quoting external sources, conference talks, papers,
  documentation, customer feedback.
- Should include a `<cite>` child for attribution.

**Pull quote** (`.vc-pullquote`):
- A `<p>` or `<aside>` with the modifier class.
- Used for emphasised excerpts of *this* document — selected lines
  the reader should not skip past.
- No attribution (the quote is from the surrounding text).

The two shapes share the same typography contract — large size, body
face, looser leading — but differ in their *framing* (blockquote has
a left bar + cite; pull quote has a top + bottom rule + larger size
+ optional italic).

## The contract

`amvcp-typography.css`:

```css
/* Blockquote — element-level default. */
blockquote {
  font-size: var(--vc-text-3);                /* lead-paragraph size */
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  font-family: var(--vc-font-body, inherit);
  line-height: 1.60;                          /* lead-paragraph leading */
  /* Left accent bar — uses the engine's accent token, fail-soft to
     currentColor. */
  border-left: 4px solid var(--vc-color-accent, currentColor);
  padding: 0 0 0 1em;
  margin: 1.5em 0;
  /* Subtle italic — convention for quoted text. */
  font-style: italic;
}

/* The <cite> attribution at the bottom of a blockquote. */
blockquote cite {
  display: block;
  margin-top: 0.5em;
  font-size: var(--vc-text-1);
  font-style: normal;                          /* override the blockquote italic */
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
}

/* Pull quote — distinct from blockquote. */
.vc-pullquote {
  font-size: var(--vc-text-4);                /* one step larger than lead */
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  font-family: var(--vc-font-heading, inherit);  /* heading face — visual register shift */
  line-height: 1.35;                          /* tighter than body — display-band */
  letter-spacing: -0.01em;                    /* mild negative tracking */
  /* Top and bottom hairlines instead of a left bar. */
  border-top: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  border-bottom: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  padding: 1em 0;
  margin: 2em 0;
  /* Center the pull quote — editorial convention. */
  text-align: center;
}
```

## Scaffold

### Blockquote with attribution

```html
<blockquote>
  <p>The first step in solving any problem is recognizing there is one.</p>
  <cite>— Will McAvoy, The Newsroom</cite>
</blockquote>
```

The `<p>` inside the `<blockquote>` is the body of the quote; the
`<cite>` is the attribution.

### Pull quote inline

```html
<p>The runtime processes 47 million tokens per day, sustained, with
   a 99.97% latency SLO …</p>

<p class="vc-pullquote">99.97% latency SLO at 47M tokens/day, sustained.</p>

<p>… and that throughput is achieved on commodity hardware, not on a
   bespoke cluster …</p>
```

The pull quote sits between body paragraphs; the body flow continues
naturally around it (top/bottom margin handles spacing).

### Pull quote as `<aside>`

```html
<aside class="vc-pullquote">
  We do not optimise for the median request — we optimise for the
  99th percentile.
</aside>
```

`<aside>` is the semantic alternative to a class on `<p>` — both
render identically. `<aside>` is preferable when the pull quote is
*tangential* to the surrounding prose (a sidebar callout); `<p
class="vc-pullquote">` is preferable when the pull quote is *from*
the surrounding prose (a lifted excerpt).

## Tokens consumed / extended

- **Consumes:** `--vc-text-3`, `--vc-text-4`, `--vc-text-1`,
  `--vc-weight-body`, `--vc-weight-label`, `--vc-font-body`,
  `--vc-font-heading`, `--vc-color-accent`.
- **Extends:** nothing.

## Why blockquote uses the body face but pull quote uses the heading face

A *blockquote* belongs to the prose flow — it is body content that
happens to be quoted. Reading should not visually jolt. The body face
preserves the reading register.

A *pull quote* is a *display element* — its job is to interrupt the
flow and pull the eye. The heading face produces the visual jolt
that announces "this is important; don't skip past".

The blockquote's italic adds a subtle register shift (quoted vs
narrative); the pull quote's font swap is the major register shift.

## The cite attribution — `<cite>` styling

`<cite>` inside a `<blockquote>` is the attribution line. The
contract:

- `display: block` — forces the cite onto its own line below the
  quote body.
- `margin-top: 0.5em` — small vertical separation.
- `font-size: var(--vc-text-1)` — small, secondary.
- `font-style: normal` — overrides the inherited italic so the cite
  reads as label, not as continued quote.
- `font-weight: var(--vc-weight-label, …)` — slightly heavier,
  reinforcing the label role.

The agent puts the cite line as `— Author, Source` (with the em-dash
prefix). The em-dash is editorial convention; the typography contract
does not add it via CSS (no `::before { content: "— " }`) — the
author writes it in the markup, which preserves screen-reader
readability ("dash, author").

## Border colour — `var(--vc-color-accent, currentColor)`

The blockquote's left bar uses the engine's accent token, with
`currentColor` as the fail-soft. This means:

- With the engine loaded (the common case): the bar is the page's
  accent colour. Clay in the Anthropic preset, olive in another, etc.
- Without the engine: the bar is the inherited text colour (a dark
  bar in light theme, a light bar in dark theme).

Both render *some* visible bar. NEVER a broken `var()`.

## The pull quote alignment — center vs left

The contract centers the pull quote (`text-align: center`). This is
the editorial convention for *short* pull quotes (≤ 2 lines).

For *long* pull quotes (3+ lines) center-aligned text gets a ragged
right edge that reads worse than left-aligned. The agent overrides:

```html
<p class="vc-pullquote" style="text-align: left;">
  Long pull quote spanning many lines reads better left-aligned …
</p>
```

The override is per-instance — the typography skill does not ship a
`.vc-pullquote-left` modifier; the agent applies inline style or
adds a one-off page-local CSS rule.

## Light + dark — fully covered

The contract sets:

- `border-left: 4px solid var(--vc-color-accent, currentColor)` —
  themed via engine accent.
- `border-top` / `border-bottom: 1px solid color-mix(…)` — themed
  via currentColor.
- NO `color`. NO `background`.

Theme-correct in both light and dark.

## The pull quote with opening / closing quotation glyphs

Some editorial pull quotes have **large** opening / closing quotation
marks as a decorative element. The opt-in modifier:

```css
.vc-pullquote.vc-quote-marks {
  position: relative;
  padding-left: 1.5em;
  padding-right: 1.5em;
}
.vc-pullquote.vc-quote-marks::before {
  content: "“";
  position: absolute;
  top: -0.2em;
  left: 0;
  font-size: 3em;
  line-height: 1;
  font-family: var(--vc-font-heading, inherit);
  color: var(--vc-color-accent, currentColor);
  opacity: 0.6;
}
.vc-pullquote.vc-quote-marks::after {
  content: "”";
  position: absolute;
  bottom: -0.6em;
  right: 0;
  font-size: 3em;
  line-height: 1;
  font-family: var(--vc-font-heading, inherit);
  color: var(--vc-color-accent, currentColor);
  opacity: 0.6;
}
```

The 60% opacity prevents the giant quotation marks from
overwhelming the quote text. Pick `.vc-quote-marks` for the most
editorial-style pull quotes; leave it off for the cleaner hairline-
only version.

## When to use blockquote vs pull quote

| Content | Element |
|---|---|
| Quoted from a paper, talk, customer | `<blockquote>` with `<cite>` |
| Quoted from documentation | `<blockquote>` with `<cite>` |
| Pulled from THIS document | `.vc-pullquote` |
| Inline marketing-style claim | `.vc-pullquote` |
| Customer testimonial | `<blockquote>` with `<cite>` |
| Definition / glossary entry | NEITHER — use `<dl>` |
| Aside / sidebar tangent | `<aside class="vc-pullquote">` |

Reach for `<blockquote>` for *attributed* text; reach for
`.vc-pullquote` for *highlighted excerpt* text. They are semantically
distinct — screen readers announce them differently.

## When NOT to use a pull quote

- Inside a `<blockquote>` — nested emphasis is confusing.
- More than 2-3 per page — pull quotes lose their pull effect when
  used too often. Pick the strongest 2-3 excerpts.
- Inside a `<table>` — visual rendering breaks the table grid.
- Inside a `.vc-type-overline` or heading — those already have their
  own emphasis.

## Selection-contract conformance

A `<blockquote>` is a typography atom — the `markTypographyAtoms`
walker SHOULD stamp it as `data-ve-type="type-blockquote"`. This is
added to the walker's SHAPE table in the integration pass (the bare
walker doesn't include it; the atom-type extension is needed).

A `.vc-pullquote` is also a typography atom — stamped as
`data-ve-type="type-pullquote"`.

Both atoms get the decision-mini-pill; both anchor independently for
commenting.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page with one `<blockquote>` and one
   `.vc-pullquote`.
2. Confirm the blockquote has a visible left accent bar, the body
   text is italic, the cite is normal-weight non-italic below.
3. Confirm the pull quote has top and bottom hairlines, is centered,
   uses the heading face, is one size step larger than the
   blockquote.
4. Repeat for the dark theme.
5. Confirm the accent bar adopts the engine's per-theme accent
   colour (clay in light, lighter clay in dark, depending on the
   engine's theme contract).

## Cross-references

- [lead-paragraph.md](./lead-paragraph.md) — pull quotes are
  *display* siblings of leads; both interrupt the body flow.
- [tri-font-stack-anthropic.md](./tri-font-stack-anthropic.md) — the
  heading face the pull quote uses.
- [semantic-hierarchy.md](./semantic-hierarchy.md) — the size /
  weight tokens both shapes consume.
- `design-tokens` skill — owns `--vc-color-accent`; the bar /
  quotation-marks colour resolves from the engine's theme.
