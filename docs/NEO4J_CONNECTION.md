# Neo4j Connection

**Environment variables for Neo4j (AuraDB) — ALL FOUR REQUIRED:**

```
NEO4J_URI=neo4j+s://<instance>.databases.neo4j.io
NEO4J_USER=<user>          # ⚠️ NOT NEO4J_USERNAME — this has caused repeated failures
NEO4J_PASSWORD=<password>
NEO4J_DATABASE=<database>  # ⚠️ REQUIRED — without this, AuraDB connections silently hang
```

## Pre-Flight Guard (M-23.1)

`src/graph/client.ts` validates all four env vars at connection time via `validateNeo4jEnv()`. The guard:

- **Fires lazily** inside `getDriver()`, not at module import — tests that never touch Neo4j are unaffected
- **Detects the wrong var name**: if `NEO4J_USERNAME` is set but `NEO4J_USER` is not, the error message names the exact mistake
- **Fails synchronously** before any async driver work — no silent hangs, no timeouts
- **Includes the fix** in the error message (the eval/grep export command)

Without `NEO4J_DATABASE`, the Neo4j driver connects to the default database, which doesn't exist on AuraDB. This produces no error and no timeout — the connection silently hangs forever.

## Export Command

```bash
eval "$(grep -E '^(NEO4J_URI|NEO4J_USER|NEO4J_PASSWORD|NEO4J_DATABASE)=' '../DND-Manager/.env' | tr -d '\r' | sed 's/^/export /')"
```

The `.env` file lives at `../DND-Manager/.env`. The `tr -d '\r'` strips Windows line endings.
