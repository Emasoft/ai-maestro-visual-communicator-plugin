Use the canonical `ai-maestro-visual-communicator` skill at the repo root.

For OpenCode/opencode, the observed native skill path is `~/.config/opencode/skill/ai-maestro-visual-communicator`. Optional command templates may be copied to `~/.config/opencode/command/` if your build supports them.

Activate by asking OpenCode to use the `ai-maestro-visual-communicator` skill for diagrams, architecture overviews, visual reviews, slide decks, and complex tables. Generated pages go to `~/.agent/diagrams/`; browser auto-open behavior depends on the harness and sandbox.

Command-template behavior is build-dependent. The canonical skill docs and command markdown remain under ``. `/share-page` requires a Pi-compatible `vercel-deploy` script, so sharing may need separate setup outside OpenCode/opencode.
