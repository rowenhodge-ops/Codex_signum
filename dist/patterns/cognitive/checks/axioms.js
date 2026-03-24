// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/** Allowed labels from the grammar's six morphemes + known specialisations */
const ALLOWED_LABELS = new Set([
    "Seed", "Bloom", "Resonator", "Grid", "Helix",
    "Stage", "PipelineRun", "Observation", "Decision", "TaskOutput", "Distillation",
]);
/** Placeholder content patterns that violate A1 Fidelity */
const PLACEHOLDER_PATTERNS = [
    /^tbd$/i,
    /^todo$/i,
    /^placeholder$/i,
    /^n\/a$/i,
    /^coming soon$/i,
    /^to be determined$/i,
    /^fixme$/i,
    /^\.\.\.$/, // literal "..."
];
/**
 * Run all axiom checks against a target morpheme.
 */
export async function checkAxioms(target) {
    const results = [];
    results.push(checkA1(target));
    results.push(checkA2(target));
    results.push(checkA3(target));
    results.push(checkA4(target));
    results.push(checkA6(target));
    results.push(checkA7(target));
    results.push(checkA9(target));
    return results;
}
/**
 * A1: Fidelity — content is non-trivial (>10 chars, not placeholder).
 * Structural proxy only. True semantic fidelity requires LLM evaluation.
 */
function checkA1(target) {
    const content = target.properties.content;
    if (!content) {
        return {
            checkId: "A1",
            checkName: "Fidelity — content exists",
            passed: false,
            severity: "error",
            evidence: `Node '${target.id}' has no content property. Every morpheme carries meaning (A1).`,
            remediation: "Add meaningful content that describes this morpheme's purpose.",
        };
    }
    const trimmed = content.trim();
    if (trimmed.length <= 10) {
        return {
            checkId: "A1",
            checkName: "Fidelity — content substance",
            passed: false,
            severity: "warning",
            evidence: `Content is only ${trimmed.length} chars: "${trimmed}". Likely insufficient to represent meaning faithfully.`,
            remediation: "Expand content to accurately describe this morpheme's role in the system.",
        };
    }
    const isPlaceholder = PLACEHOLDER_PATTERNS.some(p => p.test(trimmed));
    if (isPlaceholder) {
        return {
            checkId: "A1",
            checkName: "Fidelity — not placeholder",
            passed: false,
            severity: "error",
            evidence: `Content is a placeholder: "${trimmed}". A Seed is an atomic datum — data has content.`,
            remediation: "Replace placeholder with actual content describing this morpheme.",
        };
    }
    return {
        checkId: "A1",
        checkName: "Fidelity",
        passed: true,
        severity: "info",
        evidence: `Content present (${trimmed.length} chars), non-placeholder.`,
    };
}
/**
 * A2: Visible State — at least one relationship beyond CONTAINS.
 * A morpheme with only CONTAINS is structurally present but not participating in flows.
 */
function checkA2(target) {
    const nonContainsRels = target.allRelationshipTypes.filter(t => t !== "CONTAINS");
    if (nonContainsRels.length === 0 && target.allRelationshipTypes.length > 0) {
        return {
            checkId: "A2",
            checkName: "Visible State — connectivity",
            passed: false,
            severity: "warning",
            evidence: `Node '${target.id}' has only CONTAINS relationships. It is contained but not participating in any flow.`,
            remediation: "Add at least one non-CONTAINS relationship (FLOWS_TO, INSTANTIATES, SCOPED_TO, etc.).",
        };
    }
    if (target.allRelationshipTypes.length === 0) {
        return {
            checkId: "A2",
            checkName: "Visible State — connectivity",
            passed: false,
            severity: "error",
            evidence: `Node '${target.id}' has zero relationships. It is structurally invisible.`,
            remediation: "Wire at least a CONTAINS relationship from a parent and one operational relationship.",
        };
    }
    return {
        checkId: "A2",
        checkName: "Visible State",
        passed: true,
        severity: "info",
        evidence: `${nonContainsRels.length} non-CONTAINS relationship types: ${nonContainsRels.join(", ")}.`,
    };
}
/**
 * A3: Transparency — required properties present per morpheme type.
 */
function checkA3(target) {
    const REQUIRED = {
        seed: ["id", "name", "content", "seedType", "status"],
        bloom: ["id", "name", "content", "type", "status"],
        resonator: ["id", "name", "content", "type", "status"],
        grid: ["id", "name", "content", "type", "status"],
        helix: ["id", "name", "content", "mode", "status"],
    };
    const required = REQUIRED[target.morphemeType];
    if (!required) {
        return {
            checkId: "A3",
            checkName: "Transparency — required properties",
            passed: true,
            severity: "info",
            evidence: `No required-property definition for type '${target.morphemeType}'.`,
        };
    }
    const missing = required.filter(prop => {
        const val = target.properties[prop];
        return val === undefined || val === null || val === "";
    });
    if (missing.length > 0) {
        return {
            checkId: "A3",
            checkName: "Transparency — required properties",
            passed: false,
            severity: "error",
            evidence: `Missing required properties for ${target.morphemeType}: ${missing.join(", ")}`,
            remediation: `Add the missing properties: ${missing.join(", ")}`,
        };
    }
    return {
        checkId: "A3",
        checkName: "Transparency",
        passed: true,
        severity: "info",
        evidence: `All ${required.length} required properties present.`,
    };
}
/**
 * A4: Provenance — createdAt exists. Seeds need seedType. Resonators/Blooms need transformationDefId.
 */
function checkA4(target) {
    const issues = [];
    if (!target.properties.createdAt) {
        issues.push("missing createdAt");
    }
    if (target.morphemeType === "seed" && !target.properties.seedType) {
        issues.push("missing seedType");
    }
    // Resonators and Blooms should have transformation-level INSTANTIATES (provenance of what they are)
    if (target.morphemeType === "resonator" || target.morphemeType === "bloom") {
        const hasInstantiates = target.instantiatesTargets.length > 0;
        if (!hasInstantiates) {
            issues.push("no INSTANTIATES edges (no provenance of what this morpheme instantiates)");
        }
    }
    if (issues.length > 0) {
        return {
            checkId: "A4",
            checkName: "Provenance",
            passed: false,
            severity: "warning",
            evidence: `Provenance gaps on '${target.id}': ${issues.join("; ")}`,
            remediation: "Add missing provenance properties/relationships.",
        };
    }
    return {
        checkId: "A4",
        checkName: "Provenance",
        passed: true,
        severity: "info",
        evidence: "createdAt present, type-specific provenance satisfied.",
    };
}
/**
 * A6: Minimal Authority — no cross-boundary CONTAINS leaks.
 * FLOWS_TO stays within declared scope or uses shared Resonators.
 */
function checkA6(target) {
    // Check: does this node have outbound FLOWS_TO to nodes in very different
    // containment trees? This is a heuristic — deep cross-tree FLOWS_TO
    // may indicate scope leakage. Shared ecosystem Resonators are excluded.
    let suspiciousCount = 0;
    for (const ft of target.flowsToTargets) {
        if (!ft.containsParentId || !target.containsParentId)
            continue;
        // Skip shared ecosystem-level targets
        if (ft.id.startsWith("resonator:"))
            continue;
        if (ft.containsParentId === "ecosystem" || ft.containsParentId === "constitutional-bloom")
            continue;
        // Same parent — fine
        if (ft.containsParentId === target.containsParentId)
            continue;
        suspiciousCount++;
    }
    if (suspiciousCount > 3) {
        return {
            checkId: "A6",
            checkName: "Minimal Authority — scope boundary",
            passed: false,
            severity: "warning",
            evidence: `Node '${target.id}' has ${suspiciousCount} cross-Bloom FLOWS_TO edges (excluding shared Resonators). May indicate scope leakage.`,
            remediation: "Review cross-Bloom connections. Use shared ecosystem Resonators for cross-scope communication.",
        };
    }
    return {
        checkId: "A6",
        checkName: "Minimal Authority",
        passed: true,
        severity: "info",
        evidence: `Cross-Bloom FLOWS_TO count: ${suspiciousCount} (threshold: 3).`,
    };
}
/**
 * A7: Semantic Stability — all labels are from the grammar's six morphemes + known specialisations.
 */
function checkA7(target) {
    const unknownLabels = target.labels.filter(l => !ALLOWED_LABELS.has(l));
    if (unknownLabels.length > 0) {
        return {
            checkId: "A7",
            checkName: "Semantic Stability — valid labels",
            passed: false,
            severity: "error",
            evidence: `Unknown labels: ${unknownLabels.join(", ")}. Labels must be from the grammar's morpheme set.`,
            remediation: `Remove unknown labels. Valid labels: ${[...ALLOWED_LABELS].join(", ")}`,
        };
    }
    return {
        checkId: "A7",
        checkName: "Semantic Stability",
        passed: true,
        severity: "info",
        evidence: `All labels valid: ${target.labels.join(", ")}.`,
    };
}
/**
 * A9: Comprehension Primacy — content is substantial enough to understand purpose.
 * Type-specific thresholds: config Seeds > 20 chars, all others > 30 chars.
 */
function checkA9(target) {
    const content = target.properties.content;
    if (!content) {
        // A1 already catches missing content
        return {
            checkId: "A9",
            checkName: "Comprehension Primacy",
            passed: true,
            severity: "info",
            evidence: "Content absence handled by A1.",
        };
    }
    const seedType = target.properties.seedType;
    const isConfig = seedType === "config" || seedType === "observation";
    const threshold = isConfig ? 20 : 30;
    if (content.trim().length < threshold) {
        return {
            checkId: "A9",
            checkName: "Comprehension Primacy — content depth",
            passed: false,
            severity: "warning",
            evidence: `Content is ${content.trim().length} chars (threshold: ${threshold} for ${isConfig ? "config/observation" : "standard"} Seeds). May be insufficient for comprehension.`,
            remediation: "Expand content to convey enough meaning for a reader to understand this morpheme's purpose.",
        };
    }
    return {
        checkId: "A9",
        checkName: "Comprehension Primacy",
        passed: true,
        severity: "info",
        evidence: `Content length (${content.trim().length} chars) exceeds ${threshold}-char threshold.`,
    };
}
//# sourceMappingURL=axioms.js.map