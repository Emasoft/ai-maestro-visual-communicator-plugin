# Sub-technique E5 — Postmortem code panel (incident-report root-cause section)

## Table of Contents

- [E5.1 The placement](#e51-the-placement)
- [E5.2 The markup](#e52-the-markup)
- [E5.3 Why slate-bg here specifically](#e53-why-slate-bg-here-specifically)
- [E5.4 The pairing with the Impact mini-table](#e54-the-pairing-with-the-impact-mini-table)
- [E5.5 Selection / commenting on root-cause lines](#e55-selection--commenting-on-root-cause-lines)
- [E5.6 The "preserved evidence" principle](#e56-the-preserved-evidence-principle)
- [E5.7 The "fix is part of the evidence" principle](#e57-the-fix-is-part-of-the-evidence-principle)
- [E5.8 The narrow-viewport rendering](#e58-the-narrow-viewport-rendering)
- [E5.9 Don't combine with split-view diffs](#e59-dont-combine-with-split-view-diffs)
- [E5.10 The light + dark verification](#e510-the-light--dark-verification)
- [E5.11 Tokens consumed](#e511-tokens-consumed)
- [E5.12 Mined source attribution](#e512-mined-source-attribution)

The slate-bg diff panel inside an incident postmortem's "Root cause"
section. Mined from `12-incident-report.html` (html-effectiveness
catalog #12).

## E5.1 The placement

A postmortem has these sections, top to bottom:
1. INC-ID header + h1 + meta-pills (SEV-2, Resolved, Duration)
2. Slate-bg TL;DR card (ivory text — see [slate-bg-code-panel.md](./slate-bg-code-panel.md))
3. Timeline (dotted vertical with typed dots)
4. **Root cause** — the slate-bg diff code panel showing the buggy
   line + the fix (THIS reference)
5. Impact mini-table
6. Action items checklist

The diff panel in (4) is the centrepiece — the literal lines that
caused the incident, shown with diff tints.

## E5.2 The markup

```html
<section class="ve-postmortem-rootcause">
  <h2>Root cause</h2>
  <p>The retry-loop's <code class="inline">backoff</code> calculation
     reset to <code class="inline">0</code> on every failure (instead
     of doubling), causing a thundering-herd hammering the upstream
     service.</p>

  <div class="ve-code-block ve-code-panel-slate">
    <div class="ve-code-path">
      <span class="ve-code-path__name">src/api/retry.ts</span>
      <span class="ve-code-path__lines">L42-L48</span>
    </div>
    <pre><code class="language-diff">@@ -42,7 +42,7 @@ async function withRetry (fn, opts) {
   for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
     try { return await fn(); }
     catch (err) {
-      const backoff = 0;                       // BUG: never grows
+      const backoff = Math.min(opts.maxMs, 100 * Math.pow(2, attempt));
       await sleep(backoff);
     }
   }
</code></pre>
  </div>

  <p>The <code class="inline">backoff = 0</code> assignment was a
     leftover from a refactor that intended <code class="inline">
     backoff = opts.initialMs</code> — but the variable was never
     re-read. The fix computes exponential backoff with a max cap.</p>
</section>
```

The diff is INSIDE a slate-panel `.ve-code-block`. The slate visual
gives the panel weight; the diff tints (olive add, rust del) show the
fix.

## E5.3 Why slate-bg here specifically

Postmortems are SERIOUS reads. The slate-bg panel signals "this is the
load-bearing material — don't skim". The reader sees the dark island
in the middle of the prose and lands their eye there.

A regular default code-block would visually "blend" with the prose. A
postmortem's root-cause is the OPPOSITE of blendable — it should
shout.

## E5.4 The pairing with the Impact mini-table

Immediately after the diff panel:

```html
<section class="ve-postmortem-impact">
  <h2>Impact</h2>
  <table class="ve-postmortem-impact__table">
    <tbody>
      <tr>
        <th>Affected requests</th>
        <td><code class="inline">12,400</code></td>
      </tr>
      <tr>
        <th>Upstream errors triggered</th>
        <td><code class="inline">3,200</code></td>
      </tr>
      <tr>
        <th>Duration</th>
        <td><code class="inline">47 min</code></td>
      </tr>
      <tr>
        <th>Engineers paged</th>
        <td><code class="inline">3</code></td>
      </tr>
    </tbody>
  </table>
</section>
```

The diff panel ANSWERS "what was the bug"; the impact table ANSWERS
"what damage did it cause". The two together set up the action-items
section.

## E5.5 Selection / commenting on root-cause lines

Reader can select the buggy line (the `del` line) and comment "Why
was this never type-checked?". The agent receiving the comment knows:
- The line is `data-ve-diff="del"`
- It's inside a `.ve-code-panel-slate` panel
- The file path is `src/api/retry.ts`
- The line number in the OLD file is 45 (parsed from the hunk header
  and position in the diff)

The agent can respond with type-check policy context, propose a test,
or escalate.

## E5.6 The "preserved evidence" principle

The diff in a postmortem MUST show the LITERAL buggy code that was
running in production. Don't simplify, don't anonymize, don't fix
typos in comments. The reader needs to be able to grep for the
EXACT lines that caused the incident.

The author may add a comment line ABOVE the buggy code (`// BUG: never
grows` in the example above) — that comment is part of the fix, not
of the postmortem's evidence. Clear separation.

## E5.7 The "fix is part of the evidence" principle

The diff also shows the FIX — not because the postmortem is a PR
(it isn't), but because "what was changed" is part of the explanation.
The reader sees the bug AND the fix in one visual unit, can verify
that the fix actually addresses the bug.

If the fix is complex (refactor across multiple files), the
postmortem diffs JUST the load-bearing line, and the action-items
section links to the PR with the full fix:

```html
<li>
  <input type="checkbox" id="action-1" checked disabled>
  <label for="action-1">
    Fix deployed (see <a href="https://github.com/org/repo/pull/123">PR #123</a>)
  </label>
</li>
```

## E5.8 The narrow-viewport rendering

The slate panel's `--ve-slate-panel` bg remains regardless of viewport.
The diff still wraps via the runtime's `pre-wrap`. The impact table
stacks to vertical cells below 540px. The postmortem stays readable
on mobile.

## E5.9 Don't combine with split-view diffs

A postmortem's root-cause should be a UNIFIED diff (single column).
Split-view spreads the reader's attention; unified focuses it on the
ONE change that mattered.

If the bug genuinely required multi-file changes that NEED to be
compared, render multiple separate unified diffs stacked vertically,
each in its own slate panel, each with its own file-path label.

## E5.10 The light + dark verification

- [ ] Slate-bg panel renders dark on BOTH themes (it's a dark island
      on light page, dark surface on dark page)
- [ ] Diff tints visible inside the slate panel on both themes
- [ ] The file-path label readable on both themes (gray-500 reads on
      slate)
- [ ] The inline `<code class="inline">` chips in the surrounding prose
      readable on both themes (this is independent of the slate panel)

## E5.11 Tokens consumed

- All from [slate-bg-code-panel.md](./slate-bg-code-panel.md)
- All from [diff-blocks-unified.md](./diff-blocks-unified.md)
- `--ve-code-comment` — for the hunk header colour inside the diff
- `--vc-font-mono` — for the file-path label and impact table values

## E5.12 Mined source attribution

Catalog quote from html-effectiveness §3.13, source `12-incident-
report.html`:

> *"Then sections: vertical-line Timeline (each entry has a colored
> dot — gray default, clay for impact-start, olive for mitigated),
> Root cause with a slate-bg diff code panel, Impact mini-table
> (right-aligned mono numbers), Action items with checkbox + avatar +
> due-date rows."*

The slate-bg diff panel pattern is adopted as the postmortem's
canonical root-cause visualization.
