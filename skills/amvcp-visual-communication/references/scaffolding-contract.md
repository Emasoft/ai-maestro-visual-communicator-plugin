# Scaffolding contract — how the agent uses this skill

## Table of Contents

- [Scaffolding contract](#scaffolding-contract)

## Scaffolding contract

1. **Identify the content shape** — read what the user typed plus any pasted data. Match against the decision matrix above.
2. **Suggest 1-3 category candidates** if the shape is ambiguous. State the trade-off in one line each. Wait for the user's pick if the choice is non-obvious.
3. **Read the picked category's [SKILL](../SKILL.md)** plus 1–2 of its references (the specific technique you'll use). Do NOT load all 30+ references for the category — progressive discovery means you load only what you need. **SPEED RULES (the user expects pixels in seconds):** batch ALL the reads of a generation flow into ONE parallel tool-call message — never read serially; start from a ready template in `templates/` (and the matching `references/QUICKSTART-*.md`) when one exists, transplanting content instead of authoring boilerplate; for multi-visual jobs spawn one subagent per artifact in parallel.
4. **Emit the scaffold** — one self-contained HTML file with the runtime + designmd + the category's JS lib loaded in this order: `amvcp-designmd.js` → `amvcp-runtime.js` → category lib (e.g. `amvcp-chart.js`). The category SKILL.md spells out the exact `<figure>`/`<table>`/`<pre>` markup contract.
5. **Run** `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <file>.html` if the page is interactive (waits for click + returns selection JSON), or just open it for explanatory pages.
6. **Verify visually** per [amvcp-self-debug-rules](../../amvcp-self-debug-rules/SKILL.md) — light + dark theme screenshots, no nested scrollbars, atom-contract stamps present. Every visual change MUST be screenshot-tested in BOTH themes.
