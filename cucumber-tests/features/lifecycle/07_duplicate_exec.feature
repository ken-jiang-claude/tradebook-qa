Feature: Duplicate Execution Protection
  As a QA analyst
  I need to verify that replayed execution reports are safely ignored
  So that positions and order state are not double-counted after FIX session recovery

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @duplicate-exec
  Scenario: Replayed execution report is safely ignored
    Given a buy order for 100 shares of "AAPL" has been fully filled
    And the fill execution has ExecID "EXEC-001"
    When the exchange simulator replays the same execution with ExecID "EXEC-001"
    Then the duplicate execution is detected and rejected
    And the order status remains "Filled"
    And the cumulative quantity (CumQty) remains 100
    And only one execution record exists in order history for ExecID "EXEC-001"
    And the position is not double-counted

  @lifecycle @duplicate-exec
  Scenario: Duplicate partial fill is safely ignored
    Given an open buy order exists for 500 shares of "AAPL" at limit price 150.00
    And a fill execution with ExecID "EXEC-002" has already been processed for 200 shares
    When the exchange simulator replays the same execution with ExecID "EXEC-002"
    Then the duplicate is detected and ignored
    And the cumulative quantity (CumQty) remains 200
    And the order status remains "Partially Filled"
    And only one execution record exists for ExecID "EXEC-002"

  @lifecycle @duplicate-exec
  Scenario: Duplicate detection is logged for audit purposes
    Given a buy order for 100 shares of "AAPL" has been fully filled
    And the fill execution has ExecID "EXEC-003"
    When the exchange simulator replays the same execution with ExecID "EXEC-003"
    Then the duplicate rejection event is recorded in the application log
    And the log entry contains the ExecID "EXEC-003" and the order ID
