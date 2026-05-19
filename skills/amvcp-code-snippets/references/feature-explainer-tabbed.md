# Sub-technique E7 — Feature explainer with sticky TOC + tabbed code samples

## Table of Contents

- [E7.1 The shape](#e71-the-shape)
- [E7.2 The page layout](#e72-the-page-layout)
- [E7.3 The step-by-step `<details>` walkthrough](#e73-the-step-by-step-details-walkthrough)
- [E7.4 The tabbed code panel — Configuration section](#e74-the-tabbed-code-panel--configuration-section)
- [E7.5 The Files-Read provenance footer](#e75-the-files-read-provenance-footer)
- [E7.6 Anchor links + smooth scroll](#e76-anchor-links--smooth-scroll)
- [E7.7 The Gotchas / FAQ sections](#e77-the-gotchas--faq-sections)
- [E7.8 Selection / commenting flow](#e78-selection--commenting-flow)
- [E7.9 Light + dark verification](#e79-light--dark-verification)
- [E7.10 Tokens consumed](#e710-tokens-consumed)
- [E7.11 Mined source attribution](#e711-mined-source-attribution)

The feature-documentation page: sticky left TOC + TL;DR + step-by-step
`<details>` + tabbed code samples + callout + Gotchas + FAQ + "Files
read" provenance footer. Mined from `14-research-feature-explainer.html`
(html-effectiveness catalog #14).

## E7.1 The shape

A feature explainer documents HOW a feature works. The page has:

1. **Sticky left TOC** (H2/H3 entries — page navigation).
2. **TL;DR card** with clay-left-border.
3. **Step-by-step `<details>` walkthrough** for the "request path" (or
   data flow / state machine).
4. **Tabbed code samples** in the Configuration section (the same
   change from 3 angles — see [tabbed-code-panel.md](./tabbed-code-panel.md)).
5. **Star-callout** (oat tint + clay star icon).
6. **Gotchas** bullet list.
7. **FAQ** as `<dl>` with serif `<dt>`s.
8. **Files read** provenance footer (mono file paths).

This reference focuses on the CODE-related sections (3, 4, 8) and how
they compose with the rest. The TOC, TL;DR card, callout, Gotchas, and
FAQ are owned by `amvcp-prose-pages` / `amvcp-report-doc`.

## E7.2 The page layout

```html
<main class="ve-feature-explainer">
  <aside class="ve-feature-explainer__toc">
    <h2>On this page</h2>
    <ol>
      <li><a href="#request-path">Request path</a></li>
      <li><a href="#configuration">Configuration</a></li>
      <li><a href="#gotchas">Gotchas</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ol>
    <h3>Files read</h3>
    <ul class="ve-files-read">
      <li><code class="inline">src/api/rate-limit.ts</code></li>
      <li><code class="inline">infra/config/limits.yaml</code></li>
      <li><code class="inline">tests/api/rate-limit.test.ts</code></li>
    </ul>
  </aside>

  <article class="ve-feature-explainer__content">
    <h1>How rate limiting works</h1>
    <aside class="ve-tldr-card">
      <h2>TL;DR</h2>
      <p>Sliding-window counter per user-id, stored in Redis. Pro plan
         is 600 rpm, free is 60 rpm. Bursts up to 10 over the limit are
         allowed before 429.</p>
    </aside>

    <section id="request-path">
      <h2>The request path</h2>
      <!-- step-by-step <details> walkthrough — see E7.3 -->
    </section>

    <section id="configuration">
      <h2>Configuration</h2>
      <p>The limit is defined in three places. Toggle to see each
         perspective:</p>
      <!-- tabbed code panel — see E7.4 -->
    </section>

    …callout, Gotchas, FAQ…
  </article>
</main>
```

CSS:

```css
.ve-feature-explainer {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  max-width: 1100px;
  margin: 0 auto;
}
.ve-feature-explainer__toc {
  position: sticky;
  top: 24px;
  align-self: start;
  font-size: var(--vc-text-small);
}
.ve-feature-explainer__toc h2,
.ve-feature-explainer__toc h3 {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: var(--vc-text-small);
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--vc-color-neutral-700);
}
.ve-feature-explainer__toc ol,
.ve-feature-explainer__toc ul {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}
.ve-feature-explainer__toc a {
  display: block;
  padding: 4px 0;
  color: var(--vc-color-neutral-500);
  text-decoration: none;
}
.ve-feature-explainer__toc a:hover {
  color: var(--ve-accent);
}
@media (max-width: 900px) {
  .ve-feature-explainer { grid-template-columns: 1fr; }
  .ve-feature-explainer__toc { position: static; margin-bottom: 24px; }
}
```

## E7.3 The step-by-step `<details>` walkthrough

Same machinery as
[collapsed-snippets-walkthrough.md](./collapsed-snippets-walkthrough.md):

```html
<ol class="ve-code-walkthrough">
  <li class="ve-code-step">
    <div class="ve-code-step__head">
      <span class="ve-code-step__badge">1</span>
      <span class="ve-code-step__path">src/api/rate-limit.ts</span>
      <span class="ve-code-step__lines">L23-L42</span>
    </div>
    <p>The middleware extracts the user-id from the JWT…</p>
    <details><summary>Show source</summary>
      <div class="ve-code-block"><pre><code class="language-typescript">…</code></pre></div>
    </details>
  </li>
  …
</ol>
```

ONE OF the steps may be `open` by default — typically the first, or
the "you're going to ask about this" step.

## E7.4 The tabbed code panel — Configuration section

Three perspectives on the same rate-limit config:

```html
<div class="ve-code-tabs" data-ve-code-tabs>
  <div class="ve-code-tabs__bar">
    <button class="ve-code-tabs__btn on" data-t="0">limits.yaml</button>
    <button class="ve-code-tabs__btn"    data-t="1">route.ts</button>
    <button class="ve-code-tabs__btn"    data-t="2">client-response.json</button>
  </div>
  <div class="ve-code-tabs__panels">
    <pre class="on" data-pane="0"><code class="language-yaml">…</code></pre>
    <pre        data-pane="1"><code class="language-typescript">…</code></pre>
    <pre        data-pane="2"><code class="language-json">…</code></pre>
  </div>
</div>
```

Mined catalog quote: *"The **tabbed code panel** (3 perspectives on
the same change: yaml → route.ts → client response) is the cleanest
way to show 'the same thing from 3 angles' without a wall of code."*

## E7.5 The Files-Read provenance footer

A list of MONO file paths showing what the AI agent READ to write
this doc. Establishes traceability:

```html
<aside class="ve-files-read-footer">
  <h3>Files read</h3>
  <ul>
    <li><code class="inline">src/api/rate-limit.ts</code></li>
    <li><code class="inline">infra/config/limits.yaml</code></li>
    <li><code class="inline">tests/api/rate-limit.test.ts</code></li>
    <li><code class="inline">docs/runbook/rate-limits.md</code></li>
  </ul>
</aside>
```

In the catalog version, this lives at the BOTTOM of the sidebar
(under the TOC) — see the markup in §E7.2. As an alternative, it can
be a horizontal strip at the bottom of the page.

Each path is a `<code class="inline">` chip — selectable, copyable,
visually distinct from prose mentions.

## E7.6 Anchor links + smooth scroll

TOC entries link to section IDs (`#request-path`). The browser
default smooth-scroll works (via `html { scroll-behavior: smooth; }`).
No JS needed for the basic case.

For a 1.4s outline pulse on landing (as in `03-code-review-pr`'s
chip pattern), add the same JS as in
[keyword-arrow-highlight.md](../../amvcp-code-syntax/references/keyword-arrow-highlight.md) §C3.4.

## E7.7 The Gotchas / FAQ sections

These are PROSE — owned by `amvcp-prose-pages` / `amvcp-report-doc`.
This reference documents only the code-related sections (3, 4, 8). For
the prose-side patterns, see the respective skill references.

## E7.8 Selection / commenting flow

Reader is in section 2 (request path), expands step 2, selects line
35. Comment pill anchors to step 2's code block. Payload includes the
step number, the file path, the line range, and the selected line —
plus the page section (`request-path`) so the agent knows the broader
context.

This is the cleanest possible context for a "I have a question about
this specific code in this specific section" interaction.

## E7.9 Light + dark verification

- [ ] Sticky TOC readable on both themes (left-aligned text, gray-500
      on hover-accent)
- [ ] TL;DR card border readable on both themes
- [ ] Walkthrough step badges + paths readable on both themes
- [ ] Tabbed code panel active/inactive tabs readable on both themes
- [ ] Files-read footer chips readable on both themes
- [ ] Anchor-link pulse animation works on both themes

## E7.10 Tokens consumed

- All from [collapsed-snippets-walkthrough.md](./collapsed-snippets-walkthrough.md)
- All from [tabbed-code-panel.md](./tabbed-code-panel.md)
- All from [code-block-with-tab-bar.md](../../amvcp-code-syntax/references/code-block-with-tab-bar.md)
- All from [inline-code-chip.md](../../amvcp-code-syntax/references/inline-code-chip.md)
- `--vc-color-neutral-500` / `-700` — TOC neutrals
- `--ve-accent` — TOC hover, TL;DR border

## E7.11 Mined source attribution

Catalog quote from §3.13 report-doc shapes, source `14-research-
feature-explainer.html`:

> *"Feature explainer shape: Sticky TOC + TL;DR + step-by-step
> `<details>` walkthrough + tabbed code samples + callout + Gotchas +
> FAQ + 'Files read' provenance footer."*

Adopted as the canonical feature-explainer composition.
