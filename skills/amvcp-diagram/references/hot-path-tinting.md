# Hot-path tinting

## Table of Contents

- [When to choose this pattern](#when-to-choose-this-pattern)
- [Implementation](#implementation)
- [When to use "accent" vs "danger" vs "warning"](#when-to-use-accent-vs-danger-vs-warning)
- [Hot-path edges](#hot-path-edges)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection atom](#selection-atom)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

The visual technique for marking a "trust boundary", a "critical
path", or a "code-review hotspot" in any diagram. Lifted from
`04-code-understanding` in the html-effectiveness catalog. One
extra modifier class on one node draws the reader's eye where it
needs to be.

## When to choose this pattern

Use hot-path tinting when:

- You have an otherwise neutral diagram (a process flow, an
  architecture canvas, a state machine) and the reader needs to
  notice ONE specific element FIRST.
- The element is a SECURITY boundary (authentication, input
  validation, payment).
- The element is the WHY the diagram exists (the bug location,
  the change site, the optimization target).

Do NOT use this pattern when:

- Multiple elements are equally "hot" (the highlight loses
  power; rank them).
- The whole diagram is about one element (just label it as the
  title; no need to "highlight").
- The diagram is small (3-4 nodes); the eye already lands on
  every node.

## Implementation

Two paths:

### 1. The `role: "danger"` (or `accent`) node role

For nodes the engine already renders, set the role:

```json
{ "id": "auth", "type": "process", "label": "Authenticate",
  "role": "accent",
  "x": 460, "y": 200, "w": 200, "h": 80 }
```

The accent role tints the fill at 22% accent over surface and
the stroke at full accent. The node visibly stands out against
neutral siblings.

For a stronger "danger" highlight:

```json
{ "role": "danger" }   // requires the engine to ship a 'danger' role
```

Or, if not native, use a per-node `stroke` override:

```json
{ "id": "auth", "type": "process", "label": "Authenticate",
  "x": 460, "y": 200, "w": 200, "h": 80,
  "stroke": "var(--vc-color-danger)",
  "fill":   "color-mix(in oklch, var(--vc-color-danger) 14%, var(--vc-color-surface))" }
```

### 2. CSS modifier class

For finer control (or per-diagram theming), apply a class:

```html
<g data-ve-id="vc-node-auth" data-ve-type="diagram-node"
   class="ve-node--hot">
  ...
</g>
```

CSS:

```css
.ve-scene-graph g.ve-node--hot > rect,
.ve-scene-graph g.ve-node--hot > polygon,
.ve-scene-graph g.ve-node--hot > path {
  fill: color-mix(in oklch,
                  var(--vc-color-danger) 12%,
                  var(--vc-color-surface));
  stroke: var(--vc-color-danger);
  stroke-width: 2;
}
.ve-scene-graph g.ve-node--hot > text {
  font-weight: var(--vc-weight-bold);
}
```

The class can be applied via a post-render hook based on a
node's `data-ve-data.role === "hot"` (a convention you adopt
project-wide).

## When to use "accent" vs "danger" vs "warning"

- `accent` — "look here, this is important" (a critical step,
  the recommended path). Use the brand color; visually positive.
- `danger` — "look here, this is the risk" (a security boundary,
  a known bug). Red; visually negative.
- `warning` — "look here, this is fragile" (a flaky test, a
  known performance bottleneck). Yellow/amber.

The diagram should have AT MOST ONE hot-tinted node per diagram.
Two hot tints = the diagram has split focus; the reader's eye
ping-pongs.

## Hot-path edges

Tint an edge to mark the "hot data flow":

```json
{ "from": "client", "to": "auth",
  "stroke": "var(--vc-color-danger)",
  "style": "solid",
  "strokeWidth": 2.5,
  "label": "credentials" }
```

The thicker, danger-tinted edge reads as "this data is
sensitive" or "this is the path the bug travels". Pair with a
hot-tinted destination node for double-emphasis.

## DESIGN.md tokens consumed

| Token | Use |
|---|---|
| `--vc-color-accent` | the standard "look here" tint |
| `--vc-color-danger` | for security-sensitive hot tint |
| `--vc-color-warning` | for "fragile" tint |
| `--vc-color-on-accent` | text contrast on accent fills |
| `--vc-weight-bold` | bolder font for hot labels |

## Selection atom

A hot-tinted node is still a standard `diagram-node` atom. The
`role` (if used) is in `data-ve-data`:

```json
{ "kind": "node", "nodeId": "auth",
  "role": "accent",
  "label": "Authenticate",
  "hotMarker": "trust-boundary" }   // optional, agent-defined
```

The agent can read `hotMarker` from `data-ve-data` to open the
right action menu (a "view security audit" link instead of the
generic "open detail").

## Anti-patterns

- Multiple hot tints in one diagram: the brain can't decide
  where to look first. Pick ONE.
- Hot tint on every node of a long path (`role: "accent"` on 8
  nodes): the visual punch dies; the highlight becomes the new
  neutral.
- Hot tint that matches the diagram's normal accent (the whole
  diagram is brand-tinted, then one node is also brand-tinted):
  the highlight is invisible. Use a contrasting tint (`danger`
  instead of `accent`).
- Hot tint applied without explanation: the reader sees the
  visual emphasis but doesn't know WHY. Pair with a label
  ("Trust boundary") or a side-panel detail.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The hot node is visibly distinct from siblings at both
  themes.
- The danger tint is recognizably "warning-colored" without
  being so red it screams.
- The bold label is readable (not over-bolded).
