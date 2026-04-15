# TradeBook QA — Learning Portal

**Author:** Ken Jiang  
**Stack:** Python · Flask · Claude (claude-haiku-4-5) · SQLite · Vanilla JS  

| | |
|---|---|
| **QA Learning Portal** | https://tradebook-qa-portal.onrender.com |
| Live Blotter UI | https://tradebook-mock.onrender.com |
| Living Test Docs | https://tradebook-docs.onrender.com |
| Repo | https://github.com/ken-jiang-claude/tradebook-qa |

---

## What This Project Is

An AI-powered learning and Gherkin-authoring portal for Bloomberg TradeBook QA analysts. Covers the full equity trade lifecycle with FIX Protocol grounding and Claude-powered chat.

| Tab | What you get |
|---|---|
| **Learn** | 9 QA scenarios with FIX message flows, pass/fail signs, acceptance criteria, and Gherkin previews |
| **Gherkin Writer** | Template-based generator + AI generator — describe a test in plain English, get a `.feature` file instantly |
| **Ask AI** | Claude-powered chat for FIX tags, OrdStatus transitions, Gherkin syntax, and RCA guidance |

> The BDD Automation Suite (Cucumber-js + Playwright) is preserved on the [`bdd-automation-suite`](https://github.com/ken-jiang-claude/tradebook-qa/tree/bdd-automation-suite) branch.

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

## Try It Now

No installation needed — everything is live:

| | |
|---|---|
| **Blotter UI** | https://tradebook-mock.onrender.com — login with `qa_user` / `qa_password` |
| **Test Report** | https://tradebook-docs.onrender.com — full living docs, updated on every CI run |

> First load may take 20–30 seconds on a cold start (free hosting tier).

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

## How a New Test Gets Built (Steps 1–7)

Adding a new automated scenario is a two-person handoff between Business QA and Technical QA:

| Step | Who | What |
|------|-----|------|
| 1 | **Business QA** | Writes the Gherkin scenario in plain English |
| 2 | **Business QA** | Runs dry-run (`npm run test:dry`) to identify undefined steps — hands off feature file + list to Technical QA |
| 3 | **Technical QA** | Implements missing step definitions in JavaScript (Playwright) |
| 4 | **Technical QA** | Runs the scenario with a visible browser to verify execution |
| 5 | **Technical QA** | Runs smoke regression to confirm no regressions |
| 6 | **Technical QA** | Generates the HTML report and reviews the result |
| 7 | **Technical QA** | Commits and pushes — CI publishes the updated living docs |

Full details: [USER_MANUAL.md](USER_MANUAL.md) (Steps 1–2) · [QA_ENGINEER_GUIDE.md](QA_ENGINEER_GUIDE.md) (Steps 3–7)

---

## Documentation

| Document | Description |
|---|---|
| [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) | Business requirements, stakeholders, RACI, RICE, Gantt chart, SDLC, post-release checks |
| [USER_MANUAL.md](USER_MANUAL.md) | Blotter UI guide + Gherkin writing guide for Business QA (Steps 1–2) |
| [QA_ENGINEER_GUIDE.md](QA_ENGINEER_GUIDE.md) | Technical QA guide — setup, step definitions, CI/CD (Steps 3–7) |
| [FRAMEWORK_BOOTSTRAP.md](FRAMEWORK_BOOTSTRAP.md) | How to build this framework from scratch for any project — stack choices, architecture decisions |
| [TAAS_VISION.md](TAAS_VISION.md) | Testing as a Service vision — how this project evolves into a shared QA platform |
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
