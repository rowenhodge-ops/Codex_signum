/**
 * Codex Signum — Constitutional Module Barrel Export
 * @module codex-signum-core/constitutional
 */

export {
  createADR,
  evaluateAxioms,
  evaluateConstitution,
  evaluateRule,
  evaluateRules,
} from "./engine.js";
export type { ComplianceContext, ConstitutionalEvaluation } from "./engine.js";
