// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyProviderAuth } from "../../scripts/bootstrap-executor.js";

// Mock arms for testing — mirrors provider distribution in ALL_ARMS
const MOCK_ARMS = [
  { provider: "anthropic", status: "active" },
  { provider: "anthropic", status: "active" },
  { provider: "anthropic", status: "active" },
  { provider: "vertex-ai", status: "active" },
  { provider: "vertex-ai", status: "active" },
  { provider: "vertex-ai", status: "retired" }, // retired — should not count
];

describe("Pre-flight auth verification (FR-9)", () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    };
  });

  afterEach(() => {
    // Restore original env
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("returns structured result with all provider statuses", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.GOOGLE_API_KEY = "test-key";

    const result = verifyProviderAuth(true, MOCK_ARMS);

    expect(result.providers).toHaveLength(3);
    expect(result.providers.map((p) => p.provider)).toEqual(["anthropic", "vertex", "google"]);
    for (const p of result.providers) {
      expect(p.checkedAt).toBeTruthy();
      expect(typeof p.available).toBe("boolean");
    }
  });

  it("detects missing ANTHROPIC_API_KEY", () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.GOOGLE_API_KEY = "test-key";

    const result = verifyProviderAuth(true, MOCK_ARMS);

    expect(result.allAvailable).toBe(false);
    const anthropic = result.providers.find((p) => p.provider === "anthropic")!;
    expect(anthropic.available).toBe(false);
    expect(anthropic.error).toBe("ANTHROPIC_API_KEY not set");
  });

  it("detects unavailable Vertex AI", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.GOOGLE_API_KEY = "test-key";

    const result = verifyProviderAuth(false, MOCK_ARMS);

    expect(result.allAvailable).toBe(false);
    const vertex = result.providers.find((p) => p.provider === "vertex")!;
    expect(vertex.available).toBe(false);
    expect(vertex.error).toBe("Vertex AI credentials not available");
  });

  it("detects missing GOOGLE_API_KEY", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    delete process.env.GOOGLE_API_KEY;

    const result = verifyProviderAuth(true, MOCK_ARMS);

    expect(result.allAvailable).toBe(false);
    const google = result.providers.find((p) => p.provider === "google")!;
    expect(google.available).toBe(false);
    expect(google.error).toBe("GOOGLE_API_KEY not set");
  });

  it("reports allAvailable=true when all providers authenticated", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.GOOGLE_API_KEY = "test-key";

    const result = verifyProviderAuth(true, MOCK_ARMS);

    expect(result.allAvailable).toBe(true);
    for (const p of result.providers) {
      expect(p.available).toBe(true);
      expect(p.error).toBeUndefined();
    }
  });

  it("counts available models correctly per provider class", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    delete process.env.GOOGLE_API_KEY;

    // Vertex available, Google not — anthropic models + vertex models counted
    const result = verifyProviderAuth(true, MOCK_ARMS);

    // 5 active arms total (3 anthropic + 2 vertex-ai active, 1 vertex-ai retired)
    expect(result.totalModelCount).toBe(5);
    // anthropic (3) + vertex-ai→vertex (2) = 5, google (0) not available
    expect(result.availableModelCount).toBe(5);
  });

  it("reports 0 available models when no providers are authenticated", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    const result = verifyProviderAuth(false, MOCK_ARMS);

    expect(result.allAvailable).toBe(false);
    expect(result.availableModelCount).toBe(0);
    expect(result.totalModelCount).toBe(5); // still 5 active arms exist
  });

  it("excludes retired models from total count", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.GOOGLE_API_KEY = "test-key";

    const result = verifyProviderAuth(true, MOCK_ARMS);

    // 6 total arms but 1 is retired
    expect(result.totalModelCount).toBe(5);
  });

  it("handles empty arms array", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.GOOGLE_API_KEY = "test-key";

    const result = verifyProviderAuth(true, []);

    expect(result.totalModelCount).toBe(0);
    expect(result.availableModelCount).toBe(0);
    expect(result.allAvailable).toBe(true); // providers are available, just no models
  });
});
