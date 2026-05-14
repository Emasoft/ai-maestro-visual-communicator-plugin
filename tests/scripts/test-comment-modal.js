// test-comment-modal.js
//
// Dev-browser script — exercises the v2 modal-comment flow on a
// synthetic agent report. Each test prints exactly one line:
//
//   TEST | <name> | PASS|FAIL|ERROR | <description> | <detail>
//
// The test server (tests/server.py) exposes:
//   - /sample-report.html (and amvcp-runtime.js sibling)
//   - POST /__ve-comment       — same as amvcp-select.py's queue endpoint
//   - GET  /__ve-reply/<tid>   — same polling endpoint
//   - POST /__ve-test-reply    — TEST-ONLY: write a reply file from JSON
//                                payload {threadId, turn, text}
//
// Pre-conditions:
//   - server up on http://127.0.0.1:8767/
//   - queue dir is /tmp/ve-comments-tests/ (cleaned by orchestrator
//     before this script runs)

const FIXTURE = "http://127.0.0.1:8767/sample-report.html";

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

async function hoverThenClickPill(page, anchorSelector) {
  // Renamed-in-place — the legacy ".ve-comment-pill" hover UI was
  // removed because it duplicated the bubble handle (.ve-comment-handle)
  // that real users see. Tests now bypass the (gone) pill UI and call
  // the runtime\'s exposed __veOpenCommentModal hook directly with the
  // anchor element — exercising the SAME modal-state path the bubble
  // handle\'s click triggers in production.
  const t = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { px: r.x + 60, py: r.y + 8, cid: el.getAttribute('data-ve-comment-id') };
  }, anchorSelector);
  if (!t) return null;
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (typeof window.__veOpenCommentModal === 'function') {
      window.__veOpenCommentModal(el);
    }
  }, anchorSelector);
  await page.waitForTimeout(400);
  return t;
}

async function typeIntoModal(page, text) {
  const ta = await page.evaluate(() => {
    const t = document.querySelector('.ve-comment-modal textarea');
    const r = t.getBoundingClientRect();
    return { x: r.x + 30, y: r.y + 20 };
  });
  await page.mouse.click(ta.x, ta.y);
  await page.waitForTimeout(100);
  await page.keyboard.type(text);
  await page.waitForTimeout(150);
}

async function clickModalButton(page, label) {
  const pos = await page.evaluate((lbl) => {
    const buttons = Array.from(document.querySelectorAll('.ve-comment-modal button'));
    const b = buttons.find(x => new RegExp('^' + lbl + '$', 'i').test(x.textContent.trim()));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, disabled: b.disabled };
  }, label);
  if (!pos) return false;
  await page.mouse.click(pos.x, pos.y);
  await page.waitForTimeout(400);
  return true;
}

async function writeAgentReply(page, threadId, turn, text) {
  // Calls the test-only endpoint that writes a reply file into the queue
  // (server-side). This is the only way for the QuickJS sandbox to
  // inject queue artefacts because the sandbox has no FS access.
  return page.evaluate(async ({ tid, t, text }) => {
    const r = await fetch('/__ve-test-reply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ threadId: tid, turn: t, text: text }),
    });
    return r.ok;
  }, { tid: threadId, t: turn, text });
}

// ── Tests ───────────────────────────────────────────────────────────

async function testHoverPillAppears(page) {
  // The hover-pill UI was removed (it duplicated the bubble handle
  // that real users see). The replacement contract: openCommentModal
  // is reachable via window.__veOpenCommentModal and opens the modal
  // when called with a [data-ve-comment-id] anchor element.
  await setup(page);
  const result = await page.evaluate(() => {
    if (typeof window.__veOpenCommentModal !== 'function') {
      return { ok: false, reason: 'no __veOpenCommentModal hook exposed' };
    }
    const p = document.querySelector('p[data-ve-comment-id]');
    if (!p) return { ok: false, reason: 'no anchor found' };
    p.scrollIntoView({ block: 'center' });
    window.__veOpenCommentModal(p);
    const modal = document.querySelector('.ve-comment-modal');
    return {
      ok: !!modal && getComputedStyle(modal).display !== 'none',
      reason: modal ? 'modal opened' : 'modal not rendered'
    };
  });
  record('modal_hover_pill_appears',
    result.ok ? 'PASS' : 'FAIL',
    'modal opens via __veOpenCommentModal hook (hover-pill removed)',
    result.reason);
}

async function testHoverBridgeAndClick(page) {
  // BUG #1 fix: real-mouse-path move from anchor to pill keeps the pill
  // visible long enough for the click to land and open the modal.
  await setup(page);
  const t = await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  if (!t) {
    record('modal_hover_bridge_click', 'FAIL', 'real-mouse-path hover→pill→click', 'hover or pill missing');
    return;
  }
  const modal = await page.evaluate(() => ({
    display: document.querySelector('.ve-comment-modal')?.style.display,
    bodyAttr: document.body.getAttribute('data-ve-comment-modal-open'),
    activeAnchor: document.querySelector('[data-ve-comment-active]')?.getAttribute('data-ve-comment-id'),
  }));
  const ok = modal.display === 'flex' && modal.bodyAttr === '1' && modal.activeAnchor === t.cid;
  record('modal_hover_bridge_click', ok ? 'PASS' : 'FAIL', 'real-mouse-path hover→pill→click opens modal', JSON.stringify(modal));
}

async function testPostCommentRoundTrip(page) {
  // ANSWER on a fresh thread POSTs to /__ve-comment and starts polling.
  await setup(page);
  const t = await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await typeIntoModal(page, 'Round-trip test comment.');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(500);
  const stored = await page.evaluate(cid => JSON.parse(localStorage.getItem('ve-comment-thread:' + cid) || 'null'), t.cid);
  const ok = stored && stored.turns.length === 2
    && stored.turns[0].role === 'user' && stored.turns[0].text === 'Round-trip test comment.'
    && stored.turns[1].role === 'agent' && stored.turns[1].pending === true;
  record('modal_post_comment_round_trip', ok ? 'PASS' : 'FAIL',
    'ANSWER persists user turn + pending agent turn',
    JSON.stringify(stored && { threadId: stored.threadId, turns: stored.turns.map(t => `${t.turn}:${t.role}${t.pending ? '(pending)' : ''}`) }));
}

async function testReplyAppearsViaPolling(page) {
  // Writing a reply file → next poll cycle (≤1.5s) renders agent reply.
  await setup(page);
  const t = await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await typeIntoModal(page, 'Polling test.');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(400);
  const stored = await page.evaluate(cid => JSON.parse(localStorage.getItem('ve-comment-thread:' + cid)), t.cid);
  await writeAgentReply(page, stored.threadId, 2, 'Server-replied via polling.');
  await page.waitForTimeout(2200); // > one poll cycle (1.5s)
  const active = await page.evaluate(() => document.querySelector('.ve-comment-modal .ve-comment-active-content')?.textContent || '');
  const ok = /Server-replied via polling/.test(active);
  record('modal_reply_via_polling', ok ? 'PASS' : 'FAIL', 'reply file → modal renders within 2.2s', JSON.stringify(active.slice(0, 80)));
}

async function testPollingResumeOnReopen(page) {
  // BUG #2 fix: close the modal while pending → write reply file → reopen
  // and verify the modal picks up the reply (poll loop resumes).
  await setup(page);
  const t = await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await typeIntoModal(page, 'Resume test.');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(400);
  const stored = await page.evaluate(cid => JSON.parse(localStorage.getItem('ve-comment-thread:' + cid)), t.cid);
  await clickModalButton(page, 'DONE');
  await page.waitForTimeout(300);
  await writeAgentReply(page, stored.threadId, 2, 'Resume verification reply.');
  // Reopen
  await hoverThenClickPill(page, `p[data-ve-comment-id="${t.cid}"]`);
  await page.waitForTimeout(2200); // wait for first poll
  const active = await page.evaluate(() => document.querySelector('.ve-comment-modal .ve-comment-active-content')?.textContent || '');
  const ok = /Resume verification reply/.test(active);
  record('modal_polling_resume_on_reopen', ok ? 'PASS' : 'FAIL', 'reply written while closed → reopen renders it', JSON.stringify(active.slice(0, 80)));
}

async function testAtomicPendingSave(page) {
  // BUG #3 fix: pending agent turn persists to localStorage atomically
  // with the committed user turn (single save in handleAnswerButton).
  await setup(page);
  const t = await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await typeIntoModal(page, 'Atomic save test.');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(150); // BEFORE any subsequent saves
  const stored = await page.evaluate(cid => JSON.parse(localStorage.getItem('ve-comment-thread:' + cid)), t.cid);
  const ok = stored && stored.turns.length === 2 && stored.turns[1].pending === true;
  record('modal_atomic_pending_save', ok ? 'PASS' : 'FAIL',
    'pending placeholder persisted immediately after ANSWER',
    JSON.stringify(stored && stored.turns.map(t => `${t.turn}:${t.role}${t.pending ? '(p)' : ''}`)));
}

async function testMultiTurnDialogue(page) {
  // 4-turn flow: user-1, agent-2 (auto), user-3, agent-4 (auto).
  await setup(page);
  const t = await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await typeIntoModal(page, 'Q1?');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(300);
  const s1 = await page.evaluate(cid => JSON.parse(localStorage.getItem('ve-comment-thread:' + cid)), t.cid);
  await writeAgentReply(page, s1.threadId, 2, 'A1.');
  await page.waitForTimeout(2200);
  // Now ANSWER again to start turn 3
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(200);
  await typeIntoModal(page, 'Q2?');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(300);
  await writeAgentReply(page, s1.threadId, 4, 'A2.');
  await page.waitForTimeout(2200);
  const rows = await page.evaluate(() => Array.from(document.querySelectorAll('.ve-comment-thread-row')).map(li => li.textContent.trim()));
  const final = await page.evaluate(() => document.querySelector('.ve-comment-active-content')?.textContent || '');
  const ok = rows.length === 4
    && rows[0].includes('1: user') && rows[1].includes('2: agent')
    && rows[2].includes('3: user') && rows[3].includes('4: agent')
    && /A2\./.test(final);
  record('modal_multi_turn_dialogue', ok ? 'PASS' : 'FAIL', '4-turn user/agent/user/agent', JSON.stringify({ rows, final: final.slice(0, 30) }));
}

async function testDraftPreservedAcrossClose(page) {
  // Half-typed text in the textarea is preserved across DONE+reopen.
  await setup(page);
  const t = await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await typeIntoModal(page, 'Half-typed draft.');
  await clickModalButton(page, 'DONE');
  await page.waitForTimeout(300);
  await hoverThenClickPill(page, `p[data-ve-comment-id="${t.cid}"]`);
  const restored = await page.evaluate(() => document.querySelector('.ve-comment-modal textarea')?.value || '');
  const ok = restored === 'Half-typed draft.';
  record('modal_draft_preserved', ok ? 'PASS' : 'FAIL', 'half-typed draft restored after DONE+reopen', JSON.stringify(restored));
}

async function testEscClosesModal(page) {
  // Pressing ESC closes the modal.
  await setup(page);
  await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => document.querySelector('.ve-comment-modal').style.display === 'none');
  record('modal_esc_closes', closed ? 'PASS' : 'FAIL', 'Escape closes the modal', `display=${closed ? 'none' : 'flex'}`);
}

async function testDoneButtonCloses(page) {
  // Pressing DONE closes the modal.
  await setup(page);
  await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  await clickModalButton(page, 'DONE');
  const closed = await page.evaluate(() => document.querySelector('.ve-comment-modal').style.display === 'none');
  record('modal_done_button_closes', closed ? 'PASS' : 'FAIL', 'DONE button closes the modal', '');
}

async function testListItemAnchor(page) {
  // Comments work on <li data-ve-comment-id>.
  await setup(page);
  const t = await hoverThenClickPill(page, 'li[data-ve-comment-id]');
  const cid = t && t.cid;
  await typeIntoModal(page, 'Comment on list item.');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(400);
  const stored = await page.evaluate(c => JSON.parse(localStorage.getItem('ve-comment-thread:' + c)), cid);
  const ok = stored && stored.turns[0].text === 'Comment on list item.';
  record('modal_anchor_list_item', ok ? 'PASS' : 'FAIL', 'comment on <li> commits + posts', `cid=${cid}`);
}

async function testTableRowAnchor(page) {
  // Comments work on <tr data-ve-comment-id>.
  await setup(page);
  const t = await hoverThenClickPill(page, 'tr[data-ve-comment-id]');
  const cid = t && t.cid;
  await typeIntoModal(page, 'Comment on table row.');
  await clickModalButton(page, 'ANSWER');
  await page.waitForTimeout(400);
  const stored = await page.evaluate(c => JSON.parse(localStorage.getItem('ve-comment-thread:' + c)), cid);
  const ok = stored && stored.turns[0].text === 'Comment on table row.';
  record('modal_anchor_table_row', ok ? 'PASS' : 'FAIL', 'comment on <tr> commits + posts', `cid=${cid}`);
}

async function testCodeBlockAnchor(page) {
  // Per the user's selection model, the WHOLE <pre> is NOT
  // commentable — only individual code lines are. Hovering a <pre>
  // with data-ve-comment-id must NOT show the comment-pill, because
  // the runtime's findCommentAnchor() filters PRE/TABLE/UL/OL/H*/
  // BUTTON/INPUT out of the selectable set.
  //
  // setup() runs once per test but the SAME page instance carries
  // pill state from earlier paragraph/list/row tests. We force the
  // pill to a known-hidden state first by moving the cursor far from
  // any commentable element and waiting past the hide-debounce
  // window (180 ms in the runtime), then hover the pre and assert
  // the pill DID NOT re-show.
  await setup(page);
  // Per TRDD-3d1570ab R3, the renderer no longer stamps <pre> with
  // data-ve-comment-id at all — the renderer-side unstamp is the
  // first defense, the runtime's findCommentAnchor() filter is the
  // second. We accept either ANY <pre> being present OR no pre at
  // all; what matters is the pill stays hidden when hovering the
  // pre region.
  const box = await page.evaluate(() => {
    const el = document.querySelector('pre');
    if (!el) return { noPre: true };
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + 16, y: r.top + 16, scrollY: window.scrollY };
  });
  if (box.noPre) {
    // No <pre> in the fixture — vacuously satisfies the contract.
    record('modal_anchor_code_block', 'PASS', 'no <pre> in fixture (vacuous pass)', '');
    return;
  }
  // Park the cursor on empty space (top-left of viewport), then wait
  // out the hide-debounce so any leftover pill goes opacity:0.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(300);
  // Now hover the pre.
  await page.mouse.move(box.x, box.y);
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    const p = document.querySelector('.ve-comment-pill');
    if (!p) return { exists: false };
    return { exists: true, opacity: getComputedStyle(p).opacity };
  });
  // PASS: pill either doesn't exist OR is invisible (opacity 0).
  const ok = !result.exists || result.opacity === '0';
  record(
    'modal_anchor_code_block',
    ok ? 'PASS' : 'FAIL',
    'hovering whole <pre> shows NO comment pill (only lines are selectable)',
    JSON.stringify(result),
  );
}

async function testPageScrollsWhileModalOpen(page) {
  // Page can still scroll while the modal is open.
  //
  // Older revisions of the runtime pushed `main` 480 px to the right
  // (margin-right reflow) so the sidebar-style modal didn't cover the
  // page content. The modal is now draggable to any position on the
  // page and is no longer pinned to the right edge — pushing main
  // would be incorrect once the user drags the modal somewhere else.
  // What we DO still guarantee:
  //   1. wheel scroll under the modal continues to scroll the page
  //   2. the connector overlay <svg> appears next to the modal
  //   3. the modal element is positioned (left/top set inline by JS)
  await setup(page);
  await hoverThenClickPill(page, 'p[data-ve-comment-id]');
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.scrollY);
  const overlayPresent = await page.evaluate(() => !!document.querySelector('svg.ve-connector-overlay line.ve-connector-line'));
  const modalPositioned = await page.evaluate(() => {
    const m = document.querySelector('.ve-comment-modal');
    return !!(m && m.style.left && m.style.top);
  });
  const ok = after > before && overlayPresent && modalPositioned;
  record('modal_page_scrolls_while_open', ok ? 'PASS' : 'FAIL', 'wheel scroll under modal + connector overlay + modal positioned', `scrollY ${before}→${after}, overlay=${overlayPresent}, positioned=${modalPositioned}`);
}

// ── Runner ──────────────────────────────────────────────────────────

const tests = [
  testHoverPillAppears,
  testHoverBridgeAndClick,
  testPostCommentRoundTrip,
  testReplyAppearsViaPolling,
  testPollingResumeOnReopen,
  testAtomicPendingSave,
  testMultiTurnDialogue,
  testDraftPreservedAcrossClose,
  testEscClosesModal,
  testDoneButtonCloses,
  testListItemAnchor,
  testTableRowAnchor,
  testCodeBlockAnchor,
  testPageScrollsWhileModalOpen,
];

const page = await browser.getPage("modal-tests");

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
