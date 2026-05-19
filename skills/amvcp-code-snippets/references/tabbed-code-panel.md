# Sub-technique E1 — Tabbed code panel (3 perspectives on the same change)

## Table of Contents

- [E1.1 The pattern](#e11-the-pattern)
- [E1.2 The canonical perspective sets](#e12-the-canonical-perspective-sets)
- [E1.3 Anti-patterns](#e13-anti-patterns)
- [E1.4 The composition example: feature-explainer config sample](#e14-the-composition-example-feature-explainer-config-sample)
- [E1.5 The 6-line JS handler](#e15-the-6-line-js-handler)
- [E1.6 The "first tab is the canonical one" rule](#e16-the-first-tab-is-the-canonical-one-rule)
- [E1.7 Tab labels — discipline](#e17-tab-labels--discipline)
- [E1.8 The 2-pane variant (Before / After)](#e18-the-2-pane-variant-before--after)
- [E1.9 Auto-collapse adjacent text content](#e19-auto-collapse-adjacent-text-content)
- [E1.10 Selection / commenting across tabs](#e110-selection--commenting-across-tabs)
- [E1.11 Pair with collapsed-snippets walkthrough](#e111-pair-with-collapsed-snippets-walkthrough)
- [E1.12 Tokens consumed](#e112-tokens-consumed)
- [E1.13 Author rules (composition-level)](#e113-author-rules-composition-level)

The canonical "show the same change from N angles" composition. The
catalog's #14 (`research-feature-explainer`) tabbed-code pattern, plus
the authoring rules for choosing perspective sets.

This reference is the COMPOSITION-level guide; for the tab-bar markup
itself, see [code-block-with-tab-bar.md](../../amvcp-code-syntax/references/code-block-with-tab-bar.md).

## E1.1 The pattern

A single code-panel container with 2-5 tabs, each tab showing a
different REPRESENTATION of the same underlying concept. The reader
toggles to see the angle that matches their mental model. The data is
the same; the format / abstraction / level changes.

Mined catalog quote: *"the cleanest way to show 'the same thing from
3 angles' without a wall of code."*

## E1.2 The canonical perspective sets

| Perspective set | Example tabs | When to use |
|---|---|---|
| **3-format same data** | `limits.yaml` / `route.ts` / `client-response.json` | Showing a feature end-to-end: config + code + output |
| **Before / After** | `Before` / `After` | Showing a change (refactor, fix, optimization) |
| **N implementations** | `Inline useEffect` / `Custom hook` / `use-debounce lib` | Comparing alternatives (mined from `01-exploration-code-approaches`) |
| **N languages** | `Python` / `TypeScript` / `Go` / `Rust` | Polyglot library docs; one feature, multiple stack ports |
| **Source / Compiled** | `TypeScript source` / `Compiled JS` | Showing what the transformer produces |
| **JSON / YAML / TOML** | The same config in 3 formats | Format-comparison docs |

These six sets are the ones agents should default to. Custom sets are
fine if the reader's mental model demands them — but avoid "tabs for
the sake of tabs" (showing 3 unrelated examples in tabs is a
formatting bug).

## E1.3 Anti-patterns

| Don't | Why |
|---|---|
| 3 different examples in tabs | Tabs imply "these are equivalents"; different examples should be 3 separate code blocks |
| 6+ tabs | Cramped; reader can't see all tab labels at once. Cap at 5. |
| One-line snippets in tabs | Tabs are a heavy container; one-liners go inline as `<code class="inline">` |
| Tabs without a clear "what's the same across them" thread | Reader can't form a mental model of what they're toggling between |
| Tabs of FILES that aren't related (e.g. `package.json` + a random `utils.ts`) | Confusing; use file-path labels on separate blocks |

## E1.4 The composition example: feature-explainer config sample

The catalog's #14 demo uses tabs for "the same rate-limit change, seen
from 3 perspectives":

```html
<div class="ve-code-tabs" data-ve-code-tabs>
  <div class="ve-code-tabs__bar" role="tablist">
    <button class="ve-code-tabs__btn on" data-t="0" role="tab" aria-selected="true">
      limits.yaml
    </button>
    <button class="ve-code-tabs__btn" data-t="1" role="tab" aria-selected="false">
      route.ts
    </button>
    <button class="ve-code-tabs__btn" data-t="2" role="tab" aria-selected="false">
      client-response.json
    </button>
  </div>
  <div class="ve-code-tabs__panels">
    <pre class="on" data-pane="0"><code class="language-yaml">rate_limit:
  buckets:
    free:   { rpm: 60, burst: 10 }
    pro:    { rpm: 600, burst: 100 }</code></pre>
    <pre data-pane="1"><code class="language-typescript">app.use(rateLimit({
  keyGenerator: req => req.user.id,
  windowMs: 60_000,
  max: req => req.user.plan === 'pro' ? 600 : 60
}));</code></pre>
    <pre data-pane="2"><code class="language-json">{
  "error": "rate_limit_exceeded",
  "limit": 60,
  "remaining": 0,
  "reset_at": "2026-04-21T15:30:00Z"
}</code></pre>
  </div>
</div>
```

The reader sees the config that DEFINES the limits, the code that
APPLIES them, and the response the client RECEIVES when limited. Three
angles, one feature.

## E1.5 The 6-line JS handler

See [code-block-with-tab-bar.md](../../amvcp-code-syntax/references/code-block-with-tab-bar.md) §B5.4
for the full handler. Repeated here for ease of reference:

```js
document.querySelectorAll('[data-ve-code-tabs]').forEach(function (root) {
  root.querySelectorAll('.ve-code-tabs__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = btn.dataset.t;
      root.querySelectorAll('.on').forEach(function (el) {
        el.classList.remove('on');
        if (el.tagName === 'BUTTON') el.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('on');
      btn.setAttribute('aria-selected', 'true');
      var pane = root.querySelector('[data-pane="' + i + '"]');
      if (pane) pane.classList.add('on');
    });
  });
});
```

## E1.6 The "first tab is the canonical one" rule

The first tab should be:
- The "starting point" / "input" / "source" perspective (e.g.
  `limits.yaml` is the config that DEFINES everything else).
- The one most readers will need.
- The one that survives the no-JS fallback (only the first tab
  renders without JS).

For Before/After, "Before" is first (the reader starts with the OLD
state and moves to the NEW). For N implementations, the simplest /
most-naive is first (it's the comparison baseline).

## E1.7 Tab labels — discipline

Tab labels should be:
- **Short** (1-3 words / one file path).
- **Concrete** (a file name, a perspective name — not "Option A" /
  "Option B").
- **Distinct** (no ambiguity between tabs — "Code" vs "Code 2" is bad
  labeling).
- **Mono-font** for file paths, **sans-font** for perspective names
  (the CSS handles this — tabs are mono by default, opt-in
  `.ve-code-tabs__btn--sans` for sans).

## E1.8 The 2-pane variant (Before / After)

For the simplest case — Before / After — the tab pattern works:

```html
<div class="ve-code-tabs" data-ve-code-tabs>
  <div class="ve-code-tabs__bar">
    <button class="ve-code-tabs__btn on" data-t="0">Before</button>
    <button class="ve-code-tabs__btn"    data-t="1">After</button>
  </div>
  <div class="ve-code-tabs__panels">
    <pre class="on" data-pane="0"><code class="language-typescript">…before…</code></pre>
    <pre        data-pane="1"><code class="language-typescript">…after…</code></pre>
  </div>
</div>
```

But for many readers, SIDE-BY-SIDE is better than tabs for before/after
(the visual comparison is immediate). Consider
[diff-blocks-split.md](../../amvcp-code-diff/references/diff-blocks-split.md) instead when the change
is visual / structural; use the tab variant when the change is in
content (e.g. a config value) and the reader cares about ONE side at
a time.

## E1.9 Auto-collapse adjacent text content

A common pattern: surround the tabbed-code panel with prose. The prose
should describe the COMMON thread; the tabs let the reader pick the
angle.

Example:

> A 60-request-per-minute limit applies to free-plan users. The limit
> is defined in the **YAML config** (`limits.yaml`), enforced by the
> **rate-limit middleware** (`route.ts`), and surfaced to the client
> as a **structured JSON response** (`client-response.json`).
>
> [tabbed code panel here, with the 3 files]

The prose names each tab (in bold) so the reader can map prose → tab
without first clicking.

## E1.10 Selection / commenting across tabs

Selecting lines in tab A and then switching to tab B preserves tab A's
selection. The selection payload (sent via the comment pill) includes
the tab index, so the comment is anchored to the visible tab at the
moment of comment.

A reader can theoretically select lines in tab A, switch to tab B,
select lines in tab B, switch back, and have selections in both — but
this is rare and not specifically optimized for. The 1-tab-at-a-time
mental model is the dominant pattern.

## E1.11 Pair with collapsed-snippets walkthrough

For longer feature explainers, combine tabbed-code-panel WITH
[collapsed-snippets-walkthrough.md](./collapsed-snippets-walkthrough.md):

- Each step in the walkthrough is a `<details>` with file:line summary.
- Inside the `<details>`, a tabbed-code-panel shows the relevant source,
  the test, and the docs.

The two compositions stack naturally — tabs inside details is a
read-on-demand-then-pick-your-angle UX.

## E1.12 Tokens consumed

All from [code-block-with-tab-bar.md](../../amvcp-code-syntax/references/code-block-with-tab-bar.md).

## E1.13 Author rules (composition-level)

| Rule | Why |
|---|---|
| First tab is the canonical / starting-point perspective | No-JS fallback shows it; readers default-trust it |
| Tabs should be REPRESENTATIONS of the same thing, not different things | Otherwise the tab metaphor lies |
| Cap at 5 tabs | Cramped above; flex-wrap on the bar handles overflow but ruins visual coherence |
| Pair with surrounding prose that names the tabs | Reader can map prose to tabs without clicking |
| Use 3-format same data, Before/After, or N-implementations as default patterns | These are the well-known ones; novel sets confuse |
