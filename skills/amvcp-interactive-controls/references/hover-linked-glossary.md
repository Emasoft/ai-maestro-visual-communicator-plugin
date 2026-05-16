# Hover-linked glossary

A glossary `<dl>` in a sidebar where any matching `.term` span in body
prose, when hovered, highlights its glossary entry. Reverse direction
too: hovering the `<dt>` highlights every body `.term` that references
it. Pure zero-dependency cross-reference UX.

## What it is

Long-form documents (concept explainers, "how X works" writeups, API
references) define a glossary up front. Without a cross-reference
mechanism the reader has to keep flipping back and forth. The
hover-link patches both halves of that loop:

- Body prose contains `<span class="ic-term" data-ic-term="cache">
  cache</span>`.
- Sticky sidebar `<dl class="ic-glossary">` lists every term, each
  `<dt>` carrying `data-ic-glossary="cache"`.
- Hovering either side highlights the matching entry on both sides.

## Scaffold

```html
<aside class="ic-glossary-wrap">
  <h2>Glossary</h2>
  <dl class="ic-glossary">
    <dt class="ic-glossary-term" data-ic-glossary="cache">Cache</dt>
    <dd class="ic-glossary-def">
      Persistent in-process storage that survives request boundaries
      but not process restarts.
    </dd>
    <dt class="ic-glossary-term" data-ic-glossary="ring">Hash ring</dt>
    <dd class="ic-glossary-def">
      Logical circle of hash space; each key maps to one node based
      on its hash position.
    </dd>
  </dl>
</aside>

<main class="ic-prose">
  <p>
    Consistent hashing maps every key to a
    <span class="ic-term" data-ic-term="ring">hash ring</span>
    so adding or removing a
    <span class="ic-term" data-ic-term="cache">cache</span>
    node only redistributes a small slice of the data.
  </p>
</main>
```

CSS spine:

```css
.ic-glossary-wrap {
  position: sticky;
  top: var(--vc-space-4, 24px);
  align-self: start;
  max-width: 22em;
}
.ic-glossary {
  margin: 0;
  padding: 0;
  border-left: 2px solid var(--ve-control-border, #e3dcc9);
  padding-left: var(--vc-space-3, 16px);
}
.ic-glossary-term {
  font: var(--vc-weight-bold, 700) var(--vc-text-1, 14px)/1.3
        var(--vc-font-heading, inherit);
  color: var(--ve-control-fg, #14110b);
  margin-top: var(--vc-space-2, 12px);
}
.ic-glossary-def {
  margin: 0 0 var(--vc-space-2, 12px) 0;
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.55
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg-dim, #5b5343);
}
.ic-term {
  border-bottom: 1px dotted var(--vc-color-accent, #b8861f);
  cursor: help;
}
.ic-term:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}

/* Highlight applied to the matched glossary entry on hover. */
.ic-glossary-term.ic-glossary-hl,
.ic-glossary-def.ic-glossary-hl {
  background: color-mix(in srgb,
              var(--vc-color-accent, #b8861f) 12%, transparent);
  border-radius: var(--vc-radius-sm, 4px);
}
/* Reverse: highlight on the body span when its <dt> is hovered. */
.ic-term.ic-term-hl {
  background: color-mix(in srgb,
              var(--vc-color-accent, #b8861f) 16%, transparent);
  border-radius: var(--vc-radius-sm, 4px);
  padding: 0 var(--vc-space-0, 4px);
  margin: 0 calc(-1 * var(--vc-space-0, 4px));
}
```

## JS layer

Twelve lines, no dependency. Event delegation on the document for
zero-cost binding across re-renders:

```js
function termOf(el) {
  return el.getAttribute('data-ic-term')
      || el.getAttribute('data-ic-glossary');
}
document.addEventListener('mouseover', function (ev) {
  var src = ev.target.closest('[data-ic-term],[data-ic-glossary]');
  if (!src) { return; }
  var name = termOf(src);
  if (!name) { return; }
  document.querySelectorAll('[data-ic-term="' + name + '"]')
    .forEach(function (e) { e.classList.add('ic-term-hl'); });
  document.querySelectorAll('[data-ic-glossary="' + name + '"]')
    .forEach(function (e) {
      e.classList.add('ic-glossary-hl');
      var dd = e.nextElementSibling;
      if (dd && dd.tagName === 'DD') {
        dd.classList.add('ic-glossary-hl');
      }
    });
});
document.addEventListener('mouseout', function (ev) {
  var src = ev.target.closest('[data-ic-term],[data-ic-glossary]');
  if (!src) { return; }
  document.querySelectorAll('.ic-term-hl,.ic-glossary-hl')
    .forEach(function (e) {
      e.classList.remove('ic-term-hl', 'ic-glossary-hl');
    });
});
```

The same handler covers focus too if you ALSO listen for
`focusin` / `focusout` — that gives keyboard-only users the same
cross-highlight.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | dotted underline + highlight tint |
| `--ve-control-fg` / `--ve-control-fg-dim` | term + definition text |
| `--ve-control-border` | glossary border |
| `--vc-radius-sm` | highlight rounded edges |

The highlight uses `color-mix(in srgb, var(--vc-color-accent), …)`
so theme hot-swap re-tints both sides automatically.

## Selection / comment / decision-mini

- **Selection.** Each `<dt class="ic-glossary-term">` is its own
  selectable atom (`data-ve-id="glossary:cache"`) — comments
  attach to the definition itself ("update this", "missing a
  precondition").
- **Body `.ic-term` spans** are NOT independently selectable atoms —
  they are pure cross-references; the surrounding paragraph
  (`data-ve-id="para:xyz"`) is the right comment target.
- **Decision-mini.** Glossary entries are content; attach the S/A/D
  pill on the `<dt>` so a reviewer can Approve / Deny a definition
  alongside the body prose.

## JS-off degradation

**Cross-references degrade to dotted underlines.** With JS off:

- The body `.ic-term` spans still display with the dotted-clay
  underline + `cursor: help` so the reader knows the term is
  defined elsewhere.
- The glossary sidebar is still in the page (it's static HTML);
  the reader scrolls to read it manually.
- Hover-highlighting does NOT fire.

This is graceful: the reader loses a convenience layer, not the
information.

## Anti-patterns

- Defining the glossary inside a `<details>` that defaults closed.
  Without JS the reader can't tell where to look for the definition
  on hover. Keep the glossary always-visible (sticky or end-of-page).
- Using `<abbr title="…">` instead of a real glossary. `<abbr>`
  tooltips are browser-controlled, slow to appear, can't be styled,
  and are inaccessible on touch.
- Hardcoding the highlight color — must use `color-mix` against
  `--vc-color-accent` so theme hot-swap works.
- Re-querying the DOM on every mousemove. Only `mouseover` (which
  fires on element entry, not movement) is needed — the helper
  above is O(matches) per entry/exit, not per pixel.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Hover a body term — glossary entry lights up.
const term = document.querySelector('.ic-term[data-ic-term="cache"]');
term.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
await new Promise(r => setTimeout(r, 0));
const dt = document.querySelector('[data-ic-glossary="cache"]');
console.assert(dt.classList.contains('ic-glossary-hl'),
               'glossary did not highlight');

// Reverse: hover the dt — body terms light up.
dt.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
console.assert(term.classList.contains('ic-term-hl'),
               'body term did not highlight');
```

Capture a screenshot of the page with one body term hovered, and
verify the matching glossary entry tint reads in both light and
dark themes.
