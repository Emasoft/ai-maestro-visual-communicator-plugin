# List typography — bullets, numerals, definitions, and nested rhythm

Three list elements: `<ul>` (unordered), `<ol>` (ordered), `<dl>`
(definition). Each has a distinct typographic contract — bullet
spacing, numeral style, definition-term emphasis. The typography skill
ships element-level defaults plus the `.vc-list-tight`,
`.vc-list-loose`, and `.vc-list-dashed` modifiers for density and
bullet shape variants.

## What it is

Lists are body-level structural elements that the reader scans more
than reads. The typography contract for a list is therefore:

- **Same font / size / weight as body** — a list inside body prose
  inherits.
- **Distinct marker styling** (bullet, numeral) — visually frames
  each item.
- **Tight inter-item leading** (1.55 by default — same as body, NOT
  loosened the way a lead is loosened).
- **Vertical inter-list rhythm** — small `margin-block` so a list
  doesn't crowd the surrounding paragraphs.

## The contract

`amvcp-typography.css`:

```css
ul,
ol {
  font-size: var(--vc-text-2);
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  font-family: var(--vc-font-body, inherit);
  line-height: var(--vc-line-height, 1.55);
  padding-left: 1.5em;                /* room for the marker */
  margin: 0.75em 0;                   /* vertical rhythm */
}

li {
  margin-bottom: 0.25em;              /* small inter-item gap */
}

/* Last item of a list — no trailing gap. */
li:last-child {
  margin-bottom: 0;
}

/* Nested list — slightly smaller top/bottom margin so the nest
   feels tighter than the parent. */
ul ul, ol ol, ul ol, ol ul {
  margin: 0.25em 0 0.25em 0;
}

/* Bullet marker — small offset, theme-correct via currentColor. */
ul {
  list-style: disc;
  list-style-position: outside;
}

/* Numerals — old-style would be editorial; lining is correct for UI. */
ol {
  list-style: decimal;
  list-style-position: outside;
}

/* Definition list. */
dl {
  margin: 1em 0;
  font-size: var(--vc-text-2);
}
dt {
  font-weight: var(--vc-weight-heading, var(--vc-weight-medium, 500));
  margin-top: 0.5em;
}
dd {
  margin: 0 0 0.5em 1.5em;
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
}
```

## Scaffold

### Bullet list (unordered)

```html
<ul>
  <li>First point of the argument.</li>
  <li>Second point, slightly longer with more detail to make the
      reader pause.</li>
  <li>Third point, ending with a citation or reference.</li>
</ul>
```

### Numbered list (ordered)

```html
<ol>
  <li>First step in the procedure.</li>
  <li>Second step, with explanation.</li>
  <li>Third step, with a sub-procedure:
    <ol type="a">
      <li>Sub-step a.</li>
      <li>Sub-step b.</li>
    </ol>
  </li>
  <li>Fourth step.</li>
</ol>
```

The `type="a"` attribute on a nested `<ol>` switches the numeral style
to lowercase letters — a clean editorial trick for nesting depth.

### Definition list

```html
<dl>
  <dt>SLA</dt>
  <dd>Service-Level Agreement — the contractual commitment to
      availability or latency.</dd>
  <dt>SLO</dt>
  <dd>Service-Level Objective — the internal target the team
      operates against (typically stricter than the SLA).</dd>
</dl>
```

## Tokens consumed / extended

- **Consumes:** `--vc-text-2`, `--vc-weight-body`, `--vc-weight-heading`,
  `--vc-weight-medium`, `--vc-font-body`, `--vc-line-height`.
- **Extends:** nothing.

## The density modifiers — tight / loose

For dense content (a 20-item changelog) or sparse content (3 big
items with breathing room) the typography skill ships two density
modifiers:

```css
.vc-list-tight li {
  margin-bottom: 0;                   /* zero inter-item gap */
  line-height: 1.4;                   /* tighter leading per line */
}

.vc-list-loose li {
  margin-bottom: 0.75em;              /* generous gap */
  line-height: 1.7;                   /* looser leading */
}
```

Use `.vc-list-tight` for:
- Changelogs (`* Fixed X`, `* Added Y`, …).
- Compact summary lists (e.g. side-bar TOC).
- ASCII-art-flavoured list views.

Use `.vc-list-loose` for:
- Editorial bullet lists where each item is a sentence.
- Outline-style summary lists.
- Slide-deck bullet slides (one bullet = one breath).

## The dashed-bullet modifier

The Anthropic-Claude reference corpus uses *em-dash bullets* in
several places — small visual signature. The opt-in:

```css
.vc-list-dashed {
  list-style: none;
  padding-left: 0;
}
.vc-list-dashed li {
  padding-left: 1em;
  position: relative;
}
.vc-list-dashed li::before {
  content: "—";                       /* em-dash */
  position: absolute;
  left: 0;
  color: var(--vc-color-accent, currentColor);
  opacity: 0.7;
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
}
```

The em-dash adopts the engine's accent colour (with `currentColor`
fail-soft), so a clay accent gives clay dashes, an olive accent
gives olive dashes — themed correctly.

## The square-bullet modifier (status / report convention)

For status reports the corpus uses *clay square bullets*:

```css
.vc-list-square {
  list-style: none;
  padding-left: 0;
}
.vc-list-square li {
  padding-left: 1.5em;
  position: relative;
}
.vc-list-square li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.45em;
  width: 0.5em;
  height: 0.5em;
  background: var(--vc-color-accent, currentColor);
}
```

The square is a tighter visual signal than the disc bullet — reads
as "checklist item", not as "narrative bullet".

## The check / cross / olive-dot variants

For Pro/Con lists, success/failure lists, action items:

```css
.vc-list-check { list-style: none; padding-left: 0; }
.vc-list-check li { padding-left: 1.5em; position: relative; }
.vc-list-check li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--vc-color-success, var(--vc-color-accent, currentColor));
  font-weight: var(--vc-weight-bold, 700);
}

.vc-list-cross { list-style: none; padding-left: 0; }
.vc-list-cross li { padding-left: 1.5em; position: relative; }
.vc-list-cross li::before {
  content: "✕";
  position: absolute;
  left: 0;
  color: var(--vc-color-error, var(--vc-color-accent, currentColor));
  font-weight: var(--vc-weight-bold, 700);
}
```

These are semantically richer than `.vc-list-dashed` — the marker
visually carries meaning ("this is done", "this is broken"). The
agent picks them for action lists, retrospectives, comparison sheets.

## The numeral variants — `type="a"`, `type="A"`, `type="i"`, `type="I"`, `type="1"`

The native `<ol type="X">` attribute switches the numeral style:

| Attribute | Renders as |
|---|---|
| `type="1"` (default) | 1, 2, 3, … |
| `type="a"` | a, b, c, … |
| `type="A"` | A, B, C, … |
| `type="i"` | i, ii, iii, … |
| `type="I"` | I, II, III, … |

These are *attribute* values on the element, not CSS classes. Use
them for nested ordered lists to differentiate nesting levels at a
glance:

```html
<ol>
  <li>Outer
    <ol type="a">
      <li>Inner
        <ol type="i">
          <li>Deepest</li>
        </ol>
      </li>
    </ol>
  </li>
</ol>
```

CSS `list-style-type: lower-alpha;` etc. are the CSS-side equivalents
— prefer the HTML attribute (it stays correct when the CSS layer
fails to load).

## Definition list — `<dl>` typography

The `<dl>` element pairs *terms* (`<dt>`) with *definitions* (`<dd>`).
The contract:

- `<dt>` is heading-weight (medium, 500) — visually marks the term as
  the lookup key.
- `<dd>` is body-weight (regular, 400) — the definition reads as
  prose.
- `<dd>` is indented `1.5em` from the `<dt>` — visually subordinates
  the definition to its term.

For glossary pages, the `<dl>` is the canonical structure. Avoid
faking a glossary with `<p><strong>Term</strong> — definition</p>` —
that loses the semantic relationship (screen readers don't pair the
term with its definition).

## Light + dark — fully covered

The list contract sets:

- All sizes / weights / fonts via `var(--vc-*)` tokens — themed.
- Marker colour via `currentColor` (default disc / decimal) — themed.
- Modifier markers (`::before` content) via `var(--vc-color-accent,
  currentColor)` — themed.
- NO hardcoded `color`.

Theme-correct in both light and dark.

## Nested list rhythm

Nested lists (a `<ul>` inside a `<li>`) get a *reduced* vertical
margin (`0.25em` vs the outer list's `0.75em`). The nested rhythm is
intentionally tighter — the nest visually belongs to its parent item,
and the smaller gap signals that.

The agent does NOT need to add any class — the bare nested-element
selector (`ul ul`, `ol ol`, etc.) does the right thing.

## Selection-contract conformance

A `<ul>` / `<ol>` / `<dl>` is NOT itself a typography atom — it is a
**container**. Each `<li>` (or `<dt>` / `<dd>` pair) is the atom.
The `markTypographyAtoms` walker stamps each `<li>` with
`data-ve-type="type-li"` (added to the SHAPE table in the integration
pass).

The decision-mini-pill anchors per `<li>` — the user comments on a
specific item, not on the list as a whole.

## When NOT to use a list

- A 2-item list — usually a sentence reads better ("X and Y").
- A list of definitions disguised as a `<ul>` — use `<dl>` instead.
- A list inside a `<button>` — usually wrong; the button should have
  one label.
- A list inside a `<table>` cell — usually wrong; the table cell is
  already a row container.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page with one each: `<ul>`, `<ol>`, `<dl>`,
   `.vc-list-tight`, `.vc-list-dashed`, `.vc-list-square`,
   `.vc-list-check`.
2. Confirm the bullets / numerals are present and correctly aligned.
3. Confirm the dashed / square / check variants use the engine's
   accent colour for the marker.
4. Confirm the inter-item gaps look right in BOTH the light and dark
   themes.
5. Confirm nested lists tighten correctly.

## Cross-references

- [semantic-hierarchy.md](./semantic-hierarchy.md) — the body role
  the list inherits from.
- [tabular-numerics.md](./tabular-numerics.md) — for lists of numbers
  (e.g. an `<ol>` of metric values), pair with `.vc-tabular-nums` on
  the `<li>` or on the `<ol>` itself.
- `design-tokens` skill — `--vc-color-accent`, `--vc-color-success`,
  `--vc-color-error` the marker variants consume.
- `tables` skill — tabular data; use a `<table>` not a `<ul>` for
  structured data.
