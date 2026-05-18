#!/usr/bin/env python3
"""amvcp-show-launcher.py — iTerm-first wrapper around amvcp-select.py.

Why this script exists
----------------------

`amvcp-select.py` (in the plugin cache) DOES have an iTerm-or-Chromium
dispatch path, gated on a `detect_iterm2.py` script that runs eight
safety checks. Check #2 is `sys.stdout.isatty()` — this defends against
Claude Desktop / web app / CI runner contexts where the iTerm split
would be invisible to the user.

BUT when the orchestrator (Claude Code) launches a subprocess, the
subprocess's stdout is captured by the parent and `isatty()` returns
False — even when the *parent* runs inside iTerm and the user can see
the split. This caused the previous session's Safari spawn.

This wrapper does iTerm detection WITHOUT the isatty check (via the
canonical $TERM_PROGRAM / $LC_TERMINAL / $ITERM_SESSION_ID triple) and,
when iTerm is verified, sets `VE_SELECT_NO_BROWSER=1` so amvcp-select.py
serves the page on localhost without spawning Chromium; we then invoke
the plugin's `open_preview.applescript` directly to land the URL in an
iTerm vertical split-pane. The user gets the real interactive selection
flow inside iTerm, not a separate browser window.

Falls back to plain `amvcp-select.py` invocation (Chromium or system
default browser) when iTerm is NOT detected.
"""

from __future__ import annotations

import os
import pathlib
import platform
import re
import subprocess
import sys
import threading
import time

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Plugin location. We hard-code 1.2.11 since that's the version currently
# shipping the iterm2-preview scripts; the launcher could discover the
# highest version installed but for now this stays explicit.
PLUGIN_ROOT = pathlib.Path(
    "/Users/emanuelesabetta/.claude/plugins/cache/ai-maestro-plugins/"
    "ai-maestro-visual-communicator-plugin/1.2.11"
)
SELECT_SCRIPT = PLUGIN_ROOT / "scripts" / "amvcp-select.py"
ITERM_PREVIEW_SKILL = PLUGIN_ROOT / "skills" / "amvcp-iterm2-preview"
OPEN_PREVIEW_SCRIPT = ITERM_PREVIEW_SKILL / "scripts" / "open_preview.applescript"
NAV_BROWSER_SCRIPT = ITERM_PREVIEW_SKILL / "scripts" / "navigate_iterm2_browser_pane.py"


def is_iterm_session() -> bool:
    """Detect iTerm WITHOUT the isatty check that fails under Claude Code.

    Returns True when running inside a real, native iTerm2 session as
    verified by the canonical env-var triple. Returns False under
    Terminal.app, WezTerm, Alacritty, Kitty, tmux, screen, SSH, web/cloud
    terminals, or any non-Darwin host.
    """
    if platform.system() != "Darwin":
        return False
    if os.environ.get("TERM_PROGRAM") != "iTerm.app":
        return False
    if os.environ.get("LC_TERMINAL") != "iTerm2":
        return False
    if not os.environ.get("ITERM_SESSION_ID"):
        return False
    # Multiplexer / SSH guards — these can pass through the env vars
    # above but the AppleScript split-pane would land in the wrong place.
    if os.environ.get("TMUX") or os.environ.get("STY"):
        return False
    if os.environ.get("SSH_TTY") or os.environ.get("SSH_CONNECTION"):
        return False
    return True


def _fallback_to_select_py(args: list[str]) -> int:
    """Delegate to plain amvcp-select.py — picks Chromium / default browser."""
    print(
        "[amvcp-show-launcher] iTerm not detected — falling back to "
        "amvcp-select.py (Chromium / default browser)",
        file=sys.stderr,
    )
    cmd = ["python3", str(SELECT_SCRIPT)] + args
    return subprocess.call(cmd)


def _run_open_preview(url: str) -> str | None:
    """Invoke open_preview.applescript with the URL.

    Returns the iTerm session UUID of the new pane (parsed from stdout)
    or None on failure.
    """
    if not OPEN_PREVIEW_SCRIPT.exists():
        print(
            f"[amvcp-show-launcher] open_preview.applescript not found at "
            f"{OPEN_PREVIEW_SCRIPT} — cannot use iTerm split-pane",
            file=sys.stderr,
        )
        return None
    try:
        result = subprocess.run(
            ["osascript", str(OPEN_PREVIEW_SCRIPT), url],
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        print(
            f"[amvcp-show-launcher] osascript invocation failed: {exc}",
            file=sys.stderr,
        )
        return None
    if result.returncode != 0:
        print(
            f"[amvcp-show-launcher] open_preview.applescript exit="
            f"{result.returncode}, stderr={result.stderr.strip()!r}",
            file=sys.stderr,
        )
        return None
    # Parse the session UUID from stdout — the applescript prints
    # something like "session_id=ABCDEF..." or just the UUID on its own
    # line. Defensive: accept either format.
    out = result.stdout.strip()
    m = re.search(r"[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}", out)
    return m.group(0) if m else out or None


def _launch_iterm_path(args: list[str]) -> int:
    """iTerm-first path: set VE_SELECT_NO_BROWSER, run amvcp-select.py in
    a background thread, ping its served URL to discover the port, open
    iTerm split-pane to that URL, wait for the select script to exit.

    amvcp-select.py with VE_SELECT_NO_BROWSER=1 still serves the file +
    accepts POSTs to /__ve-select; it just doesn't spawn a browser.
    """
    env = os.environ.copy()
    env["VE_SELECT_NO_BROWSER"] = "1"
    # Also disable iTerm dispatch INSIDE amvcp-select.py — we'll launch
    # the pane ourselves so we control timing + pane reuse. Without this
    # double-block, amvcp-select.py would silently no-op on iterm
    # (detect_iterm2 isatty fails) BUT we want clear semantics: this
    # launcher owns iTerm dispatch, the select script just serves HTTP.
    env["VE_SELECT_NO_ITERM"] = "1"

    # Run amvcp-select.py as a child; capture its stderr so we can
    # extract the served URL it prints.
    cmd = ["python3", str(SELECT_SCRIPT)] + args
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
    )

    served_url: str | None = None
    iterm_session_id: str | None = None
    stdout_lines: list[str] = []
    stderr_lines: list[str] = []

    def _drain(stream, sink, also_print_stderr: bool):
        for line in iter(stream.readline, ""):
            sink.append(line)
            if also_print_stderr:
                # Echo stderr to our own stderr so the user sees progress.
                print(line, end="", file=sys.stderr)
        stream.close()

    threading.Thread(target=_drain, args=(proc.stdout, stdout_lines, False), daemon=True).start()
    threading.Thread(target=_drain, args=(proc.stderr, stderr_lines, True), daemon=True).start()

    # Wait for the "listening at" stderr line — amvcp-select.py prints
    # that EXACTLY when VE_SELECT_NO_BROWSER=1 (line 889 of the script).
    deadline = time.time() + 8
    url_pattern = re.compile(r"listening at (http://127\.0\.0\.1:\d+/\S+)")
    while time.time() < deadline:
        for line in stderr_lines:
            m = url_pattern.search(line)
            if m:
                served_url = m.group(1)
                break
        if served_url:
            break
        if proc.poll() is not None:
            # Select script exited before serving — output its stdout
            # (which is our return payload) and bail.
            sys.stdout.write("".join(stdout_lines))
            return proc.returncode or 1
        time.sleep(0.05)

    if not served_url:
        print(
            "[amvcp-show-launcher] amvcp-select.py never printed its URL — "
            "killing and bailing",
            file=sys.stderr,
        )
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()
        sys.stdout.write("".join(stdout_lines))
        return 1

    print(
        f"[amvcp-show-launcher] amvcp-select.py serving at {served_url}, "
        f"opening iTerm split-pane",
        file=sys.stderr,
    )

    iterm_session_id = _run_open_preview(served_url)
    if iterm_session_id is None:
        print(
            "[amvcp-show-launcher] iTerm pane launch failed — the page is "
            f"available at {served_url} but you must open it manually",
            file=sys.stderr,
        )
        # Don't bail — let amvcp-select.py continue serving so a manual
        # open still works.

    # Wait for amvcp-select.py to exit (user submitted / exited / timed out).
    try:
        proc.wait()
    except KeyboardInterrupt:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

    # Echo the JSON payload amvcp-select.py printed.
    sys.stdout.write("".join(stdout_lines))
    return proc.returncode or 0


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(
            "usage: amvcp-show-launcher.py <file.html> [--timeout=SEC]",
            file=sys.stderr,
        )
        return 2

    html_path = pathlib.Path(args[0]).expanduser().resolve()
    if not html_path.is_file():
        print(
            f"[amvcp-show-launcher] file not found: {html_path}",
            file=sys.stderr,
        )
        return 2

    if not SELECT_SCRIPT.exists():
        print(
            f"[amvcp-show-launcher] amvcp-select.py not found at "
            f"{SELECT_SCRIPT} — check plugin version",
            file=sys.stderr,
        )
        return 2

    if is_iterm_session():
        print(
            "[amvcp-show-launcher] iTerm detected — using split-pane preview",
            file=sys.stderr,
        )
        return _launch_iterm_path(args)
    return _fallback_to_select_py(args)


if __name__ == "__main__":
    sys.exit(main())
