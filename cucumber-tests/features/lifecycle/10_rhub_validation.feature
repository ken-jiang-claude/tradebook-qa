Feature: RHUB Validation
  As a QA analyst
  I need to verify that RHUB records match source trade details exactly
  So that reconciliation breaks are caught before they reach downstream systems

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"

  @smoke @lifecycle @rhub
  Scenario: RHUB record matches the source trade
    Given a buy order for 100 shares of "AAPL" has been fully filled at 150.00
    And the trade appears correctly in the settlement report
    When the RHUB processing run has completed
    Then a RHUB record exists for the trade
    And the RHUB symbol matches "AAPL"
    And the RHUB quantity matches 100
    And the RHUB price matches 150.00
    And the RHUB account matches "QA_TEST_ACCOUNT"
    And the RHUB settlement date matches the settlement report settlement date
    And no reconciliation break is flagged for this trade

  @lifecycle @rhub
  Scenario: No RHUB record exists for a cancelled order
    Given a buy order for 200 shares of "AAPL" has been cancelled before any fill
    When the RHUB processing run has completed
    Then no RHUB record exists for the cancelled order

  @lifecycle @rhub
  Scenario: RHUB reconciliation break is raised for a mismatched quantity
    Given a buy order for 100 shares of "AAPL" has been fully filled at 150.00
    And the RHUB record for the trade has an incorrect quantity of 50
    When the QA checks the RHUB reconciliation status
    Then a reconciliation break is flagged for the trade
    And the break details show the expected quantity 100 and actual quantity 50
