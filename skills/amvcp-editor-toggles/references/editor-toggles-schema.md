# Editor-toggles — schema, dependency model, and export contract

## Table of contents

- [API](#api)
- [Spec shape](#spec-shape)
- [Groups and flags](#groups-and-flags)
- [The `requires` dependency model](#the-requires-dependency-model)
- [The pre-rendered warning contract](#the-pre-rendered-warning-contract)
- [The export contract (window.veSelection)](#the-export-contract)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [No nested scrollbars](#no-nested-scrollbars)
- [Self-contained output](#self-contained-output)

The feature-flag toggle editor renders a set of grouped boolean flags, warns on unmet cross-flag dependencies, and exports a unified diff of changed-vs-default flags through the runtime selection channel. This file is the canonical reference for its input schema and its wire format.

## API

`scripts/amvcp-editor-toggles.js` is a dependency-free IIFE exposing `window.amvcpEditorToggles` (and `module.exports` under Node):

| Function | Purpose |
|---|---|
| `init(root)` | Wire every `.ve-editor-toggles` under `root` (defaults to `document`). Auto-called on DOM-ready unless `window.__vcEditorTogglesManualInit` is set. |
| `initEditor(el)` | Wire one `.ve-editor-toggles` element. |
| `injectStyles(doc)` | Append the skill's scoped `--vc-*`-themed stylesheet once (`#vc-editor-toggles-styles`). |
| `readModel(el)` | Parse the element's embedded `<script type="application/json">` spec (or `null` + a painted error on malformed JSON). |
| `computeDiff(state, flatFlags)` | The single source of truth for the export text. Returns `{ changed:[{key,label,from,to}], text }`. |
| `pushDiffToSelection(exportId, diff, title)` | Land the diff in `window.veSelection` (idempotent — replaces any prior entry for the same `exportId`). |
| `loadValue(id, def)` / `saveValue(id, value)` | localStorage read/write (graceful degradation on Safari private mode). |

## Spec shape

```json
{
  "title": "Rollout configuration",
  "exportId": "flag-diff:rollout",
  "groups": [
    {
      "label": "Delivery",
      "flags": [
        { "key": "canary",    "label": "Canary rollout", "default": false },
        { "key": "telemetry", "label": "Telemetry",       "default": true  },
        { "key": "autoRoll",  "label": "Auto-rollback",   "default": false,
          "requires": ["telemetry", "canary"] }
      ]
    },
    {
      "label": "Experimental",
      "flags": [
        { "key": "newUi",   "label": "New UI shell",    "default": false },
        { "key": "betaApi", "label": "Beta API surface", "default": false,
          "requires": ["newUi"] }
      ]
    }
  ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `title` | no | Panel heading. Falls back to the container's `data-ve-label`, then `"Feature flags"`. |
| `exportId` | no | The `id` of the `window.veSelection` entry the copy-diff produces. Defaults to the container's `data-ve-id`. |
| `groups` | **yes** | Non-empty array of groups. An empty or missing `groups` is a fail-fast error. |
| `groups[].label` | no | The group band heading. |
| `groups[].flags` | yes | The flags in that group. |

## Groups and flags

Each flag object:

| Field | Required | Meaning |
|---|---|---|
| `key` | **yes** | Unique string identity — the diff key AND the dependency-graph node. A flag without a string `key` is a fail-fast error. |
| `label` | no | The visible label (and the name used when this flag is cited as another flag's unmet requirement). Falls back to `key`. |
| `default` | no | The flag's default boolean (default `false`). The diff is computed against this. |
| `requires` | no | Array of OTHER flag keys that must all be ON for this flag to be coherent. |

Flags render in spec order, grouped into bands. Each flag is a `<button class="ve-et-switch" role="switch">` — keyboard-accessible (Space / Enter toggle), `aria-checked` mirrors state, `aria-labelledby` points at the flag's label span. State persists to `localStorage` keyed by the container's `data-ve-id`; unknown persisted keys are dropped so a spec change can't resurrect a stale flag.

## The `requires` dependency model

`requires: ["a", "b"]` means: when THIS flag is ON, flags `a` and `b` must also be ON. The check is one-directional (it does not auto-enable the requirements — it WARNS). Only requirement keys that exist in the spec are considered; an unknown requirement key is ignored (treated as satisfied) so an authoring slip degrades rather than crashes. A requirement that is itself OFF while this flag is ON is "unmet" and surfaces the warning.

## The pre-rendered warning contract

Per the NO-NEW-ELEMENTS highlight rule (selection/feedback may only re-paint EXISTING elements, never inject geometry): **every flag's warning row is rendered at init time, hidden by default**, and a flip toggles only the `.ve-et-warn--show` class. Flipping a switch NEVER adds or removes a DOM node — the warning row already exists; showing it is a class change. The warning text is rewritten to name the currently-unmet requirement label(s) and the row clears the instant they're satisfied.

```html
<div class="ve-et-warn" data-ve-et-warn="autoRoll" role="status">
  <span class="ve-et-warn-icon" aria-hidden="true">⚠</span>
  <span class="ve-et-warn-msg">Requires Canary rollout to be on.</span>
</div>
```

## The export contract

"Copy diff" produces a unified-diff-style text and lands it in the runtime's multi-select list — the export rides the EXISTING selection channel (project CLAUDE.md §4), never a foreign export UX.

The diff text (from `computeDiff`):

```
--- flags (default)
+++ flags (current)
-canary = false
+canary = true
```

Only flags whose current value differs from their `default` appear. With no changes the body is ` (no changes — all flags at default)`.

The `window.veSelection` entry (a standard `kind:"element"` entry, dedup-keyed `element:<exportId>`):

```json
{
  "kind": "element",
  "entryId": "element:flag-diff:rollout",
  "id": "flag-diff:rollout",
  "type": "flag-diff",
  "label": "Rollout configuration — 1 changed",
  "data": {
    "changed": [{ "key": "canary", "label": "Canary rollout", "from": false, "to": true }],
    "diff": "--- flags (default)\n+++ flags (current)\n-canary = false\n+canary = true"
  }
}
```

When the runtime is present the module calls `window.veToggle(payload)` (after removing any stale prior entry for the same `exportId`), so the entry dedupes, paints, and bumps the submit-button counter exactly like any other selection. When the runtime is absent it pushes the entry straight onto `window.veSelection` so the contract still holds on `file://` pages and in tests. The clipboard write is a fail-soft convenience — the selection entry is the load-bearing export, so an HTTP-context page that lacks `navigator.clipboard` still exports correctly.

On submit, the agent reads the entry and, per `references/interactive-selection-base.md`, prompts: "You changed N feature flags — here's the diff. Want me to apply it / update the config / regenerate?"

## DESIGN.md tokens used

Everything visual reads a `--vc-*` token via `var(--vc-*, fallback)` so the panel themes from the page's DESIGN.md and re-paints live on a `data-ve-theme` flip:

- **Surfaces:** `--vc-color-surface` (panel), `--vc-color-surface-sunken` (switch off-track), `--vc-color-canvas`.
- **Content:** `--vc-color-content`, `--vc-color-content-muted` (status note), `--vc-color-content-subtle` (group labels).
- **Borders:** `--vc-color-border`, `--vc-color-border-strong` (switch outline).
- **Accent:** `--vc-color-accent` (switch on-track + copy button + focus ring), `--vc-color-on-accent` (knob + button text).
- **Semantic:** `--vc-color-warning` (dependency warning border/tint), `--vc-color-danger` (warning text + the fail-fast error box).
- **Shape / type:** `--vc-radius-sm|md|lg|full`, `--vc-font-body`, `--vc-font-mono` (error box).

## No nested scrollbars

The editor is a single-column stack of controls — it never introduces an inner scroll viewport. Long flag lists extend the page; the document's own scrollbar is the only one (per `~/.claude/rules/no-nested-scrollbars.md`).

## Self-contained output

The module injects its own stylesheet and needs no external CSS or fonts (fonts come from the DESIGN.md tokens, with system-ui fallbacks). With the runtime inlined (see `references/interactive-selection-base.md` → "Inlining the runtime"), a page carrying an editor-toggles panel is a single portable `.html` file that opens anywhere.
