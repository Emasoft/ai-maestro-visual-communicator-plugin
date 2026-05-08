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
  // section. The simplest deterministic anchor is the "The driver
  // attaches a comment to one of the table rows above." paragraph.
  const t = await page.evaluate(() => {
    const sec = document.querySelector('section[data-ve-finding-id="finding-3"]');
    if (!sec) return null;
    const p = sec.querySelector('p[data-ve-comment-id]');
    if (!p) return null;
    p.scrollIntoView({ block: 'center' });
    const r = p.getBoundingClientRect();
    return { px: r.x + 60, py: r.y + 8, cid: p.getAttribute('data-ve-comment-id') };
  });
  if (!t) {
    record('modal_decision_with_comment', 'FAIL', 'open modal in finding-3', 'anchor not found');
    return;
  }
  await page.mouse.move(t.px, t.py);
  await page.waitForTimeout(400);
  const pill = await page.evaluate(() => {
    const el = document.querySelector('.ve-comment-pill');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, opacity: el.style.opacity };
  });
  if (!pill || pill.opacity === '0') {
    record('modal_decision_with_comment', 'FAIL', 'open modal in finding-3', 'pill missing');
    return;
  }
  await page.mouse.move(pill.cx, pill.cy, { steps: 8 });
  await page.waitForTimeout(150);
  await page.mouse.down(); await page.mouse.up();
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

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testDecisionDefaultSkip,
  testDecisionChangesEmitTurn,
  testDecisionWithComment,
  testDecisionMutex,
];

const page = await browser.getPage("decision-pill-tests");

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
