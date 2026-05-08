<div align="center">

# ai-maestro-visual-communicator-plugin

</div>

## Features

- **Interactive HTML output** — every diagram, table, card and chart point is clickable; the click returns a typed selection to the agent and the browser closes itself.
- **v2 modal-comment threads** on agent reports — hover any paragraph, list item, table row or code block; type a comment in a right-aligned modal; agent replies inline (polling, atomic save, resume on reopen).
- **v3 per-element decision toggles** (approve / reject — both off = skip) on every finding — two pill-shaped switches with mutex, in a warm slate/teal/rust palette; the toggle is the outcome signal Claude reads first, the thread stays free-text for clarifications.
- **10 slash commands**: `amvcp-generate-web-diagram`, `amvcp-generate-visual-plan`, `amvcp-generate-slides`, `amvcp-diff-review`, `amvcp-plan-review`, `amvcp-project-recap`, `amvcp-fact-check`, `amvcp-interactive-report`, `amvcp-respond-to-comment`, `amvcp-share-page`.
- **Embedded renderers** — Mermaid, Graphviz (`viz.js`), TikZJax, KaTeX (with 86 default math macros), and a vendored regex visualiser with per-mount undo/redo, shift-click multi-select, and ⌘⇧Z redo.
- **Multi-click text selection** on prose blocks — depth 1 (letter) → 2 (word) → 3 (block) → up to depth 7.
- **Self-contained pages** — single HTML file, ~85 KB vanilla JS runtime, WASM/CDN deps lazy-loaded only when the page actually uses them. No build step.
- **Multi-harness** — Claude Code, Pi, Codex CLI, OpenCode, and Cursor configs included.
- **32-test dev-browser suite** covering every fixed bug, edit-panel surface, and the v3 decision-toggle flow (incl. mutex).

## Install

```bash
/plugin marketplace add Emasoft/ai-maestro-plugins
/plugin install ai-maestro-visual-communicator-plugin@ai-maestro-plugins
```

## Platform requirements

**Supported OSes**: macOS, Linux, and Windows. Python 3.12+ required.

Every user-facing entry point is pure Python: the `amvcp-share-page`
command (`scripts/share.py`), the test runner (`tests/run-all-tests.py`),
the page renderer (`scripts/render-interactive-report.py`), and the
selection server (`scripts/amvcp-select.py`). Windows users no longer need
WSL2 — the plugin runs natively on every OS that has Python 3.12+.

## License

MIT. Forked from [`nicobailon/visual-explainer`](https://github.com/nicobailon/visual-explainer) v0.8.0; see `CHANGELOG.md`.
