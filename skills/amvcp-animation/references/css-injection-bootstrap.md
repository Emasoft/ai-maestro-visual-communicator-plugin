# CSS injection & bootstrap — `injectAnimationCSS(doc)` + manual-init opt-out

## Table of Contents

- [The injection function](#the-injection-function)
- [Why ship CSS inside the JS module](#why-ship-css-inside-the-js-module)
- [The injected stylesheet contents](#the-injected-stylesheet-contents)
- [Auto-init vs manual init](#auto-init-vs-manual-init)
- [The test fixture also uses manual init](#the-test-fixture-also-uses-manual-init)
- [The dual export (browser + Node)](#the-dual-export-browser--node)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Reduced-motion interaction](#reduced-motion-interaction)
- [Why `data-va="animation"` not `data-amvcp="animation"`](#why-data-vaanimation-not-data-amvcpanimation)
- [Test hooks — `window.__veAnimation`](#test-hooks--windowveanimation)
- [Diagnostics](#diagnostics)
- [Visual verification](#visual-verification)
- [When to opt into manual init](#when-to-opt-into-manual-init)

The animation skill's CSS is shipped INSIDE the JS module, injected
into `document.head` on boot via `injectAnimationCSS(doc)`. The
runtime can opt out of auto-init by setting `window.__vaManualInit
= true`, in which case the host controls the ordering of:
DESIGN.md engine → tokens emitted → animation CSS injected →
animation init.

## The injection function

```js
var STYLE_ID = 'va-animation-styles';

function injectAnimationCSS(doc) {
  var d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.head) { return; }
  if (d.getElementById(STYLE_ID)) { return; }
  var style = d.createElement('style');
  style.id = STYLE_ID;
  style.setAttribute('data-va', 'animation');
  style.appendChild(d.createTextNode(CSS_TEXT));
  d.head.appendChild(style);
}
```

Three properties:

1. **Idempotent.** The `if (d.getElementById(STYLE_ID))` guard
   means a second call is a no-op. Safe to call from both the
   runtime AND a test setup without double-injection.

2. **Stamped `data-va="animation"`.** Distinguishes the
   animation skill's stylesheet from other plugin stylesheets
   (the typography skill, the layout skill, etc.). A QA pass that
   needs "find all skill stylesheets" can query
   `[data-va], [data-vc]`.

3. **`d.head` required.** If the document has no `<head>` (very
   unusual — maybe a fragment passed to JSDOM), the function
   silently no-ops. The animation skill won't crash; the CSS just
   won't apply.

## Why ship CSS inside the JS module

Two practical reasons:

1. **Single file delivery.** `amvcp-animation.js` is the only
   asset to ship; the consumer doesn't need to manage a separate
   `.css` link. This matters for the static-site render path,
   where every reference document ships a fixed set of bundled
   assets.

2. **Token + CSS atomicity.** The injected CSS references
   `--vc-motion-*` tokens that the DESIGN.md engine emits. The
   skill knows EXACTLY which tokens it consumes; the CSS rules
   carry hardcoded fallbacks for every token reference. Shipping
   the CSS inside the JS guarantees the rules and the JS gates
   ship together — no risk of a CSS file from an old version
   being loaded against a new JS.

The alternative (ship CSS as a separate file) is correct for
build-step apps but wrong for a render-output that has no build
step. The plugin's output is "open the HTML, see the report" —
fewer assets = simpler.

## The injected stylesheet contents

The CSS is built as a JS array joined at module load:

```js
var CSS_LINES = [
  '/* ai-maestro-visual-communicator — animation skill (injected) */',
  /* ... Layer 0 + 1-9 rules ... */
  ''
];
var CSS_TEXT = CSS_LINES.join('\n');
```

Building the CSS as an array (not a template literal) is ES5-safe
— the entire animation runtime targets ES5 to match the runtime
+ designmd modules. No template literals, no arrow functions, no
classes; just `var` + function declarations + the CSS array.

Why ES5-safe? Three reasons:
- The runtime targets browsers that may not support all ES6+
  features (older Safari embedded webviews, certain plugin host
  environments).
- The plugin's own loader doesn't transpile; what ships is what
  runs.
- Consistency with the DESIGN.md engine + runtime modules — same
  style, same minimum target.

## Auto-init vs manual init

```js
if (!window.__vaManualInit) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectAnimationCSS(document);
      init(document);
    });
  } else {
    injectAnimationCSS(document);
    init(document);
  }
}
```

By DEFAULT, the module auto-initializes on `DOMContentLoaded` (or
immediately if the document is already past loading). This is the
typical case: the user includes `<script src="amvcp-animation.js">`
and animation just works.

If the runtime needs ordered initialization (e.g. it wants to
emit motion tokens BEFORE the animation CSS injects, so the CSS
rules can pick up the tokens on first paint), it sets
`window.__vaManualInit = true` BEFORE the animation script runs.
The auto-init `if` then skips, and the runtime calls
`injectAnimationCSS()` + `init()` manually in its desired order.

The boot order the runtime uses:

```js
window.__vaManualInit = true;   // BEFORE loading amvcp-animation.js

// Then in the runtime's init:
1. DESIGN.md engine parses the YAML
2. Tokens are emitted as :root style props
3. injectAnimationCSS(document) — CSS rules now read fresh tokens
4. init(document) — wires up stagger, reveal, tilt, etc.
```

Without the manual gate, the auto-init would fire at
`DOMContentLoaded`, possibly BEFORE the runtime has emitted
tokens. The CSS rules would read the fallback values instead of
the DESIGN.md values, then re-evaluate on the next paint cycle
(causing a brief flash of fallback-styled animations).

The manual gate prevents the flash.

## The test fixture also uses manual init

Test fixtures set `window.__vaManualInit = true` for deterministic
control:

```html
<script>
  window.__vaManualInit = true;
</script>
<script src="amvcp-animation.js"></script>
<script>
  // Test setup — load fixture content first, THEN init
  document.body.innerHTML = '<div class="va-stagger" data-va-stagger>...</div>';
  amvcpAnimation.injectAnimationCSS(document);
  amvcpAnimation.init(document);
  // Now test assertions can run with known state
</script>
```

Without manual mode, the test fixture would init against an empty
document body, then later content insertion would need a manual
`refresh()`. Manual mode lets the test set up the DOM first, then
init once.

## The dual export (browser + Node)

```js
// Browser global.
if (typeof window !== 'undefined') {
  window.amvcpAnimation = _api;
  window.__veAnimation = { /* test hooks */ };
  // auto-init unless __vaManualInit
}

// Node export — for the test harness / sanity checks.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _api;
}
```

In the browser, `window.amvcpAnimation` is the public API and
`window.__veAnimation` is the test API (exposes mutable `REDUCED`,
`init/refresh` for fixtures, and a `revealCount()` probe).

In Node (test harness), the module exports `_api`. The Node path
doesn't have `window` so the auto-init block is skipped; tests
import and call init explicitly. The CSS-injection path also
no-ops in Node (no `document.head` to append to).

## DESIGN.md tokens consumed

Injection itself consumes none. The CSS being injected references
the `--vc-motion-*`, `--vc-duration-*`, `--vc-easing-*`, and
`--vc-color-*` tokens — see `motion-tokens.md` for the full
contract.

## Reduced-motion interaction

Both media-query branches of every animation rule ship in the
SAME stylesheet. The browser activates whichever branch matches
the current `prefers-reduced-motion` preference. No JS branching
required at injection time.

## Why `data-va="animation"` not `data-amvcp="animation"`

The `data-va-*` prefix is the skill's "internal" namespace (Visual
Animation). The runtime + plugin-level attributes use `data-ve-*`
(Visual Explainer, the runtime's name).

```html
<li class="va-stagger-item"
    data-va-id="..."        <!-- never set; placeholder for example -->
    data-ve-id="..."        <!-- selection contract -->
    data-ve-type="card">    <!-- selection contract -->
```

`data-va-*` is the SKILL's local-scope attributes (stagger flags,
reveal modes, counter values). `data-ve-*` is the RUNTIME's
contract attributes (selection, decisions). Two namespaces, clear
separation.

## Test hooks — `window.__veAnimation`

```js
window.__veAnimation = {
  get state() {
    return {
      reduced: REDUCED,
      revealCount: _revealCount,
      cssInjected: !!(document.getElementById
        && document.getElementById(STYLE_ID))
    };
  },
  get REDUCED() { return REDUCED; },
  set REDUCED(v) { REDUCED = !!v; },
  init: init,
  refresh: refresh,
  injectAnimationCSS: injectAnimationCSS,
  animateStat: animateStat,
  revealCount: function () { return _revealCount; }
};
```

The test API mirrors the public API but adds:
- `state` getter — snapshot of current internal state.
- `REDUCED` setter — let tests force the gate state without
  actually changing the OS preference.
- `revealCount` — proves the reveal observer worked correctly
  (count should only increase on actual reveals).

This API is the dev-browser test harness's contract; production
code should use `window.amvcpAnimation` (the public API).

## Diagnostics

- **Animations don't fire** → confirm `injectAnimationCSS` ran.
  Check `document.getElementById('va-animation-styles')` is not
  null.
- **Animations use fallback values (gold accent instead of theme
  accent)** → the DESIGN.md engine emitted tokens AFTER the CSS
  was injected. Switch to manual init mode and order the calls.
- **Double-injection** → impossible if the idempotency guard
  works. If you see two `<style>` elements with `id="va-animation-styles"`,
  the guard was bypassed (which shouldn't be possible).
- **Stylesheet appears but has wrong contents** → check the
  module's `CSS_LINES` array; the join should produce the
  expected text.

## Visual verification

See `skills/amvcp-self-debug-rules/SKILL.md` for the dev-browser
workflow:

1. Load page. Query
   `document.getElementById('va-animation-styles')`. Confirm not
   null.
2. Inspect the stylesheet's `textContent` — confirm it starts
   with the comment `/* ai-maestro-visual-communicator — animation
   skill (injected) */` and includes the expected rules
   (search for `.va-stagger-item`, `.va-counter`, etc.).
3. Confirm `data-va="animation"` attribute is set.
4. Inspect any animated element's computed styles — confirm the
   tokens are resolved (e.g. `animation-duration: 600ms` not
   `var(--vc-duration-entrance, 600ms)` — getComputedStyle
   resolves vars).

## When to opt into manual init

- **The runtime is composing the animation skill with other
  skills.** Manual init lets the runtime order the bootstrap.
- **The test fixture needs deterministic DOM state before init.**
- **The host needs to load the animation script later (lazy
  loading).** Manual gate prevents the auto-init firing at the
  wrong time.

When NOT to opt in:
- **Standalone HTML pages** — auto-init is correct.
- **Static-site renders** — the renderer already orders skills;
  using manual init in a static render adds friction.
