"""Shared helpers for the v2 modal-comment queue.

Used by BOTH the production runner (`scripts/amvcp-select.py`) and the test
HTTP server (`tests/server.py`) so the two implementations cannot drift —
TRDD-1dcd0bd7 §A1/A2/A3 and the audit's CLAUDE.md "Test the LIVE production
bundle, not a vendor snapshot" rule.

The three primitives exposed here:

  - `safe_tid(s)` — sanitises threadId/commentId values that get
    interpolated into queue filenames. Refuses anything outside the
    `[A-Za-z0-9._-]` charset and rejects literal `..` substrings, so a
    malicious page POST cannot escape the queue dir on any platform.

  - `queue_lock(tid)` — returns a per-tid `threading.Lock`. Held while a
    JSONL line is being appended so concurrent writes from
    `ThreadingTCPServer` worker threads cannot interleave bytes past
    the POSIX PIPE_BUF atomicity boundary (4096 on Linux, 512 on macOS).

  - `atomic_write_json(path, payload)` — writes `payload` to a sibling
    `.tmp` file then atomically renames it onto `path`. The same
    pattern that the test server uses for `<tid>.summary.json` so a
    polling reader never sees a half-written JSON file.
"""
from __future__ import annotations

import json
import re
import threading
from pathlib import Path
from typing import Any
from weakref import WeakValueDictionary

# threadId / commentId values are interpolated into queue filenames. Restrict
# them to a charset that has no path-separator semantics on any platform so a
# malformed (or hostile) payload can never escape the queue dir. The explicit
# `..` reject is belt-and-braces: the regex already excludes `/` and `\`,
# but a bare `..` would still let `../foo` become a filename like
# `..__foo.jsonl` if the regex were ever loosened.
_TID_OK = re.compile(r"^[A-Za-z0-9._-]+$")


def safe_tid(s: str) -> str | None:
    """Return `s` if it is a safe threadId/commentId, else None.

    Caller is expected to send HTTP 400 on a None result. We deliberately
    do NOT raise — the calling Handler turns this into a clean rejection
    response without a Python traceback.
    """
    return s if s and _TID_OK.match(s) and ".." not in s else None


# Per-tid Lock registry. Using a WeakValueDictionary so a Lock that is no
# longer referenced (no in-flight write to that tid) is garbage-collected
# automatically — the registry never grows unbounded. The outer lock
# protects the registry itself from concurrent insertion races (without it,
# two threads writing to the same brand-new tid could each create their own
# Lock and serialise nothing).
_locks: WeakValueDictionary[str, threading.Lock] = WeakValueDictionary()
_locks_guard = threading.Lock()


def queue_lock(tid: str) -> threading.Lock:
    """Return the per-tid Lock used to serialise JSONL appends for `tid`.

    Two requests writing to the same tid will block each other; requests
    for different tids do not contend. Held briefly (one short append),
    so contention is microsecond-level even under heavy concurrent load.
    """
    with _locks_guard:
        existing = _locks.get(tid)
        if existing is not None:
            return existing
        new = threading.Lock()
        _locks[tid] = new
        return new


def atomic_write_json(path: Path, payload: Any) -> None:
    """Write `payload` (any JSON-serialisable object) to `path` atomically.

    The write goes to `<path>.tmp` first, then `Path.replace()` does the
    rename — which on POSIX and on Windows (Python 3.3+) is an atomic
    operation on the same filesystem. A reader polling `path` will see
    either the old content (or no file) or the fully-written new content;
    never a half-written intermediate.
    """
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload), encoding="utf-8")
    tmp.replace(path)
