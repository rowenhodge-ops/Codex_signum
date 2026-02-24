/**
 * Codex Signum — Provider Circuit Breaker
 *
 * Provider-level circuit breaker for infrastructure failure protection.
 *
 * States:
 *   CLOSED    — Normal operation. Requests pass through.
 *   OPEN      — N consecutive failures. All requests rejected immediately.
 *   HALF_OPEN — Cooldown elapsed. One probe request allowed.
 *               Success → CLOSED. Failure → OPEN (reset timer).
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
}

export interface CircuitBreakerConfig {
  /** Consecutive failures before opening the circuit (default 3) */
  failureThreshold: number;
  /** Cooldown before half-open probe (ms, default 5 minutes) */
  cooldownMs: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  cooldownMs: 5 * 60 * 1000,
};

// ─── ProviderCircuitBreaker ───────────────────────────────────────────────

export class ProviderCircuitBreaker {
  private readonly circuits = new Map<string, CircuitState>();
  private readonly config: CircuitBreakerConfig;

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
      const elapsed = circuit.openedAt
        ? Date.now() - circuit.openedAt.getTime()
        : Infinity;
      if (elapsed >= this.config.cooldownMs) {
        circuit.state = "half_open";
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow the probe
    return true;
  }

  /** Record a successful call. Resets the circuit to CLOSED. */
  recordSuccess(provider: string): void {
    this.circuits.set(provider, {
      provider,
      state: "closed",
      consecutiveFailures: 0,
      lastFailure: null,
      openedAt: null,
    });
  }

  /**
   * Record an infrastructure failure.
   *
   * If consecutive failures reach failureThreshold, opens the circuit.
   * Should only be called for infrastructure errors,
   * not for model quality failures (e.g. low quality scores).
   */
  recordFailure(provider: string): void {
    const existing = this.circuits.get(provider) ?? {
      provider,
      state: "closed" as const,
      consecutiveFailures: 0,
      lastFailure: null,
      openedAt: null,
    };

    const updated: CircuitState = {
      ...existing,
      consecutiveFailures: existing.consecutiveFailures + 1,
      lastFailure: new Date(),
    };

    if (updated.consecutiveFailures >= this.config.failureThreshold) {
      updated.state = "open";
      updated.openedAt = updated.openedAt ?? new Date();
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
  }
}
