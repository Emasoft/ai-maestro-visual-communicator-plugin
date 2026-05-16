# Disclosure summary badge — collapsed-file pattern

For a PR review / file-tour deliverable: each file is a `<details>`
whose `<summary>` shows the file path + a "+N / -M" diff stat + a
risk dot. Safe files default closed (the reader scans the summary
line for risk); risky files default open. Pure HTML + CSS;
zero-JS.

## What it is

A long PR review of 20+ files is overwhelming when every diff is
visible. The pattern collapses safe files (low risk, small diff)
to a summary line; opens risky files (high risk, big diff) by
default. Each summary line carries the file path + the stat — the
reader scans the list of summaries to find what to focus on.

## Scaffold

```html
<div class="ic-dsb-list" data-ic-dsb-list>
  <details class="ic-dsb-file ic-dsb-file--safe">
    <summary class="ic-dsb-summary">
      <span class="ic-dsb-risk-dot ic-dsb-risk-dot--low"
            aria-hidden="true"></span>
      <span class="ic-dsb-path">src/utils/format.ts</span>
      <span class="ic-dsb-stat">
        <span class="ic-dsb-add">+4</span>
        <span class="ic-dsb-rem">−2</span>
      </span>
      <span class="ic-dsb-label">Renamed helper, no behaviour change.</span>
    </summary>
    <div class="ic-dsb-body">
      <pre><code>// diff content here</code></pre>
    </div>
  </details>

  <details class="ic-dsb-file ic-dsb-file--attention" open>
    <summary class="ic-dsb-summary">
      <span class="ic-dsb-risk-dot ic-dsb-risk-dot--high"
            aria-hidden="true"></span>
      <span class="ic-dsb-path">src/auth/handler.ts</span>
      <span class="ic-dsb-stat">
        <span class="ic-dsb-add">+47</span>
        <span class="ic-dsb-rem">−12</span>
      </span>
      <span class="ic-dsb-label">New code path for OAuth refresh — review carefully.</span>
    </summary>
    <div class="ic-dsb-body">
      <pre><code>// diff content here</code></pre>
    </div>
  </details>
</div>
```

CSS:

```css
.ic-dsb-list {
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-1, 8px);
  margin: var(--vc-space-3, 16px) 0;
}
.ic-dsb-file {
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--ve-control-bg, #ffffff);
}
.ic-dsb-file--attention {
  border-left: 4px solid var(--vc-color-warning, #c78a26);
}
.ic-dsb-file--danger {
  border-left: 4px solid var(--vc-color-danger, #a84a32);
}
.ic-dsb-summary {
  cursor: pointer;
  display: grid;
  grid-template-columns: auto minmax(0, 20rem) auto 1fr;
  align-items: center;
  gap: var(--vc-space-2, 12px);
  padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px);
  list-style: none;     /* hide the default triangle */
}
.ic-dsb-summary::-webkit-details-marker { display: none; }
.ic-dsb-summary::marker { content: ''; }
.ic-dsb-risk-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--vc-radius-full, 9999px);
  flex: none;
}
.ic-dsb-risk-dot--low    { background: var(--vc-color-success, #3a6b5c); }
.ic-dsb-risk-dot--med    { background: var(--vc-color-warning, #c78a26); }
.ic-dsb-risk-dot--high   { background: var(--vc-color-danger,  #a84a32); }
.ic-dsb-path {
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.3
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg, #14110b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ic-dsb-stat {
  font: var(--vc-weight-bold, 700) var(--vc-text-0, 12px)/1.2
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  font-variant-numeric: tabular-nums;
}
.ic-dsb-add { color: var(--vc-color-success, #3a6b5c); margin-right: 0.5em; }
.ic-dsb-rem { color: var(--vc-color-danger,  #a84a32); }
.ic-dsb-label {
  color: var(--ve-control-fg-dim, #5b5343);
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.3
        var(--ve-control-font, inherit);
}
.ic-dsb-body {
  padding: 0 var(--vc-space-3, 16px) var(--vc-space-3, 16px);
  border-top: 1px solid color-mix(in srgb,
              var(--ve-control-border, #e3dcc9) 60%, transparent);
}
.ic-dsb-summary:hover {
  background: color-mix(in srgb,
              var(--ve-control-fg, #14110b) 4%, transparent);
}
.ic-dsb-file[open] > .ic-dsb-summary {
  border-bottom: 1px solid var(--ve-control-border, #e3dcc9);
}
```

The 4-column grid in the summary (`auto minmax(0, 20rem) auto 1fr`)
gives the path a flexible-but-capped column with ellipsis, the
stat a fixed column, and the label all remaining width.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-success` | low-risk dot + `+N` text |
| `--vc-color-warning` | med-risk dot + attention border-left |
| `--vc-color-danger` | high-risk dot + `-M` text |
| `--ve-control-bg` / `--ve-control-border` | container chrome |
| `--ve-control-mono` | path + stat font |
| `--vc-radius-full` | risk dot |

## Selection / comment / decision-mini

- **Each file `<details>` IS a selectable atom** so a reviewer can
  comment "split this into 2 PRs" on the file as a whole.
- **The body diff inside** is its own collection of atoms — a
  reviewer might pin on a specific line.
- **Decision-mini per file** — Skip / Approve / Deny each file's
  changes individually.

## JS-off degradation

**Fully functional.** With JS off:

- Each `<details>` toggles natively on summary click.
- Default state (some open, some closed) respects the `open`
  attribute the author set.
- Mutually-exclusive auto-close from
  `references/mutually-exclusive-details.md` does NOT run; that's
  fine here — readers often want to compare two files side-by-
  expanded.

The pattern is JS-free by design.

## Anti-patterns

- A custom `<button>`-based collapse that reimplements `<details>`.
  Loses the native AT contract.
- Hiding the default triangle via `display: none` on
  `details > summary` — breaks the focus outline. Use the
  `summary::-webkit-details-marker { display: none }` +
  `summary::marker { content: '' }` pair (above).
- Forgetting `cursor: pointer` on the summary — the user doesn't
  know it's clickable.
- A risk dot the same color as the panel border — invisible.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Safe files default-closed; attention files default-open.
const safe = document.querySelector('.ic-dsb-file--safe');
const attn = document.querySelector('.ic-dsb-file--attention');
console.assert(safe.open === false);
console.assert(attn.open === true);

// Click summary toggles.
safe.querySelector('.ic-dsb-summary').click();
console.assert(safe.open === true);
```

Screenshot the list in both themes. Verify the risk dot colors
are distinguishable in both light and dark (especially the
warning/orange vs danger/red pair).
