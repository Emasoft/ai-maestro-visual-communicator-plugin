# Contenteditable live highlighter — caret-preserving re-render

The reference implementation of a "type → see colored tokens" widget:
a `contenteditable <div>`, a regex-based tokenizer, a custom
caret-offset save/restore pair, and a `requestAnimationFrame`-debounced
re-render. Used for prompt-template editors, slot inspectors,
inline-formula playgrounds, anything where the rendered text needs
syntactic feedback as the user types.

## What it is

`<textarea>` is the wrong primitive for "highlight while typing"
because it cannot host inline `<span>`s. The right primitive is a
`contenteditable <div>`. The challenge: every re-render of the div
collapses the selection back to the start. The solution: a
**character-offset save/restore** that walks the DOM tree via a
`TreeWalker`, counts characters, and re-positions the caret after
the re-paint.

## Scaffold

```html
<div class="ic-cellive" data-ic-cellive data-id="prompt-editor">
  <div class="ic-cellive-editor" contenteditable="true" spellcheck="false"
       aria-label="Editor"
       data-ic-cellive-target><br></div>
  <div class="ic-cellive-meta">
    <span class="ic-cellive-counter"><span data-ic-cellive-chars>0</span> chars · <span data-ic-cellive-tokens>0</span> tokens</span>
  </div>
</div>
```

Note the `<br>` placeholder — Safari refuses to focus an entirely
empty `contenteditable`.

CSS:

```css
.ic-cellive {
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  padding: var(--vc-space-2, 12px);
  background: var(--ve-control-bg, #ffffff);
  margin: var(--vc-space-3, 16px) 0;
}
.ic-cellive-editor {
  min-height: 8em;
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.5
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg, #14110b);
  white-space: pre-wrap;
  outline: none;
}
.ic-cellive-editor .ic-slot {
  background: color-mix(in srgb,
              var(--vc-color-warning, #c78a26) 18%, transparent);
  color: var(--ve-control-fg, #14110b);
  border-radius: var(--vc-radius-sm, 4px);
  padding: 0 var(--vc-space-0, 4px);
}
.ic-cellive-editor .ic-slot--unknown {
  background: transparent;
  border-bottom: 1px dashed var(--vc-color-danger, #a84a32);
  color: var(--vc-color-danger, #a84a32);
}
.ic-cellive-editor:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
.ic-cellive-meta {
  margin-top: var(--vc-space-1, 8px);
  font: var(--vc-weight-regular, 400) var(--vc-text-0, 12px)/1.2
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg-dim, #5b5343);
  font-variant-numeric: tabular-nums;
}
```

## JS engine — caret offset save/restore

```js
function getCaretOffset(root) {
  var sel = window.getSelection();
  if (!sel.rangeCount) { return 0; }
  var range = sel.getRangeAt(0);
  var pre = range.cloneRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function setCaretOffset(root, offset) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  var node;
  var consumed = 0;
  var sel = window.getSelection();
  var range = document.createRange();
  while ((node = walker.nextNode())) {
    var len = node.textContent.length;
    if (consumed + len >= offset) {
      range.setStart(node, offset - consumed);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    consumed += len;
  }
  // Past the end — put caret at the end.
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}
```

## JS engine — tokenize + re-render + RAF debounce

```js
var SLOT_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
var KNOWN_SLOTS = ['customer_name', 'plan_tier',
                   'ticket_subject', 'ticket_body', 'tone'];

function renderHighlighted(editor) {
  var text = editor.textContent;
  editor.textContent = '';   // wipe
  var lastIdx = 0;
  text.replace(SLOT_RE, function (m, slot, idx) {
    if (idx > lastIdx) {
      editor.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
    }
    var span = document.createElement('span');
    span.className = KNOWN_SLOTS.indexOf(slot) !== -1
      ? 'ic-slot' : 'ic-slot ic-slot--unknown';
    span.textContent = m;
    editor.appendChild(span);
    lastIdx = idx + m.length;
    return m;
  });
  if (lastIdx < text.length) {
    editor.appendChild(document.createTextNode(text.slice(lastIdx)));
  }
  if (!editor.firstChild) {
    editor.appendChild(document.createElement('br'));
  }
  return text;
}

function initCellive(rootEl) {
  var editor = rootEl.querySelector('[data-ic-cellive-target]');
  var chars  = rootEl.querySelector('[data-ic-cellive-chars]');
  var toks   = rootEl.querySelector('[data-ic-cellive-tokens]');
  if (!editor) { return; }

  var scheduled = false;
  function paint() {
    scheduled = false;
    var off = getCaretOffset(editor);
    var text = renderHighlighted(editor);
    setCaretOffset(editor, off);
    if (chars) { chars.textContent = String(text.length); }
    if (toks)  { toks.textContent  = String(Math.round(text.length / 4.2)); }
  }
  function schedule() {
    if (scheduled) { return; }
    scheduled = true;
    requestAnimationFrame(paint);
  }
  editor.addEventListener('input', schedule);

  // Strip foreign HTML on paste — only plain text in.
  editor.addEventListener('paste', function (ev) {
    ev.preventDefault();
    var text = (ev.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  // Force `\n` insert on Enter instead of <div>/<p>.
  editor.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      document.execCommand('insertText', false, '\n');
    }
  });
}
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` | editor background |
| `--ve-control-border` | editor border |
| `--vc-color-warning` | known-slot tint |
| `--vc-color-danger` | unknown-slot underline + text |
| `--ve-control-mono` | editor + counter font |
| `--vc-color-accent` | focus ring |
| `--ve-control-fg-dim` | counter color |

`tabular-nums` on the counter keeps the digit columns stable as the
char-count grows — no layout shift on each keystroke.

## Selection / comment / decision-mini

- **Selection.** The `.ic-cellive` container IS a selectable atom —
  the reader can comment on "this editor" as a whole ("rename
  customer_name to user_name").
- **Decision-mini.** A prompt-template draft is binary
  (Approve / Deny). Attach the pill.
- **Atom isolation for the editor's `contenteditable`.** Mark the
  editor with `data-ve-overlay="1"` so the runtime's click delegator
  bails out for clicks inside it — without that, every caret click
  would also toggle the atom selection. (Matches the Kanban
  card-note pattern in `references/drag-reorder.md`.)

## JS-off degradation

**The editor remains a usable text input; highlighting is lost.**
With JS off:

- `contenteditable="true"` still works natively — the user can
  type, paste, navigate with arrows.
- Token highlighting does NOT run; `{{slot_name}}` text appears
  plain.
- Paste sanitisation does NOT run — pasting from a styled source
  may inject HTML. This is a security concern only if untrusted
  paste content is involved. For the typical use case (the report's
  author typing their own prompt template) the JS-off baseline is
  acceptable.
- A `<noscript>` block inside `.ic-cellive-meta` should explain:
  "JavaScript required for live token highlighting."

The fallback is graceful for the read-mostly case; the edit-heavy
case implicitly requires JS, which is acceptable.

## Anti-patterns

- Using `innerHTML = …` to inject the highlight markup. XSS-prone
  if the user can paste — and the technique above already avoids
  it (every `<span>` constructed with `createElement` +
  `textContent`).
- Storing the editor state in a parallel JS string. The DOM IS the
  state — `editor.textContent` is the source of truth, the JS
  engine reads + writes it.
- Calling `renderHighlighted` on EVERY `input` event without RAF
  debouncing. Holding a key flakes the page on long documents.
- Forgetting the `<br>` placeholder in the empty editor — Safari
  refuses to focus an empty `contenteditable`.
- Allowing `Enter` to do its default (which inserts a `<div>` or
  `<p>` and breaks the tokenizer's plain-text invariant).

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Type a known slot — it tints; an unknown one — it underlines.
const editor = document.querySelector('[data-ic-cellive-target]');
editor.focus();
editor.textContent = 'Hi {{customer_name}}, your {{nonsense}} is ready.';
editor.dispatchEvent(new Event('input', { bubbles: true }));
await new Promise(r => requestAnimationFrame(r));

const known = editor.querySelector('.ic-slot:not(.ic-slot--unknown)');
const unknown = editor.querySelector('.ic-slot--unknown');
console.assert(known && known.textContent === '{{customer_name}}');
console.assert(unknown && unknown.textContent === '{{nonsense}}');

// Caret offset is preserved across the re-render.
editor.textContent = '';
const sel = window.getSelection();
const range = document.createRange();
range.setStart(editor, 0);
sel.removeAllRanges(); sel.addRange(range);
// type "{{plan_tier}}" character by character
'{{plan_tier}}'.split('').forEach(ch => {
  document.execCommand('insertText', false, ch);
});
await new Promise(r => requestAnimationFrame(r));
const offsetNow = getCaretOffset(editor);
console.assert(offsetNow === '{{plan_tier}}'.length,
               'caret offset not preserved');
```

Verify the slot tint reads in both light and dark themes (use
`color-mix` percentages around 18% to stay readable on either
background).
