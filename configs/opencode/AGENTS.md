Use the canonical `amvcp-visual-communication` skill at `skills/amvcp-visual-communication/` in the repo.

For OpenCode/opencode, the observed native skill path is `~/.config/opencode/skill/amvcp-visual-communication`. Optional command templates may be copied to `~/.config/opencode/command/` if your build supports them.

Activate by asking OpenCode to use the `amvcp-visual-communication` skill for diagrams, architecture overviews, visual reviews, slide decks, and complex tables. Generated pages go to `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`; browser auto-open behavior depends on the harness and sandbox.

Command-template behavior is build-dependent. The canonical skill docs and command markdown remain under ``. `/share-page` requires a Pi-compatible `vercel-deploy` script, so sharing may need separate setup outside OpenCode/opencode.
