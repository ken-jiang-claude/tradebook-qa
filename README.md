# TradeBook QA — BDD Automation Portfolio

**Author:** Ken Jiang  
**Stack:** Vue 3 · Cucumber-js · Playwright · GitHub Actions · Render  

| | |
|---|---|
| Live Blotter UI | https://tradebook-mock.onrender.com |
| Living Test Docs | https://tradebook-docs.onrender.com |
| Repo | https://github.com/ken-jiang-claude/tradebook-qa |

---

## What This Project Is

A fully automated BDD test suite for a mock Bloomberg TradeBook equity trading system. It demonstrates end-to-end QA engineering across the full order lifecycle — from order entry through settlement and reconciliation.

**56 scenarios · 457 steps · 100% passing**

---

## Project Structure

```
tradebook-qa/
├── tradebook-mock/          # Vue 3 mock TradeBook UI
├── cucumber-tests/          # Cucumber-js + Playwright BDD suite
│   ├── features/            # Gherkin scenarios (12 feature files)
│   ├── step_definitions/    # Playwright step implementations
│   ├── support/             # World, hooks, manual mode
│   ├── config/              # Environment config
│   └── scripts/             # HTML report generator
├── .github/workflows/       # CI pipeline (GitHub Actions)
├── render.yaml              # Render deployment config
├── PROJECT_MANAGEMENT.md    # PM doc: requirements, RACI, RICE, Gantt, SDLC
└── USER_MANUAL.md           # User guide for QA engineers and stakeholders
```

---

## Quick Start

### 1. Run the Mock UI

```bash
cd tradebook-mock
npm install
npm run dev
# → http://localhost:4000
# Login: qa_user / qa_password
```

### 2. Run the Tests

```bash
cd cucumber-tests
npm install
npx playwright install chromium

npm run test:smoke        # 18 scenarios — fast sanity check
npm run test:lifecycle    # 56 scenarios — full regression
npm run test:manual       # manual mode — no browser required
```

### 3. Generate the Report

```bash
npm run report
# → opens cucumber-tests/reports/report.html
```

---

## Test Coverage

| Feature Area | Scenarios |
|---|---|
| Environment readiness | Login, health, market data, session, logging |
| Order lifecycle | Add, modify, cancel, reject |
| Fill processing | Partial fill, full fill, duplicate exec, overfill protection |
| Downstream validation | Settlement report, RHUB reconciliation |
| Order history | Audit trail, exec ID tracing |
| Position management | Position seeding, fill impact, position detail |

---

## CI/CD

GitHub Actions runs on every push to `main`:
1. Builds and serves the mock UI
2. Runs the smoke test profile
3. Generates and commits the updated HTML report
4. Render auto-deploys both sites

---

## Documentation

| Document | Description |
|---|---|
| [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) | Business requirements, stakeholders, RACI, RICE, Gantt chart, SDLC, post-release checks |
| [USER_MANUAL.md](USER_MANUAL.md) | Guide for QA engineers and non-technical stakeholders |
| [Living Docs](https://tradebook-docs.onrender.com) | Published test results — updated on every CI run |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mock UI | Vue 3, Vue Router, Vite |
| Test Framework | Cucumber-js v10, Gherkin |
| Browser Automation | Playwright |
| CI/CD | GitHub Actions |
| Hosting | Render (free tier static sites) |
| Reporting | cucumber-html-reporter |
