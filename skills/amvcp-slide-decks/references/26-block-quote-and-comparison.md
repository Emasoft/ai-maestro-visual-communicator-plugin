# 26 — Blocks: `quote` + `comparison` (the contrast family)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [When to pick comparison vs two bullets blocks](#when-to-pick-comparison-vs-two-bullets-blocks)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

`quote` is the blockquote block — quoted text + optional attribution.
`comparison` is the two-pane side-by-side block — a left pane + a
right pane, each with a title and a list of items, used for then/now
or option-A/option-B contrast.

Together they're the "contrast / attribution" family. Quote attributes
a line to a source; comparison contrasts two positions; both make
their argument by juxtaposition.

## What this is

### `quote` block

```jsonc
{ "type": "quote",
  "text": "Caching the right keys beats caching more keys.",
  "cite": "Internal Slack, May 6 2026" }
```

Required: `text` (string).
Optional: `cite` (string).

Renders as:
```html
<blockquote class="vsd-quote">
  Caching the right keys beats caching more keys.
  <cite class="vsd-quote-cite">Internal Slack, May 6 2026</cite>
</blockquote>
```

The quote text dominates (italic serif, large); the cite is a small
mono caps line below. A decorative ghost quotation mark paints behind
the text as a `::before` pseudo-element.

### `comparison` block

```jsonc
{ "type": "comparison",
  "left":  { "title": "Q2",  "items": ["p99 = 540 ms", "Hit rate 41%"] },
  "right": { "title": "Q3",  "items": ["p99 = 335 ms", "Hit rate 78%"] } }
```

Required: `left` (object with `title` + `items`), `right` (same shape).

Each pane's `items` array follows the same shape as `bullets.items` —
plain strings OR `{text, sub}` objects.

Renders as:
```html
<div class="vsd-comparison">
  <div class="vsd-compare-pane">
    <h3 class="vsd-compare-title">Q2</h3>
    <ul class="vsd-bullets">
      <li class="vsd-bullet">p99 = 540 ms</li>
      <li class="vsd-bullet">Hit rate 41%</li>
    </ul>
  </div>
  <div class="vsd-compare-pane">
    <h3 class="vsd-compare-title">Q3</h3>
    <ul class="vsd-bullets">
      <li class="vsd-bullet">p99 = 335 ms</li>
      <li class="vsd-bullet">Hit rate 78%</li>
    </ul>
  </div>
</div>
```

## Scaffold to emit

### Quote examples

Quote with attribution:

```jsonc
{ "type": "quote",
  "text": "The best code is the code you don't have to write.",
  "cite": "Jamie Zawinski" }
```

Quote without attribution (rare):

```jsonc
{ "type": "quote",
  "text": "Caching the right keys beats caching more keys." }
```

Internal quote (verbatim):

```jsonc
{ "type": "quote",
  "text": "After the cache rewrite, our checkout page went from a 2-second wait to instant.",
  "cite": "L.M., Enterprise customer (verbatim)" }
```

### Comparison examples

Then vs Now:

```jsonc
{ "type": "comparison",
  "left": {
    "title": "Q2 (before)",
    "items": [
      "p99 = 540 ms",
      "Cache hit rate 41%",
      "Cold-start latency 1.2 s",
      "Eviction: LRU"
    ]
  },
  "right": {
    "title": "Q3 (after)",
    "items": [
      "p99 = 335 ms",
      "Cache hit rate 78%",
      "Cold-start latency 280 ms",
      "Eviction: SWR + per-key TTL"
    ]
  } }
```

Pro / Con with sub-text:

```jsonc
{ "type": "comparison",
  "left": {
    "title": "Option A — full rewrite",
    "items": [
      { "text": "+ Cleanest design",      "sub": "Removes legacy hot-paths" },
      { "text": "+ Best observability",   "sub": "OTel from day 1" },
      { "text": "− 4 weeks",              "sub": "Two engineers full-time" },
      { "text": "− High blast radius",    "sub": "Touches every request" }
    ]
  },
  "right": {
    "title": "Option B — per-key TTL",
    "items": [
      { "text": "+ Ships in 3 days",      "sub": "One engineer" },
      { "text": "+ Reversible",           "sub": "Behind a flag" },
      { "text": "− Doesn't fix eviction", "sub": "Issue #4218 open" },
      { "text": "− More config knobs",    "sub": "More to forget" }
    ]
  } }
```

## Lib functions called

- `renderBlock(doc, block, ctx)` — dispatches.
- For `quote`: builds `<blockquote class="vsd-quote">` with text +
  optional `<cite class="vsd-quote-cite">` child.
- For `comparison`: builds `<div class="vsd-comparison">` with two
  `.vsd-compare-pane` children built via `renderComparisonPane()`.
- `renderComparisonPane(doc, pane)` — internal; builds one pane
  (title + bullet list).
- `renderBulletItem(doc, item)` — reused for each item in a pane.

## DESIGN.md tokens used

### `quote`

| Token | Default |
|---|---|
| `--vc-font-quote` | `Georgia, serif` (italic) |
| `--vc-font-mono` | `ui-monospace, monospace` (cite) |
| `--vc-text-quote` | `48 px` |
| `--vc-text-1` | `20 px` (cite) |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` (cite) |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` (ghost quote mark) |
| `--vc-line-height-quote` | `1.35` |
| `--vc-space-7` | `64 px` (block padding) |

### `comparison`

| Token | Default |
|---|---|
| `--vc-color-content` | `#1f1a14` / `#e8eaef` |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` (titles) |
| `--vc-color-divider` | `#e1ddd1` / `#2a2e35` (inter-pane line) |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` (bullet markers) |
| `--vc-font-heading` | `Georgia, serif` (titles) |
| `--vc-text-3` | `40 px` (item text) |
| `--vc-text-2` | `28 px` (titles + sub-items) |
| `--vc-space-5` | `32 px` (inter-pane gap) |

## Selection / comment / decision-mini contract notes

Neither block carries its own `data-ve-id`. They're part of the
slide's selectable atom. The two panes of a `comparison` block also
don't have separate atoms — comments target the whole slide.

## When to use this reference

Open this ref when:

- Authoring a `quote` slide (one quote dominating the stage) or a
  small quote embedded in a `content` slide.
- Authoring a `comparison` slide (the comparison block is the
  layout's primary content).
- Picking between `comparison` and two `bullets` blocks — see the
  decision table below.

## When to pick comparison vs two bullets blocks

| Need | Pick |
|---|---|
| Side-by-side contrast (then/now, A/B) | `comparison` |
| Two unrelated bullet lists on one slide | Two `bullets` blocks (probably in `two-column` layout) |
| One bullet list + visual aside | One `bullets` block + an `image` / `chart` (in `two-column`) |
| Pro/Con table | `comparison` with `+` / `−` prefixes in item text |
| Two halves with NO parallel structure | Two separate slides |

## Don'ts

- Don't put markdown in `quote.text` or `quote.cite`. The renderer
  escapes; markdown shows as literal.
- Don't use a quote for an unattributed line. A quote without a
  cite reads as "the author of the deck claims this", which is just
  a `statement`. Either attribute it or rewrite as a statement.
- Don't make the comparison panes lopsided. The eye expects items
  at the same vertical position to correspond. 3 items on the left
  vs 6 on the right breaks the contrast.
- Don't use comparison for unrelated lists. The "side-by-side"
  visual model implies opposition; non-opposing content reads
  confused.
- Don't put more than 5 items per pane. The vertical reading at
  projection scale fails past 5; the density guard fires at 6.

## Visual verification

After authoring quote / comparison blocks, capture light + dark at
1280×720 via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`:

1. Quote text is in italic serif at ~48 px; cite is in small caps
   mono at ~20 px.
2. Ghost quote mark is barely visible behind the quote (opacity
   ~0.08).
3. Comparison panes split the stage 50/50 with a vertical divider
   between them.
4. Comparison pane items at the same row index are visually
   parallel (the contrast READS at a glance).
5. On a 480×800 viewport (`fit: responsive`), comparison panes
   stack vertically.

## Source provenance

- The quote block CSS (italic serif, ghost quote mark, small-caps
  cite) is the canonical quote pattern from `slide-patterns.md`
  lines 968-1017.
- The comparison block's two-pane structure with vertical divider
  is the converged "Versus" / "Before vs After" pattern from SL-10
  and SL-04.
- The `+` / `−` item prefix convention for Pro/Con comparisons is
  the "decision card" pattern documented in the slide-deck spec
  (SL-13's editorial moves).
