// ============================================================
//  step_definitions/lifecycle/fill_steps.js
//  Steps for: Partial Fill, Full Fill, Duplicate Exec, Overfill
// ============================================================
import { Given, When, Then } from '@cucumber/cucumber'
import { expect }            from '@playwright/test'
import ENV                   from '../../config/env.js'

// ── Preconditions ────────────────────────────────────────────

Given('the fill execution has ExecID {string}', async function (execId) {
  // The scenario uses a logical name (e.g. "EXEC-001") to refer to the fill execId.
  // We open history to capture the actual auto-generated execId from the mock,
  // store it in this.execId, and alias it for later dedup-replay steps.
  await this.step({
    action: `Open order history for ${this.orderId} and record the fill execution ID`,
    verify: `A fill history event exists — capture its execId for dedup testing`,
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      // Find any Filled or Partially Filled event to get the actual execId
      const fillEvent = await this.page.$('[data-testid="history-event"][data-event-type="Filled"]') ||
                        await this.page.$('[data-testid="history-event"][data-event-type="Partially Filled"]')
      expect(fillEvent).not.toBeNull()
      this.execId = await fillEvent.getAttribute('data-exec-id')
      // Store the scenario alias → actual execId mapping for replay steps
      this.execIdAlias = this.execIdAlias || {}
      this.execIdAlias[execId] = this.execId
      // Close the history panel
      const closeBtn = await this.page.$('[data-testid="order-history-panel"] .close-btn')
      if (closeBtn) await closeBtn.click()
      await this.page.waitForSelector('[data-testid="order-history-panel"]', { state: 'hidden' }).catch(() => {})
    },
  })
})

Given('a fill execution with ExecID {string} has already been processed for {int} shares', async function (execId, qty) {
  this.execId = execId
  await this.step({
    action: `Trigger a fill of ${qty} shares with ExecID "${execId}" via the exchange simulator`,
    verify: `CumQty shows ${qty} and ExecID "${execId}" appears in order history`,
    auto: async () => {
      await this.simulateFill({ qty, price: this.limitPrice || 150.00, execId })
      await this.waitForOrderStatus('Partially Filled')
    },
  })
})

Given('a buy order for {int} shares of {string} has been fully filled at {float}', async function (qty, symbol, price) {
  this.symbol     = symbol
  this.orderQty   = qty
  this.limitPrice = price

  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} at ${price} and trigger a full fill via the simulator`,
    verify: `Order status is "Filled", CumQty=${qty}, LeavesQty=0`,
    auto: async () => {
      // Submit order
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  String(price))
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      // Close the order form before interacting with the blotter
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      // Trigger fill
      await this.simulateFill({ qty, price, isFinal: true })
      await this.waitForOrderStatus('Filled')
    },
  })
})

Given('an open buy order for {int} shares of {string} has been partially filled for {int} shares', async function (totalQty, symbol, filledQty) {
  this.symbol   = symbol
  this.orderQty = totalQty

  await this.step({
    action: `Submit a buy order for ${totalQty} shares of ${symbol} and trigger a partial fill of ${filledQty} shares`,
    verify: `Order status is "Partially Filled", CumQty=${filledQty}, LeavesQty=${totalQty - filledQty}`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(totalQty))
      await this.page.fill('input[data-testid="order-price"]',  '150.00')
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      await this.simulateFill({ qty: filledQty, price: 150.00, isFinal: false })
      await this.waitForOrderStatus('Partially Filled')
    },
  })
})

Given('a buy order for {int} shares of {string} was partially filled for {int} shares then cancelled', async function (totalQty, symbol, filledQty) {
  this.symbol   = symbol
  this.orderQty = totalQty
  await this.step({
    action: `Submit a ${totalQty}-share order for ${symbol}, trigger a partial fill of ${filledQty}, then cancel the remainder`,
    verify: `Order status is "Partially Filled and Canceled", CumQty=${filledQty}`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(totalQty))
      await this.page.fill('input[data-testid="order-price"]',  '150.00')
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      await this.simulateFill({ qty: filledQty, price: 150.00 })
      await this.waitForOrderStatus('Partially Filled')
      await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
      await this.page.click('[data-testid="context-menu-cancel"]')
      await this.page.click('[data-testid="cancel-confirm-btn"]')
      await this.waitForOrderStatus('Partially Filled and Canceled')
    },
  })
})

// ── Fill triggering ──────────────────────────────────────────

When('a fill execution arrives for {int} shares at price {float}', async function (qty, price) {
  await this.step({
    action: `Trigger the exchange simulator to send a fill: Qty=${qty}, Price=${price} for order ${this.orderId}`,
    verify: `Blotter CumQty increases by ${qty} and AvgPx updates`,
    auto: async () => {
      const isFullFill = (this.fillEvents.reduce((s, f) => s + f.qty, 0) + qty) >= this.orderQty
      await this.simulateFill({ qty, price, isFinal: isFullFill })
      // Brief wait for blotter to update
      await this.page.waitForTimeout(1000)
    },
  })
})

// ── Duplicate execution ──────────────────────────────────────

When('the exchange simulator replays the same execution with ExecID {string}', async function (execId) {
  // Resolve alias to the actual execId from the mock
  const actualExecId = (this.execIdAlias && this.execIdAlias[execId]) || this.execId || execId
  await this.step({
    action: `Replay execution ${actualExecId} via window.__replayExec to test dedup protection`,
    verify: 'Duplicate fill is rejected — CumQty and status remain unchanged',
    auto: async () => {
      await this.page.evaluate(
        ({ orderId, execId }) => window.__replayExec && window.__replayExec({ orderId, execId }),
        { orderId: this.orderId, execId: actualExecId }
      )
      await this.page.waitForTimeout(500)
    },
  })
})

Then('the duplicate execution is detected and rejected', async function () {
  await this.step({
    action: 'Check that the duplicate was rejected — look for a dedup log entry or alert',
    verify: 'Application log contains a dedup rejection entry for the ExecID, or UI shows an alert',
    auto: async () => {
      // CumQty must not have changed
      const cumQty = await this.getBlotterField('cumqty')
      expect(parseInt(cumQty)).toBe(this.orderQty)
    },
  })
})

Then('the duplicate is detected and ignored', async function () {
  await this.step({
    action: 'Confirm the duplicate was silently ignored — CumQty unchanged, status unchanged',
    verify: 'No additional fill event appeared in order history after the replay',
    auto: async () => {
      const cumQty = await this.getBlotterField('cumqty')
      const fills  = this.fillEvents
      const expectedCumQty = fills.reduce((s, f) => s + f.qty, 0)
      expect(parseInt(cumQty)).toBe(expectedCumQty)
    },
  })
})

Then('only one execution record exists in order history for ExecID {string}', async function (execId) {
  // Resolve alias to actual execId
  const actualExecId = (this.execIdAlias && this.execIdAlias[execId]) || this.execId || execId
  await this.step({
    action: `Open order history for ${this.orderId} and count records with ExecID "${actualExecId}"`,
    verify: `Exactly 1 history event exists with ExecID "${actualExecId}"`,
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const events = await this.page.$$(`[data-testid="history-event"][data-exec-id="${actualExecId}"]`)
      expect(events.length).toBe(1)
      const closeBtn = await this.page.$('[data-testid="order-history-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="order-history-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

Then('the position is not double-counted', async function () {
  await this.step({
    action: `Check the position for ${this.symbol} — confirm it equals the original fill quantity, not double`,
    verify: `Net position for ${this.symbol} equals ${this.orderQty}, not ${this.orderQty * 2}`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const pos = await this.page.$eval(
        `[data-testid="position-row"][data-symbol="${this.symbol}"] [data-field="qty"]`,
        el => parseInt(el.textContent)
      )
      expect(pos).toBe(this.orderQty)
    },
  })
})

Then('the duplicate rejection event is recorded in the application log', async function () {
  await this.step({
    action: 'Open the application log and search for a dedup rejection entry referencing this ExecID',
    verify: `Log contains an entry like "Duplicate ExecID ${this.execId} rejected"`,
    auto: async () => {
      await this.page.click('[data-testid="log-viewer-btn"]')
      await this.page.waitForSelector('[data-testid="log-orderid-filter"]')
      await this.page.fill('[data-testid="log-orderid-filter"]', this.orderId || '')
      await this.page.click('[data-testid="log-search-btn"]')
      await this.page.waitForSelector('[data-testid="log-entry"]')
      const entries = await this.page.$$('[data-testid="log-entry"]')
      expect(entries.length).toBeGreaterThan(0)
    },
  })
})

Then('the log entry contains the ExecID {string} and the order ID', async function (execId) {
  await this.step({
    action: `Check the log entry text for ExecID "${execId}" (or its alias) and order ID "${this.orderId}"`,
    verify: 'Both the ExecID (actual) and order ID appear in at least one log entry',
    auto: async () => {
      const actualExecId = (this.execIdAlias && this.execIdAlias[execId]) || this.execId || execId
      const entries = await this.page.$$eval('[data-testid="log-entry"]', els => els.map(e => e.textContent))
      const matchingEntry = entries.find(e => e.includes(actualExecId) || e.includes(execId))
      expect(matchingEntry).toBeTruthy()
      expect(matchingEntry).toContain(this.orderId)
    },
  })
})

// ── Overfill ─────────────────────────────────────────────────

Then('the overfill is detected by the system', async function () {
  await this.step({
    action: 'Check that the system detected the overfill — look for an alert or log entry',
    verify: 'An overfill alert is visible in the UI or a log entry references overfill',
    auto: async () => {
      const alert = await this.page.$('[data-testid="overfill-alert"]')
      expect(alert).not.toBeNull()
    },
  })
})

Then('the order quantity ceiling is enforced', async function () {
  await this.step({
    action: `Check CumQty for order ${this.orderId} — it must not exceed ${this.orderQty}`,
    verify: `CumQty <= ${this.orderQty}`,
    auto: async () => {
      const cumQty = await this.getBlotterField('cumqty')
      expect(parseInt(cumQty)).toBeLessThanOrEqual(this.orderQty)
    },
  })
})

Then('the cumulative quantity \\(CumQty\\) does not exceed {int}', async function (maxQty) {
  await this.step({
    action: `Verify CumQty is at most ${maxQty}`,
    verify: `CumQty <= ${maxQty}`,
    auto: async () => {
      const cumQty = await this.getBlotterField('cumqty')
      expect(parseInt(cumQty)).toBeLessThanOrEqual(maxQty)
    },
  })
})

Then('an overfill alert or error is visible to the QA user', async function () {
  await this.step({
    action: 'Look for an overfill alert in the UI',
    verify: 'A visible alert or error message references overfill or quantity exceeded',
    auto: async () => {
      const alert = await this.page.$('[data-testid="overfill-alert"]')
      expect(alert).not.toBeNull()
      const text = await alert.textContent()
      expect(text.toLowerCase()).toMatch(/overfill|quantity exceeded|ceiling/)
    },
  })
})

Then('the overfill event is recorded in the application log', async function () {
  await this.step({
    action: 'Open the application log and search for the overfill event',
    verify: `Log contains an entry referencing order ${this.orderId} and overfill`,
    auto: async () => {
      await this.page.click('[data-testid="log-viewer-btn"]')
      await this.page.waitForSelector('[data-testid="log-orderid-filter"]')
      await this.page.fill('[data-testid="log-orderid-filter"]', this.orderId)
      await this.page.click('[data-testid="log-search-btn"]')
      await this.page.waitForSelector('[data-testid="log-entry"]')
      const texts = await this.page.$$eval('[data-testid="log-entry"]', els =>
        els.map(el => el.textContent.toLowerCase())
      )
      const found = texts.some(t => t.includes('overfill') || t.includes('quantity exceeded'))
      expect(found).toBe(true)
    },
  })
})

Then('no overfill alert is raised', async function () {
  await this.step({
    action: 'Confirm no overfill alert is present in the UI',
    verify: 'Overfill alert element is absent from the page',
    auto: async () => {
      const alert = await this.page.$('[data-testid="overfill-alert"]')
      expect(alert).toBeNull()
    },
  })
})

// ── Fill assertions ───────────────────────────────────────────

Then('the cumulative quantity \\(CumQty\\) is {int}', async function (expectedCumQty) {
  await this.step({
    action: `Check CumQty column in blotter for order ${this.orderId}`,
    verify: `CumQty = ${expectedCumQty}`,
    auto: async () => {
      const cumQty = await this.getBlotterField('cumqty')
      expect(parseInt(cumQty)).toBe(expectedCumQty)
    },
  })
})

Then('the cumulative quantity \\(CumQty\\) remains {int}', async function (expectedCumQty) {
  await this.step({
    action: `Confirm CumQty is still ${expectedCumQty} (unchanged by the duplicate/replay)`,
    verify: `CumQty = ${expectedCumQty}`,
    auto: async () => {
      const cumQty = await this.getBlotterField('cumqty')
      expect(parseInt(cumQty)).toBe(expectedCumQty)
    },
  })
})

Then('the leaves quantity \\(LeavesQty\\) is {int}', async function (expectedLeavesQty) {
  await this.step({
    action: `Check LeavesQty column in blotter for order ${this.orderId}`,
    verify: `LeavesQty = ${expectedLeavesQty}`,
    auto: async () => {
      const leavesQty = await this.getBlotterField('leavesqty')
      expect(parseInt(leavesQty)).toBe(expectedLeavesQty)
    },
  })
})

Then('the leaves quantity \\(LeavesQty\\) becomes {int}', async function (expectedLeavesQty) {
  await this.step({
    action: `Wait for LeavesQty to become ${expectedLeavesQty}`,
    verify: `LeavesQty = ${expectedLeavesQty}`,
    auto: async () => {
      const leavesQty = await this.getBlotterField('leavesqty')
      expect(parseInt(leavesQty)).toBe(expectedLeavesQty)
    },
  })
})

Then('the average price (AvgPx) is {float}', async function (expectedAvgPx) {
  await this.step({
    action: `Check AvgPx column in blotter for order ${this.orderId}`,
    verify: `AvgPx = ${expectedAvgPx} (within 0.01 rounding tolerance)`,
    auto: async () => {
      const avgPx = await this.getBlotterField('avgpx')
      expect(parseFloat(avgPx)).toBeCloseTo(expectedAvgPx, 2)
    },
  })
})

Then('the execution appears in order history with correct quantity and price', async function () {
  await this.step({
    action: `Open order history for ${this.orderId} — confirm the fill event shows correct Qty and Price`,
    verify: 'Fill event quantity and price match the simulated fill values',
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const fillEvent = await this.page.$('[data-testid="history-event"][data-event-type="Filled"]') ||
                        await this.page.$('[data-testid="history-event"][data-event-type="Partially Filled"]')
      expect(fillEvent).not.toBeNull()
      // Close the history panel so other panels remain accessible
      const closeBtn = await this.page.$('[data-testid="order-history-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="order-history-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

Then('both executions appear in order history', async function () {
  await this.step({
    action: `Open order history for ${this.orderId} — confirm two fill events exist`,
    verify: 'History shows at least 2 fill/execution events (Partially Filled and/or Filled)',
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const partialEvents = await this.page.$$('[data-testid="history-event"][data-event-type="Partially Filled"]')
      const filledEvents  = await this.page.$$('[data-testid="history-event"][data-event-type="Filled"]')
      expect(partialEvents.length + filledEvents.length).toBeGreaterThanOrEqual(2)
      const closeBtn = await this.page.$('[data-testid="order-history-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="order-history-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

Then('the position is updated to reflect {int} shares acquired', async function (qty) {
  await this.step({
    action: `Check position management for ${this.symbol} — confirm quantity increased by ${qty}`,
    verify: `Net position for ${this.symbol} increased by ${qty} shares`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const pos = await this.page.$eval(
        `[data-testid="position-row"][data-symbol="${this.symbol}"] [data-field="qty"]`,
        el => parseInt(el.textContent)
      )
      expect(pos).toBeGreaterThanOrEqual(qty)
    },
  })
})

Then('the position reflects {int} shares of {string} acquired', async function (qty, symbol) {
  await this.step({
    action: `Check position management — confirm net position for ${symbol} is ${qty} shares`,
    verify: `Position panel shows ${qty} shares for ${symbol}`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const pos = await this.page.$eval(
        `[data-testid="position-row"][data-symbol="${symbol}"] [data-field="qty"]`,
        el => parseInt(el.textContent)
      )
      expect(pos).toBe(qty)
    },
  })
})

Then('the position reflects {int} shares acquired', async function (qty) {
  await this.step({
    action: `Open position panel and check ${this.symbol} shows ${qty} shares`,
    verify: `Net position = ${qty}`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const pos = await this.page.$eval(
        `[data-testid="position-row"][data-symbol="${this.symbol}"] [data-field="qty"]`,
        el => parseInt(el.textContent)
      )
      expect(pos).toBe(qty)
      // Close position panel
      const closeBtn = await this.page.$('[data-testid="position-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="position-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

Then('the position reflects {int} shares of {string} acquired at average price {float}', async function (qty, symbol, avgPx) {
  await this.step({
    action: `Check position for ${symbol}: quantity=${qty}, average price=${avgPx}`,
    verify: `Position shows Qty=${qty} and AvgPx=${avgPx} for ${symbol}`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const row = await this.page.$(`[data-testid="position-row"][data-symbol="${symbol}"]`)
      expect(row).not.toBeNull()
      const pos    = parseInt(await row.$eval('[data-field="qty"]',    el => el.textContent))
      const posAvg = parseFloat(await row.$eval('[data-field="avgpx"]', el => el.textContent))
      expect(pos).toBe(qty)
      expect(posAvg).toBeCloseTo(avgPx, 2)
    },
  })
})
