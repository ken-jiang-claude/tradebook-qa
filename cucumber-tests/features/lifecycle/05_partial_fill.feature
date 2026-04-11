Feature: Partial Fill
  As a QA analyst
  I need to verify that a partial execution updates order fields correctly
  So that CumQty, LeavesQty, AvgPx, and status are all accurate

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @partial-fill
  Scenario: Order receives a single partial fill
    Given an open buy order exists for 500 shares of "AAPL" at limit price 150.00
    And the order status is "New"
    When a fill execution arrives for 200 shares at price 149.80
    Then the order status becomes "Partially Filled"
    And the cumulative quantity (CumQty) is 200
    And the leaves quantity (LeavesQty) is 300
    And the average price (AvgPx) is 149.80
    And the execution appears in order history with correct quantity and price
    And the position is updated to reflect 200 shares acquired

  @lifecycle @partial-fill
  Scenario: Order receives two sequential partial fills
    Given an open buy order exists for 500 shares of "AAPL" at limit price 150.00
    And the order status is "New"
    When a fill execution arrives for 100 shares at price 149.50
    And a fill execution arrives for 150 shares at price 150.00
    Then the order status is "Partially Filled"
    And the cumulative quantity (CumQty) is 250
    And the leaves quantity (LeavesQty) is 250
    And the average price (AvgPx) is 149.80
    And both executions appear in order history
    And the position reflects 250 shares acquired

  @lifecycle @partial-fill
  Scenario: Partial fill does not allow modification of filled quantity
    Given an open buy order for 500 shares of "AAPL" has been partially filled for 200 shares
    When the QA attempts to modify the quantity to 150
    Then the modify request is rejected
    And a clear rejection reason explains the quantity is below the filled amount
