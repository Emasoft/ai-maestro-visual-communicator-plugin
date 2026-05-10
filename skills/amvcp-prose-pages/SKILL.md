---
name: amvcp-prose-pages
description: "Author article-style publishable HTML pages — long-form prose with paragraph numbering (1.2.1 etc.), text-snippet selection (user double-clicks to select a substring), pull quotes, callout boxes, lead paragraphs, and multi-section sticky-TOC navigation. Use when the user wants to publish an essay, blog post, long-form article, README rendered as a page, documentation, or any text-heavy publishable document with selectable snippets. Trigger: 'publishable article', 'blog post', 'essay with pull quotes', 'long-form article', 'render this README beautifully', 'publishable document', 'paragraph-numbered prose'."
license: MIT
compatibility: "Browser + Python 3.12+ via amvcp-select.py. amvcp-runtime.js handles paragraph numbering + text-snippet selection when the article wrapper has data-ve-prose."
metadata:
  author: Emasoft
---

# Prose Pages

Publishable article-style HTML — essays, blog posts, long-form docs — every paragraph auto-numbered, every text snippet selectable.

## When this skill loads

For **text-first publications**, not diagrams or tables. Triggers: *"publishable article"*, *"blog post"*, *"essay with pull quotes"*, *"render this README as a page"*, *"long-form documentation"*, *"paragraph-numbered prose"*. **Not** the amvcp default — switch in only when the page is genuinely text-led.

## Anatomy of a prose page

- **Lead paragraph** — first `<p>` after the title; larger, lighter.
- **Body paragraphs** — auto-numbered `1.2.1`, `1.2.2` by the runtime. Do NOT hand-number.
- **Pull quote** — `<blockquote class="pullquote">`. One per page max.
- **Callout box** — `<aside class="callout">` for tips / warnings / side-notes.
- **Sticky TOC** — only when 4+ top-level sections.

## How to author

1. **Read references** — `./references/prose-mode.md` (wire format) + `${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md` (Prose Page Elements).
2. **Pick a Voice** — editorial aesthetic from `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md`; typography via `${CLAUDE_PLUGIN_ROOT}/references/libraries.md` Typography by Content Voice.
3. **Wrap the article** — `<article data-ve-prose>...</article>` enables paragraph numbering + snippet popup. Use real `<h1>` / `<h2>` / `<h3>` / `<p>`.
4. **Open with the runner** — `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html`. Explanatory pages: `VE_SELECT_TIMEOUT=180`.
5. **React** — branch on `kind`. Paragraph clicks send `kind:"element"`, `type:"paragraph"`. Highlights send `kind:"text"` (below).

## Mandatory wiring

- `<article data-ve-prose>` (or `<main data-ve-prose>`) — the only switch that turns on paragraph numbering + snippet popup. Without it the runtime treats the page like a selectable diagram.
- `<aside class="callout">` for tips / warnings; `<blockquote class="pullquote">` for emphasis.
- 4+ sections: copy the sticky-TOC pattern from `./references/responsive-nav.md` (sidebar desktop, horizontal bar mobile, IntersectionObserver scroll-spy). Below 4, skip the TOC.
- Standard `<script src="amvcp-runtime.js"></script>` and `--ve-accent` on `:root` — same as every amvcp page (see `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md`).

## Selection payload — text snippets

When the user **highlights text inside `[data-ve-prose]`**, an *"Ask about this snippet"* button appears. Clicking it sends:

```json
{"kind":"text","text":"the highlighted phrase","depth":3,
 "paragraphId":"1.2.1","paragraphText":"…surrounding paragraph…"}
```

Paragraph or marker clicks send `kind:"element"`, `type:"paragraph"`, `id:"ve-para-1.2.1"`. Recap (label + paragraph number), ask what to do — rewrite, move, expand, fact-check, translate, remove. Full schema, depth-grammar (1–7), popup behaviour: `./references/prose-mode.md`.

## Resources

**Plugin-shared (`${CLAUDE_PLUGIN_ROOT}/references/`):** **interactive-selection-base** (wire format + boilerplate), **css-patterns** (Prose Page Elements: lead, pull quote, callout, divider), **libraries** (Typography by Content Voice), **styling-guide** (Editorial / Paper-ink), **anti-patterns** (Slop Test), **diagram-types** (Prose Accent Elements).

**Skill-local (`./references/`):** **prose-mode** (numbering algorithm, snippet wire format, payload schema), **responsive-nav** (sticky-TOC pattern, scroll-spy, mobile bar fallback).

## Anti-patterns

- **Manual `data-ve-id` on every paragraph.** `data-ve-prose` on the wrapper auto-numbers; manual ids collide with `ve-para-X.Y.Z` and double the marker.
- **More than one pull quote per page.** They lose all impact when stacked. One maximum.
- **Multi-section TOC with fewer than 4 sections.** Adds nav chrome with zero benefit.
- **Lead paragraph styled identically to body.** Larger size + lighter weight + different colour — see Prose Page Elements in `css-patterns`.
