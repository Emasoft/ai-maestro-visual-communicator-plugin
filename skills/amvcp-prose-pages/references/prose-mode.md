# Prose Mode (`data-ve-prose`)

## Table of contents

- [Paragraph numbering + text-snippet selection](#paragraph-numbering--text-snippet-selection)
- [Text-snippet selection](#text-snippet-selection)
- [Why opt-in via `data-ve-prose`](#why-opt-in-via-data-ve-prose)
- [Authoring rules for prose pages](#authoring-rules-for-prose-pages)
- [Reference response patterns](#reference-response-patterns)

How to render publishable, article-style pages where each paragraph is selectable and the user can highlight any phrase to ask Claude about it. For the cross-cutting selection wire format (including the depth-grammar for inline / block / math / code grammars 1-7), read `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` first — the per-depth contract is documented there in detail.

---

## Paragraph numbering + text-snippet selection

For purely explanatory pages (READMEs, articles, blog posts, essays, design docs), wrap the prose content in a container with `data-ve-prose`:

```html
<article data-ve-prose>
  <h1>Title</h1>
  <p>Lead paragraph.</p>

  <h2>First section</h2>
  <p>Content of section 1.</p>
  <p>Another paragraph in section 1.</p>

  <h3>Sub-section</h3>
  <p>Deeper paragraph.</p>

  <h2>Second section</h2>
  <p>…</p>
</article>
```

The runtime walks the container, **assigns hierarchical numbers** (`1`, `1.1`, `1.1.1`, `1.1.2`, …) to every heading and paragraph, and **inserts a small monospace marker** (`<a class="ve-pnum">`) at the start of each. Numbering scheme:

| Element                       | Number |
|-------------------------------|--------|
| `<h1>` (top-level section)    | `1`, `2`, `3`, …                  |
| `<h2>` (subsection)           | `1.1`, `1.2`, …                   |
| `<h3>` (sub-subsection)       | `1.1.1`, `1.1.2`, …               |
| `<p>` after `<h2>`            | `1.1.1`, `1.1.2`, …               |
| `<p>` after `<h3>`            | `1.1.1.1`, `1.1.1.2`, …           |
| `<p>` before any heading      | `0.1`, `0.2`, …                   |

Each numbered element becomes a `data-ve-id` selectable. **Click the paragraph (or its number marker)** → sends a `paragraph` selection:

```json
{
  "id": "ve-para-1.1.2",
  "type": "paragraph",
  "label": "Paragraph 1.1.2 — Another paragraph in section 1.",
  "data": null
}
```

…and the agent can act: "move this paragraph to the start", "rewrite this section", "delete paragraph 1.1.2".

## Text-snippet selection

Inside `[data-ve-prose]`, when the user **highlights text with the mouse** (a normal selection), a small floating **"Ask about this snippet"** button appears above the selection. Clicking it sends:

```json
{
  "id": "ve-snippet-1.1.2-1",
  "type": "text-snippet",
  "label": "the part the user highlighted, truncated to ~120 chars",
  "data": {
    "text": "the full highlighted text, no truncation",
    "paragraphId": "1.1.2",
    "paragraphNumber": "1.1.2",
    "paragraphText": "the entire surrounding paragraph"
  }
}
```

This lets the user pick out any phrase — not just a whole paragraph — and ask Claude to clarify it, rewrite it, or use it as input to a subsequent action ("turn this snippet into a tagline", "fact-check this sentence", "translate this paragraph", "move this snippet to the conclusion").

The popup also has a "Cancel" button. Clicking outside the popup or starting a new selection clears it. Scrolling clears it (so it doesn't drift away from the highlighted text).

## Why opt-in via `data-ve-prose`

The text-snippet popup is a meaningful UX commitment: it overrides normal copy-paste affordances and adds a hovering button to text selections. That makes sense for prose pages where the user is *reading and reacting*, but would be noise on a diagram page where they probably just want to read a label. Opt in only when the page is truly text-first.

For diagrams + tables + dashboards, **don't** add `data-ve-prose` — single-element click is the right interaction model there.

## Authoring rules for prose pages

- Wrap the article in `<article data-ve-prose>` (or `<main data-ve-prose>`, or any container)
- Use real `<h1>` / `<h2>` / `<h3>` headings — the numbering walks the heading hierarchy
- Use real `<p>` / `<blockquote>` for paragraphs — the runtime numbers these specifically
- **Don't** number paragraphs yourself; the runtime does it. If the author hand-numbers, the marker will be doubled
- **Don't** apply `data-ve-prose` to a container that holds tables, charts, or diagrams — the prose walker only handles headings/paragraphs and ignores those, but the text-snippet popup will fight with the diagram interactions

## Reference response patterns

After receiving a `paragraph` or `text-snippet` selection, the agent can ask:

> You selected **paragraph 1.1.2** ("Another paragraph in section 1."). What do you want me to do — rewrite it, move it (where to?), expand it, or remove it?
>
> You highlighted **"a clever turn of phrase"** in paragraph 1.1.2. What do you want me to do — explain it, rewrite it, fact-check it, move it elsewhere, or use it as input to another action?

The user's response then becomes a normal edit task — re-generate the page after applying the change.
