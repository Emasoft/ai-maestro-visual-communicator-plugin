---
name: amvcp-editor-toggles
description: "Feature-flag editor — a self-contained, DESIGN.md-themed panel of grouped toggle switches with dependency warnings (flag X requires Y) and a copy-diff export of changed-vs-default flags. The diff exports through the runtime selection channel; light + dark, keyboard-accessible switches. Use when editing feature flags, toggling config options, or building a settings/flags panel with dependency rules. Trigger with 'feature flags', 'feature-flag editor', 'flag toggles', 'config toggles', 'settings toggles', 'toggle editor', 'flag dependencies', 'copy diff of flags'."
license: MIT
metadata:
  author: Emasoft
---

# Feature-Flag Toggle Editor

> **Parent umbrella:** [`skills/amvcp-visual-communication/SKILL.md`](../amvcp-visual-communication/SKILL.md). **Sibling editor skills:** [amvcp-editor-template](../amvcp-editor-template/SKILL.md) (template/prompt tuner), [amvcp-editor-kanban](../amvcp-editor-kanban/SKILL.md) (drag triage board). **Form widgets (single-flag toggles):** [amvcp-form-inputs](../amvcp-form-inputs/SKILL.md). **Selection wire-format:** [`references/interactive-selection-base.md`](../../references/interactive-selection-base.md).

Complete TOC of `interactive-selection-base.md`:
- ## Table of contents
- ## How it works & Page Setup
  - ### How it works (one paragraph)
  - ### Page CSS contract (multi-select)
  - ### Mandatory boilerplate
- ## The selection payload
  - ### Phase 2 — multi-click text selection inside `[data-ve-prose]`
    - #### Phase 3 — block-level depths 4-7 (paragraph / section / chapter / all)
    - #### Phase 3 — math grammar (sub-formula depths 1-3 inside `.ve-math`)
    - #### Phase 3 — code grammar (token / line / block depths 1-3 inside `<pre>`)
    - #### Phase 4 — drag text selection toggles entries (the only deselect path)
    - #### Phase 5 — table row/column handles
    - #### Phase 6 — code line-number gutter
    - #### Phase 7 — touch / mobile compatibility
    - #### Interactive agent reports — `kind:"finding-reply"` (TRDD-eff1aa87)
    - #### Interactive agent reports v2 — modal comment threads
  - ### Required follow-up
- ## Selectable Elements
  - ### What to make selectable
  - ### Marking elements
- ## Engine routing — read this BEFORE generating a graph
- ## Runtime & Process Caveats
  - ### Runner-process pitfalls (Chrome `--app=URL` mode)
  - ### Anti-patterns (selection-system author errors)
  - ### Inlining the runtime (single-file portability)
  - ### Future extensions (not yet implemented)

## Overview

THE THING: "a grouped feature-flag editor — toggle switches organised by group, with cross-flag dependency rules and a copy-diff export." One skill, one thing. It is the dedicated home for editing a *set* of related boolean flags (a `ve-toggle` from `amvcp-form-inputs` is the single-flag primitive; this is the multi-flag, grouped, dependency-aware editor).

Two modes, kept strictly separate (project CLAUDE.md §4):

1. **Interaction Design Mode = FIXED.** The export rides the runtime's multi-select channel: "Copy diff" pushes a `kind:"element"` entry into `window.veSelection` carrying the unified-diff text. This module adds NO custom selection, NO foreign drag, NO foreign export UX. The switches themselves are a plain editing affordance; the *export* is the runtime selection payload (the universal edit/export channel). "Editable" = flip the switches; "Exportable" = the copy-diff selection entry the agent reads back.
2. **Graphic Style Mode = VARIABLE via DESIGN.md.** The panel chrome, switch track/knob, group bands, warning row, and copy button are themed entirely from `--vc-*` tokens — light + dark both, no hardcoded palette. A `data-ve-theme` flip / hot-swap re-themes live with zero JS.

## Prerequisites

- `amvcp-editor-toggles.js` colocated with the HTML — the editor module (`window.amvcpEditorToggles`: `init`, `initEditor`, `injectStyles`, `computeDiff`, `pushDiffToSelection`). It injects its own scoped, `--vc-*`-themed stylesheet (`#vc-editor-toggles-styles`) once.
- `amvcp-runtime.js` — boots the selection runtime and installs `window.veSelection` + `window.veToggle`. The copy-diff export rides this channel; without it, the export falls back to pushing directly onto `window.veSelection` (so `file://` pages still work, but load the runtime for the full select → submit round-trip).
- `amvcp-designmd.js` (optional) — when the page embeds a DESIGN.md, the runtime applies its `--vc-*` tokens so the panel themes from the design system rather than the built-in fallbacks.

## Instructions

1. **Author the flag spec** — a `<script type="application/json">` inside a `<div class="ve-editor-toggles" data-ve-id="…">`. Shape: `{ title, exportId?, groups:[{ label, flags:[{ key, label, default, requires? }] }] }`. A flag's `requires:["a","b"]` lists OTHER flag keys that must all be ON for this flag to be coherent. See [editor-toggles-schema](./references/editor-toggles-schema.md) for the full shape, the dependency model, and the export contract.
2. **Load order** — engine (`amvcp-designmd.js`) → runtime (`amvcp-runtime.js`) → this module (`amvcp-editor-toggles.js`). The module auto-inits on DOM-ready; set `window.__vcEditorTogglesManualInit = true` before loading it to call `window.amvcpEditorToggles.init(document)` yourself.
3. **Each group becomes a labelled band; each flag a `role="switch"` button** — keyboard-accessible (Space / Enter activate), `aria-checked` reflects state, `aria-labelledby` points at the flag label. State persists to `localStorage` (keyed by `data-ve-id`) so a refresh keeps the user's edits.
4. **Dependency warnings are PRE-RENDERED** — every flag's warning row is built at init, hidden by class, and only the class toggles when a dependency is unmet (per the NO-NEW-ELEMENTS highlight rule — flipping never injects geometry). The warning names the unmet requirement(s) and clears the moment they're satisfied.
5. **Copy-diff exports through the selection channel** — the "Copy diff" button computes a unified-diff of changed-vs-default flags (`-key = <default>` / `+key = <current>`), writes it to the clipboard (fail-soft), and lands a `kind:"element"` / `type:"flag-diff"` entry in `window.veSelection` whose `data` carries `{ changed:[{key,label,from,to}], diff:"<text>" }`. Re-copying replaces the prior entry (idempotent). See [editor-toggles-schema](./references/editor-toggles-schema.md#the-export-contract).

## Output

A `<div class="ve-editor-toggles" data-ve-type="editor-toggles">` containing a title, one `.ve-et-group` band per group (each with its switches + pre-rendered warning rows), and a footer with the "Copy diff" button + a live status note. Both themes theme correctly off the same `--vc-*` tokens. No nested scrollbars — the panel is single-column controls; the page extends per the no-nested-scrollbars rule.

## Error Handling

| Symptom | Fix |
|---|---|
| `[editor-toggles error] malformed JSON: …` | The `<script type="application/json">` block is invalid — fix the JSON. Engine renders nothing in place (fail-fast). |
| `[editor-toggles error] missing data-ve-id attribute` | The `.ve-editor-toggles` container needs a `data-ve-id` (it keys persistence + the default `exportId`). Add one. |
| `[editor-toggles error] requires { groups:[{flags:[…]}] }` | The spec has no `groups` array (or it's empty). Provide at least one group with at least one flag. |
| `[editor-toggles error] every flag needs a string "key"` | A flag object is missing its `key`. The key is the diff identity + dependency-graph node — every flag needs one. |
| Switches don't highlight / show a comment handle | The runtime (`amvcp-runtime.js`) isn't loaded, or loaded after this module. Load order is engine → runtime → editor-toggles. The switches still toggle (they're self-wired), but the runtime's selection/comment layer needs the runtime. |
| "Copy diff" does nothing visible | Browser lacks `navigator.clipboard` (HTTP context) — the clipboard write is fail-soft; the diff STILL lands in `window.veSelection`, which is the load-bearing export path. NOT an error. |
| A dependency warning never clears | The `requires` key names a flag that doesn't exist in the spec — unknown requirement keys are ignored (treated as satisfied). Check the key spelling. |
| State doesn't persist across refresh | `localStorage` is unavailable (Safari private mode) — persistence degrades silently by design; the editor still works for the session. |

## Examples

```
Input:  "Show a feature-flag editor for the rollout config."
Output: <div class="ve-editor-toggles" data-ve-id="toggles:rollout">
          <script type="application/json">
          { "title": "Rollout flags",
            "groups": [
              { "label": "Delivery", "flags": [
                { "key": "canary",    "label": "Canary",      "default": false },
                { "key": "telemetry", "label": "Telemetry",   "default": true  },
                { "key": "autoRoll",  "label": "Auto-rollback","default": false,
                  "requires": ["telemetry"] } ]} ] }
          </script>
        </div>
        Flipping autoRoll ON while telemetry is OFF shows
        "Requires Telemetry to be on."; the agent reads the copy-diff
        selection entry to learn which flags the user changed.

Input:  "Edit these config options and let me export what changed."
Output: one group per config section; the user flips toggles; "Copy diff"
        lands a kind:"element"/type:"flag-diff" entry in window.veSelection
        with the +/- changed lines — the agent acts on the diff.

Input:  "Toggle panel where the beta API requires the new UI shell first."
Output: { "key": "betaApi", "requires": ["newUi"] } — turning betaApi ON
        with newUi OFF surfaces the pre-rendered dependency warning.
```

## Modes

This skill supports `data-ve-mode="readonly"` semantics for the runtime selection layer (the cells are review/comment atoms), but the editor itself is genuinely *editable* — the switches mutate state. The per-element 3-state decision pill (R20-R23 of `amvcp-self-debug-rules`) does NOT apply; the editing facet is the toggles, and the export facet is the copy-diff selection entry, not an inline decision pill.

## Composability

Composes with `amvcp-design-tokens` (the source DESIGN.md / preset that themes the panel), `amvcp-form-inputs` (the single-flag `ve-toggle` primitive vs this grouped multi-flag editor), and `amvcp-modal-comments` (the comment-thread layer the runtime mounts when a flag row is selected). Nests cleanly via `<foreignObject>` / overlays alongside other elements (it owns its `--vc-*`-themed markup and assumes nothing about what it's combined with). The only exclusive skill is the overlay-runtime (R24).

## Resources

- [editor-toggles-schema.md](./references/editor-toggles-schema.md) — the input spec, the dependency model, the `data-ve-*` contract, and the copy-diff export wire format.
  > API · Spec shape · Groups and flags · The `requires` dependency model · The pre-rendered warning contract · The export contract (window.veSelection) · DESIGN.md tokens used · No nested scrollbars · Self-contained output
