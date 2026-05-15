# Drag reorder list / Kanban

A reorderable multi-column Kanban board. Cards drag between columns;
state persists to localStorage; the board exports to Markdown (columns →
`## headings`, cards → `- [ ]` items). HTML5 drag API, no dependency.

## HTML skeleton

Columns + cards come from the JSON model's `board` key.

```html
<div class="ic-board" data-ic-board data-ic-persist data-id="sprint-triage">
  <div class="ic-col" data-col="now">
    <div class="ic-col-head">Now <span class="ic-col-count">0</span></div>
    <div class="ic-col-body"><!-- cards injected here --></div>
  </div>
  <div class="ic-col" data-col="next"> … </div>
</div>
<button class="ic-board-export" type="button">Copy as Markdown</button>
```

The model's `board`:

```json
"board": {
  "title": "Sprint triage",
  "columns": [ { "id": "now", "label": "Now" } ],
  "cards":   [ { "id": "c1", "col": "now",
                 "title": "Fix login bug", "note": "blocks release" } ]
}
```

## One source of truth

`model.board.cards` is the canonical state. The DOM is **always** rebuilt
from it (`render()`). `contentEditable` card notes are read back into the
model (`saveNotes()`) **before** any re-render or export — the DOM and
the model never diverge.

## Cards

Each card is built with `createElement` + `textContent` — drop in user
data and still get no XSS ("safe to fork" construction). A card is
`draggable`; on `dragstart` it adds `.ic-dragging` and writes its id to
`dataTransfer` (`text/plain`). Each `.ic-col` is a drop target: on `drop`
it reads the id, calls `saveNotes()`, sets the card's `col`, re-renders,
persists, and fires `ic:reorder` (`detail: { boardId, cards }`).

## Markdown export

`toMarkdown()` (also exposed as `amvcpInteractive.toBoardMarkdown(boardEl)`)
emits each column as a `## heading` and each card as a `- [ ]` item in
column order; an empty column emits `_(none)_`. The export button copies
it via `navigator.clipboard.writeText` with a `<textarea>`-select
fallback for non-secure contexts, then shows a brief toast.

## Persistence

On every drop / note edit the card list is saved to localStorage. On
boot the persisted card list is preferred over the embedded JSON (it
reflects the user's most recent drags).

## Degradation with JS off

A board would be empty with JS disabled. The scaffold emits a
`<noscript>` static rendering — each column as a `### heading` with its
cards as a plain list. The report still communicates, just
non-interactively.

## no-nested-scrollbars

Columns sit in a flex row; each `.ic-col-body` grows with its cards — the
**page** scrolls, no per-column inner scroller. If many columns overflow
the viewport width, the page gets one horizontal scrollbar (allowed for a
non-wrappable widget — the rule's documented exception).
