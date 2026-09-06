# Database Policy

`database/` is currently scaffolded but empty — this policy applies from the first
client that gets added.

## Structure

```
database/
  SqlClient.ts          connection + low-level query execution (SQL engine)
  MongoClient.ts         connection + low-level query execution (Mongo/NoSQL)
  <domain>/
    orders.ts            domain-specific accessor methods built on SqlClient/MongoClient
    users.ts
```

## Rules

1. **A test never writes a raw query.** A step calls a domain method
   (`database.orders.findById(orderId)`), not `sqlClient.query("SELECT * FROM orders...")`
   directly in a step file. This is the same separation `pages/` gives the UI: the
   engine-specific client is the "Playwright" of the DB layer, and the domain accessor
   is the "Page Object."
2. **One client per engine, swappable underneath.** Business/domain code depends on the
   domain accessor's method signature, not on whether it's backed by SQL Server,
   PostgreSQL, MongoDB, or CosmosDB. Migrating engines means rewriting the client's
   internals, not every test that uses it.
3. **Assertions read domain state, not raw rows.** Prefer
   `expect(order.status).toBe("PAID")` after `database.orders.findById(...)` returns a
   typed domain object, over asserting against raw driver result shapes.
4. **DB access in tests is read/verify, not read/write setup by default.** If a
   scenario needs seed data, prefer creating it through the API layer (`api/`) when an
   endpoint exists — it's closer to how the data would be created in reality and
   exercises another layer for free. Fall back to direct DB writes only when no API
   path can create the required state.
5. **Credentials come from `config/env.ts` / `.env`, never hardcoded**, and connections
   are opened/closed in `fixtures/hooks.ts`, not ad hoc inside a step.
6. **Every DB-backed scenario is tagged** (e.g. `@db`) so CI can choose to skip DB
   tests in environments without DB access.
