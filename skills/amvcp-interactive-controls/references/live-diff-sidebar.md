# Live diff sidebar — always-visible only-changed-lines

For any form / editor / configurator where the user is mutating a
structured object: render a permanently visible sidebar showing a
unified diff between the FROZEN initial snapshot and the current
state. Every edit re-renders the diff; only the changed lines are
shown. A button trio (`Copy diff` / `Copy full` / `Reset`) lets the
user push the change downstream or roll back.

## What it is

Two-pane layout: edit form on the left, live diff on the right.
The user never has to commit-then-preview — they see exactly what
they will commit AT ALL TIMES. The pattern beats a Preview/Save
two-step flow because:

- The reviewer's eye stays on the diff while they tweak; no context
  switch.
- Reset is meaningful — there's a frozen `INITIAL` snapshot to roll
  back to.
- Copy-diff scales to thousands of fields: only what changed lands
  in the clipboard.

## Scaffold

Layout — flex two-pane with the diff sticky-positioned so it stays
visible as the form grows:

```html
<div class="ic-difflive" data-ic-difflive data-id="flags-editor"
     data-ic-model="ic-data" data-ic-model-key="flags">
  <form class="ic-difflive-form">
    <fieldset class="ic-difflive-group">
      <legend>Onboarding</legend>
      <label class="ic-difflive-row">
        <span>Show welcome dialog</span>
        <input type="checkbox" name="ob_welcome" checked>
      </label>
      <label class="ic-difflive-row">
        <span>Skip tour after 1st run</span>
        <input type="checkbox" name="ob_skip_tour">
      </label>
    </fieldset>
    <!-- additional fieldsets -->
  </form>

  <aside class="ic-difflive-side">
    <div class="ic-difflive-actions">
      <button class="ic-difflive-btn" data-ic-copy="diff" type="button">
        Copy diff
      </button>
      <button class="ic-difflive-btn" data-ic-copy="full" type="button">
        Copy full
      </button>
      <button class="ic-difflive-btn" data-ic-reset type="button">
        Reset
      </button>
    </div>
    <pre class="ic-difflive-pre" data-ic-difflive-out
         aria-live="polite" aria-label="Live diff">
{}
    </pre>
  </aside>
</div>
```

CSS:

```css
.ic-difflive {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 26rem);
  gap: var(--vc-space-4, 24px);
  margin: var(--vc-space-3, 16px) 0;
}
@media (max-width: 880px) {
  .ic-difflive { grid-template-columns: minmax(0, 1fr); }
}
.ic-difflive-side {
  position: sticky;
  top: var(--vc-space-4, 24px);
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-2, 12px);
}
.ic-difflive-actions {
  display: flex;
  gap: var(--vc-space-1, 8px);
}
.ic-difflive-btn {
  padding: var(--vc-space-1, 8px) var(--vc-space-3, 16px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--ve-control-bg, #ffffff);
  color: var(--ve-control-fg, #14110b);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.2
        var(--ve-control-font, inherit);
  cursor: pointer;
}
.ic-difflive-btn:hover { border-color: var(--vc-color-accent, #b8861f); }
.ic-difflive-pre {
  margin: 0;
  /* CRITICAL — NO inner overflow:auto; the page scrolls. */
  font: var(--vc-weight-regular, 400) var(--vc-text-0, 12px)/1.5
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  background: var(--vc-color-surface-sunken, #f1ece0);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  padding: var(--vc-space-2, 12px);
  color: var(--ve-control-fg, #14110b);
  white-space: pre;     /* let the page expand if a line wraps */
}
.ic-difflive-pre .ic-diff-add { color: var(--vc-color-success, #3a6b5c); }
.ic-difflive-pre .ic-diff-rem { color: var(--vc-color-danger,  #a84a32); }
.ic-difflive-pre .ic-diff-ctx { color: var(--ve-control-fg-dim, #5b5343); }
```

## JS engine

```js
function snapshotForm(form) {
  var fd = new FormData(form);
  var out = {};
  fd.forEach(function (v, k) { out[k] = String(v); });
  // also capture checked-state for unchecked checkboxes (FormData skips them)
  form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    if (!(cb.name in out)) { out[cb.name] = ''; }
    else { out[cb.name] = cb.checked ? 'on' : ''; }
  });
  return out;
}

function diff(a, b) {
  var keys = {};
  Object.keys(a).forEach(function (k) { keys[k] = 1; });
  Object.keys(b).forEach(function (k) { keys[k] = 1; });
  var sorted = Object.keys(keys).sort();
  var lines = [];
  for (var i = 0; i < sorted.length; i++) {
    var k = sorted[i];
    if (a[k] === b[k]) { continue; }
    if (a[k] !== undefined) { lines.push('-' + k + ' = ' + a[k]); }
    if (b[k] !== undefined) { lines.push('+' + k + ' = ' + b[k]); }
  }
  return lines.length ? lines.join('\n') : '(no changes)';
}

function initDiffLive(rootEl) {
  var form = rootEl.querySelector('.ic-difflive-form');
  var out  = rootEl.querySelector('[data-ic-difflive-out]');
  if (!form || !out) { return; }

  var INITIAL = Object.freeze(snapshotForm(form));

  function render() {
    var now = snapshotForm(form);
    var lines = diff(INITIAL, now);
    out.textContent = '';
    lines.split('\n').forEach(function (l) {
      var span = document.createElement('span');
      if (l[0] === '+') { span.className = 'ic-diff-add'; }
      else if (l[0] === '-') { span.className = 'ic-diff-rem'; }
      else { span.className = 'ic-diff-ctx'; }
      span.textContent = l + '\n';
      out.appendChild(span);
    });
  }

  // RAF-debounce so a burst of checkboxes is one repaint.
  var scheduled = false;
  function schedule() {
    if (scheduled) { return; }
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false; render();
    });
  }
  form.addEventListener('input',  schedule);
  form.addEventListener('change', schedule);

  rootEl.querySelector('[data-ic-reset]').addEventListener('click', function () {
    Object.keys(INITIAL).forEach(function (name) {
      var el = form.elements[name];
      if (!el) { return; }
      if (el.type === 'checkbox') { el.checked = INITIAL[name] === 'on'; }
      else { el.value = INITIAL[name]; }
    });
    render();
  });
  rootEl.querySelector('[data-ic-copy="diff"]').addEventListener('click', function () {
    copyText(out.textContent);
  });
  rootEl.querySelector('[data-ic-copy="full"]').addEventListener('click', function () {
    copyText(JSON.stringify(snapshotForm(form), null, 2));
  });

  render();
}
```

Re-use `copyText()` from `references/copy-clipboard-fallback.md` for
the `file://` fallback.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-success` | `+` lines |
| `--vc-color-danger` | `−` lines |
| `--ve-control-fg-dim` | context lines |
| `--vc-color-surface-sunken` | code-panel background |
| `--ve-control-mono` | diff font |
| `--ve-control-border` | button + panel border |
| `--vc-color-accent` | button hover border |

The `aria-live="polite"` on the `<pre>` announces every diff
update to AT users without barging in on focused conversations.

## Selection / comment / decision-mini

- **Selection.** Each form `<fieldset>` IS a selectable atom (one
  comment thread per group). The whole diff `<pre>` is a separate
  atom — "the diff is missing X".
- **Decision-mini.** The change set as a whole is binary —
  Approve / Deny / Skip the entire set. Attach the pill to the
  `.ic-difflive` root.
- **Comments.** A reviewer should be able to comment on a specific
  flag they want flipped back; the `<label class="ic-difflive-row">`
  is the right grain.

## JS-off degradation

**The form still works; the live diff does not.** With JS off:

- The form remains fully usable (real `<input>`s, real `<form>`,
  native submit on `<button type="submit">`).
- The diff pane stays empty (it lives in JS) — but the page is not
  blank; the buttons render but do nothing on click.
- A `<noscript>` block inside `.ic-difflive-side` can explain:
  "Live diff requires JavaScript; submit the form to see the
  server-side diff."

This is graceful: the *editor* is the essential feature; the diff is
a confidence-builder that's a real but secondary enhancement.

## Anti-patterns

- Maintaining a parallel JS state object alongside the DOM. The
  DOM IS the source of truth; `snapshotForm(form)` reads it. A
  mirror state guarantees drift on the first bug.
- Omitting the RAF debounce. A user holding ArrowUp on a number
  input fires `input` per keystroke; an O(n) diff per keystroke
  flakes the page on large forms.
- Using `JSON.stringify` directly for the diff output. The diff
  must be **only the changed lines**, not the whole object —
  otherwise the diff is the size of the form and "always-visible"
  becomes "always-scrolled-off-screen".
- Hard-coding the diff colors. Tint via `--vc-color-success` and
  `--vc-color-danger` so theme hot-swap recolors live.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Toggle a checkbox — diff shows exactly one line.
const cb = document.querySelector('input[name="ob_welcome"]');
cb.checked = false;
cb.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(r => requestAnimationFrame(r));
const out = document.querySelector('[data-ic-difflive-out]');
console.assert(out.textContent.indexOf('-ob_welcome = on') !== -1,
               'diff did not include the removal');

// Reset restores INITIAL.
document.querySelector('[data-ic-reset]').click();
await new Promise(r => requestAnimationFrame(r));
console.assert(cb.checked === true, 'reset did not restore');
console.assert(out.textContent.indexOf('(no changes)') !== -1);
```

Screenshot light + dark themes both with `(no changes)` and with
3-4 changed lines visible; verify the green/red diff colors are
distinguishable in both themes.
