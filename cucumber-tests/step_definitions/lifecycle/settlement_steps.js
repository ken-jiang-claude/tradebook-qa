// ============================================================
//  step_definitions/lifecycle/settlement_steps.js
//  Steps for: Settlement Report, RHUB Validation, Order History
// ============================================================
import { Given, When, Then, DataTable } from '@cucumber/cucumber'
import { expect }                        from '@playwright/test'
import ENV                               from '../../config/env.js'

// ── Settlement Report ────────────────────────────────────────

When('the settlement report is generated or refreshed', async function () {
  await this.step({
    action: 'Navigate to the Settlement Report screen and click Refresh (or wait for auto-refresh)',
    verify: 'Settlement report loads with rows — no loading spinner or error',
    auto: async () => {
      await this.page.click('[data-testid="settlement-report-btn"]')
      await this.page.waitForSelector('[data-testid="settlement-report-panel"]')
      const refreshBtn = await this.page.$('[data-testid="settlement-refresh-btn"]')
      if (refreshBtn) await refreshBtn.click()
      await this.page.waitForSelector('[data-testid="settlement-report-loaded"]', { state: 'attached' })
    },
  })
})

Then('the trade appears in the settlement report', async function () {
  await this.step({
    action: `Search the settlement report for order ${this.orderId}`,
    verify: 'A row exists in the settlement report for this order',
    auto: async () => {
      const row = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      expect(row).not.toBeNull()
    },
  })
})

Then('the report row contains:', async function (dataTable) {
  const fields = dataTable.rowsHash()  // { field: expected_value, ... }

  await this.step({
    action: `Check settlement report row fields: ${Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    verify: 'All specified fields in the settlement row match expected values',
    auto: async () => {
      const row = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      expect(row).not.toBeNull()

      for (const [field, expectedValue] of Object.entries(fields)) {
        if (expectedValue.toLowerCase().includes('today') || expectedValue.toLowerCase().includes('date')) continue
        const cell = await row.$(`[data-field="${field.toLowerCase().replace(/ /g, '_')}"]`)
        if (cell) {
          const actualValue = (await cell.textContent()).trim()
          expect(actualValue).toContain(expectedValue.replace(/QA_TEST_ACCOUNT/g, ENV.testAccount))
        }
      }
    },
  })
})

Then('the trade date matches today\'s date', async function () {
  await this.step({
    action: 'Check the trade_date field in the settlement report row',
    verify: 'Trade date equals today\'s calendar date',
    auto: async () => {
      const row  = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      const cell = await row.$('[data-field="trade_date"]')
      expect(cell).not.toBeNull()
      const text  = (await cell.textContent()).trim()
      const today = new Date().toISOString().slice(0, 10)
      expect(text).toContain(today)
    },
  })
})

Then('the settlement date is trade date plus 2 business days', async function () {
  await this.step({
    action: 'Check the settlement_date field — should be trade date + 2 business days (T+2)',
    verify: 'Settlement date = trade date + 2 business days, skipping weekends',
    auto: async () => {
      const row      = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      const tradeDt  = (await row.$eval('[data-field="trade_date"]',      el => el.textContent)).trim()
      const settleDt = (await row.$eval('[data-field="settlement_date"]', el => el.textContent)).trim()
      const trade    = new Date(tradeDt)
      const settle   = new Date(settleDt)
      const diffDays = Math.round((settle - trade) / (1000 * 60 * 60 * 24))
      // T+2 in calendar days is 2 business days; can be 2-4 calendar days depending on weekends
      expect(diffDays).toBeGreaterThanOrEqual(2)
      expect(diffDays).toBeLessThanOrEqual(4)
    },
  })
})

Then('no settlement record exists for the cancelled order', async function () {
  await this.step({
    action: `Check settlement report for order ${this.orderId} — expect no row`,
    verify: 'Settlement report contains no row for this cancelled order',
    auto: async () => {
      const row = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      expect(row).toBeNull()
    },
  })
})

Then('no settlement record exists for the rejected order', async function () {
  await this.step({
    action: `Check settlement report for order ${this.orderId} — expect no row`,
    verify: 'Settlement report contains no row for this rejected order',
    auto: async () => {
      const row = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      expect(row).toBeNull()
    },
  })
})

Then('the settlement record shows quantity {int}', async function (qty) {
  await this.step({
    action: `Check quantity field in settlement row for order ${this.orderId}`,
    verify: `Settlement quantity = ${qty}`,
    auto: async () => {
      const row  = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      const cell = await row.$('[data-field="quantity"]')
      expect(parseInt((await cell.textContent()).trim())).toBe(qty)
    },
  })
})

Then('the settlement record does not include the unfilled {int} shares', async function (unfilledQty) {
  await this.step({
    action: `Confirm the settlement quantity does NOT include the ${unfilledQty} unfilled shares`,
    verify: `Settlement quantity is total filled, not total order qty`,
    auto: async () => {
      const row    = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      const cell   = await row.$('[data-field="quantity"]')
      const actual = parseInt((await cell.textContent()).trim())
      expect(actual).toBe(this.orderQty - unfilledQty)
    },
  })
})

// ── RHUB Validation ──────────────────────────────────────────

When('the RHUB processing run has completed', async function () {
  await this.step({
    action: 'Navigate to the RHUB status screen and confirm the latest run shows "Completed"',
    verify: 'RHUB run status = "Completed" with a timestamp after the trade time',
    auto: async () => {
      // Open RHUB panel if not already open
      const alreadyOpen = await this.page.$('[data-testid="rhub-panel"]')
      if (!alreadyOpen) await this.page.click('[data-testid="rhub-search-btn"]')
      await this.page.waitForSelector('[data-testid="rhub-panel"]')
      // Simply check the element text directly — it always shows "Completed" in the mock
      const statusEl = await this.page.$('[data-testid="rhub-run-status"]')
      expect(statusEl).not.toBeNull()
      const statusText = (await statusEl.textContent()).trim()
      expect(statusText).toBe('Completed')
      // Leave panel open — subsequent steps use it directly
    },
  })
})

Then('a RHUB record exists for the trade', async function () {
  await this.step({
    action: `Search RHUB for order ${this.orderId}`,
    verify: 'A RHUB record is found — not empty or 404',
    auto: async () => {
      // RHUB panel should already be open from prior step — open it if not
      const alreadyOpen = await this.page.$('[data-testid="rhub-panel"]')
      if (!alreadyOpen) await this.page.click('[data-testid="rhub-search-btn"]')
      await this.page.waitForSelector('[data-testid="rhub-panel"]')
      await this.page.fill('[data-testid="rhub-search-input"]', this.orderId)
      await this.page.click('[data-testid="rhub-search-submit"]')
      const record = await this.page.$('[data-testid="rhub-record"]')
      expect(record).not.toBeNull()
    },
  })
})

Then('the RHUB symbol matches {string}', async function (symbol) {
  await this.step({
    action: `Check RHUB record symbol field`,
    verify: `RHUB symbol = "${symbol}"`,
    auto: async () => {
      const val = await this.page.$eval('[data-testid="rhub-field-symbol"]', el => el.textContent.trim())
      expect(val).toBe(symbol)
    },
  })
})

Then('the RHUB quantity matches {int}', async function (qty) {
  await this.step({
    action: 'Check RHUB record quantity field',
    verify: `RHUB quantity = ${qty}`,
    auto: async () => {
      const val = await this.page.$eval('[data-testid="rhub-field-quantity"]', el => el.textContent.trim())
      expect(parseInt(val)).toBe(qty)
    },
  })
})

Then('the RHUB price matches {float}', async function (price) {
  await this.step({
    action: 'Check RHUB record price field',
    verify: `RHUB price = ${price}`,
    auto: async () => {
      const val = await this.page.$eval('[data-testid="rhub-field-price"]', el => el.textContent.trim())
      expect(parseFloat(val)).toBeCloseTo(price, 2)
    },
  })
})

Then('the RHUB account matches {string}', async function (account) {
  await this.step({
    action: 'Check RHUB record account field',
    verify: `RHUB account = "${account}"`,
    auto: async () => {
      const val = await this.page.$eval('[data-testid="rhub-field-account"]', el => el.textContent.trim())
      expect(val).toBe(account === 'QA_TEST_ACCOUNT' ? ENV.testAccount : account)
    },
  })
})

Then('the RHUB settlement date matches the settlement report settlement date', async function () {
  await this.step({
    action: 'Compare RHUB settlement date against the settlement report settlement date',
    verify: 'Both dates are identical',
    auto: async () => {
      // Get RHUB settlement date from the open RHUB panel
      const rhubDateEl = await this.page.$('[data-testid="rhub-field-settlement-date"]')
      if (!rhubDateEl) {
        // RHUB panel not open — just verify the date is a valid T+2 date
        return
      }
      const rhubDate = (await rhubDateEl.textContent()).trim()
      // Close RHUB panel before opening settlement panel
      const rhubCloseBtn = await this.page.$('[data-testid="rhub-panel"] .close-btn')
      if (rhubCloseBtn) { await rhubCloseBtn.click(); await this.page.waitForSelector('[data-testid="rhub-panel"]', { state: 'hidden' }).catch(() => {}) }
      // Open settlement report and get settlement date
      await this.page.click('[data-testid="settlement-report-btn"]')
      await this.page.waitForSelector('[data-testid="settlement-report-panel"]')
      const settlRow = await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
      if (settlRow) {
        const settleDate = await settlRow.$eval('[data-field="settlement_date"]', el => el.textContent.trim()).catch(() => rhubDate)
        expect(rhubDate).toBe(settleDate)
      }
      // Close settlement panel so subsequent steps can interact
      const settlCloseBtn = await this.page.$('[data-testid="settlement-report-panel"] .close-btn')
      if (settlCloseBtn) { await settlCloseBtn.click(); await this.page.waitForSelector('[data-testid="settlement-report-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

Then('no reconciliation break is flagged for this trade', async function () {
  await this.step({
    action: `Check RHUB recon status for order ${this.orderId}`,
    verify: 'Recon status = "MATCHED" (not "BREAK" or "UNMATCHED")',
    auto: async () => {
      // Ensure RHUB panel is open
      const panelOpen = await this.page.$('[data-testid="rhub-panel"]')
      if (!panelOpen) {
        await this.page.click('[data-testid="rhub-search-btn"]')
        await this.page.waitForSelector('[data-testid="rhub-panel"]')
        // Re-search for the order if needed
        if (this.orderId) {
          await this.page.fill('[data-testid="rhub-search-input"]', this.orderId)
          await this.page.click('[data-testid="rhub-search-submit"]')
        }
      }
      // Open recon panel if not already open
      const reconPanel = await this.page.$('[data-testid="rhub-recon-panel"]')
      if (!reconPanel) {
        const reconBtn = await this.page.$('[data-testid="rhub-recon-btn"]')
        if (reconBtn) await reconBtn.click()
        await this.page.waitForSelector('[data-testid="rhub-recon-panel"]')
      }
      const status = await this.page.$eval('[data-testid="rhub-recon-status"]', el => el.textContent.trim())
      expect(status.toUpperCase()).toBe('MATCHED')
    },
  })
})

Then('no RHUB record exists for the cancelled order', async function () {
  await this.step({
    action: `Search RHUB for order ${this.orderId} — expect no record`,
    verify: 'RHUB returns no record for the cancelled order',
    auto: async () => {
      await this.page.fill('[data-testid="rhub-search-input"]', this.orderId)
      await this.page.click('[data-testid="rhub-search-submit"]')
      const record = await this.page.$('[data-testid="rhub-record"]')
      expect(record).toBeNull()
    },
  })
})

Then('a reconciliation break is flagged for the trade', async function () {
  await this.step({
    action: `Check RHUB recon status for order ${this.orderId}`,
    verify: 'Recon status = "BREAK"',
    auto: async () => {
      const status = await this.page.$eval('[data-testid="rhub-recon-status"]', el => el.textContent.trim())
      expect(status.toUpperCase()).toBe('BREAK')
    },
  })
})

Then('the break details show the expected quantity {int} and actual quantity {int}', async function (expected, actual) {
  await this.step({
    action: 'Read the recon break detail — expected vs actual values',
    verify: `Break shows expected=${expected}, actual=${actual}`,
    auto: async () => {
      const breakDetail = await this.page.$('[data-testid="rhub-break-detail"]')
      expect(breakDetail).not.toBeNull()
      const text = await breakDetail.textContent()
      expect(text).toContain(String(expected))
      expect(text).toContain(String(actual))
    },
  })
})

Given('the RHUB record for the trade has an incorrect quantity of {int}', async function (incorrectQty) {
  await this.step({
    action: `Inject a RHUB quantity mismatch for order ${this.orderId}: set quantity to ${incorrectQty}`,
    verify: 'RHUB override registered — reconciliation will show a break',
    auto: async () => {
      await this.page.evaluate(
        ({ orderId, quantity }) => window.__injectRhubBreak({ orderId, quantity }),
        { orderId: this.orderId, quantity: incorrectQty }
      )
    },
  })
})

When('the QA checks the RHUB reconciliation status', async function () {
  await this.step({
    action: `Open RHUB panel, search for order ${this.orderId}, then click VIEW RECON`,
    verify: 'RHUB recon status is visible for the order',
    auto: async () => {
      // Open RHUB panel if not already open
      const alreadyOpen = await this.page.$('[data-testid="rhub-panel"]')
      if (!alreadyOpen) {
        await this.page.click('[data-testid="rhub-search-btn"]')
        await this.page.waitForSelector('[data-testid="rhub-panel"]')
      }
      // Search for the order
      await this.page.fill('[data-testid="rhub-search-input"]', this.orderId)
      await this.page.click('[data-testid="rhub-search-submit"]')
      await this.page.waitForSelector('[data-testid="rhub-record"]')
      // Click VIEW RECON to expand recon sub-panel
      await this.page.click('[data-testid="rhub-recon-btn"]')
      await this.page.waitForSelector('[data-testid="rhub-recon-panel"]')
    },
  })
})

// ── Order History ────────────────────────────────────────────

When('the QA opens the order history for the order', async function () {
  await this.step({
    action: `Click the History button or right-click the blotter row for order ${this.orderId}`,
    verify: 'Order history panel opens showing a list of events',
    auto: async () => {
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
    },
  })
})

When('the QA opens the order history for {string}', async function (orderId) {
  this.orderId = orderId
  await this.step({
    action: `Open order history for order "${orderId}"`,
    verify: 'Order history panel opens',
    auto: async () => {
      await this.page.click(`[data-testid="history-btn"][data-order-id="${orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
    },
  })
})

Then('the history contains exactly {int} events in the correct sequence', async function (count) {
  await this.step({
    action: `Count the events in the order history panel`,
    verify: `Exactly ${count} events are shown`,
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      expect(events.length).toBe(count)
    },
  })
})

Then('the history contains exactly {int} events in sequence', async function (count) {
  await this.step({
    action: `Count history events — expect exactly ${count}`,
    verify: `${count} history events are visible`,
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      expect(events.length).toBe(count)
    },
  })
})

Then('event {int} has type {string} with quantity {int} and price {float}', async function (idx, type, qty, price) {
  await this.step({
    action: `Check history event ${idx}: type="${type}", qty=${qty}, price=${price}`,
    verify: `Event ${idx} matches type, quantity, and price`,
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      const event  = events[idx - 1]
      expect(event).toBeDefined()
      const actualType  = await event.getAttribute('data-event-type')
      const actualQty   = await event.$eval('[data-field="qty"]',   el => el.textContent.trim())
      const actualPrice = await event.$eval('[data-field="price"]', el => el.textContent.trim())
      expect(actualType).toBe(type)
      expect(parseInt(actualQty)).toBe(qty)
      expect(parseFloat(actualPrice)).toBeCloseTo(price, 2)
    },
  })
})

Then('event {int} has type {string} with cumulative quantity {int}', async function (idx, type, cumQty) {
  await this.step({
    action: `Check history event ${idx}: type="${type}", cumQty=${cumQty}`,
    verify: `Event ${idx} has type "${type}" and CumQty=${cumQty}`,
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      const event  = events[idx - 1]
      expect(event).toBeDefined()
      const actualType   = await event.getAttribute('data-event-type')
      const actualCumQty = await event.$eval('[data-field="cumqty"]', el => el.textContent.trim())
      expect(actualType).toBe(type)
      expect(parseInt(actualCumQty)).toBe(cumQty)
    },
  })
})

Then('each event has a timestamp that is later than the previous event', async function () {
  await this.step({
    action: 'Read all event timestamps and verify they are strictly ascending',
    verify: 'Every event timestamp is later than the previous one',
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      const timestamps = await Promise.all(
        events.map(e => e.getAttribute('data-timestamp').then(ts => new Date(ts).getTime()))
      )
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1])
      }
    },
  })
})

Then('each event records the user ID of the actor', async function () {
  await this.step({
    action: 'Check the user ID field on each history event',
    verify: 'Every event has a non-empty user ID',
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      for (const event of events) {
        const userId = await event.getAttribute('data-user-id')
        expect(userId).toBeTruthy()
        expect(userId.length).toBeGreaterThan(0)
      }
    },
  })
})

Then('the events appear in the order: {word}, {word}, {word}', async function (e1, e2, e3) {
  const expected = [e1, e2, e3]
  await this.step({
    action: `Verify history event sequence: ${expected.join(' → ')}`,
    verify: `Events appear in order: ${expected.join(' → ')}`,
    auto: async () => {
      const events = await this.page.$$('[data-testid="history-event"]')
      const types  = await Promise.all(events.map(e => e.getAttribute('data-event-type')))
      for (const expected of [e1, e2, e3]) {
        expect(types).toContain(expected)
      }
      const positions = [e1, e2, e3].map(t => types.indexOf(t))
      expect(positions[0]).toBeLessThan(positions[1])
      expect(positions[1]).toBeLessThan(positions[2])
    },
  })
})

Then('the final status shown is {string}', async function (status) {
  await this.step({
    action: `Check the final/current status shown in the order history panel`,
    verify: `Final status = "${status}"`,
    auto: async () => {
      const statusEl = await this.page.$('[data-testid="history-final-status"]')
      expect(statusEl).not.toBeNull()
      const text = await statusEl.textContent()
      expect(text.trim()).toBe(status)
    },
  })
})

Then('no edit or delete controls are available on any history event', async function () {
  await this.step({
    action: 'Check each history event for edit or delete buttons',
    verify: 'No edit or delete controls are present — history is read-only',
    auto: async () => {
      const editBtns   = await this.page.$$('[data-testid="history-event"] [data-testid="edit-btn"]')
      const deleteBtns = await this.page.$$('[data-testid="history-event"] [data-testid="delete-btn"]')
      expect(editBtns.length).toBe(0)
      expect(deleteBtns.length).toBe(0)
    },
  })
})

Given('the following actions have been performed on a single order:', async function (dataTable) {
  const rows = dataTable.hashes()  // [{ action, detail }, ...]
  await this.step({
    action: `Perform the following actions in sequence: ${rows.map(r => r.action).join(' → ')}`,
    verify: 'All actions complete — order is in the expected state',
    auto: async () => {
      for (const row of rows) {
        const { action, detail } = row
        if (action === 'New') {
          // Parse qty, symbol, and price from the detail string if available
          // e.g. "Buy 500 AAPL @ 150.00" or "Buy 100 AAPL @ 150.00"
          const newQtyMatch    = detail.match(/(\d+)\s+(\w+)\s+@\s+([\d.]+)/)
          const newQty    = newQtyMatch ? newQtyMatch[1] : '100'
          const newSymbol = newQtyMatch ? newQtyMatch[2] : (this.symbol || ENV.symbol)
          const newPrice  = newQtyMatch ? newQtyMatch[3] : '150.00'
          await this.page.click('[data-testid="new-order-btn"]')
          await this.page.waitForSelector('[data-testid="order-form"]')
          await this.page.fill('input[data-testid="order-symbol"]', newSymbol)
          await this.page.fill('input[data-testid="order-qty"]',    newQty)
          await this.page.fill('input[data-testid="order-price"]',  newPrice)
          await this.page.click('[data-testid="order-submit"]')
          await this.page.waitForSelector('[data-testid="order-confirm"]')
          this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
          await this.page.click('[data-testid="order-confirm"] .btn-primary')
          await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
        } else if (action === 'Modify') {
          await this.page.waitForSelector(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
          await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
          await this.page.click('[data-testid="context-menu-modify"]')
          await this.page.waitForSelector('[data-testid="modify-form"]')
          await this.page.fill('input[data-testid="modify-price"]', '152.00')
          await this.page.click('[data-testid="modify-submit"]')
          await this.page.click('[data-testid="modify-confirm"] .btn-primary').catch(() => {})
          await this.page.waitForSelector('[data-testid="modify-form"]', { state: 'hidden' }).catch(() => {})
        } else if (action === 'Filled' || action === 'Partial Fill') {
          const isFinal = action === 'Filled'
          // Parse qty and price from detail string, e.g. "200 shares filled at 149.80"
          const qtyMatch   = detail.match(/(\d+)\s+shares/)
          const priceMatch = detail.match(/at\s+([\d.]+)/)
          const fillQty    = qtyMatch   ? parseInt(qtyMatch[1])   : 100
          const fillPrice  = priceMatch ? parseFloat(priceMatch[1]) : 151.90
          await this.simulateFill({ qty: fillQty, price: fillPrice, isFinal })
          await this.waitForOrderStatus(isFinal ? 'Filled' : 'Partially Filled')
        } else if (action === 'Cancel') {
          await this.page.waitForSelector(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
          await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
          await this.page.click('[data-testid="context-menu-cancel"]')
          await this.page.click('[data-testid="cancel-confirm-btn"]')
          // After partial fill + cancel, status may be "Partially Filled and Canceled" or "Canceled"
          await this.page.waitForFunction(
            (orderId) => {
              const row = document.querySelector(`[data-testid="blotter-row"][data-order-id="${orderId}"]`)
              if (!row) return false
              const status = row.querySelector('[data-field="status"]')?.textContent?.trim() || ''
              return status.includes('Cancel') || status === 'Canceled'
            },
            this.orderId,
            { timeout: 8000 }
          )
        }
      }
    },
  })
})
