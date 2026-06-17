# Composition examples

Minimal copy-paste skeletons for the two most common code-snippet
compositions. Each is the smallest markup that wires the pattern; the
full pattern detail lives in the per-pattern reference files cited
below.

## Example 1 — tabbed multi-perspective code panel

```html
<div data-ve-tabs="code">
  <button data-ve-tab="server">server</button>
  <button data-ve-tab="client">client</button>
  <pre data-ve-tab-panel="server" data-ve-code="auto" data-ve-lang="py"><code>...</code></pre>
  <pre data-ve-tab-panel="client" data-ve-code="auto" data-ve-lang="ts"><code>...</code></pre>
</div>
```

The 6-line JS handler toggles `.on` on the button + the matching
`<pre>` — see [tabbed-code-panel](tabbed-code-panel.md).

## Example 2 — collapsed walkthrough (one step open at a time)

```html
<div data-ve-walkthrough>
  <details><summary>Step 1: <span class="path">auth.py:42</span> — validate token</summary>
    <pre data-ve-code="auto" data-ve-lang="py"><code>...</code></pre>
  </details>
  <details><summary>Step 2: <span class="path">db.py:100</span> — load user</summary>
    <pre data-ve-code="auto" data-ve-lang="py"><code>...</code></pre>
  </details>
</div>
```

The `toggle` event closes other open `<details>` in the same
container — exactly one is open at a time.
