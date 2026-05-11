---
name: amvcp-prose-pages
description: "Author article-style publishable HTML — long-form prose with auto paragraph numbering (1.2.1), text-snippet selection, pull quotes, callouts, lead paragraphs, sticky-TOC. Use when the user wants an essay, blog post, long-form article, README-as-page, or text-heavy doc with selectable snippets. Trigger with 'publishable article', 'blog post', 'essay with pull quotes', 'long-form article', 'render this README', 'paragraph-numbered prose'."
license: MIT
metadata:
  author: Emasoft
---

# Prose Pages

## Overview

Text-led pages: essays, blog posts, articles, README-as-page. `<article data-ve-prose>` enables auto numbering (`1.2.1`), text-snippet selection, pull quotes, callouts, lead paragraphs, sticky-TOC. Not the amvcp default.

## Prerequisites

Browser + Python 3.12+ runner. `amvcp-runtime.js` auto-handles numbering + text-snippet selection on `data-ve-prose`.

## Instructions

1. Read prose-mode + css-patterns Prose Page Elements.
2. Pick a Voice from styling-guide; typography from libraries.
3. Wrap: `<article data-ve-prose>`. Real `<h1>`/`<h2>`/`<h3>`/`<p>`. Never hand-number.
4. `<aside class="callout">` for tips; `<blockquote class="pullquote">` ≤1 per page. TOC if 4+ sections.
5. `<script src="amvcp-runtime.js"></script>` + `--ve-accent` on `:root`.
6. Open: `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" page.html`.
7. React: paragraph clicks → `kind:"element"`/`type:"paragraph"`. Highlights → `kind:"text"`.

## Output

```json
{"kind":"text","text":"highlighted phrase","depth":3,
 "paragraphId":"1.2.1","paragraphText":"…surrounding…"}
```

Paragraph clicks: `kind:"element"`, `id:"ve-para-1.2.1"`. Recap + ask: rewrite, move, expand, fact-check.

## Error Handling

- Manual `data-ve-id` collides with auto `ve-para-X.Y.Z`.
- >1 pull quote loses impact. Cap at one.
- TOC under 4 sections — skip.
- Lead paragraph styled like body — use larger + lighter.

## Examples

1. Essay: runtime auto-numbers; double-click insight → `kind:"text"`, `paragraphId:"2.1.3"`.
2. README-as-page: sticky-TOC; click marker `1.2.1` → `kind:"element"`.

## Resources

- [prose-mode](./references/prose-mode.md) — numbering, snippet wire format
  - Paragraph numbering + text-snippet selection
  - Text-snippet selection
  - Why opt-in via `data-ve-prose`
  - Authoring rules for prose pages
  - Reference response patterns
- [responsive-nav](./references/responsive-nav.md) — sticky-TOC, scroll-spy, mobile bar
  - Layout Structure
  - CSS
  - JavaScript — Scroll Spy
  - Adaptation Notes
- [interactive-selection-base](../../references/interactive-selection-base.md) — wire format, depths 1–7
  - How it works & Page Setup
  - The selection payload
  - Selectable Elements
  - Engine routing — read this BEFORE generating a graph
  - Runtime & Process Caveats
- [css-patterns](../../references/css-patterns.md) — Prose Page Elements (lead, pullquote, callout)
  - Theme & Atmosphere
  - Layout & Containers
  - Content Blocks
  - Visual Components
  - Prose Page Elements
- [styling-guide](../../references/styling-guide.md) — Editorial / Paper-ink directions
  - Aesthetic directions
  - Typography & Color
  - Surfaces, Hierarchy & Animation
  - Engines & Illustrations
- [libraries](../../references/libraries.md) — Typography by Voice
  - Mermaid.js — Diagramming Engine
  - Chart.js — Data Visualizations
  - anime.js — Orchestrated Animations
  - Google Fonts — Typography
- [diagram-types](../../references/diagram-types.md) — Prose Accent Elements
  - Diagrams (Mermaid + CSS)
  - Data Visualizations
  - Documentation Layouts
  - Prose Accent Elements
