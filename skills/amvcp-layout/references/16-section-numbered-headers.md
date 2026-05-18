# 16 — Section-numbered headers (the `<div class="sec-head">` pattern)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [The fake-heading concern](#the-fake-heading-concern)
- [When to use this pattern](#when-to-use-this-pattern)
- [Why a numeric badge instead of an automatic counter in the title](#why-a-numeric-badge-instead-of-an-automatic-counter-in-the-title)
- [Visual verification](#visual-verification)

A visually striking section-header pattern: a small numeric badge
(`01`, `02`, …) sits to the LEFT of the heading, plus an optional
"count" / metadata chip on the right. Visually establishes a
numbered outline at-a-glance and lets the eye track progress
through a long document. From the HTML-effectiveness catalog
(`index.html`, `01-exploration-code-approaches.html`,
`02-empty-states-explorer.html`, `16-implementation-plan.html`).

## What this is

A 3-cell flex strip per section header:

```
01     Section title                                          3 demos
^^     ^^^^^^^^^^^^^                                          ^^^^^^^
small  heading (h2 / h3)                                      optional
mono   the actual outline entry                               metadata
badge                                                         right-chip
```

The numeric badge is small, monospace, and visually subordinate to
the heading — it indexes the section without competing with the
title. The right-side chip is optional; common contents are demo
counts (`3 demos`), word counts (`1200 words`), reading times
(`6 min read`), or other section metadata.

## Scaffold to emit

```html
<header class="la-sec-head" data-ve-id="sec-head-01" data-ve-type="section">
  <span class="la-sec-head__num">01</span>
  <h2 class="la-sec-head__title">Asymmetric grids</h2>
  <span class="la-sec-head__meta">2 presets</span>
</header>

<!-- Section content goes here -->

<header class="la-sec-head" data-ve-id="sec-head-02" data-ve-type="section">
  <span class="la-sec-head__num">02</span>
  <h2 class="la-sec-head__title">Subgrid card alignment</h2>
  <span class="la-sec-head__meta">1 preset</span>
</header>
```

The CSS is not currently in `amvcp-layout.css` (it is a downstream
custom layout); add to the consuming page's stylesheet:

```css
.la-sec-head {
  display: flex;
  align-items: baseline;
  gap: var(--la-gap);
  padding-block: var(--la-gap-sm);
  border-block-end: 1px solid var(--vc-color-border);
  margin-block-end: var(--la-gap-lg);
}
.la-sec-head__num {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-font-sm, 14px);
  color: var(--vc-color-content-muted);
  font-variant-numeric: tabular-nums;  /* aligns 01 / 02 / 10 / 100 */
  min-inline-size: 2ch;                 /* reserve consistent width for 2-digit numbers */
}
.la-sec-head__title {
  flex: 1;
  margin: 0;
  font-family: var(--vc-font-heading, Georgia, serif);
  font-size: var(--vc-font-2xl, 28px);
  font-weight: var(--vc-weight-bold, 700);
}
.la-sec-head__meta {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-font-sm, 14px);
  color: var(--vc-color-content-muted);
}
```

For sections in a TOC, the numeric badge can be auto-generated via
CSS counters (no need to hand-write `01`, `02`):

```css
body { counter-reset: section; }
.la-sec-head { counter-increment: section; }
.la-sec-head__num::before {
  content: counter(section, decimal-leading-zero);
}
```

Then the HTML becomes:
```html
<header class="la-sec-head">
  <span class="la-sec-head__num"></span>  <!-- filled by CSS counter -->
  <h2 class="la-sec-head__title">…</h2>
</header>
```

The CSS counter approach is more robust to insertions / deletions
(reordering sections doesn't require re-numbering).

## Lib functions called

- `markLayoutAtoms()` does NOT include `.la-sec-head` in its SHAPES
  list, BUT the author hand-stamps `data-ve-id` on each header so
  the runtime treats it as a selectable atom (`section` type).
- The TOC's `initTOC()` will pick up the `<h2>` inside as a TOC
  entry automatically (it walks all `h2, h3` by default).

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap` | 16px | gap between badge / title / meta |
| `--la-gap-sm` | 8px | header padding-block |
| `--la-gap-lg` | 32px | margin below the header |
| `--vc-color-border` | (theme) | bottom border line |
| `--vc-color-content-muted` | (theme) | badge / meta text colour |
| `--vc-font-heading` | Georgia, serif | heading family |
| `--vc-font-mono` | ui-monospace | badge / meta family |
| `--vc-font-2xl` | 28px | heading size |
| `--vc-font-sm` | 14px | badge / meta size |
| `--vc-weight-bold` | 700 | heading weight |

## Selection / comment / decision-mini contract notes

The header is a selectable atom via the author's `data-ve-id`. A
reviewer can comment on the section header ("rename this section
to 'Layouts'", "remove the count chip"). The H2 inside is NOT
independently selectable (per the runtime's R4 rule — headings are
excluded).

The numeric badge text is purely decorative; it is not a separate
atom.

## The fake-heading concern

If the H2 inside is the ONLY non-whitespace child of a wrapping
paragraph (rather than a real `<h2>`), the runtime's
`stripFakeHeadingCommentIds()` would treat it as a fake heading and
strip its comment-id. The scaffold above uses a real `<h2>` element
so this concern does NOT apply — but if a downstream renderer
wraps headings in `<p><strong>…</strong></p>` (a markdown quirk),
the fake-heading rule kicks in. The fix is to ensure the renderer
emits real `<h2>` for outline headings.

## When to use this pattern

- A long document with multiple top-level sections (a tutorial, a
  case study, a multi-section report).
- A landing page with several "what's inside" sections.
- A documentation index page.

When NOT to use:
- A short article with no clear section divisions.
- A single-section page (a one-pager).
- A blog post (typically uses inline H2s without badges).

## Why a numeric badge instead of an automatic counter in the title

Some authors do `<h2>1. Section title</h2>`. This works but:
- The number is inside the heading text, so it's part of the
  outline entry (TOC shows "1. Section title", which is fine but
  visually heavier).
- The number is NOT styled differently from the title — same font,
  same weight, same colour.

The badge pattern keeps the number visually subordinate (smaller,
muted, mono), so the title gets full visual weight. The TOC entry
shows just "Section title" (the runtime picks up the H2's text,
not the badge's).

## Visual verification

Run the universal self-debug checklist before claiming this header
pattern is correct — see `skills/amvcp-self-debug-rules/SKILL.md`.

For section-numbered header correctness specifically:

- Open dev-browser. With sections 01-10 on the page, verify each
  badge's `min-inline-size: 2ch` keeps numbers aligned:
  ```js
  document.querySelectorAll('.la-sec-head__num').forEach(el => {
    console.log(el.textContent, el.getBoundingClientRect().width);
  });
  ```
  All badges' widths should be equal (within 1px). If not, the
  `tabular-nums` font-variant or the `min-inline-size: 2ch` is
  missing.
- If using CSS counters, verify the numbers increment correctly
  (each section's badge is the next integer).
- **R1 — Light + dark themes**: switch themes; the badge colour
  uses `--vc-color-content-muted`, which is theme-adapted.
  Confirm both themes are legible.
- The badge alignment with the title: the `align-items: baseline`
  on `.la-sec-head` puts the badge baseline-aligned with the
  heading text — so the badge "sits" with the heading, not
  centred vertically (which would look floaty).
- **R2 — No nested scrollbars**: an overly long meta chip
  ("very long sub-text that doesn't fit") must not introduce
  inner scroll; it should wrap to a new line or truncate via
  `text-overflow: ellipsis`.
