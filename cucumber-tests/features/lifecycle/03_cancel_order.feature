Feature: Cancel Order
  As a QA analyst
  I need to verify that an open order can be cancelled cleanly
  So that no unjustified executions occur after cancellation

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @cancel-order
  Scenario: QA cancels an open order
    Given an open buy order exists for 200 shares of "MSFT" at limit price 300.00
    And the order status is "New"
    When the QA submits a cancel request for the order
    Then the system acknowledges the cancel request
    And the order status transitions to "Canceled"
    And no fill execution is recorded after the cancel timestamp
    And the audit trail records the cancel event with timestamp and user ID

  @lifecycle @cancel-order
  Scenario: Cancel is rejected for an already-filled order
    Given a buy order for 50 shares of "MSFT" has status "Filled"
    When the QA attempts to cancel the filled order
    Then the cancel request is rejected
    And the order status remains "Filled"
    And a clear rejection reason is shown to the QA user

  @lifecycle @cancel-order
  Scenario: Cancel is rejected for an already-cancelled order
    Given a buy order for 50 shares of "MSFT" has status "Canceled"
    When the QA attempts to cancel the already-cancelled order
    Then the cancel request is rejected
    And the order status remains "Canceled"
    And a clear rejection reason is shown to the QA user

  @lifecycle @cancel-order
  Scenario: Cancel of a partially filled order leaves correct state
    Given an open buy order exists for 500 shares of "MSFT" at limit price 300.00
    And the order has been partially filled for 200 shares
    And the order status is "Partially Filled"
    When the QA submits a cancel request for the remaining quantity
    Then the system acknowledges the cancel request
    And the order status transitions to "Partially Filled and Canceled"
    And the cumulative quantity (CumQty) remains 200
    And the leaves quantity (LeavesQty) becomes 0
    And the audit trail records the cancel event with timestamp and user ID
