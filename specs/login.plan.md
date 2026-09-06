# Login Functionality Test Plan

## Application Overview

This plan covers the login functionality of the Form Authentication page at https://the-internet.herokuapp.com/login. The page provides a simple username/password form. Valid credentials (username: `tomsmith`, password: `SuperSecretPassword!`) redirect the user to the `/secure` area and display a green flash success message ("You logged into a secure area!") with a Logout link. Invalid credentials keep the user on the `/login` page and display a red flash error message: "Your username is invalid!" when the username does not match, or "Your password is invalid!" when the username is correct but the password does not match. Submitting the form with both fields empty is treated as an invalid username, showing the same "Your username is invalid!" message, since the username is validated before the password. Each scenario below assumes a fresh navigation to https://the-internet.herokuapp.com/login as the starting state.

## Test Scenarios

### 1. Login Functionality

**Seed:** `drafts/seed.spec.ts`

#### 1.1. Successful login with valid credentials

**File:** `specs/login/valid-credentials.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed with a 'Username' textbox, a 'Password' textbox, and a 'Login' button
    - expect: No flash message is shown
  2. Enter 'tomsmith' into the Username field
    - expect: The Username field contains the value 'tomsmith'
  3. Enter 'SuperSecretPassword!' into the Password field
    - expect: The Password field contains the masked value
  4. Click the 'Login' button
    - expect: The browser is redirected to https://the-internet.herokuapp.com/secure
    - expect: A green success flash message containing 'You logged into a secure area!' is displayed
    - expect: The 'Secure Area' heading is visible
    - expect: A 'Logout' link is visible
  5. Click the 'x' close icon on the flash message
    - expect: The flash message is dismissed and no longer visible

#### 1.2. Login attempt with invalid username and valid password

**File:** `specs/login/invalid-username.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter a non-existent username such as 'wronguser' into the Username field
    - expect: The Username field contains the value 'wronguser'
  3. Enter the valid password 'SuperSecretPassword!' into the Password field
    - expect: The Password field contains the masked value
  4. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your username is invalid!' is displayed
    - expect: The user is NOT redirected to the secure area
    - expect: No 'Logout' link is present

#### 1.3. Login attempt with valid username and invalid password

**File:** `specs/login/invalid-password.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter the valid username 'tomsmith' into the Username field
    - expect: The Username field contains the value 'tomsmith'
  3. Enter an incorrect password such as 'wrongpassword' into the Password field
    - expect: The Password field contains the masked value
  4. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your password is invalid!' is displayed
    - expect: The user is NOT redirected to the secure area
    - expect: No 'Logout' link is present

#### 1.4. Login attempt with both username and password invalid

**File:** `specs/login/invalid-username-and-password.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter a non-existent username such as 'baduser' into the Username field and an incorrect password such as 'badpass' into the Password field
    - expect: Both fields contain the entered values
  3. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your username is invalid!' is displayed (username is validated before password)
    - expect: The user is NOT redirected to the secure area

#### 1.5. Submit login form with both fields empty

**File:** `specs/login/empty-fields.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed with both Username and Password fields empty
  2. Without entering any text, click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your username is invalid!' is displayed
    - expect: The user is NOT redirected to the secure area

#### 1.6. Submit login form with username filled and password empty

**File:** `specs/login/empty-password.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter the valid username 'tomsmith' into the Username field and leave the Password field empty
    - expect: The Username field contains 'tomsmith' and the Password field is empty
  3. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your password is invalid!' is displayed
    - expect: The user is NOT redirected to the secure area

#### 1.7. Submit login form with password filled and username empty

**File:** `specs/login/empty-username.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Leave the Username field empty and enter 'SuperSecretPassword!' into the Password field
    - expect: The Username field is empty and the Password field contains the masked password value
  3. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your username is invalid!' is displayed
    - expect: The user is NOT redirected to the secure area

#### 1.8. Flash error message can be dismissed and does not block retry

**File:** `specs/login/error-message-dismiss-and-retry.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter an invalid username and an invalid password, then click 'Login'
    - expect: A red error flash message containing 'Your username is invalid!' is displayed
  3. Click the 'x' icon on the flash message to close it
    - expect: The flash message is dismissed from the DOM/view
  4. Re-enter the valid username 'tomsmith' and valid password 'SuperSecretPassword!', then click 'Login' again
    - expect: The user is redirected to https://the-internet.herokuapp.com/secure
    - expect: A success flash message containing 'You logged into a secure area!' is displayed

#### 1.9. Username field is case-sensitive

**File:** `specs/login/case-sensitive-username.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter 'TomSmith' (mixed case) into the Username field and 'SuperSecretPassword!' into the Password field
    - expect: Fields contain the entered values
  3. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your username is invalid!' is displayed, confirming the username check is case-sensitive

#### 1.10. Password field is case-sensitive

**File:** `specs/login/case-sensitive-password.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter 'tomsmith' into the Username field and 'supersecretpassword!' (all lowercase) into the Password field
    - expect: Fields contain the entered values
  3. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your password is invalid!' is displayed, confirming the password check is case-sensitive

#### 1.11. Leading/trailing whitespace in credentials is treated as invalid

**File:** `specs/login/whitespace-credentials.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login
    - expect: The Login Page is displayed
  2. Enter ' tomsmith ' (with leading and trailing spaces) into the Username field and 'SuperSecretPassword!' into the Password field
    - expect: The Username field contains the value including the spaces
  3. Click the 'Login' button
    - expect: The user remains on https://the-internet.herokuapp.com/login
    - expect: A red error flash message containing 'Your username is invalid!' is displayed, confirming whitespace is not trimmed

#### 1.12. Logged-in user can log out and is returned to the login page

**File:** `specs/login/logout-flow.spec.ts`

**Steps:**
  1. Navigate to https://the-internet.herokuapp.com/login and log in with valid credentials 'tomsmith' / 'SuperSecretPassword!'
    - expect: The user is redirected to https://the-internet.herokuapp.com/secure
  2. Click the 'Logout' link
    - expect: The user is redirected back to https://the-internet.herokuapp.com/login
    - expect: A flash message confirming logout (e.g. 'You logged out of the secure area!') is displayed
    - expect: The Username and Password fields are visible and empty
  3. Attempt to navigate directly to https://the-internet.herokuapp.com/secure after logging out
    - expect: The user is redirected back to the login page since the session has ended, and cannot access the secure area without logging in again
