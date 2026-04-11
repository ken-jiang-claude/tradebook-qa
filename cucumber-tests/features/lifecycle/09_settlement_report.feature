Feature: Settlement Report
  As a QA analyst
  I need to verify that filled trades appear correctly in the settlement report
  So that settlement instructions are accurate and the T+2 cycle is respected

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And today's trade date is a valid settlement business day

  @smoke @lifecycle @settlement
  Scenario: Filled trade appears correctly in the settlement report
    Given a buy order for 100 shares of "AAPL" has been fully filled at 150.00
    When the settlement report is generated or refreshed
    Then the trade appears in the settlement report
    And the report row contains:
      | field           | expected_value  |
      | symbol          | AAPL            |
      | side            | Buy             |
      | quantity        | 100             |
      | price           | 150.00          |
      | account         | QA_TEST_ACCOUNT |
    And the trade date matches today's date
    And the settlement date is trade date plus 2 business days

  @lifecycle @settlement
  Scenario: Cancelled order does not appear in settlement report
    Given a buy order for 200 shares of "AAPL" has been cancelled before any fill
    When the settlement report is generated or refreshed
    Then no settlement record exists for the cancelled order

  @lifecycle @settlement
  Scenario: Rejected order does not appear in settlement report
    Given a buy order for 100 shares of "AAPL" has been rejected
    When the settlement report is generated or refreshed
    Then no settlement record exists for the rejected order

  @lifecycle @settlement
  Scenario: Partially filled and cancelled order appears with correct executed quantity
    Given a buy order for 500 shares of "AAPL" was partially filled for 200 shares then cancelled
    When the settlement report is generated or refreshed
    Then the settlement record shows quantity 200
    And the settlement record does not include the unfilled 300 shares
