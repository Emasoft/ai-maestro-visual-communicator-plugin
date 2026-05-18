---
name: amvcp-show
description: "Smart router for the AI Maestro Visual Communicator plugin. Takes ANY input (file path, URL, plain text, or `(skill, args)` two-token form) and intelligently dispatches it to the correct sub-skill or command. Always opens the result in an iTerm split-pane when iTerm is detected (never spawns Safari/Chromium). Always preserves source content verbatim for markdown reports (routes them to `/amvcp-interactive-report`, which adds per-finding 3-state accept/reject/comment + textarea controls without removing or reinterpreting a single word). Trigger phrases: 'show this', 'visualize this report', 'open this in the viewer', 'route this', '/amvcp-show <anything>'. Activates when the user wants to view, comment on, or interact with a file/report/snippet without choosing the sub-skill themselves."
license: MIT
compatibility: "macOS + iTerm2 for split-pane; Python 3.12+; Chromium fallback when iTerm not detected."
metadata:
  author: Emasoft
---

# amvcp-show — Smart Router

## Overview

One entry point for **any** content the user wants to view, comment on, or interact with. The router:

1. **Detects the input type** (markdown report, HTML, code, image, CSV/JSON, Mermaid, regex, LaTeX, diff, slides, plain text, URL, or explicit `(skill, args)` form).
2. **Dispatches** to the right sub-skill or command of `ai-maestro-visual-communicator-plugin`.
3. **Always uses iTerm split-pane** when iTerm is detected (never Safari/Chromium).
4. **Always preserves source content** for markdown reports — no reinterpretation, no cherry-picking; the rendered page contains every paragraph, list, table, code block from the source verbatim, AUGMENTED with per-finding decision controls.

This is the answer to "I don't want to remember which sub-skill renders my CSV / regex / Mermaid / report — just show it."

## How it works

1. Run `python3 $CLAUDE_PROJECT_DIR/skills/amvcp-show/scripts/dispatch.py <input>` with the user's argument as a single string.
2. Parse the JSON action plan printed to stdout.
3. Follow the `action` field's contract (see "Action plan reference" below).

The dispatch script handles the markdown + HTML paths itself (renders + launches via the iTerm-first launcher). For every other content type it returns a structured `invoke_skill` / `invoke_command` instruction telling the orchestrator which slash command to invoke next.

## Routing matrix

| Input shape | Detection cue | Routes to | Why |
|---|---|---|---|
| `.md` / `.markdown` | extension + slides-marker check | `/amvcp-interactive-report` | Preserves every word; adds per-finding 3-state + textarea |
| `.html` / `.htm` | extension | iTerm launcher directly | Already a rendered page |
| `.py` / `.ts` / `.js` / `.go` / `.rs` / `.java` / `.cpp` / `.sh` / `.yaml` / `.toml` / etc. | code extension | `amvcp-prose-pages` (with `data-ve-code` blocks) | Syntax highlight + line-level commenting |
| `.svg` / `.png` / `.jpg` / `.webp` / `.gif` | image extension | `amvcp-prose-pages` (with image wrapper + hotspot) | Visual annotation |
| `.csv` / `.tsv` / `.json` array-of-objects | extension + JSON sniff (top-level `[`) | `amvcp-charts-and-dashboards` | Auto-chart appropriate type |
| `.json` non-array | extension + JSON sniff | `amvcp-prose-pages` (pretty-printed JSON code-block) | Read-only inspection |
| `.diff` / `.patch` | extension | `/amvcp-diff-review` | Side-by-side diff |
| `.mmd` or content `graph TD …` / `sequenceDiagram` / `flowchart` etc. | extension OR first non-blank line | `amvcp-graph-diagrams` | Diagram render |
| `.tex` or content `\documentclass` / `\begin{…}` | extension OR LaTeX markers | `amvcp-math-and-latex` | KaTeX/TikZ |
| `.md` with multiple `---` separators | own-line `---` count ≥ 2 | `/amvcp-generate-slides` | Slide deck |
| Single-line `/.../flags` regex | content sniff | `amvcp-regex-vis` | Visualizer |
| URL (`http(s)://…`) | starts with `http` | `/amvcp-fact-check` (fetch + inspect) | Treat as remote file |
| Plain text idea (not a path) | not a filesystem path | `amvcp-visual-communication` (the original coordinator) | Author from scratch |
| `amvcp-<skill>\|<args>` two-token form | starts with `amvcp-` + contains `\|` | call that sub-skill directly | Power-user escape hatch |

When no rule matches a file's content, the router defaults to treating it as code (the safest "preserve verbatim + add commenting" path).

## Action plan reference

`dispatch.py` writes ONE JSON object to stdout. The orchestrator must inspect `action` and follow the matching contract.

### `action: "rendered"`

Markdown was rendered to HTML and the iTerm launcher returned the user's submission payload. The user has already seen the page and clicked Submit (or Exit / timed out). Example:

```json
{
  "action": "rendered",
  "kind": "markdown",
  "html": "/abs/path/to/output.html",
  "payload": {
    "kind": "submit",
    "count": 3,
    "selections": [
      {"kind": "finding-reply", "findingId": "finding-1",
       "text": "looks good, accepting", "decision": "approve"},
      …
    ]
  }
}
```

Process every `finding-reply` entry in `payload.selections`: re-read the original finding from the source markdown, take the `decision` + `text` from the entry, and write a per-finding response into `<report>.replies.json` (one round per submission). Then optionally re-render and re-launch via `/amvcp-show <report.md>` for the next round.

### `action: "passthrough"`

An HTML file was opened directly via the launcher. The `payload` field carries the launcher's stdout (same shape as `action: rendered` but the `kind` is `"html"`).

### `action: "invoke_command"`

A slash command should be invoked. Example:

```json
{"action": "invoke_command",
 "command": "amvcp-diff-review",
 "args": ["/path/to/file.diff"],
 "reason": "diff/patch — render side-by-side diff"}
```

Invoke `/ai-maestro-visual-communicator-plugin:<command>` with the listed args. The downstream command handles its own rendering + launching.

### `action: "invoke_skill"`

A skill should be activated. Example:

```json
{"action": "invoke_skill",
 "skill": "amvcp-charts-and-dashboards",
 "args": ["/path/to/data.csv"],
 "reason": "tabular data — auto-chart appropriate type"}
```

Load that skill's `SKILL.md` and follow its authoring workflow with the listed arg as the input. After authoring, always launch the resulting HTML via `scripts/amvcp-show-launcher.py` (NOT `amvcp-select.py` directly) so the iTerm split-pane fires when iTerm is present.

### `action: "explicit_skill"`

The user used the power-user form `amvcp-<skill>|<args>`. Same handling as `invoke_skill` — activate the named skill with the args.

### `action: "error"`

The router could not classify or render the input. The `reason` field has a human-readable diagnostic. Surface it to the user and ask for clarification.

## Six contracts the router upholds

These are the contracts the previous round of feedback (TRDD-4c300620) identified as non-negotiable:

1. **Content preservation.** Markdown reports MUST round-trip every paragraph, list, table, and code block from the source verbatim. Augmentation is permitted; reinterpretation is not. The router achieves this by always routing `.md` files to `/amvcp-interactive-report` (which uses `render-interactive-report.py`).
2. **Hover glow.** The runtime's R29 selection visual (soft warm glow on hover, clear delta on selected) is owned exclusively by `amvcp-runtime.js`. Page-CSS `:hover` rules on selectable atoms violate that contract and have been stripped from every Tier 4 visual-component CSS block.
3. **Corner buttons visible.** The four corner buttons `[🌙][📸][🖨️][🎨]` use DESIGN.md surface tokens (not hardcoded white) plus a strong shadow + backdrop-filter blur so they always read against the page background.
4. **iTerm split-pane.** When `$TERM_PROGRAM=iTerm.app`, the router invokes `amvcp-show-launcher.py`, which sets `VE_SELECT_NO_BROWSER=1 VE_SELECT_NO_ITERM=1` on `amvcp-select.py` and triggers `open_preview.applescript` directly. Never spawns Safari / Chromium when iTerm is detected.
5. **Polished theme.** The `product-dashboard` preset uses IBM Plex Sans + warm-cream canvas + navy accent (not the old indigo + Manrope-400 + gradient-title combo).
6. **Per-finding 3-state.** Every `## Finding` heading in the rendered page carries a `<fieldset class="ve-decision">` with three segments: Skip / Approve / Reject (the runtime keeps the visible segments and hidden checkboxes in sync). Each finding's reply textarea, when submitted, includes the current decision in the payload's `selections[i].decision`.

## Example invocations

```text
# Markdown report (most common case)
/amvcp-show /path/to/audit-report.md
→ renders + opens in iTerm split-pane; user clicks Submit; payload returns inline

# HTML page already rendered
/amvcp-show /path/to/page.html
→ opens directly in iTerm split-pane

# CSV that should become a chart
/amvcp-show /path/to/sales.csv
→ {"action":"invoke_skill","skill":"amvcp-charts-and-dashboards","args":["/path/to/sales.csv"]}
→ orchestrator follows the chart skill's authoring workflow

# Plain text idea
/amvcp-show "draw a flowchart of the deployment process"
→ {"action":"invoke_skill","skill":"amvcp-visual-communication","args":["draw a flowchart…"]}
→ coordinator picks a representation

# Power-user form — bypass classification
/amvcp-show "amvcp-graph-diagrams|sequenceDiagram: client → server → db"
→ {"action":"explicit_skill","skill":"amvcp-graph-diagrams","args":["sequenceDiagram: client → server → db"]}
```

## Reuse — existing pieces the router leans on

- `scripts/amvcp-show-launcher.py` — iTerm-first wrapper around `amvcp-select.py`. Owns the iTerm detection (without `isatty`) and the AppleScript split-pane dispatch.
- `scripts/render-interactive-report.py` — markdown → interactive HTML with per-finding 3-state controls.
- `scripts/amvcp-runtime.js` — owns R29 selection visuals, decision-state Map, per-finding-reply enrichment of submit payload.
- Existing sub-skills + commands listed in the routing matrix.

## Out of scope

- Authoring new sub-skills (the router only calls existing ones).
- Replacing `amvcp-select.py` (the iTerm-first launcher wraps it).
- Multi-round response loop for `amvcp-interactive-report` (the responder is `/amvcp-respond-to-comment`; the router only fires the first round).
