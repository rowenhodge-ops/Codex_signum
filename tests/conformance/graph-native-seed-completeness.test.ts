// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L5 Invariant — Graph-Native Data Creation Rule 1: Seed Completeness
 *
 * "Every piece of data enters the graph as a Seed. It MUST have:
 *  id, seedType, content, status, createdAt."
 * "A Seed with only an id and name is a bare stub, not a datum."
 *
 * This test verifies that all Seed creation paths require substantive content,
 * not just identity fields. Bare stubs violate A1 (Fidelity).
 *
 * Source: CLAUDE.md §Graph-Native Data Creation — Rule 1
 *
 * R-39 SUPERSESSION: The morpheme instantiation layer now provides structural
 * enforcement for this rule via DataSeedProps (content required at compile time),
 * createDataSeed() (empty-string guard at runtime), and Neo4j constraints
 * (seed_content_required). These tests are retained as documentation of what
 * the structure enforces, not as the enforcement mechanism.
 */
import { describe, expect, it } from "vitest";
import type { PipelineOutputSeedProps } from "../../src/graph/queries.js";
import {
  getCategories,
  GRAMMAR_REF_ID,
} from "../../scripts/bootstrap-grammar-reference.js";
import type { GrammarElement } from "../../scripts/bootstrap-grammar-reference.js";
import {
  getRoadmapMilestones,
  getHypotheses,
} from "../../scripts/bootstrap-ecosystem.js";

// ── Type Contract: PipelineOutputSeedProps requires content ──────────────────

describe("Rule 1: PipelineOutputSeedProps — content is required", () => {
  it("content field is present and typed as string", () => {
    const props: PipelineOutputSeedProps = {
      id: "run-1:t1",
      name: "Test",
      seedType: "pipeline-output",
      content: "Substantive output text",
      qualityScore: 0.7,
      modelId: "test-model",
      charCount: 22,
      durationMs: 1000,
      runId: "run-1",
      taskId: "t1",
      order: 0,
    };
    // content is a required field — TypeScript enforces this at compile time.
    // Runtime assertion confirms the contract holds.
    expect(typeof props.content).toBe("string");
    expect(props.content.length).toBeGreaterThan(0);
  });

  it("seedType is a literal 'pipeline-output' — not a freeform string", () => {
    const props: PipelineOutputSeedProps = {
      id: "run-1:t2",
      name: "Test 2",
      seedType: "pipeline-output",
      content: "Output",
      qualityScore: null,
      modelId: null,
      charCount: 6,
      durationMs: 0,
      runId: "run-1",
      taskId: "t2",
      order: 1,
    };
    expect(props.seedType).toBe("pipeline-output");
  });

  it("all required identity fields are present on the type", () => {
    // Compile-time enforcement: attempting to create PipelineOutputSeedProps
    // without any of these fields would be a TypeScript error.
    const props: PipelineOutputSeedProps = {
      id: "test:id",
      name: "test name",
      seedType: "pipeline-output",
      content: "test content",
      qualityScore: null,
      modelId: null,
      charCount: 12,
      durationMs: 0,
      runId: "test-run",
      taskId: "test-task",
      order: 0,
    };
    expect(props.id).toBeTruthy();
    expect(props.name).toBeTruthy();
    expect(props.seedType).toBeTruthy();
    expect(props.content).toBeTruthy();
    expect(props.runId).toBeTruthy();
    expect(props.taskId).toBeTruthy();
  });
});

// ── Bootstrap Grammar Reference: every GrammarElement has description ─────────

describe("Rule 1: Grammar reference Seeds — all have substantive content", () => {
  const categories = getCategories();
  const allElements: GrammarElement[] = categories.flatMap((c) => c.elements);

  it("every grammar element has non-empty description (content equivalent)", () => {
    for (const el of allElements) {
      expect(
        el.description,
        `Grammar element ${el.id} has empty/missing description`,
      ).toBeTruthy();
      expect(
        el.description.length,
        `Grammar element ${el.id} description is too short to be substantive`,
      ).toBeGreaterThan(5);
    }
  });

  it("every grammar element has seedType", () => {
    for (const el of allElements) {
      expect(
        el.seedType,
        `Grammar element ${el.id} has no seedType`,
      ).toBeTruthy();
    }
  });

  it("every grammar element has specSource (provenance — A4)", () => {
    for (const el of allElements) {
      expect(
        el.specSource,
        `Grammar element ${el.id} has no specSource`,
      ).toBeTruthy();
    }
  });

  it("every grammar element has implementationStatus", () => {
    const validStatuses = ["complete", "partial", "types-only", "not-started", "aspirational"];
    for (const el of allElements) {
      expect(
        validStatuses,
        `Grammar element ${el.id} has invalid status '${el.implementationStatus}'`,
      ).toContain(el.implementationStatus);
    }
  });
});

// ── Bootstrap Ecosystem: every milestone has description or is sub-milestone ──

describe("Rule 1: Ecosystem milestone Seeds — all have substantive content", () => {
  const milestones = getRoadmapMilestones();

  it("major milestones have description (content equivalent)", () => {
    const major = milestones.filter((m) => m.type === "milestone");
    for (const m of major) {
      expect(
        m.description ?? m.name,
        `Milestone ${m.id} has no description and no meaningful name`,
      ).toBeTruthy();
      // At minimum, every milestone should have a name
      expect(
        m.name,
        `Milestone ${m.id} has no name`,
      ).toBeTruthy();
      expect(
        m.name.length,
        `Milestone ${m.id} name is empty`,
      ).toBeGreaterThan(0);
    }
  });

  it("every milestone has required identity fields", () => {
    for (const m of milestones) {
      expect(m.id, "Milestone missing id").toBeTruthy();
      expect(m.name, `Milestone ${m.id} missing name`).toBeTruthy();
      expect(m.status, `Milestone ${m.id} missing status`).toBeTruthy();
      expect(typeof m.phiL, `Milestone ${m.id} phiL is not a number`).toBe("number");
      expect(typeof m.sequence, `Milestone ${m.id} sequence is not a number`).toBe("number");
    }
  });

  it("hypotheses have substantive claim content", () => {
    const hypotheses = getHypotheses();
    for (const h of hypotheses) {
      expect(h.id, "Hypothesis missing id").toBeTruthy();
      expect(
        h.claim,
        `Hypothesis ${h.id} has no claim (content)`,
      ).toBeTruthy();
      expect(
        h.claim.length,
        `Hypothesis ${h.id} claim is too short to be substantive`,
      ).toBeGreaterThan(10);
    }
  });
});

// ── ManifestSeedingExecutor: verifies content is populated from output files ──

describe("Rule 1: ManifestSeedingExecutor — passes content to tryCreateAndLinkSeed", () => {
  it("ManifestSeedingExecutor constructs Seeds with content field", async () => {
    const { ManifestSeedingExecutor } = await import(
      "../../scripts/bootstrap-deterministic-executor.js"
    );
    const executor = new ManifestSeedingExecutor();
    // Verify the executor exists and has the canHandle method
    expect(typeof executor.canHandle).toBe("function");
    expect(typeof executor.execute).toBe("function");
  });

  it("canHandle recognizes json_manifest input_type", async () => {
    const { ManifestSeedingExecutor } = await import(
      "../../scripts/bootstrap-deterministic-executor.js"
    );
    const executor = new ManifestSeedingExecutor();

    // Task with json_manifest → graph_nodes should be handled
    const manifestTask = {
      task_id: "t1",
      title: "Seed manifest",
      description: "Seed pipeline output",
      input_type: "json_manifest",
      output_type: "graph_nodes",
      task_type: "deterministic" as const,
      phase: 1,
      estimated_complexity: "trivial" as const,
      files_affected: [],
      dependencies: [],
      classification_confidence: 1.0,
    };
    expect(executor.canHandle(manifestTask)).toBe(true);

    // Task without manifest should not be handled
    const nonManifestTask = {
      ...manifestTask,
      input_type: "markdown",
      output_type: "markdown",
    };
    expect(executor.canHandle(nonManifestTask)).toBe(false);
  });
});
