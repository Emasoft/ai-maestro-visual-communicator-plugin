#!/usr/bin/env python3
"""amvcp-docwiki-build.py — Phase 2 of the navigable document wiki (TRDD-103a53e0).

Scans `design/tasks/TRDD-*.md` (+ optional `design/requirements/PRRD.md`), parses
the grep-friendly v2 frontmatter WITHOUT a yaml dependency, renders each doc with a
small pure-python markdown->HTML converter, wires cross-links (TRDD-<8hex> ->
`#/trdd/<8hex>`, `PRRD G/S<n>` -> `#/prrd#G<n>`) as plain `<a data-ve-navigate>`
anchors, and emits ONE self-contained `.html` wiki that opens via `file://` and is
driven by the Phase-1 shell (`scripts/amvcp-docwiki.js`, inlined verbatim).

Stdlib only. No markdown / yaml / jinja imports. No network. No `uv --with`.

Author emits the `<div data-docwiki>` body; the shell injects its top bar and routes
on hashchange. The wiki must never execute embedded HTML from the docs: all doc text
is HTML-escaped and only the markdown structure the converter recognises is rendered.
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

# ── constants ────────────────────────────────────────────────────────────────

# The 14-stage v2 kanban order (home groups TRDDs by these), plus the exception
# columns. `_OTHER_KEY` is a synthetic trailing bucket so a TRDD whose column we
# could not determine is still listed on the home page (never silently dropped).
COLUMN_ORDER = [
    "backburner", "todo", "design", "dispatch", "dev", "testing", "ai_review",
    "human_review", "complete", "publish", "published", "deploy", "live",
    "live_auditing", "blocked", "failed", "superseded",
]
_OTHER_KEY = "_other"

COLUMN_LABEL = {
    "backburner": "Backburner", "todo": "To do", "design": "Design",
    "dispatch": "Dispatch", "dev": "Dev", "testing": "Testing",
    "ai_review": "AI review", "human_review": "Human review",
    "complete": "Complete", "publish": "Publish", "published": "Published",
    "deploy": "Deploy", "live": "Live", "live_auditing": "Live auditing",
    "blocked": "Blocked", "failed": "Failed", "superseded": "Superseded",
    _OTHER_KEY: "Other / uncategorized",
}

# v1 `status:` enum -> v2 column (read-only mapping per the TRDD migration table).
STATUS_TO_COLUMN = {
    "not-started": "backburner", "in-progress": "dev", "completed": "complete",
    "failed": "failed", "blocked": "blocked", "superseded": "superseded",
}

# Fields shown in the per-TRDD frontmatter card, in display order.
CARD_FIELDS = [
    ("column", "Column"), ("task-type", "Task type"), ("priority", "Priority"),
    ("severity", "Severity"), ("current-owner", "Owner"), ("assignee", "Assignee"),
]
# Cross-ref fields rendered as lists of clickable TRDD links.
XREF_TRDD_FIELDS = [
    ("parent-trdd", "Parent"), ("npt", "NPT (prerequisites)"),
    ("eht", "EHT (effect-handling)"), ("blocked-by", "Blocked by"),
    ("supersedes", "Supersedes"), ("superseded-by", "Superseded by"),
]

# A TRDD-<8hex> / #<8hex> token. 8 hex chars; `(?![0-9a-f])` so we don't bite into a
# full 32-char uuid (TRDD-<uuid> in a v1 title would otherwise match its first 8).
_RE_TRDD_TOKEN = re.compile(r"\bTRDD-([0-9a-f]{8})(?![0-9a-f])")
_RE_HASH_TOKEN = re.compile(r"(?<![0-9a-zA-Z_])#([0-9a-f]{8})(?![0-9a-f])")
# `PRRD G64` / `PRRD S70.3` -> rule number is the key (letter is for humans).
_RE_PRRD_CITE = re.compile(r"\bPRRD\s+([GS])(\d+)(?:\.\d+)?\b")
# wikimem `[[name]]` (Phase 3 will route these; for now -> bold text).
_RE_WIKIMEM = re.compile(r"\[\[([^\]]+)\]\]")

# A PRRD rule bullet:  `- **G64.1** — text`  /  `- **S70.3** — text`
_RE_PRRD_RULE = re.compile(r"^-\s+\*\*([GS])(\d+)\.(\d+)\*\*\s*(.*)$")


# ── frontmatter / TRDD model ─────────────────────────────────────────────────

class Trdd:
    """One parsed TRDD: stable 8hex id, title, frontmatter fields, body markdown."""

    __slots__ = ("path", "hex8", "title", "fields", "lists", "body", "column")

    def __init__(self, path: Path):
        self.path = path
        self.hex8 = ""
        self.title = ""
        self.fields: dict[str, str] = {}
        self.lists: dict[str, list[str]] = {}
        self.body = ""
        self.column = _OTHER_KEY


def _split_frontmatter(text: str) -> tuple[str, str]:
    """Return (frontmatter_block, body). If no `^---\\n…\\n---` block, ('', text)."""
    if text.startswith("---\n") or text.startswith("---\r\n"):
        # find the closing fence on its own line
        m = re.search(r"^---[ \t]*\r?\n(.*?)\r?\n---[ \t]*\r?\n", text, re.DOTALL)
        if m:
            return m.group(1), text[m.end():]
    return "", text


def _parse_frontmatter(block: str) -> tuple[dict[str, str], dict[str, list[str]]]:
    """Parse grep-friendly `key: value` / `key: [a, b, c]` lines. No yaml dep.

    Flow lists become real lists; everything else is a scalar string (quotes
    stripped). One field per line is the v2 invariant, so this stays simple.
    """
    fields: dict[str, str] = {}
    lists: dict[str, list[str]] = {}
    for raw in block.splitlines():
        line = raw.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z0-9_-]+):[ \t]*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            items = [p.strip() for p in inner.split(",")] if inner else []
            lists[key] = [_unquote(p) for p in items if p != ""]
            fields[key] = val  # keep raw too, harmless
        else:
            fields[key] = _unquote(val)
    return fields, lists


def _unquote(s: str) -> str:
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
        return s[1:-1]
    return s


def _hex8_from_uuid(uuid: str) -> str:
    """First 8 hex chars of a uuid-ish string, or '' if it doesn't start with 8."""
    m = re.match(r"^([0-9a-fA-F]{8})", uuid.strip())
    return m.group(1).lower() if m else ""


def _derive_hex8(path: Path, fields: dict[str, str], body: str) -> str:
    """Stable 8hex id with three fallbacks so NO file is ever dropped.

    1. frontmatter `trdd-id:` (v2).
    2. `**TRDD ID:** `<uuid>`` bold line (v1 body).
    3. the filename: `TRDD-<8hex>-...` or `TRDD-<TS>-<8hex>-...`.
    """
    tid = fields.get("trdd-id", "")
    h = _hex8_from_uuid(tid)
    if h:
        return h
    bm = re.search(r"\*\*TRDD ID:\*\*\s*`?([0-9a-fA-F-]+)`?", body)
    if bm:
        h = _hex8_from_uuid(bm.group(1))
        if h:
            return h
    name = path.name  # e.g. TRDD-1dcd0bd7-...  or  TRDD-20260617_121902+0200-103a53e0-...
    # full-uuid-named: TRDD-<8hex>-<4>-<4>-...
    nm = re.match(r"^TRDD-([0-9a-fA-F]{8})-[0-9a-fA-F]{4}-", name)
    if nm:
        return nm.group(1).lower()
    # timestamped: TRDD-<ts...>-<8hex>-<slug>.  Find an 8-hex token after the ts.
    nm = re.search(r"-([0-9a-fA-F]{8})-", name)
    if nm:
        return nm.group(1).lower()
    return ""


def _derive_title(path: Path, fields: dict[str, str], body: str) -> str:
    """Prefer `title:` field; else first ATX `# ` heading; else the filename stem."""
    t = fields.get("title", "").strip()
    if t:
        return t
    hm = re.search(r"^#[ \t]+(.+)$", body, re.MULTILINE)
    if hm:
        return hm.group(1).strip()
    return path.stem


def _derive_column(fields: dict[str, str], body: str) -> str:
    """Resolve the home-page grouping column from column: / status: / **Status:**."""
    col = fields.get("column", "").strip().lower()
    if col in COLUMN_LABEL:
        return col
    st = fields.get("status", "").strip().lower()
    if st in STATUS_TO_COLUMN:
        return STATUS_TO_COLUMN[st]
    # v1 bold `**Status:** <free text>` — best-effort keyword sniff.
    bm = re.search(r"\*\*Status:\*\*\s*(.+)", body)
    if bm:
        low = bm.group(1).lower()
        if "superseded" in low:
            return "superseded"
        if "failed" in low or "abandoned" in low:
            return "failed"
        if "blocked" in low:
            return "blocked"
        if any(k in low for k in ("done", "complete", "shipped", "✅")):
            return "complete"
        if any(k in low for k in ("in progress", "in-progress", "starting", "in flight")):
            return "dev"
    return _OTHER_KEY


def parse_trdd(path: Path) -> Trdd:
    """Read + parse one TRDD file. Fail-fast only on an unreadable file."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise SystemExit(f"FATAL: cannot read TRDD file {path}: {exc}") from exc
    block, body = _split_frontmatter(text)
    fields, lists = _parse_frontmatter(block)
    t = Trdd(path)
    t.fields = fields
    t.lists = lists
    t.body = body if block else text  # v1 (no frontmatter) -> whole file is body
    t.hex8 = _derive_hex8(path, fields, t.body)
    t.title = _derive_title(path, fields, t.body)
    t.column = _derive_column(fields, t.body)
    return t


# ── markdown -> HTML (focused, stdlib-only) ──────────────────────────────────

def _esc(s: str) -> str:
    """HTML-escape doc text (treat as untrusted: never let it inject HTML)."""
    return html.escape(s, quote=False)


def _render_inline(text: str) -> str:
    """Inline span markdown on ALREADY-ESCAPED text.

    Order matters: protect inline code first (so its contents aren't re-formatted),
    then links/autolinks, then bold/italic. Returns an HTML fragment.
    """
    # 1. inline code `...` -> placeholder so emphasis/links don't touch its body
    codes: list[str] = []

    def _stash_code(m: re.Match) -> str:
        codes.append("<code>" + m.group(1) + "</code>")
        return "\x00C%d\x00" % (len(codes) - 1)

    text = re.sub(r"`([^`]+)`", _stash_code, text)

    # 2. links [text](url) — url is already escaped; only allow safe schemes.
    #    Stash each built anchor into a placeholder so the later autolink/emphasis
    #    passes can't re-process the URL that now lives inside the href attribute
    #    (the bug that turned an external link into literal `href="…">label` text).
    anchors: list[str] = []

    def _link(m: re.Match) -> str:
        label, url = m.group(1), m.group(2).strip()
        anchors.append(_anchor(url, label))
        return "\x00A%d\x00" % (len(anchors) - 1)

    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", _link, text)

    # 3. autolink bare http(s)://...  (avoid grabbing trailing punctuation). Runs
    #    only on text outside the stashed anchors, so existing links are untouched.
    def _autolink(m: re.Match) -> str:
        url = m.group(0)
        trail = ""
        while url and url[-1] in ".,;:)]}'\"":
            trail = url[-1] + trail
            url = url[:-1]
        anchors.append(_anchor(url, url))
        return "\x00A%d\x00" % (len(anchors) - 1) + trail

    text = re.sub(r"https?://[^\s<]+", _autolink, text)

    # 4. emphasis. bold before italic; `**` / `__` then `*` / `_`
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"__([^_]+)__", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<em>\1</em>", text)
    text = re.sub(r"(?<![\w_])_([^_\n]+)_(?![\w_])", r"<em>\1</em>", text)

    # restore stashed anchors, then inline code (code last so an anchor that
    # somehow contained a code placeholder still resolves correctly)
    text = re.sub(r"\x00A(\d+)\x00", lambda m: anchors[int(m.group(1))], text)
    text = re.sub(r"\x00C(\d+)\x00", lambda m: codes[int(m.group(1))], text)
    return text


def _anchor(url: str, label_html: str) -> str:
    """Build a safe <a>. Internal `#/...` keep data-ve-navigate; external http opens
    in a new tab; anything else (e.g. javascript:) becomes plain text — never a link."""
    if url.startswith("#/"):
        return '<a href="%s" data-ve-navigate>%s</a>' % (_esc(url), label_html)
    if url.startswith("#"):
        return '<a href="%s">%s</a>' % (_esc(url), label_html)
    if url.startswith(("http://", "https://")):
        return ('<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>'
                % (_esc(url), label_html))
    if url.startswith(("mailto:", "/", "./", "../")) or re.match(r"^[\w./-]+$", url):
        return '<a href="%s">%s</a>' % (_esc(url), label_html)
    # unsafe scheme — render the label as text, drop the link
    return label_html


def markdown_to_html(md: str, *, heading_offset: int = 1) -> str:
    """Convert the markdown subset these docs use into an HTML fragment.

    `heading_offset` demotes ATX headings (body `#` -> `<h2>` by default) so the
    page's own <h1> stays the single H1. Code fences are kept verbatim & escaped;
    NO cross-link wiring runs inside them (callers wire links on the result, and
    code spans/blocks are emitted with sentinel-safe escaped text).
    """
    lines = md.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out: list[str] = []
    code_blocks: list[str] = []  # fenced blocks, emitted as placeholders
    i = 0
    n = len(lines)

    def flush_para(buf: list[str]) -> None:
        if not buf:
            return
        joined = " ".join(s.strip() for s in buf).strip()
        if joined:
            out.append("<p>" + _render_inline(_esc(joined)) + "</p>")
        buf.clear()

    para: list[str] = []

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # fenced code block ``` / ~~~
        fence = re.match(r"^(```+|~~~+)(.*)$", stripped)
        if fence:
            flush_para(para)
            marker = fence.group(1)[0] * 3
            i += 1
            buf: list[str] = []
            while i < n:
                if lines[i].strip().startswith(marker):
                    i += 1
                    break
                buf.append(lines[i])
                i += 1
            code_html = "<pre><code>" + _esc("\n".join(buf)) + "</code></pre>"
            code_blocks.append(code_html)
            out.append("\x00B%d\x00" % (len(code_blocks) - 1))
            continue

        # blank line -> paragraph break
        if stripped == "":
            flush_para(para)
            i += 1
            continue

        # horizontal rule (--- / *** / ___) — but only on a line of just those
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", stripped):
            flush_para(para)
            out.append("<hr>")
            i += 1
            continue

        # ATX heading
        hm = re.match(r"^(#{1,6})[ \t]+(.+?)[ \t]*#*$", stripped)
        if hm:
            flush_para(para)
            level = min(6, len(hm.group(1)) + heading_offset)
            out.append("<h%d>%s</h%d>"
                       % (level, _render_inline(_esc(hm.group(2).strip())), level))
            i += 1
            continue

        # blockquote (consume consecutive `>` lines)
        if stripped.startswith(">"):
            flush_para(para)
            qbuf: list[str] = []
            while i < n and lines[i].strip().startswith(">"):
                qbuf.append(re.sub(r"^[ \t]*>[ \t]?", "", lines[i]))
                i += 1
            inner = markdown_to_html("\n".join(qbuf), heading_offset=heading_offset)
            # re-stash any code blocks produced by the recursive call are already
            # placeholders of THIS call only if appended — but recursion uses its own
            # list, so inline them directly (no placeholders leak out).
            out.append("<blockquote>" + inner + "</blockquote>")
            continue

        # pipe table:  | a | b |   followed by  |---|---|
        if stripped.startswith("|") and i + 1 < n and _is_table_sep(lines[i + 1]):
            flush_para(para)
            tbl, i = _render_table(lines, i)
            out.append(tbl)
            continue

        # lists (unordered -/*/+ or ordered 1.) with one level of nesting
        if _is_list_item(line):
            flush_para(para)
            lst, i = _render_list(lines, i)
            out.append(lst)
            continue

        # otherwise accumulate into a paragraph
        para.append(line)
        i += 1

    flush_para(para)

    result = "\n".join(out)
    # restore fenced code-block placeholders
    result = re.sub(r"\x00B(\d+)\x00", lambda m: code_blocks[int(m.group(1))], result)
    return result


def _is_table_sep(line: str) -> bool:
    s = line.strip()
    if not s.startswith("|"):
        return False
    return bool(re.match(r"^\|?[\s:|-]+\|?$", s)) and "-" in s


def _split_row(line: str) -> list[str]:
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|"):
        s = s[:-1]
    return [c.strip() for c in s.split("|")]


def _render_table(lines: list[str], i: int) -> tuple[str, int]:
    header = _split_row(lines[i])
    i += 2  # skip header + separator
    body_rows: list[list[str]] = []
    n = len(lines)
    while i < n and lines[i].strip().startswith("|"):
        body_rows.append(_split_row(lines[i]))
        i += 1
    cells_h = "".join("<th>%s</th>" % _render_inline(_esc(c)) for c in header)
    out = ['<table class="docwiki-md-table"><thead><tr>', cells_h, "</tr></thead><tbody>"]
    for row in body_rows:
        out.append("<tr>")
        for c in range(len(header)):
            val = row[c] if c < len(row) else ""
            out.append("<td>%s</td>" % _render_inline(_esc(val)))
        out.append("</tr>")
    out.append("</tbody></table>")
    return "".join(out), i


_RE_UL = re.compile(r"^([ \t]*)([-*+])[ \t]+(.*)$")
_RE_OL = re.compile(r"^([ \t]*)(\d+)[.)][ \t]+(.*)$")


def _is_list_item(line: str) -> bool:
    return bool(_RE_UL.match(line) or _RE_OL.match(line))


def _list_match(line: str):
    m = _RE_UL.match(line)
    if m:
        return ("ul", len(m.group(1).replace("\t", "    ")), m.group(3))
    m = _RE_OL.match(line)
    if m:
        return ("ol", len(m.group(1).replace("\t", "    ")), m.group(3))
    return None


def _render_list(lines: list[str], i: int) -> tuple[str, int]:
    """Render a list with ONE level of nesting (indent >= 2 spaces => child)."""
    first = _list_match(lines[i])
    if first is None:  # caller guarantees a list item; never unpack None (pyright-safe + hardened)
        return ("", i + 1)
    kind, base_indent, _ = first
    out = ["<%s>" % kind]
    n = len(lines)
    open_li = False
    while i < n:
        lm = _list_match(lines[i])
        if lm is None:
            if lines[i].strip() == "":  # blank line inside list -> keep going if next is a list item
                if i + 1 < n and _list_match(lines[i + 1]):
                    i += 1
                    continue
            break
        _, indent, content = lm
        if indent < base_indent:
            break
        if indent >= base_indent + 2:
            # nested sub-list: render recursively, append inside the current <li>
            sub, i = _render_list(lines, i)
            out.append(sub)
            continue
        # sibling item at this level (k may differ — keep the opening kind, simple)
        if open_li:
            out.append("</li>")
        out.append("<li>" + _render_inline(_esc(content.strip())))
        open_li = True
        i += 1
    if open_li:
        out.append("</li>")
    out.append("</%s>" % kind)
    return "".join(out), i


# ── cross-link wiring (run on rendered HTML, outside code blocks) ─────────────

def _wire_links_outside_code(html_frag: str, hex_set: set[str], have_prrd: bool) -> str:
    """Replace TRDD/PRRD/wikimem tokens with anchors, but NEVER inside <pre>/<code>.

    We split on <pre>...</pre> and <code>...</code> spans and only transform the
    text between them, so verbatim code is left untouched.
    """
    parts = re.split(r"(<pre>.*?</pre>|<code>.*?</code>)", html_frag, flags=re.DOTALL)
    for idx in range(0, len(parts), 2):  # even indices = text outside code
        parts[idx] = _wire_tokens(parts[idx], hex_set, have_prrd)
    return "".join(parts)


def _wire_tokens(text: str, hex_set: set[str], have_prrd: bool) -> str:
    """Wire TRDD-<8hex>, #<8hex>, PRRD G/S<n>, and [[name]] in a plain-text run.

    Avoids rewriting tokens already inside an <a ...>…</a> (the markdown link pass
    may have produced anchors); we split on existing anchors and skip them.
    """
    segs = re.split(r"(<a\b[^>]*>.*?</a>)", text, flags=re.DOTALL)
    for j in range(0, len(segs), 2):
        s = segs[j]
        s = _RE_TRDD_TOKEN.sub(lambda m: _trdd_link(m.group(1), "TRDD-" + m.group(1), hex_set), s)
        s = _RE_HASH_TOKEN.sub(lambda m: _trdd_link(m.group(1), "#" + m.group(1), hex_set), s)
        if have_prrd:
            s = _RE_PRRD_CITE.sub(
                lambda m: '<a href="#/prrd#G%s" data-ve-navigate>PRRD %s%s</a>'
                % (m.group(2), m.group(1), m.group(2)), s)
        else:
            # no PRRD page in this build -> leave the citation as plain text
            pass
        s = _RE_WIKIMEM.sub(r"<strong>[[\1]]</strong>", s)
        segs[j] = s
    return "".join(segs)


def _trdd_link(hex8: str, label: str, hex_set: set[str]) -> str:
    """In-set -> a real link; out-of-set -> plain text + muted '(not in set)' note.
    NEVER emit a dangling in-set hash link (the build's hard contract)."""
    if hex8 in hex_set:
        return '<a href="#/trdd/%s" data-ve-navigate>%s</a>' % (hex8, label)
    return '%s <span class="docwiki-notinset">(not in set)</span>' % label


# ── page rendering ───────────────────────────────────────────────────────────

def _render_card(t: Trdd) -> str:
    """The frontmatter card: a small 2-col table of the key scalar fields."""
    rows = []
    for key, label in CARD_FIELDS:
        if key == "column":
            val = COLUMN_LABEL.get(t.column, t.column)
        else:
            val = t.fields.get(key, "").strip()
        if not val or val.lower() in ("null", "none"):
            continue
        rows.append("<tr><th>%s</th><td>%s</td></tr>" % (_esc(label), _esc(val)))
    if not rows:
        return ""
    return ('<table class="docwiki-fm"><caption class="docwiki-sr">'
            "Frontmatter</caption><tbody>" + "".join(rows) + "</tbody></table>")


def _render_xrefs(t: Trdd, hex_set: set[str], have_prrd: bool) -> str:
    """Cross-ref fields -> lists of clickable TRDD links + relevant-rules -> PRRD."""
    blocks = []
    for key, label in XREF_TRDD_FIELDS:
        vals = _field_values(t, key)
        vals = [v for v in vals if v and v.lower() not in ("null", "none", "[]")]
        if not vals:
            continue
        links = []
        for v in vals:
            h = _token_to_hex8(v)
            if h:
                links.append(_trdd_link(h, "TRDD-" + h, hex_set))
            else:
                links.append(_esc(v))
        blocks.append("<dt>%s</dt><dd>%s</dd>" % (_esc(label), ", ".join(links)))

    # relevant-rules: [3, 27, 64.134] -> PRRD links (anchor by number)
    rules = _field_values(t, "relevant-rules")
    rules = [r for r in rules if r and r.lower() not in ("null", "none", "[]")]
    if rules:
        rlinks = []
        for r in rules:
            num = re.match(r"^(\d+)", r.strip())
            if not num:
                rlinks.append(_esc(r))
                continue
            n = num.group(1)
            if have_prrd:
                rlinks.append('<a href="#/prrd#G%s" data-ve-navigate>%s</a>'
                              % (n, _esc(r)))
            else:
                rlinks.append('%s <span class="docwiki-notinset">(no PRRD)</span>'
                              % _esc(r))
        blocks.append("<dt>Relevant rules</dt><dd>%s</dd>" % ", ".join(rlinks))

    if not blocks:
        return ""
    return '<dl class="docwiki-xref">' + "".join(blocks) + "</dl>"


def _field_values(t: Trdd, key: str) -> list[str]:
    """List value if the field was a flow list; else split a scalar on commas."""
    if key in t.lists:
        return t.lists[key]
    raw = t.fields.get(key, "").strip()
    if not raw:
        return []
    if raw.startswith("[") and raw.endswith("]"):
        inner = raw[1:-1].strip()
        return [p.strip() for p in inner.split(",")] if inner else []
    return [raw]


def _token_to_hex8(tok: str) -> str:
    """Extract an 8hex from a cross-ref token: `TRDD-<8hex>`, bare 8hex, or uuid."""
    tok = tok.strip()
    m = _RE_TRDD_TOKEN.match(tok) or re.match(r"^TRDD-([0-9a-fA-F]{8})", tok)
    if m:
        return m.group(1).lower()
    m = re.match(r"^([0-9a-fA-F]{8})(?![0-9a-fA-F])", tok)
    if m:
        return m.group(1).lower()
    return ""


def render_trdd_page(t: Trdd, hex_set: set[str], have_prrd: bool) -> str:
    """One `<section data-ve-doc="trdd/<8hex>">` page: card + xrefs + body."""
    title = "TRDD-%s — %s" % (t.hex8, t.title) if t.hex8 else t.title
    card = _render_card(t)
    xrefs = _render_xrefs(t, hex_set, have_prrd)
    body_html = markdown_to_html(t.body, heading_offset=1)
    body_html = _wire_links_outside_code(body_html, hex_set, have_prrd)
    return (
        '<section data-ve-doc="trdd/%s" data-doc-title="%s">\n'
        "<h1>%s</h1>\n%s%s%s\n</section>"
        % (t.hex8, _esc(title), _esc(title),
           card, xrefs,
           '<div class="docwiki-body">%s</div>' % body_html)
    )


def render_prrd_page(prrd_md: str, hex_set: set[str]) -> str:
    """Render `design/requirements/PRRD.md`.

    Rule bullets `- **G64.1** — text` become `<div class="prrd-rule" id="G64">…</div>`
    (anchor by NUMBER so `#/prrd#G64` resolves regardless of the G/S letter). The
    surrounding prose (incl. GOLDEN/SILVER headers) is rendered as markdown.
    """
    lines = prrd_md.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out: list[str] = []
    buf: list[str] = []  # accumulates non-rule markdown to convert in chunks

    def flush_buf() -> None:
        if buf:
            frag = markdown_to_html("\n".join(buf), heading_offset=1)
            frag = _wire_links_outside_code(frag, hex_set, True)
            out.append(frag)
            buf.clear()

    for line in lines:
        rm = _RE_PRRD_RULE.match(line.strip())
        if rm:
            flush_buf()
            letter, number, version, text = rm.group(1), rm.group(2), rm.group(3), rm.group(4)
            body = _wire_links_outside_code(
                _render_inline(_esc(text.strip())), hex_set, True)
            out.append(
                '<div class="prrd-rule" id="G%s">'
                '<span class="prrd-rule-id">%s%s.%s</span> %s</div>'
                % (number, _esc(letter), _esc(number), _esc(version), body))
        else:
            buf.append(line)
    flush_buf()

    # PRRD title from the first H1 if any, else generic
    tm = re.search(r"^#[ \t]+(.+)$", prrd_md, re.MULTILINE)
    title = tm.group(1).strip() if tm else "PRRD — project rules"
    return (
        '<section data-ve-doc="prrd" data-doc-title="%s">\n'
        '<h1>%s</h1>\n<div class="docwiki-body">%s</div>\n</section>'
        % (_esc(title), _esc(title), "\n".join(out))
    )


def render_home_page(trdds: list[Trdd], have_prrd: bool, wiki_title: str) -> str:
    """The index: TRDDs grouped by column (14-stage order; only non-empty groups)."""
    by_col: dict[str, list[Trdd]] = {}
    for t in trdds:
        by_col.setdefault(t.column, []).append(t)

    parts = [
        '<section data-ve-doc="home" data-doc-title="Home">',
        "<h1>%s</h1>" % _esc(wiki_title),
        '<p class="docwiki-lead">%d design document%s. Click any link to navigate; '
        "back / forward and the breadcrumb track your trail.</p>"
        % (len(trdds), "" if len(trdds) == 1 else "s"),
    ]
    if have_prrd:
        parts.append(
            '<p><a href="#/prrd" data-ve-navigate><strong>PRRD</strong> — '
            "project requirements &amp; rules</a></p>")

    order = COLUMN_ORDER + [_OTHER_KEY]
    for col in order:
        group = by_col.get(col)
        if not group:
            continue
        group_sorted = sorted(group, key=lambda x: x.title.lower())
        parts.append('<section class="docwiki-group">')
        parts.append("<h2>%s <span class=\"docwiki-count\">(%d)</span></h2>"
                     % (_esc(COLUMN_LABEL.get(col, col)), len(group_sorted)))
        parts.append("<ul>")
        for t in group_sorted:
            label = "TRDD-%s — %s" % (t.hex8, t.title) if t.hex8 else t.title
            parts.append('<li><a href="#/trdd/%s" data-ve-navigate>%s</a></li>'
                         % (t.hex8, _esc(label)))
        parts.append("</ul></section>")
    parts.append("</section>")
    return "\n".join(parts)


# ── doc CSS (themed via --vc-* tokens; light + dark inherited from token block) ─

DOC_CSS = """
  html,body{margin:0;overflow-x:auto;}
  body{background:var(--vc-color-canvas);color:var(--vc-color-content);
    font-family:var(--vc-font-body);line-height:1.55;}
  [data-ve-doc]{overflow:visible;max-width:none;}
  [data-ve-doc] h1{margin-top:0;color:var(--vc-color-content);
    font-family:var(--vc-font-heading);font-size:1.7rem;line-height:1.2;}
  [data-ve-doc] h2{color:var(--vc-color-content);font-family:var(--vc-font-heading);
    font-size:1.3rem;margin:1.6em 0 .5em;border-bottom:1px solid var(--vc-color-border);
    padding-bottom:.2em;}
  [data-ve-doc] h3{color:var(--vc-color-content);font-size:1.1rem;margin:1.3em 0 .4em;}
  [data-ve-doc] h4,[data-ve-doc] h5,[data-ve-doc] h6{color:var(--vc-color-content);margin:1.1em 0 .3em;}
  [data-ve-doc] a{color:var(--vc-color-accent);text-decoration:none;}
  [data-ve-doc] a:hover{text-decoration:underline;}
  [data-ve-doc] p{margin:.6em 0;}
  /* code: NO inner scrollbars — page expands (project no-nested-scrollbars rule) */
  [data-ve-doc] pre{background:var(--vc-color-surface);color:var(--vc-color-content);
    border:1px solid var(--vc-color-border);border-radius:var(--vc-radius-md,8px);
    padding:var(--vc-space-4,.75rem);overflow:visible;max-width:none;
    font-family:var(--vc-font-mono);font-size:.86em;line-height:1.45;white-space:pre;}
  [data-ve-doc] code{font-family:var(--vc-font-mono);font-size:.88em;
    background:var(--vc-color-surface);border-radius:var(--vc-radius-sm,4px);padding:.1em .35em;}
  [data-ve-doc] pre code{background:none;padding:0;font-size:1em;}
  [data-ve-doc] blockquote{margin:.7em 0;padding:.1em .9em;
    border-left:3px solid var(--vc-color-border-strong,var(--vc-color-border));
    color:var(--vc-color-content-muted);}
  [data-ve-doc] hr{border:0;border-top:1px solid var(--vc-color-border);margin:1.4em 0;}
  [data-ve-doc] ul,[data-ve-doc] ol{margin:.6em 0;padding-left:1.6em;}
  [data-ve-doc] li{margin:.2em 0;}
  /* tables (markdown + frontmatter): overflow visible, no inner scrollbar */
  [data-ve-doc] table{border-collapse:collapse;margin:.8em 0;overflow:visible;max-width:none;}
  [data-ve-doc] table.docwiki-md-table th,[data-ve-doc] table.docwiki-md-table td{
    border:1px solid var(--vc-color-border);padding:.35em .6em;text-align:left;vertical-align:top;}
  [data-ve-doc] table.docwiki-md-table thead th{background:var(--vc-color-surface);
    font-weight:var(--vc-weight-bold,600);}
  /* frontmatter card */
  table.docwiki-fm{border:1px solid var(--vc-color-border);border-radius:var(--vc-radius-md,8px);
    background:var(--vc-color-surface);margin:.2em 0 1.1em;}
  table.docwiki-fm th{text-align:right;color:var(--vc-color-content-muted);
    font-weight:var(--vc-weight-bold,600);padding:.3em .7em;white-space:nowrap;
    width:1%;vertical-align:top;}
  table.docwiki-fm td{padding:.3em .7em;color:var(--vc-color-content);}
  /* cross-ref list */
  dl.docwiki-xref{display:grid;grid-template-columns:max-content 1fr;gap:.25em .9em;
    margin:0 0 1.2em;padding:.6em .9em;border:1px dashed var(--vc-color-border);
    border-radius:var(--vc-radius-md,8px);background:var(--vc-color-surface);}
  dl.docwiki-xref dt{color:var(--vc-color-content-muted);font-weight:var(--vc-weight-bold,600);}
  dl.docwiki-xref dd{margin:0;}
  .docwiki-notinset{color:var(--vc-color-content-muted);font-size:.85em;font-style:italic;}
  /* home groups */
  .docwiki-group h2{font-size:1.15rem;}
  .docwiki-count{color:var(--vc-color-content-muted);font-weight:400;font-size:.85em;}
  .docwiki-lead{color:var(--vc-color-content-muted);}
  /* PRRD rules */
  .prrd-rule{margin:.5em 0;padding:.5em .8em;border-left:3px solid var(--vc-color-accent);
    background:var(--vc-color-surface);border-radius:0 var(--vc-radius-sm,4px) var(--vc-radius-sm,4px) 0;
    scroll-margin-top:4rem;}
  .prrd-rule-id{font-family:var(--vc-font-mono);font-weight:var(--vc-weight-bold,600);
    color:var(--vc-color-accent);}
  .prrd-rule:target{outline:2px solid var(--vc-color-accent);outline-offset:2px;}
  /* visually-hidden caption */
  .docwiki-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}
  .theme-toggle{position:fixed;right:.5rem;bottom:.5rem;z-index:2000;font:inherit;
    padding:.4em .7em;border-radius:6px;cursor:pointer;
    background:var(--ve-control-bg);color:var(--ve-control-fg);border:1px solid var(--ve-control-border);}
"""

# The light/dark token block — values mirrored from tests/docwiki/phase1-fixture.html.
TOKEN_CSS = """
  :root{
    --vc-font-body:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    --vc-font-heading:var(--vc-font-body); --vc-font-mono:ui-monospace,Menlo,monospace;
    --vc-space-1:.25rem; --vc-space-2:.4rem; --vc-space-3:.5rem; --vc-space-4:.75rem; --vc-space-5:1rem;
    --vc-radius-sm:4px; --vc-radius-md:8px; --vc-z-modal:1000; --vc-weight-bold:600;
    --vc-color-canvas:#ffffff; --vc-color-surface:#f4f4f5; --vc-color-surface-raised:#ffffff;
    --vc-color-content:#1f2328; --vc-color-content-muted:#6b7280;
    --vc-color-border:#d0d7de; --vc-color-border-strong:#afb8c1;
    --vc-color-accent:#2563eb; --vc-color-on-accent:#fff; --vc-color-danger:#b91c1c;
    --ve-accent:#2563eb;
    --ve-control-bg:#f4f4f5; --ve-control-bg-hover:#e8e8eb; --ve-control-fg:#1f2328;
    --ve-control-border:#d0d7de; --ve-control-radius-sm:4px; --ve-control-font:var(--vc-font-body);
    --ve-control-overlay-bg:rgba(255,255,255,.85); --ve-control-overlay-blur:6px;
  }
  html[data-ve-theme="dark"]{
    --vc-color-canvas:#0d1117; --vc-color-surface:#161b22; --vc-color-surface-raised:#1c2128;
    --vc-color-content:#e6edf3; --vc-color-content-muted:#8b949e;
    --vc-color-border:#30363d; --vc-color-border-strong:#444c56;
    --vc-color-accent:#58a6ff; --vc-color-danger:#f85149;
    --ve-accent:#58a6ff;
    --ve-control-bg:#21262d; --ve-control-bg-hover:#30363d; --ve-control-fg:#e6edf3;
    --ve-control-border:#30363d; --ve-control-overlay-bg:rgba(22,27,34,.85);
  }
"""

THEME_TOGGLE = (
    '<button class="theme-toggle" onclick="(function(){var h=document.documentElement;'
    "h.setAttribute('data-ve-theme',h.getAttribute('data-ve-theme')==='dark'?'light':'dark');"
    '})()">Toggle theme</button>'
)


def build_html(pages_html: str, shell_js: str, wiki_title: str) -> str:
    """Assemble the one self-contained file: head tokens+CSS, body pages, inlined shell."""
    return (
        "<!DOCTYPE html>\n"
        '<html lang="en" data-ve-theme="light">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>%s</title>\n"
        "<style>\n%s\n%s\n</style>\n"
        "</head>\n"
        "<body>\n"
        "<div data-docwiki>\n%s\n</div>\n"
        "%s\n"
        "<script>\n%s\n</script>\n"
        "</body>\n</html>\n"
        % (_esc(wiki_title), TOKEN_CSS, DOC_CSS, pages_html, THEME_TOGGLE, shell_js)
    )


# ── orchestration ────────────────────────────────────────────────────────────

def collect_trdds(trdd_dirs: list[Path]) -> list[Trdd]:
    """Parse every `TRDD-*.md` across the given dirs; de-dup by 8hex (first wins)."""
    seen: set[str] = set()
    result: list[Trdd] = []
    for d in trdd_dirs:
        if not d.exists():
            raise SystemExit(f"FATAL: --trdd-dir does not exist: {d}")
        if not d.is_dir():
            raise SystemExit(f"FATAL: --trdd-dir is not a directory: {d}")
        for path in sorted(d.glob("TRDD-*.md")):
            t = parse_trdd(path)
            if not t.hex8:
                # Cannot derive a stable id at all — skip with a stderr note rather
                # than emit a page with an empty route (which would break routing).
                sys.stderr.write(f"WARN: no derivable 8hex id, skipping {path}\n")
                continue
            if t.hex8 in seen:
                sys.stderr.write(
                    f"WARN: duplicate 8hex {t.hex8} ({path.name}) — keeping first\n")
                continue
            seen.add(t.hex8)
            result.append(t)
    return result


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="amvcp-docwiki-build.py",
        description="Build a self-contained navigable design-doc wiki (TRDD + PRRD).")
    ap.add_argument("out", help="output .html path")
    ap.add_argument("--trdd-dir", action="append", default=[],
                    metavar="DIR", help="directory of TRDD-*.md (repeatable)")
    ap.add_argument("--prrd", metavar="PATH", help="path to PRRD.md (optional)")
    ap.add_argument("--title", default="Design Wiki", help="wiki <title> / home heading")
    args = ap.parse_args(argv)

    trdd_dirs = [Path(d) for d in args.trdd_dir]
    prrd_path = Path(args.prrd) if args.prrd else None

    if not trdd_dirs and not prrd_path:
        ap.error("at least one source is required: pass --trdd-dir and/or --prrd")

    # locate the Phase-1 shell relative to this script (self-contained, inlined)
    shell_path = Path(__file__).resolve().parent / "amvcp-docwiki.js"
    if not shell_path.exists():
        raise SystemExit(f"FATAL: shell runtime not found: {shell_path}")
    shell_js = shell_path.read_text(encoding="utf-8")

    trdds = collect_trdds(trdd_dirs)

    have_prrd = False
    prrd_md = ""
    if prrd_path is not None:
        if not prrd_path.exists():
            raise SystemExit(f"FATAL: --prrd file does not exist: {prrd_path}")
        try:
            prrd_md = prrd_path.read_text(encoding="utf-8")
        except OSError as exc:
            raise SystemExit(f"FATAL: cannot read PRRD file {prrd_path}: {exc}") from exc
        have_prrd = True

    if not trdds and not have_prrd:
        raise SystemExit("FATAL: no TRDD pages produced and no PRRD — nothing to build.")

    hex_set = {t.hex8 for t in trdds}

    pages: list[str] = [render_home_page(trdds, have_prrd, args.title)]
    if have_prrd:
        pages.append(render_prrd_page(prrd_md, hex_set))
    for t in trdds:
        pages.append(render_trdd_page(t, hex_set, have_prrd))

    out_html = build_html("\n\n".join(pages), shell_js, args.title)

    out_path = Path(args.out)
    if out_path.parent and not out_path.parent.exists():
        out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out_html, encoding="utf-8")

    sys.stderr.write(
        "built %s: %d TRDD page(s), PRRD=%s\n"
        % (out_path, len(trdds), "yes" if have_prrd else "no"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
