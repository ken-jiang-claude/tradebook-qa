# CLAUDE.md — TradeBook QA Project

This file guides Claude Code in future sessions. Read it before making any changes.

---

## Project Overview

A BDD automation suite for a mock Bloomberg TradeBook equity trading system.
Two deployable components:
- **tradebook-mock/** — Vue 3 mock UI (deployed to Render)
- **cucumber-tests/** — Cucumber-js + Playwright test suite

Live URLs:
- Blotter UI: https://tradebook-mock.onrender.com (login: `qa_user` / `qa_password`)
- Living Docs: https://tradebook-docs.onrender.com

---

## Key Conventions

### Selectors
- Always use `input[data-testid="..."]` for form inputs, not `[data-testid="..."]`
- Use `data-status` attribute on blotter rows for status checks — do NOT use textContent (nested spans make it unreliable)
- Use `el.evaluate(el => el.disabled)` to check disabled state — not `getAttribute('disabled')` (returns `""` which is falsy)
- Blotter row selector: `[data-testid="blotter-row"][data-order-id="${orderId}"]`

### Step Definitions
- All steps must support dual-mode: automated (Playwright) and manual (print instructions)
- Use `this.step(options)` from World for dual-mode steps
- Close every panel after use — fixed overlays block all pointer events on elements behind them
- Use `Promise.race([waitForSelector('order-confirm'), waitForSelector('order-error')])` for order submission — invalid inputs show error instead of confirm

### In-Page Simulator Bridges (window.*)
These are installed by `useSimulator.js` on mount and used by step definitions via `page.evaluate()`:
- `window.__simulateFill({ orderId, qty, price, isFinal })` — triggers a fill
- `window.__simulateReject({ orderId, reason })` — rejects an open order
- `window.__seedPosition({ symbol, qty, price })` — seeds a starting position
- `window.__injectRhubBreak({ orderId })` — injects a RHUB reconciliation break
- `window.__getOrderId()` — returns the most recent order ID

### World State (`support/world.js`)
Key properties available in every step:
- `this.orderId`, `this.clOrdId`, `this.execId`
- `this.symbol`, `this.side`, `this.orderQty`, `this.limitPrice`
- `this.fillEvents[]`, `this.historyEvents[]`
- `this.startPosition`
- `this.isManual` — skip all Playwright calls when true

Key helpers:
- `this.waitForOrderStatus(status, timeoutMs)` — polls `data-status` attribute
- `this.simulateFill({ qty, price, isFinal })` — calls `window.__simulateFill`
- `this.seedPosition({ symbol, qty, price })` — calls `window.__seedPosition`
- `this.getBlotterField(fieldName)` — reads a `data-field` cell from the blotter row

---

## Running Tests

Always run from `cucumber-tests/` directory. Mock UI must be running on port 4000.

```bash
# Start mock UI (separate terminal)
cd tradebook-mock && npm run dev

# Run tests
cd cucumber-tests
npm run test:smoke       # 18 scenarios — fast check
npm run test:lifecycle   # 56 scenarios — full regression
npm run report           # generate HTML report
```

## Test Profiles (cucumber.js)
- `smoke` — tagged `@smoke`, 18 scenarios
- `lifecycle` — `features/lifecycle/**`, 56 scenarios
- `environment` — `features/environment/**`
- `manual` — all features, no browser
- `default` — all features

---

## Credentials
- Mock UI login: `qa_user` / `qa_password`
- Cucumber env default: `TB_USERNAME=qa_user`, `TB_PASSWORD=qa_password`
- Base URL default: `http://localhost:4000`

---

## Deployment
- `render.yaml` at repo root defines both Render static sites
- Pushing to `main` triggers GitHub Actions → runs smoke tests → commits updated `report.html` → Render redeploys
- Mock UI uses SPA rewrite rule (all routes → `index.html`)
- Docs site copies `report.html` to `public/index.html` at build time

---

## File Map

| Path | Purpose |
|------|---------|
| `tradebook-mock/src/views/LoginView.vue` | Login page and credential validation |
| `tradebook-mock/src/views/BlotterView.vue` | Main layout, top bar, panel triggers |
| `tradebook-mock/src/components/OrderBlotter.vue` | Blotter table, context menu, action buttons |
| `tradebook-mock/src/composables/useSimulator.js` | All window.* bridges |
| `tradebook-mock/src/store/useStore.js` | Reactive store (orders, positions, session) |
| `cucumber-tests/support/world.js` | Cucumber World — all shared state and helpers |
| `cucumber-tests/support/hooks.js` | Before/After hooks (browser launch, screenshot on fail) |
| `cucumber-tests/config/env.js` | Environment config (baseUrl, credentials, browser) |
| `cucumber-tests/cucumber.js` | Profile definitions |
| `cucumber-tests/scripts/generate-report.js` | HTML report generator |
| `.github/workflows/cucumber-tests.yml` | CI pipeline |
| `render.yaml` | Render deployment config |

---

## Do Not
- Do not use external HTTP calls in step definitions — use `window.*` bridges instead
- Do not check `textContent` of status cells — use `data-status` attribute
- Do not commit `node_modules/`, `.env`, `reports/*.json`, or `reports/screenshots/`
- Do not change credentials without updating both `LoginView.vue` and `config/env.js`
