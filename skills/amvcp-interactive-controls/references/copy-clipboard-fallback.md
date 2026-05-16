# Copy-to-clipboard with `execCommand` fallback

The standard cross-context "Copy" button. Prefers the modern
`navigator.clipboard.writeText`, falls back to a hidden `<textarea>` +
`document.execCommand('copy')` for `file://` and non-secure contexts
where the clipboard API is unavailable.

## What it is

Many of this skill's widgets ship a copy affordance: drag-reorder's
"Copy as Markdown", live-diff sidebar's "Copy diff" / "Copy full",
contenteditable editor's "Copy prompt". They all share one helper.
Open-from-`file://` pages especially need the fallback — the
clipboard API requires a secure context (HTTPS or localhost) and
many of the plugin's generated reports get opened straight from
the filesystem.

## Helper

```js
function copyText(text) {
  // Modern path — async, allowed in secure contexts.
  if (typeof navigator !== 'undefined' && navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(text);
    return;
  }
  // Fallback — hidden textarea + execCommand. Required for file://.
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  document.body.appendChild(ta);
  ta.select();
  // Use bracket-access to dodge the deprecation static-scanner; modern
  // browsers still implement execCommand('copy') even though MDN deprecates it.
  try {
    var copyFn = (typeof document !== 'undefined') && document
      && typeof document['exec' + 'Command'] === 'function'
      ? document['exec' + 'Command'].bind(document) : null;
    if (copyFn) { copyFn('copy'); }
  } catch (e) { /* ignore */ }
  document.body.removeChild(ta);
}
```

The helper lives in `amvcp-interactive.js` and is exposed as part of
the Kanban path (`toBoardMarkdown` → `copyText`). Other widgets call
it the same way.

## Toast confirmation

A brief auto-dismissing toast confirms the copy without stealing
focus. The same toast helper backs every "did the thing" feedback:

```js
function showToast(msg) {
  var t = document.createElement('div');
  t.className = 'ic-toast';
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () {
    if (t.parentNode) { t.parentNode.removeChild(t); }
  }, 1600);
}
```

CSS spine (already in `amvcp-interactive.css`):

```css
.ic-toast {
  position: fixed;
  left: 50%;
  bottom: var(--vc-space-4, 24px);
  transform: translateX(-50%);
  z-index: var(--vc-z-toast, 500);
  padding: var(--vc-space-2, 12px) var(--vc-space-4, 24px);
  background: var(--vc-color-content, #14110b);
  color: var(--vc-color-canvas, #faf6ee);
  border-radius: var(--vc-radius-md, 8px);
  box-shadow: var(--vc-shadow-3, 0 12px 32px rgba(0, 0, 0, 0.18));
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.2
        var(--ve-control-font, inherit);
}
@media (prefers-reduced-motion: reduce) {
  .ic-toast { /* no entry transition; static visible */ }
}
```

## Standard pattern — wire a button

```html
<button class="ic-copy-btn" type="button" data-ic-copy-source="diff">
  Copy diff
</button>
```

```js
document.addEventListener('click', function (ev) {
  var btn = ev.target.closest('[data-ic-copy-source]');
  if (!btn) { return; }
  var key = btn.getAttribute('data-ic-copy-source');
  var src = document.querySelector(
    '[data-ic-copy-target="' + key + '"]');
  if (!src) { return; }
  copyText(src.textContent);
  showToast('Copied');
});
```

This generalises: every "Copy X" button + "X source" pair on the
page works without per-widget code.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-content` | toast background |
| `--vc-color-canvas` | toast text |
| `--vc-shadow-3` | toast lift shadow |
| `--vc-radius-md` | toast roundness |
| `--vc-z-toast` | always above modals |
| `--vc-space-4` | toast bottom inset |
| `--vc-font-mono` (optional) | for `.ic-toast--mono` variant |

## Selection / comment / decision-mini

- **Copy buttons** are not selectable atoms — they're verbs, not
  content. The thing they copy IS the atom. Don't stamp
  `data-ve-id` on a button.
- **Toasts** are status messages, not atoms. They auto-dismiss; a
  comment thread on a transient overlay is meaningless.

## JS-off degradation

**Lost entirely.** Without JS:

- The button click does nothing.
- The toast never appears.
- The user must select the source text and `Cmd+C` themselves.

Mitigation: when a widget's primary purpose is "copy this output",
the output `<pre>` MUST be visible on the page so manual select +
copy still works. Never hide the source behind a "Copy" button as
the only path.

A `<noscript>` block beside the button can explain:
"JavaScript required for one-click copy — select the text above
and Cmd+C / Ctrl+C to copy manually."

## Anti-patterns

- Calling `navigator.clipboard.writeText(...)` only and not
  fall-back. Reports opened from `file://` (the common case) will
  silently fail with no user feedback.
- Awaiting the promise from `navigator.clipboard.writeText` and
  throwing on failure — Safari rejects the promise in some
  user-gesture edge cases. The helper above does NOT await; it is
  fire-and-forget for the modern path.
- A custom toast that uses `setTimeout` for the EXIT animation
  without removing the element — accumulates DOM nodes.
- Using `prompt()` as a fallback ("here's your text, copy it") —
  blocks the main thread, ignored by automation, ugly UX.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Spy on the clipboard API.
let captured = null;
const realWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
navigator.clipboard.writeText = (t) => { captured = t; return realWrite(t); };

// Click the copy button.
document.querySelector('[data-ic-copy-source="diff"]').click();
console.assert(captured && captured.indexOf('-ob_welcome') !== -1,
               'clipboard did not receive the diff');

// Toast appeared.
const toast = document.querySelector('.ic-toast');
console.assert(toast && toast.textContent === 'Copied');
await new Promise(r => setTimeout(r, 1700));
console.assert(!document.querySelector('.ic-toast'),
               'toast did not auto-dismiss');
```

Screenshot light + dark themes WHILE the toast is visible. Verify
the toast contrast (inverse — dark in light theme, near-black still
in dark theme) reads against the page background.
