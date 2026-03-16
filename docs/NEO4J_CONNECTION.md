# Neo4j Connection

**Environment variables for Neo4j (AuraDB):**

```
NEO4J_URI=neo4j+s://<instance>.databases.neo4j.io
NEO4J_USER=neo4j          # ⚠️ NOT NEO4J_USERNAME — this has caused repeated failures
NEO4J_PASSWORD=<password>
```

**The env var is `NEO4J_USER`, not `NEO4J_USERNAME`.** Multiple scripts and sessions have failed because of this. The `src/graph/client.ts` driver reads `NEO4J_USER`. If your script uses `NEO4J_USERNAME`, it will silently connect with no credentials and fail with auth errors.

If writing a new script that connects to Neo4j, use the same env loading pattern as `scripts/m21-bridge-grid.ts`:

```typescript
// Handle both possible env var names
if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
  process.env.NEO4J_USER = process.env.NEO4J_USERNAME;
}
```

The `.env` file lives at the repo root. If not found, scripts also check `../DND-Manager/.env` as a fallback.
