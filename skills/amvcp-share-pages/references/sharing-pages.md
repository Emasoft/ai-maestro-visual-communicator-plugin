# Sharing Pages

## Table of contents

- [Overview](#overview)
- [Usage](#usage)
- [Example](#example)
- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Notes](#notes)

## Overview

Share visual communicator pages instantly via Vercel when a `vercel-deploy` skill is available. No account or authentication required.

## Usage

```bash
python3 $CLAUDE_PLUGIN_ROOT/scripts/share.py <html-file>
```

## Example

```bash
python3 $CLAUDE_PLUGIN_ROOT/scripts/share.py $CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/my-diagram.html

# Output:
# ✓ Shared successfully!
# Live URL:  https://skill-deploy-abc123.vercel.app
# Claim URL: https://vercel.com/claim-deployment?code=...
```

## How it works

1. Runs the `share.py` script from the `$CLAUDE_PLUGIN_ROOT/scripts/` directory
2. Copies HTML file to temp directory as `index.html`
3. Deploys via the `vercel-deploy` skill
4. URL is live immediately — works in any browser

## Requirements

- vercel-deploy skill (`npm skills install vercel-deploy`)

## Notes

- Deployments are public — anyone with the URL can view
- Preview deployments have configurable retention (default: 30 days)
- Claim URL lets you transfer the deployment to your Vercel account
- Other harnesses can generate and open HTML normally; `/amvcp-share-page` depends on the `vercel-deploy` script being available

See [`commands/amvcp-share-page.md`](../../../commands/amvcp-share-page.md) for the `/amvcp-share-page` command template.
