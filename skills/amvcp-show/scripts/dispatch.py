#!/usr/bin/env python3
"""dispatch.py — amvcp-show smart router.

Takes ONE input (file path, URL, plain text, or `(skill, args)` tuple)
and emits a JSON action plan on stdout describing how the orchestrator
should handle it. For the most common case — a Markdown report — the
script ALSO runs the render-interactive-report.py + iTerm-launcher
pipeline itself and returns the launcher's selections payload inline.

Action plan shapes (one JSON object per invocation, written to stdout):

    {"action": "rendered",
     "kind":   "markdown",
     "html":   "/abs/path/to/output.html",
     "payload": { ... amvcp-select.py JSON ... }}

    {"action": "invoke_command",
     "command": "amvcp-interactive-report",
     "args":    ["/path/to/file.md"],
     "reason":  "markdown extension"}

    {"action": "invoke_skill",
     "skill":   "amvcp-prose-pages",
     "args":    ["/path/to/file.py"],
     "reason":  "code extension .py"}

    {"action": "passthrough",
     "kind":   "html",
     "html":   "/abs/path/to/file.html",
     "payload": { ... amvcp-select.py JSON ... }}

    {"action": "explicit_skill",
     "skill":  "amvcp-graph-diagrams",
     "args":   [...],
     "reason": "explicit (skill, args) two-token form"}

Exit codes: 0 on success, 2 on bad input (missing file, no argv).
"""

from __future__ import annotations

import json
import os
import pathlib
import re
import subprocess
import sys
from typing import Any

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
LAUNCHER = REPO_ROOT / "scripts" / "amvcp-show-launcher.py"
RENDER_INTERACTIVE_REPORT = REPO_ROOT / "scripts" / "render-interactive-report.py"

# Extension → action mapping. Multi-target extensions (e.g. .json needs a
# content sniff to choose between charts and prose) are handled in
# classify() with extra logic.
CODE_EXTS = {
    ".py", ".pyi", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".go", ".rs", ".rb", ".java", ".kt", ".scala", ".swift",
    ".c", ".cc", ".cpp", ".cxx", ".h", ".hh", ".hpp",
    ".cs", ".php", ".lua", ".pl", ".sh", ".bash", ".zsh", ".fish",
    ".sql", ".r", ".jl", ".dart", ".elm", ".ex", ".exs",
    ".yaml", ".yml", ".toml", ".ini", ".cfg",
}
IMAGE_EXTS = {".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".ico", ".tiff", ".tif"}
DATA_EXTS = {".csv", ".tsv"}
DIFF_EXTS = {".diff", ".patch"}

MERMAID_FIRSTLINE = re.compile(
    r"^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|"
    r"erDiagram|gantt|pie|journey|gitGraph|mindmap|timeline|quadrantChart|"
    r"requirementDiagram|C4Context|C4Container)\b",
    re.IGNORECASE,
)
LATEX_MARKERS = re.compile(
    r"\\(documentclass|begin\{[a-zA-Z*]+\}|usepackage|chapter|section)\b"
)


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------

def _read_head(path: pathlib.Path, max_bytes: int = 4096) -> str:
    try:
        with path.open("rb") as f:
            data = f.read(max_bytes)
        return data.decode("utf-8", errors="replace")
    except OSError:
        return ""


def _json_top_level_is_array(head: str) -> bool:
    stripped = head.lstrip("\ufeff \t\r\n")
    return stripped.startswith("[")


def _looks_like_mermaid(head: str) -> bool:
    for line in head.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("%%"):
            continue
        return bool(MERMAID_FIRSTLINE.match(stripped))
    return False


def _looks_like_latex(head: str) -> bool:
    return bool(LATEX_MARKERS.search(head))


def _looks_like_regex_source(head: str) -> bool:
    # Heuristic: short single-line `/.../flags` or pure regex metacharacters.
    # We intentionally keep this narrow — false positives would route real
    # text to the regex visualiser. Activates only on the explicit slash form.
    stripped = head.strip()
    if not stripped or "\n" in stripped:
        return False
    return bool(re.fullmatch(r"/.+/[gimsuxy]*", stripped))


def _looks_like_slides(head: str) -> bool:
    # Slides marker per TRDD: `---` between blocks of markdown. Require >= 2
    # `---` lines as own-line separators within the first 4 KB; that lets us
    # distinguish slide decks from regular markdown that happens to use one
    # `---` (often a single YAML frontmatter block).
    sep_lines = [ln for ln in head.splitlines() if ln.strip() == "---"]
    return len(sep_lines) >= 2


def classify(raw: str) -> dict[str, Any]:
    """Return a dict {kind: str, ...extra fields}.

    `kind` is one of: markdown, html, code, image, data_array, data_object,
    mermaid, regex, latex, diff, slides, plain_text, url, explicit_skill,
    bad_input.
    """
    # Explicit (skill, args) two-token form: caller passes e.g.
    # `amvcp-graph-diagrams|"draw a flowchart of X"` as a single arg with
    # a `|` separator. Intentionally not using positional argv because the
    # orchestrator may only have one arg slot to fill.
    if "|" in raw and not os.path.exists(raw):
        head, tail = raw.split("|", 1)
        head = head.strip()
        if head.startswith("amvcp-") and "/" not in head and "." not in head:
            return {
                "kind": "explicit_skill",
                "skill": head,
                "args": [tail.strip()],
            }

    # URL → defer to orchestrator (fetch-and-recurse is multi-step; the
    # router only emits the instruction).
    if raw.startswith(("http://", "https://")):
        return {"kind": "url", "url": raw}

    # File path branch — resolve and exist-check.
    p = pathlib.Path(raw).expanduser()
    try:
        p = p.resolve(strict=False)
    except OSError:
        return {"kind": "bad_input", "reason": "path resolution failed"}
    if not p.exists():
        # Not a path → plain text idea → route to coordinator.
        if "/" in raw or raw.startswith("."):
            return {"kind": "bad_input", "reason": "file not found"}
        return {"kind": "plain_text", "text": raw}
    if not p.is_file():
        return {"kind": "bad_input", "reason": "not a regular file"}

    ext = p.suffix.lower()
    head = _read_head(p)

    if ext in {".md", ".markdown"}:
        # Slide deck *.md is a special case — multi-`---` separator OR
        # explicit `slides:` frontmatter. We check the separator heuristic
        # but NOT frontmatter parsing (overkill for v1).
        if _looks_like_slides(head):
            return {"kind": "slides", "path": str(p)}
        return {"kind": "markdown", "path": str(p)}
    if ext in {".html", ".htm"}:
        return {"kind": "html", "path": str(p)}
    if ext in DIFF_EXTS:
        return {"kind": "diff", "path": str(p)}
    if ext in IMAGE_EXTS:
        return {"kind": "image", "path": str(p)}
    if ext in DATA_EXTS:
        return {"kind": "data_array", "path": str(p)}
    if ext == ".json":
        return {
            "kind": "data_array" if _json_top_level_is_array(head) else "data_object",
            "path": str(p),
        }
    if ext in CODE_EXTS:
        return {"kind": "code", "path": str(p), "language": ext.lstrip(".")}
    if ext in {".tex"}:
        return {"kind": "latex", "path": str(p)}
    if ext == ".mmd":
        return {"kind": "mermaid", "path": str(p)}

    # Unknown extension — sniff content.
    if _looks_like_mermaid(head):
        return {"kind": "mermaid", "path": str(p)}
    if _looks_like_latex(head):
        return {"kind": "latex", "path": str(p)}
    if _looks_like_regex_source(head):
        return {"kind": "regex", "path": str(p)}

    # Default fallback — treat as prose.
    return {"kind": "code", "path": str(p), "language": "txt"}


# ---------------------------------------------------------------------------
# Renderers / launchers
# ---------------------------------------------------------------------------

def _render_markdown_then_launch(md_path: pathlib.Path) -> dict[str, Any]:
    """Render markdown → HTML → launch via amvcp-show-launcher.py.

    Returns the action-plan dict. The launcher's stdout (the
    amvcp-select.py JSON payload) is included verbatim under `payload`.
    """
    if not RENDER_INTERACTIVE_REPORT.exists():
        return {
            "action": "invoke_command",
            "command": "amvcp-interactive-report",
            "args": [str(md_path)],
            "reason": (
                f"renderer not found at {RENDER_INTERACTIVE_REPORT} — "
                "fall through to slash-command form"
            ),
        }
    html_path = md_path.with_suffix(".html")
    replies_path = md_path.with_suffix(".replies.json")
    # --mode auto so EVERY `## …` heading becomes a finding section with a
    # Skip/Approve/Reject decision control. The default `--mode finding`
    # only anchors `## Finding N: …` headings, which silently skips
    # decision controls for hand-authored reports whose section structure
    # is "## 1. Title" / "## 2. Title" / etc. (the common case for the
    # Symphony-vs-AMOA-style comparison reports). Per TRDD-4c300620 §6,
    # every section must have the 3-state controls.
    cmd = [
        "python3", str(RENDER_INTERACTIVE_REPORT),
        "--report", str(md_path),
        "--replies", str(replies_path),
        "--out", str(html_path),
        "--runtime-url", "amvcp-runtime.js",
        "--mode", "auto",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60, check=False)
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return {
            "action": "error",
            "reason": f"render-interactive-report.py invocation failed: {exc}",
        }
    if result.returncode != 0:
        return {
            "action": "error",
            "reason": (
                f"render-interactive-report.py exit={result.returncode}; "
                f"stderr={result.stderr.strip()[:400]}"
            ),
        }

    # Now launch via amvcp-show-launcher.py (handles iTerm split-pane
    # automatically when iTerm is detected; falls back to plain
    # amvcp-select.py otherwise).
    payload = _launch_html(html_path)
    return {
        "action": "rendered",
        "kind": "markdown",
        "html": str(html_path),
        "payload": payload,
    }


def _launch_html(html_path: pathlib.Path) -> dict[str, Any] | None:
    """Run amvcp-show-launcher.py on a rendered HTML page; return its JSON
    payload (the amvcp-select.py submission body) or None on failure."""
    if not LAUNCHER.exists():
        return {"error": f"launcher not found at {LAUNCHER}"}
    try:
        # The launcher prints amvcp-select.py's JSON to stdout. Capture it.
        result = subprocess.run(
            ["python3", str(LAUNCHER), str(html_path)],
            capture_output=True,
            text=True,
            timeout=None,  # interactive — user controls when to submit
            check=False,
        )
    except (FileNotFoundError, KeyboardInterrupt) as exc:
        return {"error": f"launcher invocation failed: {exc}"}
    if result.returncode != 0:
        return {
            "error": f"launcher exit={result.returncode}",
            "stderr": result.stderr.strip()[:400],
        }
    raw = result.stdout.strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "launcher output was not JSON", "raw": raw[:400]}


# ---------------------------------------------------------------------------
# Action plan builder
# ---------------------------------------------------------------------------

# Mapping from kind → (action_kind, target_name, reason). For "renderable"
# kinds (markdown, html) the script runs the renderer directly and returns
# the payload inline; for "skill/command-based" kinds it emits an
# invoke_skill / invoke_command instruction.
KIND_TO_INVOCATION: dict[str, tuple[str, str, str]] = {
    "code": ("invoke_skill", "amvcp-prose-pages",
             "code file — render as syntax-highlighted prose with data-ve-code blocks"),
    "image": ("invoke_skill", "amvcp-prose-pages",
              "image file — wrap in prose page with hotspot affordance"),
    "data_array": ("invoke_skill", "amvcp-charts-and-dashboards",
                   "tabular data — auto-chart appropriate type"),
    "data_object": ("invoke_skill", "amvcp-prose-pages",
                    "non-array JSON — render as pretty-printed code block"),
    "mermaid": ("invoke_skill", "amvcp-graph-diagrams",
                "mermaid source — render diagram"),
    "regex": ("invoke_skill", "amvcp-regex-vis",
              "regex source — render visualiser"),
    "latex": ("invoke_skill", "amvcp-math-and-latex",
              "LaTeX source — render via KaTeX/TikZ"),
    "diff": ("invoke_command", "amvcp-diff-review",
             "diff/patch — render side-by-side diff"),
    "slides": ("invoke_command", "amvcp-generate-slides",
               "slides marker detected — render slide deck"),
    "plain_text": ("invoke_skill", "amvcp-visual-communication",
                   "plain text — let the coordinator pick a representation"),
    "url": ("invoke_command", "amvcp-fact-check",
            "URL — fetch and let fact-check inspect"),
}


def build_action_plan(cls: dict[str, Any]) -> dict[str, Any]:
    kind = cls.get("kind")
    if kind == "bad_input":
        return {"action": "error", "reason": cls.get("reason", "bad input")}
    if kind == "markdown":
        return _render_markdown_then_launch(pathlib.Path(cls["path"]))
    if kind == "html":
        return {
            "action": "passthrough",
            "kind": "html",
            "html": cls["path"],
            "payload": _launch_html(pathlib.Path(cls["path"])),
        }
    if kind == "explicit_skill":
        return {
            "action": "explicit_skill",
            "skill": cls["skill"],
            "args": cls["args"],
            "reason": "explicit (skill, args) two-token form",
        }
    if kind in KIND_TO_INVOCATION:
        action, target, reason = KIND_TO_INVOCATION[kind]
        # invoke_command / invoke_skill differ only in the target field name.
        target_field = "command" if action == "invoke_command" else "skill"
        args = [cls.get("path")] if "path" in cls else [cls.get("text") or cls.get("url", "")]
        return {
            "action": action,
            target_field: target,
            "args": args,
            "reason": reason,
        }
    return {"action": "error", "reason": f"unmapped kind: {kind}"}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    args = (argv if argv is not None else sys.argv[1:])
    if not args:
        print(
            json.dumps({"action": "error", "reason": "no input argument"}),
            file=sys.stdout,
        )
        return 2
    raw = args[0]
    cls = classify(raw)
    plan = build_action_plan(cls)
    print(json.dumps(plan, indent=2), file=sys.stdout)
    return 0 if plan.get("action") != "error" else 2


if __name__ == "__main__":
    sys.exit(main())
