# Click-step + detail panel

The most powerful diagram-interaction pattern in the catalog: each
diagram node, when clicked, populates a sticky side panel with
title + meta + body + code snippet. Lifted from
`13-flowchart-diagram` and `15-research-concept-explainer` in the
html-effectiveness catalog. Turns a STATIC figure into NAVIGABLE
content: the diagram IS the navigation, not just the destination.

## When to choose this pattern

Use click-step + detail panel when:

- The diagram is the **index** of richer content (each node is
  a deploy step, an architecture component, an FSM state, a
  PRD phase) and there's a body of detail per node.
- Reading the detail in-place would clutter the diagram, but
  losing the detail entirely makes the diagram a tease.
- The detail varies in length / kind per node (one node opens a
  code snippet, another opens a paragraph + chart).

Do NOT use this pattern when:

- The diagram is purely visual (a brand-style logo composition).
- Every node's "detail" is one line that fits in the node's
  `detail` field.
- The diagram appears multiple times on the same page (multiple
  diagrams competing for one detail panel = confusion).

## The shape

A 2-column layout:

- LEFT: the diagram (scene graph or other).
- RIGHT: a sticky detail panel that updates on click.

```html
<div class="ve-diagram-with-panel"
     data-ve-block="diagram-with-detail">
  <div class="ve-diagram-with-panel__diagram">
    <div class="ve-scene-graph" data-ve-scene-preset="phase-graph">
      <script type="application/json">{ ... scene ... }</script>
    </div>
  </div>

  <aside class="ve-diagram-with-panel__panel"
         data-ve-panel="diagram-detail"
         aria-live="polite">
    <header class="ve-detail-panel__header">
      <h3 class="ve-detail-panel__title">
        Click a node to see details
      </h3>
      <div class="ve-detail-panel__meta"></div>
    </header>
    <div class="ve-detail-panel__body">
      <p>Each node opens a sticky detail card here.</p>
    </div>
    <pre class="ve-detail-panel__code"></pre>
  </aside>
</div>
```

CSS:

```css
.ve-diagram-with-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  column-gap: 32px;
  align-items: start;
}
.ve-diagram-with-panel__panel {
  position: sticky;
  top: 24px;
  align-self: start;
  padding: 24px;
  background: var(--vc-color-surface);
  border: 1px solid var(--vc-color-border);
  border-radius: var(--vc-radius-md);
}
.ve-detail-panel__title {
  font: var(--vc-weight-medium) var(--vc-text-2) / 1.2 var(--vc-font-body);
  color: var(--vc-color-content);
  margin: 0 0 8px;
}
.ve-detail-panel__meta {
  font: var(--vc-text-0) / 1 var(--vc-font-mono);
  color: var(--vc-color-content-muted);
  letter-spacing: 0.04em;
}
.ve-detail-panel__body {
  font: var(--vc-text-1) / 1.6 var(--vc-font-body);
  color: var(--vc-color-content);
  margin: 16px 0;
}
.ve-detail-panel__code {
  background: var(--vc-color-surface-sunken);
  padding: 12px 16px;
  border-radius: var(--vc-radius-sm);
  font: var(--vc-text-0) / 1.4 var(--vc-font-mono);
  color: var(--vc-color-content);
  overflow: visible;          /* no inner scrollbar */
}

@media (max-width: 960px) {
  .ve-diagram-with-panel { grid-template-columns: 1fr; }
  .ve-diagram-with-panel__panel {
    position: static;
    margin-top: 24px;
  }
}
```

## The wiring

A small post-render script binds clicks on the scene graph to
panel updates:

```js
function bindDetailPanel(root) {
  var diagrams = root.querySelectorAll('.ve-diagram-with-panel');
  for (var i = 0; i < diagrams.length; i++) {
    var d = diagrams[i];
    var panel = d.querySelector('[data-ve-panel="diagram-detail"]');
    var title = panel.querySelector('.ve-detail-panel__title');
    var meta  = panel.querySelector('.ve-detail-panel__meta');
    var body  = panel.querySelector('.ve-detail-panel__body');
    var code  = panel.querySelector('.ve-detail-panel__code');

    d.addEventListener('click', function (ev) {
      var node = ev.target.closest('g[data-ve-type="diagram-node"]');
      if (!node) { return; }
      var data = JSON.parse(node.getAttribute('data-ve-data') || '{}');
      var detail = window.__VC_DETAILS && window.__VC_DETAILS[data.nodeId];
      if (!detail) {
        title.textContent = data.label || data.nodeId;
        body.innerHTML = '<em>No detail registered for this node.</em>';
        meta.textContent = data.nodeType || '';
        code.textContent = '';
        return;
      }
      title.textContent = detail.title || data.label;
      meta.textContent  = detail.meta || '';
      body.innerHTML    = detail.body || '';
      code.textContent  = detail.code || '';
    });
  }
}
```

`window.__VC_DETAILS` is a registry keyed by `nodeId`:

```js
window.__VC_DETAILS = {
  'ingest': {
    title: 'Ingest pipeline',
    meta:  'github actions . ~2 min',
    body:  '<p>Each file in <code>src/feeds</code> is fetched, '
         + 'parsed, and dropped into the staging queue.</p>',
    code:  '# .github/workflows/ingest.yml\n'
         + 'name: ingest\n'
         + 'on:\n'
         + '  schedule:\n'
         + '    - cron: "0 */6 * * *"\n'
  },
  'validate': { ... },
  'persist':  { ... }
};
```

## Active-node styling

When a node is "currently selected" in the panel, mark it:

```js
// In the click handler, after updating the panel:
Array.from(d.querySelectorAll('g[data-ve-type="diagram-node"]'))
  .forEach(function (n) { n.classList.remove('is-active'); });
node.classList.add('is-active');
```

CSS:

```css
.ve-scene-graph g[data-ve-type="diagram-node"].is-active > rect,
.ve-scene-graph g[data-ve-type="diagram-node"].is-active > polygon,
.ve-scene-graph g[data-ve-type="diagram-node"].is-active > path {
  stroke-width: 2.5;
  stroke: var(--vc-color-accent);
}
```

The clicked node's stroke thickens and changes color so the
reader knows which node the panel relates to. (The cataloged
13-flowchart pattern uses 2px clay stroke; here we use the
DESIGN.md accent.)

## Detail registration patterns

Three ways to populate `__VC_DETAILS`:

### Inline data
```html
<script>
window.__VC_DETAILS = window.__VC_DETAILS || {};
Object.assign(window.__VC_DETAILS, { 'ingest': { ... }, ... });
</script>
```

Simple, self-contained. Works for small diagrams.

### One details-block per node
```html
<template data-ve-detail-for="ingest">
  <h3>Ingest pipeline</h3>
  <div class="meta">github actions . ~2 min</div>
  <p>Each file in <code>src/feeds</code> is fetched, ...</p>
</template>
```

A `<template>` element per node carries the detail; the wiring
script reads the `<template>` content into the panel. More DOM
but cleaner separation of data and code.

### Fetched lazily
```js
window.__VC_DETAIL_FETCHER = function (nodeId) {
  return fetch('/api/detail?node=' + encodeURIComponent(nodeId))
    .then(function (r) { return r.json(); });
};
```

For large diagrams or dynamic content; the panel shows a loading
state while the fetch happens.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-surface`, `--vc-color-border`, `--vc-color-content`, `--vc-color-content-muted`, `--vc-color-accent` (active node) |
| typography | `--vc-font-body`, `--vc-font-mono`, `--vc-text-0/1/2`, `--vc-weight-medium` |
| radius | `--vc-radius-md` (panel), `--vc-radius-sm` (code block) |

## Selection atoms

The diagram nodes are already standard `diagram-node` atoms. The
detail panel itself is a `panel` atom:

```html
<aside data-ve-id="vc-detail-panel-1"
       data-ve-type="diagram-detail-panel">
  ...
</aside>
```

So an agent receiving a click on the panel knows which diagram
it belongs to (`data-ve-data.parentDiagramId`).

## Variations

### Panel that pops over the diagram (instead of side-by-side)

For narrow viewports, the panel can pop as a modal over the
diagram. Use `position: fixed` and a backdrop. See the
amvcp-modal-comments skill for the modal pattern.

### Per-node side-panel position

For very wide diagrams, the panel could appear NEXT TO the
clicked node rather than on the side. More complex to implement;
the side-panel approach is the proven UX.

### Two-panel layout

Some patterns benefit from TWO panels — left = code, right =
diagram, both update together. Useful for tutorial walkthroughs.
Add a second `<aside>` and wire both in the click handler.

## Anti-patterns

- Panel that ALWAYS shows the same content regardless of click:
  the binding is broken.
- Panel with `overflow: auto` that scrolls separately from the
  page: violates the no-nested-scrollbars rule. Let the panel
  extend the page.
- Diagram with 30+ nodes and a tiny panel: every click feels
  like opening a new browser tab. Consider folding the panel
  into the diagram (use `subprocess` nodes that link to
  separate doc pages).
- Active-node CSS that conflicts with the hover CSS: hover
  becomes invisible on the active node. Layer them carefully.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Then CLICK a node and capture again —
verify:

- The panel updated (title + body + code match the clicked
  node).
- The active node has a visible stroke change (the
  `.is-active` class fires).
- The previous active node has had `.is-active` removed.
- At narrow viewport (< 960px), the panel stacks below the
  diagram (responsive flip works).
