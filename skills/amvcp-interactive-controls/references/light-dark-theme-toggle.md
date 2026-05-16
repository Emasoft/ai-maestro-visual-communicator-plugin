# Light/dark theme toggle

A segmented "Light / Dark" rocker in a sticky toolbar that flips
every component on the page to the matching theme by toggling a
single root class. Zero JS path uses radios + CSS attribute
selectors; JS layer adds persistence + system-preference detection.

## What it is

The DESIGN.md engine (`scripts/amvcp-designmd.js`) generates both
themes side-by-side and applies whichever is current. This widget
is the **user-facing switch** that picks between them. It must:

- Work CSS-only — pick the theme without JS.
- Remember the choice across reloads.
- Respect `prefers-color-scheme` on first visit.
- Apply the change synchronously so the page does not flash the
  wrong theme.

## Scaffold

A `<fieldset>` + 3 radios is the keyboard-native foundation; one
radio per choice (`auto` / `light` / `dark`).

```html
<fieldset class="ic-theme-switch" data-ic-theme-switch
          role="radiogroup" aria-label="Theme">
  <legend class="ic-theme-switch-legend">Theme</legend>
  <input class="ic-theme-radio" type="radio" name="ic-theme"
         id="ic-theme-auto"  value="auto"  checked>
  <label class="ic-theme-label" for="ic-theme-auto">Auto</label>
  <input class="ic-theme-radio" type="radio" name="ic-theme"
         id="ic-theme-light" value="light">
  <label class="ic-theme-label" for="ic-theme-light">Light</label>
  <input class="ic-theme-radio" type="radio" name="ic-theme"
         id="ic-theme-dark"  value="dark">
  <label class="ic-theme-label" for="ic-theme-dark">Dark</label>
</fieldset>
```

CSS — visually-hidden radios drive a 3-segment rocker:

```css
.ic-theme-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--vc-space-1, 8px);
  padding: 2px;
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--ve-control-bg, #ffffff);
  margin: 0;
}
.ic-theme-switch-legend {
  /* visually-hidden — the role + aria-label cover AT */
  position: absolute; clip: rect(0 0 0 0); padding: 0; border: 0;
  width: 1px; height: 1px; overflow: hidden;
}
.ic-theme-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px; height: 1px;
}
.ic-theme-label {
  display: inline-block;
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border-radius: var(--vc-radius-full, 9999px);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.2
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg-dim, #5b5343);
  cursor: pointer;
}
.ic-theme-radio:checked + .ic-theme-label {
  background: var(--vc-color-accent, #b8861f);
  color: var(--vc-color-on-accent, #ffffff);
}
.ic-theme-radio:focus-visible + .ic-theme-label {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
```

## CSS-only theme application (the no-JS path)

The DESIGN.md engine binds `--vc-*` tokens conditionally on
`:root[data-vc-theme="light"]` and `:root[data-vc-theme="dark"]`.
The CSS-only switch can drive `data-vc-theme` on `<html>` via
no JS — set it correctly in the markup at render time so the
correct theme is applied at first paint, and let the JS layer flip
it when the user makes a choice.

For the "Auto" pick, the DESIGN.md engine emits the matching
`@media (prefers-color-scheme: dark)` block automatically; with
`data-vc-theme` absent the page picks whichever the OS reports.

## JS layer

```js
function initThemeSwitch(el) {
  var STORE_KEY = 'amvcp-ic:theme';
  var radios = el.querySelectorAll('.ic-theme-radio');
  var html = document.documentElement;

  function apply(val) {
    if (val === 'auto') {
      html.removeAttribute('data-vc-theme');
    } else {
      html.setAttribute('data-vc-theme', val);
    }
    // Fire a public event so other components can react. The
    // DESIGN.md engine listens for 'themechange' and re-emits.
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: val }
    }));
  }
  function restore() {
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (!saved) { return; }
    radios.forEach(function (r) {
      if (r.value === saved) { r.checked = true; }
    });
    apply(saved);
  }
  function save(val) {
    try { localStorage.setItem(STORE_KEY, val); } catch (e) {}
  }
  radios.forEach(function (r) {
    r.addEventListener('change', function () {
      if (!r.checked) { return; }
      apply(r.value);
      save(r.value);
    });
  });
  restore();
}
document.querySelectorAll('[data-ic-theme-switch]').forEach(initThemeSwitch);
```

## First-paint flash protection (inline preamble)

Add to `<head>` BEFORE the main stylesheet so the right theme is on
when the first paint happens:

```html
<script>
(function () {
  try {
    var t = localStorage.getItem('amvcp-ic:theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-vc-theme', t);
    }
  } catch (e) { /* private mode — skip */ }
})();
</script>
```

This 9-line blocking script runs before any stylesheet loads, so
the dark/light decision is in place when the user sees the first
pixel. Without this preamble, the page flashes light → user's saved
theme → done in ~200 ms.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | active radio fill |
| `--vc-color-on-accent` | active radio text |
| `--ve-control-bg` / `--ve-control-border` | switch chrome |
| `--ve-control-fg-dim` | inactive label |
| `--vc-radius-full` | pill shape |

The switch chrome itself is theme-agnostic — it relies on the
`--vc-*` tokens which the engine mirrors per theme; no rule in this
widget branches on theme.

## Selection / comment / decision-mini

- **The switch is a control, not content.** It does NOT get
  `data-ve-id`. A comment thread on a theme picker would be noise.
- **`themechange` event** is the integration seam — comment
  threads, decision pills, anything sensitive to theme listens for
  the event and refreshes its tints.

## JS-off degradation

**The switch shows but cannot change theme.** With JS off:

- The radios are functional (the user can pick one) but no JS
  reads the choice to flip the root attribute.
- The page renders with the author-set initial theme (or the OS
  preference via `@media (prefers-color-scheme: dark)`).

Mitigation: when authoring a report whose JS-disabled audience is
real (printed reports, e-mailed snapshots), drop the switch
entirely and rely on `prefers-color-scheme`. The switch is for
*interactive* contexts.

## Anti-patterns

- A `<button>` with click handler instead of `<input type="radio">`.
  Loses the keyboard-native rocker (arrow keys cycle radios within
  a radiogroup automatically).
- Storing the picked theme as a class name on `<body>` and writing
  CSS like `.theme-dark .ic-card { … }`. Forces every component
  to ship two versions of every rule. The
  `[data-vc-theme] :root --vc-*` token approach is one source of
  truth — every component reads `var(--vc-color-…)`, and the only
  thing that changes per theme is the variable's binding.
- Skipping the inline preamble. The reader sees a one-frame flash
  of the wrong theme; this is jarring and looks broken.
- Triggering theme change with `setTimeout` or after async work.
  The change MUST be synchronous on user input.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Pick "dark" — root attribute flips, event fires, localStorage written.
const dark = document.querySelector('#ic-theme-dark');
let fired = null;
window.addEventListener('themechange', e => fired = e.detail.theme, { once: true });
dark.checked = true;
dark.dispatchEvent(new Event('change', { bubbles: true }));
console.assert(document.documentElement.getAttribute('data-vc-theme') === 'dark');
console.assert(fired === 'dark', 'themechange did not fire');
console.assert(localStorage.getItem('amvcp-ic:theme') === 'dark');

// Pick "auto" — attribute removed.
const auto = document.querySelector('#ic-theme-auto');
auto.checked = true;
auto.dispatchEvent(new Event('change', { bubbles: true }));
console.assert(!document.documentElement.hasAttribute('data-vc-theme'));
```

Capture a screenshot in each of the three states (auto / light /
dark) and verify the switch's active-segment pill highlights the
correct choice in each theme.
