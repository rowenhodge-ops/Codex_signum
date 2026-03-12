// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Morpheme Type Definitions
 *
 * The six fundamental forms from which all expressions compose.
 * These are immutable. Their meanings are fixed across all versions,
 * all implementations, all scales.
 *
 * @see codex-signum-v3.0.md §The Six Morphemes
 * @module codex-signum-core/types/morphemes
 */

// ============ MORPHEME KINDS ============

/**
 * The six morpheme types — dimensional channels of the encoding space.
 * Each defines a distinct encoding dimension:
 * - Seed: lifecycle stage
 * - Line: connectivity
 * - Bloom: scope
 * - Resonator: transformation
 * - Grid: structure
 * - Helix: temporality
 */
export type MorphemeKind =
  | "seed"
  | "line"
  | "bloom"
  | "resonator"
  | "grid"
  | "helix";

// ============ INTEGRATION STATE ============

/**
 * Integration state lifecycle for any morpheme.
 * Created → Dormant → Connected → Active → [Degraded → Recovering | Archived]
 */
export type IntegrationState =
  | "created"
  | "dormant"
  | "connected"
  | "active"
  | "degraded"
  | "recovering"
  | "archived";

// ============ BASE MORPHEME ============

/**
 * Base properties shared by all morphemes.
 * Every morpheme carries the three state dimensions.
 */
export interface MorphemeBase {
  /** Unique identifier */
  id: string;
  /** Morpheme kind — determines structural role */
  kind: MorphemeKind;
  /** Human-readable name */
  name: string;
  /** Integration lifecycle state */
  state: IntegrationState;
  /** Creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Optional description of purpose */
  description?: string;
  /** Optional tags for classification */
  tags?: string[];
}

// ============ SEED (•) ============

/**
 * Seed — Point/Singularity
 * Encodes: Origin, instance, datum, coherent unit.
 * The atomic unit — a piece of data, a function instance, a decision point.
 *
 * A Seed with no inbound or outbound Lines is Dormant.
 */
export interface Seed extends MorphemeBase {
  kind: "seed";
  /** Role this seed plays in a composition */
  role: string;
  /** The type of datum or function this seed represents */
  seedType: "function" | "datum" | "decision" | "input" | "output";
  /** Whether this seed accepts input */
  accepts?: string;
  /** Whether this seed produces output */
  produces?: string;
}

// ============ LINE (→) ============

/**
 * Line — Vector/Connection
 * Encodes: Flow, transformation, direction.
 * Connection requires intent (G1).
 */
export type LineDirection = "forward" | "return" | "parallel" | "bidirectional";

export interface Line extends MorphemeBase {
  kind: "line";
  /** Source morpheme ID */
  from: string;
  /** Target morpheme ID */
  to: string;
  /** Direction encodes relationship (G2) */
  direction: LineDirection;
  /** Optional condition for when this line activates */
  condition?: string;
  /** Connection weight — relationship strength */
  weight: number;
}

// ============ BLOOM (○) ============

/**
 * Bloom — Circle/Boundary
 * Encodes: Scope, boundary, context.
 * Containment creates scope (G3).
 */
export type BloomShape = "open" | "closed";

export interface Bloom extends MorphemeBase {
  kind: "bloom";
  /** Open C-shape = receptive interface; Closed = protected scope */
  shape: BloomShape;
  /** IDs of morphemes contained within this bloom */
  contains: string[];
  /** Interface definition — where external connection happens */
  interface: {
    inputs: Array<{ id: string; type: string; accepts: string }>;
    outputs: Array<{ id: string; type: string; produces: string }>;
    exposes: Array<{
      id: string;
      type: string;
      access: "read" | "write" | "observe";
    }>;
  };
  /** Dependencies this bloom requires */
  dependencies: {
    requiresModels: string[];
    requiresGrids: string[];
    requiresExternal: string[];
  };
}

// ============ RESONATOR (Δ) ============

/**
 * Resonator — Triangle/Process
 * Encodes: Transformation, decision, routing.
 * Orientation matters: up = emission/output, down = reception/input.
 */
export type ResonatorOrientation = "up" | "down";

export interface Resonator extends MorphemeBase {
  kind: "resonator";
  /** Apex up (Δ) = emission/output; Apex down (∇) = reception/input */
  orientation: ResonatorOrientation;
  /** The transformation role this resonator performs */
  role: string;
  /** Optional mechanism description */
  mechanism?: string;
}

// ============ GRID (□) ============

/**
 * Grid — Square/Structure
 * Encodes: Network, schema, knowledge structure.
 * Where persistent memory enables persona emergence.
 */
export type GridType = "persistent" | "ephemeral" | "shared";

export interface Grid extends MorphemeBase {
  kind: "grid";
  /** Persistence type */
  gridType: GridType;
  /** Schema reference for the knowledge structure */
  schemaRef?: string;
  /** Memory stratum this grid operates at (1-4) */
  stratum?: 1 | 2 | 3 | 4;
}

// ============ HELIX (🌀) ============

/**
 * Helix — Spiral/Evolution
 * Encodes: Recursion, iteration, temporal flow, learning.
 *
 * Mode is INFERRED from temporal constant and containment context,
 * not declared. Convention:
 * - Refinement: within single execution (seconds to minutes)
 * - Learning: across executions (hours to weeks)
 * - Evolutionary: across ecosystem (weeks to months)
 */
export type HelixMode = "refinement" | "learning" | "evolutionary";

export interface Helix extends MorphemeBase {
  kind: "helix";
  /** Inferred mode based on temporal constant and context */
  mode: HelixMode;
  /** ID of the morpheme this helix feeds into */
  feedsInto: string;
  /** Optional source grid for learning data */
  source?: string;
  /** Maximum iterations for refinement helixes */
  maxIterations?: number;
}

// ============ UNION TYPE ============

/**
 * Any morpheme — discriminated union on `kind`.
 */
export type Morpheme = Seed | Line | Bloom | Resonator | Grid | Helix;

// ============ GRAMMAR COMPLIANCE ============

/**
 * Grammar rule compliance for a composition.
 * G1-G5 are the five grammar rules.
 */
export interface GrammarCompliance {
  /** G1: Proximity — Connection requires intent */
  G1_proximity: boolean;
  /** G2: Orientation — Direction encodes flow */
  G2_orientation: boolean;
  /** G3: Containment — Enclosure creates scope */
  G3_containment: boolean;
  /** G4: Flow — Light movement is data transfer */
  G4_flow: boolean;
  /** G5: Resonance — Alignment enables composition */
  G5_resonance: boolean;
  /** List of specific violations found */
  violations: string[];
}
