# Bloomberg TradeBook QA — Edge Cases Addendum

**Purpose:** Capture high-value edge cases that usually expose trading system defects. Keeps the main checklist focused on core workflow coverage. These can be converted into automated scenarios or code-driven tests.

---

## How to Use This Addendum

- Run these **after** the baseline environment and core lifecycle scenarios pass
- Treat them as **resilience, recovery, and data-integrity** tests — not happy-path checks
- For every failure, collect order IDs, timestamps, session state, and correlated logs for RCA

---

## 1. Session and Connectivity

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| Submit order while FIX session is disconnected | Order should be blocked, held, or rejected cleanly; user must not see a false live status | Session state detection defect, route config issue, simulator outage |
| Session drops after order send but before acknowledgment | System preserves a consistent pending state, recovers on reconnect, avoids duplicate sends | Weak recovery logic, uncertain order state handling |
| Heartbeat timeout or missed logon | Session monitor and logs show the exact connectivity failure; route unavailable for testing | Network issue, credentials, or counterparty simulator problem |
| Sequence gap and resend request | System requests or processes resend correctly and restores message continuity | Sequence management defect or replay issue |
| Reconnect and replay duplicate message | Previously processed ack or execution is not applied twice after reconnect | Missing dedup logic or bad replay handling |

---

## 2. Lifecycle Race Conditions

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| Cancel request while fill is in flight | Final state is logically consistent: Filled, Partially Filled + Canceled, or Canceled with no fill — depending on event order | State machine race condition |
| Replace request after partial fill | LeavesQty, total quantity, and chain linkage remain correct | Incorrect quantity math or replace chain corruption |
| Cancel after full fill | Cancel is rejected clearly; status remains Filled | Stale order state or out-of-order processing |
| Reject arrives after Pending New | Order moves cleanly to Rejected with a traceable reason | Inbound message translation or state transition defect |
| Out-of-order execution, cancel, and replace messages | System preserves a valid end state and audit trail even if events arrive in non-ideal sequence | Ordering dependency defect |

---

## 3. Static Data and Integrity

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| Wrong symbol or destination mapping | Order rejects or routes according to the correct mapped instrument and destination only | Security master or route config defect |
| Stale security master | Inactive or changed instrument metadata does not silently pass as valid | Reference data load failure or stale cache |
| Missing settlement instructions or bad account setup | Order may execute but post-trade workflow blocks with a clear error before downstream corruption | Account setup or SSI defect |
| Duplicate order ID or duplicate execution ID | System detects, rejects, or quarantines duplicates | Idempotency or persistence issue |
| Average price, notional, and fee rounding | Math is correct to configured precision across fills and reports | Precision or rounding logic defect |

---

## 4. Market Calendar and Date

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| Order before market open | Behaviour follows market rules and order instructions; timestamps and status are accurate | Session / calendar configuration issue |
| Order after market close | System rejects, queues, or marks the order correctly based on allowed behaviour | Trading-hours rule defect |
| Trading halt on symbol | Order is blocked or handled under halt rules; no misleading acceptance state | Market-status handling defect |
| Holiday or early-close session | Business date, market open/close windows, and settlement logic match the calendar | Calendar or session schedule defect |
| Settlement date mismatch | Settlement report and RHUB carry the correct settlement cycle for the market | Settlement calendar or mapping defect |

---

## 5. Reconciliation and Downstream

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| Blotter vs order history mismatch | UI and history tell the same lifecycle story | Event persistence or history build issue |
| Executions vs positions mismatch | Executed quantity matches resulting position with no duplicate or missing impact | Position engine lag or duplicate exec handling |
| Executions vs RHUB mismatch | RHUB matches source trade details exactly or surfaces a recon break | Downstream transformation or timing issue |
| Settlement totals do not match execution totals | Report is flagged failed or incomplete; no silent mismatch | Batch / reporting defect |
| Missing or duplicate downstream booking | Every trade books once and only once | Interface retry bug or consumer duplication |

---

## 6. Logging and Supportability

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| Failure with missing order ID or session context in logs | Counts as a test failure even if UI behaviour is acceptable — supportability is incomplete | Poor instrumentation |
| Generic error message with no actionable reason | User-facing and support-facing diagnostics are specific enough for triage | Weak error taxonomy or logging standards |
| Silent failure with no alert or traceable error path | System leaves enough evidence to reconstruct what happened | Monitoring and observability gap |
| Cross-system tracing missing between OMS, route, and downstream reports | A single issue is traceable across systems using IDs and timestamps | Correlation ID or logging design gap |

---

## 7. Multi-User and Permissions

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| One user modifies order while another views it | Viewer sees consistent state; modifier's changes propagate correctly without data races | Concurrency control or cache invalidation defect |
| User attempts action beyond their entitlement | Action is cleanly blocked with a clear permission error; no partial execution or misleading state | Entitlement check timing or enforcement gap |
| Different users see different order states | All entitled users see the same current state for shared orders/accounts | Visibility filtering or state synchronisation issue |
| Permission change during active session | User does not retain access to newly restricted functions; session reflects updated entitlements | Entitlement cache refresh defect |
| Concurrent order submission by multiple users | System handles race conditions correctly; no duplicate orders or conflicting states | Idempotency or locking mechanism defect |

---

## 8. Report Timing and Batch Processing

| Edge Case Scenario | Acceptance Criteria | Likely Root Cause if Failed |
|--------------------|--------------------|-----------------------------|
| Intraday report generation timing | Reports generate at correct intervals with complete data up to cutoff time | Batch scheduling or data availability timing issue |
| End-of-day batch cutoff precision | Trades after cutoff appear in next day's reports; cutoff is exact to the second | Time zone handling or cutoff logic defect |
| Settlement report timing vs market close | Settlement cycle aligns with market conventions; no premature or delayed processing | Calendar configuration or settlement rule defect |
| RHUB timing vs execution timing | RHUB processes after settlement but reflects all executions; timing dependencies are clear | Downstream processing order or dependency defect |
| Report reconciliation across different cutoff times | Reports with different generation schedules still reconcile correctly | Timing mismatch or reconciliation logic defect |
| Historical report regeneration | Regenerated reports match original reports exactly for the same time period | Data consistency or regeneration logic defect |

---

## Recommended Run Order

```
Baseline environment certification
    ↓
Core lifecycle scenarios
    ↓
Edge cases addendum (Sections 1–8)
    ↓
Settlement + RHUB checks
    ↓
Order history + positions
    ↓
RCA pack for any failure
```
