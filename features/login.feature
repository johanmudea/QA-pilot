Feature: Authentication

  Scenario: Login with invalid credentials
    Given the user is on the login page
    When the user enters an invalid username
    And the user enters an invalid password
    And the user submits the login form
    Then the login error message should be displayed
