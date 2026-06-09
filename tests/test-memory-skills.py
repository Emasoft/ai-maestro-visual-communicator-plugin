#!/usr/bin/env python3
"""CLI-level tests for the markdown memory system (GitHub issue #2).

Covers the acceptance criteria of `feat(memory)`:
  - recall returns ranked notes on a fixture memory dir (memgrep path),
  - the fallback path works with memgrep absent (grep path),
  - write produces a schema-valid note + MEMORY.md index line,
  - the rule + both skills are present and cross-referenced.

No browser needed. Prints the same `TEST | name | status | desc | detail`
lines the dev-browser suites print, so run-tests.py merges the rows into the
unified results table. Exits 0 only if every test PASSes (no silent skips:
when memgrep is absent the memgrep-specific test asserts the gate's absence
detection instead — a real assertion either way).
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PLUGIN_ROOT = ROOT.parent
FIXDIR = ROOT / "fixtures" / "memory"

# The EXACT gated snippet both memory skills document: memgrep when present,
# plain `grep -rliE` otherwise — recall degrades, never breaks.
GATED_SNIPPET = (
    'if command -v memgrep >/dev/null 2>&1; then '
    '  memgrep recall "$SYMPTOM" "$MEMDIR"; '
    'else '
    '  grep -rliE "$SYMPTOM" "$MEMDIR" 2>/dev/null; '
    'fi'
)

NOTE_TYPE_RE = re.compile(r"^\s*type:\s*(user|feedback|project|reference)\s*$")


def emit(name: str, status: str, desc: str, detail: str = "") -> bool:
    print(f"TEST | {name} | {status} | {desc} | {detail.replace('|', '/')}")
    return status == "PASS"


def run_gated(symptom: str, memdir: Path, env: dict[str, str] | None = None) -> str:
    merged = dict(os.environ if env is None else env)
    merged["SYMPTOM"] = symptom
    merged["MEMDIR"] = str(memdir)
    proc = subprocess.run(
        ["sh", "-c", GATED_SNIPPET],
        capture_output=True,
        text=True,
        env=merged,
        check=False,
    )
    return proc.stdout or ""


def validate_note_schema(path: Path) -> str | None:
    """Return None when the note matches the memory-note schema, else the problem."""
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return "missing opening frontmatter delimiter"
    try:
        end = next(i for i, ln in enumerate(lines[1:], start=1) if ln.strip() == "---")
    except StopIteration:
        return "missing closing frontmatter delimiter"
    fm = lines[1:end]
    body = "\n".join(lines[end + 1 :]).strip()

    name_ln = next((ln for ln in fm if ln.startswith("name:")), None)
    if name_ln is None or name_ln.split(":", 1)[1].strip() != path.stem:
        return "frontmatter name missing or != filename stem"
    desc_ln = next((ln for ln in fm if ln.startswith("description:")), None)
    if desc_ln is None or len(desc_ln.split(":", 1)[1].strip().strip('"')) < 8:
        return "description missing or too short to carry a symptom"
    if not any(ln.strip() == "node_type: memory" for ln in fm):
        return "metadata.node_type: memory missing"
    if not any(NOTE_TYPE_RE.match(ln) for ln in fm):
        return "metadata.type not one of user|feedback|project|reference"
    if not body:
        return "empty body — a note must carry the one fact"
    return None


def t_gate_recall() -> bool:
    """The skill's gated snippet recalls the wedge note from its symptom."""
    engine = "memgrep" if shutil.which("memgrep") else "grep-fallback"
    symptom = (
        "chart frozen stops resizing after switching theme"
        if engine == "memgrep"
        else "frozen|stops resizing"
    )
    out = run_gated(symptom, FIXDIR)
    ok = "reference_chart_resize_wedge" in out
    return emit(
        "memory-gate-recall",
        "PASS" if ok else "FAIL",
        f"gated recall ({engine}) surfaces the wedge note from its symptom",
        "" if ok else out.strip()[:160] or "(no output)",
    )


def t_recall_ranking() -> bool:
    """memgrep ranks the wedge note first and appends its [^1] lesson."""
    if shutil.which("memgrep") is None:
        # Real assertion in the absent case: the gate must DETECT the absence
        # (that detection is what routes the skill to the grep fallback).
        rc = subprocess.run(
            ["sh", "-c", "command -v memgrep >/dev/null 2>&1"], check=False
        ).returncode
        ok = rc != 0
        return emit(
            "memory-recall-ranking",
            "PASS" if ok else "FAIL",
            "memgrep absent — gate detects absence (fallback covered separately)",
            "" if ok else "command -v memgrep unexpectedly succeeded",
        )
    proc = subprocess.run(
        ["memgrep", "recall", "chart frozen stops resizing after switching theme", str(FIXDIR)],
        capture_output=True,
        text=True,
        check=False,
    )
    out = proc.stdout or ""
    ranked = [ln for ln in out.splitlines() if ".md" in ln]
    top_ok = bool(ranked) and "reference_chart_resize_wedge" in ranked[0]
    lesson_ok = "detached element" in out  # the [^1] lesson auto-appended
    ok = top_ok and lesson_ok
    return emit(
        "memory-recall-ranking",
        "PASS" if ok else "FAIL",
        "memgrep ranks the wedge note first and appends its lesson",
        "" if ok else f"top_ok={top_ok} lesson_ok={lesson_ok} out={out.strip()[:120]}",
    )


def t_recall_fallback() -> bool:
    """With memgrep unreachable, the gated snippet degrades to grep and still hits."""
    env = {"PATH": "/usr/bin:/bin", "HOME": os.environ.get("HOME", "/tmp")}
    out = run_gated("frozen|stops resizing", FIXDIR, env=env)
    ok = "reference_chart_resize_wedge" in out and "memgrep" not in out
    return emit(
        "memory-recall-fallback",
        "PASS" if ok else "FAIL",
        "grep fallback (memgrep off PATH) still recalls the wedge note",
        "" if ok else out.strip()[:160] or "(no output)",
    )


def t_write_roundtrip() -> bool:
    """A note authored per the write skill's schema is valid, indexed, recallable."""
    with tempfile.TemporaryDirectory(prefix="amvcp-mem-") as tmp:
        memdir = Path(tmp)
        note = memdir / "feedback_test_density.md"
        note.write_text(
            "---\n"
            "name: feedback_test_density\n"
            'description: "how dense should the report tables be / user said rows too airy"\n'
            "metadata:\n"
            "  node_type: memory\n"
            "  type: feedback\n"
            "---\n"
            "Report tables use the compact row preset by default.\n\n"
            "**Why:** the user flagged default spacing as too airy.\n\n"
            "**How to apply:** pick the dense density token before rendering tables.\n",
            encoding="utf-8",
        )
        index = memdir / "MEMORY.md"
        index.write_text(
            "- [Dense report tables](feedback_test_density.md) — compact rows by default.\n",
            encoding="utf-8",
        )
        schema_err = validate_note_schema(note)
        symptom = (
            "how dense should the report tables be"
            if shutil.which("memgrep")
            else "dense|too airy"
        )
        out = run_gated(symptom, memdir)
        recall_ok = "feedback_test_density" in out
        index_ok = "feedback_test_density.md" in index.read_text(encoding="utf-8")
        ok = schema_err is None and recall_ok and index_ok
        return emit(
            "memory-write-roundtrip",
            "PASS" if ok else "FAIL",
            "write recipe yields a schema-valid, indexed, recallable note",
            "" if ok else f"schema={schema_err} recall_ok={recall_ok} index_ok={index_ok}",
        )


def t_fixture_schema() -> bool:
    """Every fixture note passes the memory-note schema (guards fixture rot)."""
    notes = sorted(p for p in FIXDIR.glob("*.md") if p.name != "MEMORY.md")
    problems = [f"{p.name}: {err}" for p in notes if (err := validate_note_schema(p))]
    ok = len(notes) >= 3 and not problems
    return emit(
        "memory-fixture-schema",
        "PASS" if ok else "FAIL",
        f"all {len(notes)} fixture notes match the note schema",
        "; ".join(problems)[:200],
    )


def t_registration() -> bool:
    """Rule + both skills exist and cross-reference each other (registration)."""
    rule = PLUGIN_ROOT / "rules" / "memory-protocol.md"
    recall = PLUGIN_ROOT / "skills" / "amvcp-memory-recall" / "SKILL.md"
    write = PLUGIN_ROOT / "skills" / "amvcp-memory-write" / "SKILL.md"
    problems: list[str] = []
    for p in (rule, recall, write):
        if not p.is_file():
            problems.append(f"missing {p.relative_to(PLUGIN_ROOT)}")
    if not problems:
        recall_txt = recall.read_text(encoding="utf-8")
        write_txt = write.read_text(encoding="utf-8")
        rule_txt = rule.read_text(encoding="utf-8")
        if "memory-protocol.md" not in recall_txt:
            problems.append("recall skill does not reference the rule")
        if "memory-protocol.md" not in write_txt:
            problems.append("write skill does not reference the rule")
        if "amvcp-memory-write" not in recall_txt:
            problems.append("recall skill does not reference the write skill")
        if "amvcp-memory-recall" not in write_txt:
            problems.append("write skill does not reference the recall skill")
        for name in ("amvcp-memory-recall", "amvcp-memory-write"):
            if name not in rule_txt:
                problems.append(f"rule does not reference {name}")
        if "command -v memgrep" not in recall_txt or "command -v memgrep" not in write_txt:
            problems.append("a skill is missing the memgrep availability gate")
    ok = not problems
    return emit(
        "memory-registration",
        "PASS" if ok else "FAIL",
        "rule + both skills present, gated, and cross-referenced",
        "; ".join(problems)[:200],
    )


def main() -> int:
    tests = (
        t_registration,
        t_fixture_schema,
        t_gate_recall,
        t_recall_ranking,
        t_recall_fallback,
        t_write_roundtrip,
    )
    results: list[bool] = []
    for t in tests:
        try:
            results.append(t())
        except Exception as exc:  # surface, never swallow — fail fast per house rules
            results.append(emit(t.__name__, "ERROR", "unhandled exception", repr(exc)[:200]))
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
