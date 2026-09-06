# Logging Policy

Logging exists so a failure can be diagnosed from `logs/` and `reports/` alone,
without re-running the test. It is also the audit trail for anything an agent decides
autonomously (see [azure-policy.md](./azure-policy.md) for the agent-decision log).

## How to log

Always go through `helpers/logger.ts` — never `console.log` directly in a step, page,
fixture, or client.

```ts
import { logger } from "../helpers/logger";

logger.info("Starting scenario: Login with invalid credentials");
logger.error("Scenario failed: Login with invalid credentials");
```

## Levels

| Level | Use for |
|---|---|
| `info` | scenario start/end, major step transitions, agent decisions ("HU-1234 classified AUTOMATE") |
| `warn` | recoverable anomalies (a retry happened, a fallback locator was used) |
| `error` | scenario failure, an unhandled condition, an agent diagnosis of a likely app defect |
| `debug` | verbose detail only useful while actively investigating (request/response bodies, intermediate state) — not left enabled by default in CI |

## Rules

1. **Never log secrets.** No passwords, tokens, PATs, connection strings, or full
   auth headers — mask them (`***`) if the value must appear at all.
2. **Log the "why", not just the "what."** `logger.error("Scenario failed: login")`
   is weaker than `logger.error("Scenario failed: login — expected error banner, none rendered")`.
3. **One log line per meaningful event**, not one per Playwright action. Logging every
   `click`/`fill` call drowns the signal that actually matters during triage.
4. **Screenshots on failure are mandatory** (already wired in `fixtures/hooks.ts`'s
   `After` hook via `this.attach(screenshot, "image/png")`) — do not remove this to
   "clean up" a step.
5. **Agent-driven actions log their reasoning**, not just their result — e.g. a
   classification decision, an automation candidate rejection, or a self-repair
   attempt should produce an `info`/`warn` line explaining why, so the daily report
   described in [azure-policy.md](./azure-policy.md) can be reconstructed from logs.
