# Group collapse handles

A small UI affordance — a drag-handle / chevron on a group
rectangle — that lets the reader collapse a group to a single-
line summary or expand it back to its full member view. Useful
for large diagrams where the reader wants to focus on one layer
at a time.

## When to choose this pattern

Use collapse handles when:

- The diagram has **multiple groups (3+)** and the reader will
  often want to see only ONE at a time.
- Each group has **multiple member nodes** that the reader can
  ignore when focused elsewhere.
- The diagram is **interactive** (a docs page, a review tool)
  rather than a fixed snapshot.

Do NOT use collapse handles when:

- The diagram is a **static report** (collapse state doesn't
  persist; reader can't "save" their view).
- The diagram has only 1-2 groups (no win from collapsing).
- The collapsed view loses important context (some members are
  visually essential).

## Implementation

The engine's `_updateGroupHandle` and `_wireGroupHandle` internal
helpers draw the handle. They are NOT enabled by default —
collapse breaks selection workflows and adds DOM complexity. Opt
in via `data-ve-group-handle="1"` on the scene wrapper:

```html
<div class="ve-scene-graph"
     data-ve-scene-preset="architecture-canvas"
     data-ve-group-handle="1">
  ...
</div>
```

Each group then renders with a small chevron in the top-right
corner. Clicking the chevron toggles the group's collapsed
state.

## Collapsed-state geometry

When a group is collapsed:

1. Member nodes are hidden (`display: none`).
2. The group rect shrinks vertically to the label + a summary
   line.
3. The summary shows the group's `label` and the member count:
   `"Service Layer (3 members)"`.
4. Cross-group edges that ENDED at a member of the collapsed
   group are re-routed to the GROUP itself (the group becomes
   the visual anchor for incoming/outgoing edges).
5. The collapsed group's chevron flips (downward) to indicate
   "click to expand".

## Expanded state

When expanded, the group restores to its original geometry and
members re-appear. Cross-group edges restore to their original
member endpoints.

## CSS for the handle

```css
.ve-scene-graph .ve-group-handle {
  cursor: pointer;
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-0);
  fill: var(--vc-color-content-muted);
  transition: transform 200ms ease-out;
}
.ve-scene-graph .ve-group-handle:hover {
  fill: var(--vc-color-content);
}
.ve-scene-graph [data-ve-collapsed="1"] .ve-group-handle {
  transform: rotate(180deg);
}
.ve-scene-graph [data-ve-collapsed="1"] .ve-group-member {
  display: none;
}
.ve-scene-graph .ve-group-summary {
  font-family: var(--vc-font-body);
  font-size: var(--vc-text-1);
  fill: var(--vc-color-content-muted);
  font-style: italic;
}
.ve-scene-graph [data-ve-collapsed="0"] .ve-group-summary {
  display: none;
}
```

The handle's transform on collapsed is a 180-degree flip — chevron
points down for "expand", up for "collapse".

## JS wiring

```js
function wireGroupHandle(scene, hostEl) {
  Array.from(hostEl.querySelectorAll('g[data-ve-type="diagram-group"]'))
    .forEach(function (g) {
      var handle = g.querySelector('.ve-group-handle');
      if (!handle) { return; }
      handle.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var collapsed = g.getAttribute('data-ve-collapsed') === '1';
        g.setAttribute('data-ve-collapsed', collapsed ? '0' : '1');
        relayoutEdgesForGroup(scene, hostEl, g.dataset.veData.groupId);
      });
    });
}
```

The `relayoutEdgesForGroup` function walks edges whose source or
target was a member of the collapsed group and re-points them at
the group itself. On expand, restore.

## Persistence

For a multi-session use case (a docs page the reader returns to),
persist the collapsed state in localStorage keyed by the page
URL + group id:

```js
function saveCollapsedState(sceneId, groupId, collapsed) {
  var key = 've-scene-' + sceneId + '-group-' + groupId;
  localStorage.setItem(key, collapsed ? '1' : '0');
}
function loadCollapsedState(sceneId, groupId) {
  var key = 've-scene-' + sceneId + '-group-' + groupId;
  return localStorage.getItem(key) === '1';
}
```

On scene init, restore collapsed states from localStorage.

## Accessibility

The handle should be keyboard-focusable and operable:

```html
<text class="ve-group-handle"
      role="button"
      aria-label="Collapse service layer"
      tabindex="0">▼</text>
```

Bind both `click` and `keydown` (Enter/Space) to toggle.

Add an aria-live announcement on toggle:

```js
document.querySelector('[data-ve-chain-announcer]').textContent =
  'Service layer ' + (collapsed ? 'collapsed' : 'expanded');
```

A screen-reader user knows the toggle worked.

## DESIGN.md tokens consumed

| Token | Use |
|---|---|
| `--vc-color-content-muted` | handle default color |
| `--vc-color-content` | handle hover color |
| `--vc-font-mono` | handle glyph (chevron) |
| `--vc-text-0` | handle size |

## Selection atom

The handle is NOT a selection atom — clicks on it toggle
collapse but don't fire a `data-ve-id` selection POST. The
group itself remains a selection atom; clicking the group's
fill (away from the handle) still selects.

## Variations

### Collapse-on-double-click

Some authors prefer no visible handle — the group collapses on
double-click anywhere in the group's title bar:

```js
groupLabel.addEventListener('dblclick', function () {
  toggleCollapse(group);
});
```

Less discoverable; better for diagrams where the handle would
clutter.

### Collapse-to-row

When collapsed, the group's MEMBERS render as a single
horizontal row of dots or thin pills (a "minimap" of the
collapsed content) instead of disappearing entirely:

```
Service Layer  ● ● ● ● ●   ← five dots = five members
```

Conveys that members exist without taking the space.

### Expand-on-hover (transient expand)

Hovering a collapsed group temporarily expands it; mouse-leave
re-collapses. Useful for browsing many groups quickly.

Wiring:

```js
group.addEventListener('mouseenter', function () {
  group.setAttribute('data-ve-collapsed', '0');
});
group.addEventListener('mouseleave', function () {
  if (group.dataset.savedCollapsed === '1') {
    group.setAttribute('data-ve-collapsed', '1');
  }
});
```

## Anti-patterns

- Collapsing without persistence: reader collapses, refreshes,
  reader has to collapse again. Persist or skip.
- Collapsing without re-routing cross-group edges: edges point
  at nothing (the destination node is hidden).
- Collapse-on-single-click of the entire group: conflicts with
  the standard selection model.
- No accessibility announcement: invisible to screen readers.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark, then TOGGLE a group and capture again.
Verify:

- The handle visibly flips on toggle.
- Members hide/show correctly.
- Cross-group edges re-route correctly (point at the group, not
  at a now-invisible member).
- localStorage persistence works (refresh and confirm state
  restores).
