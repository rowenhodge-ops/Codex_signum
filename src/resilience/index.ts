/**
 * Codex Signum — Resilience Module
 *
 * Infrastructure-level failure protection mechanisms.
 *
 * @module codex-signum-core/resilience
 */

export {
  ProviderCircuitBreaker,
} from "./circuit-breaker.js";
export type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitState,
} from "./circuit-breaker.js";
