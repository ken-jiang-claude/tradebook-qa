// ============================================================
//  support/world.js
//  Cucumber World — shared state and helpers for all steps.
//  Every scenario gets a fresh World instance.
// ============================================================
import { setWorldConstructor, World } from '@cucumber/cucumber'
import { chromium, firefox, webkit }  from 'playwright'
import { runStep }                    from './manual.js'
import ENV                            from '../config/env.js'

class TradeBookWorld extends World {
  constructor(options) {
    super(options)

    // ── Mode ────────────────────────────────────────────────
    // Set via worldParameters in cucumber.js profile
    this.isManual = (options.parameters?.mode === 'manual')

    // ── Playwright handles ──────────────────────────────────
    this.browser  = null   // Playwright Browser instance
    this.context  = null   // Browser context (one per scenario)
    this.page     = null   // Active page

    // ── Test state ──────────────────────────────────────────
    // Populated by step definitions and shared across steps
    this.orderId        = null   // current order ID
    this.clOrdId        = null   // FIX ClOrdID
    this.execId         = null   // last execution ID
    this.orderQty       = null   // submitted order quantity
    this.limitPrice     = null   // submitted limit price
    this.symbol         = null   // current test symbol
    this.side           = null   // Buy | Sell
    this.startPosition  = null   // position before test actions
    this.fillEvents     = []     // list of fill events in this scenario
    this.historyEvents  = []     // events captured from order history

    // ── Config shortcut ─────────────────────────────────────
    this.env = ENV
  }

  // ── Launch browser (called in Before hook) ───────────────
  async launchBrowser() {
    if (this.isManual) return  // no browser in manual mode

    const browsers = { chromium, firefox, webkit }
    const BrowserType = browsers[this.env.browser] || chromium

    this.browser = await BrowserType.launch({
      headless: this.env.headless,
      slowMo:   this.env.slowMo,
    })

    this.context = await this.browser.newContext({
      viewport:          { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    })

    this.page = await this.context.newPage()
    this.page.setDefaultTimeout(this.env.timeout)
  }

  // ── Close browser (called in After hook) ─────────────────
  async closeBrowser() {
    if (this.isManual) return
    if (this.context) await this.context.close()
    if (this.browser) await this.browser.close()
  }

  // ── Screenshot helper (called on failure) ────────────────
  async screenshot(name) {
    if (this.isManual || !this.page) return
    try {
      const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const path = `reports/screenshots/${name}-${ts}.png`
      await this.page.screenshot({ path, fullPage: true })
      return path
    } catch {
      // screenshot failed — don't block the report
    }
  }

  // ── Dual-mode step runner ────────────────────────────────
  // Use this in every step definition for manual/auto support
  async step(options) {
    return runStep(this, options)
  }

  // ── Wait for blotter row to show expected status ──────────
  async waitForOrderStatus(expectedStatus, timeoutMs = 8000) {
    if (this.isManual) return

    await this.page.waitForFunction(
      ({ orderId, status }) => {
        const row = document.querySelector(`[data-testid="blotter-row"][data-order-id="${orderId}"]`)
        if (!row) return false
        // Use data-status attribute (most reliable — not affected by nested elements)
        const dataStatus = row.getAttribute('data-status')
        if (dataStatus === status) return true
        // Fallback: textContent of the status cell (trim and check startsWith to handle nested spans)
        const cell = row.querySelector('[data-field="status"]')
        if (!cell) return false
        const text = cell.textContent?.trim() || ''
        return text === status || text.startsWith(status)
      },
      { orderId: this.orderId, status: expectedStatus },
      { timeout: timeoutMs }
    )
  }

  // ── Get blotter field value for current order ─────────────
  async getBlotterField(fieldName) {
    if (this.isManual) return null
    const cell = await this.page.$(`[data-testid="blotter-row"][data-order-id="${this.orderId}"] [data-field="${fieldName}"]`)
    return cell ? (await cell.textContent()).trim() : null
  }

  // ── Simulator helper: trigger a fill via window.__simulateFill ──
  // Calls the mock TradeBook UI's in-page simulator function
  async simulateFill({ qty, price, isFinal = false }) {
    if (this.isManual) return

    const result = await this.page.evaluate(
      ({ orderId, qty, price, isFinal }) => window.__simulateFill({ orderId, qty, price, isFinal }),
      { orderId: this.orderId, qty, price, isFinal }
    )

    if (result && result.execId) {
      this.execId = result.execId
      this.fillEvents.push({ qty, price, execId: result.execId })
    }
    return result
  }

  // ── Seed position directly (no order required) ───────────────
  async seedPosition({ symbol, qty, price = 150.00 }) {
    if (this.isManual) return
    await this.page.evaluate(
      ({ symbol, qty, price }) => window.__seedPosition({ symbol, qty, price }),
      { symbol, qty, price }
    )
  }
}

setWorldConstructor(TradeBookWorld)
