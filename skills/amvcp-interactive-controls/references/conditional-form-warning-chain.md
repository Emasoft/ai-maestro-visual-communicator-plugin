# Conditional form warning chain — prerequisite + warning glyph + banner

For any form where one option is only meaningful when another option
is enabled (or N other options): a 3-layer feedback chain — the row
itself warns, the in-row "Requires" chip turns clay with a
warning glyph, and a top-of-form banner reports the count of
unmet prerequisites. The pattern keeps the user from saving an
inconsistent state without a modal dialog.

## What it is

Forms accumulate constraints: "Show advanced settings requires Admin
role", "Feature B requires Feature A", "Beta opt-in requires
Telemetry on". Naive forms let the user toggle anything and only
explode at submit time. This pattern provides **always-visible**
warnings:

1. **Row tint** — the offending row gets a clay-tinted background
   with a left-border accent.
2. **In-row chip** — the "Requires X" mini-tag turns clay, gains a
   warning glyph.
3. **Top-of-form banner** — count of unmet prerequisites, with a
   "Show first" link that scrolls to the first offending row.

## Scaffold

Each row declares its prerequisites via `data-ic-requires` (a
space-separated list of OTHER input names that must be truthy):

```html
<form class="ic-cform" data-ic-cform>
  <div class="ic-cform-banner" data-ic-cform-banner
       role="alert" aria-live="polite" hidden>
    <strong data-ic-cform-banner-count>0</strong>
    <span> unmet prerequisite(s). </span>
    <a class="ic-cform-banner-link" href="#" data-ic-cform-banner-link>
      Show first
    </a>
  </div>

  <fieldset>
    <legend>Sync engine</legend>

    <label class="ic-cform-row">
      <input type="checkbox" name="telemetry" data-id="opt-telemetry">
      <span class="ic-cform-row-label">Send telemetry</span>
    </label>

    <label class="ic-cform-row"
           data-ic-requires="telemetry">
      <input type="checkbox" name="advanced_metrics" data-id="opt-adv">
      <span class="ic-cform-row-label">Send advanced metrics</span>
      <span class="ic-cform-req-chip" data-ic-req-chip>
        Requires <code>telemetry</code>
      </span>
    </label>

    <label class="ic-cform-row"
           data-ic-requires="telemetry advanced_metrics">
      <input type="checkbox" name="ml_metrics" data-id="opt-ml">
      <span class="ic-cform-row-label">Send ML-grade metrics</span>
      <span class="ic-cform-req-chip" data-ic-req-chip>
        Requires <code>telemetry</code>, <code>advanced_metrics</code>
      </span>
    </label>
  </fieldset>
</form>
```

CSS:

```css
.ic-cform { margin: var(--vc-space-3, 16px) 0; }
.ic-cform-banner {
  padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px);
  border: 1px solid var(--vc-color-warning, #c78a26);
  background: color-mix(in srgb,
              var(--vc-color-warning, #c78a26) 14%, transparent);
  border-radius: var(--vc-radius-md, 8px);
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.4
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg, #14110b);
  margin-bottom: var(--vc-space-2, 12px);
}
.ic-cform-banner-link {
  color: var(--vc-color-warning, #c78a26);
  text-decoration: underline;
  margin-left: var(--vc-space-1, 8px);
}
.ic-cform-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--vc-space-2, 12px);
  align-items: center;
  padding: var(--vc-space-1, 8px) var(--vc-space-2, 12px);
  border-left: 3px solid transparent;
  border-radius: var(--vc-radius-sm, 4px);
}
.ic-cform-row.ic-cform-row--warn {
  background: color-mix(in srgb,
              var(--vc-color-warning, #c78a26) 9%, transparent);
  border-left-color: var(--vc-color-warning, #c78a26);
}
.ic-cform-req-chip {
  display: none;
  font: var(--vc-weight-regular, 400) var(--vc-text-0, 12px)/1.2
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg-dim, #5b5343);
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border-radius: var(--vc-radius-full, 9999px);
  background: color-mix(in srgb,
              var(--ve-control-fg, #14110b) 6%, transparent);
}
.ic-cform-row[data-ic-requires] .ic-cform-req-chip { display: inline-flex; }
.ic-cform-row.ic-cform-row--warn .ic-cform-req-chip {
  background: color-mix(in srgb,
              var(--vc-color-warning, #c78a26) 22%, transparent);
  color: var(--vc-color-warning, #c78a26);
}
.ic-cform-row.ic-cform-row--warn .ic-cform-req-chip::before {
  content: "⚠ ";
}
```

## JS engine

```js
function initConditionalForm(form) {
  var banner    = form.querySelector('[data-ic-cform-banner]');
  var countEl   = form.querySelector('[data-ic-cform-banner-count]');
  var linkEl    = form.querySelector('[data-ic-cform-banner-link]');
  var rows      = form.querySelectorAll('.ic-cform-row[data-ic-requires]');

  function rowChecked(name) {
    var input = form.querySelector('input[name="' + name + '"]');
    return !!(input && input.checked);
  }
  function rowOwn(row) {
    return !!row.querySelector('input[type="checkbox"]').checked;
  }
  function refresh() {
    var unmet = [];
    rows.forEach(function (row) {
      if (!rowOwn(row)) {
        row.classList.remove('ic-cform-row--warn');
        return;
      }
      var reqs = row.getAttribute('data-ic-requires').split(/\s+/);
      var allMet = reqs.every(rowChecked);
      row.classList.toggle('ic-cform-row--warn', !allMet);
      if (!allMet) { unmet.push(row); }
    });
    if (countEl) { countEl.textContent = String(unmet.length); }
    if (banner) {
      if (unmet.length) {
        banner.removeAttribute('hidden');
      } else {
        banner.setAttribute('hidden', '');
      }
    }
    if (linkEl) {
      linkEl.onclick = unmet.length ? function (ev) {
        ev.preventDefault();
        unmet[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        unmet[0].querySelector('input').focus();
      } : null;
    }
  }
  form.addEventListener('input',  refresh);
  form.addEventListener('change', refresh);
  refresh();
}
document.querySelectorAll('[data-ic-cform]').forEach(initConditionalForm);
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-warning` | banner border + chip warn tint + row left-border |
| `--ve-control-fg-dim` | resting chip text |
| `--ve-control-fg` | banner text |
| `--vc-radius-md` | banner roundness |
| `--vc-radius-full` | chip pill |
| `--vc-radius-sm` | row roundness |

The `color-mix` tints scale to whatever theme: a warning row at 9%
warning-color reads in both light and dark by design.

## Selection / comment / decision-mini

- **Each `.ic-cform-row` is a selectable atom** so a reviewer can
  comment "this option is dangerous" or "this prerequisite is
  wrong".
- **The banner itself** is content (a status message) — give it
  `data-ve-id="banner:cform"` so the auditor can flag "the banner
  should say X".
- **Decision-mini on each row** lets a reviewer Approve / Deny the
  row's value individually.

## JS-off degradation

**Form works; warnings don't fire.** With JS off:

- All checkboxes are real, fully functional.
- The banner stays `hidden` (the `hidden` attribute is browser-set).
- `.ic-cform-req-chip` shows whenever the row has `data-ic-requires`
  (purely CSS), so the prerequisite text is at least visible.
- The row warning tint does NOT apply.

The user can still submit an inconsistent state; server-side
validation is required regardless. The chain is a **client-side
hint**, not the authoritative gate. This degradation is acceptable
because submission validation is the real backstop.

## Anti-patterns

- Using `alert()` or a modal to block submission. The pattern is
  meant to **let the user see the state in context**; a modal
  hides the form they're trying to debug.
- Hardcoding requirement names in JS. The `data-ic-requires`
  attribute is the source of truth; a new requirement is one
  HTML edit, not a re-run of the build.
- Showing the chip only when warning. The chip should be
  always-visible-when-the-row-has-prerequisites so the user
  knows *before* toggling that there's a constraint.
- Forgetting the `aria-live="polite"` on the banner — AT users
  toggle a checkbox and never hear the warning.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Turn on advanced_metrics without telemetry — row warns, banner shows.
const adv = document.querySelector('input[name="advanced_metrics"]');
adv.click();
const row = adv.closest('.ic-cform-row');
console.assert(row.classList.contains('ic-cform-row--warn'),
               'row did not warn');
const banner = document.querySelector('[data-ic-cform-banner]');
console.assert(!banner.hasAttribute('hidden'),
               'banner did not show');
console.assert(banner.querySelector('[data-ic-cform-banner-count]').textContent === '1');

// Turn on telemetry — warning clears.
const tele = document.querySelector('input[name="telemetry"]');
tele.click();
console.assert(!row.classList.contains('ic-cform-row--warn'),
               'row did not un-warn');
console.assert(banner.hasAttribute('hidden'),
               'banner did not hide');
```

Screenshot light + dark themes in 3 states: (a) no warnings, (b)
one row warning + banner, (c) multiple rows warning + banner.
Verify the warning tints + chip color are distinguishable in both
themes.
