#!/usr/bin/env python3
"""Tests for scripts/publish.py gate G1 — the duplicate-version guard (TRDD-YY5ISKCJ).

Emits the same `TEST | name | STATUS | description | detail` lines the JS suites
produce, so run-tests.py renders these rows in the same table.

No mocks: every case builds a REAL git repo in a temp dir, points `origin` at a
REAL bare repo (or a genuinely unresolvable https host for the outage case), and
drives the real _read_remote_latest_tag() / _gate_version_bump() code. The three
cases mirror the measurement table on TRDD-YY5ISKCJ:
  A — remote exists, zero tags  → exit 0, empty  → None → G1 PASS (first publish)
  B — remote has a matching tag → G1 FAIL (duplicate version)
  C — remote unreachable        → exit 128       → RemoteTagReadError → G1 FAIL CLOSED
"""

from __future__ import annotations

import functools
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "publish.py"


def emit(name: str, status: str, desc: str, detail: str = "") -> None:
    print(f"TEST | {name} | {status} | {desc} | {detail}", flush=True)


def git(args: list[str], cwd: Path) -> None:
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


def load_publish(repo_root: Path):
    """Import publish.py by path, then repoint its module-level paths at a
    sandbox repo so no case ever touches the real working tree or origin.

    Also rebinds git_with_retry to the REAL function with max_attempts=1:
    'could not resolve host' is classified transient, so the default 60
    retries would make case C take ~4 minutes. One attempt exercises the
    same returncode!=0 path; nothing about the code under test is faked.
    """
    spec = importlib.util.spec_from_file_location("publish_under_test", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.REPO_ROOT = repo_root
    module.PLUGIN_JSON = repo_root / ".claude-plugin" / "plugin.json"
    module.git_with_retry = functools.partial(module.git_with_retry, max_attempts=1)
    return module


def make_repo(tmp: Path, version: str) -> Path:
    """A minimal real git repo with a plugin.json at the given version."""
    repo = tmp / "work"
    (repo / ".claude-plugin").mkdir(parents=True)
    (repo / ".claude-plugin" / "plugin.json").write_text(
        json.dumps({"name": "t", "version": version}), encoding="utf-8"
    )
    git(["init", "-q"], cwd=repo)
    git(["-c", "user.email=t@t", "-c", "user.name=t", "add", ".claude-plugin/plugin.json"], cwd=repo)
    git(["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"], cwd=repo)
    return repo


def main() -> int:
    failures = 0

    # -- Case A: origin exists, zero tags → None → G1 PASS (first publish) --
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        repo = make_repo(tmp, "1.0.0")
        bare = tmp / "origin.git"
        git(["init", "-q", "--bare", str(bare)], cwd=tmp)
        git(["remote", "add", "origin", str(bare)], cwd=repo)
        mod = load_publish(repo)
        try:
            tag = mod._read_remote_latest_tag()
            ok = tag is None and mod._gate_version_bump() is True
            emit(
                "g1-tagless-remote-passes",
                "PASS" if ok else "FAIL",
                "A tagless (first-publish) remote yields None and G1 passes",
                f"tag={tag!r}",
            )
            failures += 0 if ok else 1
        except Exception as exc:  # a raise here would break first publishes
            emit("g1-tagless-remote-passes", "FAIL",
                 "A tagless (first-publish) remote yields None and G1 passes", repr(exc))
            failures += 1

    # -- Case B: origin has a tag equal to the local version → G1 FAIL ------
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        repo = make_repo(tmp, "1.0.0")
        bare = tmp / "origin.git"
        git(["init", "-q", "--bare", str(bare)], cwd=tmp)
        git(["remote", "add", "origin", str(bare)], cwd=repo)
        git(["tag", "v1.0.0"], cwd=repo)
        git(["push", "-q", "origin", "v1.0.0"], cwd=repo)
        mod = load_publish(repo)
        tag = mod._read_remote_latest_tag()
        ok = tag == "1.0.0" and mod._gate_version_bump() is False
        emit(
            "g1-duplicate-version-fails",
            "PASS" if ok else "FAIL",
            "A remote tag equal to the local version makes G1 fail (positive control)",
            f"tag={tag!r}",
        )
        failures += 0 if ok else 1

    # -- Case C: origin unreachable → RemoteTagReadError → G1 FAILS CLOSED --
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        repo = make_repo(tmp, "1.0.0")
        git(["remote", "add", "origin", "https://no-such-host.invalid/x.git"], cwd=repo)
        # Kill any credential/DNS retry sources of slowness or prompts.
        env_backup = os.environ.get("GIT_TERMINAL_PROMPT")
        os.environ["GIT_TERMINAL_PROMPT"] = "0"
        try:
            mod = load_publish(repo)
            raised = False
            try:
                mod._read_remote_latest_tag()
            except mod.RemoteTagReadError:
                raised = True
            gate = mod._gate_version_bump()
            ok = raised and gate is False
            emit(
                "g1-unreachable-remote-fails-closed",
                "PASS" if ok else "FAIL",
                "An unreachable remote raises RemoteTagReadError and G1 fails CLOSED",
                f"raised={raised} gate={gate}",
            )
            failures += 0 if ok else 1
        finally:
            if env_backup is None:
                os.environ.pop("GIT_TERMINAL_PROMPT", None)
            else:
                os.environ["GIT_TERMINAL_PROMPT"] = env_backup

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
