# Keyboard shortcuts — bindings, scoping, hint overlay

The pattern for adding keyboard shortcuts to a static report
without breaking native input focus. Includes the case-insensitive
key-comparison rule, the modifier-key conventions, and a "?" overlay
that prints the bindings.

## What it is

Keyboard shortcuts in a generated report (e.g. arrow keys to
navigate slides, "/" to focus search, "Esc" to close a panel) make
power users 10× faster — but break:

- When the user is typing in an `<input>` / `<textarea>` /
  `<contenteditable>`.
- When the key is part of a Shift-modified accelerator (Shift turns
  `'z'` into `'Z'`; strict comparison breaks).
- When the AT's command keys clash with the page's.
- When the page hijacks browser shortcuts (Cmd+R, Cmd+W, etc.).

This pattern lays down the conventions and the helper.

## Helper — register a shortcut

```js
function isEditingTarget(t) {
  if (!t) { return false; }
  if (t.isContentEditable) { return true; }
  var tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function bind(combo, handler, opts) {
  opts = opts || {};
  // combo: { key:'z', code:'KeyZ', meta:true, shift:true, ctrl:false, alt:false }
  document.addEventListener('keydown', function (ev) {
    if (isEditingTarget(ev.target) && !opts.allowInInput) { return; }
    if (combo.code && ev.code !== combo.code) { return; }
    if (combo.key && ev.key.toLowerCase() !== combo.key.toLowerCase()) { return; }
    if ((combo.meta  || false) !== (ev.metaKey  || false)) { return; }
    if ((combo.shift || false) !== ev.shiftKey)            { return; }
    if ((combo.ctrl  || false) !== ev.ctrlKey)             { return; }
    if ((combo.alt   || false) !== ev.altKey)              { return; }
    handler(ev);
    if (opts.preventDefault !== false) { ev.preventDefault(); }
  });
}
```

The `key.toLowerCase()` comparison is the **critical** detail
(per `browser-ui-test-techniques.md` rule #4): with Shift held,
`ev.key` is the uppercase letter; comparing `ev.key === 'z'`
silently fails. Either compare case-insensitively (as above) OR
use `ev.code === 'KeyZ'` which is the physical-key code, modifier-
independent.

## Standard bindings

| Combo | Action |
|---|---|
| `?` | Open shortcut help overlay |
| `Esc` | Close current modal / popover / overlay |
| `/` | Focus the page's search input (if any) |
| `j` / `k` | Next / previous item (slide, finding, row) |
| `Cmd+K` (Mac) / `Ctrl+K` (other) | Quick-jump palette |
| `Cmd+Z` / `Cmd+Shift+Z` | Undo / redo (in editors) |

Mac convention: `Cmd` for actions, `Ctrl` for selection-style
modifiers. Cross-platform code reads `ev.metaKey || ev.ctrlKey` for
"the primary modifier" — but binds them as **separate combos** so
the page works for both Mac and PC users:

```js
bind({ key: 'k', meta: true },  openPalette);   // Mac
bind({ key: 'k', ctrl: true },  openPalette);   // PC + Linux
```

## Help overlay

When the user presses `?`, show a panel listing every binding. The
panel is itself a `<dialog>` (see `references/popover-and-dialog.md`)
to inherit ESC-to-close + focus-trap + top-layer for free:

```html
<dialog class="ic-shortcuts-dialog" id="ic-shortcuts">
  <header>
    <h2>Keyboard shortcuts</h2>
    <button type="button" autofocus class="ic-dialog-cancel"
            onclick="this.closest('dialog').close()">Close</button>
  </header>
  <dl class="ic-shortcuts-list">
    <dt><kbd>?</kbd></dt>            <dd>Show shortcuts</dd>
    <dt><kbd>Esc</kbd></dt>          <dd>Close panel</dd>
    <dt><kbd>j</kbd> / <kbd>k</kbd></dt> <dd>Next / previous slide</dd>
    <dt><kbd>⌘K</kbd></dt>           <dd>Open quick jump</dd>
  </dl>
</dialog>
```

CSS:

```css
.ic-shortcuts-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--vc-space-1, 8px) var(--vc-space-3, 16px);
  margin: var(--vc-space-3, 16px) 0 0;
}
.ic-shortcuts-list dt { margin: 0; }
.ic-shortcuts-list dd { margin: 0; }
.ic-shortcuts-list kbd {
  display: inline-block;
  padding: 1px var(--vc-space-1, 8px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-bottom-width: 2px;
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--ve-control-bg, #ffffff);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg, #14110b);
}
```

Bind `?` to open the dialog:

```js
bind({ key: '?', shift: true }, function () {
  // '?' is Shift+'/' on US layout — many layouts produce it directly
  // via a no-modifier key. Bind BOTH so non-US keyboards work.
  document.getElementById('ic-shortcuts').showModal();
});
bind({ key: '?' }, function () {
  document.getElementById('ic-shortcuts').showModal();
});
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` / `--ve-control-border` | kbd chrome |
| `--ve-control-mono` | kbd font |
| `--vc-radius-sm` | kbd corners |
| (dialog tokens) | from `references/popover-and-dialog.md` |

The two-edge kbd shadow (`border-bottom-width: 2px`) is the conventional
"physical key" affordance — costs nothing, reads immediately.

## Selection / comment / decision-mini

- **The shortcuts dialog content** is a selectable atom for the
  reader who wants to comment "rebind Esc to ?" or "missing K
  shortcut".
- **Decision-mini** does not apply per-shortcut — the bindings are
  global behaviour, not content rows.

## JS-off degradation

**No shortcuts.** With JS off:

- Every `keydown` handler is missed.
- Native browser shortcuts (Cmd+F find, Cmd+R reload) still work.
- The `?` overlay does not open.

Mitigation: every shortcut MUST have an alternative path — a
clickable button, a menu item, an arrow link. Shortcuts are
power-user enhancement; the page must remain navigable without them.

## Anti-patterns

- Comparing `ev.key === 'Z'` (strict) — silently breaks the
  Shift-modified version of the same shortcut. Always
  case-insensitive or use `ev.code`.
- Triggering the page's shortcut even when the user is typing in
  a `<textarea>`. Always check `isEditingTarget(ev.target)`.
- Stealing browser shortcuts (Cmd+W, Cmd+T, Cmd+R) — the browser
  reserves these. Worst-case the page does nothing; best-case it
  alienates the user.
- Binding via `keypress` event — deprecated, doesn't fire for
  non-printable keys. Use `keydown`.
- Not exposing the bindings — undiscoverable shortcuts are useless.
  Always ship the `?` help overlay or a footer hint.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Cmd+K opens palette (Mac).
let opened = false;
bind({ key: 'k', meta: true }, () => { opened = true; });
await page.keyboard.down('Meta');
await page.keyboard.press('k');
await page.keyboard.up('Meta');
console.assert(opened);

// Cmd+Shift+Z (with case-insensitive comparison) still works.
let redoFired = false;
bind({ key: 'z', meta: true, shift: true }, () => { redoFired = true; });
await page.keyboard.down('Meta');
await page.keyboard.down('Shift');
await page.keyboard.press('z');  // browser reports as 'Z' under Shift
await page.keyboard.up('Shift');
await page.keyboard.up('Meta');
console.assert(redoFired, 'shift-modified shortcut missed');

// Typing in an <input> — shortcut suppressed.
const input = document.querySelector('input');
input.focus();
opened = false;
await page.keyboard.down('Meta');
await page.keyboard.press('k');
await page.keyboard.up('Meta');
console.assert(!opened, 'shortcut fired inside input');
```

Open the help dialog in both themes; verify the kbd-style chips
render with the right border-bottom thickness in both.
