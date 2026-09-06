# Gherkin Policy

Gherkin in this repo is a QA contract, not just Cucumber input. A non-technical
reviewer (or the Azure DevOps Test Case it maps to) must be able to read a scenario
and understand the business behavior without reading any code.

## Writing scenarios

1. **Business language only.** No selectors, no HTTP verbs, no table/column names.
   - Good: `Given the user is on the login page`
   - Bad: `Given the browser navigates to "/login"`
2. **One scenario = one behavior.** Do not chain unrelated assertions into a single
   scenario to save time — that produces a test that fails for ambiguous reasons.
3. **Reuse existing steps before writing new ones.** Before adding a step definition,
   search `steps/**/*.steps.ts` for one that already expresses the same business
   action. A new step is only added when no existing phrasing (or a small parameter
   change) covers it.
4. **`Given` sets up state, `When` performs the action under test, `Then` asserts an
   outcome.** Do not put an assertion inside a `When`, and do not perform a state
   change inside a `Then`.
5. **Prefer `Scenario Outline` + `Examples`** over near-duplicate scenarios that only
   differ by input data (e.g. multiple invalid-credential combinations).

## Structure

```gherkin
Feature: Authentication

  Scenario: Login with invalid credentials
    Given the user is on the login page
    When the user enters an invalid username
    And the user enters an invalid password
    And the user submits the login form
    Then the login error message should be displayed
```

- `Feature:` = the capability (maps to an Azure DevOps Test Suite).
- `Scenario:` = one Test Case (maps 1:1 — see [azure-policy.md](./azure-policy.md)).
- Steps are declarative ("the user submits the login form"), not imperative
  ("the user clicks the button with text Login").

## What does NOT belong in a `.feature` file

- Environment values (URLs, ports) — these come from `config/env.ts` via the step/page,
  never written literally in a scenario.
- Technical setup (DB seeding, API mocking) — express it as a business precondition
  (`Given an order already exists in "PAID" status`), and let the step definition decide
  whether that means an API call, a DB insert, or a UI flow.
- Anything that only makes sense to the person who wrote it. If a step needs a comment
  to be understood, rewrite the step.
