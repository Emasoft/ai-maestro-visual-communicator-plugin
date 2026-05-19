# Badge, pill, and chip — the labelled-token typography contract

## Table of Contents

- [What it is](#what-it-is)
- [The shared typography contract](#the-shared-typography-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why `white-space: nowrap`](#why-white-space-nowrap)
- [Why `border-radius: 999px` for pills, `4px` for chips](#why-border-radius-999px-for-pills-4px-for-chips)
- [Tabular numerics in pills](#tabular-numerics-in-pills)
- [Auto-pill — the "auto-generated" doc marker](#auto-pill--the-auto-generated-doc-marker)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Severity colouring — DT-19 ownership](#severity-colouring--dt-19-ownership)
- [Accessibility](#accessibility)
- [The runtime's current pill use](#the-runtimes-current-pill-use)
- [Selection-contract conformance](#selection-contract-conformance)
- [When to use each](#when-to-use-each)
- [Verification](#verification)
- [Cross-references](#cross-references)

The Anthropic-Claude reference corpus (and most AMVCP runtime
content) uses three closely-related visual atoms: the *badge*
(`.badge`), the *pill* (`.pill`), and the *chip* (`.chip`). They
look similar (small, rounded, label text inside) but serve different
roles. The typography skill defines the SHARED typography contract
they all consume — size, weight, tracking, padding.

The shapes themselves (background colour, border, severity colouring)
are owned by `design-tokens` (DT-19 badge severity, DT-22 activity
colors); the typography skill ships only the *typographic* contract.

## What it is

| Atom | Typical content | Typical role |
|---|---|---|
| **Badge** | A single status word: "PASS", "SEV-2", "NEW" | Status / state indicator |
| **Pill** | A key-value pair: "Duration · 47 min" | Compact metadata / label-value pair |
| **Chip** | A short tag: "Bundle: +0kb", "React" | Filterable tag / metric |

All three render at `--vc-text-0` (the smallest legible step, ~11
px), uppercase-or-tight-mixed-case, with a tracked label face and a
small rounded background. The differences are in *contents* and *colour*.

## The shared typography contract

The typography skill ships a base utility `.vc-chip-base` that all
three atoms compose on:

```css
.vc-chip-base {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;                          /* room for icons inside */
  padding: 0.15em 0.6em;
  font-size: var(--vc-text-0);         /* smallest legible step */
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  font-family: var(--vc-font-body, inherit);
  line-height: 1.3;                    /* tighter than body */
  letter-spacing: 0.04em;              /* small positive tracking */
  border-radius: 999px;                /* fully-rounded — pill shape */
  white-space: nowrap;                 /* the chip should NEVER wrap */
  /* No background — composed by .badge / .pill / .chip subclass. */
}
```

The shape variants then add background + border:

```css
/* Badge — solid background, semantic severity. */
.badge.vc-chip-base {
  background: var(--vc-color-accent, currentColor);
  color: var(--vc-color-on-accent, var(--vc-color-bg, white));
  /* Severity overrides come from design-tokens (DT-19). */
}

/* Pill — neutral background, hairline border. */
.pill.vc-chip-base {
  background: color-mix(in srgb, currentColor 6%, transparent);
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}

/* Chip — softer pill, no border. */
.chip.vc-chip-base {
  background: color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 4px;                  /* less round than pill */
}
```

For a key-value pill specifically:

```css
.pill .k {
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  margin-right: 0.3em;
  opacity: 0.7;
}
.pill .v {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  font-variant-numeric: tabular-nums;
}
```

The pill's `.k` is dim and body-face (label); the pill's `.v` is mono
and bold (value). Visually: `[Duration · 47 min]` reads as "Duration"
in dim body, then mono "47 min" in bold.

## Scaffold

### Status badge

```html
<span class="badge vc-chip-base">SEV-2</span>
<span class="badge vc-chip-base vc-sev-low">LOW</span>
<span class="badge vc-chip-base vc-sev-high">HIGH</span>
```

### Key-value pill

```html
<span class="pill vc-chip-base">
  <span class="k">Duration</span><span class="v">47 min</span>
</span>
```

### Tag chip

```html
<span class="chip vc-chip-base">Bundle: +0kb</span>
<span class="chip vc-chip-base">Testability: high</span>
```

## Tokens consumed / extended

- **Consumes:** `--vc-text-0`, `--vc-weight-label`, `--vc-weight-medium`,
  `--vc-weight-body`, `--vc-font-body`, `--vc-font-mono`,
  `--vc-color-accent`, `--vc-color-on-accent`, `--vc-color-bg`.
- **Extends:** nothing.

The colour variants (`.vc-sev-low`, `.vc-sev-high`, `.vc-sev-medium`,
`.vc-sev-info`) are added by the `design-tokens` skill (DT-19 badge
severity); the typography skill ships the base.

## Why `white-space: nowrap`

A chip should NEVER wrap onto two lines — wrapping breaks the chip's
visual atomicity. Either the chip fits on one line (the common
case) or it overflows its container.

For overflow handling, the container — a `<div>` of chips — uses
`display: flex; flex-wrap: wrap` so chips wrap as items, but each
chip stays on one line. This is the layout skill's job; the typography
skill just enforces `white-space: nowrap` on the chip itself.

This is the only `white-space: nowrap` rule in the entire typography
skill. It is the exception that proves the no-nested-scrollbars rule
applies to BLOCK content, not to inline atomic units like a chip.

## Why `border-radius: 999px` for pills, `4px` for chips

A `border-radius: 999px` always produces a **fully-rounded** shape
(the radius is capped at half the height by the browser). This is
the "pill" silhouette — convex sides.

A `border-radius: 4px` produces a softly-rounded **rectangle** — the
"chip" silhouette.

The two shapes differ in *cognitive role*: pills are PARAMETRIC (a
single value); chips are CATEGORICAL (a tag the reader can filter
on). The pill's roundness conveys "this is a unit"; the chip's
rectangle conveys "this is a label".

## Tabular numerics in pills

The `.pill .v` rule sets `font-variant-numeric: tabular-nums` — when
a pill displays a numeric value ("47 min", "98.4%", "3 of 12"), the
digits are equal-width. A pill that updates (a live counter) doesn't
wobble.

See [tabular-numerics.md](../../amvcp-typo-microtype/references/tabular-numerics.md).

## Auto-pill — the "auto-generated" doc marker

A specialised chip variant from the Anthropic-Claude corpus: the
`.auto-pill` marks documents as auto-generated by AI:

```css
.auto-pill {
  /* Inherits .vc-chip-base. */
  background: color-mix(in srgb, var(--vc-color-accent, currentColor) 12%, transparent);
  border: 1px dashed color-mix(in srgb, var(--vc-color-accent, currentColor) 30%, transparent);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0);
  color: var(--vc-color-accent, currentColor);
}
```

Usage:
```html
<aside class="vc-chip-base auto-pill">auto-generated</aside>
```

The dashed border + monospace font + accent colour signal "this
content was machine-produced". A document provenance marker.

## Light + dark — fully covered

The contract uses:

- `var(--vc-color-accent, currentColor)` — themed via engine accent.
- `color-mix(in srgb, currentColor X%, transparent)` — adapts to
  inherited text colour, themed.
- NO hardcoded colour.

Every variant is theme-correct in both themes.

## Severity colouring — DT-19 ownership

The severity-coloured badges (`.vc-sev-high`, `.vc-sev-medium`,
`.vc-sev-low`, `.vc-sev-info`) are NOT defined in the typography
skill — they live in `design-tokens` (DT-19). The pattern:

```css
/* In design-tokens skill: */
.vc-sev-high   { background: var(--vc-color-severity-high); }
.vc-sev-medium { background: var(--vc-color-severity-medium); }
.vc-sev-low    { background: var(--vc-color-severity-low); }
.vc-sev-info   { background: var(--vc-color-severity-info); }
```

The typography skill's `.vc-chip-base` provides the shape (rounded,
small, tracked); the design-tokens skill colours the shape per
severity. The two compose: a `<span class="badge vc-chip-base
vc-sev-high">HIGH</span>` is correctly shaped AND correctly coloured.

## Accessibility

Each chip / pill / badge that conveys *meaning* (not just decoration)
should have meaningful text content. A colored badge with no text
fails WCAG 1.4.1 (colour is not enough).

For status-only badges (a coloured circle, a dot), use `aria-label`:

```html
<span class="badge vc-chip-base vc-sev-high" aria-label="High severity"></span>
```

The screen reader reads "High severity"; sighted users see the
coloured dot. The typography skill doesn't enforce this — the agent
is responsible.

## The runtime's current pill use

The runtime has a `.pill` class with hardcoded styling (`font-size:
11px; letter-spacing: 0.08em; …`). Migrating to `.vc-chip-base` is
a refactor task — the typography skill defines the destination
contract; the runtime migration is separate.

Until the migration, the runtime's `.pill` is functional but uses
hardcoded sizes. The typography skill's `.vc-chip-base` is the
forward-compatible target.

## Selection-contract conformance

A `<span class="badge vc-chip-base">` standing alone is a typography
atom — the `markTypographyAtoms` walker SHOULD stamp it as
`data-ve-type="type-badge"` / `type-pill` / `type-chip` (per the
sub-class). This is an integration-pass extension to the walker.

A pill inside a longer prose run (a pill *inline* in a paragraph)
is NOT a separate atom; the parent paragraph is.

## When to use each

| Need | Use |
|---|---|
| State indicator (SEV, status) | `.badge` |
| Key-value metadata | `.pill` with `.k` / `.v` |
| Filterable tag | `.chip` |
| Tag/category in a list | `.chip` |
| Auto-generated document marker | `.auto-pill` |

The choice is editorial: the agent picks the shape that matches the
role. Don't mix (a `.badge` for a key-value pair would be visually
odd; a `.pill` for a single status word would be visually correct
but semantically weak).

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen page with one each: `.badge` (with severity),
   `.pill` (key-value), `.chip` (single tag), `.auto-pill`.
2. Confirm each renders at `--vc-text-0` size with the label weight
   and tracking.
3. Confirm the pill's `.v` renders in mono with tabular digits.
4. Confirm theme switching reskins all chips correctly (light → dark).
5. Confirm chips don't wrap onto multiple lines.

## Cross-references

- [eyebrow-overline-label.md](./eyebrow-overline-label.md) — the
  eyebrow / overline / label is a SIBLING typographic role (label,
  but standalone, not chip-shaped).
- [tabular-numerics.md](../../amvcp-typo-microtype/references/tabular-numerics.md) — the digit-width
  contract pills' `.v` consumes.
- [code-and-mono.md](../../amvcp-typo-code-keys/references/code-and-mono.md) — the mono font the pill's
  `.v` uses.
- `design-tokens` skill — owns DT-19 severity colours,
  DT-22 activity colours that paint these chips.
