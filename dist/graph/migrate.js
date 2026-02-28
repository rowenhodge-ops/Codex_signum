#!/usr/bin/env npx tsx
// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Schema Migration (CLI)
 *
 * Run: npx tsx src/graph/migrate.ts
 */
import { closeDriver } from "./client.js";
import { migrateSchema, seedConstitutionalRules, verifySchema, } from "./schema.js";
async function main() {
    console.log("🔄 Codex Signum — Schema Migration\n");
    try {
        // Apply schema
        console.log("1. Applying constraints and indexes...");
        const { applied, errors } = await migrateSchema();
        console.log(`   Applied: ${applied} statements`);
        if (errors.length > 0) {
            console.log(`   Errors: ${errors.length}`);
            for (const err of errors) {
                console.log(`   ❌ ${err}`);
            }
        }
        // Seed constitutional rules
        console.log("\n2. Seeding constitutional rules...");
        const rulesCreated = await seedConstitutionalRules();
        console.log(`   Created/verified: ${rulesCreated} rules`);
        // Verify
        console.log("\n3. Verifying schema...");
        const schema = await verifySchema();
        console.log(`   Constraints: ${schema.constraintCount}`);
        console.log(`   Indexes: ${schema.indexCount}`);
        console.log(`   Status: ${schema.healthy ? "✅ Healthy" : "⚠️  Incomplete"}`);
        console.log("\n✅ Migration complete.");
    }
    catch (error) {
        console.error("\n❌ Migration failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await closeDriver();
    }
}
main();
//# sourceMappingURL=migrate.js.map