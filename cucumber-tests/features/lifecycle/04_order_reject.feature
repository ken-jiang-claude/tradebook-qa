Feature: Order Reject
  As a QA analyst
  I need to verify that rejected orders show meaningful rejection reasons
  So that QA can distinguish business rule rejections from system errors

  Background:
    Given the QA user is logged in to the alpha environment
    And the environment banner confirms "ALPHA — NON-PRODUCTION"
    And the QA account has entitlement to place equity orders

  @smoke @lifecycle @order-reject
  Scenario Outline: Order is rejected for invalid field values
    When the QA submits a buy order with <field> set to <invalid_value>
    Then the order status becomes "Rejected"
    And the rejection reason displayed contains "<reason_keyword>"
    And no position impact is recorded for the order
    And no settlement record is created for the order

    Examples:
      | field    | invalid_value | reason_keyword     |
      | quantity | 0             | invalid quantity   |
      | price    | -1.00         | invalid price      |
      | symbol   | FAKESYM       | unknown instrument |
      | account  | BADACCT       | invalid account    |

  @lifecycle @order-reject
  Scenario: Exchange rejects order for price out of limit up/down band
    Given an open buy order for 100 shares of "AAPL" is submitted at price 9999.00
    When the exchange simulator rejects the order with reason "Price out of band"
    Then the order status becomes "Rejected"
    And the rejection reason displayed contains "Price out of band"
    And no position impact is recorded for the order

  @lifecycle @order-reject
  Scenario: Rejected order does not appear in settlement report
    Given a buy order for 100 shares of "AAPL" has been rejected
    When the settlement report is generated or refreshed
    Then no settlement record exists for the rejected order
