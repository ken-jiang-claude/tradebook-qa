Feature: Modify Order
  As a QA analyst
  I need to verify that an open order can be modified correctly
  So that price and quantity changes are reflected with full chain integrity

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @modify-order
  Scenario: QA modifies the price of an open order
    Given an open buy order exists for 100 shares of "AAPL" at limit price 150.00
    And the order status is "New"
    When the QA modifies the limit price to 152.00
    Then the order is updated with the new limit price 152.00
    And the order quantity remains 100
    And the order status remains "New"
    And the original order and the replacement are linked in order history
    And the audit trail records the modify action with timestamp and user ID

  @lifecycle @modify-order
  Scenario: QA modifies the quantity of an open order
    Given an open buy order exists for 100 shares of "AAPL" at limit price 150.00
    And the order status is "New"
    When the QA modifies the quantity to 200
    Then the order is updated with the new quantity 200
    And the limit price remains 150.00
    And the order status remains "New"
    And the original order and the replacement are linked in order history

  @lifecycle @modify-order
  Scenario: Modify is rejected when order is already filled
    Given a buy order for 100 shares of "AAPL" has status "Filled"
    When the QA attempts to modify the limit price to 155.00
    Then the modify request is rejected
    And the order status remains "Filled"
    And a clear rejection reason is shown to the QA user

  @lifecycle @modify-order
  Scenario: Modify is rejected when order is already cancelled
    Given a buy order for 100 shares of "AAPL" has status "Canceled"
    When the QA attempts to modify the limit price to 155.00
    Then the modify request is rejected
    And the order status remains "Canceled"
    And a clear rejection reason is shown to the QA user
