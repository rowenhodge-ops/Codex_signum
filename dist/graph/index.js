// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
/**
 * Codex Signum — Graph Module Barrel Export
 *
 * @module codex-signum-core/graph
 */
export { getDriver, getSession, closeDriver, runQuery, writeTransaction, readTransaction, healthCheck, } from "./client.js";
export { migrateSchema, verifySchema, seedConstitutionalRules, RELATIONSHIP_TYPES, } from "./schema.js";
export { 
// Seeds (formerly Agents)
createSeed, createDataSeed, createContainedDataSeed, getSeed, listActiveSeeds, listActiveSeedsByCapability, 
// Blooms (formerly Patterns)
createBloom, createContainedBloom, getBloom, updateBloomState, updateBloomStatus, connectBlooms, 
// Decisions
recordDecision, recordDecisionOutcome, updateDecisionQuality, findDecisionForTask, getDecisionsForCluster, getArmStatsForCluster, 
// Observations
recordObservation, getObservationsForBloom, countObservationsForBloom, 
// Distillations
createDistillation, 
// Memory persistence (M-9.4)
getCompactableObservations, deleteObservations, getActiveDistillationIds, getObservationsForDistillation, createStructuredDistillation, getDistillationsForBloom, supersededDistillation, 
// Context Clusters
ensureContextCluster, 
// Human Feedback
recordHumanFeedback, getHumanFeedbackForRun, listPendingFeedbackRuns, getCalibrationMetrics, 
// Pipeline Topology
ARCHITECT_STAGES, createPipelineRun, completePipelineRun, getPipelineRun, listPipelineRuns, createTaskOutput, getTaskOutputsForRun, queryTaskOutputsByModel, createContainedResonator, ensureArchitectStages, ensureArchitectResonators, linkTaskOutputToStage, 
// Pipeline Analytics
getPipelineStageHealth, getPipelineRunStats, 
// Pipeline Lifecycle Extensions (M-9.5)
failPipelineRun, updateTaskOutputQuality, getTaskOutput, linkDecisionToPipelineRun, getDecisionsForRun, getCompactionHistory, getModelPerformance, getStagePerformance, getRunComparison, 
// Topology
getBloomDegree, getBloomAdjacency, getBloomsWithHealth, updateBloomPhiL, 
// Ecosystem queries (M-9.8)
getMilestoneOverview, getFutureTestsForMilestone, getHypothesisStatus, 
// Grammar reference queries (M-9.7a)
getGrammarElements, getGrammarCoverage, getAxiomDependencies, getAntiPatternViolations, 
// Morpheme topology queries (M-9.7b)
getPatternTopology, getVisualisationTopology, getGrammarInstances, 
// Backward compatibility aliases (deprecated)
createAgent, getAgent, listActiveAgents, listActiveAgentsByCapability, createPattern, getPattern, updatePatternState, connectPatterns, getObservationsForPattern, countObservationsForPattern, getPatternDegree, getPatternAdjacency, getPatternsWithHealth, updatePatternPhiL, } from "./queries.js";
// Instantiation Protocol (M-16.4 — governance Resonator enforcement)
export { instantiateMorpheme, updateMorpheme, createLine, } from "./instantiation.js";
// Inline conditioning write path
export { writeObservation, writeThresholdEvent, } from "./write-observation.js";
//# sourceMappingURL=index.js.map