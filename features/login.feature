Feature: Authentication

  Scenario: Login with invalid credentials
    Given the user is on the login page
    When the user enters an invalid username
    And the user enters an invalid password
    And the user submits the login form
    Then the login error message should be displayed

  Scenario: Successful login with valid credentials
    Given the user is on the login page
    When the user enters a valid username
    And the user enters a valid password
    And the user submits the login form
    Then the user should be redirected to the secure area
    And the success message should be displayed
