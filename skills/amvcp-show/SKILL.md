---
name: amvcp-show
description: "Smart router for the AI Maestro Visual Communicator plugin. Use when the user wants to view, comment on, or interact with ANY input (file path, URL, plain text, or skill+args two-token form) without choosing the sub-skill themselves — the router classifies the input by extension + content sniff and dispatches to the right sub-skill or command. Always opens results in an iTerm split-pane when iTerm is detected (never spawns Safari or Chromium). Always preserves source content verbatim for markdown reports (routes to /amvcp-interactive-report which adds per-finding 3-state accept/reject/comment + textarea without removing or reinterpreting a single word). Trigger with /amvcp-show, 'show this', 'visualize this report', 'open this in the viewer', 'route this', or any phrasing where the user names content but not the renderer."
license: MIT
compatibility: "macOS + iTerm2 for split-pane; Python 3.12+; Chromium fallback when iTerm not detected."
metadata:
  author: Emasoft
---

# amvcp-show — Smart Router

## Overview

One entry point for any content the user wants to view or comment on. The router classifies the input (markdown, HTML, code, image, CSV/JSON, Mermaid, regex, LaTeX, diff, slides, plain text, URL, or explicit skill+args form), dispatches to the right sub-skill or command, always uses iTerm split-pane when iTerm is detected, and always preserves source content verbatim for markdown reports — no reinterpretation, no cherry-picking.

## Prerequisites

- Python 3.12+
- iTerm2 on macOS for the split-pane preview (Chromium fallback otherwise)
- The plugin's runtime + renderer scripts (`scripts/amvcp-show-launcher.py`, `scripts/render-interactive-report.py`) co-located in the plugin root

## Instructions

1. Run `python3 $CLAUDE_PLUGIN_ROOT/skills/amvcp-show/scripts/dispatch.py <input>` with the user's argument as a single string.
2. Parse the JSON action plan printed to stdout.
3. Follow the `action` field per the contract in "Output" below.

The dispatcher handles the markdown and HTML paths itself (renders + launches via the iTerm-first launcher). For every other content type it returns a structured `invoke_skill` / `invoke_command` instruction telling the orchestrator which slash command to invoke next.

### Routing matrix

| Input shape | Detection cue | Routes to | Why |
|---|---|---|---|
| `.md` / `.markdown` | extension + slides-marker check | `/amvcp-interactive-report` | Preserves every word; adds per-finding 3-state + textarea |
| `.html` / `.htm` | extension | iTerm launcher directly | Already a rendered page |
| `.py` / `.ts` / `.js` / `.go` / `.rs` / `.java` / `.cpp` / `.sh` / `.yaml` / etc. | code extension | `amvcp-prose-pages` (data-ve-code blocks) | Syntax highlight + line-level commenting |
| `.svg` / `.png` / `.jpg` / `.webp` / `.gif` | image extension | `amvcp-prose-pages` (image wrapper + hotspot) | Visual annotation |
| `.csv` / `.tsv` / `.json` array-of-objects | extension + JSON sniff (top-level `[`) | `amvcp-charts-and-dashboards` | Auto-chart appropriate type |
| `.json` non-array | extension + JSON sniff | `amvcp-prose-pages` (pretty-printed JSON block) | Read-only inspection |
| `.diff` / `.patch` | extension | `/amvcp-diff-review` | Side-by-side diff |
| `.mmd` or content `graph TD`, `sequenceDiagram`, `flowchart` | extension OR first non-blank line | `amvcp-graph-diagrams` | Diagram render |
| `.tex` or content `documentclass`, `begin{...}` | extension OR LaTeX markers | `amvcp-math-and-latex` | KaTeX/TikZ |
| `.md` with two or more `---` separators | own-line `---` count >= 2 | `/amvcp-generate-slides` | Slide deck |
| Single-line `/.../flags` regex | content sniff | `amvcp-regex-vis` | Visualizer |
| URL (`http(s)://...`) | starts with `http` | `/amvcp-fact-check` (fetch + inspect) | Treat as remote file |
| Plain text idea (not a path) | not a filesystem path | `amvcp-visual-communication` (coordinator) | Author from scratch |
| `amvcp-<skill>` pipe-separated `<args>` two-token form | starts with `amvcp-` + contains a pipe | call that sub-skill directly | Power-user escape hatch |

When no rule matches a file's content the router defaults to treating it as code (the safest "preserve verbatim + add commenting" path).

## Output

The dispatcher writes ONE JSON object to stdout. Five `action` shapes are possible:

- `action: "rendered"` — Markdown was rendered to HTML and the iTerm launcher returned the user's submission payload. The user already saw the page and clicked Submit (or Exit / timed out). The `payload.selections[]` array contains `finding-reply` entries with `findingId`, `text`, and `decision` (skip / approve / reject). Process each entry: re-read the original finding from the source markdown, take `decision` + `text`, and write a per-finding response into `<report>.replies.json`.
- `action: "passthrough"` — An HTML file was opened directly via the launcher; `payload` carries the launcher's stdout (same shape as `rendered`, kind `html`).
- `action: "invoke_command"` — A slash command should be invoked, e.g. `{"command": "amvcp-diff-review", "args": ["/path/to/file.diff"]}`. The downstream command handles its own rendering + launching.
- `action: "invoke_skill"` — A skill should be activated, e.g. `{"skill": "amvcp-charts-and-dashboards", "args": ["/path/to/data.csv"]}`. After authoring, always launch the resulting HTML via `scripts/amvcp-show-launcher.py` (NOT `amvcp-select.py` directly) so the iTerm split-pane fires when iTerm is present.
- `action: "explicit_skill"` — The user used the power-user pipe-separated form. Same handling as `invoke_skill`.
- `action: "error"` — Classification or rendering failed; surface `reason` to the user and ask for clarification.

## Error Handling

- Input not found on disk and not a URL or plain text — `{"action": "error", "reason": "file not found"}`. Ask the user to confirm the path.
- `render-interactive-report.py` exits non-zero — `{"action": "error", "reason": "..."}` with the script's stderr trimmed to 400 chars. Most common cause: invalid markdown syntax.
- `amvcp-show-launcher.py` fails to find the plugin scripts — the launcher resolves the plugin root via `$CLAUDE_PLUGIN_ROOT`, then the repo checkout, then `~/.claude/plugins/cache/...`; if all three miss it raises `FileNotFoundError` and the launcher reports the missing path.
- iTerm AppleScript fails — the page is still being served on localhost; the launcher prints the URL and the user can open it manually.

## Examples

**Markdown report (most common case):**

```text
/amvcp-show /path/to/audit-report.md
```

Renders + opens in iTerm split-pane; user clicks Submit; payload returns inline with per-finding decisions and textarea replies.

**HTML page already rendered:**

```text
/amvcp-show /path/to/page.html
```

Opens directly in iTerm split-pane.

**CSV that should become a chart:**

```text
/amvcp-show /path/to/sales.csv
```

Returns `{"action":"invoke_skill","skill":"amvcp-charts-and-dashboards","args":["/path/to/sales.csv"]}`. Orchestrator follows the chart skill's authoring workflow.

**Plain text idea:**

```text
/amvcp-show "draw a flowchart of the deployment process"
```

Returns `{"action":"invoke_skill","skill":"amvcp-visual-communication","args":["draw a flowchart..."]}`. Coordinator picks a representation.

**Power-user form — bypass classification:**

```text
/amvcp-show "amvcp-graph-diagrams|sequenceDiagram: client -> server -> db"
```

Returns `{"action":"explicit_skill","skill":"amvcp-graph-diagrams","args":["sequenceDiagram: ..."]}`.

## Resources

- [dispatch.py](scripts/dispatch.py) — classifier + action-plan emitter (13 input shapes recognised)

Companion plugin scripts (resolved at runtime via `$CLAUDE_PLUGIN_ROOT`):

- `scripts/amvcp-show-launcher.py` — iTerm-first wrapper around `amvcp-select.py`; owns iTerm detection (without `isatty`) and the AppleScript split-pane dispatch
- `scripts/render-interactive-report.py` — markdown to interactive HTML with per-finding 3-state controls
- `scripts/amvcp-runtime.js` — owns R29 selection visuals, decision-state Map, per-finding-reply enrichment of submit payload

Sibling skills the router dispatches to (loaded via the plugin's skill index — not direct file links from here per CPV self-containment rule):

- `amvcp-interactive-report` — for `.md` inputs
- `amvcp-prose-pages` — for code and image inputs
- `amvcp-charts-and-dashboards` — for tabular data
- `amvcp-graph-diagrams` — for Mermaid sources
- `amvcp-regex-vis` — for regex sources
- `amvcp-math-and-latex` — for LaTeX sources
- `amvcp-visual-communication` — coordinator for plain text

### Six contracts the router upholds

These contracts (per TRDD-4c300620) are non-negotiable:

1. Content preservation — markdown reports round-trip every paragraph, list, table, and code block from the source verbatim. Augmentation permitted; reinterpretation not.
2. Hover glow — the runtime's R29 selection visual is owned exclusively by `amvcp-runtime.js`. Page-CSS `:hover` rules on selectable atoms violate that contract and have been stripped.
3. Corner buttons visible — the four corner buttons use DESIGN.md surface tokens (not hardcoded white) plus strong shadow + backdrop-filter blur so they always read against the page background.
4. iTerm split-pane — when `$TERM_PROGRAM=iTerm.app`, the router invokes `amvcp-show-launcher.py` which sets `VE_SELECT_NO_BROWSER=1 VE_SELECT_NO_ITERM=1` on `amvcp-select.py` and triggers `open_preview.applescript` directly. Never spawns Safari / Chromium when iTerm is detected.
5. Polished theme — the `product-dashboard` preset uses IBM Plex Sans + warm-cream canvas + navy accent.
6. Per-finding 3-state — every `## Finding` heading in the rendered page carries a `fieldset.ve-decision` with three segments (Skip / Approve / Reject); the submit payload's `selections[i].decision` carries the current decision alongside the reply text.

### Out of scope

- Authoring new sub-skills (the router only calls existing ones).
- Replacing `amvcp-select.py` (the iTerm-first launcher wraps it).
- Multi-round response loop for `amvcp-interactive-report` (the responder is `/amvcp-respond-to-comment`; the router only fires the first round).
