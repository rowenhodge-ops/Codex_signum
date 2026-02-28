// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Neo4j Graph Client
 *
 * Singleton driver, session management, and query helpers.
 * Adapted from legacy agent/config/neo4jClient.ts but decoupled
 * from DND-Manager specifics.
 *
 * Environment variables:
 *   NEO4J_URI      — bolt+s:// or neo4j+s:// URI
 *   NEO4J_USER     — Username (default: "neo4j")
 *   NEO4J_PASSWORD — Password
 *   NEO4J_DATABASE — Database name (default: "neo4j")
 *
 * @module codex-signum-core/graph/client
 */

import { config } from "dotenv";
import neo4j, {
  Driver,
  ManagedTransaction,
  Session,
  type QueryResult,
  type RecordShape,
} from "neo4j-driver";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// ============ CONFIGURATION ============

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
  database: string;
}

/**
 * Load .env from repository root.
 */
function loadEnv(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Load codex-signum/.env
  config({ path: resolve(__dirname, "../../.env") });
}

/**
 * Resolve Neo4j connection config from environment.
 */
export function getConfig(): Neo4jConfig {
  loadEnv();

  const uri = process.env.NEO4J_URI?.trim();
  const password = process.env.NEO4J_PASSWORD?.trim();

  if (!uri || !password) {
    throw new Error(
      "Neo4j configuration missing. Set NEO4J_URI and NEO4J_PASSWORD in .env or environment.",
    );
  }

  return {
    uri,
    user: process.env.NEO4J_USER?.trim() || "neo4j",
    password,
    database: process.env.NEO4J_DATABASE?.trim() || "neo4j",
  };
}

// ============ CONNECTION MANAGEMENT ============

let _driver: Driver | null = null;

/**
 * Get or create the Neo4j driver instance (singleton).
 */
export function getDriver(): Driver {
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
export function getSession(mode: "READ" | "WRITE" = "WRITE"): Session {
  const driver = getDriver();
  const cfg = getConfig();
  return driver.session({
    database: cfg.database,
    defaultAccessMode:
      mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE,
  });
}

/**
 * Close the driver (call on process exit).
 */
export async function closeDriver(): Promise<void> {
  if (_driver) {
    await _driver.close();
    _driver = null;
  }
}

// ============ QUERY HELPERS ============

/**
 * Run raw Cypher with automatic session lifecycle.
 */
export async function runQuery<T extends RecordShape = RecordShape>(
  cypher: string,
  params: Record<string, unknown> = {},
  mode: "READ" | "WRITE" = "WRITE",
): Promise<QueryResult<T>> {
  const session = getSession(mode);
  try {
    return await session.run<T>(cypher, params);
  } finally {
    await session.close();
  }
}

/**
 * Execute a write transaction with automatic retry.
 */
export async function writeTransaction<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
): Promise<T> {
  const session = getSession("WRITE");
  try {
    return await session.executeWrite(work);
  } finally {
    await session.close();
  }
}

/**
 * Execute a read transaction with automatic retry.
 */
export async function readTransaction<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
): Promise<T> {
  const session = getSession("READ");
  try {
    return await session.executeRead(work);
  } finally {
    await session.close();
  }
}

// ============ HEALTH CHECK ============

/**
 * Verify Neo4j connection + return latency.
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await runQuery("RETURN 1 AS ping", {}, "READ");
    return { connected: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Re-exports for convenience
export { neo4j };
export type { Driver, ManagedTransaction, QueryResult, Session };
