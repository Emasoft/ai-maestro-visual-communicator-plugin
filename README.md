<div align="center">
  <img src="banner.png" alt="ai-maestro-visual-communicator" width="1100">

# ai-maestro-visual-communicator

</div>

## Features

- **Interactive HTML output** — every diagram, table, card and chart point is clickable; the click returns a typed selection to the agent and the browser closes itself.
- **v2 modal-comment threads** on agent reports — hover any paragraph, list item, table row or code block; type a comment in a right-aligned modal; agent replies inline (polling, atomic save, resume on reopen).
- **v3 per-element decision pills** (approve / reject / skip) on every finding — segmented-control next to the comment thread; the pill is the outcome signal Claude reads first, the thread stays free-text for clarifications.
- **10 slash commands**: `aimvc-generate-web-diagram`, `aimvc-generate-visual-plan`, `aimvc-generate-slides`, `aimvc-diff-review`, `aimvc-plan-review`, `aimvc-project-recap`, `aimvc-fact-check`, `aimvc-interactive-report`, `aimvc-respond-to-comment`, `aimvc-share-page`.
- **Embedded renderers** — Mermaid, Graphviz (`viz.js`), TikZJax, KaTeX (with 86 default math macros), and a vendored regex visualiser with per-mount undo/redo, shift-click multi-select, and ⌘⇧Z redo.
- **Multi-click text selection** on prose blocks — depth 1 (letter) → 2 (word) → 3 (block) → up to depth 7.
- **Self-contained pages** — single HTML file, ~85 KB vanilla JS runtime, WASM/CDN deps lazy-loaded only when the page actually uses them. No build step.
- **Multi-harness** — Claude Code, Pi, Codex CLI, OpenCode, and Cursor configs included.
- **31-test dev-browser suite** covering every fixed bug, edit-panel surface, and the v3 decision-pill flow.

## Install

```bash
/plugin marketplace add Emasoft/ai-maestro-plugins
/plugin install ai-maestro-visual-communicator@ai-maestro-plugins
```

## Platform requirements

**Supported OSes**: macOS, Linux, and Windows. Python 3.12+ required.

Every user-facing entry point is pure Python: the `aimvc-share-page`
command (`scripts/share.py`), the test runner (`tests/run-all-tests.py`),
the page renderer (`scripts/render-interactive-report.py`), and the
selection server (`scripts/ve-select.py`). Windows users no longer need
WSL2 — the plugin runs natively on every OS that has Python 3.12+.

`banner.png` is the README banner image — there is no per-OS variant; it
is intentionally a single shared asset rather than a multi-platform binary.

## License

MIT. Forked from [`nicobailon/visual-explainer`](https://github.com/nicobailon/visual-explainer) v0.8.0; see `CHANGELOG.md`.
