# Azure DevOps & Agent Policy

This is the operating contract for any agent (or human) that connects this repo to
Azure DevOps. It defines who reads, who writes, and what boundary of autonomy exists.

## Read vs. write: MCP vs. API

| Operation | Channel | Why |
|---|---|---|
| List sprint work items, read a HU's acceptance criteria, read linked PRs/bugs/tests | **Azure DevOps MCP** (contextual read) | The agent reasons over this; no side effects |
| Create/update a Test Case, Test Suite, Test Plan entry, Test Result, or a Work Item comment/link | **Azure DevOps REST API** (PAT-authenticated, deterministic) | These are side effects that must be exact and auditable — not left to model discretion |

An agent never uses a free-form/inferred call to perform a write operation. Writes go
through a fixed, reviewed API client — the agent decides *what* to write, a
deterministic layer decides *how*.

**Verified live** (2026-09-06, org `summa-sci` / project "Summa - Summa Network"):
`AzureDevOpsClient.getSprintWorkItems(team, iterationPath)` — `npm run azure:sprint --
--team "<team>" --iteration "<path>"` — lists every work item in a sprint by
resolving the team's iteration then reading its `workItemRelations`. This is the
"Discover" step's read, implemented as a client method (not yet the Azure DevOps MCP,
which isn't connected in this environment) — same deterministic layer as the writes,
used here for a read because no MCP is available. `getWorkItem(id)` reads one item's
full fields/acceptance criteria once an id is picked from the sprint list.

## Traceability chain

Every automated scenario must be traceable in both directions:

```
Azure Work Item (HU)
   → Test Plan / Test Suite
      → Test Case                (1:1 with a Gherkin Scenario)
         → features/<name>.feature : Scenario
            → steps/*.steps.ts
               → CI pipeline run
                  → Test Result → written back to the Test Case in Azure DevOps
```

A `Scenario:` without a linked Test Case, or a Test Case without a linked scenario, is
an integrity gap — either link it or flag it in the daily report.

## Agent roles and boundaries

| Role | Reads | Writes | Never does |
|---|---|---|---|
| **Explorer** | Azure MCP, Playwright MCP (live app exploration), repo | nothing | modify code, modify Azure |
| **Builder** | repo, Explorer's findings | feature/step/page/fixture files, a feature branch, a draft PR | push to `main`, merge, mark a Test Case result directly |
| **Reviewer** | the Builder's diff | PR review comments/approval | author new test code |
| **Deterministic API layer** | — | Test Case/Suite/Result/Work Item writes, exactly as instructed | decide *what* to write |

Builder always works on a branch named `qa-agent/<work-item-id>-<short-slug>`
(e.g. `qa-agent/12345-login-invalid-password`) and opens a PR. Nothing reaches `main`
without passing CI ([ci-policy.md](./ci-policy.md): typecheck, test execution) and a
Reviewer approval — human or agent. **No agent pushes directly to `main`.**

**Implementation**: `azure/git.ts` (branch/commit/push via the real git CLI, never a
shell string — argument arrays only) + `azure/client.ts`'s `createPullRequest`, wired
together by `npm run qa:open-pr -- --workItem <id> --slug <slug> --title <title>`
(`azure/openQaPr.ts`). It refuses to run if:
- the local quality gate (`tsc --noEmit` + the Cucumber suite) fails,
- the working tree has nothing to commit,
- `AZURE_DEVOPS_REPO` isn't configured,
- the target branch name resolves to `main`/`master`.

The PR description always includes `AB#<work-item-id>` so Azure DevOps auto-links it
to the HU, in addition to the explicit `workItemRefs` set on the PR.

## Test Cases per HU: Requirement-based Suites

Per HU, `AzureDevOpsClient.createRequirementBasedSuite(planId, parentSuiteId, huId,
name)` creates one Requirement-based Suite (`TestSuiteType.RequirementTestSuite`)
nested under a shared parent suite, so every HU's Test Cases live in their own suite
instead of one flat list.

**A Requirement-based Suite's membership is established by `addTestCaseToSuite`
alone** — that single call both creates the correct "Tests"/"Tested By" link to the
HU *and* registers the Test Case as a suite member with a Test Point. **Never** also
call `linkWorkItems(testCaseId, huId, "Microsoft.VSTS.Common.TestedBy-Forward")` —
that creates the link in the reverse direction, which (a) leaves the suite showing
empty ("Add a test case") in the Azure UI even though a relation technically exists,
and (b) makes any later `addTestCaseToSuite` call fail with `TF201035: ... circular
relationship` because Azure sees both directions of the same link between the same
two items. `azure/createTestCasesFromFeature.ts` (`npm run azure:sync-testcases`)
does this correctly; `azure/fixSuiteMembership.ts` (`npm run
azure:fix-suite-membership`) is the one-off repair script that undid the wrong
direction across all Test Cases created before this was caught — verify with
`getTestPointsForCase` (a non-empty result confirms real suite membership) before
trusting that a batch of Test Cases actually shows up in its suite.

## Manual test execution: per-step results, evidence, and linked Bugs

For `@manual` scenarios (see [gherkin-policy.md](./gherkin-policy.md)), a run is a
human (or an agent acting as one) actually exercising the app — never inferred.
`azure/recordManualRunSteps.ts` (`npm run azure:record-manual-run-steps -- --data
<results.json> --hu <workItemId>`) is the tool for this:

- **One outcome per Test Case step**, not just one outcome for the whole result —
  Azure's `iterationDetails`/`actionResults` mechanism
  (`AzureDevOpsClient.publishManualStepResults`). Step order in the input JSON is
  1-based and must match the Test Case's actual `<step id="N">` order — verify with
  a throwaway `gherkinStepsToTcmRows(scenario.steps)` dump against the source
  `.feature` before writing results, since Background steps are prepended to every
  scenario (`helpers/gherkinParser.ts`) and count as step 1.
- **Evidence at both levels**: a result-level attachment
  (`addTestResultAttachment`) so it's visible without opening a step, AND a
  step-level attachment (`addTestIterationResultAttachment`) on the specific step
  it belongs to. Skipping the result-level one is what evidence looking "gone"
  usually means — the viewer wasn't looking inside the step's iteration detail.
- **A Failed step opens a linked Bug** (`createBug` + `linkWorkItems` with
  `System.LinkTypes.Related` — not `-Forward`/`-Reverse`, those don't exist for this
  symmetric relation type) to both the Test Case and the HU, so the defect is
  traceable from either side.
- **The Bug's title and description cite the `@ac:<n>` this Test Case maps to**
  (read straight from the source `.feature` via `getAcLabel` — never hand-typed, so
  it can't drift from the tag itself) — e.g. `[HU-90129] [AC 9,19] Test Case 91539:
  ...`, plus a comment with the exact criterion text. A reader lands on the Bug
  already knowing which requirement line is broken, not just which HU.
- **Re-verifying a known defect must reuse its Bug, not open a new one.** Pass that
  Test Case's `existingBugId` in the results JSON — when set, a "Failed" outcome
  adds a comment + fresh evidence to that Bug instead of calling `createBug` again.
  Omitting it on a re-run is exactly how Bugs 91571–91575 ended up as accidental
  duplicates of 91561–91565 (same 5 HU-90129 defects, re-verified a day later) —
  fixed after the fact with a `System.LinkTypes.Related` link + a comment pointing
  each duplicate back at its canonical Bug, since deleting them outright wasn't
  worth the risk for a mistake this cheap to leave a paper trail for instead.

**Do not embed evidence as a base64 `data:` URI inside a rich-text field** (e.g.
`Microsoft.VSTS.TCM.ReproSteps`) — Azure DevOps silently strips `data:`-URI `<img>`
tags from HTML fields on save. Verified by reading the field back after such a save
and finding no image, despite the write returning success. The real mechanism is a
Work Item **file attachment**, which `azure-devops-node-api`'s `WorkItemTrackingApi`
does not wrap (no `createAttachment` in this SDK version) — call the REST endpoint
directly with the same PAT (`AzureDevOpsClient.attachFileToWorkItem`: `POST
_apis/wit/attachments`, then a JsonPatch `AttachedFile` relation pointing at the
returned attachment URL). Verify with `getWorkItemRelations` and check
`attributes.resourceSize` matches the real file size before trusting the upload.

## QA state per HU

Maintain a per-HU state record (JSON, checked into the repo or stored alongside the
Test Case) so the agent does not re-analyze unchanged work items daily.

**Implementation**: `azure/qaState.ts` — one file per work item under `azure/state/`
(`azure/state/<workItem>.json`) so each HU's history is an isolated git diff.
`shouldReanalyze(workItemId, currentRevision)` compares against
`lastAnalyzedRevision` and returns whether analysis is needed; `writeState`/
`readState` persist it. This is pure local logic — it doesn't call Azure DevOps
itself, it just decides whether the Explorer step should run today. Verified with
fake HU data: no prior state → reanalyze; same revision → skip; revision bumped →
reanalyze again.

```json
{
  "workItem": 12345,
  "status": "AUTOMATED",
  "risk": "HIGH",
  "testCases": 8,
  "automated": 6,
  "manual": 2,
  "lastAnalyzedRevision": 7,
  "execution": "PASSED"
}
```

- If the HU's revision hasn't changed since `lastAnalyzedRevision` → skip re-analysis.
- If it changed → run an impact analysis: which acceptance criterion changed, which
  linked Test Case(s)/scenario(s) it affects, re-generate/re-run only those.

## Daily report

Each automated run against changed/new HUs should be summarized (see
[logging-policy.md](./logging-policy.md) for the log lines that feed this):

```
HU-<id>  Risk: <HIGH|MEDIUM|LOW>  Test cases: <n>  Automated: <n>  Manual: <n>  Status: <PASS|FAILED|WAITING>
  Failure → Agent diagnosis (possible app defect) → linked Bug work item, if created
```

A `FAILED` status with no diagnosis line, or an `AUTOMATED` HU with no linked Test
Case, means the pipeline above was not followed correctly for that HU.
