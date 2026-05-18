# Pull-quote (`vc-pullquote`) — cap one per page

## Table of Contents

- [When to use a pull-quote](#when-to-use-a-pull-quote)
- [Scaffold](#scaffold)
- [CSS (already injected by the runtime)](#css-already-injected-by-the-runtime)
- [The "exactly one per page" rule](#the-exactly-one-per-page-rule)
- [Variants](#variants)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other shapes](#composition-with-other-shapes)
- [Selection / comment notes](#selection--comment-notes)
- [Anti-patterns](#anti-patterns)

The oversized italic quotation that pulls a key sentence out of the
body prose for emphasis. Standard editorial typography idiom: a 20-32
px italic block-quote, indented from the body, with a clay
left-border. Used in case studies, whitepapers, and feature stories;
strictly avoided in incident reports, ADRs, and status reports
(where punching prose is wrong).

The pull-quote's effectiveness is **inversely proportional to its
frequency**. One per page reads as the editor's pick; two or more
read as decoration; four or more read as desperation. Hard cap: one
pull-quote per document.

## When to use a pull-quote

| Use it | Skip it |
|---|---|
| Document is editorial: case study, whitepaper, feature story | Reference doc, ADR, status report, postmortem |
| You have ONE sentence that is the document's most-quotable line | No single sentence carries the document |
| The reader will benefit from a pause and re-read | The document is dense and a pause breaks the flow |
| The document is ≥6 screens long | Document is short; pull-quote competes with the body |

If you find yourself wanting two pull-quotes, the document has two
headlines — split it into two documents OR pick the one that wins.

## Scaffold

```html
<blockquote class="vc-pullquote">
  <p>The clock matters more than the count. A burst at the very end of
     one window plus another at the start of the next will exceed the
     per-window budget by 2×.</p>
  <cite class="vc-pullquote-cite">— from §02 The request path</cite>
</blockquote>
```

The `<cite>` is optional but recommended; it provides a back-reference
to where the quote lives in the document body, so a reader who jumps
to the pull-quote first knows where to read more.

## CSS (already injected by the runtime)

```css
.vc-pullquote {
  margin-inline: 0;
  margin-block: var(--vc-space-5, 32px);
  padding-inline-start: var(--vc-space-4, 16px);
  border-inline-start: 3px solid var(--vc-color-accent, #b8861f);
  font-size: var(--vc-text-3, 20px);
  color: var(--vc-color-content-muted, #5b5343);
  font-style: italic;
}
.vc-pullquote p { margin-block: 0; }
.vc-pullquote-cite {
  display: block;
  margin-block-start: var(--vc-space-2, 8px);
  font-size: var(--vc-text-1, 14px);
  font-style: normal;
  color: var(--vc-color-content-subtle, #8a8170);
}
```

The italic + muted-color treatment makes the pull-quote read as a
*echo* of the body, not competing chrome. Bold or black-text pull-
quotes scream and lose the editorial register.

## The "exactly one per page" rule

Enforced by Gate-style discipline (no automated check, but easy to
audit): grep the rendered HTML for `class="vc-pullquote"` and
confirm exactly one match per document.

If a document genuinely has two pull-worthy sentences, ask:

1. Are both pulling from the same section? Pick the one that lands
   later (later = closer to the conclusion, more punch).
2. Are they pulling from different sections of an editorial piece?
   The earlier one is the *thesis*; the later one is the *payoff*.
   Keep the payoff; trim the thesis to a TL;DR-style highlight.
3. Are you considering pull-quotes for non-editorial content? Don't.
   Use a callout instead.

## Variants

The default pull-quote is left-bordered + italic + muted. Two
variants exist for specific editorial registers.

### Display variant (case-study hero)

For the one major case-study quote that anchors the whole document:

```html
<blockquote class="vc-pullquote vc-pullquote--display">
  <p>"We expected a 2× improvement. We got 8×."</p>
  <cite>— @alice, lead engineer</cite>
</blockquote>
```

```css
.vc-pullquote--display {
  font-size: var(--vc-text-5, 32px);
  font-style: normal;
  font-weight: var(--vc-weight-bold, 700);
  color: var(--vc-color-content, #1f1a14);
  border-inline-start-width: 6px;
  padding-inline-start: var(--vc-space-5, 32px);
  margin-block: var(--vc-space-6, 48px);
}
```

The display variant is louder and bolder; use only on case studies
where there's a single quotable headline, never on whitepapers (which
are formal and the bold display variant would clash).

### Epigraph variant (chapter opening)

For long-form documents (whitepapers, design docs) opening with a
quotation that frames the whole text:

```html
<blockquote class="vc-pullquote vc-pullquote--epigraph">
  <p>Make everything as simple as possible, but not simpler.</p>
  <cite>— attributed to Albert Einstein</cite>
</blockquote>
```

```css
.vc-pullquote--epigraph {
  text-align: center;
  border: none;
  font-style: italic;
  color: var(--vc-color-content-muted, #5b5343);
  margin-block: var(--vc-space-6, 48px);
  font-size: var(--vc-text-3, 20px);
}
.vc-pullquote--epigraph cite {
  text-align: center;
  font-style: normal;
}
```

Epigraphs sit *before* the body of a section, not pulled from it. They
do NOT count against the one-per-page cap (because they're a
different convention) — but you still get only one epigraph per
chapter, and never both an epigraph and a body pull-quote in the
same chapter.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Border |
| `--vc-color-content-muted` | Default body italic color |
| `--vc-color-content-subtle` | Cite color |
| `--vc-color-content` | Display variant body |
| `--vc-text-3` / `--vc-text-5` | Default / display sizes |
| `--vc-space-2` / `--vc-space-4` / `--vc-space-5` / `--vc-space-6` | Padding + margin |

## Composition with other shapes

| Shape | Pull-quote? | Variant |
|---|---|---|
| `case-study-shape` | Yes (1 cap) | Display variant for the hero, default for body |
| `whitepaper-shape` | Yes (1 cap) | Default + optional epigraph at chapter openings |
| `feature-explainer-shape` | Yes (1 cap, optional) | Default |
| `concept-explainer-shape` | Yes (1 cap, optional) | Default — pull a key insight |
| `pr-writeup-author-side-shape` | No | TL;DR card serves the same purpose |
| `pr-review-reviewer-side-shape` | No | Use risk-map chips |
| `incident-postmortem-shape` | **No** | Slate TL;DR is the headline; pull-quote inappropriate |
| `status-report-shape` | No | Stat-band is the headline |
| `implementation-plan-shape` | No | TL;DR card serves |
| `rfc-shape` | No | Abstract section serves |
| `adr-decision-log-shape` | No | ADRs are short; no pull-quote needed |
| `retrospective-shape` | No | Quadrant grid is the structure |
| `design-system-doc-shape` | No | Reference doc, no narrative |

## Selection / comment notes

- The pull-quote is selectable as a unit
  (`{type:"pullquote"}`) so a reviewer can comment "this is not the
  best pull from the document".
- The `<cite>` is selectable independently — useful for
  "back-reference is wrong" comments.
- The pull-quote does NOT participate in `data-ve-prose` paragraph
  numbering — it is a re-iteration of body text, not a new
  paragraph. Numbering it would double-count.

## Anti-patterns

- **Two or more pull-quotes per page** — see the cap above.
- **Pull-quote whose text doesn't appear in the body** — defeats the
  *pull* contract; the reader scans the pull-quote, looks for it in
  the body, doesn't find it, and loses trust.
- **Pull-quote in a postmortem / status report** — wrong register.
  Use the slate TL;DR or stat-band.
- **Pull-quote with bold body text** (default variant) — the italic
  + muted color is the contract. Bold reads as the title, not a
  pulled quotation.
- **Pull-quote longer than 30 words** — pull-quotes are punchlines.
  Long quotations are body prose; restate them as a paragraph.
- **Pull-quote without a back-reference cite** — readers want to
  know where the quote came from. The cite costs one line and pays
  back in trust.
- **Pull-quote as the first thing on the page** — that's the
  epigraph variant, not the default. Use the epigraph variant
  intentionally, not by accident.
- **Decoration pull-quotes (`"And so we shipped."`)** — pull-quotes
  earn their space by carrying meaning. If the quote is decorative,
  cut it.
