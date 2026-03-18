// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Neo4j Graph Client
 *
 * Singleton driver, session management, and query helpers.
 * Substrate-agnostic — no consumer-specific dependencies.
 *
 * Environment variables (ALL required — no defaults):
 *   NEO4J_URI      — bolt+s:// or neo4j+s:// URI
 *   NEO4J_USER     — Username (NOT NEO4J_USERNAME)
 *   NEO4J_PASSWORD — Password
 *   NEO4J_DATABASE — Database name (required for AuraDB — no default)
 *
 * @module codex-signum-core/graph/client
 */
import { config } from "dotenv";
import neo4j from "neo4j-driver";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
/**
 * Load .env from repository root.
 */
function loadEnv() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Load codex-signum/.env
    config({ path: resolve(__dirname, "../../.env") });
}
/**
 * Validate that all required Neo4j env vars are present.
 * Called lazily inside getDriver() — NOT at module scope.
 * Detects the recurring NEO4J_USERNAME vs NEO4J_USER mistake.
 */
export function validateNeo4jEnv() {
    // Detect the specific recurring mistake FIRST
    if (process.env.NEO4J_USERNAME && !process.env.NEO4J_USER) {
        throw new Error("Found NEO4J_USERNAME but the correct var name is NEO4J_USER (not NEO4J_USERNAME).\n" +
            "See docs/NEO4J_CONNECTION.md for the correct export command.");
    }
    const required = [
        "NEO4J_URI",
        "NEO4J_USER",
        "NEO4J_PASSWORD",
        "NEO4J_DATABASE",
    ];
    const missing = required.filter((v) => !process.env[v]?.trim());
    if (missing.length > 0) {
        const lines = [
            `Neo4j connection requires env vars: ${required.join(", ")}`,
            `Missing: ${missing.join(", ")}`,
            "",
            "IMPORTANT: The user var is NEO4J_USER (not NEO4J_USERNAME).",
            "",
            "Export from .env (see docs/NEO4J_CONNECTION.md for the full command):",
            '  eval "$(grep -E \'^(NEO4J_URI|NEO4J_USER|NEO4J_PASSWORD|NEO4J_DATABASE)=\' path/to/.env | tr -d \'\\r\' | sed \'s/^/export /\')"',
            "",
            "See docs/NEO4J_CONNECTION.md for details.",
        ];
        throw new Error(lines.join("\n"));
    }
}
/**
 * Resolve Neo4j connection config from environment.
 */
export function getConfig() {
    loadEnv();
    validateNeo4jEnv();
    return {
        uri: process.env.NEO4J_URI.trim(),
        user: process.env.NEO4J_USER.trim(),
        password: process.env.NEO4J_PASSWORD.trim(),
        database: process.env.NEO4J_DATABASE.trim(),
    };
}
// ============ CONNECTION MANAGEMENT ============
let _driver = null;
/**
 * Get or create the Neo4j driver instance (singleton).
 */
export function getDriver() {
    if (!_driver) {
        const cfg = getConfig();
        _driver = neo4j.driver(cfg.uri, neo4j.auth.basic(cfg.user, cfg.password), {
            maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
            disableLosslessIntegers: true, // JS numbers
        });
    }
    return _driver;
}
/**
 * Get a session from the singleton driver.
 */
export function getSession(mode = "WRITE") {
    const driver = getDriver();
    const cfg = getConfig();
    return driver.session({
        database: cfg.database,
        defaultAccessMode: mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE,
    });
}
/**
 * Close the driver (call on process exit).
 */
export async function closeDriver() {
    if (_driver) {
        await _driver.close();
        _driver = null;
    }
}
// ============ QUERY HELPERS ============
/**
 * Run raw Cypher with automatic session lifecycle.
 */
export async function runQuery(cypher, params = {}, mode = "WRITE") {
    const session = getSession(mode);
    try {
        return await session.run(cypher, params);
    }
    finally {
        await session.close();
    }
}
/**
 * Execute a write transaction with automatic retry.
 */
export async function writeTransaction(work) {
    const session = getSession("WRITE");
    try {
        return await session.executeWrite(work);
    }
    finally {
        await session.close();
    }
}
/**
 * Execute a read transaction with automatic retry.
 */
export async function readTransaction(work) {
    const session = getSession("READ");
    try {
        return await session.executeRead(work);
    }
    finally {
        await session.close();
    }
}
// ============ HEALTH CHECK ============
/**
 * Verify Neo4j connection + return latency.
 */
export async function healthCheck() {
    const start = Date.now();
    try {
        await runQuery("RETURN 1 AS ping", {}, "READ");
        return { connected: true, latencyMs: Date.now() - start };
    }
    catch (error) {
        return {
            connected: false,
            latencyMs: Date.now() - start,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
// Re-exports for convenience
export { neo4j };
//# sourceMappingURL=client.js.map