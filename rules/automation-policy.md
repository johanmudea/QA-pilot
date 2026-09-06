# Automation Policy

Not every acceptance criterion becomes UI automation. For each HU/work item, decide
per test idea where it belongs: **UI**, **API**, **DB**, or **Manual** — a single HU
commonly produces a mix.

## Decide UI vs API vs DB by what is actually being verified

| Verifying... | Use | Why |
|---|---|---|
| A business rule, validation, or authorization outcome | **API** | Faster, more stable, exercises the rule directly without UI noise |
| Data persistence, integrity, or a relationship between records | **DB** | The UI can't prove a row was written correctly; the DB can |
| A user-visible flow that must render correctly (navigation, form behavior, error display) | **UI** | Only the browser proves the user can actually do this |
| Visual layout, UX judgment, exploratory behavior | **Manual** | Not deterministic enough to assert on automatically |

A single HU like "user cannot log in with invalid credentials" typically yields:
- UI scenario: error message renders on the login page (`features/login.feature`)
- API scenario: the auth endpoint returns 401 with the expected error body
- (DB scenario only if the HU also asserts a failed-attempt counter is persisted)

## AUTOMATE when the test idea is

- Deterministic and repeatable (same input → same output every run)
- High regression value (protects a business-critical path)
- Stable (the UI/API under test isn't expected to change imminently)
- High execution frequency (will run every build/sprint, not once)

## Keep MANUAL when the test idea is

- Visual/UX judgment ("does this look right") — not a pass/fail Playwright can assert
- Exploratory by nature (no fixed script would catch what you're looking for)
- One-time validation (a migration, a one-off data fix)
- Blocked by an unstable feature still under active design change
- Dependent on an external system without a reliable way to simulate/stub it

## Required output per HU

Before writing any code, record the classification (in the PR description or the
linked Azure Test Case — see [azure-policy.md](./azure-policy.md)):

```
HU-<id>
Risk: HIGH | MEDIUM | LOW
Test ideas identified: <n>
  UI automated:   <n>
  API automated:  <n>
  DB automated:   <n>
  Manual:         <n>
Reason for each Manual item: <one line>
```

If everything is classified UI-automated with no stated reason, that's a signal the
classification step was skipped, not that the HU happened to need only UI tests.
