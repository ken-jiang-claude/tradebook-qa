# TradeBook QA — User Manual

**Version:** 1.0 | **Date:** April 2026  
**Live UI:** https://tradebook-mock.onrender.com  
**Living Docs:** https://tradebook-docs.onrender.com  
**Repo:** https://github.com/ken-jiang-claude/tradebook-qa

---

## Who This Manual Is For

This manual is for **non-technical stakeholders** — navigating the Blotter UI to observe order workflows and understand test coverage.

If you are a QA engineer, see [QA_ENGINEER_GUIDE.md](QA_ENGINEER_GUIDE.md).

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
