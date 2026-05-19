# Breadcrumb stack — where am I in the hierarchy

A horizontal breadcrumb trail showing the user's path inside a
nested view (folder tree, doc hierarchy, drill-down panels). Each
crumb is a clickable link back to that ancestor; the last crumb is
the current location (no link).

## What it is

When a report drills into nested levels (project → category →
finding → file → line), the user loses their place. Breadcrumbs
solve it cheaply: a one-line strip at the top of the panel that
shows every ancestor, each clickable to jump back.

## Scaffold

```html
<nav class="ic-crumbs" data-ic-crumbs aria-label="Breadcrumb">
  <ol class="ic-crumbs-list">
    <li class="ic-crumbs-item">
      <a href="#root">Findings</a>
    </li>
    <li class="ic-crumbs-item">
      <a href="#cat-security">Security</a>
    </li>
    <li class="ic-crumbs-item">
      <a href="#finding-42">Auth bypass</a>
    </li>
    <li class="ic-crumbs-item ic-crumbs-item--current"
        aria-current="page">
      <span>src/auth.ts:42</span>
    </li>
  </ol>
</nav>
```

The last item carries `aria-current="page"` instead of a link.
Both visual and semantic affordances communicate "you are here".

CSS:

```css
.ic-crumbs {
  margin: var(--vc-space-2, 12px) 0;
}
.ic-crumbs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  font: var(--vc-weight-regular, 400) var(--vc-text-0, 12px)/1.3
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg-dim, #5b5343);
}
.ic-crumbs-item {
  display: inline-flex;
  align-items: center;
}
.ic-crumbs-item + .ic-crumbs-item::before {
  content: "›";   /* the separator (›) */
  margin: 0 var(--vc-space-1, 8px);
  color: var(--ve-control-fg-dim, #5b5343);
  font-weight: var(--vc-weight-medium, 500);
}
.ic-crumbs-item a {
  color: var(--ve-control-fg-dim, #5b5343);
  text-decoration: none;
}
.ic-crumbs-item a:hover {
  color: var(--ve-control-fg, #14110b);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.ic-crumbs-item--current span {
  color: var(--ve-control-fg, #14110b);
  font-weight: var(--vc-weight-medium, 500);
}
.ic-crumbs-item a:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
  border-radius: var(--vc-radius-sm, 4px);
}
```

The `::before` separator is on the item, not as a separate child.
That keeps the markup clean — each crumb is one `<li>`, the
separator emerges automatically from the adjacent-sibling rule.

## Dynamic / API

For a report that drills programmatically (e.g. a TOC click sets
the breadcrumb), expose a tiny helper:

```js
function setCrumbs(navEl, crumbs) {
  // crumbs: [{ label, href }], last item is current.
  var ol = navEl.querySelector('.ic-crumbs-list');
  ol.textContent = '';
  crumbs.forEach(function (c, i) {
    var li = document.createElement('li');
    li.className = 'ic-crumbs-item';
    if (i === crumbs.length - 1) {
      li.classList.add('ic-crumbs-item--current');
      li.setAttribute('aria-current', 'page');
      var span = document.createElement('span');
      span.textContent = c.label;
      li.appendChild(span);
    } else {
      var a = document.createElement('a');
      a.href = c.href;
      a.textContent = c.label;
      li.appendChild(a);
    }
    ol.appendChild(li);
  });
}
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-fg-dim` | ancestor crumbs + separator |
| `--ve-control-fg` | current crumb + hovered link |
| `--vc-color-accent` | focus ring |
| `--vc-space-1` | gap between crumbs |
| `--vc-radius-sm` | focus-outline corner |

The separator character (`›`) is a literal Unicode glyph, not a
SVG or background-image — it scales with font-size, inherits color,
weighs zero bytes.

## Selection / comment / decision-mini

- **The breadcrumb strip IS navigation, not content.** No
  `data-ve-id`, no decision-mini, no comments.
- **The current-crumb's target page** is the atom that gets the
  comment thread.

## JS-off degradation

**Fully functional.** With JS off:

- The crumb links are real `<a>` tags — they navigate.
- The current crumb is a static `<span>` — no link to "current"
  itself.
- No JS needed for any aspect.

This is the gold standard of graceful degradation: the
JS-off and JS-on experiences are identical for the user.

## Anti-patterns

- A custom separator with a `<span class="sep">/</span>` element
  in the markup. Inflates the DOM; the CSS `::before` rule is
  cleaner.
- Hardcoding the separator as text — use `›` or `/` for visual
  weight; `>` or `→` are jarring at small sizes.
- A clickable current crumb that does nothing — confusing. Always
  make it a `<span>`, not an `<a>`.
- Hiding intermediate crumbs on narrow screens via `display: none`
  — better to truncate with ellipsis OR use a "…" overflow
  collapser if the trail is genuinely long.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Current crumb is a span; ancestors are links.
const items = document.querySelectorAll('.ic-crumbs-item');
const current = items[items.length - 1];
console.assert(current.classList.contains('ic-crumbs-item--current'));
console.assert(current.getAttribute('aria-current') === 'page');
console.assert(!current.querySelector('a'),
               'current crumb should not be a link');

const first = items[0];
console.assert(first.querySelector('a'), 'ancestor must be a link');
```

Screenshot light + dark themes. Verify the current-crumb contrast
plus separator visibility in both.
