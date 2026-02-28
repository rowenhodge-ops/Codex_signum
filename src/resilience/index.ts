// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Resilience Module
 *
 * Infrastructure-level failure protection mechanisms.
 *
 * @module codex-signum-core/resilience
 */

export {
  ProviderCircuitBreaker,
  computeCooldown,
} from "./circuit-breaker.js";
export type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitState,
} from "./circuit-breaker.js";
