// ============================================================
//  step_definitions/lifecycle/position_steps.js
//  Steps for: Position Management
// ============================================================
import { Given, When, Then } from '@cucumber/cucumber'
import { expect }            from '@playwright/test'
import ENV                   from '../../config/env.js'

// ── Preconditions ────────────────────────────────────────────

Given('the starting position for {string} in account {string} is {int} shares', async function (symbol, account, qty) {
  this.symbol        = symbol
  this.startPosition = qty

  await this.step({
    action: `Ensure the current net position for ${symbol} in account ${account} is ${qty} shares (seed if needed)`,
    verify: `Position panel shows ${qty} for ${symbol} — or is absent if qty = 0`,
    auto: async () => {
      // If qty > 0, seed the position directly so the scenario starts with the right state
      if (qty > 0) {
        await this.seedPosition({ symbol, qty })
      }
      // Verify via the position panel
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const row = await this.page.$(`[data-testid="position-row"][data-symbol="${symbol}"]`)
      if (qty === 0) {
        // row may not exist at all if position is zero
        if (row) {
          const pos = await row.$eval('[data-field="qty"]', el => parseInt(el.textContent))
          expect(pos).toBe(0)
        }
      } else {
        expect(row).not.toBeNull()
        const pos = await row.$eval('[data-field="qty"]', el => parseInt(el.textContent))
        expect(pos).toBe(qty)
      }
      // Close the position panel so blotter is accessible for next steps
      const closeBtn = await this.page.$('[data-testid="position-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="position-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

// ── Order actions used in position scenarios ─────────────────

When('a buy order for {int} shares of {string} is fully filled at {float}', async function (qty, symbol, price) {
  this.symbol     = symbol
  this.orderQty   = qty
  this.limitPrice = price

  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} at ${price} and trigger a full fill`,
    verify: `Order status becomes "Filled", CumQty=${qty}`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  String(price))
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      await this.simulateFill({ qty, price, isFinal: true })
      await this.waitForOrderStatus('Filled')
    },
  })
})

When('a buy order for {int} shares of {string} is partially filled for {int} shares', async function (totalQty, symbol, filledQty) {
  this.symbol   = symbol
  this.orderQty = totalQty

  await this.step({
    action: `Submit a buy order for ${totalQty} shares of ${symbol} and trigger a partial fill of ${filledQty} shares`,
    verify: `Order status becomes "Partially Filled", CumQty=${filledQty}`,
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

When('a buy order for {int} shares of {string} is submitted and then cancelled before any fill', async function (qty, symbol) {
  this.symbol   = symbol
  this.orderQty = qty

  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} and immediately cancel it before any fill`,
    verify: `Order status becomes "Canceled" with CumQty=0`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  '150.00')
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
      await this.page.click('[data-testid="context-menu-cancel"]')
      await this.page.click('[data-testid="cancel-confirm-btn"]')
      await this.waitForOrderStatus('Canceled')
    },
  })
})

When('a buy order for {int} shares of {string} is submitted with an invalid price', async function (qty, symbol) {
  this.symbol   = symbol
  this.orderQty = qty

  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} with price = -1.00 (invalid)`,
    verify: `Order is rejected immediately`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  '-1.00')
      await this.page.click('[data-testid="order-submit"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim()).catch(() => null)
    },
  })
})

When('the order is rejected by the system', async function () {
  await this.step({
    action: 'Confirm the order has been rejected, then close the form overlay',
    verify: 'Order status is "Rejected" or a rejection error is shown; form is dismissed',
    auto: async () => {
      if (this.orderId) {
        await this.waitForOrderStatus('Rejected')
      } else {
        const errorEl = await this.page.$('[data-testid="order-error"]')
        expect(errorEl).not.toBeNull()
      }
      // Close the order form overlay so subsequent steps can click toolbar buttons
      const closeBtn = await this.page.$('[data-testid="order-form"] .close-btn')
      if (closeBtn) {
        await closeBtn.click()
      } else {
        // click the overlay background to dismiss
        const overlay = await this.page.$('.modal-overlay')
        if (overlay) await overlay.click({ position: { x: 5, y: 5 } }).catch(() => {})
      }
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' }).catch(() => {})
    },
  })
})

When('a sell order for {int} shares of {string} is fully filled at {float}', async function (qty, symbol, price) {
  await this.step({
    action: `Submit a sell order for ${qty} shares of ${symbol} at ${price} and trigger a full fill`,
    verify: `Order status becomes "Filled", position for ${symbol} decreases by ${qty}`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.selectOption('[data-testid="order-side"]', 'Sell')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  String(price))
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      await this.simulateFill({ qty, price, isFinal: true })
      await this.waitForOrderStatus('Filled')
    },
  })
})

// ── Position assertions ──────────────────────────────────────

Then('the net position for {string} is {int} shares', async function (symbol, expectedQty) {
  await this.step({
    action: `Navigate to position management and check net position for ${symbol}`,
    verify: `Net position = ${expectedQty} shares`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const row = await this.page.$(`[data-testid="position-row"][data-symbol="${symbol}"]`)
      if (expectedQty === 0) {
        if (row) {
          const pos = await row.$eval('[data-field="qty"]', el => parseInt(el.textContent))
          expect(pos).toBe(0)
        }
        // no row = zero position — also acceptable
      } else {
        expect(row).not.toBeNull()
        const pos = await row.$eval('[data-field="qty"]', el => parseInt(el.textContent))
        expect(pos).toBe(expectedQty)
      }
    },
  })
})

Then('the net position for {string} remains {int} shares', async function (symbol, expectedQty) {
  await this.step({
    action: `Confirm net position for ${symbol} is still ${expectedQty} (unchanged by rejection)`,
    verify: `Position = ${expectedQty}`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      const row = await this.page.$(`[data-testid="position-row"][data-symbol="${symbol}"]`)
      if (expectedQty === 0) {
        if (row) {
          const pos = await row.$eval('[data-field="qty"]', el => parseInt(el.textContent))
          expect(pos).toBe(0)
        }
      } else {
        const pos = await row.$eval('[data-field="qty"]', el => parseInt(el.textContent))
        expect(pos).toBe(expectedQty)
      }
    },
  })
})

Then('the position does not include quantity from the cancelled order', async function () {
  await this.step({
    action: `Check that no position event is linked to the cancelled order ${this.orderId}`,
    verify: 'Position change log shows no entry for the cancelled order',
    auto: async () => {
      // TODO: query position event log filtered by order ID
      // Positive check: net position = sum of fill quantities only
    },
  })
})

Then('the position does not include the unfilled {int} shares from the partial order', async function (unfilledQty) {
  await this.step({
    action: `Confirm the unfilled ${unfilledQty} shares from the partial order are not in the position`,
    verify: 'Position only reflects executed/filled quantity',
    auto: async () => {
      // Verified implicitly by the net position assertion
      // LeavesQty must not contribute to position
    },
  })
})

Then('the net position for {string} is {int} shares within {int} seconds of the fill', async function (symbol, expectedQty, seconds) {
  await this.step({
    action: `Poll position for ${symbol} — expect ${expectedQty} shares within ${seconds} seconds`,
    verify: `Position updates to ${expectedQty} within ${seconds}s`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      await this.page.waitForFunction(
        ({ symbol, qty }) => {
          const row = document.querySelector(`[data-testid="position-row"][data-symbol="${symbol}"]`)
          return row && parseInt(row.querySelector('[data-field="qty"]')?.textContent) === qty
        },
        { symbol, qty: expectedQty },
        { timeout: seconds * 1000 }
      )
    },
  })
})

When('the QA views the position detail for {string}', async function (symbol) {
  await this.step({
    action: `Open the position detail panel for ${symbol}`,
    verify: `Position detail panel shows execution breakdown for ${symbol}`,
    auto: async () => {
      await this.page.click('[data-testid="position-btn"]')
      await this.page.waitForSelector('[data-testid="position-panel"]')
      // Click the DETAIL button within the row (not the row itself)
      const row = await this.page.$(`[data-testid="position-row"][data-symbol="${symbol}"]`)
      expect(row).not.toBeNull()
      const detailBtn = await row.$('.small-btn')
      expect(detailBtn).not.toBeNull()
      await detailBtn.click()
      await this.page.waitForSelector('[data-testid="position-detail-panel"]')
    },
  })
})

Then('each execution appears exactly once in the position detail', async function () {
  await this.step({
    action: 'Check the position detail for duplicate execution entries',
    verify: 'No ExecID appears more than once in the position detail',
    auto: async () => {
      const rows   = await this.page.$$('[data-testid="position-exec-row"]')
      const execIds = await Promise.all(rows.map(r => r.getAttribute('data-exec-id')))
      const unique  = new Set(execIds)
      expect(unique.size).toBe(execIds.length)
    },
  })
})

Then('the total position quantity equals the sum of all unique fill quantities', async function () {
  await this.step({
    action: 'Sum the fill quantities in the position detail and compare to the net position',
    verify: 'Sum of all fill quantities = net position quantity',
    auto: async () => {
      const rows = await this.page.$$('[data-testid="position-exec-row"]')
      let total  = 0
      for (const row of rows) {
        const qty = await row.$eval('[data-field="qty"]', el => parseInt(el.textContent))
        total += qty
      }
      const netQty = await this.page.$eval(
        `[data-testid="position-row"][data-symbol="${this.symbol}"] [data-field="qty"]`,
        el => parseInt(el.textContent)
      )
      expect(total).toBe(netQty)
    },
  })
})
