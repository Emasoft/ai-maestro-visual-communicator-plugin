<div align="center">

# ai-maestro-visual-communicator-plugin

</div>

A Claude Code plugin that gives an agent a palette of visual-element
skills — each generates a self-contained, interactive HTML artifact
(charts, diagrams, tables, slide decks, code views, wireframes, agent
reports). Every element is editable, commentable, stylizable (light +
dark), and exportable, and any element can be composed inside any other
via nested HTML + SVG.

## Features

- **Interactive HTML output** — every diagram, table, card and chart point is clickable; the click returns a typed selection to the agent and the browser closes itself.
- **v2 modal-comment threads** on agent reports — hover any paragraph, list item, table row or code block; type a comment in a right-aligned modal; agent replies inline (polling, atomic save, resume on reopen).
- **v3 per-element decision toggles** (approve / reject — both off = skip) on every finding — two pill-shaped switches with mutex, in a warm slate/teal/rust palette; the toggle is the outcome signal Claude reads first, the thread stays free-text for clarifications.
- **10 slash commands**: `amvcp-generate-web-diagram`, `amvcp-generate-visual-plan`, `amvcp-generate-slides`, `amvcp-diff-review`, `amvcp-plan-review`, `amvcp-project-recap`, `amvcp-fact-check`, `amvcp-interactive-report`, `amvcp-respond-to-comment`, `amvcp-share-page`.
- **Embedded renderers** — Mermaid, Graphviz (`viz.js`), TikZJax, KaTeX (with the default math-macro set), a vendored regex visualiser with per-mount undo/redo, shift-click multi-select, and ⌘⇧Z redo, plus the vendored Pierre high-fidelity diff viewer (Shiki highlight, split/unified, merge-conflict resolver, huge-file virtualizer).
- **Multi-click text selection** on prose blocks — depth 1 (letter) → 2 (word) → 3 (block) → up to depth 7.
- **Self-contained pages** — single HTML file, vanilla JS runtime, WASM/CDN deps lazy-loaded only when the page actually uses them. No build step.
- **Multi-harness** — Claude Code, Pi, Codex CLI, OpenCode, and Cursor configs included.
- **Dev-browser test suite** covering every fixed bug, edit-panel surface, and the v3 decision-toggle flow (incl. mutex).

## Installation

```bash
/plugin marketplace add Emasoft/ai-maestro-plugins
/plugin install ai-maestro-visual-communicator-plugin@ai-maestro-plugins
```

## Usage

After installation, invoke any of the 10 slash commands from
within a Claude Code session — each one launches the corresponding
HTML page in a Chromium app window and returns the user's
selection / comments back to the agent.

```bash
/amvcp-generate-web-diagram   # interactive web diagram
/amvcp-generate-visual-plan   # plan-of-work review page
/amvcp-generate-slides        # slide deck
/amvcp-diff-review            # code diff review with comments
/amvcp-plan-review            # markdown plan review with toggles
/amvcp-project-recap          # snapshot of project state
/amvcp-fact-check             # claim-by-claim fact-check page
/amvcp-interactive-report     # convert any .md report into an
                              # interactive HTML page with v2 modal
                              # comments + v3 decision toggles
/amvcp-respond-to-comment     # continue an open comment thread
/amvcp-share-page             # deploy a finished page to a public Vercel URL
```

Every page is a single self-contained HTML file. On Submit, the
page closes itself and the agent receives the multi-select payload
(picked items + comment threads + decision toggles).

## Memory (recall before you render)

The plugin uses the AI-Maestro **global janitor-hosted** wiki memory —
durable project facts live as symptom-indexed markdown notes across three
scopes: LOCAL (`~/.claude/projects/<slug>/memory/`), PROJECT (in-repo at
`.claude/project/memory/`, git-tracked + shared), and USER (cross-project).
The protocol lives in `~/.claude/rules/markdown-memory-recall.md`; the
day-to-day legs are the global `/janitor-memory-recall`,
`/janitor-memory-write`, and `/janitor-memory-update` skills (search runs on
`memgrep`, degrading to plain `grep` when the binary is absent).

VISUAL-COMMUNICATOR workflow wiring:

- **Before generating any page**, recall house-style and confirmed-preference
  notes (themes, density, palettes) so prior decisions shape the output
  without re-asking.
- **After a confirmed preference or a solved gotcha**, write one
  symptom-indexed note (plus its `MEMORY.md` index line) for future sessions.

`memgrep` is optional: install it once from the `ai-maestro-janitor` repo
(`cargo install --path <…>/ai-maestro-janitor/scripts/memgrep`); until then
recall falls back to `grep` — it degrades, never breaks.

## AI Maestro side panel (optional)

If — and only if — the plugin happens to be running inside the AI Maestro
harness, a generated artifact can be pushed straight into the dashboard side
panel instead of being handed over as a file path:

```bash
scripts/amvcp-panel-push.py <artifact.html> [--agent <uuid-or-name>]
```

This is an **optional** path, not a dependency. amvcp is a universal plugin:
ai-maestro depends on amvcp, never the reverse. The script finds
`aimaestro-panel.sh` on `PATH` and nowhere else, and when it is absent — the
normal case — it prints `panel: unavailable` and exits 0, so amvcp behaves
exactly as it does standalone. The target agent comes from `--agent`,
`$AMVCP_PANEL_AGENT`, or `$AIMAESTRO_AGENT_ID`; with none of them it prints
`panel: no-target` and exits 0.

Once the CLI **is** present and a target **is** known, a delivery problem is a
real failure and exits non-zero. That includes `delivered: 0`: the panel is a
live surface rather than a queue, so a zero count means no dashboard had the
channel open and the artifact was dropped, not stored — reporting it as
delivered would leave you believing something is on screen when nothing
received it. Credentials are never handled here; `aimaestro-panel.sh` reads
`AID_AUTH` (agent callers) or `AIMAESTRO_SUDO_TOKEN` (user callers) from the
environment itself.

## Platform requirements

**Supported OSes**: macOS, Linux, and Windows. Python 3.12+ required.

Every user-facing entry point is pure Python: the `amvcp-share-page`
command (`scripts/share.py`), the test runner (`tests/run-all-tests.py`),
the page renderer (`scripts/render-interactive-report.py`), and the
selection server (`scripts/amvcp-select.py`). Windows users no longer need
WSL2 — the plugin runs natively on every OS that has Python 3.12+.

## License

MIT. Forked from [`nicobailon/visual-explainer`](https://github.com/nicobailon/visual-explainer) v0.8.0; see `CHANGELOG.md`.
