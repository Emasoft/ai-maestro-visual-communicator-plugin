#!/usr/bin/env python3
"""cpv_skillaudit_rules.py — pure-Python skill security scanner

Native port of github.com/megamind-0x/skillaudit v1.1.0 (HEAD 3654bdc),
stripped of all network, subprocess, eval, and tampering surfaces.

Source audit (2026-05-20, /tmp/skillaudit-clean/AUDIT.md):
  * Invisible characters in shipped files: NONE
  * eval() / new Function() execution: NONE (only as detection patterns)
  * child_process / spawn / exec: NONE (only RegExp.exec on string)
  * fs.writeFile / chmod / symlinks: NONE
  * Dynamic require() / import(): NONE
  * postinstall / lifecycle hooks: NONE
  * Telemetry to 3rd party (ga, amplitude, sentry, posthog, datadog): NONE
  * Phone-home calls in shipped code: 1 (domain reputation in mcp-server.js)
  * Crypto / wallet / payment libs in shipped code: NONE (only in
    unshipped src/server.js)

This port keeps ONLY the regex-scan core. Everything else is gone:
  - no urllib / no requests / no http / no socket / no DNS
  - no subprocess / no shell-out
  - no eval / no exec / no compile of dynamic strings
  - no fs writes (only reads, only from caller-supplied paths)
  - no environment mutation
  - no telemetry
  - no MCP-server transport
  - no domain-reputation phone-home

Stdlib only: re, json, math, pathlib, sys, base64, hashlib, dataclasses, typing.

Severity model maps to CPV ValidationReport:
  skillaudit  -> CPV
  critical    -> CRITICAL
  high        -> MAJOR
  medium      -> MINOR
  low/info    -> NIT
"""

from __future__ import annotations

import base64
import hashlib
import json
import math
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

# ── Domain reputation tables ──────────────────────────────────────────────

SAFE_DOMAINS = frozenset({
    "github.com", "raw.githubusercontent.com", "gist.github.com",
    "npmjs.com", "registry.npmjs.org", "unpkg.com",
    "moltbook.com", "agentvalley.tech",
    "pypi.org", "crates.io", "rubygems.org",
    "stackoverflow.com", "developer.mozilla.org",
    "google.com", "googleapis.com", "cloudflare.com",
    "vercel.app", "netlify.app", "heroku.com",
    "docker.io", "hub.docker.com",
    "openai.com", "anthropic.com", "huggingface.co",
    "linkedin.com", "twitter.com", "x.com",
    "medium.com", "dev.to", "hashnode.dev",
    "wikipedia.org", "wikimedia.org",
    "cdn.jsdelivr.net", "cdnjs.cloudflare.com",
})

SUSPICIOUS_DOMAINS = frozenset({
    "webhook.site", "requestbin.com", "pipedream.net",
    "ngrok.io", "ngrok-free.app", "burpcollaborator.net",
    "interact.sh", "oastify.com", "hookbin.com", "postb.in",
    "rbndr.us", "1u.ms", "nip.io", "xip.io",
    "pastebin.com", "transfer.sh", "file.io",
})


# ── Suppression heuristics (placeholders + doc context) ───────────────────

_PLACEHOLDER_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    r"YOUR_", r"YOUR\s+", r"xxx+", r"REPLACE", r"<your[_-]",
    r"REPLACE_WITH", r"placeholder", r"example\.com",
    r"your[_-]api[_-]?key", r"your[_-]token", r"your[_-]secret",
    r"your[_-]access", r"your[_-]jwt", r"xxx_replace",
]]

_DOC_CONTEXT_WORDS = [re.compile(p, re.IGNORECASE) for p in [
    r"\bexample\b", r"\busage\b", r"\bstep\s+\d", r"\bhow\s+to\b",
    r"\btutorial\b", r"\bsetup\b", r"\bconfiguration\b",
    r"\bgetting\s+started\b", r"\breference\b", r"\bquick\s+start\b",
    r"\bapi\s+reference\b", r"\bdocumentation\b", r"\bguide\b",
    r"\boverview\b", r"\bsave\s+your\b", r"\bstore\s+your\b",
    r"\bset\s+your\b", r"\badd\s+your\b", r"\bget\s+your\b",
    r"\bcreate\s+your\b", r"\bgenerate\b",
]]

_PLACEHOLDER_SKIP = [re.compile(p, re.IGNORECASE) for p in [
    r"YOUR_", r"YOUR\s+", r"xxx+", r"REPLACE", r"<your[_-]",
    r"placeholder", r"example", r"sample", r"demo", r"fake", r"dummy",
    r"test[_-]?key", r"sk-your", r"sk-xxx", r"insert[_-]",
]]

_RE_CODE_FENCE = re.compile(r"^\s*```")
_RE_MD_TABLE = re.compile(r"^\s*\|")
_RE_AUTH_BEARER = re.compile(r"Authorization:\s*Bearer", re.IGNORECASE)
_RE_PROCESS_ENV = re.compile(r"process\.env\.", re.IGNORECASE)
_RE_CREDENTIALS_JSON = re.compile(r"credentials\.json", re.IGNORECASE)
_RE_CREDENTIALS_JSON_BACKTICK = re.compile(r"`credentials\.json`")


def _has_placeholder(line: str) -> bool:
    return any(p.search(line) for p in _PLACEHOLDER_PATTERNS)


def _has_doc_context(lines: list[str], idx: int, span: int = 5) -> bool:
    start = max(0, idx - span)
    end = min(len(lines), idx + span + 1)
    for i in range(start, end):
        if any(p.search(lines[i]) for p in _DOC_CONTEXT_WORDS):
            return True
    return False


def _is_md_table(line: str) -> bool:
    return bool(_RE_MD_TABLE.match(line))


# ── Code-block detection ──────────────────────────────────────────────────

@dataclass
class _Block:
    start: int
    end: int
    lang: str


def _build_code_block_map(lines: list[str]) -> tuple[list[bool], list[_Block]]:
    code_map = [False] * len(lines)
    ranges: list[_Block] = []
    in_block = False
    block_start = -1
    block_lang = ""
    for i, raw in enumerate(lines):
        stripped = raw.strip()
        if _RE_CODE_FENCE.match(stripped):
            if not in_block:
                in_block = True
                block_start = i
                block_lang = stripped[3:].strip().lower()
            else:
                in_block = False
                ranges.append(_Block(block_start, i, block_lang))
                block_lang = ""
        code_map[i] = in_block
    return code_map, ranges


def _get_block_lang(ranges: list[_Block], idx: int) -> str | None:
    for r in ranges:
        if r.start < idx < r.end:
            return r.lang
    return None


def _block_has_placeholder(lines: list[str], ranges: list[_Block], idx: int) -> bool:
    for r in ranges:
        if r.start < idx < r.end:
            return any(_has_placeholder(lines[j]) for j in range(r.start, r.end + 1))
    return False


def _should_suppress(
    lines: list[str], idx: int, match: str, rule_id: str,
    code_map: list[bool], ranges: list[_Block],
) -> bool:
    line = lines[idx]

    if _has_placeholder(line):
        return True
    if code_map[idx] and _block_has_placeholder(lines, ranges, idx):
        return True
    if _has_doc_context(lines, idx):
        if rule_id in {"CRED_ENV_READ", "TOKEN_STEAL", "CRED_ENV_SAFE"}:
            return True
        if code_map[idx]:
            return True
    if _is_md_table(line) and rule_id in {"CRED_ENV_READ", "TOKEN_STEAL"}:
        return True
    if _RE_AUTH_BEARER.search(line):
        if _has_placeholder(line) or code_map[idx]:
            return True
    if _RE_CREDENTIALS_JSON.search(match):
        if _has_doc_context(lines, idx, 8):
            return True
        if _RE_CREDENTIALS_JSON_BACKTICK.search(line):
            return True
    if _RE_PROCESS_ENV.search(match) and _has_doc_context(lines, idx, 8):
        return True
    if code_map[idx] and _has_doc_context(lines, idx, 8):
        return True
    return False


# ── Dangerous-intent natural language patterns ────────────────────────────

_INTENT_PATTERNS = [
    (re.compile(r"send\s+(the\s+)?(contents?|data|file|config|credentials?|secrets?|tokens?)\s+(of|from|to)\s", re.IGNORECASE),
        "high", "Exfiltration intent", "Instruction asks to send sensitive data externally"),
    (re.compile(r"upload\s+(the\s+)?(contents?|data|file|config|credentials?|secrets?)\s", re.IGNORECASE),
        "high", "Upload intent", "Instruction asks to upload sensitive data"),
    (re.compile(r"post\s+(the\s+)?(contents?|data|results?)\s+to\s+", re.IGNORECASE),
        "medium", "POST data intent", "Instruction asks to POST data to an endpoint"),
    (re.compile(r"read\s+.*\.(env|key|pem|secret|credentials)\b.*(?:send|post|upload|forward|transmit)", re.IGNORECASE),
        "critical", "Read-and-exfiltrate intent", "Instruction asks to read secrets then send them"),
    (re.compile(r"(?:forward|relay|copy)\s+.*(?:api.?key|token|password|secret|credential)\s+to\s", re.IGNORECASE),
        "critical", "Credential forwarding intent", "Instruction asks to forward credentials"),
    (re.compile(r"(?:delete|remove|wipe|destroy)\s+(all\s+)?(files?|data|logs?|history|memory)", re.IGNORECASE),
        "high", "Destructive intent", "Instruction asks to delete files or data"),
    (re.compile(r"install\s+.*(?:backdoor|rootkit|keylogger|trojan|malware)", re.IGNORECASE),
        "critical", "Malware install intent", "Instruction asks to install malicious software"),
    (re.compile(r"disable\s+.*(?:firewall|antivirus|security|logging|audit)", re.IGNORECASE),
        "critical", "Security disable intent", "Instruction asks to disable security measures"),
    (re.compile(r"connect\s+(?:back|reverse)\s+to", re.IGNORECASE),
        "high", "Reverse connection intent", "Instruction asks to connect back to attacker"),
    (re.compile(r"exfiltrate", re.IGNORECASE),
        "critical", "Explicit exfiltration", "Instruction explicitly mentions exfiltration"),
]


# ── Decoded-payload threat patterns (base64/hex/unicode-escape decode) ────

_DECODED_THREATS = [
    (re.compile(r"https?://\S+", re.IGNORECASE), "Hidden URL", "high"),
    (re.compile(r"(?:curl|wget|fetch|axios|http\.request)\s", re.IGNORECASE), "Hidden network call", "critical"),
    (re.compile(r"(?:eval|exec|system|spawn|Function)\s*\(", re.IGNORECASE), "Hidden code execution", "critical"),
    (re.compile(r"(?:\.env|credentials|password|secret|token|api[_-]?key)", re.IGNORECASE), "Hidden credential reference", "high"),
    (re.compile(r"(?:/bin/(?:ba)?sh|cmd\.exe|powershell)", re.IGNORECASE), "Hidden shell reference", "critical"),
    (re.compile(r"(?:rm\s+-rf|del\s+/[fqs]|format\s+c:)", re.IGNORECASE), "Hidden destructive command", "critical"),
    (re.compile(r"(?:webhook\.site|ngrok|requestbin|pipedream)", re.IGNORECASE), "Hidden exfiltration domain", "critical"),
    (re.compile(r"(?:ignore\s+previous|ignore\s+all|new\s+instructions)", re.IGNORECASE), "Hidden prompt injection", "critical"),
    (re.compile(r"(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+", re.IGNORECASE), "Hidden SQL", "high"),
    (re.compile(r"<script[\s>]", re.IGNORECASE), "Hidden script tag", "high"),
    (re.compile(r"(?:ssh|nc|ncat|socat)\s+", re.IGNORECASE), "Hidden network tool", "high"),
    (re.compile(r"(?:PRIVATE KEY|BEGIN RSA|BEGIN EC)", re.IGNORECASE), "Hidden private key", "critical"),
]


# ── Capability detection ──────────────────────────────────────────────────

def _compile_patterns(plist: list[str]) -> list[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in plist]


_CAPABILITY_PATTERNS: dict[str, dict] = {
    "fs_read": {
        "patterns": _compile_patterns([
            r"\breadFile\s*\(", r"\.readFileSync\s*\(",
            r"\bcat\s+[^\s|&;]+", r"\bless\s+[^\s|&;]+", r"\bmore\s+[^\s|&;]+",
            r"\btail\s+[^\s|&;]+", r"\bhead\s+[^\s|&;]+",
            r"\bfs\.read\(", r"\bfs\.open\(", r"\bopen\s*\([^,)]*['\"]",
            r"\$\(cat\s+", r"`cat\s+",
            r"Read\s*(file|from)", r"Load\s*(file|from)",
        ]),
        "description": "Can read files from filesystem",
    },
    "fs_write": {
        "patterns": _compile_patterns([
            r"\bwriteFile\s*\(", r"\.writeFileSync\s*\(",
            r"\becho\s+.*>\s*", r"\btee\s+",
            r"\bfs\.write\(", r"\bfs\.createWriteStream\(",
            r"\bappendFile\s*\(", r"\.appendFileSync\s*\(",
            r"Write\s*(to|file)", r"Save\s*(to|file)", r"Create\s*(file)",
            r">\s*[a-zA-Z0-9._/-]+", r">>\s*[a-zA-Z0-9._/-]+",
        ]),
        "description": "Can write/modify files on filesystem",
    },
    "network_outbound": {
        "patterns": _compile_patterns([
            r"\bfetch\s*\(", r"\baxios\.", r"\brequest\s*\(",
            r"\bcurl\s+", r"\bwget\s+",
            r"\bhttps?\s*\.", r"\.get\s*\(", r"\.post\s*\(",
            r"\bHTTP[S]?\s+request", r"\bAPI\s+call",
            r"Make\s+.*request", r"Send\s+.*request",
            r"Connect\s+to", r"POST\s+to", r"GET\s+from",
        ]),
        "description": "Can make outbound network requests",
    },
    "network_inbound": {
        "patterns": _compile_patterns([
            r"\blisten\s*\(", r"\.listen\s*\(",
            r"\bcreateServer\s*\(", r"\bServer\s*\(",
            r"\bbind\s*\(", r"\baccept\s*\(",
            r"Start\s+server", r"Listen\s+on", r"Bind\s+to",
            r"HTTP\s+server", r"Web\s+server",
        ]),
        "description": "Can open network listeners/servers",
    },
    "code_exec": {
        "patterns": _compile_patterns([
            r"\beval\s*\(", r"\bnew\s+Function\s*\(",
            r"\bexec\s*\(", r"\bspawn\s*\(", r"\bfork\s*\(",
            r"\bchild_process\b", r"\bexecSync\s*\(",
            r"\bshell\s*[:=]\s*true",
            r"Execute\s+code", r"Run\s+command", r"Dynamic\s+execution",
            r"\bsubprocess\.(call|run|Popen)\s*\(", r"\bsystem\s*\(",
            r"\bos\.popen\s*\(",
        ]),
        "description": "Can execute code dynamically",
    },
    "credential_access": {
        "patterns": _compile_patterns([
            r"\.env\b", r"process\.env\.",
            r"api[_-]?key", r"access[_-]?token", r"bearer[_-]?token",
            r"secret[_-]?key", r"private[_-]?key",
            r"password", r"credentials", r"auth",
            r"\.config/.*credentials", r"\.ssh/id_",
            r"keychain", r"wallet", r"mnemonic",
            r"jwt[_-]?token", r"oauth",
        ]),
        "description": "Can access credentials / secrets",
    },
    "encoding_decoding": {
        "patterns": _compile_patterns([
            r"\bbase64\b", r"\batob\s*\(", r"\bbtoa\s*\(",
            r"Buffer\.from\([^)]+,\s*['\"]base64['\"]",
            r"\.toString\(['\"]base64['\"]\)",
            r"hex(?:encode|decode)", r"unhexlify",
            r"\bzlib\.", r"\bgzip\b", r"\bdeflate\b",
            r"\\x[0-9a-fA-F]{2}", r"\\u[0-9a-fA-F]{4}",
            r"String\.fromCharCode",
        ]),
        "description": "Can encode/decode data (obfuscation surface)",
    },
    "memory_modify": {
        "patterns": _compile_patterns([
            r"system_prompt", r"system\s+message",
            r"override.*instructions", r"ignore.*instructions",
            r"forget.*previous", r"new\s+instructions",
            r"context\.set", r"setContext", r"updateContext",
        ]),
        "description": "Can modify agent memory / instructions",
    },
    "browser_access": {
        "patterns": _compile_patterns([
            r"localStorage", r"sessionStorage", r"document\.cookie",
            r"chrome\.cookies", r"browser\.cookies",
            r"\.cookies/.*Cookies", r"\bCookies\.binarycookies\b",
            r"Login\s+Data", r"Web\s+Data",
        ]),
        "description": "Can read browser storage (cookies, tokens)",
    },
    "system_modify": {
        "patterns": _compile_patterns([
            r"systemctl\s+(?:enable|start|disable)",
            r"launchctl\s+load", r"crontab\s+-",
            r"/etc/(?:passwd|shadow|sudoers|hosts)",
            r"registry\s+(?:add|edit)", r"reg\s+add",
            r"chmod\s+\+[xs]", r"chown\s+root",
        ]),
        "description": "Can modify system configuration",
    },
    "privilege_escalation": {
        "patterns": _compile_patterns([
            r"\bsudo\s+", r"\brunas\b", r"\belevate\b",
            r"setuid", r"setgid",
            r"\bsu\s+-\b", r"administrator", r"root\s+access",
        ]),
        "description": "Can escalate privileges",
    },
}


_THREAT_CHAINS = [
    {"caps": ["credential_access", "network_outbound"], "name": "DATA_EXFILTRATION",
     "severity": "critical", "category": "data_theft",
     "description": "Can access credentials AND send network requests - potential for data theft"},
    {"caps": ["code_exec", "network_outbound"], "name": "COMMAND_AND_CONTROL",
     "severity": "critical", "category": "backdoor",
     "description": "Can execute code AND make network requests - potential C&C channel"},
    {"caps": ["memory_modify", "credential_access"], "name": "PERSISTENCE_WITH_THEFT",
     "severity": "critical", "category": "persistence",
     "description": "Can modify agent behavior AND access credentials - persistent compromise"},
    {"caps": ["fs_read", "encoding_decoding", "network_outbound"], "name": "STAGED_EXFILTRATION",
     "severity": "high", "category": "data_theft",
     "description": "Can read files, encode data, and send externally - staged data theft"},
    {"caps": ["credential_access", "encoding_decoding"], "name": "CREDENTIAL_OBFUSCATION",
     "severity": "high", "category": "evasion",
     "description": "Can access credentials and encode them - potential credential hiding"},
    {"caps": ["system_modify", "privilege_escalation"], "name": "SYSTEM_COMPROMISE",
     "severity": "critical", "category": "persistence",
     "description": "Can modify system AND escalate privileges - full system compromise"},
    {"caps": ["browser_access", "network_outbound"], "name": "SESSION_HIJACKING",
     "severity": "critical", "category": "data_theft",
     "description": "Can access browser data AND make requests - session/credential theft"},
    {"caps": ["code_exec", "encoding_decoding"], "name": "OBFUSCATED_EXECUTION",
     "severity": "high", "category": "evasion",
     "description": "Can execute code AND use encoding - potential obfuscated malware"},
    {"caps": ["fs_write", "code_exec"], "name": "DROPPER_BEHAVIOR",
     "severity": "high", "category": "persistence",
     "description": "Can write files AND execute code - potential dropper/installer"},
    {"caps": ["memory_modify", "network_outbound"], "name": "AGENT_MANIPULATION",
     "severity": "critical", "category": "persistence",
     "description": "Can modify agent behavior AND communicate externally - agent takeover"},
]


# ── Secret detectors ──────────────────────────────────────────────────────

def _shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    freq: dict[str, int] = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    n = len(s)
    h = 0.0
    for c in freq.values():
        p = c / n
        h -= p * math.log2(p)
    return h


def _validate_discord_token(m: str) -> bool:
    parts = m.split(".")
    return len(parts) == 3 and len(parts[0]) >= 18


def _validate_generic_secret(full_line: str) -> bool:
    m = re.search(r"['\"]([A-Za-z0-9+/=_-]{20,})['\"]", full_line)
    if not m:
        return False
    val = m.group(1)
    if re.match(r"^(your|my|the|test|example|sample|demo|fake|dummy|placeholder|xxx|abc|123)", val, re.IGNORECASE):
        return False
    if re.match(r"^[A-Z_]+$", val):
        return False
    return _shannon_entropy(val) > 3.5


_SECRET_DETECTORS = [
    # (id, name, description, regex, severity, context_required, validator)
    ("SECRET_OPENAI_KEY", "OpenAI API key",
     "Hardcoded OpenAI API key detected — immediate credential exposure risk",
     re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}"), "critical", None, None),
    ("SECRET_ANTHROPIC_KEY", "Anthropic API key",
     "Hardcoded Anthropic API key detected",
     re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}"), "critical", None, None),
    ("SECRET_GITHUB_TOKEN", "GitHub personal access token",
     "Hardcoded GitHub token — grants repository and account access",
     re.compile(r"\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})"), "critical", None, None),
    ("SECRET_GITHUB_OAUTH", "GitHub OAuth/App token",
     "Hardcoded GitHub OAuth or App token",
     re.compile(r"\b(gho_[A-Za-z0-9]{36}|ghu_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36}|ghr_[A-Za-z0-9]{36})"),
     "critical", None, None),
    ("SECRET_AWS_KEY", "AWS access key",
     "Hardcoded AWS access key ID — grants cloud infrastructure access",
     re.compile(r"\b(AKIA[0-9A-Z]{16})"), "critical", None, None),
    ("SECRET_AWS_SECRET", "AWS secret access key",
     "Hardcoded AWS secret key detected",
     re.compile(r"(?:aws_secret_access_key|secret_?key|aws_secret)\s*[=:]\s*['\"]?([A-Za-z0-9/+=]{40})['\"]?", re.IGNORECASE),
     "critical", None, None),
    ("SECRET_SLACK_TOKEN", "Slack token",
     "Hardcoded Slack bot/user/app token",
     re.compile(r"\b(xox[bpas]-[0-9A-Za-z-]{10,})"), "critical", None, None),
    ("SECRET_SLACK_WEBHOOK", "Slack webhook URL",
     "Hardcoded Slack incoming webhook URL",
     re.compile(r"https://hooks\.slack\.com/services/T[A-Z0-9]{8,}/B[A-Z0-9]{8,}/[A-Za-z0-9]{20,}"),
     "high", None, None),
    ("SECRET_DISCORD_TOKEN", "Discord bot token",
     "Hardcoded Discord bot token — grants full bot access",
     re.compile(r"\b[MN][A-Za-z\d]{23,}\.[A-Za-z\d\-_]{6}\.[A-Za-z\d\-_]{27,}"),
     "critical", None, _validate_discord_token),
    ("SECRET_DISCORD_WEBHOOK", "Discord webhook URL",
     "Hardcoded Discord webhook — can post messages to channels",
     re.compile(r"https://discord(?:app)?\.com/api/webhooks/\d{17,}/[A-Za-z0-9_-]{60,}"),
     "high", None, None),
    ("SECRET_STRIPE_KEY", "Stripe API key",
     "Hardcoded Stripe secret or publishable key",
     re.compile(r"\b[rs]k_(?:live|test)_[A-Za-z0-9]{20,}"), "critical", None, None),
    ("SECRET_TWILIO_KEY", "Twilio API key",
     "Hardcoded Twilio account SID or auth token",
     re.compile(r"\bAC[a-f0-9]{32}"), "high", None, None),
    ("SECRET_SENDGRID_KEY", "SendGrid API key",
     "Hardcoded SendGrid API key",
     re.compile(r"\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}"),
     "critical", None, None),
    ("SECRET_GOOGLE_KEY", "Google API key",
     "Hardcoded Google API key",
     re.compile(r"\bAIza[0-9A-Za-z_-]{35}"), "high", None, None),
    ("SECRET_TELEGRAM_TOKEN", "Telegram bot token",
     "Hardcoded Telegram bot token — grants full bot control",
     re.compile(r"\b\d{8,10}:[A-Za-z0-9_-]{35}"), "critical", None, None),
    ("SECRET_MAILGUN_KEY", "Mailgun API key",
     "Hardcoded Mailgun API key",
     re.compile(r"\bkey-[0-9a-zA-Z]{32}"), "high", None, None),
    ("SECRET_HEROKU_KEY", "Heroku API key",
     "Hardcoded Heroku API key",
     re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"),
     "medium", re.compile(r"heroku", re.IGNORECASE), None),
    ("SECRET_GENERIC_ASSIGNMENT", "Hardcoded secret in variable assignment",
     "Variable named key/secret/token/password assigned a high-entropy string literal",
     re.compile(r"(?:api[_-]?key|secret|token|password|auth[_-]?key|access[_-]?key)\s*[=:]\s*['\"]([A-Za-z0-9+/=_-]{20,})['\"/]", re.IGNORECASE),
     "high", None, _validate_generic_secret),
    ("SECRET_PRIVATE_KEY", "Private key (PEM)",
     "Embedded private key in PEM format — critical credential exposure",
     re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"),
     "critical", None, None),
    ("SECRET_VERCEL_TOKEN", "Vercel token",
     "Hardcoded Vercel deployment token",
     re.compile(r"\b(vercel_[A-Za-z0-9_-]{20,})", re.IGNORECASE),
     "high", None, None),
    ("SECRET_NPM_TOKEN", "npm access token",
     "Hardcoded npm registry token — can publish packages",
     re.compile(r"\bnpm_[A-Za-z0-9]{36}"), "critical", None, None),
    ("SECRET_PYPI_TOKEN", "PyPI API token",
     "Hardcoded PyPI token — can publish Python packages",
     re.compile(r"\bpypi-[A-Za-z0-9_-]{50,}"), "critical", None, None),
]


def _redact(s: str) -> str:
    if len(s) > 10:
        keep_tail = min(len(s) - 8, 20)
        return s[:6] + "•" * keep_tail + s[-2:]
    return s[:3] + "•••"


# ── Result types ──────────────────────────────────────────────────────────

@dataclass
class Finding:
    rule_id: str
    severity: str          # 'critical' | 'high' | 'medium' | 'low' | 'info'
    category: str
    name: str
    description: str
    line: int              # 1-based
    line_content: str = ""
    match: str = ""
    context: str = ""
    suppressed: bool = False
    remediation: str | None = None
    capabilities: list[str] = field(default_factory=list)


@dataclass
class ScanResult:
    source: str
    risk_level: str        # 'clean' | 'low' | 'moderate' | 'high' | 'critical'
    risk_score: int
    findings: list[Finding]
    suppressed: list[Finding]
    capabilities: list[str]
    threat_chains: list[dict]
    content_hash: str
    verdict: str

    @property
    def summary(self) -> dict[str, int]:
        return {
            "total": len(self.findings),
            "critical": sum(1 for f in self.findings if f.severity == "critical"),
            "high": sum(1 for f in self.findings if f.severity == "high"),
            "medium": sum(1 for f in self.findings if f.severity == "medium"),
            "low": sum(1 for f in self.findings if f.severity in ("low", "info")),
            "suppressed": len(self.suppressed),
        }


# ── Scan engine ───────────────────────────────────────────────────────────

_RULES_CACHE: list[dict] | None = None


_VALID_RE_ESCAPES = set("AbBdDsSwWZ\\^$.|?*+()[{0123456789nrtfvNu")  # PCRE/JS overlap for Python re


def _safe_compile(pattern: str) -> re.Pattern | None:
    """Compile a regex; on bad-escape errors, escape literal backslashes that
    Python re doesn't recognize (e.g. \\R from JS regex). Returns None if it
    still won't compile — those rules are silently skipped.
    """
    try:
        return re.compile(pattern, re.IGNORECASE)
    except re.error:
        # Replace stray \X (X not a valid Python escape) with \\X
        repaired = re.sub(
            r"\\(.)",
            lambda m: "\\\\" + m.group(1) if m.group(1) not in _VALID_RE_ESCAPES else m.group(0),
            pattern,
        )
        try:
            return re.compile(repaired, re.IGNORECASE)
        except re.error:
            return None


def _load_rules() -> list[dict]:
    global _RULES_CACHE
    if _RULES_CACHE is not None:
        return _RULES_CACHE
    here = Path(__file__).resolve().parent
    # Look for skillaudit_patterns.json (namespaced for visual-comunicator),
    # then fall back to patterns.json (when used standalone).
    rules_path = here / "skillaudit_patterns.json"
    if not rules_path.exists():
        rules_path = here / "patterns.json"
    if not rules_path.exists():
        raise FileNotFoundError(
            f"skillaudit_patterns.json (or patterns.json) not found alongside "
            f"{Path(__file__).name}: {here}"
        )
    data = json.loads(rules_path.read_text(encoding="utf-8"))
    out = []
    for r in data.get("rules", []):
        compiled = [_safe_compile(p) for p in r.get("patterns", [])]
        compiled = [c for c in compiled if c is not None]
        if not compiled:
            continue  # drop rules with no compilable patterns
        out.append({
            "id": r.get("id"),
            "severity": r.get("severity"),
            "category": r.get("category"),
            "name": r.get("name"),
            "description": r.get("description"),
            "remediation": r.get("remediation"),
            "patterns_re": compiled,
        })
    _RULES_CACHE = out
    return out


def _rule_findings(lines: list[str],
                   code_map: list[bool], ranges: list[_Block]) -> list[Finding]:
    out: list[Finding] = []
    for rule in _load_rules():
        for rx in rule["patterns_re"]:
            for i, line in enumerate(lines):
                for m in rx.finditer(line):
                    match = m.group(0)
                    suppressed = _should_suppress(lines, i, match, rule["id"], code_map, ranges)
                    severity = "info" if suppressed else rule["severity"]
                    blang = _get_block_lang(ranges, i)
                    if not suppressed and code_map[i] and blang in ("bash", "sh", "shell", "zsh"):
                        if severity == "medium":
                            severity = "high"
                        elif severity == "high":
                            severity = "critical"
                    out.append(Finding(
                        rule_id=rule["id"],
                        severity=severity,
                        category=rule["category"] or "",
                        name=rule["name"] or "",
                        description=rule["description"] or "",
                        remediation=rule.get("remediation"),
                        line=i + 1,
                        line_content=line.strip()[:200],
                        match=match[:200],
                        context=f"code:{blang or 'unknown'}" if code_map[i] else "prose",
                        suppressed=suppressed,
                    ))
    return out


_URL_RE = re.compile(r"https?://([^/\s)]+)", re.IGNORECASE)


def _extract_host(authority: str) -> str:
    """Pull the host out of a URL authority component.

    Handles userinfo (user[:pass]@), bracketed IPv6 ([::1]), and port (:8080).
    Returns lowercase host with no port, no userinfo.
    """
    # Drop userinfo: anything before the last @ that isn't already eaten
    if "@" in authority:
        authority = authority.rsplit("@", 1)[1]
    # IPv6 in brackets — keep the bracketed form intact (no port)
    if authority.startswith("["):
        end = authority.find("]")
        if end != -1:
            return authority[: end + 1].lower()
    # Otherwise split off port
    return authority.split(":", 1)[0].lower()


def _url_findings(lines: list[str]) -> list[Finding]:
    out: list[Finding] = []
    for i, line in enumerate(lines):
        for m in _URL_RE.finditer(line):
            host = _extract_host(m.group(1))
            # Strip leading subdomains down to the registrable name when comparing
            sus_hit = next((d for d in SUSPICIOUS_DOMAINS if host == d or host.endswith("." + d)), None)
            if sus_hit:
                out.append(Finding(
                    rule_id="URL_SUSPICIOUS_DOMAIN",
                    severity="critical",
                    category="data_exfiltration",
                    name="Suspicious destination domain",
                    description=f"URL points at known exfiltration / collaborator service: {sus_hit}",
                    line=i + 1,
                    line_content=line.strip()[:200],
                    match=m.group(0)[:200],
                    context="url",
                ))
    return out


def _intent_findings(lines: list[str], code_map: list[bool]) -> list[Finding]:
    out: list[Finding] = []
    for i, line in enumerate(lines):
        for rx, sev, name, desc in _INTENT_PATTERNS:
            m = rx.search(line)
            if not m:
                continue
            out.append(Finding(
                rule_id=f"INTENT_{name.replace(' ', '_').upper()}",
                severity=sev,
                category="prompt_injection",
                name=name,
                description=desc,
                line=i + 1,
                line_content=line.strip()[:200],
                match=m.group(0)[:200],
                context="code" if code_map[i] else "prose",
            ))
    return out


# ── Invisible-character detection ─────────────────────────────────────────

_INVISIBLE_CODEPOINTS = {
    0x200B: "ZWSP", 0x200C: "ZWNJ", 0x200D: "ZWJ",
    0x202A: "LRE", 0x202B: "RLE", 0x202C: "PDF",
    0x202D: "LRO", 0x202E: "RLO",
    0x2066: "LRI", 0x2067: "RLI", 0x2068: "FSI", 0x2069: "PDI",
    0xFEFF: "BOM", 0x180E: "MVS",
}
_INVISIBLE_PATTERN = re.compile("[" + "".join(chr(cp) for cp in _INVISIBLE_CODEPOINTS) + "]")
_TAG_CHAR_PATTERN = re.compile("[\U000E0000-\U000E007F]")


def _invisible_findings(lines: list[str]) -> list[Finding]:
    out: list[Finding] = []
    for i, line in enumerate(lines):
        seen: set[str] = set()
        for m in _INVISIBLE_PATTERN.finditer(line):
            name = _INVISIBLE_CODEPOINTS.get(ord(m.group(0)), "UNKNOWN")
            if name in seen:
                continue
            seen.add(name)
            out.append(Finding(
                rule_id="INVISIBLE_UNICODE",
                severity="critical",
                category="obfuscation",
                name="Invisible Unicode character",
                description=f"Line contains invisible/bidirectional control: {name} (U+{ord(m.group(0)):04X})",
                line=i + 1,
                line_content=line.replace(m.group(0), f"⟦{name}⟧").strip()[:200],
                match=name,
                context="invisible",
            ))
        if _TAG_CHAR_PATTERN.search(line):
            out.append(Finding(
                rule_id="UNICODE_TAG_CHAR",
                severity="critical",
                category="obfuscation",
                name="Unicode tag character",
                description="Line contains Unicode tag-character (U+E0000-U+E007F) — prompt-smuggling vector",
                line=i + 1,
                line_content=line.strip()[:200],
                match="TAG",
                context="invisible",
            ))
    return out


# ── Base64 / hex / unicode escape decoding ────────────────────────────────

_B64_RE = re.compile(r"[A-Za-z0-9+/]{16,}={0,2}")
_HEX_RE = re.compile(r"(?:\\x[0-9a-fA-F]{2}){8,}")
_UNICODE_ESC_RE = re.compile(r"(?:\\u[0-9a-fA-F]{4}){4,}")
_CHARCODE_RE = re.compile(r"String\.fromCharCode\s*\(([^)]+)\)", re.IGNORECASE)


def _scan_decoded(decoded: str, encoding: str, line_idx: int, line_content: str) -> list[Finding]:
    out: list[Finding] = []
    seen: set[str] = set()
    for rx, name, sev in _DECODED_THREATS:
        m = rx.search(decoded)
        if not m or name in seen:
            continue
        seen.add(name)
        out.append(Finding(
            rule_id=f"DECODED_{encoding.upper()}_{name.replace(' ', '_').upper()}",
            severity=sev,
            category="obfuscation",
            name=f"Decoded {encoding}: {name}",
            description=f"After {encoding}-decoding a payload on this line, scanner found: {name}",
            line=line_idx + 1,
            line_content=line_content.strip()[:200],
            match=m.group(0)[:120],
            context=f"decoded:{encoding}",
        ))
    return out


def _decode_base64_findings(lines: list[str]) -> list[Finding]:
    out: list[Finding] = []
    for i, line in enumerate(lines):
        for m in _B64_RE.finditer(line):
            blob = m.group(0)
            if len(blob) < 20 or len(blob) > 4096:
                continue
            try:
                # Validate base64 first to avoid surfacing random tokens
                decoded_bytes = base64.b64decode(blob, validate=False)
                decoded = decoded_bytes.decode("utf-8", errors="replace")
            except Exception:
                continue
            # Heuristic: skip noise (< 6 printable chars in the decode)
            printable = sum(1 for c in decoded if c.isprintable())
            if printable < 6:
                continue
            out.extend(_scan_decoded(decoded, "base64", i, line))
    return out


def _decode_escape_findings(lines: list[str]) -> list[Finding]:
    out: list[Finding] = []
    for i, line in enumerate(lines):
        # \xNN sequences
        for m in _HEX_RE.finditer(line):
            try:
                decoded = bytes.fromhex(m.group(0).replace("\\x", "")).decode("utf-8", errors="replace")
            except Exception:
                continue
            out.extend(_scan_decoded(decoded, "hex", i, line))
        # \uNNNN sequences
        for m in _UNICODE_ESC_RE.finditer(line):
            try:
                decoded = m.group(0).encode("utf-8").decode("unicode_escape")
            except Exception:
                continue
            out.extend(_scan_decoded(decoded, "unicode_escape", i, line))
        # String.fromCharCode(...)
        for m in _CHARCODE_RE.finditer(line):
            args = m.group(1)
            try:
                codes = [int(x.strip()) for x in args.split(",") if x.strip().isdigit()]
                decoded = "".join(chr(c) for c in codes if 0 < c < 0x10FFFF)
            except Exception:
                continue
            if len(decoded) < 4:
                continue
            out.extend(_scan_decoded(decoded, "fromCharCode", i, line))
    return out


# ── Secret detection ──────────────────────────────────────────────────────

def _secret_findings(lines: list[str]) -> list[Finding]:
    out: list[Finding] = []
    seen_keys: set[str] = set()
    for det_id, det_name, det_desc, rx, sev, ctx_req, validator in _SECRET_DETECTORS:
        for i, line in enumerate(lines):
            for m in rx.finditer(line):
                match_text = m.group(0)
                # Suppress on placeholder lines
                if any(p.search(line) for p in _PLACEHOLDER_SKIP):
                    continue
                # Optional context requirement (e.g., Heroku UUIDs only flagged near "heroku")
                if ctx_req is not None:
                    nearby = " ".join(lines[max(0, i - 3): min(len(lines), i + 4)])
                    if not ctx_req.search(nearby):
                        continue
                # Optional validator
                if validator is not None and not validator(match_text if det_id != "SECRET_GENERIC_ASSIGNMENT" else line):
                    continue
                key = f"{det_id}:{i + 1}"
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                out.append(Finding(
                    rule_id=det_id,
                    severity=sev,
                    category="hardcoded_secret",
                    name=det_name,
                    description=det_desc,
                    line=i + 1,
                    line_content=line.strip()[:200],
                    match=_redact(match_text),
                    context="hardcoded_secret",
                ))
    return out


# ── Capability + threat chain analysis ────────────────────────────────────

def _capability_analysis(lines: list[str]) -> tuple[list[str], list[dict]]:
    detected: dict[str, dict] = {}
    for cap_name, cap_def in _CAPABILITY_PATTERNS.items():
        cap_lines: list[int] = []
        for i, line in enumerate(lines):
            for rx in cap_def["patterns"]:
                if rx.search(line):
                    cap_lines.append(i + 1)
                    break
        if cap_lines:
            detected[cap_name] = {"description": cap_def["description"], "lines": cap_lines}
    chains: list[dict] = []
    for chain in _THREAT_CHAINS:
        if all(c in detected for c in chain["caps"]):
            chains.append({
                "name": chain["name"],
                "severity": chain["severity"],
                "category": chain["category"],
                "description": chain["description"],
                "capabilities": list(chain["caps"]),
                "evidence": {c: detected[c] for c in chain["caps"]},
            })
    return list(detected.keys()), chains


# ── Risk scoring + verdict ────────────────────────────────────────────────

_SEVERITY_SCORE = {"critical": 10, "high": 7, "medium": 4, "low": 1, "info": 0}


def _risk_level(score: int) -> str:
    if score == 0:
        return "clean"
    if score < 10:
        return "low"
    if score < 25:
        return "moderate"
    if score < 50:
        return "high"
    return "critical"


def _verdict(score: int, chains: int) -> str:
    if score == 0 and chains == 0:
        return "No issues detected. Skill appears safe."
    if score < 10 and chains == 0:
        return "Minor concerns found. Review recommended."
    if score < 25 and chains <= 1:
        return "Moderate risk. Manual review required before installing."
    return "High risk. DO NOT install without thorough manual audit."


# ── Public API ────────────────────────────────────────────────────────────

def scan_content(content: str, source: str = "inline") -> ScanResult:
    """Scan a content string. Returns ScanResult.

    Pure local operation — no network, no subprocess, no eval.
    """
    if content is None:
        raise TypeError("content must be a string")
    lines = content.split("\n")
    code_map, ranges = _build_code_block_map(lines)

    all_findings: list[Finding] = []
    all_findings.extend(_rule_findings(lines, code_map, ranges))
    all_findings.extend(_url_findings(lines))
    all_findings.extend(_intent_findings(lines, code_map))
    all_findings.extend(_invisible_findings(lines))
    all_findings.extend(_decode_base64_findings(lines))
    all_findings.extend(_decode_escape_findings(lines))
    all_findings.extend(_secret_findings(lines))

    caps, chains = _capability_analysis(lines)
    # Materialize threat-chain findings
    for ch in chains:
        first_cap = ch["capabilities"][0]
        first_line = ch["evidence"][first_cap]["lines"][0]
        all_findings.append(Finding(
            rule_id=f"THREAT_CHAIN_{ch['name']}",
            severity=ch["severity"],
            category=ch["category"],
            name=f"Threat Chain: {ch['name']}",
            description=ch["description"],
            line=first_line,
            line_content=f"Capability combination: {' + '.join(ch['capabilities'])}",
            match=" + ".join(ch["capabilities"]),
            context="capability_analysis",
            capabilities=list(ch["capabilities"]),
        ))

    # Deduplicate by (rule_id, line)
    seen: set[tuple[str, int]] = set()
    deduped: list[Finding] = []
    for f in all_findings:
        key = (f.rule_id, f.line)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(f)

    actionable = [f for f in deduped if not f.suppressed]
    suppressed = [f for f in deduped if f.suppressed]
    score = sum(_SEVERITY_SCORE.get(f.severity, 0) for f in actionable)

    return ScanResult(
        source=source,
        risk_level=_risk_level(score),
        risk_score=score,
        findings=actionable,
        suppressed=suppressed,
        capabilities=caps,
        threat_chains=chains,
        content_hash=hashlib.sha256(content.encode("utf-8")).hexdigest(),
        verdict=_verdict(score, len(chains)),
    )


#: Hard cap on file size we will scan (4 MiB). A SKILL.md > 4 MiB is
#: almost certainly malicious or accidentally huge — refuse rather than
#: load it into memory and feed it to 490 regex patterns.
MAX_SCAN_BYTES = 4 * 1024 * 1024


def scan_file(path: Path | str) -> ScanResult:
    """Scan a file's content (read-only). Returns ScanResult.

    Refuses files larger than MAX_SCAN_BYTES (4 MiB) — raises ValueError.
    """
    p = Path(path)
    size = p.stat().st_size
    if size > MAX_SCAN_BYTES:
        raise ValueError(
            f"refusing to scan file of size {size} bytes (cap {MAX_SCAN_BYTES} bytes): {p}"
        )
    text = p.read_text(encoding="utf-8", errors="replace")
    return scan_content(text, source=str(p))


# ── CPV ValidationReport adapter ──────────────────────────────────────────

_SEVERITY_TO_CPV = {
    "critical": "CRITICAL",
    "high": "MAJOR",
    "medium": "MINOR",
    "low": "NIT",
    "info": "NIT",
}


def to_cpv_report(result: ScanResult) -> dict:
    """Convert a ScanResult to a CPV-shaped ValidationReport dict.

    Output keys:
        critical, major, minor, nit  (integer counts)
        findings  (list of {severity, file, line, rule, message})
        summary   (string)
    """
    counts = {"CRITICAL": 0, "MAJOR": 0, "MINOR": 0, "NIT": 0}
    cpv_findings: list[dict] = []
    for f in result.findings:
        sev = _SEVERITY_TO_CPV.get(f.severity, "NIT")
        counts[sev] += 1
        cpv_findings.append({
            "severity": sev,
            "file": result.source,
            "line": f.line,
            "rule": f.rule_id,
            "message": f"{f.name} — {f.description}",
            "line_content": f.line_content,
            "match": f.match,
            "category": f.category,
        })
    return {
        "scanner": "cpv_skillaudit_rules",
        "source": result.source,
        "content_hash": result.content_hash,
        "risk_level": result.risk_level,
        "risk_score": result.risk_score,
        "verdict": result.verdict,
        "critical": counts["CRITICAL"],
        "major": counts["MAJOR"],
        "minor": counts["MINOR"],
        "nit": counts["NIT"],
        "capabilities": result.capabilities,
        "threat_chains": [{"name": c["name"], "severity": c["severity"],
                           "description": c["description"],
                           "capabilities": c["capabilities"]} for c in result.threat_chains],
        "findings": cpv_findings,
    }


# ── CLI (local-only, no network) ──────────────────────────────────────────

def _cli(argv: list[str]) -> int:
    if not argv or argv[0] in ("-h", "--help"):
        sys.stderr.write(
            "usage: cpv_skillaudit_rules.py <file> [<file> ...]\n"
            "       cpv_skillaudit_rules.py -          # read stdin\n"
            "Scans local skill files. Emits CPV ValidationReport JSON on stdout.\n"
            "No network. No subprocess. No eval.\n"
        )
        return 2
    results: list[dict] = []
    for arg in argv:
        if arg == "-":
            text = sys.stdin.read()
            results.append(to_cpv_report(scan_content(text, source="<stdin>")))
        else:
            results.append(to_cpv_report(scan_file(arg)))
    json.dump(results if len(results) > 1 else results[0], sys.stdout, indent=2)
    sys.stdout.write("\n")
    # Exit code: number of critical findings (capped at 255)
    crit = sum(r["critical"] for r in results)
    return min(crit, 255)


if __name__ == "__main__":
    sys.exit(_cli(sys.argv[1:]))
