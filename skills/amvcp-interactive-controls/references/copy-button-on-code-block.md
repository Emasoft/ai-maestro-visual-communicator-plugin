# Copy button on code block — hover-revealed, top-right

A small "Copy" button that floats inside the top-right corner of a
`<pre>` code block, visible-on-hover (or always-visible on small
screens). One click copies the raw code (NOT the rendered HTML),
shows a brief "Copied" affirmation in the button itself.

## What it is

The runtime already ships a copy button on `.ve-code-block` (see
`scripts/amvcp-runtime.js` ~6722). This reference catalogs the
**generic** version that any widget can add to any `<pre>` it
emits: implementation-plan code panels, before/after diffs,
tabbed-code samples, snippets inside an accordion.

The button:

1. Lives in the top-right corner via `position: absolute`.
2. Reveals on `pre:hover` to keep the resting style clean.
3. Uses the `copyText` helper from
   `references/copy-clipboard-fallback.md`.
4. Shows "Copied" inline for 1.2 s (in-button affirmation, not a
   toast — the affirmation should be where the action happened).

## Scaffold

The host `<pre>` needs `position: relative`. The button is its
last child.

```html
<pre class="ic-code-block">
<button class="ic-code-copy" type="button" aria-label="Copy code">
  <span class="ic-code-copy-label">Copy</span>
</button><code class="language-ts">const limiter = new RateLimiter({ rate: 100 / 60 });
app.use('/api', limiter.middleware);
</code></pre>
```

Note the `<pre>` immediately wraps `<button>` then `<code>` —
whitespace inside `<pre>` is significant, so the `<button>` cannot
sit on its own line (would inject a leading newline into the copied
text).

CSS:

```css
.ic-code-block {
  position: relative;
  margin: var(--vc-space-3, 16px) 0;
  padding: var(--vc-space-3, 16px) var(--vc-space-3, 16px)
           var(--vc-space-3, 16px) var(--vc-space-4, 24px);
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.55
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg, #14110b);
  background: var(--vc-color-surface-sunken, #f1ece0);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  white-space: pre;          /* page widens — no inner scroller */
}
.ic-code-copy {
  position: absolute;
  top: var(--vc-space-1, 8px);
  right: var(--vc-space-1, 8px);
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--ve-control-bg, #ffffff);
  color: var(--ve-control-fg, #14110b);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.2
        var(--ve-control-font, inherit);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--vc-duration-fast, 120ms)
              var(--vc-easing-standard, ease);
}
.ic-code-block:hover .ic-code-copy,
.ic-code-copy:focus-visible {
  opacity: 1;
}
@media (max-width: 640px) {
  /* Always visible on touch — there is no hover. */
  .ic-code-copy { opacity: 1; }
}
.ic-code-copy.is-copied {
  border-color: var(--vc-color-success, #3a6b5c);
  color: var(--vc-color-success, #3a6b5c);
}
@media (prefers-reduced-motion: reduce) {
  .ic-code-copy { transition: none; }
}
```

## JS handler

```js
document.addEventListener('click', function (ev) {
  var btn = ev.target.closest('.ic-code-copy');
  if (!btn) { return; }
  var pre  = btn.closest('pre');
  var code = pre ? pre.querySelector('code') : null;
  if (!code) { return; }
  amvcpInteractive.copyText
    ? amvcpInteractive.copyText(code.textContent)
    : copyText(code.textContent);    // local helper
  var label = btn.querySelector('.ic-code-copy-label');
  if (label) {
    var prev = label.textContent;
    label.textContent = 'Copied';
    btn.classList.add('is-copied');
    setTimeout(function () {
      label.textContent = prev;
      btn.classList.remove('is-copied');
    }, 1200);
  }
});
```

For a page that mounts hundreds of code blocks, delegate-from-
document avoids hundreds of per-block listeners.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-surface-sunken` | code background |
| `--ve-control-border` | block + button border |
| `--vc-color-success` | "Copied" affirmation |
| `--ve-control-mono` | code font |
| `--vc-duration-fast` + `--vc-easing-standard` | hover reveal |
| `--vc-radius-md` + `--vc-radius-sm` | block + button corners |

## Selection / comment / decision-mini

- **The `<pre class="ic-code-block">` IS a selectable atom** so
  comments attach to the code itself ("this should use bracket
  notation").
- **The copy button is NOT an atom** — it's a verb; comments on a
  button are confusing.
- **Decision-mini.** A code sample is binary content — Approve /
  Deny. Attach to the `<pre>`, not the button.

## JS-off degradation

**Block is readable; button is dead.** With JS off:

- The `<pre>` renders normally and is readable.
- The button is visible on hover but clicking does nothing.
- The user can still select the code text and Cmd+C / Ctrl+C
  manually — the block contents are NOT hidden behind the button.

A `<noscript>` block above the page-wide code-block area might
explain: "One-click copy requires JavaScript; select and Cmd+C
to copy manually." But this is optional — every developer knows
how to select-and-copy.

## Anti-patterns

- Putting the `<button>` on its own line inside the `<pre>`. The
  newline character gets copied as the first character of the
  output. Always: `<pre><button…>Copy</button><code>…</code></pre>`
  inline.
- Copying `code.innerHTML` instead of `code.textContent`. You'd
  inject `<span>` highlight markup into the user's clipboard —
  pasting into a chat reveals the raw HTML.
- A hover-only button on touch devices. No-hover screens never see
  it; always include `@media (max-width: 640px) { opacity: 1 }` or
  similar.
- Reusing a toast for the affirmation. The user's eye is on the
  button — show feedback at the button, not at the bottom of the
  page.
- Adding the same listener N times via `forEach`. Delegate from
  `document` instead.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Spy the clipboard API.
let captured = null;
const realWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
navigator.clipboard.writeText = (t) => { captured = t; return realWrite(t); };

// Click the copy button.
document.querySelector('.ic-code-copy').click();
console.assert(captured.indexOf('RateLimiter') !== -1,
               'copied text did not contain the code');

// Affirmation appeared and reverted.
const label = document.querySelector('.ic-code-copy-label');
console.assert(label.textContent === 'Copied');
await new Promise(r => setTimeout(r, 1300));
console.assert(label.textContent === 'Copy');
```

Hover the block in the browser and verify the button fades in
within ~120 ms (matching `--vc-duration-fast`). Screenshot both
themes with the button visible and check the contrast.
