#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["iterm2"]
# ///
"""Navigate a single iTerm2 Web-Browser session to a URL and set its name.

Invocation: `uv run --quiet --with iterm2 --script <this-script> <args>`.
The PEP 723 inline-script-metadata block above tells uv which dependency
to fetch on first run; uv caches it so subsequent runs are instant.

Why this exists: iTerm2's AppleScript surface has no command to navigate a
Web-Browser session. The official navigation path is the iTerm2 Python API
(`Session.async_load_url`) — `write text URL` only writes to a SHELL
session and silently no-ops on Browser sessions.

Two-tier navigation strategy:

1. **Primary** — `Session.async_load_url(url)` (iTerm2 protocol ≥ 1.12).
   Clean, no side effects, no keyboard race.

2. **Fallback** — keystroke + clipboard. Activates the pane, sends
   Cmd+L (focus URL bar), pastes the URL via Cmd+V (after stashing the
   user's clipboard contents), sends Enter, then restores the clipboard.
   Used when the user's iTerm2 build is older than protocol 1.12 (e.g.
   v3.6.10). Brief clipboard clobber is unavoidable.

Prerequisites for the primary path:
    - iTerm2 v3.5+ with "Allow Python API" enabled in Settings → General →
      Magic. The first invocation triggers a one-time consent prompt;
      after that the user can grant permanent permission.
    - iTerm2 protocol ≥ 1.12 (typically iTerm2 ≥ 3.6.11 or any nightly).

Prerequisites for the fallback:
    - macOS Accessibility permission for osascript (System Settings →
      Privacy & Security → Accessibility). iTerm2 itself usually already
      has it; osascript may also need it on first use.

Invoked from `open_preview.applescript` after it creates the split-pane:
    argv[1] = session UUID (from `id of newPane`)
    argv[2] = complete URL to navigate to (file:// or http://)
    argv[3] = optional friendly pane name (default "amvcp Preview")

Exit codes:
    0 — navigation succeeded (via primary OR fallback)
    1 — both paths failed; one-line `iterm2-nav: <reason>` on stderr.
"""

from __future__ import annotations

import subprocess
import sys
from typing import NoReturn

import iterm2


def _fail(reason: str) -> NoReturn:
    """Print a one-line diagnostic to stderr and exit non-zero.

    Annotated `NoReturn` (it always raises `SystemExit` via `sys.exit`)
    so the type checker knows control never falls through. Without this,
    callers like `_navigate` would be flagged for using `app`/`session`
    after a `_fail(...)` guard that supposedly "returns" — the same
    pattern the sibling `detect_iterm2.py::_fail` already uses.
    """
    print(f"iterm2-nav: {reason}", file=sys.stderr)
    sys.exit(1)


def _keystroke_navigate(url: str) -> bool:
    """Fallback navigation via clipboard + Cmd+L + Cmd+V + Enter.

    Used when `async_load_url` is unavailable. The pane that was just
    created via `split vertically` is the focused pane (iTerm2's default
    behaviour), so System Events keystrokes go to that pane.

    Returns True on success, False on AppleScript failure. Prints any
    error to stderr.

    Side effect: temporarily clobbers the user's clipboard. We try to
    save + restore it via pbpaste/pbcopy, but the user has a ~200 ms
    window where their clipboard is the URL.
    """
    # Stash existing clipboard content so we can restore it after.
    saved = subprocess.run(
        ["pbpaste"], capture_output=True, check=False,
    ).stdout
    # Set the URL on the clipboard.
    subprocess.run(["pbcopy"], input=url.encode("utf-8"), check=False)
    # Drive iTerm2 via System Events. Cmd+L = focus URL bar in
    # iTerm2 Browser sessions. Cmd+V = paste. key code 36 = Return.
    applescript = """
    tell application "System Events"
        tell process "iTerm2"
            keystroke "l" using command down
            delay 0.05
            keystroke "v" using command down
            delay 0.05
            key code 36
        end tell
    end tell
    """
    result = subprocess.run(
        ["osascript", "-e", applescript],
        capture_output=True,
        text=True,
        check=False,
    )
    # Best-effort restore of the original clipboard. Brief race window
    # (~200 ms) where the URL is still on the clipboard before this
    # restore lands — but better than leaving the URL there forever.
    subprocess.run(["pbcopy"], input=saved, check=False)
    if result.returncode != 0:
        print(
            f"iterm2-nav: keystroke fallback failed: {result.stderr.strip()!r}",
            file=sys.stderr,
        )
        return False
    return True


async def _navigate(connection: iterm2.Connection, session_id: str,
                    url: str, name: str) -> None:
    app = await iterm2.async_get_app(connection)
    if app is None:
        _fail("iterm2.async_get_app returned None — Python API not reachable")
    session = app.get_session_by_id(session_id)
    if session is None:
        _fail(
            f"no session with id {session_id!r} — pane may have been closed "
            "between split-create and navigation",
        )
    # Set the friendly pane name FIRST so it is visible briefly even if
    # the load fails (e.g. user typo in URL). iTerm2's Web-Browser session
    # later overwrites the name with the loaded page's <title>, but the
    # initial value still shows in the per-pane title bar before the page
    # finishes rendering.
    try:
        await session.async_set_name(name)
    except Exception as exc:  # noqa: BLE001 — best-effort cosmetic
        print(f"iterm2-nav: set_name warning ({exc!r}) — proceeding",
              file=sys.stderr)
    # Try the primary navigation method. Two failure modes need the
    # keystroke fallback:
    #   1. AppVersionTooOld — iTerm2 protocol < 1.12 (e.g. v3.6.10).
    #   2. RPCException "Invalid URL" — iTerm2's Browser API enforces a
    #      WebKit security policy that rejects `file://` (and probably
    #      other non-http(s)) URLs even though they're valid URLs.
    #      The keystroke path bypasses the API and pastes directly into
    #      the URL bar, where WebKit happily loads file:// URLs.
    # Any other RPC error (e.g. genuine network failure) is surfaced.
    fallback_reason: str | None = None
    try:
        await session.async_load_url(url)
    except iterm2.capabilities.AppVersionTooOld:
        fallback_reason = (
            "iTerm2 too old for async_load_url (needs protocol ≥ 1.12)"
        )
    except iterm2.rpc.RPCException as exc:
        msg = str(exc)
        if "Invalid URL" in msg:
            # file:// URLs and similar — Browser API security policy.
            fallback_reason = f"async_load_url rejected URL ({msg})"
        else:
            # Other RPC errors (e.g. session vanished) — fatal.
            _fail(f"async_load_url RPC error: {msg}")
    if fallback_reason is not None:
        # Activate the pane first so the keystrokes definitely go to it.
        # split-vertically auto-focuses the new pane in iTerm2 by default,
        # but make it explicit in case the user has changed that.
        try:
            await session.async_activate()
        except Exception:  # noqa: BLE001 — non-fatal
            pass
        if not _keystroke_navigate(url):
            _fail(
                f"{fallback_reason} AND keystroke fallback also failed — "
                "grant osascript Accessibility permission so the "
                "fallback keystrokes can reach iTerm2, or use an http "
                "URL (serve the file locally) instead of file://",
            )


def main() -> None:
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        _fail(
            "usage: navigate_iterm2_browser_pane.py "
            "<session-uuid> <url> [<friendly-name>]",
        )
    session_id = sys.argv[1]
    url = sys.argv[2]
    name = sys.argv[3] if len(sys.argv) >= 4 else "amvcp Preview"

    try:
        iterm2.run_until_complete(
            lambda conn: _navigate(conn, session_id, url, name),
        )
    except SystemExit:
        # Re-raise so the exit code propagates — _fail() uses sys.exit.
        raise
    except Exception as exc:  # noqa: BLE001 — surface any failure cleanly
        # Catch the broad case so we never leave a stack-trace garble in
        # the calling AppleScript's stderr. iterm2 has no public top-level
        # ConnectionError class — every connection failure surfaces as
        # SystemExit:1 from inside iterm2.connection.async_connect, which
        # the iterm2.run_until_complete call wraps. We catch the whole
        # bag here.
        _fail(f"unexpected error: {exc!r}")


if __name__ == "__main__":
    main()
