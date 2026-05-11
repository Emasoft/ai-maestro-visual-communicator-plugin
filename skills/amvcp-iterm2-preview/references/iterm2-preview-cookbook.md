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

## Side effects of opening a preview

`open_preview.applescript` mutates iTerm2 state so the preview is readable.
None are destructive; all are documented + reversible:

| Mutation | Why | How to revert |
|----------|-----|---------------|
| `defaults write com.googlecode.iterm2 DimInactiveSplitPanes -bool false` | Stops iTerm2 from graying out the Web Browser pane when terminal pane has focus. iTerm2's dim control is global — no per-pane override. | Settings → Appearance → Dimming → toggle "Dim inactive split panes" back on. |
| `defaults write com.googlecode.iterm2 SplitPaneDimmingAmount -float 0.0` | Belt-and-braces companion to the bool. iTerm2 sometimes dims even when the bool is false because the *amount* is non-zero. | Settings → Appearance → Dimming → drag "Amount" slider back up. |
| Set pane name to "amvcp Preview" via Python API (`session.async_set_name`) | Friendly title bar text so you can identify the preview pane at a glance. The page's `<title>` later overwrites this when navigation completes. | Per-pane runtime state; vanishes when the pane closes. |

Tab-color tinting was attempted in earlier drafts but **iTerm2's AppleScript
sdef has no `tab color` property on session** (verified against
`/Applications/iTerm.app/Contents/Resources/iTerm2.sdef`) — `set tab color`
errors with `-1728`. The friendly pane name + the dim-disable are the only
working visual cues.

## Page navigation — Python API + keystroke fallback

iTerm2's AppleScript surface has **no command to navigate a Web-Browser
session**. The original `downloads_dev/iterm2-preview` skill used
`write text URL` — that only writes to a SHELL session and silently no-ops
on Browser sessions, which is why the original never actually loaded the
page.

The fix is `scripts/navigate_iterm2_browser_pane.py`, invoked from
`open_preview.applescript` with the new session's UUID. It tries two paths:

1. **Primary** — `Session.async_load_url(url)` via the iTerm2 Python API.
   Requires iTerm2 protocol ≥ 1.12 (typically iTerm2 ≥ 3.6.11 or any
   nightly build).

2. **Fallback** — clipboard + keystroke. Stashes the user's clipboard,
   puts the URL on the clipboard, sends Cmd+L (focus URL bar), Cmd+V
   (paste), Enter, then restores the clipboard. Works on any iTerm2
   version. Brief (~200 ms) clipboard clobber is unavoidable. Verified
   working on iTerm2 v3.6.10 / protocol 1.11.

Both paths require:
- iTerm2's "Allow Python API" enabled (Settings → General → Magic).
- Bundle id `com.googlecode.iterm2` (vanilla iTerm.app), NOT
  `com.googlecode.iterm2.iTermAI` (which is a separate fork that
  intercepts plain `tell application "iTerm"` AppleScript calls if
  iTermAI is also installed). The applescript uses `tell application id
  "com.googlecode.iterm2"` to disambiguate.

## Recommended one-time profile setup

For the friendly pane name to be visible, enable per-pane title bars on the
Web Browser profile (one-time UI step):

1. Settings → Profiles → **Web Browser** → General → "Title settings"
2. Tick **"Show Title Bar"**
3. Optional: do the same for your default Profile so the terminal pane also
   has a title bar (then both panes show focus state via title-bar contrast)

## Why focused/unfocused title bars sometimes look the same

iTerm2's "Theme" setting (Settings → Appearance → General → Theme) controls
how strongly focus state is rendered:

- **Light** / **Dark** / **Regular** — focused pane title bar is brightly
  coloured, unfocused ones are dimmed. Strong visible distinction.
- **Compact** / **Minimal** / **Automatic** — focus indicators are
  intentionally desaturated for a "clean" look. Title bars look almost the
  same in both states.

If focus contrast is important, switch to Light or Dark in Settings →
Appearance → General → Theme.

## close_preview.applescript safety

The original `downloads_dev` close script ran "close every session that
isn't `current session`" — but iTerm2 auto-focuses the new split-pane, so
"current session" = the just-created Web Browser pane and the loop tried
to close the user's terminal (with Claude Code in it). Confirmed by user
report.

The current `close_preview.applescript` instead targets sessions where
`tty is missing value` — Web Browser sessions return missing value (no
pty), shell sessions return `/dev/ttys{NN}`. Only Browser panes (and
exited shell-orphans whose tty has been released) are closed; the user's
real terminal session is always preserved.
