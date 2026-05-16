# Graph-node color map — pipeline / DAG semantic colors (DT-16)

A 6-role categorical color map for diagrams, DAGs, pipeline graphs,
data-flow graphs: `source`, `filter`, `transform`, `aggregate`,
`final`, `target`. Authored in the design-tokens skill, CONSUMED by
the diagram skill — the contract between them is that diagram sets
`data-vc-role` on scene-graph nodes; design-tokens defines the colors.

## What it does

`amvcpTokens.ROLE_MAPS['graph-node']` declares:

```js
'graph-node': {
  attr: 'data-vc-role',
  categorical: true,
  base: 'accent',
  cssVarPrefix: '--vc-node-',
  order: [
    'source', 'filter', 'transform',
    'aggregate', 'final', 'target'
  ]
}
```

`renderRoleMapCss('graph-node', seedAccentHex)` emits:

```css
:root {
  --vc-node-source:    <hue0>;
  --vc-node-filter:    <hue1>;
  --vc-node-transform: <hue2>;
  --vc-node-aggregate: <hue3>;
  --vc-node-final:     <hue4>;
  --vc-node-target:    <hue5>;
}

[data-vc-role="source"] { /* derives from var(--vc-node-source) */ }
/* … 5 more … */
```

The 6 hues are golden-angle-rotated off the seed accent (see
`references/golden-angle-categorical.md`).

## When to use which role

| Role | Use |
|---|---|
| `source` | the origin of data — DB tables, API endpoints, message queues, sensor feeds |
| `filter` | predicates, `WHERE` clauses, gates that DROP rows / events without transforming |
| `transform` | maps, projections, parsers — same data shape, different content |
| `aggregate` | reductions, sums, group-by, joins — many rows in, fewer rows out |
| `final` | terminal computations — the value the pipeline produces |
| `target` | the sink — DB writes, API calls, file emits, downstream queues |

This vocabulary mirrors the ETL / dataflow taxonomy used in tools like
Beam, Flink, dbt, Dagster — the agent emitting a pipeline diagram
maps each box onto the closest role.

## When NOT to use

This map is for PIPELINES (linear / DAG flows). It's NOT for:

- general graph diagrams (use the badge map for severity, or just
  semantic state for outcome colors);
- entity-relationship diagrams (those need their own categorical map —
  consider `generateCategoricalHues(accent, N)` directly);
- decision trees / state machines (use a different vocabulary that
  matches "decision / state / terminal").

## Scaffold to emit

```html
<script>
  var accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--vc-color-accent').trim();
  document.head.insertAdjacentHTML('beforeend',
    amvcpTokens.renderRoleMapCss('graph-node', accent));
</script>

<svg viewBox="0 0 800 200">
  <rect data-vc-role="source"    x="20"  y="80" width="120" height="40" />
  <rect data-vc-role="filter"    x="170" y="80" width="120" height="40" />
  <rect data-vc-role="transform" x="320" y="80" width="120" height="40" />
  <rect data-vc-role="aggregate" x="470" y="80" width="120" height="40" />
  <rect data-vc-role="target"    x="620" y="80" width="120" height="40" />
  <!-- (arrows between them omitted for brevity) -->
</svg>
```

The diagram skill's renderer is responsible for laying out the boxes
and arrows; it sets `data-vc-role` on each node based on the
pipeline's semantic structure. The role-map CSS does the rest.

## Lib functions used

- `amvcpTokens.renderRoleMapCss('graph-node', seedAccentHex)` →
  `<style>` text block
- `amvcpTokens.generateCategoricalHues(seedAccentHex, 6)` — the raw
  hue array if you want to use the colors directly in JS (e.g.
  passing into a chart library's series array)

## DESIGN.md tokens used

- reads (typical): `colors.<theme>.accent`
- reads (via the bg/border mix): `--vc-color-surface`
- emits: `--vc-node-source` … `--vc-node-target` (six variables) +
  the `[data-vc-role="…"]` selectors

## Anti-slop interaction

The role-map output never includes a literal banned hex (the seed has
been linted; the rotation moves successive hues out of the banned
radius). No `linear-gradient(…)` is emitted — every node is a flat
fill + a soft tint mix against `--vc-color-surface`.

## Selection / comment / decision-mini contract

Graph nodes inside an SVG don't participate in HTML text selection,
but they DO participate in the diagram skill's own click-to-detail
and comment-thread affordances. When a node is selected (the diagram
skill's `selected-node` state), an outer ring derived from the node's
own color paints around it:

```css
[data-vc-role][data-vc-selected="1"] {
  outline: 2px solid var(--vc-role-color);
  outline-offset: 2px;
}
```

This rule is OWNED by the diagram skill, but it READS the
`--vc-role-color` set by this skill — exactly the contract: tokens
owned here, presentation owned there.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — render a 6-node
horizontal pipeline under `dev-browser`. Screenshot in **both
themes** (R1) and verify:

1. all 6 nodes use VISUALLY DISTINCT colors (no two adjacent reads as
   the same color);
2. the colors theme correctly — `--vc-node-source` resolves to a
   DIFFERENT hex when the page swaps from a heritage accent to a
   factory-dark accent (because re-running `renderRoleMapCss` with
   the new seed produces a new ramp);
3. selection / hover state on a node uses the node's OWN color (not
   the page accent) — the outline reads as `--vc-role-color`, which
   is `var(--vc-node-source)`, which themed correctly.
