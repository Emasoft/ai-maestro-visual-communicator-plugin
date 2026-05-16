# Selection atoms — data-ve-id contract

Every primitive icon-svg emits is automatically wrapped in a
`<g data-ve-id="...">` selection atom. The runtime's
`amvcp-runtime.js` listens for clicks on `[data-ve-id]` elements,
toggles a CSS `data-ve-selected="true"` attribute, fires a click event
to the agent, and integrates with the per-atom comment thread + the
decision-mini-pill helper. The icon-svg compiler does NOT add the
click handler; it just provides the hook attributes the runtime
already binds to.

## The 4 data-ve-* attributes

Every wrapping `<g>` carries:

| Attribute | Value | Meaning |
|---|---|---|
| `data-ve-id` | the primitive's `id` | unique selection key |
| `data-ve-type` | `"icon-node"` | kind hint for the runtime's payload |
| `data-ve-comment-id` | `"icon-node:<id>"` | scope key for the keyboard comment fallback |
| `data-ve-label` | the primitive's `label` (or `kind` for shape / logo) | friendly name in the click payload |

The scene's outer `<svg>` carries the SAME shape:

| Attribute | Value |
|---|---|
| `data-ve-id` | the scene's `id` (or `isvg-scene-N` if absent) |
| `data-ve-type` | `"icon-svg"` |
| `data-ve-comment-id` | `"icon-svg:<scene id>"` |
| `data-ve-label` | the scene's `ariaLabel` |

Plus a `tabindex="0"` and `role="img"` so the scene is keyboard-
focusable and screen-reader-readable.

## The selection scaffold per primitive

```html
<g data-ve-id="ingest"
   data-ve-type="icon-node"
   data-ve-comment-id="icon-node:ingest"
   data-ve-label="Ingest">
  <rect ... />
  <text ... >Ingest</text>
</g>
```

Logo primitives use the same pattern with the `kind` as label:

```html
<g data-ve-id="lg-mask"
   data-ve-type="icon-node"
   data-ve-comment-id="icon-node:lg-mask"
   data-ve-label="mask-cutout">
  <defs><mask ...></mask></defs>
  <rect ... mask="url(#isvg-mask-lg-mask)" />
</g>
```

## The id uniqueness contract

Every primitive's `id` MUST be unique within the scene. The compiler
maintains a `seenIds` map and throws on the second occurrence:

```js
{ "viewBox": [0,0,1000,1000],
  "primitives": [
    { "type": "process", "id": "step", "x": ..., "y": ..., "w": ..., "h": ... },
    { "type": "process", "id": "step", "x": ..., "y": ..., "w": ..., "h": ... }  // throws
  ]
}
```

Error: `"icon-svg: duplicate primitive id 'step' — every id must be
unique (it becomes a data-ve-id)."`

If an `id` is omitted, the compiler auto-generates `isvg-N` where N
is the primitive's index. Auto-generated ids are STABLE (deterministic)
within a single compile but NOT stable across edits (inserting a new
primitive shifts every subsequent index). For STABLE auto-ids, always
author your own `id` field.

## The scene `id` synthesis

When the scene's `id` is omitted, the compiler synthesizes one from
`_sceneCounter` (a module-level monotonic). This guarantees a STABLE
opaque id even when neither `id` nor a slugifiable ariaLabel is
authored. The result: two unidentified scenes on the same page never
collide on the same `data-ve-id`.

```js
// First unnamed scene → data-ve-id="isvg-scene-1"
// Second unnamed scene → data-ve-id="isvg-scene-2"
```

For ROBUST integration, always author an explicit `scene.id` —
auto-generated ids change as you add/remove scenes.

## Runtime integration — what the runtime does on click

`amvcp-runtime.js` `toggleElementSelection(target)`:

1. Finds the nearest `[data-ve-id]` ancestor of the click target.
2. Toggles the `data-ve-selected="true"` attribute on that element.
3. Adds the element to / removes from the `veSelection` Set.
4. Fires a POST to the agent with `{type: "selection-toggle", id,
   kind: data-ve-type, label: data-ve-label, ...}`.
5. Re-paints the selection border via CSS
   (`[data-ve-selected="true"]:not(.ve-selection-suppress)`).

Hover state:

```css
svg g[data-ve-id]:hover > rect,
svg g[data-ve-id]:hover > polygon,
svg g[data-ve-id]:hover > path {
  stroke: var(--vc-color-accent);
  stroke-width: 4;
}
```

(The exact CSS lives in `amvcp-runtime.js`'s injected
`runtime-styles.css`.)

## Hotspots are also selection atoms

`.isvg-hotspot` elements carry `data-ve-id`, so the same selection
contract applies. The hotspot's `role="button"` + `tabindex="0"`
makes it keyboard-focusable; the runtime treats it as a
non-interactive selection atom because it's a `<span>` not a
`<button>` (the runtime's isInteractiveControl check bails on
`<button>` targets but accepts `<span role="button">`).

## The keyboard comment fallback (Ctrl-+)

The runtime exposes a Ctrl-+ shortcut that opens a comment thread on
the FOCUSED atom. The thread is scoped by `data-ve-comment-id`:

- A comment on the scene scope = `"icon-svg:my-scene"` → applies to
  the whole scene-figure.
- A comment on a primitive scope = `"icon-node:my-node"` → applies
  to that specific primitive.
- A comment on a hotspot scope = `"hotspot:my-hotspot"` → applies to
  that specific hotspot.

The scope key is what makes multiple comment threads per scene-
figure possible. Without the per-atom comment-id, every Ctrl-+ would
open the same thread.

## How to disable selection on an atom

You can't (and shouldn't). If you don't want an atom to be
selectable, don't wrap it in a `data-ve-id` `<g>` — but the compiler
adds the wrapping automatically. The intended way to make a
non-selectable visual is to author it as RAW HTML+SVG, NOT through
the scene-graph compiler.

For a NON-selectable hotspot (a pure visual marker with no click /
comment intent), use a plain `<span>` without `data-ve-id`:

```html
<span style="position: absolute;
             left: calc(0.30 * 100%); top: calc(0.30 * 100%);
             transform: translate(-50%, -50%);
             inline-size: 12px; block-size: 12px;
             background: var(--vc-color-accent);
             border-radius: 50%;">
</span>
```

(But this is OUTSIDE the icon-svg API; you're just hand-authoring CSS.)

## Visual verification

Check in dev-browser that:

1. Every `<g>` in the compiled SVG has `data-ve-id`.
2. Clicking an atom toggles `data-ve-selected="true"`.
3. The selection border CSS rule is applied (hover + selected
   border becomes accent-colored).
4. The runtime's `veSelection` Set contains the atom's id after
   click.
5. Keyboard Ctrl-+ on a focused atom opens a comment thread scoped
   to the atom's `data-ve-comment-id`.

See `skills/amvcp-self-debug-rules/SKILL.md` R4 (selection atom
verification) for the full check list.
