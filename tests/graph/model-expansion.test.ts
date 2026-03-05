// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import { ALL_ARMS } from "../../src/bootstrap.js";
import type { SeedProps } from "../../src/graph/queries.js";

// ── M-9.6: Model Expansion — Vertex AI MaaS Substrate ──────────────────────

describe("M-9.6 Model Expansion — ALL_ARMS integrity", () => {
  it("no duplicate IDs in ALL_ARMS", () => {
    const ids = ALL_ARMS.map((a) => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every entry satisfies SeedProps required fields", () => {
    for (const arm of ALL_ARMS) {
      expect(arm.id).toBeTruthy();
      expect(arm.name).toBeTruthy();
      expect(arm.provider).toBeTruthy();
      expect(arm.model).toBeTruthy();
      expect(arm.baseModelId).toBeTruthy();
      expect(arm.thinkingMode).toBeTruthy();
    }
  });

  it("every entry has a valid status", () => {
    for (const arm of ALL_ARMS) {
      if (arm.status) {
        expect(["active", "inactive", "degraded", "retired"]).toContain(
          arm.status,
        );
      }
    }
  });

  it("every entry has an endpoint", () => {
    for (const arm of ALL_ARMS) {
      if (arm.status === "active") {
        expect(arm.endpoint).toBeTruthy();
      }
    }
  });
});

describe("M-9.6 Tier 1 — GPT-OSS Text Generation", () => {
  const gptOss = ALL_ARMS.find((a) => a.id === "gpt-oss-120b:default");

  it("GPT-OSS-120B exists in ALL_ARMS", () => {
    expect(gptOss).toBeDefined();
  });

  it("GPT-OSS-120B has correct properties", () => {
    expect(gptOss!.provider).toBe("vertex-ai");
    expect(gptOss!.status).toBe("active");
    expect(gptOss!.endpoint).toBe("rawPredict");
    expect(gptOss!.model).toBe("gpt-oss-120b-maas@001");
    expect(gptOss!.baseModelId).toBe("gpt-oss-120b");
  });

  it("GPT-OSS-120B has text generation capabilities", () => {
    expect(gptOss!.capabilities).toBeDefined();
    expect(gptOss!.capabilities).toContain("code_generation");
    expect(gptOss!.capabilities).toContain("analytical");
    expect(gptOss!.capabilities).toContain("generative");
  });
});

describe("M-9.6 Tier 2 — Document Processing", () => {
  const tier2Ids = [
    "pretrained-ocr-v1:default",
    "pretrained-ocr-v2:default",
    "imagetext-v1:default",
    "imagetext-v2:default",
    "form-parser-v1:default",
    "translate-llm:default",
  ];

  it("all Tier 2 models exist in ALL_ARMS", () => {
    for (const id of tier2Ids) {
      const entry = ALL_ARMS.find((a) => a.id === id);
      expect(entry, `missing ${id}`).toBeDefined();
    }
  });

  it("all Tier 2 models are vertex-ai active", () => {
    for (const id of tier2Ids) {
      const entry = ALL_ARMS.find((a) => a.id === id)!;
      expect(entry.provider).toBe("vertex-ai");
      expect(entry.status).toBe("active");
    }
  });

  it("OCR models have document_processing capability", () => {
    for (const id of ["pretrained-ocr-v1:default", "pretrained-ocr-v2:default"]) {
      const entry = ALL_ARMS.find((a) => a.id === id)!;
      expect(entry.capabilities).toContain("ocr");
      expect(entry.capabilities).toContain("document_processing");
    }
  });
});

describe("M-9.6 Tier 3 — Speech & Audio", () => {
  const tier3Ids = [
    "chirp-2:default",
    "lyria-002:default",
    "video-speech-transcription:default",
  ];

  it("all Tier 3 models exist in ALL_ARMS", () => {
    for (const id of tier3Ids) {
      const entry = ALL_ARMS.find((a) => a.id === id);
      expect(entry, `missing ${id}`).toBeDefined();
    }
  });

  it("speech models have appropriate capabilities", () => {
    const chirp = ALL_ARMS.find((a) => a.id === "chirp-2:default")!;
    expect(chirp.capabilities).toContain("speech_to_text");

    const lyria = ALL_ARMS.find((a) => a.id === "lyria-002:default")!;
    expect(lyria.capabilities).toContain("audio_generation");
  });
});

describe("M-9.6 Tier 4 — Image Generation", () => {
  const tier4Ids = [
    "imagen-4.0:default",
    "imagen-4.0-fast:default",
    "imagen-4.0-ultra:default",
  ];

  it("all Tier 4 models exist in ALL_ARMS", () => {
    for (const id of tier4Ids) {
      const entry = ALL_ARMS.find((a) => a.id === id);
      expect(entry, `missing ${id}`).toBeDefined();
    }
  });

  it("all Imagen models have image_generation capability", () => {
    for (const id of tier4Ids) {
      const entry = ALL_ARMS.find((a) => a.id === id)!;
      expect(entry.capabilities).toContain("image_generation");
    }
  });
});

describe("M-9.6 — No duplicates with existing models", () => {
  it("gemini-2.5-flash-lite exists exactly once", () => {
    const matches = ALL_ARMS.filter((a) =>
      a.id.startsWith("gemini-2.5-flash-lite"),
    );
    expect(matches.length).toBe(1);
  });

  it("gemini-2.5-pro exists exactly once", () => {
    const matches = ALL_ARMS.filter((a) =>
      a.id.startsWith("gemini-2.5-pro"),
    );
    expect(matches.length).toBe(1);
  });

  it("gemini-2.5-flash exists exactly once", () => {
    const matches = ALL_ARMS.filter((a) => a.id === "gemini-2.5-flash:default");
    expect(matches.length).toBe(1);
  });
});
