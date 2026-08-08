#!/usr/bin/env python3
"""amvcp-panel-push.py — deliver a generated artifact to the AI Maestro side panel.

Why this script exists
----------------------

amvcp skills emit a self-contained `.html` file and then tell the user where
it is. When amvcp happens to be running inside the AI Maestro harness, there
is a better destination: the dashboard side panel, which renders the artifact
next to the agent that produced it. `aimaestro-panel.sh` is the stable,
skill-facing CLI for that, and its own header states visualizer plugins are
INTENDED to call it and never the HTTP API directly.

Why it is OPTIONAL, and must stay that way
------------------------------------------

amvcp is a UNIVERSAL standalone plugin: ai-maestro depends on amvcp, not the
other way round. So this script treats the harness as something that may
simply not be there. Absence is a normal outcome, not a failure:

    no `aimaestro-panel.sh` on PATH  -> exit 0, print `panel: unavailable`
    no target agent resolvable       -> exit 0, print `panel: no-target`

Both cases mean "amvcp behaves exactly as it does standalone" — the caller
prints the file path and carries on. Nothing about amvcp requires the harness.

Where it does NOT degrade gracefully
------------------------------------

Once the CLI IS present and a target IS known, a delivery problem is a real
failure and is reported as one (non-zero exit, message on stderr). In
particular `delivered: 0` is NOT success: the panel is a live surface, not a
queue, so a zero count means no dashboard had that channel open and the
artifact was DROPPED, not stored. Reporting that as delivered would be the
worst outcome here — the user would believe the artifact is on screen when
nothing received it. The `status` pre-check exists to turn that into an
up-front, actionable answer instead of a silent drop.

Discovery is PATH-only (`shutil.which`) on purpose: ai-maestro installs the
script to `~/.local/bin`, and hardcoding any absolute path would both break
on other machines and quietly turn an optional integration into a required
one.

Usage
-----

    amvcp-panel-push.py <artifact.html> [--agent <uuid-or-name>] [--no-status]

The target agent comes from `--agent`, else `$AMVCP_PANEL_AGENT`, else
`$AIMAESTRO_AGENT_ID`. Auth is the harness's business: an AGENT caller has
`AID_AUTH` exported already, a USER caller needs `AIMAESTRO_SUDO_TOKEN`; this
script passes neither explicitly and lets the CLI read the environment, so
amvcp never handles a credential.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys

PANEL_CLI = "aimaestro-panel.sh"
# The CLI's own curl calls use --max-time 30; give the wrapper a little more so
# a slow-but-succeeding request is reported by the CLI rather than killed here.
TIMEOUT_S = 45


def _out(msg: str) -> None:
    print(msg, flush=True)


def _fail(msg: str) -> int:
    print(msg, file=sys.stderr, flush=True)
    return 1


def find_panel_cli() -> str | None:
    return shutil.which(PANEL_CLI)


def resolve_agent(explicit: str | None) -> str | None:
    for candidate in (explicit, os.environ.get("AMVCP_PANEL_AGENT"), os.environ.get("AIMAESTRO_AGENT_ID")):
        if candidate and candidate.strip():
            return candidate.strip()
    return None


def run_cli(cli: str, args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        [cli, *args],
        capture_output=True,
        text=True,
        timeout=TIMEOUT_S,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def delivered_count(stdout: str) -> int | None:
    """Read `delivered` out of the CLI's JSON response.

    Returns None when the response is not JSON or carries no `delivered` key —
    an unknown count must never be treated as a successful delivery, so callers
    distinguish None from 0 and report it rather than assuming either way.
    """
    try:
        payload = json.loads(stdout)
    except (ValueError, TypeError):
        return None
    if isinstance(payload, dict) and isinstance(payload.get("delivered"), int):
        return payload["delivered"]
    return None


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        prog="amvcp-panel-push.py",
        description="Push an amvcp HTML artifact into the AI Maestro side panel, when one is available.",
    )
    parser.add_argument("artifact", help="path to the self-contained .html file to display")
    parser.add_argument("--agent", default=None, help="agent UUID or name; else $AMVCP_PANEL_AGENT / $AIMAESTRO_AGENT_ID")
    parser.add_argument(
        "--no-status",
        action="store_true",
        help="skip the status pre-check (the check is what turns a silent drop into an up-front answer)",
    )
    opts = parser.parse_args(argv)

    artifact = pathlib.Path(opts.artifact).expanduser()
    if not artifact.is_file():
        return _fail(f"panel: artifact not found: {artifact}")

    cli = find_panel_cli()
    if cli is None:
        # Standalone amvcp. Not an error — the overwhelmingly common case.
        _out("panel: unavailable")
        return 0

    agent = resolve_agent(opts.agent)
    if agent is None:
        _out("panel: no-target")
        return 0

    if not opts.no_status:
        code, _, err = run_cli(cli, ["status", agent])
        if code != 0:
            return _fail(f"panel: status failed for {agent}: {err or 'no detail'}")

    code, stdout, err = run_cli(cli, ["set", agent, "--html-file", str(artifact)])
    if code != 0:
        return _fail(f"panel: set failed for {agent}: {err or 'no detail'}")

    count = delivered_count(stdout)
    if count is None:
        return _fail(f"panel: set returned no delivered count; artifact NOT confirmed on screen: {artifact}")
    if count == 0:
        # Live surface, not a queue: nothing had the channel open, so this was
        # dropped. Surfacing the path is the honest outcome.
        return _fail(f"panel: dropped (delivered=0, no dashboard listening); artifact at {artifact}")

    _out(f"panel: delivered={count} agent={agent}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except subprocess.TimeoutExpired:
        sys.exit(_fail(f"panel: {PANEL_CLI} timed out after {TIMEOUT_S}s"))
