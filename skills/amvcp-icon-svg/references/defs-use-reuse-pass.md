# The `<defs><use>` reuse pass

The icon-svg compiler runs a SECOND PASS over the scene's primitives
before emitting any markup. If a node `type` + `size` + `variant` +
`label` appears MORE THAN TWICE in the scene, the compiler hoists
the shape into a `<defs>` once and emits a `<use>` reference at each
occurrence. The result: a scene with 12 identical "Step A" processes
ships ONE `<rect>+<text>` markup + 12 small `<use>` tags, instead of
12 full inline replicas.

## When the pass fires

The reuse pass fires when ALL of these are true:

1. The primitive is a node `type` (one of `process`, `database`,
   `decision`, `external`, `network`). Logo and shape primitives are
   never reused.
2. The geometry KEY is `type | snap(w) | snap(h) | variant | label`.
3. That key has count > 2 in the scene.

The key SKIPS `x` / `y` — those are what `<use>` varies by reference.
Two scenes with the same shape at different positions share the
defs entry; two scenes with different `label`s do not (because the
text content of the label is baked into the defs shape).

## The output structure

When the pass fires for a key:

```html
<svg ...>
  <defs>
    <g id="isvg-def-0">
      <!-- the shape geometry, authored at (0, 0) — origin-relative -->
      <rect x="0" y="0" width="..." height="..." rx="16"
            fill="none" stroke="..." stroke-width="2"/>
      <text x="..." y="..." ...>Step A</text>
    </g>
  </defs>

  <!-- Every occurrence is a <use> at the snapped x/y. -->
  <g data-ve-id="step-a" data-ve-type="icon-node"
     data-ve-comment-id="icon-node:step-a"
     data-ve-label="Step A">
    <use href="#isvg-def-0" x="252" y="60"/>
  </g>
  <g data-ve-id="step-b" data-ve-type="icon-node"
     data-ve-comment-id="icon-node:step-b"
     data-ve-label="Step A">
    <use href="#isvg-def-0" x="252" y="400"/>
  </g>
  <g data-ve-id="step-c" data-ve-type="icon-node"
     data-ve-comment-id="icon-node:step-c"
     data-ve-label="Step A">
    <use href="#isvg-def-0" x="252" y="740"/>
  </g>
</svg>
```

Each occurrence is STILL its own `<g data-ve-id>` selection atom —
the reuse is purely a markup-size optimization, NOT an atom merge.
Three identical "Step A" nodes are three separate selection atoms
with three distinct `data-ve-id`s.

## Why the threshold is N > 2

The break-even point for `<defs><use>` markup is around 2-3
occurrences:

- 1 occurrence: inline = ~150 bytes, defs+use = ~200 bytes (defs
  overhead > savings).
- 2 occurrences: inline = ~300 bytes, defs+use = ~250 bytes
  (marginal win).
- 3 occurrences: inline = ~450 bytes, defs+use = ~300 bytes (clear
  win).
- 10 occurrences: inline = ~1500 bytes, defs+use = ~600 bytes (3x
  reduction).

The compiler uses N > 2 (i.e. 3+) as the threshold — the
break-even-plus-margin point where reuse is definitively cheaper.

## When the pass does NOT fire

- Single occurrence — no reuse.
- 2 occurrences — no reuse (break-even, but inline keeps the markup
  simpler for diff readability).
- Different variants (`{type: 'process', variant: 'default'}` vs
  `{type: 'process', variant: 'success'}`) — different keys, no
  reuse.
- Different labels — different keys, no reuse.
- Different geometry — different keys, no reuse.
- Logo or shape primitives — never reused (those have non-trivial
  per-instance variation like `id`-dependent mask ids; reuse would
  break them).

## What the geometry key collapses

```js
function geomKey(p) {
  return p.type + '|' + snap(p.w) + '|' + snap(p.h) + '|'
    + (p.variant || 'default') + '|' + (p.label || '');
}
```

- Snapped `w` / `h` so two nodes that DIFFER ONLY in pre-snap
  precision (e.g. `w=123` vs `w=124` both snap to `124`) share the
  key.
- `variant || 'default'` so missing variant is normalized to the
  default string.
- `label || ''` so missing label is normalized to empty string.
- `x` / `y` are excluded — those are what `<use>` carries.

## A worked example

Authoring 3 identical `process` nodes:

```html
<script type="application/icon-svg+json" id="reuse-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Three identical processes",
  "primitives": [
    { "type": "process", "id": "a", "x": 250, "y":  60,
      "w": 500, "h": 200, "label": "Step A" },
    { "type": "process", "id": "b", "x": 250, "y": 400,
      "w": 500, "h": 200, "label": "Step A" },
    { "type": "process", "id": "c", "x": 250, "y": 740,
      "w": 500, "h": 200, "label": "Step A" }
  ]
}
</script>
```

The 3 primitives share the geomKey `process|500|200|default|Step A`,
count 3 → reuse fires. Output:

```html
<svg ...>
  <defs>
    <g id="isvg-def-0">
      <rect x="0" y="0" width="500" height="200" rx="16" ry="16"
            fill="none" stroke="var(--vc-color-content)"
            stroke-width="2"/>
      <text x="250" y="100" ...>Step A</text>
    </g>
  </defs>
  <g data-ve-id="a" ...><use href="#isvg-def-0" x="252" y="60"/></g>
  <g data-ve-id="b" ...><use href="#isvg-def-0" x="252" y="400"/></g>
  <g data-ve-id="c" ...><use href="#isvg-def-0" x="252" y="740"/></g>
</svg>
```

Each `<g>` is still its own selection atom; the `<use>` is the
geometry only.

## When NOT to expect reuse

The reuse pass is OPTIMIZATION ONLY — the output's visual
appearance, lint result, and selection behavior are IDENTICAL whether
or not the pass fires. So:

- If a scene has 2 identical nodes — they're inlined; same visual.
- If a scene has 3 nodes with 2-shared-1-different — only the 2
  matching ones go through... no wait, the count is < 3, so NONE go
  through. Reuse fires only when the SHARED key has count > 2, not
  when any pair matches.

## Selection / comment / decision-mini behavior

Each `<use>` is still wrapped in its own `<g data-ve-id>`, so all
the selection scaffolding works exactly as if the shape were inlined
— the `data-ve-id`, `data-ve-comment-id`, `data-ve-label`, and the
decision-mini-pill are per-instance, not shared.

## What NOT to do

- Do NOT manually try to author your own `<defs><use>` markup — the
  compiler does it; double-application produces invalid SVG with
  duplicate ids.
- Do NOT rely on a specific symbol id (`isvg-def-0`) — it's
  assigned in occurrence order; changing the scene's primitive
  count changes the assignments.
- Do NOT expect reuse for 2-occurrence cases — the threshold is N >
  2.

## Visual verification

The compiled SVG should render IDENTICALLY whether reuse fired or
not. To check reuse fired, inspect the DOM: look for `<defs><g
id="isvg-def-N">` followed by N+ `<use href="#isvg-def-N">`. To
diff scene-byte-size, compile a 6-identical-process scene with and
without the pass — the optimization should produce ~50% smaller
markup.

This optimization runs invisibly; no author action needed. The
compiler always decides.
