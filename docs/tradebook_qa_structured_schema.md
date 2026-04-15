Bloomberg TradeBook QA Structured Schema
Code-oriented schema derived from the detailed testing scenarios
Purpose. Use this schema to convert manual QA scenarios into a structured checklist, test harness input, or rules-based validation layer. The interview document stays concise; this document is the bridge from business scenario to implementation.
1. Core schema fields
Field
What it means
Example
module
Top-level area such as environment, lifecycle, settlement, or positions.
environment
scenario_id
Stable machine-friendly identifier.
ENV_LOGIN_001
scenario_name
Human-readable scenario title.
QA login to beta environment
stage
Lifecycle grouping for reporting and filtering.
environment_readiness
priority
Execution priority.
P0
preconditions
Data, system, or account setup needed before execution.
QA user exists; beta URL available
test_steps
Ordered user or system actions.
Open beta URL; sign in; verify landing page
acceptance_criteria
Exact pass condition.
User lands in beta, not production
expected_results
Observable app or data behavior.
Landing page loads; environment banner shows beta
evidence
What to capture for pass/fail proof.
Screenshot, URL, timestamp, user ID
log_checks
Logs or technical traces to inspect.
Auth log, session log, environment header
failure_indicators
Observable signs the test failed.
Redirect to prod; access denied; timeout
rca_tags
Standardized root-cause categories.
environment, auth, entitlement
downstream_checks
Cross-system validations after the main step.
Order history and audit trail updated
2. Recommended execution model
• Environment first: environment_check -> lifecycle_test -> post_trade_check -> reconciliation.
• Every scenario should have a clear acceptance_criteria field. This is what turns a checklist into a real test artifact.
• Keep rca_tags standardized so failures can be grouped by environment, static_data, entitlement, connectivity, dependency, or product_defect.
3. Example schema records
ID
Module
Scenario
Acceptance criteria
Evidence keys
RCA tags
ENV_LOGIN_001
environment
QA login to beta environment
Valid QA credentials work, user lands in beta, not production
auth_log, screenshot, url_check
environment|auth|entitlement
ORD_NEW_010
lifecycle
Create new equity order
Order accepted, unique order ID generated, blotter updated
order_id, audit_trail, blotter_row
static_data|validation|routing
EXEC_PARTIAL_020
execution
Process partial fill
CumQty, LeavesQty, AvgPx, status all correct
exec_report, blotter_state, position_delta
message_order|duplicate_exec|calc_defect
SETTLE_RHUB_030
post_trade
Validate settlement and RHUB report
Trade appears in settlement output and RHUB with matching values
report_extract, rhub_record, reconciliation_result
batch_timing|mapping|downstream_dependency
4. Simple implementation shape
YAML example
- module: environment
scenario_id: ENV_LOGIN_001
scenario_name: QA login to beta environment
stage: environment_readiness
priority: P0
preconditions:
- QA account is active
- beta endpoint is available
test_steps:
- Open beta URL
- Sign in with QA account
- Verify landing page and environment label
acceptance_criteria:
- Login succeeds
- Environment label shows beta
- No production banner or prod URL
evidence:
- screenshot
- timestamp
- URL
rca_tags: [environment, auth, entitlement]

5. Minimal cornerstone modules to keep in the schema
Module
Must include
Environment
machine health, login, security master, market data, entitlement, routing session, logs
Order lifecycle
new, modify, cancel, reject, cancel reject, replace reject
Execution
full fill, partial fill, duplicate exec, overfill, out-of-order messages
Post-trade
settlement report, RHUB, booking, batch timing, business date
History and positions
order history, execution history, position update, reconciliation
Recovery and supportability
restart behavior, replay, reconnect, evidence, log completeness, RCA tags
Recommended next step. Turn each scenario into a machine-readable record and keep acceptance_criteria, evidence, and rca_tags mandatory. Those three fields are the cornerstone of converting business QA into code-based validation.