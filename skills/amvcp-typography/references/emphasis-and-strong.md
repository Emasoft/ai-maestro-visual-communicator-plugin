# Emphasis — `<em>`, `<strong>`, `<mark>`, and the inline-emphasis register

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why italic and not just colour for `<em>`](#why-italic-and-not-just-colour-for-em)
- [Why bold and not bigger for `<strong>`](#why-bold-and-not-bigger-for-strong)
- [Why `<mark>` uses a tinted background, not a colour change](#why-mark-uses-a-tinted-background-not-a-colour-change)
- [`<ins>` and `<del>` — the revision pair](#ins-and-del--the-revision-pair)
- [`<u>` — dotted, not solid](#u--dotted-not-solid)
- [`<s>` — generally available, often misused](#s--generally-available-often-misused)
- [Combined `<em><strong>` — the absolute-critical case](#combined-emstrong--the-absolute-critical-case)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Combinations with `text-transform`](#combinations-with-text-transform)
- [Selection-contract conformance](#selection-contract-conformance)
- [When NOT to use](#when-not-to-use)
- [Verification](#verification)
- [Cross-references](#cross-references)

Inline emphasis is a SEPARATE typographic register from the surrounding
body — `<em>` for stress emphasis (italic), `<strong>` for strong
importance (bold), `<mark>` for highlighted text (background tint),
plus three less-common semantic elements (`<u>`, `<s>`, `<ins>`,
`<del>`). The typography skill ships element-level defaults for each.

## What it is

| Element | Renders as | Semantic meaning |
|---|---|---|
| `<em>` | Italic | Stress emphasis — the *change in meaning* if spoken with vocal stress |
| `<strong>` | Bold | Strong importance — the *can't-be-missed* part |
| `<mark>` | Background tint | Highlighted — relevant to a current search or filter |
| `<u>` | Underline | Non-textual annotation (e.g. spelling error mark) |
| `<s>` | Strikethrough | No longer accurate / no longer relevant |
| `<ins>` | Underline (default) | Inserted in a revision |
| `<del>` | Strikethrough (default) | Deleted in a revision |
| `<b>` | Bold (no semantic) | DON'T USE — use `<strong>` instead |
| `<i>` | Italic (no semantic) | DON'T USE — use `<em>` for emphasis, `<cite>` for titles, `<var>` for variables |

The typography contract sets distinct visual styles for each of the
semantic elements. The non-semantic `<b>` and `<i>` get the same
visual style as `<strong>` and `<em>` but the typography skill
**recommends against using them** (the semantic elements carry
information that `<b>` / `<i>` don't).

## The contract

`amvcp-typography.css`:

```css
/* Stress emphasis — italic. The body face's italic variant. */
em {
  font-style: italic;
  /* Slightly darker if the body is in a muted tone — increases
     contrast against the surrounding text. */
}

/* Strong importance — bold. */
strong {
  font-weight: var(--vc-weight-bold, 700);
  /* No italic — strong is bold, em is italic; combining them is rare
     but allowed (an <em><strong>…</strong></em> for "this is the
     critical takeaway" cases). */
}

/* Highlighted — background tint, theme-correct. */
mark {
  background: color-mix(in srgb, var(--vc-color-accent, currentColor) 25%, transparent);
  /* No padding by default — would shift line metrics. */
  /* Subtle color override only if the engine emits an on-accent. */
  color: inherit;
}

/* User annotation underline — distinct from a link. */
u {
  text-decoration: underline;
  text-decoration-style: dotted;       /* dotted vs solid distinguishes from links */
  text-underline-offset: 0.15em;
}

/* No-longer-accurate. */
s {
  text-decoration: line-through;
}

/* Revision insert. */
ins {
  background: color-mix(in srgb, var(--vc-color-success, currentColor) 15%, transparent);
  text-decoration: none;               /* override the default underline */
}

/* Revision delete. */
del {
  background: color-mix(in srgb, var(--vc-color-error, currentColor) 15%, transparent);
  text-decoration: line-through;
}

/* Combined em + strong — for the rare "absolute critical" case. */
em strong, strong em {
  font-style: italic;
  font-weight: var(--vc-weight-bold, 700);
}
```

## Scaffold

```html
<!-- Stress emphasis -->
<p>The cache stampede was triggered by the <em>missing</em>
   Cache-Control header.</p>

<!-- Strong importance -->
<p>The mitigation requires <strong>restarting all edge nodes</strong>
   before deploy.</p>

<!-- Highlighted (search match, current filter) -->
<p>The search for "<mark>cache</mark>" matched 47 occurrences.</p>

<!-- Revision diff -->
<p>The <del>port 5432</del> <ins>port 5433</ins> change rolled out
   on 2026-04-12.</p>

<!-- Strikethrough -->
<p>The original SLA was <s>99.9%</s> — revised to 99.95% in 2025.</p>

<!-- Dotted underline annotation -->
<p>The spelling <u>recieve</u> should be "receive".</p>
```

## Tokens consumed / extended

- **Consumes:** `--vc-weight-bold`, `--vc-color-accent`,
  `--vc-color-success`, `--vc-color-error`.
- **Extends:** nothing.

## Why italic and not just colour for `<em>`

`<em>` is *italic* because italic is the canonical typographic gesture
for stress emphasis in Latin scripts. Color alone would fail WCAG 1.4.1
(color must NOT be the only visual cue). Italic carries the cue at
zero contrast cost.

For CJK content, italic is meaningless (CJK has no italic forms);
emphasis is marked with the *bouten* dot pattern, which is a separate
typographic system. The typography skill defers CJK emphasis to
`design-tokens` DT-25.

## Why bold and not bigger for `<strong>`

`<strong>` is *bolder*, not *larger*. Increasing size for emphasis
breaks the inline flow (the line height jumps). Boldness fits inside
the inline flow — the line stays the same height.

This is why `<strong>` is set via `font-weight: 700`, not via
`font-size: larger`.

## Why `<mark>` uses a tinted background, not a colour change

A `<mark>` is *highlighted* — visually framed as "this is what you're
looking for". A colored *text* would conflict with link colours; a
colored *background* preserves text legibility and signals "framing".

The background uses `color-mix(... var(--vc-color-accent) 25%,
transparent)` — a 25% tint of the engine accent. The tint is faint
enough that body text reads through it; strong enough to be visible.

Light theme + clay accent → faint clay highlight. Dark theme + lighter
accent → faint lighter highlight. Themed correctly.

## `<ins>` and `<del>` — the revision pair

`<ins>` (newly inserted) gets a faint **success-coloured** tint
(olive in the Anthropic palette, green in most palettes). `<del>`
(deleted) gets a faint **error-coloured** tint (clay / red) plus a
strikethrough.

This is the canonical "diff" visual pattern — same colour conventions
as `git diff`, GitHub PR view, VS Code's source-control panel. The
reader's eye reads it without instruction.

The tint colours come from `--vc-color-success` and `--vc-color-error`
— two NEW tokens the typography skill expects from the engine
(via the `design-tokens` skill). If those tokens are unset, the
`color-mix` falls back to `currentColor` — the tints become text-coloured
faint (less semantic but still visible).

## `<u>` — dotted, not solid

A solid underline conflicts visually with link underlines. The
dotted underline distinguishes the annotation from a link.

`<u>` is RARELY used in modern HTML — the historical use was for
*emphasis*, which `<em>` and `<strong>` cover. The modern semantic
use is *non-textual annotation*: e.g. marking a spelling error in
a transcript ("the speaker said `<u>recieve</u>`").

Avoid `<u>` for general emphasis — it reads as "this is a link" to
many users.

## `<s>` — generally available, often misused

`<s>` (strikethrough) marks text that is *no longer accurate* or
*no longer relevant* — a price that has changed, a feature that has
been deprecated, an SLA target that was revised.

`<s>` is NOT the same as `<del>`. `<del>` marks an *edit in this
document* (a revision); `<s>` marks content that was correct at the
time of writing but is no longer.

For prose: "The original SLA was `<s>99.9%</s>` — revised to 99.95%".
For a revision diff: "Port `<del>5432</del> <ins>5433</ins>`".

## Combined `<em><strong>` — the absolute-critical case

For the rare case where text needs BOTH stress emphasis AND strong
importance, nest the two elements. The visual result: italic +
bold.

Use sparingly. A page with multiple `<em><strong>` runs has lost the
ability to call something out — every emphasis is the same emphasis.

## Light + dark — fully covered

- `<em>` — uses italic (a font-style property), no colour.
- `<strong>` — uses bold (a font-weight property), no colour.
- `<mark>` — uses `color-mix(... var(--vc-color-accent), transparent)`,
  themed via accent.
- `<u>` — uses inherited text colour, no override.
- `<s>` — uses inherited text colour, no override.
- `<ins>` / `<del>` — use `color-mix(... var(--vc-color-success/error),
  transparent)`, themed via the engine.

All elements are theme-correct. No hardcoded colours.

## Combinations with `text-transform`

`<strong>` inside a `.vc-type-overline` (which sets `text-transform:
uppercase`) renders as bold-uppercase. This is fine but uppercase +
bold + tracked is a **lot** of emphasis — usually the `.vc-type-overline`
already provides enough emphasis without `<strong>`. Reach for
`<strong>` inside an eyebrow only when you really need the further
boost.

## Selection-contract conformance

`<em>`, `<strong>`, `<mark>`, `<u>`, `<s>`, `<ins>`, `<del>` are INLINE
— they are NOT typography atoms. They live inside a parent atom (a
`<p>`, `<li>`, `<h2>`); the parent owns the decision-mini-pill.

The walker's SHAPE table (in `amvcp-typography.js`) deliberately
omits inline-emphasis elements. The runtime never stamps them.

## When NOT to use

- For decorative effect with no semantic meaning — use a class
  (`.vc-italic`, `.vc-bold`) instead of `<em>` / `<strong>`. The
  semantic elements are for *semantic* emphasis.
- For colour-only emphasis ("make this word red") — use a class with
  a colour rule, not `<em>`.
- For headings — headings already have weight; nesting `<strong>`
  inside an `<h2>` is redundant.
- For "this is a title" — use `<cite>` for the title of a work,
  not `<em>` or `<i>`.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render the specimen page with one each: `<em>`, `<strong>`,
   `<mark>`, `<ins>`, `<del>`, `<s>`, `<u>`, `<em><strong>`.
2. Confirm each visually distinct from the surrounding body.
3. Confirm `<mark>` background is the engine's accent at ~25% tint.
4. Confirm `<ins>` / `<del>` tints use success / error colours.
5. Repeat in the dark theme. Confirm all tints adapt.
6. Confirm `<u>` is dotted (not solid) — distinguishes from links.

## Cross-references

- [tri-font-stack-anthropic.md](./tri-font-stack-anthropic.md) — the
  body face the italic / bold variants come from.
- [code-and-mono.md](./code-and-mono.md) — `<var>` (italic mono)
  is the analogue of `<em>` in the mono register.
- [semantic-hierarchy.md](./semantic-hierarchy.md) — the body role
  emphasis sits inside.
- `design-tokens` skill — owns `--vc-color-success`, `--vc-color-error`
  the `<ins>` / `<del>` tints consume.
