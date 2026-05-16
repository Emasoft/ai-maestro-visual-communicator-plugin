# Selection atom payload

Every rendered node, edge, and group is a click-to-select atom.
This reference documents the EXACT contract for the `data-ve-id`
and `data-ve-data` attributes the engine emits, so an agent
receiving a click POST knows what to do with it.

## The DOM contract

```html
<g data-ve-id="vc-scene-7-node-3"
   data-ve-type="diagram-node"
   data-ve-data='{"sceneId":7,"kind":"node","nodeId":"check","nodeType":"decision","label":"Valid?","role":null}'>
  <polygon points="..." fill="..." stroke="..."/>
  <text>Valid?</text>
</g>
```

- `data-ve-id` — unique within the page, scoped by scene id.
- `data-ve-type` — one of `diagram-node`, `diagram-edge`,
  `diagram-group`.
- `data-ve-data` — JSON-encoded payload (always a string;
  parse on the agent side).

The visible shape (here `<polygon>`) is a DIRECT child of the
`<g>` so the runtime's selection CSS lights it up on hover:

```css
svg g[data-ve-id]:hover > rect,
svg g[data-ve-id]:hover > polygon,
svg g[data-ve-id]:hover > path,
svg g[data-ve-id]:hover > line {
  filter: brightness(1.08);
  cursor: pointer;
}
```

## Payload schemas

### `diagram-node`

```json
{
  "sceneId": 7,
  "kind": "node",
  "nodeId": "check",
  "nodeType": "decision",
  "label": "Valid?",
  "detail": null,
  "role": null,
  "groupId": null,
  "x": 540,
  "y": 200,
  "w": 90,
  "h": 90
}
```

Fields:

- `sceneId` — int, the scene's index on the page (1-based).
- `kind` — always `"node"` for node atoms.
- `nodeId` — the author-supplied id from the JSON.
- `nodeType` — one of the 7 types.
- `label` — the node's display text.
- `detail` — optional second line; `null` if not set.
- `role` — the role string or `null`.
- `groupId` — the containing group's id or `null`.
- `x`/`y`/`w`/`h` — final placed coordinates (after auto-place).

### `diagram-edge`

```json
{
  "sceneId": 7,
  "kind": "edge",
  "edgeFrom": "check",
  "edgeTo": "ingest",
  "label": "no",
  "edgeStyle": "dashed",
  "edgeRoute": "loop",
  "edgeAnimate": "none",
  "edgeArrow": "end"
}
```

Fields:

- `sceneId` — int.
- `kind` — always `"edge"`.
- `edgeFrom` / `edgeTo` — node ids.
- `label` — optional, `null` if not set.
- `edgeStyle` — `"solid"` | `"dashed"` | `"dotted"`.
- `edgeRoute` — `"straight"` | `"ortho"` | `"bezier"` | `"loop"`.
- `edgeAnimate` — `"none"` | `"flow"` | `"particle"` | `"pulse"`.
- `edgeArrow` — `"end"` | `"start"` | `"both"` | `"none"`.

### `diagram-group`

```json
{
  "sceneId": 7,
  "kind": "group",
  "groupId": "service-layer",
  "label": "Service",
  "role": "service",
  "memberCount": 3,
  "x": 20, "y": 200, "w": 1160, "h": 200
}
```

Fields:

- `sceneId` — int.
- `kind` — always `"group"`.
- `groupId` — the group's id.
- `label` — the displayed label.
- `role` — the group's role or `null`.
- `memberCount` — number of nodes that declared
  `node.group === groupId`.
- `x`/`y`/`w`/`h` — group rect.

## ID generation

The engine assigns `data-ve-id` in scene+counter form:

- Scene id N (1-based per page).
- Node K (1-based within scene).
- Edge K (1-based within scene).
- Group K (1-based within scene).

Examples:

- `vc-scene-1-node-1` — first node of first scene.
- `vc-scene-3-edge-7` — 7th edge of 3rd scene.
- `vc-scene-3-group-2` — 2nd group of 3rd scene.

The scene id is also written on the wrapper as
`data-ve-scene-id`, so an agent can query "give me all atoms in
scene 3" with `[data-ve-scene-id="3"]`.

## Why `nodeId` not `data-ve-id` is the stable identifier

`data-ve-id` is page-position-dependent. If two scenes change
order on the page, scene IDs change. The author-supplied `nodeId`
(carried in `data-ve-data.nodeId`) is the STABLE identifier — use
it for agent state, persistence, and references.

A click payload contains BOTH:
- `data-ve-id` (the DOM id, for the current page).
- `data-ve-data.nodeId` (the stable author id, for persistence).

Agents should persist by `nodeId`, not `data-ve-id`.

## Click POST payload

When the runtime intercepts a click on a `data-ve-id` element, it
POSTs to the agent endpoint. The POST body is:

```json
{
  "type": "selection",
  "domId": "vc-scene-7-node-3",
  "atomType": "diagram-node",
  "data": {
    "sceneId": 7,
    "kind": "node",
    "nodeId": "check",
    "nodeType": "decision",
    "label": "Valid?"
  },
  "page": {
    "url": "https://...",
    "title": "Phase 3 plan"
  }
}
```

The agent dispatches on `atomType` to route the click to the
right handler (open a comment thread, expand a detail panel,
launch a sub-action menu, etc.).

## Hover treatment (in CSS, not the payload)

Hover state is purely client-side CSS — no POST per hover. The
selection CSS:

```css
svg g[data-ve-id] {
  cursor: pointer;
}
svg g[data-ve-id]:hover > rect,
svg g[data-ve-id]:hover > polygon,
svg g[data-ve-id]:hover > path {
  filter: brightness(1.08);
}
svg g[data-ve-id][aria-selected="true"] > rect,
svg g[data-ve-id][aria-selected="true"] > polygon,
svg g[data-ve-id][aria-selected="true"] > path {
  stroke-width: 2.5;
  filter: brightness(1.15);
}
```

The `aria-selected="true"` attribute is set programmatically by
the runtime when an atom is the current selection.

## Hit-area twins for thin edges

Edges have a TRANSPARENT twin path layered behind the visible
path, for hit detection:

```html
<g data-ve-id="vc-scene-7-edge-3"
   data-ve-type="diagram-edge"
   data-ve-data='{...}'>
  <path class="hit"     d="M40,80 L260,80"
        stroke="transparent" stroke-width="14" fill="none"
        pointer-events="stroke"/>
  <path class="visible" d="M40,80 L260,80"
        stroke="var(--vc-color-border-strong)" stroke-width="1.5"
        marker-end="url(#vc-arrow-7)" fill="none"
        pointer-events="none"/>
</g>
```

The 14px-wide transparent hit path lets the reader click thin
1.5px edges without missing.

## Group label is also clickable

A group's label text is part of the group's `<g>`, so clicking
the label fires the group selection (not just clicking the
fill).

## Multi-select (Shift-click)

The runtime supports multi-select on Shift-click. The selected
atoms accumulate; the agent receives the full array of selected
atoms:

```json
{ "type": "selection-multi",
  "atoms": [
    { "domId": "vc-scene-7-node-3", ... },
    { "domId": "vc-scene-7-node-5", ... },
    { "domId": "vc-scene-7-edge-2", ... }
  ]
}
```

Useful for "delete these 3 phases" or "apply this role to all
selected nodes" actions.

## Decision-mini attachment

For `decision` nodes, the runtime attaches a small "decision
mini" UI on right-click — a popover with quick actions
("highlight yes branch", "highlight no branch"). Implemented in
`_attachDecisionMini`; transparent to the engine; the engine
just emits the `data-ve-type="diagram-node"` atom with the
decision's payload, and the runtime decides whether to show the
mini.

## Comment threading

Comments are anchored to atoms via the standard modal-comment
flow. The first selection on an atom opens a fresh thread;
subsequent selections re-open the existing thread. The thread
key is the stable `nodeId` (or `edgeFrom + edgeTo`), so threads
survive scene order changes.

## DESIGN.md tokens consumed (by the selection CSS)

No tokens — the hover/selected treatment is `filter` based, not
color based, so it works regardless of the underlying theme.

## Anti-patterns

- Setting `data-ve-id` on a node WITHOUT `data-ve-type`: the
  runtime can't dispatch correctly. Always pair them.
- Embedding raw HTML in a label that breaks the JSON encoding:
  use `escapeAttr` (the engine does this).
- Persisting `data-ve-id` as a stable id in agent storage: it
  changes per page render. Use `nodeId`.
- Forgetting the hit-area twin on a thin edge: edges become
  unclickable.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark, then hover (and click) atoms. Verify:

- Hover state lights up (brightness filter visible).
- Click selects (the `aria-selected` styling applies).
- Thin edges (1.5px) are clickable — the hit-area twin works.
- The POST receives the expected payload (inspect Network tab).
