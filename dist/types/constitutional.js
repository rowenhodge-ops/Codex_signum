// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Compute axiom compliance fraction (0.0–1.0).
 */
export function computeAxiomComplianceFraction(axioms) {
    const values = Object.values(axioms);
    const satisfied = values.filter(Boolean).length;
    return satisfied / values.length;
}
//# sourceMappingURL=constitutional.js.map