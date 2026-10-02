---
name: verify
description: Run the full dev-browser test gate before committing. Claude Code commit guidance looks for a skill named verify before commits other than docs-only and tests-only.
---

Run the full dev-browser suite: `cd "$(git rev-parse --show-toplevel)/tests" && python3 run-tests.py` (or the wrapper `./run-all-tests.py`). It exits 0 only if every test passes. The rev-parse anchor resolves the repo root, so this works from any directory inside the clone.

Before running, restart the dev-browser daemon if pages have accumulated — mass "Target crashed" failures that pass in isolation are daemon staleness, not product bugs (stop + status, then rerun). A minutes-scale run is expected.

Skip this gate only for docs-only or tests-only commits. Any failure blocks the commit: fix or report, never bypass.
