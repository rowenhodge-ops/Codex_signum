// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { pathToFileURL } from "node:url";
import { closeDriver, createSeed, createBloom, ensureContextCluster, getDecisionsForCluster, listActiveSeeds, migrateSchema, recordDecision, recordDecisionOutcome, runQuery, seedConstitutionalRules, } from "./graph/index.js";
export const ALL_ARMS = [
    {
        id: "claude-opus-4-6:adaptive:max",
        name: "Claude Opus 4.6 (Adaptive Max)",
        provider: "anthropic",
        model: "claude-opus-4-6",
        baseModelId: "claude-opus-4-6",
        thinkingMode: "adaptive",
        thinkingParameter: "max",
        supportsAdaptiveThinking: true,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 128000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 15000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: [
            "code_generation",
            "review",
            "planning",
            "strategic",
            "extended_thinking",
        ],
    },
    {
        id: "claude-opus-4-6:adaptive:high",
        name: "Claude Opus 4.6 (Adaptive High)",
        provider: "anthropic",
        model: "claude-opus-4-6",
        baseModelId: "claude-opus-4-6",
        thinkingMode: "adaptive",
        thinkingParameter: "high",
        supportsAdaptiveThinking: true,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 128000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 12000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review", "planning", "strategic"],
    },
    {
        id: "claude-opus-4-6:adaptive:medium",
        name: "Claude Opus 4.6 (Adaptive Medium)",
        provider: "anthropic",
        model: "claude-opus-4-6",
        baseModelId: "claude-opus-4-6",
        thinkingMode: "adaptive",
        thinkingParameter: "medium",
        supportsAdaptiveThinking: true,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 128000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 8000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review", "analytical"],
    },
    {
        id: "claude-opus-4-6:adaptive:low",
        name: "Claude Opus 4.6 (Adaptive Low)",
        provider: "anthropic",
        model: "claude-opus-4-6",
        baseModelId: "claude-opus-4-6",
        thinkingMode: "adaptive",
        thinkingParameter: "low",
        supportsAdaptiveThinking: true,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 128000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 5000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "routine", "analytical"],
    },
    {
        id: "claude-sonnet-4-6:adaptive:high",
        name: "Claude Sonnet 4.6 (Adaptive High)",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        baseModelId: "claude-sonnet-4-6",
        thinkingMode: "adaptive",
        thinkingParameter: "high",
        supportsAdaptiveThinking: true,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        avgLatencyMs: 8000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review", "analytical"],
    },
    {
        id: "claude-sonnet-4-6:adaptive:medium",
        name: "Claude Sonnet 4.6 (Adaptive Medium)",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        baseModelId: "claude-sonnet-4-6",
        thinkingMode: "adaptive",
        thinkingParameter: "medium",
        supportsAdaptiveThinking: true,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        avgLatencyMs: 5000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review", "generative"],
    },
    {
        id: "claude-sonnet-4-6:adaptive:low",
        name: "Claude Sonnet 4.6 (Adaptive Low)",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        baseModelId: "claude-sonnet-4-6",
        thinkingMode: "adaptive",
        thinkingParameter: "low",
        supportsAdaptiveThinking: true,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        avgLatencyMs: 3000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "generative", "routine"],
    },
    {
        id: "claude-opus-4-5:extended:32k",
        name: "Claude Opus 4.5 (Extended 32k)",
        provider: "anthropic",
        model: "claude-opus-4-5",
        baseModelId: "claude-opus-4-5",
        thinkingMode: "extended",
        thinkingParameter: "32k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 20000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review", "planning", "strategic"],
    },
    {
        id: "claude-opus-4-5:extended:16k",
        name: "Claude Opus 4.5 (Extended 16k)",
        provider: "anthropic",
        model: "claude-opus-4-5",
        baseModelId: "claude-opus-4-5",
        thinkingMode: "extended",
        thinkingParameter: "16k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 15000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review", "analytical"],
    },
    {
        id: "claude-opus-4-5:extended:8k",
        name: "Claude Opus 4.5 (Extended 8k)",
        provider: "anthropic",
        model: "claude-opus-4-5",
        baseModelId: "claude-opus-4-5",
        thinkingMode: "extended",
        thinkingParameter: "8k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 10000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "analytical"],
    },
    {
        id: "claude-sonnet-4-5:extended:16k",
        name: "Claude Sonnet 4.5 (Extended 16k)",
        provider: "anthropic",
        model: "claude-sonnet-4-5",
        baseModelId: "claude-sonnet-4-5",
        thinkingMode: "extended",
        thinkingParameter: "16k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        avgLatencyMs: 10000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review", "analytical"],
    },
    {
        id: "claude-sonnet-4-5:extended:8k",
        name: "Claude Sonnet 4.5 (Extended 8k)",
        provider: "anthropic",
        model: "claude-sonnet-4-5",
        baseModelId: "claude-sonnet-4-5",
        thinkingMode: "extended",
        thinkingParameter: "8k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        avgLatencyMs: 7000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "generative"],
    },
    {
        id: "claude-haiku-4-5:extended:8k",
        name: "Claude Haiku 4.5 (Extended 8k)",
        provider: "anthropic",
        model: "claude-haiku-4-5-20251001",
        baseModelId: "claude-haiku-4-5",
        thinkingMode: "extended",
        thinkingParameter: "8k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: false,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: false,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.0008,
        costPer1kOutput: 0.004,
        avgLatencyMs: 4000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "routine"],
    },
    {
        id: "claude-haiku-4-5:extended:4k",
        name: "Claude Haiku 4.5 (Extended 4k)",
        provider: "anthropic",
        model: "claude-haiku-4-5-20251001",
        baseModelId: "claude-haiku-4-5",
        thinkingMode: "extended",
        thinkingParameter: "4k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: false,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: false,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.0008,
        costPer1kOutput: 0.004,
        avgLatencyMs: 3000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "routine"],
    },
    {
        id: "claude-haiku-4-5:none",
        name: "Claude Haiku 4.5 (Raw Speed)",
        provider: "anthropic",
        model: "claude-haiku-4-5-20251001",
        baseModelId: "claude-haiku-4-5",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: false,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: false,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.0008,
        costPer1kOutput: 0.004,
        avgLatencyMs: 1500,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["routine", "fast_commands"],
    },
    // claude-opus-4-1 seed removed in M-9.VA-FIX — model ID was 404 in production.
    // Thompson posteriors for this arm will age out naturally.
    {
        id: "claude-opus-4:extended:16k",
        name: "Claude Opus 4 (Extended 16k)",
        provider: "anthropic",
        model: "claude-opus-4-20250514",
        baseModelId: "claude-opus-4",
        thinkingMode: "extended",
        thinkingParameter: "16k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        avgLatencyMs: 15000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "review"],
    },
    {
        id: "claude-sonnet-4:extended:8k",
        name: "Claude Sonnet 4 (Extended 8k)",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        baseModelId: "claude-sonnet-4",
        thinkingMode: "extended",
        thinkingParameter: "8k",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        avgLatencyMs: 6000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "generative"],
    },
    {
        id: "claude-sonnet-4:none",
        name: "Claude Sonnet 4 (Raw)",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        baseModelId: "claude-sonnet-4",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: true,
        supportsInterleavedThinking: true,
        supportsPrefilling: true,
        supportsStructuredOutputs: true,
        supportsWebSearch: true,
        supportsComputerUse: true,
        maxContextWindow: 200000,
        maxOutputTokens: 64000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        avgLatencyMs: 3000,
        status: "active",
        region: "direct",
        endpoint: "messages",
        capabilities: ["code_generation", "routine"],
    },
    {
        id: "gemini-2.5-flash:default",
        name: "Gemini 2.5 Flash",
        provider: "vertex-ai",
        model: "gemini-2.5-flash",
        baseModelId: "gemini-2.5-flash",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 65536,
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        avgLatencyMs: 2000,
        status: "active",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["code_generation", "routine", "fast_commands"],
    },
    {
        id: "gemini-2.5-pro:default",
        name: "Gemini 2.5 Pro",
        provider: "vertex-ai",
        model: "gemini-2.5-pro",
        baseModelId: "gemini-2.5-pro",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 65536,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.01,
        avgLatencyMs: 8000,
        status: "active",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["code_generation", "review", "analytical"],
    },
    {
        id: "gemini-2.0-flash:default",
        name: "Gemini 2.0 Flash",
        provider: "vertex-ai",
        model: "gemini-2.0-flash",
        baseModelId: "gemini-2.0-flash",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 8192,
        costPer1kInput: 0.0001,
        costPer1kOutput: 0.0004,
        avgLatencyMs: 1500,
        status: "active",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["routine", "fast_commands"],
    },
    {
        id: "gemini-2.0-flash-lite:default",
        name: "Gemini 2.0 Flash Lite",
        provider: "vertex-ai",
        model: "gemini-2.0-flash-lite",
        baseModelId: "gemini-2.0-flash-lite",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 8192,
        costPer1kInput: 0.000075,
        costPer1kOutput: 0.0003,
        avgLatencyMs: 1000,
        status: "active",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["routine", "fast_commands"],
    },
    {
        id: "gemini-1.5-flash:default",
        name: "Gemini 1.5 Flash (Retired)",
        provider: "vertex-ai",
        model: "gemini-1.5-flash",
        baseModelId: "gemini-1.5-flash",
        thinkingMode: "default",
        maxContextWindow: 1048576,
        maxOutputTokens: 8192,
        costPer1kInput: 0.000075,
        costPer1kOutput: 0.0003,
        avgLatencyMs: 1200,
        status: "retired",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["routine"],
    },
    {
        id: "gemini-1.5-pro:default",
        name: "Gemini 1.5 Pro (Retired)",
        provider: "vertex-ai",
        model: "gemini-1.5-pro",
        baseModelId: "gemini-1.5-pro",
        thinkingMode: "default",
        maxContextWindow: 2097152,
        maxOutputTokens: 8192,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.005,
        avgLatencyMs: 6000,
        status: "retired",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["code_generation", "analytical"],
    },
    {
        id: "gemini-2.5-flash-preview-04-17:default",
        name: "Gemini 2.5 Flash Preview (Retired)",
        provider: "vertex-ai",
        model: "gemini-2.5-flash-preview-04-17",
        baseModelId: "gemini-2.5-flash-preview",
        thinkingMode: "default",
        maxContextWindow: 1048576,
        maxOutputTokens: 65536,
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        avgLatencyMs: 2000,
        status: "retired",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["code_generation", "routine"],
    },
    {
        id: "gemini-3-pro-preview:default",
        name: "Gemini 3 Pro Preview", // Deprecating March 9-26 2026, migrate to 3.1
        provider: "vertex-ai",
        model: "gemini-3-pro-preview",
        baseModelId: "gemini-3-pro-preview",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 65536,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.01,
        avgLatencyMs: 10000,
        status: "active",
        region: "global",
        endpoint: "generateContent",
        capabilities: ["code_generation", "review", "analytical"],
    },
    {
        id: "gemini-3-flash-preview:default",
        name: "Gemini 3 Flash Preview",
        provider: "vertex-ai",
        model: "gemini-3-flash-preview",
        baseModelId: "gemini-3-flash-preview",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 65536,
        costPer1kInput: 0.0002,
        costPer1kOutput: 0.0008,
        avgLatencyMs: 2500,
        status: "active",
        region: "global",
        endpoint: "generateContent",
        capabilities: ["code_generation", "routine", "fast_commands"],
    },
    {
        id: "gemini-3.1-pro-preview:default",
        name: "Gemini 3.1 Pro Preview",
        provider: "vertex-ai",
        model: "gemini-3.1-pro-preview",
        baseModelId: "gemini-3.1-pro-preview",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 65536,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.01,
        avgLatencyMs: 11000,
        status: "active",
        region: "global",
        endpoint: "generateContent",
        capabilities: ["code_generation", "review", "analytical", "planning"],
    },
    {
        id: "gemini-2.5-flash-lite:default",
        name: "Gemini 2.5 Flash Lite",
        provider: "vertex-ai",
        model: "gemini-2.5-flash-lite",
        baseModelId: "gemini-2.5-flash-lite",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 1048576,
        maxOutputTokens: 32768,
        costPer1kInput: 0.0001,
        costPer1kOutput: 0.0004,
        avgLatencyMs: 1500,
        status: "active",
        region: "us-central1",
        endpoint: "generateContent",
        capabilities: ["routine", "fast_commands"],
    },
    {
        id: "mistral-medium-3:default",
        name: "Mistral Medium 3",
        provider: "vertex-ai",
        model: "mistral-medium-3",
        baseModelId: "mistral-medium-3",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 131072,
        maxOutputTokens: 8192,
        costPer1kInput: 0.002,
        costPer1kOutput: 0.006,
        avgLatencyMs: 3000,
        status: "active",
        region: "europe-west4",
        endpoint: "rawPredict",
        capabilities: ["code_generation", "generative"],
    },
    {
        id: "mistral-large-3:default",
        name: "Mistral Large 3",
        provider: "vertex-ai",
        model: "mistral-large-3",
        baseModelId: "mistral-large-3",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 131072,
        maxOutputTokens: 8192,
        costPer1kInput: 0.004,
        costPer1kOutput: 0.012,
        avgLatencyMs: 4500,
        status: "active",
        region: "europe-west4",
        endpoint: "rawPredict",
        capabilities: ["code_generation", "review", "analytical"],
    },
    {
        id: "mistral-small-2503:default",
        name: "Mistral Small",
        provider: "vertex-ai",
        model: "mistral-small-2503",
        baseModelId: "mistral-small",
        thinkingMode: "default",
        maxContextWindow: 131072,
        maxOutputTokens: 8192,
        costPer1kInput: 0.001,
        costPer1kOutput: 0.003,
        avgLatencyMs: 2000,
        status: "active",
        region: "europe-west4",
        endpoint: "rawPredict",
        capabilities: ["routine", "generative"],
    },
    {
        id: "codestral-2:default",
        name: "Codestral 2",
        provider: "vertex-ai",
        model: "codestral-2",
        baseModelId: "codestral-2",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 262144,
        maxOutputTokens: 8192,
        costPer1kInput: 0.0003,
        costPer1kOutput: 0.0009,
        avgLatencyMs: 2500,
        status: "active",
        region: "europe-west4",
        endpoint: "rawPredict",
        capabilities: ["code_generation", "routine"],
    },
    // ══════════════════════════════════════
    // VERTEX AI — OpenAI (Open-Weight)
    // ══════════════════════════════════════
    {
        id: "gpt-oss-120b:default",
        name: "GPT-OSS 120B",
        provider: "vertex-ai",
        model: "gpt-oss-120b-maas@001",
        baseModelId: "gpt-oss-120b",
        thinkingMode: "default",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        maxContextWindow: 131072,
        maxOutputTokens: 16384,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.012,
        avgLatencyMs: 5000,
        status: "active",
        region: "us-central1",
        endpoint: "rawPredict",
        capabilities: ["code_generation", "analytical", "generative"],
    },
    // ══════════════════════════════════════
    // VERTEX AI — Document Processing
    // ══════════════════════════════════════
    {
        id: "pretrained-ocr-v1:default",
        name: "Pretrained OCR v1",
        provider: "vertex-ai",
        model: "pretrained-ocr@001",
        baseModelId: "pretrained-ocr-v1",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["ocr", "document_processing"],
    },
    {
        id: "pretrained-ocr-v2:default",
        name: "Pretrained OCR v2",
        provider: "vertex-ai",
        model: "pretrained-ocr@002",
        baseModelId: "pretrained-ocr-v2",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["ocr", "document_processing"],
    },
    {
        id: "imagetext-v1:default",
        name: "ImageText v1",
        provider: "vertex-ai",
        model: "imagetext@001",
        baseModelId: "imagetext-v1",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["image_captioning", "visual_qa"],
    },
    {
        id: "imagetext-v2:default",
        name: "ImageText v2",
        provider: "vertex-ai",
        model: "imagetext@002",
        baseModelId: "imagetext-v2",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["image_captioning", "visual_qa"],
    },
    {
        id: "form-parser-v1:default",
        name: "Form Parser v1",
        provider: "vertex-ai",
        model: "pretrained-form-parser@001",
        baseModelId: "form-parser-v1",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: true,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["document_processing", "form_extraction"],
    },
    {
        id: "translate-llm:default",
        name: "Translate LLM",
        provider: "vertex-ai",
        model: "translate-llm",
        baseModelId: "translate-llm",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["translation"],
    },
    // ══════════════════════════════════════
    // VERTEX AI — Speech & Audio
    // ══════════════════════════════════════
    {
        id: "chirp-2:default",
        name: "Chirp 2",
        provider: "vertex-ai",
        model: "chirp-2@001",
        baseModelId: "chirp-2",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["speech_to_text"],
    },
    {
        id: "lyria-002:default",
        name: "Lyria 002",
        provider: "vertex-ai",
        model: "lyria-002",
        baseModelId: "lyria-002",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["audio_generation"],
    },
    {
        id: "video-speech-transcription:default",
        name: "Video Speech Transcription",
        provider: "vertex-ai",
        model: "video-speech-transcription@001",
        baseModelId: "video-speech-transcription",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["speech_to_text", "transcription"],
    },
    // ══════════════════════════════════════
    // VERTEX AI — Image Generation
    // ══════════════════════════════════════
    {
        id: "imagen-4.0:default",
        name: "Imagen 4.0",
        provider: "vertex-ai",
        model: "imagen-4.0-generate-001",
        baseModelId: "imagen-4.0",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["image_generation"],
    },
    {
        id: "imagen-4.0-fast:default",
        name: "Imagen 4.0 Fast",
        provider: "vertex-ai",
        model: "imagen-4.0-fast-generate-001",
        baseModelId: "imagen-4.0-fast",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["image_generation"],
    },
    {
        id: "imagen-4.0-ultra:default",
        name: "Imagen 4.0 Ultra",
        provider: "vertex-ai",
        model: "imagen-4.0-ultra-generate-001",
        baseModelId: "imagen-4.0-ultra",
        thinkingMode: "none",
        supportsAdaptiveThinking: false,
        supportsExtendedThinking: false,
        supportsInterleavedThinking: false,
        supportsPrefilling: false,
        supportsStructuredOutputs: false,
        status: "active",
        region: "us-central1",
        endpoint: "predict", // TODO(M-8.INT): verify endpoint format and wire executor
        capabilities: ["image_generation"],
    },
    {
        id: "claude-3-haiku:none",
        name: "Claude 3 Haiku (Retired)",
        provider: "anthropic",
        model: "claude-3-haiku-20240307",
        baseModelId: "claude-3-haiku",
        thinkingMode: "none",
        status: "retired",
        region: "direct",
        endpoint: "messages",
        capabilities: [],
    },
    {
        id: "claude-3-5-haiku:none",
        name: "Claude 3.5 Haiku (Retired)",
        provider: "anthropic",
        model: "claude-3-5-haiku-20241022",
        baseModelId: "claude-3-5-haiku",
        thinkingMode: "none",
        status: "retired",
        region: "direct",
        endpoint: "messages",
        capabilities: [],
    },
    {
        id: "claude-3-7-sonnet:extended:16k",
        name: "Claude 3.7 Sonnet (Retired)",
        provider: "anthropic",
        model: "claude-3-7-sonnet-20250219",
        baseModelId: "claude-3-7-sonnet",
        thinkingMode: "extended",
        thinkingParameter: "16k",
        status: "retired",
        region: "direct",
        endpoint: "messages",
        capabilities: [],
    },
    {
        id: "claude-3-opus:none",
        name: "Claude 3 Opus (Retired)",
        provider: "anthropic",
        model: "claude-3-opus-20240229",
        baseModelId: "claude-3-opus",
        thinkingMode: "none",
        status: "retired",
        region: "direct",
        endpoint: "messages",
        capabilities: [],
    },
];
export async function bootstrapSeeds(force = false) {
    if (!force) {
        const existing = await listActiveSeeds();
        if (existing.length >= 20) {
            console.log(`Graph already has ${existing.length} active seeds. Use force=true to re-seed.`);
            return existing.length;
        }
    }
    if (force) {
        // Remove stale Seed nodes not in current ALL_ARMS
        const knownIds = ALL_ARMS.map((a) => a.id);
        const result = await runQuery(`MATCH (s:Seed) WHERE NOT s.id IN $ids DETACH DELETE s RETURN count(s) AS removed`, { ids: knownIds });
        const removed = result.records[0]?.get("removed")?.toNumber?.() ?? 0;
        if (removed > 0) {
            console.log(`Cleaned up ${removed} stale Seed nodes.`);
        }
    }
    console.log(`Seeding ${ALL_ARMS.length} seed configurations...`);
    let seeded = 0;
    for (const arm of ALL_ARMS) {
        try {
            await createSeed(arm);
            seeded++;
            console.log(`  ✅ ${arm.id} (${arm.status})`);
        }
        catch (err) {
            console.error(`  ❌ ${arm.id}: ${err instanceof Error ? err.message : err}`);
        }
    }
    console.log(`\nSeeded ${seeded}/${ALL_ARMS.length} seeds.`);
    return seeded;
}
export const CORE_BLOOMS = [
    {
        id: "thompson-router",
        name: "Thompson Router",
        type: "pattern",
        status: "active",
        description: "Bayesian model selection via Thompson Sampling",
        morphemeKinds: ["resonator"],
        domain: "core",
    },
    {
        id: "dev-agent",
        name: "DevAgent Pipeline",
        type: "pattern",
        status: "active",
        description: "4-stage coding pipeline with refinement helix",
        morphemeKinds: ["bloom", "helix"],
        domain: "core",
    },
    {
        id: "architect",
        name: "Architect Pipeline",
        type: "pattern",
        status: "active",
        description: "7-stage intent-to-execution planning",
        morphemeKinds: ["bloom"],
        domain: "core",
    },
];
export async function bootstrapBlooms(force = false) {
    if (!force) {
        const result = await runQuery("MATCH (b:Bloom) RETURN count(b) AS count", {}, "READ");
        const existing = result.records[0]?.get("count") ?? 0;
        if (existing >= CORE_BLOOMS.length) {
            console.log(`Graph already has ${existing} blooms. Use force=true to re-seed.`);
            return existing;
        }
    }
    console.log(`Seeding ${CORE_BLOOMS.length} core blooms...`);
    let seeded = 0;
    for (const bloom of CORE_BLOOMS) {
        try {
            await createBloom(bloom);
            seeded++;
            console.log(`  ✅ ${bloom.id} (${bloom.status})`);
        }
        catch (err) {
            console.error(`  ❌ ${bloom.id}: ${err instanceof Error ? err.message : err}`);
        }
    }
    console.log(`\nSeeded ${seeded}/${CORE_BLOOMS.length} blooms.`);
    return seeded;
}
export async function seedInformedPriors() {
    const taskCategories = ["strategic", "analytical", "generative", "routine"];
    let created = 0;
    // Clear old bootstrap decisions (idempotent re-seeding)
    await runQuery(`MATCH (d:Decision) WHERE d.id STARTS WITH 'bootstrap_' DETACH DELETE d`);
    for (const arm of ALL_ARMS) {
        if (arm.status === "retired")
            continue;
        for (const taskType of taskCategories) {
            const hasCapability = arm.capabilities?.includes(taskType) ?? false;
            const isExpensive = (arm.costPer1kOutput ?? 0) > 0.01;
            let syntheticSuccessRate;
            if (taskType === "strategic") {
                syntheticSuccessRate = hasCapability ? 0.8 : 0.3;
            }
            else if (taskType === "routine") {
                syntheticSuccessRate =
                    !isExpensive && (arm.avgLatencyMs ?? 5000) < 5000 ? 0.8 : 0.4;
            }
            else {
                syntheticSuccessRate = hasCapability ? 0.6 : 0.4;
            }
            const successes = Math.round(syntheticSuccessRate * 5);
            const failures = 5 - successes;
            const clusterId = `${taskType}:moderate:general`;
            await ensureContextCluster({
                id: clusterId,
                taskType,
                complexity: "moderate",
            });
            for (let i = 0; i < successes + failures; i++) {
                const isSuccess = i < successes;
                const decId = `bootstrap_${arm.id}_${taskType}_${i}`;
                await recordDecision({
                    id: decId,
                    taskType,
                    complexity: "moderate",
                    selectedSeedId: arm.id,
                    wasExploratory: false,
                    contextClusterId: clusterId,
                });
                await recordDecisionOutcome({
                    decisionId: decId,
                    success: isSuccess,
                    qualityScore: isSuccess
                        ? 0.7 + Math.random() * 0.2
                        : 0.2 + Math.random() * 0.3,
                    durationMs: arm.avgLatencyMs ?? 5000,
                    cost: (arm.costPer1kOutput ?? 0.01) * 2,
                });
            }
            created += 5;
        }
    }
    console.log(`Seeded ${created} synthetic prior decisions.`);
    return created;
}
/**
 * Seed strong informed priors for the analytical context cluster.
 *
 * Target: Opus 4.6 arms dominate analytical task selection (~70-80%),
 * Opus 4.5 arms fill ~15-20%, everything else ~2-5% combined.
 *
 * Uses synthetic Decision nodes with IDs prefixed "analytical_prior_"
 * to distinguish from baseline bootstrap decisions. Idempotent: clears
 * old analytical_prior_ decisions before reseeding.
 */
export async function seedAnalyticalPriors() {
    const ANALYTICAL_PRIORS = [
        { armPattern: /^claude-opus-4-6:/i, alpha: 12, beta: 1 },
        { armPattern: /^claude-opus-4-5:/i, alpha: 8, beta: 1 },
        { armPattern: /^claude-sonnet-4-6:/i, alpha: 2, beta: 3 },
        { armPattern: /^claude-sonnet-4-5:|^claude-sonnet-4:/i, alpha: 1, beta: 4 },
        { armPattern: /haiku/i, alpha: 1, beta: 6 },
        { armPattern: /gemini/i, alpha: 1, beta: 5 },
        { armPattern: /mistral|codestral/i, alpha: 1, beta: 6 },
        { armPattern: /^claude-opus-4:/i, alpha: 4, beta: 2 },
    ];
    const ANALYTICAL_COMPLEXITIES = ["trivial", "moderate", "complex", "critical"];
    // Clear old analytical_prior_ decisions
    await runQuery(`MATCH (d:Decision) WHERE d.id STARTS WITH 'analytical_prior_' DETACH DELETE d`);
    let created = 0;
    for (const arm of ALL_ARMS) {
        if (arm.status === "retired")
            continue;
        // Find matching prior config
        const config = ANALYTICAL_PRIORS.find((p) => p.armPattern.test(arm.id));
        if (!config)
            continue; // No prior config for this arm pattern
        const successes = config.alpha - 1; // α = successes + 1 (from getArmStatsForCluster)
        const failures = config.beta - 1; // β = failures + 1
        for (const complexity of ANALYTICAL_COMPLEXITIES) {
            const clusterId = `analytical:${complexity}:general`;
            await ensureContextCluster({
                id: clusterId,
                taskType: "analytical",
                complexity,
            });
            for (let i = 0; i < successes + failures; i++) {
                const isSuccess = i < successes;
                const decId = `analytical_prior_${arm.id}_${complexity}_${i}`;
                await recordDecision({
                    id: decId,
                    taskType: "analytical",
                    complexity,
                    selectedSeedId: arm.id,
                    wasExploratory: false,
                    contextClusterId: clusterId,
                });
                await recordDecisionOutcome({
                    decisionId: decId,
                    success: isSuccess,
                    qualityScore: isSuccess
                        ? 0.8 + Math.random() * 0.15
                        : 0.15 + Math.random() * 0.2,
                    durationMs: arm.avgLatencyMs ?? 5000,
                    cost: (arm.costPer1kOutput ?? 0.01) * 2,
                });
            }
            created += successes + failures;
        }
    }
    console.log(`Seeded ${created} analytical prior decisions.`);
    return created;
}
async function main() {
    console.log("🌱 Codex Signum — Seed Bootstrap\n");
    const force = process.argv.includes("--force");
    try {
        const schema = await migrateSchema();
        if (schema.errors.length > 0) {
            throw new Error(`Schema migration errors: ${schema.errors.join(" | ")}`);
        }
        console.log(`Applied schema statements: ${schema.applied}`);
        const seededRules = await seedConstitutionalRules();
        console.log(`Seeded constitutional rules: ${seededRules}`);
        await bootstrapSeeds(force);
        await bootstrapBlooms(force);
        if (force ||
            (await getDecisionsForCluster("strategic:moderate:general", 1)).length ===
                0) {
            await seedInformedPriors();
        }
    }
    catch (err) {
        console.error("Bootstrap failed:", err);
        process.exit(1);
    }
    finally {
        await closeDriver();
    }
}
const invokedPath = process.argv[1];
const isDirectRun = invokedPath
    ? import.meta.url === pathToFileURL(invokedPath).href
    : false;
if (isDirectRun) {
    void main();
}
// ── Backward Compatibility Aliases (deprecated) ──
/** @deprecated Use bootstrapSeeds */
export const bootstrapAgents = bootstrapSeeds;
/** @deprecated Use bootstrapBlooms */
export const bootstrapPatterns = bootstrapBlooms;
/** @deprecated Use CORE_BLOOMS */
export const CORE_PATTERNS = CORE_BLOOMS;
//# sourceMappingURL=bootstrap.js.map