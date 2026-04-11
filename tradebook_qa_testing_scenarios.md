Bloomberg TradeBook QA Test Scenarios Checklist
Detailed checklist with acceptance criteria, evidence, and cornerstone coverage
Scope: non-production equity trading QA using a QA account in alpha or beta. Goal: certify the environment, test the lifecycle, validate downstream outputs, and collect enough evidence to separate real defects from setup issues.
Checklist structure
Use this pattern for each scenario: Scenario -> Acceptance Criteria -> Pass Evidence -> Fail Indicators -> Likely Root Cause.
A. Environment readiness
Scenario
Acceptance Criteria
Pass Evidence
Likely Root Cause if Failed
QA login and correct environment
Login succeeds with QA credentials; environment label/URL shows alpha or beta; not connected to production.
Screenshot of landing page, URL/banner, timestamp.
Wrong endpoint, invalid credential, SSO issue, entitlement setup.
Machine and service health
OMS/EMS, blotter, order entry, and core services are up; no blocker incident.
Health dashboard or screen capture.
Server outage, bad deploy, infra issue.
Security master
Test symbols resolve correctly and are tradable in the test market.
Instrument lookup result.
Stale or bad reference data.
Market data
Bid/ask or last price is present and current for test symbols.
Quote snapshot with timestamp.
Feed outage, stale cache, permission issue.
Entitlement and account access
QA user can access allowed accounts and functions; restricted actions remain blocked.
Accessible account and enabled controls.
Role mapping issue, stale entitlement cache.
Routing/connectivity
Test broker or exchange session is up; sequence and heartbeats are healthy.
Session monitor/logon status.
FIX disconnect, sequence mismatch, simulator outage.
Downstream dependencies
Settlement, RHUB, booking, reporting, and position systems are reachable.
Connectivity check or successful query.
Downstream outage or interface break.
Logging and observability
Application logs, session logs, and error logs are available and searchable.
Sample correlated log lookup.
Missing log access or poor instrumentation.
Business date and market calendar
Trade date, settlement cycle, holiday calendar, and market session match the intended test date.
Displayed business date/calendar evidence.
Wrong system date, bad calendar setup.

B. Trade lifecycle scenarios
Scenario
Acceptance Criteria
Likely Root Cause if Failed
Add new order
Valid order creates an order ID, appears in blotter/history, and enters the correct state.
Validation defects, entitlement, routing, or static data issue.
Modify order
Open order reflects updated price/qty, keeps chain integrity, and updates audit trail.
State machine defect, replace rules, race condition.
Cancel order
Open order transitions to canceled after ack; no unjustified execution after cancel.
Cancel routing failure, stale state, session issue.
Order reject
Reject reason is meaningful; status becomes Rejected; no unintended downstream impact.
Business rule, exchange reject, bad mapping.
Partial fill
CumQty, LeavesQty, AvgPx, and Partially Filled status are correct.
Execution math defect, duplicate/incomplete exec handling.
Full fill
CumQty equals order qty; LeavesQty is zero; status becomes Filled; position impact is correct.
Fill processing or position sync issue.
Duplicate execution protection
Replayed ExecID is ignored or flagged once only.
Dedup logic defect or replay bug.
Overfill protection
System flags or blocks fill quantity beyond order quantity.
Quantity ceiling/check defect.
Settlement report
Trade appears with correct symbol, side, qty, account, trade date, and settlement date.
Report mapping, batch failure, date logic defect.
RHUB validation
RHUB record matches source trade and report values with no reconciliation break.
Transform issue, downstream interface problem.
Order history
History preserves add/modify/cancel/fill/reject sequence with timestamps and user actions.
Event persistence or audit defect.
Position management
Positions reflect executed trades only; no duplicates or missing quantities.
Position engine sync defect or duplicate fill handling issue.

C. Cornerstones that are often missed
Trading calendar and business date: verify holidays, early close, market session, and settlement cycle.
Session recovery and restart behavior: confirm what happens after app restart, FIX reconnect, or replay.
Out-of-order and duplicate messages: fills, rejects, cancels, and replaces can arrive in awkward order.
Race conditions: fill while cancel is pending, replace after full fill, cancel ack crossing with execution.
Static data beyond symbol lookup: settlement instructions, destination mapping, commission/fee schedule, and account setup.
Rounding and precision: average price, notional, fees, and currency conversions.
Multi-user visibility and permission boundaries: one user acts, another views or is blocked appropriately.
Report timing and batch cutoffs: verify intraday vs end-of-day outputs, especially settlement and RHUB timing.
Reconciliation across systems: blotter, execution history, reports, RHUB, and positions should all tie out.
Supportability: every scenario should leave enough log evidence to diagnose quickly.
D. RCA evidence pack
Timestamp, order ID/ClOrdID, user ID, symbol, route/session, and environment name.
Screenshots of the UI state and the expected/actual status.
Application log line, error code, and related inbound/outbound message.
Session state for FIX or gateway connectivity.
Classification: environment, configuration, entitlement, static data, connectivity, dependency, or code defect.
E. Recommended flow
Environment Check -> Order Add/Modify/Cancel -> Rejects -> Partial/Full Fills -> Settlement Report and RHUB -> Order History -> Position Management -> Log Review and RCA