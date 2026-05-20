// test-decision-pills.js
//
// Dev-browser script — exercises the v3.1 per-finding decision toggles
// (TRDD-7a2dab03). Each finding section in the rendered report carries
// a fieldset.ve-decision with TWO toggle switches (approve + reject).
// Both off = "skip" (default). The runtime enforces mutex: turning one
// ON automatically clears the other. The toggles are independent of
// the comment modal: flipping a toggle writes a JSONL decision-only turn
// with text:""; opening the modal does NOT change the decision.
//
// Each test prints exactly one line:
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>
//
// Pre-conditions:
//   - server up on http://127.0.0.1:8767/
//   - queue dir is /tmp/ve-comments-tests/ (cleaned by orchestrator
//     between test scripts)
//   - sample-report.html has 4 findings (rendered from sample-report.md)

const FIXTURE = "http://127.0.0.1:8767/sample-report.html";
const QUEUE_LIST = "/__ve-test-queue-list";
const QUEUE_READ = "/__ve-test-queue-read";

const results = [];

function record(name, status, desc, detail) {
  results.push({ name, status, desc, detail: detail || '' });
}

async function setup(page) {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto(FIXTURE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
}

async function listQueueFiles(page) {
  // Cache-bust the GET so a stale HTTP cache (or a test-local proxy)
  // can't return a snapshot from before the most recent POST landed.
  return page.evaluate(async (url) => {
    const r = await fetch(url + '?_=' + Date.now());
    if (!r.ok) return [];
    const j = await r.json();
    return j.files || [];
  }, QUEUE_LIST);
}

async function readQueueFile(page, name) {
  return page.evaluate(async ({ url, n }) => {
    const r = await fetch(url + '?name=' + encodeURIComponent(n));
    if (!r.ok) return null;
    return await r.text();
  }, { url: QUEUE_READ, n: name });
}

async function setDecisionToggle(page, findingId, value) {
  // Set the toggle checkboxes' `checked` flags directly and dispatch a
  // synthetic `change` event. We use this instead of label.click()
  // because the QuickJS-backed dev-browser does not always synthesise
  // the click→change sequence reliably from a label click. A direct
  // `dispatchEvent('change', {bubbles:true})` matches the wire-protocol
  // the production listener registers anyway (delegated `change` on
  // `input[type="checkbox"]` inside `fieldset.ve-decision`).
  //
  // value ∈ {"approve","reject","skip"}:
  //   "approve" → check approve, uncheck reject, dispatch on approve
  //   "reject"  → check reject,  uncheck approve, dispatch on reject
  //   "skip"    → uncheck both, dispatch on whichever was previously on
  const ok = await page.evaluate((args) => {
    const fs = document.querySelector(
      'fieldset.ve-decision[data-anchor-id="ve-' + args.fid + '"]'
    );
    if (!fs) return false;
    const ap = fs.querySelector('input[type="checkbox"][data-decision="approve"]');
    const rj = fs.querySelector('input[type="checkbox"][data-decision="reject"]');
    if (!ap || !rj) return false;
    fs.scrollIntoView({ block: 'center' });
    let dispatchOn = null;
    if (args.val === 'approve') {
      ap.checked = true; rj.checked = false; dispatchOn = ap;
    } else if (args.val === 'reject') {
      rj.checked = true; ap.checked = false; dispatchOn = rj;
    } else { // skip
      const wasApprove = ap.checked;
      const wasReject = rj.checked;
      ap.checked = false; rj.checked = false;
      // Dispatch on whichever was previously ON so the listener has a
      // legitimate `change` source. If neither was on, pick approve.
      dispatchOn = wasApprove ? ap : (wasReject ? rj : ap);
    }
    dispatchOn.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, { fid: findingId, val: value });
  // POST round-trip is async; give it time to land on disk before the
  // test reads the queue dir.
  await page.waitForTimeout(400);
  return ok;
}

async function readJsonlLines(page) {
  // Collect JSONL contents across all <tid>.jsonl files in the queue dir.
  // Returns an array of parsed objects (one per line, in file order).
  const files = await listQueueFiles(page);
  const out = [];
  for (const f of files) {
    if (!/\.jsonl$/.test(f)) continue;
    const body = (await readQueueFile(page, f)) || '';
    for (const line of body.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try { out.push(JSON.parse(t)); } catch (_) { /* skip */ }
    }
  }
  return out;
}

// ── Tests ───────────────────────────────────────────────────────────

async function testDecisionDefaultSkip(page) {
  // Open the report. Every finding must have a fieldset.ve-decision with
  // BOTH toggles unchecked (the toggle-derived "skip" default). Queue
  // must be empty (loading the page does NOT emit any decision turn).
  await setup(page);
  const findings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('fieldset.ve-decision')).map((fs) => {
      const ap = fs.querySelector('input[type="checkbox"][data-decision="approve"]');
      const rj = fs.querySelector('input[type="checkbox"][data-decision="reject"]');
      return {
        anchorId: fs.getAttribute('data-anchor-id') || '',
        approveChecked: !!(ap && ap.checked),
        rejectChecked: !!(rj && rj.checked),
      };
    });
  });
  const allSkip = findings.length === 4 && findings.every(
    (f) => f.approveChecked === false && f.rejectChecked === false
  );
  const files = await listQueueFiles(page);
  const queueEmpty = files.filter((f) => /\.jsonl$/.test(f)).length === 0;
  const ok = allSkip && queueEmpty;
  record(
    'modal_decision_default_skip',
    ok ? 'PASS' : 'FAIL',
    'every finding renders with both toggles off (skip); queue dir empty',
    JSON.stringify({ findings, files })
  );
}

async function testDecisionChangesEmitTurn(page) {
  // Flip Finding 1 to approve, Finding 2 to reject. Verify the queue dir
  // gains exactly two JSONL lines, each with text:"" and decision set.
  await setup(page);
  const okA = await setDecisionToggle(page, 'finding-1', 'approve');
  const okR = await setDecisionToggle(page, 'finding-2', 'reject');
  await page.waitForTimeout(400);
  const lines = await readJsonlLines(page);
  const decisionLines = lines.filter((l) => l && typeof l.decision === 'string');
  const approve = decisionLines.find(
    (l) => l.anchorId === 've-finding-1' && l.decision === 'approve'
  );
  const reject = decisionLines.find(
    (l) => l.anchorId === 've-finding-2' && l.decision === 'reject'
  );
  const ok = okA && okR && decisionLines.length === 2 && approve && reject
    && approve.text === '' && reject.text === '';
  record(
    'modal_decision_changes_emit_turn',
    ok ? 'PASS' : 'FAIL',
    'flipping pills emits one JSONL line per change with text:"" and decision set',
    JSON.stringify({ okA, okR, count: decisionLines.length })
  );
}

async function testDecisionWithComment(page) {
  // Open Finding 3's modal via the comment pill, type "rename frob to
  // handleFrob", flip the decision pill to approve (independent of the
  // modal), then click ANSWER. Verify ONE decision-only turn (from the
  // pill flip) AND ONE comment turn carrying both text and decision:approve.
  await setup(page);

  // Step 1: flip Finding 3's pill to approve BEFORE opening the modal.
  // This emits one decision-only turn (text:"", decision:"approve").
  const flipped = await setDecisionToggle(page, 'finding-3', 'approve');

  // Step 2: open the comment modal on a paragraph inside Finding 3's
  // section. The hover-pill UI was removed (duplicated the bubble
  // handle); tests now open the modal via the __veOpenCommentModal
  // hook exposed by bootEverything().
  const t = await page.evaluate(() => {
    const sec = document.querySelector('section[data-ve-finding-id="finding-3"]');
    if (!sec) return null;
    const p = sec.querySelector('p[data-ve-comment-id]');
    if (!p) return null;
    p.scrollIntoView({ block: 'center' });
    const cid = p.getAttribute('data-ve-comment-id');
    if (typeof window.__veOpenCommentModal === 'function') {
      window.__veOpenCommentModal(p);
    }
    return { cid: cid };
  });
  if (!t) {
    record('modal_decision_with_comment', 'FAIL', 'open modal in finding-3', 'anchor not found');
    return;
  }
  await page.waitForTimeout(400);

  // Step 3: type and click ANSWER.
  const ta = await page.evaluate(() => {
    const x = document.querySelector('.ve-comment-modal textarea');
    if (!x) return null;
    const r = x.getBoundingClientRect();
    return { x: r.x + 30, y: r.y + 20 };
  });
  if (!ta) {
    record('modal_decision_with_comment', 'FAIL', 'open modal in finding-3', 'textarea missing');
    return;
  }
  await page.mouse.click(ta.x, ta.y);
  await page.waitForTimeout(100);
  await page.keyboard.type('rename frob to handleFrob');
  await page.waitForTimeout(150);
  const btn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.ve-comment-modal button'));
    const b = buttons.find((x) => /^ANSWER$/i.test(x.textContent.trim()));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!btn) {
    record('modal_decision_with_comment', 'FAIL', 'open modal in finding-3', 'ANSWER missing');
    return;
  }
  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(500);

  const lines = await readJsonlLines(page);
  // The comment turn should carry the decision:"approve" pulled from the
  // anchor's enclosing finding-3 fieldset (decision is propagated via
  // currentDecisionFor(anchorId)).
  const commentTurn = lines.find(
    (l) => l && l.text === 'rename frob to handleFrob' && l.decision === 'approve'
  );
  const decisionOnly = lines.find(
    (l) => l && l.text === '' && l.decision === 'approve' && l.anchorId === 've-finding-3'
  );
  const ok = flipped && !!commentTurn && !!decisionOnly;
  record(
    'modal_decision_with_comment',
    ok ? 'PASS' : 'FAIL',
    'comment turn carries text + decision:approve; pill flip emits its own decision-only turn',
    JSON.stringify({ flipped, commentTurn, decisionOnly, totalLines: lines.length })
  );
}

async function testDecisionMutex(page) {
  // First flip Finding 4 to "reject". Then DIRECTLY check the approve
  // toggle without manually clearing reject, and dispatch change. The
  // runtime listener (wireDecisionPills) must enforce 2-toggle mutex —
  // turning approve ON auto-clears reject. Final DOM state: approve
  // checked, reject NOT. Two decision turns emitted (reject, approve).
  await setup(page);
  await setDecisionToggle(page, 'finding-4', 'reject');
  await page.evaluate(() => {
    const fs = document.querySelector(
      'fieldset.ve-decision[data-anchor-id="ve-finding-4"]'
    );
    if (!fs) return;
    const ap = fs.querySelector('input[type="checkbox"][data-decision="approve"]');
    if (!ap) return;
    ap.checked = true; // approve ON; reject still ON — mutex must fire
    ap.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(400);
  const final = await page.evaluate(() => {
    const fs = document.querySelector(
      'fieldset.ve-decision[data-anchor-id="ve-finding-4"]'
    );
    if (!fs) return null;
    const ap = fs.querySelector('input[type="checkbox"][data-decision="approve"]');
    const rj = fs.querySelector('input[type="checkbox"][data-decision="reject"]');
    return { approve: !!(ap && ap.checked), reject: !!(rj && rj.checked) };
  });
  const lines = await readJsonlLines(page);
  const f4 = lines.filter((l) => l && l.anchorId === 've-finding-4');
  const ok = final && final.approve === true && final.reject === false
    && f4.length === 2
    && f4[0].decision === 'reject'
    && f4[1].decision === 'approve';
  record(
    'modal_decision_mutex',
    ok ? 'PASS' : 'FAIL',
    'turning approve ON auto-clears reject (mutex); both transitions emit decision turns',
    JSON.stringify({ final, count: f4.length, decisions: f4.map((l) => l.decision) })
  );
}

async function testDecisionSummaryPersisted(page) {
  // TRDD-1dcd0bd7 §A2 — the runtime POSTs /__ve-comment-summary on
  // modal close. The PRODUCTION server (scripts/amvcp-select.py) was
  // missing the handler so every flip silently 404'd; this test
  // proves both servers now write <threadId>.summary.json with the
  // right `decisions` map and `totals` aggregate.
  //
  // Test plan:
  //   1. Flip 2 toggles (finding-1 → approve, finding-2 → reject).
  //   2. Open the modal on a paragraph inside finding-3.
  //   3. Click DONE so the modal-close path POSTs the summary.
  //   4. List queue files; assert exactly one *.summary.json appears.
  //   5. Read it; assert decisions.{ve-finding-1=approve, ve-finding-2=reject}
  //      and totals.approve === 1 && totals.reject === 1.
  await setup(page);

  // Step 1 — flip two pills BEFORE opening the modal (decision-only
  // turns hit the JSONL queue, not the summary file yet).
  await setDecisionToggle(page, 'finding-1', 'approve');
  await setDecisionToggle(page, 'finding-2', 'reject');
  await page.waitForTimeout(200);

  // Step 2 — open the modal on a finding-3 paragraph via the
  // __veOpenCommentModal hook (hover-pill UI was removed).
  const t = await page.evaluate(() => {
    const sec = document.querySelector('section[data-ve-finding-id="finding-3"]');
    if (!sec) return null;
    const p = sec.querySelector('p[data-ve-comment-id]');
    if (!p) return null;
    p.scrollIntoView({ block: 'center' });
    if (typeof window.__veOpenCommentModal === 'function') {
      window.__veOpenCommentModal(p);
    }
    return { ok: true };
  });
  if (!t) {
    record('modal_decision_summary_persisted', 'FAIL', 'open modal in finding-3', 'anchor not found');
    return;
  }
  await page.waitForTimeout(400);

  // Step 3 — click DONE. closeCommentModal() calls postPageSummary().
  const done = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('.ve-comment-modal button'));
    const b = buttons.find((x) => /^DONE$/i.test(x.textContent.trim()));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!done) {
    record('modal_decision_summary_persisted', 'FAIL', 'click DONE', 'DONE button missing');
    return;
  }
  await page.mouse.click(done.x, done.y);
  // Give the POST + atomic rename time to land on disk.
  await page.waitForTimeout(600);

  // Step 4 — assert exactly one *.summary.json file exists.
  const files = await listQueueFiles(page);
  const summaryFiles = files.filter((f) => /\.summary\.json$/.test(f));
  if (summaryFiles.length !== 1) {
    record(
      'modal_decision_summary_persisted',
      'FAIL',
      'one summary file written on modal close',
      JSON.stringify({ files, summaryFiles })
    );
    return;
  }

  // Step 5 — verify decisions + totals payload.
  const body = (await readQueueFile(page, summaryFiles[0])) || '';
  let parsed = null;
  try { parsed = JSON.parse(body); } catch (_) { parsed = null; }
  const decisions = parsed && parsed.decisions ? parsed.decisions : {};
  const totals = parsed && parsed.totals ? parsed.totals : {};
  const ok =
    decisions['ve-finding-1'] === 'approve'
    && decisions['ve-finding-2'] === 'reject'
    && totals.approve === 1
    && totals.reject === 1
    && typeof parsed.threadId === 'string'
    && parsed.threadId.length > 0;

  record(
    'modal_decision_summary_persisted',
    ok ? 'PASS' : 'FAIL',
    'closing modal writes <tid>.summary.json with decisions + totals',
    JSON.stringify({ summaryFile: summaryFiles[0], decisions, totals, threadId: parsed && parsed.threadId })
  );
}

async function testAutoStampMissingParagraphAtoms(page) {
  // TRDD-9616579c regression #3: a hand-authored fixture may forget to
  // stamp data-ve-comment-id on every body paragraph. The runtime's
  // stampMissingBodyAtoms() boot pass must fill the gap so EVERY body
  // paragraph (excluding chrome regions + fake-headings + short
  // list-bullet glyphs) becomes selectable.
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto('http://127.0.0.1:8767/all-techniques-sample.html?cb='
    + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const r = await page.evaluate(() => {
    const allP = Array.from(document.querySelectorAll('p'));
    const stampedP = Array.from(document.querySelectorAll('p[data-ve-comment-id]'));
    // Auto-stamped paragraphs have data-ve-pnum >= 1000 (the autostamp base)
    const autoStampedP = stampedP.filter(p => {
      const n = parseInt(p.getAttribute('data-ve-pnum') || '0', 10);
      return n >= 1000;
    });
    // Fake-headings should still be UN-stamped
    const fakeHeadings = allP.filter(p => {
      let strong = null;
      for (const n of p.childNodes) {
        if (n.nodeType === 3 && (n.textContent || '').trim()) return false;
        if (n.nodeType === 1) {
          const t = n.tagName.toUpperCase();
          if (t === 'STRONG' || t === 'B' || t === 'EM' || t === 'I') {
            if (strong) return false;
            strong = n;
          } else return false;
        }
      }
      return !!strong;
    });
    const fakeUnstamped = fakeHeadings.filter(p =>
      !p.hasAttribute('data-ve-comment-id'));
    // Try clicking an auto-stamped paragraph
    let clickWorked = null;
    if (autoStampedP.length > 0) {
      const t = autoStampedP[0];
      const rect = t.getBoundingClientRect();
      t.dispatchEvent(new MouseEvent('mousedown',
        { bubbles: true, clientX: rect.left + 30, clientY: rect.top + 20, button: 0 }));
      t.dispatchEvent(new MouseEvent('mouseup',
        { bubbles: true, clientX: rect.left + 30, clientY: rect.top + 20, button: 0 }));
      clickWorked = t.getAttribute('data-ve-pressed') === '1';
    }
    return {
      pTotal: allP.length,
      pStamped: stampedP.length,
      autoStampedCount: autoStampedP.length,
      fakeHeadingTotal: fakeHeadings.length,
      // (fakeHeadings ARE detected & explicitly NOT auto-stamped)
      fakeHeadingsUnstamped: fakeUnstamped.length,
      clickSelectsAuto: clickWorked
    };
  });
  // Every paragraph (minus genuine fake-headings) should now be stamped,
  // at least one auto-stamp must have fired, and the auto-stamp must
  // produce selectable elements.
  const ok = r.pStamped === (r.pTotal - r.fakeHeadingTotal)
    + (r.fakeHeadingTotal - r.fakeHeadingsUnstamped)
    && r.autoStampedCount >= 1
    && r.clickSelectsAuto === true;
  record('runtime_auto_stamp_missing_atoms', ok ? 'PASS' : 'FAIL',
    'stampMissingBodyAtoms fills gaps; auto-stamped paragraphs are clickable',
    JSON.stringify(r));
}

async function testAutoStampSkipsChromeAndFakeHeadings(page) {
  // The auto-stamper must NOT touch elements inside chrome regions
  // (banners, panels, code blocks, etc.) or fake-heading paragraphs.
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto('http://127.0.0.1:8767/all-techniques-sample.html?cb='
    + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const r = await page.evaluate(() => {
    function isInChrome(el) {
      return !!el.closest(
        'thead,tfoot,pre,code,aside,header,footer,figure,figcaption,'
        + '.ve-banner,.ve-report-banner,.ve-decision-mini,.ve-bulk-default,'
        + '.ve-scene-graph,.ve-finding-round,.ve-designmd-panel,'
        + '.ve-snippet-popup,.ve-modal,.ve-overlay,.ve-style-pad,'
        + '.ve-comment-handle,.ve-comment-modal,.ve-comment-pill,'
        + '#ve-designmd-panel'
      );
    }
    const stamped = Array.from(document.querySelectorAll(
      'p[data-ve-comment-id], li[data-ve-comment-id]'));
    const stampedInsideChrome = stamped.filter(isInChrome);
    return {
      stampedCount: stamped.length,
      stampedInsideChrome: stampedInsideChrome.length,
      chromeViolatorTags: stampedInsideChrome.slice(0, 5)
        .map(e => e.tagName + ' inside ' + (e.parentElement && e.parentElement.tagName))
    };
  });
  const ok = r.stampedInsideChrome === 0;
  record('runtime_auto_stamp_skips_chrome', ok ? 'PASS' : 'FAIL',
    'auto-stamp skips chrome regions (no data-ve-comment-id stamped inside)',
    JSON.stringify(r));
}

async function typeIntoFindingReply(page, findingId, text) {
  // Set value directly + dispatch `input` to trigger the runtime's
  // delegated debounced handler. Same shape as setDecisionToggle —
  // bypasses click-flakiness in the dev-browser sandbox by talking
  // straight to the listener the production code registers.
  const ok = await page.evaluate((args) => {
    const ta = document.querySelector(
      'textarea[data-ve-finding-reply][data-ve-finding-id="' + args.fid + '"]'
    );
    if (!ta) return false;
    ta.scrollIntoView({ block: 'center' });
    ta.focus();
    ta.value = args.text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, { fid: findingId, text });
  // The runtime debounces input events at 350ms before pushing into
  // veSelection. Wait a bit longer to be safe under sandbox jitter.
  await page.waitForTimeout(500);
  return ok;
}

async function testFindingReplyCarriesDecisionAtTypeTime(page) {
  // TRDD-4c300620 §6 — finding-reply entries in the submit payload
  // MUST carry the current 3-state decision (skip|approve|reject) so
  // the agent receiving the payload knows whether the user accepts /
  // rejects the finding alongside the reply text.
  //
  // Scenario: flip finding-1 to "approve" FIRST, then type a reply.
  // The push handler reads currentDecisionFor('ve-finding-1') at
  // type-time, so the entry must carry decision:"approve".
  await setup(page);
  const flipped = await setDecisionToggle(page, 'finding-1', 'approve');
  const typed = await typeIntoFindingReply(
    page, 'finding-1', 'looks good, accepting this one'
  );
  const sel = await page.evaluate(() => {
    return (window.veSelection || []).filter(
      (e) => e && e.kind === 'finding-reply'
    );
  });
  const entry = sel.find((e) => e.findingId === 'finding-1');
  const ok = flipped && typed && entry
    && entry.text === 'looks good, accepting this one'
    && entry.decision === 'approve';
  record(
    'finding_reply_carries_decision_type_time',
    ok ? 'PASS' : 'FAIL',
    'flip then type — finding-reply entry carries decision:"approve"',
    JSON.stringify({ flipped, typed, entry })
  );
}

async function testFindingReplyRefreshesDecisionAtSubmitTime(page) {
  // Scenario: type a reply FIRST (decision still default "skip"),
  // THEN flip finding-2 to "reject" WITHOUT re-typing. The veSelection
  // entry still carries the stale "skip" at this point — but the
  // submit-time refresh in buildSubmissionPayload() re-reads the
  // current decision and rewrites the entry. The test calls the
  // read-only payload-builder hook exposed by the runtime and
  // verifies the payload's finding-reply entry carries "reject".
  await setup(page);
  const typed = await typeIntoFindingReply(
    page, 'finding-2', 'this needs more work'
  );
  // Snapshot BEFORE the decision flip — entry should be "skip".
  const before = await page.evaluate(() => {
    const e = (window.veSelection || []).find(
      (x) => x && x.kind === 'finding-reply' && x.findingId === 'finding-2'
    );
    return e ? { text: e.text, decision: e.decision } : null;
  });
  const flipped = await setDecisionToggle(page, 'finding-2', 'reject');
  // Call the read-only payload-builder. The submit-time refresh re-reads
  // currentDecisionFor() for every finding-reply entry, mutating veSelection
  // in place and copying the fresh state into the payload's selections[].
  const payload = await page.evaluate(() => {
    if (!window.amvcpRuntime || !window.amvcpRuntime.buildSubmissionPayload) {
      return null;
    }
    return window.amvcpRuntime.buildSubmissionPayload();
  });
  const f2 = payload && payload.selections
    ? payload.selections.find(
        (s) => s.kind === 'finding-reply' && s.findingId === 'finding-2'
      )
    : null;
  const ok = typed && flipped && before
    && before.decision === 'skip'
    && f2 && f2.decision === 'reject' && f2.text === 'this needs more work';
  record(
    'finding_reply_refreshes_decision_submit_time',
    ok ? 'PASS' : 'FAIL',
    'type then flip — submit payload reflects fresh "reject" decision',
    JSON.stringify({ typed, flipped, before, payloadEntry: f2 })
  );
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testDecisionDefaultSkip,
  testDecisionChangesEmitTurn,
  testDecisionWithComment,
  testDecisionMutex,
  testDecisionSummaryPersisted,
  testFindingReplyCarriesDecisionAtTypeTime,
  testFindingReplyRefreshesDecisionAtSubmitTime,
  testAutoStampMissingParagraphAtoms,
  testAutoStampSkipsChromeAndFakeHeadings,
];

const page = await browser.getPage("decision-pill-tests");

try {
  for (const t of tests) {
    try {
      await t(page);
    } catch (e) {
      record(t.name || 'unnamed', 'ERROR', t.name || '', String(e && e.message || e).slice(0, 120));
    }
  }

  for (const r of results) {
    console.log(`TEST | ${r.name} | ${r.status} | ${r.desc} | ${r.detail.replace(/\|/g, '/')}`);
  }
} finally {
  await page.close();
}
