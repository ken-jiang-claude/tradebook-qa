Feature: Full Fill
  As a QA analyst
  I need to verify that a fully filled order reaches the correct terminal state
  So that CumQty, LeavesQty, status, and position are all accurate and the order is closed

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @full-fill
  Scenario: Order is fully filled in a single execution
    Given an open buy order exists for 100 shares of "TSLA" at limit price 200.00
    And the order status is "New"
    When a fill execution arrives for 100 shares at price 199.50
    Then the order status becomes "Filled"
    And the cumulative quantity (CumQty) is 100
    And the leaves quantity (LeavesQty) is 0
    And the average price (AvgPx) is 199.50
    And the order is closed and no further modifications are possible
    And the position reflects 100 shares of "TSLA" acquired at average price 199.50

  @lifecycle @full-fill
  Scenario: Order is fully filled across two partial executions
    Given an open buy order exists for 300 shares of "TSLA" at limit price 200.00
    And the order status is "New"
    When a fill execution arrives for 100 shares at price 199.00
    And a fill execution arrives for 200 shares at price 200.00
    Then the order status becomes "Filled"
    And the cumulative quantity (CumQty) is 300
    And the leaves quantity (LeavesQty) is 0
    And the average price (AvgPx) is 199.67
    And both executions appear in order history
    And the position reflects 300 shares of "TSLA" acquired

  @lifecycle @full-fill
  Scenario: Filled order cannot be cancelled
    Given a buy order for 100 shares of "TSLA" has status "Filled"
    When the QA attempts to cancel the filled order
    Then the cancel request is rejected
    And the order status remains "Filled"

  @lifecycle @full-fill
  Scenario: Filled order cannot be modified
    Given a buy order for 100 shares of "TSLA" has status "Filled"
    When the QA attempts to modify the limit price to 210.00
    Then the modify request is rejected
    And the order status remains "Filled"
