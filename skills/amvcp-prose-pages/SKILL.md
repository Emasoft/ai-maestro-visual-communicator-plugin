---
name: amvcp-prose-pages
description: "Author article-style publishable HTML — long-form prose with auto paragraph numbering (1.2.1), text-snippet selection, pull quotes, callouts, lead paragraphs, sticky-TOC. Use when the user wants an essay, blog post, long-form article, README-as-page, or text-heavy doc with selectable snippets. Trigger with 'publishable article', 'blog post', 'essay with pull quotes', 'long-form article', 'render this README', 'paragraph-numbered prose'."
license: MIT
metadata:
  author: Emasoft
---

# Prose Pages

## Overview

Loads when the page is text-led: essays, blog posts, articles, README-as-page, docs. `<article data-ve-prose>` enables auto paragraph numbering (`1.2.1`), text-snippet selection, pull quotes, callouts, lead paragraphs, sticky-TOC. Not the amvcp default — use only when content is genuinely text-led, not a diagram/table/dashboard.

## Prerequisites

Browser + Python 3.12+ runner (`scripts/amvcp-select.py`). `amvcp-runtime.js` auto-handles paragraph numbering and text-snippet selection when the wrapper carries `data-ve-prose`.

## Instructions

1. Read [prose-mode](./references/prose-mode.md) + Prose Page Elements in [css-patterns](../../references/css-patterns.md).
2. Pick a Voice from [styling-guide](../../references/styling-guide.md); typography from [libraries](../../references/libraries.md).
3. Wrap article: `<article data-ve-prose>...</article>`. Real `<h1>`/`<h2>`/`<h3>`/`<p>`. Never hand-number.
4. `<aside class="callout">` for tips; `<blockquote class="pullquote">` for one quote. Skip TOC under 4 sections; else copy [responsive-nav](./references/responsive-nav.md).
5. Standard `<script src="amvcp-runtime.js"></script>` + `--ve-accent` on `:root` per [interactive-selection-base](../../references/interactive-selection-base.md).
6. Open: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" page.html` (essays: `VE_SELECT_TIMEOUT=180`).
7. React: branch on `kind`. Paragraph clicks → `kind:"element"`/`type:"paragraph"`. Highlights → `kind:"text"`.

## Output

Text-snippet payload (highlight inside `[data-ve-prose]`, click "Ask about this snippet"):

```json
{"kind":"text","text":"highlighted phrase","depth":3,
 "paragraphId":"1.2.1","paragraphText":"…surrounding…"}
```

Paragraph clicks: `kind:"element"`, `type:"paragraph"`, `id:"ve-para-1.2.1"`. Recap label + paragraph number, ask: rewrite, move, expand, fact-check, translate, remove. Depths 1–7: [prose-mode](./references/prose-mode.md).

## Error Handling

- Manual `data-ve-id` per paragraph collides with auto `ve-para-X.Y.Z` — doubles marker.
- More than one pull quote per page loses impact. Cap at one.
- TOC under 4 sections is needless chrome. Skip it.
- Lead paragraph styled like body defeats its purpose. Use larger + lighter + different colour.

## Examples

1. Essay: `<article data-ve-prose>`, runtime auto-numbers; user double-clicks an insight; payload `kind:"text"`, `paragraphId:"2.1.3"`. Agent: "Rewrite, fact-check, or pull-quote?"
2. README-as-page: `<main data-ve-prose>`, sticky-TOC for 5+ `<h2>`; user clicks marker `1.2.1` → `kind:"element"`. Agent: "Move, expand, or trim?"

## Resources

- [prose-mode](./references/prose-mode.md) — numbering, snippet wire format
  - Paragraph numbering + text-snippet selection
  - Why opt-in via `data-ve-prose`
  - Authoring rules + response patterns
- [responsive-nav](./references/responsive-nav.md) — sticky-TOC, scroll-spy, mobile bar
  - Layout, CSS (sidebar + mobile), Scroll Spy JS, Adaptation
- [interactive-selection-base](../../references/interactive-selection-base.md) — wire format, depths 1–7
- [css-patterns](../../references/css-patterns.md) — Prose Page Elements (lead, pullquote, callout)
- [styling-guide](../../references/styling-guide.md) — Editorial / Paper-ink directions
- [libraries](../../references/libraries.md) — Typography by Voice
- [diagram-types](../../references/diagram-types.md) — Prose Accent Elements
