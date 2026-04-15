Feature: Add New Order
  As a QA analyst
  I need to verify that a valid order is created correctly
  So that the trade lifecycle begins with a clean, auditable order state

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And market data is live for symbol "AAPL"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @add-order
  Scenario: QA submits a new equity buy order
    Given no existing open orders for symbol "AAPL"
    When the QA submits a buy order for 100 shares of "AAPL" at limit price 150.00
    Then an order ID is assigned immediately
    And the order appears in the blotter with status "New"
    And the side is "Buy", quantity is 100, and limit price is 150.00
    And the audit trail records the submission with timestamp and user ID

  @lifecycle @add-order
  Scenario: QA submits a new equity sell order
    Given no existing open orders for symbol "AAPL"
    When the QA submits a sell order for 50 shares of "AAPL" at limit price 155.00
    Then an order ID is assigned immediately
    And the order appears in the blotter with status "New"
    And the side is "Sell", quantity is 50, and limit price is 155.00
    And the audit trail records the submission with timestamp and user ID

  @lifecycle @add-order
  Scenario: Order submission is rejected when quantity is zero
    When the QA submits a buy order for 0 shares of "AAPL" at limit price 150.00
    Then the order is not created
    And an error message is displayed explaining the invalid quantity
    And no order ID is assigned

  @lifecycle @add-order
  Scenario: Order submission is rejected when price is negative
    When the QA submits a buy order for 100 shares of "AAPL" at limit price -1.00
    Then the order is not created
    And an error message is displayed explaining the invalid price
    And no order ID is assigned

  @lifecycle @add-order
  Scenario: Order submission is rejected for an unknown symbol
    When the QA submits a buy order for 100 shares of "FAKESYM" at limit price 100.00
    Then the order is not created
    And an error message is displayed explaining the unknown instrument
    And no order ID is assigned
