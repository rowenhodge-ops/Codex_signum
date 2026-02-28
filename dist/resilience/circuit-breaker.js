// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
const DEFAULT_CONFIG = {
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
export function computeCooldown(tripCount, config, randomFn = Math.random) {
    const exponential = config.cooldownBaseMs * Math.pow(config.backoffFactor, tripCount);
    const capped = Math.min(exponential, config.cooldownMaxMs);
    return randomFn() * capped;
}
// ─── ProviderCircuitBreaker ───────────────────────────────────────────────
export class ProviderCircuitBreaker {
    circuits = new Map();
    config;
    /** Per-provider cooldown computed at open time (jitter applied once). */
    activeCooldowns = new Map();
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Whether a provider is currently available to receive requests.
     *
     * - CLOSED    → true
     * - OPEN      → false (unless cooldown elapsed → transition to HALF_OPEN)
     * - HALF_OPEN → true (probe allowed)
     */
    isAvailable(provider) {
        const circuit = this.circuits.get(provider);
        if (!circuit || circuit.state === "closed")
            return true;
        if (circuit.state === "open") {
            const cooldown = this.activeCooldowns.get(provider) ??
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
    recordSuccess(provider) {
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
    recordFailure(provider) {
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
            this.activeCooldowns.set(provider, computeCooldown(existing.tripCount, this.config));
            this.circuits.set(provider, existing);
            return;
        }
        // Closed state: accumulate failures
        const updated = {
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
            this.activeCooldowns.set(provider, computeCooldown(updated.tripCount, this.config));
        }
        this.circuits.set(provider, updated);
    }
    /**
     * Filter a list of candidates to only those whose provider is available.
     */
    filterAvailable(candidates) {
        return candidates.filter((c) => this.isAvailable(c.provider));
    }
    /** Returns all currently open or half-open circuits. */
    getOpenCircuits() {
        return [...this.circuits.values()].filter((c) => c.state === "open" || c.state === "half_open");
    }
    /** Returns a snapshot of all known circuit states. */
    getAllStates() {
        return [...this.circuits.values()];
    }
    /** Reset all circuits. */
    resetAll() {
        this.circuits.clear();
        this.activeCooldowns.clear();
    }
}
// ─── Internal helpers ─────────────────────────────────────────────────────
function freshClosed(provider) {
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
//# sourceMappingURL=circuit-breaker.js.map