# Mutually exclusive `<details>` walkthroughs

The single-open-at-a-time accordion pattern, but for **inline
walkthrough steps** rather than navigation panels. Each step is a
`<details>` and opening one auto-closes the others. Listen for the
native `toggle` event; needs no third-party library.

## What it is

Long-form documentation explainers (PR walkthroughs, deploy
runbooks, "how rate limiting works" feature explainers) rely on
collapsed step lists so the reader can scan the outline then expand
one step at a time. Letting two steps stay open simultaneously
breaks the "you are reading STEP 3" mental model — the reader loses
their place when they scroll.

This pattern reuses the `data-ic-accordion="single"` machinery from
`references/panels-disclosure.md` but applies it to a **vertical
walkthrough**: each step is a `<details>`, summary shows the step
label + a path/line hint, and the body holds the prose / code panel.

## Scaffold

```html
<div class="ic-walkthrough" data-ic-accordion="single">
  <details class="ic-acc-item ic-walk-step" data-ic-step="1">
    <summary class="ic-acc-head ic-walk-head">
      <span class="ic-walk-num" aria-hidden="true">1</span>
      <span class="ic-walk-title">Browser sends request</span>
      <span class="ic-walk-where">src/handler.ts:42</span>
    </summary>
    <div class="ic-acc-body ic-walk-body">
      <p>The browser's <code>fetch()</code> sends …</p>
      <pre><code>// excerpt
const res = await fetch('/api/x', { method: 'POST' });
</code></pre>
    </div>
  </details>

  <details class="ic-acc-item ic-walk-step" data-ic-step="2">
    <summary class="ic-acc-head ic-walk-head">
      <span class="ic-walk-num" aria-hidden="true">2</span>
      <span class="ic-walk-title">Middleware authenticates</span>
      <span class="ic-walk-where">src/middleware/auth.ts:14-38</span>
    </summary>
    <div class="ic-acc-body ic-walk-body">
      …
    </div>
  </details>
  <!-- additional steps -->
</div>
```

CSS additions on top of the shared `.ic-acc-*` spine:

```css
.ic-walkthrough { counter-reset: ic-walk; }
.ic-walk-step  { counter-increment: ic-walk; }

.ic-walk-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--vc-space-2, 12px);
  align-items: center;
}
.ic-walk-num {
  display: inline-grid;
  place-items: center;
  width: 1.6em;
  height: 1.6em;
  border-radius: var(--vc-radius-full, 9999px);
  background: color-mix(in srgb,
              var(--ve-control-fg, #14110b) 7%, transparent);
  color: var(--ve-control-fg, #14110b);
  font: var(--vc-weight-bold, 700) var(--vc-text-0, 12px)/1
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
}
.ic-walk-step[open] .ic-walk-num {
  background: var(--vc-color-accent, #b8861f);
  color: var(--vc-color-on-accent, #ffffff);
}
.ic-walk-where {
  font-family: var(--ve-control-mono, ui-monospace, Menlo, monospace);
  font-size: 0.85em;
  color: var(--ve-control-fg-dim, #5b5343);
}
```

## Lib functions

Re-uses `initAccordion(accEl)` from `amvcp-interactive.js`. The
single-open-at-a-time machinery only fires when the container
carries `data-ic-accordion="single"`, so the walkthrough activates
the same way `references/panels-disclosure.md` does — no new
initializer needed.

Optional: a hash-bookmark layer that opens whichever step matches
`location.hash` so a deep-link `#step-3` opens step 3 on load:

```js
function openHashStep(root) {
  var hash = (location.hash || '').replace(/^#/, '');
  if (!hash) { return; }
  var step = root.querySelector('[id="' + hash + '"]');
  if (step && step.tagName === 'DETAILS') { step.open = true; }
}
document.querySelectorAll('.ic-walkthrough').forEach(openHashStep);
window.addEventListener('hashchange', function () {
  document.querySelectorAll('.ic-walkthrough').forEach(openHashStep);
});
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-border` | step border |
| `--ve-control-bg` | step background (resting) |
| `--vc-color-accent` | open-step number badge fill |
| `--vc-color-on-accent` | open-step number badge text |
| `--vc-radius-full` | number badge roundness |
| `--ve-control-fg-dim` | `where` path label |
| `--ve-control-mono` | path/line text |

The dimmed sibling effect (when one step is open the others stay
collapsed but slightly de-emphasised) is achieved purely by the
intrinsic `<details>` open/closed CSS state — no JS-managed `.dim`
class is needed.

## Selection / comment / decision-mini

- **Selection.** Each `.ic-walk-step` `<details>` is a SELECTABLE
  atom — the reader can pin a comment to "Step 3" itself, separate
  from comments inside the body. Stamp `data-ve-id="walk:<step>"`
  on the `<details>`.
- **Decision-mini.** A step is binary: "this step is accurate" /
  "this step is wrong". Attach the S/A/D pill so a reviewer can
  triage step-by-step.
- **Comments.** Use the body for inline `data-ve-id` selectable
  paragraphs / code blocks. A comment on Step 3 is different from a
  comment on the second `<pre>` block inside Step 3.

## JS-off degradation

**Fully functional, with one trade-off.** With JS off:

- Each `<details>` opens and closes natively (the browser owns the
  twirly-arrow + animate-height).
- Multiple `<details>` can be open at once — the
  `data-ic-accordion="single"` enforcement requires JS.
- Hash-bookmark deep-linking still works because the browser jumps
  to `#sec-3` natively; however, the `<details>` itself stays closed
  unless authored with `open` already set.

The walkthrough is therefore **always readable** even without JS.
The single-open enhancement reduces visual noise but is not required
for comprehension; this is the right trade-off for a graceful
degradation contract.

## Anti-patterns

- A `<button>` + `<div>` reimplementation. You re-invent every
  affordance `<details>` already gives you for free (keyboard,
  twirly-arrow, screen-reader summary contract, JS-off baseline).
- Setting `details > summary { display: none }` to hide the summary
  while keeping `<details>` for state. The summary IS the affordance
  — hiding it breaks every UA. Hide individual children of the
  summary if you must (e.g. the default triangle: `summary {
  list-style: none }` plus a custom indicator).
- Listening to `click` on `<summary>` and `preventDefault()`ing.
  Always listen to `toggle` on the `<details>` itself — `click`
  fires BEFORE the state mutation and `preventDefault` cancels it.
- Animating `<details>` height via JS. CSS now supports
  `content-visibility: auto` + `details::details-content { height:
  ... }` in modern browsers; for older UAs the snap is acceptable
  and never breaks the toggle.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Opening step 2 closes step 1 automatically.
const steps = document.querySelectorAll('.ic-walk-step');
steps[0].open = true;
steps[1].open = true;
await new Promise(r => setTimeout(r, 0));
console.assert(steps[0].open === false,
               'data-ic-accordion="single" did not close sibling');

// JS-off: both stay open.
// (verified by running the same script in the test fixture with the
//  amvcp-interactive.js <script> tag removed.)

// Hash-deep-link opens the matching step.
location.hash = '#step-2';
await new Promise(r => setTimeout(r, 0));
console.assert(document.getElementById('step-2').open === true);
```

Screenshot the walkthrough in light + dark themes, both with one
step open and all closed; verify the open-step number badge is
visually distinct from the closed-step badges in both themes.
