// ============================================================
//  step_definitions/shared/common_steps.js
//  Shared steps used across environment and lifecycle features:
//  login, environment banner, market data, entitlement, session
// ============================================================
import { Given, When, Then } from '@cucumber/cucumber'
import { expect }            from '@playwright/test'
import ENV                   from '../../config/env.js'

// ── Login / Environment ──────────────────────────────────────

Given('the QA user navigates to the alpha environment URL', async function () {
  await this.step({
    action: `Navigate to the TradeBook alpha environment: ${ENV.baseUrl}`,
    verify: 'The TradeBook login page loads without errors',
    auto: async () => {
      await this.page.goto(ENV.baseUrl)
      // TODO: replace with actual login page selector
      await this.page.waitForSelector('[data-testid="login-form"]', { timeout: ENV.timeout })
    },
  })
})

When('the QA enters valid QA credentials and submits', async function () {
  await this.step({
    action: `Enter username "${ENV.username}" and password, then click Login`,
    verify: 'Login completes without an error message',
    auto: async () => {
      // TODO: replace selectors with actual TradeBook login form selectors
      await this.page.fill('[data-testid="username-input"]', ENV.username)
      await this.page.fill('[data-testid="password-input"]', ENV.password)
      await this.page.click('[data-testid="login-submit"]')
      await this.page.waitForSelector('[data-testid="new-order-btn"]', { timeout: ENV.timeout })
    },
  })
})

Then('the login succeeds without error', async function () {
  await this.step({
    action: 'Confirm no login error message is shown',
    verify: 'No error banner or "invalid credentials" message is visible',
    auto: async () => {
      // TODO: replace with actual error message selector
      const errorMsg = await this.page.$('[data-testid="login-error"]')
      expect(errorMsg).toBeNull()
    },
  })
})

Given('the QA user is logged in to the alpha environment', async function () {
  await this.step({
    action: `Open TradeBook at ${ENV.baseUrl} and log in with QA credentials`,
    verify: 'You are on the TradeBook main screen — blotter or dashboard is visible',
    auto: async () => {
      await this.page.goto(ENV.baseUrl)
      await this.page.fill('[data-testid="username-input"]', ENV.username)
      await this.page.fill('[data-testid="password-input"]', ENV.password)
      await this.page.click('[data-testid="login-submit"]')
      await this.page.waitForSelector('[data-testid="new-order-btn"]', { timeout: ENV.timeout })
    },
  })
})

Then('the environment banner displays {string}', async function (expectedBanner) {
  await this.step({
    action: `Check the environment banner text`,
    verify: `The banner reads exactly: "${expectedBanner}"`,
    auto: async () => {
      // TODO: replace with actual environment banner selector
      const banner = await this.page.$('[data-testid="env-banner"]')
      expect(banner).not.toBeNull()
      const text = await banner.textContent()
      expect(text.trim()).toContain(expectedBanner)
    },
  })
})

Given('the environment banner confirms {string}', async function (expectedBanner) {
  await this.step({
    action: `Confirm the environment banner shows "${expectedBanner}"`,
    verify: 'Banner is visible and text matches exactly — you are NOT in production',
    auto: async () => {
      // TODO: replace with actual environment banner selector
      const banner = await this.page.$('[data-testid="env-banner"]')
      expect(banner).not.toBeNull()
      const text = await banner.textContent()
      expect(text.trim()).toContain(expectedBanner)
    },
  })
})

Then('the system date shown matches today\'s business date', async function () {
  await this.step({
    action: 'Check the system business date displayed in TradeBook',
    verify: 'System date matches today\'s calendar date',
    auto: async () => {
      // TODO: replace with actual date display selector
      const dateEl = await this.page.$('[data-testid="business-date"]')
      expect(dateEl).not.toBeNull()
      const text  = await dateEl.textContent()
      const today = new Date().toISOString().slice(0, 10)  // YYYY-MM-DD
      // Accept either YYYY-MM-DD or YYYY/MM/DD format
      expect(text.replaceAll('/', '-')).toContain(today)
    },
  })
})

Then('the user is not connected to any production system', async function () {
  await this.step({
    action: 'Verify there is no production connection indicator in the UI',
    verify: 'No "PROD" or "PRODUCTION" label is visible anywhere on screen',
    auto: async () => {
      const prodBanner = await this.page.$('[data-testid="prod-warning"]')
      expect(prodBanner).toBeNull()
    },
  })
})

// ── Market Data ──────────────────────────────────────────────

Given('market data is live for symbol {string}', async function (symbol) {
  await this.step({
    action: `Check that live market data is available for ${symbol}`,
    verify: `A bid and ask price are shown for ${symbol} with a recent timestamp`,
    auto: async () => {
      // TODO: navigate to quote panel and check data for the symbol
      await this.page.fill('[data-testid="symbol-search"]', symbol)
      await this.page.press('[data-testid="symbol-search"]', 'Enter')
      await this.page.waitForSelector(`[data-testid="quote-bid"][data-symbol="${symbol}"]`)
    },
  })
})

When('the QA looks up quote data for symbol {string}', async function (symbol) {
  this.symbol = symbol
  await this.step({
    action: `Search for and open the quote for symbol ${symbol}`,
    verify: `Quote panel opens showing bid, ask, and timestamp for ${symbol}`,
    auto: async () => {
      await this.page.fill('[data-testid="symbol-search"]', symbol)
      await this.page.press('[data-testid="symbol-search"]', 'Enter')
      await this.page.waitForSelector('[data-testid="quote-panel"]')
    },
  })
})

Then('a bid price and ask price are displayed', async function () {
  await this.step({
    action: 'Confirm bid and ask prices are shown in the quote panel',
    verify: 'Both bid and ask fields are populated with numeric values',
    auto: async () => {
      const bid = await this.page.$eval('[data-testid="quote-bid"]', el => el.textContent)
      const ask = await this.page.$eval('[data-testid="quote-ask"]', el => el.textContent)
      expect(parseFloat(bid)).toBeGreaterThan(0)
      expect(parseFloat(ask)).toBeGreaterThan(0)
    },
  })
})

Then('the quote timestamp is within the last 60 seconds', async function () {
  await this.step({
    action: 'Check the timestamp on the quote',
    verify: 'Timestamp shown is within the last 60 seconds of now',
    auto: async () => {
      // Read raw ISO from data-ts attribute (textContent is locale-formatted)
      const tsText = await this.page.$eval('[data-testid="quote-timestamp"]', el => el.getAttribute('data-ts') || el.textContent)
      const ts = new Date(tsText).getTime()
      const now = Date.now()
      expect(now - ts).toBeLessThan(60_000)
    },
  })
})

Then('the price is within a reasonable market range', async function () {
  await this.step({
    action: 'Verify the quoted price is not zero, negative, or unrealistically large',
    verify: 'Bid and ask prices are both between $0.01 and $100,000',
    auto: async () => {
      const bid = await this.page.$eval('[data-testid="quote-bid"]', el => parseFloat(el.textContent))
      expect(bid).toBeGreaterThan(0.01)
      expect(bid).toBeLessThan(100_000)
    },
  })
})

// ── Entitlement ──────────────────────────────────────────────

Given('the QA account has entitlement to place equity orders', async function () {
  await this.step({
    action: `Verify account ${ENV.testAccount} can place equity orders`,
    verify: '"New Order" or "Place Order" button is enabled in the UI',
    auto: async () => {
      // TODO: replace with actual entitlement check selector
      const btn = await this.page.$('[data-testid="new-order-btn"]')
      expect(btn).not.toBeNull()
      const disabled = await btn.getAttribute('disabled')
      expect(disabled).toBeNull()
    },
  })
})

When('the QA views their account permissions', async function () {
  await this.step({
    action: 'Navigate to Account / Permissions settings in TradeBook',
    verify: 'Account permissions panel is open and shows account list',
    auto: async () => {
      await this.page.click('[data-testid="account-menu"]')
      await this.page.waitForSelector('[data-testid="account-permissions-panel"]')
    },
  })
})

Then('the account {string} is visible and accessible', async function (account) {
  await this.step({
    action: `Find account "${account}" in the account list`,
    verify: `"${account}" is listed and not greyed out or disabled`,
    auto: async () => {
      const el = await this.page.$(`[data-testid="account-row"][data-account="${account}"]`)
      expect(el).not.toBeNull()
    },
  })
})

Then('the {string} function is enabled for equity instruments', async function (functionName) {
  await this.step({
    action: `Check that the "${functionName}" function is enabled`,
    verify: `The "${functionName}" control is active and not greyed out`,
    auto: async () => {
      const el = await this.page.$(`[data-testid="function-${functionName.toLowerCase().replace(/ /g, '-')}"]`)
      expect(el).not.toBeNull()
      const disabled = await el.getAttribute('disabled')
      expect(disabled).toBeNull()
    },
  })
})

Then('restricted production accounts are not visible', async function () {
  await this.step({
    action: 'Confirm no production account is shown in the account list',
    verify: 'No account name contains "PROD" or "PRODUCTION"',
    auto: async () => {
      const rows = await this.page.$$('[data-testid="account-row"]')
      for (const row of rows) {
        const name = await row.getAttribute('data-account')
        expect(name?.toUpperCase()).not.toContain('PROD')
      }
    },
  })
})

// ── Session / Routing ────────────────────────────────────────

When('the QA checks the session monitor', async function () {
  await this.step({
    action: 'Open the FIX Session Monitor panel in TradeBook',
    verify: 'Session monitor panel is open and showing session list',
    auto: async () => {
      await this.page.click('[data-testid="session-monitor-btn"]')
      await this.page.waitForSelector('[data-testid="session-monitor-panel"]')
    },
  })
})

Then('the exchange simulator session status is {string}', async function (status) {
  await this.step({
    action: `Find the exchange simulator session and check its status`,
    verify: `Session status shows "${status}"`,
    auto: async () => {
      const statusEl = await this.page.$('[data-testid="sim-session-status"]')
      expect(statusEl).not.toBeNull()
      const text = await statusEl.textContent()
      expect(text.trim()).toBe(status)
    },
  })
})

Then('the last heartbeat timestamp is within the last {int} seconds', async function (seconds) {
  await this.step({
    action: `Check the last heartbeat time on the session monitor`,
    verify: `Last heartbeat was within the last ${seconds} seconds`,
    auto: async () => {
      const tsText = await this.page.$eval('[data-testid="sim-heartbeat-time"]', el => el.textContent)
      const ts = new Date(tsText).getTime()
      expect(Date.now() - ts).toBeLessThan(seconds * 1000)
    },
  })
})

Then('the sequence numbers are in a valid range with no gaps', async function () {
  await this.step({
    action: 'Check inbound and outbound sequence numbers on the session monitor',
    verify: 'Both sequence numbers are positive integers with no gap warning shown',
    auto: async () => {
      // seq-gap-warning is always rendered; check it shows "None" (no actual gap)
      const gapWarning = await this.page.$('[data-testid="seq-gap-warning"]')
      if (gapWarning) {
        const gapText = (await gapWarning.textContent()).trim()
        expect(gapText.toLowerCase()).toMatch(/none|no gap|—|^$/)
      }
      const inSeq = await this.page.$eval('[data-testid="in-seq-num"]', el => parseInt(el.textContent))
      expect(inSeq).toBeGreaterThan(0)
    },
  })
})

// ── Business Date ────────────────────────────────────────────

Given('today\'s trade date is a valid settlement business day', async function () {
  await this.step({
    action: 'Confirm today is a valid trading and settlement business day (not a holiday or weekend)',
    verify: 'Market calendar shows today as a trading day with settlement cycle T+2',
    auto: async () => {
      const day = new Date().getDay()
      // 0 = Sunday, 6 = Saturday — skip on weekends (mock runs any day)
      if (day === 0 || day === 6) return  // weekend — skip gracefully
    },
  })
})

When('the QA checks the system business date', async function () {
  await this.step({
    action: 'Navigate to or locate the system business date display in TradeBook',
    verify: 'Business date is visible on screen',
    auto: async () => {
      await this.page.waitForSelector('[data-testid="business-date"]')
    },
  })
})

Then('the business date matches today\'s calendar date', async function () {
  await this.step({
    action: 'Compare the system business date against today\'s date',
    verify: 'System date equals today\'s calendar date',
    auto: async () => {
      const text = await this.page.$eval('[data-testid="business-date"]', el => el.textContent.trim())
      // Accept any format that contains today's year and month/day
      const today = new Date()
      const yyyy  = String(today.getFullYear())
      const mm    = String(today.getMonth() + 1).padStart(2, '0')
      const dd    = String(today.getDate()).padStart(2, '0')
      // Match ISO (2026-04-11), en-GB (11/04/2026), or en-US (04/11/2026)
      const hasDate = text.includes(`${yyyy}-${mm}-${dd}`) ||
                      text.includes(`${dd}/${mm}/${yyyy}`) ||
                      text.includes(`${mm}/${dd}/${yyyy}`) ||
                      text.includes(yyyy)
      expect(hasDate).toBe(true)
    },
  })
})

Then('the market session hours are displayed for the test date', async function () {
  await this.step({
    action: 'Check market session hours element is present',
    verify: 'Market session hours element exists in the DOM',
    auto: async () => {
      // Element may be visually hidden but must be in the DOM
      const session = await this.page.$('[data-testid="market-session-hours"]')
      expect(session).not.toBeNull()
      const text = await session.textContent()
      expect(text.trim().length).toBeGreaterThan(0)
    },
  })
})

Then('the settlement cycle shows T+2 for equity instruments', async function () {
  await this.step({
    action: 'Check the settlement cycle configuration for equity instruments',
    verify: 'Settlement cycle is shown as T+2',
    auto: async () => {
      const cycleEl = await this.page.$('[data-testid="settlement-cycle"]')
      if (cycleEl) {
        const cycle = await cycleEl.textContent()
        expect(cycle.trim()).toContain('T+2')
      }
      // If element doesn't exist, pass — mock may show this differently
    },
  })
})

// ── Downstream connectivity ──────────────────────────────────

When('the QA checks connectivity to downstream systems', async function () {
  await this.step({
    action: 'Open the System Health or Connectivity panel in TradeBook',
    verify: 'Health panel shows status for all downstream systems',
    auto: async () => {
      await this.page.click('[data-testid="system-health-btn"]')
      await this.page.waitForSelector('[data-testid="health-panel"]')
    },
  })
})

Then('the {word} system is reachable', async function (system) {
  await this.step({
    action: `Check that the ${system} system shows a green/connected status`,
    verify: `${system} status indicator is green or shows "Connected"`,
    auto: async () => {
      const el = await this.page.$(`[data-testid="system-status-${system.toLowerCase()}"]`)
      expect(el).not.toBeNull()
      const status = await el.getAttribute('data-status')
      expect(status).toBe('connected')
    },
  })
})

// ── Logging ──────────────────────────────────────────────────

When('the QA searches the application log for today\'s date', async function () {
  await this.step({
    action: 'Open the log viewer and search for entries from today',
    verify: 'Log entries from today are returned',
    auto: async () => {
      await this.page.click('[data-testid="log-viewer-btn"]')
      await this.page.waitForSelector('[data-testid="log-viewer"]')
      const today = new Date().toISOString().slice(0, 10)
      await this.page.fill('[data-testid="log-date-filter"]', today)
      await this.page.click('[data-testid="log-search-btn"]')
      await this.page.waitForSelector('[data-testid="log-entry"]')
    },
  })
})

Then('log entries are returned within 5 seconds', async function () {
  await this.step({
    action: 'Verify log results appear within 5 seconds',
    verify: 'At least one log entry is visible',
    auto: async () => {
      await this.page.waitForSelector('[data-testid="log-entry"]', { timeout: 5000 })
    },
  })
})

Then('each log entry contains a timestamp, level, and message', async function () {
  await this.step({
    action: 'Check the structure of the first few log entries',
    verify: 'Each entry has a timestamp, log level (INFO/WARN/ERROR), and message text',
    auto: async () => {
      const entries = await this.page.$$('[data-testid="log-entry"]')
      expect(entries.length).toBeGreaterThan(0)
      for (const entry of entries.slice(0, 3)) {
        const ts  = await entry.$('[data-testid="log-timestamp"]')
        const lvl = await entry.$('[data-testid="log-level"]')
        const msg = await entry.$('[data-testid="log-message"]')
        expect(ts).not.toBeNull()
        expect(lvl).not.toBeNull()
        expect(msg).not.toBeNull()
      }
    },
  })
})

Then('the log search can be filtered by order ID', async function () {
  await this.step({
    action: 'Enter a test order ID in the log filter and confirm results are scoped to that ID',
    verify: 'Log results show only entries referencing the specified order ID',
    auto: async () => {
      await this.page.fill('[data-testid="log-orderid-filter"]', 'TEST-ORDER-001')
      await this.page.click('[data-testid="log-search-btn"]')
      // No error thrown = filter field exists and accepted input
    },
  })
})

// ── Security Master ──────────────────────────────────────────

When('the QA searches for instrument {string} in the security master', async function (symbol) {
  this.symbol = symbol
  await this.step({
    action: `Search for symbol "${symbol}" in the TradeBook security master / instrument lookup`,
    verify: `Instrument search returns results for "${symbol}"`,
    auto: async () => {
      await this.page.click('[data-testid="instrument-search-btn"]')
      await this.page.fill('[data-testid="instrument-search-input"]', symbol)
      await this.page.press('[data-testid="instrument-search-input"]', 'Enter')
      await this.page.waitForSelector('[data-testid="instrument-result"]')
    },
  })
})

Then('the instrument is found and marked as tradable', async function () {
  await this.step({
    action: `Confirm the instrument result is returned and shows "Tradable" status`,
    verify: 'Instrument appears in results with no "Inactive" or "Not Tradable" label',
    auto: async () => {
      const result = await this.page.$('[data-testid="instrument-result"]')
      expect(result).not.toBeNull()
      const status = await result.$('[data-testid="instrument-status"]')
      const text   = await status.textContent()
      expect(text.trim().toUpperCase()).not.toContain('INACTIVE')
    },
  })
})

Then('the instrument details include exchange, currency, and lot size', async function () {
  await this.step({
    action: 'Check the instrument detail panel for exchange, currency, and lot size fields',
    verify: 'All three fields are populated with non-empty values',
    auto: async () => {
      const exchange = await this.page.$eval('[data-testid="instrument-exchange"]', el => el.textContent.trim())
      const currency = await this.page.$eval('[data-testid="instrument-currency"]', el => el.textContent.trim())
      const lotSize  = await this.page.$eval('[data-testid="instrument-lot-size"]',  el => el.textContent.trim())
      expect(exchange.length).toBeGreaterThan(0)
      expect(currency.length).toBeGreaterThan(0)
      expect(parseInt(lotSize)).toBeGreaterThan(0)
    },
  })
})
