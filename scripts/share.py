#!/usr/bin/env python3
"""Share an ai-maestro-visual-communicator HTML page via Vercel.

Wraps the Pi-compatible ``vercel-deploy`` skill so the user gets a public,
claim-able preview URL with no Vercel account or API key.

The script:

1. Validates that an HTML file argument was provided and exists.
2. Locates the ``vercel-deploy`` skill's ``deploy.sh`` in one of the
   well-known Pi skill paths.
3. Copies the input file to a fresh temp directory as ``index.html`` (Vercel
   serves ``index.html`` at the deployment root).
4. Invokes the deploy script, captures combined stdout+stderr, and extracts
   the preview URL plus the optional claim URL via regex.
5. Prints human-readable progress to stderr (with ANSI colour) and emits a
   single JSON object on stdout for programmatic callers.

Usage:
    ./share.py <html-file>

Exit codes match the bash predecessor:
    1 — usage error, file not found, deploy failure, or no preview URL
    0 — successful deployment
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# ANSI colour codes — mirror share.sh exactly so the user-facing output is
# identical between the two implementations.
RED = "\033[0;31m"
GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
NC = "\033[0m"

# Candidate locations for the Pi-compatible vercel-deploy skill. Order
# matters: ~/.pi takes precedence because that's the canonical Pi user
# install; /mnt/skills/user is the Pi container mount used inside skills.
VERCEL_SCRIPT_CANDIDATES: tuple[Path, ...] = (
    Path.home() / ".pi" / "agent" / "skills" / "vercel-deploy" / "scripts" / "deploy.sh",
    Path("/mnt/skills/user/vercel-deploy/scripts/deploy.sh"),
)

# Regexes for parsing deploy.sh output. Anchored to ``vercel.app`` /
# ``vercel.com/claim-deployment`` so we don't accidentally pick up unrelated
# URLs the deploy script may print (e.g. dashboard links, docs URLs).
PREVIEW_URL_RE = re.compile(r"https://[^\"\s]+\.vercel\.app")
CLAIM_URL_RE = re.compile(r"https://vercel\.com/claim-deployment[^\"\s]+")


def _eprint(message: str) -> None:
    """Print to stderr without a trailing flush surprise.

    Wrapper exists so the rest of the file reads like the bash original
    (``echo ... >&2``) instead of repeating ``file=sys.stderr`` everywhere.
    """
    print(message, file=sys.stderr)


def _find_vercel_script() -> Path | None:
    """Return the first existing ``deploy.sh`` candidate, or ``None``.

    The bash original used a ``for`` loop; we keep the same precedence by
    iterating in declaration order.
    """
    for candidate in VERCEL_SCRIPT_CANDIDATES:
        if candidate.is_file():
            return candidate
    return None


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv

    # Replicate the bash usage check. ``argv[0]`` is the script name when
    # called via ``./share.py`` so the usage line resolves naturally.
    if not args or not args[0]:
        _eprint(f"{RED}Error: Please provide an HTML file to share{NC}")
        _eprint(f"Usage: {sys.argv[0]} <html-file>")
        return 1

    html_file = Path(args[0])
    if not html_file.is_file():
        _eprint(f"{RED}Error: File not found: {html_file}{NC}")
        return 1

    vercel_script = _find_vercel_script()
    if vercel_script is None:
        _eprint(f"{RED}Error: vercel-deploy skill not found{NC}")
        _eprint("Install it with: pi install npm:vercel-deploy")
        return 1

    # ``TemporaryDirectory`` mirrors the bash ``mktemp -d`` + ``trap rm -rf``
    # pair: cleanup happens on every exit path, including exceptions, without
    # us having to install signal handlers manually.
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_index = Path(temp_dir) / "index.html"
        shutil.copy2(html_file, temp_index)

        _eprint(f"{CYAN}Sharing {html_file.name}...{NC}")

        # The bash version did ``set +e`` around the deploy invocation so it
        # could capture both the exit code and the merged stdout+stderr for
        # error reporting. ``check=False`` + ``stderr=STDOUT`` reproduces
        # that exactly. We invoke ``bash`` explicitly because the upstream
        # script is bash (mirrors ``bash "$VERCEL_SCRIPT" ...``) and may not
        # be marked executable in every install layout.
        completed = subprocess.run(  # noqa: S603 — args fully under our control
            ["bash", str(vercel_script), temp_dir],
            capture_output=True,
            text=True,
            check=False,
        )
        result = (completed.stdout or "") + (completed.stderr or "")
        deploy_exit = completed.returncode

    if deploy_exit != 0:
        _eprint(f"{RED}Error: Deployment failed{NC}")
        _eprint(result)
        return 1

    # ``re.search`` on the merged string + the URL-anchored patterns is the
    # Python equivalent of ``grep -oE ... | head -1`` — first match wins.
    preview_match = PREVIEW_URL_RE.search(result)
    claim_match = CLAIM_URL_RE.search(result)
    preview_url = preview_match.group(0) if preview_match else ""
    claim_url = claim_match.group(0) if claim_match else ""

    if not preview_url:
        _eprint(f"{RED}Error: Deployment failed{NC}")
        _eprint(result)
        return 1

    _eprint("")
    _eprint(f"{GREEN}✓ Shared successfully!{NC}")
    _eprint("")
    _eprint(f"{GREEN}Live URL:  {preview_url}{NC}")
    _eprint(f"{CYAN}Claim URL: {claim_url}{NC}")
    _eprint("")

    # Emit the first JSON line from the deploy output for programmatic
    # callers. The bash version did ``grep -E '^\\{' | head -1``; we
    # iterate manually so we stop at the first match (cheap, deterministic,
    # no shell needed).
    for line in result.splitlines():
        if line.startswith("{"):
            print(line)
            break

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
