# Gherkin Policy

Gherkin in this repo is a QA contract, not just Cucumber input. A non-technical
reviewer (or the Azure DevOps Test Case it maps to) must be able to read a scenario
and understand the business behavior without reading any code.

## Language

Any feature carrying an `@hu:<id>` tag (i.e. tied to a real client work item) is
written in **Spanish**, using Cucumber's Spanish Gherkin dialect — the client reads
these as Azure Test Plans Test Cases and must not need a translator. Start the file
with `# language: es` and use `Característica`/`Antecedentes`/`Escenario` and
`Dado`/`Cuando`/`Entonces`/`Y` instead of the English keywords (see
`features/pqrs-creation-step1.feature` for the reference example). Internal
framework scaffolding not tied to a client HU (e.g. `features/login.feature`, our own
demo) stays in English. `helpers/gherkinParser.ts` and `helpers/tcmSteps.ts`
recognize both keyword sets.

## Writing scenarios

1. **Business language only.** No selectors, no HTTP verbs, no table/column names.
   - Good (English framework demo): `Given the user is on the login page`
   - Good (client-facing, Spanish): `Dado que el usuario está en la pantalla de login`
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

## Scenario naming — CP_XX and the Test Case id

Every `Scenario:`/`Escenario:` name (client-facing, `@hu:`-tagged features) follows:

```
CP_XX - TC<testCaseId> - <descripción del comportamiento>
```

```gherkin
@hu:89951 @regression @smoke @testcase:91410
Escenario: CP_01 - TC91410 - La pantalla del paso 1 muestra el título y el mensaje descriptivo
```

- `CP_XX` is a **sequential number per feature file**, zero-padded to 2 digits,
  restarting at `CP_01` for every `.feature` (i.e. every HU) — not a sprint-wide
  counter. It gives the client a short, stable code to reference a case in
  conversation ("falló el CP_05") without needing the Azure id.
- `TC<testCaseId>` is the same id already carried in the `@testcase:<id>` tag,
  repeated in the title so it's visible directly in the Azure Test Plans grid and in
  test reports, without opening the work item.
- The rest of the name is the original business-behavior description — do not lose
  meaning to make room for the prefix.
- `azure/createTestCasesFromFeature.ts` writes `scenario.name` verbatim into
  `System.Title`, so renaming a scenario and re-running `azure:sync-testcases`
  updates the Test Case title in Azure automatically (update path, not create —
  see [azure-policy.md](./azure-policy.md)).

## Tags — the link to Azure Test Plans and test selection

Every `Scenario:` that has (or will have) a corresponding Azure Test Plans Test Case
carries these tags, placed directly above the `Scenario:` line:

```gherkin
@hu:89951 @testcase:112233 @regression
Scenario: Login with invalid credentials
  ...
```

| Tag | Meaning | Required? |
|---|---|---|
| `@hu:<id>` | The Azure DevOps Work Item (HU/User Story) this scenario verifies | Yes, on every scenario tied to a real HU |
| `@testcase:<id>` | The Azure Test Plans **Test Case** work item id this scenario is 1:1 with | Once the Test Case exists (see [azure-policy.md](./azure-policy.md)) — a scenario without one yet is still valid, just not synced |
| `@regression` | Runs on every build; protects a path that must never silently break | When the scenario covers previously-working behavior, not just the current HU |
| `@critical` | Business-critical path; a failure here should block a release | Sparingly — critical means "the business stops" if this breaks, not "important" |
| `@smoke` | Part of the fast, minimal build-verification subset | Only for the handful of scenarios that prove the app is even up |

**Why `@testcase:<id>` and not `@hu:<id>` alone**: one HU can produce several Test
Cases (functional, negative, boundary — see
[automation-policy.md](./automation-policy.md)), each with its own pass/fail history
in Azure Test Plans. `@hu:<id>` groups them for traceability; `@testcase:<id>` is what
`azure/publishTestResults.ts` reads to know exactly which Test Case's result to update.

**Selecting scenarios to run** uses the same tags via cucumber-js's `--tags`:

```
npx cucumber-js --tags "@regression"
npx cucumber-js --tags "@critical and not @smoke"
```

**Implementation**: `npm run azure:publish-results -- --plan <planId> --suite <suiteId>`
(`azure/publishTestResults.ts`) reads `reports/cucumber-report.json`, finds every
`@testcase:<id>`-tagged scenario, resolves its Test Point in that plan/suite
(`AzureDevOpsClient.getTestPointsForCase`), creates one Test Run covering all of them,
and publishes each outcome — so running the automated scenario is what marks the
Azure Test Plans Test Case Passed/Failed, not a separate manual step.

## What does NOT belong in a `.feature` file

- Environment values (URLs, ports) — these come from `config/env.ts` via the step/page,
  never written literally in a scenario.
- Technical setup (DB seeding, API mocking) — express it as a business precondition
  (`Given an order already exists in "PAID" status`), and let the step definition decide
  whether that means an API call, a DB insert, or a UI flow.
- Anything that only makes sense to the person who wrote it. If a step needs a comment
  to be understood, rewrite the step.
