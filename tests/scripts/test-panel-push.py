#!/usr/bin/env python3
"""Tests for scripts/amvcp-panel-push.py — the optional AI Maestro side-panel delivery path.

Emits the same `TEST | name | STATUS | description | detail` lines the JS suites
produce, so run-tests.py renders these rows in the same table.

No mocking of amvcp code and no fake panel CLI: every case below drives the real
`amvcp-panel-push.py` as a subprocess, and the cases that need the harness use
the REAL `aimaestro-panel.sh` from PATH. The one case that additionally needs a
running ai-maestro server plus credentials is reported as a SKIP with the exact
environment it wants, rather than being faked into a green row — a mocked
delivery would assert nothing about the thing that actually breaks.
"""

from __future__ import annotations

import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "amvcp-panel-push.py"


def emit(name: str, status: str, desc: str, detail: str = "") -> None:
    print(f"TEST | {name} | {status} | {desc} | {detail}", flush=True)


def run(args: list[str], env: dict[str, str] | None = None) -> subprocess.CompletedProcess:
    full_env = dict(os.environ)
    if env is not None:
        full_env.update(env)
    # Every case must be independent of whatever the developer happens to have
    # exported, so the target-resolution vars are cleared unless a case sets them.
    for var in ("AMVCP_PANEL_AGENT", "AIMAESTRO_AGENT_ID"):
        if env is None or var not in env:
            full_env.pop(var, None)
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True,
        text=True,
        env=full_env,
        timeout=60,
    )


def load_module():
    """Import amvcp-panel-push.py by path so its pure helpers can be tested directly."""
    spec = importlib.util.spec_from_file_location("amvcp_panel_push", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_missing_artifact() -> None:
    """A nonexistent artifact path is a hard failure, never a silent no-op."""
    proc = run([str(ROOT / "does-not-exist-abc123.html")])
    ok = proc.returncode != 0 and "artifact not found" in proc.stderr
    emit(
        "panel-push-missing-artifact",
        "PASS" if ok else "FAIL",
        "missing artifact exits non-zero with a clear error",
        "" if ok else f"rc={proc.returncode} stderr={proc.stderr.strip()[:120]}",
    )


def test_cli_absent_is_graceful(artifact: Path) -> None:
    """With no aimaestro-panel.sh on PATH, amvcp stays standalone: exit 0, `panel: unavailable`."""
    proc = run([str(artifact)], env={"PATH": "/usr/bin:/bin"})
    ok = proc.returncode == 0 and proc.stdout.strip() == "panel: unavailable"
    emit(
        "panel-push-cli-absent",
        "PASS" if ok else "FAIL",
        "absent panel CLI degrades to a clean no-op (exit 0)",
        "" if ok else f"rc={proc.returncode} stdout={proc.stdout.strip()[:120]}",
    )


def test_no_target_is_graceful(artifact: Path) -> None:
    """With the real CLI present but no agent resolvable, exit 0 with `panel: no-target`."""
    if shutil.which("aimaestro-panel.sh") is None:
        print("SKIP: panel-push-no-target — aimaestro-panel.sh is not on PATH on this machine", flush=True)
        return
    proc = run([str(artifact)])
    ok = proc.returncode == 0 and proc.stdout.strip() == "panel: no-target"
    emit(
        "panel-push-no-target",
        "PASS" if ok else "FAIL",
        "no resolvable target agent degrades to a clean no-op (exit 0)",
        "" if ok else f"rc={proc.returncode} stdout={proc.stdout.strip()[:120]}",
    )


def test_delivered_count_parsing() -> None:
    """delivered_count() returns 0 and None as DISTINCT outcomes, so a drop is never read as success."""
    module = load_module()
    cases = [
        (json.dumps({"delivered": 3}), 3),
        (json.dumps({"delivered": 0}), 0),
        (json.dumps({"ok": True}), None),
        ("not json at all", None),
        ("", None),
    ]
    bad = [(raw, want, module.delivered_count(raw)) for raw, want in cases if module.delivered_count(raw) != want]
    emit(
        "panel-push-delivered-parse",
        "PASS" if not bad else "FAIL",
        "delivered=0 and an unknown count stay distinguishable from a real delivery",
        "" if not bad else f"{len(bad)} mismatched: {bad[:2]}",
    )


def test_agent_resolution_precedence() -> None:
    """--agent beats $AMVCP_PANEL_AGENT beats $AIMAESTRO_AGENT_ID, and blank values do not win."""
    module = load_module()
    os.environ["AMVCP_PANEL_AGENT"] = "from-amvcp-var"
    os.environ["AIMAESTRO_AGENT_ID"] = "from-maestro-var"
    try:
        checks: list[tuple[str | None, str | None]] = [
            (module.resolve_agent("explicit"), "explicit"),
            (module.resolve_agent(None), "from-amvcp-var"),
            (module.resolve_agent("   "), "from-amvcp-var"),
        ]
        os.environ.pop("AMVCP_PANEL_AGENT")
        checks.append((module.resolve_agent(None), "from-maestro-var"))
        os.environ.pop("AIMAESTRO_AGENT_ID")
        checks.append((module.resolve_agent(None), None))
    finally:
        os.environ.pop("AMVCP_PANEL_AGENT", None)
        os.environ.pop("AIMAESTRO_AGENT_ID", None)
    bad = [(got, want) for got, want in checks if got != want]
    emit(
        "panel-push-agent-precedence",
        "PASS" if not bad else "FAIL",
        "agent target resolves --agent > AMVCP_PANEL_AGENT > AIMAESTRO_AGENT_ID",
        "" if not bad else f"{bad}",
    )


def test_live_delivery(artifact: Path) -> None:
    """End-to-end push to a real dashboard panel; needs the ai-maestro server and credentials."""
    agent = os.environ.get("AMVCP_TEST_PANEL_AGENT", "")
    has_auth = bool(os.environ.get("AID_AUTH") or os.environ.get("AIMAESTRO_SUDO_TOKEN"))
    if shutil.which("aimaestro-panel.sh") is None or not agent or not has_auth:
        print(
            "SKIP: panel-push-live-delivery — needs aimaestro-panel.sh on PATH, "
            "$AMVCP_TEST_PANEL_AGENT set to a real agent, and $AID_AUTH or "
            "$AIMAESTRO_SUDO_TOKEN exported. Not faked: a mocked panel would "
            "assert nothing about the surface that actually drops messages.",
            flush=True,
        )
        return
    proc = run([str(artifact), "--agent", agent])
    ok = proc.returncode == 0 and proc.stdout.strip().startswith("panel: delivered=")
    dropped = proc.returncode != 0 and "delivered=0" in proc.stderr
    emit(
        "panel-push-live-delivery",
        "PASS" if ok or dropped else "FAIL",
        "a real push either reports a delivered count or reports the drop as a failure",
        "" if ok else f"rc={proc.returncode} out={proc.stdout.strip()[:80]} err={proc.stderr.strip()[:80]}",
    )


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="amvcp-panel-test-") as tmp:
        artifact = Path(tmp) / "artifact.html"
        artifact.write_text("<h1>amvcp panel push test</h1>\n", encoding="utf-8")

        test_missing_artifact()
        test_cli_absent_is_graceful(artifact)
        test_no_target_is_graceful(artifact)
        test_delivered_count_parsing()
        test_agent_resolution_precedence()
        test_live_delivery(artifact)
    return 0


if __name__ == "__main__":
    sys.exit(main())
