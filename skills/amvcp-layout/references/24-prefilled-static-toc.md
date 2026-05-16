# 24 — Pre-filled static TOC (the JS-off graceful path)

When the author pre-fills the `.la-toc__list` with hand-written
`<li><a>` entries, `initTOC()` SKIPS the build step but still
wires the live `.is-active` highlight. The result: with JS on, the
TOC behaves identically to an auto-built one; with JS off, the
TOC's anchor links still work (the browser handles `href="#…"`
navigation). This is the layout's solution to graceful degradation.

## What this is

The `amvcp-layout.js` `wireOneToc()` function checks whether the
`.la-toc__list` has any element children:

```js
if (!hasElementChild(list)) {
  buildTocList(doc, list, headings);
}
return observeHeadings(toc, headings);
```

If empty → build the list from document headings.
If non-empty → respect the author's static list; do NOT rebuild.

In both cases, `observeHeadings()` runs and wires the
`IntersectionObserver` for the active-link highlight. So a
pre-filled TOC still gets the live behaviour when JS is on.

## Scaffold to emit

```html
<nav class="la-toc"
     data-ve-id="toc"
     data-ve-type="section"
     aria-label="On this page">
  <ol class="la-toc__list">
    <li><a href="#introduction" data-depth="2">Introduction</a></li>
    <li><a href="#design" data-depth="2">Design</a></li>
    <li><a href="#design-grid" data-depth="3">Grid system</a></li>
    <li><a href="#design-spacing" data-depth="3">Spacing scale</a></li>
    <li><a href="#implementation" data-depth="2">Implementation</a></li>
    <li><a href="#testing" data-depth="2">Testing</a></li>
    <li><a href="#conclusion" data-depth="2">Conclusion</a></li>
  </ol>
</nav>
```

The article body must have headings with matching ids:

```html
<article class="la-article">
  <h2 id="introduction">Introduction</h2>
  <p>…</p>
  <h2 id="design">Design</h2>
  <p>…</p>
  <h3 id="design-grid">Grid system</h3>
  <p>…</p>
  <h3 id="design-spacing">Spacing scale</h3>
  <p>…</p>
  <h2 id="implementation">Implementation</h2>
  <p>…</p>
  <h2 id="testing">Testing</h2>
  <p>…</p>
  <h2 id="conclusion">Conclusion</h2>
  <p>…</p>
</article>
```

The `data-depth="2"` / `data-depth="3"` on the anchor matches the
heading level, so the CSS in ref 21 indents h3 entries.

## When to pre-fill the TOC

- The TOC entries differ from the heading text (e.g. abbreviated
  TOC entries for long headings: heading `<h2>The grid system that
  ai-maestro uses everywhere</h2>`, TOC entry `<a>The grid system</a>`).
- The TOC needs to SKIP some headings (an "Appendix" section that
  shouldn't appear in the navigator).
- The TOC needs to ADD entries that aren't on the page (a link to
  an external glossary, a print-this-page link).
- The page targets users who may have JS disabled (accessibility
  audits, ultra-conservative environments).

If you don't need any of those, leave the `<ol>` empty and let
`initTOC()` auto-build it — that's the simpler path.

## When NOT to pre-fill

- The TOC entries match the heading text exactly AND
- The page is "JS-required" anyway (most modern apps).

In those cases, the auto-build path is simpler — no manual sync
needed when headings change.

## Lib functions called

- `wireOneToc()` calls `hasElementChild(list)`. If true, the build
  step is skipped.
- `observeHeadings()` always runs — the live highlight works for
  both auto-built and pre-filled TOCs.
- `collectHeadings()` still runs to ensure headings have ids
  (slugifying any without). For a pre-filled TOC where the author
  has set explicit ids on headings, `collectHeadings()` finds them
  unchanged. For headings without ids, slugged ids are generated —
  but the pre-filled TOC won't link to them unless the author also
  added the slugged ids to the `href` values. So: pre-fill = author
  is responsible for ID consistency.

## DESIGN.md tokens used

Same as ref 21 — see the TOC link styling table.

## Selection / comment / decision-mini contract notes

Same as ref 21. The TOC is a selectable atom; the pre-fill
behaviour doesn't change the selection model.

A reviewer comment "the TOC is showing too many entries" can be
addressed by either: removing the offending entries from the
pre-filled `<ol>` (if pre-filled); or adding
`data-la-toc-headings="h2"` to limit to top-level headings (if
auto-built).

## The ID-collision case

`collectHeadings()` seeds the "used ids" set with every `[id]`
element on the page. When auto-generating slug-ids, it picks
unique ones. But if the author pre-fills TOC `href` values that
reference headings whose ids haven't been set yet:

```html
<!-- author pre-filled, with href="#design" -->
<a href="#design">Design</a>

<!-- but the heading has NO id and its text slugifies to "design" -->
<h2>Design</h2>
```

`collectHeadings()` will generate `id="design"` for the heading
(matching the TOC's href). But if a different heading earlier
slugified to `design` first:

```html
<h2>Design</h2>           <!-- gets id="design" -->
<h2>Design system</h2>    <!-- author's pre-filled TOC links to #design; this gets id="design-2" -->
```

The pre-filled TOC may link to the wrong heading. Solution: be
explicit. Always set `id="…"` on headings AND ensure the TOC's
`href` matches.

## Visual verification

Run the universal self-debug checklist before claiming the
pre-filled TOC works — see
`skills/amvcp-self-debug-rules/SKILL.md`.

For pre-filled TOC correctness specifically:

- Open dev-browser. Verify the TOC has the author-supplied
  entries (not auto-generated ones):
  ```js
  const items = Array.from(document.querySelectorAll('.la-toc a'));
  items.forEach(a => console.log(a.getAttribute('href'), a.textContent));
  ```
  These should match what was in the pre-filled HTML.
- Verify every `href` resolves to a heading id:
  ```js
  items.forEach(a => {
    const target = document.querySelector(a.getAttribute('href'));
    console.log(a.getAttribute('href'), target ? 'OK' : 'MISSING');
  });
  ```
  Any MISSING entry is a broken anchor — fix the heading id or
  the TOC href.
- Scroll to a heading; verify the matching TOC link gets
  `.is-active` (the highlight works even with pre-filled
  entries).
- The JS-off check: disable JavaScript in dev-browser. The TOC
  should still display all the anchor links; clicking one
  navigates to the heading (browser-native). The `.is-active`
  highlight is missing — that's the expected JS-off behaviour.
- **R1 — Light + dark themes**: same as ref 21.
- **R2 — No nested scrollbars**: same as ref 21.

## The hybrid approach: static template + live build

Some pages benefit from a SEED-FILLED TOC: the author writes a
few important entries by hand, and `initTOC()` adds the rest
auto. This is currently NOT supported — `initTOC()` either
respects a non-empty list (skip build) or fully populates an
empty list. There is no "extend" mode.

If hybrid is needed, the workaround:
1. Pre-fill the priority entries.
2. After page load, run `window.amvcpLayout.initTOC()`
   manually with a flag to extend (not currently exposed —
   would need a feature addition).

For now, choose pre-fill (full control) OR auto-build (no
maintenance). The auto-build is the better default; pre-fill
when the auto-build can't capture what you need.

## The TOC entry text contract

Auto-built TOC entries use `heading.textContent` (the heading's
plain text). Pre-filled entries use whatever the author wrote:

```html
<!-- Heading -->
<h2 id="design">Design (work-in-progress)</h2>

<!-- Auto-built TOC entry would be: -->
<a href="#design" data-depth="2">Design (work-in-progress)</a>

<!-- Pre-filled: author chooses cleaner text -->
<a href="#design" data-depth="2">Design</a>
```

The pre-fill is useful when the heading text is verbose for the
TOC. The reading flow benefits from the verbose heading; the
TOC benefits from the abbreviated entry.

Keep them in sync conceptually — a TOC entry "Design" should
clearly point at a heading whose first word is "Design"
(otherwise the user clicks "Design" and lands on something
named "Architecture and decisions" which is confusing).

## The data-depth attribute

The `data-depth` attribute on each TOC `<a>` indicates the
heading level (`2` for h2, `3` for h3). The CSS uses it to
indent nested entries:

```css
.la-toc a[data-depth="3"] {
  padding-inline-start: var(--la-gap);
}
```

For pre-filled TOCs, the author MUST set `data-depth` on each
entry; without it, h3 entries won't be indented.

For auto-built TOCs, `buildTocList()` sets `data-depth`
automatically based on `headingDepth(heading)`.

## Ordering and grouping

A pre-filled TOC can REORDER entries (the auto-build always
follows document order). Useful when:
- The doc has appendices interleaved with body sections, and
  the TOC should show body sections first.
- The doc has a "next steps" section that should appear at the
  bottom of the TOC even if it's in the middle of the doc.

The author's pre-fill is the source of truth for ORDER. The
auto-build cannot reorder.

## Sub-TOC for nested content

A long doc may want sub-TOCs for major sections (a per-section
mini TOC). Possible via multiple `.la-toc` elements with
`data-la-toc-headings` overrides:

```html
<!-- Top-level TOC: only h2 -->
<nav class="la-toc" data-la-toc-headings="h2"
     aria-label="Sections">
  <ol class="la-toc__list"></ol>
</nav>

<section id="design">
  <h2>Design</h2>
  <!-- Sub-TOC inside the design section: h3 only -->
  <nav class="la-toc" data-la-toc-headings="h3"
       aria-label="Design sub-sections">
    <ol class="la-toc__list"></ol>
  </nav>
  <h3 id="design-grid">Grid system</h3>
  …
</section>
```

The runtime supports multiple TOCs per page; each is wired
independently.
