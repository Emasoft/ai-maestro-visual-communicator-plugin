# Tabular numerics — proportional vs tabular digit widths

`font-variant-numeric: tabular-nums` is the single most important
typography setting for **any column of numbers** in the runtime —
counters, stat cards, data tables, leaderboards, ticker rows. It is a
one-line CSS rule with an outsized effect: digits become equal-width,
so a `9,876,543.21` row aligns vertically with a `1,234,567.89` row
column-for-column. Without it, proportional digits make the right edge
of a numeric column wobble as the data updates.

## What it is

Most modern OpenType fonts ship TWO digit widths:

- **Proportional digits (default).** Each digit has its own width
  tuned for visual rhythm in prose — a "1" is narrower than a "0", a
  "4" is wider than a "1". Reads beautifully inside a paragraph.
- **Tabular digits (opt-in).** All digits share the same width — the
  "1", "0", "4", "9" all advance the same number of em units. Reads
  beautifully in a column.

`font-variant-numeric: tabular-nums` flips the font to the tabular
digits. The CSS rule is fail-soft: on a font without tabular digits
the property is silently ignored, so the proportional digits keep
rendering.

## The contract

`amvcp-typography.css` ships **NO** global `tabular-nums` rule —
proportional digits are correct for body prose. The class
`.vc-tabular-nums` is exposed as an opt-in utility:

```css
.vc-tabular-nums {
  font-variant-numeric: tabular-nums;
  /* Also enable slashed-zero so 0 and O are unambiguous in monospace
     contexts. Slashed-zero is a separate OpenType feature; pairing
     them on a single utility lets one class flip both. Fail-soft —
     a font without slashed-zero ignores the second clause. */
  font-feature-settings: "tnum" 1, "zero" 1;
}
```

The `font-feature-settings` redundancy with `font-variant-numeric` is
deliberate — older Safari (~13) honoured `font-feature-settings: "tnum"`
but not `font-variant-numeric: tabular-nums`. Shipping both clauses
makes the utility correct on every browser the runtime supports.

## Scaffold

The agent reaches for `.vc-tabular-nums` whenever a number sits in a
*column* — meaning the reader's eye will compare digit positions
between rows.

```html
<!-- Stat card row — different values, must align -->
<div class="stat-row vc-tabular-nums">
  <span class="stat-value">9,876,543.21</span>
  <span class="stat-value">1,234,567.89</span>
  <span class="stat-value">    47,123.00</span>
</div>

<!-- Live counter — the digits update on every keystroke -->
<output class="vc-tabular-nums">2,847 tokens</output>

<!-- Data table — every numeric column -->
<table>
  <tr><th>SKU</th><th class="vc-tabular-nums">Stock</th></tr>
  <tr><td>A-001</td><td class="vc-tabular-nums">9,876</td></tr>
  <tr><td>B-042</td><td class="vc-tabular-nums">12</td></tr>
</table>
```

For a `<table>`-wide opt-in, put the class on the `<table>` itself —
the inheritance carries `font-variant-numeric` to every cell.

## Tokens consumed / extended

- **Consumes:** nothing (the rule is independent of any
  `--vc-*` token).
- **Extends:** nothing.

This utility is a *pure CSS* rule with no token dependency, by design
— the choice of tabular-vs-proportional is per-context, not per-theme.

## When the data also wants right-alignment

Tabular digits align in *width*, not in *position* — the column
still needs `text-align: right` (or `text-align: end`) to right-justify
the value. The two together are how spreadsheets render numeric
columns:

```css
td.vc-num {
  font-variant-numeric: tabular-nums;
  text-align: right;
}
```

`amvcp-typography.css` does NOT bake this combo into a single class —
the `tables` skill owns the `td.vc-num` shape (right-aligned monospace
numeric cell). Typography only ships the underlying utility.

## Mono numerics — sibling pattern

A sibling utility is `.vc-mono-nums`, which sets the *font* to the
mono face AND enables tabular nums:

```css
.vc-mono-nums {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}
```

Use `.vc-mono-nums` (NOT `.vc-tabular-nums`) when:

- the number sits *inline* in a prose body and you want it visually
  distinguished as "this is a code-flavoured value, not narrative
  text" — log timestamps, hex IDs, port numbers, version strings;
- the page tone is technical (status report, dashboard, incident
  postmortem);
- the number is in a `<kbd>` or `<code>` element — those already
  inherit `font-family` from the engine's `--vc-font-mono`, but the
  inheritance does NOT enable `tabular-nums`.

Use `.vc-tabular-nums` (NOT `.vc-mono-nums`) when:

- the number sits in a column AND the surrounding prose is body-face
  (a stat-card grid, a leaderboard, a financial summary);
- you want the number to integrate visually with body type, just with
  equal-width digits.

The two utilities are NOT aliases — they make a different visual
choice (font swap vs same font, just tabular digits).

## Old-style figures vs lining figures

A third axis of numeric typography: **old-style figures** (digits with
ascenders and descenders, like ı, 2̧, ₃, ₄) vs **lining figures**
(all digits same height, like 0123456789). Lining is the default in
nearly every font.

The opt-in for old-style figures is:

```css
.vc-onum {
  font-variant-numeric: oldstyle-nums;
}
```

Only opt into `oldstyle-nums` for **editorial prose** where the
number sits inside a sentence and lining figures look harsh ("Born in
1923, he…"). NEVER pair old-style figures with `tabular-nums` — the
two are mutually-exclusive (`font-variant-numeric` only takes one
glyph-shape choice per element). The utility is included here for
completeness; the agent will rarely reach for it.

## The runtime's existing tabular numerics use

The runtime has several places where tabular numerics are already
*needed* but not yet applied — these are the migration targets:

| Site | Current state | Fix |
|---|---|---|
| Live token counter (`amvcp-typography.js` returns `chars / 4.2`) | Renders in body face, proportional digits — counter jitters as you type. | Wrap output in `<span class="vc-tabular-nums">…</span>`. |
| Stat-card grid (`amvcp-runtime.js` "Shipped: 14 / PRs Merged: +3") | Body face, proportional. The "+3" jiggles when the value re-renders. | Add `.vc-tabular-nums` to the stat-card class. |
| Pill values (`.pill .v {font-family: mono; …}`) | Mono face is already correct; tabular-nums NOT explicit. | Promote to `.vc-mono-nums` so the digit width is locked. |
| Incident-report duration ("47 min") | Body face, proportional. | `.vc-tabular-nums` on the pill value. |
| Timeline timestamps | Body face, proportional — minutes column wobbles. | `.vc-mono-nums`. |

These migrations are NOT this skill's build work — the typography
skill ships the utility; the runtime migration is a separate refactor.

## Slashed zero — when to opt in

`font-feature-settings: "zero" 1` (alias `font-variant-numeric:
slashed-zero`) renders the digit `0` with a slash through it, so it
cannot be visually confused with the capital letter `O`. The
`.vc-tabular-nums` utility opts in automatically (zero ambiguity in a
data column is non-negotiable). Outside a data column, slashed-zero
in body prose is a *design choice* — the agent picks it for technical
content (port numbers, hex IDs, file paths) and avoids it for
editorial content (page numbers, dates in prose).

To opt in standalone (without `tabular-nums`):

```css
.vc-slashed-zero { font-feature-settings: "zero" 1; }
```

## Fail-soft on fonts without these features

Every utility above is fail-soft:

- `font-variant-numeric: tabular-nums` on a font without tabular
  digits — proportional digits render (no change, no error).
- `font-feature-settings: "zero" 1` on a font without slashed-zero —
  regular zero renders.
- `font-variant-numeric: oldstyle-nums` on a font without old-style
  digits — lining digits render.

The browser silently ignores feature requests the font cannot
satisfy. No JS feature-detect is needed; no error is logged.

## Light + dark — orthogonal to theming

Tabular numerics affect only digit *width*. The colour of the digit
(theme-derived) is unaffected. A `.vc-tabular-nums` element renders
correctly in BOTH the light and the dark theme with no extra
declaration — the utility sets no `color` and no `background`.

## Selection-contract conformance

A `.vc-tabular-nums` element is NOT itself a typography atom — it is a
*modifier*. The runtime's `markTypographyAtoms` walker does NOT
attach a decision-mini-pill to it directly; the pill attaches to the
parent (an `<output>`, a `<td>`, a `<span class="stat-value">`) that
the walker recognises as an atom (typically by its semantic-HTML
shape or by the surrounding skill's atom registry).

This is the correct behaviour: the *value* is the atom (the reader
comments on "the wrong number"), the *width policy* is just rendering.

## When NOT to use it

- In prose body text where numbers appear once or twice — proportional
  digits read better in a paragraph. ("In 2024, we shipped 47 features"
  reads better proportional than tabular.)
- Inside a heading — heading numbers are usually a count or a year and
  read once, not compared column-for-column.
- For ordinal numbers ("1st", "2nd") — the superscript shape (if the
  font has one) is more important than tabular width.

## Cross-references

- [code-and-mono.md](./code-and-mono.md) — the mono font stack and
  inline-code styling that pairs with `.vc-mono-nums`.
- [semantic-hierarchy.md](./semantic-hierarchy.md) — the base
  typography contract this utility sits on top of (it overrides
  nothing the contract sets).
- `tables` skill — owns the right-aligned numeric column shape
  (`td.vc-num`) that combines `.vc-tabular-nums` + `text-align: right`.
- `charts-and-dashboards` skill — owns the stat-card grid where this
  utility is most-applied.
