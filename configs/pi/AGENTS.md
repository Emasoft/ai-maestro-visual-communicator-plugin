Use the canonical `ai-maestro-visual-communicator` skill at the repo root.

For Pi, prefer `pi install git:github.com/Emasoft/ai-maestro-visual-communicator-plugin` or install a local checkout with `pi install ./ai-maestro-visual-communicator`. The package metadata points to `.` for the skill and `./commands` for prompts.

Do not keep the old manual installer copies alongside a package install. If you previously used `install-pi.sh`, remove `~/.pi/agent/skills/ai-maestro-visual-communicator` and the copied `~/.pi/agent/prompts/{diff-review,fact-check,generate-slides,generate-visual-plan,generate-web-diagram,plan-review,project-recap,share-page}.md` files before relying on the package.

Activate with `$ai-maestro-visual-communicator` or slash commands such as `/diff-review`, `/plan-review`, `/generate-web-diagram`, `/generate-slides`, and `/share-page` after restarting Pi. Generated pages go to `~/.agent/diagrams/` and should be opened in a browser when possible.

Command templates are convenience prompts; the skill itself is the source of behavior. `/share-page` requires a Pi-compatible `vercel-deploy` skill, normally installed with `pi install npm:vercel-deploy`.
