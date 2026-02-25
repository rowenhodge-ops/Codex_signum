/**
 * Codex Signum - Architect Pattern
 *
 * 7-stage pipeline: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT
 *
 * @module codex-signum-core/patterns/architect
 */
// Existing survey (core's rich spec cross-reference version)
export { survey } from "./survey.js";
// Pipeline stages
export { classify } from "./classify.js";
export { sequence } from "./sequence.js";
export { gate } from "./gate.js";
export { adapt } from "./adapt.js";
export { decompose } from "./decompose.js";
export { buildDecomposePrompt } from "./decompose-prompt.js";
export { dispatch } from "./dispatch.js";
export { executePlan } from "./architect.js";
// Constants
export { MAX_ADAPTATIONS_PER_PLAN, MAX_TASKS_PER_PLAN, MANDATORY_HUMAN_GATE, } from "./types.js";
//# sourceMappingURL=index.js.map