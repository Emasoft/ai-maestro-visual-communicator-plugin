---
name: aimvc-share-page
description: Deploy a generated ai-maestro-visual-communicator HTML page and return a live Vercel URL
---
# Share Visual Communicator Page

Share a visual communicator HTML file instantly via Vercel. Returns a live URL with no authentication required when a Pi-compatible `vercel-deploy` skill is installed.

## Usage

```
/share-page <file-path>
```

**Arguments:**
- `file-path` - Path to the HTML file to share (required)

**Examples:**
```
/share-page ~/.agent/diagrams/my-diagram.html
/share-page /tmp/ai-maestro-visual-communicator-output.html
```

## How It Works

1. Finds the `ai-maestro-visual-communicator` skill directory for the current harness
2. Copies your HTML file to a temp directory as `index.html`
3. Deploys via the Pi-compatible `vercel-deploy` skill
4. Returns a live URL immediately

## Requirements

- **vercel-deploy skill** - Required for deployment. In Pi, install with: `pi install npm:vercel-deploy`

No Vercel account, Cloudflare account, or API keys needed. The deployment is "claimable" — you can transfer it to your Vercel account later if you want.

## Script Location

Resolve the script from the installed skill directory, then run it with the HTML file path:

```bash
python3 ~/.pi/agent/skills/ai-maestro-visual-communicator/scripts/share.py <file>
```

If the skill is installed somewhere else, use that install path instead. Common locations include `~/.codex/skills/ai-maestro-visual-communicator/scripts/share.py`, `~/.config/opencode/skill/ai-maestro-visual-communicator/scripts/share.py`, or `./scripts/share.py` from a repository checkout.

The script currently looks for the Pi-compatible `vercel-deploy` script in the standard Pi skill locations. Other harnesses can generate and open HTML normally, but sharing requires that dependency to be available in a compatible location.

## Output

```
Sharing my-diagram.html...

✓ Shared successfully!

Live URL:  https://skill-deploy-abc123.vercel.app
Claim URL: https://vercel.com/claim-deployment?code=...
```

The script also outputs JSON for programmatic use:
```json
{"previewUrl":"https://...","claimUrl":"https://...","deploymentId":"...","projectId":"..."}
```

## Notes

- Deployments are **public** — anyone with the URL can view
- Preview deployments have a configurable retention period (default: 30 days)
- Each share creates a new deployment with a unique URL
- **Interactive selection on shared pages:** the click-to-close mechanism is meant for the local agent loop; on a shared Vercel URL there is no `/__ve-select` endpoint, so the runtime auto-detects this and falls back to the "Copy JSON, paste to your agent" overlay. For shared pages, prefer **inlining** the runtime instead of referencing `ve-runtime.js` as an external file — the runtime is small and inlining keeps the deployment a single self-contained `index.html`. See `./references/interactive-selection.md` "Inlining the runtime".
