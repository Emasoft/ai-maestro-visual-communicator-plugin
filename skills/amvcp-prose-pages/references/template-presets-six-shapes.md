# The 6 template presets — `vc-doc--<name>` modifiers

## Table of Contents

- [When to pick which template](#when-to-pick-which-template)
- [What each template adds](#what-each-template-adds)
- [Picking the right template — decision tree](#picking-the-right-template--decision-tree)
- [Template stacking](#template-stacking)
- [Template + shape mapping](#template--shape-mapping)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition](#composition)
- [Lib API](#lib-api)
- [Anti-patterns](#anti-patterns)

The 6 template names exposed by `amvcp-report-doc.js` as
`TEMPLATES`: `executive-summary`, `technical-report`, `case-study`,
`proposal`, `whitepaper`, `design-system-doc`. Each is a `.vc-doc--
<name>` CSS class on `<article class="vc-doc">`. **A template only
varies the reading measure + (whitepaper) the heading-counter
style + (executive-summary) the header treatment.** Nothing else.

The contract is deliberate: by keeping the only differences
typographic (measure) and structural (header), every document looks
like a member of the same family. The DESIGN.md tokens supply 100% of
the color/typography/spacing/radius/shadow discipline; the template
just picks the page width.

## When to pick which template

| Template | When | Reading measure |
|---|---|---|
| `executive-summary` | One-page leadership briefing; oversized title sets the tone | 72ch (wider, breathing room) |
| `technical-report` | Engineering writeups, postmortems, status reports — the most-used template | 66ch (standard) |
| `case-study` | Narrative-driven story (project history, customer case study, design retrospective) | 60ch (denser, page-turner) |
| `proposal` | Implementation plan, RFC, ADR — anything proposing a path forward | 66ch (standard) |
| `whitepaper` | Formal long-form document with auto-numbered sections (decimal-leading-zero) | 64ch (slightly narrower for legibility) |
| `design-system-doc` | Reference document of tokens, components, usage rules | 80ch (widest, accommodates token tables + component examples side-by-side) |

The reading-measure differences are subtle (60ch ↔ 80ch) but
material — they affect line length, scrollable depth, and the
density of horizontal eye movement.

## What each template adds

### `executive-summary`

Bold oversized title block. The h1 sits at `--vc-text-6` (default
48px), bold weight. The reader's first 2 seconds are spent on the
title; the template pushes the title to fill that attention.

```css
.vc-doc--executive-summary { --vc-doc-measure: 72ch; }
.vc-doc--executive-summary .vc-doc-header h1 {
  font-size: var(--vc-text-6, 48px);
  font-weight: var(--vc-weight-bold, 700);
}
```

### `technical-report`

The plain-vanilla template. No additional rules beyond the reading
measure. Use as the default unless you have a reason to pick
another.

```css
.vc-doc--technical-report { --vc-doc-measure: 66ch; }
```

### `case-study`

Tight reading measure (60ch) for narrative density. Pairs with the
pull-quote primitive — case studies are the canonical home of pull
quotes (one per page).

```css
.vc-doc--case-study { --vc-doc-measure: 60ch; }
```

### `proposal`

Same measure as technical-report. The template name carries
semantic meaning more than visual difference — using
`vc-doc--proposal` on an implementation-plan signals "this is a
forward-looking deliverable" to readers and to downstream tooling.

```css
.vc-doc--proposal { --vc-doc-measure: 66ch; }
```

### `whitepaper`

Cover-style header (centered text, larger top padding) + auto-
numbered sections via CSS counter (decimal-leading-zero):

```css
.vc-doc--whitepaper { --vc-doc-measure: 64ch; }
.vc-doc--whitepaper .vc-doc-header {
  text-align: center;
  padding-block: var(--vc-space-6, 48px);
}
.vc-doc--whitepaper { counter-reset: vc-sec; }
.vc-doc--whitepaper h2 { counter-increment: vc-sec; }
.vc-doc--whitepaper h2::before {
  content: counter(vc-sec, decimal-leading-zero) "  ";
  color: var(--vc-color-accent, #b8861f);
  font-feature-settings: "tnum";
}
```

The whitepaper template is the only one that auto-numbers — every
other template numbers manually (or not at all). See
`section-numbering-leading-zero.md`.

### `design-system-doc`

Widest measure (80ch) so token tables, type-scale rows, and
component examples can sit side-by-side without overflow. The
template carries no other special rules.

```css
.vc-doc--design-system-doc { --vc-doc-measure: 80ch; }
```

## Picking the right template — decision tree

```
Q1. Is this a forward-looking deliverable (proposing future work)?
    Yes → Q2
    No  → Q3

Q2. Does it need formal numbering (RFC-style)?
    Yes → whitepaper
    No  → proposal

Q3. Is the audience executive (leadership)?
    Yes → executive-summary
    No  → Q4

Q4. Is this a reference document (tokens / components)?
    Yes → design-system-doc
    No  → Q5

Q5. Is the document narrative (story-driven)?
    Yes → case-study
    No  → technical-report
```

When in doubt, pick `technical-report`. It is the most-used template
and the safest default.

## Template stacking

A document gets EXACTLY ONE template class. Stacking
(`.vc-doc.vc-doc--whitepaper.vc-doc--case-study`) is undefined
behavior — the last-defined CSS rule wins, but the visual result is
unpredictable.

If you need behavior from two templates (e.g. whitepaper's auto-
numbering + executive-summary's bold title), pick one template and
add the missing rule via custom CSS:

```html
<article class="vc-doc vc-doc--whitepaper vc-doc--big-title">…</article>
```

```css
.vc-doc--big-title .vc-doc-header h1 {
  font-size: var(--vc-text-6, 48px);
  font-weight: var(--vc-weight-bold, 700);
}
```

This is more honest than implicitly stacking templates.

## Template + shape mapping

The `report-doc` skill ships **6 templates** AND **15+ document
shapes** (see the shape references). The shape tells you *what
sections to author*; the template tells you *what reading measure*.
Pick both:

| Shape | Recommended template |
|---|---|
| `executive-summary` | `vc-doc--executive-summary` |
| `technical-report` (status report, runbook) | `vc-doc--technical-report` |
| `case-study` | `vc-doc--case-study` |
| `proposal` | `vc-doc--proposal` |
| `whitepaper` | `vc-doc--whitepaper` |
| `design-system-doc` | `vc-doc--design-system-doc` |
| `implementation-plan-shape` | `vc-doc--proposal` |
| `pr-writeup-author-side-shape` | `vc-doc--proposal` |
| `pr-review-reviewer-side-shape` | `vc-doc--technical-report` |
| `feature-explainer-shape` | `vc-doc--technical-report` |
| `architecture-explainer-shape` | `vc-doc--technical-report` |
| `concept-explainer-shape` | `vc-doc--technical-report` |
| `compare-n-approaches-shape` | `vc-doc--proposal` |
| `visual-design-exploration-shape` | `vc-doc--proposal` |
| `incident-postmortem-shape` | `vc-doc--technical-report` |
| `rfc-shape` | `vc-doc--whitepaper` (auto-numbered sections) |
| `adr-decision-log-shape` | `vc-doc--technical-report` (with `.vc-adr` measure override) |
| `retrospective-shape` | `vc-doc--technical-report` |
| `status-report-shape` | `vc-doc--technical-report` |
| `change-log-document-shape` | (embedded — no template needed) |

## DESIGN.md tokens consumed

All 6 templates read the SAME `--vc-*` token surface. The only
template-specific use of tokens is in `vc-doc--whitepaper`:

| Token | Used in (whitepaper-specific) |
|---|---|
| `--vc-color-accent` | Section number color |
| (everything else) | Inherited from `vc-doc` shared rules |

The fact that the templates are token-identical is intentional. A
DESIGN.md override that changes the accent color reskins ALL six
templates simultaneously.

## Composition

Templates are not "composed" — they are picked. The document gets
one template class, one shape, and many embedded element-skill
primitives.

## Lib API

```js
window.amvcpReportDoc.TEMPLATES;
// → ['executive-summary', 'technical-report', 'case-study',
//    'proposal', 'whitepaper', 'design-system-doc']
```

For tooling that wants to enumerate the valid templates:

```js
const validTemplate = window.amvcpReportDoc.TEMPLATES.includes(name);
if (!validTemplate) throw new Error(`Unknown template: ${name}`);
```

## Anti-patterns

- **Inventing a 7th template (`vc-doc--memo`, `vc-doc--briefing`)** —
  the 6 cover the design space. Adding more fragments the
  vocabulary; the marginal value of a 7th template is near zero.
- **Picking `vc-doc--design-system-doc` for a non-reference
  document** — the 80ch measure makes prose unreadable. Use only
  for actual design-system docs.
- **Picking `vc-doc--whitepaper` for a casual document** — the
  centered cover header reads as pomposity in casual contexts.
- **Skipping the template class entirely** — the document gets the
  default 68ch measure; no auto-numbering, no executive-summary
  bold title. Fine for a quick scratch but not for a published
  artifact.
- **Manual numbering on a `vc-doc--whitepaper`** — the auto-counter
  AND your manual numbers double-up. Pick one.
- **Per-template font overrides** — every template uses the same
  fonts (`--vc-font-heading`, `--vc-font-body`, `--vc-font-mono`).
  Per-template font overrides break the family resemblance.
- **`vc-doc--technical-report` with custom `--vc-doc-measure`
  override** — defeats the template's purpose. If you need a custom
  measure, define a custom template (`vc-doc--my-doc`) with its
  own measure; do not patch one of the 6.
- **Mixing template class with another doc framework's class
  (`vc-doc--technical-report.markdown-body`)** — both fight for
  styling control. Use one or the other.
