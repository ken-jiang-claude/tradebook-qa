Feature: Position Management
  As a QA analyst
  I need to verify that positions reflect only executed trade quantities
  So that the position book is accurate and free from phantom or duplicate entries

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @position
  Scenario: Position reflects only executed quantities
    Given the starting position for "AAPL" in account "QA_TEST_ACCOUNT" is 0 shares
    When a buy order for 100 shares of "AAPL" is fully filled at 150.00
    And a buy order for 50 shares of "AAPL" is partially filled for 30 shares
    And a buy order for 200 shares of "AAPL" is submitted and then cancelled before any fill
    Then the net position for "AAPL" is 130 shares
    And the position does not include quantity from the cancelled order
    And the position does not include the unfilled 20 shares from the partial order

  @lifecycle @position
  Scenario: Rejected order has no position impact
    Given the starting position for "MSFT" in account "QA_TEST_ACCOUNT" is 0 shares
    When a buy order for 100 shares of "MSFT" is submitted with an invalid price
    And the order is rejected by the system
    Then the net position for "MSFT" remains 0 shares

  @lifecycle @position
  Scenario: Sell order reduces position correctly
    Given the starting position for "AAPL" in account "QA_TEST_ACCOUNT" is 200 shares
    When a sell order for 50 shares of "AAPL" is fully filled at 155.00
    Then the net position for "AAPL" is 150 shares

  @lifecycle @position
  Scenario: Position updates are visible immediately after fill
    Given the starting position for "TSLA" in account "QA_TEST_ACCOUNT" is 0 shares
    When a buy order for 100 shares of "TSLA" is fully filled at 200.00
    Then the net position for "TSLA" is 100 shares within 5 seconds of the fill

  @lifecycle @position
  Scenario: Position management shows no duplicate entries
    Given a buy order for 100 shares of "AAPL" has been fully filled at 150.00
    When the QA views the position detail for "AAPL"
    Then each execution appears exactly once in the position detail
    And the total position quantity equals the sum of all unique fill quantities
