Use the canonical `amvcp-visual-communication` skill at `skills/amvcp-visual-communication/` in the repo.

For Codex CLI, copy the skill to `~/.codex/skills/amvcp-visual-communication`. If your Codex build supports prompt templates, you may also copy `commands/*.md` to `~/.codex/prompts/`.

Activate by asking Codex to use `$amvcp-visual-communication` or the `amvcp-visual-communication` skill before generating diagrams, diff reviews, plan reviews, slide decks, or complex tables. Generated pages go to `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`; opening the browser may depend on Codex sandbox permissions.

Command-template support varies by Codex version. If prompts are unavailable, read the relevant command file and follow the skill workflow manually. `/share-page` depends on the Pi-compatible `vercel-deploy` script and may not work unless that dependency exists in a compatible location.
