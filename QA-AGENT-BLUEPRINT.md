# QA Engineering Agent — Blueprint

> Handoff document for adopting this architecture in another Playwright project.
> Written from a working, real implementation (this repo, `QA-pilot`), not a theoretical
> design — every claim here has been exercised against a live Azure DevOps org and a
> real application. File paths cited are this repo's; adapt them to the target repo's
> conventions, but keep the same separation of concerns.

## 1. The idea in one paragraph

A QA automation framework where **Gherkin is the single source of truth**. One
Gherkin `Scenario` = one Azure DevOps Test Plans **Test Case**, linked to the **HU**
(User Story) it verifies. A script converts Gherkin → a real Test Case (title +
structured steps) in Azure the moment the scenario is written — before automation
code even exists. When the scenario *is* automated and run, another script reads the
Cucumber JSON report and flips that same Test Case's result (Passed/Failed) in Azure.
Nothing is duplicated by hand: the traceability chain is
`HU → Test Plan Suite → Test Case → Gherkin Scenario → step definitions → CI run → Test Result`,
and every arrow in that chain is a script, not a person copy-pasting between tools.

## 2. Folder architecture (POM + layers)

```
features/    Gherkin — business language only, no selectors
steps/       glue — one-line calls into pages/api/db, never a raw locator
pages/       one class per screen, extends BasePage, composes components/
components/  reusable UI fragments shared by 2+ pages (e.g. a shared banner/header)
fixtures/    Cucumber World + Before/After hooks — browser lifecycle only
helpers/     cross-cutting utilities (logger, report converters, parsers)
api/         HTTP clients per domain — for API-level test ideas
database/    SQL/NoSQL clients — for DB-level test ideas
config/      env.ts resolves all environment values — nothing hardcoded in code
azure/       tooling for the AGENT itself (Azure DevOps client, sync scripts) —
             not part of the app-under-test's automation, kept separate from api/
drafts/      scratch output from Playwright's official agents (see §5) — never
             the final artifact, always extracted into pages/steps/features first
rules/       the actual policy documents an agent (or human) must follow — see §8
```

Key discipline: **before creating a new Page Object/component/helper, check whether
one already covers it.** No `LoginPage2.ts`. Extend, don't duplicate.

### POM specifics that mattered in practice

- `pages/BasePage.ts` — every Page Object extends it (`protected readonly page`), so
  cross-page behavior has one place to live.
- Path aliases over `../../`: `tsconfig.json`'s `paths` (`@pages`, `@components`,
  `@fixtures`, `@config/*`, `@helpers/*`) + `tsconfig-paths/register` in Cucumber's
  `requireModule`. Barrel exports (`pages/index.ts`) so consumers write
  `import { LoginPage } from "@pages"`.
- Locator priority: role/accessible-name first (`getByRole`), then test-id, then a
  stable semantic attribute (`#id`), CSS class only if structural, XPath as a last
  resort that should really be flagged as "the app needs a test id."
- A UI element that repeats across pages (a flash/toast banner, a header) becomes a
  Component (`components/FlashMessage.ts`), composed into each Page Object that needs
  it — not reimplemented per page.

## 3. Gherkin conventions

- **One scenario = one behavior.** No chaining unrelated assertions.
- **Language**: any feature tied to a real client work item is written in the
  **client's language** (this project: Spanish, `# language: es`, using
  `Característica`/`Antecedentes`/`Escenario`/`Dado`/`Cuando`/`Entonces`/`Y`). The
  client reads these as Azure Test Case steps and must never need a translator.
  Internal framework demos can stay in English. A parser that only understands
  English keywords will silently produce empty features — see §6's parser note.
- **No Scenario Outline for anything that needs individual traceability.** If two
  `Examples` rows each need their own Test Case (their own pass/fail history), write
  two explicit Scenarios instead — Cucumber tags apply to a whole Examples table, not
  a single row.
- **Tag convention** (this is what the sync scripts key off of):

  ```gherkin
  @hu:89951 @testcase:91410 @regression @critical
  Escenario: ...
  ```

  | Tag | Meaning |
  |---|---|
  | `@hu:<id>` | the Azure Work Item (User Story) this scenario verifies |
  | `@testcase:<id>` | the Azure Test Plans Test Case this scenario is 1:1 with — added automatically by the sync script the first time it runs, not written by hand |
  | `@regression` / `@critical` / `@smoke` | classification for `cucumber-js --tags` selection and for `System.Tags` on the Azure Test Case |

## 4. Azure DevOps integration — the deterministic layer

**Principle**: an agent (or a human prompt) decides *what* to write to Azure DevOps;
a fixed, reviewed client decides *how*. Never build a raw REST call inline in a
prompt-driven step. One class (`azure/client.ts` in this repo) wraps
`azure-devops-node-api`, and every operation is a named method with a single
responsibility. Reads that don't have side effects can go through an MCP server if
one is connected (Azure DevOps has an official one); this project didn't have MCP
available, so reads go through the same deterministic client as writes — which
turned out fine, and is a reasonable fallback.

### 4.1 Discovering work

```ts
// One call gets every work item in a sprint (no per-item round trips):
const workApi = await connection.getWorkApi();
const iterations = await workApi.getTeamIterations({ project, team });
const iteration = iterations.find(it => it.path === iterationPath); // e.g. "Project\Team\Sprint 2"
const rel = await workApi.getIterationWorkItems({ project, team }, iteration.id);
const ids = rel.workItemRelations.map(r => r.target?.id).filter(Boolean);
const items = await witApi.getWorkItems(ids, ..., project); // batch, not N calls
```

Then `witApi.getWorkItem(id, undefined, undefined, undefined, project)` for one
item's full `System.Description` / `Microsoft.VSTS.Common.AcceptanceCriteria` (HTML
strings — strip or render, but don't paraphrase; the AC text is the actual spec).

### 4.2 Gherkin → Test Case (the core sync)

A Test Case's steps live in one field, `Microsoft.VSTS.TCM.Steps`, as XML — one
`<step>` per Action/Expected-Result row:

```xml
<steps id="0" last="2">
  <step id="1" type="ActionStep">
    <parameterizedString isformatted="false">Dado que el usuario está en la pantalla X</parameterizedString>
    <parameterizedString isformatted="false"></parameterizedString>
    <description/>
  </step>
  <step id="2" type="ActionStep">
    <parameterizedString isformatted="false">Cuando el usuario hace clic en "Continuar"</parameterizedString>
    <parameterizedString isformatted="false">el usuario debe ser dirigido al paso 2</parameterizedString>
    <description/>
  </step>
</steps>
```

Mapping rule that worked well: every `Given`/`When`/`And`-before-a-`Then` becomes its
own Action row (expected column blank); every `Then` and subsequent `And` gets
concatenated into the **expected** column of the *last* action row. This repo's
`helpers/gherkinParser.ts` (a small hand-rolled parser — deliberately not a full
Gherkin AST, just enough for a controlled subset: `Feature`/`Background`/`Scenario`,
no Outline) and `helpers/tcmSteps.ts` (the Action/Expected mapping + XML builder) are
the reference implementation. `azure/createTestCasesFromFeature.ts` ties it together:
parse a `.feature` file → for each Scenario, create-or-update
(`witApi.createWorkItem`/`updateWorkItem` with type `"Test Case"`) → tag the
`.feature` file in place with the resulting `@testcase:<id>`.

**Make this idempotent from day one.** A scenario that already carries
`@testcase:<id>` should be *updated* in place, not duplicated — this repo's sync
script checks the tag before deciding create vs. update. Re-running it after editing
Gherkin (e.g. re-translating to another language) should never create a second Test
Case.

### 4.3 Requirement-based Suites — the gotcha that cost real time

Azure Test Plans lets a suite be typed `RequirementTestSuite` (`suiteType: 3`),
tied to one work item (`requirementId`), so every HU gets its own suite of Test
Cases instead of one flat list. Creating it is simple:

```ts
testPlanApi.createTestSuite(
  { name, parentSuite: { id: parentSuiteId, name: "" }, suiteType: TestSuiteType.RequirementTestSuite, requirementId: huId },
  project, planId
);
```

**The mistake**: manually creating a "Tests" link between the Test Case and the HU
(`witApi.updateWorkItem` with a `relations/-` patch, `rel:
"Microsoft.VSTS.Common.TestedBy-Forward"`, source = Test Case, target = HU) *looked*
like it worked — no error — but:
- The suite showed **empty** ("Add a test case") in the Azure UI despite the link
  existing, because the direction was wrong (semantically "Test Case tested-by HU",
  backwards).
- A later call to `testApi.addTestCasesToSuite(...)` — the actually-correct API for
  suite membership — then failed with `TF201035: ... circular relationship`, because
  Azure detected both directions of the same link type between the same two work
  items.

**The fix**: never call `linkWorkItems` for this. Call **only**
`testApi.addTestCasesToSuite(project, planId, suiteId, String(testCaseId))`. That one
call creates the correct-direction link *and* registers the suite membership
(generates a Test Point). Verify with `testApi.getPoints(project, planId, suiteId,
undefined, undefined, String(testCaseId))` — a non-empty result is the only real
proof the Test Case shows up in its suite; a 200 response from the create/link calls
is not enough evidence on its own. If you inherit a batch of Test Cases linked the
wrong way, `azure/fixSuiteMembership.ts` is the repair pattern: read the work item's
`relations` (via `getWorkItem` with `expand: Relations`), find the bad relation by
`rel` + target URL, remove it via a `Remove` JsonPatchOperation at that array index,
then call `addTestCasesToSuite` for real.

### 4.4 Publishing results back (Test Points → Test Results)

A Test Point is not created ahead of time by hand — it's the byproduct of §4.3. To
publish a Cucumber run's outcome:

```ts
const points = await testApi.getPoints(project, planId, suiteId, undefined, undefined, String(testCaseId));
const run = await testApi.createTestRun({ name, plan: { id: String(planId) }, configurationIds: [], pointIds: [points[0].id], automated: true }, project);
const autoResults = await testApi.getTestResults(project, run.id); // Azure auto-creates one result per point
const match = autoResults.find(r => r.testCase?.id === String(testCaseId));
await testApi.updateTestResults([{ id: match.id, outcome: passed ? "Passed" : "Failed", state: "Completed" }], project, run.id);
```

Batch every `@testcase:<id>`-tagged scenario from one Cucumber report into **one**
Test Run per CI execution, not one run per scenario — matches how a real pipeline
reports results and avoids spamming Test Runs.

### 4.5 Git/PR automation

Branch/commit/push via the real `git` CLI (`execFileSync("git", [...])` — array
args, never a shell string, so branch names/commit messages can't be interpreted as
shell syntax) — reimplementing git plumbing over the REST API is unnecessary
complexity. PR creation *is* worth doing via the API
(`gitApi.createPullRequest`), with `AB#<work-item-id>` in the description for
Azure's automatic work-item linking. Gate the push on a local quality check (typecheck
+ test suite) that refuses to continue on failure — cheaper to catch there than in CI.

## 5. Playwright's own agents (planner / generator / healer)

Since ~mid-2025, Playwright ships **official** agents for this exact workflow — don't
build your own from scratch:

```
npx playwright init-agents --loop=claude --prompts
```

This scaffolds `.claude/agents/playwright-test-{planner,generator,healer}.md` and a
`.mcp.json` registering a `playwright-test` MCP server (browser automation + a
project-aware test runner). Three roles:
- **planner** — explores the live app via MCP browser tools, writes a Markdown test
  plan. Read-only.
- **generator** — executes each plan step live via MCP, then writes a working
  `@playwright/test` spec file (raw locators, no Page Object — it doesn't know your
  architecture).
- **healer** — runs the suite, debugs failures live via MCP, edits code until green,
  or marks `test.fixme()` with a reason if it can't.

**Critical integration point**: their output is not your framework's final code. Set
`playwright.config.ts`'s `testDir` to a dedicated `drafts/` folder, separate from
`pages/`/`steps`/`features/`. A draft is a verified-working, single-file script — the
extraction step (locators → Page Object, business flow → Gherkin scenario, delete the
draft) is still a manual/agent-assisted step this project hasn't automated yet. Don't
skip it and merge raw drafts into the permanent suite; that's exactly the
architecture erosion the layered folder structure exists to prevent.

## 6. Practical gotchas worth inheriting

- **cucumber-js ships no JUnit formatter** (only `json`/`progress`/`summary`/
  `rerun`/`snippets`/`usage`). If your CI needs JUnit XML (Azure Pipelines'
  `PublishTestResults@2` does), write a small converter from the `json` formatter's
  output — it's a stable, well-known schema (array of features → `elements` →
  `steps`, each `step.result.status`). Don't reach for an old third-party
  `cucumber-junit` package pinned to an ancient schema; a ~60-line converter you
  control and test against real output is more reliable.
- **A hand-rolled Gherkin parser must recognize both English and Spanish keywords**
  if any features are localized — `Dado`/`Cuando`/`Entonces`/`Y` alongside
  `Given`/`When`/`Then`/`And`. Same for `Feature:`/`Característica:`,
  `Background:`/`Antecedentes:`, `Scenario:`/`Escenario:`.
- **Azure DevOps org URLs**: legacy orgs use `https://<org>.visualstudio.com`,
  newer ones `https://dev.azure.com/<org>` — `azure-devops-node-api`'s `WebApi`
  accepts either as the connection URL; use whichever the org's own sprint/board
  URLs show, don't assume you need to convert.
- **Never hardcode credentials or environment URLs anywhere in committed code.**
  Everything (target app URL, test user credentials, Azure org/project/PAT) goes
  through `config/env.ts` reading `.env` (gitignored). If a human ever needs to hand
  you a secret, it goes directly into `.env` — never pasted into a prompt/chat that
  becomes part of a transcript.
- **Verify, don't assume, that a "successful" Azure API call did what you think.**
  Both the suite-membership bug (§4.3) and, earlier, a missing default Test
  Configuration on a Plan (which silently keeps `getPoints` empty even after a
  correct link) returned clean 200s while producing the wrong real-world state. Read
  the state back (`getPoints`, a fresh `getTestSuitesForPlan`, an actual screenshot
  from the human) before reporting something as done.

## 7. How to adopt this in a new project

1. Scaffold the framework first (TypeScript + Playwright + Cucumber + POM), no agent
   involved yet — prove the base framework runs one real scenario end to end.
2. Write the `rules/*.md` policy set *before* giving any agent write access — see §8.
   An agent (or a fresh Claude Code session) should read the rules before writing a
   single Page Object.
3. Add `azure/client.ts` (or the equivalent for your tracker — Jira, Linear, etc. —
   the pattern generalizes: one deterministic client class, one method per
   operation) and prove read access against the real org before anything else.
4. Add the Gherkin→Test Case sync (§4.2) and prove it against **one** real HU before
   running it across a whole sprint — the suite-membership bug (§4.3) would have been
   far more painful to fix across 90 Test Cases than across 1.
5. Only then bring in `init-agents` (§5) and the Git/PR + CI automation (§4.5, and a
   pipeline that converts the Cucumber report and publishes it).
6. Keep a memory of what's verified-live vs. only-typechecked. This project's biggest
   recurring risk was treating "the TypeScript compiles" as equivalent to "the Azure
   DevOps call does the right thing" — they are not the same claim.

## 8. The rules/ policy set (write these first)

This repo's `rules/` folder is the actual operating contract — copy the structure,
not necessarily the content:

- `architecture.md` — folder responsibilities, dependency direction, "don't
  duplicate, extend."
- `naming-conventions.md` — file/class naming, no `LoginPage2.ts`.
- `locator-policy.md` — selector priority, one element one locator.
- `gherkin-policy.md` — language, tag convention, one-scenario-one-behavior.
- `automation-policy.md` — UI vs. API vs. DB vs. Manual classification criteria
  per test idea, not per HU (one HU produces a mix).
- `database-policy.md` / (an `api-policy.md` would parallel it) — client/accessor
  split, no raw queries in step files.
- `logging-policy.md` — structured logging, screenshot-on-failure, never log
  secrets.
- `azure-policy.md` (or your tracker's equivalent) — read/write split, branch
  policy, the traceability chain, §4's gotchas.
- `playwright-agents-policy.md` — how planner/generator/healer map onto your roles,
  the `drafts/` extraction rule.
- `ci-policy.md` — what "passing CI" means, JUnit conversion note.

---

*This document describes a real, working system as of the session that produced it —
not an aspiration. Where something is unverified (e.g. "this should also work for
Jira"), it's phrased as a generalization, not a claim. If you're the agent reading
this in a different repo: don't copy code verbatim — copy the mechanism, verify it
against your own target system's real behavior (§6's last point), and expect at
least one gotcha equivalent to §4.3 that only a live check will surface.*
