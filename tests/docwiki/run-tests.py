#!/usr/bin/env python3
"""run-tests.py — acceptance gate for the amvcp-doc-wiki visualizer (TRDD-103a53e0).

Builds the fixture wiki from `tests/docwiki/fixture-src/` with the real build
script, then asserts on the produced self-contained HTML:

  1. the build exits 0;
  2. the output has the four structural sections — home / search / kanban / prrd;
  3. there is exactly one `trdd/<8hex>` page per fixture `TRDD-*.md`;
  4. there is exactly one `mem/<name>` page per fixture note (minus the two
     index files MEMORY.md / memory-index.md);
  5. ZERO dangling in-set links: every `#/trdd/<hex>`, `#/mem/<name>`, and
     `#/prrd#G<n>` navigation anchor the build emitted points at a section that
     actually exists in the same file (the build's hard contract — deliberate
     out-of-set refs are rendered as plain "(not in set)" text, never anchors);

and a static-quality pass that does NOT need a browser:

  6. `py_compile` the two build/search scripts (syntax-clean);
  7. `node --check` the shell runtime IF `node` is on PATH (skipped otherwise).

Stdlib only. Exits non-zero on the first failure. Run from anywhere:
    python3 tests/docwiki/run-tests.py
"""

from __future__ import annotations

import py_compile
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# ── locations (resolved relative to THIS file, so cwd doesn't matter) ──────────
HERE = Path(__file__).resolve().parent                 # tests/docwiki/
REPO = HERE.parent.parent                              # worktree root
SCRIPTS = REPO / "scripts"
BUILD = SCRIPTS / "amvcp-docwiki-build.py"
SEARCH = SCRIPTS / "amvcp-docwiki-search.py"
SHELL = SCRIPTS / "amvcp-docwiki.js"
FIXTURE = HERE / "fixture-src"
TASKS = FIXTURE / "tasks"
MEM = FIXTURE / "memory"
PRRD = FIXTURE / "requirements" / "PRRD.md"

_MEM_INDEX_NAMES = {"MEMORY.md", "memory-index.md"}


class CheckError(Exception):
    """A single failed assertion, carried up to main() for a clean report."""


def _expect(cond: bool, msg: str) -> None:
    if not cond:
        raise CheckError(msg)


# ── expected inventory from the fixture sources ───────────────────────────────

def _expected_trdd_hex8s() -> set[str]:
    """The 8hex id every fixture TRDD should produce — derived the same three ways
    the build script does (frontmatter trdd-id, v1 bold line, or filename token)."""
    out: set[str] = set()
    for path in sorted(TASKS.glob("TRDD-*.md")):
        text = path.read_text(encoding="utf-8")
        m = re.search(r"^trdd-id:\s*([0-9a-fA-F]{8})", text, re.MULTILINE)
        if not m:
            m = re.search(r"\*\*TRDD ID:\*\*\s*`?([0-9a-fA-F]{8})", text)
        if not m:
            m = re.match(r"^TRDD-([0-9a-fA-F]{8})-[0-9a-fA-F]{4}-", path.name)
        if not m:
            m = re.search(r"-([0-9a-fA-F]{8})-", path.name)
        _expect(m is not None, f"fixture TRDD has no derivable 8hex id: {path.name}")
        assert m is not None  # for type-checkers; _expect already raised otherwise
        out.add(m.group(1).lower())
    return out


def _expected_mem_names() -> set[str]:
    """The mem-page name every fixture note should produce (frontmatter `name:`
    else the file stem), skipping the two non-note index files."""
    out: set[str] = set()
    for path in sorted(MEM.glob("*.md")):
        if path.name in _MEM_INDEX_NAMES:
            continue
        text = path.read_text(encoding="utf-8")
        m = re.search(r"^name:\s*(.+)$", text, re.MULTILINE)
        name = m.group(1).strip().strip("'\"") if m else path.stem
        out.add(name)
    return out


# ── the build + assertions ─────────────────────────────────────────────────────

def build_fixture(out_html: Path) -> None:
    """Invoke the real build script on the fixture; fail-fast on a non-zero exit."""
    cmd = [
        sys.executable, str(BUILD), str(out_html),
        "--trdd-dir", str(TASKS),
        "--mem-dir", str(MEM),
        "--prrd", str(PRRD),
        "--title", "Fixture Wiki",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    _expect(
        proc.returncode == 0,
        f"build script exited {proc.returncode}\nSTDERR:\n{proc.stderr}",
    )
    _expect(out_html.exists(), f"build reported success but produced no file: {out_html}")


def _wiki_body(html: str) -> str:
    """The `<div data-docwiki>…</div>` body only — EXCLUDING the inlined `<script>`
    shell (whose DOM-contract comment contains illustrative `data-ve-doc="…"` /
    `href="#/…"` example strings that must not be counted as real sections/links)."""
    start = html.find("<div data-docwiki>")
    _expect(start != -1, "output has no <div data-docwiki> wiki root")
    end = html.find("<script", start)
    return html[start:end] if end != -1 else html[start:]


def _routes_in(html: str) -> set[str]:
    """Every `data-ve-doc="<route>"` section route present in the wiki body."""
    return set(re.findall(r'data-ve-doc="([^"]+)"', _wiki_body(html)))


def _nav_targets(html: str) -> list[str]:
    """Every hash target carried by a `data-ve-navigate` anchor in the wiki body —
    these are the links the build WIRED, so every one must resolve to a real
    section. (The shell's own example anchors are excluded by `_wiki_body`.)"""
    return re.findall(r'<a[^>]*\bhref="#/([^"]+)"[^>]*\bdata-ve-navigate', _wiki_body(html))


def assert_structure(html: str) -> None:
    routes = _routes_in(html)
    for required in ("home", "search", "kanban", "prrd"):
        _expect(required in routes, f"missing structural section: data-ve-doc={required!r}")

    trdd_routes = {r.split("/", 1)[1] for r in routes if r.startswith("trdd/")}
    mem_routes = {r.split("/", 1)[1] for r in routes if r.startswith("mem/")}

    exp_trdd = _expected_trdd_hex8s()
    exp_mem = _expected_mem_names()

    _expect(
        trdd_routes == exp_trdd,
        f"trdd pages mismatch: built {sorted(trdd_routes)}, expected {sorted(exp_trdd)}",
    )
    _expect(
        mem_routes == exp_mem,
        f"mem pages mismatch: built {sorted(mem_routes)}, expected {sorted(exp_mem)}",
    )


def assert_no_dangling_links(html: str) -> None:
    """No wired in-set link may point at a non-existent section.

    `#/prrd#G<n>` anchors resolve to the `prrd` section (the `#G<n>` is an
    in-page rule anchor, not a route), so they are checked against `prrd`
    being present; every other nav target must equal a `data-ve-doc` route."""
    routes = _routes_in(html)
    dangling: list[str] = []
    for target in _nav_targets(html):
        base = target.split("#", 1)[0].rstrip("/")  # drop any in-page #anchor
        route = base or "home"
        if route not in routes:
            dangling.append(target)
    _expect(
        not dangling,
        f"{len(dangling)} dangling in-set link(s): {sorted(set(dangling))[:10]}",
    )


def assert_scripts_compile() -> None:
    for script in (BUILD, SEARCH):
        _expect(script.exists(), f"script not found: {script}")
        try:
            py_compile.compile(str(script), doraise=True)
        except py_compile.PyCompileError as exc:
            raise CheckError(f"py_compile failed for {script.name}: {exc}") from exc


def assert_shell_node_check() -> str:
    """`node --check` the shell when node is present; return a status word."""
    _expect(SHELL.exists(), f"shell runtime not found: {SHELL}")
    node = shutil.which("node")
    if not node:
        return "skipped (no node on PATH)"
    proc = subprocess.run([node, "--check", str(SHELL)], capture_output=True, text=True)
    _expect(
        proc.returncode == 0,
        f"node --check failed for {SHELL.name}:\n{proc.stderr}",
    )
    return "ok"


# ── runner ──────────────────────────────────────────────────────────────────────

def main() -> int:
    _expect(BUILD.exists(), f"build script missing: {BUILD}")
    _expect(FIXTURE.is_dir(), f"fixture-src missing: {FIXTURE}")

    checks: list[tuple[str, str]] = []  # (name, status) for the summary table
    tmpdir = Path(tempfile.mkdtemp(prefix="amvcp-docwiki-test-"))
    try:
        out_html = tmpdir / "fixture-wiki.html"

        build_fixture(out_html)
        checks.append(("build exits 0", "PASS"))

        html = out_html.read_text(encoding="utf-8")

        assert_structure(html)
        checks.append(("home/search/kanban/prrd + one page per TRDD/mem note", "PASS"))

        assert_no_dangling_links(html)
        checks.append(("zero dangling in-set links (trdd + mem + rule)", "PASS"))

        assert_scripts_compile()
        checks.append(("py_compile build + search scripts", "PASS"))

        node_status = assert_shell_node_check()
        checks.append(("node --check shell runtime", "PASS" if node_status == "ok"
                       else "SKIP"))
    except CheckError as exc:
        print("FAIL:", exc, file=sys.stderr)
        return 1
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    width = max(len(name) for name, _ in checks)
    print("amvcp-doc-wiki acceptance checks")
    print("─" * (width + 10))
    for name, status in checks:
        print(f"  {status:<4}  {name}")
    print("─" * (width + 10))
    print(f"{len(checks)} checks, all green.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
