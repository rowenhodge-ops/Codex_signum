/**
 * DISPATCH stage — three-way task routing.
 *
 * 1. Deterministic tasks → registered DeterministicExecutor (no LLM)
 * 2. Mechanical tasks (confidence ≥ threshold) → TaskExecutor (DevAgent path)
 * 3. Generative tasks → TaskExecutor (LLM path, default)
 *
 * Deterministic tasks that have no registered executor fall back to generative.
 */
import type { PlanState, TaskExecutor, DeterministicExecutor } from "./types.js";
export interface DispatchOptions {
    repoPath: string;
    dryRun?: boolean;
}
/** Minimum confidence for mechanical classification to use DevAgent path */
export declare const MECHANICAL_CONFIDENCE_THRESHOLD = 0.6;
/**
 * Register a DeterministicExecutor for handling structured data transforms.
 * Executors are checked in registration order — first match wins.
 */
export declare function registerDeterministicExecutor(executor: DeterministicExecutor): void;
/**
 * Clear all registered deterministic executors.
 * Primarily for testing — resets the registry between test runs.
 */
export declare function clearDeterministicExecutors(): void;
/**
 * Get the count of registered deterministic executors.
 */
export declare function getDeterministicExecutorCount(): number;
export declare function dispatch(planState: PlanState, taskExecutor: TaskExecutor, options?: DispatchOptions): Promise<PlanState>;
//# sourceMappingURL=dispatch.d.ts.map