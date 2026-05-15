# State plumbing — embedded JSON model + localStorage

The cross-cutting layer every widget plugs into. Two halves: a read-side
(embedded JSON data model) and a persist-side (localStorage helper).

## Embedded JSON data model

Carry the page's structured data in **one** non-executed `<script>` block.
Browsers do not run `type="application/json"` scripts, so model values can
never inject XSS, and no string escaping (`</script>` aside) is needed.

```html
<script type="application/json" id="ic-data">
{
  "tabs":   [ { "id": "t-overview", "label": "Overview" } ],
  "steps":  [ { "id": "s-plan", "label": "Plan", "state": "done" } ],
  "filters":[ { "id": "f-all", "label": "All", "tag": "*" } ],
  "list":   { "rowHeight": 32, "items": [ "row 1", "row 2" ] },
  "board":  { "title": "Triage",
              "columns": [ { "id": "now", "label": "Now" } ],
              "cards":   [ { "id": "c1", "col": "now",
                             "title": "…", "note": "…" } ] }
}
</script>
```

One block per page; `id` defaults to `ic-data`. A widget that reads the
model names it via `data-ic-model="ic-data"` and may drill into one key
via `data-ic-model-key="list"`.

`amvcpInteractive.readModel(id)` parses it. **Fail-fast:** a missing or
malformed model throws — the widget does not render, no default is
invented, no `try/catch`-to-fallback. Every value reaches the DOM via
`createElement` + `textContent`, never `innerHTML`.

## localStorage persistence helper

Any element that should survive a reload carries `data-ic-persist` + a
unique `data-id`:

```html
<div class="ic-tabs" data-ic-persist data-id="report-tabs"> … </div>
```

The helpers (`stateKey` / `loadState` / `saveState`) namespace every key
under `amvcp-ic:` so widget state never collides with the runtime's
comment-thread keys. A widget with no `data-id` simply is not persisted
(no error). A `data-ic-persist` element with no `data-id` is a hard
**dev error** — the helper `console.error`s with the element so the
missing key is noticed.

### The one allowed try/catch

localStorage is the **single** place a `try/catch`-to-default is correct.
Safari private mode throws on `setItem`; a report must stay usable
without persistence. The helpers degrade to the default on any storage
error. This is graceful degradation of a *non-essential* feature — the
widget's core behaviour does not depend on persistence — **not** a
fail-fast violation. Everything else in this skill fails fast.

## Selection-system seam

A widget element that should be **agent-selectable** (clickable to return
its id to the agent) carries `data-ve-id` + `data-ve-type`; the existing
runtime selection plumbing (`setupAtomSelectionEvents`) handles the click.
This skill does **not** re-implement selection. Widget interactivity (tab
switch, drag, slider) is *internal* and orthogonal to `data-ve-id`
selection — the two coexist (a `.ic-card` can be both draggable and
`data-ve-id`-selectable).

## 3-state mini-switch — already shipped (seam only)

The runtime already ships `aria-checked` tristate decision pills
(`.ve-decision-mini`, `amvcp-runtime.js`). This skill does **not**
re-implement them — author a runtime decision pill directly when a
3-state S/A/D switch is needed.
