# Sub-technique F2 — Live diff sidebar (always-visible, only changed lines)

## Table of Contents

- [F2.1 The pattern](#f21-the-pattern)
- [F2.2 The page layout](#f22-the-page-layout)
- [F2.3 The state model](#f23-the-state-model)
- [F2.4 The diff renderer](#f24-the-diff-renderer)
- [F2.5 The Copy / Reset actions](#f25-the-copy--reset-actions)
- [F2.6 The "warning banner" pairing](#f26-the-warning-banner-pairing)
- [F2.7 The "no changes yet" empty state](#f27-the-no-changes-yet-empty-state)
- [F2.8 Selection / commenting](#f28-selection--commenting)
- [F2.9 The "throwaway editor + export" framing](#f29-the-throwaway-editor--export-framing)
- [F2.10 Tokens consumed](#f210-tokens-consumed)
- [F2.11 Author rules](#f211-author-rules)
- [F2.12 Mined source attribution](#f212-mined-source-attribution)

A sidebar that continuously shows the diff between the current form
state and the original state — only the changed lines, not the full
file. Plus `Copy diff`, `Copy full`, `Reset` buttons. Mined from
`19-editor-feature-flags.html` (html-effectiveness catalog #19).

Mined catalog quote: *"The **'live diff sidebar'** pattern (always-
visible, only the changed lines) is far more useful than a 'preview /
save' two-step flow."* — adopted as a first-class code-highlight
technique for any form-based editor.

## F2.1 The pattern

Left side: a form (toggles, inputs, dropdowns) editing some
configuration. Right side: a sticky sidebar showing the DIFF of the
current state vs the original. Every form change re-computes the diff
and re-renders.

The sidebar shows ONLY changed lines (not the full file) — keeping
the visual focused on what the user actually changed.

Three buttons at the bottom of the sidebar:
- **Copy diff** — copies the diff text to clipboard
- **Copy full** — copies the entire computed file (all flags, not just
  changed) to clipboard
- **Reset** — restores all form fields to original state, clears the
  diff

## F2.2 The page layout

```html
<main class="ve-live-diff">
  <section class="ve-live-diff__form">
    <h2>Feature flags</h2>
    <!-- the form — toggles, inputs, etc. — owned by amvcp-interactive-controls -->
    <div class="ve-form-panel">
      <h3>Onboarding</h3>
      <div class="ve-form-row">
        <label for="flag-welcome">
          <input type="checkbox" id="flag-welcome" data-ve-flag="welcome">
          welcome_modal
        </label>
        <p>Show the welcome modal to new signups.</p>
      </div>
      …
    </div>
  </section>

  <aside class="ve-live-diff__sidebar">
    <h3>Pending changes</h3>
    <div class="ve-live-diff__diff">
      <pre><code class="language-diff" id="live-diff-pre">  // no changes yet</code></pre>
    </div>
    <div class="ve-live-diff__actions">
      <button type="button" class="ve-btn" data-action="copy-diff">Copy diff</button>
      <button type="button" class="ve-btn" data-action="copy-full">Copy full JSON</button>
      <button type="button" class="ve-btn ve-btn--ghost" data-action="reset">Reset</button>
    </div>
  </aside>
</main>
```

CSS:

```css
.ve-live-diff {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
}
.ve-live-diff__sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
}
@media (max-width: 900px) {
  .ve-live-diff { grid-template-columns: 1fr; }
  .ve-live-diff__sidebar { position: static; }
}
```

## F2.3 The state model

```js
var ORIGINAL = {
  welcome:     true,
  feature_x:   false,
  feature_y:   true,
  rollout_pct: 20,
  // … etc. The "saved" state, loaded from server or fixture
};

var current = JSON.parse(JSON.stringify(ORIGINAL));   // deep copy

document.querySelectorAll('[data-ve-flag]').forEach(function (input) {
  var name = input.dataset.veFlag;
  // Initial: set the checkbox to original state
  if (input.type === 'checkbox') input.checked = ORIGINAL[name];
  else input.value = ORIGINAL[name];

  input.addEventListener('change', function () {
    current[name] = (input.type === 'checkbox') ? input.checked : input.value;
    renderDiff();
  });
});
```

`current` is the user's edits in memory. `ORIGINAL` is the baseline.
Diff = the per-key difference.

## F2.4 The diff renderer

```js
function renderDiff() {
  var diffEl = document.getElementById('live-diff-pre');
  var changedKeys = Object.keys(current).filter(function (k) {
    return current[k] !== ORIGINAL[k];
  });
  if (changedKeys.length === 0) {
    diffEl.innerHTML = escapeHtml('// no changes yet');
    diffEl.parentElement.classList.remove('ve-live-diff__diff--has-changes');
    return;
  }
  diffEl.parentElement.classList.add('ve-live-diff__diff--has-changes');
  var lines = changedKeys.map(function (k) {
    return '-  "' + k + '": ' + JSON.stringify(ORIGINAL[k])
      + '\n+  "' + k + '": ' + JSON.stringify(current[k]);
  });
  // Manually mark each line with data-ve-diff so the diff CSS tints
  diffEl.innerHTML = lines.map(function (pair) {
    var both = pair.split('\n');
    return '<span class="ve-code-line" data-ve-diff="del">' + escapeHtml(both[0]) + '</span>'
         + '<span class="ve-code-line" data-ve-diff="add">' + escapeHtml(both[1]) + '</span>';
  }).join('');
}
```

The diff is hand-built (no diff library) — for a config-flag editor,
the "diff" is just per-key old-vs-new, expressed in unified-diff
syntax. The result reads naturally as a JSON-fragment diff.

For TEXTUAL diffs (the user is editing a multi-line text field), use a
proper line-diff algorithm (Myers diff, or import a small library).

## F2.5 The Copy / Reset actions

```js
document.querySelectorAll('[data-action]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var action = btn.dataset.action;
    if (action === 'copy-diff') {
      var diffEl = document.getElementById('live-diff-pre');
      var text = diffEl.innerText;
      copyToClipboard(text);
    } else if (action === 'copy-full') {
      copyToClipboard(JSON.stringify(current, null, 2));
    } else if (action === 'reset') {
      current = JSON.parse(JSON.stringify(ORIGINAL));
      document.querySelectorAll('[data-ve-flag]').forEach(function (input) {
        var name = input.dataset.veFlag;
        if (input.type === 'checkbox') input.checked = ORIGINAL[name];
        else input.value = ORIGINAL[name];
      });
      renderDiff();
    }
  });
});

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  // (success swap UI is owned by the button — see [copy-button.md] for the pattern)
}
```

## F2.6 The "warning banner" pairing

When the form has conditional dependencies (flag A requires flag B
enabled), the sidebar also tracks WARNINGS:

```js
function renderWarnings() {
  var warnings = [];
  if (current.feature_x && !current.welcome) {
    warnings.push('feature_x requires welcome_modal enabled');
  }
  // …
  document.getElementById('warning-banner').innerHTML = warnings.length === 0
    ? ''
    : '<strong>' + warnings.length + ' warning' + (warnings.length === 1 ? '' : 's') + '</strong> '
      + warnings.join('; ');
}
```

The warning banner appears at the TOP of the page; the offending form
row also gets a clay-left-border tint. The reader sees both — the
banner is the count, the row is the location.

## F2.7 The "no changes yet" empty state

When no flags are changed, the diff sidebar shows `// no changes yet`
as a comment line (rendered with `data-ve-diff="ctx"` colour, no tint).
The Copy / Reset buttons are still visible but Reset is a no-op.

Don't HIDE the sidebar when empty — it's reassuring to the user that
the sidebar is THERE, just empty. Hiding makes the page jump on first
edit.

## F2.8 Selection / commenting

The diff sidebar's `<pre>` IS a normal code block. The runtime's
`initCodeGutter` runs on it, providing gutter / selection / comment-
pill. A reader selecting "the diff for the feature_x change" can
comment on it via the standard pill.

This means: the LIVE-EDIT machinery + the SELECTION machinery cohabit
the same page. The user can edit the form, watch the diff appear in
the sidebar, then select lines in the diff and ask an agent about
them. Powerful UX.

## F2.9 The "throwaway editor + export" framing

The catalog's §4.4 mining identifies the "throwaway editor + export"
pattern as a category. The live-diff sidebar IS the canonical export
mechanism for that category — the editor lets the user manipulate
state; the diff/copy buttons turn the state back into a copy-pasteable
text artefact.

Other editors in the same category (`18-editor-triage-board`, `20-
editor-prompt-tuner`) use slightly different export buttons
(`Copy as markdown`, `Copy prompt`), but the principle is the same.

## F2.10 Tokens consumed

- All from [diff-blocks-unified.md](./diff-blocks-unified.md) (the
  sidebar is a diff block)
- `--vc-color-neutral-100` / `-300` — sidebar bg, button neutrals
- `--ve-accent` — Copy diff button accent
- `--vc-color-danger` — warning banner / row tint
- `--vc-radius-md` — button radii

## F2.11 Author rules

| Rule | Why |
|---|---|
| Show ONLY changed lines in the diff, not the full file | Focus the eye; the empty state ("no changes yet") is honest |
| Provide both "Copy diff" AND "Copy full" buttons | Different downstream uses (paste as PR change vs paste as new config) |
| Reset button = restore form fields + clear diff (not just clear diff) | Otherwise the form and diff desync |
| Use a 500ms debounce on the diff renderer if the form has many fields | Avoids re-renders on every keystroke in a text input |
| Don't hide the sidebar when empty | Reassuring presence |
| Pair warnings with row-level visual tints (the form row) | The banner tells "how many"; the row tells "where" |

## F2.12 Mined source attribution

Catalog quote, source `19-editor-feature-flags.html`:

> *"The right sidebar always shows a live unified-diff preview of just
> the changed flags + a 'Copy diff' / 'Copy full JSON' / 'Reset' button
> stack."*

Catalog discussion:

> *"The **'live diff sidebar'** pattern (always-visible, only the
> changed lines) is far more useful than a 'preview / save' two-step
> flow."*

Adopted as the canonical live-edit + diff-export visualization.
