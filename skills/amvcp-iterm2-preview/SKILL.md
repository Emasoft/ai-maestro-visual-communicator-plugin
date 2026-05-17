---
name: amvcp-iterm2-preview
description: "Preview an HTML page or render a Mermaid diagram as SVG inside an iTerm2 vertical split-pane (Web Browser profile) right next to the terminal. Aborts cleanly on any non-iTerm2 host (Claude Desktop, Terminal.app, VS Code, tmux, SSH, web shells). Use when the user wants to preview an HTML file or see a Mermaid diagram rendered without leaving the terminal. Trigger with 'show me a preview', 'preview the HTML', 'render this as SVG'."
license: MIT
compatibility: "macOS only. Real iTerm2.app + 'Web Browser' profile required. Mermaid mode also needs `mmdc`."
metadata:
  author: Emasoft
---

# iTerm2 Preview

## Overview

Splits the current iTerm2 tab vertically and opens an HTML/SVG file in the right-hand pane via a "Web Browser" profile. **Refuses on every non-iTerm2 host** (Claude Desktop, Terminal.app, WezTerm/Alacritty/Kitty, VS Code, Cursor, tmux/screen, SSH, Codespaces/Gitpod/Replit/Jupyter/xterm.js) — Step 0 aborts cleanly.

Auto-invoked by `scripts/amvcp-select.py`: opens generated pages in a split-pane instead of Chrome on iTerm2; otherwise existing browser flow runs unchanged. Opt-out via `VE_SELECT_NO_ITERM=1`.

## Prerequisites

- macOS with iTerm2.app installed and currently running.
- iTerm2 profile named exactly **"Web Browser"** (Preferences → Profiles → "+" → set as browser session).
- `osascript` available (default on macOS).
- For Mermaid mode: `mmdc` (`npm i -g @mermaid-js/mermaid-cli`).
- NOT inside tmux/screen, SSH, VS Code, Cursor, or a web-hosted shell.

## Instructions

1. **Step 0 — verify host is real iTerm2.** ALWAYS run before any AppleScript:
   ```bash
   uv run "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/detect_iterm2.py"
   ```
   On non-zero exit, abort with the stderr message verbatim. Do NOT bypass.
2. **Locate the file.** HTML: use the user's path or `find . -name "*.html" | head`. Mermaid: see cookbook for the `mmdc` + svg_to_html.py wrap chain.
3. **Open the split-pane:** `osascript ".../scripts/open_preview.applescript" "<url>"` where `<url>` is complete (`file://<abs-path>` or `http://localhost:<port>/...`).
4. **Tell the user** how to close: "Preview open in the right pane. Close with `osascript .../scripts/close_preview.applescript` or `exit` inside that pane."

## Output

Vertical split-pane in the current iTerm2 tab, right ~50%, "Web Browser" profile pointing at the URL. Terminal session preserved on the left. Mermaid mode writes to `/tmp`.

**Side effects:** disables iTerm2 pane dimming globally + names the preview pane "amvcp Preview" + tints its tab color bright gray (#D0D0D0) for visual distinction. Enable Settings → Profiles → Web Browser → "Show Title Bar" to see both cues. See cookbook for details.

## Error Handling

| Symptom | Fix |
|---|---|
| `NOT-iTerm2: …` from Step 0 | stderr names which check failed. Do NOT bypass. |
| `"Web Browser" profile not found` | Create in Preferences → Profiles → "+". |
| `mmdc: command not found` | `npm i -g @mermaid-js/mermaid-cli`. |
| Pane blank | URL must be complete; use `$(realpath ...)` for files. |
| Wrong window | AppleScript uses `current window`; bring target to front. |

## Examples

**Input:** "show me the landing page".

```text
$ uv run ".../detect_iterm2.py"
iTerm2 verified: TERM_PROGRAM=iTerm.app, LC_TERMINAL=iTerm2, …
$ osascript ".../open_preview.applescript" "file://$(realpath ./index.html)"
```

**Output:** "Preview open in the right pane. Close with the close_preview.applescript when done."

**Negative example:** Codespaces. Step 0 returns `NOT-iTerm2: web/cloud terminal detected: GitHub Codespaces ($CODESPACES is set)`. Abort; suggest `/amvcp-share-page` instead.

## Modes

Not applicable — this skill is a terminal/iTerm pane lifecycle helper, not a render skill. It does NOT emit DOM or carry a `data-ve-mode` attribute (R20-R23 of `amvcp-self-debug-rules` don't apply).

## Composability

Not applicable in the visual sense — iTerm pane management is orthogonal to the visual rendering skills. Multiple `amvcp-iterm2-preview` invocations from the same shell are guarded by the safeguard in `open_preview.applescript` (R7).

## Resources

- [iterm2-preview-cookbook.md](./references/iterm2-preview-cookbook.md) — detector internals, Mermaid workflow, abort cases.
  - Why detect iTerm2 first
  - Detector internals
  - Mode 1 — HTML preview workflow
  - Mode 2 — Mermaid → SVG workflow
  - Worked examples
  - Closing the preview
