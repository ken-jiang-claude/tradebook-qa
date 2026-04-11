# TradeBook QA — QA Engineer Guide

**Version:** 1.0 | **Date:** April 2026  
**Repo:** https://github.com/ken-jiang-claude/tradebook-qa  
**Live UI:** https://tradebook-mock.onrender.com  
**Living Docs:** https://tradebook-docs.onrender.com

---

## Who This Guide Is For

This guide is for **technical QA engineers** responsible for implementing step definitions, running the test suite, and maintaining the automation framework.

If you are a Business QA writing Gherkin scenarios, see [USER_MANUAL.md](USER_MANUAL.md) instead.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | Included with Node |
| Git | Any | https://git-scm.com |

---

## Project Structure

```
tradebook-qa/
├── tradebook-mock/              # Vue 3 mock UI
│   ├── src/
│   │   ├── components/          # Blotter, panels, forms
│   │   ├── composables/         # useSimulator.js (window bridges)
│   │   ├── store/               # useStore.js (reactive state)
│   │   └── views/               # BlotterView, LoginView
│   └── vite.config.js
│
├── cucumber-tests/              # BDD test suite
│   ├── features/
│   │   ├── environment/         # Environment readiness scenarios
│   │   ├── lifecycle/           # 12 lifecycle feature files
│   │   └── edge_cases/          # 9 @known-issue edge case scenarios
│   ├── step_definitions/
│   │   ├── lifecycle/           # order, fill, position, settlement steps
│   │   ├── edge_cases/          # known-issue steps (intentional failures)
│   │   └── shared/              # common steps, missing steps
│   ├── support/
│   │   ├── world.js             # Cucumber World (browser + state)
│   │   ├── hooks.js             # Before/After hooks
│   │   └── manual.js            # Manual mode step runner
│   ├── config/env.js            # Environment config
│   ├── cucumber.js              # Profile definitions
│   └── scripts/
│       └── generate-report.js   # HTML report generator
│
├── .github/workflows/           # GitHub Actions CI
├── render.yaml                  # Render deployment config
└── reports/                     # Generated test output
```

---

## Initial Setup

```bash
# Clone the repo
git clone https://github.com/ken-jiang-claude/tradebook-qa.git
cd tradebook-qa

# Install test suite dependencies
cd cucumber-tests
npm install

# Install Playwright browsers
npx playwright install chromium

# Install mock UI dependencies
cd ../tradebook-mock
npm install
```

---

## Running the Mock UI

The test suite requires the mock UI to be running locally on port 4000.

```bash
cd tradebook-mock
npm run dev
```

The UI will be available at `http://localhost:4000`.

---

## Running Tests

All test commands are run from the `cucumber-tests/` directory.

| Command | What It Runs | Scenarios |
|---------|-------------|-----------|
| `npm run test:smoke` | Smoke profile — fast sanity check | 18 |
| `npm run test:lifecycle` | Full lifecycle suite | 56 |
| `npm run test:edge` | Edge case suite (@known-issue) | 9 |
| `npm run test:environment` | Environment readiness only | ~8 |
| `npm test` | Default profile (all features) | All |
| `npm run test:headed` | Full suite with visible browser | All |
| `npm run test:dry` | Dry run — checks step matching only | All |
| `npm run report` | Generate HTML report from last run | — |

---

## Test Profiles

Profiles are defined in [cucumber-tests/cucumber.js](cucumber-tests/cucumber.js).

| Profile | Tag Filter | Use Case |
|---------|-----------|----------|
| `smoke` | `@smoke` | Quick sanity after a change |
| `lifecycle` | `features/lifecycle/**` | Full order lifecycle regression |
| `edgeCases` | `@known-issue` | Intentional failure documentation |
| `environment` | `features/environment/**` | Environment readiness gate |
| `manual` | none (all) | Manual mode — no browser, prints instructions |
| `default` | all features | Complete run |

---

## Tags Reference

### All Tags Used in This Project

| Tag | Purpose | Where Applied |
|-----|---------|---------------|
| `@smoke` | Fast CI gate — 18 critical-path scenarios run on every push | Scenario-level |
| `@known-issue` | Intentional failure — documents an unsupported mock capability | Scenario-level |
| `@edge-case` | Boundary or resilience scenario | Scenario-level |
| `@session` | FIX session / connectivity scenarios | Scenario-level |
| `@race-condition` | Concurrent event scenarios | Scenario-level |
| `@multi-user` | Multi-session / permission scenarios | Scenario-level |
| `@batch` | Settlement or batch timing scenarios | Scenario-level |

### Feature-Level vs Scenario-Level

Tags at feature level are **inherited by all scenarios** in that file. Tags at scenario level apply only to that scenario.

```gherkin
@smoke                              ← every scenario in this file is @smoke
Feature: Order Lifecycle

  Scenario: Buy order submitted     ← also @smoke (inherited)

  @known-issue                      ← @smoke AND @known-issue
  Scenario: Order during disconnect
```

### Boolean Filtering

Run any combination using `and`, `or`, `not`:

```bash
cucumber-js --tags "@smoke"                        # smoke only
cucumber-js --tags "@smoke and @edge-case"         # must have both tags
cucumber-js --tags "@smoke or @lifecycle"          # either tag
cucumber-js --tags "not @known-issue"              # exclude known issues
cucumber-js --tags "@smoke and not @known-issue"   # smoke but not known issues
```

### Wiring a Tag to a Profile

To create a profile that runs a specific tag, add it to `cucumber-tests/cucumber.js`:

```js
export const myProfile = {
  ...default_,
  tags: '@my-tag',
}
```

Then run it with:

```bash
cucumber-js --profile myProfile
```

---

## Manual Mode

Manual mode prints step-by-step instructions to the terminal instead of driving a browser. Use this when automated execution is not possible.

```bash
npm run test:manual
```

Each step outputs what action to take manually and what to verify.

---

## Environment Configuration

Configuration is in [cucumber-tests/config/env.js](cucumber-tests/config/env.js) and driven by environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `TB_BASE_URL` | `http://localhost:4000` | Base URL of the mock UI |
| `TB_USERNAME` | `qa_user` | Login username |
| `TB_PASSWORD` | `qa_password` | Login password |
| `BROWSER` | `chromium` | Browser to use (`chromium`, `firefox`, `webkit`) |
| `HEADLESS` | `true` | Run headless (`true`) or with visible browser (`false`) |

Set these in a `.env` file in `cucumber-tests/` for local overrides.

---

## Generating the HTML Report

After running any test profile:

```bash
npm run report
```

This merges `reports/report.json` (lifecycle) and `reports/edge-report.json` (edge cases) into a single `reports/report.html`. Open it in a browser or push to GitHub to update the live docs site.

---

## Test Architecture

### Cucumber World (`support/world.js`)

Every scenario gets a fresh `TradeBookWorld` instance. It holds:
- `this.page` — Playwright page handle
- `this.orderId` — current order ID under test
- `this.symbol`, `this.side`, `this.orderQty`, `this.limitPrice` — order state
- `this.fillEvents[]` — fill history for the scenario
- `this.isManual` — `true` in manual mode (skips all Playwright calls)

Key helpers:
- `this.launchBrowser()` / `this.closeBrowser()` — called by Before/After hooks
- `this.waitForOrderStatus(status)` — polls the blotter row's `data-status` attribute
- `this.simulateFill({ qty, price, isFinal })` — triggers a fill via `window.__simulateFill`
- `this.seedPosition({ symbol, qty })` — pre-seeds a position via `window.__seedPosition`
- `this.screenshot(name)` — captures a screenshot on failure

### In-Page Simulator Bridges

The mock UI exposes these on `window` for Playwright to call via `page.evaluate()`:

| Bridge | What It Does |
|--------|-------------|
| `window.__simulateFill({ orderId, qty, price, isFinal })` | Triggers a fill execution |
| `window.__simulateReject({ orderId, reason })` | Rejects an open order |
| `window.__seedPosition({ symbol, qty, price })` | Seeds a starting position |
| `window.__injectRhubBreak({ orderId })` | Injects a RHUB reconciliation break |
| `window.__getOrderId()` | Returns the most recent order ID |

### Selector Conventions

| Pattern | Usage |
|---------|-------|
| `[data-testid="blotter-row"][data-order-id="${orderId}"]` | Target a specific order row |
| `[data-testid="blotter-row"][data-status="${status}"]` | Filter rows by status |
| `input[data-testid="qty-input"]` | Form inputs (always use `input[]` prefix) |
| `[data-field="status"]` | Status cell within a blotter row |
| `el.evaluate(el => el.disabled)` | Check disabled state (not `getAttribute`) |

---

## Understanding Edge Case Scenarios

The `features/edge_cases/13_edge_cases.feature` file contains 9 `@known-issue` scenarios that **intentionally fail**. They are living documentation of what the mock does not support.

Each step calls `notSupported()` which throws:

```
[KNOWN ISSUE] <reason why the mock cannot do this>
Fix needed:   <what would be required in production>
```

Cucumber reports these as **Undefined** (amber) in the HTML report. This is expected — the amber colour signals a known gap, not a broken test.

---

## Worked Example — Technical QA Implementation (Steps 3–7)

> **Steps 1–2 (writing the Gherkin and identifying undefined steps) are the Business QA's responsibility and are documented in [USER_MANUAL.md](USER_MANUAL.md).** Pick up from the feature file and undefined step list they provide.

**Goal:** Implement automation for — Sell order partially filled shows correct remaining quantity.

### Part B — Technical QA (Steps 3–7)

> Pick up from the feature file and undefined step list provided by the Business QA.

---

#### Step 3 — Implement the missing step definitions

Open `cucumber-tests/step_definitions/lifecycle/fill_steps.js` and add:

```js
Then('the remaining quantity should be {int}', async function (expectedRemaining) {
  if (this.isManual) {
    return this.step({
      action: `Verify remaining quantity shows ${expectedRemaining}`,
      verify: `Blotter row shows remaining qty = ${expectedRemaining}`,
    })
  }

  const remaining = await this.page.$eval(
    `[data-testid="blotter-row"][data-order-id="${this.orderId}"] [data-field="remaining-qty"]`,
    el => parseInt(el.textContent.trim(), 10)
  )
  expect(remaining).toBe(expectedRemaining)
})
```

Each new step must support dual-mode (automated + manual). See the [Test Architecture](#test-architecture) section for World helpers and selector conventions.

---

#### Step 4 — Run with a visible browser to watch it execute

```bash
HEADLESS=false npm run test:lifecycle -- --name "Sell order partially filled"
```

Watch the browser — you should see it log in, place the order, trigger the fill, and assert the blotter row values.

---

#### Step 5 — Run smoke regression to check for regressions

```bash
npm run test:smoke
```

All 18 smoke scenarios should still pass. If any fail, the new step has a side effect — investigate before proceeding.

---

#### Step 6 — Generate and review the report

```bash
npm run report
```

Open `reports/report.html` in a browser. The new scenario should appear green under the fills feature. Use the **Passed** filter button to confirm it is included.

---

#### Step 7 — Commit and push

```bash
git add cucumber-tests/features/lifecycle/05_fills.feature \
        cucumber-tests/step_definitions/lifecycle/fill_steps.js \
        cucumber-tests/reports/report.html
git commit -m "Add sell order partial fill remaining quantity scenario"
git push origin main
```

CI runs automatically. The living docs site at [tradebook-docs.onrender.com](https://tradebook-docs.onrender.com) updates within ~2 minutes.

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/cucumber-tests.yml`) runs on every push to `main`:

1. Checks out the repo
2. Installs Node 20 + dependencies
3. Builds the mock UI and serves it on port 4000
4. Waits for the UI to be ready (`wait-on`)
5. Runs the smoke profile
6. Generates the HTML report
7. Commits `report.html` back to `main` (triggers Render redeploy)
8. Uploads report and screenshots as artifacts

To trigger a specific profile manually: go to **GitHub → Actions → TradeBook QA → Run workflow** and select the profile.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Timeout waiting for selector` | Panel overlay blocking clicks | Close any open panels before interacting |
| `waitForOrderStatus` timeout | Status never updated | Check simulator was called; check `data-status` attribute in DevTools |
| `window.__simulateFill is not a function` | Mock UI not loaded | Ensure `http://localhost:4000` is running and `installSimulator()` ran on mount |
| Step defined but `Pending` | Wrong regex pattern | Run `npm run test:dry` and check the output |
| Report not updating | `report.json` is gitignored | Only `report.html` is published; re-run `npm run report` |
| Render site showing 404 | Cold start or failed deploy | Check Render deploy logs; wait 60s and refresh |
| `el.disabled` returns wrong value | Using `getAttribute('disabled')` | Use `el.evaluate(el => el.disabled)` instead |

---

## Contacts & Resources

| Resource | Link |
|----------|------|
| GitHub Repo | https://github.com/ken-jiang-claude/tradebook-qa |
| Live Blotter | https://tradebook-mock.onrender.com |
| Living Docs | https://tradebook-docs.onrender.com |
| Cucumber-js Docs | https://cucumber.io/docs/cucumber/ |
| Playwright Docs | https://playwright.dev/docs/intro |
| Render Dashboard | https://dashboard.render.com |
