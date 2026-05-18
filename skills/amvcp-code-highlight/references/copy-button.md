# Sub-technique A5 — Floating copy-to-clipboard button

## Table of Contents

- [A5.1 What it does](#a51-what-it-does)
- [A5.2 Where the byte-exact source comes from](#a52-where-the-byte-exact-source-comes-from)
- [A5.3 The SVG glyphs](#a53-the-svg-glyphs)
- [A5.4 The button markup the runtime injects](#a54-the-button-markup-the-runtime-injects)
- [A5.5 The transport — clipboard API + textarea fallback](#a55-the-transport--clipboard-api--textarea-fallback)
- [A5.6 The success swap](#a56-the-success-swap)
- [A5.7 What the button does NOT do](#a57-what-the-button-does-not-do)
- [A5.8 Diff-mode copy: opt for the resolved side](#a58-diff-mode-copy-opt-for-the-resolved-side)
- [A5.9 The CSV / data-fence variant](#a59-the-csv--data-fence-variant)
- [A5.10 What an author can override](#a510-what-an-author-can-override)
- [A5.11 Tokens consumed](#a511-tokens-consumed)

The top-right `.ve-code-copy-btn`, SVG clipboard glyph, `--success`
state swap on click, byte-exact source payload, navigator-clipboard +
textarea-fallback transport. Implements CB-05 (HAVE — runtime
baseline, **document & preserve**; PHASE2 backlog §12 A2).

## A5.1 What it does

Every `.ve-code-block` gets a floating button in its top-right corner.
Click → copies the byte-exact source to the clipboard (no line
numbers, no wrap-indent, no token-span markup). 1.2-second visual
feedback (`✓` glyph + `--success` colour) confirms the copy landed.

The button is **opt-out via `data-ve-no-gutter`** (the gutter and the
button ship together — opt out of the gutter, opt out of the button).
There is no separate `data-ve-no-copy`.

## A5.2 Where the byte-exact source comes from

`initCodeGutter` stashes the raw source on the wrapper BEFORE running
the per-line span rebuild:

```js
wrapper.__veSourceText = raw;   // raw === pre.textContent (trailing \n trimmed)
```

The copy handler reads `wrapper.__veSourceText` — NEVER the rendered
DOM (which would include line numbers as visible characters and would
lose CSS-only soft-wrap fidelity, AND would now also include token-
span markup the tokenizer added). The source is captured before any
rendering decision is made.

This is the **single source of truth** for "what the user copied" —
matching the project's one-source-of-truth principle.

## A5.3 The SVG glyphs

Two SVG strings cached in `initCodeGutter`:

```js
var SVG_CLIPBOARD = '<svg xmlns="…" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"'
  +   ' d="M5 3h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M6 2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1z"/>'
  + '</svg>';

var SVG_CHECK = '<svg xmlns="…" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  +   ' d="M3 8.5l3.5 3.5L13 5"/>'
  + '</svg>';
```

**Why inline SVG, not a Unicode glyph?** An earlier version used the
character `⧉` (U+29C9, TWO JOINED SQUARES) — but it fell through to a
missing-glyph box on iTerm2's WKWebView (the system monospace fallback
chain has nothing for U+29C9). Inline SVG renders identically on every
browser/font.

`stroke="currentColor"` means the glyph inherits the surrounding text
colour and re-themes automatically. The two glyphs are 14×14 — small
enough to fit a tight top-right corner without dominating the block,
big enough to read at 16:9 viewport scaling.

## A5.4 The button markup the runtime injects

```html
<button type="button" class="ve-code-copy-btn"
        title="Copy code to clipboard"
        aria-label="Copy code block to clipboard"
        data-ve-overlay="1">
  <svg>…clipboard glyph…</svg>
</button>
```

Key attributes:
- `type="button"` — never a form submitter
- `data-ve-overlay="1"` — exempts the button from the runtime's atom-
  selection mousedown listener (so clicking the button does NOT
  start a drag-paint on the underlying code)
- `aria-label` distinct from `title` so screen readers announce the
  action even when the tooltip is suppressed.

The CSS rules (`scripts/amvcp-runtime.js → injectStyles()`):

```css
.ve-code-copy-btn {
  position: absolute;
  top: 8px; right: 8px;
  background: var(--ve-surface, #f6f0e0);
  border: 1px solid color-mix(in srgb, var(--ve-accent, #b8861f) 35%, transparent);
  border-radius: 6px;
  padding: 5px 7px;
  cursor: pointer;
  color: var(--ve-control-fg, #ede5dd);
  opacity: 0.4;
  transition: opacity 120ms ease, color 120ms ease, background 120ms ease;
  z-index: 2;
}
.ve-code-block:hover .ve-code-copy-btn,
.ve-code-copy-btn:focus-visible { opacity: 1; }
.ve-code-copy-btn--success {
  color: var(--ve-success, #6a9955);
  background: color-mix(in srgb, var(--ve-success, #6a9955) 18%, transparent);
}
```

- `opacity: 0.4` at rest → `1` on block hover or button focus. Visible
  enough to discover, subtle enough not to dominate.
- `--success` swap shows the `✓` glyph in the project's olive success
  colour for 1.2s after a successful copy.

## A5.5 The transport — clipboard API + textarea fallback

```js
copyBtn.addEventListener('click', function (ev) {
  ev.preventDefault();
  ev.stopPropagation();              // don't bubble to atom-selection
  var src = wrapper.__veSourceText || '';
  var done = function () {
    copyBtn.classList.add('ve-code-copy-btn--success');
    copyBtn.innerHTML = SVG_CHECK;
    setTimeout(function () {
      copyBtn.classList.remove('ve-code-copy-btn--success');
      copyBtn.innerHTML = SVG_CLIPBOARD;
    }, 1200);
  };
  var fallback = function () {
    var ta = document.createElement('textarea');
    ta.value = src;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); }
    catch (_) { /* nothing else to try */ }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(src).then(done).catch(fallback);
  } else {
    fallback();
  }
});
```

Order matters:
1. **Modern path** — `navigator.clipboard.writeText` (the async,
   permissions-prompt API). Works on all current browsers in secure
   contexts.
2. **Fallback** — off-screen `<textarea>` + `document.execCommand('copy')`.
   The execCommand API is officially deprecated but every browser
   still ships it; required for `file://` contexts where the modern
   API is rejected.

`ev.preventDefault()` + `ev.stopPropagation()` are mandatory:
- `preventDefault` cancels any default click behaviour (none here, but
  defensive).
- `stopPropagation` keeps the click from bubbling to the runtime's
  atom-selection mousedown listener (which would otherwise toggle the
  underlying `.ve-code-block`'s selection state).

## A5.6 The success swap

The 1.2-second window is calibrated:
- < 800ms — too fast; the reader's eye doesn't register the change
  before it reverts
- > 1800ms — too slow; subsequent clicks feel sluggish, the button
  appears "stuck"
- 1200ms — long enough to register, short enough to remain responsive

The check glyph + olive bg is the project's standard "success
performed" indicator — same as form-submit success states elsewhere in
the runtime.

## A5.7 What the button does NOT do

- It does NOT copy with line numbers. They render via CSS counter, not
  in the source text content.
- It does NOT copy with wrap-marker bars. Those are CSS background-
  image gradients.
- It does NOT copy with token-span markup. The stashed
  `__veSourceText` is plain text.
- It does NOT copy a different version per theme. The source is the
  source.
- It does NOT survive `<details>` collapse. If the `<pre>` is inside a
  closed `<details>`, the button is hidden (the block has no
  measured size); reopen the details to reveal.

## A5.8 Diff-mode copy: opt for the resolved side

A unified diff's copy button copies the byte-exact source as written
(including `+ ` / `- ` / leading `  ` markers — that IS the source
of a diff). A split diff copies the side the button lives on (the
"after" pane by default, the "before" pane on the before block). See
[diff-blocks-split.md](./diff-blocks-split.md) for the per-pane wiring.

If the author wants "copy the resolved version" (post-add, pre-del
lines only) the right pattern is a separate `<pre>` rendered next to
the diff — not a transformed copy button. The button copies what's
shown.

## A5.9 The CSV / data-fence variant

A `<pre>` whose content is comma-separated data (CSV) or JSON-as-text
still gets a copy button — the source IS the artefact. No special
attribute needed. See [csv-and-data-fences.md](./csv-and-data-fences.md)
for the data-vs-code distinction the author still has to make for
language detection.

## A5.10 What an author can override

- **Position:** the runtime sets `top: 8px; right: 8px` — to move it,
  author a page-stylesheet rule. There is no `data-ve-copy-pos`
  attribute.
- **Icon:** the runtime owns the icon. To replace, the author overrides
  the `.ve-code-copy-btn > svg` rule via CSS, or runs a post-render
  pass that swaps `button.innerHTML`. NOT recommended — the default
  works everywhere.
- **Suppress:** there is no per-block suppress. If a block genuinely
  shouldn't be copyable, use `data-ve-no-gutter` to opt the whole
  block out of the runtime treatment.

## A5.11 Tokens consumed

- `--ve-surface` — button background
- `--ve-accent` — button border tint
- `--ve-control-fg` — glyph colour
- `--ve-success` — the success-state swap colour
