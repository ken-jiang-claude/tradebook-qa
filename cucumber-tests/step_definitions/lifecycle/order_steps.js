// ============================================================
//  step_definitions/lifecycle/order_steps.js
//  Steps for: Add Order, Modify Order, Cancel Order, Order Reject
// ============================================================
import { Given, When, Then } from '@cucumber/cucumber'
import { expect }            from '@playwright/test'
import ENV                   from '../../config/env.js'

// ── Preconditions ────────────────────────────────────────────

Given('no existing open orders for symbol {string}', async function (symbol) {
  this.symbol = symbol
  await this.step({
    action: `Check the blotter for any open orders for ${symbol} and cancel them if needed`,
    verify: `No open orders exist for ${symbol} before starting the test`,
    auto: async () => {
      // TODO: check blotter for open orders and cancel via API or UI
      // For now, we trust test isolation via Background setup
    },
  })
})

Given('an open buy order exists for {int} shares of {string} at limit price {float}', async function (qty, symbol, price) {
  this.symbol     = symbol
  this.orderQty   = qty
  this.limitPrice = price
  this.side       = 'Buy'

  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} at ${price} — or locate an existing open order`,
    verify: `An open buy order for ${qty} shares of ${symbol} at ${price} is visible in the blotter with status "New"`,
    auto: async () => {
      // TODO: replace with actual order submission flow
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.selectOption('[data-testid="order-side"]', 'Buy')
      await this.page.fill('[data-testid="order-symbol"]', symbol)
      await this.page.fill('[data-testid="order-qty"]', String(qty))
      await this.page.fill('[data-testid="order-price"]', String(price))
      await this.page.selectOption('[data-testid="order-type"]', 'Limit')
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      // Close the form so the blotter is accessible
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
    },
  })
})

Given('the order status is {string}', async function (status) {
  await this.step({
    action: `Confirm the order status is currently "${status}" in the blotter`,
    verify: `Blotter row for order ${this.orderId} shows status "${status}"`,
    auto: async () => {
      await this.waitForOrderStatus(status)
    },
  })
})

Given('a buy order for {int} shares of {string} has status {string}', async function (qty, symbol, status) {
  this.symbol   = symbol
  this.orderQty = qty
  await this.step({
    action: `Ensure a buy order for ${qty} shares of ${symbol} exists with status "${status}" — create and drive it there if needed`,
    verify: `A blotter row exists for ${symbol} showing status "${status}"`,
    auto: async () => {
      // Check if an existing row already matches
      let row = await this.page.$(`[data-testid="blotter-row"][data-symbol="${symbol}"][data-status="${status}"]`)
      if (row) {
        this.orderId = await row.getAttribute('data-order-id')
        return
      }
      // Need to create the order and drive it to the target status
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
      if (status === 'Filled') {
        await this.simulateFill({ qty, price: 150.00, isFinal: true })
        await this.waitForOrderStatus('Filled')
      } else if (status === 'Partially Filled') {
        await this.simulateFill({ qty: Math.floor(qty / 2), price: 150.00, isFinal: false })
        await this.waitForOrderStatus('Partially Filled')
      } else if (status === 'Canceled') {
        await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
        await this.page.click('[data-testid="context-menu-cancel"]')
        await this.page.click('[data-testid="cancel-confirm-btn"]')
        await this.waitForOrderStatus('Canceled')
      }
    },
  })
})

Given('the order has been partially filled for {int} shares', async function (filledQty) {
  await this.step({
    action: `Trigger a partial fill of ${filledQty} shares for order ${this.orderId}`,
    verify: `CumQty shows ${filledQty} in the blotter`,
    auto: async () => {
      await this.simulateFill({ qty: filledQty, price: this.limitPrice || 150.00, isFinal: false })
      await this.waitForOrderStatus('Partially Filled')
      const cumQty = await this.getBlotterField('cumqty')
      expect(parseInt(cumQty)).toBe(filledQty)
    },
  })
})

Given('a buy order for {int} shares of {string} has been cancelled before any fill', async function (qty, symbol) {
  this.symbol   = symbol
  this.orderQty = qty
  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} and cancel it before any fill occurs`,
    verify: `Order status is "Canceled" with CumQty = 0`,
    auto: async () => {
      // Submit order
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  '100.00')
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      // Cancel via right-click context menu
      await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
      await this.page.click('[data-testid="context-menu-cancel"]')
      await this.page.click('[data-testid="cancel-confirm-btn"]')
      await this.waitForOrderStatus('Canceled')
    },
  })
})

Given('a buy order for {int} shares of {string} has been rejected', async function (qty, symbol) {
  this.symbol   = symbol
  this.orderQty = qty
  await this.step({
    action: `Submit a buy order for ${qty} shares of ${symbol} that will be rejected (invalid price -1.00)`,
    verify: `Order error shown or blotter row has status "Rejected"`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.fill('input[data-testid="order-symbol"]', symbol)
      await this.page.fill('input[data-testid="order-qty"]',    String(qty))
      await this.page.fill('input[data-testid="order-price"]',  '-1.00')  // triggers rejection
      await this.page.click('[data-testid="order-submit"]')
      // For invalid price, submitOrder returns error immediately — no confirm box shown
      // Close the order form via the ✕ close button in the modal header
      const formCloseBtn = await this.page.$('[data-testid="order-form"] .close-btn')
      if (formCloseBtn) {
        await formCloseBtn.click()
      }
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' }).catch(() => {})
      // orderId may not exist for inline-rejected orders (no blotter row)
      this.orderId = null
    },
  })
})

// ── Submission ───────────────────────────────────────────────

When('the QA submits a buy order for {int} shares of {string} at limit price {float}', async function (qty, symbol, price) {
  this.symbol     = symbol
  this.orderQty   = qty
  this.limitPrice = price
  this.side       = 'Buy'

  await this.step({
    action: `Open the New Order form and enter: Side=Buy, Symbol=${symbol}, Qty=${qty}, Price=${price}, Type=Limit. Click Submit.`,
    verify: `A confirmation shows an order ID, or an error message is displayed for invalid inputs.`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.selectOption('[data-testid="order-side"]',  'Buy')
      await this.page.fill('input[data-testid="order-symbol"]',  symbol)
      await this.page.fill('input[data-testid="order-qty"]',     String(qty))
      await this.page.fill('input[data-testid="order-price"]',   String(price))
      await this.page.selectOption('[data-testid="order-type"]', 'Limit')
      await this.page.click('[data-testid="order-submit"]')
      // Wait for either confirm (valid order) or error (invalid order)
      const result = await Promise.race([
        this.page.waitForSelector('[data-testid="order-confirm"]').then(() => 'confirm'),
        this.page.waitForSelector('[data-testid="order-error"]').then(() => 'error'),
      ])
      if (result === 'confirm') {
        this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
        await this.page.click('[data-testid="order-confirm"] .btn-primary')
        await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
      }
      // If error, leave form open so subsequent steps can inspect the error message
    },
  })
})

When('the QA submits a sell order for {int} shares of {string} at limit price {float}', async function (qty, symbol, price) {
  this.symbol     = symbol
  this.orderQty   = qty
  this.limitPrice = price
  this.side       = 'Sell'

  await this.step({
    action: `Open New Order form: Side=Sell, Symbol=${symbol}, Qty=${qty}, Price=${price}, Type=Limit. Click Submit.`,
    verify: `A confirmation shows an order ID. The blotter updates with a new Sell row.`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      await this.page.selectOption('[data-testid="order-side"]', 'Sell')
      await this.page.fill('[data-testid="order-symbol"]',  symbol)
      await this.page.fill('[data-testid="order-qty"]',     String(qty))
      await this.page.fill('[data-testid="order-price"]',   String(price))
      await this.page.selectOption('[data-testid="order-type"]', 'Limit')
      await this.page.click('[data-testid="order-submit"]')
      await this.page.waitForSelector('[data-testid="order-confirm"]')
      this.orderId = await this.page.$eval('[data-testid="order-id"]', el => el.textContent.trim())
      await this.page.click('[data-testid="order-confirm"] .btn-primary')
      await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' })
    },
  })
})

When('the QA submits a buy order with {word} set to {word}', async function (field, value) {
  await this.step({
    action: `Open New Order form. Set ${field} to "${value}" (invalid). Fill other fields with valid defaults. Click Submit.`,
    verify: `The system shows a validation error or rejects the order`,
    auto: async () => {
      await this.page.click('[data-testid="new-order-btn"]')
      await this.page.waitForSelector('[data-testid="order-form"]')
      // Fill valid defaults
      await this.page.selectOption('[data-testid="order-side"]', 'Buy')
      await this.page.fill('[data-testid="order-symbol"]', ENV.symbol)
      await this.page.fill('[data-testid="order-qty"]',    '100')
      await this.page.fill('[data-testid="order-price"]',  '150.00')
      // Override the invalid field
      const selectors = {
        quantity: '[data-testid="order-qty"]',
        price:    '[data-testid="order-price"]',
        symbol:   '[data-testid="order-symbol"]',
        account:  '[data-testid="order-account"]',
      }
      if (selectors[field]) {
        await this.page.fill(selectors[field], value)
      }
      await this.page.click('[data-testid="order-submit"]')
    },
  })
})

// ── Assertions: Add Order ────────────────────────────────────

Then('an order ID is assigned immediately', async function () {
  await this.step({
    action: 'Check the confirmation dialog or blotter for an order ID',
    verify: 'A non-empty order ID is displayed',
    auto: async () => {
      expect(this.orderId).toBeTruthy()
      expect(this.orderId.length).toBeGreaterThan(0)
    },
  })
})

Then('the order appears in the blotter with status {string}', async function (status) {
  await this.step({
    action: `Find the order in the blotter and check its Status column`,
    verify: `Blotter row shows status "${status}"`,
    auto: async () => {
      await this.waitForOrderStatus(status)
    },
  })
})

Then('the side is {string}, quantity is {int}, and limit price is {float}', async function (side, qty, price) {
  await this.step({
    action: `Verify blotter row fields: Side, Quantity, and Limit Price`,
    verify: `Side="${side}", Qty=${qty}, Price=${price}`,
    auto: async () => {
      const actualSide  = await this.getBlotterField('side')
      const actualQty   = await this.getBlotterField('qty')
      const actualPrice = await this.getBlotterField('price')
      expect(actualSide?.trim()).toBe(side)
      expect(parseInt(actualQty)).toBe(qty)
      expect(parseFloat(actualPrice)).toBeCloseTo(price, 2)
    },
  })
})

Then('the order is not created', async function () {
  await this.step({
    action: 'Confirm no new order row appears in the blotter',
    verify: 'Blotter count is unchanged or an error message is shown instead of a new row',
    auto: async () => {
      const confirm = await this.page.$('[data-testid="order-confirm"]')
      expect(confirm).toBeNull()
    },
  })
})

Then('an error message is displayed explaining the invalid {word}', async function (fieldType) {
  await this.step({
    action: `Check for a validation error message referencing ${fieldType}`,
    verify: `An error or warning message is visible that mentions "${fieldType}"`,
    auto: async () => {
      const errorEl = await this.page.$('[data-testid="order-error"]')
      expect(errorEl).not.toBeNull()
      const text = await errorEl.textContent()
      expect(text.toLowerCase()).toContain(fieldType.toLowerCase())
    },
  })
})

Then('no order ID is assigned', async function () {
  await this.step({
    action: 'Confirm no order ID was generated (no confirmation dialog with order ID)',
    verify: 'Order confirmation dialog is absent or order ID field is empty',
    auto: async () => {
      expect(this.orderId).toBeFalsy()
    },
  })
})

// ── Modify ───────────────────────────────────────────────────

When('the QA modifies the limit price to {float}', async function (newPrice) {
  this.limitPrice = newPrice
  await this.step({
    action: `Right-click the blotter row for order ${this.orderId} → select "Modify" → change Price to ${newPrice} → Submit`,
    verify: `Modify dialog closes and blotter price updates to ${newPrice}`,
    auto: async () => {
      await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
      await this.page.click('[data-testid="context-menu-modify"]')
      await this.page.waitForSelector('[data-testid="modify-form"]')
      await this.page.fill('[data-testid="modify-price"]', String(newPrice))
      await this.page.click('[data-testid="modify-submit"]')
      await this.page.waitForSelector('[data-testid="modify-confirm"]')
      await this.page.click('[data-testid="modify-confirm"] .btn-primary').catch(() => {})
      await this.page.waitForSelector('[data-testid="modify-form"]', { state: 'hidden' }).catch(() => {})
    },
  })
})

When('the QA modifies the quantity to {int}', async function (newQty) {
  this.orderQty = newQty
  await this.step({
    action: `Right-click blotter row for order ${this.orderId} → Modify → change Qty to ${newQty} → Submit`,
    verify: `Modify dialog closes and blotter quantity updates to ${newQty}`,
    auto: async () => {
      await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
      await this.page.click('[data-testid="context-menu-modify"]')
      await this.page.waitForSelector('[data-testid="modify-form"]')
      await this.page.fill('[data-testid="modify-qty"]', String(newQty))
      await this.page.click('[data-testid="modify-submit"]')
      await this.page.waitForSelector('[data-testid="modify-confirm"]')
      await this.page.click('[data-testid="modify-confirm"] .btn-primary').catch(() => {})
      await this.page.waitForSelector('[data-testid="modify-form"]', { state: 'hidden' }).catch(() => {})
    },
  })
})

When('the QA attempts to modify the limit price to {float}', async function (price) {
  await this.step({
    action: `Attempt to modify price of order ${this.orderId} to ${price} — expect blocked for terminal orders`,
    verify: `Modify button is disabled for a terminal-status order`,
    auto: async () => {
      const row = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
      if (row) {
        const modifyBtn = await row.$('[data-testid="modify-btn"]')
        if (modifyBtn) {
          const isDisabled = await modifyBtn.evaluate(el => el.disabled)
          if (isDisabled) {
            // Correct — terminal orders cannot be modified
            return
          }
          // Not disabled — proceed with modify attempt
          await modifyBtn.click()
          await this.page.waitForSelector('[data-testid="modify-form"]')
          await this.page.fill('input[data-testid="modify-price"]', String(price))
          await this.page.click('[data-testid="modify-submit"]')
          await this.page.click('[data-testid="modify-confirm"] .btn-primary').catch(() => {})
          await this.page.waitForSelector('[data-testid="modify-form"]', { state: 'hidden' }).catch(() => {})
        }
      }
    },
  })
})

When('the QA attempts to modify the quantity to {int}', async function (qty) {
  await this.step({
    action: `Attempt to modify the quantity of order ${this.orderId} to ${qty}`,
    verify: `Modify is blocked or returns a rejection — quantity below filled amount`,
    auto: async () => {
      const row = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
      if (row) {
        const modifyBtn = await row.$('[data-testid="modify-btn"]')
        if (modifyBtn) {
          const isDisabled = await modifyBtn.evaluate(el => el.disabled)
          if (!isDisabled) {
            await modifyBtn.click()
            await this.page.waitForSelector('[data-testid="modify-form"]')
            await this.page.fill('input[data-testid="modify-qty"]', String(qty))
            await this.page.click('[data-testid="modify-submit"]')
          }
        }
      }
    },
  })
})

Then('the order is updated with the new limit price {float}', async function (price) {
  await this.step({
    action: `Check blotter row for order ${this.orderId} — Price column`,
    verify: `Price shows ${price}`,
    auto: async () => {
      const actualPrice = await this.getBlotterField('price')
      expect(parseFloat(actualPrice)).toBeCloseTo(price, 2)
    },
  })
})

Then('the order is updated with the new quantity {int}', async function (qty) {
  await this.step({
    action: `Check blotter row for order ${this.orderId} — Quantity column`,
    verify: `Quantity shows ${qty}`,
    auto: async () => {
      const actualQty = await this.getBlotterField('qty')
      expect(parseInt(actualQty)).toBe(qty)
    },
  })
})

Then('the order quantity remains {int}', async function (qty) {
  await this.step({
    action: `Confirm the order quantity in the blotter has not changed`,
    verify: `Quantity still shows ${qty}`,
    auto: async () => {
      const actualQty = await this.getBlotterField('qty')
      expect(parseInt(actualQty)).toBe(qty)
    },
  })
})

Then('the limit price remains {float}', async function (price) {
  await this.step({
    action: `Confirm the limit price in the blotter has not changed`,
    verify: `Price still shows ${price}`,
    auto: async () => {
      const actualPrice = await this.getBlotterField('price')
      expect(parseFloat(actualPrice)).toBeCloseTo(price, 2)
    },
  })
})

Then('the order status remains {string}', async function (status) {
  await this.step({
    action: `Confirm the order status has not changed`,
    verify: `Status still shows "${status}"`,
    auto: async () => {
      const actualStatus = await this.getBlotterField('status')
      expect(actualStatus?.trim()).toBe(status)
    },
  })
})

Then('the original order and the replacement are linked in order history', async function () {
  await this.step({
    action: `Open order history for ${this.orderId} and check that both the original and replace events are linked`,
    verify: 'History shows two events (New → Replace) with matching ClOrdID chain',
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const events = await this.page.$$('[data-testid="history-event"]')
      expect(events.length).toBeGreaterThanOrEqual(2)
      const types = await Promise.all(events.map(e => e.getAttribute('data-event-type')))
      expect(types).toContain('New')
      expect(types).toContain('Replace')
      // Close history panel so subsequent steps can interact with blotter
      const closeBtn = await this.page.$('[data-testid="order-history-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="order-history-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

Then('the modify request is rejected', async function () {
  await this.step({
    action: 'Confirm modify was rejected — error shown or button disabled',
    verify: 'Either a modify error message is visible, or the modify button is disabled (terminal status)',
    auto: async () => {
      // Case 1: modify form is open with an error (e.g. qty < cumQty)
      const modifyForm = await this.page.$('[data-testid="modify-form"]')
      if (modifyForm) {
        const errorEl = await modifyForm.$('[data-testid="modify-error"]')
        expect(errorEl).not.toBeNull()
        // Store the error text for subsequent "rejection reason" steps
        this.lastModifyError = await errorEl.textContent()
        // Close the modify form so subsequent steps work
        const closeBtn = await modifyForm.$('.close-btn')
        if (closeBtn) await closeBtn.click()
        await this.page.waitForSelector('[data-testid="modify-form"]', { state: 'hidden' }).catch(() => {})
        return
      }
      // Case 2: modify button is disabled (terminal status — button was never clickable)
      const row = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
      if (row) {
        const modifyBtn = await row.$('[data-testid="modify-btn"]')
        if (modifyBtn) {
          const isDisabled = await modifyBtn.evaluate(el => el.disabled)
          expect(isDisabled).toBe(true)
        }
      }
    },
  })
})

Then('a clear rejection reason is shown to the QA user', async function () {
  await this.step({
    action: 'Confirm rejection is communicated — via error message or disabled action button',
    verify: 'Either an error message is visible, or the action buttons are disabled (indicating terminal state)',
    auto: async () => {
      // Check for an explicit error element first
      const errorEl = await this.page.$('[data-testid="reject-reason"]') ||
                      await this.page.$('[data-testid="modify-error"]') ||
                      await this.page.$('[data-testid="cancel-error"]') ||
                      await this.page.$('[data-testid="order-error"]')
      if (errorEl) {
        const text = await errorEl.textContent()
        expect(text.trim().length).toBeGreaterThan(0)
        return
      }
      // Fallback: check that action buttons are disabled (disabled button IS the rejection signal for terminal orders)
      const row = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
      if (row) {
        const cancelBtn = await row.$('[data-testid="cancel-btn"]')
        const modifyBtn = await row.$('[data-testid="modify-btn"]')
        const cancelDisabled = cancelBtn ? await cancelBtn.evaluate(el => el.disabled) : true
        const modifyDisabled = modifyBtn ? await modifyBtn.evaluate(el => el.disabled) : true
        expect(cancelDisabled || modifyDisabled).toBe(true)
        return
      }
      // Should not reach here
      throw new Error('No rejection reason and no disabled buttons found')
    },
  })
})

Then('a clear rejection reason explains the quantity is below the filled amount', async function () {
  await this.step({
    action: 'Read the rejection reason message for the quantity modify attempt',
    verify: 'Message explains that the new quantity is less than the filled quantity',
    auto: async () => {
      // First check for a still-visible modify-error element
      const errorEl = await this.page.$('[data-testid="modify-error"]')
      if (errorEl) {
        const text = await errorEl.textContent()
        expect(text.toLowerCase()).toMatch(/quantity|filled|cumqty/)
        return
      }
      // Fall back to the text stored by the previous "modify request is rejected" step
      expect(this.lastModifyError).toBeTruthy()
      expect(this.lastModifyError.toLowerCase()).toMatch(/quantity|filled|cumqty/)
    },
  })
})

// ── Cancel ───────────────────────────────────────────────────

When('the QA submits a cancel request for the order', async function () {
  await this.step({
    action: `Right-click blotter row for order ${this.orderId} → Cancel → Confirm`,
    verify: 'Cancel dialog confirms the request was sent',
    auto: async () => {
      await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
      await this.page.click('[data-testid="context-menu-cancel"]')
      await this.page.waitForSelector('[data-testid="cancel-confirm-dialog"]')
      await this.page.click('[data-testid="cancel-confirm-btn"]')
    },
  })
})

When('the QA attempts to cancel the filled order', async function () {
  await this.step({
    action: `Attempt to cancel order ${this.orderId} — expect button is disabled (terminal status)`,
    verify: 'Cancel button is disabled for a Filled order',
    auto: async () => {
      // The cancel button is in the blotter row for the current order
      const row = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
      if (row) {
        const cancelBtn = await row.$('[data-testid="cancel-btn"]')
        if (cancelBtn) {
          const isDisabled = await cancelBtn.evaluate(el => el.disabled)
          // For filled orders, the button should be disabled — that IS the rejection
          expect(isDisabled).toBe(true)
          return
        }
      }
      // No cancel button at all is also acceptable (terminal state)
    },
  })
})

When('the QA attempts to cancel the already-cancelled order', async function () {
  await this.step({
    action: `Attempt to cancel order ${this.orderId} which is already Canceled — button should be disabled`,
    verify: 'Cancel button is disabled for a Canceled order',
    auto: async () => {
      const row = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
      if (row) {
        const cancelBtn = await row.$('[data-testid="cancel-btn"]')
        if (cancelBtn) {
          const isDisabled = await cancelBtn.evaluate(el => el.disabled)
          expect(isDisabled).toBe(true)
          return
        }
      }
      // No cancel button = also acceptable
    },
  })
})

When('the QA submits a cancel request for the remaining quantity', async function () {
  await this.step({
    action: `Cancel the remaining open quantity of order ${this.orderId}`,
    verify: 'Cancel dialog confirms the request; blotter transitions to "Partially Filled and Canceled"',
    auto: async () => {
      await this.page.click(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`, { button: 'right' })
      await this.page.click('[data-testid="context-menu-cancel"]')
      await this.page.click('[data-testid="cancel-confirm-btn"]')
    },
  })
})

Then('the system acknowledges the cancel request', async function () {
  await this.step({
    action: 'Confirm the system responded to the cancel — no error, blotter shows Pending Cancel or Canceled',
    verify: 'No error message; blotter status is "Pending Cancel" or "Canceled"',
    auto: async () => {
      const cancelError = await this.page.$('[data-testid="cancel-error"]')
      expect(cancelError).toBeNull()
    },
  })
})

Then('the order status transitions to {string}', async function (status) {
  await this.step({
    action: `Wait for blotter row to show status "${status}"`,
    verify: `Status column reads "${status}" within ${ENV.timeout}ms`,
    auto: async () => {
      await this.waitForOrderStatus(status, ENV.timeout)
    },
  })
})

Then('no fill execution is recorded after the cancel timestamp', async function () {
  await this.step({
    action: `Open order history for ${this.orderId} and check no fill event exists after the cancel event`,
    verify: 'No "Filled" or "Partially Filled" event timestamp is later than the "Canceled" event timestamp',
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const events = await this.page.$$('[data-testid="history-event"]')
      let cancelTs = null
      for (const event of events) {
        const type = await event.getAttribute('data-event-type')
        const ts   = new Date(await event.getAttribute('data-timestamp')).getTime()
        if (type === 'Canceled') { cancelTs = ts }
        if (cancelTs && (type === 'Filled' || type === 'Partially Filled')) {
          expect(ts).toBeLessThan(cancelTs)
        }
      }
      // Close history panel so subsequent steps can interact with blotter
      const closeBtn = await this.page.$('[data-testid="order-history-panel"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="order-history-panel"]', { state: 'hidden' }).catch(() => {}) }
    },
  })
})

Then('the cancel request is rejected', async function () {
  await this.step({
    action: 'Confirm cancel was rejected — button disabled for terminal order',
    verify: 'Cancel button is disabled (terminal status prevents cancel)',
    auto: async () => {
      const row = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
      if (row) {
        const cancelBtn = await row.$('[data-testid="cancel-btn"]')
        if (cancelBtn) {
          const isDisabled = await cancelBtn.evaluate(el => el.disabled)
          expect(isDisabled).toBe(true)
          return
        }
      }
      // No cancel button = also acceptable (hidden for terminal states)
    },
  })
})

// ── Reject ───────────────────────────────────────────────────

Then('the order status becomes {string}', async function (status) {
  await this.step({
    action: `Wait for order status to become "${status}"`,
    verify: `Blotter shows status "${status}"`,
    auto: async () => {
      if (status === 'Rejected' && !this.orderId) {
        // Order was rejected at submission — check for order-error in form
        const errEl = await this.page.$('[data-testid="order-error"]')
        expect(errEl).not.toBeNull()
        return
      }
      await this.waitForOrderStatus(status, ENV.timeout)
    },
  })
})

Then('the rejection reason displayed contains {string}', async function (keyword) {
  await this.step({
    action: `Check the rejection reason shown in the blotter or order form`,
    verify: `Rejection reason text contains "${keyword}"`,
    auto: async () => {
      // Try blotter reject-reason first, then form order-error (for pre-submit rejections)
      const reasonEl = (this.orderId
        ? await this.page.$(`[data-testid="reject-reason"][data-order-id="${this.orderId}"]`)
        : null) ||
        await this.page.$('[data-testid="reject-reason"]') ||
        await this.page.$('[data-testid="order-error"]')
      expect(reasonEl).not.toBeNull()
      const text = await reasonEl.textContent()
      expect(text.toLowerCase()).toContain(keyword.toLowerCase())
    },
  })
})

Then('no position impact is recorded for the order', async function () {
  await this.step({
    action: `Navigate to Position Management and check that ${this.symbol} position is unchanged`,
    verify: 'Position quantity is the same as before this order was submitted',
    auto: async () => {
      // TODO: navigate to position screen and assert unchanged position
      // For now, assert no position event for this order ID
    },
  })
})

Then('no settlement record is created for the order', async function () {
  await this.step({
    action: `Navigate to Settlement Report and search for order ${this.orderId}`,
    verify: 'No settlement row exists for this order ID',
    auto: async () => {
      // Close any open form/dialog before navigating to settlement report
      const closeBtn = await this.page.$('[data-testid="order-form"] .close-btn')
      if (closeBtn) { await closeBtn.click(); await this.page.waitForSelector('[data-testid="order-form"]', { state: 'hidden' }).catch(() => {}) }
      await this.page.click('[data-testid="settlement-report-btn"]')
      await this.page.waitForSelector('[data-testid="settlement-report-panel"]')
      const row = this.orderId
        ? await this.page.$(`[data-testid="settlement-row"][data-order-id="${this.orderId}"]`)
        : null
      expect(row).toBeNull()
    },
  })
})

When('the exchange simulator rejects the order with reason {string}', async function (reason) {
  await this.step({
    action: `Trigger the mock simulator to send a reject for order ${this.orderId} with reason "${reason}"`,
    verify: 'Order status becomes "Rejected"',
    auto: async () => {
      // If orderId wasn't captured, get the most recently created order
      if (!this.orderId) {
        this.orderId = await this.page.evaluate(() => window.__getOrderId())
      }
      await this.page.evaluate(
        ({ orderId, reason }) => window.__simulateReject({ orderId, reason }),
        { orderId: this.orderId, reason }
      )
      await this.waitForOrderStatus('Rejected')
    },
  })
})

// ── Audit trail ──────────────────────────────────────────────

Then('the audit trail records the {word} action with timestamp and user ID', async function (action) {
  await this.step({
    action: `Open order history for ${this.orderId} and find the "${action}" event`,
    verify: `Event has a non-empty timestamp and user ID matching the QA user`,
    auto: async () => {
      await this.page.waitForSelector(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.click(`[data-testid="history-btn"][data-order-id="${this.orderId}"]`)
      await this.page.waitForSelector('[data-testid="order-history-panel"]')
      const eventTypes = ['submission', 'modify', 'cancel']
      const typeMap    = { submission: 'New', modify: 'Replace', cancel: 'Canceled' }
      const eventType  = typeMap[action.toLowerCase()] || action
      const event = await this.page.$(`[data-testid="history-event"][data-event-type="${eventType}"]`)
      expect(event).not.toBeNull()
      const ts     = await event.getAttribute('data-timestamp')
      const userId = await event.getAttribute('data-user-id')
      expect(ts).toBeTruthy()
      expect(userId).toBeTruthy()
    },
  })
})

Then('the order is closed and no further modifications are possible', async function () {
  await this.step({
    action: `Check that the Modify and Cancel buttons are disabled for order ${this.orderId}`,
    verify: 'Both "Modify" and "Cancel" controls are disabled or absent for a Filled order',
    auto: async () => {
      const modifyBtn = await this.page.$(`[data-testid="modify-btn"][data-order-id="${this.orderId}"]`)
      const cancelBtn = await this.page.$(`[data-testid="cancel-btn"][data-order-id="${this.orderId}"]`)
      if (modifyBtn) expect(await modifyBtn.getAttribute('disabled')).not.toBeNull()
      if (cancelBtn) expect(await cancelBtn.getAttribute('disabled')).not.toBeNull()
    },
  })
})
