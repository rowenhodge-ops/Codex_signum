/**
 * runRetrospective — query graph, return structured insights.
 *
 * Pure read. No LLM. No pipeline stages. No monitoring overlay.
 * The graph already contains the answers.
 *
 * Optionally writes a DistilledInsight node if writeInsights: true
 * and any convergence cluster is "diverging" (high signal, worth persisting).
 *
 * @module codex-signum-core/patterns/retrospective/retrospective
 */
import type { RetrospectiveOptions, RetrospectiveInsights } from "./types.js";
export declare function runRetrospective(opts?: RetrospectiveOptions): Promise<RetrospectiveInsights>;
//# sourceMappingURL=retrospective.d.ts.map