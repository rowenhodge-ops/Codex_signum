/**
 * Codex Signum -- Observation Value Conditioning
 *
 * Wraps SignalPipeline.process() for observation values.
 * Consumers provide the pipeline instance; core remains stateless.
 *
 * conditionValue() is called INLINE during observation writes --
 * it is a function call, not a scheduled process or background task.
 *
 * @module codex-signum-core/computation/condition-value
 */
import type { SignalPipeline } from "../signals/SignalPipeline.js";
import type { ConditionedSignal } from "../signals/types.js";
/**
 * Condition a raw observation value through the 7-stage signal pipeline.
 *
 * Converts the observation context (patternId, metric, raw value) into
 * a SignalEvent and routes it through the caller-provided pipeline.
 *
 * The pipeline instance MUST be reused across calls for the same pattern
 * to maintain EWMA/CUSUM/trend accumulator state. Creating a new pipeline
 * per call resets all stateful stages.
 *
 * @param pipeline - The SignalPipeline instance (caller owns lifecycle)
 * @param patternId - The pattern this observation belongs to
 * @param metric - Observation metric name (mapped to signal dimension)
 * @param rawValue - The raw observation value
 * @param topologyRole - Node's topology role for EWMA alpha selection
 * @returns ConditionedSignal with smoothedValue, alerts, etc.
 */
export declare function conditionValue(pipeline: SignalPipeline, patternId: string, metric: string, rawValue: number, topologyRole?: "leaf" | "hub" | "default"): ConditionedSignal;
//# sourceMappingURL=condition-value.d.ts.map