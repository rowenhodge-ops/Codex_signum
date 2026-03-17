// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Line Conductivity (Three-Layer Circuit Model)
 *
 * Every Line is a circuit. Conductivity determines whether signal flows.
 * Three layers evaluated in order — if Layer 1 or 2 fail, the Line is dark.
 * Layer 3 is continuous friction even when Layer 1+2 pass.
 *
 * @see cs-v5.0.md §Line (Conductivity)
 * @see codex-signum-engineering-bridge-v3_0.md §Line Conductivity
 */
import { VALID_CONTAINERS } from "../graph/instantiation.js";
// ─── Layer 1: Morpheme Hygiene ──────────────────────────────────────
/**
 * Layer 1: Check both endpoints satisfy their morpheme contract.
 *
 * Checks per endpoint:
 *   - content is non-empty
 *   - status is present
 *   - phiL is present (not null/undefined)
 *   - INSTANTIATES Line to Constitutional Bloom definition exists
 *
 * All checks are binary. One failure → Layer 1 fails.
 */
export function evaluateLayer1(source, target) {
    const failures = [];
    for (const endpoint of [source, target]) {
        if (!endpoint.content || endpoint.content.trim() === "") {
            failures.push({
                endpointId: endpoint.id,
                check: "content",
                message: `Endpoint '${endpoint.id}' has empty or missing content`,
            });
        }
        if (!endpoint.status || endpoint.status.trim() === "") {
            failures.push({
                endpointId: endpoint.id,
                check: "status",
                message: `Endpoint '${endpoint.id}' has no status`,
            });
        }
        if (endpoint.phiL === null || endpoint.phiL === undefined) {
            failures.push({
                endpointId: endpoint.id,
                check: "phiL",
                message: `Endpoint '${endpoint.id}' has no ΦL score`,
            });
        }
        if (!endpoint.hasInstantiates) {
            failures.push({
                endpointId: endpoint.id,
                check: "instantiates",
                message: `Endpoint '${endpoint.id}' has no INSTANTIATES link to definition`,
            });
        }
    }
    return { passes: failures.length === 0, failures };
}
// ─── Layer 2: Grammatical Shape ─────────────────────────────────────
/**
 * Layer 2: Check the connection type is grammatically valid for both endpoints.
 *
 * Uses VALID_CONTAINERS from instantiation.ts for CONTAINS validation.
 * Uses direction rules from G2 for other relationship types.
 *
 *   - CONTAINS: source must be bloom|grid, target type must be in allowed list
 *   - DEPENDS_ON: both must be Blooms (dependency is between scope boundaries)
 *   - INSTANTIATES: target must be a Seed (definition Seed in Constitutional Bloom)
 *   - Other types: pass by default (generic connections)
 */
export function evaluateLayer2(source, target, lineType) {
    if (lineType === "CONTAINS") {
        const allowed = VALID_CONTAINERS[source.morphemeType];
        if (!allowed) {
            return {
                passes: false,
                reason: `'${source.morphemeType}' cannot contain any morphemes`,
            };
        }
        if (!allowed.includes(target.morphemeType)) {
            return {
                passes: false,
                reason: `'${source.morphemeType}' cannot CONTAIN '${target.morphemeType}'`,
            };
        }
        return { passes: true };
    }
    if (lineType === "DEPENDS_ON") {
        if (source.morphemeType !== "bloom" || target.morphemeType !== "bloom") {
            return {
                passes: false,
                reason: `DEPENDS_ON requires both endpoints to be Blooms, got '${source.morphemeType}' → '${target.morphemeType}'`,
            };
        }
        return { passes: true };
    }
    if (lineType === "INSTANTIATES") {
        if (target.morphemeType !== "seed") {
            return {
                passes: false,
                reason: `INSTANTIATES target must be a Seed (definition), got '${target.morphemeType}'`,
            };
        }
        return { passes: true };
    }
    // All other line types: pass by default
    return { passes: true };
}
// ─── Layer 3: Contextual Fitness ────────────────────────────────────
/**
 * Layer 3: Compute dimensional friction between endpoints.
 *
 * V1: friction = 1.0 - min(ΦL_source, ΦL_target)
 *
 * When ΦL is null/undefined on either endpoint, default to 0.5 (moderate assumption).
 * Unknown endpoints get moderate friction, not zero or maximum.
 *
 * Returns friction in [0, 1]. Low friction = healthy connection.
 * High friction = compensation candidate.
 */
export function evaluateLayer3(source, target, taskClass) {
    const sourcePhiL = source.phiL ?? 0.5;
    const targetPhiL = target.phiL ?? 0.5;
    const friction = 1.0 - Math.min(sourcePhiL, targetPhiL);
    return { friction, taskClass };
}
// ─── Orchestrator ───────────────────────────────────────────────────
/**
 * Evaluate conductivity for a Line by composing all three layers.
 *
 * Pure function — takes pre-assembled endpoint state.
 * The graph query to assemble state is separate.
 */
export function evaluateConductivity(source, target, lineType, taskClass) {
    const layer1 = evaluateLayer1(source, target);
    const layer2 = evaluateLayer2(source, target, lineType);
    const layer3 = evaluateLayer3(source, target, taskClass);
    const conducts = layer1.passes && layer2.passes;
    const effectiveFriction = conducts ? layer3.friction : 1.0;
    return {
        layer1,
        layer2,
        layer3,
        conducts,
        effectiveFriction,
        evaluatedAt: new Date(),
    };
}
//# sourceMappingURL=conductivity.js.map