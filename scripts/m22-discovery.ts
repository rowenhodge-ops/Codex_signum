/**
 * M-22 Discovery: Query Neo4j for pre-existing state before graph setup.
 * [NO-PIPELINE] — read-only diagnostic.
 */

import path from "path";
import fs from "fs";
import { readTransaction, closeDriver } from "../src/graph/client.js";

// ─── Load environment ───────────────────────────────────────────────

function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../DND-Manager/.env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const clean = line.replace(/\r$/, "");
        const match = clean.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, key, rawVal] = match;
          const val = rawVal.replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
  if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
    process.env.NEO4J_USER = process.env.NEO4J_USERNAME;
  }
}

loadEnv();

async function main() {
  console.log("M-22 Discovery Queries\n");

  // 1. Root-level Blooms
  const roots = await readTransaction(async (tx) => {
    const res = await tx.run(
      "MATCH (b:Bloom) WHERE NOT ()-[:CONTAINS]->(b) RETURN b.id, b.name LIMIT 10",
    );
    return res.records.map((r) => ({
      id: r.get("b.id"),
      name: r.get("b.name"),
    }));
  });
  console.log("=== Root-level Blooms ===");
  roots.forEach((r) => console.log(`  ${r.id} | ${r.name}`));

  // 2. Existing M-22 nodes
  const m22 = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (n) WHERE n.id CONTAINS 'm-22' OR n.id CONTAINS 'M-22'
       RETURN n.id, n.name, labels(n) AS labels LIMIT 10`,
    );
    return res.records.map((r) => ({
      id: r.get("n.id"),
      name: r.get("n.name"),
      labels: r.get("labels"),
    }));
  });
  console.log("\n=== Existing M-22 nodes ===");
  if (m22.length === 0) console.log("  (none)");
  m22.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.labels}`));

  // 3. M-17 nodes
  const m17 = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (n) WHERE n.id IN ['M-17', 'bloom:m-17']
       OR (n.name IS NOT NULL AND n.name CONTAINS 'M-17')
       RETURN n.id, n.name, labels(n) AS labels LIMIT 10`,
    );
    return res.records.map((r) => ({
      id: r.get("n.id"),
      name: r.get("n.name"),
      labels: r.get("labels"),
    }));
  });
  console.log("\n=== M-17 nodes ===");
  if (m17.length === 0) console.log("  (none)");
  m17.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.labels}`));

  // 4. Bridge spec Seeds
  const specs = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (s:Seed) WHERE s.id STARTS WITH 'spec:bridge:'
       RETURN s.id ORDER BY s.id`,
    );
    return res.records.map((r) => r.get("s.id") as string);
  });
  console.log(`\n=== Bridge spec Seeds (${specs.length}) ===`);
  specs.forEach((s) => console.log(`  ${s}`));

  // 5. Check which SPECIFIED_BY targets exist for our wiring
  const neededSpecs = [
    "spec:bridge:signal-conditioning",
    "spec:bridge:phi-l",
    "spec:bridge:psi-h",
    "spec:bridge:composition-epsilon-r",
    "spec:bridge:degradation-cascade",
    "spec:bridge:line-conductivity",
    "spec:bridge:structural-review",
  ];
  console.log("\n=== SPECIFIED_BY target availability ===");
  for (const id of neededSpecs) {
    const found = specs.includes(id);
    console.log(`  ${found ? "✓" : "✗"} ${id}`);
  }

  // 6. Find milestone Blooms
  const milestones = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (b:Bloom) WHERE b.id STARTS WITH 'bloom:m-' OR b.type = 'milestone'
       RETURN b.id, b.name, b.type, b.status ORDER BY b.id LIMIT 30`,
    );
    return res.records.map((r) => ({
      id: r.get("b.id"),
      name: r.get("b.name"),
      type: r.get("b.type"),
      status: r.get("b.status"),
    }));
  });
  console.log("\n=== Milestone Blooms ===");
  if (milestones.length === 0) console.log("  (none)");
  milestones.forEach((r) =>
    console.log(`  ${r.id} | ${r.name} | ${r.type} | ${r.status}`),
  );

  // 7. Find Constitutional / Codex Blooms (potential parents)
  const codexBlooms = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (b:Bloom) WHERE b.name CONTAINS 'Constitutional' OR b.name CONTAINS 'Codex'
       OR b.id IN ['bloom:codex-signum', 'constitutional-bloom', 'bloom:constitutional', 'bloom:project-root']
       RETURN b.id, b.name LIMIT 10`,
    );
    return res.records.map((r) => ({
      id: r.get("b.id"),
      name: r.get("b.name"),
    }));
  });
  console.log("\n=== Constitutional/Codex Blooms ===");
  if (codexBlooms.length === 0) console.log("  (none)");
  codexBlooms.forEach((r) => console.log(`  ${r.id} | ${r.name}`));

  // 8. Find what grid:bridge-v3 is contained by (to trace parent chain)
  const gridParent = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (parent)-[:CONTAINS]->(g:Grid {id: 'grid:bridge-v3'})
       RETURN parent.id, parent.name, labels(parent) AS labels`,
    );
    return res.records.map((r) => ({
      id: r.get("parent.id"),
      name: r.get("parent.name"),
      labels: r.get("labels"),
    }));
  });
  console.log("\n=== Parent of grid:bridge-v3 ===");
  if (gridParent.length === 0) console.log("  (none)");
  gridParent.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.labels}`));

  // 9. Find where bloom:m-21 sits
  const m21 = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (parent)-[:CONTAINS]->(b:Bloom {id: 'bloom:m-21'})
       RETURN parent.id, parent.name, labels(parent) AS labels`,
    );
    return res.records.map((r) => ({
      id: r.get("parent.id"),
      name: r.get("parent.name"),
      labels: r.get("labels"),
    }));
  });
  console.log("\n=== Parent of bloom:m-21 ===");
  if (m21.length === 0) console.log("  (none — bloom:m-21 may not exist)");
  m21.forEach((r) => console.log(`  ${r.id} | ${r.name} | ${r.labels}`));
}

main()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  })
  .finally(() => closeDriver());
