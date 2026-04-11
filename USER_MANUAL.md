# TradeBook QA — User Manual

**Version:** 1.0 | **Date:** April 2026  
**Live UI:** https://tradebook-mock.onrender.com  
**Living Docs:** https://tradebook-docs.onrender.com  
**Repo:** https://github.com/ken-jiang-claude/tradebook-qa

---

## Who This Manual Is For

This manual is for two audiences:

- **Non-technical stakeholders** — navigating the Blotter UI to observe order workflows and understand test coverage
- **Business QA** — writing Gherkin scenarios and handing them off to technical QA for automation

If you are a technical QA engineer implementing step definitions, see [QA_ENGINEER_GUIDE.md](QA_ENGINEER_GUIDE.md).

---

# Blotter UI Guide

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

# Gherkin Guide (for Business QA)

## How to Write a Gherkin Scenario

Gherkin is a plain-English format that describes test behaviour as **business requirements**, not implementation steps. The goal is for a non-technical stakeholder to read a scenario and understand exactly what is being tested.

### Structure

```gherkin
Feature: <What system capability is being tested>
  As a <role>
  I want <goal>
  So that <business value>

  @tag1 @tag2
  Scenario: <Specific behaviour being verified>
    Given <the starting state of the system>
    When  <the action the user takes>
    Then  <the observable outcome>
    And   <additional assertion — continues the Then>
```

### Rules for this project

| Rule | Why |
|------|-----|
| One behaviour per scenario | Makes failures specific and easy to diagnose |
| Given sets up state, When takes action, Then asserts | Don't mix setup into When steps |
| Write for the reader, not the automation | If a stakeholder can't understand it, rewrite it |
| Use concrete values (`100 shares of AAPL at 150.00`) | Avoids vague scenarios that are hard to reproduce |
| Tag `@smoke` for critical-path scenarios | Keeps the fast regression gate meaningful |
| Tag `@known-issue` for intentional failures | Documents gaps without breaking the green suite |
| Never put UI mechanics in Gherkin | Say "the order is filled", not "click the simulator button" |

### Tags used in this project

| Tag | Meaning | Used By |
|-----|---------|---------|
| `@smoke` | Included in the fast 18-scenario sanity gate — runs on every CI push | Business QA to mark critical-path scenarios |
| `@known-issue` | Intentionally failing — documents an unsupported capability | Business QA to flag gaps in the mock |
| `@edge-case` | Boundary or resilience scenario | Business QA to categorise non-happy-path tests |
| `@session` | FIX session / connectivity related | Business QA |
| `@race-condition` | Concurrent event scenarios | Business QA |
| `@multi-user` | Multi-session / permission scenarios | Business QA |
| `@batch` | Settlement or batch timing scenarios | Business QA |

### Where tags can sit

Tags can be placed at two levels:

```gherkin
@smoke @lifecycle                    ← Feature-level: ALL scenarios in this file inherit these tags
Feature: Order Lifecycle

  @p0                                ← Scenario-level: only this scenario gets @p0
  Scenario: Valid buy order appears in blotter
    Given the trader is logged in
    ...

  @known-issue @edge-case            ← Multiple tags on one scenario are allowed
  Scenario: Order during FIX disconnect
    ...
```

**Rule of thumb for Business QA:**
- Tag `@smoke` on the 3–5 most critical scenarios per feature area
- Tag `@known-issue` on any scenario that documents a gap (the test will show amber, not red)
- You can apply multiple tags — there is no limit

### Do / Don't

| Do | Don't |
|----|-------|
| `Then the order status should be "Filled"` | `Then click the blotter row and check the label text` |
| `Given a buy order for 100 shares of AAPL at 150.00 exists` | `Given there is some order` |
| `When the trader cancels the order` | `When page.click('[data-testid="cxl-btn"]')` |
| Reuse existing step patterns | Invent new steps when an existing one fits |

---

## Worked Example — Business QA Contribution (Steps 1–2)

This walks through the Business QA's part of adding a new automated scenario. After Step 2, hand off to technical QA.

**Goal:** Verify that a sell order can be placed, partially filled, and shows the correct remaining quantity.

---

### Step 1 — Write the Gherkin

Create or open a feature file under `cucumber-tests/features/lifecycle/` and add:

```gherkin
@smoke
Scenario: Sell order partially filled shows correct remaining quantity
  Given the trader is logged in
  And a sell order for 200 shares of MSFT at 390.00 has been placed
  When a partial fill of 80 shares at 390.00 is simulated
  Then the order status should be "Partially Filled"
  And the filled quantity should be 80
  And the remaining quantity should be 120
```

Follow the rules above — business language, concrete values, no UI mechanics.

---

### Step 2 — Identify missing steps

Run the dry-run to check which steps already have automation and which are new:

```bash
cd cucumber-tests
npm run test:dry
```

The output lists any steps that don't match an existing definition:

```
? the remaining quantity should be 120   # UNDEFINED — needs a step definition
```

All other steps already exist. Document the undefined steps and pass them to the technical QA along with the feature file.

> **Hand-off point:** Give the technical QA the feature file and the list of undefined steps. They will implement the step definitions, run the tests, and publish the updated report. See [QA_ENGINEER_GUIDE.md](QA_ENGINEER_GUIDE.md) for the technical QA steps.
