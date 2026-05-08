#!/usr/bin/env python3
"""Wrapper that runs the full ai-maestro-visual-communicator-plugin test suite.

Pre-requisites (the runner enforces them anyway):
  - python3 on PATH
  - uv on PATH (used by render-interactive-report.py)
  - dev-browser on PATH (npm install -g dev-browser; dev-browser install)

Exits non-zero if any test fails.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    here = Path(__file__).resolve().parent
    runner = here / "run-tests.py"
    return subprocess.run([sys.executable, str(runner), *sys.argv[1:]], check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
