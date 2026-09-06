# Architecture Policy

This repo is a layered BDD automation framework. Every change — human or agent — must
respect the dependency direction below. No layer may reach past its neighbor.

```
features/   (Gherkin — business language, no implementation detail)
    ↓
steps/      (glue — translates Gherkin steps into Page Object / API / DB calls)
    ↓
pages/ · components/ · api/ · database/   (behavior — how to do it)
    ↓
playwright · fixtures/   (mechanics — browser, context, page, clients)
```

## Folder responsibilities

| Folder | Owns | Must NOT contain |
|---|---|---|
| `features/` | `.gherkin` scenarios, business language | selectors, waits, code |
| `steps/` | step definitions, one-line calls into pages/api/db | raw locators, assertions on implementation detail, business logic |
| `pages/` | one class per page, its locators, its actions, extending `BasePage` | test data, assertions about business rules unrelated to the page |
| `components/` | reusable UI fragments shared by 2+ pages (header, modal, table) | page-specific logic |
| `fixtures/` | Cucumber `World`, hooks (`Before`/`After`/`BeforeAll`/`AfterAll`), test context wiring | UI locators, business logic |
| `helpers/` | cross-cutting utilities (logger, retry, formatting) | anything tied to one specific page/feature |
| `api/` | HTTP clients per domain (`OrdersClient`, `UsersClient`) + response schemas | UI code |
| `database/` | SQL/NoSQL clients + domain-specific query methods | raw ad-hoc queries inside step files |
| `config/` | environment/config resolution (`env.ts`) | secrets committed to git |
| `logs/` / `reports/` | generated output only | hand-written files |
| `drafts/` | raw output from the Playwright planner/generator/healer agents (`playwright.config.ts`'s `testDir`) | anything merged as final — see [playwright-agents-policy.md](./playwright-agents-policy.md) |
| `azure/` | the deterministic Azure DevOps read/write client — tooling for the agent itself, not the application under test | app-specific API clients (those belong in `api/`) |

## Rules

1. **Steps never touch a locator directly.** A step calls a method on a Page Object,
   Component, API client, or DB client. If a step needs `page.locator(...)`, that logic
   belongs in a Page Object instead.
2. **A Page Object represents one page/route.** If an element (header, sidebar, modal,
   data table) appears on more than one page, extract it into `components/` and compose
   it into the Page Objects that use it.
3. **Before creating a new file, check whether one already covers the need.** New
   Page Object, fixture, helper, API client, or DB client is only created after
   confirming an existing one in `pages/`, `components/`, `fixtures/`, `helpers/`,
   `api/`, `database/` doesn't already solve it. Extending an existing file beats
   creating a near-duplicate (`LoginPage2.ts`, `LoginPageFinal.ts`, etc. are never
   acceptable).
4. **Fixtures own setup/teardown and shared context, not behavior.** Browser lifecycle,
   authentication state, DB connections, and API clients are wired in `fixtures/`, then
   handed to steps via the `World` (see [naming-conventions.md](./naming-conventions.md)
   for how the `World` is extended).
5. **UI, API, and DB tests are peers, not a hierarchy.** A single HU/work item may
   produce Page Object-based scenarios, API-based scenarios, and DB-validation
   scenarios. See [automation-policy.md](./automation-policy.md) for how to decide which.
6. **Every Page Object extends `BasePage`** (`pages/BasePage.ts`) — it holds the
   shared `protected readonly page` and is where cross-page behavior goes if it's
   ever needed, instead of each page redeclaring its own constructor.
7. **Cross-folder imports use the path aliases** (`@pages`, `@components`,
   `@fixtures`, `@config/*`, `@helpers/*` — see `tsconfig.json`), not `../../` chains.
   A file importing a sibling in its own folder (e.g. `fixtures/hooks.ts` importing
   `./world`) still uses a relative import — aliases are for crossing folder
   boundaries, not for every import. `pages/index.ts`, `components/index.ts`, and
   `fixtures/index.ts` are barrel exports — prefer `import { LoginPage } from
   "@pages"` over reaching into `@pages/LoginPage` directly when consuming from
   another layer (`steps/`).

## Related
[naming-conventions.md](./naming-conventions.md) · [locator-policy.md](./locator-policy.md) ·
[gherkin-policy.md](./gherkin-policy.md) · [automation-policy.md](./automation-policy.md) ·
[database-policy.md](./database-policy.md) · [logging-policy.md](./logging-policy.md) ·
[azure-policy.md](./azure-policy.md) · [playwright-agents-policy.md](./playwright-agents-policy.md) ·
[ci-policy.md](./ci-policy.md)
