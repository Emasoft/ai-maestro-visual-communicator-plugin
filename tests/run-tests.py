#!/usr/bin/env python3
"""ai-maestro-visual-communicator-plugin test orchestrator.

Starts the test server, syncs fresh runtime + regex bundles into
fixtures/, runs every dev-browser test script under scripts/, parses
the `TEST | name | status | desc | detail` lines they print, and
renders a Unicode-bordered results table.

Usage:
    cd tests && python3 run-tests.py
    or via the wrapper:  ./run-all-tests.py

Exits 0 only if every test PASSes. Any FAIL or ERROR aborts with
exit 1 so CI gates stay simple.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Plugin lives at the repo root after the v1.0.0 flatten — there is no
# longer a plugins/<name>/ subdirectory, so PLUGIN_ROOT == repo root,
# and PROJECT_ROOT (the cwd for the renderer subprocess) is the same.
PLUGIN_ROOT = ROOT.parent
PROJECT_ROOT = PLUGIN_ROOT
FIXTURES = ROOT / "fixtures"
SCRIPTS = ROOT / "scripts"
# B4 — tempfile.gettempdir() resolves to /tmp on POSIX and to the
# user's TEMP/TMP dir on Windows (where /tmp does not exist).
QUEUE = Path(tempfile.gettempdir()) / "ve-comments-tests"
PORT = 8767


def sync_runtime_into_fixtures() -> None:
    """Copy the production runtime + engine bundles into fixtures/.

    The fixtures HTML uses bare relative URLs (`<script src="amvcp-runtime.js">`,
    `<script src="amvcp-designmd.js">`) so the bundles must sit beside the
    HTML files. This is the same dance `tests_dev/` does — we replicate it
    under tests/ so the runner is fully self-contained.

    `amvcp-designmd.js` (the Phase-1b DESIGN.md style engine) is included
    so the engine fixtures load the current source even on a checkout
    where the `fixtures/amvcp-designmd.js` symlink is absent. When the
    symlink IS present it already points at the source, so the copy is
    skipped (it would otherwise be a no-op SameFileError).
    """
    src = PLUGIN_ROOT / "scripts"
    for name in (
        "amvcp-runtime.js",
        "amvcp-designmd.js",
        "amvcp-regex.umd.js",
        "amvcp-regex.css",
        # design-tokens (Phase 2 Build #1) bundles — the token-sheet
        # fixture loads them as co-located <script>/<link> URLs, so they
        # must sit beside the HTML the same way the runtime does.
        "amvcp-tokens.js",
        "amvcp-token-sheet.js",
        "amvcp-tokens.css",
        # Phase 2 modules whose fixtures use bare-name <script src="…">
        # but whose fixtures/ entries are NON-SYMLINK copies committed
        # before the symlink convention was established. Without this
        # sync, edits to scripts/amvcp-{tables,interactive,layout}.js
        # silently fail to reach the test page.
        "amvcp-tables.js",
        "amvcp-interactive.js",
        "amvcp-interactive.css",
        "amvcp-layout.js",
        "amvcp-layout.css",
        # Pierre diff viewer (vendored — Apache-2.0). Single-file ESM
        # bundle built by `vendor/pierre-diffs/scripts/bundle.mjs`. The
        # pierre-diff fixture loads it via <script type="module" src=...>.
        # Large file (~10 MB) — only synced when present so test runs on
        # a clean checkout still work even if the contributor hasn't run
        # `bun run build:bundle` yet.
        "amvcp-pierre-diff.mjs",
    ):
        s = src / name
        d = FIXTURES / name
        if not s.exists():
            continue
        # When `d` is a symlink back to `s` (the checked-in fixtures
        # symlink), source and destination are the same file — skip to
        # avoid shutil.SameFileError and to leave the symlink intact.
        if d.exists() and d.resolve() == s.resolve():
            continue
        shutil.copy2(s, d)


def regenerate_sample_report() -> None:
    """Re-run render-interactive-report on fixtures/sample-report.md.

    This produces fresh sample-report.html + sample-report.idmap.json
    so the comment-modal tests always reflect the current renderer.
    """
    md = FIXTURES / "sample-report.md"
    if not md.exists():
        return
    renderer = PLUGIN_ROOT / "scripts" / "render-interactive-report.py"
    # B3 — prefer `uv run` when uv is on PATH (it manages the venv);
    # otherwise fall back to the current Python interpreter so a fresh
    # Windows clone or a tightly-scoped CI runner without uv still
    # works. Same pattern as publish.py:_gate_tests already uses.
    uv_bin = shutil.which("uv")
    if uv_bin:
        cmd = [
            uv_bin,
            "run",
            "--quiet",
            str(renderer),
        ]
    else:
        cmd = [sys.executable, str(renderer)]
    cmd += [
        "--report",
        str(md),
        "--out",
        str(FIXTURES / "sample-report.html"),
        "--mode",
        "auto",
        "--runtime-url",
        "amvcp-runtime.js",
    ]
    # F-13 (audit MAJOR follow-up touched here for clarity): capture
    # stderr so a renderer crash gives a usable error instead of a
    # bare "subprocess returned non-zero". check=False + manual exit
    # for a clean message.
    proc = subprocess.run(
        cmd,
        check=False,
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT),
    )
    if proc.returncode != 0:
        sys.stderr.write(
            "[run-tests] regenerate_sample_report failed "
            f"(exit {proc.returncode}). stderr:\n{proc.stderr}\n"
        )
        sys.exit(2)


def clean_queue() -> None:
    if QUEUE.exists():
        for p in QUEUE.iterdir():
            try:
                p.unlink()
            except IsADirectoryError:
                shutil.rmtree(p, ignore_errors=True)
    else:
        QUEUE.mkdir(parents=True, exist_ok=True)


def wait_for_server(timeout_s: float = 10.0) -> bool:
    end = time.time() + timeout_s
    url = f"http://127.0.0.1:{PORT}/regex-vis-all-panels.html"
    while time.time() < end:
        try:
            with urllib.request.urlopen(url, timeout=1) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(0.2)
    return False


def start_server() -> subprocess.Popen:
    # B3 — sys.executable is the SAME interpreter that's currently
    # running, which is the only way to be sure the right Python is
    # picked across platforms. Hard-coding `python3` fails on Windows
    # (no python3 on PATH by default) and on systems where the dev
    # uses a venv whose `python` is not on PATH.
    return subprocess.Popen(
        [
            sys.executable,
            str(ROOT / "server.py"),
            "--port",
            str(PORT),
            "--queue",
            str(QUEUE),
            "--root",
            str(FIXTURES),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        # New process group so the test orchestrator can SIGTERM the
        # whole tree even if the server spawns sub-threads.
        preexec_fn=os.setsid if os.name != "nt" else None,
    )


def stop_server(p: subprocess.Popen) -> None:
    try:
        if os.name != "nt":
            os.killpg(os.getpgid(p.pid), signal.SIGTERM)
        else:
            p.terminate()
    except ProcessLookupError:
        pass
    try:
        p.wait(timeout=3)
    except subprocess.TimeoutExpired:
        try:
            p.kill()
        except Exception:
            pass


# detail tolerates an empty trailing field when strip() chews the trailing
# space off — the JS prints `… | ${detail}` even when detail is "".
TEST_LINE = re.compile(r"^TEST \| (?P<name>[^|]+?) \| (?P<status>PASS|FAIL|ERROR) \| (?P<desc>[^|]+?) \|\s*(?P<detail>.*)$")


def run_script(script: Path) -> list[dict]:
    """Run one dev-browser script. Return parsed test rows.

    `--headless` is enforced by default — see
    `~/.claude/rules/browser-ui-test-techniques.md` R18. Set HEADFUL=1
    in the environment to launch a visible Chromium window (only useful
    when actively debugging a single test by eye).
    """
    cmd = ["dev-browser", "--timeout", "180"]
    if os.environ.get("HEADFUL", "") != "1":
        cmd.append("--headless")
    cmd.extend(["run", str(script)])
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
    )
    rows: list[dict] = []
    for line in (proc.stdout or "").splitlines():
        m = TEST_LINE.match(line.strip())
        if m:
            rows.append(m.groupdict())
    if not rows:
        rows.append(
            {
                "name": script.stem,
                "status": "ERROR",
                "desc": "no TEST lines in dev-browser output",
                "detail": ((proc.stderr or "")[:200]).replace("\n", " "),
            }
        )
    return rows


def render_table(rows: list[dict]) -> str:
    cols = [
        ("Test", lambda r: r["name"]),
        ("Status", lambda r: r["status"]),
        ("Description", lambda r: r["desc"]),
    ]
    widths = [max(len(c[0]), *[len(c[1](r)) for r in rows]) for c in cols] if rows else [4, 6, 11]

    def hbar(left: str, mid: str, right: str, fill: str) -> str:
        return left + mid.join(fill * (w + 2) for w in widths) + right

    out = [hbar("┏", "┳", "┓", "━")]
    out.append("┃ " + " ┃ ".join(c[0].ljust(widths[i]) for i, c in enumerate(cols)) + " ┃")
    out.append(hbar("┡", "╇", "┩", "━"))
    for r in rows:
        out.append("│ " + " │ ".join(c[1](r).ljust(widths[i]) for i, c in enumerate(cols)) + " │")
    out.append(hbar("└", "┴", "┘", "─"))
    return "\n".join(out)


def render_failures(rows: list[dict]) -> str:
    bad = [r for r in rows if r["status"] != "PASS"]
    if not bad:
        return ""
    out = ["", "Failure detail:"]
    for r in bad:
        out.append(f"  ✗ {r['name']} ({r['status']}) — {r['desc']}")
        if r.get("detail"):
            out.append("      " + r["detail"][:300])
    return "\n".join(out)


def chromium_renderer_count() -> int:
    """Return the number of Chrome for Testing renderer subprocesses.

    Uses a ps snapshot (per ~/.claude/rules/browser-ui-test-techniques.md §9
    — never grep the live ps output, snapshot first to avoid self-match).
    """
    snap = subprocess.run(
        ["ps", "-eo", "pid,command"],
        capture_output=True, text=True, check=False,
    ).stdout
    return sum(
        1 for line in snap.splitlines()
        if "Chrome for Testing" in line and "--type=renderer" in line
    )


def stop_dev_browser_daemon() -> None:
    """Stop any running dev-browser daemon + its managed Chromium.

    Required so that the very next `dev-browser ... --headless run` call
    relaunches Chromium in headless mode. Without this, a daemon that
    was started in visible/headful mode keeps its visible Chromium
    around and ignores the new flag (the daemon decides the mode at
    launch time). Idempotent — exits 0 even when no daemon is running.
    """
    subprocess.run(
        ["dev-browser", "stop"],
        capture_output=True, text=True, check=False,
    )


def main() -> int:
    # Belt + suspenders headless enforcement (per ~/.claude/rules/
    # browser-ui-test-techniques.md R18): kill any existing daemon so
    # the next dev-browser invocation in run_script() starts Chromium
    # fresh in headless mode. Skip when HEADFUL=1 (debugging only).
    if os.environ.get("HEADFUL", "") != "1":
        stop_dev_browser_daemon()
    baseline = chromium_renderer_count()
    try:
        rc = _main_inner()
    finally:
        # Always run the leak check, even if _main_inner raised — but do NOT
        # `return` from inside `finally` (that would swallow any in-flight
        # exception). Just emit the warning; the caller still sees the real
        # traceback if one is propagating.
        leaked = chromium_renderer_count() - baseline
        if leaked > 0:
            print(
                f"\nWARNING: {leaked} chromium renderer process(es) leaked "
                f"during the test run (baseline {baseline}, now {baseline + leaked}).",
                file=sys.stderr,
                flush=True,
            )
            print(
                "  This is a TEST BUG, not a CPV bug — the leaked tests "
                "are missing `try/finally { await page.close() }`. See "
                "~/.claude/rules/browser-ui-test-techniques.md §14.",
                file=sys.stderr,
                flush=True,
            )
    # If _main_inner returned cleanly but leaked, escalate to exit 2 so CI
    # catches the hygiene regression. Test failures (rc != 0) trump leak
    # warnings — we don't want a leak to mask a real test failure code.
    if leaked > 0 and rc == 0:
        return 2
    return rc


def _main_inner() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--only",
        help="comma-separated list of script stems to run (default: all)",
        default=None,
    )
    args = ap.parse_args()

    sync_runtime_into_fixtures()
    regenerate_sample_report()
    clean_queue()

    server = start_server()
    try:
        if not wait_for_server():
            print("server failed to come up on port", PORT, file=sys.stderr)
            return 2

        scripts = sorted(SCRIPTS.glob("test-*.js"))
        if args.only:
            wanted = {s.strip() for s in args.only.split(",") if s.strip()}
            scripts = [s for s in scripts if s.stem in wanted]

        all_rows: list[dict] = []
        for script in scripts:
            # Wipe the queue between scripts so residue from one suite cannot
            # bleed into another. Each test asserts against fresh disk state.
            clean_queue()
            print(f"running {script.name} …", flush=True)
            rows = run_script(script)
            all_rows.extend(rows)
            for r in rows:
                marker = {"PASS": "✓", "FAIL": "✗", "ERROR": "!"}.get(r["status"], "?")
                print(f"  {marker} {r['name']} — {r['status']}", flush=True)
    finally:
        stop_server(server)

    print()
    print(render_table(all_rows))
    extras = render_failures(all_rows)
    if extras:
        print(extras)

    bad = [r for r in all_rows if r["status"] != "PASS"]
    print(
        f"\n{len(all_rows) - len(bad)}/{len(all_rows)} passed."
        + ("  All green." if not bad else f"  {len(bad)} failing.")
    )
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())
