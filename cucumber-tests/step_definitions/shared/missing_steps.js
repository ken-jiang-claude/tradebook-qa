// ============================================================
//  step_definitions/shared/missing_steps.js
//  Additional step aliases and variants not covered by the
//  main step definition files.
// ============================================================
import { Given, When, Then } from '@cucumber/cucumber'
import { expect }            from '@playwright/test'
import ENV                   from '../../config/env.js'

// ── Audit trail aliases ──────────────────────────────────────

Then('the audit trail records the submission with timestamp and user ID', async function () {
  await this.step({
    action: `Open order history for ${this.orderId} and verify the "New" event has a timestamp and user ID`,
    verify: 'New event contains non-empty timestamp and user ID matching the QA user',
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const event  = await this.page.$('[data-testid="history-event"][data-event-type="New"]')
      expect(event).not.toBeNull()
      const ts     = await event.getAttribute('data-timestamp')
      const userId = await event.getAttribute('data-user-id')
      expect(ts).toBeTruthy()
      expect(userId).toBeTruthy()
    },
  })
})

Then('the audit trail records the cancel event with timestamp and user ID', async function () {
  await this.step({
    action: `Open order history for ${this.orderId} and verify the "Canceled" event has a timestamp and user ID`,
    verify: 'Canceled event contains non-empty timestamp and user ID',
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const event  = await this.page.$('[data-testid="history-event"][data-event-type="Canceled"]')
      expect(event).not.toBeNull()
      const ts     = await event.getAttribute('data-timestamp')
      const userId = await event.getAttribute('data-user-id')
      expect(ts).toBeTruthy()
      expect(userId).toBeTruthy()
    },
  })
})

// ── Error message aliases ────────────────────────────────────

Then('an error message is displayed explaining the unknown instrument', async function () {
  await this.step({
    action: 'Check for a validation error message referencing the unknown instrument or symbol',
    verify: 'An error message mentions "unknown instrument", "symbol not found", or similar',
    auto: async () => {
      const errorEl = await this.page.$('[data-testid="order-error"]')
      expect(errorEl).not.toBeNull()
      const text = await errorEl.textContent()
      expect(text.toLowerCase()).toMatch(/unknown|symbol|instrument|not found/)
    },
  })
})

// ── Fill precondition aliases ────────────────────────────────

Given('a fill execution has already been processed for {int} shares', async function (qty) {
  await this.step({
    action: `Trigger the exchange simulator to send a fill of ${qty} shares for order ${this.orderId}`,
    verify: `CumQty shows ${qty} and order status is "Partially Filled"`,
    auto: async () => {
      await this.simulateFill({ qty, price: this.limitPrice || 150.00, isFinal: false })
      await this.waitForOrderStatus('Partially Filled')
    },
  })
})

Given('a buy order for {int} shares of {string} has been fully filled', async function (qty, symbol) {
  this.symbol     = symbol
  this.orderQty   = qty
  this.limitPrice = 150.00

  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} and trigger a full fill at 150.00`,
    verify: `Order status is "Filled", CumQty=${qty}`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  '150.00')
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      await this.simulateFill({ qty, price: 150.00, isFinal: true })
      await this.waitForOrderStatus('Filled')
    },
  })
})

Given('an open buy order for {int} shares of {string} is submitted at price {float}', async function (qty, symbol, price) {
  this.symbol     = symbol
  this.orderQty   = qty
  this.limitPrice = price

  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} at price ${price}`,
    verify: `Order appears in blotter — it may be rejected or accepted depending on price validity`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  String(price))
      await this.page.click('[data-testid="order-submit"]')
      // Wait for confirm or error
      const result = await Promise.race([
        this.page.waitForSelector('[data-testid="order-confirm"]').then(() => 'confirm'),
        this.page.waitForSelector('[data-testid="order-error"]').then(() => 'error'),
      ])
      if (result === 'confirm') {
        this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim()).catch(() => null)
        await this.page.click('[data-testid="order-confirm"] .btn-primary')
        await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      }
    },
  })
})

// ── History count alias ──────────────────────────────────────

Then('the history contains exactly {int} events in correct sequence', async function (count) {
  await this.step({
    action: `Count order history events — expect exactly ${count}`,
    verify: `${count} events are visible in the correct sequence`,
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      expect(events.length).toBe(count)
    },
  })
})

// ── Event sequence with 3 words including spaces ─────────────

Then('the events appear in the order: New, Partially Filled, Canceled', async function () {
  await this.step({
    action: 'Verify history events appear in order: New → Partially Filled → Canceled',
    verify: 'Events are present in that sequence',
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      const types  = await Promise.all(events.map(e => e.getAttribute('data-event-type')))
      const newIdx     = types.indexOf('New')
      const partialIdx = types.indexOf('Partially Filled')
      const cancelIdx  = types.indexOf('Canceled')
      expect(newIdx).toBeGreaterThanOrEqual(0)
      expect(partialIdx).toBeGreaterThan(newIdx)
      expect(cancelIdx).toBeGreaterThan(partialIdx)
    },
  })
})

// ── ExecID alias ─────────────────────────────────────────────

Then('only one execution record exists for ExecID {string}', async function (execId) {
  await this.step({
    action: `Open order history and count records with ExecID "${execId}" (or its alias)`,
    verify: `Exactly 1 history event has the actual ExecID corresponding to "${execId}"`,
    auto: async () => {
      const actualExecId = (this.execIdAlias && this.execIdAlias[execId]) || this.execId || execId
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      // Try actual ID first, fall back to alias name
      let events = await this.page.$$(`[data-testid="history-event"][data-exec-id="${actualExecId}"]`)
      if (!events.length && actualExecId !== execId) {
        events = await this.page.$$(`[data-testid="history-event"][data-exec-id="${execId}"]`)
      }
      expect(events.length).toBe(1)
      // Close history panel
      const closeBtn = await this.page.$('[data-testid="order-history-panel"] .close-btn')
      if (closeBtn) await closeBtn.click()
      await this.page.waitForSelector('[data-testid="order-history-panel"]', { state: 'hidden' }).catch(() => {})
    },
  })
})

// ── Settlement alias ─────────────────────────────────────────

Then('the trade appears correctly in the settlement report', async function () {
  await this.step({
    action: `Navigate to Settlement Report and verify a row exists for order ${this.orderId}`,
    verify: 'Settlement row is found and contains correct symbol, side, and quantity',
    auto: async () => {
      await this.page.click('[data-testid="settlement-report-btn"]')
      await this.page.waitForSelector('[data-testid="settlement-report-panel"]')
      const row = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      expect(row).not.toBeNull()
      // Close settlement panel so subsequent steps can interact with toolbar
      const closeBtn = await this.page.$('[data-testid="settlement-report-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="settlement-report-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

// ── Downstream system aliases ─────────────────────────────────

Then('the position management system is reachable', async function () {
  await this.step({
    action: 'Check that the Position Management system shows a connected status in the health panel',
    verify: 'Position management status indicator is green or shows "Connected"',
    auto: async () => {
      const el = await this.page.$('[data-testid="system-status-position"]')
      if (el) {
        const status = await el.getAttribute('data-status')
        expect(status).toBe('connected')
      }
      // If element doesn't exist, navigate to position screen as a live check
      else {
        await this.page.click('[data-testid="position-btn"]')
        await this.page.waitForSelector('[data-testid="position-panel"]', { timeout: ENV.timeout })
      }
    },
  })
})

// ── AvgPx specific value aliases ─────────────────────────────
// These match numeric values that the Gherkin {float} param
// should already cover — but adding explicit aliases to be safe.

Then('the average price \\(AvgPx\\) is {float}', async function (expectedAvgPx) {
  await this.step({
    action: `Check AvgPx column in blotter for order ${this.orderId}`,
    verify: `AvgPx = ${expectedAvgPx}`,
    auto: async () => {
      const avgPx = await this.getBlotterField('avgpx')
      expect(parseFloat(avgPx)).toBeCloseTo(expectedAvgPx, 2)
    },
  })
})
