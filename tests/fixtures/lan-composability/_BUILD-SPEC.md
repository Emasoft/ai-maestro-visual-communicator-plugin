# Build spec — PERMANENT composability test: LAN network map (3 skills on one page)

## Goal

A permanent regression test proving the plugin can **compose three visual-element skills
on ONE page**, driven by three simulated source docs. This is the scenario: "show me a
graph of the LAN / network map, each component with its own distinguishable icon + LAN
address, and a traffic-by-team pie under each component."

Three skills combined:
1. **graph / connections** — the LAN topology (nodes + edges).
2. **icon-svg** (`scripts/amvcp-icon-svg.js`, `window.amvcpIconSvg`) — a distinct authored
   SVG glyph per component type.
3. **chart** (`scripts/amvcp-chart.js`, `window.amvcpChart`) — a traffic-by-team chart
   under each component.

## Inputs (read these — they are the scenario data)

- `tests/fixtures/lan-composability/source-1-network-topology.md` — the edges (adjacency).
- `tests/fixtures/lan-composability/source-2-component-inventory.md` — 24 nodes: id, type,
  label, LAN address (19 distinct types → 19 distinct icons).
- `tests/fixtures/lan-composability/source-3-traffic-by-team.md` — per-node % across 5
  teams (Platform·DataSci·Web·Design·Ops), each row sums to 100.

## Composition design — LAYER on the existing graph element. DO NOT OVERCOMPLICATE.

HTML + SVG are the basic ingredients. We already have a beautiful **graph visualizer**
element — START FROM IT. Three layers, in order:

1. **Scaffold the existing graph element** — emit the LAN topology as the plugin's graph /
   scene-graph (`scripts/amvcp-diagram.js`, the `ve-scene-graph` JSON with `nodes` +
   `edges` from source-1). This gives the node+edge layout, node POSITIONS, and selection
   atoms for free. Do NOT hand-roll edges, a card grid, or a custom layout — reuse the
   graph element exactly as the base.
2. **Add the SVG icon ON TOP of each node** — each component's distinct inline SVG glyph,
   positioned over its graph node (keyed by node id / the node's rendered position).
3. **Add the donut chart RIGHT BELOW each node** — the traffic-by-team donut, placed just
   under the node.

Plus the node's **LAN address** label (mono) near each node.

The `ups01 -> core-sw01 : power` edge stays visually distinct (dashed / amber) — but that's
the GRAPH element's job (edge `role`/type), not a hand-drawn line. Team colors consistent
across ALL donuts (a color = the same team everywhere).

### Mechanism (keep it simple)
The graph element renders each node at a position with a `data-ve-id`. Use those node
positions to place, per node: the icon SVG on top, the donut just below (an overlay layer
positioned to the nodes, OR per-node decoration if the scene-graph schema supports it —
read `amvcp-diagram.js` and pick the SIMPLEST path that reuses the graph). No custom graph
engine, no from-scratch edge math.

### PIE → DONUT (non-negotiable)
`amvcp-chart` enforces a no-pie guardrail (`pie` auto-remaps to donut — anti-slop). Use
**donut**. The plugin doing its best-in-class job; do not force a pie.

### Icons = simple inline SVG (the basic ingredient — don't overcomplicate)
One distinct, simple, **recognizable** inline SVG glyph per type (gateway, firewall,
switch, ups, load-balancer, web-server, app-server, db-server, elasticsearch, auth-server,
nas, backup, fast-storage, media-server, render-station, relay, workstation, terminal,
print-server, printer, wifi-ap). Simple primitives, themed `--vc-*`, distinct per type,
legible light + dark. Do NOT build elaborate authored scene-graphs — these are little
glyphs sitting on the graph nodes.

## The two modes (from project CLAUDE.md — obey)

- **Interaction Design Mode = FIXED, reuse the runtime.** Every card, icon, donut, and
  edge is a `data-ve-id` + `data-ve-type` atom. selection·highlight·triple-feedback·
  comment come from the runtime (`bootEverything`/scan → `initAllCharts`, icon atoms,
  etc.). Do NOT hand-roll selection/hover/comment. "Edit a node" = select it + comment to
  Claude. Do NOT invent a foreign interaction.
- **Graphic Style Mode = VARIABLE via DESIGN.md.** All color/type/spacing from `--vc-*`.
  Light + dark BOTH. No nested scrollbars — the page expands (single LAN screen, but if
  wide, the document scrolls, never an inner box).

## Files to create

- `tests/fixtures/lan-composability/lan-network-map.html` — the composed page. Loads the
  runtime + `amvcp-icon-svg.js` + `amvcp-chart.js` (copy them next to the fixture the way
  the other fixtures do — check `tests/run-all-tests.py` for the sync pattern), emits the
  24 component-cards + edges + donuts, then lets the runtime scan/init everything.
- `tests/scripts/test-composability-lan.js` — the permanent test (mirror an existing
  dev-browser test e.g. `tests/scripts/test-diagram.js` for harness shape). Wire it into
  `tests/run-all-tests.py` exactly like the other tests.

## Test assertions (the permanent contract)

1. All **24 component cards** render; each carries its LAN address from source-2.
2. All **19 distinct icon types** present and visually distinct (assert distinct path
   geometry / non-identical markup per type).
3. All **24 donuts** render, each with **5 segments**, team colors consistent across pies.
4. **All topology edges** from source-1 are drawn; the `power` edge is visually distinct.
5. Every card/icon/donut/edge has `data-ve-id` + `data-ve-type` (fixed interaction works
   across all 3 skills — the composability proof).
6. **Zero JS console errors** when the 3 modules' init runs together (no namespace clash).
7. **No nested scrollbars** (no inner `overflow:auto` box; page expands).
8. **Light AND dark** both theme correctly — screenshot both to
   `$MAIN_ROOT/reports/screenshots/`.
9. **Zero leaked Chromium renderers** (close every page in `finally`).

## Acceptance

- `node --check` clean on any JS authored.
- Run ONLY this new test headless and it passes; then it must also pass inside the full
  `tests/run-all-tests.py` run (do NOT run the full suite yourself — orchestrator will).
- The composed page genuinely combines all 3 skills (not 3 separate sections — the donut
  sits under each component's icon, edges connect them).
