Feature: Order History
  As a QA analyst
  I need to verify that order history captures every lifecycle event in sequence
  So that any defect can be diagnosed from the audit trail

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @history
  Scenario: Order history captures a simple new and fill sequence
    Given a buy order for 100 shares of "AAPL" has been fully filled at 150.00
    When the QA opens the order history for the order
    Then the history contains exactly 2 events in sequence
    And event 1 has type "New" with quantity 100 and price 150.00
    And event 2 has type "Filled" with cumulative quantity 100
    And each event has a timestamp that is later than the previous event
    And each event records the user ID of the actor

  @lifecycle @history
  Scenario: Order history captures the full add, modify, fill sequence
    Given the following actions have been performed on a single order:
      | action  | detail                           |
      | New     | Buy 100 AAPL @ 150.00           |
      | Modify  | Price changed to 152.00          |
      | Filled  | 100 shares filled at 151.90      |
    When the QA opens the order history for the order
    Then the history contains exactly 3 events in correct sequence
    And the events appear in the order: New, Replace, Filled
    And each event has a timestamp that is later than the previous event
    And each event records the user ID of the actor

  @lifecycle @history
  Scenario: Order history captures partial fill then cancel sequence
    Given the following actions have been performed on a single order:
      | action       | detail                             |
      | New          | Buy 500 AAPL @ 150.00             |
      | Partial Fill | 200 shares filled at 149.80        |
      | Cancel       | Remaining 300 shares cancelled     |
    When the QA opens the order history for the order
    Then the history contains exactly 3 events in correct sequence
    And the events appear in the order: New, Partially Filled, Canceled
    And the final status shown is "Partially Filled and Canceled"

  @lifecycle @history
  Scenario: Order history is read-only and cannot be edited
    Given a buy order for 100 shares of "AAPL" has been fully filled at 150.00
    When the QA opens the order history for the order
    Then no edit or delete controls are available on any history event
