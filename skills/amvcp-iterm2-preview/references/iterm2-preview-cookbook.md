# iTerm2 Preview — cookbook

## Table of contents

- [Why detect iTerm2 first](#why-detect-iterm2-first)
- [Detector internals](#detector-internals)
- [Mode 1 — HTML preview workflow](#mode-1--html-preview-workflow)
- [Mode 2 — Mermaid → SVG workflow](#mode-2--mermaid--svg-workflow)
- [Worked examples](#worked-examples)
- [Closing the preview](#closing-the-preview)

## Why detect iTerm2 first

The original skill ran `osascript` blindly on the assumption that the host
shell is real iTerm2. In practice many environments LOOK like iTerm2 but
aren't, and the AppleScript split misfires badly under each:

| Host | Behaviour without detection |
|---|---|
| Claude Desktop subprocess | Stdout is not a TTY; AppleScript launches a NEW iTerm window the user can't see. |
| Terminal.app, WezTerm, Alacritty, Kitty, Hyper, Warp | osascript opens iTerm2 unrelated to the active terminal — jarring context switch. |
| VS Code / Cursor integrated terminal | Same — the split-pane appears in iTerm2, not in the editor pane the user is using. |
| tmux / screen | The split lands in the underlying iTerm2 tab BEHIND the multiplexer, invisible to the user. |
| SSH session | iTerm2.app is on the origin machine; this remote shell can't reach it. |
| Codespaces / Gitpod / Replit / Jupyter / StackBlitz | Browser-hosted xterm.js — osascript does not exist. |

Step 0 (`detect_iterm2.py`) refuses on every one of these BEFORE any
AppleScript runs, so the user gets a clear error instead of a confusing
side-effect.

## Detector internals

`scripts/detect_iterm2.py` runs 8 checks in order of cheapness:

1. **macOS only** — `platform.system() == "Darwin"`.
2. **Real TTY** — `sys.stdout.isatty()`.
3. **tmux/screen guard** — `$TMUX` or `$STY` unset.
4. **SSH guard** — `$SSH_TTY` and `$SSH_CONNECTION` both unset.
5. **VS Code/Cursor guard** — `$TERM_PROGRAM != vscode|Cursor`, `$VSCODE_INJECTION` and `$CURSOR_CHANNEL` unset.
6. **Web/cloud terminal guard** — none of `$JUPYTER_SERVER_ROOT`, `$JUPYTER_TOKEN`, `$CODESPACES`, `$GITHUB_CODESPACE_TOKEN`, `$GITPOD_WORKSPACE_ID`, `$GITPOD_REPO_ROOT`, `$REPL_SLUG`, `$REPL_OWNER`, `$STACKBLITZ_ENV` set.
7. **Positive iTerm markers** — `$TERM_PROGRAM == "iTerm.app"` AND `$LC_TERMINAL == "iTerm2"` AND `$ITERM_SESSION_ID` is set.
8. **Live osascript probe** — `tell application "System Events" to (name of processes) contains "iTerm2"` returns `true` (within 5 s).

Step 8 is the bulletproofing: if checks 1-7 are all spoofed in env vars by
a hostile or quirky shell, the live probe will still fail because iTerm2.app
isn't actually running.

Exit codes: 0 on pass (with a one-line confirmation on stdout), 1 on any
failure (with `NOT-iTerm2: <which check failed>` on stderr).

## Mode 1 — HTML preview workflow

```bash
# Step 0 — REQUIRED
uv run "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/detect_iterm2.py" || exit 1

# Step 1 — find the file
HTML="$(realpath ./index.html)"   # or whatever path the user gave

# Step 2 — open the split-pane
osascript "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/open_preview.applescript" "$HTML"
```

If the user is vague ("the landing page", "our page"), search before
guessing: `find . -name "*.html" | head -20`. Confirm if multiple
candidates exist.

## Mode 2 — Mermaid → SVG workflow

```bash
# Step 0
uv run "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/detect_iterm2.py" || exit 1

# Step 1 — install mmdc if missing
command -v mmdc || npm install -g @mermaid-js/mermaid-cli

# Step 2 — write the source
cat > /tmp/diagram.mmd <<'EOF'
graph LR
  A --> B --> C
EOF

# Step 3 — render
mmdc -i /tmp/diagram.mmd -o /tmp/diagram.svg

# Step 4 — wrap in a centered HTML shell
python3 "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/svg_to_html.py" \
  /tmp/diagram.svg /tmp/diagram_preview.html

# Step 5 — open
osascript "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/open_preview.applescript" \
  /tmp/diagram_preview.html
```

The SVG-wrap script gives the diagram a dark `#1e1e2e` background, centers
it, sets `max-width: 100%; height: auto` so it scales to the pane width.
No external CSS, no fonts, no scripts — works fully offline.

## Worked examples

**Example 1 — preview an existing HTML report**

User: "show me the audit-report.html"

```text
$ uv run "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/detect_iterm2.py"
iTerm2 verified: TERM_PROGRAM=iTerm.app, LC_TERMINAL=iTerm2, ITERM_SESSION_ID=w0t0p0:UUID, profile='Default'

$ osascript "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/open_preview.applescript" \
    "$(realpath ./reports/visual-test/modal-comments/audit-report.html)"
```

Tell the user: "Preview open in the right pane. Close with `osascript $CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/close_preview.applescript` when done."

**Example 2 — Codespaces user asks for a preview**

User (in a Codespaces shell): "preview the landing page"

```text
$ uv run "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/detect_iterm2.py"
NOT-iTerm2: web/cloud terminal detected: GitHub Codespaces ($CODESPACES is set)
exit=1
```

Skill aborts cleanly. Tell the user: "iTerm2 preview is macOS-native and does not work in browser-hosted shells like Codespaces. Try `/amvcp-share-page` instead — it deploys the page to a Vercel URL you can open in any browser."

**Example 3 — user is inside tmux**

User: "show me the diagram"

```text
$ uv run "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/detect_iterm2.py"
NOT-iTerm2: running inside tmux ($TMUX is set) — the AppleScript split would land behind the multiplexer, invisible to the user
exit=1
```

Tell the user: "Detach from tmux first (Ctrl-b d) and re-run, or open the file directly with `open <path>`."

## Closing the preview

```bash
osascript "$CLAUDE_PLUGIN_ROOT/skills/amvcp-iterm2-preview/scripts/close_preview.applescript"
```

Closes every non-active session in the current tab — collapses back to a
single terminal pane. Or the user can just type `exit` inside the right
pane. Both have the same effect.
