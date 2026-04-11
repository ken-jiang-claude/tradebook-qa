# TradeBook QA — Project Management Document

**Project:** TradeBook Mock UI + BDD Automation Suite  
**Author:** Ken Jiang  
**Date:** April 2026  
**Version:** 1.0  
**Repo:** https://github.com/ken-jiang-claude/tradebook-qa  
**Live UI:** https://tradebook-mock.onrender.com  
**Living Docs:** https://tradebook-docs.onrender.com

---

## 1. Executive Summary

This project delivers a fully automated BDD test suite for a mock Bloomberg TradeBook equity trading system. It demonstrates end-to-end QA capability across the full order lifecycle — from order entry through settlement and reconciliation — using industry-standard tooling (Cucumber, Playwright, Gherkin) deployed on a public cloud platform.

The project serves two purposes:
1. **Portfolio demonstration** — showcases QA engineering, BDD methodology, and CI/CD delivery
2. **Reference implementation** — a reusable framework pattern for financial trading system QA

---

## 2. Why We Built This — Problem Statement

### The Problem

Testing equity trading systems like Bloomberg TradeBook is complex and high-stakes. In a real environment, QA teams face several critical challenges:

**1. No safe test environment**
Production trading systems carry real financial risk. A single misconfigured test order can cause regulatory, financial, or operational damage. QA teams are often blocked waiting for a stable non-production environment that mirrors production closely enough to be meaningful.

**2. Manual testing is slow and error-prone**
Order lifecycle testing involves 12+ distinct scenarios per order type. Running these manually — clicking through UI flows, observing status transitions, cross-checking downstream reports — is time-consuming, inconsistent across testers, and leaves no audit trail.

**3. Downstream validation is fragmented**
A trade doesn't end at the blotter. Settlement reports, RHUB reconciliation, position management, and order history must all agree. Without automation, these cross-system checks are either skipped or done ad-hoc, creating gaps that only surface in production.

**4. Test coverage is invisible to stakeholders**
QA work happens in spreadsheets and test management tools that business stakeholders rarely read. There is no living, accessible view of what is tested and what is passing.

**5. Knowledge is siloed**
Without structured Gherkin scenarios, test logic lives in individual testers' heads. When a tester leaves or context switches, coverage regresses.

### The Solution

This project addresses each problem directly:

| Problem | Solution |
|---------|----------|
| No safe test environment | Built a fully functional mock TradeBook UI in Vue 3 with in-page simulators — no real exchange dependency |
| Manual testing is slow | Playwright-driven Cucumber automation runs 56 scenarios in under 2 minutes |
| Downstream validation is fragmented | Automated checks for settlement, RHUB, positions, and order history in every run |
| Coverage invisible to stakeholders | Living docs published at a public URL, updated on every CI run |
| Knowledge is siloed | Gherkin scenarios are human-readable business requirements, not just code |

### What This Proves

For a hiring context, this project demonstrates:
- Deep understanding of equity trading system workflows and QA methodology
- Ability to design and build a test framework from scratch, not just use one
- BDD discipline — writing tests as requirements, not afterthoughts
- Full-stack thinking — from Vue UI to CI/CD pipeline to cloud deployment
- Production-readiness habits — dual-mode testing, failure screenshots, living docs

---

## 3. Business Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-01 | Automate full order lifecycle testing (add, modify, cancel, reject, fill, settlement) | Must Have |
| BR-02 | Support both automated (Playwright) and manual test execution modes | Must Have |
| BR-03 | Validate downstream outputs: settlement report, RHUB reconciliation, position management | Must Have |
| BR-04 | Provide living test documentation accessible to non-technical stakeholders | Should Have |
| BR-05 | Integrate with CI/CD pipeline to run on every code change | Should Have |
| BR-06 | Mock the TradeBook UI to eliminate dependency on a live trading environment | Must Have |
| BR-07 | Publish test results and live UI to a publicly accessible URL | Should Have |
| BR-08 | Support environment readiness checks as a gate before lifecycle testing | Must Have |

---

## 3. Stakeholders

| Stakeholder | Role | Interest |
|-------------|------|----------|
| Ken Jiang | QA Engineer / Project Owner | Delivery, quality, portfolio demonstration |
| Hiring Manager | Evaluator | Code quality, methodology, completeness |
| Technical Interviewer | Evaluator | Architecture decisions, automation depth |
| QA Team (future) | End User | Running and maintaining the test suite |
| Business Analyst (future) | Consumer | Reading living docs, reviewing Gherkin scenarios |
| Product Owner (future) | Consumer | Feature coverage, acceptance criteria sign-off |

---

## 4. RACI Model

| Activity | Ken (QA Owner) | Hiring Manager | QA Team (future) | BA (future) |
|----------|---------------|----------------|-------------------|-------------|
| Define business requirements | **R/A** | C | C | C |
| Write Gherkin scenarios | **R/A** | I | C | C |
| Build mock UI (Vue) | **R/A** | I | I | I |
| Write step definitions (Playwright) | **R/A** | I | C | I |
| Set up CI/CD pipeline | **R/A** | I | C | I |
| Deploy to Render | **R/A** | I | I | I |
| Review test coverage | **R/A** | C | C | C |
| Approve living docs | **A** | **R** | C | C |
| Run regression tests | R | I | **R/A** | I |
| Triage test failures | R | I | **R/A** | C |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

---

## 5. Definition of Ready (DoR)

A feature or scenario is **ready to develop/automate** when:

- [ ] Gherkin scenario is written and peer-reviewed
- [ ] Acceptance criteria are defined and agreed
- [ ] Mock UI supports the required UI elements and `data-testid` attributes
- [ ] Test data requirements are understood (symbols, accounts, prices)
- [ ] Dependencies on downstream systems (settlement, RHUB, positions) are identified
- [ ] Manual test path is documented as a fallback

---

## 6. Definition of Done (DoD)

A scenario is **done** when:

- [ ] Gherkin scenario runs green in automated mode (`npm run test:lifecycle`)
- [ ] Gherkin scenario runs green in smoke profile (`npm run test:smoke` for tagged scenarios)
- [ ] No regressions introduced in previously passing scenarios
- [ ] Living docs report updated (`npm run report`)
- [ ] CI pipeline passes on `main` branch
- [ ] Screenshots captured on failure and retained as artifacts
- [ ] Step definitions follow dual-mode pattern (auto + manual fallback)
- [ ] Code committed and pushed to GitHub

---

## 7. RICE Prioritization

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---------|-------|--------|------------|--------|------------|----------|
| Core order lifecycle (add/modify/cancel) | 10 | 10 | 10 | 3 | **333** | P0 |
| Order reject handling | 8 | 9 | 9 | 2 | **324** | P0 |
| Partial and full fill | 9 | 10 | 9 | 3 | **270** | P0 |
| Environment readiness checks | 7 | 8 | 9 | 2 | **252** | P0 |
| Settlement report validation | 7 | 9 | 8 | 3 | **168** | P1 |
| RHUB reconciliation | 6 | 9 | 7 | 3 | **126** | P1 |
| Position management | 6 | 8 | 8 | 2 | **192** | P1 |
| Order history audit trail | 6 | 7 | 9 | 2 | **189** | P1 |
| Duplicate execution protection | 5 | 9 | 8 | 2 | **180** | P1 |
| Overfill protection | 5 | 9 | 8 | 2 | **180** | P1 |
| Living docs portal | 4 | 6 | 9 | 1 | **216** | P1 |
| CI/CD automation | 5 | 8 | 8 | 2 | **160** | P2 |
| Edge case addendum scenarios | 4 | 8 | 7 | 4 | **56** | P2 |
| Multi-user / permission tests | 3 | 7 | 6 | 4 | **31** | P3 |

*RICE = (Reach × Impact × Confidence) / Effort*

---

## 8. Gantt Chart

```
PHASE                         Week 1   Week 2   Week 3   Week 4   Week 5   Week 6
─────────────────────────────────────────────────────────────────────────────────
1. Project Setup
   Repo, tooling, env config  ████
   Mock UI scaffold                    ████

2. Environment Readiness
   Feature file + steps                ████
   Mock UI elements                    ████

3. Core Lifecycle (P0)
   Add / Modify / Cancel                        ████
   Reject handling                              ████
   Partial / Full fill                                   ████

4. Downstream Validation (P1)
   Settlement report                                     ████
   RHUB reconciliation                                            ████
   Position management                                            ████
   Order history                                                  ████

5. Protection Scenarios (P1)
   Duplicate exec / Overfill                                      ████

6. Living Docs + CI/CD
   Report generator                                               ████
   GitHub Actions                                                          ████
   Render deployment                                                        ████

7. Stabilization
   Full suite regression (56 scenarios)                                     ████
   Smoke regression (18 scenarios)                                          ████

8. Documentation
   Project management doc                                                   ████
   User manual                                                              ████
─────────────────────────────────────────────────────────────────────────────────
MILESTONE                     Setup    Env✓     Core✓    DS✓      CI✓      Docs✓
```

---

## 9. SDLC

This project follows an **Agile-influenced SDLC** adapted for a solo QA engineering portfolio:

### Phase 1 — Requirements & Design
- Define business requirements from Bloomberg TradeBook domain knowledge
- Write Gherkin scenarios as living requirements (feature files)
- Design mock UI architecture (Vue 3, reactive store, in-page simulators)
- Identify test data strategy (in-memory seeding via `window.__seedPosition`, `window.__simulateFill`)

### Phase 2 — Development
- Build mock TradeBook UI (`tradebook-mock/`) with all required panels and `data-testid` attributes
- Implement Cucumber World with dual-mode support (automated/manual)
- Write step definitions for all lifecycle scenarios
- Integrate in-page bridges for simulator control (`window.__simulateFill`, `window.__simulateReject`, `window.__injectRhubBreak`)

### Phase 3 — Test Execution & Stabilization
- Run smoke profile (18 scenarios) as fast feedback gate
- Run full lifecycle profile (56 scenarios, 457 steps) iteratively
- Fix failures by root cause category: selector issues, overlay interception, state seeding, external API dependencies
- Achieve 100% pass rate on both profiles

### Phase 4 — CI/CD & Deployment
- Wire GitHub Actions to run tests on every push to `main`
- Generate living docs HTML report post-run
- Deploy mock UI and living docs to Render (free tier static sites)
- Commit updated report back to `main` for continuous publishing

### Phase 5 — Documentation & Review
- Write project management document (this file)
- Write user manual for QA engineers and stakeholders
- Peer review of Gherkin scenarios for readability and business alignment

---

## 10. Post-Release Checks

After each deployment to `main` / Render:

| Check | Method | Owner | Frequency |
|-------|--------|-------|-----------|
| Smoke suite passes | `npm run test:smoke` | CI / Ken | Every push |
| Live UI loads at onrender.com | Manual browser check | Ken | Every deploy |
| Living docs accessible | Open tradebook-docs.onrender.com | Ken | Every deploy |
| Report reflects latest run | Check execution timestamp on docs site | Ken | Every deploy |
| No console errors in browser | DevTools console check on Blotter | Ken | Weekly |
| GitHub Actions green | Check Actions tab in repo | Ken | Every push |
| Render deploy logs clean | Check Render dashboard | Ken | Every deploy |

---

## 11. User Feedback & Enhancement Survey

Post-release, the following questions guide future enhancement decisions:

### For QA Engineers
1. Are all scenario names clear enough to understand intent without reading the steps?
2. Are failure messages specific enough to diagnose the root cause quickly?
3. Which scenarios take the longest to stabilize? (candidates for flakiness review)
4. Is the manual mode (`npm run test:manual`) sufficient for non-automated environments?
5. Are there missing edge cases from the addendum that should be automated?

### For Stakeholders / Hiring Managers
1. Do the Gherkin scenarios read clearly as business requirements?
2. Is the living docs report easy to navigate and interpret?
3. What additional downstream systems should be covered (e.g. FIX message validation, booking)?
4. Is the RHUB reconciliation coverage sufficient for a production QA cycle?

### Planned Enhancements (Backlog)

| Enhancement | Source | Effort | Priority |
|-------------|--------|--------|----------|
| Edge case addendum automation (session recovery, race conditions) | DoR | High | P2 |
| Multi-user / concurrency scenarios | Survey | High | P3 |
| FIX message-level validation | Survey | High | P2 |
| Report trend view (pass rate over time) | Survey | Medium | P2 |
| Slack/email notification on CI failure | Survey | Low | P3 |
| Performance baseline (order submission latency) | Survey | Medium | P3 |
| Dark/light mode toggle in mock UI | Survey | Low | P4 |

---

*This document is maintained alongside the codebase. Update after each major release cycle.*
