# BDD Automation Framework — Bootstrap Guide

**Based on:** TradeBook QA (Cucumber-js + Playwright)  
**Goal:** Help a QA engineer build a similar framework from scratch for any web application.

---

## Why This Stack?

Before writing a single line of code, understand the reasoning behind each technology choice:

| Choice | Why |
|--------|-----|
| **Cucumber-js** | Gherkin scenarios serve as living requirements — non-technical stakeholders can read and sign off on test coverage |
| **Playwright** | Faster and more reliable than Selenium; native support for multiple browsers, auto-wait, and network interception |
| **Node.js / ESM** | Same language as the UI under test; no context switching; native ES modules keep imports clean |
| **cucumber-html-reporter** | Generates readable HTML reports from Cucumber JSON output without a separate test management tool |
| **GitHub Actions + Render** | Free CI/CD and hosting for a portfolio or small team — zero infrastructure cost |

Alternatives considered and why they were not chosen:

| Alternative | Reason not chosen |
|-------------|------------------|
| Cypress | Lacks native Cucumber/Gherkin integration; harder to separate test logic from UI mechanics |
| WebDriverIO | More configuration overhead; Playwright has overtaken it in reliability |
| Jest + Puppeteer | No Gherkin support; tests become code-centric, not business-readable |
| TestCafe | Smaller community; less Playwright-level browser control |

---

## Step 1 — Define Your Project Structure

Separate the application under test from the test suite. This keeps each deployable independently:

```
my-project/
├── my-app/                  # The application under test (Vue, React, etc.)
│   └── src/
│
├── cucumber-tests/          # The BDD test suite
│   ├── features/            # Gherkin .feature files
│   ├── step_definitions/    # Playwright step implementations
│   ├── support/             # World, hooks, helpers
│   ├── config/              # Environment config
│   ├── scripts/             # Report generator
│   └── reports/             # Generated output (gitignored except report.html)
│
├── .github/workflows/       # CI pipeline
└── render.yaml              # Deployment config (if using Render)
```

**Key principle:** Feature files describe *what* to test. Step definitions describe *how* to test it. Keep them in separate directories so a Business QA can navigate feature files without seeing code.

---

## Step 2 — Initialise the Test Suite

```bash
mkdir cucumber-tests && cd cucumber-tests
npm init -y
```

Edit `package.json` to use ESM:

```json
{
  "type": "module",
  "scripts": {
    "test": "cucumber-js --profile default",
    "test:smoke": "cucumber-js --profile smoke",
    "test:dry": "cucumber-js --dry-run",
    "report": "node scripts/generate-report.js"
  }
}
```

Install dependencies:

```bash
npm install --save-dev @cucumber/cucumber playwright dotenv chalk cucumber-html-reporter
npx playwright install chromium
```

---

## Step 3 — Design the Cucumber World

The World is the shared context for every scenario. Every step definition accesses it via `this`. Design it before writing any steps — it determines what state is available throughout the suite.

Create `support/world.js`:

```js
import { setWorldConstructor, World } from '@cucumber/cucumber'
import { chromium, firefox, webkit } from 'playwright'
import { env } from '../config/env.js'

class AppWorld extends World {
  constructor(options) {
    super(options)
    this.env = env
    this.browser = null
    this.page = null
    this.isManual = env.isManual

    // Add your domain-specific state here
    // e.g. this.orderId, this.userId, this.sessionToken
  }

  async launchBrowser() {
    const browserType = { chromium, firefox, webkit }[this.env.browser] || chromium
    this.browser = await browserType.launch({ headless: this.env.headless })
    const context = await this.browser.newContext()
    this.page = await context.newPage()
    this.page.setDefaultTimeout(this.env.timeout)
  }

  async closeBrowser() {
    if (this.browser) await this.browser.close()
  }

  async screenshot(name) {
    if (!this.page) return null
    const path = `reports/screenshots/${name}_${Date.now()}.png`
    await this.page.screenshot({ path, fullPage: true })
    return path
  }
}

setWorldConstructor(AppWorld)
```

**Key design decisions:**
- Keep `this.env` on World so every step has access to base URL, credentials, and settings without importing config directly
- Add domain state (`orderId`, `userId` etc.) as World properties — never use global variables
- `isManual` flag enables dual-mode support (see Step 6)

---

## Step 4 — Set Up Hooks

Hooks control browser lifecycle and failure capture. Create `support/hooks.js`:

```js
import { Before, After, AfterStep, BeforeAll, Status, setDefaultTimeout } from '@cucumber/cucumber'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'

setDefaultTimeout(30_000)

BeforeAll(async function () {
  await mkdir('reports/screenshots', { recursive: true })
})

Before(async function (scenario) {
  if (this.isManual) return
  await this.launchBrowser()
})

AfterStep(async function (step) {
  if (this.isManual) return
  if (step.result?.status === 'FAILED') {
    const path = await this.screenshot(`FAIL_${step.pickleStep?.text?.slice(0, 40)}`)
    if (path && existsSync(path)) {
      const img = await readFile(path)
      await this.attach(img, 'image/png')
    }
    if (step.result?.message) {
      await this.attach(`ERROR: ${step.result.message}`, 'text/plain')
    }
  }
})

After(async function () {
  await this.closeBrowser()
})
```

**Why capture screenshots in AfterStep, not just After?**
AfterStep fires immediately after the failing step, capturing the UI at the exact moment of failure. After fires after the scenario — the page may have changed by then.

---

## Step 5 — Environment Configuration

Never hardcode URLs or credentials. Create `config/env.js`:

```js
import 'dotenv/config'

export const env = {
  baseUrl:   process.env.APP_BASE_URL  || 'http://localhost:3000',
  username:  process.env.APP_USERNAME  || 'test_user',
  password:  process.env.APP_PASSWORD  || 'test_password',
  browser:   process.env.BROWSER       || 'chromium',
  headless:  process.env.HEADLESS      !== 'false',
  timeout:   Number(process.env.DEFAULT_TIMEOUT) || 20000,
  isManual:  process.env.TEST_MODE     === 'manual',
}
```

Create `.env` for local values (never commit this):

```
APP_BASE_URL=http://localhost:3000
APP_USERNAME=test_user
APP_PASSWORD=test_password
HEADLESS=true
```

Add to `.gitignore`:

```
.env
reports/screenshots/
reports/*.json
node_modules/
```

---

## Step 6 — Write Feature Files

Organise by feature area, not by test type. Name files with a numeric prefix to control execution order:

```
features/
├── environment/
│   └── 01_readiness.feature
├── lifecycle/
│   ├── 02_login.feature
│   ├── 03_create_order.feature
│   └── 04_cancel_order.feature
└── edge_cases/
    └── 05_edge_cases.feature
```

Example feature file:

```gherkin
Feature: Order Creation
  As a trader
  I want to submit a new buy order
  So that it appears in the blotter for tracking

  @smoke
  Scenario: Valid buy order appears in blotter with status New
    Given the trader is logged in
    When a buy order for 100 shares of AAPL at 150.00 is submitted
    Then the order appears in the blotter with status "New"
    And the order ID is captured for downstream checks
```

**Naming rules:**
- Scenario names should read as business requirements, not test cases
- Use concrete values (`100 shares of AAPL at 150.00`) not vague placeholders (`some shares of some symbol`)
- Tag `@smoke` on the critical-path scenarios — aim for 20–30% of total count

---

## Step 7 — Implement Step Definitions with Dual-Mode Support

Dual-mode means every step works both in automated mode (Playwright) and manual mode (prints instructions). This makes the suite usable in environments where a browser cannot be launched.

Create `step_definitions/login_steps.js`:

```js
import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

Given('the trader is logged in', async function () {
  if (this.isManual) {
    console.log('ACTION: Open the app and log in with your QA credentials')
    console.log('VERIFY: You are on the main dashboard')
    return
  }

  await this.page.goto(this.env.baseUrl)
  await this.page.fill('input[data-testid="username"]', this.env.username)
  await this.page.fill('input[data-testid="password"]', this.env.password)
  await this.page.click('[data-testid="login-submit"]')
  await this.page.waitForURL('**/dashboard')
})

Then('the order appears in the blotter with status {string}', async function (status) {
  if (this.isManual) {
    console.log(`VERIFY: Blotter shows the order with status "${status}"`)
    return
  }

  const row = this.page.locator(`[data-testid="blotter-row"][data-order-id="${this.orderId}"]`)
  await expect(row).toHaveAttribute('data-status', status)
})
```

**Selector conventions:**
- Always use `data-testid` attributes — never CSS classes or XPath (they break on UI changes)
- Use `data-status` attributes for state checks — never `textContent` (nested elements make it unreliable)
- Use `input[data-testid="..."]` for form inputs — the `input` prefix ensures you target the field, not a wrapper

---

## Step 8 — Configure Cucumber Profiles

Profiles let you run different subsets of the suite with a single command. Create `cucumber.js`:

```js
const stepFiles = [
  'step_definitions/**/*.js',
  'support/world.js',
  'support/hooks.js',
]

export const default_ = {
  paths:        ['features/**/*.feature'],
  import:       stepFiles,
  format:       ['progress-bar', 'json:reports/report.json'],
  publishQuiet: true,
}

export const smoke = {
  ...default_,
  tags:   '@smoke',
  format: ['progress-bar', 'json:reports/report.json'],
}

export const manual = {
  ...default_,
  worldParameters: { isManual: true },
}
```

---

## Step 9 — Set Up Report Generation

Create `scripts/generate-report.js`:

```js
import reporter from 'cucumber-html-reporter'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jsonFile  = resolve(__dirname, '../reports/report.json')
const outputHtml = resolve(__dirname, '../reports/report.html')

if (!existsSync(jsonFile)) {
  console.error('No report JSON found. Run tests first.')
  process.exit(1)
}

reporter.generate({
  theme:                  'bootstrap',
  jsonFile,
  output:                 outputHtml,
  reportSuiteAsScenarios: true,
  launchReport:           false,
  metadata: {
    'Project':     'My Project',
    'Executed':    new Date().toISOString().split('T')[0],
    'Browser':     process.env.BROWSER || 'chromium',
  },
})

console.log('Report generated → reports/report.html')
```

---

## Step 10 — Wire Up CI/CD

Create `.github/workflows/tests.yml`:

```yaml
name: BDD Test Suite

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install app dependencies
        run: npm install
        working-directory: my-app

      - name: Build and serve app
        run: npm run build && npx vite preview --port 3000 &
        working-directory: my-app

      - name: Install test dependencies
        run: npm install && npx playwright install chromium
        working-directory: cucumber-tests

      - name: Wait for app to be ready
        run: npx wait-on http://localhost:3000 --timeout 60000
        working-directory: cucumber-tests

      - name: Run smoke tests
        run: npm run test:smoke
        working-directory: cucumber-tests
        env:
          APP_BASE_URL: http://localhost:3000
          HEADLESS: true

      - name: Generate report
        run: npm run report
        working-directory: cucumber-tests

      - name: Commit report
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add cucumber-tests/reports/report.html
          git diff --staged --quiet || git commit -m "ci: update test report [skip ci]"
          git push
```

---

## Step 11 — Deploy Living Docs to Render

Create `render.yaml` at the repo root:

```yaml
services:
  - type: web
    name: my-app
    runtime: static
    buildCommand: cd my-app && npm install && npm run build
    staticPublishPath: my-app/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  - type: web
    name: my-docs
    runtime: static
    buildCommand: mkdir -p public && cp cucumber-tests/reports/report.html public/index.html
    staticPublishPath: public
```

---

## Key Architectural Decisions Summary

| Decision | What | Why |
|----------|------|-----|
| World as single shared context | All state on `this` | Avoids globals; each scenario gets a fresh isolated instance |
| AfterStep screenshots | Capture on step failure, not scenario failure | UI state at the exact failing step, not after cleanup |
| `data-testid` selectors | All selectors use test IDs | Decoupled from CSS and layout changes |
| `data-status` for state | Status read from attribute, not text | Nested spans make textContent unreliable |
| Dual-mode support | Every step has manual fallback | Suite runs in locked-down environments with no browser access |
| Profile-based execution | `smoke`, `lifecycle`, `manual` profiles | Fast gate (smoke) vs full regression without changing commands |
| JSON merge before HTML report | Merge multiple JSON files before generating | Multiple test profiles produce separate JSON; one unified report |
| ESM throughout | `"type": "module"` in package.json | Clean imports; required for top-level await; aligns with modern Node |
