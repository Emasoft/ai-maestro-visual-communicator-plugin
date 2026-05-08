#!/usr/bin/env python3
"""Release helper for ai-maestro-visual-communicator.

Bumps the version in plugin.json + pyproject.toml + package.json (kept in
sync), regenerates CHANGELOG.md from git-cliff, commits, and tags. Pushing
is opt-in via --push so a human always reviews the bump before it leaves
the local repo.

Usage:
    uv run scripts/publish.py --patch
    uv run scripts/publish.py --minor --message "v2 modal-comment threads"
    uv run scripts/publish.py --major --push

Bump types are mutually exclusive. If none is given, the script exits 2.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PLUGIN_JSON = REPO_ROOT / ".claude-plugin" / "plugin.json"
PYPROJECT = REPO_ROOT / "pyproject.toml"
PACKAGE_JSON = REPO_ROOT / "package.json"
CHANGELOG = REPO_ROOT / "CHANGELOG.md"


def _run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    """Run a subprocess in the repo root and exit on non-zero return code.

    Kept intentionally narrow — the publish pipeline only ever runs commands
    in the repo root with default stdio, so we don't need to parameterise
    cwd / stdin / env. mypy can match the simple overload exactly.
    """
    print(f"$ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=REPO_ROOT, text=True, check=False)
    if result.returncode != 0:
        sys.exit(result.returncode)
    return result


def _read_version() -> tuple[int, int, int]:
    data = json.loads(PLUGIN_JSON.read_text(encoding="utf-8"))
    raw = data.get("version", "0.0.0")
    parts = raw.split(".")
    if len(parts) != 3 or not all(p.isdigit() for p in parts):
        sys.exit(f"plugin.json version is not semver-compatible: {raw!r}")
    return int(parts[0]), int(parts[1]), int(parts[2])


def _bump(current: tuple[int, int, int], kind: str) -> str:
    major, minor, patch = current
    if kind == "major":
        return f"{major + 1}.0.0"
    if kind == "minor":
        return f"{major}.{minor + 1}.0"
    if kind == "patch":
        return f"{major}.{minor}.{patch + 1}"
    sys.exit(f"unknown bump kind: {kind!r}")


def _write_plugin_json(new_version: str) -> None:
    data = json.loads(PLUGIN_JSON.read_text(encoding="utf-8"))
    data["version"] = new_version
    PLUGIN_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _write_pyproject(new_version: str) -> None:
    if not PYPROJECT.exists():
        return
    text = PYPROJECT.read_text(encoding="utf-8")
    new_text = re.sub(
        r'(?m)^version\s*=\s*"[^"]*"',
        f'version = "{new_version}"',
        text,
        count=1,
    )
    PYPROJECT.write_text(new_text, encoding="utf-8")


def _write_package_json(new_version: str) -> None:
    if not PACKAGE_JSON.exists():
        return
    data = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    data["version"] = new_version
    PACKAGE_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _regenerate_changelog(new_version: str) -> None:
    if not shutil.which("git-cliff"):
        print("[publish] git-cliff not on PATH; skipping CHANGELOG regeneration.")
        return
    _run(["git-cliff", "--tag", f"v{new_version}", "--output", str(CHANGELOG)])


def _git_commit(new_version: str, message: str | None) -> None:
    summary = message or f"chore(release): v{new_version}"
    files = [str(PLUGIN_JSON.relative_to(REPO_ROOT))]
    if PYPROJECT.exists():
        files.append(str(PYPROJECT.relative_to(REPO_ROOT)))
    if PACKAGE_JSON.exists():
        files.append(str(PACKAGE_JSON.relative_to(REPO_ROOT)))
    if CHANGELOG.exists():
        files.append(str(CHANGELOG.relative_to(REPO_ROOT)))
    _run(["git", "add", *files])
    _run(["git", "commit", "-m", summary])


def _git_tag(new_version: str) -> None:
    _run(["git", "tag", f"v{new_version}"])


def _git_push(new_version: str) -> None:
    _run(["git", "push", "origin", "HEAD"])
    _run(["git", "push", "origin", f"v{new_version}"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    bump = parser.add_mutually_exclusive_group(required=True)
    bump.add_argument("--patch", action="store_true", help="bump patch version")
    bump.add_argument("--minor", action="store_true", help="bump minor version")
    bump.add_argument("--major", action="store_true", help="bump major version")
    parser.add_argument("--message", "-m", help="custom commit message")
    parser.add_argument(
        "--push",
        action="store_true",
        help="push commit + tag to origin (off by default)",
    )
    args = parser.parse_args()

    kind = "major" if args.major else "minor" if args.minor else "patch"
    current = _read_version()
    new_version = _bump(current, kind)
    print(
        f"[publish] {'.'.join(str(p) for p in current)} -> {new_version}  ({kind})"
    )

    _write_plugin_json(new_version)
    _write_pyproject(new_version)
    _write_package_json(new_version)
    _regenerate_changelog(new_version)
    _git_commit(new_version, args.message)
    _git_tag(new_version)

    if args.push:
        _git_push(new_version)
    else:
        print(
            f"[publish] commit + tag v{new_version} created locally. "
            "Re-run with --push or push manually."
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
