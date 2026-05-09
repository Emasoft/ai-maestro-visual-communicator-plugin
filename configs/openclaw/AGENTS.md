Use the canonical `amvcp-visual-communication` skill at `skills/amvcp-visual-communication/` in the repo.

OpenClaw support is lightweight rules guidance, not a native plugin adapter. Point the agent at `skills/amvcp-visual-communication/SKILL.md` and ask it to follow that workflow when producing diagrams, visual reviews, slide decks, or complex tables.

Generated pages should be written to `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/` and opened in a browser when the environment allows it. If OpenClaw does not support command templates, read the matching file under `commands/` and execute its instructions manually.

`/amvcp-share-page` is limited to environments with a Pi-compatible `vercel-deploy` script in the expected skill location. HTML generation itself does not require that dependency.
