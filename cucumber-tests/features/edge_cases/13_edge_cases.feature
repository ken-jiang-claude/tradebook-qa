# ============================================================
#  Feature: Edge Case Scenarios
#
#  These scenarios cover advanced resilience, race-condition,
#  and multi-system scenarios that require capabilities beyond
#  the current mock environment (live FIX session, real market
#  data stream, multi-user concurrency, external batch systems).
#
#  @known-issue tags indicate EXPECTED failures with documented
#  root causes. They are included to demonstrate coverage
#  awareness and to show what would be needed in a full
#  production QA environment.
# ============================================================

Feature: Edge Case Scenarios
  As a QA engineer
  I want to validate resilience and boundary conditions
  So that the system behaves correctly under non-ideal circumstances

  # ── Session & Connectivity ─────────────────────────────────

  @known-issue @edge-case @session
  Scenario: Order submitted while FIX session is disconnected
    # Root cause: Mock has no real FIX session — session disconnect
    # cannot be simulated without a live gateway connection.
    # Fix needed: Integrate a FIX engine (e.g. QuickFIX/J) with
    # controllable session state.
    Given the QA user is logged in
    And the FIX session is forcibly disconnected
    When QA submits a buy order for 100 shares of AAPL at 150.00
    Then the order should be blocked or rejected with a connectivity error
    And the session monitor should show "Disconnected"

  @known-issue @edge-case @session
  Scenario: Session drops after order send but before acknowledgment
    # Root cause: Mock processes orders synchronously in-memory.
    # A mid-flight disconnect scenario requires async message queuing
    # and reconnect/replay logic.
    # Fix needed: Async order pipeline with durable message queue.
    Given the QA user is logged in
    And a buy order for 200 shares of MSFT at 400.00 has been submitted
    When the FIX session drops immediately after order submission
    And the session reconnects after 5 seconds
    Then the order state should be consistent — not duplicated or lost
    And the audit trail should show the disconnect and reconnect events

  @known-issue @edge-case @session
  Scenario: Duplicate message replayed on session reconnect
    # Root cause: Mock has no sequence number management or replay
    # deduplication at the session level.
    # Fix needed: FIX sequence gap detection and resend request handling.
    Given the QA user is logged in
    And order "ORD-REPLAY-001" has been acknowledged
    When the same acknowledgment message is replayed after reconnect
    Then the duplicate message should be detected and ignored
    And the order should remain in its current state without duplication

  # ── Race Conditions ────────────────────────────────────────

  @known-issue @edge-case @race-condition
  Scenario: Cancel request crosses with fill in flight
    # Root cause: Mock processes state changes synchronously.
    # A true race condition (cancel ack and fill arriving simultaneously)
    # cannot be reproduced without async message processing.
    # Fix needed: Async event bus with configurable message ordering.
    Given an open buy order exists for 500 shares of TSLA at 200.00
    When a cancel request is sent simultaneously with a fill for 500 shares
    Then the final state should be either "Filled" or "Canceled" — never both
    And the audit trail should reflect the actual event sequence

  @known-issue @edge-case @race-condition
  Scenario: Modify request arrives after order is fully filled
    # Root cause: Mock does not enforce post-fill state immutability
    # at the message routing layer.
    # Fix needed: State machine guard at the message ingestion point.
    Given an order for 100 shares of AAPL at 150.00 has been fully filled
    When a modify request is sent to change quantity to 200 shares
    Then the modify should be rejected with reason "Order already filled"
    And the order status should remain "Filled"

  # ── Multi-User & Permissions ───────────────────────────────

  @known-issue @edge-case @multi-user
  Scenario: Two users modify the same order simultaneously
    # Root cause: Mock is single-session only. Multi-user concurrency
    # requires separate browser contexts with shared server state.
    # Fix needed: Shared backend store (e.g. Node.js server with WebSocket
    # push) so two simultaneous sessions see consistent state.
    Given user "trader_1" has an open order for 300 shares of MSFT at 390.00
    And user "trader_2" is viewing the same order
    When "trader_1" modifies the quantity to 400 shares
    And "trader_2" simultaneously modifies the price to 395.00
    Then only one modification should be accepted
    And both users should see the same final order state

  @known-issue @edge-case @multi-user
  Scenario: User attempts action beyond their entitlement
    # Root cause: Mock grants all permissions to any logged-in user.
    # Fix needed: Role-based entitlement model with per-user permission
    # checks enforced at the action level.
    Given a read-only user "viewer_1" is logged in
    When "viewer_1" attempts to submit a new order
    Then the NEW ORDER button should be disabled or hidden
    And any direct API call to submit should return "Permission denied"

  # ── Batch & Timing ─────────────────────────────────────────

  @known-issue @edge-case @batch
  Scenario: Settlement report does not include trades after batch cutoff
    # Root cause: Mock generates settlement data on demand with no
    # concept of batch cutoff time.
    # Fix needed: Time-aware batch processor with configurable EOD cutoff.
    Given a trade was executed at 16:01 ET after market close
    When the end-of-day settlement batch runs at 16:00 ET
    Then the late trade should NOT appear in today's settlement report
    And it should appear in the next business day's report

  @known-issue @edge-case @batch
  Scenario: RHUB processes before settlement is complete
    # Root cause: Mock has no processing order dependency between
    # settlement and RHUB.
    # Fix needed: Event-driven pipeline with settlement-complete signal
    # before RHUB processing begins.
    Given a trade has been executed but settlement batch has not completed
    When RHUB processing runs before settlement finalizes
    Then RHUB should either wait or surface an "incomplete data" warning
    And the reconciliation status should not show "Completed" prematurely
