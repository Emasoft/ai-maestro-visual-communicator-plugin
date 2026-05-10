---
name: amvcp-share-pages
description: "Deploy a generated HTML page to Vercel and get a live public URL the user can share. Use when the user asks to deploy, publish, share online, get a public URL, or ship a generated page so others can view it. Trigger: 'deploy to vercel', 'share this page', 'publish this online', 'get a public URL', 'host this somewhere', '/amvcp-share-page'."
license: MIT
compatibility: "Requires the vercel-deploy skill installed: `npm skills install vercel-deploy`. Browser + Python 3.12+. The page is deployed AS-IS — interactive selection still works on the deployed page if the user opens it via the runner; otherwise it's a static view."
metadata:
  author: Emasoft
---

# Share Pages (Vercel deploy)

Ship a generated HTML page to a live `*.vercel.app` URL. No account, no auth. The deploy is a static snapshot — fonts and CSS work, but features needing the local runner are inert.

## When this skill loads

Load only when an HTML page exists (or is about to be generated via `amvcp-visual-communication`) and the user explicitly asks to share it externally:

- "deploy to Vercel" / "publish online" / "share this page"
- "get me a public URL" / "host this somewhere" / "send to <person>"
- `/amvcp-share-page <path>`

If the user only wants to view locally, do NOT load — open with `scripts/amvcp-select.py`.

## Prerequisites

- A self-contained `.html` at a known absolute path (typically under `$CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/`).
- The **`vercel-deploy` skill** is installed:
  ```bash
  npm skills list | grep vercel-deploy
  ```
  If absent, the deploy fails with a clear error. Do NOT fall back to a raw `vercel` CLI — ask the user to install:
  ```bash
  npm skills install vercel-deploy
  ```
- A working internet connection.

## How to author

1. **Confirm the HTML page exists** at an absolute path. If not generated, run `amvcp-visual-communication` first.
2. **Invoke:**
   ```bash
   /amvcp-share-page $CLAUDE_PROJECT_ROOT/reports/visual-communicator/diagrams/<file>.html
   ```
   Under the hood: `python3 $CLAUDE_PLUGIN_ROOT/scripts/share.py <html-file>` copies HTML into a temp dir as `index.html`, hands it to `vercel-deploy`, and prints the live URL + claim URL.
3. **Return the URL verbatim** — user will copy-paste. Mention the claim URL too, for attaching to their Vercel account.

## What the deploy produces

- A live URL on `*.vercel.app` (e.g. `https://skill-deploy-abc123.vercel.app`) reachable by anyone with the link.
- A claim URL to attach the deployment to a Vercel account (otherwise anonymous pool, ~30-day retention).
- A **static** rendering: HTML + inline CSS/JS + CDN fonts/libraries all work.

What does **not** work on the deployed copy:

- **Interactive selection back-channel.** No local Python server on Vercel — runtime shows "selection sent — copy this JSON" overlay instead of POSTing.
- **Modal-comment threads (v2/v3).** Responder reads/writes local files; no transport on Vercel. Widgets render but submit fails silently.
- Anything depending on `amvcp-runtime.js` talking to localhost. Treat deployed pages as read-only snapshots.

## Resources

Plugin-level shared:

- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — wire format + runtime contract. Selection pages lose interactivity on Vercel; weigh before deploying.
- `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — palette + typography. Deployed page must look intentional without runner overlays.
- `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` — Slop Test. Once the URL is out, fixes require a re-deploy.

Skill-local:

- `./references/sharing-pages.md` — full deploy workflow, `share.py`, `vercel-deploy` API, error modes, retention.

## Limitations / Anti-patterns

- **Don't promise interactivity that doesn't survive the deploy.** Modal-comment threads (v2/v3) are dead on Vercel. If the user wants commentable reports for an external reviewer, keep the local runner alive — don't deploy.
- **Don't deploy pages with secrets or private data.** The URL is public-by-default and indexable. Audit the rendered HTML (paths, tokens, internal hostnames, PII) before deploying. Once on `*.vercel.app` the only mitigation is `vercel rm` plus the assumption it's already crawled.
- **Don't fall back to raw `vercel` CLI when `vercel-deploy` is missing.** The skill encapsulates auth, naming, and flags — bypassing breaks the claim flow. Stop and tell the user the install command.
- **Don't deploy pages that need the local runner to hydrate content.** A page only useful after `amvcp-select.py` injects something deploys as a blank shell — generate self-contained first.
