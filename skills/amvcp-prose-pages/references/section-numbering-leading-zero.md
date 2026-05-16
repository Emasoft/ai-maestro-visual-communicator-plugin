# Section numbering — decimal-leading-zero via CSS counters

The whitepaper / RFC convention of numbering top-level sections with
`01`, `02`, `03` … rather than the more common `1`, `2`, `3`. The
leading zero is a typographic detail that telegraphs the document is
*formal* (not blog-shaped); RFCs, scientific papers, and design
proposals use it.

The implementation is a pure-CSS counter, requiring zero JavaScript and
zero authoring discipline — `<h2>` headings auto-number themselves in
document order. This is the **mechanism the `whitepaper` template
ships**; this reference documents how to use it, when to use it, and
what to avoid.

## When to use leading-zero numbering

| Use it | Skip it |
|---|---|
| Document is formal (RFC, whitepaper, scientific report) | Casual blog post or one-pager |
| You expect 5+ top-level sections | 2-3 sections (numbering adds clutter) |
| Sections will be reordered or inserted as the doc evolves | Section order is stable; hand-numbering is fine |
| You will reference sections by number ("see §05.2") | No cross-section references |
| The document will live in a versioned series | One-off |

A 3-section document numbered `01 02 03` looks pompous. A 9-section
document numbered `1 2 3 4 5 6 7 8 9` looks like a draft. The leading
zero pays off at 5+ sections.

## The whitepaper template's auto-numbering

Already shipped in `amvcp-report-doc.js`:

```css
.vc-doc--whitepaper { counter-reset: vc-sec; }
.vc-doc--whitepaper h2 { counter-increment: vc-sec; }
.vc-doc--whitepaper h2::before {
  content: counter(vc-sec, decimal-leading-zero) "  ";
  color: var(--vc-color-accent, #b8861f);
  font-feature-settings: "tnum";
}
```

The author writes:

```html
<article class="vc-doc vc-doc--whitepaper">
  <h2>Abstract</h2>
  <h2>Context</h2>
  <h2>Proposal</h2>
  <h2>Alternatives</h2>
  <h2>Conclusion</h2>
</article>
```

…and the rendered headings read:

```
01  Abstract
02  Context
03  Proposal
04  Alternatives
05  Conclusion
```

Insert a new `<h2>` anywhere; everything below renumbers automatically.
No string-match find-and-replace, no broken cross-references (if the
reader cross-references by *anchor name*, not by number — see below).

## Cross-referencing by name, not number

Author cross-references by section anchor, not the displayed number:

```html
<p>See <a href="#alternatives">§04 Alternatives</a> for a discussion
   of the rejected paths.</p>
```

Or even better, let the reader's eye match the number on its own:

```html
<p>The rejected paths are discussed in the Alternatives section
   below.</p>
```

If you really want the number in the link text, generate it via the
same counter:

```css
a.vc-secref::before {
  content: "§" target-counter(attr(href), vc-sec, decimal-leading-zero) " ";
}
```

(Note: `target-counter` is CSS Generated Content for Paged Media
Module Level 3 — well-supported in Chromium / WebKit, polyfillable
in Firefox if needed.)

## Multi-level numbering (sections + subsections)

For documents needing `01.1`, `01.2`, `02.1` style numbering:

```css
.vc-doc--whitepaper { counter-reset: vc-sec; }
.vc-doc--whitepaper h2 {
  counter-increment: vc-sec;
  counter-set: vc-subsec 0;  /* reset subsec on every new sec */
}
.vc-doc--whitepaper h3 { counter-increment: vc-subsec; }

.vc-doc--whitepaper h2::before {
  content: counter(vc-sec, decimal-leading-zero) "  ";
  color: var(--vc-color-accent, #b8861f);
}
.vc-doc--whitepaper h3::before {
  content: counter(vc-sec, decimal-leading-zero) "."
           counter(vc-subsec) "  ";
  color: var(--vc-color-content-muted, #5b5343);
  font-size: 0.85em;
}
```

Result:

```
01  Abstract
02  Context
   02.1  Background
   02.2  Motivation
03  Proposal
   03.1  Architecture
   03.2  API changes
```

The H3 counter resets at each new H2 because of `counter-set:
vc-subsec 0` on the H2 rule.

For three-level numbering (`01.1.1`), add an `h4` rule analogously.
Most documents stop at two levels; three is appropriate only for
specifications / standards documents.

## The standalone `vc-num` eyebrow (alternative)

When the document is NOT using `vc-doc--whitepaper`, the author can
opt into per-section numbers manually using the `vc-num` eyebrow
span:

```html
<section id="summary">
  <h2><span class="vc-num">01</span> Summary</h2>
</section>
<section id="milestones">
  <h2><span class="vc-num">02</span> Milestones</h2>
</section>
```

```css
.vc-num {
  display: inline-block;
  margin-inline-end: var(--vc-space-3, 12px);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: 0.75em;
  letter-spacing: 0.04em;
  color: var(--vc-color-accent, #b8861f);
  font-feature-settings: "tnum";
  vertical-align: 0.15em;
}
```

The standalone `vc-num` is **manual numbering**; the author writes
the digits explicitly. Use when:

- You need to skip a number (e.g. a `00` introduction).
- The numbering should not auto-increment (e.g. parallel sections
  numbered `A1` / `A2` / `B1` / `B2`).
- You are using a non-whitepaper template.

Pick **one approach per document**: either the `vc-doc--whitepaper`
auto-counter OR the manual `vc-num` eyebrow. Mixing collides.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Number color (auto-counter and manual) |
| `--vc-color-content-muted` | Subsection number (lower hierarchy) |
| `--vc-font-mono` | Manual `vc-num` |
| `font-feature-settings: tnum` | Tabular-aligned digits |

The number is always in the accent color so the reader's eye treats it
as a structural marker, not part of the heading text. Subsection
numbers (when present) drop to the muted color so the section number
remains the dominant marker.

## Composition

Section numbering is automatic when you opt into the whitepaper
template; it does not need to be invoked separately. The numbering
plays nicely with:

| Other primitive | Interaction |
|---|---|
| `toc-and-anchor-system` | TOC entries can use `target-counter` to show the section number |
| `pull-quote-cap-one-per-page` | Pull quotes do not affect the counter (they are not `<h2>`) |
| `back-to-top-link-and-print-stylesheet` | Print CSS retains the counter (the numbers print correctly) |
| `tldr-summary-card` | The TL;DR is `<aside>`, not `<h2>` — does not affect the counter |

## Selection / comment notes

- Numbered headings carry their full visible text (number + label)
  in the accessible name. Screen readers announce "Heading level 2,
  zero-one Abstract".
- The number itself is a CSS pseudo-element, not selectable text —
  copy/paste of an `<h2>` returns "Abstract" without the "01".
- Manual `vc-num` spans ARE selectable independently —
  `{type:"section-num", num:"02"}`.

## Anti-patterns

- **Mixing auto-counter with manual `vc-num` in the same document**
  — collides; either the manual numbers double-up the counter, or
  reader sees two sets of numbers.
- **Hand-numbering h2 headings as `<h2>01 Abstract</h2>`** — the
  number becomes part of the heading's accessible name; if you ever
  reorder, the numbers are wrong AND the screen-reader output is
  wrong.
- **Numbering `<h1>` in addition to `<h2>`** — there is one `<h1>`
  per document; numbering it produces "01 Title" which is
  meaningless.
- **Numbers on `<h3>` without resetting on `<h2>`** — produces
  `01 Section / 02 Subsection / 03 Section / 04 Subsection`.
  Always pair `counter-increment` on h3 with `counter-set: vc-subsec
  0` on h2.
- **Decimal-leading-zero on a 30-section document** — 01-30 reads
  fine; 01-99 still works; 001-100 is the 3-digit version (use
  `decimal-leading-zero` in CSS counters with no special handling
  for >99 — it auto-pads only to 2 digits, so manual padding is
  needed if you really need 3).
- **Numbers in a different color per section** — defeats the
  signature single-accent discipline. Numbers are always one color.
- **Section numbers in the TOC that disagree with the rendered
  numbers** — use `target-counter` so they always match.
- **A "Bonus" or "Appendix" h2 after the numbered list that ALSO
  gets a number** — appendices conventionally use letters
  (`A`, `B`). Use a `class="vc-doc-appendix"` modifier with its own
  counter.
