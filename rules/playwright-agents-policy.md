# Playwright Agents Policy

This repo uses Playwright's own built-in agents — **planner**, **generator**, and
**healer** — scaffolded via `npx playwright init-agents --loop=claude` into
`.claude/agents/` and wired to the Playwright Test MCP server declared in
`.mcp.json` (`mcp__playwright-test__*` tools). They are Microsoft-maintained; this
policy governs how their output enters — or does not enter — the framework defined in
[architecture.md](./architecture.md), not how the agents themselves are prompted
(that's `.claude/agents/*.md` and `.claude/prompts/*.md`).

## What each agent does, and its place in our pipeline

| Agent | Playwright role | Maps to our pipeline (see [azure-policy.md](./azure-policy.md) roles) |
|---|---|---|
| `playwright-test-planner` | Explores the live app via the MCP browser tools, writes a markdown test plan to `specs/*.plan.md` | **Explorer** — read-only, produces the test-idea list that feeds [automation-policy.md](./automation-policy.md)'s classification |
| `playwright-test-generator` | Executes each plan step live via MCP, then writes a working `@playwright/test` spec | **Builder, draft stage only** — see below, its output is not the final artifact |
| `playwright-test-healer` | Runs the suite, debugs failures live via MCP, edits the spec until green | **Self-repair loop** — the FAIL → ANALYZE → REPAIR step in the daily cycle |

The three chain together via `.claude/prompts/playwright-test-coverage.md`
(plan → generate every test case → heal), mirroring the
Discover → Design → Build → Review cycle end to end, minus the Review gate — which
this policy adds back in.

## `drafts/` is a staging area, never a final deliverable

- `playwright.config.ts` points `testDir` at `drafts/` — this is where the generator
  and healer read/write, and it is separate from `features/`, `steps/`, `pages/`.
- A file under `drafts/` is raw, single-file Playwright Test code: inline locators,
  no Page Object, no Gherkin. That is correct for what it is (a fast, MCP-verified,
  passing script) and a direct violation of [locator-policy.md](./locator-policy.md) /
  [gherkin-policy.md](./gherkin-policy.md) if merged as-is.
- **Before a PR is opened**, every scenario coming out of `drafts/` must be extracted
  into the real framework:
  1. Selectors used in the draft move into a Page Object (`pages/`) or Component
     (`components/`) — reuse an existing one per [architecture.md](./architecture.md)
     rule 3 before creating a new one.
  2. The scenario's business steps become a `Scenario:` in `features/*.feature`
     ([gherkin-policy.md](./gherkin-policy.md)), with step definitions in `steps/`
     calling the Page Object.
  3. The file under `drafts/` is deleted once extracted — it does not linger as a
     second, parallel implementation of the same scenario.
- A PR that adds a `drafts/*.spec.ts` file without a corresponding
  `features/*.feature` + `pages/*.ts` change is incomplete, not an alternative style.

## When to skip the extraction (rare, explicit exceptions)

- A one-off exploratory script used only to help the planner/healer understand the
  app, never intended to run again — delete it instead of promoting it.
- A spike explicitly marked WIP in a draft PR, with a follow-up task to do the
  extraction before merge — never merged to `main` in draft form (see
  [azure-policy.md](./azure-policy.md)'s branch policy).

## Healer boundaries

- The healer edits code under `drafts/` (or, post-extraction, may be pointed at
  `pages/`/`steps/` failures) but follows the same rules as any other writer: no new
  duplicate Page Object, no locator added outside a Page Object/Component, no
  `waitForTimeout`. Its own agent definition already forbids `networkidle`/discouraged
  APIs and prefers `test.fixme()` with a comment over silently weakening an assertion —
  keep it that way if the agent definition is ever edited.
- Healer runs are logged the same way as any agent decision
  ([logging-policy.md](./logging-policy.md)): what failed, root cause, what changed.

## Regenerating the agents

`.claude/agents/*.md` and `.claude/prompts/*.md` are vendor-scaffolded
(`playwright init-agents`). Re-running that command will overwrite them — check
`git diff` after re-running it, since local customizations to the prompt files
(seed path, task wording) are not preserved by the tool.
