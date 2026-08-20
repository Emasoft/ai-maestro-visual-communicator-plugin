---
trdd-id: 158a7937-e383-47b5-92e4-32291c0724b1
title: CPV false-positive remediation + 3-pillars publish-readiness for amvcp
column: complete
created: 2026-06-13T18:04:42+0200
updated: 2026-06-13T18:04:42+0200
current-owner: ai-maestro-visual-communicator-plugin
assignee: ai-maestro-visual-communicator-plugin
priority: 2
severity: MEDIUM
effort: M
labels: [security, cpv, publish, 3-pillars]
task-type: security
release-via: publish
delivery: direct-push
target-branch: main
relevant-rules: [6]
impacts: [ci-pipeline]
implementation-commits: [e8bf77c, ae875db, 0d2c5e3, 3ba7d8f, a868853]
external-refs: ["Emasoft/claude-plugins-validation#103", "Emasoft/claude-plugins-validation#104", "Emasoft/claude-plugins-validation#105", "Emasoft/claude-plugins-validation#114", "Emasoft/ai-maestro-plugin#7"]
---

# TRDD-158a7937 — CPV false-positive remediation + 3-pillars publish-readiness

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-06-13

**Goal:** get amvcp to pass CPV's publish gate (`publish.py` G3 = `cpv-remote-validate --strict`, needs `0/0/0/0`) under the user policy "CPV is sole validator; devitalize-or-remove, NEVER exempt/suppress" — so the owner can merge + publish a restart-ready release.

**FP burn-down (the 4 CPV blockers):**
- ✅ **#105** CDN SUPPLY_CHAIN — fixed CPV-side in v2.126.10 (`_skillaudit_html_context.py`); amvcp's Mermaid CDN import clears. No amvcp change.
- ✅ **#103** fixture invisible-unicode — CPV closed by-design (won't blanket-skip `tests/fixtures/`; offers `fixtures/fp/` + `<!-- corpus-kind: fp -->` for LIVE exemplars). amvcp's `prompt-injection-{malicious,benign}.md` were DEAD (orphaned since local scanners removed in 527898a) → **removed** (commit `a868853`).
- ⏳ **#104** `design/` (PRRD/TRDDs) scanned as shipped surface — OPEN, **CPV-side**, fleet-wide (blocks every 3-pillars adopter incl. code-auditor-agent). MANAGER escalating.
- ⏳ **#114** remote `--strict` times out on cold CI runner — OPEN, **CPV-side**, infra. MANAGER escalating.

**NEXT ACTION:** when CPV closes #104 + #114, the gate goes green → flag the OWNER to (1) merge `fix/ed5e8cc2` AND `feat/3-pillars-adoption` → `main`, (2) run `scripts/publish.py` (the only permitted push path — pre-push hook blocks all else; the OWNER runs it, not the agent), (3) ping ai-maestro-plugin#7 with the published version + `0/0/0/0` for the MANAGER's live-tree verify.

**Load-bearing facts / gotchas:**
- Two local branches must BOTH land before publish: `fix/ed5e8cc2` (`ae875db` BOM devitalize, `e8bf77c` /Users/me→~ docs, chart-resize fix) + `feat/3-pillars-adoption` (`0d2c5e3` 3-pillars adoption, `3ba7d8f` ratified `plugin.json` dependency, `a868853` fixture removal). 3-way merge is conflict-free (disjoint files).
- The ONLY devitalizable raw-invisible-unicode was the BOM in `scripts/amvcp-designmd.js` + `dispatch.py` → devitalized on `fix/ed5e8cc2` (`ae875db`, literal→`\uFEFF`/`\uFEFF` escape).
- The `design/` ZWSP (`TRDD-352ef46a` line 80) is NOT devitalized on purpose — per #104, design docs should not be scanned at all; devitalizing would work around the FP we asked CPV to fix.
- Ratified `plugin.json` dependency: `[{ "name": "ai-maestro-plugin", "version": "^2.6.0" }]` (matches assistant-manager-agent v2.10.1; NOT mirrored to marketplace.json).

**SUPERSEDED — do NOT carry forward:**
- ✗ "amvcp can hit 0/0/0/0 by devitalizing everything" — WRONG; #103/#105 were not amvcp-devitalizable (fixture-now-removed; CDN load-bearing), they needed CPV-side resolution.
- ✗ "the host said there's no formal plugin.json dependencies field" — superseded: the field is now ratified (see `3ba7d8f`).

**Durable artifacts to read before acting:**
- `reports/security/20260604_223151+0200-cpv-preinstall-amvcp-verdict.md` — the CPV pre-install verdict that ruled amvcp CLEAN and enumerated every FP class.
- `reports/cpv-fp-dedup/…` — which FP classes were new vs already-filed.
- Coordination thread: ai-maestro-plugin#7 (MANAGER confirmed adoption complete + authorizes the publish once CPV clears).

## 1. User direction

Make amvcp restart-ready: file all CPV FPs/errors (never exempt/suppress — devitalize or remove), adopt the new memory + 3-pillars systems, coordinate with the JANITOR (memory) and MANAGER (3-pillars) claudes. The publishing policy (`PRRD S6.1`): CPV is the sole validator.

## 2. What was done (this session)

Converted from `reports/security/20260604_223151+0200-cpv-preinstall-amvcp-verdict.md` (the verdict ruled the plugin CLEAN — all findings FALSE POSITIVES). Per devitalize-or-remove:

1. `/Users/me/` placeholder paths → `~` in command docs (`e8bf77c`).
2. Raw-BOM devitalized → escape in 2 BOM-strippers (`ae875db`).
3. Filed 3 new CPV FP issues: #103 (fixture), #104 (design/), #105 (CDN) — #103/#105 since resolved, #104 open.
4. Adopted 3-pillars (TRDD/PRRD/kanban) via depend-on-base (`0d2c5e3`) + ratified `plugin.json` dependency (`3ba7d8f`).
5. Removed orphaned prompt-injection scanner fixtures (`a868853`).

## 3. Acceptance criteria

- CPV `--strict 0/0/0/0` on the merged surface (gated on CPV #104 + #114).
- Both branches merged to `main`; `publish.py` release published.
- MANAGER live-tree verify on ai-maestro-plugin#7.
