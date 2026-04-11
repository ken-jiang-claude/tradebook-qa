Bloomberg TradeBook QA Edge Cases Addendum
Separate cornerstone scenarios to append after the main lifecycle checklist
Purpose: keep the main testing scenarios document focused on core workflow coverage, while this addendum captures the high-value edge cases that usually expose trading system defects. These can later be converted into schema rows or code-driven tests.
How to use this addendum
Run these after the baseline environment and core lifecycle scenarios pass.
Treat them as resilience, recovery, and data-integrity tests, not simple happy-path checks.
For every failure, collect order IDs, timestamps, session state, and correlated logs for RCA.
1. Session and connectivity edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
Submit order while FIX or gateway session is disconnected
Order should be blocked, held, or rejected cleanly based on design; user must not see a false live status.
Session state detection defect, route config issue, simulator outage.
Session drops after order send but before acknowledgment
System should preserve a consistent pending state, recover on reconnect, and avoid duplicate sends.
Weak recovery logic, uncertain order state handling.
Heartbeat timeout or missed logon
Session monitor and logs should show the exact connectivity failure and route should be unavailable for testing.
Network issue, credentials, or counterparty simulator problem.
Sequence gap and resend request
System should request or process resend correctly and restore message continuity.
Sequence management defect or replay issue.
Reconnect and replay duplicate message
Previously processed ack or execution should not be applied twice after reconnect.
Missing dedup logic or bad replay handling.

2. Lifecycle race-condition edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
Cancel request while fill is in flight
Final state should be logically consistent: either filled, partially filled and canceled, or canceled with no fill, depending on event order.
State machine race condition.
Replace request after partial fill
LeavesQty, total quantity, and chain linkage should remain correct.
Incorrect quantity math or replace chain corruption.
Cancel after full fill
Cancel should be rejected clearly and status should remain Filled.
Stale order state or out-of-order processing.
Reject arrives after Pending New
Order should move cleanly to Rejected with traceable reason.
Inbound message translation or state transition defect.
Out-of-order execution, cancel, and replace messages
System should preserve a valid end state and audit trail even if events arrive in non-ideal sequence.
Ordering dependency defect.

3. Static data and integrity edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
Wrong symbol or destination mapping
Order should reject or route according to the correct mapped instrument and destination only.
Security master or route config defect.
Stale security master
Inactive or changed instrument metadata should not silently pass as valid.
Reference data load failure or stale cache.
Missing settlement instructions or bad account setup
Order may execute but post-trade workflow should block with a clear error before downstream corruption occurs.
Account setup or SSI defect.
Duplicate order ID or duplicate execution ID
System should detect, reject, or quarantine duplicates.
Idempotency or persistence issue.
Average price, notional, and fee rounding
Math must be correct to the configured precision across fills and reports.
Precision or rounding logic defect.

4. Market calendar and date edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
Order before market open
Behavior should follow market rules and order instructions; timestamps and status must be accurate.
Session/calendar configuration issue.
Order after market close
System should reject, queue, or mark the order correctly based on allowed behavior.
Trading-hours rule defect.
Trading halt on symbol
Order should be blocked or handled under halt rules; no misleading acceptance state.
Market-status handling defect.
Holiday or early-close session
Business date, market open/close windows, and settlement logic should match the calendar.
Calendar or session schedule defect.
Settlement date mismatch
Settlement report and RHUB should carry the correct settlement cycle for the market.
Settlement calendar or mapping defect.

5. Reconciliation and downstream edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
Blotter vs order history mismatch
UI and history should tell the same lifecycle story.
Event persistence or history build issue.
Executions vs positions mismatch
Executed quantity should match resulting position with no duplicate or missing impact.
Position engine lag or duplicate exec handling.
Executions vs RHUB mismatch
RHUB should match the source trade details exactly or surface a recon break.
Downstream transformation or timing issue.
Settlement totals do not match execution totals
Report should be flagged failed or incomplete; no silent mismatch.
Batch/reporting defect.
Missing or duplicate downstream booking
Every trade should book once and only once.
Interface retry bug or consumer duplication.

6. Logging and supportability edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
Failure with missing order ID or session context in logs
This should count as a test failure even if UI behavior is acceptable because supportability is incomplete.
Poor instrumentation.
Generic error message with no actionable reason
User-facing and support-facing diagnostics should be specific enough for triage.
Weak error taxonomy or logging standards.
Silent failure with no alert or no traceable error path
System should leave enough evidence to reconstruct what happened.
Monitoring and observability gap.
Cross-system tracing missing between OMS, route, and downstream reports
A single issue should be traceable across systems using IDs and timestamps.
Correlation ID or logging design gap.

7. Multi-user and permission edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
One user modifies order while another views it
Viewer should see consistent state; modifier's changes should propagate correctly without data races.
Concurrency control or cache invalidation defect.
User attempts action beyond their entitlement
Action should be cleanly blocked with clear permission error; no partial execution or misleading state.
Entitlement check timing or enforcement gap.
Different users see different order states
All entitled users should see the same current state for shared orders/accounts.
Visibility filtering or state synchronization issue.
Permission change during active session
User should not retain access to newly restricted functions; session should reflect updated entitlements.
Entitlement cache refresh defect.
Concurrent order submission by multiple users
System should handle race conditions properly; no duplicate orders or conflicting states.
Idempotency or locking mechanism defect.

8. Report timing and batch processing edge cases
Edge case scenario
Acceptance criteria
Likely root cause if failed
Intraday report generation timing
Reports should generate at correct intervals with complete data up to cutoff time.
Batch scheduling or data availability timing issue.
End-of-day batch cutoff precision
Trades after cutoff should appear in next day's reports; cutoff should be exact to the second.
Time zone handling or cutoff logic defect.
Settlement report timing vs market close
Settlement cycle should align with market conventions; no premature or delayed processing.
Calendar configuration or settlement rule defect.
RHUB timing vs execution timing
RHUB should process after settlement but reflect all executions; timing dependencies should be clear.
Downstream processing order or dependency defect.
Report reconciliation across different cutoff times
Reports with different generation schedules should still reconcile correctly.
Timing mismatch or reconciliation logic defect.
Historical report regeneration
Regenerated reports should match original reports exactly for the same time period.
Data consistency or regeneration logic defect.

Recommended run order
Baseline environment certification -> core lifecycle scenarios -> edge cases addendum -> settlement and RHUB checks -> history and positions -> RCA pack for any failure.