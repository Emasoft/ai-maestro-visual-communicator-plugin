Use the canonical `ai-maestro-visual-communicator` skill at the repo root.

OpenClaw support is lightweight rules guidance, not a native plugin adapter. Point the agent at `SKILL.md` and ask it to follow that workflow when producing diagrams, visual reviews, slide decks, or complex tables.

Generated pages should be written to `~/.agent/diagrams/` and opened in a browser when the environment allows it. If OpenClaw does not support command templates, read the matching file under `commands/` and execute its instructions manually.

`/share-page` is limited to environments with a Pi-compatible `vercel-deploy` script in the expected skill location. HTML generation itself does not require that dependency.
