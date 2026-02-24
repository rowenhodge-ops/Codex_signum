/**
 * Codex Signum — Provider Circuit Breaker
 *
 * Provider-level circuit breaker for infrastructure failure protection.
 *
 * States:
 *   CLOSED    — Normal operation. Requests pass through.
 *   OPEN      — N consecutive failures. All requests rejected immediately.
 *   HALF_OPEN — Cooldown elapsed. Trial probes allowed (5-10 successes to close).
 *               All successes → CLOSED. Any failure → OPEN (increment trip count).
 *
 * Backoff (Engineering Bridge §Part 3):
 *   actual_delay = random(0, min(base × 1.5^tripCount, cooldownMaxMs))
 *   Full jitter prevents thundering-herd when multiple circuits recover.
 *
 * Half-open probes (Engineering Bridge §Part 3):
 *   5-10 trial successes required before closing.  Not just 1.
 *
 * Thompson Sampling already adapts to model quality over time, but it can't
 * react fast enough to prevent hammering a down provider (e.g. outage,
 * expired token). The circuit breaker provides immediate protection.
 *
 * Core is stateless-ish: callers instantiate ProviderCircuitBreaker and
 * own its lifecycle. No module-level singletons.
 *
 * Ported from DND-Manager agent/adapters/circuit-breaker.ts.
 *
 * @module codex-signum-core/resilience/circuit-breaker
 */
export type CircuitBreakerState = "closed" | "open" | "half_open";
export interface CircuitState {
    provider: string;
    state: CircuitBreakerState;
    consecutiveFailures: number;
    lastFailure: Date | null;
    openedAt: Date | null;
    /** How many times this circuit has tripped open. Drives exponential backoff. */
    tripCount: number;
    /** Successful probes accumulated during half-open state. */
    halfOpenSuccesses: number;
}
export interface CircuitBreakerConfig {
    /** Consecutive failures before opening the circuit (default 3) */
    failureThreshold: number;
    /** Base cooldown before half-open probe (ms, default 60_000 = 1 min) */
    cooldownBaseMs: number;
    /** Maximum cooldown cap (ms, default 300_000 = 5 min) */
    cooldownMaxMs: number;
    /** Exponential base for backoff (default 1.5) */
    backoffFactor: number;
    /** Successes needed in half-open to close the circuit (default 5, spec: 5-10) */
    halfOpenProbes: number;
}
/**
 * Exponential backoff with full jitter per Engineering Bridge §Part 3:
 *   actual_delay = random(0, min(base × 1.5^tripCount, cooldownMaxMs))
 *
 * `randomFn` is injectable for deterministic testing.
 */
export declare function computeCooldown(tripCount: number, config: CircuitBreakerConfig, randomFn?: () => number): number;
export declare class ProviderCircuitBreaker {
    private readonly circuits;
    private readonly config;
    /** Per-provider cooldown computed at open time (jitter applied once). */
    private readonly activeCooldowns;
    constructor(config?: Partial<CircuitBreakerConfig>);
    /**
     * Whether a provider is currently available to receive requests.
     *
     * - CLOSED    → true
     * - OPEN      → false (unless cooldown elapsed → transition to HALF_OPEN)
     * - HALF_OPEN → true (probe allowed)
     */
    isAvailable(provider: string): boolean;
    /**
     * Record a successful call.
     *
     * - CLOSED/unknown → full reset to closed.
     * - HALF_OPEN → increment halfOpenSuccesses.
     *   When halfOpenSuccesses >= halfOpenProbes → transition to CLOSED,
     *   reset tripCount.
     */
    recordSuccess(provider: string): void;
    /**
     * Record an infrastructure failure.
     *
     * If consecutive failures reach failureThreshold, opens the circuit.
     * In half-open state, any failure immediately re-opens and increments tripCount.
     *
     * Should only be called for infrastructure errors,
     * not for model quality failures (e.g. low quality scores).
     */
    recordFailure(provider: string): void;
    /**
     * Filter a list of candidates to only those whose provider is available.
     */
    filterAvailable<T extends {
        provider: string;
    }>(candidates: T[]): T[];
    /** Returns all currently open or half-open circuits. */
    getOpenCircuits(): CircuitState[];
    /** Returns a snapshot of all known circuit states. */
    getAllStates(): CircuitState[];
    /** Reset all circuits. */
    resetAll(): void;
}
//# sourceMappingURL=circuit-breaker.d.ts.map