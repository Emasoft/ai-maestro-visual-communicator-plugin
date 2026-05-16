# 03 — Named-gap semantics (where to use which `--la-gap*` token)

The 5 `--la-gap*` aliases (`xs`, `sm`, base, `lg`, `xl`) cover the
entire vertical and horizontal rhythm of a layout page. Picking the
wrong one is the most common layout mistake — a `--la-gap-lg` between
a heading and its first paragraph (instead of `--la-gap-sm`) makes a
report look like "huge gaps then dense text"; a `--la-gap` between
grid columns (instead of `--la-gap-lg`) makes a multi-region layout
read as "one cramped mass". The map below is the canonical
"when-to-use-which" cheat sheet, derived from how
`amvcp-layout.css` itself uses them.

## The map

| Alias | Px (default) | Use for | Avoid for |
|---|---|---|---|
| `--la-gap-xs` | 4px | TOC list items, card sub-gaps (icon ↔ label), inline chip stack | Anything wider than one row inside a card |
| `--la-gap-sm` | 8px | Header padding-block, sticky header sub-elements, KPI metric ↔ label, snippet gaps inside an inline group | Spacing between full blocks |
| `--la-gap`    | 16px | Default between stacked blocks inside a card, dashboard grid gap (the base), KPI-row sub-gap | Between full sections (use `lg`) |
| `--la-gap-lg` | 32px | Between grid columns (`.la-grid` gap), article `row-gap` between sections, between large stacked sections | Inside a card or row of small chips |
| `--la-gap-xl` | 64px | Article `padding-block` (top + bottom of a measured reading column), hero `padding-block` | As a gap between adjacent inline items |

The map above is derived from `amvcp-layout.css`:

```css
.la-grid          { gap: var(--la-gap-lg); }      /* between regions */
.la-cardrow       { gap: var(--la-gap); }         /* between cards */
.la-card          { gap: var(--la-gap-sm); padding: var(--la-gap); } /* inside a card */
.la-kpi-row       { gap: var(--la-gap); }         /* between KPI cards */
.la-toc__list     { gap: var(--la-gap-xs); }      /* between TOC items */
.la-header        { gap: var(--la-gap); padding-block: var(--la-gap-sm); padding-inline: var(--la-gutter); }
.la-article       { row-gap: var(--la-gap); padding-block: var(--la-gap-xl); }
.la-hero__content { padding: var(--la-gap-xl) var(--la-gutter); }
.la-cover         { gap: var(--la-gap); padding: var(--la-gutter); }
```

## Scaffold to emit

The map is enforced implicitly by every layout primitive. A custom
layout primitive MUST pick from the table above, not invent its own
scale. Example: a "metric strip" card row with 3 small cards plus
their captions:

```html
<div class="vc-metric-strip" data-ve-id="metric-strip" data-ve-type="region">
  <article class="la-card" data-ve-id="metric-uptime" data-ve-type="card">
    <h3 class="la-card__title">Uptime</h3>
    <div class="la-card__body"><span class="vc-metric-value">99.97%</span></div>
    <footer class="la-card__footer">30-day rolling</footer>
  </article>
  <article class="la-card" data-ve-id="metric-latency" data-ve-type="card">…</article>
  <article class="la-card" data-ve-id="metric-rps" data-ve-type="card">…</article>
</div>
```

```css
.vc-metric-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: var(--la-gap);                 /* between cards: BASE gap */
}
.vc-metric-strip > * { min-width: 0; }
.vc-metric-value {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-size: var(--vc-font-2xl, 32px);
}
```

Here every gap is a `--la-gap*` token — the card row uses the base,
the cards' internal gap is `--la-gap-sm` (inherited from `.la-card`),
and the body's gap between its lines is whatever the typography
technique declares. The strip plays cleanly with every other primitive
because every length is in the same 8px-grid family.

## Lib functions called

- None for the spacing itself.
- `markLayoutAtoms()` in `amvcp-layout.js` stamps `data-ve-id` /
  `data-ve-type` on `.la-card` etc., so the cards above become
  selectable atoms. See ref 33.

## DESIGN.md tokens used

| Alias | Engine token | Where used in the map |
|---|---|---|
| `--la-gap-xs` | `--vc-space-1` | TOC list, card sub-gap |
| `--la-gap-sm` | `--vc-space-2` | header padding-block, card internal gap |
| `--la-gap`    | `--vc-space-3` | base block gap, KPI row gap, dashboard gap |
| `--la-gap-lg` | `--vc-space-5` | grid column gap, article section gap |
| `--la-gap-xl` | `--vc-space-7` | article + hero padding-block |
| `--la-gutter` | `--vc-space-5` | article + header side padding |

## Selection / comment / decision-mini contract notes

The named-gap convention is about visual rhythm, not selection. The
selectable atoms emerge from the primitives that USE the gaps —
`.la-card` is selectable as a `card`, `.la-region` as a `region`, etc.
(see ref 33).

A comment thread attached to a card persists across a DESIGN.md
spacing-scale change because the comment is keyed by `data-ve-id`,
not by visual position. If a reviewer's comment says "the gap above
this paragraph is too tight", the fix is to bump the gap from
`--la-gap-sm` to `--la-gap` in the consuming primitive's CSS — never
to override the inherited gap with an inline pixel value, which would
silently drift out of the 8px grid.

## When the map needs to be extended

The 5 named gaps cover ~95% of layouts. The remaining 5% (an unusual
hero with `--la-gap-xl` doubled, or a tight inline chip row with
`--la-gap-xs / 2`) should be handled by:

1. Picking the closest existing alias and ACCEPTING the rounding.
   Usually the visual difference is imperceptible.
2. If (1) is impossible, extending the `spacing.scale` array in the
   DESIGN.md to add the missing slot — then add a new `--la-*` alias
   in `amvcp-layout.css`. NEVER hardcode a literal pixel value.

## Why this map matters more than the values themselves

The map's job is to standardise WHEN to use `gap-lg` instead of `gap`,
across every primitive. The actual pixel values are the DESIGN.md's
job — a denser DESIGN.md with `spacing.scale: [2, 4, 8, 12, 16, 20, 28, 40]`
produces a denser layout, but the rhythm (which gap is bigger than
which) is preserved by the named-gap map.

## Visual verification

Run the universal self-debug checklist before claiming any layout
change is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For gap-rhythm correctness specifically:

- **R1 — Light + dark themes**: spacing is theme-invariant; gaps
  must not change between `data-ve-theme="light"` and `dark`.
- **R2 — No nested scrollbars**: a gap change must not push a grid
  child past the viewport; verify `min-width: 0` is preserved.
- Open dev-browser, take screenshots at two viewport widths (1280px
  and 768px) for the same layout, and verify the named-gap rhythm
  reads correctly at both. If the layout looks cramped at narrow
  widths, the issue is usually a missing mobile-collapse rule
  (ref 12), not a gap value.
- The "rhythm-by-eye" check: open both your layout and the
  `tests/fixtures/layout-runtime.html` reference page side-by-side
  in dev-browser. If the rhythm reads differently, you almost
  certainly have a hardcoded literal somewhere — grep your CSS for
  `(px|em|rem|%)\s*;` and replace every hit with a `--la-gap*`
  token.

## The "pick the right gap" decision tree

A flowchart for picking the right gap:

```
Is this gap INSIDE a single element (e.g. a card)?
├── YES → use `--la-gap-sm` (tight inner gap) or `--la-gap-xs`
│         (very tight, e.g. icon ↔ label)
└── NO (this is a gap BETWEEN elements):
    ├── Are the elements stacked (vertical layout)?
    │   ├── Adjacent paragraphs → `--la-gap` (the article default)
    │   ├── Adjacent sections   → `--la-gap-lg`
    │   └── Article ↔ next article → `--la-gap-xl`
    └── Are the elements side-by-side (horizontal layout)?
        ├── Inline chips / labels → `--la-gap-sm`
        ├── KPI cards in a row    → `--la-gap`
        ├── Multi-region grid     → `--la-gap-lg`
        └── Hero ↔ next section   → `--la-gap-xl`
```

When two paths give the same answer, the `--la-gap` family is
more important than fine-grained micro-tuning. Default to
"close enough"; the 8px-grid rhythm is forgiving.

## Cross-technique consistency

Gaps from this map cascade across all visualisation techniques.
A typography-rendered article uses `--la-gap` between
paragraphs; a chart-rendered KPI grid uses `--la-gap` between
cards; a table-rendered cell uses `--la-gap-sm` for cell
padding. The user reads a coherent rhythm regardless of which
technique produced which surface.

If a custom typography rule says "between H2 and the first P,
use 12px" (a non-token value), the rhythm breaks. The fix is to
use `--la-gap-sm` (8px) or `--la-gap` (16px), whichever is
closer to the design intent — never 12px.

## Edge case: the "almost-right" gap

Sometimes the "closest" token isn't quite right (e.g. a
designer asked for 20px between two specific elements; the
nearest tokens are 16px and 24px). The right answer:

1. **Try 16px first.** Most cases, the design works at 16px.
   The 4px difference is rarely perceptible in context.
2. **If 16px is too tight, try 24px.** Rarely, 16px is too
   compact and 24px works.
3. **Last resort: extend the spacing scale.** Add a `20px`
   slot to the DESIGN.md `spacing.scale` array; a new
   `--vc-space-N` is automatically emitted; alias it as
   needed.

NEVER use a literal `20px` in the CSS. The literal will drift
out of alignment with the rest of the system over time.
