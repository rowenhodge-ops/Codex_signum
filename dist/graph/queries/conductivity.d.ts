import type { EndpointState, ConductivityResult } from "../../computation/conductivity.js";
/**
 * Query endpoint state for conductivity evaluation.
 * Reads both endpoints of a Line in a single Cypher query.
 */
export declare function getLineEndpointStates(sourceId: string, targetId: string): Promise<{
    source: EndpointState;
    target: EndpointState;
} | null>;
/**
 * Evaluate conductivity for a specific Line and cache the result.
 * Reads endpoint state from graph, evaluates all 3 layers, persists on the relationship.
 */
export declare function evaluateAndCacheLineConductivity(sourceId: string, targetId: string, lineType: string, taskClass?: string): Promise<ConductivityResult | null>;
/**
 * Invalidate conductivity cache on all Lines touching a node.
 * Marks connected Lines as stale — lazy invalidation.
 */
export declare function invalidateLineConductivity(nodeId: string): Promise<void>;
//# sourceMappingURL=conductivity.d.ts.map