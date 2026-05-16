# Group container rects

How `groups` work in the scene graph — the rectangles drawn behind
nodes to encode layer, swimlane, namespace, or container
membership.

## What a group is (and isn't)

A `group` in the scene graph is a **purely visual rectangle**
drawn behind nodes. It is NOT a structural container; the engine
does NOT enforce that a node's coordinates fall inside its
declared `group`. The relationship is annotation, not constraint:

- The group draws first (z-order behind nodes).
- A node declares membership via `node.group = "<id>"`; this is
  used for selection grouping (clicking a node knows its group)
  and for future auto-resizing.
- Auto-resizing a group to fit its members is a planned feature;
  for now, you size the group manually.

The benefit of this minimal model: you can paint a group around
anything (a region of a free-preset floor plan, a layer in an
architecture canvas, a swim-lane in a phase graph, a callout
around three related nodes), without changing the node-placement
logic.

## Group schema

```json
{
  "id": "service-layer",
  "label": "Service layer",
  "x": 20, "y": 200,
  "w": 1160, "h": 200,
  "role": "service"
}
```

- `id` — unique, required.
- `label` — optional; drawn at the group's top-left in
  `--vc-text-2`.
- `x`/`y`/`w`/`h` — required, define the rectangle.
- `role` — optional; tints the fill (same role enum as nodes).

## Group rendering

A group renders as:

1. A `<rect>` of size `w x h` at `(x, y)`.
2. Fill = role-tinted color (e.g. `color-mix(in oklch,
   var(--vc-color-accent) 10%, var(--vc-color-surface))` for
   `role: "service"`).
3. Stroke = the role's stroke color at low alpha (~30%).
4. Corner radius = `--vc-radius-md`.
5. If `label` is set, a small text label at `(x + 12, y + 20)`
   in `--vc-text-2 --vc-color-content-muted`.

Groups are drawn **before** nodes, so node rectangles sit on top
of the group fill — the group reads as a backdrop, not as the
front element.

## Group tint vs node tint

Groups use a **weaker** tint than nodes (10% vs 14%) so the
group reads as a backdrop. A `role: "service"` node sits on top
of a `role: "service"` group: both are accent-tinted, but the
group is softer so the node still stands out.

## Use cases

### Architecture layer

The canonical use: one group per layer of a layered architecture
canvas. Each layer is a horizontal strip; nodes sit inside their
layer.

```json
{ "id": "client-layer", "label": "Client",
  "x": 20, "y": 20, "w": 1160, "h": 140, "role": "client" }
```

### Swimlane

For a phase graph or process flow with multiple "owners", one
group per owner = a horizontal swimlane:

```json
{ "id": "backend-lane",  "label": "Backend team",
  "x": 0, "y": 0,   "w": 1200, "h": 240, "role": "service" }
{ "id": "frontend-lane", "label": "Frontend team",
  "x": 0, "y": 240, "w": 1200, "h": 240, "role": "client" }
{ "id": "design-lane",   "label": "Design team",
  "x": 0, "y": 480, "w": 1200, "h": 240, "role": "accent" }
```

Card nodes are then positioned so their `y` falls inside the
right lane. The engine draws the lane backdrop; the cards sit
inside.

### Namespace / module

In a code-architecture diagram, group nodes by package/module:

```json
{ "id": "auth-pkg",  "label": "/auth",
  "x": 40, "y": 40,  "w": 380, "h": 320, "role": "service" }
{ "id": "data-pkg",  "label": "/data",
  "x": 460, "y": 40, "w": 380, "h": 320, "role": "data" }
{ "id": "api-pkg",   "label": "/api",
  "x": 40, "y": 400, "w": 800, "h": 240, "role": "service" }
```

A reader scanning the diagram sees the package boundaries
immediately; cross-package edges visually cross group borders,
emphasizing the dependency.

### Callout / region

A group can also act as a callout — a tinted region drawn
around a specific subset of nodes to say "this part is the
focus":

```json
{ "id": "hot-zone", "label": "CRITICAL PATH",
  "x": 320, "y": 180, "w": 600, "h": 280, "role": "accent" }
```

Use sparingly; one callout per diagram at most.

## Group containment

A `node` declares its membership:

```json
{ "id": "api", "type": "process", "label": "REST API",
  "group": "service-layer", "x": 60, "y": 250, "w": 220, "h": 100 }
```

The engine:

1. Records the membership in the selection metadata
   (`data-ve-data.groupId`).
2. Uses it for chain-highlight grouping (a future feature: when
   a chain is highlighted, the chain's groups also visually
   highlight).
3. Does NOT auto-place the node inside the group — you set the
   coordinates.

If you want auto-grouping (the engine arranges members inside
the group), use the upcoming `groupLayout` field (planned —
not yet shipped); for now, you place nodes manually inside
their groups.

## Nested groups

The engine does NOT support nested groups structurally — there
is no `group.parent` field. But you CAN draw visually-nested
groups by positioning one group inside another:

```json
{ "id": "outer", "label": "Production",
  "x": 0, "y": 0,    "w": 1200, "h": 800, "role": "accent" }
{ "id": "inner", "label": "Backend cluster",
  "x": 40, "y": 60, "w": 600, "h": 400, "role": "service" }
```

The outer group draws first (z-order is JSON order); the inner
group draws on top. The reader sees nesting.

## Selection atoms

Groups become selection atoms:

```html
<g data-ve-id="vc-scene-7-group-2"
   data-ve-type="diagram-group"
   data-ve-data='{"sceneId":7,"kind":"group","groupId":"service-layer","label":"Service layer","memberCount":3}'>
  <rect ... fill="..." stroke="..."/>
  <text>Service layer</text>
</g>
```

Clicking the group selects the layer as a whole. The
`memberCount` is computed at render time from nodes that
declared `group: "<this-id>"`.

## DESIGN.md tokens consumed

Same as nodes:

| Group | Tokens |
|---|---|
| color | role-tinted fill, role-tinted stroke (alpha-blended) |
| typography | `--vc-text-2`, `--vc-font-body`, `--vc-color-content-muted` for the label |
| radius | `--vc-radius-md` for corners |

## Anti-patterns

- A group with no member nodes: empty rectangle; either populate
  or delete.
- Overlapping groups (two groups with intersecting rectangles
  that aren't a deliberate nest): visually confusing; the reader
  can't tell which group is the "real" boundary.
- 8+ groups in one diagram: layer overload; consider whether
  half the groups are actually nested concerns that should be a
  second-level diagram.
- A group with a `role` that clashes with its members' roles
  (e.g. a "data" group containing "service" nodes): the tint
  conflict reads as inconsistent. Match group role to dominant
  member role.

## Optional: the group-handle UI

The engine's `_updateGroupHandle` (an internal helper) draws a
small drag handle on group hover — useful for a future "move
this group" interaction. The handle is hidden by default; an
agent can enable it via `data-ve-group-handle="1"` on the scene
wrapper when authoring an interactive editor.

For static reports the handle stays off; it adds nothing for the
reader and would clutter the diagram.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm groups are visible (the fill
shows through) but not dominant (the nodes are still the visual
focus). A common bug: at low contrast, the group fill is
invisible — bump up `--vc-color-*` alpha or pick a role with
stronger derivation.
