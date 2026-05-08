<div align="center">
  <img src="banner.png" alt="ai-maestro-visual-communicator" width="1100">
  <h1>ai-maestro-visual-communicator</h1>
  <p>
    <strong>Claude Code plugin for interactive HTML output.</strong><br>
    Diagrams, diff reviews, plan reviews, slide decks, data tables, and v2 modal-comment agent reports.<br>
    Every page sends the user's selection (or per-element comment thread) back to the agent.
  </p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
  </p>
</div>

---

## What this plugin does

Whenever you would otherwise hand the user a wall of ASCII text — a comparison table, an architecture sketch, a diff review, an implementation plan — `ai-maestro-visual-communicator` generates a self-contained HTML page instead. The page lives in `~/.agent/diagrams/<file>.html`, opens in the user's browser, and is **interactive**:

- **Single-click selection** — every meaningful element (a Mermaid node, a card, a chart point, a table row) is clickable. The browser closes itself and the click is returned to the agent.
- **Multi-click text selection** on prose blocks (depth 1–7: letter → word → block → paragraph → section → …).
- **v2 modal-comment threads** on agent reports — hover any paragraph, list item, table row, or code block; click the pill; type a comment in the right-aligned modal; the agent responds inline.

Pages are vanilla HTML + CSS + ~85 KB of JS (`scripts/ve-runtime.js`). No build step. WASM/CDN dependencies (Mermaid, viz.js, KaTeX, TikZJax, regex-vis) load lazily only when the page actually uses them.

## Slash commands

After installing the plugin, every command is namespaced under `aimvc-`:

| Command | What it does |
|---------|-------------|
| `/aimvc-generate-web-diagram` | Generate an HTML diagram for any topic |
| `/aimvc-generate-visual-plan` | Visual implementation plan for a feature |
| `/aimvc-generate-slides` | Magazine-quality slide deck |
| `/aimvc-diff-review` | Visual diff review with architecture comparison and code review |
| `/aimvc-plan-review` | Compare a plan against the codebase with risk assessment |
| `/aimvc-project-recap` | Mental-model snapshot for context-switching back to a project |
| `/aimvc-fact-check` | Verify accuracy of a document against actual code |
| `/aimvc-interactive-report` | Render an agent report as an interactive HTML page with v2 modal-comment threads |
| `/aimvc-respond-to-comment` | Watch the comment queue and write per-turn agent replies |
| `/aimvc-share-page` | Deploy an HTML page to Vercel and get a live URL |

## Installation

### Via the Emasoft/ai-maestro-plugins marketplace (recommended)

```bash
/plugin marketplace add Emasoft/ai-maestro-plugins
/plugin install ai-maestro-visual-communicator@ai-maestro-plugins
```

### From source (for development)

```bash
git clone https://github.com/Emasoft/ai-maestro-visual-communicator-plugin
ln -s "$(pwd)/ai-maestro-visual-communicator-plugin" ~/.claude/plugins/ai-maestro-visual-communicator
```

The plugin lives at the repo root: `.claude-plugin/plugin.json` is the manifest, `commands/`, `scripts/`, `templates/`, `references/`, and `tests/` are siblings. There is **no nested `plugins/<name>/` layer** — that was the v0.x layout inherited from upstream and was flattened in v1.0.0.

## Repository layout

```
ai-maestro-visual-communicator-plugin/
├── .claude-plugin/
│   └── plugin.json            # plugin manifest (name, version, author)
├── commands/                  # slash-command bodies (aimvc-*.md)
├── references/                # cookbooks read by the agent on demand
├── scripts/                   # ve-runtime.js, ve-select.py, render-interactive-report.py, etc.
├── templates/                 # canonical HTML templates
├── tests/                     # dev-browser test suite (28 tests, all green)
├── vendor/regex-vis/          # vendored regex visualizer (separate upstream)
├── SKILL.md                   # canonical skill body — agent reads this on activation
├── README.md                  # this file
├── CHANGELOG.md
├── LICENSE                    # MIT
└── THIRD_PARTY_NOTICES.md     # attribution for vendored dependencies
```

## Tests

```bash
tests/run-all-tests.sh
```

28 dev-browser tests covering every regex-vis edit-panel surface (R1–R22), undo/redo per-mount, shift+click multi-select, wide-regex per-graph overflow, the v2 modal-comment hover-bridge, polling resume on reopen, atomic pending save, multi-turn dialogue, ESC/DONE close, and every commentable element type (`p`, `li`, `tr`, `pre`).

Pre-requisites: `python3`, `uv`, `dev-browser` (`npm install -g dev-browser && dev-browser install`).

## Lineage

This plugin was forked from [`nicobailon/visual-explainer`](https://github.com/nicobailon/visual-explainer) at v0.8.0. The v1.0.0 release renames the plugin to `ai-maestro-visual-communicator`, flattens the directory layout to a single-plugin repo, drops the nested marketplace, replaces every namespaced slash command with the `aimvc-` prefix, and adds the v2 modal-comment workflow (interactive agent reports with hover-pill anchors, modal threads, polling reply, atomic pending save). See `CHANGELOG.md` for the full delta.

The vendored `vendor/regex-vis/` retains its original upstream identity — it is a separate project under MIT, vendored for the embedded regex visualizer.

## License

MIT — see `LICENSE`. Third-party attributions in `THIRD_PARTY_NOTICES.md`.
