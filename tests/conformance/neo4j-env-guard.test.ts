// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateNeo4jEnv } from "../../src/graph/client.js";

describe("Neo4j env validation (M-23.1)", () => {
  const REQUIRED_VARS = [
    "NEO4J_URI",
    "NEO4J_USER",
    "NEO4J_PASSWORD",
    "NEO4J_DATABASE",
  ] as const;

  // Save and restore all relevant env vars around each test
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const v of [...REQUIRED_VARS, "NEO4J_USERNAME"]) {
      saved[v] = process.env[v];
    }
    // Set all required vars to valid values for a clean baseline
    process.env.NEO4J_URI = "neo4j+s://test.databases.neo4j.io";
    process.env.NEO4J_USER = "testuser";
    process.env.NEO4J_PASSWORD = "testpass";
    process.env.NEO4J_DATABASE = "testdb";
    delete process.env.NEO4J_USERNAME;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  });

  it("passes when all four required vars are set", () => {
    expect(() => validateNeo4jEnv()).not.toThrow();
  });

  it("throws with helpful message when NEO4J_DATABASE is missing", () => {
    delete process.env.NEO4J_DATABASE;
    expect(() => validateNeo4jEnv()).toThrow(/NEO4J_DATABASE/);
    expect(() => validateNeo4jEnv()).toThrow(/NEO4J_USER/);
  });

  it("throws when NEO4J_URI is missing", () => {
    delete process.env.NEO4J_URI;
    expect(() => validateNeo4jEnv()).toThrow(/NEO4J_URI/);
  });

  it("throws when NEO4J_PASSWORD is missing", () => {
    delete process.env.NEO4J_PASSWORD;
    expect(() => validateNeo4jEnv()).toThrow(/NEO4J_PASSWORD/);
  });

  it("lists all missing vars when multiple are absent", () => {
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_DATABASE;
    expect(() => validateNeo4jEnv()).toThrow(/NEO4J_URI/);
    expect(() => validateNeo4jEnv()).toThrow(/NEO4J_DATABASE/);
  });

  it("treats whitespace-only values as missing", () => {
    process.env.NEO4J_DATABASE = "   ";
    expect(() => validateNeo4jEnv()).toThrow(/NEO4J_DATABASE/);
  });

  it("detects NEO4J_USERNAME (wrong name) and suggests correct name", () => {
    delete process.env.NEO4J_USER;
    process.env.NEO4J_USERNAME = "somevalue";
    expect(() => validateNeo4jEnv()).toThrow(
      /NEO4J_USERNAME.*NEO4J_USER/s,
    );
  });

  it("NEO4J_USERNAME error takes priority over generic missing-var error", () => {
    delete process.env.NEO4J_USER;
    process.env.NEO4J_USERNAME = "somevalue";
    try {
      validateNeo4jEnv();
      expect.unreachable("should have thrown");
    } catch (e: unknown) {
      const msg = (e as Error).message;
      // Should mention the specific mistake, not just "Missing: NEO4J_USER"
      expect(msg).toContain("NEO4J_USERNAME");
      expect(msg).toContain("correct var name is NEO4J_USER");
    }
  });

  it("includes the export command in the error message", () => {
    delete process.env.NEO4J_DATABASE;
    try {
      validateNeo4jEnv();
      expect.unreachable("should have thrown");
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).toContain("eval");
      expect(msg).toContain("NEO4J_CONNECTION.md");
    }
  });

  it("does NOT throw at module import time", () => {
    // This test passes by existing — if the guard ran at import time,
    // this test file would fail to load in CI where env vars aren't set.
    // The import at the top of this file (validateNeo4jEnv) succeeded
    // without the real env vars being set.
    expect(true).toBe(true);
  });
});
