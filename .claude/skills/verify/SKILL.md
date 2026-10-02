---
name: verify
description: Run the full dev-browser test gate before committing. Invoked by Claude Code's commit guidance before every commit except docs-only and tests-only ones.
---

Run the full dev-browser suite: `cd /Users/emanuelesabetta/Code/visual-comunicator/tests && python3 run-tests.py` (or the wrapper `./run-all-tests.py`). It exits 0 only if every test passes.

Before running, restart the dev-browser daemon if pages have accumulated — mass "Target crashed" failures that pass in isolation are daemon staleness, not product bugs (stop + status, then rerun). A minutes-scale run is expected.

Skip this gate only for docs-only or tests-only commits. Any failure blocks the commit: fix or report, never bypass.
