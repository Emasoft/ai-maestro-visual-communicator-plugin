#!/usr/bin/env python3
"""amvcp-docwiki-search.py — memgrep → wiki search-results HTML (TRDD-103a53e0, Phase 4).

The agent-mediated search flow: Claude runs memgrep, pipes its output here, and gets a
Wikipedia-style results-list HTML *fragment* it can paste into the wiki's
`[data-ve-doc="search"]` section — so Claude spends ≈0 context tokens generating the HTML.

The fragment markup matches the client-side search the shell renders (same
`.docwiki-results > .docwiki-result` shape), so it drops straight in and the
`data-ve-navigate` links route through the Phase-1 shell.

Usage:
    memgrep recall "QUERY" <memdir> --json | \\
        python3 scripts/amvcp-docwiki-search.py --query "QUERY" > /tmp/results.html

stdin accepts EITHER:
  * a memgrep `--json` array of objects: {path, description?|desc?, title?, snippet?|excerpt?}
  * OR plain newline-separated file paths (e.g. `grep -rl` / `memgrep recall` text output;
    a leading "path — description" form is also split).

Each path maps to its built wiki route (same id derivation as amvcp-docwiki-build.py):
  *PRRD.md → prrd ;  TRDD-*.md → trdd/<8hex> ;  any other *.md → mem/<stem> ;
  anything else → a non-navigating plain row (never a broken data-ve-navigate link).

Stdlib only. No network. No third-party deps.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

# Same id shapes the build script recognises (keep in sync with amvcp-docwiki-build.py).
_RE_TRDD_FULLUUID = re.compile(r"^TRDD-([0-9a-fA-F]{8})-[0-9a-fA-F]{4}-")
_RE_TRDD_TS = re.compile(r"-([0-9a-fA-F]{8})-")
_RE_FM_TRDD_ID = re.compile(r"^trdd-id:\s*([0-9a-fA-F]{8})", re.MULTILINE)


def _esc(s: str) -> str:
    return html.escape(s if isinstance(s, str) else str(s), quote=True)


def _trdd_hex8(path: Path) -> str:
    """8hex for a TRDD path: prefer frontmatter `trdd-id:`, else the filename token."""
    try:
        head = path.read_text(encoding="utf-8")[:600]
        m = _RE_FM_TRDD_ID.search(head)
        if m:
            return m.group(1).lower()
    except OSError:
        pass
    name = path.name
    m = _RE_TRDD_FULLUUID.match(name)
    if m:
        return m.group(1).lower()
    m = _RE_TRDD_TS.search(name)
    if m:
        return m.group(1).lower()
    return ""


def path_to_route(path_str: str) -> str | None:
    """Map a file path to its wiki route, or None if it has no wiki page (plain row)."""
    p = Path(path_str.strip())
    name = p.name
    if not name:
        return None
    if name == "PRRD.md":
        return "prrd"
    if name.startswith("TRDD-") and name.endswith(".md"):
        h = _trdd_hex8(p)
        return ("trdd/" + h) if h else None
    # memgrep is the memory tool; a non-TRDD/PRRD .md from it is treated as a mem note.
    if name.endswith(".md") and name not in ("MEMORY.md", "memory-index.md"):
        return "mem/" + p.stem
    return None


def _records_from_stdin(raw: str) -> list[dict]:
    """Parse stdin into [{path, title?, desc?, snippet?}]. JSON array OR plain paths."""
    raw = raw.strip()
    if not raw:
        return []
    if raw[0] in "[{":
        data = json.loads(raw)
        if isinstance(data, dict):
            data = data.get("results") or data.get("hits") or [data]
        out = []
        for d in data:
            if isinstance(d, str):
                out.append({"path": d})
            elif isinstance(d, dict):
                out.append({
                    "path": d.get("path") or d.get("file") or d.get("filename") or "",
                    "title": d.get("title"),
                    "desc": d.get("description") or d.get("desc"),
                    "snippet": d.get("snippet") or d.get("excerpt") or d.get("match"),
                })
        return [r for r in out if r.get("path")]
    # plain text: one path per line; tolerate "path — description" / "path: description"
    out = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^(\S+?\.md)\s*(?:[—:-]\s*(.*))?$", line)
        if m:
            out.append({"path": m.group(1), "desc": (m.group(2) or "").strip() or None})
        else:
            out.append({"path": line.split()[0]})
    return out


def render_fragment(records: list[dict], query: str) -> str:
    rows: list[str] = []
    for rec in records:
        path_str = rec["path"]
        route = path_to_route(path_str)
        title = rec.get("title") or Path(path_str).stem
        snippet = rec.get("snippet") or rec.get("desc") or ""
        if route:
            rtype = route.split("/")[0] if "/" in route else route
            link = ('<a class="docwiki-result-title" href="#/%s" data-ve-navigate>%s</a>'
                    % (_esc(route), _esc(title)))
            chip = '<span class="docwiki-chip">%s</span>' % _esc(rtype.upper())
        else:
            # no wiki page for this path — show it, but never as a broken nav link
            link = '<span class="docwiki-result-title">%s</span>' % _esc(title)
            chip = ('<span class="docwiki-chip">%s</span>'
                    % _esc(Path(path_str).suffix.lstrip(".").upper() or "FILE"))
        snip = ('<p class="docwiki-snippet">%s</p>' % _esc(snippet)) if snippet else ""
        rows.append('<div class="docwiki-result">%s%s%s</div>' % (link, chip, snip))

    n = len(rows)
    head = ('<h1>Search</h1>\n<p class="docwiki-lead">%d result%s%s</p>'
            % (n, "" if n == 1 else "s",
               (" for «%s»" % _esc(query)) if query else ""))
    if not rows:
        return head + "\n"
    return head + '\n<div class="docwiki-results">\n' + "\n".join(rows) + "\n</div>\n"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="amvcp-docwiki-search.py",
        description="Convert memgrep output into a wiki search-results HTML fragment.")
    ap.add_argument("--query", default="", help="the search query (for the results header)")
    args = ap.parse_args(argv)
    raw = sys.stdin.read()
    try:
        records = _records_from_stdin(raw)
    except json.JSONDecodeError as exc:
        sys.stderr.write("FATAL: stdin is neither valid JSON nor plain paths: %s\n" % exc)
        return 2
    sys.stdout.write(render_fragment(records, args.query))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
