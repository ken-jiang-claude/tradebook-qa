# TradeBook QA — User Manual

**Version:** 1.0 | **Date:** April 2026  
**Live UI:** https://tradebook-mock.onrender.com  
**Living Docs:** https://tradebook-docs.onrender.com  
**Repo:** https://github.com/ken-jiang-claude/tradebook-qa

---

## Who This Manual Is For

This manual has two audiences:

- **QA Engineers** (with some technical background) — running, maintaining, and extending the automated test suite
- **Non-technical stakeholders** — navigating the Blotter UI to observe order workflows and understand test coverage

If you are a stakeholder, start with [Part A](#part-a--blotter-ui-guide-for-stakeholders).  
If you are a QA engineer, start with [Part B](#part-b--test-suite-guide-for-qa-engineers).

---

# Part A — Blotter UI Guide (for Stakeholders)

## What Is the TradeBook Blotter?

The TradeBook Blotter is a mock equity trading order management system (OMS). It simulates the kind of system used by institutional trading desks to place, track, and manage equity orders across their lifecycle — from submission through settlement.

This is a **non-production mock** built for testing and demonstration purposes. No real trades are executed.

---

## Accessing the Blotter

Open your browser and go to:

```
https://tradebook-mock.onrender.com
```

> **Note:** The first load may take 20–30 seconds on a cold start (free hosting tier). Refresh if the page is blank.

---

## Logging In

On the login screen:
- **Username:** `qa_user`
- **Password:** `qa_password`

Click **LOGIN**. You will be taken to the Order Blotter.

---

## The Blotter Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TB  TradeBook  [ALPHA — NON-PRODUCTION]  [Date]  [●Connected] │
│  [Market Data Bar: live price tickers]                          │
│  [+ NEW ORDER] [SETTLEMENT] [RHUB] [POSITIONS] [SEC MASTER]    │
│  [SESSION] [HEALTH] [ACCOUNT] [LOGS] [⚡ SIMULATOR]             │
├─────────────────────────────────────────────────────────────────┤
│  ORDER BLOTTER                                                   │
│  ┌──────────┬────────┬────────┬──────┬───────┬──────┬────────┐ │
│  │ Order ID │ Symbol │  Side  │  Qty │ Price │ Status│ Actions│ │
│  └──────────┴────────┴────────┴──────┴───────┴───────┴───────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Supported Symbols

> **Note:** This mock environment supports **3 symbols only** — `AAPL`, `MSFT`, and `TSLA`. This is a known limitation of the mock UI. In a production environment, symbols are resolved dynamically via a live Security Master feed. Since this mock cannot connect to an external Security Master, the symbol list is hardcoded for testing purposes.

## Order ID Case Sensitivity

> **Note:** Order IDs and ClOrdIDs are **case-sensitive** throughout the system. When searching in RHUB or referencing an order in any panel, copy the Order ID exactly as shown in the blotter — do not retype it manually.

## Market Orders

> **Note:** The **Market** order type requires a manual fill via the **⚡ SIMULATOR** panel. Since this mock has no live market data stream, there is no real-time bid/ask price to execute against. After submitting a Market order, open the Simulator, enter a fill price and quantity, and click **Simulate Fill** to drive the order to a filled state.

---

## Placing a New Order

1. Click **+ NEW ORDER** in the top bar
2. Fill in the order form:
   - **Symbol** — must be one of: `AAPL`, `MSFT`, `TSLA`
   - **Side** — `Buy` or `Sell`
   - **Quantity** — number of shares
   - **Limit Price** — price per share
   - **Account** — e.g. `ACC-001`
3. Click **SUBMIT ORDER**
4. The order appears in the blotter with status `New`

---

## Order Statuses

| Status | Meaning |
|--------|---------|
| New | Order submitted, awaiting acknowledgment |
| Pending New | Order sent to exchange, awaiting response |
| Partially Filled | Some shares have been executed |
| Filled | All shares have been executed |
| Canceled | Order was successfully cancelled |
| Rejected | Order was rejected (see reject reason below order) |

---

## Modifying an Order

Right-click on any **open** order row in the blotter and select **Modify Order**, or click the **MOD** button in the Actions column. You can change the quantity or price. Filled or cancelled orders cannot be modified.

## Cancelling an Order

Right-click on any **open** order row and select **Cancel Order**, or click the **CXL** button. A confirmation dialog will appear. Filled orders cannot be cancelled.

---

## Viewing Order History

Right-click on any order row and select **View History**, or click the **HIST** button. The Order History panel shows the full lifecycle of the order — every state change, fill event, and timestamp.

---

## Simulating a Fill

Click **⚡ SIMULATOR** in the top bar to open the Simulator Panel. This allows you to:
- Trigger a **partial fill** (specify quantity and price)
- Trigger a **final fill** (completes the order)
- Simulate a **rejection**

This is the mechanism used by automated tests to drive order state changes.

---

## Viewing Panels

| Button | Panel | What It Shows |
|--------|-------|---------------|
| SETTLEMENT | Settlement Panel | Settlement report for executed trades |
| RHUB | RHUB Panel | Reconciliation Hub records — search by Order ID or ClOrdID (**case-sensitive**) |
| POSITIONS | Position Panel | Current positions by symbol |
| SEC MASTER | Instrument Search | Security master lookup |
| SESSION | Session Monitor | FIX session health and connectivity |
| HEALTH | Health Panel | System component status |
| ACCOUNT | Account Panel | Current account details |
| LOGS | Log Viewer | Searchable application log |

---

## Reading the Living Docs Report

The test report is published at:

```
https://tradebook-docs.onrender.com
```

It shows:
- All 56 test scenarios grouped by feature
- Pass/fail status for each scenario and step
- Execution timestamps
- A link back to the live Blotter UI

Green = passed. Red = failed. This report updates automatically after every CI run.

---

---

# Part B — Test Suite Guide (for QA Engineers)

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
│   │   └── lifecycle/           # 12 lifecycle feature files
│   ├── step_definitions/
│   │   ├── lifecycle/           # order, fill, position, settlement steps
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
| `environment` | `features/environment/**` | Environment readiness gate |
| `manual` | none (all) | Manual mode — no browser, prints instructions |
| `default` | all features | Complete run |

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
| `TB_USERNAME` | `qa` | Login username |
| `TB_PASSWORD` | `qa` | Login password |
| `BROWSER` | `chromium` | Browser to use (`chromium`, `firefox`, `webkit`) |
| `HEADLESS` | `true` | Run headless (`true`) or with visible browser (`false`) |

Set these in a `.env` file in `cucumber-tests/` for local overrides.

---

## Generating the HTML Report

After running any test profile:

```bash
npm run report
```

This reads `reports/report.json` and writes `reports/report.html`. Open it in a browser or push to GitHub to update the live docs site.

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

## Adding a New Scenario

1. **Write the Gherkin** in the appropriate feature file under `features/lifecycle/` or `features/environment/`
2. **Tag with `@smoke`** if it should be part of the fast regression gate
3. **Run dry-run** to check for unmatched steps: `npm run test:dry`
4. **Implement missing steps** in the relevant step definition file
5. **Run the scenario** in headed mode to watch execution: `HEADLESS=false npm run test:lifecycle`
6. **Run smoke regression** to check for regressions: `npm run test:smoke`
7. **Generate the report**: `npm run report`
8. **Commit and push** — CI will run and publish the updated report

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
