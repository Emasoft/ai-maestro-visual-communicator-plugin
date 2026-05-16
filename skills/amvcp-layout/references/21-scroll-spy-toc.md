# 21 — Scroll-spy TOC (`amvcp-layout.js` initTOC — the core scroll-spy)

The auto-built, auto-highlighted table-of-contents primitive. The
`.la-toc` element on the page hosts an empty `<ol>`; `initTOC()` in
`amvcp-layout.js` walks the document's `h2` / `h3` headings, builds
the list, and wires an `IntersectionObserver` that highlights the
TOC link of whichever heading is currently in the mid-viewport
band. JS-off graceful: a pre-filled static TOC works (anchors only,
no live highlight).

## What this is

The TOC is the standard "On this page" navigator for long
documents. The mechanics:

1. **Build:** `initTOC()` finds all `.la-toc` elements. For each:
   - Collects matching headings via `data-la-toc-headings` (default
     `'h2, h3'`).
   - Ensures every heading has a unique id (slugifying the heading
     text if needed).
   - If the `.la-toc__list` is empty, populates it with `<li><a>`
     items (one per heading).
   - If the `.la-toc__list` is non-empty (author pre-filled), skips
     the build step — respects the static TOC for JS-off
     environments.
2. **Highlight:** An `IntersectionObserver` with
   `rootMargin: '-40% 0px -40% 0px'` watches every heading. As the
   user scrolls, the heading currently in the middle 20% band of
   the viewport becomes the "active" heading; its TOC link gets
   `.is-active`.
3. **Tiebreaker:** When MULTIPLE headings are in the band
   simultaneously (a short section), the TOPMOST heading by
   viewport-y wins. This is more robust than the naive "last entry
   wins" because IO entries can arrive in non-document order.

## Scaffold to emit

The TOC element:

```html
<nav class="la-toc"
     data-ve-id="toc"
     data-ve-type="section"
     aria-label="On this page">
  <ol class="la-toc__list">
    <!-- amvcp-layout.js auto-populates this -->
  </ol>
</nav>
```

Per-page heading override:

```html
<nav class="la-toc"
     data-la-toc-headings="h1, h2"
     aria-label="On this page">
  <ol class="la-toc__list"></ol>
</nav>
```

Pre-filled static TOC (for JS-off pages):

```html
<nav class="la-toc" aria-label="On this page">
  <ol class="la-toc__list">
    <li><a href="#intro" data-depth="2">Introduction</a></li>
    <li><a href="#design" data-depth="2">Design</a></li>
    <li><a href="#design-grid" data-depth="3">Grid system</a></li>
    <li><a href="#impl" data-depth="2">Implementation</a></li>
  </ol>
</nav>
```

The CSS ships in `amvcp-layout.css`:

```css
.la-toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--la-gap-xs);
}
.la-toc a {
  display: block;
  padding-block: var(--vc-space-1, 8px);
  padding-inline-start: var(--la-gap-sm);
  border-inline-start: 2px solid transparent;
  color: var(--vc-color-content-muted);
  text-decoration: none;
}
.la-toc a:hover {
  color: var(--vc-color-content);
}
.la-toc a.is-active {
  color: var(--vc-color-accent);
  border-inline-start-color: var(--vc-color-accent);
  font-weight: var(--vc-weight-medium, 500);
}
.la-toc a[data-depth="3"] {
  padding-inline-start: var(--la-gap);     /* nested h3 indent */
}
```

## Why the `-40% 0px -40% 0px` root margin

The IO `rootMargin` shrinks the viewport to the middle 20% strip
(40% masked at top, 40% at bottom). A heading counts as "in the
band" only while it sits in that strip.

Why this margin and not e.g. `-20% 0px -70% 0px` (a top-anchored
band):
- A top-anchored band ("active when heading is near the top")
  highlights the LAST PASSED heading — useful for "where am I now?"
  but the active link jumps abruptly when scrolling.
- The mid-viewport band ("active when heading is in middle 20%")
  highlights the heading the USER IS CURRENTLY READING — the link
  changes more smoothly because it tracks the heading through the
  middle of the viewport.

The 20% band is wide enough to capture a heading that was
programmatically centred via `scrollIntoView({block: 'center'})` —
a narrower band would miss the target.

## The tiebreaker logic

When the IO fires a batch of entries, the callback maintains a
`visible` map of `id → boundingClientRect.top`. After every batch,
`pickActiveFromVisible()` picks the topmost visible heading
(lowest top value) and sets `.is-active` on its TOC link.

If `visible` is empty (no headings in the band — typical when
scrolling between sections), the current active link is LEFT
ALONE. This is important: scrolling between bands should not blank
the TOC; the user expects the last-known location to remain
highlighted.

## Lib functions called

- `initTOC(doc)` — main entry. Returns the last IO created (for
  test inspection / cleanup), or `null` if no `.la-toc` is on
  the page.
- `wireOneToc(doc, toc)` — per-TOC logic (pulled out so it's
  testable in isolation).
- `collectHeadings(doc, sel)` — finds the matching headings,
  ensures unique ids, returns them in document order.
- `buildTocList(doc, list, headings)` — populates the empty `<ol>`
  with anchor entries.
- `observeHeadings(toc, headings)` — wires the IO.
- `pickActiveFromVisible(toc, visible)` — picks the topmost
  visible heading.
- `setActiveLink(toc, id)` — toggles `.is-active` on the TOC link.
- `slugify(text)` — generates an id-safe slug from heading text.
- `uniqueId(base, used)` — produces a non-colliding id by
  appending `-2`, `-3`, … as needed.

## DESIGN.md tokens used

| Token | Default | Used in |
|---|---|---|
| `--la-gap-xs` | 4px | gap between TOC items |
| `--la-gap-sm` | 8px | padding-inline-start for h2 entries |
| `--la-gap` | 16px | padding-inline-start for h3 entries (nested indent) |
| `--vc-space-1` | 8px | padding-block on TOC links |
| `--vc-color-content-muted` | (theme) | inactive link colour |
| `--vc-color-content` | (theme) | hover link colour |
| `--vc-color-accent` | (theme) | active link colour + left border |
| `--vc-weight-medium` | 500 | active link weight |

## Selection / comment / decision-mini contract notes

The TOC is a selectable atom (`data-ve-id="toc"` —
`data-ve-type="section"`). A reviewer can comment on the TOC as a
whole ("show only h2 entries", "add a print link").

The individual links inside the TOC are NOT selectable atoms (per
R4, `<a>` is not in the SHAPES list and the runtime excludes
anchor / button elements). Comments about specific TOC entries
should target the heading itself (which IS selectable via the
heading element's parent atom, if any).

## When to use the TOC

- ANY long-form report or article with 4+ sections.
- A documentation page with multiple H2 sections.
- A landing page with a "What's inside" navigator.

When NOT to use:
- A short article (the TOC would be longer than the content).
- A slide deck (slides navigate by deck, not by TOC).
- A dashboard (no sequential reading flow).

## JS-off graceful degradation

With JS disabled:
- A pre-filled static TOC works as anchor links (the browser
  handles `href="#section-id"` navigation).
- The `.is-active` highlight never appears (no IO to toggle it).
- The TOC is fully usable; only the live highlight is missing.

If the `.la-toc__list` is EMPTY and JS is off, the TOC appears
empty (no fallback). Authors who care about JS-off must pre-fill
the static TOC.

## Visual verification

Run the universal self-debug checklist before claiming the TOC
works — see `skills/amvcp-self-debug-rules/SKILL.md`.

For scroll-spy TOC correctness specifically:

- Open dev-browser. After `boot()`, verify the TOC is populated:
  ```js
  const toc = document.querySelector('.la-toc__list');
  console.log('items:', toc.children.length);
  // Should equal the number of h2/h3 headings on the page.
  ```
- Verify each TOC link has an href matching a heading id:
  ```js
  document.querySelectorAll('.la-toc a').forEach(a => {
    const href = a.getAttribute('href');
    const target = document.querySelector(href);
    console.log(href, target ? 'OK' : 'MISSING');
  });
  ```
- Scroll to a heading; the matching TOC link must get `.is-active`:
  ```js
  document.querySelector('#section-2').scrollIntoView({block: 'center'});
  await new Promise(r => setTimeout(r, 300));  // let IO fire
  console.log(document.querySelector('.la-toc a[href="#section-2"]').classList.contains('is-active'));
  // Should be true.
  ```
- Scroll back to a previous heading; the TOC active link must
  RE-activate (the observer fires repeatedly, not just once).
- **R1 — Light + dark themes**: switch themes; the active link
  colour uses `--vc-color-accent`, theme-correct in both. The
  inactive link is `--vc-color-content-muted`. Verify legibility
  in both.
- **R2 — No nested scrollbars**: the TOC `<ol>` is a flex column;
  it must NOT have `overflow: auto`. If the TOC has 50+ entries,
  the TOC grows TALL and the document scrolls — never the TOC
  itself. A very long TOC may want to use the sticky-sidebar
  pattern (ref 22) so it remains visible while scrolling.
