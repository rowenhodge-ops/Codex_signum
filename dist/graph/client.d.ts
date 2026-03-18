import neo4j, { Driver, ManagedTransaction, Session, type QueryResult, type RecordShape } from "neo4j-driver";
export interface Neo4jConfig {
    uri: string;
    user: string;
    password: string;
    database: string;
}
/**
 * Validate that all required Neo4j env vars are present.
 * Called lazily inside getDriver() — NOT at module scope.
 * Detects the recurring NEO4J_USERNAME vs NEO4J_USER mistake.
 */
export declare function validateNeo4jEnv(): void;
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