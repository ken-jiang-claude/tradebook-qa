// ============================================================
//  step_definitions/edge_cases/edge_case_steps.js
//
//  Step definitions for @known-issue edge case scenarios.
//  These steps deliberately throw descriptive errors to
//  demonstrate what is NOT yet supported in the mock
//  environment and why.
// ============================================================
import { Given, When, Then } from '@cucumber/cucumber'

// ── Helper: throw a documented "not supported" error ────────
function notSupported(reason, fixNeeded) {
  throw new Error(
    `[KNOWN ISSUE] ${reason}\n` +
    `Fix needed: ${fixNeeded}`
  )
}

// ── Shared setup steps (edge case context) ───────────────────

Given('the QA user is logged in', async function () {
  await this.page.goto(`${this.env.baseUrl}`)
  await this.page.fill('input[data-testid="username-input"]', this.env.username)
  await this.page.fill('input[data-testid="password-input"]', this.env.password)
  await this.page.click('[data-testid="login-submit"]')
  await this.page.waitForURL('**/blotter')
})

Given('a buy order for {int} shares of {word} at {float} has been submitted', async function (qty, symbol, price) {
  // Open the order form and submit
  await this.page.click('[data-testid="new-order-btn"]')
  await this.page.fill('input[data-testid="order-symbol"]', symbol)
  await this.page.fill('input[data-testid="order-qty"]', String(qty))
  await this.page.fill('input[data-testid="order-price"]', String(price))
  await this.page.click('[data-testid="order-submit"]')
  const result = await Promise.race([
    this.page.waitForSelector('[data-testid="order-confirm"]').then(() => 'confirm'),
    this.page.waitForSelector('[data-testid="order-error"]').then(() => 'error'),
  ])
  if (result === 'confirm') {
    this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
    await this.page.click('[data-testid="order-confirm"] .btn-primary')
  }
})

Then('the order should be blocked or rejected with a connectivity error', async function () {
  notSupported(
    'Mock has no connectivity layer — orders are always accepted regardless of session state.',
    'Session state guard at order submission that checks FIX session status before routing.'
  )
})

Then('the session monitor should show {string}', async function (status) {
  notSupported(
    `Cannot force session monitor to show "${status}" — mock session is always shown as connected.`,
    'Dynamic session status driven by real FIX engine state.'
  )
})

// ── Session & Connectivity ───────────────────────────────────

Given('the FIX session is forcibly disconnected', async function () {
  notSupported(
    'Mock has no real FIX session — session state cannot be controlled programmatically.',
    'Integrate a FIX engine (e.g. QuickFIX/J) with controllable session state via admin API.'
  )
})

When('the FIX session drops immediately after order submission', async function () {
  notSupported(
    'Mock processes orders synchronously in-memory. Mid-flight disconnect cannot be simulated.',
    'Async order pipeline with durable message queue (e.g. RabbitMQ) and reconnect/replay logic.'
  )
})

When('the session reconnects after {int} seconds', async function (seconds) {
  notSupported(
    'No session reconnect mechanism exists in the mock environment.',
    'FIX session recovery with configurable reconnect delay and state reconciliation.'
  )
})

Then('the order state should be consistent — not duplicated or lost', async function () {
  notSupported(
    'Cannot verify order state consistency across a session drop without async message processing.',
    'Idempotent order processing with message deduplication on reconnect.'
  )
})

Then('the audit trail should show the disconnect and reconnect events', async function () {
  notSupported(
    'Mock log does not capture FIX session-level events (disconnect/reconnect).',
    'FIX session event hooks that write to the application audit log.'
  )
})

Given('order {string} has been acknowledged', async function (orderId) {
  // This step can partially run — log that the order ID was noted
  this.orderId = orderId
  await this.attach(`Noted order ID: ${orderId} — proceeding to replay step`, 'text/plain')
})

When('the same acknowledgment message is replayed after reconnect', async function () {
  notSupported(
    'Mock has no FIX sequence number management or message replay deduplication.',
    'FIX sequence gap detection, resend request handling, and exec ID deduplication at session layer.'
  )
})

Then('the duplicate message should be detected and ignored', async function () {
  notSupported(
    'Duplicate detection at the session level is not implemented in the mock.',
    'Persistent exec ID store checked on every inbound execution report.'
  )
})

Then('the order should remain in its current state without duplication', async function () {
  notSupported(
    'Cannot verify post-replay state without session-level dedup.',
    'Same as above — exec ID deduplication store.'
  )
})

// ── Race Conditions ──────────────────────────────────────────

When('a cancel request is sent simultaneously with a fill for {int} shares', async function (qty) {
  notSupported(
    `Mock processes state changes synchronously — a true race condition between cancel and fill (${qty} shares) cannot be reproduced.`,
    'Async event bus with configurable message ordering and delay injection for race condition simulation.'
  )
})

Then('the final state should be either {string} or {string} — never both', async function (state1, state2) {
  notSupported(
    `Cannot verify race condition outcome (${state1} vs ${state2}) without async message processing.`,
    'State machine with atomic transitions and conflict resolution for concurrent events.'
  )
})

Then('the audit trail should reflect the actual event sequence', async function () {
  notSupported(
    'Audit trail does not capture event arrival timestamps at the message level.',
    'Timestamped event sourcing with message-level ordering metadata.'
  )
})

When('a modify request is sent to change quantity to {int} shares', async function (qty) {
  notSupported(
    `Mock does not enforce post-fill state immutability at the message routing layer for qty=${qty}.`,
    'State machine guard at message ingestion point rejecting modifies on terminal-state orders.'
  )
})

Then('the modify should be rejected with reason {string}', async function (reason) {
  notSupported(
    `Expected rejection reason "${reason}" — but modify routing layer is not implemented.`,
    'Message-level validation returning structured reject reason before state machine processes the event.'
  )
})

// ── Multi-User ───────────────────────────────────────────────

Given('user {string} has an open order for {int} shares of {word} at {float}', async function (user, qty, symbol, price) {
  notSupported(
    `Mock is single-session only. Cannot create orders for user "${user}" (${qty} ${symbol} @ ${price}) in a separate session.`,
    'Shared backend store (Node.js server + WebSocket) so multiple browser sessions share state.'
  )
})

Given('user {string} is viewing the same order', async function (user) {
  notSupported(
    `Cannot open a second browser session for user "${user}" in the current single-session mock.`,
    'Multi-context Playwright test with a shared server-side state store.'
  )
})

When('{string} modifies the quantity to {int} shares', async function (user, qty) {
  notSupported(
    `Cannot perform concurrent modifications as user "${user}" (qty=${qty}) — single session only.`,
    'Concurrent Playwright contexts with shared backend to simulate true multi-user contention.'
  )
})

When('{string} simultaneously modifies the price to {float}', async function (user, price) {
  notSupported(
    `Simultaneous modification by "${user}" at price ${price} requires a second active browser session.`,
    'Parallel Playwright workers with shared server state and optimistic concurrency control.'
  )
})

Then('only one modification should be accepted', async function () {
  notSupported(
    'Cannot verify conflict resolution without concurrent sessions and a shared backend.',
    'Optimistic locking (e.g. order version field) — reject second modifier with a stale-state error.'
  )
})

Then('both users should see the same final order state', async function () {
  notSupported(
    'Cannot assert cross-session state consistency in single-session mock.',
    'WebSocket push from server to all subscribed clients on order state change.'
  )
})

Given('a read-only user {string} is logged in', async function (user) {
  notSupported(
    `Mock grants all permissions to any logged-in user. Cannot log in as restricted user "${user}".`,
    'Role-based entitlement model with per-user permission map enforced at login and action level.'
  )
})

When('{string} attempts to submit a new order', async function (user) {
  notSupported(
    `No entitlement check exists — "${user}" would be able to submit despite being read-only.`,
    'Entitlement middleware checking user role before processing any order action.'
  )
})

Then('the NEW ORDER button should be disabled or hidden', async function () {
  notSupported(
    'NEW ORDER button is always enabled regardless of user role in the current mock.',
    'Conditional rendering based on user entitlement loaded from session context.'
  )
})

Then('any direct API call to submit should return {string}', async function (response) {
  notSupported(
    `Expected API response "${response}" — no permission enforcement layer exists in mock.`,
    'Server-side authorization middleware returning 403 with structured error for unauthorized actions.'
  )
})

// ── Batch & Timing ───────────────────────────────────────────

Given('a trade was executed at {int}:{int} ET after market close', async function (hour, minute) {
  notSupported(
    `Mock has no concept of market hours or trade timestamps (${hour}:${String(minute).padStart(2,'0')} ET).`,
    'Time-aware order processing with configurable market session windows and trade timestamp enforcement.'
  )
})

When('the end-of-day settlement batch runs at {int}:{int} ET', async function (hour, minute) {
  notSupported(
    `Mock generates settlement data on demand with no batch cutoff (expected cutoff: ${hour}:${String(minute).padStart(2,'0')} ET).`,
    'Scheduled batch processor with configurable EOD cutoff time and trade inclusion window.'
  )
})

Then('the late trade should NOT appear in today\'s settlement report', async function () {
  notSupported(
    'Mock settlement report includes all trades regardless of execution time.',
    'Cutoff-aware settlement batch that filters trades by execution timestamp vs cutoff.'
  )
})

Then('it should appear in the next business day\'s report', async function () {
  notSupported(
    'Mock has no multi-day settlement cycle — all trades are in a single in-memory list.',
    'Date-partitioned settlement store with business calendar for next-day rollover.'
  )
})

Given('a trade has been executed but settlement batch has not completed', async function () {
  notSupported(
    'Mock has no processing order dependency between settlement and RHUB.',
    'Event-driven pipeline with a settlement-complete signal gating RHUB processing.'
  )
})

When('RHUB processing runs before settlement finalizes', async function () {
  notSupported(
    'Mock RHUB and settlement operate independently with no dependency enforcement.',
    'Dependency graph with explicit wait-for-settlement before RHUB ingestion begins.'
  )
})

Then('RHUB should either wait or surface an {string} warning', async function (warning) {
  notSupported(
    `Expected RHUB to surface "${warning}" — but mock shows "Completed" regardless of settlement state.`,
    'RHUB status driven by settlement pipeline state, not hardcoded.'
  )
})

Then('the reconciliation status should not show {string} prematurely', async function (status) {
  notSupported(
    `RHUB currently shows "${status}" at all times regardless of upstream processing state.`,
    'Dynamic RHUB status derived from settlement pipeline completion event.'
  )
})
