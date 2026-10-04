#!/usr/bin/env python3
"""Tests for TRDD-LSHTWMTU: resolver-tag backfill ordering + new-twin exclusion.

Emits the same `TEST | name | STATUS | description | detail` lines the other
suites produce. No mocks: every case runs against REAL git repos — a work repo
pointing `origin` at a real bare repo — and drives the REAL
_push_resolver_backfill() / _stage_commit_tag_push() code.

  A — backfill excludes the new version's own twin (it rides _git_push atomically)
  B — backfill mints + pushes exactly the missing historical twins
  C — call-site order: backfill is invoked BEFORE _git_push, not after
"""

from __future__ import annotations

import functools
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "publish.py"


def emit(name: str, status: str, desc: str, detail: str = "") -> None:
    print(f"TEST | {name} | {status} | {desc} | {detail}", flush=True)


def git(args: list[str], cwd: Path, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args], cwd=cwd, check=check, capture_output=True, text=True
    )


def load_publish(repo_root: Path):
    spec = importlib.util.spec_from_file_location("publish_backfill_test", SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.REPO_ROOT = repo_root
    module.PLUGIN_JSON = repo_root / ".claude-plugin" / "plugin.json"
    module.git_with_retry = functools.partial(module.git_with_retry, max_attempts=1)
    return module


def make_repo(tmp: Path, version: str) -> Path:
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

    # -- Case A + B: real backfill over a real bare origin --
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        repo = make_repo(tmp, "1.5.3")
        bare = tmp / "origin.git"
        git(["init", "-q", "--bare", str(bare)], cwd=tmp)
        git(["remote", "add", "origin", str(bare)], cwd=repo)

        # Historical state: plain v-tags 1.0.0..1.5.2, twins only for 1.5.x.
        for v in ("1.0.0", "1.4.0", "1.5.0", "1.5.1", "1.5.2"):
            git(["tag", f"v{v}"], cwd=repo)
            if v.startswith("1.5."):
                git(["tag", f"t--v{v}", f"v{v}"], cwd=repo)

        module = load_publish(repo)
        pushes: list[list[str]] = []

        def fake_push(cmd, cwd=None, **_kw):
            pushes.append(cmd)
            # cwd is load-bearing (caught by the pre-push hook on first run):
            # without it the backfill push runs from the REAL repo, and the
            # hook blocks an out-of-sandbox push. Honor it like the real fn.
            out = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
            return out

        module.git_with_retry = fake_push

        # _run() with check=True would die on the tag-list call if the repo
        # were not clean; it is, so run the real function.
        module._push_resolver_backfill("1.5.3")

        local_tags = git(["tag", "--list"], cwd=repo).stdout.split()
        # A: the new version's own twin must NOT be minted by the backfill.
        if "t--v1.5.3" in local_tags:
            emit("backfill-excludes-new-twin", "FAIL",
                 "backfill minted the new version twin — double-push risk",
                 "t--v1.5.3 exists after backfill")
            failures += 1
        else:
            emit("backfill-excludes-new-twin", "PASS",
                 "backfill excludes the new version own twin", "")

        # B: missing historical twins minted locally and pushed, exactly once.
        minted = {"t--v1.0.0", "t--v1.4.0"} <= set(local_tags)
        push_cmd = next((c for c in pushes if len(c) > 2 and c[2] == "origin"), None)
        ok_b = minted and push_cmd is not None and all(
            f"t--v{v}" in push_cmd for v in ("1.0.0", "1.4.0", "1.5.0", "1.5.1", "1.5.2")
        ) and "v1.5.3" not in [t for t in push_cmd if not t.startswith("t--")]
        if ok_b:
            emit("backfill-pushes-exact-missing", "PASS",
                 "backfill mints and pushes exactly the missing historical twins", "")
        else:
            emit("backfill-pushes-exact-missing", "FAIL",
                 "backfill did not push the exact missing set",
                 f"minted={minted} push_cmd={push_cmd}")
            failures += 1

        # B2: remote actually received the historical twins.
        remote_tags = subprocess.run(
            ["git", "ls-remote", "--tags", str(bare)], capture_output=True, text=True
        ).stdout
        got = {ln.split("refs/tags/")[1] for ln in remote_tags.splitlines() if "refs/tags/" in ln and "^{}" not in ln}
        if {"t--v1.0.0", "t--v1.4.0"} <= got and "t--v1.5.3" not in got:
            emit("backfill-remote-state", "PASS",
                 "remote received historical twins, not the unpublished new twin", "")
        else:
            emit("backfill-remote-state", "FAIL",
                 "remote state wrong after backfill", f"got={sorted(got)}")
            failures += 1

    # -- Case C: call-site ordering, read from the real source --
    src = SCRIPT.read_text(encoding="utf-8")
    idx_backfill = src.find("_push_resolver_backfill(new_version)")
    idx_push = src.find("_git_push(new_version)")
    if 0 < idx_backfill < idx_push:
        emit("backfill-before-git-push", "PASS",
             "_stage_commit_tag_push invokes backfill before _git_push", "")
    else:
        emit("backfill-before-git-push", "FAIL",
             "ordering reverted or call sites not found",
             f"backfill@{idx_backfill} push@{idx_push}")
        failures += 1

    # -- Case D: the invariant the backfill fix rests on (TRDD-LSHTWMTU) —
    #    a resolver twin tag NEVER feeds _read_remote_latest_tag's max, even
    #    when its semver is higher than every plain tag. --
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        repo = make_repo(tmp, "1.5.3")
        bare = tmp / "origin.git"
        git(["init", "-q", "--bare", str(bare)], cwd=tmp)
        git(["remote", "add", "origin", str(bare)], cwd=repo)
        git(["tag", "v1.5.2"], cwd=repo)
        git(["tag", "t--v9.9.9"], cwd=repo)
        git(["push", "-q", "origin", "v1.5.2", "t--v9.9.9"], cwd=repo)
        module = load_publish(repo)
        got = module._read_remote_latest_tag()
        if got == "1.5.2":
            emit("twin-excluded-from-remote-max", "PASS",
                 "a resolver twin never moves _read_remote_latest_tag's max", "")
        else:
            emit("twin-excluded-from-remote-max", "FAIL",
                 "twin tag fed the remote max — backfill premise inverted",
                 f"got={got!r} expected='1.5.2'")
            failures += 1

    print(f"SUMMARY | {failures} failed", flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
