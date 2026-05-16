# Dependency chain highlight

The interaction at the heart of `phase-graph-preset.md`: click a
node, the engine walks the transitive closure of dependencies in
both directions (ancestors + descendants), and highlights the
chain while dimming the rest. A second click clears.

This reference goes deep on the interaction — when to use it, how
the math works, anti-patterns, accessibility.

## When the chain-highlight interaction shines

Use chain-highlight when:

- The diagram has **5-30 interconnected nodes** and the reader
  needs to ask "what does THIS depend on, and what depends on
  THIS?".
- Dependencies are NOT obvious from the layout (the lines cross,
  the structure is dense).
- The diagram is a **plan, roadmap, or dependency graph** where
  the chain is the most-asked question.

Skip chain-highlight when:

- The diagram has fewer than 5 nodes (no chain to highlight).
- The dependencies form a tree (the layout already shows them).
- Every node depends on every other (the highlight reveals
  nothing).

## The chain walk

Click on node `N`:

1. **Find ancestors**: walk every incoming edge `e` where
   `e.to === N`. Add `e.from` to the chain. Recurse on
   `e.from`.
2. **Find descendants**: walk every outgoing edge `e` where
   `e.from === N`. Add `e.to` to the chain. Recurse on `e.to`.
3. The chain is the SET of node ids found (including N itself).

Use a set to avoid re-walking cycles (defensive — phase graphs
should be DAGs but bugs happen). Pseudocode:

```js
function computeChain(scene, startId) {
  var chain = new Set([startId]);

  function walkAncestors(id) {
    scene.edges.forEach(function (e) {
      if (e.to === id && !chain.has(e.from)) {
        chain.add(e.from);
        walkAncestors(e.from);
      }
    });
  }
  function walkDescendants(id) {
    scene.edges.forEach(function (e) {
      if (e.from === id && !chain.has(e.to)) {
        chain.add(e.to);
        walkDescendants(e.to);
      }
    });
  }

  walkAncestors(startId);
  walkDescendants(startId);
  return chain;
}
```

For graphs with hundreds of nodes, pre-compute the adjacency
list once at render time instead of scanning `scene.edges` per
walk. The engine's `wireChainHighlight` does this.

## Visual treatment

Two CSS classes, applied on `<g>` elements:

```css
.ve-scene-graph g[data-ve-chain-active="1"] {
  opacity: 1;
}
.ve-scene-graph g[data-ve-chain-active="1"] > rect,
.ve-scene-graph g[data-ve-chain-active="1"] > polygon,
.ve-scene-graph g[data-ve-chain-active="1"] > path {
  stroke-width: 2.5;
}
.ve-scene-graph g[data-ve-chain-active="0"] {
  opacity: 0.35;
}
```

The chain nodes stay full-opacity AND get a thicker stroke.
Non-chain nodes fade to 35% opacity.

Transition the opacity for smoothness:

```css
.ve-scene-graph g {
  transition: opacity var(--vc-duration-fast) ease-out;
}
```

Under `prefers-reduced-motion: reduce`, kill the transition:

```css
@media (prefers-reduced-motion: reduce) {
  .ve-scene-graph g { transition: none; }
}
```

## Edge treatment

Edges with BOTH endpoints in the chain are full-opacity. Edges
with one or zero endpoints in the chain are dimmed:

```css
.ve-scene-graph g[data-ve-edge-chain-active="1"] {
  opacity: 1;
}
.ve-scene-graph g[data-ve-edge-chain-active="0"] {
  opacity: 0.35;
}
```

The engine sets `data-ve-edge-chain-active="1"` when both
`e.from` and `e.to` are in the chain set.

## Clearing the chain

Two clear behaviors:

1. **Second click on any node** = clear and start fresh chain on
   that node.
2. **Second click on the SAME node** = clear entirely (back to
   no chain).

The engine implements (1) — clicking another node restarts the
chain. To get (2), check if the clicked node is the current
chain's start; if so, clear; if not, restart.

```js
function onChainClick(scene, hostEl, nodeId) {
  var currentStart = hostEl.dataset.veChainStart;
  if (currentStart === nodeId) {
    clearChain(hostEl);
    hostEl.dataset.veChainStart = '';
    return;
  }
  applyChain(scene, hostEl, nodeId);
  hostEl.dataset.veChainStart = nodeId;
}
```

## Accessibility

The chain is purely visual — a screen reader doesn't see opacity
changes. For accessibility:

1. Add an `aria-live` region near the diagram. Update it on
   chain change:

```html
<div class="vc-sr-only" aria-live="polite" data-ve-chain-announcer></div>
```

```js
function announceChain(hostEl, chainArray) {
  var ann = hostEl.querySelector('[data-ve-chain-announcer]');
  if (!ann) { return; }
  ann.textContent = 'Highlighting ' + chainArray.length
    + ' dependent phases: ' + chainArray.join(', ');
}
```

A screen reader announces "Highlighting 4 dependent phases:
design, scaffold, implement, test" when the chain fires.

2. Add `aria-pressed` to a node that's the chain's root:

```js
node.setAttribute('aria-pressed', 'true');
```

The screen reader announces "Design, pressed" so the user knows
the click did something.

## Performance

For 30-node graphs the chain walk is instant (< 1ms). For 300+
node graphs the recursive walk hits the call stack; convert to
an iterative BFS:

```js
function computeChainBFS(scene, startId) {
  var chain = new Set([startId]);
  var queue = [startId];
  var adjOut = buildOutAdjacency(scene);   // pre-built
  var adjIn  = buildInAdjacency(scene);
  while (queue.length) {
    var id = queue.shift();
    (adjOut[id] || []).forEach(function (to) {
      if (!chain.has(to)) { chain.add(to); queue.push(to); }
    });
    (adjIn[id] || []).forEach(function (from) {
      if (!chain.has(from)) { chain.add(from); queue.push(from); }
    });
  }
  return chain;
}
```

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | inherits from node fills/strokes (no new tokens) |
| motion | `--vc-duration-fast` for the opacity transition |

## Selection atoms

Chain-highlight does NOT change the selection atom contract.
Clicks still emit standard `diagram-node` payloads. The chain
state is purely a DOM-attribute side effect.

The agent receiving a chain-highlight click MAY:

- Read `data-ve-chain-active` on every node post-click to know
  the chain composition.
- Or compute the chain itself by walking the scene JSON.

## Variations

### Ancestors-only or descendants-only

For some plans, "what does this depend on?" (ancestors-only) is
more interesting than "and what depends on it?". Add a
configuration:

```html
<div data-ve-chain-direction="ancestors">
```

The engine walks only the ancestors when this attribute is
present.

### Distance-tinted chain

Instead of a binary "in chain / out chain", tint by distance:

- Distance 0 (the clicked node) = full saturation accent.
- Distance 1 = lighter accent.
- Distance 2 = even lighter.
- Distance 3+ = neutral.

The reader sees the "depth" of the chain. Implement by storing
`data-ve-chain-distance="2"` and using attribute selectors with
varying `opacity`.

### Filter-not-highlight

Some users prefer the non-chain nodes to be COMPLETELY HIDDEN
(opacity 0 + `pointer-events: none`) rather than dimmed. Toggle
via a config attribute:

```html
<div class="ve-scene-graph" data-ve-chain-mode="filter">
```

`mode="dim"` (default) or `mode="filter"`.

## Anti-patterns

- Chain visualization on a tree-shaped diagram: nothing to
  highlight; every node trivially reaches its descendants.
- Chain on a fully-connected graph: every chain is the whole
  graph; the highlight reveals nothing.
- Forgetting the second-click-to-clear: the user gets stuck in
  one chain forever.
- No transition on opacity: the change feels jarring.
- No accessibility announcement: invisible to screen readers.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark, then CLICK a middle node and capture
again. Verify:

- Non-chain nodes are visibly dimmed (35% opacity is enough; if
  not, bump to 25%).
- Chain nodes are visibly thicker-stroked.
- Edges respect the chain (in-chain solid, out-chain dimmed).
- Second click clears (capture a third screenshot post-second-
  click to verify).
