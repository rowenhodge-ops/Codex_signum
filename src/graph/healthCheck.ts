#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Graph Health Check (CLI)
 *
 * Run: npx tsx src/graph/healthCheck.ts
 */

import { closeDriver, healthCheck } from "./client.js";
import { verifySchema } from "./schema.js";

async function main() {
  console.log("🔍 Codex Signum — Neo4j Health Check\n");

  try {
    // Connection check
    console.log("1. Testing connection...");
    const health = await healthCheck();
    if (health.connected) {
      console.log(`   ✅ Connected (${health.latencyMs}ms)`);
    } else {
      console.log(`   ❌ Connection failed: ${health.error}`);
      process.exit(1);
    }

    // Schema check
    console.log("\n2. Verifying schema...");
    const schema = await verifySchema();
    console.log(`   Constraints: ${schema.constraintCount}`);
    console.log(`   Indexes: ${schema.indexCount}`);
    console.log(
      `   Schema healthy: ${schema.healthy ? "✅" : "⚠️  Run graph:migrate to fix"}`,
    );

    console.log("\n✅ Health check complete.");
  } catch (error) {
    console.error(
      "\n❌ Health check failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
