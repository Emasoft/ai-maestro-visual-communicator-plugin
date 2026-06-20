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

## Platform requirements

**Supported OSes**: macOS, Linux, and Windows. Python 3.12+ required.

Every user-facing entry point is pure Python: the `amvcp-share-page`
command (`scripts/share.py`), the test runner (`tests/run-all-tests.py`),
the page renderer (`scripts/render-interactive-report.py`), and the
selection server (`scripts/amvcp-select.py`). Windows users no longer need
WSL2 — the plugin runs natively on every OS that has Python 3.12+.

## License

MIT. Forked from [`nicobailon/visual-explainer`](https://github.com/nicobailon/visual-explainer) v0.8.0; see `CHANGELOG.md`.
