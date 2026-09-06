# CI Policy

`azure-pipelines.yml` is the CI gate referenced in
[azure-policy.md](./azure-policy.md)'s branch policy: "Nothing reaches `main` without
passing CI." This is what "passing CI" concretely means in this repo.

## What runs, in order

1. **Typecheck** (`npm run typecheck` → `tsc --noEmit`) — must pass; a type error fails
   the build immediately.
2. **Cucumber suite** (`npm test`) — runs with `continueOnError: true` so the pipeline
   still produces a report even on failure; the pipeline is failed later, based on the
   actual recorded test results, not on this step's raw exit code.
3. **JUnit conversion** (`npm run report:junit`) — cucumber-js ships no JUnit
   formatter (only `json`/`progress`/`summary`/`rerun`/`snippets`/`usage` — see
   `helpers/cucumberJsonToJunit.ts`), so `reports/cucumber-report.json` is converted to
   `reports/junit/cucumber-junit.xml` for Azure Pipelines' test result viewer.
4. **`PublishTestResults@2`** with `failTaskOnFailedTests: true` — this is what actually
   fails the build on a test failure, and what populates the Tests tab on the run.
5. **`PublishPipelineArtifact@1`** (twice) — uploads `reports/` (HTML report,
   Cucumber JSON, JUnit XML, screenshots attached on failure) and `logs/`
   (`execution.log`) as build artifacts, so a failure can be diagnosed from the
   pipeline run alone.

## Triggers

- `trigger.branches.include`: `main`, `qa-agent/*` — every push to an agent branch
  gets a CI run before a human/Reviewer even opens the PR.
- `pr.branches.include`: `main` — required check on PRs targeting `main`. This must be
  configured as a **required branch policy** in Azure Repos for
  `azure-policy.md`'s "no agent pushes directly to main" rule to be enforced by the
  platform, not just by convention.

## Rules

1. **A red pipeline blocks merge.** Do not add `continueOnError` further down the
   pipeline to make a failing test non-blocking — the one `continueOnError` that
   exists (step 2) exists only so reporting steps still run, not to hide failures.
2. **Reports are always published, pass or fail** (`condition: succeededOrFailed()`).
   A failure with no artifact to inspect is a pipeline bug, not an acceptable outcome.
3. **Local and CI run the same commands.** `npm run typecheck` / `npm test` /
   `npm run report:junit` are the same scripts `azure/openQaPr.ts`'s quality gate runs
   locally (see [azure-policy.md](./azure-policy.md)) — CI is not a second, different
   definition of "passing."

## Deferred: writing results back to Azure Test Plans

The pipeline publishes to the Pipelines Tests tab, not yet to the Test Case's Test
Point in Azure Test Plans (`AzureDevOpsClient.publishTestResult` in `azure/client.ts`
already exists for this). Wiring it up needs a scenario → Test Case ID convention
(e.g. a `@testcase:<id>` Gherkin tag) that doesn't exist yet — adding it without a real
mapping would be speculative, unverified code. Add that tag convention to
[gherkin-policy.md](./gherkin-policy.md) first, then a CI step that reads tags from
`reports/cucumber-report.json` and calls `publishTestResult` per scenario.
