#!/usr/bin/env python3
"""Detect whether the current shell is running inside a real, native iTerm2
session — not Terminal.app, WezTerm, Alacritty, Kitty, VS Code, Cursor,
tmux, screen, an SSH session, a web/cloud terminal (Codespaces, Gitpod,
Replit, Jupyter, StackBlitz), Claude Desktop, or anything else that might
spoof an iTerm-looking environment.

Exit 0 when iTerm2 is verified. Exit 1 with a one-line stderr message
otherwise. SKILL.md's open-preview workflow runs this as Step 0 and aborts
on any non-zero exit instead of dispatching the AppleScript split.

The reason iTerm spoofing matters: the open_preview.applescript opens a
vertical split-pane via `tell application "iTerm"`. If invoked under a
non-iTerm host, osascript either fails (no iTerm.app), opens a brand-new
iTerm window unrelated to the user's terminal (jarring UX), or — worst
case — silently succeeds against an iTerm window the user can't see
(e.g. when running under tmux/screen the split lands in the underlying
iTerm tab behind the multiplexer).

Eight checks, in order of cheapness:
  1. macOS only            (iTerm2 is macOS-native)
  2. real TTY              (subprocess hosts like Claude Desktop fail this)
  3. tmux/screen guard     (multiplexers split the wrong tab)
  4. SSH guard             (iTerm2.app is on the origin machine, not here)
  5. VS Code / Cursor      ($TERM_PROGRAM=vscode / Cursor)
  6. web/cloud terminals   (Codespaces, Gitpod, Replit, Jupyter, StackBlitz)
  7. positive iTerm vars   ($TERM_PROGRAM, $LC_TERMINAL, $ITERM_SESSION_ID)
  8. live osascript probe  (iTerm2.app process actually running)

Step 8 defends against the all-too-common case where a hostile or
misconfigured shell spoofs steps 1-7's env vars.
"""

from __future__ import annotations

import os
import platform
import subprocess
import sys
from typing import NoReturn


def _fail(reason: str) -> NoReturn:
    """Print a one-line `NOT-iTerm2: <reason>` to stderr and exit 1."""
    print(f"NOT-iTerm2: {reason}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    # 1. macOS-only — iTerm2 binaries don't exist on Linux/Windows
    if platform.system() != "Darwin":
        _fail(f"OS is {platform.system()!r}, iTerm2 only runs on macOS")

    # 2. Real TTY — Claude Desktop, web hosts, CI runners pipe stdout into a
    # parent process that isn't a terminal, so the user can't even see what
    # gets printed in the split-pane
    if not sys.stdout.isatty():
        _fail(
            "stdout is not a TTY (likely a subprocess of a non-terminal "
            "host like Claude Desktop, a web app, or a CI runner)"
        )

    # 3. Multiplexer guards — these can pass through iTerm vars but the
    # AppleScript split-pane operation lands in the bare iTerm tab behind
    # the multiplexer, NOT the pane the user sees inside tmux/screen
    if os.environ.get("TMUX"):
        _fail(
            "running inside tmux ($TMUX is set) — the AppleScript split "
            "would land behind the multiplexer, invisible to the user"
        )
    if os.environ.get("STY"):
        _fail("running inside GNU screen ($STY is set) — same issue as tmux")

    # 4. SSH guard — iTerm sets $TERM_PROGRAM=iTerm.app and friends on the
    # origin shell, and these get inherited across `ssh`. So the remote
    # shell looks iTerm-shaped but iTerm2.app is on a different machine
    if os.environ.get("SSH_TTY") or os.environ.get("SSH_CONNECTION"):
        _fail(
            "running inside an SSH session ($SSH_TTY / $SSH_CONNECTION set) "
            "— iTerm2.app is on the origin machine, not on this host"
        )

    # 5. VS Code / Cursor / their forks — set $TERM_PROGRAM=vscode but may
    # also inherit upstream iTerm vars on some setups
    term_program = os.environ.get("TERM_PROGRAM", "")
    if term_program == "vscode" or os.environ.get("VSCODE_INJECTION"):
        _fail(
            f"running inside VS Code's integrated terminal "
            f"($TERM_PROGRAM={term_program!r})"
        )
    if term_program == "Cursor" or os.environ.get("CURSOR_CHANNEL"):
        _fail(
            f"running inside Cursor's integrated terminal "
            f"($TERM_PROGRAM={term_program!r})"
        )

    # 6. Web / cloud terminals — many set $TERM_PROGRAM= to mimic a native
    # terminal but the underlying host is xterm.js / hterm in a browser
    web_term_vars = {
        "JUPYTER_SERVER_ROOT": "Jupyter Notebook",
        "JUPYTER_TOKEN": "Jupyter Notebook",
        "CODESPACES": "GitHub Codespaces",
        "GITHUB_CODESPACE_TOKEN": "GitHub Codespaces",
        "GITPOD_WORKSPACE_ID": "Gitpod",
        "GITPOD_REPO_ROOT": "Gitpod",
        "REPL_SLUG": "Replit",
        "REPL_OWNER": "Replit",
        "STACKBLITZ_ENV": "StackBlitz",
    }
    for var, host in web_term_vars.items():
        if os.environ.get(var):
            _fail(f"web/cloud terminal detected: {host} (${var} is set)")

    # 7. Positive iTerm2 markers — all three are required; presence of any
    # subset usually means a host spoofing $TERM_PROGRAM
    if term_program != "iTerm.app":
        _fail(
            f"$TERM_PROGRAM is {term_program!r}, not 'iTerm.app' — likely "
            "Terminal.app, WezTerm, Alacritty, Kitty, Hyper, Warp, or a "
            "non-iTerm host"
        )
    if os.environ.get("LC_TERMINAL") != "iTerm2":
        _fail(
            f"$LC_TERMINAL is {os.environ.get('LC_TERMINAL')!r}, not "
            "'iTerm2' (real iTerm2 sets this automatically)"
        )
    if not os.environ.get("ITERM_SESSION_ID"):
        _fail(
            "$ITERM_SESSION_ID is not set (real iTerm2 sets this for "
            "every session — its absence usually means a terminal spoofing "
            "$TERM_PROGRAM)"
        )

    # 8. Live AppleScript probe — verifies iTerm2.app is actually running
    # AND osascript can talk to it. Defends against a shell spoofing
    # every env var above
    try:
        result = subprocess.run(
            [
                "osascript",
                "-e",
                'tell application "System Events" to '
                '(name of processes) contains "iTerm2"',
            ],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except FileNotFoundError:
        _fail("osascript is not on PATH — should be impossible on macOS")
    except subprocess.TimeoutExpired:
        _fail("osascript probe timed out after 5s")
    if result.returncode != 0:
        _fail(
            f"osascript probe exit={result.returncode}, "
            f"stderr={result.stderr.strip()!r}"
        )
    if "true" not in result.stdout.lower():
        _fail(
            "iTerm2.app process not detected via System Events — env vars "
            "claim iTerm2 but the application is not running"
        )

    # All 8 checks passed
    print(
        "iTerm2 verified: "
        f"TERM_PROGRAM=iTerm.app, "
        f"LC_TERMINAL=iTerm2, "
        f"ITERM_SESSION_ID={os.environ['ITERM_SESSION_ID']}, "
        f"profile={os.environ.get('ITERM_PROFILE', '<unknown>')!r}"
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
