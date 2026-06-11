---
name: amvcp-generate-web-diagram
description: Generate a beautiful standalone HTML diagram and open it in the browser
---
Generate an HTML diagram for: $@

**FAST PATH (default — the user expects pixels in seconds, not minutes):** read
`${CLAUDE_PLUGIN_ROOT}/references/QUICKSTART-web-diagram.md` (ONE file) and start
from the matching ready-to-fill template — `templates/graphviz-diagram.html` for
any non-trivial directed graph (9+ nodes, loops, forks, clusters) or
`templates/mermaid-flowchart.html` for simple ≤10-node flowcharts. Transplant
content into the FILL slots instead of authoring boilerplate. If you must open
deeper references, batch ALL those reads into one parallel tool-call message.

Fall back to the full amvcp-visual-communication umbrella workflow only when the
request doesn't fit a template (novel composition, non-graph visual). Pick a
distinctive aesthetic that fits the content — vary fonts, palette, and layout
style from previous diagrams.

If `surf` CLI is available (`which surf`), consider generating an AI illustration via `surf gemini --generate-image` when an image would genuinely enhance the page — a hero banner, conceptual illustration, or educational diagram that Mermaid can't express. Match the image style to the page's palette. Embed as base64 data URI. See css-patterns.md "Generated Images" for container styles. Skip images when the topic is purely structural or data-driven.

Mark every meaningful element selectable with `data-ve-id` / `data-ve-type` / `data-ve-label`, embed `<script src="amvcp-runtime.js"></script>` at end of body, and add `click X call veSelectMermaid("X","Label")` directives plus `securityLevel: 'loose'` to any Mermaid diagrams. See `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` for the full wire-format pattern and `${CLAUDE_PLUGIN_ROOT}/skills/amvcp-graph-diagrams/references/mermaid-integration.md` for Mermaid `click` directives.

Write to `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`, open it via the interactive selection runner (`python3 $CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py $CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/<file>.html`), and respond to whatever the user clicks per the SKILL.md "Required follow-up after a selection" template.
