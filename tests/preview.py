#!/usr/bin/env python3
"""One-shot visual preview of a test fixture in an iTerm2 split-pane.

Usage:
    tests/preview.py                      # default fixture: table-form-multi
    tests/preview.py multiselect          # fixture stem (no .html needed)
    tests/preview.py table-form-single

Workflow (single command, no manual steps):
  1. Sync the production runtime + regex bundles into fixtures/ so the
     preview reflects the LATEST scripts/amvcp-runtime.js (techniques.md
     #7: never test against a vendor snapshot).
  2. Bind a free localhost port (8767 first, then walk forward) and start
     a SimpleHTTPServer in a background thread, rooted at fixtures/.
  3. If running inside a real iTerm2 TTY (per detect_iterm2.py): open the
     URL in a vertical split-pane via the existing Web Browser AppleScript.
     Otherwise: fall back to `open <url>` (macOS default browser).
  4. Block until Ctrl-C, then close the preview pane + stop the server.

Total wall-time on a warm machine: ~1-2 s (most of it is iTerm2's split
animation). End-user types nothing else — no osascript paths, no port
numbers, no manual sync.
"""

from __future__ import annotations

import http.server
import os
import platform
import shutil
import signal
import socket
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PLUGIN_ROOT = ROOT.parent
FIXTURES = ROOT / "fixtures"
PREVIEW_SKILL = PLUGIN_ROOT / "skills" / "amvcp-iterm2-preview" / "scripts"
OPEN_AS = PREVIEW_SKILL / "open_preview.applescript"
CLOSE_AS = PREVIEW_SKILL / "close_preview.applescript"

DEFAULT_FIXTURE = "table-form-multi"
PORT_START = 8767


def sync_runtime() -> None:
    """Copy production runtime + regex bundles into fixtures/ so the
    preview reflects the live scripts/ source, not a stale snapshot."""
    src = PLUGIN_ROOT / "scripts"
    for name in ("amvcp-runtime.js", "amvcp-regex.umd.js", "amvcp-regex.css"):
        s, d = src / name, FIXTURES / name
        if s.exists():
            shutil.copy2(s, d)


def find_free_port(start: int = PORT_START) -> int:
    """Walk forward from `start` until an unbound port is found."""
    for p in range(start, start + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    raise RuntimeError(f"no free port in {start}..{start + 99}")


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Fixtures-rooted static handler. Suppresses per-request log noise
    so the terminal stays focused on preview state, not GETs."""

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(FIXTURES), **kw)

    def log_message(self, *args, **kwargs) -> None:  # pyright: ignore[reportUnusedParameter]
        del args, kwargs


def start_server(port: int) -> socketserver.ThreadingTCPServer:
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", port), _QuietHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def is_iterm2() -> bool:
    """Return True iff we should target the iTerm2 split-pane.

    The canonical skill detect_iterm2.py is too strict for this preview
    workflow: its step-2 TTY check rejects any subprocess where stdout
    isn't a real terminal. When the user runs `python3 tests/preview.py`
    via Claude Code's `!` prefix, stdout is piped (not a TTY) — but the
    iTerm2.app, the env vars, and the split-pane mechanism are all still
    real. We do a lighter sniff that's appropriate when we only need to
    KNOW the host, not WRITE to its TTY:
      1. macOS only (iTerm2 is macOS-native).
      2. Any of $TERM_PROGRAM=iTerm.app / $LC_TERMINAL=iTerm2 /
         $ITERM_SESSION_ID — at least one means the host shell was
         spawned by iTerm2 (env propagates through Claude Code's `!`).
      3. Reject tmux / screen / SSH / VS Code / Cursor — split-pane
         lands in the wrong window or has no host iTerm2 to split.
      4. Live osascript probe — iTerm2.app actually running.
    """
    if platform.system() != "Darwin":
        return False
    if (os.environ.get("TMUX") or os.environ.get("STY")
            or os.environ.get("SSH_CONNECTION")
            or os.environ.get("TERM_PROGRAM") in ("vscode", "Cursor")):
        return False
    has_env = (
        os.environ.get("TERM_PROGRAM") == "iTerm.app"
        or os.environ.get("LC_TERMINAL") == "iTerm2"
        or bool(os.environ.get("ITERM_SESSION_ID"))
    )
    if not has_env:
        return False
    r = subprocess.run(
        ["osascript", "-e",
         'tell application "System Events" to '
         '(name of processes) contains "iTerm2"'],
        capture_output=True, text=True,
    )
    return r.returncode == 0 and r.stdout.strip().lower() == "true"


def open_in_iterm2(url: str) -> bool:
    r = subprocess.run(
        ["osascript", str(OPEN_AS), url],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        return False
    return True


def close_in_iterm2() -> None:
    if CLOSE_AS.exists():
        subprocess.run(["osascript", str(CLOSE_AS)], capture_output=True)


def main() -> int:
    raw = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_FIXTURE
    fixture = raw.removesuffix(".html")
    html = FIXTURES / f"{fixture}.html"
    if not html.exists():
        print(f"fixture not found: {html}", file=sys.stderr)
        print("available fixtures:", file=sys.stderr)
        for h in sorted(FIXTURES.glob("*.html")):
            print(f"  {h.stem}", file=sys.stderr)
        return 1

    sync_runtime()
    port = find_free_port()
    httpd = start_server(port)
    url = f"http://localhost:{port}/{fixture}.html"

    print(f"serving {FIXTURES} on http://localhost:{port}")
    print(f"opening: {url}")

    used_iterm = is_iterm2() and open_in_iterm2(url)
    if used_iterm:
        print("iTerm2 split-pane open. Ctrl-C to close + stop server.")
    else:
        subprocess.run(["open", url], check=False)
        print("opened in default browser. Ctrl-C to stop server.")

    done = threading.Event()

    def cleanup(*_):
        if done.is_set():
            return
        done.set()
        print("\nclosing preview + stopping server…")
        if used_iterm:
            close_in_iterm2()
        httpd.shutdown()

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    done.wait()
    return 0


if __name__ == "__main__":
    sys.exit(main())
