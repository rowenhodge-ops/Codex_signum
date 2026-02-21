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
import neo4j, { Driver, ManagedTransaction, Session, type QueryResult, type RecordShape } from "neo4j-driver";
export interface Neo4jConfig {
    uri: string;
    user: string;
    password: string;
    database: string;
}
/**
 * Resolve Neo4j connection config from environment.
 */
export declare function getConfig(): Neo4jConfig;
/**
 * Get or create the Neo4j driver instance (singleton).
 */
export declare function getDriver(): Driver;
/**
 * Get a session from the singleton driver.
 */
export declare function getSession(mode?: "READ" | "WRITE"): Session;
/**
 * Close the driver (call on process exit).
 */
export declare function closeDriver(): Promise<void>;
/**
 * Run raw Cypher with automatic session lifecycle.
 */
export declare function runQuery<T extends RecordShape = RecordShape>(cypher: string, params?: Record<string, unknown>, mode?: "READ" | "WRITE"): Promise<QueryResult<T>>;
/**
 * Execute a write transaction with automatic retry.
 */
export declare function writeTransaction<T>(work: (tx: ManagedTransaction) => Promise<T>): Promise<T>;
/**
 * Execute a read transaction with automatic retry.
 */
export declare function readTransaction<T>(work: (tx: ManagedTransaction) => Promise<T>): Promise<T>;
/**
 * Verify Neo4j connection + return latency.
 */
export declare function healthCheck(): Promise<{
    connected: boolean;
    latencyMs: number;
    error?: string;
}>;
export { neo4j };
export type { Driver, ManagedTransaction, QueryResult, Session };
//# sourceMappingURL=client.d.ts.map