# Sticky table of contents — auto-built + scroll-spy active heading

A right-margin TOC that lists every `<h2>` / `<h3>` in the document.
Sticks to the viewport top, highlights the currently-visible heading
via `IntersectionObserver`, smooth-scrolls on click. Hides on narrow
viewports.

## What it is

Long-form reports (postmortems, design-explainers, runbooks) benefit
from persistent navigation. A sticky TOC:

- Builds itself at boot from the document's headings — no separate
  authoring step.
- Tracks which heading is currently in view (the "scroll spy") and
  highlights its TOC entry.
- Click → smooth-scroll to anchor.
- Hides at narrow viewports — the body grows full-width.

## Scaffold

The TOC is empty in markup; the JS fills it. Headings get auto-
assigned ids if they lack them:

```html
<aside class="ic-toc" data-ic-toc data-ic-scope="main"
       aria-label="On this page">
  <h2 class="ic-toc-title">On this page</h2>
  <ol class="ic-toc-list" data-ic-toc-list></ol>
</aside>

<main id="main">
  <h2>Background</h2>
  <p>…</p>
  <h2>Trigger</h2>
  <p>…</p>
  <h3>Auth path</h3>
  <p>…</p>
  <h3>Cache path</h3>
  <p>…</p>
  <h2>Mitigation</h2>
  <p>…</p>
</main>
```

CSS:

```css
.ic-toc {
  position: sticky;
  top: var(--vc-space-4, 24px);
  align-self: start;
  max-width: 18em;
  padding: var(--vc-space-3, 16px);
  border-left: 1px solid var(--ve-control-border, #e3dcc9);
}
.ic-toc-title {
  margin: 0 0 var(--vc-space-2, 12px);
  font: var(--vc-weight-bold, 700) var(--vc-text-0, 12px)/1.2
        var(--vc-font-heading, inherit);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ve-control-fg-dim, #5b5343);
}
.ic-toc-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-0, 4px);
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.4
        var(--ve-control-font, inherit);
}
.ic-toc-link {
  display: block;
  padding: var(--vc-space-0, 4px) var(--vc-space-1, 8px);
  border-left: 2px solid transparent;
  margin-left: -2px;
  color: var(--ve-control-fg-dim, #5b5343);
  text-decoration: none;
  border-radius: 0;
  transition: color var(--vc-duration-fast, 120ms)
              var(--vc-easing-standard, ease);
}
.ic-toc-link:hover { color: var(--ve-control-fg, #14110b); }
.ic-toc-link.ic-toc-link--active {
  color: var(--vc-color-accent, #b8861f);
  border-left-color: var(--vc-color-accent, #b8861f);
  font-weight: var(--vc-weight-medium, 500);
}
.ic-toc-link.ic-toc-link--h3 {
  padding-left: var(--vc-space-3, 16px);
  font-size: 0.92em;
}
@media (max-width: 900px) {
  .ic-toc { display: none; }
}
```

For the page layout, a CSS grid containing `<main>` + `<aside>`:

```css
.ic-with-toc {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18em;
  gap: var(--vc-space-5, 32px);
}
@media (max-width: 900px) {
  .ic-with-toc { grid-template-columns: minmax(0, 1fr); }
}
```

## JS engine

```js
var TOC_SLUG_RE = /[^a-z0-9]+/g;
function slug(text) {
  return text.toLowerCase().trim().replace(TOC_SLUG_RE, '-').replace(/^-|-$/g, '');
}

function initToc(tocEl) {
  var scope = document.getElementById(tocEl.getAttribute('data-ic-scope') || 'main');
  if (!scope) { return; }
  var listEl = tocEl.querySelector('[data-ic-toc-list]');
  if (!listEl) { return; }

  var hs = scope.querySelectorAll('h2, h3');
  var entries = [];
  hs.forEach(function (h) {
    if (!h.id) { h.id = 'toc-' + slug(h.textContent); }
    var li = document.createElement('li');
    var a  = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.className = 'ic-toc-link ic-toc-link--' + h.tagName.toLowerCase();
    li.appendChild(a);
    listEl.appendChild(li);
    entries.push({ h: h, a: a });
  });

  // Smooth-scroll on click — the browser's native one is enough when
  // `html { scroll-behavior: smooth; }` is set, but we also need to
  // update the URL hash and apply active state synchronously.
  entries.forEach(function (ent) {
    ent.a.addEventListener('click', function (ev) {
      ev.preventDefault();
      ent.h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + ent.h.id);
      setActive(ent.a);
    });
  });

  function setActive(link) {
    entries.forEach(function (e) {
      e.a.classList.toggle('ic-toc-link--active', e.a === link);
    });
  }

  // Scroll-spy via IntersectionObserver.
  var io = new IntersectionObserver(function (entries) {
    var topmost = null;
    var topY = Infinity;
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.boundingClientRect.top < topY) {
        topmost = entry.target;
        topY = entry.boundingClientRect.top;
      }
    });
    if (topmost) {
      var match = entries.find ? null : null;   // not used
      // Find the entry whose heading matches; entries[] is in DOM order.
      var found = null;
      for (var i = 0; i < arguments.length; i++) {}   // unused
      // Walk our own entries to find the one that matches topmost.
      for (var j = 0; j < arguments[0].length; j++) {
        // (kept for clarity — real code uses the outer entries closure)
      }
      // Use the closure-captured `entries` (renamed locally to avoid shadowing):
    }
  }, {
    rootMargin: '-20% 0% -60% 0%',   // a heading is "active" when in the upper 20% band
    threshold: 0
  });
  hs.forEach(function (h) { io.observe(h); });
}
document.querySelectorAll('[data-ic-toc]').forEach(initToc);
```

A cleaner shape of the IO callback (the above shows the named-args
trap; rename the inner `entries` to `intersections` to avoid
shadowing the outer captures):

```js
var io = new IntersectionObserver(function (intersections) {
  var topmost = null, topY = Infinity;
  intersections.forEach(function (entry) {
    if (entry.isIntersecting && entry.boundingClientRect.top < topY) {
      topmost = entry.target;
      topY = entry.boundingClientRect.top;
    }
  });
  if (topmost) {
    var match = entries.find(function (e) { return e.h === topmost; });
    if (match) { setActive(match.a); }
  }
}, { rootMargin: '-20% 0% -60% 0%', threshold: 0 });
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | active TOC entry + left bar |
| `--ve-control-fg-dim` | resting entries |
| `--ve-control-fg` | hovered entries |
| `--ve-control-border` | TOC border-left |
| `--vc-font-heading` | TOC title font |
| `--vc-space-*` | TOC paddings + gaps |

The TOC stays in the regular document grid (it's just `position:
sticky`); no overlay, no z-index battle, no JS to manage its
position.

## Selection / comment / decision-mini

- **The TOC itself is navigation, NOT content.** Don't stamp
  `data-ve-id` on it.
- **The body headings ARE atoms** (their content matters); they
  may carry `data-ve-id` and decision pills as normal.
- **Decision-mini.** A "this whole section is wrong" decision pill
  belongs on the heading, not the TOC entry.

## JS-off degradation

**TOC is empty; document is fully readable.** With JS off:

- The empty `<ol class="ic-toc-list">` renders blank.
- The "On this page" title still shows, signalling the missing
  navigation.
- The body's headings are anchorable via `id` if you author them
  in HTML; the page reads fine top-to-bottom.

Mitigation for important JS-off contexts: server-side pre-build the
TOC. The JS layer can then ENHANCE it (scroll-spy + smooth-scroll)
without being responsible for the initial render. The two-line
change: render `<li><a href="#h-id">Heading text</a></li>`
authored, the JS skips building when entries already exist.

## Anti-patterns

- A TOC at the top of the page with `position: fixed`. Eats
  permanent screen real estate; collides with the page's first
  paragraph; the user can't dismiss it.
- A TOC inside a `<details>` that defaults closed — the whole point
  of a TOC is to be visible.
- Re-binding the click handler on every scroll. The IntersectionObserver
  is the only thing that listens to scrolling; click handlers are
  attached once.
- Putting the TOC in the source order BEFORE the main content. The
  CSS grid lets you author it after `<main>` for source order +
  before via column.
- Hard-coding the rootMargin band as a constant px value. `20%`
  scales with the viewport; `100px` doesn't.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// TOC built one entry per heading.
const hs = document.querySelectorAll('main h2, main h3');
const links = document.querySelectorAll('.ic-toc-link');
console.assert(links.length === hs.length,
               'TOC entry count != heading count');

// Click an entry — URL hash updates, active class moves.
links[2].click();
console.assert(location.hash === '#' + hs[2].id);
console.assert(links[2].classList.contains('ic-toc-link--active'));

// Scroll to a heading — its TOC entry activates.
hs[1].scrollIntoView();
await new Promise(r => setTimeout(r, 300));   // observer fires async
console.assert(links[1].classList.contains('ic-toc-link--active'));
```

Capture screenshots at two scroll positions; verify the active
entry's accent color + left bar are visible in both themes.
