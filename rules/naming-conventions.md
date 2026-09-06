# Naming Conventions

## Files

| Kind | Pattern | Example |
|---|---|---|
| Feature | `kebab-case.feature`, named after the business flow, not the HU number | `features/login.feature` |
| Page Object | `PascalCase` + `Page` suffix | `pages/LoginPage.ts` |
| Component | `PascalCase`, no suffix | `components/Header.ts`, `components/DataTable.ts` |
| Step file | matches the feature it primarily serves, `kebab-case.steps.ts` | `steps/login.steps.ts` |
| API client | `PascalCase` + `Client` suffix | `api/OrdersClient.ts` |
| DB client | `PascalCase` + `Client` suffix | `database/SqlClient.ts`, `database/MongoClient.ts` |
| Fixture/World file | `camelCase` or `world`/`hooks` for the Cucumber wiring | `fixtures/world.ts`, `fixtures/hooks.ts` |
| Helper | `camelCase`, named after the utility, not "utils" | `helpers/logger.ts` |

**Never** append `New`, `2`, `Final`, `Updated`, `Old`, `Copy` to a filename. If a file
needs to change, edit it. If two variants must coexist, name them by what makes them
different (`LoginPage.ts` vs `AdminLoginPage.ts`), not by revision order.

## Classes / Types

- Page Objects: `class LoginPage` — one class per file, default export not required,
  named export matching the filename.
- Methods on Page Objects describe a user action or a fact, not a mechanism:
  - `enterUsername(value)`, `submit()`, `getErrorMessage()`, `isErrorMessageVisible()`
  - not `clickLoginButton()` when `submit()` says the same thing at the right altitude,
    not `findFlashDiv()` (implementation detail leaking into the public method name).
- The Cucumber `World` subclass is `QaWorld` (see `fixtures/world.ts`). Any additional
  shared state (authenticated user, API client, DB client) is added as a property on
  `QaWorld`, not as a second parallel World.

## Gherkin

- `Feature:` titles are the capability, e.g. `Authentication`, not the HU id.
- `Scenario:` titles describe behavior: `Login with invalid credentials`, not
  `TC-001` or `Test case for HU-12345`.
- Step text is business language: `the user submits the login form`, never
  `the user clicks button#submit`.

## Test data / environment

- Config keys in `config/env.ts` are `camelCase` in code, `UPPER_SNAKE_CASE` in `.env`
  (`BASE_URL`, `HEADLESS`, `DEFAULT_TIMEOUT`).
- Do not hardcode environment-specific values (URLs, credentials, timeouts) in a page,
  step, or fixture — read them from `config/env.ts`.
