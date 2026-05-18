# Eyebrow / overline / label — the mono-tracked category strip

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Visual variants](#visual-variants)
- [Tracking — why exactly 0.08em](#tracking--why-exactly-008em)
- [Sizing — why 11px and not 12px](#sizing--why-11px-and-not-12px)
- [Light + dark — correct for free](#light--dark--correct-for-free)
- [Selection-contract conformance](#selection-contract-conformance)
- [Decision-mini-pill](#decision-mini-pill)
- [Comment thread](#comment-thread)
- [When to choose this technique](#when-to-choose-this-technique)
- [When NOT to use it](#when-not-to-use-it)
- [No nested scrollbars](#no-nested-scrollbars)
- [Light/dark coverage check](#lightdark-coverage-check)
- [Migration from runtime hard-codes](#migration-from-runtime-hard-codes)
- [Cross-references](#cross-references)

The single most-reused typographic micro-pattern across high-quality
AMVCP outputs (the Anthropic-Claude reference corpus uses it on every
one of 21 demos). A small monospace strip above a heading that
categorises the block: "ECONOMICS", "INCIDENT REPORT", "PHASE 1".
This reference describes the **canonical eyebrow** as a first-class
typography role, distinct from `<h1>`…`<h6>`, with its own utility
class (`.vc-type-overline` / `.vc-type-label`) and its own per-role
contract values.

## What it is

An eyebrow is a small (~11–12 px), uppercase, heavily-tracked
(+0.08 em) line of text placed **directly above** a heading. It tells
the reader *what kind of thing* the heading introduces — a section
number, a category, a phase, an artifact type. The reader's eye lands
on it before the heading and frames the heading semantically.

A correct eyebrow is **not** an `<h2>` and **not** an `<h6>` — it is a
**label** role. Promoting it to a heading pollutes the document outline
(screen readers announce it, the table-of-contents picks it up). The
typography skill exposes it via the `.vc-type-overline` /
`.vc-type-label` utility class — both are aliases of the same
declaration; pick the one that reads better in the markup.

## The contract

| Property | Value | Why |
|---|---|---|
| `font-size` | `var(--vc-text-0)` | The smallest legible step (~11px @ base 16). |
| `font-weight` | `var(--vc-weight-label, var(--vc-weight-medium, 500))` | Heavier than body so the eye picks it up despite the small size. |
| `font-family` | `var(--vc-font-body, inherit)` | Body face. A *mono* variant is a separate utility (see "Mono eyebrow" below). |
| `letter-spacing` | `0.08em` | The signature spacing — opens the glyphs at small caps. |
| `text-transform` | `uppercase` | Visually distinguishes the eyebrow from body copy in a glance. |
| `line-height` | `1.40` | Short enough not to add empty space below the eyebrow before the heading. |
| `color` | (NOT set by the layer) | Comes from the runtime's `--ve-control-fg` token via theme; eyebrow is **dim by convention** — a consuming skill MAY add a `.vc-muted` modifier. |

Defined in `amvcp-typography.css` § "Element-level defaults":

```css
.vc-type-label,
.vc-type-overline {
  font-size: var(--vc-text-0);
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  font-family: var(--vc-font-body, inherit);
  line-height: 1.40;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

## Scaffold

```html
<header>
  <p class="vc-type-overline">Incident Report · INC-2025-0412</p>
  <h1>Cache stampede during slot-fill rollout</h1>
  <p class="vc-type-lead">…lead paragraph…</p>
</header>
```

Note: `<p class="vc-type-overline">…</p>` — a paragraph element, NOT a
heading. The class drops the body font-size/leading and applies the
eyebrow contract.

For tighter coupling, the runtime may emit an eyebrow as a `<small>`
inside the heading:

```html
<h1>
  <small class="vc-type-overline">Section 02</small>
  Tokenization rules
</h1>
```

— but the standalone `<p>` form is preferred because it keeps the
heading's accessible name (`Tokenization rules`) free of the eyebrow
text, which is decorative.

## Tokens consumed / extended

- **Consumes:** `--vc-text-0`, `--vc-weight-label`, `--vc-weight-medium`,
  `--vc-font-body`.
- **Extends:** nothing. The class is a pure mapping from the existing
  token surface.

## Visual variants

The agent picks one of three eyebrow styles based on the page tone.
All share the same `.vc-type-overline` class — the variant lives in
an optional second modifier.

| Variant | Modifier | Effect | When to use |
|---|---|---|---|
| Default body-face eyebrow | (none) | Body-face uppercase | Editorial, prose pages, slide titles. |
| Mono eyebrow | `.vc-type-overline.vc-mono` | Mono face uppercase | Reports, dashboards, technical docs — the "code-flavoured" eyebrow. |
| Numbered eyebrow | `.vc-type-overline.vc-numbered` | Same as default + a leading numeral on a `::before` pseudo | Multi-part documents — `01. INTRODUCTION`, `02. METHOD`. |

The mono variant is implemented as:

```css
.vc-type-overline.vc-mono,
.vc-type-label.vc-mono {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
}
```

The numbered variant is implemented as a counter:

```css
.vc-type-overline.vc-numbered { counter-increment: vc-overline; }
.vc-type-overline.vc-numbered::before {
  content: counter(vc-overline, decimal-leading-zero) ". ";
  letter-spacing: 0.08em;
}
```

The two modifiers compose (`.vc-type-overline.vc-mono.vc-numbered` is
valid). Both are optional add-ons that the consuming skill / page
author opts into — the bare `.vc-type-overline` is the canonical form.

## Tracking — why exactly 0.08em

The eyebrow's tracking is the most negotiable property of the whole
typography contract. The catalog mining (see
`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
§3.3) found eyebrow tracking in the range `0.08em` – `0.12em` across
21 reference demos. `0.08em` is the lower bound, which means:

- it is **always** at least this much — never less (less reads as a
  too-tight all-caps run, defeating the visual separation);
- pages with shorter eyebrows ("SECTION 01") MAY push to `0.10em` or
  `0.12em` for more drama — the agent does this by overriding the
  `letter-spacing` property on the local selector, NOT by adding a new
  token (the eyebrow tracking is a per-instance optical decision, not
  a global theme decision).

For uppercase headings (not eyebrows), tracking is usually `0.02–0.04em`
— `0.08em` is **specifically** the eyebrow signature.

## Sizing — why 11px and not 12px

The eyebrow lives at `--vc-text-0` (~11 px @ base 16). The temptation
is to put it at `--vc-text-1` (~14 px) for legibility. Resist this:

- 11 px + uppercase + tracking 0.08em is *more* legible than 14 px +
  mixed case + 0 tracking because the eyebrow's cognitive job is
  **categorisation**, not reading — the reader scans it in <100 ms;
- pushing to 14 px makes the eyebrow visually compete with the body
  copy and the heading, blurring the role separation;
- 11 px is the MIN_LEGIBLE_PX floor of the type-scale calculator,
  meaning the eyebrow is *anchored* there even when the body shrinks
  to a smaller scale — the contract holds.

## Light + dark — correct for free

The eyebrow contract sets NO `color` property. The eyebrow inherits
its colour from the runtime's `--ve-control-fg` ← `--vc-color-content`
chain, which is themed by the DESIGN.md engine for both light and dark.

A common convention is to render eyebrows DIM (≈60% opacity of body
colour). This is a **runtime concern**, not a typography-skill concern
— the typography layer ships the *shape* of the eyebrow; the runtime
or the consuming skill (`report-doc`, `slide`) picks the *colour
intensity*. To dim an eyebrow, layer a `.vc-muted` class on top of
`.vc-type-overline`:

```html
<p class="vc-type-overline vc-muted">Incident Report</p>
```

`.vc-muted` is owned by `design-tokens`, not by typography — typography
ships the eyebrow *typography*, not the eyebrow *colour intensity*.

## Selection-contract conformance

Per the unified selection contract (TRDD-352ef46a phase 2.5), an
eyebrow element rendered into a page is a **selectable atom** — the
user may comment on it independently. The typography skill's
`markTypographyAtoms(root)` walker (see `amvcp-typography.js`) stamps
every `.vc-type-overline` / `.vc-type-label` with:

- `data-ve-id="<stable-id>"` — prefers the element's existing `id`,
  falls back to `type-label-<n>` based on document order.
- `data-ve-type="type-label"` — the type-hint used by the
  decision-mini-pill UI to badge the atom.

The walker is idempotent: a re-pass leaves an already-stamped element
alone. Order matters in the walker's SHAPE table — `.vc-type-label` /
`.vc-type-overline` are early in the list so an element with BOTH a
`<p>` shape AND a `.vc-type-overline` class is stamped as
`type-label`, not `type-body`.

## Decision-mini-pill

Each eyebrow atom (after `markTypographyAtoms` runs) receives the
3-radio Skip/Approve/Deny mini-pill (NEW USER REQ #10) attached by the
runtime's `attachDecisionMini(el, id)`. The pill anchors to the
top-right corner of the eyebrow bounding box; it is *not* part of the
eyebrow's own rendering — it floats over the page. The eyebrow CSS
does not need to leave room for it.

## Comment thread

When the user opens a comment thread on an eyebrow atom (via the
modal-comments skill), the thread is keyed by the `data-ve-id` stamped
above. A page may have many eyebrows ("INCIDENT REPORT",
"SECTION 02 · ROOT CAUSE", "SECTION 03 · IMPACT") — each gets its own
thread.

## When to choose this technique

- Always when a heading needs a category framing — even a single h1.
- Always for multi-part documents (an `INTRODUCTION` / `METHOD` /
  `RESULTS` / `DISCUSSION` structure reads twice as fast with eyebrows
  on each section heading).
- Always for status pages where the section nature matters more than
  the title ("PRs MERGED · 14" reads better than "14 PRs merged").
- Always above a `.vc-type-hero` to anchor the hero in a category.
- NEVER alone — an eyebrow without a following heading is just a
  decorative dim line and adds noise. Pair an eyebrow with exactly one
  heading.

## When NOT to use it

- Inside a `<table>` cell — there isn't room and the eyebrow does not
  visually integrate with table content. Use a header row instead.
- Inside a `<button>` or other interactive element — uppercase
  tracked text on a button reads as a *label*, not as an eyebrow.
- For very short pages (a one-paragraph callout) — the eyebrow
  competes with the paragraph; just use a `<small>` or a `.vc-muted`
  `<p>`.

## No nested scrollbars

The eyebrow contract introduces no `overflow` rule. A very long
eyebrow ("INCIDENT REPORT · INC-2025-0412 · CUSTOMER NORTH AMERICA
WEST · SEV-2 ESCALATED") wraps onto multiple lines naturally — the
sanctioned exception in `no-nested-scrollbars.md` (paragraph/list
text MAY wrap). Do NOT add `white-space: nowrap` to an eyebrow; the
wrapping is the correct behaviour.

## Light/dark coverage check

To verify the eyebrow renders correctly in both themes, see
`skills/amvcp-self-debug-rules/SKILL.md` — the standard
DESIGN.md-themed visual verification procedure (a dev-browser
screenshot of the specimen page in BOTH light and dark themes). The
eyebrow's contrast against the page background must stay ≥4.5:1 (WCAG
AA body) in both themes; because it sets no `color` and inherits from
`--ve-control-fg`, the engine's contrast gate is the single point of
verification.

## Migration from runtime hard-codes

The runtime currently emits eyebrow-shaped text in 8+ inline
declarations (badge labels, pill labels, table-handle text, the
top-bar "AMVCP" branding). Each is a `font-size: 11px` +
`letter-spacing: 0.08em` + `text-transform: uppercase` literal. The
typography skill defines the destination utility class
(`.vc-type-overline` / `.vc-type-label`); migrating those literals to
the class is the runtime's separate refactor task (see
`semantic-hierarchy.md` § B.6 — the migration map).

## Cross-references

- [semantic-hierarchy.md](./semantic-hierarchy.md) — the role-to-token
  contract this technique extends with the explicit "Badge / Label /
  overline" row.
- [variable-font-tokens.md](./variable-font-tokens.md) — the
  `--vc-weight-label` token the eyebrow uses (with `--vc-weight-medium`
  as the fallback).
- [type-scale-engine.md](./type-scale-engine.md) — the `--vc-text-0`
  step (11 px @ base 16) the eyebrow anchors at.
- `design-tokens` skill — the `.vc-muted` modifier some eyebrows
  layer on top.
