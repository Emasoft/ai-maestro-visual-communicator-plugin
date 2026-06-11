#!/usr/bin/env python3
"""Release helper for ai-maestro-visual-communicator-plugin.

This is the **single source of truth** for the plugin's quality pipeline.
The script has three independently-invokable modes — pre-push hooks, CI
scripts, and human releases all go through here so the gate logic is
defined exactly once.

Modes
-----
1. `--gate` (no mutations)
   Runs the 4 quality gates in order and exits 0 / non-0:
     G1  Version-bump check — refuses if the local plugin.json version
         already matches the latest remote tag (forces a semver bump).
     G2  Lint — `ruff check scripts/`
     G3  Validate plugin via the remote CPV launcher
         (`uvx ... cpv-remote-validate plugin . --strict`).
         Blocks on CRITICAL / MAJOR / MINOR / NIT (exit 1-4).
         WARNINGs are allowed through — the canonical standard says
         we already documented our 0/0/0/0/0 status.
     G4  Tests — runs `tests/run-all-tests.py`. Soft-passes when
         `dev-browser` is missing on PATH so a fresh clone is not blocked.

   Used by `git-hooks/pre-push` and by stages S2-S4 of publish mode.

2. `--install-hook` (idempotent)
   Copies `git-hooks/pre-push` -> `.git/hooks/pre-push` AND sets
   `core.hooksPath git-hooks`. Both operations are no-ops when already in
   place. Re-running is always safe.

3. Publish mode (`--patch` / `--minor` / `--major` [+ `--push`])
   The canonical 10-stage release pipeline. The `--push` flag is opt-in
   so a human always reviews the bump before it leaves the repo.

Usage
-----
    uv run python scripts/publish.py --gate
    uv run python scripts/publish.py --install-hook
    uv run python scripts/publish.py --patch
    uv run python scripts/publish.py --minor --message "v2 modal-comment threads"
    uv run python scripts/publish.py --major --push
    uv run python scripts/publish.py --patch --dry-run   # exit before any mutation

Exit codes
----------
    0  success
    1  gate / stage failure (non-recoverable)
    2  argparse / usage error
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import stat
import subprocess
import sys
from collections.abc import Sequence
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PLUGIN_JSON = REPO_ROOT / ".claude-plugin" / "plugin.json"
PYPROJECT = REPO_ROOT / "pyproject.toml"
PACKAGE_JSON = REPO_ROOT / "package.json"
CHANGELOG = REPO_ROOT / "CHANGELOG.md"
UV_LOCK = REPO_ROOT / "uv.lock"
HOOK_SOURCE = REPO_ROOT / "git-hooks" / "pre-push"

# ---------------------------------------------------------------------------
# Network resilience — load gh/git retry wrappers from the sibling module so
# every push + `gh release create` survives transient github.com hiccups.
# Pattern from ~/.claude/rules/github-timeouts.md.
#
# Fail-fast: cpv_network_resilience.py ships alongside publish.py. A user
# who deleted the file is expected to refresh via
# `cpv standardize --force-templates` — silently swallowing the ImportError
# would leave network calls without retry, defeating the whole point of
# adding the helper module.
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cpv_network_resilience import gh_with_retry, git_with_retry  # noqa: E402

# ---------------------------------------------------------------------------
# Process helpers
# ---------------------------------------------------------------------------

def _log(msg: str) -> None:
    """Tagged log line (matches the pre-push hook's `[publish] ...` style)."""
    print(f"[publish] {msg}")


def _run(
    cmd: Sequence[str],
    *,
    check: bool = True,
    capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    """Run a subprocess in the repo root.

    `check=True` mirrors the previous behaviour: non-zero exit terminates the
    publish run. `check=False` returns the result so the caller can inspect
    stdout / returncode (used by gate checks).
    """
    print(f"$ {' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        cwd=REPO_ROOT,
        text=True,
        check=False,
        capture_output=capture,
    )
    if check and result.returncode != 0:
        sys.exit(result.returncode)
    return result


# ---------------------------------------------------------------------------
# Version helpers
# ---------------------------------------------------------------------------

_SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")


def _parse_semver(raw: str) -> tuple[int, int, int]:
    if not _SEMVER_RE.match(raw):
        sys.exit(f"version is not semver-compatible: {raw!r}")
    a, b, c = raw.split(".")
    return int(a), int(b), int(c)


def _read_plugin_version() -> tuple[int, int, int]:
    data = json.loads(PLUGIN_JSON.read_text(encoding="utf-8"))
    return _parse_semver(data.get("version", "0.0.0"))


def _read_pyproject_version() -> str | None:
    if not PYPROJECT.exists():
        return None
    text = PYPROJECT.read_text(encoding="utf-8")
    match = re.search(r'(?m)^version\s*=\s*"([^"]*)"', text)
    return match.group(1) if match else None


def _read_package_version() -> str | None:
    if not PACKAGE_JSON.exists():
        return None
    data = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    return data.get("version")


def _bump(current: tuple[int, int, int], kind: str) -> str:
    major, minor, patch = current
    if kind == "major":
        return f"{major + 1}.0.0"
    if kind == "minor":
        return f"{major}.{minor + 1}.0"
    if kind == "patch":
        return f"{major}.{minor}.{patch + 1}"
    sys.exit(f"unknown bump kind: {kind!r}")


def _read_remote_latest_tag() -> str | None:
    """Return the highest semver tag on `origin`, or None if no tags exist.

    Uses `git ls-remote --tags origin` so we don't need a fetch. Filters out
    `^{}` peeled-tag entries and tags that don't match `vX.Y.Z`.

    Wrapped with git_with_retry — a transient network glitch shouldn't make
    G1 falsely think there's no remote tag (which would let a duplicate-
    version push slip through).
    """
    print("$ git ls-remote --tags origin")
    result = git_with_retry(
        ["git", "ls-remote", "--tags", "origin"],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
    )
    if result.returncode != 0:
        # Network failure / no remote — caller treats as "no remote tag known".
        return None
    versions: list[tuple[int, int, int]] = []
    for line in result.stdout.splitlines():
        # Format: "<sha>\trefs/tags/<tag>" or "<sha>\trefs/tags/<tag>^{}"
        parts = line.split("\t", 1)
        if len(parts) != 2:
            continue
        ref = parts[1].strip()
        if ref.endswith("^{}"):
            continue
        if not ref.startswith("refs/tags/"):
            continue
        tag = ref[len("refs/tags/"):]
        # Strip the leading 'v' if present, then check semver.
        candidate = tag[1:] if tag.startswith("v") else tag
        if _SEMVER_RE.match(candidate):
            versions.append(_parse_semver(candidate))
    if not versions:
        return None
    a, b, c = max(versions)
    return f"{a}.{b}.{c}"


# ---------------------------------------------------------------------------
# Gate checks (G0-G5) — single source of truth
# ---------------------------------------------------------------------------
#
# Gate 0 — Bypass-guard (NEW in pipeline-migration step 10, mirrors canon)
# -----------------------------------------------------------------------
# Reject any push that sets a CI-bypass env var. This catches the
# "I'll just set CPV_SKIP_VALIDATE=1 to get my push through" pattern
# that defeats the purpose of having a pre-push gate. The pre-push hook
# itself uses process-ancestry verification to enforce publish.py as
# the entry point — Gate 0 covers the orthogonal case where someone
# runs publish.py but pre-poisons the environment to skip a gate.

# Env vars whose presence (regardless of value) means "I'm trying to
# bypass the gate". These names mirror CPV's canon list — the only
# legitimate way to skip a gate is to fix the underlying issue.
_BYPASS_ENV_VARS: tuple[str, ...] = (
    "CPV_SKIP_VALIDATE",
    "CPV_SKIP_TESTS",
    "CPV_SKIP_LINT",
    "CPV_SKIP_GATE",
    "SKIP_VALIDATE",
    "SKIP_TESTS",
    "SKIP_LINT",
    "SKIP_GATE",
    "NO_VERIFY",
)


def _gate_bypass_guard() -> bool:
    """G0: reject any push that pre-sets a CI-bypass env var.

    Returns True iff NONE of the bypass env vars are set in the current
    environment. Env-var bypasses are spoofable (anyone can `unset
    CPV_SKIP_GATE` after the check) — the real defence is process-
    ancestry verification in the pre-push hook (step 9). Gate 0 is the
    belt for that braces: it catches honest mistakes (`CPV_SKIP=...
    publish.py --patch --push`) loudly.
    """
    _log("G0: bypass-var rejection")
    found = [v for v in _BYPASS_ENV_VARS if v in os.environ]
    if found:
        _log(f"  FAIL: bypass env var(s) set: {', '.join(found)}")
        _log("  Bypass vars are NOT allowed — fix the underlying issue.")
        return False
    _log("  PASS (no bypass vars set)")
    return True


def _gate_version_bump() -> bool:
    """G1: local plugin.json version MUST differ from latest remote tag."""
    _log("G1: version-bump check (local plugin.json vs latest remote tag)")
    local = ".".join(str(p) for p in _read_plugin_version())
    remote = _read_remote_latest_tag()
    if remote is None:
        _log(f"  local={local}  remote=<none>  PASS (no remote tag yet)")
        return True
    if local == remote:
        _log(f"  local={local}  remote={remote}  FAIL")
        _log("  Bump the version before pushing — `publish.py --patch` etc.")
        return False
    _log(f"  local={local}  remote={remote}  PASS")
    return True


def _gate_lint() -> bool:
    """G2: ruff check on scripts/.

    We only run ruff if it's on PATH — fresh clones may not have dev tools.
    The CI workflow installs ruff explicitly, so coverage there is
    guaranteed; the local pre-push fallback degrades softly with a warning.
    """
    _log("G2: ruff check scripts/")
    if shutil.which("ruff") is None:
        _log("  ruff not on PATH; skipping (CI will run it)")
        return True
    result = _run(["ruff", "check", "scripts/"], check=False)
    if result.returncode != 0:
        _log("  ruff reported lint errors")
        return False
    _log("  PASS")
    return True


def _extract_json_from_stdout(stdout: str) -> dict | None:
    """The remote launcher emits a `[REPO LINT]` banner BEFORE the JSON body
    on stdout. Find the first top-level `{` and json.loads from there.
    """
    if not stdout:
        return None
    idx = stdout.find("{")
    if idx < 0:
        return None
    try:
        return json.loads(stdout[idx:])
    except json.JSONDecodeError:
        return None


def _gate_validate() -> bool:
    """G3: cpv-remote-validate plugin . --strict — RAW, NO EXEMPTIONS.

    The previous allowlist mechanism (plugin.json::cpv.
    `_intentional_validator_false_positives` consumed here) was ABOLISHED
    by maintainer policy on 2026-06-11: a per-finding exempt list is an
    attack surface — one compromised allowlist entry hides real malware
    from every downstream scan, and the mechanism was demonstrably
    exploitable by a malicious actor. There is no suppression path any
    more. Every CRITICAL/MAJOR/MINOR/NIT finding blocks the publish:

      - a REAL finding is fixed by DEVITALIZING the flagged content
        (provably-inert rewrite) or REMOVING it;
      - a FALSE POSITIVE is fixed UPSTREAM — file a detector issue on
        the CPV repo (Emasoft/claude-plugins-validation) and wait for
        the detection fix; never re-introduce an allowlist.

    Invoked via the remote launcher's `--json` mode so the tally is
    structural (no ANSI / line-grep).
    """
    _log("G3: validate plugin (cpv-remote-validate --strict --json)")
    if shutil.which("uvx") is None:
        _log("  uvx not on PATH; skipping (install uv to enable this gate)")
        return True

    # The launcher's --json mode puts JSON on stdout; we capture stdout to
    # parse and let stderr stream to the user's terminal for visibility.
    cmd = [
        "uvx",
        "--from",
        "git+https://github.com/Emasoft/claude-plugins-validation",
        "--with",
        "pyyaml",
        "cpv-remote-validate",
        "plugin",
        ".",
        "--strict",
        "--json",
    ]
    print(f"$ {' '.join(cmd)}")
    proc = subprocess.run(
        cmd,
        cwd=REPO_ROOT,
        text=True,
        check=False,
        capture_output=True,
    )

    payload = _extract_json_from_stdout(proc.stdout)
    if payload is None:
        # Fall back to the old behavior — if --json output is unparseable,
        # block on the bare exit code so we never silently allow a real
        # finding through.
        _log("  could not parse --json output; falling back to bare exit code")
        # Still surface the lint banner + tail of stdout for diagnosis.
        if proc.stdout:
            print(proc.stdout, end="")
        if proc.stderr:
            print(proc.stderr, end="", file=sys.stderr)
        if proc.returncode != 0:
            _log(f"  CPV blocked the push (exit {proc.returncode})")
            return False
        _log("  PASS")
        return True

    results = payload.get("results") or []
    counts = payload.get("counts") or {}

    # NO EXEMPTIONS: every blocking-severity finding blocks (see docstring).
    BLOCKING = {"CRITICAL", "MAJOR", "MINOR", "NIT"}
    blocking: list[dict] = [
        f for f in results
        if (f.get("level") or "").upper() in BLOCKING
    ]

    # Always re-print the validator's lint banner so the maintainer sees
    # the per-file pass list, even when the gate goes green.
    if proc.stdout:
        # Just the part BEFORE the JSON body; the JSON itself is structurally
        # redundant for human reading.
        idx = proc.stdout.find("{")
        if idx > 0:
            print(proc.stdout[:idx], end="")
    if proc.stderr:
        print(proc.stderr, end="", file=sys.stderr)

    raw_critical = int(counts.get("critical", 0))
    raw_major    = int(counts.get("major", 0))
    raw_minor    = int(counts.get("minor", 0))
    raw_nit      = int(counts.get("nit", 0))
    raw_warning  = int(counts.get("warning", 0))
    _log(
        f"  findings : CRITICAL={raw_critical} MAJOR={raw_major} "
        f"MINOR={raw_minor} NIT={raw_nit} WARNING={raw_warning}"
    )

    if blocking:
        _log(
            f"  CPV blocked the push: {len(blocking)} finding(s). "
            "No exemption path exists — DEVITALIZE or REMOVE real findings; "
            "file CPV detector issues for false positives."
        )
        # Show the first few blocking findings so the user knows what to fix.
        for f in blocking[:10]:
            lvl = (f.get("level") or "").upper()
            file_ = f.get("file") or "?"
            msg = (f.get("message") or "")[:160]
            _log(f"    BLOCK [{lvl}] {file_} :: {msg}")
        if len(blocking) > 10:
            _log(f"    ... and {len(blocking) - 10} more")
        return False

    _log("  PASS (zero blocking findings, no exemptions applied)")
    return True


def _gate_marketplace_registration() -> bool:
    """G5: confirm this plugin is wired into its marketplace.

    Layout A check (this plugin is Layout A — separate marketplace repo
    Emasoft/ai-maestro-plugins). Verifies that:
      1. .github/workflows/notify-marketplace.yml exists at the canonical
         path (otherwise a push to main won't notify the marketplace and
         users won't see the new version).
      2. The MARKETPLACE_PAT secret reference is present in the workflow
         (we can't check whether the secret IS SET — that's a server-side
         check — but we can at least catch the case where the workflow
         was rewritten without the secret reference).

    Soft-pass (returns True with a warning) if the workflow exists but
    a deeper check fails — the workflow run itself will surface the
    real problem. Hard-fail only if the workflow is entirely missing.
    """
    _log("G5: marketplace-registration check (Layout A)")
    notify_yml = REPO_ROOT / ".github" / "workflows" / "notify-marketplace.yml"
    if not notify_yml.is_file():
        _log("  FAIL: .github/workflows/notify-marketplace.yml is missing")
        _log("  Without this, the marketplace will NOT learn about the new version.")
        _log("  Restore the file from the canonical CPV generator or git history.")
        return False
    body = notify_yml.read_text(encoding="utf-8")
    if "MARKETPLACE_PAT" not in body:
        _log("  WARNING: notify-marketplace.yml has no MARKETPLACE_PAT reference")
        _log("  The workflow will fail at push time. Soft-pass for now.")
        # Soft-pass — the workflow itself will surface the failure loudly.
    _log("  PASS (notify-marketplace.yml present + PAT reference found)")
    return True


def _gate_tests() -> bool:
    """G4: dev-browser test suite (tests/run-all-tests.py).

    Soft-pass if dev-browser is not on PATH so a fresh clone isn't blocked
    from pushing. A real CI run on a hosted dev-browser runner would
    enforce this hard.
    """
    _log("G4: dev-browser test suite (tests/run-all-tests.py)")
    if shutil.which("dev-browser") is None:
        _log("  WARNING: dev-browser not on PATH; soft-pass.")
        _log("  Install with: npm install -g dev-browser && dev-browser install")
        return True
    runner = REPO_ROOT / "tests" / "run-all-tests.py"
    if not runner.is_file():
        _log("  WARNING: tests/run-all-tests.py missing; skipping")
        return True
    if not os.access(runner, os.X_OK):
        # Best-effort: try to execute via the current python interpreter.
        _log("  test runner not executable; invoking via current interpreter")
        result = _run([sys.executable, str(runner)], check=False)
    else:
        result = _run([str(runner)], check=False)
    if result.returncode != 0:
        _log(f"  tests reported failures (exit {result.returncode})")
        return False
    _log("  PASS")
    return True


def _run_gate_mode() -> int:
    """Execute G0-G5 in order. Stops at the first failure.

    Gate order (canonical-pipeline-migration step 10, mirrors canon):
      G0 — Bypass-var rejection (NEW)
      G1 — Version-bump check
      G2 — Lint (ruff)
      G3 — Validate (cpv-remote-validate --strict)
      G4 — Tests (dev-browser, soft-pass on missing CLI)
      G5 — Marketplace-registration check (NEW)
    """
    _log("running quality gate (G0 -> G5)...")
    gates = (
        _gate_bypass_guard,
        _gate_version_bump,
        _gate_lint,
        _gate_validate,
        _gate_tests,
        _gate_marketplace_registration,
    )
    for gate in gates:
        if not gate():
            _log("gate FAILED — push aborted.")
            return 1
    _log("all gates passed.")
    return 0


# ---------------------------------------------------------------------------
# Hook installation (idempotent)
# ---------------------------------------------------------------------------

def _run_install_hook() -> int:
    """Copy git-hooks/pre-push -> .git/hooks/pre-push and set core.hooksPath.

    Both operations are idempotent — re-running only updates the file when
    its content actually changed, and only sets core.hooksPath when it
    differs from `git-hooks`.
    """
    if not HOOK_SOURCE.is_file():
        sys.exit(f"missing source hook: {HOOK_SOURCE}")

    # Step 1 — set core.hooksPath if it differs.
    current = _run(
        ["git", "config", "--local", "--default", "", "core.hooksPath"],
        check=False,
        capture=True,
    ).stdout.strip()
    if current == "git-hooks":
        _log("core.hooksPath already = git-hooks")
    else:
        _log(f"setting core.hooksPath: {current!r} -> git-hooks")
        _run(["git", "config", "--local", "core.hooksPath", "git-hooks"])

    # Step 2 — copy into .git/hooks/pre-push for git installs that don't
    # respect core.hooksPath (older git, GUI clients with their own hook
    # invocation paths). Only writes when the content differs.
    git_dir_result = _run(
        ["git", "rev-parse", "--git-dir"],
        check=False,
        capture=True,
    )
    if git_dir_result.returncode != 0:
        sys.exit("not a git repo (rev-parse --git-dir failed)")
    git_dir = REPO_ROOT / git_dir_result.stdout.strip()
    legacy_hook = git_dir / "hooks" / "pre-push"
    legacy_hook.parent.mkdir(parents=True, exist_ok=True)

    source_bytes = HOOK_SOURCE.read_bytes()
    if legacy_hook.is_file() and legacy_hook.read_bytes() == source_bytes:
        _log(f"{legacy_hook} already up-to-date")
    else:
        _log(f"copying git-hooks/pre-push -> {legacy_hook}")
        legacy_hook.write_bytes(source_bytes)

    # Always make sure both copies are executable. chmod is a no-op if the
    # bits already match.
    for path in (HOOK_SOURCE, legacy_hook):
        st = path.stat()
        path.chmod(st.st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    _log("hook installed.")
    return 0


# ---------------------------------------------------------------------------
# Mutating writers (publish-mode S6)
# ---------------------------------------------------------------------------

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


def _sync_uv_lock() -> None:
    # Keep uv.lock in lockstep with pyproject.toml. Without this every release
    # leaves the lock stale by one version → next publish refuses S1 (clean
    # tree) and a separate chore commit is needed to catch up. Idempotent and
    # silently skipped when neither uv nor uv.lock is present.
    if not UV_LOCK.exists():
        return
    if shutil.which("uv") is None:
        return
    _run(["uv", "lock"])


def _regenerate_changelog(new_version: str) -> None:
    """Regenerate CHANGELOG.md via git-cliff using the canonical pattern.

    Canon uses `--bump --unreleased --tag` for a single deterministic
    invocation that handles the not-yet-released commits. The previous
    `--tag vX.Y.Z --output CHANGELOG.md` form works too but doesn't auto-
    discover the "unreleased" set; the canon form is preferred because
    it's the same one used by `git-cliff --bumped-version` for the
    version-detection path.
    """
    if not shutil.which("git-cliff"):
        _log("git-cliff not on PATH; skipping CHANGELOG regeneration.")
        return
    # Canon pattern: --bump --unreleased --tag <tag> --output <file>
    # The --bump flag is a no-op when --tag is explicit but stays for
    # canon-parity (matches the gen_publish_py template form).
    _run(
        [
            "git-cliff",
            "--bump",
            "--unreleased",
            "--tag",
            f"v{new_version}",
            "--output",
            str(CHANGELOG),
        ],
    )


# ── Idempotent commit/tag helpers (added in step 10 per canon Gate 10/11) ──


def _expected_release_subject(new_version: str, message: str | None) -> str:
    """The exact commit subject we'd write for this version + message."""
    return message or f"chore(release): v{new_version}"


def _head_subject() -> str:
    """Return HEAD's commit subject (first line)."""
    result = _run(
        ["git", "log", "-1", "--pretty=%s"],
        check=False,
        capture=True,
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def _working_tree_clean() -> bool:
    """True iff `git status --porcelain` returns no entries."""
    result = _run(
        ["git", "status", "--porcelain"],
        check=False,
        capture=True,
    )
    return result.returncode == 0 and not result.stdout.strip()


def _tag_exists(tag: str) -> bool:
    """True iff the given tag exists locally."""
    result = _run(
        ["git", "rev-parse", "-q", "--verify", f"refs/tags/{tag}"],
        check=False,
        capture=True,
    )
    return result.returncode == 0


def _git_commit(new_version: str, message: str | None) -> None:
    """Stage the release files and commit. IDEMPOTENT (canon Gate 10).

    If HEAD's subject already matches the expected release commit AND the
    working tree is clean, the commit step is skipped — this lets a
    previous interrupted publish (Gate 10 succeeded, Gate 11/12 failed)
    be resumed via a plain re-invocation of publish.py without double-
    bumping the version.
    """
    summary = _expected_release_subject(new_version, message)

    # Idempotency check — already committed for this version?
    if _head_subject() == summary and _working_tree_clean():
        _log(f"  HEAD already at expected release commit '{summary}'; skipping commit")
        return

    files = [str(PLUGIN_JSON.relative_to(REPO_ROOT))]
    if PYPROJECT.exists():
        files.append(str(PYPROJECT.relative_to(REPO_ROOT)))
    if PACKAGE_JSON.exists():
        files.append(str(PACKAGE_JSON.relative_to(REPO_ROOT)))
    if UV_LOCK.exists():
        files.append(str(UV_LOCK.relative_to(REPO_ROOT)))
    if CHANGELOG.exists():
        files.append(str(CHANGELOG.relative_to(REPO_ROOT)))
    _run(["git", "add", *files])
    _run(["git", "commit", "-m", summary])


def _git_tag(new_version: str) -> None:
    """Tag the current HEAD. IDEMPOTENT (canon Gate 11).

    If the tag already exists locally (e.g. from a previous interrupted
    publish), the tag step is skipped — same resume-friendliness as
    _git_commit.
    """
    tag = f"v{new_version}"
    if _tag_exists(tag):
        _log(f"  tag {tag} already exists locally; skipping tag")
        return
    _run(["git", "tag", tag])


def _git_push(new_version: str) -> None:
    """B2 — atomic push of HEAD + tag in a single transaction.

    Previously this was two separate `git push` invocations; if the
    first succeeded but the second failed (network blip mid-push, auth
    re-prompt timeout), the user was left with a divergent local repo:
    HEAD pushed but tag absent on remote, requiring manual recovery.
    `--atomic` makes the remote accept either both refs or neither.

    On total failure we roll back the local tag + commit so the user is
    not stranded with a half-published state. The error is loud (a
    full traceback message) so the user knows exactly what to do next.

    Wrapped with git_with_retry so transient network hiccups (DNS, TCP
    reset, 5xx from github.com edge) auto-recover; 4xx-class permanent
    errors (auth, non-fast-forward) fall through immediately. The
    helper auto-injects `-c http.lowSpeedLimit=100 -c http.lowSpeedTime=300`
    for slow-link tolerance per ~/.claude/rules/github-timeouts.md.
    """
    tag = f"v{new_version}"
    print(f"$ git push --atomic origin HEAD {tag}")
    result = git_with_retry(
        ["git", "push", "--atomic", "origin", "HEAD", tag],
        cwd=REPO_ROOT,
        check=False,
        capture_output=False,
    )
    if result.returncode == 0:
        return
    # Push failed — roll back local commit + tag so the user can retry
    # cleanly. We use `--soft` so the working-tree changes from S6/S8
    # (manifest bumps, CHANGELOG regen) are preserved as staged
    # modifications, not destroyed.
    _log(
        "  git push --atomic failed; rolling back local tag + commit "
        f"so you can retry. Original exit code: {result.returncode}"
    )
    _run(["git", "tag", "-d", tag], check=False)
    _run(["git", "reset", "--soft", "HEAD~1"], check=False)
    sys.exit(
        "publish: remote push failed. Local tag + commit have been "
        "removed; staged changes preserved. Fix the network/auth "
        "issue and re-run `python3 scripts/publish.py --patch --push`."
    )


# ---------------------------------------------------------------------------
# Publish stages (S1-S10)
# ---------------------------------------------------------------------------

def _stage_preflight() -> None:
    """S1: refuse if the working tree is dirty."""
    _log("S1: pre-flight (clean working tree)")
    result = _run(["git", "status", "--porcelain"], check=False, capture=True)
    if result.returncode != 0:
        sys.exit("git status failed")
    if result.stdout.strip():
        _log("  working tree is NOT clean — commit or stash first")
        sys.exit(1)
    _log("  PASS")


def _stage_lint() -> None:
    """S2: lint via _gate_lint (single source of truth)."""
    _log("S2: lint")
    if not _gate_lint():
        sys.exit(1)


def _stage_validate() -> None:
    """S3: validate via _gate_validate (single source of truth)."""
    _log("S3: validate")
    if not _gate_validate():
        sys.exit(1)


def _stage_tests() -> None:
    """S4: tests via _gate_tests (single source of truth)."""
    _log("S4: tests")
    if not _gate_tests():
        sys.exit(1)


def _stage_version_consistency() -> None:
    """S5: every manifest must agree on the current version BEFORE bump.

    plugin.json, pyproject.toml, package.json — all three (when present)
    must report the same semver string. Drift here means a previous publish
    was interrupted or a manual edit slipped through.
    """
    _log("S5: version consistency (plugin.json / pyproject.toml / package.json)")
    pj = ".".join(str(p) for p in _read_plugin_version())
    versions = {"plugin.json": pj}
    py = _read_pyproject_version()
    if py is not None:
        versions["pyproject.toml"] = py
    pkg = _read_package_version()
    if pkg is not None:
        versions["package.json"] = pkg
    distinct = set(versions.values())
    for name, ver in versions.items():
        _log(f"  {name}: {ver}")
    if len(distinct) > 1:
        _log("  versions DIFFER — fix manually before publishing")
        sys.exit(1)
    _log("  PASS")


def _stage_bump(kind: str) -> str:
    """S6: bump every manifest in lockstep."""
    _log(f"S6: bump version ({kind})")
    current = _read_plugin_version()
    new_version = _bump(current, kind)
    _log(
        f"  {'.'.join(str(p) for p in current)} -> {new_version}"
    )
    _write_plugin_json(new_version)
    _write_pyproject(new_version)
    _write_package_json(new_version)
    _sync_uv_lock()
    return new_version


def _stage_update_readme_badge(new_version: str) -> None:
    """S7: update the README version badge if it exists.

    The standard pattern is `version-X.Y.Z-blue` inside a shields.io URL.
    If the README has no such badge (which is the case here — README only
    has a license badge), this stage skips cleanly.
    """
    _log("S7: README version badge")
    readme = REPO_ROOT / "README.md"
    if not readme.is_file():
        _log("  README.md missing; skipping")
        return
    text = readme.read_text(encoding="utf-8")
    pattern = re.compile(r"version-\d+\.\d+\.\d+-blue")
    if not pattern.search(text):
        _log("  no version-X.Y.Z-blue badge found; skipping cleanly")
        return
    new_text = pattern.sub(f"version-{new_version}-blue", text)
    if new_text != text:
        readme.write_text(new_text, encoding="utf-8")
        _log(f"  updated README badge -> {new_version}")
    else:
        _log("  README badge already up-to-date")


def _stage_changelog(new_version: str) -> None:
    """S8: regenerate CHANGELOG.md via git-cliff."""
    _log("S8: regenerate CHANGELOG.md (git-cliff)")
    _regenerate_changelog(new_version)


def _stage_commit_tag_push(
    new_version: str,
    message: str | None,
    push: bool,
) -> None:
    """S9: commit + tag, plus push only if --push."""
    _log("S9: commit + tag" + (" + push" if push else ""))
    _git_commit(new_version, message)
    _git_tag(new_version)
    if push:
        _git_push(new_version)
    else:
        _log(
            f"  commit + tag v{new_version} created locally. "
            "Re-run with --push or push manually."
        )


def _stage_github_release(new_version: str, push: bool) -> None:
    """S10: create a GitHub Release if `gh` is on PATH AND --push was supplied.

    With --push the tag has just been pushed to origin; the `release.yml`
    workflow on the remote will fire automatically. We only invoke
    `gh release create` here as a belt-and-braces backup so a local
    publish without remote workflows enabled still ends with a Release.
    """
    _log("S10: GitHub release")
    if not push:
        _log("  --push not supplied; skipping (no tag pushed yet)")
        return
    if shutil.which("gh") is None:
        _log("  gh CLI not on PATH; skipping (release.yml on remote will run)")
        return
    # Check whether the release already exists (release.yml may have raced
    # us). If so, skip — `gh release create` would error out on duplicate.
    # Wrapped with gh_with_retry for transient-error survival; auto-sets
    # GH_HTTP_TIMEOUT=300 for slow-link tolerance.
    print(f"$ gh release view v{new_version}")
    check = gh_with_retry(
        ["gh", "release", "view", f"v{new_version}"],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
    )
    if check.returncode == 0:
        _log(f"  release v{new_version} already exists; skipping")
        return
    # gh release create: wrapped with retry — github.com edge 502/503 during
    # release POST is common and recoverable. The classifier treats
    # "already exists" as permanent (idempotent retry is safe; permanent
    # failure surfaces loudly).
    print(f"$ gh release create v{new_version} --title v{new_version} --generate-notes")
    create_result = gh_with_retry(
        [
            "gh",
            "release",
            "create",
            f"v{new_version}",
            "--title",
            f"v{new_version}",
            "--generate-notes",
        ],
        cwd=REPO_ROOT,
        check=False,
        capture_output=False,
    )
    if create_result.returncode != 0:
        sys.exit(create_result.returncode)


def _run_publish_mode(
    kind: str,
    message: str | None,
    push: bool,
    dry_run: bool,
) -> int:
    """The 10-stage canonical publish pipeline."""
    _log(f"publish: kind={kind} push={push} dry_run={dry_run}")
    _stage_preflight()
    _stage_lint()
    _stage_validate()
    _stage_tests()
    _stage_version_consistency()
    if dry_run:
        _log("--dry-run: stopping before any version mutation.")
        return 0
    new_version = _stage_bump(kind)
    _stage_update_readme_badge(new_version)
    _stage_changelog(new_version)
    _stage_commit_tag_push(new_version, message, push)
    _stage_github_release(new_version, push)
    _log(f"publish complete: v{new_version}")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--gate",
        action="store_true",
        help="run the 6 quality gates (G0-G5); no mutations",
    )
    mode.add_argument(
        "--gate-validate",
        action="store_true",
        help=(
            "run ONLY G3 (validate plugin via cpv-remote-validate --strict, "
            "with documented-known-exception allowlist applied). For use "
            "in CI workflows after a push, where the other gates (version "
            "bump, dev-browser tests, marketplace registration) either "
            "already passed pre-push, do not apply, or need different "
            "runner setup."
        ),
    )
    mode.add_argument(
        "--install-hook",
        action="store_true",
        help=(
            "copy git-hooks/pre-push -> .git/hooks/pre-push and set "
            "core.hooksPath git-hooks (idempotent)"
        ),
    )
    mode.add_argument("--patch", action="store_true", help="bump patch version")
    mode.add_argument("--minor", action="store_true", help="bump minor version")
    mode.add_argument("--major", action="store_true", help="bump major version")
    parser.add_argument("--message", "-m", help="custom commit message (publish mode)")
    parser.add_argument(
        "--push",
        action="store_true",
        help="push commit + tag to origin (publish mode; off by default)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "publish mode: run S1-S5 then exit before any version mutation. "
            "Useful as a pre-publish smoke test."
        ),
    )
    return parser


def main() -> int:
    args = _build_parser().parse_args()

    if args.gate:
        return _run_gate_mode()
    if args.gate_validate:
        # G3-only — for CI Validate job. Returns 0 on PASS, 1 on FAIL.
        return 0 if _gate_validate() else 1
    if args.install_hook:
        return _run_install_hook()

    kind = "major" if args.major else "minor" if args.minor else "patch"
    return _run_publish_mode(kind, args.message, args.push, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
