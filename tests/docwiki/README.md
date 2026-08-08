# amvcp-doc-wiki tests

Acceptance gate for the **navigable document-wiki visualizer** (TRDD-103a53e0):
`scripts/amvcp-docwiki-build.py` (build), `scripts/amvcp-docwiki.js` (the SPA
shell), `scripts/amvcp-docwiki-search.py` (the memgrep → results-HTML helper).

## Run

```bash
python3 tests/docwiki/run-tests.py
```

Stdlib only — no pip installs, no network, no browser. Exits `0` when every
check is green, non-zero on the first failure. Runnable from any working
directory (all paths resolve relative to the test file).

## What it builds

The runner invokes the real build script on the committed fixture sources:

```bash
python3 scripts/amvcp-docwiki-build.py OUT.html \
    --trdd-dir tests/docwiki/fixture-src/tasks \
    --mem-dir  tests/docwiki/fixture-src/memory \
    --prrd     tests/docwiki/fixture-src/requirements/PRRD.md \
    --title    "Fixture Wiki"
```

`OUT.html` is written to a throw-away temp dir and removed after the run.

## Fixture (`fixture-src/`)

A deliberately small but representative doc-set that exercises every render
path and the not-in-set fallbacks:

- **`tasks/`** — 3 TRDDs: a v2 frontmatter TRDD with `npt` / `eht` /
  `blocked-by` / `relevant-rules` cross-links and an out-of-set `TRDD-deadbeef`
  reference; its v2 sibling target; and a v1 (no-frontmatter, `**TRDD ID:**`
  bold-line) legacy doc — so all three id-derivation paths are covered.
- **`memory/`** — 3 wikimem notes (hub / component / aspect tiers) wired with
  `[[name]]` and `[[name|label]]` wikilinks, plus two deliberately dangling
  links (`[[dangling]]`, `[[missing-note|label]]`) and the two index files
  (`MEMORY.md`, `memory-index.md`) that must NOT become pages.
- **`requirements/PRRD.md`** — GOLDEN + SILVER rules (`G3.1`, `G64.134`,
  `S70.3`) targeted by the TRDD citations and anchored at `#/prrd#G<n>`.

## Checks

1. **build exits 0** — the build script runs clean and writes the file.
2. **structure** — the output has the four structural sections (`home`,
   `search`, `kanban`, `prrd`), exactly one `trdd/<8hex>` page per fixture
   TRDD, and exactly one `mem/<name>` page per note (minus the two indexes).
3. **zero dangling in-set links** — every `data-ve-navigate` anchor the build
   wired (`#/trdd/<hex>`, `#/mem/<name>`, `#/prrd#G<n>`) resolves to a real
   `data-ve-doc` section in the same file. Deliberate out-of-set refs render as
   plain "(not in set)" text and are correctly NOT counted as links — so this
   check has teeth: a regression that emitted a broken nav link would fail it.
4. **py_compile** — both build/search scripts are syntax-clean.
5. **node --check** — the shell runtime parses (skipped if `node` is absent).

Route/link extraction is scoped to the `<div data-docwiki>` body so the
illustrative `data-ve-doc="…"` example strings inside the inlined shell's
DOM-contract comment are never miscounted as real sections.
