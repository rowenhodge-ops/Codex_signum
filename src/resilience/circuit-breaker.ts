// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

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

// ─── Types ────────────────────────────────────────────────────────────────

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

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  cooldownBaseMs: 60_000,
  cooldownMaxMs: 300_000,
  backoffFactor: 1.5,
  halfOpenProbes: 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Exponential backoff with full jitter per Engineering Bridge §Part 3:
 *   actual_delay = random(0, min(base × 1.5^tripCount, cooldownMaxMs))
 *
 * `randomFn` is injectable for deterministic testing.
 */
export function computeCooldown(
  tripCount: number,
  config: CircuitBreakerConfig,
  randomFn: () => number = Math.random,
): number {
  const exponential =
    config.cooldownBaseMs * Math.pow(config.backoffFactor, tripCount);
  const capped = Math.min(exponential, config.cooldownMaxMs);
  return randomFn() * capped;
}

// ─── ProviderCircuitBreaker ───────────────────────────────────────────────

export class ProviderCircuitBreaker {
  private readonly circuits = new Map<string, CircuitState>();
  private readonly config: CircuitBreakerConfig;
  /** Per-provider cooldown computed at open time (jitter applied once). */
  private readonly activeCooldowns = new Map<string, number>();

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Whether a provider is currently available to receive requests.
   *
   * - CLOSED    → true
   * - OPEN      → false (unless cooldown elapsed → transition to HALF_OPEN)
   * - HALF_OPEN → true (probe allowed)
   */
  isAvailable(provider: string): boolean {
    const circuit = this.circuits.get(provider);
    if (!circuit || circuit.state === "closed") return true;

    if (circuit.state === "open") {
      const cooldown =
        this.activeCooldowns.get(provider) ??
        computeCooldown(circuit.tripCount, this.config);
      const elapsed = circuit.openedAt
        ? Date.now() - circuit.openedAt.getTime()
        : Infinity;
      if (elapsed >= cooldown) {
        circuit.state = "half_open";
        circuit.halfOpenSuccesses = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow probes
    return true;
  }

  /**
   * Record a successful call.
   *
   * - CLOSED/unknown → full reset to closed.
   * - HALF_OPEN → increment halfOpenSuccesses.
   *   When halfOpenSuccesses >= halfOpenProbes → transition to CLOSED,
   *   reset tripCount.
   */
  recordSuccess(provider: string): void {
    const existing = this.circuits.get(provider);

    if (existing && existing.state === "half_open") {
      existing.halfOpenSuccesses += 1;
      if (existing.halfOpenSuccesses >= this.config.halfOpenProbes) {
        // Fully recovered — reset everything including trip count
        this.circuits.set(provider, freshClosed(provider));
        this.activeCooldowns.delete(provider);
      }
      return;
    }

    // Not half-open (or unknown) — simple reset
    this.circuits.set(provider, freshClosed(provider));
    this.activeCooldowns.delete(provider);
  }

  /**
   * Record an infrastructure failure.
   *
   * If consecutive failures reach failureThreshold, opens the circuit.
   * In half-open state, any failure immediately re-opens and increments tripCount.
   *
   * Should only be called for infrastructure errors,
   * not for model quality failures (e.g. low quality scores).
   */
  recordFailure(provider: string): void {
    const existing = this.circuits.get(provider) ?? freshClosed(provider);

    // Half-open failure: re-open immediately, bump trip count
    if (existing.state === "half_open") {
      existing.state = "open";
      existing.tripCount += 1;
      existing.halfOpenSuccesses = 0;
      existing.openedAt = new Date();
      existing.consecutiveFailures += 1;
      existing.lastFailure = new Date();
      // Recompute cooldown with new trip count
      this.activeCooldowns.set(
        provider,
        computeCooldown(existing.tripCount, this.config),
      );
      this.circuits.set(provider, existing);
      return;
    }

    // Closed state: accumulate failures
    const updated: CircuitState = {
      ...existing,
      consecutiveFailures: existing.consecutiveFailures + 1,
      lastFailure: new Date(),
    };

    if (updated.consecutiveFailures >= this.config.failureThreshold) {
      updated.state = "open";
      updated.tripCount += 1;
      updated.openedAt = new Date();
      updated.halfOpenSuccesses = 0;
      // Compute jittered cooldown once at open time
      this.activeCooldowns.set(
        provider,
        computeCooldown(updated.tripCount, this.config),
      );
    }

    this.circuits.set(provider, updated);
  }

  /**
   * Filter a list of candidates to only those whose provider is available.
   */
  filterAvailable<T extends { provider: string }>(candidates: T[]): T[] {
    return candidates.filter((c) => this.isAvailable(c.provider));
  }

  /** Returns all currently open or half-open circuits. */
  getOpenCircuits(): CircuitState[] {
    return [...this.circuits.values()].filter(
      (c) => c.state === "open" || c.state === "half_open",
    );
  }

  /** Returns a snapshot of all known circuit states. */
  getAllStates(): CircuitState[] {
    return [...this.circuits.values()];
  }

  /** Reset all circuits. */
  resetAll(): void {
    this.circuits.clear();
    this.activeCooldowns.clear();
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────

function freshClosed(provider: string): CircuitState {
  return {
    provider,
    state: "closed",
    consecutiveFailures: 0,
    lastFailure: null,
    openedAt: null,
    tripCount: 0,
    halfOpenSuccesses: 0,
  };
}
