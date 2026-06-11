# editor-kanban — markup, export contract, and drag model

The ticket-triage board (`amvcp-editor-kanban.js`) is a composable HTML
primitive: declarative markup in, a drag-reorderable board out, and a
markdown ordering exported back to the agent through the existing runtime
selection channel.

## Table of contents

- [API](#api)
- [Markup contract](#markup-contract)
- [Ticket + column schema](#ticket--column-schema)
- [The export contract (rides the selection channel)](#export-contract)
- [Pointer-drag (mouse + touch + pen)](#pointer-drag)
- [No-new-elements](#no-new-elements)
- [DESIGN.md theming](#designmd-theming)
- [No nested scrollbars](#no-nested-scrollbars)
- [Self-contained output](#self-contained-output)

## API

`window.amvcpEditorKanban`:

| Function | Purpose |
|---|---|
| `init(root)` | Scan `root` (default `document`) and wire every `.ve-editor-kanban`. |
| `injectStyles(doc)` | Inject the scoped `--vc-*`-themed stylesheet (`#vc-editor-kanban-styles`) once. |
| `initBoard(el)` | Wire one board element (idempotent — re-calling is a no-op). |

Auto-boots on load unless the page sets `window.__vcEditorKanbanManualInit`
(the test fixture sets it so it can boot deterministically AFTER the
runtime has stamped its selection wiring). Load order is always
**designmd → runtime → editor-kanban**.

## Markup contract

```html
<div class="ve-editor-kanban" data-ve-id="triage:demo" data-ve-label="Sprint triage">
  <script type="application/json">
    {
      "label": "Sprint triage",
      "columns": [
        { "key": "now",   "label": "Now",   "tone": "best" },
        { "key": "next",  "label": "Next",  "tone": "good" },
        { "key": "later", "label": "Later", "tone": "fair" },
        { "key": "cut",   "label": "Cut",   "tone": "weak" }
      ],
      "tickets": [
        { "key": "auth",  "title": "Fix auth redirect loop", "column": "now",  "meta": "P0 · #412" },
        { "key": "cache", "title": "Add response cache",     "column": "next", "meta": "P1 · #420" }
      ]
    }
  </script>
</div>
```

- `data-ve-id` is **required** (fail-fast `[editor-kanban error] missing
  data-ve-id attribute` otherwise). It namespaces the localStorage key
  (`amvcp-editor-kanban:<id>`) and the export `entryId`.
- The child `<script type="application/json">` is the model. The renderer
  empties the div and rebuilds it; never put visible markup inside —
  only the JSON.
- `label` (or `data-ve-label`) renders as the board heading and seeds the
  exported markdown `# …` title.

## Ticket + column schema

**Ticket** — `{ key, title, column?, meta? }`:

| Field | Required | Purpose |
|---|---|---|
| `key` | yes (falls back to `value`, then `ticket-<i>`) | Stable identifier; the unit of the exported ordering arrays. |
| `title` | yes (falls back to `label`, then `key`) | The card's visible text and the markdown list entry. |
| `column` | no | Starting column key; defaults to the **first** column. Invalid/unknown column → first column. |
| `meta` | no | A small monospace sub-line on the card (e.g. `P1 · #420`). |

**Column** — `{ key, label?, tone? }`. Defaults to
`Now / Next / Later / Cut` when `columns` is omitted. **The left-to-right
column order is the priority gradient** the exported markdown preserves —
order the columns intentionally. `tone` is an optional `data-col-tone`
hook for DESIGN.md-driven per-column accenting.

## Export contract

The export RIDES the existing runtime selection channel — there is no
second POST path, no foreign export UX. On every reorder (and once at
mount, so a submit without any drag still returns the initial ordering),
the board pushes — or replaces — **exactly one** entry in
`window.veSelection`:

```json
{
  "kind": "element",
  "entryId": "element:ve-editor-kanban-export:triage:demo",
  "id": "ve-editor-kanban-export:triage:demo",
  "type": "kanban-export",
  "label": "Sprint triage — ordering",
  "data": {
    "boardId": "triage:demo",
    "ordering": { "now": ["metrics","auth","cache"], "next": ["logs"], "later": ["darkmode"], "cut": ["legacy"] },
    "markdown": "# Sprint triage\n\n## Now\n1. Latency metrics\n2. Fix auth redirect loop\n3. Add response cache\n\n## Next\n1. Structured logging\n\n## Later\n1. Dark-mode polish\n\n## Cut\n1. Drop legacy export\n"
  }
}
```

- The entry is `kind:"element"`, so the runtime's `buildSubmissionPayload`
  spreads every field (except the internal `entryId`) into the
  `/__ve-select` wire payload verbatim — the agent reads
  `selections[].data.markdown`.
- The `entryId` is stable per board (`element:ve-editor-kanban-export:<id>`),
  so re-exporting after each drag **replaces** the entry rather than
  appending — the user can never submit two stale orderings for one board.
- `data.ordering` is `{ columnKey: [ticketKey…] }` in left-to-right column
  order, for an agent that wants the structured form; `data.markdown` is
  the human-readable rendering (one `## Column` heading + a numbered
  priority list; empty columns show `_(empty)_`).
- Pressing **Enter** or the runtime Submit button returns the current
  payload. ESC clears `veSelection` (including this entry) — the board
  re-seeds it on the next drag.

**Required follow-up (agent side):** on submit, branch on the entry's
`type === "kanban-export"` and act on `data.markdown` (or `data.ordering`)
— it is the user's triaged priority order. No re-prompt is needed; the
export is a user-authored result, not a click on an element.

## Pointer-drag

The drag is the shared `makePointerSortable` pattern (copied from
`amvcp-form-inputs.js` per the module-isolation rule — NOT imported across
modules):

- **One pointer path for mouse + touch + pen** (Pointer Events). HTML5
  drag-and-drop is avoided because it never fires on touch.
- **6px move threshold** — below it, the `pointerup` falls through to the
  runtime's click-to-select model, so a tap still selects the board for
  comment. Above it, the press promotes to a drag.
- **`touch-action: none` on the draggable tickets ONLY** (never the page),
  so a touch-drag reorders instead of scrolling; page scroll outside the
  tickets is untouched.
- **Insertion point** — dropping over a ticket inserts before/after at the
  ticket's Y-midpoint; dropping over empty bucket space appends.
- **`setPointerCapture`** routes all moves to the grabbed item even when
  the pointer leaves it (guarded — a failed capture still works via the
  per-item listeners).
- **Trailing-click suppression** — a real drag fires a trailing `click`;
  the engine swallows exactly one via a **window-capture** listener that
  pre-empts the runtime's document-capture selection handler, so a reorder
  never spuriously selects the board. A sub-threshold tap never sets the
  flag, so its click passes through unharmed.

## No-new-elements

Per the user contract (`references/interactive-selection-base.md`),
highlight + drag state NEVER add new visual elements:

- Drag-in-flight is the existing ticket re-painted (`cursor:grabbing` +
  reduced opacity) via the `ve-editor-kanban-dragging` class — no ghost,
  no clone.
- The live drop target is the existing bucket re-painted with a
  token-tinted background (`ve-editor-kanban-drop-target`) — **no
  outline** (an outline reads as an injected frame), no inserted spacer.
- After a completed drag the element count under the board (and in
  `<body>`) is unchanged and no `*-dragging` / `*-drop-target` class
  lingers (verified by `tests/scripts/test-editor-kanban.js`).

## DESIGN.md theming

Every colour is a `var(--vc-*, fallback)`; the board ships no hardcoded
palette. The tokens MUST come from a **fenced** embedded DESIGN.md parsed
by `amvcp-designmd.js`, not a plain `<style>` block: the runtime injects
the parsed DESIGN.md tokens as **inline style on `<html>`** (specificity
1,0,0,0), which would override any plain `html[data-ve-theme]` CSS rule.
Only the designmd engine's own light/dark token sets switch live on a
`data-ve-theme` flip (via its MutationObserver — allow ~one tick before
reading the re-applied tokens). Both themes ship; single-theme is a
correctness defect.

## No nested scrollbars

The columns row is a wrapping flexbox; when the board is wider than the
viewport the **page** widens (the document's own scrollbar) — the board
never introduces an inner `overflow:auto` scroller. Buckets have a
`min-height` so an empty column is still a valid drop target, and grow
with their tickets (no inner scroll). This honours the
no-nested-scrollbars rule.

## Self-contained output

The board is a single `.ve-editor-kanban` subtree plus the three
co-located scripts (designmd + runtime + editor-kanban). For a portable
single-file artifact, inline the runtime (see
`references/interactive-selection-base.md` → "Inlining the runtime").
