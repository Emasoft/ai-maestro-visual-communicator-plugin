# Textarea autosize — grow with content

A `<textarea>` whose height grows to fit its content instead of
showing an inner scrollbar. Pure JS that resets `height` to `auto`
then sets it to `scrollHeight` on every `input`. Forbids inner
scrollers (per the no-nested-scrollbars rule).

## What it is

The standard `<textarea>` shows an inner scrollbar once the
content overflows its fixed `rows`. That violates
`~/.claude/rules/no-nested-scrollbars.md` — inside a long report,
the user gets a scroll-trap. Autosize fixes it: the textarea grows;
the page scrolls.

## Scaffold

```html
<textarea class="ic-autosize"
          data-ic-autosize data-id="comment-draft"
          rows="3" placeholder="Comment…"></textarea>
```

CSS:

```css
.ic-autosize {
  display: block;
  width: 100%;
  min-height: 6em;
  padding: var(--vc-space-2, 12px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--ve-control-bg, #ffffff);
  color: var(--ve-control-fg, #14110b);
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.5
        var(--ve-control-font, inherit);
  /* CRITICAL: forbid the inner scrollbar — let the page expand. */
  overflow: hidden;
  resize: vertical;          /* user can ALSO drag-resize if desired */
  box-sizing: border-box;
}
.ic-autosize:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
```

`overflow: hidden` is the no-nested-scrollbar enforcement; without
it, every "let me write a longer comment" produces an inner
scrollbar.

`resize: vertical` keeps the drag-handle the browser provides for
the user who WANTS to shrink the textarea to a small height — the
JS will then grow it back as they type. The handle is bottom-right
on Chromium; on Safari it sits inline. Both honour `resize: vertical`
to forbid horizontal resize (would break responsive widths).

## JS engine

```js
function autosize(ta) {
  ta.style.height = 'auto';        // collapse so scrollHeight measures content
  ta.style.height = ta.scrollHeight + 'px';
}
function initAutosize(ta) {
  ta.addEventListener('input', function () { autosize(ta); });
  // First paint — restore draft if present, then size.
  if (ta.hasAttribute('data-ic-autosize')) {
    var dataId = ta.getAttribute('data-id');
    if (dataId) {
      var saved = amvcpInteractive.loadDraft(dataId);
      if (saved !== null) { ta.value = saved; }
      // Also persist drafts on input.
      var debounceTimer = null;
      ta.addEventListener('input', function () {
        if (debounceTimer) { clearTimeout(debounceTimer); }
        debounceTimer = setTimeout(function () {
          amvcpInteractive.saveDraft(dataId, ta.value);
        }, 500);
      });
    }
  }
  autosize(ta);

  // If the page has a font that loads async, the initial autosize
  // measures with the wrong font. Re-measure when fonts settle.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { autosize(ta); });
  }
}
document.querySelectorAll('[data-ic-autosize]').forEach(initAutosize);
```

The `document.fonts.ready` re-measure is a one-line guard against a
common bug: a web-font that loads asynchronously can change the
line-height after autosize has already run, producing a textarea
sized for the wrong font. Re-measuring after fonts ready snaps it
to the right height.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` | background |
| `--ve-control-border` | border |
| `--vc-color-accent` | focus ring |
| `--ve-control-font` | text font |
| `--vc-space-2` | inner padding |
| `--vc-radius-sm` | rounding |

## Selection / comment / decision-mini

- **The textarea IS a content control**, so stamp `data-ve-id` on
  it if comments may attach ("this draft is wrong" → the textarea
  is the right atom). For a generic comment-form input, no atom
  needed; the comment payload IS the value.
- **Decision-mini.** Not meaningful per-textarea — textareas hold
  free text, not Skip/Approve/Deny decisions.

## JS-off degradation

**Native textarea; manual sizing.** With JS off:

- The `<textarea rows="3">` shows with 3 rows of height.
- `overflow: hidden` clips overflow content; the user sees no
  inner scrollbar BUT they cannot read past 3 rows of content.

This is wrong without JS — the user types but cannot see what they
typed. Fix the no-JS baseline: change the CSS to
`overflow: auto` ONLY inside a `@media (scripting: none)` block, so
the inner scrollbar appears just when no JS is available:

```css
@media (scripting: none) {
  .ic-autosize { overflow: auto; }
}
```

`@media (scripting: none)` matches when JavaScript is disabled in the
browser settings or by CSP. The textarea then degrades to standard
browser behaviour (inner scrollbar) — violating the no-nested-
scrollbars rule for the JS-off audience, but the alternative
(typing into a clipped textarea) is far worse.

## Anti-patterns

- Setting `height` in pixels at boot and never updating. Defeats
  the entire purpose.
- Using a fixed `rows` without the JS — looks "right" with three
  empty lines but clips real content silently.
- Setting `box-sizing: content-box` (the default). The `+ padding`
  layout means typing pushes the bottom edge below where
  `scrollHeight` reports. Always `box-sizing: border-box`.
- Re-measuring on every keystroke without batching for long text
  (>10000 chars). The `style.height = 'auto'` triggers a reflow.
  For very long textareas, throttle to one re-measure per RAF.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Type N lines — the textarea grows; no inner scrollbar appears.
const ta = document.querySelector('.ic-autosize');
ta.value = '';
for (let i = 0; i < 20; i++) {
  ta.value += 'line ' + i + '\n';
}
ta.dispatchEvent(new Event('input', { bubbles: true }));
const heightPx = ta.getBoundingClientRect().height;
console.assert(heightPx >= ta.scrollHeight - 2,
               'textarea did not grow to fit content');
console.assert(getComputedStyle(ta).overflow === 'hidden',
               'inner overflow leaked');

// Restore from draft.
ta.dispatchEvent(new Event('input', { bubbles: true }));
await new Promise(r => setTimeout(r, 600));   // wait for debounce
const draft = localStorage.getItem('amvcp-ic:draft:comment-draft');
console.assert(draft && draft.indexOf('line 19') !== -1);
```

Screenshot light + dark themes with a long content textarea; verify
the textarea has grown vertically and there is NO inner scrollbar
(measure `getComputedStyle(ta).overflow === 'hidden'`).
