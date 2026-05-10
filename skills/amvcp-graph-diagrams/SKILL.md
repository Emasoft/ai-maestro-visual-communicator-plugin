---
name: amvcp-graph-diagrams
description: "Author Mermaid (flowchart, sequence, ER, state machine, mind map, class, C4) and Graphviz directed-graph (.ve-graph) HTML pages. Use when the user asks for an architecture diagram, flowchart, sequence diagram, ER diagram, state machine, mind map, class diagram, C4 diagram, data flow diagram, dependency graph, or any node-and-edge visualization. Trigger: 'flowchart', 'architecture', 'sequence diagram', 'ER', 'state machine', 'mind map', 'class diagram', 'C4', 'data flow', 'directed graph', 'Mermaid', '/amvcp-generate-web-diagram'."
license: MIT
compatibility: "Mermaid v11+ via CDN; Graphviz via vendored viz.js auto-loaded by amvcp-runtime.js when .ve-graph is present. Browser + Python 3.12+ via amvcp-select.py."
metadata:
  author: Emasoft
---

# Graph Diagrams

Mermaid (flowchart, sequence, ER, state, mind map, class, C4) and Graphviz directed graphs via `.ve-graph`.

## When this skill loads

Loads on any node/edge diagram request or triggers like *flowchart*, *architecture*, *sequence*, *ER*, *state machine*, *mind map*, *class diagram*, *C4*, *data flow*, *directed graph*, *Mermaid*, `/amvcp-generate-web-diagram`. Every node and edge becomes clickable — read `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` first for the selection contract.

## Quick decision: Mermaid vs Graphviz vs CSS

| Need | Use |
|------|-----|
| Flowchart, sequence, ER, state, mind map, class, C4 (≤10 nodes) | Mermaid |
| Directed graph: complex routing, math labels, many-to-many | Graphviz `.ve-graph` |
| Architecture with rich card content (descriptions, code refs) | CSS Grid cards |
| 15+ elements | Hybrid: Mermaid overview + CSS Grid detail cards |

## How to author

1. **Pick the engine** from the table; read `${CLAUDE_PLUGIN_ROOT}/references/diagram-types.md` for per-type rules (`stateDiagram-v2` label trap, C4-as-flowchart, scaling).
2. **Pick an aesthetic** from `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — vary per generation; commit to one.
3. **Mermaid:** load v11 CDN per `${CLAUDE_PLUGIN_ROOT}/references/libraries.md`; init with `securityLevel: 'loose'`; wrap in `.diagram-shell > .mermaid-wrap` for zoom (`${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md`).
4. **Graphviz:** drop DOT into `<div class="ve-graph">…</div>` — runtime lazy-loads viz.js; use the defaults block in `./references/graphviz-cookbook.md` (stock defaults render unreadable).
5. **Wire selection** (below).
6. **Open with the runner**, never `open`/`xdg-open`:
   ```bash
   python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html
   ```

## Mandatory wiring

**Mermaid** — Mermaid SVG is outside your DOM, so `data-ve-id` doesn't work. Use `click` per node:

```mermaid
click validate call veSelectMermaid("validate", "Validate input")
```

Full pattern + edges: `./references/mermaid-integration.md`.

**Graphviz** — DOT `id` starting `ve-` auto-becomes `[data-ve-id]`; bare names get auto-tagged from `<title>`. Edges get a 14 px hit area for free. Page CSS must size `.ve-graph svg { width:100%; height:auto }` — see `./references/graphviz-cookbook.md`.

## Resources

- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — selection wire format + boilerplate (read first)
- `${CLAUDE_PLUGIN_ROOT}/references/diagram-types.md` — per-type catalogue and rules
- `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — Mermaid theming + aesthetics
- `${CLAUDE_PLUGIN_ROOT}/references/libraries.md` — Mermaid v11 CDN + ELK layout
- `${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md` — `.mermaid-wrap` zoom + container chrome
- `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` — Slop Test
- `./references/mermaid-integration.md` — `click` directive, `veSelectMermaid()`, label encoding
- `./references/graphviz-cookbook.md` — DOT defaults, `.ve-graph` data-attrs, hover CSS, engines

## Anti-patterns

- `stateDiagram-v2` labels with parens, colons, or `<br/>` → silent parse failure. Use `flowchart TD` with quoted edge labels.
- `flowchart LR` with >5 nodes → labels collide. Switch to `TD`.
- Bare `<pre class="mermaid">` with no zoom controls → renders tiny. Always wrap in `.diagram-shell > .mermaid-wrap`.
- Defining `.node` as a page-level CSS class → collides with Mermaid's SVG `.node`.
- Cramming 15+ elements into one Mermaid diagram → unreadable. Use the hybrid pattern (Mermaid overview + CSS Grid cards).
- Graphviz `.ve-graph` with stock defaults → tiny faint graph. Always apply the defaults block.
- Single-backslash LaTeX in DOT (`$\sigma$`) → silent strip. Double them (`$\\sigma$`).
