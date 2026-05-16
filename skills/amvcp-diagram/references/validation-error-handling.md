# Validation and error handling

The engine's fail-fast model: a malformed scene graph throws with
a precise message, and the catch path paints a RED error box into
the figure. Never a blank SVG, never a silent fallback. This is
deliberate — silent failures hide bugs, visible failures expose
them at author time.

## What validation catches

`validateScene(scene)` throws on every one of:

| Condition | Error message |
|---|---|
| `version` is not `1` | `bad version: expected 1, got <x>` |
| `nodes` is empty | `nodes is empty` |
| `width` or `height` <= 0 or non-numeric | `width must be a positive number` |
| A duplicate node id | `duplicate node id: <id>` |
| An unknown node `type` | `unknown node type: <type>` |
| An unknown `role` | `unknown role: <role>` |
| An unknown `route` | `unknown route: <route>` |
| An unknown `animate` | `unknown animate: <animate>` |
| An unknown `arrow` | `unknown arrow: <arrow>` |
| An unknown edge `style` | `unknown edge style: <style>` |
| An edge's `from` or `to` is not an existing node id | `dangling edge: <from> -> <to>` |
| A `free`-preset node missing `x` or `y` | `free preset requires explicit x/y on node <id>` |
| A group missing numeric `x`/`y`/`w`/`h` | `group <id> missing geometry` |

Every check is enumerated and named in the error message so the
author can grep the source. There is NO catch-all "scene is bad"
message.

## The red error box

When `renderSceneGraph` catches a validation error, it calls
`paintError(hostEl, message)`:

```js
function paintError(hostEl, message) {
  hostEl.innerHTML = '';
  var box = document.createElement('div');
  box.className = 've-scene-error';
  box.setAttribute('role', 'alert');
  box.setAttribute('title', message);
  box.innerHTML =
    '<strong>scene graph error</strong><br>' +
    '<span class="ve-scene-error__msg"></span>';
  box.querySelector('.ve-scene-error__msg').textContent = message;
  hostEl.appendChild(box);
}
```

The error box's CSS makes it impossible to miss:

```css
.ve-scene-error {
  padding: 16px 20px;
  background: color-mix(in oklch,
                        var(--vc-color-danger) 14%,
                        var(--vc-color-surface));
  border: 2px solid var(--vc-color-danger);
  color: var(--vc-color-danger);
  border-radius: var(--vc-radius-md);
  font: var(--vc-text-1) / 1.4 var(--vc-font-mono);
}
.ve-scene-error__msg {
  display: block;
  margin-top: 8px;
  color: var(--vc-color-content);
}
```

The error is also set as the box's `title` attribute, so hovering
shows the message as a native tooltip — useful when the page is
zoomed out and the text is small.

## Why fail-fast (not fallback)

A silent fallback (e.g. "if the scene is malformed, just don't
render") creates a class of bug that's invisible until production:
the diagram is missing, the author doesn't know why, the
deployment goes out with an empty space where the diagram should
be.

Fail-fast makes the bug visible IN THE PAGE. The author opens
the page, sees a red box with "duplicate node id: ingest", and
fixes it in 10 seconds.

The engine never silently swallows scene errors.

## Common errors and fixes

### `unknown node type: rectangle`

You used a type from another tool (Mermaid, Excalidraw,
draw.io). The engine ships exactly 7 types: `start`, `process`,
`decision`, `subprocess`, `end`, `external`, `card`. Map to the
closest:

- `rectangle` -> `process`
- `box` -> `process`
- `circle` -> `start` (if it's a start) or wrap in a `process`
- `diamond` -> `decision`
- `cylinder` -> `subprocess` (use `role: "data"` for a database)
- `cloud` -> `external`

### `duplicate node id: ingest`

Two nodes share `id: "ingest"`. The engine fails — ids must be
unique. Common cause: copy-paste a node block and forget to
rename. Quick fix: add a suffix (`ingest-1`, `ingest-2`).

### `dangling edge: foo -> bar`

The edge references a node id that doesn't exist. Common causes:

- Typo in `from` or `to`.
- A node was deleted but its edges weren't updated.
- Capitalization mismatch (`Foo` vs `foo` — ids are
  case-sensitive).

Grep the JSON for the bad id and fix or remove the edge.

### `free preset requires explicit x/y on node <id>`

A `free`-preset scene has a node without explicit coordinates.
Either:

- Add `x` and `y` to the node.
- Switch the scene's `preset` to one with auto-placement
  (`process-flow`, `architecture-canvas`, `phase-graph`).

### `bad version: expected 1, got 2`

The scene's `version` is not `1`. The engine has exactly one
supported version. If you authored against a future version,
update the engine; otherwise correct the JSON.

### `unknown role: brand`

`role` must be one of: `client`, `service`, `data`, `infra`,
`external`, `accent`. The engine deliberately limits the role
vocabulary to keep visual consistency. Custom colors should be
expressed via DESIGN.md theme overrides, not via new role names.

## Per-engine error reporting

When multiple scenes on one page, each error is scoped to its
host:

```html
<div class="ve-scene-graph" id="scene-A">...</div>   <!-- bad -->
<div class="ve-scene-graph" id="scene-B">...</div>   <!-- good -->
```

The bad scene shows a red error box; the good scene renders
normally. One bad scene does NOT block the page or break sibling
scenes.

## Console logging

In addition to the visible error box, the engine logs to
`console.error`:

```js
console.error('[ve-scene-graph] ' + message, hostEl);
```

The console message includes the host element so the author can
quickly locate which scene failed. Useful when there are many
scenes on a page.

## DESIGN.md tokens consumed (by the error box)

| Group | Tokens |
|---|---|
| color | `--vc-color-danger`, `--vc-color-surface`, `--vc-color-content` |
| typography | `--vc-font-mono` for the error text |
| radius | `--vc-radius-md` |

The error box is themed too — it works under any DESIGN.md.

## Selection atoms

An error box does NOT participate in the selection model — it's
not a normal scene element. It carries `role="alert"` for
accessibility but no `data-ve-id`.

## Test pattern

The test harness exposes `validateScene(scene)` directly so a
test file can assert each error path:

```js
test('throws on dangling edge', function () {
  expect(function () {
    validateScene({
      version: 1, width: 100, height: 100,
      nodes: [{ id: 'a', type: 'process', label: 'A' }],
      edges: [{ from: 'a', to: 'ghost' }]
    });
  }).toThrow(/dangling edge: a -> ghost/);
});
```

Every documented error path has at least one test.

## Anti-patterns

- Wrapping a scene JSON in a `try { JSON.parse(s) } catch { ...
  }` and silently rendering a default scene: hides every bug.
  Let the engine throw; let the red box show.
- Catching the engine's error and turning it into a generic
  "diagram unavailable": loses the precise reason. Show the red
  box.
- Showing the error box but ALSO rendering a partial diagram:
  confusing. Either render or error; never both.
- Removing the `title` attribute from the error box: loses the
  hover-tooltip readability path.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot at light + dark of a DELIBERATELY broken scene
(insert a typo in a node type). Verify:

- The red box appears AT the scene's location.
- The error text is readable at both themes.
- The error message is visible in the box (not just the title).
- Sibling scenes render normally (one bad scene doesn't kill
  others).
