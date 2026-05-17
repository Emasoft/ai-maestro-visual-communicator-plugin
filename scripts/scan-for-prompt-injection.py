#!/usr/bin/env python3
"""
scan-for-prompt-injection.py — pre-read prompt-injection scanner.

Scans markdown / text / source-code files for patterns that try to
override an LLM agent's instructions, manipulate its role, smuggle
hidden instructions, or exfiltrate data. Designed to run BEFORE any
agent / skill reads a user-supplied file, so the agent never sees
the unsanitised payload.

USAGE
=====
    uv run scripts/scan-for-prompt-injection.py <path> [<path> ...]
    uv run scripts/scan-for-prompt-injection.py --json <path>
    uv run scripts/scan-for-prompt-injection.py --severity-min high <path>
    uv run scripts/scan-for-prompt-injection.py --quiet <path>

If <path> is a directory the scan is recursive (with sane skip
rules: .git, node_modules, _dev folders, hidden dirs).

EXIT CODES
==========
    0 = clean (no findings, OR only INFO/LOW findings)
    1 = MEDIUM findings — warn (still allow the agent to read)
    2 = HIGH or CRITICAL findings — BLOCK (do not let the agent read)

Per --severity-min the exit-code threshold can be tightened (e.g.,
`--severity-min low` treats LOW findings as block-worthy).

DESIGN
======
- Pure standard library (no pip install). Re-runnable from any
  Python 3.8+ env.
- Per-file streaming with a soft size cap (10 MB) so unbounded log
  files don't OOM the scanner.
- Binary files (null byte in first 8 KB, or non-UTF-8 decode) are
  skipped automatically.
- All patterns are CASE-INSENSITIVE and use word-boundary anchoring
  where applicable to keep false-positive rate down.
- Findings include: file, line number, severity, category, rule id,
  matched snippet (max 80 chars), human-readable reason.

CATEGORIES (10)
================
    DI-01..09  — Direct injection / instruction override
    RM-01..06  — Role / persona manipulation
    JB-01..06  — Jailbreak templates (DAN, developer mode, etc.)
    TM-01..04  — Tool / skill manipulation
    HT-01..03  — Hidden-text smuggling (HTML comments, CSS hidden)
    UC-01..05  — Unicode invisibility / direction tricks
    EN-01..02  — Encoded payloads (suspicious base64 / hex)
    EX-01..03  — Exfiltration URLs (webhook.site, requestbin, etc.)
    TC-01..02  — Token-counting / context-flooding attacks
    MS-01..03  — Markdown smuggling (alt-text, link-text instructions)

Each rule maps to a severity (LOW / MEDIUM / HIGH / CRITICAL). The
mapping is conservative: a single high-severity hit is enough to
block; multiple LOW hits aggregate to MEDIUM.
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import unicodedata
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable

# ---------------------------------------------------------------------------
# Severity ordering — used for both per-finding tagging and exit-code logic.
# ---------------------------------------------------------------------------
SEV_INFO = "INFO"
SEV_LOW = "LOW"
SEV_MEDIUM = "MEDIUM"
SEV_HIGH = "HIGH"
SEV_CRITICAL = "CRITICAL"
SEV_ORDER = [SEV_INFO, SEV_LOW, SEV_MEDIUM, SEV_HIGH, SEV_CRITICAL]
SEV_RANK = {s: i for i, s in enumerate(SEV_ORDER)}

# ---------------------------------------------------------------------------
# Skip lists — directories and file extensions that are never scanned.
# ---------------------------------------------------------------------------
SKIP_DIR_NAMES = {
    ".git", ".hg", ".svn", "node_modules", "vendor", "__pycache__",
    ".venv", "venv", "env", ".tox", "build", "dist", "target",
    ".pytest_cache", ".mypy_cache", ".ruff_cache", ".cache",
    "docs_dev", "scripts_dev", "samples_dev", "examples_dev",
    "tests_dev", "downloads_dev", "libs_dev", "builds_dev",
    "reports_dev", "reports", ".trashcan",
}
SKIP_FILE_SUFFIXES = {
    # Binary / compiled artefacts.
    ".pyc", ".pyo", ".so", ".dylib", ".dll", ".class", ".o", ".a",
    ".exe", ".bin",
    # Images / media (never scanned as text).
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
    ".pdf", ".mp3", ".mp4", ".mov", ".wav", ".ogg", ".webm",
    # Archives.
    ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
    # Font files.
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    # Lock files (machine-generated).
    ".lock",
}
# Maximum bytes per file. Files larger than this are not scanned in
# full — only the first SOFT_CAP bytes are. This protects against
# token-flooding files acting as both the bait AND the OOM trigger.
SOFT_CAP = 10 * 1024 * 1024  # 10 MB

# ---------------------------------------------------------------------------
# Rule definitions — (rule_id, severity, category, regex, description)
# All regexes are compiled with re.IGNORECASE | re.MULTILINE.
# ---------------------------------------------------------------------------
RULES: list[tuple[str, str, str, str, str]] = [
    # ── DI — Direct instruction override ──────────────────────────────────
    ("DI-01", SEV_CRITICAL, "direct-injection",
     r"\bignore\s+(all\s+)?(your\s+|the\s+)?(previous|prior|above|preceding)\s+(instruction|prompt|message|rule|directive)s?\b",
     "Direct override of prior instructions"),
    ("DI-02", SEV_CRITICAL, "direct-injection",
     r"\bforget\s+(everything|all|what|your)\s+(you|i)\s+(said|told|wrote|know)\b",
     "Direct memory-wipe override"),
    ("DI-03", SEV_CRITICAL, "direct-injection",
     r"\b(disregard|override|cancel|nullify)\s+(your|the|all)\s+(system|prior|previous|original)\s+(prompt|instruction|rule|directive)s?\b",
     "Override of system / prior directives"),
    ("DI-04", SEV_HIGH, "direct-injection",
     r"\b(new|updated|revised|replacement)\s+(instruction|prompt|directive|system\s+prompt)s?\s*[:\-]",
     "Attempt to replace the system prompt"),
    ("DI-05", SEV_HIGH, "direct-injection",
     r"<\s*/?\s*(system|instructions?|prompt|directive)\s*>",
     "XML-tag-style fake system block"),
    ("DI-06", SEV_HIGH, "direct-injection",
     r"\b(?:\[|\(|#+\s*)\s*(system|admin|root|developer|sudo)\s+(message|prompt|directive|instruction|note)\s*[:\]\)]",
     "Bracketed pseudo-admin prefix"),
    ("DI-07", SEV_MEDIUM, "direct-injection",
     r"\b(stop|cease)\s+(reading|processing|following)\s+(the|this|that|those)\b",
     "Instruction to stop following directives"),
    ("DI-08", SEV_HIGH, "direct-injection",
     r"^\s*###\s*INSTRUCTIONS?\s*FROM\s+(SYSTEM|ADMIN|ROOT|USER|DEVELOPER)\b",
     "Fake markdown-heading admin instruction"),
    ("DI-09", SEV_CRITICAL, "direct-injection",
     r"\byou\s+(are|must|should|will)\s+now\s+(act|behave|respond|answer|operate|function)\s+as\s+",
     "Direct role-takeover phrasing"),

    # ── RM — Role / persona manipulation ──────────────────────────────────
    ("RM-01", SEV_HIGH, "role-manipulation",
     r"\b(act|pretend|behave|respond|roleplay)\s+as\s+(if\s+you\s+(were|are)\s+)?(an?\s+)?(unrestricted|uncensored|amoral|jailbroken|unfiltered|liberated)\b",
     "Persona override — unrestricted / jailbroken role"),
    ("RM-02", SEV_HIGH, "role-manipulation",
     r"\bfrom\s+(now|this\s+(point|moment)|here)\s+on(?:wards?)?,?\s+you\s+(are|will|must)\b",
     "Persistent role-change preamble"),
    ("RM-03", SEV_MEDIUM, "role-manipulation",
     r"\b(your|the)\s+new\s+(role|persona|identity|character|job)\s+is\b",
     "Explicit role-assignment phrasing"),
    ("RM-04", SEV_MEDIUM, "role-manipulation",
     r"\b(I'?m|i\s+am)\s+(your|the)\s+(developer|admin|owner|creator|engineer|anthropic|claude\s+team)\b",
     "False-identity authority claim"),
    ("RM-05", SEV_HIGH, "role-manipulation",
     r"\bpretend\s+(this\s+)?(message|prompt|instruction)\s+is\s+from\s+",
     "Claim of forged provenance"),
    ("RM-06", SEV_MEDIUM, "role-manipulation",
     r"\bsimulate\s+(an?\s+)?(uncensored|unrestricted|admin|root|developer)\s+(mode|account|session|user)\b",
     "Simulation-of-privileged-mode request"),

    # ── JB — Known jailbreak templates ────────────────────────────────────
    ("JB-01", SEV_CRITICAL, "jailbreak-template",
     r"\b(DAN|do\s+anything\s+now)\b",
     "DAN jailbreak template signature"),
    ("JB-02", SEV_CRITICAL, "jailbreak-template",
     r"\b(developer|god|admin|sudo|debug|test)\s+mode\s+(is\s+)?(enabled|activated|on|unlocked|engaged)\b",
     "Privileged-mode-enabled jailbreak signature"),
    ("JB-03", SEV_HIGH, "jailbreak-template",
     r"\bno\s+(ethical|moral|safety|content|policy)\s+(restriction|filter|guideline|limit|consideration)s?\b",
     "Explicit safety-removal phrasing"),
    ("JB-04", SEV_HIGH, "jailbreak-template",
     r"\b(?:bypass|circumvent|evade|disable)\s+(your|the)\s+(safety|content|moderation|policy|filter|guideline)s?\b",
     "Safety bypass phrasing"),
    ("JB-05", SEV_HIGH, "jailbreak-template",
     r"\boutput\s+(must|will|shall)\s+(not|never)\s+(be\s+)?(refuse|denied|filtered|moderated|censored)\b",
     "Forced compliance template"),
    ("JB-06", SEV_HIGH, "jailbreak-template",
     r"\b(STAN|AIM|EvilBot|UnGPT|JAILBREAK|JAILBROKEN|DUDE|MONGO\s*TOM)\b",
     "Known jailbreak persona names"),

    # ── TM — Tool / skill manipulation ────────────────────────────────────
    ("TM-01", SEV_HIGH, "tool-manipulation",
     r"\b(?:use|call|invoke|run|execute)\s+(?:the\s+)?(Bash|Shell|Exec|System|Eval|Subprocess|Spawn)\s+tool\b",
     "Direct shell-tool invocation request"),
    ("TM-02", SEV_HIGH, "tool-manipulation",
     r"\b(?:please\s+)?(?:run|execute|evaluate)\s+(?:the\s+)?(?:following|this|these)\s+(?:command|shell|bash|sh|python|node|script)\b",
     "Embedded command-execution request"),
    ("TM-03", SEV_MEDIUM, "tool-manipulation",
     r"\b(?:fetch|download|wget|curl|GET|POST)\s+(?:from\s+)?https?://",
     "Network-fetch request"),
    ("TM-04", SEV_HIGH, "tool-manipulation",
     r"\b(?:write|create|save|append|overwrite|chmod|chown|rm|delete|unlink)\s+(?:to\s+|the\s+)?(?:file|directory|folder|path)\s+[/\\~]",
     "Filesystem-write request with absolute-style path"),

    # ── HT — Hidden-text smuggling ────────────────────────────────────────
    ("HT-01", SEV_HIGH, "hidden-text",
     r"<!--[^>]*?\b(ignore|disregard|forget|new\s+instruction|system\s+prompt|admin)\b[^>]*?-->",
     "Instructional content inside an HTML comment"),
    ("HT-02", SEV_HIGH, "hidden-text",
     r"style\s*=\s*[\"\'][^\"\']*?(display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0|color\s*:\s*(?:#fff|white|rgba?\(\s*255\s*,\s*255\s*,\s*255))[^\"\']*?[\"\']",
     "Visually-hidden inline-style block (instructions may be hidden)"),
    ("HT-03", SEV_MEDIUM, "hidden-text",
     r"font-size\s*:\s*(?:0|0\.0+)\s*(?:px|pt|em|rem)?",
     "Zero-size font hides the text from the human reader"),

    # ── UC — Unicode invisibility / direction tricks ──────────────────────
    # NB: these regexes match against the RAW source so they pick up
    # any unicode chars regardless of how the editor renders them.
    ("UC-01", SEV_HIGH, "unicode-trick",
     r"[‪-‮⁦-⁩]",
     "Bidirectional override / isolate chars (RTL trick)"),
    ("UC-02", SEV_MEDIUM, "unicode-trick",
     r"[​-‏﻿]",
     "Zero-width / BOM character (often used to smuggle hidden text)"),
    ("UC-03", SEV_MEDIUM, "unicode-trick",
     r"[-]",
     "Private-use-area codepoint (no standard meaning, smuggle vector)"),
    ("UC-04", SEV_LOW, "unicode-trick",
     r"[⁠-⁤⁪-⁯]",
     "Inline-formatting controls (deprecated; smuggle vector)"),
    ("UC-05", SEV_MEDIUM, "unicode-trick",
     r"[\U000E0000-\U000E007F]",
     "Tag characters (U+E0000..U+E007F) — invisible smuggle channel"),

    # ── EN — Encoded payloads ─────────────────────────────────────────────
    # A long unbroken base64-looking blob is suspicious because it may
    # decode to embedded instructions the human reader can't see.
    ("EN-01", SEV_MEDIUM, "encoded-payload",
     r"\b[A-Za-z0-9+/]{200,}={0,3}\b",
     "Long base64-like blob (≥ 200 chars) — may decode to instructions"),
    ("EN-02", SEV_LOW, "encoded-payload",
     r"\\u00[0-9a-fA-F]{2}(?:\\u00[0-9a-fA-F]{2}){10,}",
     "Long \\uXXXX-escape sequence (≥ 11 chars)"),

    # ── EX — Exfiltration URLs ────────────────────────────────────────────
    ("EX-01", SEV_HIGH, "exfiltration-url",
     r"https?://(?:[a-z0-9-]+\.)?(?:webhook\.site|requestbin\.com|requestbin\.net|requestcatcher\.com|pipedream\.net|hookbin\.com|beeceptor\.com|mocky\.io|httpbin\.org/post|en\.tunnel\.work|ngrok-free\.app)\b",
     "Known data-exfiltration / inspection URL"),
    ("EX-02", SEV_MEDIUM, "exfiltration-url",
     r"https?://[a-z0-9.-]+\.(?:ngrok\.io|trycloudflare\.com|loca\.lt|serveo\.net|ru\.com)\b",
     "Public tunnel / dynamic-DNS host (potential exfil endpoint)"),
    ("EX-03", SEV_MEDIUM, "exfiltration-url",
     r"\b(?:fetch|XMLHttpRequest|new\s+Image\(\)\.src\s*=|navigator\.sendBeacon|window\.open)\s*\(\s*[\"\']?https?://",
     "JS-side network call to an external URL"),

    # ── TC — Token-counting / context-flooding ────────────────────────────
    ("TC-01", SEV_MEDIUM, "context-flooding",
     r"((?:\w+\s+){50,})\1{2,}",
     "Same 50+-word block repeated 3+ times — context-flood pattern"),
    # TC-02 is computed in code (very large file detection).

    # ── MS — Markdown smuggling ───────────────────────────────────────────
    ("MS-01", SEV_HIGH, "markdown-smuggle",
     r"!\[([^\]]{50,})\]\([^\)]+\)",
     "Image with abnormally long alt-text (potential smuggle channel)"),
    ("MS-02", SEV_MEDIUM, "markdown-smuggle",
     r"\[(?:[^\]]*?(?:ignore|forget|disregard|override)[^\]]*?)\]\([^\)]+\)",
     "Markdown link text contains override keywords"),
    ("MS-03", SEV_MEDIUM, "markdown-smuggle",
     r"```\s*(?:system|admin|root|prompt|developer)\s*\n",
     "Code-fence labelled as a system / admin / prompt block"),
]

# Compile the regexes once.
_COMPILED: list[tuple[str, str, str, re.Pattern[str], str]] = [
    (rid, sev, cat, re.compile(pat, re.IGNORECASE | re.MULTILINE), desc)
    for rid, sev, cat, pat, desc in RULES
]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
@dataclass
class Finding:
    """One pattern hit inside a file."""
    file: str
    line: int
    col: int
    rule_id: str
    severity: str
    category: str
    description: str
    snippet: str  # excerpt of the matched text, max 80 chars


@dataclass
class FileResult:
    """Per-file scan outcome."""
    file: str
    scanned: bool
    skipped_reason: str = ""
    truncated: bool = False
    findings: list[Finding] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def is_binary(head: bytes) -> bool:
    """Heuristic: file is binary if first 8 KB contains a null byte."""
    return b"\x00" in head


def line_of(text: str, offset: int) -> tuple[int, int]:
    """Convert a character offset into (line, col) — both 1-indexed."""
    prefix = text[:offset]
    line = prefix.count("\n") + 1
    last_nl = prefix.rfind("\n")
    col = offset - last_nl if last_nl >= 0 else offset + 1
    return line, col


def snippet_of(text: str, start: int, end: int, width: int = 80) -> str:
    """Return a short excerpt around the match for the report."""
    raw = text[start:end].replace("\n", " ").replace("\r", " ")
    if len(raw) <= width:
        return raw
    return raw[: width - 1] + "…"


def context_flooding_size(path: Path, raw: bytes) -> Finding | None:
    """TC-02: flag files that vastly exceed a normal markdown size."""
    if len(raw) >= SOFT_CAP:
        return Finding(
            file=str(path), line=1, col=1,
            rule_id="TC-02", severity=SEV_MEDIUM,
            category="context-flooding",
            description=f"File ≥ {SOFT_CAP // (1024 * 1024)} MB — "
                        "may be designed to flood the agent's context",
            snippet=f"size={len(raw)} bytes",
        )
    return None


def scan_text(path: Path, text: str) -> list[Finding]:
    """Run every compiled rule against `text`, return findings."""
    findings: list[Finding] = []
    for rule_id, severity, category, regex, description in _COMPILED:
        for m in regex.finditer(text):
            line, col = line_of(text, m.start())
            findings.append(Finding(
                file=str(path),
                line=line, col=col,
                rule_id=rule_id, severity=severity, category=category,
                description=description,
                snippet=snippet_of(text, m.start(), m.end()),
            ))
    # Additional check: scan any plausible base64 blob's DECODED content
    # for prompt-injection keywords. A blob that decodes to "ignore all
    # previous instructions" is a CRITICAL hit even though the encoded
    # form is harmless until decoded.
    findings.extend(_check_decoded_payloads(path, text))
    return findings


_DECODE_KEYWORDS = re.compile(
    r"\b(ignore|disregard|forget|override|system\s+prompt|"
    r"jailbreak|DAN|developer\s+mode|act\s+as|pretend\s+as|"
    r"bypass|circumvent|new\s+instruction)\b",
    re.IGNORECASE,
)


def _check_decoded_payloads(path: Path, text: str) -> list[Finding]:
    """For any long base64-like blob, try decoding and re-scanning."""
    out: list[Finding] = []
    for m in re.finditer(r"\b[A-Za-z0-9+/]{40,}={0,3}\b", text):
        blob = m.group(0)
        # Decode tolerantly; ignore failures.
        try:
            decoded = base64.b64decode(blob, validate=False).decode(
                "utf-8", errors="replace"
            )
        except Exception:
            continue
        # Skip blobs that decode to mostly-binary garbage.
        printable = sum(
            1 for c in decoded if c.isprintable() or c in "\n\r\t"
        )
        if not decoded or printable / max(len(decoded), 1) < 0.85:
            continue
        if _DECODE_KEYWORDS.search(decoded):
            line, col = line_of(text, m.start())
            out.append(Finding(
                file=str(path), line=line, col=col,
                rule_id="EN-DEC", severity=SEV_CRITICAL,
                category="encoded-payload",
                description="Base64 blob decodes to text containing "
                            "prompt-injection keywords",
                snippet=snippet_of(decoded, 0, len(decoded)),
            ))
    return out


def scan_file(path: Path) -> FileResult:
    """Open one file, decide whether to scan, return findings."""
    if path.suffix.lower() in SKIP_FILE_SUFFIXES:
        return FileResult(file=str(path), scanned=False,
                          skipped_reason="binary-suffix")
    try:
        raw = path.read_bytes()
    except (OSError, PermissionError) as e:
        return FileResult(file=str(path), scanned=False,
                          skipped_reason=f"read-error: {e}")
    if is_binary(raw[:8192]):
        return FileResult(file=str(path), scanned=False,
                          skipped_reason="binary-content")
    truncated = False
    if len(raw) > SOFT_CAP:
        truncated = True
        raw_to_scan = raw[:SOFT_CAP]
    else:
        raw_to_scan = raw
    try:
        text = raw_to_scan.decode("utf-8")
    except UnicodeDecodeError:
        # Try latin-1 as a last resort so we can still scan for ASCII
        # injection patterns even in mis-encoded files.
        text = raw_to_scan.decode("latin-1", errors="replace")
    text = unicodedata.normalize("NFC", text)
    findings = scan_text(path, text)
    tc02 = context_flooding_size(path, raw)
    if tc02 is not None:
        findings.append(tc02)
    return FileResult(file=str(path), scanned=True,
                      truncated=truncated, findings=findings)


def iter_paths(roots: Iterable[Path]) -> Iterable[Path]:
    """Walk roots, yield individual files, applying skip rules."""
    for root in roots:
        if root.is_file():
            yield root
            continue
        for path in root.rglob("*"):
            if path.is_dir():
                continue
            # Skip any path whose ANY parent directory is in the skip list
            # or starts with a dot.
            skip = False
            for part in path.parts:
                if part in SKIP_DIR_NAMES:
                    skip = True; break
                if part.startswith(".") and part not in (".", ".."):
                    skip = True; break
            if not skip:
                yield path


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------
# ANSI colours — only emitted when stdout is a tty.
def _supports_color() -> bool:
    return sys.stdout.isatty() and not (
        sys.platform == "win32" and "ANSICON" not in __import__("os").environ
    )


_CLR = {
    SEV_INFO: "\x1b[37m",
    SEV_LOW: "\x1b[36m",
    SEV_MEDIUM: "\x1b[33m",
    SEV_HIGH: "\x1b[35m",
    SEV_CRITICAL: "\x1b[31;1m",
    "RESET": "\x1b[0m",
    "DIM": "\x1b[2m",
}


def _fmt(sev: str) -> str:
    if _supports_color():
        return f"{_CLR[sev]}{sev:<8}{_CLR['RESET']}"
    return f"{sev:<8}"


def print_human(results: list[FileResult]) -> None:
    """Pretty per-file report on stdout."""
    total = sum(1 for r in results if r.scanned)
    skipped = sum(1 for r in results if not r.scanned)
    all_findings: list[Finding] = [f for r in results for f in r.findings]
    if not all_findings:
        print(f"✓ Clean — scanned {total} file(s), {skipped} skipped.")
        return
    by_severity: dict[str, int] = {s: 0 for s in SEV_ORDER}
    for f in all_findings:
        by_severity[f.severity] += 1
    print()
    print(f"  PROMPT-INJECTION SCAN — {len(all_findings)} finding(s) "
          f"across {total} file(s):")
    print(f"  " + "  ".join(
        f"{_fmt(s).strip()}={by_severity[s]}"
        for s in SEV_ORDER if by_severity[s] > 0
    ))
    print()
    findings_by_file: dict[str, list[Finding]] = {}
    for f in all_findings:
        findings_by_file.setdefault(f.file, []).append(f)
    for file, items in findings_by_file.items():
        print(f"  📄 {file}")
        for it in sorted(items,
                         key=lambda x: (-SEV_RANK[x.severity], x.line)):
            loc = f"L{it.line}:{it.col}"
            print(f"      {_fmt(it.severity)} {it.rule_id:<7} "
                  f"{loc:<10} {it.description}")
            if it.snippet:
                print(f"        {_CLR['DIM']}↳ {it.snippet}{_CLR['RESET']}"
                      if _supports_color()
                      else f"        ↳ {it.snippet}")
        print()


def print_json(results: list[FileResult]) -> None:
    """Machine-readable JSON dump on stdout."""
    payload = {
        "scanned": [r.file for r in results if r.scanned],
        "skipped": [
            {"file": r.file, "reason": r.skipped_reason}
            for r in results if not r.scanned
        ],
        "truncated": [r.file for r in results if r.truncated],
        "findings": [asdict(f) for r in results for f in r.findings],
        "by_severity": {
            s: sum(1 for r in results for f in r.findings
                   if f.severity == s)
            for s in SEV_ORDER
        },
    }
    json.dump(payload, sys.stdout, indent=2)
    sys.stdout.write("\n")


# ---------------------------------------------------------------------------
# Exit-code logic
# ---------------------------------------------------------------------------
def decide_exit_code(results: list[FileResult], block_at: str) -> int:
    """0 clean, 1 warn, 2 block — based on highest severity vs cutoff."""
    block_rank = SEV_RANK[block_at]
    warn_rank = max(SEV_RANK[SEV_LOW], block_rank - 1)
    max_rank = -1
    for r in results:
        for f in r.findings:
            max_rank = max(max_rank, SEV_RANK[f.severity])
    if max_rank < 0:
        return 0
    if max_rank >= block_rank:
        return 2
    if max_rank >= warn_rank:
        return 1
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="scan-for-prompt-injection",
        description=(__doc__ or "").split("USAGE")[0].strip(),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("paths", nargs="*",
                        help="Files / dirs to scan (dirs are recursive). "
                             "Required unless --list-rules is given.")
    parser.add_argument("--json", action="store_true",
                        help="JSON output (machine-readable).")
    parser.add_argument("--quiet", action="store_true",
                        help="Suppress 'clean' output; only print findings.")
    parser.add_argument("--severity-min", default=SEV_HIGH,
                        choices=SEV_ORDER,
                        help="Minimum severity that exits with code 2 "
                             "(block). Default: HIGH.")
    parser.add_argument("--list-rules", action="store_true",
                        help="Print the rule table and exit.")
    args = parser.parse_args(argv)

    if args.list_rules:
        print(f"{'ID':<8} {'SEV':<9} {'CATEGORY':<22} DESCRIPTION")
        for rid, sev, cat, _, desc in RULES:
            print(f"{rid:<8} {sev:<9} {cat:<22} {desc}")
        return 0

    if not args.paths:
        parser.error("paths is required (or use --list-rules)")

    roots = [Path(p) for p in args.paths]
    for p in roots:
        if not p.exists():
            print(f"✗ Path not found: {p}", file=sys.stderr)
            return 2

    results: list[FileResult] = []
    for path in iter_paths(roots):
        results.append(scan_file(path))

    # Output.
    if args.json:
        print_json(results)
    else:
        if not args.quiet or any(r.findings for r in results):
            print_human(results)

    return decide_exit_code(results, args.severity_min)


if __name__ == "__main__":
    sys.exit(main())
