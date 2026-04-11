# TradeBook QA — QA Engineer Guide

**Version:** 1.0 | **Date:** April 2026  
**Repo:** https://github.com/ken-jiang-claude/tradebook-qa  
**Live UI:** https://tradebook-mock.onrender.com  
**Living Docs:** https://tradebook-docs.onrender.com

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
