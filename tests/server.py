#!/usr/bin/env python3
"""Test-only HTTP server for the ai-maestro-visual-communicator test suite.

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
(ve-select.py) do NOT expose them.

CLI:
    python3 server.py [--port 8767] [--queue /tmp/ve-comments-tests]
"""
from __future__ import annotations

import argparse
import http.server
import json
import re
import socketserver
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urlparse

# threadId / commentId values are interpolated into queue filenames. Restrict
# them to a charset that has no path-separator semantics on any platform so a
# malformed (or hostile) test payload can never escape the queue dir.
_TID_OK = re.compile(r"^[A-Za-z0-9._-]+$")


def _safe_tid(s: str) -> str | None:
    return s if s and _TID_OK.match(s) and ".." not in s else None


def make_handler(root: Path, queue_dir: Path) -> type:
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
                tid = _safe_tid(tid_raw)
                if tid is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad threadId"}')
                    return
                qs = dict(
                    kv.split("=", 1)
                    for kv in (parsed.query or "").split("&")
                    if "=" in kv
                )
                since = int(qs.get("since", "0") or "0")
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
            if p == "/__ve-test-queue-read":
                # TEST-ONLY: return the raw bytes of one queue file. The
                # name parameter is passed through _safe_tid first so a
                # malicious test cannot escape the queue dir via "..".
                qs = dict(
                    kv.split("=", 1)
                    for kv in (parsed.query or "").split("&")
                    if "=" in kv
                )
                raw_name = unquote(qs.get("name", ""))
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
            n = int(self.headers.get("content-length") or 0)
            body = self.rfile.read(n) if n else b""
            try:
                payload = json.loads(body.decode("utf-8")) if body else {}
            except Exception:
                payload = {}

            if p == "/__ve-comment":
                tid = _safe_tid(str(payload.get("threadId") or ""))
                if tid is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad threadId"}')
                    return
                line = (
                    json.dumps({**payload, "role": "user", "at": time.time()}) + "\n"
                )
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
                tid = _safe_tid(str(payload.get("threadId") or ""))
                if tid is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error":"bad threadId"}')
                    return
                # Atomic write: same dance as the renderer's idmap.json so
                # a polling reader never sees a half-written file.
                tmp = queue_dir / f"{tid}.summary.json.tmp"
                final = queue_dir / f"{tid}.summary.json"
                tmp.write_text(json.dumps(payload), encoding="utf-8")
                tmp.replace(final)
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
                return

            if p == "/__ve-test-reply":
                tid = _safe_tid(str(payload.get("threadId") or ""))
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
        default=Path("/tmp/ve-comments-tests"),
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
