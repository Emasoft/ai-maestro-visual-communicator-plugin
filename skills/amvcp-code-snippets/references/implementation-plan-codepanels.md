# Sub-technique E8 — Implementation plan with 2-col code panels

## Table of Contents

- [E8.1 The shape](#e81-the-shape)
- [E8.2 The markup](#e82-the-markup)
- [E8.3 Why 2 columns](#e83-why-2-columns)
- [E8.4 The "load-bearing pair" discipline](#e84-the-load-bearing-pair-discipline)
- [E8.5 The narrow-viewport stacking](#e85-the-narrow-viewport-stacking)
- [E8.6 The "describe the pair" prose convention](#e86-the-describe-the-pair-prose-convention)
- [E8.7 Composition with the risk table](#e87-composition-with-the-risk-table)
- [E8.8 Selection / commenting](#e88-selection--commenting)
- [E8.9 Cross-references](#e89-cross-references)
- [E8.10 Light + dark verification](#e810-light--dark-verification)
- [E8.11 Tokens consumed](#e811-tokens-consumed)
- [E8.12 Mined source attribution](#e812-mined-source-attribution)

The "Key code" section of an implementation-plan document: 2-column
code grid showing two pieces of code that work TOGETHER (e.g. a
migration SQL + the corresponding TypeScript hook). Mined from
`16-implementation-plan.html` (html-effectiveness catalog #16).

## E8.1 The shape

An implementation-plan page has these sections (mined as the
"canonical model" for `amvcp-generate-visual-plan` output):

1. Summary strip (4 stat cells)
2. Milestone timeline
3. Data-flow SVG diagram
4. Paired mockups
5. **Key code** — 2-col code grid (THIS reference)
6. Risks & mitigations 3-col table
7. Open questions

The "Key code" section is where authors show the LOAD-BEARING code —
typically a database migration + an application-layer code change that
together implement the feature.

## E8.2 The markup

```html
<section class="ve-impl-plan-codepanels">
  <h2>Key code</h2>
  <p>The migration adds the <code class="inline">comments</code> table
     and the optimistic-mutation hook returns predicted state:</p>

  <div class="ve-impl-plan-codepanels__grid">
    <div class="ve-impl-plan-codepanels__col">
      <div class="ve-code-block">
        <div class="ve-code-path">
          <span class="ve-code-path__name">db/migrations/202604_task_comments.sql</span>
        </div>
        <pre><code class="language-sql">CREATE TABLE task_comments (
  id           BIGSERIAL PRIMARY KEY,
  task_id      BIGINT NOT NULL REFERENCES tasks(id),
  author_id    BIGINT NOT NULL REFERENCES users(id),
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id, created_at DESC);</code></pre>
      </div>
    </div>

    <div class="ve-impl-plan-codepanels__col">
      <div class="ve-code-block">
        <div class="ve-code-path">
          <span class="ve-code-path__name">src/hooks/useAddComment.ts</span>
        </div>
        <pre><code class="language-typescript">export function useAddComment (taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.addComment(taskId, body),
    onMutate: async (body) => {
      const optimistic = makeOptimisticComment(body);
      const prev = qc.getQueryData(['comments', taskId]);
      qc.setQueryData(['comments', taskId], (old) => [...(old || []), optimistic]);
      return { prev, optimistic };
    },
    onError: (_e, _b, ctx) => qc.setQueryData(['comments', taskId], ctx.prev),
    onSettled: () => qc.invalidateQueries(['comments', taskId])
  });
}</code></pre>
      </div>
    </div>
  </div>
</section>
```

The grid:

```css
.ve-impl-plan-codepanels__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.ve-impl-plan-codepanels__col {
  min-width: 0;          /* lets the inner code wrap rather than overflow */
}
@media (max-width: 900px) {
  .ve-impl-plan-codepanels__grid {
    grid-template-columns: 1fr;
  }
}
```

## E8.3 Why 2 columns

The 2-column visual telegraphs: "these two pieces of code are PAIRED".
Reader's eye sees them side-by-side and infers the connection. A
single-column stacked layout would lose that visual relationship.

Three or four columns would also work for a multi-file change, but
the visual gets cramped — for > 2 files, prefer separate stacked
blocks (each with file-path label) or a `<details>` walkthrough.

## E8.4 The "load-bearing pair" discipline

The 2-col code section should show the 2 pieces of code that, TOGETHER,
are the ENTIRE load-bearing change. If the implementation plan has
many files, the 2-col section shows the 2 the reader needs to see —
the rest goes in supporting sections (or is omitted entirely; the
reader trusts the plan, doesn't audit every line).

Typical pairs:
- **Migration + handler** (SQL + TS/Python that uses the new schema)
- **Schema + validator** (Zod/Pydantic schema + the validating
  function)
- **Server + client** (TS server endpoint + TS client call site)
- **Test + fixture** (the test + the fixture it consumes)
- **Old + new** (the deprecated function + its replacement)

For a Old-vs-New pair, [diff-blocks-split.md](../../amvcp-code-diff/references/diff-blocks-split.md)
might be a better fit — split view IS a 2-column visual specifically
for change comparisons. The 2-col code-panel is for INDEPENDENT pieces
of code that work together, not for before/after.

## E8.5 The narrow-viewport stacking

Below 900px viewport, the grid stacks to 1 column. The visual pair
becomes a vertical pair (migration on top, hook below). Reader can
still see them together, just sequentially.

Don't introduce inner scrollbars to "preserve" the 2-column visual on
narrow viewports — that violates the no-nested-scrollbars rule.
Stacking IS the correct degradation.

## E8.6 The "describe the pair" prose convention

Always pair the 2-col grid with a prose paragraph that NAMES both files
and explains the connection:

> The migration adds the **comments** table (db/migrations/...) and the
> **useAddComment hook** (src/hooks/useAddComment.ts) returns
> optimistic state so the UI updates before the network round-trip.

Without prose, the reader has to figure out WHY the pair is paired.
With prose, the eye scans: "OK migration, OK hook, OK they relate
because of optimistic update". Cognitive cost minimised.

## E8.7 Composition with the risk table

After the 2-col code panel, the implementation-plan continues with a
risk table:

```html
<section class="ve-impl-plan-risks">
  <h2>Risks & mitigations</h2>
  <table class="ve-impl-plan-risks__table">
    <thead>
      <tr>
        <th>Risk</th>
        <th>Sev</th>
        <th>Mitigation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Optimistic UI rolls back on slow networks (jarring)</td>
        <td><span class="ve-pill ve-pill--med">MED</span></td>
        <td>Show a subtle "saving…" spinner when settle takes > 800ms</td>
      </tr>
      <tr>
        <td>Migration fails on existing data with NULL constraints</td>
        <td><span class="ve-pill ve-pill--high">HIGH</span></td>
        <td>Run migration in staging first; have rollback script ready</td>
      </tr>
    </tbody>
  </table>
</section>
```

The risk table is OWNED by `amvcp-tables` (the table skill). The
sequence "code → risks" is the implementation-plan composition's
discipline.

## E8.8 Selection / commenting

Reader can select lines in either column independently. The selection
payload carries the file path + line range + content. The reviewer
agent receiving the comment can:
- Reply per-line ("re: line 4 of the migration — should this be
  `BIGINT REFERENCES` ON DELETE CASCADE?")
- Reply per-column ("re: the hook — what happens if the user has
  multiple tabs open?")
- Reply per-pair ("re: the pair — the migration should run before the
  hook is deployed, not after — add a deployment-order note")

## E8.9 Cross-references

- [code-block-with-file-path.md](../../amvcp-code-syntax-chrome/references/code-block-with-file-path.md) —
  every column has a file-path label
- [diff-blocks-split.md](../../amvcp-code-diff/references/diff-blocks-split.md) — alternative for
  before/after pairs (not the "independent pieces" pattern)
- `amvcp-tables` `comparison` mode — for the risk table

## E8.10 Light + dark verification

- [ ] Both columns' file-path labels readable on both themes
- [ ] Code blocks themed consistently on both themes
- [ ] Stacking at < 900px works correctly on both themes
- [ ] Comment pill anchors to the right column on both themes

## E8.11 Tokens consumed

- All from [code-block-with-file-path.md](../../amvcp-code-syntax-chrome/references/code-block-with-file-path.md)
- `--vc-space-3` (gap between columns)

## E8.12 Mined source attribution

Catalog quote from `16-implementation-plan.html`:

> *"5. **Key code** — 2-column code grid showing the migration SQL
> and the optimistic-mutation TS hook."*

Adopted as the canonical "load-bearing code" section of the
implementation-plan composition.
