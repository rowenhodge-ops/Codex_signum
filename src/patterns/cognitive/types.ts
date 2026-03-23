// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Cognitive Bloom Types
 *
 * Types for the self-knowledge pattern: structural survey, constitutional delta,
 * intent synthesis, and cycle orchestration.
 *
 * @module codex-signum-core/patterns/cognitive
 */

/** Survey of a single Bloom's topology */
export interface BloomSurvey {
  bloomId: string;
  bloomName: string;

  /** Spectral properties */
  lambda2: number;
  psiH: number;
  phiL: number;

  /** Children with their internal state */
  children: Array<{
    id: string;
    name: string;
    labels: string[];
    status: string;
    phiL: number | null;
    psiH: number | null;
    internalMorphemes: Array<{
      id: string;
      name: string;
      labels: string[];
      transformationDefId: string | null;
    }>;
  }>;

  /** Lines between children (inter-edges that affect lambda2) */
  interChildLines: Array<{
    sourceId: string;
    targetId: string;
    type: string;
  }>;

  /** INSTANTIATES edges from all nodes in scope to transformation/bloom definitions */
  instantiatesEdges: Array<{
    fromId: string;
    fromName: string;
    toDefId: string;
    defName: string;
    defSeedType: string;
  }>;
}

/** A gap between current topology and constitutional target */
export interface GapSeed {
  gapId: string;
  gapType: "constitutional" | "topological";
  description: string;
  severity: "mandatory" | "advisory";

  /** For constitutional gaps: which definition is uninstantiated */
  missingDefId?: string;
  missingDefName?: string;

  /** For topological gaps: what spectral improvement is expected */
  expectedLambda2Delta?: number;

  /** For missing Lines: source and target */
  missingLineSource?: string;
  missingLineTarget?: string;
  missingLineType?: string;
}

/** An Intent Seed produced by the Cognitive Bloom for Architect consumption */
export interface CognitiveIntent {
  intentId: string;
  source: "cognitive-bloom";
  cycleNumber: number;
  timestamp: string;

  /** Gap classification */
  gapType: "constitutional" | "topological" | "mixed";

  /** The delta -- what changes are proposed */
  proposedChanges: Array<{
    changeType: "create_resonator" | "create_bloom" | "create_line" | "mutate";
    targetDefId?: string;
    description: string;
    a6Justification?: string;
  }>;

  /** Pre-survey spectral state (for post-cycle comparison) */
  preSurveyLambda2: number;
  preSurveyPsiH: number;

  /** Always true for Cognitive Bloom intents -- forces human GATE */
  governanceModifying: true;
}

/** Transformation definitions from the Constitutional Bloom */
export interface TransformationDef {
  id: string;
  name: string;
  seedType: string;
  ioShape: string;
  scope: string;
}
