// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import { ALL_ARMS } from "../../src/bootstrap.js";

describe("ALL_ARMS registry", () => {
  it("has no duplicate IDs", () => {
    const ids = ALL_ARMS.map((arm) => arm.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ensures active arms have required core fields", () => {
    for (const arm of ALL_ARMS.filter((candidate) => candidate.status === "active")) {
      expect(arm.id).toBeTruthy();
      expect(arm.name).toBeTruthy();
      expect(arm.provider).toBeTruthy();
      expect(arm.model).toBeTruthy();
      expect(arm.baseModelId).toBeTruthy();
      expect(arm.thinkingMode).toBeTruthy();
      expect(arm.endpoint).toBeTruthy();
      expect(arm.region).toBeTruthy();
    }
  });

  it("uses expected arm ID conventions", () => {
    for (const arm of ALL_ARMS) {
      const segments = arm.id.split(":");
      expect(segments.length).toBeGreaterThanOrEqual(2);
      expect(segments.length).toBeLessThanOrEqual(3);
      expect(["adaptive", "extended", "none", "default"]).toContain(segments[1]);

      if (["adaptive", "extended"].includes(segments[1])) {
        expect(segments.length).toBe(3);
      }
    }
  });

  it("flags retired arms with retired status", () => {
    const retired = ALL_ARMS.filter((arm) => arm.id.includes("claude-3"));
    expect(retired.length).toBeGreaterThan(0);
    for (const arm of retired) {
      expect(arm.status).toBe("retired");
    }
  });
});
