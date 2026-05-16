# Sub-technique F3 — JSON editor with live validation + error highlight

A JSON-editor variant of the contenteditable code editor. The user
types JSON; the page parses on every change; parse errors are shown
inline (highlighted character + tooltip) plus in a status bar.
Composable with the live-diff sidebar.

This is a SPECIALIZATION of
[contenteditable-code-editor.md](./contenteditable-code-editor.md) for
the JSON-input use case.

## F3.1 The pattern

```html
<div class="ve-json-editor">
  <div class="ve-json-editor__editor" contenteditable spellcheck="false">
{
  "feature_x": true,
  "rollout_pct": 20
}
  </div>
  <div class="ve-json-editor__status">
    <span class="ve-json-editor__ok">✓ Valid JSON</span>
  </div>
  <div class="ve-json-editor__actions">
    <button type="button" data-action="copy">Copy</button>
    <button type="button" data-action="format">Format (Prettify)</button>
  </div>
</div>
```

On every input:
1. Parse the editor's text content as JSON.
2. If valid → status bar shows "✓ Valid JSON" in olive; no error
   highlight.
3. If invalid → status bar shows "✗ " + error message in rust; the
   offending character / region in the editor is highlighted in rust.

## F3.2 The validation pass

```js
function validateJson(editor) {
  var text = editor.innerText;
  var status = document.querySelector('.ve-json-editor__status');
  try {
    JSON.parse(text);
    status.innerHTML = '<span class="ve-json-editor__ok">✓ Valid JSON</span>';
    clearErrorHighlight(editor);
  } catch (e) {
    // SyntaxError message: "Unexpected token X in JSON at position N"
    var posMatch = e.message.match(/position (\d+)/);
    var pos = posMatch ? parseInt(posMatch[1], 10) : null;
    status.innerHTML = '<span class="ve-json-editor__err">✗ ' + escapeHtml(e.message) + '</span>';
    if (pos !== null) highlightErrorChar(editor, pos);
  }
}
```

## F3.3 The error highlight at a character position

```js
function highlightErrorChar(editor, pos) {
  var saved = getCaretOffset(editor);
  var text = editor.innerText;
  var html = '';
  for (var i = 0; i < text.length; i++) {
    if (i === pos) {
      html += '<span class="ve-json-editor__error-char">' + escapeHtml(text.charAt(i)) + '</span>';
    } else {
      html += escapeHtml(text.charAt(i));
    }
  }
  editor.innerHTML = html;
  setCaretOffset(editor, saved);
}

function clearErrorHighlight(editor) {
  // No-op if the highlight pass replaces innerHTML on every validate
}
```

CSS:

```css
.ve-json-editor__error-char {
  background: var(--vc-color-danger);
  color: white;
  padding: 0 1px;
  border-radius: 2px;
  animation: pulse-error 800ms ease-out;
}
@keyframes pulse-error {
  0%   { box-shadow: 0 0 0 4px color-mix(in srgb, var(--vc-color-danger) 60%, transparent); }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

The single character at the parse-error position is highlighted with a
rust bg + brief pulse animation. The user's eye lands directly on the
offending character.

## F3.4 The Format (Prettify) button

```js
document.querySelector('[data-action="format"]').addEventListener('click', function () {
  var editor = document.querySelector('.ve-json-editor__editor');
  try {
    var parsed = JSON.parse(editor.innerText);
    var pretty = JSON.stringify(parsed, null, 2);
    editor.innerText = pretty;
    setCaretOffset(editor, pretty.length);
  } catch (e) {
    // Can't format invalid JSON; do nothing (the user sees the
    // error message in the status bar)
  }
});
```

Formatter rewrites the JSON to canonical-indented form. Only works on
valid JSON; invalid JSON is left alone (with the error highlight
showing).

## F3.5 The Copy button

```js
document.querySelector('[data-action="copy"]').addEventListener('click', function () {
  var editor = document.querySelector('.ve-json-editor__editor');
  navigator.clipboard.writeText(editor.innerText).then(function () {
    // Show success state on the button — same pattern as the runtime's
    // .ve-code-copy-btn — see [copy-button.md] §A5.5
  });
});
```

## F3.6 Schema-aware validation (optional)

Beyond JSON syntax validation, a richer editor can validate against a
schema (e.g. a Zod / JSON-schema):

```js
var SCHEMA = z.object({
  feature_x: z.boolean(),
  rollout_pct: z.number().min(0).max(100)
});

function validateSchema(editor) {
  try {
    var parsed = JSON.parse(editor.innerText);
    var result = SCHEMA.safeParse(parsed);
    if (result.success) {
      showOk();
    } else {
      showSchemaErrors(result.error.issues);
    }
  } catch (e) {
    // JSON syntax error — fall back to plain syntax validation
    return validateJson(editor);
  }
}
```

Schema errors include the path (`rollout_pct` is too high) — the
editor can highlight the offending KEY or VALUE in the rendered JSON
rather than a single character.

This is opt-in — not every JSON editor needs schema validation; many
just need "parses correctly".

## F3.7 Integration with the runtime's gutter

A `contenteditable` editor can't be wrapped by `initCodeGutter` —
the runtime detects `[contenteditable]` and skips. The editor is
**stand-alone** (no gutter, no copy button injected by the runtime;
the editor provides its own actions in §F3.4 / §F3.5).

If gutter + selection are needed on the editor, the editor is
two-pane: the contenteditable input on top, a RENDERED `.ve-code-block`
preview below. The preview is read-only and gets the standard
runtime treatment.

```html
<div class="ve-json-editor">
  <div class="ve-json-editor__editor" contenteditable>…</div>
  <details>
    <summary>Show formatted preview</summary>
    <div class="ve-code-block">
      <pre><code class="language-json" id="json-preview">…</code></pre>
    </div>
  </details>
</div>
```

On every valid edit, re-render the preview:

```js
function renderPreview(editor) {
  try {
    var parsed = JSON.parse(editor.innerText);
    var pretty = JSON.stringify(parsed, null, 2);
    document.getElementById('json-preview').textContent = pretty;
    // Re-run the runtime's gutter on the updated <pre>
    if (window.amvcpRuntime && window.amvcpRuntime.initAllCodeGutters) {
      window.amvcpRuntime.initAllCodeGutters();
    }
  } catch (e) { /* invalid; leave preview unchanged */ }
}
```

## F3.8 Selection / commenting

The contenteditable input has the browser's native text-selection (no
runtime atom-selection). The PREVIEW (if present) has the runtime's
selection.

Common UX: the user edits in the input, switches to the preview to
select lines for commenting. The comment payload includes both the
selected lines AND the FULL input text — so the agent receiving the
comment has the complete editor state.

## F3.9 Compose with live-diff-sidebar

A JSON editor + live-diff sidebar = the canonical "edit a config file,
see the diff" UX. The diff sidebar shows the original vs current
JSON (not on every keystroke — on every successful parse, debounced
to 500ms).

See [live-diff-sidebar.md](./live-diff-sidebar.md) for the sidebar
machinery; the JSON-specific tweak is that the diff is recomputed
only when the parse succeeds (invalid JSON shows the "no changes
since last valid state" state, not a corrupted diff).

## F3.10 Light + dark verification

- [ ] Status bar OK / ERR colors readable on both themes
- [ ] Error-char highlight visible on both themes
- [ ] Pulse animation works on both themes (respects reduced-motion)
- [ ] Preview block (if present) themed consistently with other code
      blocks on both themes
- [ ] Format button results in correctly-indented output on both
      themes

## F3.11 Tokens consumed

- `--vc-color-success` (OK status)
- `--vc-color-danger` (ERR status, error-char highlight)
- All from [contenteditable-code-editor.md](./contenteditable-code-editor.md)
- All from runtime CSS (when preview block is present)

## F3.12 Author rules

| Rule | Why |
|---|---|
| Set `spellcheck="false"` on the editor | Spell-check underlines look like errors; misleading |
| Parse on every input (debounced if many keystrokes) | Live feedback |
| Single error highlight at a time; don't try to mark multiple syntax errors | JSON.parse only reports the first error; honesty |
| Format (Prettify) is a manual action, not automatic on every edit | Re-indenting on every keystroke would jump the caret around |
| Always provide a Copy button | The editor is a throwaway — copy IS the export |
| Pair with a preview block if the editor is large | Visual confirmation; gives selection / commenting machinery |
