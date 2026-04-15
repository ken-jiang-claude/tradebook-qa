Feature: Environment Readiness
  As a QA analyst
  I need to certify the test environment before running lifecycle scenarios
  So that defects are not confused with environment or configuration issues

  Background:
    Given the QA user is logged in to the alpha environment

  @smoke @environment
  Scenario: QA login succeeds on alpha environment
    Given the QA user navigates to the alpha environment URL
    When the QA enters valid QA credentials and submits
    Then the login succeeds without error
    And the environment banner displays "ALPHA — NON-PRODUCTION"
    And the system date shown matches today's business date
    And the user is not connected to any production system

  @smoke @environment
  Scenario: Market data is live for test symbols
    When the QA looks up quote data for symbol "AAPL"
    Then a bid price and ask price are displayed
    And the quote timestamp is within the last 60 seconds
    And the price is within a reasonable market range

  @environment
  Scenario: Security master resolves test symbols correctly
    When the QA searches for instrument "AAPL" in the security master
    Then the instrument is found and marked as tradable
    And the instrument details include exchange, currency, and lot size

  @environment
  Scenario: QA account entitlement allows equity order placement
    When the QA views their account permissions
    Then the account "QA_TEST_ACCOUNT" is visible and accessible
    And the "Place Order" function is enabled for equity instruments
    And restricted production accounts are not visible

  @smoke @environment
  Scenario: FIX session to exchange simulator is active
    When the QA checks the session monitor
    Then the exchange simulator session status is "Connected"
    And the last heartbeat timestamp is within the last 30 seconds
    And the sequence numbers are in a valid range with no gaps

  @environment
  Scenario: Downstream dependencies are reachable
    When the QA checks connectivity to downstream systems
    Then the settlement system is reachable
    And the RHUB system is reachable
    And the position management system is reachable
    And the booking system is reachable

  @environment
  Scenario: Application logs are available and searchable
    When the QA searches the application log for today's date
    Then log entries are returned within 5 seconds
    And each log entry contains a timestamp, level, and message
    And the log search can be filtered by order ID

  @environment
  Scenario: Business date and market calendar are correctly configured
    When the QA checks the system business date
    Then the business date matches today's calendar date
    And the market session hours are displayed for the test date
    And the settlement cycle shows T+2 for equity instruments
