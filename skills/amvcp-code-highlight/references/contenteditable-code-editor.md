# Sub-technique F1 — contenteditable code editor with caret-preserved re-highlight

## Table of Contents

- [F1.1 The pattern](#f11-the-pattern)
- [F1.2 Why contenteditable, not textarea](#f12-why-contenteditable-not-textarea)
- [F1.3 The 4 building blocks](#f13-the-4-building-blocks)
- [F1.4 Intercepting Enter](#f14-intercepting-enter)
- [F1.5 Intercepting paste](#f15-intercepting-paste)
- [F1.6 The slot-finder regex pattern](#f16-the-slot-finder-regex-pattern)
- [F1.7 Per-slot validation](#f17-per-slot-validation)
- [F1.8 The 3-sample preview pattern](#f18-the-3-sample-preview-pattern)
- [F1.9 Selection / commenting](#f19-selection--commenting)
- [F1.10 The localStorage save pattern](#f110-the-localstorage-save-pattern)
- [F1.11 Tokens consumed](#f111-tokens-consumed)
- [F1.12 When to use](#f112-when-to-use)
- [F1.13 Author rules](#f113-author-rules)
- [F1.14 Mined source attribution](#f114-mined-source-attribution)

The pattern for live-editing code (or a templated text format)
in-browser with continuous syntax highlighting. The reference impl is
the prompt-template `{{slot}}` editor mined from `20-editor-prompt-
tuner.html` (html-effectiveness catalog #20).

Mined catalog quote: *"The contenteditable + caret-offset save/restore
+ RAF-debounced re-highlight pattern is gold for any live-edit-with-
highlighting UX."* — adopted as a first-class code-highlight technique.

## F1.1 The pattern

A `<div contenteditable>` (NOT a `<textarea>`). The user types; on
each input event, the page:
1. Saves the caret offset (a single integer — character position into
   the text).
2. Re-computes the text content.
3. Replaces the innerHTML with token-span wrapped text (highlighting
   slots / keywords / errors).
4. Restores the caret offset (the user's caret lands at the same
   character position, no matter how the innerHTML shape changed).

This gives the user the feel of a syntax-highlighted editor without a
heavy library (no CodeMirror, no Monaco, no Ace).

## F1.2 Why contenteditable, not textarea

A `<textarea>` is plain text — you can't inject `<span>` colour into
its content. The contenteditable `<div>` accepts HTML, so the page can
insert `<span class="slot">{{name}}</span>` highlights directly.

Trade-off: contenteditable behaves differently across browsers (Enter
inserts a `<br>` in Firefox vs `<div>` in Chrome). The pattern below
intercepts Enter to enforce a `\n` instead — predictable across
browsers.

## F1.3 The 4 building blocks

```js
// 1. getCaretOffset — read the caret position as a single integer
function getCaretOffset(root) {
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  var range = sel.getRangeAt(0);
  var preCaret = range.cloneRange();
  preCaret.selectNodeContents(root);
  preCaret.setEnd(range.endContainer, range.endOffset);
  return preCaret.toString().length;
}

// 2. setCaretOffset — restore the caret to a previously-saved offset
function setCaretOffset(root, offset) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  var node, count = 0;
  while ((node = walker.nextNode())) {
    var next = count + node.length;
    if (offset <= next) {
      var range = document.createRange();
      range.setStart(node, offset - count);
      range.collapse(true);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    count = next;
  }
}

// 3. Re-highlight pass — wrap matched patterns in spans
function reHighlight(root, regex, className) {
  var text = root.innerText;     // plain text content
  var html = '';
  var lastIndex = 0;
  var m;
  regex.lastIndex = 0;
  while ((m = regex.exec(text)) !== null) {
    html += escapeHtml(text.slice(lastIndex, m.index));
    html += '<span class="' + className + '">' + escapeHtml(m[0]) + '</span>';
    lastIndex = m.index + m[0].length;
  }
  html += escapeHtml(text.slice(lastIndex));
  root.innerHTML = html;
}

// 4. The wire-up — debounced via RAF
var rafId = null;
editor.addEventListener('input', function () {
  if (rafId) return;
  rafId = requestAnimationFrame(function () {
    rafId = null;
    var off = getCaretOffset(editor);
    reHighlight(editor, /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, 'slot');
    setCaretOffset(editor, off);
  });
});
```

That's the COMPLETE pattern in ~50 lines. No libraries.

## F1.4 Intercepting Enter

```js
editor.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  document.execCommand('insertText', false, '\n');
});
```

`execCommand('insertText')` is the cross-browser way to insert plain
text at the caret. Without this, Firefox inserts `<br>`, Chrome inserts
`<div>`, Safari inserts `<div>`. The re-highlight pass would need to
handle all 3 — easier to enforce `\n`.

## F1.5 Intercepting paste

```js
editor.addEventListener('paste', function (e) {
  e.preventDefault();
  var text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
});
```

Without this, pasting from a styled source (Word, a web page) injects
the SOURCE styling into the editor, breaking the syntax highlight on
the pasted region. Plain-text paste keeps the editor consistent.

## F1.6 The slot-finder regex pattern

The mined catalog impl uses:

```js
var SLOT_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
```

Matches `{{name}}`, `{{ name }}` (whitespace tolerant). Captures the
slot name in group 1.

This regex is gold — adopt verbatim for any "template with named
slots" highlighter.

## F1.7 Per-slot validation

Beyond the basic "highlight all slot-shaped strings", the editor can
classify slots:

```js
var KNOWN_SLOTS = ['customer_name', 'plan_tier', 'ticket_subject', 'ticket_body', 'tone'];

function reHighlightSlots(root) {
  var text = root.innerText;
  var html = '';
  var lastIndex = 0;
  var m;
  SLOT_REGEX.lastIndex = 0;
  while ((m = SLOT_REGEX.exec(text)) !== null) {
    html += escapeHtml(text.slice(lastIndex, m.index));
    var slotName = m[1];
    var cls = KNOWN_SLOTS.indexOf(slotName) >= 0 ? 'slot slot-known' : 'slot slot-unknown';
    html += '<span class="' + cls + '">' + escapeHtml(m[0]) + '</span>';
    lastIndex = m.index + m[0].length;
  }
  html += escapeHtml(text.slice(lastIndex));
  root.innerHTML = html;
}
```

CSS:

```css
.slot          { font-weight: 600; }
.slot-known    { background: color-mix(in srgb, var(--vc-color-success) 18%, transparent);
                 color: var(--vc-color-success); }
.slot-unknown  { background: color-mix(in srgb, var(--ve-accent) 14%, transparent);
                 color: var(--ve-accent);
                 border-bottom: 1.5px dashed var(--ve-accent); }
```

Known slots render olive (success); unknown slots render clay with a
dashed underline (warning) — matches the catalog's `customer_name` /
`anything_else` distinction.

## F1.8 The 3-sample preview pattern

The catalog's editor pairs the LEFT-side editor with a RIGHT-side
"3 sample previews":

```html
<div class="ve-prompt-tuner">
  <div class="ve-prompt-tuner__editor" contenteditable>
    Hello {{customer_name}}, thanks for your {{plan_tier}} subscription!
    We received your {{ticket_subject}}: "{{ticket_body}}".
    Please reply in a {{tone}} tone.
  </div>
  <div class="ve-prompt-tuner__previews">
    <div class="ve-prompt-tuner__preview">
      <h4>Sample 1 · Sarah, pro plan</h4>
      <p class="ve-prompt-tuner__rendered">Hello Sarah, thanks for your pro subscription! …</p>
    </div>
    <div class="ve-prompt-tuner__preview">…sample 2…</div>
    <div class="ve-prompt-tuner__preview">…sample 3…</div>
  </div>
</div>
```

On every edit, each preview re-renders with the slots filled in from
its sample data:

```js
var SAMPLES = [
  { customer_name: 'Sarah', plan_tier: 'pro', ticket_subject: 'Login issue', ticket_body: '…', tone: 'friendly' },
  { customer_name: 'Maxim', plan_tier: 'free', ticket_subject: 'Cancel', ticket_body: '…', tone: 'professional' },
  { customer_name: 'Ai',    plan_tier: 'enterprise', ticket_subject: 'Demo', ticket_body: '…', tone: 'enthusiastic' }
];

function renderPreviews(template) {
  document.querySelectorAll('.ve-prompt-tuner__rendered').forEach(function (el, i) {
    var sample = SAMPLES[i];
    el.innerHTML = '';
    var rendered = template.replace(SLOT_REGEX, function (full, slotName) {
      return sample[slotName] != null
        ? '<span class="filled">' + escapeHtml(sample[slotName]) + '</span>'
        : '<span class="missing">' + escapeHtml(full) + '</span>';
    });
    el.innerHTML = rendered;
  });
}
```

`.filled` slots render as the substituted value with a soft success-
green bg; `.missing` slots (no sample data for the slot) render as the
literal `{{slot}}` with a clay warning bg. Reader sees BOTH what works
AND what's missing.

## F1.9 Selection / commenting

A contenteditable editor's selection is the BROWSER's native text-
selection (not the runtime's per-line selection). Native Ctrl+C / ⌘C
copies the visible text content (with span markup stripped by the
browser's clipboard machinery).

To enable comment-pill on a selection, the page would need to bind a
listener on `selectionchange` and forward the selected text to the
runtime's comment payload. Beyond the scope of this skill (the comment
mechanism is owned by `amvcp-runtime.js`); document as "supported via
the runtime's selection bridge".

## F1.10 The localStorage save pattern

```js
var STORAGE_KEY = 've-prompt-tuner:template';

// Restore on load
editor.textContent = localStorage.getItem(STORAGE_KEY) || DEFAULT_TEMPLATE;
reHighlightSlots(editor);

// Save on edit (debounced)
var saveId = null;
editor.addEventListener('input', function () {
  if (saveId) clearTimeout(saveId);
  saveId = setTimeout(function () {
    localStorage.setItem(STORAGE_KEY, editor.innerText);
  }, 500);
});
```

500ms debounce — saves the template often enough that a page refresh
mid-edit preserves work, sparsely enough that we're not hammering
storage on every keystroke.

## F1.11 Tokens consumed

- `--vc-color-success` — known-slot highlight
- `--ve-accent` — unknown-slot highlight
- `--vc-font-mono` — the editor's font (for code; sans for prompt text)

## F1.12 When to use

| Use this pattern when… | Use a `<textarea>` when… |
|---|---|
| The user needs to see syntax / token highlighting WHILE typing | Plain unformatted text input is fine |
| The page wants to flag invalid input visually as the user types | Validation can wait until submit |
| The 3-sample preview pattern is wanted (live re-render on input) | No live preview is needed |
| The user needs to copy out the structured result | Plain text export is fine |
| The "throwaway editor + export" UX (see catalog mining §4.4) is the spec | A read-only display is fine |

## F1.13 Author rules

| Rule | Why |
|---|---|
| ALWAYS intercept Enter — `execCommand('insertText', '\n')` | Predictable cross-browser line breaks |
| ALWAYS intercept paste — extract `text/plain` | Prevent styled HTML from polluting the editor |
| Use RAF-debounced re-highlight, not per-keystroke | Smooth typing; avoids re-flow thrash |
| Save caret offset BEFORE rewriting innerHTML, restore AFTER | Without this, the caret jumps to position 0 on every edit |
| Save to localStorage on a 500ms debounce | Preserves work without hammering storage |
| Don't try to use this pattern for HUGE inputs (> 10K chars) | innerHTML re-write is O(n); above 10K, switch to a real editor library |

## F1.14 Mined source attribution

Catalog quote, source `20-editor-prompt-tuner.html`:

> *"The editor is a **contenteditable `<div>`** (not a textarea) so we
> can inject `<span class="slot">{{slot_name}}</span>` highlights
> directly into the live text without losing styling. The character
> offset is preserved across re-highlighting via a custom
> `getCaretOffset()` / `setCaretOffset()` pair that walks the DOM with
> a `TreeWalker` and counts characters. `Enter` is intercepted to
> insert a literal `\n` instead of a `<div>`. Paste is intercepted to
> force plain-text via `e.clipboardData.getData('text/plain')`.
> Updates are debounced via `requestAnimationFrame`."*

Adopted verbatim.
