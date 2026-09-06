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
