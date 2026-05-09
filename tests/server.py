#!/usr/bin/env python3
"""Test-only HTTP server for the ai-maestro-visual-communicator-plugin test suite.

Serves tests/fixtures/ on http://127.0.0.1:8767/
and exposes the same comment endpoints the production runtime expects:

    POST /__ve-comment            — append a JSONL line to <queue>/<tid>.jsonl
    GET  /__ve-reply/<tid>?since= — return the next reply file with turn > since
    POST /__ve-test-reply         — TEST-ONLY: write a reply file from JSON
    POST /__ve-comment-summary    — write <tid>.summary.json (TRDD-7a2dab03 §3.7)
    GET  /__ve-test-queue-list    — TEST-ONLY: list queue dir filenames
    GET  /__ve-test-queue-read    — TEST-ONLY: read raw text of one queue file

The TEST-ONLY endpoints are the only way for the QuickJS dev-browser sandbox
(no FS access) to inspect or inject queue artefacts. Production servers
(amvcp-select.py) do NOT expose them.

CLI:
    python3 server.py [--port 8767] [--queue /tmp/ve-comments-tests]
"""
from __future__ import annotations

import argparse
import http.server
import json
import socketserver
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

# Reuse the same queue helpers the production runner uses. Single source of
# truth for safe-tid validation, atomic JSON writes, and per-tid locking.
# See scripts/_ve_queue.py for the rationale.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from _ve_queue import atomic_write_json, queue_lock, safe_tid  # noqa: E402

# A1 (TRDD-5f41ad36) — content-length DoS bound. A hostile (or buggy)
# client could otherwise stream gigabytes of body bytes into self.rfile.read()
# and OOM the server. Caps below match the production runner in
# scripts/amvcp-select.py — keep the two in sync.
MAX_BODY_SELECT = 2 * 1024 * 1024   # 2 MB for /__ve-select (multi-select payloads)
MAX_BODY_COMMENT = 256 * 1024       # 256 KB for /__ve-comment* (one user turn)


def make_handler(root: Path, queue_dir: Path) -> type:
    # In-memory capture for the most recent /__ve-select POST payload.
    # Tests for the multiselect / table-form / code-gutter overhauls
    # (TRDD-5f41ad36 D1-D5) post to /__ve-select and then GET the
    # /__ve-test-last-select endpoint to assert against the recorded
    # payload. Plain dict so handlers can mutate it across requests.
    last_select: dict[str, object] = {"payload": None}

    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(root), **kw)

        def log_message(self, format, *args):  # noqa: A002 - match base class signature
            del format, args  # quiet by default

        def end_headers(self):
            self.send_header("cache-control", "no-store")
            self.send_header("access-control-allow-origin", "*")
            self.send_header("access-control-allow-methods", "GET, POST, OPTIONS")
            self.send_header("access-control-allow-headers", "content-type")
            super().end_headers()

        def do_OPTIONS(self):
            self.send_response(204)
            self.end_headers()

        def do_GET(self):
            parsed = urlparse(self.path)
            p = parsed.path
            if p.startswith("/__ve-reply/"):
                tid_raw = p[len("/__ve-reply/") :]
                tid = safe_tid(tid_raw)
                if tid is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad threadId"}')
                    return
                # parse_qs handles URL-encoding correctly (`+` → space,
                # `%XX` → byte). Bad `since` falls back to 0 instead of
                # crashing the request with HTTP 500.
                qs = parse_qs(parsed.query or "")
                try:
                    since = int(qs.get("since", ["0"])[0] or "0")
                except (ValueError, TypeError):
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad since"}')
                    return
                cands = sorted(
                    queue_dir.glob(f"{tid}.reply.*.json"),
                    key=lambda x: int(x.stem.rsplit(".", 1)[-1])
                    if x.stem.rsplit(".", 1)[-1].isdigit()
                    else 0,
                )
                for c in cands:
                    try:
                        n = int(c.stem.rsplit(".", 1)[-1])
                    except Exception:
                        continue
                    if n > since:
                        body = c.read_text(encoding="utf-8").encode("utf-8")
                        self.send_response(200)
                        self.send_header("content-type", "application/json")
                        self.send_header("content-length", str(len(body)))
                        self.end_headers()
                        self.wfile.write(body)
                        return
                self.send_response(204)
                self.end_headers()
                return
            if p == "/__ve-test-queue-list":
                # TEST-ONLY: enumerate the queue dir so the QuickJS sandbox
                # (no FS access) can assert against on-disk state.
                names = sorted(x.name for x in queue_dir.iterdir() if x.is_file())
                body = json.dumps({"files": names}).encode("utf-8")
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.send_header("content-length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            if p == "/__ve-test-last-select":
                # TEST-ONLY (TRDD-5f41ad36 D1-D5): return the most recent
                # /__ve-select payload captured by the POST handler. The
                # JS multi-select / table-form / code-gutter tests use
                # this to assert against what the runtime actually sent.
                # `null` if no /__ve-select POST has happened yet.
                body = json.dumps({"payload": last_select.get("payload")}).encode("utf-8")
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.send_header("content-length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            if p == "/__ve-test-reset-last-select":
                # TEST-ONLY: clear the captured payload so a new test
                # case starts from a known empty state.
                last_select["payload"] = None
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
                return
            if p == "/__ve-test-queue-read":
                # TEST-ONLY: return the raw bytes of one queue file. The
                # name parameter is checked separately because it may
                # legitimately contain dots (e.g. `<tid>.summary.json`)
                # — the safe_tid charset would reject the suffix; we
                # accept dots here but explicitly reject `..` and any
                # path separator.
                qs = parse_qs(parsed.query or "")
                raw_name = unquote(qs.get("name", [""])[0])
                # Allow alphanumerics, dot, underscore, hyphen — same charset
                # as _safe_tid plus dot for filename suffixes (.jsonl etc.).
                if not raw_name or ".." in raw_name or "/" in raw_name or "\\" in raw_name:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad name"}')
                    return
                target = queue_dir / raw_name
                if not target.is_file():
                    self.send_response(404)
                    self.end_headers()
                    return
                body = target.read_bytes()
                self.send_response(200)
                self.send_header("content-type", "text/plain; charset=utf-8")
                self.send_header("content-length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            return super().do_GET()

        def do_POST(self):
            p = urlparse(self.path).path
            # A1 — pick the per-endpoint cap BEFORE reading bytes off the
            # wire. /__ve-select carries a multi-select payload (potentially
            # many entries) so it gets the larger ceiling; /__ve-comment*
            # carries one user turn at a time so 256 KB is plenty. An
            # unknown endpoint defaults to the smaller cap (defence in
            # depth — the request will 404 below regardless, but a hostile
            # body sent to a typo'd path must not be allowed to OOM us
            # before the 404 lands).
            if p == "/__ve-select":
                max_body = MAX_BODY_SELECT
            else:
                max_body = MAX_BODY_COMMENT
            try:
                n = int(self.headers.get("content-length") or 0)
            except (ValueError, TypeError):
                n = 0
            if n > max_body:
                self.send_response(413)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"error":"payload too large"}')
                return
            body = self.rfile.read(n) if n else b""
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
            except Exception:
                payload = {}

            if p == "/__ve-comment":
                tid = safe_tid(str(payload.get("threadId") or ""))
                if tid is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad threadId"}')
                    return
                line = (
                    json.dumps({**payload, "role": "user", "at": time.time()}) + "\n"
                )
                # Per-tid lock so concurrent POSTs to the same threadId
                # cannot interleave bytes past PIPE_BUF (4096 on Linux,
                # 512 on macOS). Different tids do not contend.
                with queue_lock(tid):
                    with (queue_dir / f"{tid}.jsonl").open("a", encoding="utf-8") as fh:
                        fh.write(line)
                resp = json.dumps(
                    {"ok": True, "threadId": tid, "queueDir": str(queue_dir)}
                ).encode("utf-8")
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.send_header("content-length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
                return

            if p == "/__ve-comment-summary":
                # TRDD-7a2dab03 §3.7 — runtime POSTs an aggregate summary
                # (decisions + totals + closedAt) when the modal closes.
                # The orchestrator can `cat <tid>.summary.json` to skip
                # replaying every JSONL turn.
                tid = safe_tid(str(payload.get("threadId") or ""))
                if tid is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad threadId"}')
                    return
                # Atomic write: tmp + replace so a polling reader never
                # sees a half-written summary file. Shared helper so the
                # production server cannot drift from this pattern.
                atomic_write_json(queue_dir / f"{tid}.summary.json", payload)
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
                return

            if p == "/__ve-test-reply":
                tid = safe_tid(str(payload.get("threadId") or ""))
                turn = int(payload.get("turn") or 0)
                if tid is None or turn <= 0:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad payload"}')
                    return
                reply = {
                    "turn": turn,
                    "role": "agent",
                    "text": str(payload.get("text") or ""),
                }
                (queue_dir / f"{tid}.reply.{turn}.json").write_text(
                    json.dumps(reply), encoding="utf-8"
                )
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
                return

            if p == "/__ve-select":
                # TRDD-5f41ad36 D1-D5: capture the runtime's selection
                # payload so the JS tests can assert against it. Production
                # behaviour (scripts/amvcp-select.py) is to record the
                # payload in `selection` then set `selection_event`; we
                # just stash it for the next /__ve-test-last-select GET.
                last_select["payload"] = payload
                # A2 (TRDD-5f41ad36) — mirror the production server's
                # X-Browser-Mode handling so the same runtime path works
                # against the test server. The fallback-mode JS test
                # asserts against `thanks_url` in the response.
                mode = (self.headers.get("X-Browser-Mode") or "").lower()
                resp_obj: dict[str, object] = {"ok": True}
                if mode == "fallback":
                    resp_obj["thanks_url"] = "/__ve-thanks"
                resp = json.dumps(resp_obj).encode("utf-8")
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.send_header("content-length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
                return

            self.send_response(404)
            self.end_headers()

    return H


class TS(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8767)
    ap.add_argument(
        "--queue",
        type=Path,
        default=Path(tempfile.gettempdir()) / "ve-comments-tests",
        help="queue directory for /__ve-comment and /__ve-reply",
    )
    ap.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent / "fixtures",
        help="HTTP document root (defaults to tests/fixtures/)",
    )
    args = ap.parse_args()

    args.queue.mkdir(parents=True, exist_ok=True)
    if not args.root.exists():
        print(f"root does not exist: {args.root}", file=sys.stderr)
        return 2

    print(
        f"serving {args.root} on http://127.0.0.1:{args.port} ; queue {args.queue}",
        flush=True,
    )
    handler = make_handler(args.root, args.queue)
    with TS(("127.0.0.1", args.port), handler) as srv:
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
