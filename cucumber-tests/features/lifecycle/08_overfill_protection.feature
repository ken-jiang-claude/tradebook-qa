Feature: Overfill Protection
  As a QA analyst
  I need to verify that fill quantities exceeding the order quantity are blocked
  So that positions and books are never overstated

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @overfill
  Scenario: Overfill attempt is blocked
    Given an open buy order exists for 100 shares of "AAPL" at limit price 150.00
    And the order status is "New"
    When a fill execution arrives for 150 shares at price 150.00
    Then the overfill is detected by the system
    And the order quantity ceiling is enforced
    And the cumulative quantity (CumQty) does not exceed 100
    And an overfill alert or error is visible to the QA user
    And the overfill event is recorded in the application log

  @lifecycle @overfill
  Scenario: Overfill after partial fill is blocked
    Given an open buy order exists for 200 shares of "AAPL" at limit price 150.00
    And a fill execution has already been processed for 150 shares
    And the order status is "Partially Filled"
    When a fill execution arrives for 100 shares at price 150.00
    Then the overfill is detected by the system
    And the cumulative quantity (CumQty) does not exceed 200
    And the overfill event is recorded in the application log

  @lifecycle @overfill
  Scenario: Exact fill quantity equal to order quantity is accepted
    Given an open buy order exists for 100 shares of "AAPL" at limit price 150.00
    When a fill execution arrives for 100 shares at price 150.00
    Then the order status becomes "Filled"
    And the cumulative quantity (CumQty) is 100
    And no overfill alert is raised
